// Offline self-check of the core: config, providers (both wire formats against local mocks), rate limiting,
// retries, sandboxed tools, the agent loop and the budget. Run: node test/core.test.ts
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {startMock} from './helpers/mock-api.ts';
import {applyPreset, defaultConfig, loadConfig, PRESETS, resolveRole, saveConfig, studioRoot, validateRoles} from '../src/config.ts';
import {makeProvider} from '../src/providers/index.ts';
import {costOf} from '../src/providers/cost.ts';
import {makeTools, matchGlob} from '../src/agent/tools.ts';
import {runAgent} from '../src/agent/loop.ts';
import {estimateRun, Ledger} from '../src/budget.ts';
import type {Connection} from '../src/types.ts';

const tests: [string, () => Promise<void> | void][] = [];
const test = (name: string, fn: () => Promise<void> | void) => tests.push([name, fn]);
const near = (a: number | null, b: number, eps = 1e-9) => assert.ok(a !== null && Math.abs(a - b) < eps, `${a} ≈ ${b}`);

// ── fixtures ──
const tmp = await mkdtemp(join(tmpdir(), 'mvo-core-'));
const studio = join(tmp, 'studio');
await mkdir(join(studio, 'src/promo'), {recursive: true});
await mkdir(join(studio, 'node_modules/pkg'), {recursive: true});
await writeFile(join(studio, 'node_modules/pkg/index.ts'), 'x');
await writeFile(join(studio, 'src/promo/a.ts'), 'export const a = 1;\nexport const a2 = 1;\n');
await writeFile(join(tmp, 'secret.txt'), 'nope');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
await writeFile(join(studio, 'still.png'), PNG);
process.env.MVO_TEST_KEY = 'sk-test';
const tools = (vision = false) => makeTools({studioRoot: studio, allow: ['src/promo/**', 'public/promo/*.wav'], commandAllow: [/^node --version$/], vision});
const call = (id: string, name: string, args: unknown) => ({id, type: 'function', function: {name, arguments: JSON.stringify(args)}});
const oaReply = (message: object, usage: object = {prompt_tokens: 10, completion_tokens: 1}) => ({body: {choices: [{message: {role: 'assistant', content: null, ...message}}], usage}});

// ── providers + loop ──
test('openai: 2-step tool loop, extras passed back, usage + cost', async () => {
  const m = await startMock((_r, i) =>
    i === 0
      ? oaReply(
          {reasoning_content: 'thinking...', tool_calls: [call('c1', 'write_file', {path: 'src/promo/b.ts', content: 'export const b = 2;\n'})]},
          {prompt_tokens: 1000, completion_tokens: 100, total_tokens: 1100, prompt_tokens_details: {cached_tokens: 400}},
        )
      : oaReply({content: 'done', tool_calls: [call('c2', 'finish', {summary: 'built b'})]}, {prompt_tokens: 2000, completion_tokens: 50, prompt_cache_hit_tokens: 1500}),
  );
  try {
    const conn: Connection = {id: 'mock-openai', kind: 'openai', baseUrl: `${m.url}/v1/`, keyEnv: 'MVO_TEST_KEY'};
    const price = {inPerM: 1, outPerM: 10, cachedInPerM: 0.1};
    const r = await runAgent({provider: makeProvider(conn), model: 'm1', price, system: 'sys', task: 'build b', tools: tools()});
    assert.equal(r.stoppedBy, 'finish');
    assert.equal(r.steps, 2);
    assert.equal(r.finalText, 'built b');
    assert.equal(await readFile(join(studio, 'src/promo/b.ts'), 'utf8'), 'export const b = 2;\n');
    const [q0, q1] = m.requests;
    assert.equal(q0.url, '/v1/chat/completions');
    assert.equal(q0.headers.authorization, 'Bearer sk-test');
    assert.equal(q0.body.model, 'm1');
    assert.deepEqual(q0.body.messages, [{role: 'system', content: 'sys'}, {role: 'user', content: 'build b'}]);
    assert.equal(q0.body.tools[0].type, 'function');
    const names = q0.body.tools.map((t: any) => t.function.name);
    assert.ok(names.includes('write_file') && names.includes('finish') && !names.includes('view_image'));
    assert.equal(q1.body.messages[2].reasoning_content, 'thinking...');
    assert.deepEqual(q1.body.messages[3], {role: 'tool', tool_call_id: 'c1', content: 'wrote src/promo/b.ts (20 chars)'});
    assert.deepEqual({...r.usage, costUSD: 0}, {inTokens: 3000, outTokens: 150, cachedInTokens: 1900, costUSD: 0});
    near(r.usage.costUSD, (600 * 1 + 400 * 0.1 + 100 * 10 + 500 * 1 + 1500 * 0.1 + 50 * 10) / 1e6);
  } finally {
    await m.close();
  }
});

test('openai: view_image result reaches the model as image content', async () => {
  const m = await startMock((_r, i) => oaReply({tool_calls: [i === 0 ? call('v1', 'view_image', {path: 'still.png'}) : call('f', 'finish', {summary: 'seen'})]}));
  try {
    const r = await runAgent({provider: makeProvider({id: 'mock-oa-img', kind: 'openai', baseUrl: m.url}), model: 'm', system: 's', task: 't', tools: tools(true)});
    assert.equal(r.stoppedBy, 'finish');
    const msgs = m.requests[1].body.messages;
    assert.equal(msgs[3].role, 'tool');
    assert.equal(m.requests[0].headers.authorization, undefined); // no keyEnv → no auth header
    assert.deepEqual(msgs[4], {
      role: 'user',
      content: [
        {type: 'text', text: 'Image: still.png'},
        {type: 'image_url', image_url: {url: `data:image/png;base64,${PNG.toString('base64')}`}},
      ],
    });
  } finally {
    await m.close();
  }
});

test('anthropic: 2-step tool loop, blocks round-trip, merged tool results + image, usage + cost', async () => {
  const first = [
    {type: 'thinking', thinking: 'hmm', signature: 'sig'},
    {type: 'text', text: 'Looking'},
    {type: 'tool_use', id: 'tu1', name: 'view_image', input: {path: 'still.png'}},
    {type: 'tool_use', id: 'tu2', name: 'write_file', input: {path: 'src/promo/c.ts', content: 'c'}},
  ];
  const m = await startMock((_r, i) =>
    i === 0
      ? {body: {content: first, stop_reason: 'tool_use', usage: {input_tokens: 500, output_tokens: 80, cache_read_input_tokens: 1000}}}
      : {body: {content: [{type: 'tool_use', id: 'tu3', name: 'finish', input: {summary: 'ok'}}], usage: {input_tokens: 100, output_tokens: 10}}},
  );
  try {
    const conn: Connection = {id: 'mock-anthropic', kind: 'anthropic', baseUrl: m.url, keyEnv: 'MVO_TEST_KEY'};
    const r = await runAgent({provider: makeProvider(conn), model: 'c1', price: {inPerM: 3, outPerM: 15, cachedInPerM: 0.3}, system: 'sys', task: 'task', tools: tools(true)});
    assert.equal(r.stoppedBy, 'finish');
    assert.equal(r.steps, 2);
    assert.equal(r.finalText, 'ok');
    assert.equal(await readFile(join(studio, 'src/promo/c.ts'), 'utf8'), 'c');
    const [q0, q1] = m.requests;
    assert.equal(q0.url, '/v1/messages');
    assert.equal(q0.headers['x-api-key'], 'sk-test');
    assert.equal(q0.headers['anthropic-version'], '2023-06-01');
    assert.equal(q0.body.max_tokens, 8192);
    assert.equal(q0.body.system, 'sys');
    assert.deepEqual(q0.body.messages, [{role: 'user', content: [{type: 'text', text: 'task'}]}]);
    assert.equal(q0.body.tools[0].input_schema.type, 'object');
    const msgs = q1.body.messages;
    assert.equal(msgs.length, 3);
    assert.deepEqual(msgs[1], {role: 'assistant', content: first}); // thinking + signature preserved
    assert.equal(msgs[2].role, 'user');
    const c = msgs[2].content;
    assert.deepEqual(c.map((b: any) => b.type), ['tool_result', 'tool_result', 'text', 'image']);
    assert.equal(c[0].tool_use_id, 'tu1');
    assert.equal(c[1].tool_use_id, 'tu2');
    assert.deepEqual(c[3].source, {type: 'base64', media_type: 'image/png', data: PNG.toString('base64')});
    assert.deepEqual({...r.usage, costUSD: 0}, {inTokens: 1600, outTokens: 90, cachedInTokens: 1000, costUSD: 0});
    near(r.usage.costUSD, (500 * 3 + 1000 * 0.3 + 80 * 15 + 100 * 3 + 10 * 15) / 1e6);
  } finally {
    await m.close();
  }
});

test('loop: bad JSON args → error result; text-only reply → no-tools; abort; budget stop', async () => {
  const m = await startMock((_r, i) =>
    i === 0
      ? oaReply({tool_calls: [{id: 'x', type: 'function', function: {name: 'read_file', arguments: '{bad'}}]})
      : i === 1
        ? oaReply({content: 'all done'})
        : oaReply({tool_calls: [call(`r${i}`, 'list_files', {pattern: '.'})]}, {prompt_tokens: 1_000_000, completion_tokens: 0}),
  );
  try {
    const provider = makeProvider({id: 'mock-oa-loop', kind: 'openai', baseUrl: m.url});
    const r = await runAgent({provider, model: 'm', system: 's', task: 't', tools: tools()});
    assert.equal(r.stoppedBy, 'no-tools');
    assert.equal(r.finalText, 'all done');
    assert.match(m.requests[1].body.messages[3].content, /not valid JSON/);
    const ac = new AbortController();
    ac.abort();
    const a = await runAgent({provider, model: 'm', system: 's', task: 't', tools: tools(), signal: ac.signal});
    assert.deepEqual([a.stoppedBy, a.steps], ['aborted', 0]);
    // each later call costs $1 (1M in tokens at $1/M); 1.5 left → one step, then stop
    const b = await runAgent({provider, model: 'm', price: {inPerM: 1, outPerM: 1}, system: 's', task: 't', tools: tools(), budgetLeftUSD: () => 1.5});
    assert.deepEqual([b.stoppedBy, b.steps], ['budget', 2]);
    const s = await runAgent({provider, model: 'm', system: 's', task: 't', tools: tools(), maxSteps: 2});
    assert.deepEqual([s.stoppedBy, s.steps], ['max-steps', 2]);
  } finally {
    await m.close();
  }
});

test('providers: listModels strips "models/", rpm spaces requests', async () => {
  const m = await startMock(() => ({body: {data: [{id: 'models/b'}, {id: 'a'}]}}));
  try {
    const p = makeProvider({id: 'mock-rpm', kind: 'openai', baseUrl: m.url, rpm: 600}); // ≥100 ms apart
    const t0 = Date.now();
    const lists = await Promise.all([1, 2, 3, 4].map(() => p.listModels()));
    assert.deepEqual(lists[0], ['a', 'b']);
    assert.ok(Date.now() - t0 >= 290, `4 requests at rpm 600 took ${Date.now() - t0} ms`);
    for (let i = 1; i < 4; i++) assert.ok(m.requests[i].at - m.requests[i - 1].at >= 90, 'requests are spaced');
  } finally {
    await m.close();
  }
});

test('providers: 429 + Retry-After is retried; 400 fails; missing key and host are clear errors', async () => {
  const m = await startMock((r, i) =>
    r.body?.model === 'bad' ? {status: 400, body: {error: 'bad model'}} : i === 0 ? {status: 429, headers: {'retry-after': '1'}, body: {error: 'slow down'}} : oaReply({content: 'hi'}),
  );
  try {
    const p = makeProvider({id: 'mock-429', kind: 'openai', baseUrl: m.url});
    const t0 = Date.now();
    const r = await p.chat('m', [{role: 'user', content: 'x'}], []);
    assert.equal(r.message.content, 'hi');
    assert.equal(m.requests.length, 2);
    assert.ok(Date.now() - t0 >= 950, 'waited for Retry-After');
    assert.equal(m.requests[0].body.tools, undefined); // no tools → field omitted
    await assert.rejects(p.chat('bad', [{role: 'user', content: 'x'}], []), /400.*bad model/s);
    await assert.rejects(makeProvider({id: 'k', kind: 'openai', baseUrl: m.url, keyEnv: 'MVO_NOPE_KEY'}).chat('m', [], []), /MVO_NOPE_KEY/);
    await assert.rejects(makeProvider({id: 'k2', kind: 'anthropic', baseUrl: m.url, keyEnv: 'MVO_NOPE_KEY'}).listModels(), /MVO_NOPE_KEY/);
    assert.throws(() => makeProvider({id: 'host', kind: 'mcp-host'}), /MCP host/);
  } finally {
    await m.close();
  }
});

test('cost: free, unknown price, cached input', () => {
  const u = {inTokens: 1_000_000, outTokens: 1_000_000, cachedInTokens: 500_000};
  assert.equal(costOf(u, {inPerM: 1, outPerM: 2}, true), 0);
  assert.equal(costOf(u, undefined), 0);
  near(costOf(u, {inPerM: 1, outPerM: 2, cachedInPerM: 0.1}), 0.5 + 0.05 + 2);
  near(costOf(u, {inPerM: 1, outPerM: 2}), 1 + 2); // no cached price → full input price
});

// ── sandbox ──
test('tools: writes only inside allow globs, no traversal, no node_modules', async () => {
  const t = tools();
  assert.match((await t.run('write_file', {path: 'src/promo/x/y.ts', content: 'y'})).text, /^wrote src\/promo\/x\/y\.ts/);
  assert.match((await t.run('write_file', {path: 'public/promo/hit.wav', content: 'w'})).text, /^wrote/);
  const denied = ['src/other.ts', 'public/promo/sub/hit.wav', '../evil.txt', 'src/promo/../../../evil.txt', 'src/promo/../../src/other.ts', join(tmp, 'evil.txt'), resolve(studio, '..', 'evil.txt')];
  if (process.platform === 'win32') denied.push('C:\\Windows\\evil.txt', 'Z:\\evil.txt', 'src\\promo\\..\\..\\..\\evil.txt');
  for (const path of denied) {
    const r = await t.run('write_file', {path, content: 'x'});
    assert.match(r.text, /^Error: /, `write ${path} must be refused`);
    assert.ok(!r.finished);
  }
  assert.match((await t.run('write_file', {path: 'src/other.ts', content: 'x'})).text, /src\/promo\/\*\*/); // explains the allowed globs
  assert.ok(!existsSync(join(tmp, 'evil.txt')) && !existsSync(join(studio, 'src/other.ts')));
  assert.match((await t.run('edit_file', {path: 'src/other.ts', old: 'a', new: 'b'})).text, /not allowed/);
  // reads
  assert.match((await t.run('read_file', {path: 'src/promo/a.ts'})).text, /export const a = 1/);
  for (const path of ['../secret.txt', join(tmp, 'secret.txt'), 'node_modules/pkg/index.ts', 'src/../node_modules/pkg/index.ts'])
    assert.match((await t.run('read_file', {path})).text, /^Error: /, `read ${path} must be refused`);
  // edit
  assert.match((await t.run('edit_file', {path: 'src/promo/a.ts', old: '= 1', new: '= 3'})).text, /occurs 2 times/);
  assert.match((await t.run('edit_file', {path: 'src/promo/a.ts', old: 'nope', new: 'x'})).text, /not found/);
  assert.match((await t.run('edit_file', {path: 'src/promo/a.ts', old: 'a2 = 1', new: 'a2 = $&2'})).text, /^edited/);
  assert.match((await t.run('edit_file', {path: 'src/promo/a.ts', old: 'export', new: 'export /**/', replace_all: true})).text, /2 replacements/);
  assert.equal(await readFile(join(studio, 'src/promo/a.ts'), 'utf8'), 'export /**/ const a = 1;\nexport /**/ const a2 = $&2;\n');
  // list
  const all = (await t.run('list_files', {pattern: '.'})).text.split('\n');
  assert.ok(all.includes('src/promo/a.ts') && all.includes('still.png') && !all.some((f) => f.includes('node_modules')));
  assert.deepEqual((await t.run('list_files', {pattern: 'src/**/*.ts'})).text.split('\n').sort(), ['src/promo/a.ts', 'src/promo/b.ts', 'src/promo/c.ts', 'src/promo/x/y.ts']);
  assert.deepEqual((await t.run('list_files', {pattern: '**/*.png'})).text, 'still.png');
  assert.match((await t.run('list_files', {pattern: '../*'})).text, /^Error: /);
  // misc
  assert.match((await t.run('view_image', {path: 'still.png'})).text, /cannot view images/);
  assert.match((await t.run('nope', {})).text, /unknown tool/);
  assert.deepEqual(await t.run('finish', {summary: 's'}), {text: 's', finished: true});
});

test('tools: glob matcher', () => {
  assert.ok(matchGlob('src/**', 'src/a/b.ts'));
  assert.ok(matchGlob('src/**/*.ts', 'src/x.ts'));
  assert.ok(matchGlob('src/**/*.ts', 'src/a/b/x.ts'));
  assert.ok(!matchGlob('src/**/*.ts', 'src/a/x.tsx'));
  assert.ok(!matchGlob('*.ts', 'a/b.ts'));
  assert.ok(matchGlob('a?.ts', 'ab.ts'));
  assert.ok(!matchGlob('src/a.ts', 'src/aXts'));
  assert.ok(matchGlob('./src/(x)/*.ts', 'src/(x)/y.ts'));
});

test('tools: command allowlist', async () => {
  const t = tools();
  const ok = (await t.run('run_command', {command: 'node --version'})).text;
  assert.match(ok, /^exit 0\nv\d+/);
  assert.match((await t.run('run_command', {command: 'node -e "1"'})).text, /not allowed/);
  for (const command of ['node --version && whoami', 'node --version; whoami', 'node --version | more', 'node --version > x.txt', 'node --version $(whoami)', 'node --version\nwhoami'])
    assert.match((await t.run('run_command', {command})).text, /shell operators/, command);
});

// ── config ──
test('config: defaults, merge, validation, save/load, discovery', async () => {
  const missing = await loadConfig(join(tmp, 'none', 'motion.config.json'));
  assert.deepEqual(missing.config, defaultConfig());
  assert.equal(missing.path, join(tmp, 'none', 'motion.config.json'));
  const d = defaultConfig();
  assert.equal(d.studio, 'studio');
  assert.equal(d.roles.director, 'openai/?');
  assert.deepEqual(d.gates, {retries: 2, reviewMinScore: 7, parallel: 3});
  assert.equal(d.connections['gemini-free'].free, true);
  assert.equal(d.connections.ollama.keyEnv, undefined);

  const dir = join(tmp, 'cfg');
  await mkdir(join(dir, 'deep/er'), {recursive: true});
  const path = join(dir, 'motion.config.json');
  await writeFile(
    path,
    JSON.stringify({
      preset: 'economy',
      budgetUSD: 12,
      roles: {director: 'xai/grok-4.7'},
      connections: {mine: {kind: 'openai', baseUrl: 'http://127.0.0.1:9/v1', keyEnv: 'MINE_KEY'}, xai: {rpm: 30}, lmstudio: null},
      models: {'deepseek/deepseek-v4-pro': {price: {inPerM: 1, outPerM: 4}}},
      gates: {parallel: 5},
      futureField: {kept: true},
    }),
  );
  const {config: c} = await loadConfig(path);
  assert.equal(c.budgetUSD, 12);
  assert.deepEqual(c.roles, {...PRESETS.economy, director: 'xai/grok-4.7'}); // missing roles come from the file's preset
  assert.deepEqual(c.connections.mine, {id: 'mine', kind: 'openai', baseUrl: 'http://127.0.0.1:9/v1', keyEnv: 'MINE_KEY'});
  assert.equal(c.connections.xai.rpm, 30);
  assert.equal(c.connections.xai.baseUrl, 'https://api.x.ai/v1');
  assert.equal(c.connections.lmstudio, undefined);
  assert.ok(c.connections.openai);
  assert.deepEqual(c.models['deepseek/deepseek-v4-pro'].price, {inPerM: 1, outPerM: 4});
  assert.deepEqual(c.gates, {retries: 2, reviewMinScore: 7, parallel: 5});
  assert.deepEqual((c as any).futureField, {kept: true});
  assert.equal(studioRoot(c, path), join(dir, 'studio'));

  await saveConfig(c, path);
  assert.deepEqual((await loadConfig(path)).config, c);

  const cwd = process.cwd();
  process.chdir(join(dir, 'deep/er'));
  try {
    assert.equal((await loadConfig()).path, path); // walks up from cwd
  } finally {
    process.chdir(cwd);
  }

  await writeFile(join(dir, 'bad.json'), JSON.stringify({budgetUSD: 'lots', connections: {x: {kind: 'carrier-pigeon'}}}));
  await assert.rejects(loadConfig(join(dir, 'bad.json')), /budgetUSD[\s\S]*connections/);
  await writeFile(join(dir, 'broken.json'), '{nope');
  await assert.rejects(loadConfig(join(dir, 'broken.json')), /Cannot parse/);
});

test('config: applyPreset, resolveRole, validateRoles', () => {
  const d = defaultConfig();
  const eco = applyPreset(d, 'economy');
  assert.equal(eco.preset, 'economy');
  assert.deepEqual(eco.roles, PRESETS.economy);
  assert.notEqual(eco.roles, PRESETS.economy); // a copy
  const picked = applyPreset({...d, roles: {...d.roles, director: 'openai/gpt-x'}}, 'premium');
  assert.deepEqual(picked.roles, {director: 'openai/gpt-x', builder: 'openai/?', reviewer: 'openai/?', escalation: 'openai/?'});

  assert.throws(() => resolveRole(d, 'director'), /Pick a model for director/);
  assert.throws(() => resolveRole({...d, roles: {...d.roles, builder: 'nope/m'}}, 'builder'), /unknown connection "nope"/);
  assert.deepEqual(resolveRole(applyPreset(d, 'free'), 'director'), {kind: 'host'});
  const b = resolveRole(d, 'builder');
  assert.ok(b.kind === 'api' && b.connection.id === 'deepseek' && b.model === 'deepseek-flash' && b.info?.price?.inPerM === 0.3);
  const or = resolveRole({...d, roles: {...d.roles, builder: 'openrouter/vendor/model-x'}}, 'builder');
  assert.ok(or.kind === 'api' && or.model === 'vendor/model-x');

  const saved = {DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY, GEMINI_API_KEY: process.env.GEMINI_API_KEY};
  try {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const p = validateRoles(d).join('\n');
    assert.match(p, /Pick a model for director/);
    assert.match(p, /DEEPSEEK_API_KEY/);
    assert.match(p, /GEMINI_API_KEY/);
    assert.match(p, /no price for deepseek\/deepseek-v4-pro/);
    assert.doesNotMatch(p, /no price for gemini-free/); // free → no price needed
    assert.match(validateRoles({...d, roles: {...d.roles, reviewer: 'xai/grok-4.7'}}).join('\n'), /reviewer: xai\/grok-4\.7 is not marked as vision-capable/);
    process.env.DEEPSEEK_API_KEY = 'k';
    process.env.GEMINI_API_KEY = 'k';
    const ok = applyPreset(d, 'economy');
    ok.models['deepseek/deepseek-v4-pro'] = {ref: 'deepseek/deepseek-v4-pro', price: {inPerM: 1, outPerM: 4}};
    assert.deepEqual(validateRoles(ok), []);
    assert.deepEqual(validateRoles(applyPreset(d, 'free')), []);
  } finally {
    for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

// ── budget ──
test('budget: estimateRun ($0 free/host, null for unknown price, minutes)', () => {
  const d = defaultConfig();
  const free = estimateRun(applyPreset(d, 'free'), 4);
  assert.equal(free.totalUSD, 0);
  assert.equal(free.withinBudget, true);
  assert.ok(free.roles.every((r) => r.costUSD === 0));
  assert.ok(free.notes.some((n) => /host.*\$0/.test(n)));
  assert.ok(free.notes.some((n) => /free connection "gemini-free".*rpm 10, rpd 250/.test(n)));

  const eco = applyPreset(d, 'economy');
  const e1 = estimateRun(eco, 4);
  const role = (e: typeof e1, r: string) => e.roles.find((x) => x.role === r)!;
  assert.equal(e1.totalUSD, null);
  assert.equal(e1.withinBudget, null);
  assert.equal(role(e1, 'escalation').costUSD, null);
  assert.ok(e1.notes.some((n) => /no price for deepseek\/deepseek-v4-pro/.test(n)));
  assert.deepEqual([role(e1, 'builder').jobs, role(e1, 'builder').inTokens, role(e1, 'builder').outTokens], [5, 1_060_000, 140_000]);
  near(role(e1, 'builder').costUSD, 1.06 * 0.3 + 0.14 * 1.2, 1e-4);
  near(role(e1, 'director').costUSD, 0.1 * 0.3 + 0.01 * 1.2, 1e-4);
  assert.equal(role(e1, 'reviewer').costUSD, 0);
  assert.deepEqual([role(e1, 'escalation').inTokens, role(e1, 'escalation').outTokens], [159_000, 21_000]);

  eco.models['deepseek/deepseek-v4-pro'] = {ref: 'deepseek/deepseek-v4-pro', price: {inPerM: 1, outPerM: 4}};
  const e2 = estimateRun(eco, 4);
  near(e2.totalUSD, 0.042 + 0.486 + 0.159 + 0.084, 1e-3);
  assert.equal(e2.withinBudget, true);
  assert.equal(estimateRun({...eco, budgetUSD: 0.5}, 4).withinBudget, false);

  const bal = estimateRun(d, 4);
  assert.equal(role(bal, 'director').costUSD, null);
  assert.ok(bal.notes.some((n) => /Pick a model for director/.test(n)));

  // minutes: parallelism and rate limits
  const serial = estimateRun({...eco, gates: {...eco.gates, parallel: 1}}, 4);
  assert.ok(serial.totalMinutes > e2.totalMinutes, `${serial.totalMinutes} > ${e2.totalMinutes}`);
  const slow = applyPreset(d, 'free');
  slow.connections['gemini-free'] = {...slow.connections['gemini-free'], rpm: 1};
  assert.ok(estimateRun(slow, 4).totalMinutes >= 145); // (1.06M + 0.1M) / 8k requests at 1 rpm
  assert.ok(estimateRun(applyPreset(d, 'free'), 20).notes.some((n) => /allows 250\/day/.test(n)));
});

test('budget: Ledger', () => {
  const l = new Ledger({director: {inTokens: 1, outTokens: 1, costUSD: 0.5}});
  l.add('builder', {inTokens: 100, outTokens: 10, cachedInTokens: 50, costUSD: 1.25});
  l.add('builder', {inTokens: 100, outTokens: 10, costUSD: 0.25});
  assert.equal(l.spentUSD, 2);
  assert.equal(l.remaining(5), 3);
  const by = l.byRole();
  assert.deepEqual(by.builder, {inTokens: 200, outTokens: 20, cachedInTokens: 50, costUSD: 1.5});
  assert.deepEqual(by.reviewer, {inTokens: 0, outTokens: 0, cachedInTokens: 0, costUSD: 0});
  by.builder.costUSD = 99;
  assert.equal(l.spentUSD, 2); // byRole returns a copy
});

// ── runner ──
let failed = 0;
const t0 = Date.now();
for (const [name, fn] of tests) {
  const t = Date.now();
  try {
    await fn();
    console.log(`ok   ${name} (${Date.now() - t} ms)`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}\n${(e as Error).stack}`);
  }
}
await rm(tmp, {recursive: true, force: true});
console.log(`\n${tests.length - failed}/${tests.length} passed in ${Date.now() - t0} ms`);
if (failed) process.exitCode = 1;
