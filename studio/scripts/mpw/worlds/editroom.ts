// World 9 · EDIT ROOM — seven bars of chopped hip-hop: a swung pocket, sampled keyboard fragments,
// and a literal repeated slice on every Silence Rough Cut collapse. Edit events keep their exact frames.
import type {SynthCtx} from '../types.ts';
import {Synth} from './review.ts';
import {TAU, mtof} from '../dsp.ts';
import {BETA_CUTS, EVENTS, T} from '../../../src/mpw/worlds/editroom/timing.ts';

const CHORDS = [
  [50, 57, 60, 65], [46, 53, 57, 62], [53, 57, 60, 64],
  [50, 57, 60, 65], [48, 55, 60, 64], [46, 53, 57, 62], [50, 57, 60, 65],
];
const ROOTS = [38, 34, 29, 38, 36, 34, 38];

export default function render(ctx: SynthCtx) {
  const s = new Synth(ctx, 9009, -24, 30);
  // Generate one keyboard sample, then replay the actual waveform. No recorded media is required.
  const grainN = s.sec(0.14);
  const grain = new Float32Array(grainN);
  const sampleNotes = [62, 65, 69, 72];
  for (let n = 0; n < grainN; n++) {
    const t = n / s.SR;
    const env = Math.min(1, t / 0.002) * Math.exp(-t / 0.18) * Math.min(1, (0.14 - t) / 0.012);
    let v = 0;
    sampleNotes.forEach((m) => {
      const ph = TAU * mtof(m) * t;
      v += Math.sin(ph + 0.7 * Math.exp(-t / 0.08) * Math.sin(ph));
    });
    grain[n] = (v / sampleNotes.length) * env;
  }
  const chop = (f: number, amp: number, rate = 1, pan = 0, dur = 0.12) => {
    s.put(s.pump, s.s(f), s.sec(dur), pan, 0.14, (t) => {
      const ix = t * s.SR * rate;
      const k = Math.floor(ix);
      if (k >= grain.length - 1) return 0;
      const v = grain[k] + (grain[k + 1] - grain[k]) * (ix - k);
      return amp * v * Math.min(1, (dur - t) / 0.007);
    });
  };
  const quiet = (f: number) => f >= T.detect && f < T.list;
  // Drums swing; visual edits and their transients do not.
  for (let bar = 0; bar < 7; bar++) {
    const f0 = bar * 120;
    for (let k = 0; k < 16; k++) {
      const f = f0 + k * 7.5 + (k % 2 ? 1.1 : 0);
      if (f >= T.exit || quiet(f)) continue;
      if ([0, 6, 8, 14].includes(k)) s.kick(f, k === 0 ? 0.56 : 0.42);
      if (k === 4 || k === 12) {
        s.snare(f, 0.27, -0.1, 0.1, 0.9);
        s.clap(f, 0.12, 0.1, 0.1);
      }
      if (k % 2 === 0 || bar >= 4) s.hat(f, k % 4 === 0 ? 0.048 : 0.032, false, k % 2 ? -0.35 : 0.35);
      if (k === 11) s.rim(f, 0.052, -0.4);
      if ([0, 6, 10, 14].includes(k)) s.bass(f, ROOTS[bar] + (k === 14 ? 7 : 0), 0.23, 0.22, 360);
      if (k === 2 || k === 7 || k === 10 || k === 15) chop(f, 0.23, bar % 2 ? 2 ** (-2 / 12) : 1, k % 2 ? 0.4 : -0.4);
    }
    if (f0 < T.exit && !quiet(f0)) s.rhodes(f0, CHORDS[bar], 0.35, 0.17, 0.13, s.pump);
  }
  BETA_CUTS.forEach((f, i) => {
    chop(f, 0.18, i % 2 ? 1.12246 : 1, i % 2 ? 0.45 : -0.45, 0.1);
    s.rim(f, 0.06, i % 2 ? 0.3 : -0.3);
  });
  T.drop.forEach((f, i) => s.click(f, 0.13, 1900 + i * 650, 0));
  T.chop.forEach((f) => s.key(f, 0.1, -0.25));
  s.rhodes(T.illusion, [50, 57, 60, 65], 0.65, 0.28, 0.2, s.pump);
  T.switches.forEach((f, i) => chop(f, 0.25, [1, 0.943874, 1.122462, 1][i], -0.45 + i * 0.3));
  s.click(T.hold, 0.045, 1200, 0.25);
  // The regular beat leaves a hole during detection. Each collapse restarts the same waveform twice.
  T.collapse.forEach((f, i) => {
    s.kick(f, 0.38);
    chop(f, 0.36, 1, i % 2 ? 0.3 : -0.3, 0.12);
    chop(f + 7.5, 0.22, 1, i % 2 ? -0.3 : 0.3, 0.085);
  });
  s.riser(T.silence, T.detect - 2, 0.034, 450, 6);
  chop(T.keep, 0.24, 1, -0.2, 0.11);
  T.snaps.forEach((f, i) => s.bell(f, [74, 77, 81, 86][i], 0.06, 0.3, -0.45 + i * 0.3, 2, 0.6, 0.15));
  s.stab(T.lock, [62, 65, 69, 74], 0.24, 2300, 0.2, 0.15);
  [0, 7.5, 15].forEach((d, i) => chop(T.run + d, 0.22 - i * 0.04, 1, i % 2 ? 0.25 : -0.25, 0.1));
  s.bell(T.done, 86, 0.08, 0.35, 0.3, 2, 0.6, 0.15);
  s.rhodes(T.styles[0], [65, 69, 72], 0.25, 0.13, 0.12, s.pump);
  s.stab(T.styles[1], [65, 69, 72, 77], 0.19, 3000, 0.1, 0.15);
  s.bell(T.styles[2], 81, 0.07, 0.35, 0, 2, 0.4, 0.15);
  s.bell(T.dot, 77, 0.035, 0.2, 0, 2, 0.4, 0.1);
  EVENTS.forEach((e, i) => {
    if (e.kind === 'impact' || e.kind === 'hit') {
      s.hit(e.f, e.kind === 'impact' ? 0.46 : 0.36, e.kind === 'impact' ? 2100 : 2500);
      s.gap(e.f);
    } else if (e.kind === 'whoosh') {
      s.whoosh(e.f, 0.12, 0.42, 0.55, -0.2);
    } else if (e.kind === 'blip') {
      s.blip(e.f, 74, 81, 0.09, i % 2 ? 0.25 : -0.25, 0.09);
    } else {
      s.click(e.f, e.f === T.dot ? 0.025 : 0.095, 2200 + (i % 4) * 300, i % 2 ? 0.3 : -0.3);
    }
  });
  s.gap(ctx.length);
  s.mix(1.0, 0.62, -6.8);
}
