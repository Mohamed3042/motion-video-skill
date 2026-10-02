// World 5 · Training — sound. A minor, 120 BPM, Am | F | C | G. An arpeggio that accelerates (8ths → 16ths →
// triplets → 32nds) under a rising filter, a kick that builds from half-time to a roll, one gate hit per check,
// an impact when the progress ring completes, a riser into the boundary and a CRT power-on tick.
// Also exports the small synth kit the Arcade script reuses.
import type {SynthCtx} from '../types.ts';
import {mulberry32} from '../../../src/mkv/timing.ts';
import {EVENTS, T} from '../../../src/mkv/worlds/training/timing.ts';

export const TAU = Math.PI * 2;
export const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

export class BQ {
  b0 = 1;
  b1 = 0;
  b2 = 0;
  a1 = 0;
  a2 = 0;
  z1 = 0;
  z2 = 0;
  SR: number;
  constructor(SR: number) {
    this.SR = SR;
  }
  // 0 = lowpass, 1 = highpass, 2 = bandpass (0 dB peak)
  set(type: 0 | 1 | 2, f: number, q: number) {
    const w = (TAU * Math.min(Math.max(f, 10), this.SR * 0.45)) / this.SR;
    const cs = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    const a0 = 1 + al;
    let b0: number, b1: number, b2: number;
    if (type === 0) [b0, b1, b2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2];
    else if (type === 1) [b0, b1, b2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
    else [b0, b1, b2] = [al, 0, -al];
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cs) / a0;
    this.a2 = (1 - al) / a0;
    return this;
  }
  run(x: number) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

// band-limited saw (polyBLEP); p = phase 0..1, dt = f/SR
export const saw = (p: number, dt: number) => {
  let s = 2 * p - 1;
  if (p < dt) {
    const x = p / dt;
    s -= x + x - x * x - 1;
  } else if (p > 1 - dt) {
    const x = (p - 1) / dt;
    s -= x * x + x + x + 1;
  }
  return s;
};
export const pulse = (p: number, dt: number, duty: number) => saw(p, dt) - saw((p + 1 - duty) % 1, dt);

// A world's private stereo bus covering its range; finish() limits it and adds it to the track.
export type Bus = {ctx: SynthCtx; L: Float64Array; R: Float64Array; sL: Float64Array; sR: Float64Array; i0: number; n: number; r: () => number};
export const bus = (ctx: SynthCtx, seed: number): Bus => {
  const i0 = Math.max(0, Math.floor(ctx.at(-15)));
  const n = Math.min(ctx.L.length, Math.ceil(ctx.at(ctx.length + 45))) - i0;
  const a = () => new Float64Array(n);
  return {ctx, L: a(), R: a(), sL: a(), sR: a(), i0, n, r: mulberry32(seed)};
};
const panG = (p: number) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];
export const noise = (b: Bus) => b.r() * 2 - 1;

// Place a mono voice starting exactly at local frame f (fn gets seconds since start), with pan + reverb send.
export function put(b: Bus, f: number, dur: number, pan: number, send: number, fn: (t: number) => number) {
  const {SR} = b.ctx;
  const s0 = Math.round(b.ctx.at(f));
  const len = Math.round(dur * SR);
  const [gl, gr] = panG(pan);
  for (let k = 0; k < len; k++) {
    const v = fn(k / SR);
    const j = s0 + k - b.i0;
    if (j < 0 || j >= b.n) continue;
    b.L[j] += v * gl;
    b.R[j] += v * gr;
    if (send) {
      b.sL[j] += v * gl * send;
      b.sR[j] += v * gr * send;
    }
  }
}

// Clear the bed for an impact/hit: dip everything already on the bus (dry + send) over the ~60 ms before
// local frame f and snap back right on it, so the hit lands as a clean transient. Call before adding the hit.
export function duck(b: Bus, f: number, floor = 0.12, pre = 0.06) {
  const {SR} = b.ctx;
  const e = Math.round(b.ctx.at(f)) - b.i0;
  const a = e - Math.round(pre * SR);
  const fade = Math.round(0.012 * SR);
  for (let j = Math.max(0, a); j < Math.min(b.n, e); j++) {
    const g = j < a + fade ? 1 - (1 - floor) * ((j - a) / fade) : j > e - 30 ? floor + (1 - floor) * ((j - (e - 30)) / 30) : floor;
    b.L[j] *= g;
    b.R[j] *= g;
    b.sL[j] *= g;
    b.sR[j] *= g;
  }
}

// gain → look-ahead peak limiter (ceiling in dBFS) → add into the track's dry bus
export function finish(b: Bus, gain: number, ceilDb = -6) {
  const c = 10 ** (ceilDb / 20);
  const {SR} = b.ctx;
  const LA = Math.round(SR * 0.003);
  const req = new Float64Array(b.n);
  for (let i = 0; i < b.n; i++) {
    const a = Math.max(Math.abs(b.L[i]), Math.abs(b.R[i])) * gain;
    req[i] = a > c ? c / a : 1;
  }
  const rel = 1 - Math.exp(-1 / (0.08 * SR));
  const att = 1 - Math.exp(-1 / (0.0007 * SR));
  let g = 1;
  for (let i = 0; i < b.n; i++) {
    let m = 1;
    for (let k = 0; k <= LA && i + k < b.n; k++) if (req[i + k] < m) m = req[i + k];
    g += (m - g) * (m < g ? att : rel);
    const gi = Math.min(g, req[i]) * gain;
    b.ctx.L[b.i0 + i] += b.L[i] * gi;
    b.ctx.R[b.i0 + i] += b.R[i] * gi;
    b.ctx.sendL[b.i0 + i] += b.sL[i] * gain;
    b.ctx.sendR[b.i0 + i] += b.sR[i] * gain;
  }
}

// ---------- shared percussion ----------
export function kick(b: Bus, f: number, vol: number, decay = 0.28, top = 150, bottom = 46) {
  const {SR} = b.ctx;
  let ph = 0;
  put(b, f, decay * 2.2, 0, 0, (t) => {
    ph += (TAU * (bottom + (top - bottom) * Math.exp(-t / 0.032))) / SR;
    const click = t < 0.004 ? 0.35 * noise(b) * (1 - t / 0.004) : 0;
    return vol * (Math.sin(ph) * Math.exp(-t / decay) * Math.min(1, t * 2500) + click);
  });
}
export function hat(b: Bus, f: number, vol: number, open = false, pan = 0.25) {
  const hp = new BQ(b.ctx.SR).set(1, 7600, 0.7);
  put(b, f, open ? 0.32 : 0.08, pan, 0.05, (t) => vol * hp.run(noise(b)) * Math.exp(-t / (open ? 0.09 : 0.017)));
}
export function clap(b: Bus, f: number, vol: number, pan = 0) {
  const bp = new BQ(b.ctx.SR).set(2, 1300, 0.9);
  put(b, f, 0.34, pan, 0.22, (t) => {
    let e = 0;
    for (const o of [0, 0.011, 0.022]) if (t >= o) e = Math.max(e, Math.exp(-(t - o) / 0.006));
    if (t > 0.022) e = Math.max(e, 0.45 * Math.exp(-(t - 0.022) / 0.09));
    return vol * 2.6 * bp.run(noise(b)) * e;
  });
}

// ---------- Training instruments ----------
const CHORDS = [
  [57, 60, 64], // Am
  [53, 57, 60], // F
  [48, 52, 55], // C
  [55, 59, 62], // G
];
const ROOTS = [33, 29, 36, 31]; // A1 F1 C2 G1

function pluck(b: Bus, f: number, m: number, vol: number, cutoff: number, pan: number) {
  const {SR} = b.ctx;
  const fr = mtof(m);
  const dt = fr / SR;
  let p1 = b.r();
  let p2 = b.r();
  const lp = new BQ(SR);
  put(b, f, 0.42, pan, 0.28, (t) => {
    p1 = (p1 + dt * 1.004) % 1;
    p2 = (p2 + dt * 0.996) % 1;
    if ((Math.round(t * SR) & 15) === 0) lp.set(0, cutoff * (1 + 2.5 * Math.exp(-t / 0.03)), 2.4);
    const s = 0.5 * (saw(p1, dt * 1.004) + saw(p2, dt * 0.996));
    return vol * Math.min(1, t / 0.0015) * Math.exp(-t / 0.11) * lp.run(s);
  });
}

function bassNote(b: Bus, f: number, m: number, dur: number, vol: number) {
  const {SR} = b.ctx;
  const fr = mtof(m);
  const dt = fr / SR;
  let p = 0;
  const lp = new BQ(SR).set(0, 380, 1.1);
  put(b, f, dur + 0.03, 0, 0, (t) => {
    p = (p + dt) % 1;
    const e = Math.min(1, t / 0.004) * Math.exp(-t / 0.22) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.03) : 1);
    return vol * e * (0.7 * lp.run(saw(p, dt)) + 0.8 * Math.sin(TAU * fr * t));
  });
}

function pad(b: Bus, f: number, notes: number[], dur: number, vol: number) {
  const {SR} = b.ctx;
  notes.forEach((m, j) => {
    for (const det of [-0.006, 0.006]) {
      const dt = (mtof(m) * (1 + det)) / SR;
      let p = b.r();
      const lp = new BQ(SR).set(0, 900, 0.7);
      put(b, f, dur + 0.3, (j - 1) * 0.5 + det * 40, 0.45, (t) => {
        p = (p + dt) % 1;
        const e = Math.min(1, t / 0.25) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.3) : 1);
        return (vol / notes.length) * e * lp.run(saw(p, dt));
      });
    }
  });
}

function gateHit(b: Bus, f: number, m: number, vol: number) {
  const {SR} = b.ctx;
  const fc = mtof(m);
  put(b, f, 1.5, 0.15, 0.4, (t) => vol * 0.55 * Math.min(1, t * 900) * Math.exp(-t / 0.32) * Math.sin(TAU * fc * t + 2.4 * Math.exp(-t / 0.1) * Math.sin(TAU * fc * 1.414 * t)));
  put(b, f, 1.2, -0.15, 0.3, (t) => vol * 0.25 * Math.min(1, t * 900) * Math.exp(-t / 0.4) * Math.sin(TAU * fc * 2 * t));
  const bp = new BQ(SR).set(2, 3600, 1.4);
  put(b, f, 0.1, 0, 0.12, (t) => vol * 1.1 * bp.run(noise(b)) * Math.exp(-t / 0.014));
  let ph = 0;
  put(b, f, 0.3, 0, 0, (t) => {
    ph += (TAU * (62 + 110 * Math.exp(-t / 0.02))) / SR;
    return vol * 0.55 * Math.sin(ph) * Math.exp(-t / 0.1);
  });
}

function impact(b: Bus, f: number, vol: number) {
  const {SR} = b.ctx;
  let ph = 0;
  put(b, f, 1.6, 0, 0, (t) => {
    ph += (TAU * (32 + 90 * Math.exp(-t / 0.09))) / SR;
    return vol * Math.sin(ph) * Math.exp(-t / 0.55) * Math.min(1, t * 3000);
  });
  const lp = new BQ(SR);
  put(b, f, 1.4, 0, 0.5, (t) => {
    if ((Math.round(t * SR) & 31) === 0) lp.set(0, 200 + 9000 * Math.exp(-t / 0.12), 0.8);
    return vol * 0.55 * lp.run(noise(b)) * Math.exp(-t / 0.35);
  });
  for (const m of [55, 59, 62, 67, 71]) pluck(b, f, m, vol * 0.22, 2600, (m % 3) * 0.3 - 0.3);
}

function riser(b: Bus, f0: number, f1: number, vol: number) {
  const {SR} = b.ctx;
  const dur = (f1 - f0) / 60;
  const bp = new BQ(SR);
  const bp2 = new BQ(SR);
  let p = 0;
  put(b, f0, dur, 0, 0.35, (t) => {
    const u = t / dur;
    if ((Math.round(t * SR) & 31) === 0) {
      bp.set(2, 350 * (9000 / 350) ** u, 1.6);
      bp2.set(2, 500 * (11000 / 500) ** u, 2.5);
    }
    const n = noise(b);
    const fr = 110 * 2 ** (3 * u);
    p = (p + fr / SR) % 1;
    const tail = u > 0.97 ? (1 - u) / 0.03 : 1;
    return vol * u ** 2.2 * tail * (bp.run(n) * 0.9 + bp2.run(n) * 0.5 + 0.12 * saw(p, fr / SR));
  });
}

function crtTick(b: Bus, f: number, vol: number) {
  // click + rising whine + mains hum that fades out before the boundary
  const {SR} = b.ctx;
  put(b, f, 0.01, 0, 0, (t) => vol * noise(b) * (1 - t / 0.01));
  let ph = 0;
  put(b, f, 0.12, 0, 0.3, (t) => {
    ph += (TAU * (1400 * 2 ** (t / 0.05))) / SR;
    return vol * 0.35 * Math.sin(ph) * Math.exp(-t / 0.04);
  });
  put(b, f, 0.45, 0, 0, (t) => vol * 0.45 * Math.sin(TAU * 60 * t) * Math.exp(-t / 0.15) * Math.min(1, t * 400));
}

export default function render(ctx: SynthCtx) {
  const b = bus(ctx, 5050);

  // ---- bed: pad, bass, accelerating arpeggio, building drums ----
  for (let bar = 0; bar < 4; bar++) {
    pad(b, bar * 120, CHORDS[bar].map((m) => m - 12), bar === 3 ? 1.6 : 1.95, 0.16);
    if (bar === 0) bassNote(b, 0, ROOTS[0], 1.9, 0.38);
    else for (let e = 0; e < 8; e++) if (bar * 120 + e * 15 + 7.5 < 452) bassNote(b, bar * 120 + e * 15 + 7.5, ROOTS[bar] + (e % 2 ? 12 : 0), 0.11, 0.34);
  }
  // 8ths → 16ths → 16th triplets (beats 1–2 of bar 4) → 32nds, filter opening all the way
  const steps: number[] = [];
  for (let f = 0; f < 120; f += 15) steps.push(f);
  for (let f = 120; f < 360; f += 7.5) steps.push(f);
  for (let f = 360; f < 420; f += 5) steps.push(f);
  for (let f = 420; f < 454; f += 3.75) steps.push(f);
  const pattern = [0, 1, 2, 3, 4, 5, 4, 3]; // up two octaves and back
  steps.forEach((f, i) => {
    const ch = CHORDS[Math.min(3, Math.floor(f / 120))];
    const k = pattern[i % 8];
    pluck(b, f, ch[k % 3] + 12 * Math.floor(k / 3), 0.2 + 0.08 * (f / 454), 520 * (6200 / 520) ** (f / 454), i % 2 ? 0.32 : -0.32);
  });
  // building kick: half-time → four-on-the-floor → eighths → roll
  const kicks = [60, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 405, 420, 435, 442.5, 450];
  kicks.forEach((f) => kick(b, f, 0.55 + 0.35 * (f / 450)));
  for (let f = 127.5; f < 450; f += 7.5) if (f % 30 !== 0) hat(b, f, f % 15 === 0 ? 0.11 : 0.06, false, f % 15 ? 0.3 : -0.2);
  for (const f of [270, 330, 390]) clap(b, f, 0.32);
  // riser peaks just before the CRT powers on (cut 3 frames early so the tick lands in the gap)
  riser(b, 384, T.crtOn - 3, 0.55);

  // ---- events: clear the bed, then land each hit as a clean transient ----
  for (const e of EVENTS) if (e.kind === 'impact' || e.kind === 'hit') duck(b, e.f);
  duck(b, T.crtOn, 0.2);
  kick(b, T.title, 0.5, 0.5, 220, 40);
  impact(b, T.title, 0.45);
  for (const m of CHORDS[0]) pluck(b, T.title, m + 12, 0.18, 3200, 0);
  T.checks.forEach((f, i) => gateHit(b, f, [81, 84, 88, 93][i], 0.5));
  put(b, T.line, 0.25, 0, 0.3, (t) => 0.3 * Math.sin(TAU * mtof(93) * t) * Math.exp(-t / 0.07) * Math.min(1, t * 2000));
  put(b, T.line, 0.2, 0, 0.3, (t) => 0.12 * Math.sin(TAU * mtof(100) * t) * Math.exp(-t / 0.05) * Math.min(1, t * 2000));
  impact(b, T.ringDone, 0.85);
  crtTick(b, T.crtOn, 0.45);

  finish(b, 0.83, -7);
}
