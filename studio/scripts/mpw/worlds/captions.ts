// World 4 · CAPTIONS & MARKERS — typewriter + soft keys in F major / D minor. One typewriter key per typed
// character over a hushed Rhodes bed, a carriage bell at the end of the line, a rising pluck for every letter
// that snaps home, the impact when the line reads right, then a light half-time groove under the editor's
// actions (import, search keys, shift slide, split snip, undo/redo, marker drops, export) and a wooden block
// for every cue block that stacks into the three prongs.
import type {SynthCtx} from '../types.ts';
import {Synth} from './review.ts';
import {BQ, TAU} from '../../mkv/dsp.ts';
import {EVENTS, KEYS, LINE, MOVES, SEARCH_KEYS, STACK_LAND, T} from '../../../src/mpw/worlds/captions/timing.ts';

const CH = [
  [53, 57, 60, 64, 67], // Fmaj9
  [50, 53, 57, 60, 64], // Dm9
  [46, 50, 53, 57, 60], // Bbmaj9
  [48, 52, 55, 57, 62], // C6/9
  [50, 53, 57, 60, 64], // Dm9
  [46, 50, 53, 57, 62], // Bbmaj7(add 13)
];
const ROOTS = [41, 38, 34, 36, 38, 34];
const PENTA = [65, 67, 69, 72, 74, 77, 79, 81]; // F major pentatonic, rising as letters snap home

export default function render(ctx: SynthCtx) {
  const s = new Synth(ctx, 4004);

  // ---- bars 1-2: the caret types over a hushed Rhodes bed ----
  s.rhodes(0, CH[0], 1.9, 0.09, 0.45);
  s.rhodes(120, CH[1], 1.9, 0.09, 0.45);
  s.pad(CH[0], 0, 120, {vol: 0.1, lp0: 600, lp1: 1100, att: 0.3, rel: 0.4, send: 0.5});
  s.pad(CH[1], 120, 240, {vol: 0.1, lp0: 900, lp1: 1500, att: 0.2, rel: 0.3, send: 0.5});
  s.sub(0, 29, 120, 0.06);
  s.sub(120, 26, 236, 0.06);
  for (let f = 0; f < 236; f += 30) {
    if (f % 60 === 0) s.kick(f, 0.32, 900);
    s.shaker(f + 15, 0.05, 0.3);
  }
  [...LINE].forEach((ch, i) => s.key(KEYS[i], 0.2 + 0.05 * s.rnd(), -0.5 + (i / LINE.length), ch === ' '));
  // carriage bell at the end of the line
  s.bell(KEYS[LINE.length - 1] + 6, 96, 0.07, 1.4, 0.5, 2.0, 0.9, 0.5);
  // a music-box motif while you read it
  [[96, 77], [103.5, 76], [111, 72], [126, 74], [141, 69], [156, 72]].forEach(([f, m], i) => s.pluck(f, m, 0.1, i % 2 ? 0.35 : -0.35, 0.5, 0.75, 0.997));

  // ---- the fixes: a click + a rising pluck per letter that snaps home ----
  MOVES.forEach((m, i) => {
    s.key(m.land, 0.22, -0.3 + (m.to / LINE.length) * 0.6);
    s.pluck(m.land, PENTA[i], 0.12, -0.3 + (m.to / LINE.length) * 0.6, 0.4, 0.8, 0.997);
  });
  s.riser(180, T.fixed, 0.1, 400, 14);

  // ---- the line reads right (impact) ----
  s.boom(T.fixed, 0.65, 1.8);
  s.hit(T.fixed, 0.42, 2800);
  s.rhodes(T.fixed, CH[2].map((m) => m + 12), 1.6, 0.16, 0.5);
  [84, 88, 91, 96].forEach((m, i) => s.bell(T.fixed, m, 0.045, 1.8, -0.45 + i * 0.3, 3.0, 1.2, 0.6));

  // ---- bars 3-6: a light half-time groove under the editor ----
  for (let bar = 2; bar < 5; bar++) {
    const b0 = bar * 120;
    s.pad(CH[bar], b0, b0 + 120, {vol: 0.12, lp0: 1300, lp1: 2000, att: 0.08, rel: 0.3, send: 0.45});
    s.sub(b0, ROOTS[bar] - 12, b0 + 118, 0.08);
    for (let k = 0; k < 8; k++) {
      const f = b0 + k * 15 + (k % 2 ? 1.5 : 0);
      if ([T.split, T.exported].includes(Math.round(f))) continue;
      if (k === 0 || k === 5) s.kick(f, 0.5);
      if (k === 4) s.snare(f, 0.24, 0.05, 0.25, 0.9);
      s.shaker(f, k % 2 ? 0.07 : 0.045, 0.3);
    }
    // soft-key comping on the "and"s
    for (const st of [3, 6, 11]) s.rhodes(b0 + st * 7.5, CH[bar].slice(1), 0.18, 0.07, 0.35);
    s.bass(b0, ROOTS[bar], 0.4, 0.26, 420);
    s.bass(b0 + 75, ROOTS[bar] + 7, 0.2, 0.18, 480);
  }
  // bar 6: the stack (keys + pad only, rising)
  s.pad(CH[5], 600, 720, {vol: 0.12, lp0: 900, lp1: 3000, att: 0.1, rel: 0.4, send: 0.5});
  s.sub(600, 22, 712, 0.07);

  // ---- editor actions ----
  s.whoosh(T.fly + 12, 0.15, 0.5, 0.5, -0.5);
  s.click(T.imported, 0.24, 3000, -0.3);
  s.blip(T.imported, 79, 84, 0.08, -0.3);
  SEARCH_KEYS.forEach((f) => s.key(f, 0.17, 0.1));
  s.bell(T.found, 91, 0.07, 0.9, 0.1, 2.0, 1.0, 0.4);
  s.blip(T.found, 84, 84, 0.06, 0.1);
  // shift: a click and a short upward slide as the cues move together
  s.click(T.shift, 0.22, 2600, 0.2);
  {
    let ph = 0;
    const i0 = s.s(T.shift);
    s.put(s.dry, i0, s.sec(0.22), 0.2, 0.2, (t) => {
      ph += (TAU * (520 + 900 * Math.min(1, t / 0.2))) / s.SR;
      return 0.05 * Math.sin(ph) * Math.min(1, t / 0.01) * Math.max(0, 1 - t / 0.22);
    });
  }
  // split: a snip (hit + bright noise burst)
  s.hit(T.split, 0.4, 3400);
  {
    const bp = new BQ().set(1, 5000, 0.8);
    s.put(s.dry, s.s(T.split), s.sec(0.05), 0, 0.1, (t) => 0.5 * bp.run(s.noise()) * Math.exp(-t / 0.008));
  }
  s.stab(T.split, [62, 65, 69, 72], 0.18, 2400, 0.12, 0.4);
  s.click(T.undo, 0.24, 2100, 0.4);
  s.blip(T.undo, 76, 72, 0.07, 0.4, 0.08);
  s.click(T.redo, 0.24, 2400, 0.45);
  s.blip(T.redo, 72, 76, 0.07, 0.45, 0.08);
  // markers drop: a falling blip that lands with a soft thump
  [T.marker1, T.marker2].forEach((f, i) => {
    s.blip(f, 86 - i * 2, 74 - i * 2, 0.13, 0.2 + i * 0.3, 0.14);
    s.kick(f, 0.18, 400);
    s.pluck(f, 69 + i * 3, 0.08, 0.2 + i * 0.3, 0.4);
  });
  // export: the files are written (hit + chord)
  s.hit(T.exported, 0.42, 2400);
  s.rhodes(T.exported, CH[4].map((m) => m + 12), 1.2, 0.13, 0.5);
  s.bell(T.exported, 93, 0.06, 1.2, 0.4, 2.0, 1.0, 0.5);

  // ---- exit: a wooden block per cue block, rising, into Handoff ----
  STACK_LAND.forEach((f, j) => {
    const m = [57, 60, 62, 65, 67, 69, 72, 74, 77, 79, 81, 84][j];
    s.pluck(f, m, 0.13, -0.5 + (j % 3) * 0.5, 0.25, 0.9, 0.985, 0.3);
    s.click(f, 0.12, 1400 + j * 60, -0.5 + (j % 3) * 0.5);
  });
  s.riser(640, 720, 0.12, 300, 16);

  EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').forEach((e) => s.gap(e.f));
  s.gap(ctx.length); // clear the bed before the next world's downbeat
  s.mix(1.62, 0.45, -6);
}
