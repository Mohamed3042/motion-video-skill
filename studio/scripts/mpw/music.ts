// Master soundtrack for Montage Pro: Eleven Worlds → public/mpw/music.wav (44.1 kHz 16-bit stereo, exactly 164.0 s).
// Renders the Intro (Reich phasing → lock) and the Finale, calls every world's sound module
// (scripts/mpw/worlds/<id>.ts) with a SynthCtx, shapes every boundary as an edit (60 ms bed cut before each impact,
// tails, L-cut linger, J-cut lead, tape stop, stutter), adds the edit sounds, reverb on the send bus, matches each
// section's loudness with one static gain, then masters to -14 LUFS integrated with true peak below -1 dBTP.
// Deterministic; release mastering requires every section and rejects incomplete or invalid sound modules.
// Usage: node scripts/mpw/music.ts
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {DURATION, FPS, INTRO, WORLDS} from '../../src/mpw/timing.ts';
import {BOUNDARIES, EDITS, J_LEAD, L_LAG, SECTIONS} from '../../src/mpw/shell/timing.ts';
import * as I from '../../src/mpw/intro/timing.ts';
import * as F from '../../src/mpw/finale/timing.ts';
import type {SynthCtx} from './types.ts';
import * as D from './dsp.ts';

const SR = D.SR;
const N = Math.round((DURATION / FPS) * SR); // 7,232,400
const at = (f: number) => (f / FPS) * SR; // global frame → sample
const TARGET = -16; // per-section loudness before mastering (LUFS)
const WET = 2.0; // reverb return level
const MAX_ADJ = 15; // dB: hard limit on a section's matching gain; beyond ±6 dB is reported
const GAP = 0.06; // s: every impact gets a clean transient (beds are cut this long before it)
const OUT = path.resolve(import.meta.dirname, '../../public/mpw/music.wav');

// ---------------- Intro (0–8 s): four loops drift like Reich phasing, snap onto the grid, the playhead hit ----------------
const LANE_PAN = [-0.12, -0.45, 0, 0.5];
function intro(o: D.Out) {
  D.boom(o, at(I.T0), 0.9, 2.4);
  // The loops play exactly the hits the picture draws (drifting until each lane's lock, then on the 120 BPM grid).
  for (const h of I.loopHits()) {
    const s = h.s * SR;
    const pan = LANE_PAN[h.lane];
    if (h.kind === 'kick') D.kick(o, s, 0.55);
    else if (h.kind === 'hat') D.hat(o, s, 0.1, false, pan + 0.3);
    else if (h.kind === 'pluck') D.pluck(o, s, I.pitchOf('pluck', h.n), 0.34, pan, 0.3, 0.55);
    else if (h.kind === 'ghost') D.pluck(o, s, I.pitchOf('ghost', h.n), 0.15, pan, 0.3, 0.4);
    else if (h.kind === 'bass') D.bassPulse(o, s, I.pitchOf('bass', h.n), 0.3, 0.36);
    else D.shaker(o, s, h.kind === 'shakeAcc' ? 0.13 : 0.075, pan);
  }
  // each lock: a bright tick + small thump, climbing a D-minor arpeggio (CAM A … REC)
  I.LOCKS.forEach((f, k) => {
    D.tick(o, at(f), 0.2, [86, 89, 93, 98][k], [-0.3, -0.1, 0.1, 0.3][k]);
    D.thump(o, at(f), 0.3);
  });
  D.riser(o, at(I.LOCKS[0]), at(I.HIT) - GAP * SR, 0.1, 500, 9000);
  // HIT (f300): the aligned peaks become the playhead
  D.hit(o, at(I.HIT), 0.85);
  D.boom(o, at(I.HIT), 0.5, 2.6);
  D.rhodesChord(o, at(I.HIT), [38, 50, 57, 60, 64, 65], 2.2, 0.4);
  D.pad(o, at(I.HIT), [50, 57, 62, 65, 69], (I.EXIT - I.HIT) / FPS, 0.2, {lp0: 600, lp1: 2800, att: 0.3, rel: 0.2, send: 0.5});
  D.sub(o, at(I.HIT), 26, (I.EXIT - 8 - I.HIT) / FPS, 0.15);
  // WRITE (f330): the In/Out brackets open — a shimmer of bells spreading from the centre
  [74, 81, 86, 88, 93].forEach((m, j) => D.bell(o, at(I.WRITE) + j * 0.03 * SR, m, 0.055, 1.8, j % 2 ? 0.5 : -0.5, 2, 0.9, 0.6));
  // tagline: one soft key per phrase
  I.TAG.forEach((f, j) => D.rhodes(o, at(f), [69, 72, 77][j], 0.6, 0.13, [-0.3, 0, 0.3][j], 0.4));
  // the brackets close into the line: reverse swell into the first edit
  D.revSwell(o, at(INTRO.end), 0.6, 0.16, GAP);
}

// ---------------- Finale (150–164 s): full theme + every world's motif on its cut, sync, lock, resolve ----------------
// One short signature per world, played on the beat its tile takes the active angle.
function motif(o: D.Out, worldIndex: number, s: number) {
  const b = SR / 2; // one beat
  switch (worldIndex) {
    case 1: // ingest: tape-machine thump
      D.clack(o, s, 0.28, -0.3, 1800);
      break;
    case 2: // sync: four lock ticks
      [0, 1, 2, 3].forEach((j) => D.tick(o, s + j * b * 0.125, 0.12, 86 + 3 * j, -0.4 + 0.27 * j));
      break;
    case 3: // review: playhead ticks
      [0, 0.5].forEach((d) => D.tick(o, s + d * b, 0.13, 98, 0.4));
      break;
    case 4: // captions: typewriter + soft key
      [0, 0.25, 0.375].forEach((d) => D.clack(o, s + d * b, 0.14, 0.35, 3400));
      D.bell(o, s, 81, 0.05, 0.9, 0.3, 2, 0.6, 0.4);
      break;
    case 5: // handoff: brass stab
      D.stab(o, s, [62, 65, 69, 72], 0.3);
      break;
    case 6: // sound lab: spectral glass
      D.bell(o, s, 93, 0.06, 1.2, -0.4, 5.03, 2.4, 0.6);
      break;
    case 7: // picture lab: chromatic shimmer
      D.rhodesChord(o, s, [70, 74, 77, 81], 0.6, 0.18, 0.5);
      break;
    case 8: // library: glitch blips
      [0, 0.0625, 0.125, 0.25].forEach((d, j) => D.square(o, s + d * b, [86, 98, 93, 81][j], 0.03, 0.05, 0.125, j % 2 ? 0.5 : -0.5, 0.1));
      break;
    case 9: // edit room: stutter
      [0, 0.0625, 0.125].forEach((d) => D.clap(o, s + d * b, 0.18, 0.2));
      break;
    case 10: // profile: warm piano
      D.rhodes(o, s, 77, 0.8, 0.16, 0.2, 0.45);
      break;
    case 11: // anywhere: the theme, simpler
      D.bell(o, s, 74, 0.07, 1.4, 0, 2, 0.8, 0.5);
      break;
  }
}
function finale(o: D.Out) {
  const M0 = F.MONTAGE;
  const chords = [
    [50, 57, 60, 64, 65], // Dm(add9)
    [46, 53, 57, 62, 65], // B♭maj7
    [45, 53, 57, 60, 64], // F/A
  ];
  const roots = [38, 34, 33];
  D.boom(o, at(M0), 0.6, 2.4);
  D.hit(o, at(M0), 0.55);
  F.MONTAGE_BEATS.forEach((f, k) => {
    const bar = Math.floor(k / 4);
    D.kick(o, at(f), 0.6);
    if (k % 2) D.clap(o, at(f), 0.36);
    D.hat(o, at(f + 15), 0.15, true, 0.3);
    D.hat(o, at(f + 7.5), 0.055, false, -0.25);
    D.hat(o, at(f + 22.5), 0.055, false, -0.25);
    D.bassPulse(o, at(f + 15), roots[bar], 0.2, 0.3);
    if (k % 4 === 0) {
      D.rhodesChord(o, at(f), chords[bar], k === 8 ? 1.4 : 2, 0.36);
      D.pad(o, at(f), chords[bar].slice(1), k === 8 ? 1.4 : 2, 0.14, {lp0: 900, lp1: 2800, att: 0.08, rel: 0.25, send: 0.5});
    }
    D.pluck(o, at(f), I.THEME[k % 8], 0.24, -0.35, 0.3, 0.55);
    if (k > 0) D.hit(o, at(f), 0.36);
    motif(o, F.ACTIVE_TILE[k], at(f));
  });
  // SLIDE (155.5 s): the drums fall away; the clips slide into sync, one group per beat
  D.pad(o, at(F.SLIDE), [50, 57, 62, 64, 69], (F.LOGO_LOCK - F.SLIDE) / FPS - GAP - 0.02, 0.18, {lp0: 500, lp1: 4000, att: 0.2, rel: 0.02, send: 0.6});
  D.sub(o, at(F.SLIDE), 26, (F.LOGO_LOCK - F.SLIDE) / FPS - GAP - 0.17, 0.12);
  for (let f = F.SLIDE; f < F.SNAPS[2]; f += 7.5) D.shaker(o, at(f), 0.05 + 0.04 * ((f - F.SLIDE) / 90), 0.3);
  F.SNAPS.forEach((f, j) => {
    D.whoosh(o, at(f), 0.08, 0.3, 0.12, GAP, j % 2 ? 0.7 : -0.7, 0);
    D.tick(o, at(f), 0.22, [86, 89, 93][j], 0);
    D.thump(o, at(f), 0.4);
    D.kick(o, at(f), 0.4);
  });
  // collapse into the line: riser, cut 60 ms before the lock
  D.riser(o, at(F.COLLAPSE[0]), at(F.LOGO_LOCK) - GAP * SR, 0.3, 300, 12000);
  D.shepard(o, at(F.COLLAPSE[0]), at(F.LOGO_LOCK) - GAP * SR, 0.06, {center: 1400, rate0: 0.6, rate1: 2, env: (u) => u * u, send: 0.5});
  // LOGO LOCK (158 s): big hit, then the F major resolve held under the end card
  D.boom(o, at(F.LOGO_LOCK), 1, 3.6);
  D.hit(o, at(F.LOGO_LOCK), 0.65);
  [81, 84, 88, 91, 96].forEach((m, j) => D.bell(o, at(F.LOGO_LOCK) + j * 0.022 * SR, m, 0.06, 3.4, j % 2 ? 0.55 : -0.55, 2, 1.1, 0.8));
  const hold = (F.FADE + 20 - F.LOGO_LOCK) / FPS;
  D.pad(o, at(F.LOGO_LOCK), [41, 48, 53, 57, 60, 64, 67], hold, 0.4, {lp0: 3200, lp1: 1000, att: 0.04, rel: 0.9, send: 0.65});
  D.sub(o, at(F.LOGO_LOCK), 29, hold, 0.16);
  D.rhodesChord(o, at(F.LOGO_LOCK), [41, 53, 57, 60, 64, 67], 3, 0.32, 0.5);
  F.LINES.forEach((f, i) => D.bell(o, at(f), [77, 81, 84, 88][i], 0.07, 2.4, -0.3 + i * 0.2, 2, 0.7, 0.65));
  D.rhodesChord(o, at(F.LINES[3] + 60), [53, 57, 60, 62, 67, 69], 2.4, 0.2, 0.6);
}

// ---------------- Edit sounds (one per boundary, by edit kind) ----------------
function editFx(o: D.Out) {
  BOUNDARIES.forEach((b, k) => {
    const s = at(b);
    switch (EDITS[k].kind) {
      case 'match': // playhead → folder edge: a tape-transport clack
        D.clack(o, s, 0.45, 0, 1900);
        D.thump(o, s, 0.45);
        break;
      case 'strips':
        D.whoosh(o, s, 0.11, 0.4, 0.25);
        D.thump(o, s, 0.45);
        break;
      case 'whip': // the picture flies left
        D.whoosh(o, s, 0.24, 0.32, 0.3, GAP, 0.9, -0.9);
        D.thump(o, s, 0.5);
        break;
      case 'lcut':
        D.tick(o, s, 0.16, 91);
        D.thump(o, s, 0.4);
        break;
      case 'smash':
        D.hit(o, s, 0.8);
        D.boom(o, s, 0.32, 1.6);
        break;
      case 'zoom': // tape stop (on the stem), then the dive into the next clip
        D.thump(o, s, 0.5);
        D.boom(o, s, 0.28, 1.8);
        D.whoosh(o, s, 0.12, 0.25, 0.45, GAP, -0.3, 0.3);
        break;
      case 'gate': // projector rattle into the slip, then the gate clack
        for (let j = 0; j < 8; j++) D.clack(o, s - (GAP + j / 24) * SR, 0.2 * (1 - j / 9), 0, 2600);
        D.clack(o, s, 0.5, 0, 2200);
        D.thump(o, s, 0.42);
        break;
      case 'jcut': // the sound already arrived (lead on the stem); the picture lands softly
        D.thump(o, s, 0.36);
        break;
      case 'stutter':
        D.thump(o, s, 0.5);
        D.hit(o, s, 0.3);
        break;
      case 'iris':
        D.revSwell(o, s, 0.85, 0.2, GAP);
        D.thump(o, s, 0.5);
        D.boom(o, s, 0.28, 2);
        break;
      case 'flop': // the mirror turn: a whoosh that crosses the stereo field the other way
        D.whoosh(o, s, 0.15, 0.4, 0.3, GAP, 0.85, -0.85);
        D.thump(o, s, 0.45);
        break;
      case 'multicam': // the finale's own boom lands on the cut
        D.riser(o, s - 1.6 * SR, s - GAP * SR, 0.2, 300, 11000);
        D.thump(o, s, 0.4);
        break;
    }
  });
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

// ---------------- edit shaping on the stems (absolute sample indices) ----------------
const chans = (s: Stem) => [s.dryL, s.dryR, s.wetL, s.wetR];
const env = (s: Stem, i0: number, i1: number, fn: (i: number) => number) => {
  for (const x of chans(s)) for (let i = Math.max(i0, s.w0); i < Math.min(i1, s.w0 + x.length); i++) x[i - s.w0] *= fn(i);
};
const cosFade = (u: number) => 0.5 + 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, u)));
// Copy [src, src + len) of a stem onto [dst, dst + len), one-pole lowpassed at `lp` Hz, times gain(u).
const copyRegion = (s: Stem, src: number, dst: number, len: number, lp: number, gain: (u: number) => number) => {
  const k = 1 - Math.exp((-2 * Math.PI * lp) / SR);
  for (const x of chans(s)) {
    const seg = x.slice(src - s.w0, src - s.w0 + len);
    let y = 0;
    for (let j = 0; j < len; j++) {
      y += k * (seg[j] - y);
      const i = dst + j - s.w0;
      if (i >= 0 && i < x.length) x[i] += y * gain(j / len);
    }
  }
};
// Tape stop over [i0, i1): playback speed falls 1 → 0, the level with it.
const tapeStop = (s: Stem, i0: number, i1: number) => {
  const n = i1 - i0;
  for (const x of chans(s)) {
    const src = x.slice(i0 - s.w0, i1 - s.w0);
    for (let j = 0; j < n; j++) {
      const u = j / n;
      const p = n * (u - (u * u) / 2);
      const q = Math.floor(p);
      const v = src[q] + (src[Math.min(n - 1, q + 1)] - src[q]) * (p - q);
      x[i0 + j - s.w0] = v * (1 - u ** 3);
    }
  }
};
// Stutter over [i0, i1): repeat the slice that starts at i0, the slice shrinking 1/8 → 1/16 → 1/32 beat.
const stutterRegion = (s: Stem, i0: number, i1: number) => {
  const beat = SR / 2;
  const n = i1 - i0;
  for (const x of chans(s)) {
    const src = x.slice(i0 - s.w0, i0 - s.w0 + Math.round(beat / 8));
    for (let j = 0; j < n; j++) {
      const u = j / n;
      const len = Math.round(beat / (u < 0.5 ? 8 : u < 0.8 ? 16 : 32));
      const q = j % len;
      const w = Math.min(1, q / 60, (len - q) / 60); // 1.4 ms edges
      x[i0 + j - s.w0] = src[q] * w;
    }
  }
};

// The bed cut: a stem ducks to -24 dB for the 60 ms before an impact on sample B (10 ms fade), reverb tails included.
const bedCut = (s: Stem, B: number) => {
  const g0 = B - Math.round(GAP * SR);
  const fade = Math.round(0.01 * SR);
  env(s, g0 - fade, B, (i) => (i < g0 ? 0.06 + 0.94 * cosFade(1 - (g0 - i) / fade) : 0.06));
};

function shapeEdits(stems: Stem[]) {
  const byId = new Map(stems.map((s) => [s.name, s]));
  bedCut(byId.get('intro')!, Math.round(at(I.HIT)));
  bedCut(byId.get('finale')!, Math.round(at(F.LOGO_LOCK)));
  BOUNDARIES.forEach((b, k) => {
    const out = byId.get(SECTIONS[k].id)!;
    const inn = byId.get(SECTIONS[k + 1].id)!;
    const kind = EDITS[k].kind;
    const B = Math.round(at(b));
    const g0 = B - Math.round(GAP * SR);
    // special moves first (they read the stems before the bed cut)
    if (kind === 'lcut' && !out.silent) {
      const len = Math.round(at(L_LAG));
      copyRegion(out, B - len, B, len, 1800, (u) => 0.7 * (1 - u) ** 1.5); // Review's last beat lingers, muffled
    }
    if (kind === 'jcut' && !inn.silent) {
      const len = Math.round(at(J_LEAD));
      copyRegion(inn, B + 3 * len, B - len, len, 2500, (u) => 0.85 * u ** 1.5); // Library's 4th beat arrives first
      env(out, B - len, B, (i) => 1 - 0.65 * ((i - B + len) / len)); // and the picture's sound gives way
    }
    if (kind === 'zoom' && !out.silent) tapeStop(out, g0 - Math.round(0.42 * SR), g0);
    if (kind === 'stutter' && !out.silent) stutterRegion(out, B - Math.round(0.5 * SR), g0);
    bedCut(out, B);
    bedCut(inn, B);
    // the outgoing tail after the cut
    const tailLen = Math.round((kind === 'lcut' ? 0.6 : 0.45) * SR);
    const tailG = kind === 'smash' ? 0 : kind === 'lcut' ? 0.8 : 0.45;
    env(out, B, out.w0 + out.dryL.length, (i) => (i < B + tailLen ? tailG * cosFade((i - B) / tailLen) : 0));
  });
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
assert.equal(problems.length, 0, `Invalid sound modules: ${problems.join('; ')}`);
assert.equal(stems.filter((s) => s.match && !s.silent).length, WORLDS.length + 2,
  `Incomplete soundtrack; silent sections: ${stems.filter((s) => s.match && s.silent).map((s) => s.name).join(', ')}`);
shapeEdits(stems);
stems.push(await makeStem('edits', 0, DURATION, false, editFx));
assert.equal(problems.length, 0, `Invalid edit audio: ${problems.join('; ')}`);
console.log(`synthesized ${stems.length} stems in ${((performance.now() - t0) / 1000).toFixed(1)} s`);

// Loudness matching: one static gain per section (no gain steps inside a section, so no pumping), iterated
// on the full mix so neighbour tails, reverb and edit sounds are part of each section's measurement.
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
    const fade = Math.min(1, (N - 1 - i) / tail); // guarantee silence at exactly 164.0 s
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
// Verify the balance on the mastered result (the limiter leans harder on hit-heavy sections); up to three
// corrective passes toward the median, over every matched section (intro and finale included).
const worldSegs = () => {
  const r = segLufs(m.L, m.R, matched).segs;
  return matched.map((s, i) => ({s, l: r[i]}));
};
let seg = worldSegs();
const worldsOnly = () => seg.filter(({s}) => WORLDS.some((w) => w.id === s.name));
const spreadOf = (v: number[]) => (v.length ? Math.max(...v) - Math.min(...v) : 0);
const spread = () => spreadOf(worldsOnly().map((x) => x.l));
for (let it = 0; it < 3 && spreadOf(seg.map((x) => x.l)) > 0.6; it++) {
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
console.log(`  worlds spread: ${spread().toFixed(2)} LU (${worldsOnly().length} non-silent worlds); all sections: ${spreadOf(seg.map((x) => x.l)).toFixed(2)} LU`);
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
assert.ok(TP <= -1, `true peak ${TP} dBTP is above -1 dBTP`);
assert.ok(spread() <= 1.5, `world loudness spread ${spread().toFixed(2)} LU exceeds ±1.5 LU`);
assert.ok(/duration=164\.0+\b/.test(probe), 'duration is not exactly 164.0 s');
assert.equal(problems.filter((p) => p.includes('threw')).length, 0, 'a world sound module failed');
