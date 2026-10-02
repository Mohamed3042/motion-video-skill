// DSP toolkit (copied from studio/scripts/mkv/dsp.ts): instruments, reverb, loudness, true-peak limiter, WAV writer.
// Everything is deterministic: noise comes from mulberry32 seeded by each note's start sample.
import fs from 'node:fs';
import {FPS, mulberry32} from '../../src/__SLUG__/timing.ts';

export const SR = 44100;
export const TAU = Math.PI * 2;
export const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);
export const sfr = (f: number) => (f / FPS) * SR; // video frame → sample (fractional)

// Same shape as the SynthCtx buses: dry L/R + reverb send L/R, whole track.
export type Out = {L: Float64Array; R: Float64Array; sendL: Float64Array; sendR: Float64Array};
export const makeOut = (n: number): Out => ({L: new Float64Array(n), R: new Float64Array(n), sendL: new Float64Array(n), sendR: new Float64Array(n)});

export const panG = (p: number) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];

export class BQ {
  b0 = 1; b1 = 0; b2 = 0; a1 = 0; a2 = 0; z1 = 0; z2 = 0;
  // 0 = lowpass, 1 = highpass, 2 = bandpass (0 dB peak)
  set(type: 0 | 1 | 2, f: number, q: number) {
    const w = (TAU * Math.min(Math.max(f, 10), SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    const a0 = 1 + al;
    let b0: number, b1: number, b2: number;
    if (type === 0) [b0, b1, b2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2];
    else if (type === 1) [b0, b1, b2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
    else [b0, b1, b2] = [al, 0, -al];
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = (-2 * cs) / a0; this.a2 = (1 - al) / a0;
    return this;
  }
  // RBJ shelving EQ (S = 1)
  shelf(high: boolean, f: number, db: number) {
    const A = 10 ** (db / 40);
    const w = (TAU * f) / SR;
    const cs = Math.cos(w);
    const q = 2 * Math.sqrt(A) * (Math.sin(w) / 2) * Math.SQRT2;
    const sg = high ? 1 : -1;
    const a0 = A + 1 - sg * (A - 1) * cs + q;
    this.b0 = (A * (A + 1 + sg * (A - 1) * cs + q)) / a0;
    this.b1 = (-2 * sg * A * (A - 1 + sg * (A + 1) * cs)) / a0;
    this.b2 = (A * (A + 1 + sg * (A - 1) * cs - q)) / a0;
    this.a1 = (2 * sg * (A - 1 - sg * (A + 1) * cs)) / a0;
    this.a2 = (A + 1 - sg * (A - 1) * cs - q) / a0;
    return this;
  }
  run(x: number) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

// Place a mono voice: fn(t, rnd) gives the sample at local time t (s). Starts at a (fractional) sample index.
export function put(o: Out, start: number, dur: number, pan: number, send: number, fn: (t: number, rnd: () => number) => number) {
  const i0 = Math.ceil(start);
  const off = (i0 - start) / SR; // sub-sample accurate onset
  const len = Math.round(dur * SR);
  const [gl, gr] = panG(pan);
  const rnd = mulberry32(i0 * 7 + 1);
  const n = o.L.length;
  for (let k = 0; k < len; k++) {
    const i = i0 + k;
    if (i >= n) break;
    const v = fn(k / SR + off, rnd);
    if (i < 0) continue;
    o.L[i] += v * gl;
    o.R[i] += v * gr;
    if (send) {
      o.sendL[i] += v * gl * send;
      o.sendR[i] += v * gr * send;
    }
  }
}

const noise = (r: () => number) => r() * 2 - 1;
const blep = (p: number, dt: number) => {
  if (p < dt) {
    const x = p / dt;
    return x + x - x * x - 1;
  }
  if (p > 1 - dt) {
    const x = (p - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
};

// ---------------- drums ----------------
export function kick(o: Out, s: number, vol: number) {
  let ph = 0;
  put(o, s, 0.45, 0, 0, (t, r) => {
    ph += (TAU * (46 + 120 * Math.exp(-t / 0.03))) / SR;
    return vol * (Math.sin(ph) * Math.exp(-t / 0.2) * Math.min(1, t * 3000) + (t < 0.004 ? 0.35 * noise(r) * (1 - t / 0.004) : 0));
  });
}
export function clap(o: Out, s: number, vol: number, pan = 0) {
  const bp = new BQ().set(2, 1350, 0.9);
  put(o, s, 0.32, pan, 0.18, (t, r) => {
    let e = 0;
    for (const d of [0, 0.011, 0.022]) if (t >= d) e = Math.max(e, Math.exp(-(t - d) / 0.006));
    if (t > 0.022) e = Math.max(e, 0.45 * Math.exp(-(t - 0.022) / 0.08));
    return vol * 2.6 * bp.run(noise(r)) * e;
  });
}
export function hat(o: Out, s: number, vol: number, open = false, pan = 0.2) {
  const hp = new BQ().set(1, 7500, 0.7);
  put(o, s, open ? 0.3 : 0.07, pan, 0.04, (t, r) => vol * hp.run(noise(r)) * Math.exp(-t / (open ? 0.08 : 0.016)));
}

// ---------------- tonal ----------------
export function sub(o: Out, s: number, m: number, dur: number, vol: number) {
  const f = mtof(m);
  put(o, s, dur + 0.15, 0, 0, (t) => vol * Math.sin(TAU * f * t) * Math.min(1, t / 0.03) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.15) : 1));
}
export function bassPulse(o: Out, s: number, m: number, dur: number, vol: number) {
  const f = mtof(m);
  const lp = new BQ().set(0, 600, 1.1);
  let ph = 0;
  put(o, s, dur + 0.03, 0, 0, (t) => {
    ph = (ph + f / SR) % 1;
    const e = Math.min(1, t / 0.004) * Math.exp(-t / 0.2) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.03) : 1);
    return vol * e * (lp.run(2 * ph - 1) * 0.8 + Math.sin(TAU * f * t) * 0.7);
  });
}
export function bell(o: Out, s: number, m: number, vol: number, dur = 1.6, pan = 0, ratio = 3.5, idx = 2, send = 0.35) {
  const f = mtof(m);
  put(o, s, dur, pan, send, (t) => vol * Math.min(1, t * 500) * Math.exp(-t / (dur * 0.28)) * Math.sin(TAU * f * t + idx * Math.exp(-t / 0.22) * Math.sin(TAU * f * ratio * t)));
}
// FM electric piano (Rhodes-ish): ratio-1 modulator with a decaying index, plus a short tine bark.
export function rhodes(o: Out, s: number, m: number, dur: number, vol: number, pan = 0, send = 0.3) {
  const f = mtof(m);
  const trem = 0.5 + (m % 5) * 0.37;
  put(o, s, dur + 0.5, pan, send, (t) => {
    const idx = 0.35 + 1.5 * Math.exp(-t / 0.22);
    const env = Math.min(1, t / 0.003) * Math.exp(-t / 2.2) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.5) : 1);
    const body = Math.sin(TAU * f * t + idx * Math.sin(TAU * f * t));
    const tine = 0.18 * Math.sin(TAU * f * 7.02 * t) * Math.exp(-t / 0.04);
    return vol * env * (body + tine) * (1 + 0.12 * Math.sin(TAU * 4.5 * t + trem));
  });
}
export function rhodesChord(o: Out, s: number, notes: number[], dur: number, vol: number, send = 0.35) {
  notes.forEach((m, j) => rhodes(o, s + j * 0.006 * SR, m, dur, vol / Math.sqrt(notes.length), (j / Math.max(1, notes.length - 1)) * 0.8 - 0.4, send));
}
export function pluck(o: Out, s: number, m: number, vol: number, pan = 0, send = 0.25, bright = 0.5, decay = 0.995) {
  const L = Math.max(2, Math.round(SR / mtof(m)));
  const buf = new Float32Array(L);
  const r = mulberry32(Math.round(s) + m);
  let lpv = 0;
  for (let j = 0; j < L; j++) {
    lpv += bright * (noise(r) - lpv);
    buf[j] = lpv;
  }
  let i = 0;
  let prev = 0;
  put(o, s, 1.4, pan, send, (t) => {
    const cur = buf[i];
    buf[i] = (cur + prev) * 0.5 * decay;
    prev = cur;
    i = (i + 1) % L;
    return vol * cur * Math.min(1, t * 4000) * Math.min(1, (1.4 - t) * 20);
  });
}
// Chiptune square (polyBLEP), 12.5/25/50 % duty, gated.
export function square(o: Out, s: number, m: number, dur: number, vol: number, duty = 0.25, pan = 0, send = 0.15) {
  const f = mtof(m);
  const dt = f / SR;
  let p = 0;
  const lp = new BQ().set(0, 7000, 0.7);
  put(o, s, dur + 0.02, pan, send, (t) => {
    p += dt;
    if (p >= 1) p -= 1;
    let q = p - duty;
    if (q < 0) q += 1;
    const y = (p < duty ? 1 : -1) + blep(p, dt) - blep(q, dt);
    const e = Math.min(1, t / 0.002) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.02) : 1) * (0.7 + 0.3 * Math.exp(-t / 0.08));
    return vol * lp.run(y) * e;
  });
}
// Warm detuned-saw pad through a lowpass that opens from lp0 to lp1.
export function pad(o: Out, s: number, notes: number[], dur: number, vol: number, opt: {lp0?: number; lp1?: number; att?: number; rel?: number; send?: number} = {}) {
  const att = opt.att ?? 0.4;
  const rel = opt.rel ?? 0.8;
  notes.forEach((m, j) => {
    [-8, 0, 8].forEach((cents, v) => {
      const f = mtof(m) * 2 ** (cents / 1200);
      const dt = f / SR;
      let ph = (j * 0.37 + v * 0.21) % 1;
      const lp = new BQ();
      const pan = Math.max(-0.9, Math.min(0.9, (j % 2 ? 0.35 : -0.35) + (v - 1) * 0.3));
      put(o, s, dur + rel, pan, opt.send ?? 0.4, (t) => {
        ph += dt;
        if (ph >= 1) ph -= 1;
        const y = 2 * ph - 1 - blep(ph, dt);
        if ((Math.round(t * SR) & 31) === 0) {
          const u = Math.min(1, t / dur);
          lp.set(0, (opt.lp0 ?? 900) * ((opt.lp1 ?? 900) / (opt.lp0 ?? 900)) ** u * (1 + 0.15 * Math.sin(TAU * 0.2 * t + j)), 0.8);
        }
        const e = t < att ? Math.sin((t / att) * Math.PI * 0.5) : t > dur ? Math.max(0, 1 - (t - dur) / rel) : 1;
        return (lp.run(y) * e * vol) / notes.length / 3;
      });
    });
  });
}

// ---------------- impacts & transitions (onset exactly on the start sample) ----------------
// big cinematic impact: pitch-dropping sub + crack + rumble
export function boom(o: Out, s: number, vol: number, len = 3) {
  let ph = 0;
  const lp = new BQ().set(0, 2600, 0.7);
  const lp2 = new BQ().set(0, 150, 0.7);
  put(o, s, len, 0, 0.25, (t, r) => {
    ph += (TAU * (32 + 90 * Math.exp(-t / 0.09))) / SR;
    const n = noise(r);
    return vol * Math.min(1, t * 2000) * Math.min(1, (len - t) * 4) * (Math.sin(ph) * Math.exp(-t / 0.9) + lp.run(n) * Math.exp(-t / 0.05) * 1.1 + lp2.run(n) * Math.exp(-t / 0.7) * 2.4);
  });
}
// punchy hit: pitched thump + bright crack
export function hit(o: Out, s: number, vol: number) {
  let ph = 0;
  const bp = new BQ().set(2, 1900, 0.8);
  put(o, s, 0.8, 0, 0.25, (t, r) => {
    ph += (TAU * (40 + 140 * Math.exp(-t / 0.025))) / SR;
    return vol * Math.min(1, t * 3000) * (Math.sin(ph) * Math.exp(-t / 0.3) + 1.9 * bp.run(noise(r)) * Math.exp(-t / 0.045));
  });
}
// short portal impact: tight low thump + transient crack (sits under a world's own downbeat)
export function thump(o: Out, s: number, vol: number) {
  let ph = 0;
  const bp = new BQ().set(2, 4200, 0.7);
  put(o, s, 0.4, 0, 0.12, (t, r) => {
    ph += (TAU * (48 + 110 * Math.exp(-t / 0.02))) / SR;
    const n = noise(r);
    return vol * Math.min(1, t * 4000) * (0.9 * Math.sin(ph) * Math.exp(-t / 0.12) + 4.4 * bp.run(n) * Math.exp(-t / 0.012) + (t < 0.002 ? 1.6 * n : 0));
  });
}
// noise whoosh whose energy peaks exactly on sample `center`, panning L → R
export function whoosh(o: Out, center: number, vol: number, pre = 0.42, post = 0.22) {
  const c = Math.round(center);
  const n0 = Math.round(pre * SR);
  const n1 = Math.round(post * SR);
  const bp = new BQ();
  const bp2 = new BQ();
  const r = mulberry32(c * 3 + 5);
  const n = o.L.length;
  for (let k = -n0; k < n1; k++) {
    const i = c + k;
    let amp: number;
    let fc: number;
    if (k < 0) {
      const u = 1 + k / n0;
      amp = u ** 3;
      fc = 250 * (3600 / 250) ** u;
    } else {
      const t = k / SR;
      amp = Math.exp(-t / 0.05);
      fc = 900 + 2700 * Math.exp(-t / 0.1);
    }
    if ((k & 15) === 0) {
      bp.set(2, fc, 1.3);
      bp2.set(2, fc * 0.45, 1);
    }
    const x = noise(r);
    const v = vol * amp * (bp.run(x) * 1.6 + bp2.run(x) * 0.9);
    if (i < 0 || i >= n) continue;
    const [gl, gr] = panG(-0.8 + (1.6 * (k + n0)) / (n0 + n1));
    o.L[i] += v * gl;
    o.R[i] += v * gr;
    o.sendL[i] += v * gl * 0.3;
    o.sendR[i] += v * gr * 0.3;
  }
}
// filtered-noise riser, ending with a hard cut (suck-out) at s1
export function riser(o: Out, s0: number, s1: number, vol: number, f0 = 300, f1 = 9000) {
  const dur = (s1 - s0) / SR;
  const bp = new BQ();
  put(o, s0, dur, 0, 0.3, (t, r) => {
    const u = t / dur;
    if ((Math.round(t * SR) & 31) === 0) bp.set(2, f0 * (f1 / f0) ** u, 1.2);
    return vol * u * u * Math.min(1, (dur - t) * 250) * bp.run(noise(r)) * 1.6;
  });
}
// Shepard–Risset glissando: octave-spaced sines under a fixed bell-shaped spectral envelope, gliding forever upward.
// rate0 → rate1 octaves/s (accelerating), envelope env(u) with u ∈ [0,1] across the note.
export function shepard(o: Out, s0: number, s1: number, vol: number, opt: {center?: number; sigma?: number; rate0?: number; rate1?: number; env?: (u: number) => number; send?: number; pan?: number} = {}) {
  const dur = (s1 - s0) / SR;
  const center = opt.center ?? 440;
  const sigma = opt.sigma ?? 1.25;
  const r0 = opt.rate0 ?? 0.3;
  const r1 = opt.rate1 ?? r0;
  const NO = 9;
  const fmin = center * 2 ** (-NO / 2);
  const ph = new Float64Array(NO);
  const env = opt.env ?? ((u: number) => u * u);
  for (const [side, pan] of [[0, (opt.pan ?? 0) - 0.35], [0.5, (opt.pan ?? 0) + 0.35]] as const) {
    ph.fill(0);
    put(o, s0, dur, pan, opt.send ?? 0.4, (t) => {
      const pos = r0 * t + ((r1 - r0) * t * t) / (2 * dur) + side; // octaves travelled (R is half an octave apart → wide)
      let y = 0;
      for (let k = 0; k < NO; k++) {
        const oct = (((k + pos) % NO) + NO) % NO;
        const f = fmin * 2 ** oct;
        ph[k] += f / SR;
        const a = Math.exp(-0.5 * ((oct - NO / 2) / sigma) ** 2);
        y += a * Math.sin(TAU * ph[k]);
      }
      return (vol * y * env(t / dur) * Math.min(1, (dur - t) * 200)) / 3;
    });
  }
}

// ---------------- reverb ----------------
// Freeverb (8 combs + 4 allpasses per channel). Returns the wet signal.
export function freeverb(inL: ArrayLike<number>, inR: ArrayLike<number>, room = 0.84, damp = 0.3) {
  const n = inL.length;
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const outL = new Float32Array(n);
  const outR = new Float32Array(n);
  ([[inL, outL, 0], [inR, outR, 23]] as const).forEach(([x, y, spread]) => {
    const combs = combT.map((l) => ({b: new Float32Array(l + spread), i: 0, s: 0}));
    const aps = apT.map((l) => ({b: new Float32Array(l + spread), i: 0}));
    for (let k = 0; k < n; k++) {
      const v = x[k] * 0.015;
      let acc = 0;
      for (const cb of combs) {
        const o = cb.b[cb.i];
        cb.s = o * (1 - damp) + cb.s * damp;
        cb.b[cb.i] = v + cb.s * room;
        cb.i = (cb.i + 1) % cb.b.length;
        acc += o;
      }
      for (const ap of aps) {
        const o = ap.b[ap.i];
        const w = o - acc;
        ap.b[ap.i] = acc + o * 0.5;
        ap.i = (ap.i + 1) % ap.b.length;
        acc = w;
      }
      y[k] = acc;
    }
  });
  return [outL, outR] as const;
}

// ---------------- loudness (ITU-R BS.1770 / EBU R128) ----------------
// Prefix sum of K-weighted squares (libebur128 filter coefficients).
export function kPrefix(x: ArrayLike<number>) {
  const stage = (b: number[], a: number[]) => {
    let z1 = 0;
    let z2 = 0;
    return (v: number) => {
      const y = b[0] * v + z1;
      z1 = b[1] * v - a[1] * y + z2;
      z2 = b[2] * v - a[2] * y;
      return y;
    };
  };
  let K = Math.tan((Math.PI * 1681.974450955533) / SR);
  const Q = 0.7071752369554196;
  const Vh = 10 ** (3.999843853973347 / 20);
  const Vb = Vh ** 0.4996667741545416;
  let a0 = 1 + K / Q + K * K;
  const s1 = stage([(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0], [1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0]);
  K = Math.tan((Math.PI * 38.13547087602444) / SR);
  const Q2 = 0.5003270373238773;
  a0 = 1 + K / Q2 + K * K;
  const s2 = stage([1, -2, 1], [1, (2 * (K * K - 1)) / a0, (1 - K / Q2 + K * K) / a0]);
  const out = new Float64Array(x.length + 1);
  for (let i = 0; i < x.length; i++) {
    const y = s2(s1(x[i]));
    out[i + 1] = out[i] + y * y;
  }
  return out;
}
// Gated integrated loudness of [a, b) from two prefix sums. -Infinity when silent.
export function lufsRange(pl: Float64Array, pr: Float64Array, a: number, b: number) {
  const blk = Math.round(0.4 * SR);
  const hop = Math.round(0.1 * SR);
  const z: number[] = [];
  for (let s = a; s + blk <= b; s += hop) z.push((pl[s + blk] - pl[s] + pr[s + blk] - pr[s]) / blk);
  const ld = (v: number) => -0.691 + 10 * Math.log10(v);
  const abs = z.filter((v) => v > 0 && ld(v) > -70);
  if (!abs.length) return -Infinity;
  const rel = ld(abs.reduce((p, c) => p + c, 0) / abs.length) - 10;
  const g = abs.filter((v) => ld(v) > rel);
  return ld(g.reduce((p, c) => p + c, 0) / g.length);
}

// ---------------- true peak + limiter ----------------
// Per-sample max |x| over 4x oversampled positions (windowed-sinc interpolation).
const HALF = 12;
const PHASES = [0.25, 0.5, 0.75].map((ph) => {
  const t: number[] = [];
  for (let j = -HALF + 1; j <= HALF; j++) {
    const d = ph - j;
    t.push((Math.sin(Math.PI * d) / (Math.PI * d)) * (0.5 + 0.5 * Math.cos((Math.PI * d) / HALF)));
  }
  return t;
});
export function peakEnv(x: ArrayLike<number>) {
  const n = x.length;
  const p = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let m = Math.abs(x[i]);
    if (i >= HALF && i < n - HALF) {
      for (const t of PHASES) {
        let y = 0;
        for (let j = 0; j < t.length; j++) y += x[i - HALF + 1 + j] * t[j];
        if (Math.abs(y) > m) m = Math.abs(y);
      }
    }
    p[i] = m;
  }
  return p;
}
// Zero-latency offline look-ahead limiter: gain reduction starts W samples before each over and releases smoothly.
// env = max(peakEnv(L), peakEnv(R)) of the un-gained signal; output = (L, R) * gain * limiterGain.
export function limit(L: ArrayLike<number>, R: ArrayLike<number>, env: Float32Array, gain: number, ceilDb: number) {
  const n = L.length;
  const ceil = 10 ** (ceilDb / 20);
  const W = 96;
  const req = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = env[i] * gain;
    req[i] = p > ceil ? ceil / p : 1;
  }
  // sliding-window minimum over [i - W, i + W] (monotonic deque)
  const mn = new Float32Array(n);
  const dq = new Int32Array(n + 2 * W + 1);
  let h = 0;
  let tl = 0;
  for (let j = 0; j < n + W; j++) {
    if (j < n) {
      while (tl > h && req[dq[tl - 1]] >= req[j]) tl--;
      dq[tl++] = j;
    }
    const i = j - W;
    if (i < 0) continue;
    while (dq[h] < i - W) h++;
    mn[i] = req[dq[h]];
  }
  const rel = 1 - Math.exp(-1 / (0.12 * SR));
  let last = 1;
  for (let i = 0; i < n; i++) {
    last = Math.min(mn[i], last + (1 - last) * rel);
    mn[i] = last;
  }
  // box-smooth the gain (half width W/2 < W, so every over stays covered)
  const oL = new Float32Array(n);
  const oR = new Float32Array(n);
  const Hh = W / 2;
  let acc = 0;
  for (let i = -Hh; i < n + Hh; i++) {
    if (i + Hh < n) acc += mn[i + Hh];
    if (i - Hh - 1 >= 0) acc -= mn[i - Hh - 1];
    if (i >= 0 && i < n) {
      const cnt = Math.min(n - 1, i + Hh) - Math.max(0, i - Hh) + 1;
      const gg = (gain * acc) / cnt;
      oL[i] = L[i] * gg;
      oR[i] = R[i] * gg;
    }
  }
  return [oL, oR] as const;
}

// 16-bit stereo PCM WAV with seeded TPDF dither.
export function writeWav(file: string, L: ArrayLike<number>, R: ArrayLike<number>) {
  const n = L.length;
  const r = mulberry32(99);
  const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * 4, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28);
  b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * 4, 40);
  const pcm = new Int16Array(b.buffer, b.byteOffset + 44, n * 2);
  for (let i = 0; i < n; i++) {
    for (let ch = 0; ch < 2; ch++) {
      const x = ch ? R[i] : L[i];
      const d = (r() - r()) / 32768;
      pcm[i * 2 + ch] = Math.max(-32768, Math.min(32767, Math.round((x + d) * 32767)));
    }
  }
  fs.writeFileSync(file, b);
}
