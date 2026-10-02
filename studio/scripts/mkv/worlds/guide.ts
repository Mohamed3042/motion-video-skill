// World 9 · Guide — soft bells, page swishes, a warm pad and a light groove that thins out for the finale lift.
// Fmaj7 → C/E → Am7 → Gsus4–G (ends on the dominant). A bell as each Kanizsa disc clicks into place, a soft hit when
// the illusory square completes (f90), a key tick per typed character, a swish per FAQ card and on the page turn.
import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {blip, click, stage, swish} from './evolution.ts';
import {EVENTS, T, typeFrames} from '../../../src/mkv/worlds/guide/timing.ts';

const SR = D.SR;
const CHORDS = [
  [53, 57, 60, 64], // Fmaj7
  [52, 55, 60, 64, 67], // C/E
  [57, 60, 64, 67], // Am7
  [55, 60, 62, 67], // Gsus4 (→ G under the exit)
];
const ROOTS = [29, 28, 33, 31];

export default function render(ctx: SynthCtx) {
  const {bed, fx, s, finish} = stage(ctx);
  const L = ctx.length; // 420
  CHORDS.forEach((ch, b) => {
    const f0 = b * 120;
    const dur = (Math.min(L, f0 + 120) - f0) / 60;
    D.pad(bed, s(f0), ch, dur, 0.26, {lp0: 900, lp1: 2400, att: b === 0 ? 0.5 : 0.12, rel: 0.5, send: 0.55});
    D.rhodesChord(bed, s(f0), ch.map((m) => m + 12), Math.min(1.8, dur), 0.16, 0.5);
    if (f0 < 360) D.sub(bed, s(f0), ROOTS[b], dur - 0.05, 0.13);
  });
  D.rhodesChord(bed, s(390), [55, 59, 62, 67, 71], 0.5, 0.14, 0.6); // G resolves the sus under the rings
  // light groove: full to f300, then kick drops (rim + shaker only), then nothing but pad and bells from f360
  for (let f = 0; f < 360; f += 30) {
    const beat = (f / 30) % 4;
    if (f < 300 && beat % 2 === 0) D.kick(bed, s(f), 0.42);
    if (beat % 2 === 1) D.clap(bed, s(f), f < 300 ? 0.16 : 0.1, 0.15);
    const typing = f >= T.typeFrom - 8 && f < typeFrames[typeFrames.length - 1] + 4;
    if (!typing) for (let k = 0; k < 4; k++) D.hat(bed, s(f + k * 7.5), k === 2 ? 0.085 : 0.04, false, k % 2 ? 0.35 : -0.35);
    if (f < 300) D.bassPulse(bed, s(f + 15), ROOTS[Math.floor(f / 120)] + 12, 0.14, 0.16);
  }
  // Kanizsa discs: one clear bell each as it clicks into place
  T.discs.forEach((f, i) => {
    D.bell(fx, s(f), [84, 88, 91, 95][i], 0.17, 1.8, -0.5 + i * 0.33, 3.5, 1.3, 0.5);
    click(fx, s(f), 0.1, 2600, -0.5 + i * 0.33);
  });
  // square complete: soft hit + bell chord (Fmaj9 high)
  D.hit(fx, s(T.square), 0.5);
  D.boom(fx, s(T.square), 0.3, 1.6);
  [77, 81, 84, 88, 91].forEach((m, j) => D.bell(fx, s(T.square) + j * 0.018 * SR, m, 0.06, 2.6, j % 2 ? 0.5 : -0.5, 2, 1, 0.65));
  // the page flips onto the deck
  swish(fx, s(T.toDeck), 0.16, 0.18, 0.12, -0.2);
  // typing: soft key ticks, slightly varied
  typeFrames.forEach((f, i) => click(fx, s(f), 0.17 + 0.03 * ((i * 7) % 3), 2600 + ((i * 37) % 5) * 260, 0.15, 0.05));
  // FAQ cards dealt: a short swish each, panned with the card
  T.fan.forEach((f, i) => swish(fx, s(f), 0.12, 0.09, 0.07, [-0.7, 0.7, -0.35, 0.35, 0][i], 1400, 8000));
  // the illustrated page turns
  swish(fx, s(T.flip), 0.18, 0.22, 0.14, 0.3, 700, 6000);
  // chips
  blip(fx, s(T.chips[0]), 0.14, 84, 88, -0.3);
  blip(fx, s(T.chips[1]), 0.14, 86, 91, 0.3);
  // exit: pages scatter (swish) and nine rings ring in — a rising C-major pentatonic bell cascade
  swish(fx, s(T.exit + 2), 0.14, 0.1, 0.12, 0, 600, 5000);
  [72, 74, 76, 79, 81, 84, 86, 88, 91].forEach((m, i) => D.bell(fx, s(T.exit + 4 + i * 2), m, 0.06, 1.1, -0.8 + i * 0.2, 2, 0.9, 0.6));
  finish(EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').map((e) => e.f));
}
