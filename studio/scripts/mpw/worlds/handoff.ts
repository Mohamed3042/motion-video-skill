// World 5 · HANDOFF — confident brass-ish stabs in F major over a straight, sure-footed groove. A stab as the bars
// become prongs, a rising triad stab per labelled prong (FCP7 XML / SRT · VTT / JSON REPORT), a bell per file
// that lands in the package, a snare build as the fork sinks in, then the big package seal (boom + stamp + full
// brass chord). A pop as the lid opens and a shimmering pour as the waveform spills out into Sound Lab.
import type {SynthCtx} from '../types.ts';
import {Synth} from './review.ts';
import {BQ, TAU} from '../../mkv/dsp.ts';
import {EVENTS, T} from '../../../src/mpw/worlds/handoff/timing.ts';

const BARS = [
  {ch: [53, 57, 60, 65], root: 29}, // F
  {ch: [50, 57, 62, 65], root: 26}, // Dm7
  {ch: [46, 53, 58, 62], root: 34}, // Bbmaj
  {ch: [53, 57, 60, 65], root: 29}, // F (the seal resolves here)
  {ch: [50, 57, 62, 65], root: 26}, // Dm → into Sound Lab
];

export default function render(ctx: SynthCtx) {
  const s = new Synth(ctx, 5005);

  // ---- the bars become prongs (downbeat) ----
  s.hit(0, 0.4, 2000);
  s.brass(0, [53, 57, 60, 65, 69], 0.35, 0.55, 1.1);
  s.kick(0, 0.6);

  // ---- the groove ----
  for (let bar = 0; bar < 5; bar++) {
    const b0 = bar * 120;
    const build = bar === 2;
    for (let k = 0; k < 8; k++) {
      const f = b0 + k * 15;
      if (f >= 552) break;
      if (build && f >= 312) continue; // the snare build takes over
      if (k === 0 || k === 4 || k === 7) s.kick(f, k === 0 ? 0.6 : 0.48);
      if (k === 2 || k === 6) s.clap(f, 0.3, 0.05, 0.22);
      s.hat(f + 7.5, 0.1, k === 7, 0.25);
      s.hat(f, 0.05, false, -0.2);
    }
    if (b0 < 552) {
      const {root, ch} = BARS[bar];
      s.bass(b0, root, 0.45, 0.32, 380);
      s.bass(b0 + 45, root, 0.2, 0.22, 420);
      s.bass(b0 + 60, root + 12, 0.15, 0.2, 520);
      s.bass(b0 + 90, root + 7, 0.25, 0.22, 460);
      s.pad(ch, b0, Math.min(b0 + 120, 560), {vol: 0.1, lp0: 900, lp1: 1600, att: 0.15, rel: 0.4, send: 0.45});
    }
  }
  s.sub(0, 29, 120, 0.07);
  s.sub(120, 26, 240, 0.07);
  s.sub(240, 34, 312, 0.07);
  s.sub(T.seal, 29, 480, 0.1);
  s.sub(480, 26, 552, 0.08);
  // a brass answer at the end of bar 1
  s.brass(90, [60, 64, 67], 0.12, 0.3, 0.8);
  s.brass(105, [62, 65, 69], 0.12, 0.3, 0.8);

  // ---- three prongs, three rising stabs ----
  const triads = [
    [65, 69, 72, 77], // F
    [70, 74, 77, 82], // Bb
    [72, 76, 79, 84], // C
  ];
  [T.xml, T.subs, T.json].forEach((f, i) => {
    s.hit(f, 0.34, 2200 + i * 300);
    s.brass(f, triads[i], 0.22, 0.5, 1.2);
    s.brass(f, [triads[i][0] - 24], 0.22, 0.25, 0.6);
  });
  // a confident answer phrase after the third prong
  [[210, [69, 72, 77]], [225, [67, 70, 74]], [240, [65, 70, 74]]].forEach(([f, ch]) => s.brass(f as number, ch as number[], 0.1, 0.26, 0.9));

  // ---- the package rises; each prong's file lands in it ----
  s.whoosh(T.box, 0.16, 0.5, -0.3, 0.3);
  T.arrive.forEach((f, i) => {
    s.click(f, 0.24, 3000 + i * 300, -0.4 + i * 0.4);
    s.bell(f, [84, 88, 91][i], 0.07, 1.0, -0.4 + i * 0.4, 2.0, 1.0, 0.45);
  });
  // descending glides as the pulses run down the prongs
  T.arrive.forEach((f, i) => {
    let ph = 0;
    const i0 = s.s(f - 66);
    const len = s.s(f) - i0;
    s.put(s.dry, i0, len, -0.4 + i * 0.4, 0.3, (t) => {
      const u = t / (len / s.SR);
      ph += (TAU * (1400 * 0.35 ** u + i * 60)) / s.SR;
      return 0.022 * Math.sin(ph) * Math.min(1, u * 8) * (1 - u * 0.6);
    });
  });

  // ---- build: snare roll + riser while the fork sinks in, then the seal ----
  for (let f = 312; f < T.seal - 3; ) {
    const u = (f - 312) / (T.seal - 312);
    s.snare(f, 0.08 + 0.2 * u * u, 0, 0.2);
    f += u < 0.5 ? 7.5 : 3.75;
  }
  s.riser(300, T.seal, 0.14, 300, 18);
  {
    // the fork sinking: a falling, filtered saw slide
    const i0 = s.s(T.sink);
    const len = s.s(T.seal - 10) - i0;
    const lp = new BQ().set(0, 900, 1.5);
    let ph = 0;
    s.put(s.pump, i0, len, 0, 0.2, (t) => {
      const u = t / (len / s.SR);
      ph = (ph + (220 * 0.4 ** u) / s.SR) % 1;
      return 0.05 * lp.run(2 * ph - 1) * Math.min(1, u * 10) * (1 - u);
    });
  }
  s.boom(T.seal, 0.8, 2.6);
  s.hit(T.seal, 0.5, 1600);
  s.brass(T.seal, [41, 53, 57, 60, 65, 69, 72], 1.3, 0.75, 1.3, 0.55);
  [84, 89, 93, 96].forEach((m, i) => s.bell(T.seal, m, 0.05, 2.2, -0.45 + i * 0.3, 3.0, 1.2, 0.6));

  // ---- the originals: a check ----
  s.click(T.untouched, 0.22, 2800, -0.4);
  s.bell(T.untouched, 88, 0.07, 1.2, -0.4, 2.0, 0.9, 0.45);
  s.brass(T.untouched + 30, [65, 69, 72], 0.14, 0.24, 0.8);
  s.brass(480, [62, 65, 69, 74], 0.3, 0.32, 0.9);

  // ---- exit: the lid pops, a waveform pours out ----
  s.blip(T.lid, 72, 91, 0.16, 0.3, 0.16);
  s.click(T.lid, 0.16, 1800, 0.3);
  s.whoosh(T.pour, 0.18, 0.7, 0.5, -0.3);
  {
    // the pour: a shimmering rising cluster (sage), opening toward Sound Lab
    const i0 = s.s(T.lid + 2);
    const len = s.s(612) - i0;
    const parts = [74, 77, 81, 84, 86, 89];
    s.put(s.dry, i0, len, 0, 0.6, (t) => {
      const u = t / (len / s.SR);
      let y = 0;
      parts.forEach((m, k) => {
        const fq = 440 * 2 ** ((m - 69) / 12);
        y += Math.sin(TAU * fq * t * (1 + 0.002 * Math.sin(TAU * (3 + k) * t))) * (0.5 + 0.5 * Math.sin(TAU * (6 + k * 1.7) * t + k));
      });
      return (0.035 * y * Math.min(1, u * 3) * Math.min(1, (1 - u) * 6)) / 2;
    });
  }
  s.pad([50, 57, 62, 65, 69], 540, 612, {vol: 0.12, lp0: 800, lp1: 3600, att: 0.3, rel: 0.5, send: 0.6});

  EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').forEach((e) => s.gap(e.f));
  s.gap(ctx.length); // clear the bed before the next world's downbeat
  s.mix(1.1, 0.5, -6);
}
