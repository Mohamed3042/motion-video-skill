// The facade every interface (MCP, HTTP API, CLI, dashboard) calls. One instance per process; runs persist under
// <repoRoot>/.motion/runs/. A started run executes in the background of THIS process (subscribe / status to follow it).
import path from 'node:path';
import type {Config, Estimate, GateResult, Job, Orchestrator, Plan, Run, RunEvent} from '../types.ts';
import {applyPreset, loadConfig, resolveRole, saveConfig, studioRoot as studioRootOf, validateRoles} from '../config.ts';
import {makeProvider} from '../providers/index.ts';
import {estimateRun, Ledger} from '../budget.ts';
import {Store} from './store.ts';
import {runDirector, validatePlan} from './plan.ts';
import {directorPlanPrompt} from './prompts.ts';
import {layout, scaffold} from './scaffold.ts';
import {claim, makeJobs, runJobs, Semaphore, submit, type RunCtx} from './jobs.ts';
import {renderStills, runAllGates, stillFrames} from './gates.ts';
import {integrate} from './integrate.ts';
import {RunGit} from './git.ts';
import {exec} from './exec.ts';

const ACTIVE_STATUSES = new Set<Run['status']>(['scaffolding', 'building', 'integrating', 'rendering', 'paused-budget']);

export async function createOrchestrator(o?: {configPath?: string}): Promise<Orchestrator> {
  const loaded = await loadConfig(o?.configPath);
  const cfgPath = loaded.path;
  const studio = studioRootOf(loaded.config, cfgPath);
  const top = await exec('git', ['rev-parse', '--show-toplevel'], {cwd: studio});
  const repoRoot = top.code === 0 ? path.resolve(top.out.trim()) : path.dirname(studio);
  const store = new Store(repoRoot);
  const active = new Map<string, RunCtx>();
  const running = new Map<string, Promise<void>>(); // background pipeline per active run
  const budgetApproved = new Set<string>();

  const getRun = (runId: string): Run => active.get(runId)?.run ?? store.load(runId);
  const emit = (runId: string, type: RunEvent['type'], message: string, extra?: {jobId?: string; data?: unknown}) => store.emit(runId, type, message, extra);
  const findJob = (jobId: string): {run: Run; job: Job; ctx?: RunCtx} => {
    for (const ctx of active.values()) {
      const job = ctx.run.jobs.find((j) => j.id === jobId);
      if (job) return {run: ctx.run, job, ctx};
    }
    const runId = jobId.replace(/-(fw|s-[a-z0-9]+)$/, '');
    const run = store.load(runId);
    const job = run.jobs.find((j) => j.id === jobId);
    if (!job) throw new Error(`unknown job "${jobId}"`);
    return {run, job};
  };
  const clone = <T>(x: T): T => structuredClone(x);

  function launch(run: Run, plan: Plan): void {
    const ctx: RunCtx = {
      run,
      plan,
      studioRoot: studio,
      store,
      git: null,
      ledger: new Ledger({director: {inTokens: 0, outTokens: 0, costUSD: run.spentUSD}}),
      abort: new AbortController(),
      sem: new Semaphore(Math.max(1, run.config.gates.parallel)),
      hostWaits: new Map(),
      bases: new Map(),
      paused: null,
      final: null,
      save: () => store.save(run),
      emit: (type, message, extra) => emit(run.id, type, message, extra),
    };
    active.set(run.id, ctx);
    run.status = 'scaffolding';
    run.error = undefined;
    run.jobs = makeJobs(run, plan);
    ctx.save();
    ctx.emit('run', 'started: scaffolding');
    const task = (async () => {
      const signal = ctx.abort.signal;
      try {
        try {
          ctx.git = await RunGit.open(studio, `mvo/${plan.slug}-${run.id}`, path.join(store.dir(run.id), 'git-index'));
        } catch (e) {
          ctx.emit('log', `git disabled: ${(e as Error).message}`);
        }
        if (ctx.git) run.branch = ctx.git.branch;
        else ctx.emit('log', 'not a git repository: no per-job commits or resets');
        const rootClean = ctx.git ? await ctx.git.clean('src/Root.tsx') : false;
        await scaffold({plan, studioRoot: studio, stillsDir: store.dir(run.id, 'stills', 'scaffold'), signal, onLog: (l) => ctx.emit('log', l)});
        if (ctx.git) {
          const L = layout(plan.slug);
          const sha = await ctx.git.commit([`${L.src}/**`, `${L.scripts}/**`, `${L.public}/**`, ...(rootClean ? ['src/Root.tsx'] : [])], `mvo(${plan.slug}): scaffold from plan (${run.id})`);
          ctx.emit('log', `scaffold committed on ${ctx.git.branch}${sha ? ` (${sha.slice(0, 10)})` : ''}${rootClean ? '' : '; src/Root.tsx has other uncommitted edits, so its registration lines are left uncommitted'}`);
        }
        if (signal.aborted) return;
        run.status = 'building';
        ctx.save();
        ctx.emit('run', `building: ${run.jobs.length} job(s), ${run.config.gates.parallel} parallel`);
        const {failed} = await runJobs(ctx);
        if (signal.aborted) return;
        if (failed.length) throw new Error(`job(s) not accepted: ${failed.map((j) => `${j.id} (${j.status})`).join(', ')}`);
        run.status = 'integrating';
        ctx.save();
        ctx.emit('run', 'integrating');
        run.output = await integrate(ctx, path.join(repoRoot, 'outputs'));
        run.status = 'done';
        ctx.save();
        ctx.emit('run', `done: ${run.output}`, {data: {output: run.output, spentUSD: run.spentUSD}});
      } catch (e) {
        if (signal.aborted) return;
        run.status = 'failed';
        run.error = (e as Error).message;
        ctx.save();
        ctx.emit('run', `failed: ${run.error}`);
      } finally {
        run.spentUSD = ctx.ledger.spentUSD;
        if (signal.aborted && run.status !== 'cancelled') run.status = 'cancelled';
        ctx.save();
        active.delete(run.id);
      }
    })();
    running.set(run.id, task);
    void task.finally(() => running.delete(run.id));
  }

  const orch: Orchestrator = {
    async plan(input) {
      const {config} = await loadConfig(cfgPath);
      let plan: Plan | undefined;
      if (input.plan) {
        const v = validatePlan(input.plan);
        if (!v.ok) throw new Error(`invalid plan:\n${v.errors.map((e) => `- ${e}`).join('\n')}`);
        plan = v.plan;
        if (plan.seconds !== input.seconds) throw new Error(`invalid plan: plan.seconds is ${plan.seconds} but ${input.seconds} s was requested`);
        if (input.format && plan.format !== input.format) throw new Error(`invalid plan: plan.format is ${plan.format} but ${input.format} was requested`);
      }
      const run: Run = {id: store.newRunId(), createdAt: new Date().toISOString(), idea: input.idea, status: 'planning', config, jobs: [], spentUSD: 0};
      if (!plan) {
        let hostDirector = false;
        try {
          hostDirector = resolveRole(config, 'director').kind === 'host';
        } catch {
          /* an unusable assignment: runDirector reports it */
        }
        if (hostDirector) {
          const p = directorPlanPrompt(input);
          throw new Error(`The director role is "host": write the plan yourself and call plan again with {plan: <Plan JSON>}.\n\n${p.task}`);
        }
        store.save(run);
        emit(run.id, 'run', `planning: ${input.idea}`);
        const ledger = new Ledger();
        try {
          plan = await runDirector({
            config,
            studioRoot: studio,
            input,
            onUsage: (u) => {
              ledger.add('director', u);
              run.spentUSD = ledger.spentUSD;
              emit(run.id, 'usage', `director: $${u.costUSD.toFixed(4)}`, {data: u});
            },
            onLog: (l) => emit(run.id, 'log', l),
            budgetLeftUSD: () => config.budgetUSD - ledger.spentUSD,
          });
        } catch (e) {
          run.status = 'failed';
          run.error = (e as Error).message;
          store.save(run);
          emit(run.id, 'run', `planning failed: ${run.error}`);
          throw e;
        }
      }
      run.plan = plan;
      run.jobs = makeJobs(run, plan);
      run.estimate = estimateRun(config, plan.segments.length);
      run.status = 'awaiting-approval';
      store.save(run);
      emit(run.id, 'run', `plan ready: "${plan.title}" (${plan.segments.length} segment(s)); estimate ${run.estimate.totalUSD === null ? 'unknown' : `$${run.estimate.totalUSD}`}, ~${run.estimate.totalMinutes} min. Approve to start.`, {data: {estimate: run.estimate}});
      return clone(run);
    },

    async estimate(runId) {
      const run = getRun(runId);
      const est: Estimate = estimateRun(run.config, run.plan?.segments.length ?? 0);
      run.estimate = est;
      store.save(run);
      return est;
    },

    async getConfig() {
      return (await loadConfig(cfgPath)).config;
    },

    async setRoles(input) {
      const run = input.runId ? getRun(input.runId) : undefined;
      let cfg: Config = run ? run.config : (await loadConfig(cfgPath)).config;
      if (input.preset) cfg = applyPreset(cfg, input.preset);
      if (input.roles) cfg = {...cfg, roles: {...cfg.roles, ...Object.fromEntries(Object.entries(input.roles).filter(([, v]) => v))}};
      if (input.budgetUSD !== undefined) cfg = {...cfg, budgetUSD: input.budgetUSD};
      if (input.models?.length) cfg = {...cfg, models: {...cfg.models, ...Object.fromEntries(input.models.map((m) => [m.ref, m]))}};
      if (run) {
        run.config = cfg;
        if (run.plan) run.estimate = estimateRun(cfg, run.plan.segments.length);
        store.save(run);
        emit(run.id, 'run', 'roles/budget updated for this run', {data: {roles: cfg.roles, budgetUSD: cfg.budgetUSD}});
      } else await saveConfig(cfg, cfgPath);
      return cfg;
    },

    async listModels(connectionId) {
      const {config} = await loadConfig(cfgPath);
      const c = config.connections[connectionId];
      if (!c) throw new Error(`unknown connection "${connectionId}" (known: ${Object.keys(config.connections).join(', ')})`);
      return makeProvider({...c, id: connectionId}).listModels();
    },

    async start(runId) {
      if (active.has(runId)) throw new Error(`run ${runId} is already running`);
      const run = store.load(runId);
      if (run.status !== 'awaiting-approval' || !run.plan) throw new Error(`run ${runId} is ${run.status}; only a planned run awaiting approval can start`);
      const clash = [...active.values()].find((c) => c.plan.slug === run.plan!.slug);
      if (clash) throw new Error(`run ${clash.run.id} is already building "${run.plan.slug}" in the studio; cancel it or use another slug`);
      const problems = validateRoles(run.config);
      if (problems.length) throw new Error(`fix the role setup first:\n${problems.map((p) => `- ${p}`).join('\n')}`);
      const est = estimateRun(run.config, run.plan.segments.length);
      if (est.withinBudget === false && !budgetApproved.has(runId))
        throw new Error(`the estimate ($${est.totalUSD}) exceeds the budget ($${run.config.budgetUSD}): raise budgetUSD with set_roles, or approve "budget" to start anyway (the run still pauses at the cap)`);
      launch(run, run.plan);
      return clone(run);
    },

    async status(runId) {
      return clone(getRun(runId));
    },

    async listRuns() {
      return store.list().map((r) => {
        const live = active.get(r.id)?.run ?? r;
        return {id: live.id, idea: live.idea, status: live.status, createdAt: live.createdAt, spentUSD: live.spentUSD, output: live.output};
      });
    },

    async claimJob(input) {
      const ctx = active.get(input.runId);
      if (!ctx) throw new Error(`run ${input.runId} is not running in this process (status: ${getRun(input.runId).status})`);
      return claim(ctx, input.worker);
    },

    async submitJob(input) {
      const {ctx} = findJob(input.jobId);
      if (!ctx) throw new Error(`job ${input.jobId} belongs to a run that is not running in this process`);
      return submit(ctx, input.jobId, input.note);
    },

    async runGates(jobId): Promise<GateResult[]> {
      const {run, job, ctx} = findJob(jobId);
      if (!run.plan) throw new Error('the run has no plan');
      const {results} = await runAllGates({
        studioRoot: studio,
        plan: run.plan,
        segId: job.segmentId,
        allow: job.allow,
        others: run.jobs.filter((j) => j.id !== job.id).map((j) => ({jobId: j.id, allow: j.allow, segId: j.segmentId})),
        othersBusy: !!ctx && ctx.run.jobs.some((j) => j.id !== job.id && !['accepted', 'failed', 'cancelled', 'queued'].includes(j.status)),
        base: ctx?.bases.get(jobId),
        stillsDir: store.dir(run.id, 'stills', jobId, 'dry-run'),
        dryRun: true,
      });
      return results;
    },

    async stills(jobId) {
      const {run, job} = findJob(jobId);
      if (job.stills.length) return job.stills;
      if (!run.plan) return [];
      const f = stillFrames(run.plan, job.segmentId);
      const r = await renderStills({studioRoot: studio, slug: run.plan.slug, compId: f.compId, props: f.props, frames: f.frames, outDir: store.dir(run.id, 'stills', jobId, 'preview')});
      if (!r.ok) throw new Error(r.details);
      return r.files;
    },

    async approve(input) {
      const ctx = active.get(input.runId);
      const run = getRun(input.runId);
      if (input.what === 'plan') {
        if (run.status !== 'awaiting-approval') throw new Error(`run ${run.id} is ${run.status}, not awaiting plan approval`);
        return orch.start(run.id);
      }
      if (input.what === 'budget') {
        if (run.status === 'awaiting-approval') {
          budgetApproved.add(run.id);
          return orch.start(run.id);
        }
        if (!ctx?.paused) throw new Error(`run ${run.id} is ${run.status}, not paused on budget`);
        const left = run.config.budgetUSD - ctx.ledger.spentUSD;
        if (left <= 0) throw new Error(`spent $${ctx.ledger.spentUSD.toFixed(4)} of $${run.config.budgetUSD}: raise budgetUSD first (set_roles with runId and budgetUSD), then approve "budget"`);
        const p = ctx.paused;
        ctx.paused = null;
        run.status = 'building';
        ctx.save();
        ctx.emit('run', `resumed with $${left.toFixed(4)} left`);
        p.resolve();
        return clone(run);
      }
      if (!ctx?.final) throw new Error(`run ${run.id} is ${run.status}, not waiting for final approval`);
      ctx.emit('run', 'final approved: rendering');
      ctx.final.resolve();
      return clone(run);
    },

    async cancel(runId) {
      const ctx = active.get(runId);
      const run = getRun(runId);
      if (ctx) {
        ctx.abort.abort();
        ctx.paused?.resolve();
        for (const w of ctx.hostWaits.values()) w.submitted.reject(new Error('cancelled'));
      } else if (ACTIVE_STATUSES.has(run.status)) {
        emit(run.id, 'log', 'run was not running in this process (interrupted); marking it cancelled');
      }
      if (!['done', 'failed', 'cancelled'].includes(run.status) || ctx) {
        run.status = 'cancelled';
        for (const j of run.jobs) if (!['accepted', 'failed'].includes(j.status)) j.status = 'cancelled';
        store.save(run);
        emit(run.id, 'run', 'cancelled');
      }
      // return once agents, gates and renders have actually stopped (child processes are killed on abort)
      const task = running.get(runId);
      if (task) await Promise.race([task, new Promise((r) => setTimeout(r, 60_000))]);
      return clone(run);
    },

    subscribe(runId, cb) {
      return store.subscribe(runId, cb);
    },
  };
  return orch;
}

// Resolve once a run needs nobody's attention anymore (or needs a human): done / failed / cancelled / paused on
// budget / waiting for the final approval. Handy for the CLI, which must keep the process alive while a run executes.
export function waitForRun(orch: Orchestrator, runId: string): Promise<Run> {
  return new Promise((resolve) => {
    let off = () => {};
    const check = async () => {
      const r = await orch.status(runId);
      if (['done', 'failed', 'cancelled', 'paused-budget'].includes(r.status) || r.error?.startsWith('awaiting final approval')) {
        off();
        resolve(r);
      }
    };
    off = orch.subscribe(runId, (e) => {
      if (e.type === 'run') void check();
    });
    void check();
  });
}
