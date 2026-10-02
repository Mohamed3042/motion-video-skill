// In-memory Orchestrator for interface tests and UI demos (`MVO_FAKE=1 node bin/mvo.ts dashboard`).
// Behaves like the real one from the outside: runs, jobs, gates, events, PNG stills, a fake MP4. No AI, no money.
import {mkdirSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {deflateSync, crc32} from 'node:zlib';
import {applyPreset, defaultConfig} from '../src/config.ts';
import {estimateRun} from '../src/budget.ts';
import {ROLES} from '../src/types.ts';
import type {GateResult, Job, Orchestrator, Plan, Run, RunEvent} from '../src/types.ts';

const MODEL_LISTS: Record<string, string[]> = {
  deepseek: ['deepseek-flash', 'deepseek-v4-pro'],
  'gemini-free': ['gemini-3.6-flash', 'gemini-3.6-flash-lite'],
  gemini: ['gemini-3.6-flash', 'gemini-3.6-pro'],
  openai: ['gpt-premium', 'gpt-mini'],
  anthropic: ['claude-premium'],
  xai: ['grok-4.7'],
  ollama: ['qwen-coder:14b'],
};

/** Minimal valid RGB PNG, solid color with a lighter band (so it is visibly an image). */
export function png(w: number, h: number, hex: string): Buffer {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) || 0);
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const band = y > h * 0.4 && y < h * 0.6;
    for (let x = 0; x < w; x++) {
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = band ? 255 - (255 - r) / 3 : r;
      raw[o + 1] = band ? 255 - (255 - g) / 3 : g;
      raw[o + 2] = band ? 255 - (255 - b) / 3 : b;
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const ACCENTS = ['#7c5cff', '#00c2a8', '#ff7a45', '#f7c948', '#3fa9f5', '#ff4f8b'];

function fakePlan(idea: string, seconds: number, format: Plan['format']): Plan {
  const fps = 60;
  const total = Math.round(seconds * fps);
  const n = Math.max(2, Math.round(seconds / 8));
  const intro = Math.round(total * 0.08);
  const outroStart = total - Math.round(total * 0.1);
  const step = (outroStart - intro) / n;
  const [width, height] = format === '9:16' ? [1080, 1920] : format === '1:1' ? [1080, 1080] : [1920, 1080];
  return {
    slug: 'fake-' + (idea.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'video'),
    title: idea.slice(0, 60),
    seconds, fps, format, width, height, bpm: 120,
    brand: {name: 'Fake Brand', colors: {bg: '#0b0d12', fg: '#f5f7fb'}, fonts: {display: 'Inter'}, facts: ['It is fast']},
    intro: {endFrame: intro, brief: 'Logo resolves out of particles.', music: 'Rising pad.'},
    outro: {startFrame: outroStart, brief: 'End card with tagline.', music: 'Final hit and tail.'},
    segments: Array.from({length: n}, (_, i) => ({
      id: `seg${i + 1}`,
      name: `Feature ${i + 1}`,
      startFrame: Math.round(intro + i * step),
      endFrame: Math.round(intro + (i + 1) * step),
      accent: ACCENTS[i % ACCENTS.length],
      brief: `World ${i + 1}: the feature appears as a glowing card, then expands into a full-screen demo.`,
      music: 'Pulsing synth bass, hit on every bar.',
      copy: [`Feature ${i + 1}`],
      entrance: i === 0 ? 'intro particles' : `portal from feature ${i}`,
      exit: `portal to ${i + 1 === n ? 'outro' : `feature ${i + 2}`}`,
    })),
    truthRules: ['Only show facts from brand.facts.'],
  };
}

export type FakeOptions = {dir?: string; tickMs?: number};

export function createFakeOrchestrator(opts: FakeOptions = {}): Orchestrator {
  const dir = resolve(opts.dir ?? process.env.MVO_FAKE_DIR ?? join(import.meta.dirname, '..', '..', '.motion', 'fake'));
  const tick = opts.tickMs ?? Number(process.env.MVO_FAKE_TICK ?? 400);
  let config = defaultConfig();
  const runs = new Map<string, Run & {approved?: boolean}>();
  const subs = new Map<string, Set<(e: RunEvent) => void>>();
  let seq = 0;
  const id = (p: string) => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}`;

  const emit = (runId: string, type: RunEvent['type'], message: string, jobId?: string, data?: unknown) => {
    const e: RunEvent = {t: new Date().toISOString(), runId, type, message, jobId, data};
    for (const cb of subs.get(runId) ?? []) cb(e);
  };
  const getRun = (runId: string) => {
    const r = runs.get(runId);
    if (!r) throw new Error(`Run "${runId}" not found. Call list_runs to see run ids.`);
    return r;
  };
  const findJob = (jobId: string) => {
    for (const r of runs.values()) {
      const j = r.jobs.find((x) => x.id === jobId);
      if (j) return {run: r, job: j};
    }
    throw new Error(`Job "${jobId}" not found.`);
  };
  const setJob = (run: Run, job: Job, status: Job['status'], line: string) => {
    job.status = status;
    job.log.push(line);
    emit(run.id, 'job', `${job.segmentId ?? job.kind}: ${line}`, job.id, {status});
  };

  const estimate = (run: Run) => estimateRun(run.config, run.plan?.segments.length ?? 0);

  const writeStills = (run: Run, job: Job) => {
    mkdirSync(join(dir, run.id), {recursive: true});
    const accent = run.plan?.segments.find((s) => s.id === job.segmentId)?.accent ?? '#5b6475';
    job.stills = [0, 1, 2].map((k) => {
      const p = join(dir, run.id, `${job.id}-${k}.png`);
      writeFileSync(p, png(160, 90, accent));
      return p;
    });
  };

  const gatesFor = (job: Job, failTypecheck = false): GateResult[] => [
    {gate: 'ownership', ok: true, details: `only ${job.allow.join(', ')} changed`},
    failTypecheck
      ? {gate: 'typecheck', ok: false, details: `src/${job.segmentId}/World.tsx(42,7): error TS2322: Type 'string' is not assignable to type 'number'.`}
      : {gate: 'typecheck', ok: true, details: 'tsc --noEmit: 0 errors'},
    {gate: 'determinism', ok: true, details: 'no Math.random / Date / performance.now'},
    {gate: 'stills', ok: true, details: '3 frames rendered, safe margin clear'},
    {gate: 'sound', ok: true, details: 'peak -1.4 dBFS, -14.2 LUFS, 8/8 onsets within ±1 frame'},
  ];

  const maybeFinish = (run: Run) => {
    if (run.status !== 'building' || !run.jobs.every((j) => j.status === 'accepted')) return;
    const steps: Array<[Run['status'], string]> = [['integrating', 'master mix + onset check'], ['rendering', 'rendering MP4'], ['done', 'delivered']];
    steps.forEach(([status, msg], k) =>
      setTimeout(() => {
        if (run.status === 'cancelled') return;
        run.status = status;
        if (status === 'done') {
          mkdirSync(join(dir, run.id), {recursive: true});
          run.output = join(dir, run.id, `${run.plan?.slug ?? 'video'}.mp4`);
          writeFileSync(run.output, Buffer.alloc(4096, 1)); // placeholder bytes, not a playable video
        }
        emit(run.id, 'run', `${status}: ${msg}`, undefined, {status});
      }, tick * (k + 1)),
    );
  };

  const accept = (run: Run, job: Job, costUSD: number) => {
    job.usage = {inTokens: job.usage.inTokens + 300_000, outTokens: job.usage.outTokens + 40_000, costUSD: job.usage.costUSD + costUSD};
    run.spentUSD += costUSD;
    emit(run.id, 'usage', `+$${costUSD.toFixed(3)}`, job.id, {spentUSD: run.spentUSD});
    job.gates.push({gate: 'review', ok: true, details: 'score 8/10: clear hierarchy, accent matches plan'});
    job.endedAt = new Date().toISOString();
    setJob(run, job, 'accepted', 'accepted, committed');
    maybeFinish(run);
  };

  // Auto worker: building → gates (segment 2 fails typecheck once) → retrying → … → review → accepted.
  const simulate = (run: Run, job: Job) => {
    const failFirst = job.segmentId === 'seg2';
    const steps: Array<() => void> = [
      () => setJob(run, job, 'building', `building with ${job.assignee}`),
      () => {
        writeStills(run, job);
        job.gates = gatesFor(job, failFirst && job.attempt === 1);
        setJob(run, job, 'gates', 'gates ran');
        emit(run.id, 'gate', `${job.segmentId ?? job.kind}: gates ${job.gates.every((g) => g.ok) ? 'passed' : 'FAILED'}`, job.id, job.gates);
      },
      () => {
        if (job.gates.some((g) => !g.ok)) {
          job.attempt++;
          setJob(run, job, 'retrying', 'typecheck failed, sending the error back to the builder');
          setTimeout(() => run.status === 'building' && simulate(run, job), tick);
          return;
        }
        setJob(run, job, 'review', 'reviewer scoring stills');
        const free = run.config.connections[job.assignee.split('/')[0]]?.free;
        setTimeout(() => run.status === 'building' && accept(run, job, free ? 0 : 0.004 + job.attempt * 0.002), tick);
      },
    ];
    steps.forEach((s, k) => setTimeout(() => run.status === 'building' && s(), tick * (k + 1) + Math.random() * tick));
  };

  const orch: Orchestrator = {
    async plan(input) {
      const format = input.format ?? '16:9';
      const plan = (input.plan as Plan | undefined) ?? fakePlan(input.idea, input.seconds, format);
      const run: Run = {
        id: id('run'),
        createdAt: new Date().toISOString(),
        idea: input.idea,
        status: 'awaiting-approval',
        plan,
        config: structuredClone(config),
        jobs: [],
        spentUSD: 0,
      };
      run.estimate = estimate(run);
      runs.set(run.id, run);
      emit(run.id, 'run', 'plan ready, awaiting approval', undefined, {status: run.status});
      return run;
    },
    async estimate(runId) {
      const run = getRun(runId);
      return (run.estimate = estimate(run));
    },
    async getConfig() {
      return structuredClone(config);
    },
    async setRoles(input) {
      const target = input.runId ? getRun(input.runId) : undefined;
      if (target && target.status !== 'awaiting-approval') throw new Error(`Run ${target.id} already started; roles are fixed.`);
      let c = target ? target.config : config;
      if (input.preset) c = applyPreset(c, input.preset);
      if (target) target.config = c;
      else config = c;
      for (const r of ROLES) {
        const v = input.roles?.[r];
        if (v !== undefined) {
          if (v !== 'host' && !c.connections[v.split('/')[0]]) throw new Error(`Unknown connection in "${v}" for ${r}.`);
          c.roles[r] = v;
        }
      }
      if (input.budgetUSD !== undefined) c.budgetUSD = input.budgetUSD;
      for (const m of input.models ?? []) c.models[m.ref] = {...c.models[m.ref], ...m};
      if (target) target.estimate = estimate(target);
      return structuredClone(c);
    },
    async listModels(connectionId) {
      const conn = config.connections[connectionId];
      if (!conn) throw new Error(`Unknown connection "${connectionId}". Known: ${Object.keys(config.connections).join(', ')}`);
      if (conn.kind === 'mcp-host') return [];
      return MODEL_LISTS[connectionId] ?? [];
    },
    async start(runId) {
      const run = getRun(runId);
      if (run.status !== 'awaiting-approval') throw new Error(`Run ${runId} is ${run.status}; only awaiting-approval runs can start.`);
      if (!run.approved) throw new Error(`Approve the plan first: approve {runId: "${runId}", what: "plan"}.`);
      run.status = 'building';
      const studioJob = (kind: Job['kind'], segmentId?: string): Job => {
        const assignee = run.config.roles.builder;
        return {
          id: id('job'), runId, kind, segmentId, role: 'builder', assignee,
          allow: [segmentId ? `src/${run.plan!.slug}/worlds/${segmentId}/**` : `src/${run.plan!.slug}/framework/**`],
          prompt: `# Build ${segmentId ?? 'the framework'}\n\nFollow the plan. Edit only the allowed files.\n`,
          status: assignee === 'host' ? 'waiting-host' : 'queued',
          attempt: 1, gates: [], usage: {inTokens: 0, outTokens: 0, costUSD: 0}, stills: [], log: ['created'],
          startedAt: new Date().toISOString(),
        };
      };
      run.jobs = [studioJob('framework'), ...run.plan!.segments.map((s) => studioJob('segment', s.id))];
      emit(run.id, 'run', `building: ${run.jobs.length} jobs`, undefined, {status: run.status});
      for (const j of run.jobs) if (j.status === 'queued') simulate(run, j);
      return run;
    },
    async status(runId) {
      return getRun(runId);
    },
    async listRuns() {
      return [...runs.values()].reverse().map(({id, idea, status, createdAt, spentUSD, output}) => ({id, idea, status, createdAt, spentUSD, output}));
    },
    async claimJob({runId, worker}) {
      const run = getRun(runId);
      const job = run.jobs.find((j) => j.status === 'waiting-host' && !j.claimedBy);
      if (!job) return null;
      job.claimedBy = worker;
      setJob(run, job, 'building', `claimed by ${worker}`);
      return job;
    },
    async submitJob({jobId, note}) {
      const {run, job} = findJob(jobId);
      if (!job.claimedBy) throw new Error(`Job ${jobId} was not claimed; call claim_job first.`);
      if (note) job.log.push(`note: ${note}`);
      writeStills(run, job);
      job.gates = gatesFor(job);
      emit(run.id, 'gate', `${job.segmentId ?? job.kind}: gates passed`, job.id, job.gates);
      accept(run, job, 0);
      return job;
    },
    async runGates(jobId) {
      return gatesFor(findJob(jobId).job);
    },
    async stills(jobId) {
      return findJob(jobId).job.stills;
    },
    async approve({runId, what}) {
      const run = getRun(runId);
      if (what === 'plan') run.approved = true;
      if (what === 'budget' && run.status === 'paused-budget') run.status = 'building';
      emit(run.id, 'run', `approved ${what}`);
      return run;
    },
    async cancel(runId) {
      const run = getRun(runId);
      run.status = 'cancelled';
      for (const j of run.jobs) if (j.status !== 'accepted') j.status = 'cancelled';
      emit(run.id, 'run', 'cancelled', undefined, {status: run.status});
      return run;
    },
    subscribe(runId, cb) {
      let set = subs.get(runId);
      if (!set) subs.set(runId, (set = new Set()));
      set.add(cb);
      return () => set.delete(cb);
    },
  };
  return orch;
}
