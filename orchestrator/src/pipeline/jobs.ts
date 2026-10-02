// The job graph (framework + one job per segment), the scheduler, and one job's life:
// build → gates → [fail: exact gate output back to the same assignee, ≤ retries → escalate] → review → accept (commit).
import type {Job, JobStatus, Plan, Run, RunEvent, Usage} from '../types.ts';
import {resolveRole} from '../config.ts';
import {makeProvider} from '../providers/index.ts';
import {makeTools} from '../agent/tools.ts';
import {runAgent} from '../agent/loop.ts';
import type {Ledger} from '../budget.ts';
import {BUILDER_SYSTEM, feedbackSection, frameworkJobPrompt, reviewerPrompt, segmentJobPrompt, type JobSpec} from './prompts.ts';
import {runAllGates, snapshot, stillFrames, type Other, type Snapshot} from './gates.ts';
import {review} from './review.ts';
import {layout} from './scaffold.ts';
import type {RunGit} from './git.ts';
import type {Store} from './store.ts';

export type Deferred<T> = {promise: Promise<T>; resolve: (v: T) => void; reject: (e: unknown) => void};
export function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((a, b) => ((resolve = a), (reject = b)));
  promise.catch(() => {}); // an unobserved rejection (cancel) must not crash the process
  return {promise, resolve, reject};
}

export class Semaphore {
  private queue: (() => void)[] = [];
  private free: number;
  constructor(free: number) {
    this.free = free;
  }
  async acquire(): Promise<() => void> {
    if (this.free > 0) this.free--;
    else await new Promise<void>((r) => this.queue.push(r));
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.queue.shift();
      if (next) next();
      else this.free++;
    };
  }
}

export type HostWait = {submitted: Deferred<string | undefined>; done: Deferred<Job>};

// Everything a running run needs (owned by the orchestrator, one per active run).
export type RunCtx = {
  run: Run;
  plan: Plan;
  studioRoot: string;
  store: Store;
  git: RunGit | null;
  ledger: Ledger;
  abort: AbortController;
  sem: Semaphore;
  hostWaits: Map<string, HostWait>;
  bases: Map<string, Snapshot>; // jobId → snapshot at the start of its current attempt
  paused: Deferred<void> | null; // set while the run is paused on budget
  final: Deferred<void> | null; // set while the run waits for approve("final")
  save(): void;
  emit(type: RunEvent['type'], message: string, extra?: {jobId?: string; data?: unknown}): void;
};

// ── job graph ────────────────────────────────────────────────────────────────────────────────────
export function jobAllow(plan: Plan, segId?: string): string[] {
  const L = layout(plan.slug);
  return segId
    ? [`${L.src}/segments/${segId}/**`, `${L.scripts}/segments/${segId}.ts`, `${L.public}/${segId}/**`]
    : [`${L.src}/Reel.tsx`, `${L.src}/shell/**`, `${L.src}/intro/**`, `${L.src}/outro/**`, `${L.scripts}/music.ts`, `${L.scripts}/dsp.ts`, `${L.scripts}/check.ts`];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Commands a builder may run (shown in the prompt) + the allow-list regexes handed to the sandboxed tools.
export function jobCommands(plan: Plan, segId?: string): {shown: string[]; allow: RegExp[]} {
  const L = layout(plan.slug);
  const comp = segId ? L.segCompId : L.reelId;
  const props = segId ? ` --props=${L.scripts}/props/${segId}.json` : '';
  const shown = [
    'npx tsc --noEmit',
    `npx remotion still src/${plan.slug}/entry.ts ${comp} out/${plan.slug}/<name>.png --frame=<N>${props}`,
    ...(segId ? [`node ${L.scripts}/solo.ts ${segId}`, `ffmpeg -i ${L.out}/solo-${segId}.wav -af ebur128=peak=true -f null -`] : [`node ${L.scripts}/music.ts --lenient`, `node ${L.scripts}/music.ts`, `node ${L.scripts}/check.ts`, `ffmpeg -i ${L.public}/music.wav -af ebur128=peak=true -f null -`]),
    'ffprobe <file>',
  ];
  const s = esc(plan.slug);
  const allow = [
    /^npx tsc --noEmit( --pretty false)?$/,
    new RegExp(`^npx remotion still src/${s}/entry\\.ts ${esc(comp)} out/${s}/[\\w.-]+\\.(png|jpe?g)( --(frame=\\d+|scale=[\\d.]+${segId ? `|props=${esc(`${L.scripts}/props/${segId}.json`)}` : ''}))*$`),
    ...(segId
      ? [new RegExp(`^node ${esc(L.scripts)}/solo\\.ts ${segId}$`), new RegExp(`^ffmpeg -i ${esc(L.out)}/[\\w.-]+\\.wav -af ebur128=peak=true -f null -$`)]
      : [new RegExp(`^node ${esc(L.scripts)}/(music|check)\\.ts( --lenient)?$`), new RegExp(`^ffmpeg -i (${esc(L.public)}|${esc(L.out)})/[\\w.-]+\\.wav -af ebur128=peak=true -f null -$`)]),
    /^ffprobe( [\w./=:,-]+)+$/,
  ];
  return {shown, allow};
}

function gateList(plan: Plan, minScore: number, segId?: string): string[] {
  const f = stillFrames(plan, segId);
  const L = layout(plan.slug);
  return [
    '`ownership`: every file you changed matches your allowed paths (anything else is reverted and fails the job).',
    `\`typecheck\`: \`npx tsc --noEmit\` reports no errors in your files${segId ? ' (nor in the registry/compositions because of them)' : ''}.`,
    '`determinism`: no Math.random, Date.now, new Date( or performance.now in your files (comments are ignored).',
    `\`stills\`: ${f.compId}${f.props ? ` with props ${JSON.stringify(f.props)}` : ''} renders composition frames ${f.frames.join(', ')} (${f.labels.join(', ')}) without errors, none near-black (brightest luma < 48) or flat/empty.`,
    segId
      ? `\`sound\`: \`node ${L.scripts}/solo.ts ${segId}\` succeeds; the solo WAV peaks below −1 dBFS and measures −20…−12 LUFS integrated; every impact/hit in EVENTS has an onset within ±1 frame with a ≥ 6 dB jump.`
      : `\`sound\`: \`node ${L.scripts}/music.ts --lenient\` succeeds (−14 LUFS, true peak < −1 dBTP, exact length) and every FW_EVENTS impact/hit has an onset within ±1 frame in public/${plan.slug}/music.wav.`,
    `\`review\`: a reviewer scores your stills against the brief (pass ≥ ${minScore}/10).`,
  ];
}

export function makeJobs(run: Run, plan: Plan): Job[] {
  const cfg = run.config;
  const mk = (id: string, kind: 'framework' | 'segment', segId?: string): Job => {
    const cmd = jobCommands(plan, segId);
    const spec: JobSpec = {allow: jobAllow(plan, segId), commands: cmd.shown, gates: gateList(plan, cfg.gates.reviewMinScore, segId)};
    const seg = plan.segments.find((s) => s.id === segId);
    return {
      id,
      runId: run.id,
      kind,
      segmentId: segId,
      role: 'builder',
      assignee: cfg.roles.builder,
      allow: spec.allow,
      prompt: seg ? segmentJobPrompt(plan, seg, spec) : frameworkJobPrompt(plan, spec),
      status: 'queued',
      attempt: 0,
      gates: [],
      usage: {inTokens: 0, outTokens: 0, cachedInTokens: 0, costUSD: 0},
      stills: [],
      log: [],
    };
  };
  return [mk(`${run.id}-fw`, 'framework'), ...plan.segments.map((s) => mk(`${run.id}-s-${s.id}`, 'segment', s.id))];
}

const BUSY: JobStatus[] = ['waiting-host', 'building', 'gates', 'review', 'retrying', 'escalated'];
export const othersOf = (ctx: RunCtx, job: Job): Other[] => ctx.run.jobs.filter((j) => j.id !== job.id).map((j) => ({jobId: j.id, allow: j.allow, segId: j.segmentId}));

const addUsage = (u: Usage, v: Usage) => {
  u.inTokens += v.inTokens;
  u.outTokens += v.outTokens;
  u.cachedInTokens = (u.cachedInTokens ?? 0) + (v.cachedInTokens ?? 0);
  u.costUSD += v.costUSD;
};

export const budgetLeft = (ctx: RunCtx) => ctx.run.config.budgetUSD - ctx.ledger.spentUSD;

function pauseForBudget(ctx: RunCtx) {
  if (ctx.paused) return;
  ctx.paused = deferred<void>();
  ctx.run.status = 'paused-budget';
  ctx.emit('run', `paused: spent $${ctx.ledger.spentUSD.toFixed(4)} of the $${ctx.run.config.budgetUSD} budget. Raise budgetUSD (set_roles with runId) and approve "budget" to continue.`);
  ctx.save();
}

class Cancelled extends Error {}

// ── one job, start to finish ─────────────────────────────────────────────────────────────────────
export async function runJob(ctx: RunCtx, job: Job): Promise<void> {
  const basePrompt = job.prompt;
  let roleAttempts = 0;
  const set = (status: JobStatus, line?: string) => {
    job.status = status;
    if (line) job.log.push(line);
    ctx.emit('job', line ?? `${job.id} → ${status}`, {jobId: job.id, data: {status, attempt: job.attempt, role: job.role, assignee: job.assignee}});
    ctx.save();
  };
  const signal = ctx.abort.signal;
  const checkCancel = () => {
    if (signal.aborted) throw new Cancelled();
  };
  try {
    job.startedAt = new Date().toISOString();
    for (;;) {
      checkCancel();
      while (ctx.paused) await ctx.paused.promise;
      checkCancel();
      const cfg = ctx.run.config; // re-read: set_roles({runId}) may change roles or budget mid-run
      const perRole = 1 + Math.max(0, cfg.gates.retries);
      if (roleAttempts >= perRole) {
        const failedGates = job.gates.filter((g) => !g.ok).map((g) => g.gate).join(', ');
        if (job.role === 'builder') {
          const reset = ctx.git ? await ctx.git.reset(job.allow) : [];
          job.role = 'escalation';
          job.assignee = cfg.roles.escalation;
          job.claimedBy = undefined;
          roleAttempts = 0;
          job.prompt = `${basePrompt}\n\n## Note\nA previous builder failed this job ${perRole} time(s) (last failing gates: ${failedGates}). Its files were reset to the last good commit${reset.length ? ` (${reset.length} file(s))` : ''}; build the job properly from there.`;
          set('escalated', `escalated to ${job.assignee} after ${perRole} failed attempt(s) (${failedGates})`);
        } else {
          if (ctx.git) await ctx.git.reset(job.allow);
          job.endedAt = new Date().toISOString();
          set('failed', `failed after ${job.attempt} attempt(s) (${failedGates}); owned files reset to the last good commit`);
          return;
        }
      }
      job.attempt++;
      roleAttempts++;
      job.assignee = cfg.roles[job.role];
      const role = resolveRole(cfg, job.role);
      let release: (() => void) | undefined;
      try {
        if (role.kind === 'host') {
          // a connected agent does the work: wait for claim_job + submit_job
          ctx.bases.set(job.id, snapshot(ctx.studioRoot));
          const w: HostWait = {submitted: deferred(), done: deferred()};
          ctx.hostWaits.set(job.id, w);
          const onAbort = () => w.submitted.reject(new Cancelled());
          signal.addEventListener('abort', onAbort, {once: true});
          set('waiting-host', `attempt ${job.attempt}: waiting for a host worker (claim_job → edit files → submit_job)`);
          const note = await w.submitted.promise;
          signal.removeEventListener('abort', onAbort);
          if (note) job.log.push(`host note: ${note.slice(0, 500)}`);
          release = await ctx.sem.acquire();
        } else {
          release = await ctx.sem.acquire();
          checkCancel();
          if (budgetLeft(ctx) <= 0) {
            job.attempt--;
            roleAttempts--;
            pauseForBudget(ctx);
            continue;
          }
          ctx.bases.set(job.id, snapshot(ctx.studioRoot));
          set('building', `attempt ${job.attempt}: ${job.assignee} (${job.role}) building`);
          const tools = makeTools({studioRoot: ctx.studioRoot, allow: job.allow, commandAllow: jobCommands(ctx.plan, job.segmentId).allow, vision: role.info?.vision === true});
          let res: Awaited<ReturnType<typeof runAgent>>;
          try {
            res = await runAgent({
              provider: makeProvider(role.connection),
              model: role.model,
              price: role.info?.price,
              system: BUILDER_SYSTEM,
              task: job.prompt,
              tools,
              signal,
              budgetLeftUSD: () => budgetLeft(ctx),
              onEvent: (m) => ctx.emit('log', m, {jobId: job.id}),
            });
          } catch (e) {
            checkCancel();
            // the provider itself failed (network, daily limit, bad key): this assignee cannot do the job → escalate / fail
            roleAttempts = perRole;
            set('retrying', `attempt ${job.attempt}: ${job.assignee} failed: ${(e as Error).message.slice(0, 500)}`);
            continue;
          }
          addUsage(job.usage, res.usage);
          ctx.ledger.add(job.role, res.usage);
          ctx.run.spentUSD = ctx.ledger.spentUSD;
          ctx.emit('usage', `${job.id}: $${res.usage.costUSD.toFixed(4)} (${res.usage.inTokens} in / ${res.usage.outTokens} out), run total $${ctx.run.spentUSD.toFixed(4)}`, {jobId: job.id, data: {usage: res.usage, spentUSD: ctx.run.spentUSD}});
          job.log.push(`agent stopped by ${res.stoppedBy} after ${res.steps} step(s): ${res.finalText.slice(0, 300)}`);
          checkCancel();
          if (res.stoppedBy === 'budget') {
            // keep the files; this attempt does not count, the job resumes after approval
            job.attempt--;
            roleAttempts--;
            release();
            release = undefined;
            pauseForBudget(ctx);
            continue;
          }
        }

        // ── gates ──
        set('gates', `attempt ${job.attempt}: running gates`);
        const busy = ctx.run.jobs.some((j) => j.id !== job.id && BUSY.includes(j.status));
        const {results, stills} = await runAllGates({
          studioRoot: ctx.studioRoot,
          plan: ctx.plan,
          segId: job.segmentId,
          allow: job.allow,
          others: othersOf(ctx, job),
          othersBusy: busy,
          base: ctx.bases.get(job.id),
          stillsDir: ctx.store.dir(ctx.run.id, 'stills', job.id, `a${job.attempt}`),
          signal,
        });
        checkCancel();
        job.gates = results;
        job.stills = stills;
        for (const g of results) ctx.emit('gate', `${job.id} ${g.gate}: ${g.ok ? 'pass' : 'FAIL'}`, {jobId: job.id, data: g});
        let mustFix: string[] = [];
        if (results.every((g) => g.ok)) {
          set('review', `attempt ${job.attempt}: gates passed, reviewing`);
          const seg = ctx.plan.segments.find((s) => s.id === job.segmentId);
          const p = reviewerPrompt(ctx.plan, {kind: seg ? 'segment' : 'framework', seg, frames: stillFrames(ctx.plan, job.segmentId).labels});
          const out = await review({config: cfg, role: 'reviewer', system: p.system, task: p.task, stills, minScore: cfg.gates.reviewMinScore});
          if (out.usage) {
            ctx.ledger.add('reviewer', out.usage);
            ctx.run.spentUSD = ctx.ledger.spentUSD;
          }
          job.gates.push(out.gate);
          ctx.emit('gate', `${job.id} review: ${out.skipped ? 'skipped' : out.gate.ok ? 'pass' : 'FAIL'}`, {jobId: job.id, data: out.gate});
          if (out.gate.ok) {
            const sha = ctx.git ? await ctx.git.commit(job.allow, `mvo(${ctx.plan.slug}): accept ${job.kind}${job.segmentId ? ` ${job.segmentId}` : ''} (${job.assignee}, attempt ${job.attempt})`) : null;
            job.endedAt = new Date().toISOString();
            set('accepted', `accepted on attempt ${job.attempt}${sha ? ` → commit ${sha.slice(0, 10)}` : ''}`);
            return;
          }
          mustFix = out.verdict?.mustFix ?? [];
        }
        job.prompt = `${basePrompt}\n\n${feedbackSection(job.attempt, job.gates, mustFix)}`;
        set('retrying', `attempt ${job.attempt} rejected: ${job.gates.filter((g) => !g.ok).map((g) => g.gate).join(', ')}`);
      } finally {
        release?.();
        const w = ctx.hostWaits.get(job.id);
        if (w && (job.status !== 'waiting-host' || signal.aborted)) {
          ctx.hostWaits.delete(job.id);
          w.done.resolve(structuredClone(job));
        }
      }
    }
  } catch (e) {
    if (e instanceof Cancelled || signal.aborted) {
      job.endedAt = new Date().toISOString();
      set('cancelled', 'cancelled');
      return;
    }
    job.endedAt = new Date().toISOString();
    set('failed', `error: ${(e as Error).message}`);
  }
}

// All jobs of a run: framework + segments in parallel (API jobs share `gates.parallel` slots; host jobs wait for claims).
export async function runJobs(ctx: RunCtx): Promise<{failed: Job[]}> {
  await Promise.all(ctx.run.jobs.filter((j) => j.status !== 'accepted').map((j) => runJob(ctx, j)));
  return {failed: ctx.run.jobs.filter((j) => j.status !== 'accepted')};
}

// Host workers: hand out the next waiting job (a worker's own retries first).
export function claim(ctx: RunCtx, worker: string): Job | null {
  const waiting = ctx.run.jobs.filter((j) => j.status === 'waiting-host');
  const job = waiting.find((j) => j.claimedBy === worker) ?? waiting.find((j) => !j.claimedBy);
  if (!job) return null;
  job.claimedBy = worker;
  job.status = 'building';
  job.log.push(`claimed by ${worker} (attempt ${job.attempt})`);
  ctx.emit('job', `${job.id} claimed by ${worker}`, {jobId: job.id, data: {status: job.status}});
  ctx.save();
  return structuredClone(job);
}

export async function submit(ctx: RunCtx, jobId: string, note?: string): Promise<Job> {
  const w = ctx.hostWaits.get(jobId);
  const job = ctx.run.jobs.find((j) => j.id === jobId);
  if (!w || !job) throw new Error(`job ${jobId} is not waiting for a host submission (status: ${job?.status ?? 'unknown'})`);
  w.submitted.resolve(note);
  return w.done.promise;
}

