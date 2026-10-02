// Synthesizes the three MK reel scores from scratch (no samples): public/mk/{voice,montage,suite}.wav
// 44.1 kHz stereo 16-bit, exactly 20.0 s, mastered to -14 LUFS with true peak < -1 dBTP.
// Every sound event comes from the same timing modules the React scenes use.
// Usage: node scripts/mk/music.ts [voice|montage|suite ...]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import * as V from '../../src/mk/voice.timing.ts';
import * as M from '../../src/mk/montage.timing.ts';
import * as S from '../../src/mk/suite.timing.ts';

const SR = 44100;
const SPF = SR / 60; // 735 samples per video frame
const N = SR * 20;
const TAU = Math.PI * 2;
const fr = (f: number) => Math.round(f * SPF);
const sec = (s: number) => Math.round(s * SR);
const fs_ = (f: number) => f / 60; // frame -> seconds
const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

const mulberry = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Bus = {L: Float32Array; R: Float32Array};
const bus = (): Bus => ({L: new Float32Array(N), R: new Float32Array(N)});
const panG = (p: number) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];

class BQ {
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
    const al = (Math.sin(w) / 2) * Math.SQRT2;
    const q = 2 * Math.sqrt(A) * al;
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

type Ctx = {dry: Bus; pad: Bus; rev: Bus; imp: Float32Array; wh: Float32Array; r: () => number; kicks: number[]};
const noise = (c: Ctx) => c.r() * 2 - 1;

// place a mono voice (fn returns sample at local time t) on a bus with pan + reverb send (+ optional analysis stem)
function put(c: Ctx, b: Bus, i0: number, len: number, pan: number, send: number, fn: (t: number) => number, stem?: Float32Array) {
  const [gl, gr] = panG(pan);
  for (let k = 0; k < len; k++) {
    const i = i0 + k;
    if (i >= N) break;
    const v = fn(k / SR);
    if (i < 0) continue;
    b.L[i] += v * gl;
    b.R[i] += v * gr;
    if (send) {
      c.rev.L[i] += v * gl * send;
      c.rev.R[i] += v * gr * send;
    }
    if (stem) stem[i] += v;
  }
}

// ---------------- instruments ----------------
const VOWELS: Record<string, [number[], number[]]> = {
  a: [[800, 1150, 2900], [1, 0.5, 0.25]],
  o: [[450, 800, 2830], [1, 0.32, 0.1]],
  i: [[300, 2100, 2950], [1, 0.3, 0.22]],
};

function pad(c: Ctx, notes: number[], t0: number, t1: number, o: {vol: number; lp0?: number; lp1?: number; att?: number; rel?: number; vowel?: (t: number) => string | [string, string, number]; send?: number; b?: Bus}) {
  const att = o.att ?? 0.35;
  const rel = o.rel ?? 0.5;
  const len = sec(t1 - t0 + rel);
  notes.forEach((m, j) => {
    [-7, 0, 7].forEach((cents, v) => {
      const f = mtof(m) * 2 ** (cents / 1200);
      const dt = f / SR;
      let ph = c.r();
      const lp = new BQ();
      const fm = [new BQ(), new BQ(), new BQ()];
      let gains = [1, 0.5, 0.25];
      const pan = Math.max(-0.9, Math.min(0.9, (j % 2 ? 0.35 : -0.35) + (v - 1) * 0.3));
      put(c, o.b ?? c.pad, sec(t0), len, pan, o.send ?? 0.3, (t) => {
        ph += dt;
        if (ph >= 1) ph -= 1;
        let s = 2 * ph - 1;
        if (ph < dt) { const x = ph / dt; s -= x + x - x * x - 1; } else if (ph > 1 - dt) { const x = (ph - 1) / dt; s -= x * x + x + x + 1; }
        const k = Math.round(t * SR);
        let y: number;
        if (o.vowel) {
          if ((k & 31) === 0) {
            const vv = o.vowel(t0 + t);
            let F: number[];
            if (typeof vv === 'string') [F, gains] = VOWELS[vv];
            else {
              const [A, B, mix] = vv;
              F = VOWELS[A][0].map((x, q) => x + (VOWELS[B][0][q] - x) * mix);
              gains = VOWELS[A][1].map((x, q) => x + (VOWELS[B][1][q] - x) * mix);
            }
            fm.forEach((bq, q) => bq.set(2, F[q], 7));
          }
          y = fm[0].run(s) * gains[0] + fm[1].run(s) * gains[1] + fm[2].run(s) * gains[2];
          y *= 2.2;
        } else {
          if ((k & 31) === 0) {
            const u = Math.min(1, t / Math.max(0.01, t1 - t0));
            const cut = (o.lp0 ?? 900) * ((o.lp1 ?? 900) / (o.lp0 ?? 900)) ** u * (1 + 0.18 * Math.sin(TAU * 0.17 * (t0 + t) + j));
            lp.set(0, cut, 0.8);
          }
          y = lp.run(s);
        }
        const e = t < att ? Math.sin((t / att) * Math.PI * 0.5) : t > t1 - t0 ? Math.max(0, 1 - (t - (t1 - t0)) / rel) : 1;
        return y * e * o.vol / notes.length;
      });
    });
  });
}

function kick(c: Ctx, t: number, vol: number) {
  let ph = 0;
  c.kicks.push(t);
  put(c, c.dry, sec(t), sec(0.45), 0, 0, (tt) => {
    ph += (TAU * (46 + 120 * Math.exp(-tt / 0.03))) / SR;
    return vol * (Math.sin(ph) * Math.exp(-tt / 0.2) * Math.min(1, tt * 3000) + (tt < 0.004 ? 0.35 * noise(c) * (1 - tt / 0.004) : 0));
  });
}

function clap(c: Ctx, t: number, vol: number, pan = 0) {
  const bp = new BQ().set(2, 1350, 0.9);
  put(c, c.dry, sec(t), sec(0.32), pan, 0.18, (tt) => {
    let e = 0;
    for (const o of [0, 0.011, 0.022]) if (tt >= o) e = Math.max(e, Math.exp(-(tt - o) / 0.006));
    if (tt > 0.022) e = Math.max(e, 0.45 * Math.exp(-(tt - 0.022) / 0.08));
    return vol * 2.6 * bp.run(noise(c)) * e;
  });
}

function rim(c: Ctx, t: number, vol: number) {
  const bp = new BQ().set(2, 2300, 2);
  put(c, c.dry, sec(t), sec(0.08), 0.15, 0.2, (tt) => vol * (2.2 * bp.run(noise(c)) * Math.exp(-tt / 0.012) + 0.6 * Math.sin(TAU * 420 * tt) * Math.exp(-tt / 0.015)));
}

function hat(c: Ctx, t: number, vol: number, open = false, pan = 0.2) {
  const hp = new BQ().set(1, 7500, 0.7);
  put(c, c.dry, sec(t), sec(open ? 0.3 : 0.07), pan, 0.04, (tt) => vol * hp.run(noise(c)) * Math.exp(-tt / (open ? 0.08 : 0.016)));
}

function sub(c: Ctx, t: number, m: number, dur: number, vol: number) {
  const f = mtof(m);
  put(c, c.pad, sec(t), sec(dur + 0.12), 0, 0, (tt) => vol * Math.sin(TAU * f * tt) * Math.min(1, tt / 0.03) * (tt > dur ? Math.max(0, 1 - (tt - dur) / 0.12) : 1));
}

function bassPulse(c: Ctx, t: number, m: number, dur: number, vol: number) {
  const f = mtof(m);
  const lp = new BQ().set(0, 520, 1.1);
  let ph = 0;
  put(c, c.pad, sec(t), sec(dur + 0.03), 0, 0, (tt) => {
    ph = (ph + f / SR) % 1;
    const e = Math.min(1, tt / 0.004) * Math.exp(-tt / 0.18) * (tt > dur ? Math.max(0, 1 - (tt - dur) / 0.03) : 1);
    return vol * e * (lp.run(2 * ph - 1) * 0.8 + Math.sin(TAU * f * tt) * 0.7);
  });
}

function bell(c: Ctx, t: number, m: number, vol: number, dur = 1.6, pan = 0, ratio = 3.5, idx = 2, send = 0.35) {
  const f = mtof(m);
  put(c, c.dry, sec(t), sec(dur), pan, send, (tt) =>
    vol * Math.min(1, tt * 500) * Math.exp(-tt / (dur * 0.28)) * Math.sin(TAU * f * tt + idx * Math.exp(-tt / 0.22) * Math.sin(TAU * f * ratio * tt)),
  );
}

function pluck(c: Ctx, t: number, m: number, vol: number, pan = 0, send = 0.25, bright = 0.5, decay = 0.995) {
  const L = Math.max(2, Math.round(SR / mtof(m)));
  const buf = new Float32Array(L);
  let lpv = 0;
  for (let j = 0; j < L; j++) {
    lpv += bright * (noise(c) - lpv);
    buf[j] = lpv;
  }
  let idx = 0;
  let prev = 0;
  put(c, c.dry, sec(t), sec(1.4), pan, send, (tt) => {
    const cur = buf[idx];
    buf[idx] = (cur + prev) * 0.5 * decay;
    prev = cur;
    idx = (idx + 1) % L;
    return vol * cur * Math.min(1, tt * 4000) * Math.min(1, (1.4 - tt) * 20);
  });
}

// big cinematic impact: pitch-dropping sub + crack + rumble. Onset exactly on the frame.
function boom(c: Ctx, f: number, vol: number) {
  let ph = 0;
  const lp = new BQ().set(0, 2200, 0.7);
  const lp2 = new BQ().set(0, 150, 0.7);
  put(c, c.dry, fr(f), sec(3), 0, 0.2, (tt) => {
    ph += (TAU * (32 + 90 * Math.exp(-tt / 0.09))) / SR;
    const n = noise(c);
    return vol * Math.min(1, tt * 2000) * (Math.sin(ph) * Math.exp(-tt / 0.9) + lp.run(n) * Math.exp(-tt / 0.05) * 0.9 + lp2.run(n) * Math.exp(-tt / 0.7) * 2.4);
  }, c.imp);
}

// punchy hit for kinetic words / sync snaps
function hit(c: Ctx, f: number, vol: number) {
  let ph = 0;
  const bp = new BQ().set(2, 1800, 0.8);
  put(c, c.dry, fr(f), sec(0.8), 0, 0.25, (tt) => {
    ph += (TAU * (40 + 140 * Math.exp(-tt / 0.025))) / SR;
    return vol * Math.min(1, tt * 3000) * (Math.sin(ph) * Math.exp(-tt / 0.3) + 1.8 * bp.run(noise(c)) * Math.exp(-tt / 0.045));
  }, c.imp);
}

// noise whoosh whose energy peaks exactly on the cut frame, panning L->R
function whoosh(c: Ctx, f: number, vol: number, len = 0.5) {
  const center = fr(f);
  const pre = sec(len * 0.8);
  const post = sec(len * 0.5);
  const bp = new BQ();
  const bp2 = new BQ();
  for (let k = -pre; k < post; k++) {
    const i = center + k;
    if (i < 0 || i >= N) continue;
    let amp: number;
    let fc: number;
    if (k < 0) {
      const u = 1 + k / pre;
      amp = u ** 3;
      fc = 250 * (5200 / 250) ** u;
    } else {
      const tt = k / SR;
      amp = Math.exp(-tt / 0.06);
      fc = 900 + 4300 * Math.exp(-tt / 0.12);
    }
    if ((k & 15) === 0) {
      bp.set(2, fc, 1.3);
      bp2.set(2, fc * 0.45, 1);
    }
    const n = noise(c);
    const v = vol * amp * (bp.run(n) * 1.7 + bp2.run(n) * 0.8);
    const [gl, gr] = panG(-0.8 + (1.6 * (k + pre)) / (pre + post));
    c.dry.L[i] += v * gl;
    c.dry.R[i] += v * gr;
    c.rev.L[i] += v * gl * 0.25;
    c.rev.R[i] += v * gr * 0.25;
    c.wh[i] += v;
  }
}

function riser(c: Ctx, f0: number, f1: number, vol: number) {
  const i0 = fr(f0);
  const len = fr(f1) - i0;
  const hp = new BQ();
  let ph = 0;
  put(c, c.dry, i0, len, 0, 0.3, (tt) => {
    const u = tt / (len / SR);
    const k = Math.round(tt * SR);
    if ((k & 31) === 0) hp.set(2, 300 * 20 ** u, 1.2);
    ph += (TAU * 200 * 8 ** u) / SR;
    const tail = Math.min(1, (len / SR - tt) * 250);
    return vol * u * u * tail * (hp.run(noise(c)) * 1.6 + Math.sin(ph) * 0.25);
  });
}

function click(c: Ctx, f: number, vol: number, freq = 3000, pan = 0) {
  put(c, c.dry, fr(f), sec(0.06), pan, 0.1, (tt) => vol * (Math.sin(TAU * freq * tt) * Math.exp(-tt / 0.007) + noise(c) * Math.exp(-tt / 0.0015) * 0.5));
}

function blip(c: Ctx, f: number, vol: number, m1: number, m2: number) {
  bell(c, fs_(f), m1, vol, 0.5, -0.2, 2, 0.8, 0.3);
  bell(c, fs_(f) + 0.075, m2, vol, 0.9, 0.2, 2, 0.8, 0.35);
}

function shimmer(c: Ctx, f: number, vol: number, notes: number[]) {
  notes.forEach((m, j) => bell(c, fs_(f) + j * 0.022, m + 24, vol, 3.2, j % 2 ? 0.55 : -0.55, 2, 1.1, 0.75));
}

function swish(c: Ctx, f: number, vol: number) {
  const bp = new BQ();
  put(c, c.dry, fr(f) - sec(0.12), sec(0.2), 0.3, 0.15, (tt) => {
    const k = Math.round(tt * SR);
    if ((k & 15) === 0) bp.set(2, 1200 + tt * 30000, 1.5);
    const e = tt < 0.12 ? (tt / 0.12) ** 2 : Math.exp(-(tt - 0.12) / 0.03);
    return vol * e * bp.run(noise(c)) * 1.8;
  });
}

function scribble(c: Ctx, f0: number, f1: number, vol: number) {
  const bp = new BQ().set(2, 2900, 2.5);
  const len = fr(f1) - fr(f0);
  put(c, c.dry, fr(f0), len, -0.1, 0.15, (tt) => {
    const u = tt / (len / SR);
    const e = Math.sin(Math.PI * u) ** 0.5 * (0.45 + 0.55 * Math.abs(Math.sin(TAU * 17 * tt + Math.sin(TAU * 3 * tt))));
    return vol * e * bp.run(noise(c)) * 2;
  });
}

function airNoise(c: Ctx, t0: number, t1: number, vol: number) {
  const bp = new BQ().set(2, 5200, 0.6);
  put(c, c.pad, sec(t0), sec(t1 - t0), 0, 0.3, (tt) => vol * bp.run(noise(c)) * Math.sin((Math.PI * tt) / (t1 - t0)) ** 2);
}

// ---------------- mixdown + mastering ----------------
function freeverb(inp: Bus, room = 0.84, damp = 0.3): Bus {
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const out = bus();
  ([[inp.L, out.L, 0], [inp.R, out.R, 23]] as const).forEach(([x, y, spread]) => {
    const combs = combT.map((l) => ({b: new Float32Array(l + spread), i: 0, s: 0}));
    const aps = apT.map((l) => ({b: new Float32Array(l + spread), i: 0}));
    for (let n = 0; n < N; n++) {
      const v = x[n] * 0.015;
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
      y[n] = acc;
    }
  });
  return out;
}

// BS.1770 K-weighting (libebur128 coefficients) + gated integrated loudness
function kweight(x: Float32Array) {
  const st = (b: number[], a: number[]) => {
    let z1 = 0, z2 = 0;
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
  const s1 = st([(Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0], [1, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0]);
  K = Math.tan((Math.PI * 38.13547087602444) / SR);
  const Q2 = 0.5003270373238773;
  a0 = 1 + K / Q2 + K * K;
  const s2 = st([1, -2, 1], [1, (2 * (K * K - 1)) / a0, (1 - K / Q2 + K * K) / a0]);
  const out = new Float64Array(x.length + 1); // prefix sum of squares
  for (let i = 0; i < x.length; i++) {
    const y = s2(s1(x[i]));
    out[i + 1] = out[i] + y * y;
  }
  return out;
}

function lufs(L: Float32Array, R: Float32Array) {
  const pl = kweight(L);
  const pr = kweight(R);
  const blk = sec(0.4);
  const hop = sec(0.1);
  const z: number[] = [];
  for (let s = 0; s + blk <= N; s += hop) z.push((pl[s + blk] - pl[s] + pr[s + blk] - pr[s]) / blk);
  const ld = (v: number) => -0.691 + 10 * Math.log10(v);
  const abs = z.filter((v) => ld(v) > -70);
  const rel = ld(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const g = abs.filter((v) => ld(v) > rel);
  return ld(g.reduce((a, b) => a + b, 0) / g.length);
}

// 4x oversampled peak per sample (windowed-sinc interpolation) for true-peak limiting
const HALF = 12;
const PHASES = [0.25, 0.5, 0.75].map((ph) => {
  const t: number[] = [];
  for (let j = -HALF + 1; j <= HALF; j++) {
    const d = ph - j;
    const sinc = Math.sin(Math.PI * d) / (Math.PI * d);
    t.push(sinc * (0.5 + 0.5 * Math.cos((Math.PI * d) / HALF)));
  }
  return t;
});
function peaks(x: Float32Array) {
  const p = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    let m = Math.abs(x[n]);
    if (n >= HALF && n < N - HALF) {
      for (const t of PHASES) {
        let y = 0;
        for (let j = 0; j < t.length; j++) y += x[n - HALF + 1 + j] * t[j];
        m = Math.max(m, Math.abs(y));
      }
    }
    p[n] = m;
  }
  return p;
}
const truePeakDb = (L: Float32Array, R: Float32Array) => {
  let m = 0;
  for (const p of [peaks(L), peaks(R)]) for (let n = 0; n < N; n++) m = Math.max(m, p[n]);
  return 20 * Math.log10(m);
};

// zero-latency offline look-ahead limiter (gain reduction starts before the peak; signal is not delayed)
function limit(L: Float32Array, R: Float32Array, ceilDb: number) {
  const ceil = 10 ** (ceilDb / 20);
  const pl = peaks(L);
  const pr = peaks(R);
  const req = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const p = Math.max(pl[n], pr[n]);
    req[n] = p > ceil ? ceil / p : 1;
  }
  const W = 96;
  const g = new Float32Array(N);
  const rel = 1 - Math.exp(-1 / (0.12 * SR));
  let last = 1;
  for (let n = 0; n < N; n++) {
    let m = 1;
    for (let k = Math.max(0, n - W); k <= Math.min(N - 1, n + W); k++) if (req[k] < m) m = req[k];
    last = Math.min(m, last + (1 - last) * rel);
    g[n] = last;
  }
  const oL = new Float32Array(N);
  const oR = new Float32Array(N);
  let acc = 0;
  const H = W / 2;
  for (let n = -H; n < N + H; n++) {
    if (n + H < N) acc += g[n + H];
    if (n - H - 1 >= 0) acc -= g[n - H - 1];
    if (n >= 0 && n < N) {
      const cnt = Math.min(N - 1, n + H) - Math.max(0, n - H) + 1;
      const gg = acc / cnt;
      oL[n] = L[n] * gg;
      oR[n] = R[n] * gg;
    }
  }
  return [oL, oR] as const;
}

function master(mix: Bus) {
  // master EQ: high-pass, gentle low-shelf cut, presence/air high-shelf lift
  const [hpL, hpR] = [new BQ().set(1, 28, 0.7), new BQ().set(1, 28, 0.7)];
  const [lsL, lsR] = [new BQ().shelf(false, 140, -2.5), new BQ().shelf(false, 140, -2.5)];
  const [hsL, hsR] = [new BQ().shelf(true, 3200, 6), new BQ().shelf(true, 3200, 6)];
  const L = new Float32Array(N);
  const R = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const fade = Math.min(1, (N - 1 - n) / sec(0.25)); // guarantee silence at 20.0 s
    L[n] = hsL.run(lsL.run(hpL.run(mix.L[n]))) * fade;
    R[n] = hsR.run(lsR.run(hpR.run(mix.R[n]))) * fade;
  }
  let gain = 10 ** ((-14 - lufs(L, R)) / 20);
  let out: readonly [Float32Array, Float32Array] = [L, R];
  let loud = 0;
  for (let it = 0; it < 6; it++) {
    const gL = L.map((v) => v * gain);
    const gR = R.map((v) => v * gain);
    out = limit(gL, gR, -1.6);
    loud = lufs(out[0], out[1]);
    if (Math.abs(loud + 14) < 0.05) break;
    gain *= 10 ** ((-14 - loud) / 20);
  }
  return {L: out[0], R: out[1], loud, tp: truePeakDb(out[0], out[1])};
}

function writeWav(file: string, L: Float32Array, R: Float32Array) {
  const r = mulberry(99);
  const b = Buffer.alloc(44 + N * 4);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + N * 4, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28);
  b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(N * 4, 40);
  for (let n = 0; n < N; n++) {
    for (const [ch, x] of [[0, L], [1, R]] as const) {
      const d = (r() - r()) / 32768; // TPDF dither
      const s = Math.max(-32768, Math.min(32767, Math.round((x[n] + d) * 32767)));
      b.writeInt16LE(s, 44 + n * 4 + ch * 2);
    }
  }
  fs.writeFileSync(file, b);
}

// ---------------- sync assert: impacts/hits start on their frame, whooshes peak on their frame (±1) ----------------
function checkSync(name: string, c: Ctx, onsets: readonly number[], peaksAt: readonly number[]) {
  const energy = (x: Float32Array) => {
    const e = new Float64Array(1200);
    for (let k = 0; k < 1200; k++) {
      let s = 0;
      for (let i = k * SPF; i < (k + 1) * SPF; i++) s += x[i] * x[i];
      e[k] = s;
    }
    return e;
  };
  const ei = energy(c.imp);
  const ew = energy(c.wh);
  let worst = 0;
  for (const f of onsets) {
    const lo = Math.max(1, f - 8);
    const hi = Math.min(1199, f + 8);
    let max = 0;
    for (let k = lo; k <= hi; k++) max = Math.max(max, ei[k]);
    let onset = -1;
    for (let k = lo; k <= hi; k++) if (ei[k] > max * 0.3 && ei[k] > ei[k - 1] * 4) { onset = k; break; }
    assert.ok(Math.abs(onset - f) <= 1, `${name}: impact at frame ${f} detected at ${onset}`);
    worst = Math.max(worst, Math.abs(onset - f));
  }
  for (const f of peaksAt) {
    let best = -1;
    let max = -1;
    for (let k = Math.max(0, f - 20); k <= Math.min(1199, f + 20); k++) if (ew[k] > max) [max, best] = [ew[k], k];
    assert.ok(Math.abs(best - f) <= 1, `${name}: whoosh at frame ${f} peaks at ${best}`);
    worst = Math.max(worst, Math.abs(best - f));
  }
  console.log(`  sync ok: ${onsets.length} impacts/hits + ${peaksAt.length} whooshes, worst offset ${worst} frame(s)`);
}

const ctx = (seed: number): Ctx => ({dry: bus(), pad: bus(), rev: bus(), imp: new Float32Array(N), wh: new Float32Array(N), r: mulberry(seed), kicks: []});

function mixdown(c: Ctx, duck = 0.4, wet = 2.2): Bus {
  const rv = freeverb(c.rev);
  const out = bus();
  const ks = [...c.kicks].sort((a, b) => a - b);
  let ki = 0;
  for (let n = 0; n < N; n++) {
    const t = n / SR;
    while (ki + 1 < ks.length && ks[ki + 1] <= t) ki++;
    let d = 1;
    if (ks.length && ks[ki] <= t) d = 1 - duck * Math.exp(-(t - ks[ki]) / 0.16) * Math.min(1, (t - ks[ki]) / 0.005 + 0.3);
    out.L[n] = c.dry.L[n] + c.pad.L[n] * d + rv.L[n] * wet;
    out.R[n] = c.dry.R[n] + c.pad.R[n] * d + rv.R[n] * wet;
  }
  return out;
}

// ---------------- the three scores ----------------
function voice(): Ctx {
  const c = ctx(1);
  const E = V.EV;
  const chords = [
    [50, 53, 57, 60, 64], [50, 53, 57, 60, 64], [46, 50, 53, 57, 60], [53, 57, 60, 64], [43, 46, 50, 53, 57],
    [46, 50, 53, 57, 60], [50, 53, 57, 60, 64], [48, 52, 55, 57, 62], [46, 50, 53, 57, 60], [53, 57, 60, 64, 67],
  ];
  const roots = [38, 38, 34, 41, 31, 34, 38, 36, 34, 41];
  // conversion section: the choir pad morphs a -> o -> i while the take flows through the workflow
  const vowel = (t: number): [string, string, number] | string => {
    const f = t * 60;
    if (f < E.flowFrom) return 'a';
    if (f < (E.flowFrom + E.flowTo) / 2) return ['a', 'o', (f - E.flowFrom) / ((E.flowTo - E.flowFrom) / 2)];
    if (f < E.flowTo) return ['o', 'i', (f - (E.flowFrom + E.flowTo) / 2) / ((E.flowTo - E.flowFrom) / 2)];
    if (f < E.flowTo + 40) return ['i', 'a', (f - E.flowTo) / 40];
    return 'a';
  };
  chords.forEach((ch, b) => {
    const t0 = b * 2;
    const t1 = b === 9 ? 19.6 : t0 + 2;
    pad(c, ch, t0, t1, {vol: b === 0 ? 0.32 : 0.42, vowel, att: b === 0 ? 1.6 : 0.3, rel: b === 9 ? 0.4 : 0.6, send: 0.45});
    pad(c, ch.map((m) => m + 12), t0, t1, {vol: 0.2, lp0: 2400, lp1: 4200, att: 0.5, rel: 0.6, send: 0.5});
    if (b >= 1) sub(c, Math.max(t0, 3), roots[b], t1 - Math.max(t0, 3), b === 9 ? 0.09 : 0.11);
  });
  airNoise(c, 0, 3.2, 0.05);
  bell(c, fs_(E.dot), 81, 0.16, 2.2, 0, 2, 1.2, 0.6);
  // waveform grows: a soft breathy swell
  airNoise(c, fs_(E.waveFrom), fs_(E.waveTo + 20), 0.09);
  E.bars.forEach((f, i) => pluck(c, fs_(f), [62, 65, 69, 72, 76][i], 0.32, -0.5 + i * 0.25, 0.35, 0.7));
  E.bars.forEach((f) => click(c, f, 0.05, 4200));
  riser(c, V.SFX.riser[0], V.SFX.riser[1], 0.2);
  // half-time groove from the title to the kinetic break
  for (let t = 3; t < 16; t += 2) {
    kick(c, t, 0.42);
    kick(c, t + 1.25, 0.26);
    rim(c, t + 1, 0.3);
    for (let h = 0; h < 8; h++) hat(c, t + h * 0.25, h % 2 ? 0.13 : 0.22, h === 7, 0.25);
  }
  // 8th-note pluck arpeggios once the library opens
  for (let t = 5.5; t < 16; t += 0.25) {
    const b = Math.floor(t / 2);
    const ch = chords[b];
    const k = Math.round(t * 4) % 8;
    const order = [0, 2, 4, 3, 1, 2, 4, 3];
    pluck(c, t, ch[order[k] % ch.length] + 12, 0.16, k % 2 ? 0.45 : -0.45, 0.3, 0.75);
  }
  V.EV.rows.forEach((f, i) => click(c, f, 0.09, 2600 + i * 180, 0.3));
  V.EV.nodes.forEach((f, i) => { click(c, f, 0.1, 2200); bell(c, fs_(f), [69, 72, 76][i], 0.1, 1.2, 0, 2, 0.6); });
  V.EV.slices.forEach((f, i) => { click(c, f, 0.12, 3400); pluck(c, fs_(f), [74, 72, 69, 67, 65][i], 0.12, 0.3); });
  blip(c, E.select, 0.14, 76, 81);
  blip(c, E.done, 0.16, 74, 81);
  blip(c, E.ready, 0.15, 72, 79);
  V.SFX.whooshes.forEach((f) => whoosh(c, f, 0.2));
  V.SFX.hits.forEach((f, i) => hit(c, f, 0.45 + i * 0.12));
  boom(c, E.title, 0.9);
  shimmer(c, E.title, 0.05, [62, 65, 69, 72]);
  riser(c, V.SFX.riser2[0], V.SFX.riser2[1], 0.22);
  boom(c, E.lock, 1);
  shimmer(c, E.lock, 0.07, [65, 69, 72, 76, 79]);
  return c;
}

function montage(): Ctx {
  const c = ctx(2);
  const E = M.EV;
  const chords = [[45, 52, 57], [45, 52, 57, 59, 60], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62], [45, 52, 57, 59, 60], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62], [48, 55, 59, 62, 64, 67]];
  const roots = [33, 33, 29, 36, 31, 33, 29, 36, 31, 36];
  // tension intro: low detuned drone + clock ticks
  pad(c, [33, 40], 0, 2.05, {vol: 0.5, lp0: 180, lp1: 900, att: 0.6, rel: 0.2, send: 0.2});
  for (let f = 0; f < E.clap; f += 15) click(c, f, f % 30 ? 0.05 : 0.08, f % 30 ? 2600 : 1800, 0.4);
  E.strips.forEach((f) => swish(c, f, 0.12));
  riser(c, M.SFX.riser[0], M.SFX.riser[1], 0.24);
  boom(c, E.clap, 0.95);
  // slate clap: sharp wood crack on the same frame
  const bp = new BQ().set(2, 1900, 1.4);
  put(c, c.dry, fr(E.clap), sec(0.12), 0, 0.3, (tt) => 0.7 * (2.4 * bp.run(noise(c)) * Math.exp(-tt / 0.01) + Math.sin(TAU * 380 * tt) * Math.exp(-tt / 0.02)), c.imp);
  for (let b = 1; b < 10; b++) {
    const t0 = b * 2;
    const t1 = b === 9 ? 19.6 : t0 + 2;
    pad(c, chords[b], t0, t1, {vol: 0.42, lp0: 1600, lp1: 4200, att: 0.08, rel: 0.4, send: 0.35});
    if (b < 9) for (let e = 0; e < 16; e++) {
      const t = t0 + e * 0.125;
      if (t < 2 || t >= 17) continue;
      if (e % 2 === 0) bassPulse(c, t, roots[b], 0.11, 0.2);
    }
    else sub(c, t0, roots[b], 1.6, 0.11);
  }
  for (let t = 2; t < 17; t += 0.5) {
    const beat = Math.round(t * 2) % 4;
    kick(c, t, 0.5);
    if (beat === 1 || beat === 3) clap(c, t, 0.42);
    for (let h = 0; h < 4; h++) hat(c, t + h * 0.125, h === 2 ? 0.2 : 0.12, h === 2 && beat % 2 === 0, 0.3);
  }
  // offbeat e-piano stabs
  for (let t = 2.25; t < 17; t += 0.5) {
    const b = Math.floor(t / 2);
    chords[b].slice(-3).forEach((m, j) => bell(c, t, m + 12, 0.07, 0.35, -0.3 + j * 0.3, 1, 1.2, 0.25));
  }
  // scan sweep through the waveforms
  const scan = new BQ();
  put(c, c.dry, fr(E.scanFrom), fr(E.scanTo) - fr(E.scanFrom), 0.2, 0.3, (tt) => {
    const u = tt / fs_(E.scanTo - E.scanFrom);
    if ((Math.round(tt * SR) & 31) === 0) scan.set(2, 600 * 8 ** u, 6);
    return 0.12 * Math.sin(Math.PI * u) * scan.run(noise(c)) * 3;
  });
  M.SFX.hits.forEach((f, i) => { hit(c, f, 0.5); bell(c, fs_(f), [69, 72, 76][i], 0.08, 0.8, 0, 3, 1); });
  blip(c, E.locked, 0.16, 76, 81);
  shimmer(c, E.locked, 0.03, [57, 60, 64]);
  E.cams.forEach((f) => click(c, f, 0.11, 2400, -0.3));
  E.channels.forEach((f) => click(c, f, 0.1, 3600, 0.3));
  E.markers.forEach((f, i) => { click(c, f, 0.08, 3000); pluck(c, fs_(f), [81, 84, 88, 91][i], 0.13, -0.3 + i * 0.2, 0.3, 0.6); });
  E.captions.forEach((f) => swish(c, f, 0.07));
  E.chips.forEach((f, i) => click(c, f, 0.1, 2600 + i * 300));
  blip(c, E.packed, 0.16, 72, 79);
  M.SFX.whooshes.forEach((f) => whoosh(c, f, 0.2));
  riser(c, M.SFX.riser2[0], M.SFX.riser2[1], 0.22);
  boom(c, E.lock, 1);
  shimmer(c, E.lock, 0.07, [60, 64, 67, 71, 74]);
  return c;
}

function suite(): Ctx {
  const c = ctx(3);
  const E = S.EV;
  const chords = [[48, 52, 55, 59, 62], [48, 52, 55, 59, 62], [45, 52, 55, 60, 64], [41, 48, 52, 55, 57], [43, 50, 55, 59, 64], [48, 52, 55, 59, 62], [45, 52, 55, 60, 64], [41, 48, 52, 55, 57], [43, 50, 55, 59, 62]];
  const roots = [36, 36, 33, 29, 31, 36, 33, 29, 31];
  chords.forEach((ch, b) => {
    const t0 = b * 2;
    const t1 = b === 8 ? 17 : t0 + 2;
    pad(c, ch, t0, t1, {vol: b === 0 ? 0.28 : 0.32, lp0: b === 0 ? 600 : 2200, lp1: b === 0 ? 2400 : 4400, att: b === 0 ? 1.2 : 0.1, rel: 0.5, send: 0.4});
    if (b >= 1 && b < 8) for (let e = 0; e < 4; e++) {
      const t = t0 + e * 0.5;
      if (t >= 3) bassPulse(c, t, roots[b], 0.4, 0.18);
    }
  });
  // voice section: the choir layer from the Voice reel joins
  pad(c, [57, 60, 64, 67], 10, 13, {vol: 0.22, vowel: () => 'a', att: 0.4, rel: 0.5, send: 0.5});
  pad(c, [48, 55, 59, 62, 64, 67], 17, 19.6, {vol: 0.4, lp0: 900, lp1: 2600, att: 0.25, rel: 0.4, send: 0.5});
  sub(c, 17, 36, 2.6, 0.1);
  scribble(c, E.drawFrom, E.drawTo, 0.14);
  riser(c, S.SFX.riser[0], S.SFX.riser[1], 0.16);
  boom(c, E.markLock, 0.6);
  shimmer(c, E.markLock, 0.05, [60, 64, 67, 71]);
  bell(c, fs_(E.tagline), 79, 0.05, 1.5, 0.2, 2, 0.6);
  for (let t = 3; t < 16; t += 0.5) {
    const beat = Math.round(t * 2) % 4;
    kick(c, t, 0.45);
    if (beat === 1 || beat === 3) clap(c, t, 0.32);
    hat(c, t + 0.25, 0.17, beat === 3, 0.25);
    hat(c, t, 0.08, false, -0.2);
  }
  for (let t = 3; t < 16; t += 0.25) {
    const b = Math.floor(t / 2);
    const ch = chords[b];
    const k = Math.round(t * 4) % 8;
    pluck(c, t, ch[[0, 2, 4, 2, 1, 3, 4, 3][k] % ch.length] + 12, 0.14, k % 2 ? 0.5 : -0.5, 0.3, 0.85);
  }
  const penta = [72, 74, 76, 79, 81];
  E.icons.forEach((f, i) => pluck(c, fs_(f), penta[i % 5] + 12 * Math.floor(i / 5) - 12, 0.14, -0.6 + (i / 16) * 1.2, 0.3, 0.7));
  blip(c, E.count, 0.15, 79, 84);
  S.SFX.clicks.forEach((f) => click(c, f, 0.1, 2800));
  S.SFX.hits.forEach((f, i) => hit(c, f, i < 3 ? 0.42 + i * 0.1 : 0.4));
  S.EV.snaps.forEach((f, i) => bell(c, fs_(f), [69, 72, 76][i], 0.08, 0.8, 0, 3, 1));
  S.SFX.whooshes.forEach((f) => whoosh(c, f, 0.2));
  riser(c, S.SFX.riser2[0], S.SFX.riser2[1], 0.22);
  boom(c, E.lock, 1);
  shimmer(c, E.lock, 0.07, [60, 64, 67, 71, 74]);
  return c;
}

const TRACKS = {
  voice: {make: voice, onsets: [...V.SFX.impacts, ...V.SFX.hits], wh: V.SFX.whooshes, duck: 0.25},
  montage: {make: montage, onsets: [...M.SFX.impacts, ...M.SFX.hits], wh: M.SFX.whooshes, duck: 0.45},
  suite: {make: suite, onsets: [...S.SFX.impacts, ...S.SFX.hits], wh: S.SFX.whooshes, duck: 0.4},
};

const want = process.argv.slice(2);
const outDir = path.resolve(import.meta.dirname, '../../public/mk');
for (const [name, tr] of Object.entries(TRACKS)) {
  if (want.length && !want.includes(name)) continue;
  console.log(`[${name}] synthesizing...`);
  const c = tr.make();
  checkSync(name, c, tr.onsets, tr.wh);
  const m = master(mixdown(c, tr.duck));
  console.log(`  integrated ${m.loud.toFixed(2)} LUFS, true peak ${m.tp.toFixed(2)} dBTP`);
  assert.ok(Math.abs(m.loud + 14) < 0.5 && m.tp < -1, `${name}: mastering out of spec`);
  writeWav(path.join(outDir, `${name}.wav`), m.L, m.R);
}
