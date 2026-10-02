// World 8 · Settings — minimal techno in A minor: tight kick, clicky 16ths, offbeat sub pulses, sparse metallic chords.
// A servo whir + click on each Necker flip (f60/90/120), a struck-metal impact when the cube solidifies (f150),
// ticks on the tabs, a rising sine blip per status row, a fill sweep for local storage, a hit on "Runs on your PC."
// and a servo whir + paper snap as the block unfolds into a page.
import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {blip, clang, click, stage, whir} from './evolution.ts';
import {EVENTS, T} from '../../../src/mkv/worlds/settings/timing.ts';

const SR = D.SR;

export default function render(ctx: SynthCtx) {
  const {bed, fx, s, finish} = stage(ctx);
  const L = ctx.length;
  const solid = (f: number) => f >= T.solid;
  // drums: before the solidify the groove is skeletal (kick on 1 & 3, clicks); after it, full minimal techno
  for (let f = 0; f < L; f += 30) {
    const beat = (f / 30) % 4;
    if (solid(f) || beat % 2 === 0) D.kick(bed, s(f), solid(f) ? 0.5 : 0.42);
    for (let k = 0; k < 4; k++) {
      const g = f + k * 7.5;
      const acc = k === 2 ? 0.1 : k === 0 ? 0.035 : 0.055;
      click(bed, s(g), solid(f) ? acc : acc * 0.6, 7000 + (k % 2) * 1800, k % 2 ? 0.35 : -0.35, 0.02);
    }
    if (solid(f) && beat % 2 === 1) D.clap(bed, s(f), 0.22, -0.1);
    // offbeat sub pulse on A (F under the status rows, back to A for "Runs on your PC.")
    const root = f >= 240 && f < 360 ? 29 : 33;
    if (f >= 30) D.bassPulse(bed, s(f + 15), root, 0.13, 0.24);
  }
  // sparse chords: soft FM stabs on the "and" of beat 4, Am9 / Fmaj9
  for (let bar = 0; bar < 4; bar++) {
    const ch = bar === 2 ? [53, 57, 60, 64, 67] : [57, 60, 64, 67, 71];
    D.rhodesChord(bed, s(bar * 120 + 105), ch, 0.18, 0.22, 0.5);
  }
  D.pad(bed, s(0), [45, 52, 57, 60, 64], (T.solid - 4) / 60, 0.16, {lp0: 300, lp1: 1400, att: 0.6, rel: 0.05, send: 0.5});
  D.pad(bed, s(T.solid), [45, 52, 59, 60, 64], (L - T.solid) / 60, 0.14, {lp0: 1600, lp1: 900, att: 0.02, rel: 0.3, send: 0.5});
  // Necker flips: servo whir peaking on the flip + a mechanical click on the frame
  T.flips.forEach((f, i) => {
    whir(fx, s(f), 0.12, 0.16, 0.2, 160, 420 + i * 60, i % 2 ? 0.35 : -0.35);
    click(fx, s(f), 0.26, 1500, 0);
    D.thump(fx, s(f), 0.18);
  });
  // solidify: struck metal + boom + a low hit
  clang(fx, s(T.solid), 0.5, 98);
  clang(fx, s(T.solid), 0.25, 196 * 1.5, 0.3);
  D.boom(fx, s(T.solid), 0.75, 2.4);
  D.hit(fx, s(T.solid), 0.55);
  // tabs: ticks rising along the row (the return to Overview drops back)
  T.tabs.forEach((f, i) => click(fx, s(f), 0.24, [2400, 2700, 3000, 3400, 2400][i], -0.4 + i * 0.2));
  // status rows: sine blip per row, climbing an A-minor arpeggio
  T.rows.forEach((f, i) => blip(fx, s(f), 0.15, [81, 84, 88, 93][i], [88, 91, 93, 100][i], -0.3 + i * 0.2));
  // local storage: tick + a smooth rising sine glide as the bar fills
  click(fx, s(T.storage), 0.22, 2000, 0);
  let ph = 0;
  const gl = 42 / 60;
  D.put(fx, s(T.storage), gl, 0.1, 0.4, (t) => {
    const u = t / gl;
    ph += (440 * 2 ** (u * 1.0)) / SR;
    return 0.05 * Math.sin(D.TAU * ph) * Math.sin(Math.PI * u);
  });
  // "Runs on your PC.": hit + a resolving chord
  D.hit(fx, s(T.pc), 0.6);
  D.boom(fx, s(T.pc), 0.3, 1.4);
  D.rhodesChord(bed, s(T.pc), [57, 64, 69, 72, 76], 1.2, 0.3, 0.5);
  // unfold: servo whir as the faces swing open, a paper snap as they land flat
  whir(fx, s(T.unfold[1]), 0.1, (T.unfold[1] - T.unfold[0]) / 60, 0.03, 200, 700, 0.2);
  click(fx, s(T.unfold[1]), 0.24, 1800, 0);
  finish(EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').map((e) => e.f));
}
