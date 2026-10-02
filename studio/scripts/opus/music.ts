// Original 25 s soundtrack for OpusMotion, synthesised from scratch.
// Run: node scripts/opus/music.ts   ->  public/opus/music.wav (44.1 kHz, stereo, 16-bit)
// All timing comes from src/opus/timeline.ts (shared with the picture).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import * as T from '../../src/opus/timeline.ts';

const SR = 44100;
const LEN = T.DURATION / T.FPS; // 25 s
const TAIL = 2; // rendered past the end, folded back onto the start so the loop is seamless
const N = Math.round((LEN + TAIL) * SR);
const s = (f: number) => f / T.FPS;
const SIL0 = s(T.SILENCE_START);
const SIL1 = s(T.SILENCE_END);
const TAU = Math.PI * 2;

type Bus = {L: Float32Array; R: Float32Array};
const mkBus = (): Bus => ({L: new Float32Array(N), R: new Float32Array(N)});
const B = {
  pluck: mkBus(),
  bass: mkBus(),
  drums: mkBus(),
  keys: mkBus(),
  pad: mkBus(),
  fx: mkBus(),
  brass: mkBus(),
};
const verb = mkBus();

// ---------- primitives ----------
const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const polyBlep = (t: number, dt: number) => {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
};
// Topology-preserving state variable filter. mode 0 = LP, 1 = BP, 2 = HP
const svf = () => {
  let ic1 = 0;
  let ic2 = 0;
  return (x: number, fc: number, q: number, mode: number) => {
    const g = Math.tan((Math.PI * Math.min(Math.max(fc, 10), SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    return mode === 0 ? v2 : mode === 1 ? v1 : x - k * v1 - v2;
  };
};
const panGains = (p: number): [number, number] => {
  const th = ((p + 1) * Math.PI) / 4;
  return [Math.cos(th), Math.sin(th)];
};

// Place a (mono or stereo) voice on a bus. Anything that starts before the 17.5 s break is
// hard-stopped at the break so that the half second before the drop is digital silence.
function place(b: Bus, t0: number, L: Float32Array, gain: number, pan = 0, send = 0, R?: Float32Array) {
  const i0 = Math.round(t0 * SR);
  const [gl, gr] = panGains(pan);
  const cut = t0 < SIL0 ? Math.round(SIL0 * SR) : Infinity;
  const fade = Math.round(0.002 * SR);
  for (let i = 0; i < L.length; i++) {
    const j = i0 + i;
    if (j < 0) continue;
    if (j >= N || j >= cut) break;
    const w = j > cut - fade ? (cut - j) / fade : 1;
    const l = L[i] * gain * gl * w;
    const r = (R ? R[i] : L[i]) * gain * gr * w;
    b.L[j] += l;
    b.R[j] += r;
    if (send) {
      verb.L[j] += l * send;
      verb.R[j] += r * send;
    }
  }
}

// ---------- instruments ----------
let seedCounter = 1;
function pluck(midi: number, dur: number, vel: number, bright: number): [Float32Array, Float32Array] {
  const f = mtof(midi);
  const n = Math.round((dur + 0.7) * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const r = rng(seedCounter++);
  const fl = svf();
  const fr = svf();
  const det = [1, 1.0061, 0.9939];
  const ph = det.map(() => r());
  const sv = [0, 0, 0];
  const decay = 0.22 + 0.18 * bright;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    for (let k = 0; k < 3; k++) {
      const dt = (f * det[k]) / SR;
      ph[k] += dt;
      if (ph[k] >= 1) ph[k] -= 1;
      sv[k] = 2 * ph[k] - 1 - polyBlep(ph[k], dt);
    }
    const sine = Math.sin(TAU * f * t) * 0.35;
    const pick = (r() * 2 - 1) * Math.exp(-t / 0.003) * 0.25;
    const env =
      (1 - Math.exp(-t / 0.0015)) * Math.exp(-t / decay) * (t > dur ? Math.exp(-(t - dur) / 0.07) : 1);
    const fc = 700 + (2600 + 4200 * bright) * Math.exp(-t / 0.075) + 500 * bright;
    L[i] = fl(sv[0] * 0.45 + sv[1] * 0.45 + sine + pick, fc, 0.85, 0) * env * vel;
    R[i] = fr(sv[0] * 0.45 + sv[2] * 0.45 + sine + pick, fc, 0.85, 0) * env * vel;
  }
  return [L, R];
}

function bassNote(midi: number, dur: number, vel: number): Float32Array {
  const f = mtof(midi);
  const n = Math.round((dur + 0.08) * SR);
  const out = new Float32Array(n);
  const flt = svf();
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const fi = f * Math.pow(2, (3 / 12) * Math.exp(-t / 0.022)); // rubbery "boing" into pitch
    ph += fi / SR;
    if (ph >= 1) ph -= 1;
    const tri = 4 * Math.abs(ph - 0.5) - 1;
    const x = Math.sin(TAU * ph) * 0.8 + tri * 0.45;
    const env = (1 - Math.exp(-t / 0.003)) * (0.55 + 0.45 * Math.exp(-t / 0.09)) * (t > dur ? Math.exp(-(t - dur) / 0.02) : 1);
    const fc = 160 + 1300 * Math.exp(-t / 0.06) * vel;
    out[i] = Math.tanh(1.6 * flt(x, fc, 1.1, 0)) * env * vel;
  }
  return out;
}

function kick(vel: number, low = 45, high = 140, dec = 0.22): Float32Array {
  const n = Math.round(0.5 * SR);
  const out = new Float32Array(n);
  const r = rng(seedCounter++);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (low + (high - low) * Math.exp(-t / 0.03)) / SR;
    const click = (r() * 2 - 1) * Math.exp(-t / 0.0015) * 0.3;
    out[i] = (Math.sin(TAU * ph) * Math.exp(-t / dec) + click) * vel;
  }
  return out;
}

function stomp(vel: number): Float32Array {
  const n = Math.round(0.45 * SR);
  const out = new Float32Array(n);
  const r = rng(seedCounter++);
  const flt = svf();
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (58 + 90 * Math.exp(-t / 0.035)) / SR;
    const body = Math.sin(TAU * ph) * Math.exp(-t / 0.15);
    const thud = flt((r() * 2 - 1), 900, 0.7, 0) * Math.exp(-t / 0.025) * 1.4;
    out[i] = (body + thud) * vel;
  }
  return out;
}

function clap(vel: number): [Float32Array, Float32Array] {
  const n = Math.round(0.35 * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const rl = rng(seedCounter++);
  const rr = rng(seedCounter++);
  const fl = svf();
  const fr = svf();
  const hl = svf();
  const hr = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let env = 0;
    for (const o of [0, 0.009, 0.018]) if (t >= o) env = Math.max(env, Math.exp(-(t - o) / 0.0045));
    if (t >= 0.022) env = Math.max(env, 0.55 * Math.exp(-(t - 0.022) / 0.085));
    L[i] = hl(fl(rl() * 2 - 1, 1250, 1.3, 1), 500, 0.7, 2) * env * vel * 2.2;
    R[i] = hr(fr(rr() * 2 - 1, 1350, 1.3, 1), 500, 0.7, 2) * env * vel * 2.2;
  }
  return [L, R];
}

function snap(vel: number): Float32Array {
  const n = Math.round(0.12 * SR);
  const out = new Float32Array(n);
  const r = rng(seedCounter++);
  const flt = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const nz = flt(r() * 2 - 1, 2900, 3.0, 1) * Math.exp(-t / 0.011) * 3;
    const tone = Math.sin(TAU * 1850 * t) * Math.exp(-t / 0.006) * 0.4;
    out[i] = (nz + tone) * vel;
  }
  return out;
}

function snare(vel: number): Float32Array {
  const n = Math.round(0.25 * SR);
  const out = new Float32Array(n);
  const r = rng(seedCounter++);
  const flt = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const nz = flt(r() * 2 - 1, 3800, 0.6, 1) * Math.exp(-t / 0.06) * 1.6;
    const body = Math.sin(TAU * 195 * t) * Math.exp(-t / 0.035) * 0.5;
    out[i] = (nz + body) * vel;
  }
  return out;
}

function glock(midi: number, vel: number): Float32Array {
  const f = mtof(midi);
  const n = Math.round(1.6 * SR);
  const out = new Float32Array(n);
  const ratios = [1, 2.756, 5.404, 8.933];
  const amps = [1, 0.3, 0.12, 0.05];
  const decs = [1.0, 0.33, 0.15, 0.07];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let x = 0;
    for (let k = 0; k < 4; k++) x += Math.sin(TAU * f * ratios[k] * t) * amps[k] * Math.exp(-t / decs[k]);
    out[i] = x * (1 - Math.exp(-t / 0.0008)) * vel;
  }
  return out;
}

// The bell: identical for the opening ping and the final ring so the music loops with the picture.
function bell(vel: number): Float32Array {
  const f = mtof(86); // D6
  const n = Math.round(2.4 * SR);
  const out = new Float32Array(n);
  const ratios = [1, 2.0, 3.01, 4.07, 5.43];
  const amps = [1, 0.42, 0.22, 0.14, 0.08];
  const decs = [0.95, 0.6, 0.38, 0.25, 0.16];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let x = 0;
    for (let k = 0; k < ratios.length; k++) {
      const fm = Math.sin(TAU * f * 3.5 * t) * 1.6 * Math.exp(-t / 0.18);
      x += Math.sin(TAU * f * ratios[k] * t + (k === 0 ? fm : 0)) * amps[k] * Math.exp(-t / decs[k]);
    }
    x += Math.sin(TAU * (f / 2) * t) * 0.38 * Math.exp(-t / 0.8);
    out[i] = x * (1 - Math.exp(-t / 0.001)) * vel;
  }
  return out;
}

function padChord(notes: number[], dur: number, vel: number, cutoff: number): [Float32Array, Float32Array] {
  const n = Math.round((dur + 0.8) * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const r = rng(seedCounter++);
  const detune = [-0.11, -0.05, 0, 0.05, 0.11];
  const voices = notes.flatMap((m) => detune.map((d, k) => ({f: mtof(m + d), ph: r(), side: k % 2})));
  const fl = svf();
  const fr = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let l = 0;
    let rr = 0;
    for (const v of voices) {
      const dt = v.f / SR;
      v.ph += dt;
      if (v.ph >= 1) v.ph -= 1;
      const x = 2 * v.ph - 1 - polyBlep(v.ph, dt);
      if (v.side) rr += x;
      else l += x;
    }
    const env = Math.min(1, t / 0.45) * (t > dur ? Math.exp(-(t - dur) / 0.25) : 1);
    const sc = 0.12 / voices.length;
    L[i] = fl(l + rr * 0.35, cutoff, 0.7, 0) * env * vel * sc * 2;
    R[i] = fr(rr + l * 0.35, cutoff, 0.7, 0) * env * vel * sc * 2;
  }
  return [L, R];
}

// Filtered-noise swoosh. Pan glides from p0 to p1; band centre glides f0 -> fPeak -> f1.
function swoosh(t0: number, dur: number, gain: number, p0: number, p1: number, f0: number, fPeak: number, f1: number, send = 0.3) {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const r = rng(seedCounter++);
  const flt = svf();
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const fc = u < 0.6 ? f0 * Math.pow(fPeak / f0, u / 0.6) : fPeak * Math.pow(f1 / fPeak, (u - 0.6) / 0.4);
    const x = flt(r() * 2 - 1, fc, 1.4, 1) * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 1.6);
    const [gl, gr] = panGains(p0 + (p1 - p0) * u);
    L[i] = x * gl * 1.4;
    R[i] = x * gr * 1.4;
  }
  place(B.fx, t0, L, gain, 0, send, R);
}

function impact(t0: number, vel: number, deep: boolean) {
  const n = Math.round((deep ? 2.2 : 1.1) * SR);
  const out = new Float32Array(n);
  const r = rng(seedCounter++);
  const flt = svf();
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = deep ? 31 + 48 * Math.exp(-t / 0.22) : 42 + 70 * Math.exp(-t / 0.07);
    ph += f / SR;
    const sub = Math.sin(TAU * ph) * Math.exp(-t / (deep ? 0.95 : 0.42));
    const crack = flt(r() * 2 - 1, deep ? 1800 : 1200, 0.7, 0) * Math.exp(-t / (deep ? 0.05 : 0.02)) * 0.9;
    out[i] = Math.tanh(1.3 * (sub + crack)) * vel * (1 - Math.exp(-t / 0.0007));
  }
  place(B.drums, t0, out, 1, 0, deep ? 0.35 : 0.22);
}

function brassStab(t0: number, notes: number[], vel: number, len: number) {
  notes.forEach((m, idx) => {
    const f = mtof(m);
    const n = Math.round((len + 0.3) * SR);
    const out = new Float32Array(n);
    const r = rng(seedCounter++);
    const ph = [r(), r(), r()];
    const det = [1, 1.0045, 0.9955];
    const flt = svf();
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let x = 0;
      for (let k = 0; k < 3; k++) {
        const dt = (f * det[k] * (1 + 0.006 * Math.exp(-t / 0.03))) / SR;
        ph[k] += dt;
        if (ph[k] >= 1) ph[k] -= 1;
        x += 2 * ph[k] - 1 - polyBlep(ph[k], dt);
      }
      const fc = 420 + 3600 * (1 - Math.exp(-t / 0.014)) * Math.exp(-t / 0.2) + 700;
      const env = (1 - Math.exp(-t / 0.007)) * (0.45 + 0.55 * Math.exp(-t / 0.12)) * (t > len ? Math.exp(-(t - len) / 0.07) : 1);
      out[i] = Math.tanh(1.4 * flt(x / 3, fc, 0.9, 0)) * env * vel;
    }
    const pan = notes.length > 1 ? -0.55 + (1.1 * idx) / (notes.length - 1) : 0;
    place(B.brass, t0, out, 1, pan, 0.2);
  });
}

// ---------- arrangement ----------
// Chord per 2 s bar (bars 0..12). D major: I V vi IV, dominant on the build, plagal IV->I at the end.
const CHORDS = ['D', 'D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'A', 'D', 'A', 'G', 'D'];
const ROOT: Record<string, number> = {D: 38, A: 33, Bm: 35, G: 31};
const PAD: Record<string, number[]> = {D: [62, 66, 69], A: [61, 64, 69], Bm: [62, 66, 71], G: [62, 67, 71]};
const BRASS: Record<string, number[]> = {D: [50, 57, 62, 66, 69], A: [45, 57, 61, 64, 69]};
const GLOCK: Record<string, number[]> = {D: [90, 93, 98, 93], A: [88, 92, 97, 92], Bm: [90, 95, 97, 95], G: [91, 95, 98, 95]};
const HOOK = [69, 74, 76, 78, 74]; // A4 D5 E5 F#5 D5 - the five-note hook
const chordAt = (t: number) => CHORDS[Math.min(CHORDS.length - 1, Math.floor(t / 2))];
const inGroove = (t: number) => (t >= 2 && t < SIL0) || (t >= SIL1 && t < s(T.OUTRO));

// Opening: one deep bass hit + bright bell ping exactly on the impact. Ending: the same bell.
impact(s(T.IMPACT), 0.95, false);
place(B.keys, s(T.IMPACT), bell(1), 0.5, 0, 0.45);
place(B.keys, s(T.END_BELL), bell(1), 0.5, 0, 0.45);
// Period landing: a softer ping an octave lower in feel + thump (under the brass stab).
place(B.keys, s(T.PERIOD_LAND), bell(0.55), 0.7, 0.15, 0.4);
place(B.drums, s(T.PERIOD_LAND), stomp(0.8), 0.9, 0, 0.15);

// Hook (plucked synth). Bigger and wider on the drop, alone in the intro and the outro.
for (const p of T.HOOK_STARTS) {
  T.HOOK_RHYTHM.forEach((o, k) => {
    const t = s(p + o);
    if (t >= SIL0 && t < SIL1) return;
    const isDrop = t >= SIL1 && t < s(T.OUTRO);
    const isLast = p === T.HOOK_STARTS[T.HOOK_STARTS.length - 1] && k === 4;
    const dur = isLast ? 0.9 : k === 1 || k === 2 ? 0.14 : 0.24;
    const vel = (isDrop ? 1.0 : 0.88) * (k === 3 ? 1.05 : 1);
    const [l, r] = pluck(HOOK[k], dur, vel, isDrop ? 1 : 0.6);
    place(B.pluck, t, l, 0.5, 0, 0.16, r);
    if (isDrop) {
      const [l2, r2] = pluck(HOOK[k] + 12, dur, 0.5, 1);
      place(B.pluck, t + 0.012, l2, 0.38, -0.6, 0.2, r2);
      place(B.pluck, t, glock(HOOK[k] + 12, 0.32), 0.5, 0.55, 0.3);
    }
  });
}

// Bass (bouncy, rubbery), claps + stomps on 2 and 4, kick on 1 and 3, snaps on the off-beats.
const BASS_PATTERN: [number, number, number, number][] = [
  [0, 0, 0.26, 1],
  [0.5, 12, 0.12, 0.75],
  [0.75, 0, 0.14, 0.8],
  [1.0, 7, 0.26, 0.9],
  [1.5, 12, 0.12, 0.75],
  [1.75, 0, 0.12, 0.7],
];
for (let bar = 1; bar < 11; bar++) {
  const t0 = bar * 2;
  const root = ROOT[chordAt(t0)];
  for (const [o, semi, d, v] of BASS_PATTERN) {
    const t = t0 + o;
    if (!inGroove(t)) continue;
    place(B.bass, t, bassNote(root + semi, d, v), 0.55, 0, 0);
  }
  for (const beat of [0, 1, 2, 3]) {
    const t = t0 + beat * 0.5;
    if (!inGroove(t)) continue;
    if (beat === 1 || beat === 3) {
      const [cl, cr] = clap(0.9);
      place(B.drums, t + 0.004, cl, 0.5, 0, 0.16, cr);
      place(B.drums, t, stomp(0.9), 0.65, 0, 0.08);
    } else if (t < 16 || t >= SIL1) {
      place(B.drums, t, kick(0.85), 0.55, 0, 0.02);
    }
    const tOff = t + 0.25;
    if ((tOff >= 6 && tOff < 14) || (tOff >= SIL1 && tOff < s(T.OUTRO))) place(B.drums, tOff, snap(0.7), 0.32, beat % 2 ? 0.3 : -0.3, 0.12);
  }
}

// Warm pad underneath (enters with the groove, filtered on the build, gone for the outro).
for (let bar = 1; bar < 11; bar++) {
  const t0 = bar * 2;
  const ch = chordAt(t0);
  const level = t0 < 6 ? 0.55 : t0 < 14 ? 0.75 : t0 < 18 ? 0.85 : 0.95;
  const dur = 2.0; // last pad bar ends on the outro downbeat and releases
  const [l, r] = padChord(PAD[ch], dur, level, 1500);
  place(B.pad, t0, l, 1, 0, 0.3, r);
}

// Glockenspiel countermelody (off-beat eighths) through the morph, lighter through the orbit.
for (let t = 6; t < 14; t += 0.5) {
  const notes = GLOCK[chordAt(t)];
  const k = Math.round((t % 2) / 0.5);
  place(B.keys, t + 0.25, glock(notes[k], 0.5), t < 10 ? 0.55 : 0.35, k % 2 ? 0.45 : -0.45, 0.35);
}

// Little tactile pops as each letter of MOTION rises, a wooden tok on each bounce.
T.LETTER_RISE.forEach((f, i) => {
  const n = Math.round(0.12 * SR);
  const out = new Float32Array(n);
  for (let j = 0; j < n; j++) {
    const t = j / SR;
    out[j] = Math.sin(TAU * (260 + 40 * i) * t * (1 + 0.6 * (1 - Math.exp(-t / 0.02)))) * Math.exp(-t / 0.035);
  }
  place(B.fx, s(f), out, 0.28, -0.2 + 0.08 * i, 0.15);
});
T.LETTER_LAND.forEach((f) => place(B.fx, s(f), kick(0.5, 180, 420, 0.04), 0.22, 0, 0.1));

// Launch sparkle on the last bounce.
[86, 90, 93, 98].forEach((m, i) => place(B.keys, s(T.LAUNCH) + i * 0.0625, glock(m, 0.45), 0.5, -0.3 + 0.2 * i, 0.4));
swoosh(s(T.LAUNCH) - 0.05, 0.7, 0.35, -0.2, 0.2, 400, 3500, 2000);

// Soft swooshes under each shape morph.
for (let i = 0; i < 4; i++) swoosh(s(T.MORPH[i]), 0.55, 0.42, i % 2 ? 0.35 : -0.35, i % 2 ? -0.2 : 0.2, 350, 2600, 700);

// Airy stereo whooshes panning with the orbiting words.
for (let i = 0; i < 4; i++) swoosh(s(T.RING_IN) + i, 1.0, 0.36, i % 2 ? 0.9 : -0.9, i % 2 ? -0.9 : 0.9, 600, 3200, 900, 0.4);

// The build: riser, accelerating snare roll (filter sweep is applied on the music bus below).
{
  const t0 = 14;
  const n = Math.round((SIL0 - t0) * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const r = rng(seedCounter++);
  const hp = svf();
  const lp = svf();
  const ph = [0, 0.33, 0.66];
  const base = [62, 69, 74];
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const t = i / SR;
    const amp = Math.pow(u, 2.2);
    const nz = hp(r() * 2 - 1, 300 * Math.pow(30, u), 0.7, 2) * 0.55;
    let saw = 0;
    for (let k = 0; k < 3; k++) {
      const f = mtof(base[k] + 12 * Math.pow(u, 1.6));
      const dt = f / SR;
      ph[k] += dt;
      if (ph[k] >= 1) ph[k] -= 1;
      saw += 2 * ph[k] - 1 - polyBlep(ph[k], dt);
    }
    const sw = lp(saw / 3, 500 + 7000 * u * u, 1.2, 0) * 0.6;
    const wob = 0.5 + 0.5 * Math.sin(TAU * t * (2 + 6 * u));
    L[i] = (nz + sw * (0.8 + 0.2 * wob)) * amp;
    R[i] = (nz * 0.9 + sw * (0.8 + 0.2 * (1 - wob))) * amp;
  }
  place(B.fx, t0, L, 0.38, 0, 0.25, R);
  let t = 15.5;
  while (t < SIL0 - 1e-9) {
    const step = t < 16.5 ? 0.25 : t < 17 ? 0.125 : t < 17.25 ? 0.0625 : 0.03125;
    const v = 0.3 + 0.7 * ((t - 15.5) / 2);
    place(B.drums, t, snare(v), 0.45, 0, 0.2);
    t += step;
  }
}

// The drop: deep impact + punchy brass stabs (title forms at 18.0, sphere lands at 19.0).
impact(s(T.DROP), 1.0, true);
swoosh(s(T.DROP), 1.4, 0.2, -0.5, 0.5, 6000, 9000, 3000, 0.5); // soft shimmer, not a harsh crash
brassStab(s(T.DROP), BRASS.D, 0.85, 0.32);
brassStab(s(T.PERIOD_LAND), BRASS.D, 0.7, 0.2);
brassStab(s(T.DROP) + 2, BRASS.A, 0.6, 0.2);
brassStab(s(T.DROP) + 3, BRASS.A, 0.5, 0.14);

// ---------- mixing ----------
// Rising filter sweep over the build on the musical buses.
function sweep(b: Bus, t0: number, t1: number) {
  const fl = svf();
  const fr = svf();
  const i0 = Math.round(t0 * SR);
  const i1 = Math.round(t1 * SR);
  for (let i = i0; i < i1; i++) {
    const u = (i - i0) / (i1 - i0);
    // dip quickly to a dark tone, then sweep up to fully open
    const fc = u < 0.08 ? 18000 * Math.pow(900 / 18000, u / 0.08) : 900 * Math.pow(18000 / 900, Math.pow((u - 0.08) / 0.92, 1.4));
    b.L[i] = fl(b.L[i], fc, 1.1, 0);
    b.R[i] = fr(b.R[i], fc, 1.1, 0);
  }
}
for (const b of [B.pluck, B.pad, B.keys, B.bass]) sweep(b, 13.9, SIL0);

// Freeverb-style stereo reverb on the send bus. Its state is cleared at the break.
function reverb(inp: Bus): Bus {
  const out = mkBus();
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const make = (spread: number) => ({
    combs: combT.map((d) => ({buf: new Float32Array(d + spread), i: 0, lp: 0})),
    aps: apT.map((d) => ({buf: new Float32Array(d + spread), i: 0})),
  });
  const ch = [make(0), make(23)];
  const fb = 0.82;
  const damp = 0.25;
  const brk = Math.round(SIL0 * SR);
  for (let i = 0; i < N; i++) {
    if (i === brk) for (const c of ch) {
      for (const cb of c.combs) {
        cb.buf.fill(0);
        cb.lp = 0;
      }
      for (const a of c.aps) a.buf.fill(0);
    }
    for (let k = 0; k < 2; k++) {
      const x = (k ? inp.R[i] : inp.L[i]) * 0.015;
      let y = 0;
      for (const cb of ch[k].combs) {
        const o = cb.buf[cb.i];
        cb.lp = o * (1 - damp) + cb.lp * damp;
        cb.buf[cb.i] = x + cb.lp * fb;
        cb.i = (cb.i + 1) % cb.buf.length;
        y += o;
      }
      for (const a of ch[k].aps) {
        const o = a.buf[a.i];
        a.buf[a.i] = y + o * 0.5;
        a.i = (a.i + 1) % a.buf.length;
        y = o - y;
      }
      (k ? out.R : out.L)[i] = y;
    }
  }
  return out;
}

const GAINS: Record<keyof typeof B, number> = {pluck: 1.0, bass: 0.9, drums: 0.8, keys: 0.55, pad: 0.75, fx: 0.7, brass: 0.6};
const mixL = new Float32Array(N);
const mixR = new Float32Array(N);
for (const k of Object.keys(B) as (keyof typeof B)[]) {
  const g = GAINS[k];
  for (let i = 0; i < N; i++) {
    mixL[i] += B[k].L[i] * g;
    mixR[i] += B[k].R[i] * g;
  }
}
const wet = reverb(verb);
for (let i = 0; i < N; i++) {
  mixL[i] += wet.L[i] * 0.9;
  mixR[i] += wet.R[i] * 0.9;
}

// Gentle glue compression.
{
  let env = 0;
  const att = Math.exp(-1 / (0.006 * SR));
  const rel = Math.exp(-1 / (0.15 * SR));
  const thr = 0.25;
  for (let i = 0; i < N; i++) {
    const p = Math.max(Math.abs(mixL[i]), Math.abs(mixR[i]));
    env = p > env ? att * env + (1 - att) * p : rel * env + (1 - rel) * p;
    const g = env > thr ? Math.pow(env / thr, 1 / 2.2 - 1) : 1;
    mixL[i] *= g;
    mixR[i] *= g;
  }
}

// Fold the tail (25..27 s) onto the start so the end bell rings through the loop point.
const LN = Math.round(LEN * SR);
const outL = mixL.slice(0, LN);
const outR = mixR.slice(0, LN);
for (let i = LN; i < N; i++) {
  outL[i - LN] += mixL[i];
  outR[i - LN] += mixR[i];
}
// Total silence before the drop.
for (let i = Math.round(SIL0 * SR); i < Math.round(SIL1 * SR); i++) {
  outL[i] = 0;
  outR[i] = 0;
}

// ---------- mastering: BS.1770 loudness + true-peak limiter ----------
function biquad(x: Float32Array, b0: number, b1: number, b2: number, a1: number, a2: number): Float32Array {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = v;
    y[i] = v;
  }
  return y;
}
function kWeight(x: Float32Array): Float32Array {
  let K = Math.tan((Math.PI * 1681.974450955533) / SR);
  const Q = 0.7071752369554196;
  const Vh = Math.pow(10, 3.999843853973347 / 20);
  const Vb = Math.pow(Vh, 0.4996667741545416);
  let a0 = 1 + K / Q + K * K;
  const s1 = biquad(x, (Vh + (Vb * K) / Q + K * K) / a0, (2 * (K * K - Vh)) / a0, (Vh - (Vb * K) / Q + K * K) / a0, (2 * (K * K - 1)) / a0, (1 - K / Q + K * K) / a0);
  K = Math.tan((Math.PI * 38.13547087602444) / SR);
  const Q2 = 0.5003270373238773;
  a0 = 1 + K / Q2 + K * K;
  return biquad(s1, 1, -2, 1, (2 * (K * K - 1)) / a0, (1 - K / Q2 + K * K) / a0);
}
function lufs(L: Float32Array, R: Float32Array): number {
  const kl = kWeight(L);
  const kr = kWeight(R);
  const blk = Math.round(0.4 * SR);
  const hop = Math.round(0.1 * SR);
  const z: number[] = [];
  for (let st = 0; st + blk <= kl.length; st += hop) {
    let acc = 0;
    for (let i = st; i < st + blk; i++) acc += kl[i] * kl[i] + kr[i] * kr[i];
    z.push(acc / blk);
  }
  const lk = (v: number) => -0.691 + 10 * Math.log10(v);
  const avg = (a: number[]) => a.reduce((p, c) => p + c, 0) / a.length;
  const abs = z.filter((v) => lk(v) > -70);
  const rel = lk(avg(abs)) - 10;
  return lk(avg(abs.filter((v) => lk(v) > rel)));
}
function truePeakDb(L: Float32Array, R: Float32Array): number {
  const taps = 12;
  const os = 4;
  const h: number[][] = [];
  for (let p = 0; p < os; p++) {
    const row: number[] = [];
    for (let j = -taps; j <= taps; j++) {
      const x = j - p / os;
      const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
      const w = 0.5 + 0.5 * Math.cos((Math.PI * x) / (taps + 1));
      row.push(sinc * w);
    }
    h.push(row);
  }
  let peak = 0;
  for (const x of [L, R]) {
    for (let n = taps; n < x.length - taps; n++) {
      for (let p = 0; p < os; p++) {
        let y = 0;
        const row = h[p];
        for (let j = -taps; j <= taps; j++) y += x[n + j] * row[j + taps];
        const a = Math.abs(y);
        if (a > peak) peak = a;
      }
    }
  }
  return 20 * Math.log10(peak);
}
function limit(L: Float32Array, R: Float32Array, ceil: number): [Float32Array, Float32Array] {
  const n = L.length;
  const la = Math.round(0.004 * SR);
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    need[i] = p > ceil ? ceil / p : 1;
  }
  // sliding minimum over the lookahead window
  const hmin = new Float32Array(n);
  const dq: number[] = [];
  let head = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (dq.length > head && need[dq[dq.length - 1]] >= need[i]) dq.pop();
    dq.push(i);
    while (dq[head] > i + la) head++;
    hmin[i] = need[dq[head]];
  }
  // smooth attack (moving average over the lookahead) + exponential release
  const rel = 1 - Math.exp(-1 / (0.09 * SR));
  const oL = new Float32Array(n);
  const oR = new Float32Array(n);
  let acc = la; // window starts filled with unity gain
  let g = 1;
  for (let i = 0; i < n; i++) {
    acc += hmin[i] - (i >= la ? hmin[i - la] : 1);
    const a = Math.min(hmin[i], acc / la);
    g = Math.min(a, g + (1 - g) * rel);
    oL[i] = L[i] * g;
    oR[i] = R[i] * g;
  }
  return [oL, oR];
}

const TARGET = -14;
let gain = Math.pow(10, (TARGET - lufs(outL, outR)) / 20);
let ceilDb = -1.4;
let fin: [Float32Array, Float32Array] = [outL, outR];
let measured = 0;
let tp = 0;
for (let it = 0; it < 6; it++) {
  const gl = outL.map((v) => v * gain);
  const gr = outR.map((v) => v * gain);
  fin = limit(gl, gr, Math.pow(10, ceilDb / 20));
  measured = lufs(fin[0], fin[1]);
  tp = truePeakDb(fin[0], fin[1]);
  if (Math.abs(measured - TARGET) < 0.05 && tp < -1.05) break;
  gain *= Math.pow(10, (TARGET - measured) / 20);
  if (tp >= -1.05) ceilDb -= tp + 1.15;
}

// ---------- write WAV ----------
const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(here, '../../public/opus/music.wav');
{
  const n = fin[0].length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(fin[0][i] * 32767))), 44 + i * 4);
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(fin[1][i] * 32767))), 46 + i * 4);
  }
  fs.mkdirSync(path.dirname(outPath), {recursive: true});
  fs.writeFileSync(outPath, buf);
}
console.log(`wrote ${outPath}  integrated ${measured.toFixed(2)} LUFS, true peak ${tp.toFixed(2)} dBTP (internal meter)`);

// ---------- sync self-check: audio events land where the timeline says (+-1 frame) ----------
{
  const FR = 1 / T.FPS;
  const hop = Math.round(0.002 * SR); // 2 ms analysis frames
  const energy = (L: Float32Array, R: Float32Array) => {
    const e = new Float64Array(Math.floor(L.length / hop));
    for (let k = 0; k < e.length; k++) {
      let a = 0;
      for (let i = k * hop; i < (k + 1) * hop; i++) a += L[i] * L[i] + R[i] * R[i];
      e[k] = a / hop + 1e-12;
    }
    return e;
  };
  // onset = first 2 ms frame within +-60 ms of `t` whose energy jumps >= 9 dB over the preceding 20 ms
  const onset = (e: Float64Array, t: number) => {
    const c = Math.round((t * SR) / hop);
    const w = Math.round((0.06 * SR) / hop);
    for (let k = c - w; k <= c + w; k++) {
      let prev = 0;
      for (let j = k - 11; j < k - 1; j++) prev += e[j];
      prev /= 10;
      if (e[k] / prev >= 8) return (k * hop) / SR;
    }
    return NaN;
  };
  const mix = energy(fin[0], fin[1]);
  const pl = energy(B.pluck.L.subarray(0, LN), B.pluck.R.subarray(0, LN));
  const near = (got: number, want: number, what: string) => {
    assert.ok(Math.abs(got - want) <= FR, `${what}: expected ${want.toFixed(3)} s, got ${got.toFixed(3)} s`);
    console.log(`  ok  ${what.padEnd(26)} want ${want.toFixed(3)}  got ${got.toFixed(3)}`);
  };
  near(onset(mix, s(T.IMPACT)), s(T.IMPACT), 'impact (bass + bell)');
  T.LETTER_LAND.forEach((f, i) => near(onset(pl, s(f)), s(f), `bounce ${i + 1} hook note`));
  // silence: last audible sample before the drop, first sample of the drop
  const thr = Math.pow(10, -60 / 20);
  let last = Math.round(s(T.DROP) * SR) - 1;
  while (last > 0 && Math.max(Math.abs(fin[0][last]), Math.abs(fin[1][last])) < thr) last--;
  let first = last + 1;
  while (first < LN && fin[0][first] === 0 && fin[1][first] === 0) first++;
  near(last / SR, SIL0, 'silence starts');
  near(first / SR, SIL1, 'drop impact');
  const quiet = Math.max(...Array.from(fin[0].subarray(Math.round((SIL0 + FR) * SR), Math.round((SIL1 - 0.001) * SR))).map(Math.abs));
  assert.equal(quiet, 0, 'gap before the drop must be digital silence');
  near(onset(mix, s(T.DROP)), s(T.DROP), 'drop onset');
  console.log('sync check passed');
}
