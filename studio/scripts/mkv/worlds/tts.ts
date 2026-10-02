// World 4 · TEXT TO SPEECH — formant "vowel" synth chords morphing a -> e -> o (no words, no vocals),
// a glassy pluck melody, a half-time groove, one key click per typed character, an impact on the exact
// anamorphic alignment frame, a pluck strum as the letters land as waveform bars.
import type {SynthCtx} from '../types.ts';
import {EVENTS, KEYS, LAND, LINE, T} from '../../../src/mkv/worlds/tts/timing.ts';
import {BQ, Synth, TAU} from './live.ts';

const V: Record<string, [number[], number[]]> = {
  a: [[800, 1150, 2900], [1, 0.5, 0.25]],
  e: [[530, 1840, 2480], [1, 0.45, 0.3]],
  o: [[450, 800, 2830], [1, 0.32, 0.1]],
};
const morph = (A: string, B: string, u: number): [number[], number[]] => {
  const k = Math.min(1, Math.max(0, u));
  const s = k * k * (3 - 2 * k);
  return [V[A][0].map((x, q) => x + (V[B][0][q] - x) * s), V[A][1].map((x, q) => x + (V[B][1][q] - x) * s)];
};
// a (bar 1) -> e (bar 2) -> o (bar 3-4)
const vowel = (f: number) => (f < 120 ? V.a : f < 240 ? morph('a', 'e', (f - 120) / 120) : f < 360 ? morph('e', 'o', (f - 240) / 120) : V.o);

const CHORDS = [
  [57, 60, 64, 67, 71], // Am9
  [53, 57, 60, 64, 67], // Fmaj9
  [48, 55, 59, 62, 64], // Cmaj9
  [55, 59, 62, 64, 69], // G6/9
];
const ROOTS = [33, 29, 36, 31];
const PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98, 100];

export default function render(ctx: SynthCtx) {
  const s = new Synth(ctx, 404);

  // entrance: the shard arrives with a faint glass shimmer (Live's tail carries the swell)
  [-10, -6, -2].forEach((f, i) => s.bell(f, [93, 96, 100][i], 0.035, 1.2, -0.4 + i * 0.4, 2.76, 1.4, 0.7));

  // ---- formant "vowel" chords + sub, one chord per bar ----
  CHORDS.forEach((ch, b) => {
    const f0 = b * 120;
    const f1 = b === 3 ? 470 : f0 + 120;
    s.pad(ch, f0, f1, {vol: 0.5, att: b === 0 ? 0.35 : 0.12, rel: b === 3 ? 0.5 : 0.25, send: 0.32, vowel});
    s.pad(ch.map((m) => m + 12), f0, f1, {vol: 0.12, lp0: 2200, lp1: 3800, att: 0.2, rel: 0.4, send: 0.4});
    s.sub(f0, ROOTS[b], f1, 0.12);
  });

  // ---- half-time groove (kick 1 + "and of 2", clap on 3, soft shaker 16ths) ----
  for (let bar = 0; bar < 4; bar++) {
    const f0 = bar * 120;
    for (const k of [0, 45, 120 - 30 + 15].slice(0, bar === 3 ? 2 : 3)) {
      if (f0 + k >= 452) continue;
      s.kick(f0 + k, k === 0 ? 0.55 : 0.4);
    }
    if (f0 + 60 < 452) s.clap(f0 + 60, 0.3, 0.05, 0.3);
    for (let q = 0; q < 16; q++) {
      const f = f0 + q * 7.5;
      if (f >= 446) break;
      s.shaker(f, q % 4 === 2 ? 0.11 : 0.06, q % 2 ? 0.35 : -0.25);
    }
  }

  // ---- title slam ----
  s.hit(T.title, 0.32, 3000);
  s.pluck(T.title, 81, 0.14, 0.2, 0.4, 0.85, 0.997);

  // ---- glassy pluck melody while the shards orbit, converging on the alignment ----
  const mel = [69, 72, 76, 79, 76, 81, 79, 83];
  mel.forEach((m, i) => {
    s.pluck(i * 15, m, 0.15, i % 2 ? 0.4 : -0.4, 0.45, 0.85, 0.997);
    s.bell(i * 15, m + 12, 0.025, 0.5, i % 2 ? 0.4 : -0.4, 2, 0.5, 0.4);
  });
  s.riser(66, T.align, 0.2, 500, 12);

  // ---- the alignment impact (exact frame) ----
  s.boom(T.align, 0.8, 2.2);
  s.hit(T.align, 0.35, 2600);
  [93, 96, 100, 105].forEach((m, i) => s.bell(T.align, m, 0.06, 2.4, -0.6 + i * 0.4, 2.76 + i * 0.17, 1.8, 0.7));
  s.pluck(T.align, 81, 0.18, 0, 0.5, 0.9, 0.998);
  // after-melody, sparse (typing takes over the rhythm)
  [[135, 76], [150, 74], [165, 72], [180, 76]].forEach(([f, m], i) => s.pluck(f, m, 0.11, i % 2 ? 0.35 : -0.35, 0.45, 0.8, 0.996));

  // ---- pick a voice ----
  s.click(T.pick, 0.26, 2500, -0.2);
  s.bell(T.pick, 84, 0.06, 0.6, -0.2, 2, 0.6, 0.3);

  // ---- one key click per typed character ----
  [...LINE].forEach((ch, i) => {
    const f = KEYS[i];
    const v = 0.17 + 0.06 * s.rnd();
    const space = ch === ' ';
    const tone = 1700 + 900 * s.rnd();
    const bp = new BQ().set(2, 3800 + 1200 * s.rnd(), 1.4);
    const pan = -0.45 + (i / LINE.length) * 0.9;
    s.put(s.dry, s.s(f), s.sec(0.06), pan, 0.1, (t) =>
      v *
      ((space ? 0.5 : 1) * Math.sin(TAU * tone * t) * Math.exp(-t / 0.004) +
        1.4 * bp.run(s.noise()) * Math.exp(-t / 0.0025) +
        (space ? 1.1 : 0.55) * Math.sin(TAU * (space ? 120 : 165) * t) * Math.exp(-t / 0.012)),
    );
  });

  // ---- Generate speech ----
  s.hit(T.generate, 0.4, 2000);
  s.click(T.generate, 0.28, 2200, 0);
  {
    let ph = 0;
    s.put(s.dry, s.s(T.generate), s.sec(0.4), 0, 0.4, (t) => {
      ph += (TAU * (180 * 5 ** Math.min(1, t / 0.18))) / s.SR;
      return 0.14 * Math.sin(ph) * Math.min(1, t * 400) * Math.exp(-t / 0.12);
    });
  }
  // letters land and become bars: a glassy strum, one pluck per landing
  LAND.forEach((f, i) => s.pluck(f, PENTA[i % PENTA.length], 0.085, -0.6 + (i / LAND.length) * 1.2, 0.45, 0.9, 0.996));

  // ---- output row + play ----
  s.bell(T.output, 76, 0.1, 0.5, -0.2, 2, 0.8, 0.3);
  s.bell(T.output + 4.5, 83, 0.09, 0.9, 0.2, 2, 0.8, 0.35);
  s.click(T.play, 0.24, 2800, -0.3);

  // ---- exit: bars stand up into nested frames (portal to Training) ----
  s.whoosh(T.exit + 8, 0.22, 0.6, -0.6, 0.6);
  s.riser(452, 480, 0.16, 600, 8);

  EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').forEach((e) => s.gap(e.f));
  s.mix(0.76, 0.45, -6.8);
}
