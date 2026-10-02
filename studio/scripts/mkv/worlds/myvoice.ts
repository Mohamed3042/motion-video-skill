// World 1 · MY VOICE — warm FM-Rhodes (Am9 → Fmaj9 → C → G6), soft kick, brushes; a stab on every card/tab landing.
// Also exports the small local-bus helpers that clonelab.ts reuses (render → duck before hits → loudness + limiter).
import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {CARD, CHARS, COMP, EVENTS, PEAK, TABS} from '../../../src/mkv/worlds/myvoice/timing.ts';

// ---------- shared helpers (also used by clonelab.ts) ----------
export type Local = {bed: D.Out; fx: D.Out; i0: number; n: number; s: (f: number) => number; ctx: SynthCtx};

// Local buses covering [−15 f, length + 15 f] plus a tail; s(f) = local sample index of world frame f.
export function local(ctx: SynthCtx, tail = 0.7): Local {
  const i0 = Math.max(0, Math.floor(ctx.at(-15)));
  const n = Math.min(ctx.L.length, Math.ceil(ctx.at(ctx.length + 15) + tail * ctx.SR)) - i0;
  return {bed: D.makeOut(n), fx: D.makeOut(n), i0, n, s: (f) => ctx.at(f) - i0, ctx};
}

// Pull the bed down just before each hit so the hit is a clean transient (the onset check compares the 10 ms after
// an event with the 50–5 ms before it). The bed snaps back on the hit itself, where the hit masks the return.
export function duck(o: D.Out, at: number[], depthDb = -14, pre = 0.065) {
  const g = new Float32Array(o.L.length).fill(1);
  const d = 10 ** (depthDb / 20);
  const SR = D.SR;
  for (const s of at) {
    const a = Math.round(s - (pre + 0.02) * SR);
    const b = Math.round(s - pre * SR);
    const e = Math.round(s);
    for (let i = Math.max(0, a); i < Math.min(g.length, e + 0.004 * SR); i++) {
      const v = i < b ? 1 + (d - 1) * ((i - a) / (b - a)) : i < e ? d : d + (1 - d) * ((i - e) / (0.004 * SR));
      g[i] = Math.min(g[i], v);
    }
  }
  for (const k of ['L', 'R', 'sendL', 'sendR'] as const) for (let i = 0; i < g.length; i++) o[k][i] *= g[i];
}

// Mix bed + fx, set the world to ~-16 LUFS (measured as solo.ts hears it: dry + send at -8 dB) with a look-ahead
// limiter at `ceilDb`, then add into the track.
export function finish(W: Local, target = -16, ceilDb = -6.3) {
  const {bed, fx, n, ctx, i0} = W;
  const g8 = 10 ** (-8 / 20);
  const dL = new Float64Array(n);
  const dR = new Float64Array(n);
  const sL = new Float64Array(n);
  const sR = new Float64Array(n);
  const hL = new Float64Array(n);
  const hR = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    dL[i] = bed.L[i] + fx.L[i];
    dR[i] = bed.R[i] + fx.R[i];
    sL[i] = bed.sendL[i] + fx.sendL[i];
    sR[i] = bed.sendR[i] + fx.sendR[i];
    hL[i] = dL[i] + g8 * sL[i];
    hR[i] = dR[i] + g8 * sR[i];
  }
  const a = Math.max(0, Math.round(W.s(0)));
  const b = Math.min(n, Math.round(W.s(ctx.length)));
  const env = D.peakEnv(hL);
  const envR = D.peakEnv(hR);
  for (let i = 0; i < n; i++) env[i] = Math.max(env[i], envR[i]);
  const ones = new Float64Array(n).fill(1);
  let gain = 10 ** ((target - D.lufsRange(D.kPrefix(hL), D.kPrefix(hR), a, b)) / 20);
  let curve = D.limit(ones, ones, env, gain, ceilDb)[0];
  for (let it = 0; it < 6; it++) {
    const yL = hL.map((v, i) => v * curve[i]);
    const yR = hR.map((v, i) => v * curve[i]);
    const loud = D.lufsRange(D.kPrefix(yL), D.kPrefix(yR), a, b);
    if (Math.abs(loud - target) < 0.05) break;
    gain *= 10 ** ((target - loud) / 20);
    curve = D.limit(ones, ones, env, gain, ceilDb)[0];
  }
  for (let i = 0; i < n; i++) {
    const j = i0 + i;
    if (j >= ctx.L.length) break;
    ctx.L[j] += dL[i] * curve[i];
    ctx.R[j] += dR[i] * curve[i];
    ctx.sendL[j] += sL[i] * curve[i];
    ctx.sendR[j] += sR[i] * curve[i];
  }
}

// brushed snare and brushed hat (soft attacks, filtered noise)
export function brush(o: D.Out, s: number, vol: number, pan = -0.1) {
  const bp = new D.BQ().set(2, 2400, 0.6);
  let ph = 0;
  D.put(o, s, 0.3, pan, 0.25, (t, r) => {
    ph += (D.TAU * 190) / D.SR;
    const e = Math.min(1, t / 0.006) * Math.exp(-t / 0.11);
    return vol * (2.2 * bp.run(r() * 2 - 1) * e + 0.35 * Math.sin(ph) * Math.exp(-t / 0.04));
  });
}
export function swish(o: D.Out, s: number, vol: number, pan = 0.3) {
  const hp = new D.BQ().set(1, 6200, 0.7);
  D.put(o, s, 0.12, pan, 0.05, (t, r) => vol * hp.run(r() * 2 - 1) * Math.min(1, t / 0.003) * Math.exp(-t / 0.03));
}

// ---------- My Voice ----------
const CHORDS = [
  {root: 45, notes: [57, 60, 64, 67, 71]}, // Am9
  {root: 41, notes: [53, 57, 60, 64, 67]}, // Fmaj9
  {root: 48, notes: [52, 55, 60, 64, 67]}, // C
  {root: 43, notes: [55, 59, 62, 64, 67]}, // G6
];
const chordAt = (f: number) => CHORDS[Math.max(0, Math.min(3, Math.floor(f / 120)))];

export default function render(ctx: SynthCtx) {
  const W = local(ctx);
  const {bed, fx, s} = W;

  for (let bar = 0; bar < 4; bar++) {
    const f0 = bar * 120;
    const ch = CHORDS[bar];
    // warm pad underneath
    D.pad(bed, s(f0), ch.notes.slice(1), 2.0, 0.07, {lp0: 650, lp1: 1300, att: 0.25, rel: 0.6, send: 0.55});
    // Rhodes comp on beat 1, the "and" of 2, beat 4
    const voicings = [ch.notes, ch.notes.slice(2), ch.notes.slice(1)];
    const durs = [0.68, 0.6, 0.42];
    const vols = [0.34, 0.22, 0.26];
    COMP.forEach((c, j) => D.rhodesChord(bed, s(f0 + c), voicings[j], durs[j], vols[j], 0.4));
    // bass: root, a push on the "and" of 2, a short pickup on 4
    const r = ch.root - 12;
    D.sub(bed, s(f0), r, 0.62, 0.19);
    D.bassPulse(bed, s(f0), r + 12, 0.55, 0.09);
    D.sub(bed, s(f0 + 45), r, 0.28, 0.15);
    D.sub(bed, s(f0 + 90), r + 7, 0.36, 0.13);
    // soft groove: kick on 1 and 3, brushes on 2 and 4, swung brushed 16ths
    if (bar === 0) D.kick(bed, s(f0), 0.3); // bars 2–4 open on a hit, which carries the low end
    D.kick(bed, s(f0 + 60), 0.25);
    if (bar >= 2) D.kick(bed, s(f0 + 105), 0.13);
    brush(bed, s(f0 + 30), 0.14);
    brush(bed, s(f0 + 90), 0.15);
    for (let k = 0; k < 16; k++) {
      const swing = k % 2 ? 1.6 : 0;
      swish(bed, s(f0 + k * 7.5 + swing), [0.11, 0.05, 0.08, 0.05][k % 4] * (bar ? 1 : 0.7), k % 2 ? 0.35 : 0.2);
    }
  }

  // contour detaches: a soft swell that peaks mid-flight; exit: the line straightens
  for (const e of EVENTS.filter((e) => e.kind === 'whoosh')) D.whoosh(fx, s(e.f), 0.12, 0.4, 0.25);

  // stabs on every card / tab landing (bright, high Rhodes) + a transient
  const stab = (f: number, vol: number, up = 12) => {
    const ch = chordAt(f).notes.slice(1).map((m) => m + up);
    ch.forEach((m, j) => D.rhodes(fx, s(f) + j * 0.004 * D.SR, m, 0.32, vol / Math.sqrt(ch.length), (j / (ch.length - 1)) * 0.9 - 0.45, 0.45));
  };
  // illusion peak: the vase arrives
  D.thump(fx, s(PEAK), 0.22);
  stab(PEAK, 0.24);
  D.bell(fx, s(PEAK), 84, 0.07, 1.6, 0.2, 2, 0.8, 0.5);
  // card lands
  D.hit(fx, s(CARD), 0.2);
  stab(CARD, 0.27);
  D.bell(fx, s(CARD), 88, 0.08, 1.8, -0.2, 2, 0.8, 0.5);
  // tabs sweep: rising single notes + a click
  TABS.slice(1).forEach((f, i) => {
    D.rhodes(fx, s(f), [76, 79, 84][i], 0.3, 0.2, [-0.3, 0, 0.3][i], 0.4);
    D.hat(fx, s(f), 0.12, false, [-0.3, 0, 0.3][i]);
  });
  // characters re-tint: a stab + a different bell colour each
  CHARS.forEach((f, i) => {
    D.hit(fx, s(f), [0.22, 0.16, 0.16][i]);
    stab(f, [0.28, 0.24, 0.24][i]);
    D.bell(fx, s(f), [79, 83, 86][i], 0.08, 1.5, [-0.3, 0.3, 0][i], [2, 3, 1.5][i], 1.1, 0.5);
  });

  duck(bed, EVENTS.filter((e) => e.kind === 'hit' || e.kind === 'impact').map((e) => s(e.f)));
  finish(W);
}
