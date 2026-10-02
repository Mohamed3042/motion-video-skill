// World 7 · Evolution — stereo ping-pong A/B call-and-response (A hard left, B hard right), phaser sweep into the
// moiré reveal (impact f180), UI ticks/blips, impact + scan sweep on "Run comparison" (f360). Am → F → C → G, 120 BPM.
// Also exports the small stage/instrument kit shared by worlds 8 (settings) and 9 (guide) — same builder.
import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {EVENTS, PINGS, T} from '../../../src/mkv/worlds/evolution/timing.ts';

const SR = D.SR;

// ---------- stage: local bed + fx buses, pre-impact ducking, loudness/peak normalisation, mixdown into ctx ----------
export function stage(ctx: SynthCtx) {
  const base = Math.floor(ctx.at(-30));
  const n = Math.ceil(ctx.at(ctx.length) + 0.7 * SR) - base;
  const bed = D.makeOut(n);
  const fx = D.makeOut(n);
  const s = (f: number) => ctx.at(f) - base; // world frame → local sample (fractional)
  // ducks: frames of impacts/hits — the bed dips ~-18 dB from 60 ms before each so the onset is a clean transient.
  // The bed also fades out just before the world's end boundary (the next portal impact).
  const finish = (ducks: number[], target = -16, ceilDb = -6) => {
    const g = new Float64Array(n).fill(1);
    for (const f of ducks) {
      const c = s(f);
      for (let i = Math.max(0, Math.floor(c - 0.1 * SR)); i < Math.min(n, c + 0.002 * SR); i++) {
        const t = (i - c) / SR;
        const d = t < -0.09 ? 0 : t < -0.06 ? (t + 0.09) / 0.03 : t < 0 ? 1 : 1 - t / 0.002;
        g[i] = Math.min(g[i], 1 - 0.88 * d);
      }
    }
    const gx = g.slice(); // fx (event sounds) share the pre-impact dips, but keep their tails past the world end
    const cEnd = s(ctx.length);
    for (let i = Math.max(0, Math.floor(cEnd - 0.2 * SR)); i < n; i++) g[i] = Math.min(g[i], Math.max(0, Math.min(1, (cEnd - 0.06 * SR - i) / (0.14 * SR))));
    for (let i = 0; i < Math.min(n, Math.floor(s(0))); i++) g[i] = 0; // nothing of the bed before the downbeat
    const L = new Float64Array(n);
    const R = new Float64Array(n);
    const SL = new Float64Array(n);
    const SRr = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      L[i] = bed.L[i] * g[i] + fx.L[i] * gx[i];
      R[i] = bed.R[i] * g[i] + fx.R[i] * gx[i];
      SL[i] = bed.sendL[i] * g[i] + fx.sendL[i] * gx[i];
      SRr[i] = bed.sendR[i] * g[i] + fx.sendR[i] * gx[i];
    }
    // measure like solo.ts does (send mixed in at -8 dB)
    const k = 10 ** (-8 / 20);
    const mL = L.map((v, i) => v + k * SL[i]);
    const mR = R.map((v, i) => v + k * SRr[i]);
    const env = D.peakEnv(mL);
    const envR = D.peakEnv(mR);
    for (let i = 0; i < n; i++) env[i] = Math.max(env[i], envR[i]);
    const ones = new Float32Array(n).fill(1);
    const [a, b] = [Math.round(s(0)), Math.round(s(ctx.length))];
    let gain = 1;
    let curve: Float32Array = ones;
    for (let it = 0; it < 4; it++) {
      [curve] = D.limit(ones, ones, env, gain, ceilDb) as unknown as [Float32Array, Float32Array];
      const lufs = D.lufsRange(D.kPrefix(mL.map((v, i) => v * curve[i])), D.kPrefix(mR.map((v, i) => v * curve[i])), a, b);
      if (!Number.isFinite(lufs) || Math.abs(lufs - target) < 0.1) break;
      gain *= 10 ** ((target - lufs) / 20);
    }
    for (let i = 0; i < n; i++) {
      const j = base + i;
      if (j < 0 || j >= ctx.L.length) continue;
      ctx.L[j] += L[i] * curve[i];
      ctx.R[j] += R[i] * curve[i];
      ctx.sendL[j] += SL[i] * curve[i];
      ctx.sendR[j] += SRr[i] * curve[i];
    }
  };
  return {bed, fx, s, n, finish};
}

// ---------- small instruments on top of dsp.ts ----------
const noise = (r: () => number) => r() * 2 - 1;
// UI tick: short pitched click + noise snap
export function click(o: D.Out, s: number, vol: number, freq = 3000, pan = 0, send = 0.08) {
  D.put(o, s, 0.06, pan, send, (t, r) => vol * (Math.sin(D.TAU * freq * t) * Math.exp(-t / 0.006) + noise(r) * Math.exp(-t / 0.0012) * 0.7));
}
// two-tone sine blip (status light / chip landing)
export function blip(o: D.Out, s: number, vol: number, m1: number, m2: number, pan = 0) {
  D.put(o, s, 0.012, pan, 0, (t, r) => vol * 0.5 * noise(r) * Math.exp(-t / 0.0015)); // tiny attack tick for a crisp onset
  D.bell(o, s, m1, vol, 0.32, pan, 2, 0.45, 0.2);
  D.bell(o, s + 0.065 * SR, m2, vol, 0.7, pan, 2, 0.45, 0.3);
}
// paper swish: band-passed noise with flutter, energy peaking on sample `c`
export function swish(o: D.Out, c: number, vol: number, pre = 0.14, post = 0.1, pan = 0.25, lo = 900, hi = 6500) {
  const bp = new D.BQ();
  D.put(o, c - pre * SR, pre + post, pan, 0.2, (t, r) => {
    const u = t - pre;
    const e = u < 0 ? (1 + u / pre) ** 2.5 : Math.exp(-u / (post * 0.35));
    if ((Math.round(t * SR) & 15) === 0) bp.set(2, lo * (hi / lo) ** Math.min(1, t / pre), 1.4);
    return vol * e * (0.75 + 0.25 * Math.sin(D.TAU * 31 * t)) * bp.run(noise(r)) * 2.2;
  });
}
// servo whir: buzzy saw through a band-pass whose pitch rises to `c` and falls after it
export function whir(o: D.Out, c: number, vol: number, pre = 0.2, post = 0.22, f0 = 170, f1 = 560, pan = 0.25) {
  const bp = new D.BQ();
  let ph = 0;
  D.put(o, c - pre * SR, pre + post, pan, 0.15, (t) => {
    const u = t - pre;
    const k = u < 0 ? 1 + u / pre : Math.max(0, 1 - u / post);
    const f = f0 + (f1 - f0) * k ** 0.8;
    ph = (ph + f / SR) % 1;
    if ((Math.round(t * SR) & 31) === 0) bp.set(2, f * 2.5, 2.2);
    return vol * k ** 1.4 * (1 + 0.2 * Math.sin(D.TAU * 41 * t)) * bp.run(2 * ph - 1) * 2.4;
  });
}
// metallic clang: inharmonic partials (struck plate)
export function clang(o: D.Out, s: number, vol: number, f0 = 196, pan = 0) {
  const P = [
    [1, 1, 1.1],
    [2.76, 0.6, 0.7],
    [5.4, 0.42, 0.45],
    [8.93, 0.25, 0.25],
    [13.3, 0.15, 0.15],
  ];
  D.put(o, s, 2.2, pan, 0.45, (t) => {
    let y = 0;
    for (const [r, a, d] of P) y += a * Math.sin(D.TAU * f0 * r * t) * Math.exp(-t / d);
    return (vol * y * Math.min(1, t * 3000)) / 2;
  });
}
// first-order allpass phaser, in place over [i0, i1); sweep(u) ∈ [0,1] → notch centre 250 Hz … 4 kHz
export function phaser(o: D.Out, i0: number, i1: number, sweep: (u: number) => number, mix = 0.5) {
  for (const ch of [o.L, o.R, o.sendL, o.sendR]) {
    const xs = new Float64Array(6);
    const ys = new Float64Array(6);
    let fb = 0;
    for (let i = Math.max(0, i0); i < Math.min(ch.length, i1); i++) {
      const u = (i - i0) / (i1 - i0);
      const fc = 250 * 16 ** sweep(u);
      const tn = Math.tan((Math.PI * fc) / SR);
      const a = (tn - 1) / (tn + 1);
      let y = ch[i] + 0.35 * fb;
      for (let k = 0; k < 6; k++) {
        const out = a * y + xs[k] - a * ys[k];
        xs[k] = y;
        ys[k] = out;
        y = out;
      }
      fb = y;
      ch[i] = ch[i] * (1 - mix) + y * mix;
    }
  }
}

// ---------- the Evolution score ----------
const CHORDS = [
  [57, 60, 64, 67], // Am7
  [53, 57, 60, 64], // Fmaj7
  [48, 55, 60, 62, 64], // Cadd9
  [55, 59, 62, 64], // G6
];
const ROOTS = [33, 29, 36, 31];
// call (A, original) and response (B, candidate): same rhythm, the candidate changes the last note
const CALL = [
  [69, 72, 76],
  [65, 69, 72],
  [67, 72, 76],
  [67, 71, 74],
];
const RESP = [
  [69, 72, 79],
  [65, 69, 76],
  [67, 72, 79],
  [67, 71, 79],
];

export default function render(ctx: SynthCtx) {
  const {bed, fx, s, finish} = stage(ctx);
  const L = ctx.length;
  // pads (phaser applied below) + bass
  const pad = D.makeOut(bed.L.length);
  CHORDS.forEach((ch, b) => {
    D.pad(pad, s(b * 120), ch, 2, b === 0 ? 0.2 : 0.24, {lp0: 700, lp1: 2200, att: b === 0 ? 0.25 : 0.06, rel: 0.4, send: 0.45});
    for (let k = 0; k < 4; k++) {
      const f = b * 120 + k * 30 + 15;
      if (f < L) D.bassPulse(bed, s(f), ROOTS[b], 0.2, 0.26);
    }
    D.sub(bed, s(b * 120), ROOTS[b], 1.9, 0.12);
  });
  // phaser: slow wobble in bar 1, a full rising sweep through the convergence into the reveal, slow after
  phaser(pad, s(0), s(L), (u) => {
    const f = u * L;
    if (f < 120) return 0.25 + 0.2 * Math.sin(f / 30);
    if (f < T.reveal) return 0.15 + 0.85 * ((f - 120) / (T.reveal - 120)) ** 1.4;
    return 0.35 + 0.3 * Math.sin((f - T.reveal) / 40);
  });
  for (let i = 0; i < pad.L.length; i++) {
    bed.L[i] += pad.L[i];
    bed.R[i] += pad.R[i];
    bed.sendL[i] += pad.sendL[i];
    bed.sendR[i] += pad.sendR[i];
  }
  // drums: bar 1 sparse (title), bar 2 builds (16th hats), bars 3–4 full groove
  for (let f = 0; f < L; f += 30) {
    const bar = Math.floor(f / 120);
    const beat = (f / 30) % 4;
    if (bar !== 0 || beat % 2 === 0) D.kick(bed, s(f), 0.55);
    if (bar >= 2 && beat % 2 === 1) D.clap(bed, s(f), 0.32, 0.1);
    D.hat(bed, s(f + 15), 0.13, bar >= 2 && beat === 3, 0.3);
    if (bar >= 1) {
      D.hat(bed, s(f + 7.5), 0.05, false, -0.3);
      D.hat(bed, s(f + 22.5), 0.05, false, -0.3);
    }
  }
  // ping-pong motif: A hard left, B hard right, each with a quiet echo on the opposite side one 8th later
  PINGS.forEach((p) => {
    const m = (p.side === 'A' ? CALL : RESP)[p.bar][p.step % 3];
    const pan = p.side === 'A' ? -0.95 : 0.95;
    D.pluck(bed, s(p.f), m, 0.3, pan, 0.3, 0.75);
    D.bell(bed, s(p.f), m + 12, 0.05, 0.6, pan, 2, 0.8, 0.35);
    D.pluck(bed, s(p.f + 15), m, 0.09, -pan, 0.4, 0.6);
  });
  // convergence: noise riser with a hard cut 60 ms before the reveal
  D.riser(bed, s(120), s(T.reveal - 3.6), 0.2, 300, 9000);
  // reveal impact: boom + hit + shimmer (Am add9 high)
  D.boom(fx, s(T.reveal), 0.85, 2.4);
  D.hit(fx, s(T.reveal), 0.6);
  [81, 84, 88, 91, 95].forEach((m, j) => D.bell(fx, s(T.reveal) + j * 0.02 * SR, m, 0.045, 2.4, j % 2 ? 0.6 : -0.6, 2, 1.1, 0.7));
  // UI ticks (rows pan to their side)
  click(fx, s(T.rowA), 0.2, 2800, -0.5);
  click(fx, s(T.rowB), 0.2, 3200, 0.5);
  click(fx, s(T.runBtn), 0.2, 2400, -0.3);
  click(fx, s(T.editorChip), 0.18, 3600, 0);
  click(fx, s(T.sideCard), 0.2, 2600, 0.5);
  blip(fx, s(T.saved[0]), 0.13, 81, 88, 0.45);
  blip(fx, s(T.saved[1]), 0.13, 79, 86, 0.45);
  // Run comparison: impact + scan sweep (band-pass noise travelling L → R across both rows)
  D.hit(fx, s(T.run), 0.75);
  D.boom(fx, s(T.run), 0.45, 1.6);
  const scan = new D.BQ();
  const dur = (T.scanEnd - T.run) / 60;
  D.put(fx, s(T.run + 1), dur, 0, 0.3, (t, r) => {
    const u = t / dur;
    if ((Math.round(t * SR) & 31) === 0) scan.set(2, 700 * 9 ** u, 5);
    return 0.16 * Math.sin(Math.PI * u) * scan.run(r() * 2 - 1) * 3;
  });
  blip(fx, s(T.kept), 0.15, 84, 91, 0.3);
  blip(fx, s(T.savedNew), 0.15, 88, 93, 0.5);
  // exit: the gratings spin into the cube edge — a rising tonal sweep that stops before the boundary
  whir(fx, s(L - 5), 0.07, 0.4, 0.02, 120, 900, 0);
  finish(EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').map((e) => e.f));
}
