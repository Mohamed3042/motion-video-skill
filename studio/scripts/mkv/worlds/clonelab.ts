// World 2 · CLONE LAB — an endless Shepard–Risset glissando (one octave per lap of the staircase), a glass pluck on
// every orb hop climbing a Shepard scale, an airy pad + heartbeat pulse, a crystal tick when each flight lights,
// and an impact when the door at the top glows.
import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {duck, finish, local} from './myvoice.ts';
import {CAL, EVENTS, FLIGHT_TREADS, HOPS, LOOP, READY_AR, READY_EN, REC, SETUP, SPIN, TRAIN} from '../../../src/mkv/worlds/clonelab/timing.ts';

const CHORDS = [
  {root: 41, notes: [53, 57, 60, 64]}, // Fmaj7
  {root: 43, notes: [55, 59, 62, 64]}, // G6
  {root: 45, notes: [57, 60, 64, 67, 71]}, // Am9
  {root: 40, notes: [52, 55, 59, 62]}, // Em7
];
const A_MINOR = [9, 11, 0, 2, 4, 5, 7]; // pitch classes, rising from A

// glass pluck: inharmonic FM bell + a pure octave partial, short and bright
function glass(o: D.Out, s: number, m: number, vol: number, pan: number, dur = 0.9) {
  const f = D.mtof(m);
  D.put(o, s, dur, pan, 0.45, (t) => {
    const e = Math.min(1, t * 900) * Math.exp(-t / (dur * 0.3));
    return vol * e * (Math.sin(D.TAU * f * t + 1.3 * Math.exp(-t / 0.12) * Math.sin(D.TAU * f * 3.5 * t)) + 0.35 * Math.sin(D.TAU * 2 * f * t) * Math.exp(-t / 0.08));
  });
}
// one Shepard-scale step: the same pitch class in several octaves under a fixed bell envelope (centre ≈ E5)
function shepardNote(o: D.Out, s: number, pc: number, vol: number, pan: number, dur = 0.9) {
  for (let m = 48 + pc; m < 108; m += 12) {
    const w = Math.exp(-0.5 * ((m - 77) / 10) ** 2);
    if (w > 0.04) glass(o, s, m, vol * w, pan, dur);
  }
}
// Shepard–Risset glissando: octave-spaced sines under a fixed bell envelope; position = octaves travelled.
// 1 octave per lap (LOOP frames) until the exit spin, then it accelerates into the boundary.
function gliss(o: D.Out, s: (f: number) => number, vol: number) {
  const NO = 9;
  const center = 600;
  const fmin = center * 2 ** (-NO / 2);
  const f0 = -15;
  const f1 = 492;
  const r0 = 60 / LOOP; // octaves per second
  const tSpin = (SPIN - f0) / 60;
  const pos = (t: number) => r0 * t + (t > tSpin ? 0.9 * (t - tSpin) ** 2 * 2.6 : 0);
  const dur = (f1 - f0) / 60;
  for (const [side, pan] of [
    [0, -0.35],
    [0.5, 0.35],
  ] as const) {
    const ph = new Float64Array(NO);
    D.put(o, s(f0), dur, pan, 0.5, (t) => {
      const p = pos(t) + side;
      let y = 0;
      for (let k = 0; k < NO; k++) {
        const oct = (k + p) % NO;
        ph[k] += (fmin * 2 ** oct) / D.SR;
        y += Math.exp(-0.5 * ((oct - NO / 2) / 1.3) ** 2) * Math.sin(D.TAU * ph[k]);
      }
      const env = Math.min(1, t / 0.25) * Math.min(1, (dur - t) / 0.12);
      return (vol * y * env) / 3;
    });
  }
}

// crystal tick: a bright, sharp cluster with a click on top
function crystal(o: D.Out, s: number, vol: number) {
  [88, 95, 100].forEach((m, i) => D.bell(o, s, m, vol * [1, 0.7, 0.45][i], 1.4, [-0.25, 0.25, 0][i], 2, 0.9, 0.55));
  D.bell(o, s, 76, vol * 0.6, 0.5, 0, 1.5, 0.6, 0.3);
  D.hat(o, s, vol * 0.9, false, 0);
}

export default function render(ctx: SynthCtx) {
  const W = local(ctx);
  const {bed, fx, s} = W;

  // the endless rise: one octave per lap of the staircase; it hurries during the exit spin
  gliss(bed, s, 0.16);

  for (let bar = 0; bar < 4; bar++) {
    const f0 = bar * 120;
    const ch = CHORDS[bar];
    D.pad(bed, s(f0), ch.notes, 2.0, 0.09, {lp0: 500, lp1: 1500, att: 0.35, rel: 0.7, send: 0.65});
    // heartbeat pulse: soft kick + sub on 1 and 3, airy offbeat ticks
    for (const b of [0, 60]) {
      if (f0 + b !== TRAIN) D.kick(bed, s(f0 + b), b ? 0.2 : 0.26); // the door impact carries its own low end
      D.sub(bed, s(f0 + b), ch.root - 12, 0.4, 0.16);
    }
    for (const b of [15, 45, 75, 105]) D.hat(bed, s(f0 + b), 0.035, false, b % 30 ? 0.4 : -0.4);
  }

  // a glass note on every hop, climbing a Shepard scale; landings ring longer with a fifth
  const firstOf = FLIGHT_TREADS.map((_, i) => FLIGHT_TREADS.slice(0, i).reduce((a, n) => a + n + 1, 0));
  const panOf = (r: number) => (r < firstOf[1] ? 0.35 : r < firstOf[2] ? 0.1 : r < firstOf[3] ? -0.4 : -0.2);
  const perLoop = FLIGHT_TREADS.reduce((a, n) => a + n + 1, 0);
  for (const h of HOPS) {
    if (h.f >= SPIN) continue;
    const r = ((h.cell % perLoop) + perLoop) % perLoop;
    const landing = firstOf.includes(r + 1) || r === perLoop - 1;
    const step = h.cell; // every hop climbs one scale degree, forever
    const pc = A_MINOR[((step % 7) + 7) % 7];
    shepardNote(fx, s(h.f), pc, landing ? 0.075 : 0.055, panOf(r), landing ? 1.4 : 0.8);
    if (landing) shepardNote(fx, s(h.f), (pc + 7) % 12, 0.03, -panOf(r), 1.4);
  }

  // a crystal tick as each flight's label lights
  for (const f of [SETUP, REC, CAL]) crystal(fx, s(f), 0.16);
  // calibrate: English, then العربية reach "ready"
  for (const [f, m] of [
    [READY_EN, 88],
    [READY_AR, 93],
  ]) {
    glass(fx, s(f), m, 0.11, 0, 0.35);
    glass(fx, s(f) + 0.06 * D.SR, m + 5, 0.1, 0, 0.5);
  }
  // TRAIN: the door at the top glows — impact + crystal
  D.boom(fx, s(TRAIN), 0.1, 2.4);
  D.thump(fx, s(TRAIN), 0.16);
  crystal(fx, s(TRAIN), 0.15);
  // exit: the staircase spins into the ring
  for (const e of EVENTS.filter((e) => e.kind === 'whoosh')) D.whoosh(fx, s(e.f), 0.14, 0.24, 0.2);

  duck(bed, EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').map((e) => s(e.f)));
  finish(W);
}
