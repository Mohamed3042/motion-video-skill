#!/usr/bin/env node
// mvo: Motion Orchestrator CLI. Every command is a thin wrapper over the shared operations table (src/api/ops.ts),
// run in-process, or against a running `mvo serve` when --url / MVO_URL is set.
// MVO_FAKE=1 swaps in the in-memory fake orchestrator (tests, UI demos).
import {existsSync, readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {parseArgs} from 'node:util';
import {OPS, describeOps, localCaller, OpError, remoteCaller} from '../src/api/ops.ts';
import type {Caller} from '../src/api/ops.ts';
import type {Estimate, Orchestrator, Plan, RoleId, RunEvent, RunStatus} from '../src/types.ts';
import {ROLES} from '../src/types.ts';

const HELP = `mvo: make motion-graphics videos with a team of AI agents (any model, any role, any driver).

Setup
  mvo init                              write motion.config.json with defaults (if missing)
  mvo roles [--preset free|economy|balanced|premium] [--director X] [--builder X]
            [--reviewer X] [--escalation X] [--budget USD]
                                        show or change who does what; X = "<connection>/<model>" or "host"
  mvo models <connection>               list models on a connection (e.g. deepseek, gemini-free, openrouter)

Make a video
  mvo plan "<idea>" --seconds N [--format 16:9|9:16|1:1] [--brand "..."]
                                        plan + cost estimate; prints the run id
  mvo estimate <runId> | --seconds N    cost/time estimate for a run, or a rough one before planning
  mvo approve <runId> [--what plan|budget|final]
  mvo start <runId>                     start an approved run and follow it until it ends
  mvo run "<idea>" --seconds N [--format F] [--brand "..."] [--yes]
                                        plan → estimate → confirm (unless --yes) → start → follow
  mvo status [runId]                    list runs, or one run's jobs

Drive it from anything
  mvo ops [--json]                      list every operation (same set as MCP tools and HTTP API)
  mvo call <op> '<json>'                call any operation; '-' reads the JSON from stdin
  mvo serve [--port 4317] [--host 127.0.0.1]   HTTP API + dashboard
  mvo dashboard [--port] [--host]       same, and open the browser
  mvo mcp                               stdio MCP server (for Claude Code, Codex, Gemini CLI, Cursor, ...)

Global options
  --config <path>    motion.config.json to use (default: nearest one upward from cwd, else the repo root)
  --url <url>        talk to a running "mvo serve" instead of running in-process (env MVO_URL); MVO_TOKEN is sent
  MVO_TOKEN          bearer token for the HTTP API (required to serve on a non-loopback host)
`;

class UsageError extends Error {}
const TERMINAL: RunStatus[] = ['done', 'failed', 'cancelled', 'paused-budget'];

const {values: f, positionals} = (() => {
  try {
    return parseArgs({
      allowPositionals: true,
      options: {
        config: {type: 'string'}, url: {type: 'string'},
        seconds: {type: 'string'}, format: {type: 'string'}, brand: {type: 'string'}, yes: {type: 'boolean', short: 'y'},
        preset: {type: 'string'}, director: {type: 'string'}, builder: {type: 'string'}, reviewer: {type: 'string'},
        escalation: {type: 'string'}, budget: {type: 'string'}, what: {type: 'string'},
        port: {type: 'string'}, host: {type: 'string'}, json: {type: 'boolean'}, help: {type: 'boolean', short: 'h'},
      },
    });
  } catch (e) {
    console.error(`mvo: ${(e as Error).message}\nRun "mvo --help" for usage.`);
    process.exit(2);
  }
})();
const [cmd, ...args] = positionals;

let orchP: Promise<Orchestrator> | undefined;
const orchestrator = (): Promise<Orchestrator> =>
  (orchP ??= process.env.MVO_FAKE
    ? import('../test/fake-orchestrator.ts').then((m) => m.createFakeOrchestrator())
    : import('../src/pipeline/orchestrator.ts').then((m) => m.createOrchestrator({configPath: f.config ?? process.env.MVO_CONFIG})));

const url = f.url ?? process.env.MVO_URL;
const call: Caller = url ? remoteCaller(url) : async (op, input) => localCaller(await orchestrator())(op, input);

// ── formatting ────────────────────────────────────────────────────────────────────────────────
const usd = (n: number | null | undefined) => (n === null || n === undefined ? '?' : n === 0 ? '$0' : `$${n.toFixed(n < 1 ? 3 : 2)}`);
const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));
const pad = (s: unknown, n: number) => String(s ?? '').padEnd(n);
const secs = (frames: number, fps: number) => (frames / fps).toFixed(1);

function printPlan(plan: Plan) {
  console.log(`"${plan.title}"  ${plan.seconds} s · ${plan.format} · ${plan.width}x${plan.height} @${plan.fps} fps · ${plan.bpm} bpm`);
  console.log(`  ${pad('intro', 10)} 0.0-${secs(plan.intro.endFrame, plan.fps)} s  ${plan.intro.brief}`);
  for (const s of plan.segments)
    console.log(`  ${pad(s.id, 10)} ${secs(s.startFrame, plan.fps)}-${secs(s.endFrame, plan.fps)} s  ${s.accent}  ${s.name}: ${s.brief.slice(0, 90)}`);
  console.log(`  ${pad('outro', 10)} ${secs(plan.outro.startFrame, plan.fps)}-${plan.seconds} s  ${plan.outro.brief}`);
}

function printEstimate(e: Estimate, budgetUSD?: number) {
  console.log(`\n  ${pad('role', 11)}${pad('assignee', 34)}${pad('jobs', 6)}${pad('tokens in/out', 15)}${pad('cost', 9)}minutes`);
  for (const r of e.roles)
    console.log(`  ${pad(r.role, 11)}${pad(r.assignee, 34)}${pad(r.jobs, 6)}${pad(`${k(r.inTokens)}/${k(r.outTokens)}`, 15)}${pad(usd(r.costUSD), 9)}${r.minutes}`);
  const fit = e.withinBudget === null ? 'budget check needs all prices' : e.withinBudget ? 'within budget' : 'OVER BUDGET';
  console.log(`  total ${usd(e.totalUSD)}, ~${e.totalMinutes} min${budgetUSD !== undefined ? `, budget ${usd(budgetUSD)}` : ''}: ${fit}`);
  for (const n of e.notes) console.log(`  · ${n}`);
}

function printRoles(c: any) {
  for (const r of ROLES) console.log(`  ${pad(r, 11)}${c.roles[r]}`);
  console.log(`  budget     ${usd(c.budgetUSD)}  (preset ${c.preset})`);
  if (c.problems?.length) console.log(`\nTo fix:\n${c.problems.map((p: string) => `  · ${p}`).join('\n')}`);
}

const fmtEvent = (e: RunEvent) => `${e.t.slice(11, 19)}  ${pad(e.type, 5)} ${e.message}`;

async function confirm(q: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({input: process.stdin, output: process.stdout});
  const a = await rl.question(`${q} [y/N] `);
  rl.close();
  return /^y(es)?$/i.test(a.trim());
}

/** Print events until the run ends. Returns the final status. In-process: live events; remote: status polling. */
async function follow(runId: string): Promise<any> {
  const off = url ? () => {} : (await orchestrator()).subscribe(runId, (e) => console.log(fmtEvent(e)));
  let last = '';
  try {
    for (;;) {
      const run: any = await call('run_status', {runId});
      const line = `${run.status} · ${run.jobs.filter((j: any) => j.status === 'accepted').length}/${run.jobs.length} jobs accepted · spent ${usd(run.spentUSD)} of ${usd(run.budgetUSD)}`;
      if (line !== last) console.log(`-- ${(last = line)}`);
      if (TERMINAL.includes(run.status)) return run;
      await new Promise((r) => setTimeout(r, 2000));
    }
  } finally {
    off();
  }
}

/** Follow a started run; ask about the budget if it pauses. Exit code: 0 done, 1 failed/cancelled, 3 paused. */
async function followToEnd(runId: string): Promise<number> {
  for (;;) {
    const run = await follow(runId);
    if (run.status === 'done') {
      console.log(`\nDone: ${run.output ?? '(no output path reported)'}`);
      return 0;
    }
    if (run.status === 'paused-budget') {
      if (await confirm(`Budget reached (spent ${usd(run.spentUSD)} of ${usd(run.budgetUSD)}). Continue spending?`)) {
        await call('approve', {runId, what: 'budget'});
        continue;
      }
      console.log(`Paused at the budget. Resume later with: mvo approve ${runId} --what budget`);
      return 3;
    }
    console.log(`Run ${run.status}${run.error ? `: ${run.error}` : ''}`);
    return 1;
  }
}

const need = (v: string | undefined, what: string) => {
  if (!v) throw new UsageError(`Missing ${what}. Run "mvo --help" for usage.`);
  return v;
};
const num = (v: string | undefined, what: string) => {
  const n = Number(need(v, what));
  if (!Number.isFinite(n) || n <= 0) throw new UsageError(`${what} must be a positive number, got "${v}".`);
  return n;
};
const planInput = () => ({idea: need(args[0], 'the idea, e.g. mvo plan "a 30 second promo for my app" --seconds 30'), seconds: num(f.seconds, '--seconds N'), format: f.format, brandNotes: f.brand});

// ── commands ──────────────────────────────────────────────────────────────────────────────────
async function main(): Promise<number | 'stay'> {
  if (f.help || !cmd || cmd === 'help') {
    console.log(HELP);
    return 0;
  }
  switch (cmd) {
    case 'init': {
      const {loadConfig, saveConfig, defaultConfig} = await import('../src/config.ts');
      const {path} = await loadConfig(f.config ?? process.env.MVO_CONFIG);
      if (existsSync(path)) console.log(`${path} already exists; edit it, or use "mvo roles" / the dashboard.`);
      else {
        await saveConfig(defaultConfig(), path);
        console.log(`Wrote ${path}. Next: "mvo roles" to see who does what, or "mvo dashboard".`);
      }
      return 0;
    }
    case 'roles': {
      const roles: Partial<Record<RoleId, string>> = {};
      for (const r of ROLES) if (f[r]) roles[r] = f[r];
      const change = {
        ...(f.preset && {preset: f.preset}),
        ...(Object.keys(roles).length && {roles}),
        ...(f.budget !== undefined && {budgetUSD: Number(f.budget)}),
      };
      printRoles(await call(Object.keys(change).length ? 'set_roles' : 'get_config', change));
      return 0;
    }
    case 'models': {
      const list = (await call('list_models', {connection: need(args[0], 'connection id, e.g. mvo models deepseek')})) as string[];
      console.log(list.length ? list.map((m) => `${args[0]}/${m}`).join('\n') : '(no models listed)');
      return 0;
    }
    case 'plan': {
      const run: any = await call('plan_video', planInput());
      console.log(`Run ${run.id} (${run.status})\n`);
      if (run.plan) printPlan(run.plan);
      if (run.estimate) printEstimate(run.estimate, run.config?.budgetUSD);
      console.log(`\nNext: mvo approve ${run.id} && mvo start ${run.id}`);
      return 0;
    }
    case 'estimate': {
      printEstimate((await call('estimate_cost', args[0] ? {runId: args[0]} : {seconds: num(f.seconds, 'a runId or --seconds N')})) as Estimate);
      return 0;
    }
    case 'approve': {
      const run: any = await call('approve', {runId: need(args[0], 'runId'), what: f.what ?? 'plan'});
      console.log(`Approved ${f.what ?? 'plan'} for ${run.id} (${run.status}).`);
      return 0;
    }
    case 'start': {
      const runId = need(args[0], 'runId');
      await call('start_run', {runId});
      return followToEnd(runId);
    }
    case 'run': {
      const run: any = await call('plan_video', planInput());
      console.log(`Run ${run.id}\n`);
      if (run.plan) printPlan(run.plan);
      if (run.estimate) printEstimate(run.estimate, run.config?.budgetUSD);
      if (!f.yes && !(await confirm('\nStart building?'))) {
        console.log(`Not started. Later: mvo approve ${run.id} && mvo start ${run.id}`);
        return 0;
      }
      await call('approve', {runId: run.id, what: 'plan'});
      await call('start_run', {runId: run.id});
      return followToEnd(run.id);
    }
    case 'status': {
      if (!args[0]) {
        const runs = (await call('list_runs', {})) as any[];
        if (!runs.length) console.log('No runs yet. Start with: mvo plan "<idea>" --seconds 30');
        for (const r of runs) console.log(`${pad(r.id, 22)}${pad(r.status, 18)}${pad(usd(r.spentUSD), 9)}${r.createdAt.slice(0, 16)}  ${r.idea.slice(0, 50)}`);
        return 0;
      }
      const run: any = await call('run_status', {runId: args[0]});
      console.log(`${run.id}  ${run.status}  spent ${usd(run.spentUSD)} of ${usd(run.budgetUSD)}${run.output ? `\noutput: ${run.output}` : ''}${run.error ? `\nerror: ${run.error}` : ''}`);
      for (const j of run.jobs) {
        const gates = j.gates.map((g: any) => `${g.gate}:${g.ok ? 'ok' : 'FAIL'}`).join(' ');
        console.log(`  ${pad(j.segmentId ?? j.kind, 12)}${pad(j.status, 13)}${pad(j.assignee, 32)}#${j.attempt}  ${usd(j.usage.costUSD)}  ${gates}`);
      }
      return 0;
    }
    case 'ops': {
      if (f.json) console.log(JSON.stringify(describeOps(), null, 2));
      else for (const o of OPS) console.log(`${pad(o.name, 14)}${o.description.split(/(?<=\.)\s/)[0]}`);
      return 0;
    }
    case 'call': {
      const op = need(args[0], 'operation name (see "mvo ops")');
      const raw = args[1] === '-' ? readFileSync(0, 'utf8') : (args[1] ?? '{}');
      let input: unknown;
      try {
        input = JSON.parse(raw);
      } catch {
        throw new UsageError(`Input must be JSON, e.g. mvo call run_status '{"runId":"..."}'. Got: ${raw}`);
      }
      console.log(JSON.stringify(await call(op, input), null, 2));
      if (op === 'start_run' && !url) {
        console.error('Run started in this process; it keeps working until it ends (Ctrl+C stops it). Use "mvo start" to follow it, or "mvo serve" + --url to keep runs in one long-lived process.');
        return 'stay';
      }
      return 0;
    }
    case 'serve':
    case 'dashboard': {
      const {serve} = await import('../src/dashboard/server.ts');
      const {url: at} = await serve(await orchestrator(), {port: f.port ? Number(f.port) : undefined, host: f.host});
      console.log(`Motion Orchestrator on ${at}  (API: POST ${at}/api/<op>, discovery: GET ${at}/api/ops)`);
      if (cmd === 'dashboard') {
        const [bin, a] = process.platform === 'win32' ? ['explorer', [at]] : process.platform === 'darwin' ? ['open', [at]] : ['xdg-open', [at]];
        spawn(bin, a, {detached: true, stdio: 'ignore'}).on('error', () => console.log(`Open ${at} in your browser.`)).unref();
      }
      return 'stay';
    }
    case 'mcp': {
      const {startMcpServer} = await import('../src/mcp/server.ts');
      await startMcpServer(call);
      return 'stay';
    }
    default:
      throw new UsageError(`Unknown command "${cmd}". Run "mvo --help" for usage.`);
  }
}

// Exit explicitly (the orchestrator may hold timers/handles), but only after stdout has flushed.
const exit = (code: number) => process.stdout.write('', () => process.exit(code));
main().then(
  (code) => {
    if (code !== 'stay') exit(code);
  },
  (e) => {
    console.error(`mvo: ${(e as Error).message}`);
    exit(e instanceof UsageError || (e instanceof OpError && e.status < 500) ? 2 : 1);
  },
);
