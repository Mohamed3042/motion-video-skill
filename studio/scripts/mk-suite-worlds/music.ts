// Master soundtrack for MK Suite - Every idea has a world → public/mk-suite-worlds/music.wav (44.1 kHz 16-bit stereo, exactly DURATION / FPS s).
// Renders the intro and outro, calls every segment's sound module (scripts/mk-suite-worlds/segments/<id>.ts) with a SynthCtx,
// adds a whoosh + thump on every section boundary, reverb on the send bus, matches each section's loudness,
// then masters to -14 LUFS integrated with true peak below -1 dBTP. Deterministic; safe to re-run.
// (Owned by the framework job; generalized from studio/scripts/mkv/music.ts.)
// Usage: node scripts/mk-suite-worlds/music.ts [--lenient]
//   --lenient: a segment module that throws is silenced and reported instead of failing, and the loudness spread
//   is reported, not asserted (used by the framework gate while segments are still being built).
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {BAR, BEAT, DURATION, FPS, INTRO, OUTRO, SEGMENTS} from '../../src/mk-suite-worlds/timing.ts';
import {BOUNDARIES, INTRO_HITS, FW_EVENTS} from '../../src/mk-suite-worlds/shell/timing.ts';
import type {SynthCtx} from './types.ts';
import * as D from './dsp.ts';

const LENIENT = process.argv.includes('--lenient');
const SR = D.SR;
const N = Math.round((DURATION / FPS) * SR);
const at = (f: number) => (f / FPS) * SR; // global frame → sample
const TARGET = -16; // per-section loudness before mastering (LUFS)
const WET = 2.0; // reverb return level
const MAX_ADJ = 15; // dB: hard limit on a section's matching gain; anything beyond ±6 dB is reported
const OUT = path.resolve(import.meta.dirname, '../../public/mk-suite-worlds/music.wav');

// ---------------- Intro: a pad swell, offbeat hats, a riser into the first segment (cut 60 ms early: suck-out) ----------------
function intro(o: D.Out) {
  const end = INTRO.end;
  D.pad(o, at(0), [57, 60, 64, 67, 71], end / FPS, 0.28, {lp0: 400, lp1: 2400, att: 0.5, rel: 0.15, send: 0.5});
  D.sub(o, at(0), 33, end / FPS - 0.1, 0.12);
  for (let f = 0; f < end; f += BEAT) D.hat(o, at(f + BEAT / 2), 0.08, false, 0.2);
  D.riser(o, at(Math.max(0, end - BAR)), at(end) - 0.06 * SR, 0.16, 400, 9000);
  INTRO_HITS.forEach(f=>{D.hit(o,at(f),.6);D.boom(o,at(f),.3,.8);});
  [69,72,76,79,81,84,88,91].forEach((m,i)=>D.bell(o,at(72+i*12),m,.04,.6,(i/7-.5),2,.6,.25));
}

// ---------------- Outro: impact on the end card, a held resolve chord with a long tail ----------------
function outro(o: D.Out) {
  const s = OUTRO.start;
  const hold = (DURATION - s) / FPS;
  D.boom(o, at(s), 0.8, 2.4);
  D.hit(o, at(s), 0.5);
  D.rhodesChord(o, at(s), [48, 55, 59, 62, 64], hold, 0.3, 0.5);
  D.pad(o, at(s), [48, 55, 59, 64], hold, 0.3, {lp0: 2600, lp1: 900, att: 0.04, rel: 0.6, send: 0.6});
}

// ---------------- Boundaries: a whoosh peaking on every boundary frame + a short impact ----------------
function boundaries(o: D.Out) {
  for (const b of BOUNDARIES) {
    D.whoosh(o, at(b), 0.17);
    D.thump(o, at(b), 0.5);
  }
}

// ---------------- stems ----------------
type Stem = {name: string; a: number; b: number; w0: number; dryL: Float32Array; dryR: Float32Array; wetL: Float32Array; wetR: Float32Array; silent: boolean; match: boolean; gain: number; err?: string};
const scratch = D.makeOut(N);
const problems: string[] = [];

async function makeStem(name: string, f0: number, f1: number, match: boolean, render: (o: D.Out) => void | Promise<void>): Promise<Stem> {
  for (const x of [scratch.L, scratch.R, scratch.sendL, scratch.sendR]) x.fill(0);
  let err: string | undefined;
  try {
    await render(scratch);
  } catch (e) {
    err = `${name}: sound module threw: ${(e as Error).message}`;
    problems.push(err);
    for (const x of [scratch.L, scratch.R, scratch.sendL, scratch.sendR]) x.fill(0);
  }
  let bad = 0;
  for (const x of [scratch.L, scratch.R, scratch.sendL, scratch.sendR])
    for (let i = 0; i < N; i++)
      if (!Number.isFinite(x[i])) {
        x[i] = 0;
        bad++;
      }
  if (bad) problems.push(`${name}: ${bad} NaN/Infinity samples zeroed`);
  const a = Math.round(at(f0));
  const b = Math.round(at(f1));
  const w0 = match ? Math.max(0, a - SR) : 0;
  const w1 = match ? Math.min(N, b + Math.round(3.5 * SR)) : N;
  let outside = 0;
  let inside = 0;
  for (const x of [scratch.L, scratch.R]) for (let i = 0; i < N; i++) (i < w0 || i >= w1 ? (outside += x[i] * x[i]) : (inside += x[i] * x[i]));
  if (outside > inside * 1e-5 && outside > 1e-6) problems.push(`${name}: sound outside its window [-1 s, +3.5 s] was dropped (${(10 * Math.log10(outside / inside)).toFixed(1)} dB re. inside)`);
  const [wetL, wetR] = D.freeverb(scratch.sendL.subarray(w0, w1), scratch.sendR.subarray(w0, w1));
  return {name, a, b, w0, dryL: Float32Array.from(scratch.L.subarray(w0, w1)), dryR: Float32Array.from(scratch.R.subarray(w0, w1)), wetL, wetR, silent: inside < 1e-9, match, gain: 1, err};
}

function mixStems(stems: Stem[]) {
  const L = new Float64Array(N);
  const R = new Float64Array(N);
  for (const s of stems) {
    if (s.silent) continue;
    const g = s.gain;
    for (let k = 0; k < s.dryL.length && s.w0 + k < N; k++) {
      L[s.w0 + k] += g * (s.dryL[k] + WET * s.wetL[k]);
      R[s.w0 + k] += g * (s.dryR[k] + WET * s.wetR[k]);
    }
  }
  return [L, R] as const;
}
const segLufs = (L: ArrayLike<number>, R: ArrayLike<number>, segs: {a: number; b: number}[]) => {
  const pl = D.kPrefix(L);
  const pr = D.kPrefix(R);
  return {all: D.lufsRange(pl, pr, 0, N), segs: segs.map((s) => D.lufsRange(pl, pr, s.a, s.b))};
};
const adjust = (s: Stem, measured: number, target: number) => {
  if (!Number.isFinite(measured)) return;
  const g = s.gain * 10 ** ((target - measured) / 20);
  const lim = 10 ** (MAX_ADJ / 20);
  s.gain = Math.min(lim, Math.max(1 / lim, g));
};

// ---------------- render ----------------
const stems: Stem[] = [];
stems.push(await makeStem('intro', INTRO.start, INTRO.end, true, intro));
for (const seg of SEGMENTS) {
  stems.push(
    await makeStem(seg.id, seg.start, seg.end, true, async (o) => {
      const mod = await import(pathToFileURL(path.join(import.meta.dirname, 'segments', `${seg.id}.ts`)).href);
      const ctx: SynthCtx = {SR, L: o.L, R: o.R, sendL: o.sendL, sendR: o.sendR, length: seg.end - seg.start, at: (f) => ((seg.start + f) / FPS) * SR};
      await mod.default(ctx);
    }),
  );
}
stems.push(await makeStem('outro', OUTRO.start, OUTRO.end, true, outro));
stems.push(await makeStem('boundaries', 0, DURATION, false, boundaries));
console.log(`synthesized ${stems.length} stems`);

// Loudness matching: one static gain per section (no gain steps inside a section, so no pumping), iterated
// on the full mix so neighbour tails, reverb and boundary whooshes are part of each section's measurement.
const matched = stems.filter((s) => s.match && !s.silent);
for (let it = 0; it < 5; it++) {
  const [L, R] = mixStems(stems);
  const m = segLufs(L, R, matched).segs;
  matched.forEach((s, i) => adjust(s, m[i], TARGET));
}

// ---------------- master ----------------
function master() {
  const [mL, mR] = mixStems(stems);
  const hp = [new D.BQ().set(1, 24, 0.7), new D.BQ().set(1, 24, 0.7)];
  const tail = Math.round(0.25 * SR);
  for (let i = 0; i < N; i++) {
    const fade = Math.min(1, (N - 1 - i) / tail); // guarantee silence at exactly the last sample
    mL[i] = hp[0].run(mL[i]) * fade;
    mR[i] = hp[1].run(mR[i]) * fade;
  }
  const pl = D.peakEnv(mL);
  const pr = D.peakEnv(mR);
  for (let i = 0; i < N; i++) pl[i] = Math.max(pl[i], pr[i]);
  let gain = 10 ** ((-14 - segLufs(mL, mR, []).all) / 20);
  let out = D.limit(mL, mR, pl, gain, -1.7);
  let loud = segLufs(out[0], out[1], []).all;
  for (let it = 0; it < 8 && Math.abs(loud + 14) > 0.03; it++) {
    gain *= 10 ** ((-14 - loud) / 20);
    out = D.limit(mL, mR, pl, gain, -1.7);
    loud = segLufs(out[0], out[1], []).all;
  }
  const tpl = D.peakEnv(out[0]);
  const tpr = D.peakEnv(out[1]);
  let tp = 0;
  for (let i = 0; i < N; i++) tp = Math.max(tp, tpl[i], tpr[i]);
  return {L: out[0], R: out[1], loud, tp: 20 * Math.log10(tp), gain};
}

let m = master();
// Verify the balance on the mastered result; one corrective pass if the limiter shifted any section.
const sectionLevels = () => {
  const r = segLufs(m.L, m.R, matched).segs;
  return matched.map((s, i) => ({s, l: r[i]}));
};
let seg = sectionLevels();
const segmentsOnly = () => seg.filter(({s}) => SEGMENTS.some((x) => x.id === s.name) && Number.isFinite(s.gain));
const spread = () => {
  const v = segmentsOnly().map((x) => x.l).filter(Number.isFinite);
  return v.length ? Math.max(...v) - Math.min(...v) : 0;
};
if (spread() > 0.6) {
  const med = seg.map((x) => x.l).sort((p, q) => p - q)[Math.floor(seg.length / 2)];
  for (const {s, l} of seg) adjust(s, l, med);
  m = master();
  seg = sectionLevels();
}

mkdirSync(path.dirname(OUT), {recursive: true});
D.writeWav(OUT, m.L, m.R);

// ---------------- report + verification ----------------
console.log(`\nsection loudness on the master (LUFS, gated; target spread ≤ 1.5 LU between segments):`);
for (const s of stems.filter((x) => x.match)) {
  const r = seg.find((x) => x.s === s);
  const gdb = 20 * Math.log10(s.gain);
  console.log(`  ${s.name.padEnd(12)} ${s.silent ? '   silent' : `${r!.l.toFixed(2).padStart(7)} LUFS   gain ${gdb >= 0 ? '+' : ''}${gdb.toFixed(1)} dB${Math.abs(gdb) >= MAX_ADJ - 0.01 ? '  (clamped!)' : Math.abs(gdb) > 6 ? '  (large: check this level)' : ''}`}${s.err ? '  ERROR' : ''}`);
}
console.log(`  segments spread: ${spread().toFixed(2)} LU (${segmentsOnly().length} non-silent segments)`);
console.log(`internal: integrated ${m.loud.toFixed(2)} LUFS, true peak ${m.tp.toFixed(2)} dBTP`);

const ff = spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-i', OUT, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'});
const summary = ff.stderr.slice(ff.stderr.lastIndexOf('Summary:'));
const I_ = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
const TP = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=sample_rate,channels,bits_per_sample:format=duration', '-of', 'default=nw=1', OUT], {encoding: 'utf8'}).stdout;
const dur = Number(/duration=([\d.]+)/.exec(probe)?.[1]);
console.log(`ffmpeg ebur128: integrated ${I_} LUFS, true peak ${TP} dBTP | ${probe.replace(/\s+/g, ' ').trim()}`);
console.log(`→ ${OUT}`);

for (const p of problems) console.warn(`WARN ${p}`);
assert.ok(Math.abs(I_ + 14) <= 0.5, `integrated loudness ${I_} LUFS is not about -14`);
assert.ok(TP < -1, `true peak ${TP} dBTP is not below -1 dBTP`);
assert.ok(Math.abs(dur - DURATION / FPS) < 0.001, `duration ${dur} s is not exactly ${DURATION / FPS} s`);
if (!LENIENT) {
  assert.ok(spread() <= 1.5, `segment loudness spread ${spread().toFixed(2)} LU exceeds ±1.5 LU`);
  assert.equal(problems.filter((p) => p.includes('threw')).length, 0, 'a segment sound module failed');
}
