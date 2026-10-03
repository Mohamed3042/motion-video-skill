// World 7 · PICTURE LAB — nine bars of wide synth-pop in the D minor / F major family.
// The checker proof opens the harmony, tracking adds a stereo arpeggio, stabilization locks the drums,
// and finishing tools get short musical confirmations. Events use the shared picture frame map.
import type {SynthCtx} from '../types.ts';
import {Synth} from './review.ts';
import {TAU, mtof} from '../dsp.ts';
import {EVENTS, T} from '../../../src/mpw/worlds/picture/timing.ts';

const BARS = [
  {root: 38, chord: [50, 57, 60, 64, 65]}, // Dm9
  {root: 34, chord: [46, 53, 57, 62, 65]}, // Bbmaj7
  {root: 29, chord: [53, 57, 60, 64, 67]}, // Fmaj9 — proof
  {root: 36, chord: [48, 55, 60, 62, 64]}, // Cadd9
  {root: 31, chord: [50, 55, 58, 62, 65]}, // Gm9 — planar tracking
  {root: 34, chord: [46, 53, 57, 62, 65]}, // Bbmaj7
  {root: 38, chord: [50, 57, 60, 64, 65]}, // Dm9 — stabilization
  {root: 29, chord: [53, 57, 60, 64, 67]}, // Fmaj9 — finish
  {root: 38, chord: [50, 57, 60, 64, 65]}, // Dm9 — Library
];

export default function render(ctx: SynthCtx) {
  // The helper allocates working buses over this world's window, rather than the full film.
  const s = new Synth(ctx, 7007, -24, 30);
  for (let bar = 0; bar < BARS.length; bar++) {
    const f0 = bar * 120;
    const {root, chord} = BARS[bar];
    const last = bar === BARS.length - 1;
    const end = Math.min(f0 + 120, T.exit);
    s.pad(chord, f0, end, {vol: 0.16, lp0: 1400, lp1: bar < 2 ? 2400 : 3600, att: 0.16, rel: 0.42, send: 0.46});
    s.rhodes(f0, chord.slice(1), 0.7, 0.12, 0.38, s.pump);
    for (let k = 0; k < 8; k++) {
      const f = f0 + k * 15;
      if (f >= T.exit) break;
      if (k === 0 || k === 4 || (bar >= 3 && k === 7)) s.kick(f, k === 0 ? 0.5 : 0.4);
      if (k === 2 || k === 6) {
        s.clap(f, 0.24, 0.08, 0.14);
        s.snare(f, 0.12, -0.05, 0.12, 0.95);
      }
      s.hat(f + (k % 2 ? 0.7 : 0), 0.052, k === 7 && !last, k % 2 ? 0.38 : -0.3);
      if (bar >= 2) s.shaker(f + 7.5, 0.043, k % 2 ? -0.5 : 0.5);
      if (k % 2 === 0) s.bass(f, root + (k === 6 ? 7 : 0), 0.23, 0.25, 600);
      if (bar >= 2 && f < T.exit - 15) {
        const m = chord[[1, 3, 2, 4, 2, 3, 1, 4][k]] + 12;
        s.bell(f + 7.5, m, 0.046, 0.65, k % 2 ? 0.58 : -0.58, 2, 0.65, 0.32);
      }
    }
  }
  // Checker squares have equal pitches, echoing their equal scope readings.
  s.bell(T.pickA, 81, 0.09, 0.45, -0.5, 2, 0.9, 0.24);
  s.bell(T.pickB, 81, 0.09, 0.45, 0.5, 2, 0.9, 0.24);
  s.rhodes(T.proof, [53, 57, 60, 64, 67, 72], 1.2, 0.32, 0.5, s.pump);
  s.riser(T.bridge, T.proof - 4, 0.05, 900, 3);
  s.stab(T.match, [65, 69, 72, 76], 0.22, 3100, 0.22, 0.38);
  T.locks.forEach((f, i) => s.bell(f, [81, 84, 86, 89][i], 0.055, 0.4, -0.6 + i * 0.4, 2, 0.5, 0.2));
  s.stab(T.planar, [62, 65, 69, 74], 0.2, 2600, 0.18, 0.3);
  [-0.6, -0.2, 0.2, 0.6].forEach((p, i) => s.click(T.pins + i * 1.5, 0.045, 2700 + i * 350, p));
  s.bell(T.pinLT, 86, 0.08, 0.7, 0.3, 2, 0.7, 0.32);
  // A swaying sine narrows to the center as the picture locks.
  const dur = (T.lock - T.measure) / 60;
  [-1, 1].forEach((side) => {
    s.put(s.pump, s.s(T.measure), s.sec(dur), side * 0.6, 0.12, (t) => {
      const u = t / dur;
      return 0.028 * Math.sin(TAU * mtof(74) * t) * (0.5 + 0.5 * Math.sin(TAU * 4 * t + side)) * Math.sin(Math.PI * u);
    });
  });
  s.rhodes(T.lock, [50, 57, 62, 65, 69], 0.7, 0.2, 0.32, s.pump);
  s.bell(T.finish, 89, 0.065, 0.65, -0.35, 3, 1.2, 0.42);
  [0, 7.5, 15].forEach((d, i) => s.pluck(T.flicker + d, [77, 81, 84][i], 0.1, -0.3 + i * 0.3, 0.2, 0.6, 0.995, 0.3));
  s.stab(T.even, [65, 69, 72, 76], 0.25, 3000, 0.28, 0.35);
  s.bell(T.restore, 81, 0.075, 0.6, -0.35, 2, 0.6, 0.28);
  s.bell(T.scale, 86, 0.07, 0.5, 0.35, 2, 0.7, 0.28);
  s.stab(T.crisp, [62, 65, 69, 74], 0.24, 3800, 0.24, 0.32);
  s.bell(T.render, 89, 0.08, 0.7, 0.25, 2, 0.8, 0.32);
  EVENTS.forEach((e, i) => {
    if (e.kind === 'impact' || e.kind === 'hit') {
      s.hit(e.f, e.kind === 'impact' ? 0.52 : 0.43, e.f === T.band ? 2500 : 2100);
      if (e.kind === 'impact') s.boom(e.f, 0.25, 1.2);
      s.gap(e.f);
    } else if (e.kind === 'whoosh') {
      s.whoosh(e.f, e.f === T.slide ? 0.13 : 0.105, e.f === T.slide ? 0.58 : 0.35, i % 2 ? 0.65 : -0.65, i % 2 ? -0.65 : 0.65);
    } else if (e.kind === 'tick') {
      s.click(e.f, 0.085, 2800 + (i % 4) * 260, i % 2 ? 0.3 : -0.3);
    } else {
      s.blip(e.f, 81, 86, 0.07, 0.25, 0.1);
    }
  });
  s.gap(ctx.length);
  s.mix(0.95, 0.5, -6.8);
}
