// Master soundtrack for MK Voice — Nine Worlds → public/mkv/music.wav (44.1 kHz 16-bit stereo, exactly 90.0 s).
// Renders the Intro and Finale, calls every world's sound module (scripts/mkv/worlds/<id>.ts) with a SynthCtx,
// adds a whoosh + short impact on every portal boundary, reverb on the send bus, matches each section's loudness,
// then masters to -14 LUFS integrated with true peak below -1 dBTP. Deterministic; safe to re-run.
// Usage: node scripts/mkv/music.ts
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {DURATION, FPS, INTRO, WORLDS} from '../../src/mkv/timing.ts';
import {BOUNDARIES, SECTIONS} from '../../src/mkv/shell/timing.ts';
import * as I from '../../src/mkv/intro/timing.ts';
import * as F from '../../src/mkv/finale/timing.ts';
import type {SynthCtx} from './types.ts';
import * as D from './dsp.ts';

const SR = D.SR;
const N = Math.round((DURATION / FPS) * SR); // 3,969,000
const at = (f: number) => (f / FPS) * SR; // global frame → sample
const TARGET = -16; // per-section loudness before mastering (LUFS)
const WET = 2.0; // reverb return level
const MAX_ADJ = 15; // dB: hard limit on a section's matching gain; anything beyond ±6 dB is reported (the world strayed from -16 LUFS)
const OUT = path.resolve(import.meta.dirname, '../../public/mkv/music.wav');

// ---------------- Intro (0–6 s): sub impact, string hum, nine plinks, Shepard riser, title hit, first groove ----------------
function intro(o: D.Out) {
  D.boom(o, at(I.IGNITE), 0.95);
  // ignite zing: bright noise sweeping down as the line runs out to the edges
  const zing = new D.BQ();
  D.put(o, at(I.IGNITE), 0.7, 0, 0.45, (t, r) => {
    if ((Math.round(t * SR) & 15) === 0) zing.set(2, 9000 * 0.25 ** Math.min(1, t / 0.5), 3);
    return 0.35 * zing.run(r() * 2 - 1) * Math.exp(-t / 0.18);
  });
  // the line's hum: a string tone that starts vibrating (FM index + vibrato grow with the waveform)
  const humDur = (I.TITLE + 20 - I.IGNITE) / FPS;
  for (const [m, pan] of [[45, -0.3], [57, 0.3]] as const) {
    const f = D.mtof(m);
    let ph = 0;
    D.put(o, at(I.IGNITE), humDur, pan, 0.3, (t) => {
      const g = I.IGNITE + t * FPS;
      const vib = 0.012 * Math.min(1, Math.max(0, (g - I.WAVE[0]) / 60));
      ph += (f * (1 + vib * Math.sin(D.TAU * 5.5 * t))) / SR;
      const beta = 0.4 + 2.2 * Math.min(1, Math.max(0, (g - I.WAVE[0]) / (I.WAVE[1] - I.WAVE[0])));
      const env = Math.min(1, t / 0.04) * (g > I.TITLE - 30 ? Math.max(0, 1 - (g - (I.TITLE - 30)) / 50) : 1);
      return 0.085 * env * Math.sin(D.TAU * ph + beta * Math.sin(D.TAU * 2 * ph));
    });
  }
  // nine strands split: one glass plink per world, left → right
  const penta = [69, 72, 74, 76, 79, 81, 84, 86, 88];
  WORLDS.forEach((_, i) => D.bell(o, at(I.SPLIT[0] + 2 + i * 3), penta[i], 0.07, 1.3, -0.8 + i * 0.2, 3.01, 1.1, 0.55));
  // rings form: a slow Am9 swell
  D.pad(o, at(I.CURL[0] - 8), [57, 60, 64, 67, 71], (I.RISER[1] - I.CURL[0] + 8) / FPS, 0.3, {lp0: 350, lp1: 2600, att: 1.1, rel: 0.25, send: 0.5});
  // Shepard–Risset riser 1.0 → 5.8 s (accelerating), with a noise riser on top; hard cut before the portal
  D.shepard(o, at(I.RISER[0]), at(I.RISER[1]), 0.26, {center: 520, rate0: 0.25, rate1: 1.5, env: (u) => 0.12 + 0.88 * u ** 1.5});
  D.riser(o, at(240), at(I.RISER[1]), 0.14, 400, 11000);
  // title slam (f180): hit + boom + Am9 Rhodes + shimmer
  D.hit(o, at(I.TITLE), 0.9);
  D.boom(o, at(I.TITLE), 0.5, 2.2);
  D.rhodesChord(o, at(I.TITLE), [45, 57, 60, 64, 67, 71], 1.6, 0.42);
  [81, 84, 88, 91].forEach((m, j) => D.bell(o, at(I.TITLE) + j * 0.022 * SR, m, 0.05, 2.6, j % 2 ? 0.55 : -0.55, 2, 1.1, 0.75));
  // the 120 BPM pulse starts under the title
  for (let f = I.TITLE; f < INTRO.end; f += 30) {
    if (f > I.TITLE) D.kick(o, at(f), 0.5);
    D.hat(o, at(f + 15), 0.12, false, 0.25);
    D.hat(o, at(f + 7.5), 0.05, false, -0.2);
    D.hat(o, at(f + 22.5), 0.05, false, -0.2);
  }
  D.sub(o, at(I.TITLE), 33, (I.RISER[1] - I.TITLE) / FPS, 0.17);
  // tagline (f270): "one voice" — two bell notes
  D.bell(o, at(I.TAGLINE), 76, 0.09, 1.6, -0.2, 2, 0.8, 0.5);
  D.bell(o, at(I.TAGLINE + 15), 81, 0.09, 2.2, 0.2, 2, 0.8, 0.5);
}

// ---------------- Finale (77–90 s): full theme montage, converge riser, boom, held resolve chord ----------------
function finale(o: D.Out) {
  const M0 = F.MONTAGE;
  const chords = [
    [45, 55, 59, 60, 64], // Am9
    [41, 52, 57, 60, 67], // Fmaj9
    [43, 50, 52, 55, 59], // G6
  ];
  const roots = [33, 29, 31];
  const chordAt = (k: number) => (k < 4 ? 0 : k < 8 ? 1 : 2);
  // downbeat: boom under the portal flash
  D.boom(o, at(M0), 0.55, 2.2);
  D.hit(o, at(M0), 0.55);
  // Rhodes chords (bar downbeats) + offbeat stabs, a warm pad, Shepard shimmer on top
  D.rhodesChord(o, at(M0), chords[0], 2, 0.42);
  D.rhodesChord(o, at(M0 + 120), chords[1], 2, 0.42);
  D.rhodesChord(o, at(M0 + 240), chords[2], 1, 0.42);
  D.pad(o, at(M0), [57, 60, 64, 67], 2, 0.16, {lp0: 900, lp1: 2600, att: 0.1, rel: 0.2, send: 0.5});
  D.pad(o, at(M0 + 120), [53, 57, 60, 64], 2, 0.16, {lp0: 1200, lp1: 3000, att: 0.05, rel: 0.2, send: 0.5});
  D.pad(o, at(M0 + 240), [55, 59, 62, 64], 1, 0.16, {lp0: 1500, lp1: 4000, att: 0.05, rel: 0.3, send: 0.5});
  D.shepard(o, at(M0), at(F.LOGO_LOCK - 5), 0.07, {center: 1700, sigma: 1.1, rate0: 0.5, rate1: 1.6, env: (u) => 0.4 + 0.6 * u, send: 0.6});
  // house groove: four on the floor, claps on 2 & 4, offbeat open hats, 16th ticks, offbeat bass
  const penta = [69, 72, 74, 76, 79, 81, 84, 86, 88];
  F.MONTAGE_BEATS.forEach((f, k) => {
    D.kick(o, at(f), 0.62);
    if (k % 2) D.clap(o, at(f), 0.42);
    D.hat(o, at(f + 15), 0.16, true, 0.3);
    D.hat(o, at(f + 7.5), 0.06, false, -0.25);
    D.hat(o, at(f + 22.5), 0.06, false, -0.25);
    D.bassPulse(o, at(f + 15), roots[chordAt(k)], 0.2, 0.3);
    D.rhodesChord(o, at(f + 15), chords[chordAt(k)].slice(-3).map((m) => m + 12), 0.12, 0.16, 0.25);
    // portal hit + this world's note in the motif
    if (k > 0) D.hit(o, at(f), 0.42);
    D.bell(o, at(f), penta[k], 0.08, 0.9, -0.6 + k * 0.15, 2, 0.9, 0.45);
  });
  // chip-lead flourish over the last bar of the montage
  const arp = [69, 72, 76, 79, 81, 84, 88, 91];
  for (let j = 0; j < 16; j++) D.square(o, at(M0 + 150 + j * 7.5), arp[j % 8] + (j >= 8 ? 0 : 0), 0.07, 0.05, 0.25, j % 2 ? 0.4 : -0.4, 0.2);
  // converge (81.5–82 s): drums out, riser, suck-out 2 frames before the lock
  D.riser(o, at(F.CONVERGE - 30), at(F.LOGO_LOCK - 5), 0.32, 300, 12000);
  D.sub(o, at(F.CONVERGE), 31, (F.LOGO_LOCK - 2 - F.CONVERGE) / FPS - 0.15, 0.12);
  // logo lock (82 s): big boom + shimmer, then the held Cmaj9 resolve with a long tail
  D.boom(o, at(F.LOGO_LOCK), 1, 3.6);
  D.hit(o, at(F.LOGO_LOCK), 0.6);
  [84, 88, 91, 95, 98].forEach((m, j) => D.bell(o, at(F.LOGO_LOCK) + j * 0.022 * SR, m, 0.06, 3.4, j % 2 ? 0.55 : -0.55, 2, 1.1, 0.8));
  const hold = (F.FADE - F.LOGO_LOCK) / FPS;
  D.pad(o, at(F.LOGO_LOCK), [48, 55, 59, 62, 64, 67], hold, 0.42, {lp0: 3000, lp1: 1100, att: 0.04, rel: 1.4, send: 0.65});
  D.sub(o, at(F.LOGO_LOCK), 36, hold, 0.17);
  D.rhodesChord(o, at(F.LOGO_LOCK), [48, 55, 59, 62, 64], 3, 0.32, 0.5);
  // end-card lines: one soft bell each, then a last Rhodes resolve under the fade
  F.LINES.forEach((f, i) => D.bell(o, at(f), [76, 79, 81, 84, 88][i], 0.075, 2.4, -0.3 + i * 0.15, 2, 0.7, 0.65));
  D.rhodesChord(o, at(F.LINES[4] + 60), [60, 64, 67, 71, 74], 2.6, 0.22, 0.6);
}

// ---------------- Portals: a whoosh peaking on every boundary frame + a short impact ----------------
function portals(o: D.Out) {
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
    for (let k = 0; k < s.dryL.length; k++) {
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
  const g = s.gain * 10 ** ((target - measured) / 20);
  const lim = 10 ** (MAX_ADJ / 20);
  s.gain = Math.min(lim, Math.max(1 / lim, g));
};

// ---------------- render ----------------
const t0 = performance.now(); // timing report only (does not affect the audio)
const stems: Stem[] = [];
stems.push(await makeStem('intro', INTRO.start, INTRO.end, true, intro));
for (const w of WORLDS) {
  stems.push(
    await makeStem(w.id, w.start, w.end, true, async (o) => {
      const mod = await import(`./worlds/${w.id}.ts`);
      const ctx: SynthCtx = {SR, L: o.L, R: o.R, sendL: o.sendL, sendR: o.sendR, length: w.end - w.start, at: (f) => ((w.start + f) / FPS) * SR};
      await mod.default(ctx);
    }),
  );
}
stems.push(await makeStem('finale', F.MONTAGE, SECTIONS[SECTIONS.length - 1].end, true, finale));
const fx = await makeStem('portals', 0, DURATION, false, portals);
stems.push(fx);
console.log(`synthesized ${stems.length} stems in ${((performance.now() - t0) / 1000).toFixed(1)} s`);

// Loudness matching: one static gain per section (no gain steps inside a section, so no pumping), iterated
// on the full mix so neighbour tails, reverb and portal whooshes are part of each section's measurement.
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
    const fade = Math.min(1, (N - 1 - i) / tail); // guarantee silence at exactly 90.0 s
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
const worldSegs = () => {
  const r = segLufs(m.L, m.R, matched).segs;
  return matched.map((s, i) => ({s, l: r[i]}));
};
let seg = worldSegs();
const worldsOnly = () => seg.filter(({s}) => WORLDS.some((w) => w.id === s.name));
const spread = () => {
  const v = worldsOnly().map((x) => x.l);
  return v.length ? Math.max(...v) - Math.min(...v) : 0;
};
if (spread() > 0.6) {
  const med = seg.map((x) => x.l).sort((p, q) => p - q)[Math.floor(seg.length / 2)];
  for (const {s, l} of seg) adjust(s, l, med);
  m = master();
  seg = worldSegs();
}

D.writeWav(OUT, m.L, m.R);

// ---------------- report + verification ----------------
console.log(`\nsection loudness on the master (LUFS, gated; target spread ≤ 1.5 LU between worlds):`);
for (const s of stems.filter((x) => x.match)) {
  const r = seg.find((x) => x.s === s);
  const gdb = 20 * Math.log10(s.gain);
  console.log(`  ${s.name.padEnd(10)} ${s.silent ? '   silent (placeholder)' : `${r!.l.toFixed(2).padStart(7)} LUFS   gain ${gdb >= 0 ? '+' : ''}${gdb.toFixed(1)} dB${Math.abs(gdb) >= MAX_ADJ - 0.01 ? '  (clamped!)' : Math.abs(gdb) > 6 ? '  (large: check this level)' : ''}`}${s.err ? '  ERROR' : ''}`);
}
console.log(`  worlds spread: ${spread().toFixed(2)} LU (${worldsOnly().length} non-silent worlds)`);
console.log(`internal: integrated ${m.loud.toFixed(2)} LUFS, true peak ${m.tp.toFixed(2)} dBTP`);

const ff = spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-i', OUT, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'});
const summary = ff.stderr.slice(ff.stderr.lastIndexOf('Summary:'));
const I_ = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
const TP = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=sample_rate,channels,bits_per_sample:format=duration', '-of', 'default=nw=1', OUT], {encoding: 'utf8'}).stdout;
console.log(`ffmpeg ebur128: integrated ${I_} LUFS, true peak ${TP} dBTP | ${probe.replace(/\s+/g, ' ').trim()}`);
console.log(`→ ${OUT}  (${((performance.now() - t0) / 1000).toFixed(1)} s)`);

for (const p of problems) console.warn(`WARN ${p}`);
assert.ok(Math.abs(I_ + 14) <= 0.5, `integrated loudness ${I_} LUFS is not about -14`);
assert.ok(TP < -1, `true peak ${TP} dBTP is not below -1 dBTP`);
assert.ok(spread() <= 1.5, `world loudness spread ${spread().toFixed(2)} LU exceeds ±1.5 LU`);
assert.ok(/duration=90\.0+\b/.test(probe), 'duration is not exactly 90.0 s');
assert.equal(problems.filter((p) => p.includes('threw')).length, 0, 'a world sound module failed');
