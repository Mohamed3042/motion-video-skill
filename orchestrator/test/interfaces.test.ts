// Interfaces against the fake orchestrator: HTTP API (+ SSE, auth, file serving), MCP over stdio, CLI, dashboard files.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile, spawn, spawnSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {request} from 'node:http';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {promisify} from 'node:util';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {OPS} from '../src/api/ops.ts';
import {serve} from '../src/dashboard/server.ts';
import {createFakeOrchestrator} from './fake-orchestrator.ts';
import {defaultConfig, saveConfig} from '../src/config.ts';
import {createOrchestrator} from '../src/pipeline/orchestrator.ts';

const ROOT = join(import.meta.dirname, '..');
const BIN = join(ROOT, 'bin', 'mvo.ts');
const TMP = mkdtempSync(join(tmpdir(), 'mvo-interfaces-'));
const ENV = {...process.env, MVO_FAKE: '1', MVO_FAKE_DIR: TMP, MVO_FAKE_TICK: '20', MVO_TOKEN: ''} as Record<string, string>;
process.on('exit', () => rmSync(TMP, {recursive: true, force: true}));

const NAMES = OPS.map((o) => o.name).sort();

async function startApi(token = '') {
  const {server, url} = await serve(createFakeOrchestrator({dir: TMP, tickMs: 20}), {port: 0, token, fileRoots: [TMP]});
  const post = async (op: string, body: unknown, headers: Record<string, string> = {}) => {
    const r = await fetch(`${url}/api/${op}`, {method: 'POST', headers: {'content-type': 'application/json', ...headers}, body: typeof body === 'string' ? body : JSON.stringify(body)});
    return {status: r.status, body: (await r.json()) as any};
  };
  const stop = () => {
    server.closeAllConnections();
    server.close();
  };
  return {server, url, post, stop};
}

/** Raw request (lets us set Host, which fetch forbids). */
function raw(url: string, path: string, headers: Record<string, string>): Promise<number> {
  return new Promise((ok, fail) => {
    const req = request(new URL(path, url), {headers}, (res) => {
      res.resume();
      ok(res.statusCode ?? 0);
    });
    req.on('error', fail);
    req.end();
  });
}

test('HTTP API: discovery, every op, SSE, files, guards', async (t) => {
  const {url, post, stop} = await startApi();
  t.after(stop);

  // discovery
  const ops = (await (await fetch(`${url}/api/ops`)).json()) as any[];
  assert.deepEqual(ops.map((o) => o.name).sort(), NAMES);
  for (const o of ops) {
    assert.ok(o.description.length > 40, `${o.name} has a real description`);
    assert.equal(o.input.type, 'object');
  }
  assert.deepEqual(ops.find((o) => o.name === 'plan_video').input.required.sort(), ['idea', 'seconds']);
  assert.match(ops.find((o) => o.name === 'claim_job').description, /submit_job/);

  // config + roles
  const cfg = await post('get_config', {});
  assert.equal(cfg.status, 200);
  assert.ok(cfg.body.roles.builder && Array.isArray(cfg.body.problems));
  const models = await post('list_models', {connection: 'deepseek'});
  assert.ok(models.body.includes('deepseek-flash'));
  const badConn = await post('list_models', {connection: 'nope'});
  assert.equal(badConn.status, 500);
  assert.match(badConn.body.error, /Unknown connection/);
  assert.equal((await post('set_roles', {preset: 'free'})).body.roles.builder, 'gemini-free/gemini-3.6-flash');
  const set = await post('set_roles', {roles: {director: 'deepseek/deepseek-flash', builder: 'host'}, budgetUSD: 3});
  assert.equal(set.body.roles.builder, 'host');
  assert.equal(set.body.budgetUSD, 3);
  assert.equal((await post('estimate_cost', {seconds: 30})).body.roles.length, 4);
  assert.equal((await post('estimate_cost', {})).status, 400);

  // planning
  const bad = await post('plan_video', {seconds: 20});
  assert.equal(bad.status, 400);
  assert.match(bad.body.error, /idea/);
  const plan = await post('plan_video', {idea: 'HTTP test promo', seconds: 24, format: '9:16'});
  assert.equal(plan.status, 200);
  const runId = plan.body.id;
  assert.equal(plan.body.status, 'awaiting-approval');
  assert.equal(plan.body.plan.format, '9:16');
  assert.equal(typeof (await post('estimate_cost', {runId})).body.totalMinutes, 'number');

  // a "host" director gets its task back, then passes its own plan
  await post('set_roles', {roles: {director: 'host'}});
  const task = await post('plan_video', {idea: 'host directed', seconds: 24});
  assert.equal(task.status, 500);
  assert.match(task.body.error, /director role is "host"/);
  const own = await post('plan_video', {idea: 'host directed', seconds: 24, plan: plan.body.plan});
  assert.equal(own.body.plan.slug, plan.body.plan.slug);
  assert.equal((await post('start_run', {runId: own.body.id})).body.status, 'building');
  assert.equal((await post('cancel_run', {runId: own.body.id})).body.status, 'cancelled');

  // SSE: subscribe before anything happens on the run
  const ac = new AbortController();
  const sse = await fetch(`${url}/api/events?run=${runId}`, {signal: ac.signal});
  assert.equal(sse.headers.get('content-type'), 'text/event-stream');
  let events = '';
  const reading = (async () => {
    const dec = new TextDecoder();
    try {
      for await (const chunk of sse.body as unknown as AsyncIterable<Uint8Array>) events += dec.decode(chunk);
    } catch {}
  })();
  t.after(() => ac.abort());

  // run + host-worker protocol
  assert.equal((await post('approve', {runId, what: 'final'})).status, 500, 'nothing waits for final approval yet');
  assert.equal((await post('approve', {runId, what: 'plan'})).body.status, 'building', 'approving the plan starts the build');
  assert.match((await post('start_run', {runId})).body.error, /building/, 'a started run cannot start again');
  const st = await post('run_status', {runId});
  assert.equal(st.body.config, undefined, 'run_status is slim');
  assert.equal(st.body.budgetUSD, 3);
  assert.ok(st.body.jobs.every((j: any) => j.status === 'waiting-host' && j.prompt === undefined && j.promptChars > 0));
  const job = (await post('claim_job', {runId, worker: 'w1'})).body;
  assert.equal(job.claimedBy, 'w1');
  assert.match(job.prompt, /Build/);
  assert.ok(job.allow.length > 0);
  const gates = (await post('run_gates', {jobId: job.id})).body;
  assert.ok(gates.some((g: any) => g.gate === 'typecheck'));
  assert.equal((await post('submit_job', {jobId: job.id, note: 'done'})).body.status, 'accepted');
  const stills = (await post('get_stills', {jobId: job.id})).body.stills as string[];
  assert.equal(stills.length, 3);
  assert.ok((await post('list_runs', {})).body.some((r: any) => r.id === runId));

  // file serving
  const img = await fetch(`${url}/api/file?path=${encodeURIComponent(stills[0])}`);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/png');
  assert.equal(Buffer.from(await img.arrayBuffer()).subarray(1, 4).toString(), 'PNG');
  writeFileSync(join(TMP, 'clip.mp4'), Buffer.alloc(1000, 7));
  const clip = encodeURIComponent(join(TMP, 'clip.mp4'));
  const part = await fetch(`${url}/api/file?path=${clip}`, {headers: {range: 'bytes=100-199'}});
  assert.equal(part.status, 206);
  assert.equal(part.headers.get('content-range'), 'bytes 100-199/1000');
  assert.equal(part.headers.get('content-type'), 'video/mp4');
  assert.equal((await part.arrayBuffer()).byteLength, 100);
  const tail = await fetch(`${url}/api/file?path=${clip}`, {headers: {range: 'bytes=-10'}});
  assert.equal(tail.headers.get('content-range'), 'bytes 990-999/1000');
  await tail.arrayBuffer();
  assert.equal((await fetch(`${url}/api/file?path=${encodeURIComponent(join(stills[0], '..'))}`)).status, 404, 'directories are not served');
  for (const p of [join(TMP, '..', '..', 'Windows', 'win.ini'), '../package.json', join(ROOT, 'package.json'), `${TMP}/../${TMP.split(/[\\/]/).pop()}/../x`, '/etc/passwd', '\\\\evil.invalid\\share\\x.png']) {
    const r = await fetch(`${url}/api/file?path=${encodeURIComponent(p)}`);
    assert.equal(r.status, 403, `blocked: ${p}`);
  }
  assert.equal((await fetch(`${url}/api/file?path=..%2F..%2Fpackage.json`)).status, 403);

  // SSE delivered events from the claim/submit above
  await new Promise((r) => setTimeout(r, 100));
  assert.match(events, /data: .*claimed by w1/);
  assert.match(events, /"type":"gate"/);

  assert.equal((await post('cancel_run', {runId})).body.status, 'cancelled');

  // errors and guards
  assert.equal((await post('nope', {})).status, 404);
  assert.equal((await post('run_status', 'not json')).status, 400);
  assert.equal((await post('run_status', {runId: 'missing'})).status, 500);
  assert.equal(await raw(url, '/api/ops', {host: 'evil.example'}), 403, 'DNS-rebinding guard');
  assert.equal((await post('list_runs', {}, {origin: 'http://evil.example'})).status, 403, 'cross-origin POST refused');
  assert.equal((await post('list_runs', {}, {origin: url})).status, 200, 'same-origin POST allowed');

  // dashboard shell
  const page = await fetch(`${url}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<script src="app\.js">/);
  for (const f of ['/app.js', '/style.css']) assert.equal((await fetch(url + f)).status, 200);
  assert.equal((await fetch(`${url}/secret.txt`)).status, 404);
  ac.abort();
  await reading;
});

test('HTTP API: bearer token', async (t) => {
  const {url, post, stop} = await startApi('s3cret-token');
  t.after(stop);
  assert.equal((await fetch(`${url}/api/ops`)).status, 401);
  assert.equal((await fetch(`${url}/api/ops`, {headers: {authorization: 'Bearer wrong'}})).status, 401);
  assert.equal((await fetch(`${url}/api/ops`, {headers: {authorization: 'Bearer s3cret-token'}})).status, 200);
  assert.equal((await fetch(`${url}/api/ops`, {headers: {cookie: 'mvo_token=s3cret-token'}})).status, 200);
  assert.equal((await post('list_runs', {})).status, 401);
  assert.equal((await post('list_runs', {}, {authorization: 'Bearer s3cret-token'})).status, 200);
  assert.equal((await fetch(`${url}/`)).status, 200, 'UI shell loads, then asks for the token');
  await assert.rejects(serve(createFakeOrchestrator({dir: TMP}), {host: '0.0.0.0', port: 0, token: ''}), /Refusing to listen/);
});

test('MCP over stdio: tools, calls, image content, errors', async (t) => {
  const client = new Client({name: 'interfaces-test', version: '1.0.0'});
  await client.connect(new StdioClientTransport({command: process.execPath, args: [BIN, 'mcp'], env: ENV, stderr: 'pipe'}));
  t.after(() => client.close());

  const {tools} = await client.listTools();
  assert.deepEqual(tools.map((x) => x.name).sort(), NAMES);
  assert.ok(tools.every((x) => (x.description ?? '').length > 40 && x.inputSchema.type === 'object'));

  const call = async (name: string, args: Record<string, unknown>) => (await client.callTool({name, arguments: args})) as any;
  const json = (r: any) => JSON.parse(r.content[0].text);

  assert.equal(json(await call('set_roles', {roles: {builder: 'host'}})).roles.builder, 'host');
  const run = json(await call('plan_video', {idea: 'MCP test reel', seconds: 16}));
  assert.equal(run.status, 'awaiting-approval');
  assert.equal(json(await call('run_status', {runId: run.id})).status, 'awaiting-approval');
  assert.equal(json(await call('approve', {runId: run.id, what: 'plan'})).status, 'building');
  const job = json(await call('claim_job', {runId: run.id, worker: 'mcp-worker'}));
  assert.equal(json(await call('submit_job', {jobId: job.id})).status, 'accepted');

  const stills = await call('get_stills', {jobId: job.id});
  assert.equal(json(stills).stills.length, 3);
  const images = stills.content.filter((c: any) => c.type === 'image');
  assert.equal(images.length, 3);
  assert.equal(images[0].mimeType, 'image/png');
  assert.equal(Buffer.from(images[0].data, 'base64').subarray(1, 4).toString(), 'PNG');

  const missing = await call('run_status', {runId: 'nope'});
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /not found/);
  assert.equal((await call('plan_video', {seconds: 'ten'})).isError, true);
});

test('CLI: ops, call, plan, roles, run, errors, remote --url', async (t) => {
  const cli = (...args: string[]) => spawnSync(process.execPath, [BIN, ...args], {encoding: 'utf8', env: ENV, timeout: 60_000});

  const ops = cli('ops');
  assert.equal(ops.status, 0, ops.stderr);
  for (const n of NAMES) assert.match(ops.stdout, new RegExp(`^${n}\\s`, 'm'));
  assert.equal(JSON.parse(cli('ops', '--json').stdout).length, NAMES.length);

  const planned = cli('call', 'plan_video', '{"idea":"CLI test","seconds":20}');
  assert.equal(planned.status, 0, planned.stderr);
  assert.equal(JSON.parse(planned.stdout).status, 'awaiting-approval');

  const unknown = cli('call', 'nope', '{}');
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown operation "nope"/);
  const invalid = cli('call', 'plan_video', '{}');
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /Invalid input for plan_video/);
  assert.equal(cli('call', 'plan_video', 'not json').status, 2);
  assert.equal(cli('frobnicate').status, 2);
  assert.equal(cli('plan', 'x', '--bogus').status, 2);
  assert.equal(cli('plan', 'no seconds').status, 2);

  const plan = cli('plan', 'A CLI promo', '--seconds', '20', '--format', '1:1');
  assert.equal(plan.status, 0, plan.stderr);
  assert.match(plan.stdout, /Run run_\w+ \(awaiting-approval\)/);
  assert.match(plan.stdout, /Next: mvo approve/);
  assert.match(cli('roles', '--preset', 'free').stdout, /builder\s+gemini-free\/gemini-3\.6-flash/);
  assert.match(cli('help').stdout, /mvo mcp/);
  assert.match(cli('estimate', '--seconds', '30').stdout, /builder .* total /s);

  // full unattended run on the fake: plan → approve → start → follow until done
  const run = cli('run', 'A full fake run', '--seconds', '16', '--yes');
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /Done: /);
  assert.match(run.stdout, /FAILED|retrying/, 'shows the retry of a failing gate');

  // remote mode: the CLI talks to a running server over HTTP
  const {url, stop} = await startApi();
  t.after(stop);
  const remote = await promisify(execFile)(process.execPath, [BIN, 'call', 'plan_video', '{"idea":"remote","seconds":12}', '--url', url], {env: ENV});
  const remoteRun = JSON.parse(remote.stdout);
  const listed = await promisify(execFile)(process.execPath, [BIN, 'status', '--url', url], {env: ENV});
  assert.match(listed.stdout, new RegExp(remoteRun.id));
});

test('dashboard app.js parses', () => {
  const r = spawnSync(process.execPath, ['--check', join(ROOT, 'src', 'dashboard', 'public', 'app.js')], {encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
});

test('CLI call approve keeps local work alive and reports a pipeline failure', async () => {
  // No installed studio: scaffolding must fail asynchronously. The old CLI exited with success first,
  // leaving run.json stranded in "scaffolding" instead of saving the failure.
  const dir = join(TMP, 'cli-lifetime');
  mkdirSync(join(dir, 'studio'), {recursive: true});
  const configPath = join(dir, 'motion.config.json');
  const config = defaultConfig();
  config.roles = {director: 'host', builder: 'host', reviewer: 'host', escalation: 'host'};
  await saveConfig(config, configPath);
  const orch = await createOrchestrator({configPath});
  const plan = JSON.parse(readFileSync(join(ROOT, 'test', 'fixtures', 'plan-tiny.json'), 'utf8'));
  const run = await orch.plan({idea: 'CLI lifecycle regression', seconds: plan.seconds, plan});
  const result = spawnSync(process.execPath, [BIN, 'call', 'approve', JSON.stringify({runId: run.id, what: 'plan'}), '--config', configPath], {
    encoding: 'utf8', env: {...ENV, MVO_FAKE: '', MVO_URL: ''}, timeout: 15_000,
  });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.equal(JSON.parse(result.stdout).id, run.id, 'stdout stays valid operation JSON');
  assert.equal((await orch.status(run.id)).status, 'failed', 'pipeline saved its asynchronous failure before exit');
  assert.match(result.stderr, /failed/);
});

test('CLI serve --demo starts without shell-specific environment syntax and serves custom demo stills', async (t) => {
  const child = spawn(process.execPath, [BIN, 'serve', '--demo', '--port', '0'], {
    env: {...ENV, MVO_FAKE: '', MVO_URL: ''}, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  t.after(() => { child.kill(); });
  let output = '';
  let errors = '';
  child.stderr.on('data', (data) => { errors += data; });
  const url = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Demo did not start: ' + output + errors)), 10_000);
    const done = (error?: Error, at?: string) => { clearTimeout(timer); error ? reject(error) : resolve(at!); };
    child.once('error', (error) => done(error));
    child.once('exit', (code) => done(new Error(`Demo exited (${code}): ${errors}`)));
    child.stdout.on('data', (data) => {
      output += data;
      const at = /Motion Orchestrator on (http:\/\/\S+)/.exec(output)?.[1];
      if (at) done(undefined, at);
    });
  });
  const html = await (await fetch(url)).text();
  assert.match(html, /data-demo="true"/);
  const post = async (op: string, input: unknown) => {
    const response = await fetch(`${url}/api/${op}`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(input)});
    assert.equal(response.status, 200);
    return await response.json() as any;
  };
  const run = await post('plan_video', {idea: 'Dashboard startup smoke', seconds: 16});
  await post('approve', {runId: run.id, what: 'plan'});
  let status: any;
  for (let i = 0; i < 100; i++) {
    status = await post('run_status', {runId: run.id});
    if (status.status === 'done') break;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.equal(status.status, 'done');
  const still = status.jobs.flatMap((job: any) => job.stills)[0];
  assert.ok(still.startsWith(TMP));
  const image = await fetch(`${url}/api/file?path=${encodeURIComponent(still)}`);
  assert.equal(image.status, 200, 'custom MVO_FAKE_DIR is included in the demo file roots');
  assert.equal(image.headers.get('content-type'), 'image/png');
  await image.arrayBuffer();
});
