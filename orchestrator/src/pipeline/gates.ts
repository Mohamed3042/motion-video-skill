// Deterministic gates, run by the orchestrator (never by the model): ownership, typecheck, determinism, stills, sound.
// Each returns a GateResult whose `details` is precise and actionable: it is pasted verbatim into the retry prompt.
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import type {GateResult, Plan} from '../types.ts';
import {matchGlob} from '../agent/tools.ts';
import {grid} from './plan.ts';
import {layout} from './scaffold.ts';
import {exec, node, studioBin, tail} from './exec.ts';

const any = (globs: string[], rel: string) => globs.some((g) => matchGlob(g, rel));

// ── snapshots: what a job changed (ownership) and how to put it back ───────────────────────────────
type Entry = {hash: string; data?: Buffer};
export type Snapshot = Map<string, Entry>;
const SKIP_DIRS = new Set(['node_modules', '.git', 'out', '.remotion', 'build', 'dist']);
const SKIP_EXT = /\.(wav|mp4|mov|webm)$/i; // generated media (gitignored, rewritten by scripts and gates)
const KEEP_BYTES = 5 * 1024 * 1024;

export function snapshot(studioRoot: string): Snapshot {
  const snap: Snapshot = new Map();
  const walk = (rel: string) => {
    for (const e of readdirSync(path.join(studioRoot, rel), {withFileTypes: true})) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(r);
      } else if (e.isFile() && !SKIP_EXT.test(e.name)) {
        const data = readFileSync(path.join(studioRoot, r));
        snap.set(r, {hash: createHash('sha1').update(data).digest('hex'), data: data.length <= KEEP_BYTES ? data : undefined});
      }
    }
  };
  walk('');
  return snap;
}

export function changedFiles(base: Snapshot, now: Snapshot): string[] {
  const out: string[] = [];
  for (const [p, e] of now) if (base.get(p)?.hash !== e.hash) out.push(p);
  for (const p of base.keys()) if (!now.has(p)) out.push(p);
  return out.sort();
}

export type Other = {jobId: string; allow: string[]; segId?: string};

// Files changed since the job's base must match its allow globs. Changes inside another job's globs are that job's
// (jobs run concurrently). Everything else is out of scope: reverted (unless dryRun) and the gate fails.
export function ownershipGate(o: {studioRoot: string; base: Snapshot; allow: string[]; others: Other[]; dryRun?: boolean}): GateResult & {changed: string[]} {
  const now = snapshot(o.studioRoot);
  const changed = changedFiles(o.base, now);
  const mine = changed.filter((p) => any(o.allow, p));
  const theirs = changed.filter((p) => !any(o.allow, p) && o.others.some((x) => any(x.allow, p)));
  const bad = changed.filter((p) => !mine.includes(p) && !theirs.includes(p));
  const lines: string[] = [];
  for (const p of bad) {
    const was = o.base.get(p);
    const abs = path.join(o.studioRoot, p);
    let what = !was ? 'created' : now.has(p) ? 'modified' : 'deleted';
    if (!o.dryRun) {
      if (!was) rmSync(abs, {force: true});
      else if (was.data) {
        mkdirSync(path.dirname(abs), {recursive: true});
        writeFileSync(abs, was.data);
      } else what += ' (too large to restore automatically!)';
    }
    lines.push(`- ${p} (${what}${o.dryRun ? '' : ', reverted'})`);
  }
  return {
    gate: 'ownership',
    ok: bad.length === 0,
    details: bad.length
      ? `You changed ${bad.length} file(s) outside the files you own:\n${lines.join('\n')}\nYou may only write: ${o.allow.join(', ')}. ${o.dryRun ? '' : 'These changes were reverted. '}Put the work inside your own files.`
      : `${mine.length} owned file(s) changed${mine.length ? `: ${mine.slice(0, 20).join(', ')}` : ''}; nothing outside the allowed paths.`,
    data: {changed: mine, outOfScope: bad},
    changed: mine,
  };
}

// ── typecheck ─────────────────────────────────────────────────────────────────────────────────────
export type TscError = {file: string; line: number; raw: string};
export async function typecheck(studioRoot: string, signal?: AbortSignal): Promise<{code: number; errors: TscError[]; out: string}> {
  const r = await studioBin(studioRoot, 'typescript/bin/tsc', ['--noEmit', '--pretty', 'false'], {signal, timeoutMs: 10 * 60_000});
  const errors: TscError[] = [];
  for (const line of r.out.split(/\r?\n/)) {
    const m = /^(.+?)\((\d+),\d+\): error TS\d+:/.exec(line);
    if (m) errors.push({file: m[1].replace(/\\/g, '/'), line: Number(m[2]), raw: line});
    else if (/^\s+\S/.test(line) && errors.length) errors[errors.length - 1].raw += `\n${line}`;
  }
  return {code: r.code, errors, out: r.out};
}

// Errors in this job's files fail it. Errors in other jobs' files (or naming another segment's folder) are theirs
// while they are still in progress; once no other job is in progress, any error under src/<slug>/ fails the job.
export async function typecheckGate(o: {studioRoot: string; slug: string; allow: string[]; others: Other[]; othersBusy: boolean; signal?: AbortSignal}): Promise<GateResult> {
  const tc = await typecheck(o.studioRoot, o.signal);
  const scope = tc.errors.filter((e) => e.file.startsWith(`src/${o.slug}/`));
  const counted = scope.filter((e) => {
    if (any(o.allow, e.file)) return true;
    if (!o.othersBusy) return true;
    const owner = o.others.find((x) => any(x.allow, e.file) || (x.segId && new RegExp(`[/'"]${x.segId}/`).test(e.raw)));
    return !owner;
  });
  if (tc.code !== 0 && tc.errors.length === 0)
    return {gate: 'typecheck', ok: false, details: `tsc failed without reporting errors:\n${tail(tc.out)}`};
  return {
    gate: 'typecheck',
    ok: counted.length === 0,
    details: counted.length
      ? `npx tsc --noEmit reports ${counted.length} error(s) you must fix:\n${counted.map((e) => e.raw).join('\n')}`
      : `no type errors in your files${scope.length > counted.length ? ` (${scope.length - counted.length} error(s) in other jobs' work-in-progress ignored)` : ''}`,
    data: {errors: counted.map((e) => e.raw)},
  };
}

// ── determinism ───────────────────────────────────────────────────────────────────────────────────
const BANNED = /Math\.random|Date\.now|new Date\(|performance\.now/;
export function determinismGate(o: {studioRoot: string; allow: string[]}): GateResult {
  const hits: string[] = [];
  for (const [rel] of snapshot(o.studioRoot)) {
    if (!/\.(m?[jt]sx?)$/.test(rel) || !any(o.allow, rel)) continue;
    // strip comments (keep line numbers) so "never use Math.random" in a comment is not a hit
    const src = readFileSync(path.join(o.studioRoot, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
    src.split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '');
      const m = BANNED.exec(code);
      if (m) hits.push(`${rel}:${i + 1}: ${m[0]}  →  ${line.trim().slice(0, 160)}`);
    });
  }
  return {
    gate: 'determinism',
    ok: hits.length === 0,
    details: hits.length
      ? `Banned non-deterministic calls (every frame and sample must derive from the frame number; use mulberry32(seed) from the timing module for randomness):\n${hits.join('\n')}`
      : 'no Math.random / Date.now / new Date( / performance.now in your files',
    data: {hits},
  };
}

// ── stills ────────────────────────────────────────────────────────────────────────────────────────
export async function renderStills(o: {studioRoot: string; slug: string; compId: string; props: Record<string, unknown> | null; frames: number[]; outDir: string; signal?: AbortSignal}) {
  mkdirSync(o.outDir, {recursive: true});
  const r = await node(o.studioRoot, `${layout(o.slug).scripts}/stills.ts`, [o.compId, o.outDir, o.props ? JSON.stringify(o.props) : '-', ...o.frames.map(String)], {signal: o.signal, timeoutMs: 15 * 60_000});
  const files = o.frames.map((f) => path.join(o.outDir, `${o.compId}-f${String(f).padStart(5, '0')}.png`));
  const missing = files.filter((f) => !existsSync(f));
  const ok = r.code === 0 && missing.length === 0;
  return {ok, files: ok ? files : files.filter((f) => existsSync(f)), details: ok ? `rendered ${files.length} still(s)` : `still render failed (exit ${r.code}):\n${tail(r.out, 5000)}`};
}

export async function frameStats(png: string): Promise<{yavg: number; ymin: number; ymax: number}> {
  const r = await exec('ffmpeg', ['-v', 'error', '-i', png, '-vf', 'signalstats,metadata=mode=print:file=-', '-f', 'null', '-'], {cwd: path.dirname(png)});
  const v = (k: string) => Number(new RegExp(`lavfi\\.signalstats\\.${k}=([\\d.]+)`).exec(r.out)?.[1] ?? NaN);
  return {yavg: v('YAVG'), ymin: v('YMIN'), ymax: v('YMAX')};
}

// Fixed frame set per job (composition frames): segments in their solo composition, the framework in the reel.
export function stillFrames(plan: Plan, segId?: string): {compId: string; props: Record<string, unknown> | null; frames: number[]; labels: string[]} {
  const g = grid(plan);
  const L = layout(plan.slug);
  if (segId) {
    const s = plan.segments.find((x) => x.id === segId)!;
    const len = s.endFrame - s.startFrame;
    const local = [...new Set([0.2, 0.5, 0.85].map((x) => Math.round(len * x)))];
    return {compId: L.segCompId, props: {id: segId}, frames: local.map((f) => f + g.pad), labels: local.map((f) => `${segId} local frame ${f}`)};
  }
  const frames = [Math.round(plan.intro.endFrame * 0.3), Math.round(plan.intro.endFrame * 0.75), Math.round((plan.outro.startFrame + g.duration) / 2)];
  return {compId: L.reelId, props: null, frames, labels: frames.map((f, i) => `${i < 2 ? 'intro' : 'outro'} frame ${f}`)};
}

export async function stillsGate(o: {studioRoot: string; plan: Plan; segId?: string; outDir: string; signal?: AbortSignal}): Promise<GateResult & {files: string[]}> {
  const fs = stillFrames(o.plan, o.segId);
  rmSync(o.outDir, {recursive: true, force: true});
  const r = await renderStills({studioRoot: o.studioRoot, slug: o.plan.slug, compId: fs.compId, props: fs.props, frames: fs.frames, outDir: o.outDir, signal: o.signal});
  if (!r.ok) return {gate: 'stills', ok: false, details: `${fs.compId}${fs.props ? ` ${JSON.stringify(fs.props)}` : ''} frames ${fs.frames.join(', ')}: ${r.details}`, files: r.files};
  const problems: string[] = [];
  const stats: Record<string, unknown>[] = [];
  for (const [i, f] of r.files.entries()) {
    const s = await frameStats(f);
    stats.push({frame: fs.frames[i], ...s});
    if (!(s.ymax >= 48)) problems.push(`${fs.labels[i]} (composition frame ${fs.frames[i]}) is near-black: brightest luma ${s.ymax} < 48`);
    else if (s.ymax - s.ymin < 10) problems.push(`${fs.labels[i]} (composition frame ${fs.frames[i]}) is empty: a flat single-color frame (luma ${s.ymin}–${s.ymax})`);
  }
  return {
    gate: 'stills',
    ok: problems.length === 0,
    details: problems.length
      ? `${problems.join('\n')}\nRender one yourself: npx remotion still src/${o.plan.slug}/entry.ts ${fs.compId} out/${o.plan.slug}/check.png --frame=<N>${fs.props ? ` --props=<json>` : ''}`
      : `rendered ${r.files.length} still(s) of ${fs.compId} at frames ${fs.frames.join(', ')}; none black or empty (YAVG ${stats.map((s) => Number(s.yavg).toFixed(0)).join('/')})`,
    data: {stats},
    files: r.files,
  };
}

// ── sound ─────────────────────────────────────────────────────────────────────────────────────────
export async function loudness(file: string): Promise<{lufs: number; peak: number}> {
  const r = await exec('ffmpeg', ['-nostats', '-hide_banner', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {cwd: path.dirname(file)});
  const summary = r.out.slice(r.out.lastIndexOf('Summary:'));
  return {lufs: Number(/I:\s+(-?[\d.]+|-inf) LUFS/.exec(summary)?.[1] ?? NaN), peak: Number(/Peak:\s+(-?[\d.]+|-inf) dBFS/.exec(summary)?.[1]?.replace('-inf', '-Infinity') ?? NaN)};
}

// Same algorithm as scripts/<slug>/check.ts: pre-emphasis, energy of 10 ms after vs 50→5 ms before, best within ±3 frames.
export async function onsetCheck(file: string, events: {f: number; what: string}[], fps: number, offsetSec = 0): Promise<{failed: number; lines: string[]}> {
  const SR = 44100;
  const pcm = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {maxBuffer: 1 << 30});
  if (pcm.status !== 0) return {failed: events.length, lines: [`ffmpeg could not decode ${file}`]};
  const x = new Float32Array(pcm.stdout.buffer, pcm.stdout.byteOffset, Math.floor(pcm.stdout.byteLength / 4));
  const cum = new Float64Array(x.length + 1);
  for (let n = 0; n < x.length; n++) {
    const y = x[n] - 0.97 * (n ? x[n - 1] : 0);
    cum[n + 1] = cum[n] + y * y;
  }
  const mean = (a: number, b: number) => (cum[Math.min(x.length, Math.max(0, b))] - cum[Math.min(x.length, Math.max(0, a))]) / Math.max(1, b - a);
  const ms = (v: number) => Math.round((v / 1000) * SR);
  const FRAME = SR / fps;
  let failed = 0;
  const lines: string[] = [];
  for (const e of [...events].sort((a, b) => a.f - b.f)) {
    const c = (offsetSec + e.f / fps) * SR;
    let best = {s: 0, ratio: 0};
    for (let s = Math.round(c - 3 * FRAME); s <= c + 3 * FRAME; s += 16) {
      const ratio = mean(s, s + ms(10)) / (mean(s - ms(50), s - ms(5)) + 1e-12);
      if (ratio > best.ratio) best = {s, ratio};
    }
    const off = (best.s - c) / FRAME;
    const db = 10 * Math.log10(best.ratio);
    const ok = Math.abs(off) <= 1 && db >= 6;
    if (!ok) failed++;
    lines.push(`${ok ? 'ok  ' : 'FAIL'} frame ${String(e.f).padStart(5)}  onset ${off >= 0 ? '+' : ''}${off.toFixed(2)} f  jump ${db.toFixed(1).padStart(5)} dB  ${e.what}`);
  }
  return {failed, lines};
}

// Read exports of a studio .ts module in a child process (builder code never runs inside the orchestrator).
export async function readModule<T>(studioRoot: string, rel: string, signal?: AbortSignal): Promise<T> {
  const code = 'const m = await import(process.argv[1]); console.log("@@" + JSON.stringify(m))';
  const r = await exec(process.execPath, ['--input-type=module', '-e', code, pathToFileURL(path.join(studioRoot, rel)).href], {cwd: studioRoot, signal, timeoutMs: 60_000});
  const line = r.out.split(/\r?\n/).find((l) => l.startsWith('@@'));
  if (r.code !== 0 || !line) throw new Error(`cannot import ${rel}:\n${tail(r.out, 3000)}`);
  return JSON.parse(line.slice(2)) as T;
}

type Ev = {f: number; kind: string};
const hitsOf = (events: Ev[]) => events.filter((e) => e.kind === 'impact' || e.kind === 'hit');

export async function segmentSoundGate(o: {studioRoot: string; plan: Plan; segId: string; signal?: AbortSignal}): Promise<GateResult> {
  const L = layout(o.plan.slug);
  const s = o.plan.segments.find((x) => x.id === o.segId)!;
  const len = s.endFrame - s.startFrame;
  const fail = (details: string, data?: unknown): GateResult => ({gate: 'sound', ok: false, details, data});
  let mod: {EVENTS?: Ev[]; HERO_FRAME?: number};
  try {
    mod = await readModule(o.studioRoot, `${L.src}/segments/${o.segId}/timing.ts`, o.signal);
  } catch (e) {
    return fail((e as Error).message);
  }
  const events = Array.isArray(mod.EVENTS) ? mod.EVENTS : [];
  const bad = events.filter((e) => !Number.isFinite(e.f) || e.f < 0 || e.f > len);
  if (!Array.isArray(mod.EVENTS)) return fail(`${L.src}/segments/${o.segId}/timing.ts must export EVENTS: WorldEvent[]`);
  if (bad.length) return fail(`EVENTS frames must be local frames in 0..${len}: ${bad.map((e) => e.f).join(', ')}`);
  const solo = await node(o.studioRoot, `${L.scripts}/solo.ts`, [o.segId], {signal: o.signal, timeoutMs: 10 * 60_000});
  const wav = path.join(o.studioRoot, L.out, `solo-${o.segId}.wav`);
  if (solo.code !== 0 || !existsSync(wav)) return fail(`node ${L.scripts}/solo.ts ${o.segId} failed (exit ${solo.code}):\n${tail(solo.out, 4000)}`);
  const {lufs, peak} = await loudness(wav);
  const problems: string[] = [];
  if (!(peak < -1)) problems.push(`peak ${peak} dBFS: must stay below -1 dBFS (aim for about -6; stage.ts's finish() limits it)`);
  if (!(lufs >= -20 && lufs <= -12)) problems.push(`integrated loudness ${lufs} LUFS: must be within -20..-12 LUFS (aim for -16)${lufs < -60 || !Number.isFinite(lufs) ? ': the segment is silent' : ''}`);
  const hits = hitsOf(events);
  const on = await onsetCheck(wav, hits.map((e) => ({f: e.f, what: `${e.kind} @${e.f}`})), o.plan.fps, 0.5);
  if (on.failed) problems.push(`${on.failed} of ${hits.length} impact/hit onset(s) missing or off by more than one frame (each needs a ≥ 6 dB jump over the 50 ms before, within ±1 frame of ctx.at(f)):\n${on.lines.join('\n')}`);
  return {
    gate: 'sound',
    ok: problems.length === 0,
    details: problems.length
      ? `${problems.join('\n')}\n(measure yourself: node ${L.scripts}/solo.ts ${o.segId} then ffmpeg -i ${L.out}/solo-${o.segId}.wav -af ebur128=peak=true -f null -)`
      : `solo ${lufs} LUFS, peak ${peak} dBFS, ${hits.length} impact/hit onset(s) on their frames`,
    data: {lufs, peak, onsets: on.lines},
  };
}

export async function frameworkSoundGate(o: {studioRoot: string; plan: Plan; signal?: AbortSignal}): Promise<GateResult> {
  const L = layout(o.plan.slug);
  const music = await node(o.studioRoot, `${L.scripts}/music.ts`, ['--lenient'], {signal: o.signal, timeoutMs: 15 * 60_000});
  if (music.code !== 0) return {gate: 'sound', ok: false, details: `node ${L.scripts}/music.ts --lenient failed (exit ${music.code}):\n${tail(music.out, 5000)}`};
  let fw: {FW_EVENTS?: {f: number; kind: string; what?: string}[]};
  try {
    fw = await readModule(o.studioRoot, `${L.src}/shell/timing.ts`, o.signal);
  } catch (e) {
    return {gate: 'sound', ok: false, details: (e as Error).message};
  }
  const events = hitsOf(fw.FW_EVENTS ?? []).map((e) => ({f: e.f, what: (e as {what?: string}).what ?? e.kind}));
  const on = await onsetCheck(path.join(o.studioRoot, L.public, 'music.wav'), events, o.plan.fps);
  return {
    gate: 'sound',
    ok: on.failed === 0,
    details: on.failed
      ? `${on.failed} of ${events.length} FW_EVENTS onset(s) missing or off by more than one frame in public/${o.plan.slug}/music.wav:\n${on.lines.join('\n')}`
      : `master ok (${music.out.split(/\r?\n/).filter((l) => /^(ffmpeg ebur128|\s+segments spread)/.test(l)).map((l) => l.trim()).join('; ')}); ${events.length} framework onset(s) on their frames`,
    data: {onsets: on.lines},
  };
}

// ── all gates for one job attempt ─────────────────────────────────────────────────────────────────
export type GateCtx = {
  studioRoot: string;
  plan: Plan;
  segId?: string; // undefined = framework job
  allow: string[];
  others: Other[];
  othersBusy: boolean;
  base?: Snapshot;
  stillsDir: string;
  dryRun?: boolean;
  signal?: AbortSignal;
};

export async function runAllGates(c: GateCtx): Promise<{results: GateResult[]; stills: string[]}> {
  const results: GateResult[] = [];
  if (c.base) results.push(ownershipGate({studioRoot: c.studioRoot, base: c.base, allow: c.allow, others: c.others, dryRun: c.dryRun}));
  else results.push({gate: 'ownership', ok: true, details: 'no base snapshot (job not started): ownership not checked'});
  const tc = await typecheckGate({studioRoot: c.studioRoot, slug: c.plan.slug, allow: c.allow, others: c.others, othersBusy: c.othersBusy, signal: c.signal});
  results.push(tc);
  results.push(determinismGate({studioRoot: c.studioRoot, allow: c.allow}));
  if (!tc.ok) return {results, stills: []}; // stills and sound would only repeat the type errors
  const st = await stillsGate({studioRoot: c.studioRoot, plan: c.plan, segId: c.segId, outDir: c.stillsDir, signal: c.signal});
  const {files, ...stGate} = st;
  results.push(stGate);
  results.push(c.segId ? await segmentSoundGate({studioRoot: c.studioRoot, plan: c.plan, segId: c.segId, signal: c.signal}) : await frameworkSoundGate({studioRoot: c.studioRoot, plan: c.plan, signal: c.signal}));
  return {results, stills: files};
}
