// World 6 · SOUND LAB (sage) — "the music is the image".
// Bar 1   the package bursts open (hit) and a glass arpeggio pours out over a D minor sine pad; the "recording" hums.
// Bars 2–4 SPECTRAL SYNTH: 22 sine partials on the D minor (= F major) pentatonic from A4 to C9 are gated by the
//         letters M-O-N-T-A-G-E, rasterised from a small geometric SDF font (x = time, y = log frequency), one letter
//         per half-note triplet. The spectrogram of this audio spells the word; scripts/mpw/worlds/sound-spectro.ts
//         computes it from the rendered samples. A 60 Hz hum + clicks ride on top until AUDIO REPAIR (impact, f420).
// Bars 5–9 a clean groove (Dm9 · Bbmaj7 · Fmaj9 · Csus2 · Dm → F) with one audible gesture per tool beat; the exit
//         condenses broadband noise into three pure lines (an F major triad: the RGB band into Picture Lab).
import type {SynthCtx} from '../types.ts';
import * as D from '../../mkv/dsp.ts';
import {mulberry32} from '../../../src/mpw/timing.ts';
import {CLICKS, EVENTS, G, LETTER_F, LETTER_LEN, ONSETS, T, TOOLS, WORD, WORD_END} from '../../../src/mpw/worlds/sound/timing.ts';

const {TAU, SR, mtof} = D;
type Out = D.Out;
const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// ---------------------------------------------------------------- the font ----
// Design box in hero-view pixels: one letter = 32 f × 4.5 px/f wide, the text band (A4 → C9, 4.25 oct) tall.
export const LW = 144;
export const LH = 304;
const S = 42; // stroke
export const ROWS = [69, 72, 74, 77, 79, 81, 84, 86, 89, 91, 93, 96, 98, 101, 103, 105, 108, 110, 113, 115, 117, 120];
export const rowY = (m: number) => ((m - ROWS[0]) / (ROWS[ROWS.length - 1] - ROWS[0])) * LH;

const box = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) => {
  const dx = Math.abs(x - (x0 + x1) / 2) - (x1 - x0) / 2;
  const dy = Math.abs(y - (y0 + y1) / 2) - (y1 - y0) / 2;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
};
const seg = (x: number, y: number, ax: number, ay: number, bx: number, by: number, r: number) => {
  const px = x - ax;
  const py = y - ay;
  const ex = bx - ax;
  const ey = by - ay;
  const h = cl((px * ex + py * ey) / (ex * ex + ey * ey));
  return Math.hypot(px - ex * h, py - ey * h) - r;
};
// rounded box inset from the letter box
const rbox = (x: number, y: number, inset: number, r: number) => {
  const dx = Math.abs(x - LW / 2) - (LW / 2 - inset - r);
  const dy = Math.abs(y - LH / 2) - (LH / 2 - inset - r);
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
};
const R = 58;
const frame = (x: number, y: number) => box(x, y, 0, 0, LW, LH);
// signed distance (px, negative inside) of each glyph
export const GLYPH: Record<string, (x: number, y: number) => number> = {
  M: (x, y) =>
    Math.max(
      Math.min(box(x, y, 0, 0, S, LH), box(x, y, LW - S, 0, LW, LH), seg(x, y, S * 0.5, LH - S * 0.3, LW / 2, LH * 0.34, S * 0.5), seg(x, y, LW - S * 0.5, LH - S * 0.3, LW / 2, LH * 0.34, S * 0.5)),
      frame(x, y),
    ),
  O: (x, y) => Math.max(rbox(x, y, 0, R), -rbox(x, y, S, R - S * 0.7)),
  N: (x, y) => Math.max(Math.min(box(x, y, 0, 0, S, LH), box(x, y, LW - S, 0, LW, LH), seg(x, y, S * 0.45, LH - S * 0.2, LW - S * 0.45, S * 0.2, S * 0.52)), frame(x, y)),
  T: (x, y) => Math.min(box(x, y, 0, LH - S, LW, LH), box(x, y, LW / 2 - S / 2, 0, LW / 2 + S / 2, LH)),
  A: (x, y) =>
    Math.max(
      Math.min(seg(x, y, S * 0.5, -S, LW / 2, LH, S * 0.52), seg(x, y, LW - S * 0.5, -S, LW / 2, LH, S * 0.52), box(x, y, LW * 0.2, LH * 0.22, LW * 0.8, LH * 0.22 + S * 0.9)),
      frame(x, y),
    ),
  G: (x, y) =>
    Math.min(
      Math.max(rbox(x, y, 0, R), -rbox(x, y, S, R - S * 0.7), -box(x, y, LW * 0.5, LH * 0.5, LW + 2, LH * 0.76)),
      box(x, y, LW * 0.46, LH * 0.5 - S, LW, LH * 0.5),
    ),
  E: (x, y) => Math.min(box(x, y, 0, 0, S, LH), box(x, y, 0, LH - S, LW, LH), box(x, y, 0, LH / 2 - S / 2, LW * 0.84, LH / 2 + S / 2), box(x, y, 0, 0, LW, S)),
};
const EDGE = 4.5; // px of anti-aliasing (≈ 17 ms in time) keeps every partial click-free
export const coverage = (d: number) => cl(0.5 - d / EDGE);
// Glyph coverage of the word at a local frame (fractional) and a frequency row: 0 outside every letter.
export function wordCoverage(f: number, y: number) {
  for (let i = 0; i < WORD.length; i++) {
    if (f < LETTER_F[i] - 3 || f > LETTER_F[i] + LETTER_LEN + 3) continue;
    return coverage(GLYPH[WORD[i]](((f - LETTER_F[i]) / LETTER_LEN) * LW, y));
  }
  return 0;
}

// ---------------------------------------------------------------- helpers ----
type Local = {bed: Out; fx: Out; dmg: Out; i0: number; n: number; s: (f: number) => number; ctx: SynthCtx};
function local(ctx: SynthCtx, tail = 0.8): Local {
  const i0 = Math.max(0, Math.floor(ctx.at(-15)));
  const n = Math.min(ctx.L.length, Math.ceil(ctx.at(ctx.length + 15) + tail * ctx.SR)) - i0;
  return {bed: D.makeOut(n), fx: D.makeOut(n), dmg: D.makeOut(n), i0, n, s: (f) => ctx.at(f) - i0, ctx};
}
// cut the bed `depthDb` in the `pre` seconds before each onset (clean transients)
function duck(o: Out, at: number[], depthDb = -16, pre = 0.065) {
  const g = new Float32Array(o.L.length).fill(1);
  const d = 10 ** (depthDb / 20);
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
// Loudness + ceiling are computed from the ORIGINAL mix (with the damage) in both renders, so the processed render
// is exactly the original minus the hum and clicks.
function finish(W: Local, clean: boolean, target = -16, ceilDb = -6.3) {
  const {bed, fx, dmg, n, ctx, i0} = W;
  const g8 = 10 ** (-8 / 20);
  const hL = new Float64Array(n);
  const hR = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    hL[i] = bed.L[i] + fx.L[i] + dmg.L[i] + g8 * (bed.sendL[i] + fx.sendL[i]);
    hR[i] = bed.R[i] + fx.R[i] + dmg.R[i] + g8 * (bed.sendR[i] + fx.sendR[i]);
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
    const loud = D.lufsRange(D.kPrefix(hL.map((v, i) => v * curve[i])), D.kPrefix(hR.map((v, i) => v * curve[i])), a, b);
    if (Math.abs(loud - target) < 0.05) break;
    gain *= 10 ** ((target - loud) / 20);
    curve = D.limit(ones, ones, env, gain, ceilDb)[0];
  }
  const k = clean ? 0 : 1;
  for (let i = 0; i < n; i++) {
    const j = i0 + i;
    if (j >= ctx.L.length) break;
    ctx.L[j] += (bed.L[i] + fx.L[i] + k * dmg.L[i]) * curve[i];
    ctx.R[j] += (bed.R[i] + fx.R[i] + k * dmg.R[i]) * curve[i];
    ctx.sendL[j] += (bed.sendL[i] + fx.sendL[i]) * curve[i];
    ctx.sendR[j] += (bed.sendR[i] + fx.sendR[i]) * curve[i];
  }
}

// ---------------------------------------------------------------- instruments ----
// soft sine pad: two detuned sines per note with a slow vibrato (fuzzy lines, unlike the razor-thin hum)
function sinePad(o: Out, s0: number, dur: number, notes: number[], vol: number, opt: {att?: number; rel?: number; send?: number} = {}) {
  const att = opt.att ?? 0.3;
  const rel = opt.rel ?? 0.6;
  notes.forEach((m, j) => {
    const f = mtof(m);
    const vr = 4.3 + 0.41 * j;
    let ph = 0.17 * j;
    D.put(o, s0, dur + rel, cl((j % 2 ? 1 : -1) * (0.2 + 0.12 * j), -0.9, 0.9), opt.send ?? 0.35, (t) => {
      ph = (ph + (f * (1 + 0.004 * Math.sin(TAU * vr * t))) / SR) % 1;
      const e = t < att ? Math.sin(((t / att) * Math.PI) / 2) : t > dur ? Math.max(0, 1 - (t - dur) / rel) : 1;
      return ((2 * vol * e) / notes.length) * (Math.sin(TAU * ph) + (2 * f < 400 ? 0.2 * Math.sin(2 * TAU * ph) : 0));
    });
  });
}
// low-only pulse (no click): keeps the word region of the spectrogram clean
function softKick(o: Out, s: number, vol: number) {
  let ph = 0;
  D.put(o, s, 0.42, 0, 0, (t) => {
    ph += (TAU * (44 + 64 * Math.exp(-t / 0.035))) / SR;
    return vol * Math.sin(ph) * Math.min(1, t * 700) * Math.exp(-t / 0.17);
  });
}
// pure sine mallet below the text band (the letter onsets)
function mallet(o: Out, s: number, m: number, vol: number, pan = 0) {
  const f = mtof(m);
  D.put(o, s, 1.1, pan, 0.45, (t) => vol * Math.min(1, t * 450) * Math.exp(-t / 0.3) * Math.sin(TAU * f * t));
}
function uiTick(o: Out, s: number, vol: number, pan = 0) {
  D.put(o, s, 0.06, pan, 0.1, (t, r) => vol * (Math.sin(TAU * 2900 * t) * Math.exp(-t / 0.012) + (t < 0.0012 ? 0.9 * (r() * 2 - 1) : 0)));
}
function wood(o: Out, s: number, vol: number, pan = 0) {
  D.put(o, s, 0.12, pan, 0.15, (t, r) => vol * Math.min(1, t * 6000) * ((Math.sin(TAU * 1650 * t) + 0.5 * Math.sin(TAU * 2870 * t)) * Math.exp(-t / 0.035) + (t < 0.0015 ? r() * 2 - 1 : 0)));
}
// odd-harmonic tone: a half-period delay is the same as a polarity flip, so the two "mics" cancel exactly
function oddTone(o: Out, s0: number, dur: number, m: number, vol: number, gain: (t: number) => number, pan = 0) {
  const f = mtof(m);
  D.put(o, s0, dur, pan, 0.2, (t) => {
    let y = 0;
    for (const k of [1, 3, 5, 7, 9]) y += Math.sin(TAU * f * k * t) / k;
    return vol * gain(t) * y * Math.min(1, t * 300) * Math.min(1, (dur - t) * 60);
  });
}
// saw chord through a time-varying low-pass + presence shelf
function sawChord(o: Out, s0: number, dur: number, notes: number[], vol: number, cut: (t: number) => number, shelf: (t: number) => number, amp: (t: number) => number, send = 0.25) {
  notes.forEach((m, j) => {
    for (const c of [-6, 6]) {
      const f = mtof(m) * 2 ** (c / 1200);
      const dt = f / SR;
      let ph = (0.31 * j + (c > 0 ? 0.5 : 0)) % 1;
      const lp = new D.BQ();
      const sh = new D.BQ();
      D.put(o, s0, dur, cl((j / (notes.length - 1)) * 1.2 - 0.6 + c * 0.03, -0.9, 0.9), send, (t) => {
        ph += dt;
        if (ph >= 1) ph -= 1;
        if ((Math.round(t * SR) & 31) === 0) {
          lp.set(0, cut(t), 0.9);
          sh.shelf(true, 2800, shelf(t));
        }
        const e = Math.min(1, t / 0.01) * Math.min(1, (dur - t) / 0.05);
        return (vol * e * amp(t) * sh.run(lp.run(2 * ph - 1))) / notes.length / 2;
      });
    }
  });
}
// formant "voice" lead (no vocals: a buzzing source through two moving band-passes)
const VOWELS = [
  [730, 1090],
  [530, 1840],
  [300, 2290],
  [570, 840],
];
function formantLead(o: Out, s0: number, notes: number[], step: number, vol: number, muddy: boolean) {
  notes.forEach((m, j) => {
    const f = mtof(m);
    const [f1, f2] = VOWELS[j % VOWELS.length];
    const b1 = new D.BQ().set(2, f1, 5);
    const b2 = new D.BQ().set(2, f2, 7);
    const lp = new D.BQ().set(0, muddy ? 700 : 9000, 0.7);
    const hp = new D.BQ().set(1, muddy ? 60 : 160, 0.7);
    let ph = 0;
    const dur = step * 0.92;
    D.put(o, s0 + j * step * SR, dur + (muddy ? 0.25 : 0.04), (j % 2 ? 0.15 : -0.15), muddy ? 0.9 : 0.08, (t, r) => {
      ph = (ph + (f * (1 + 0.01 * Math.sin(TAU * 5.5 * t))) / SR) % 1;
      const src = 2 * ph - 1;
      const e = Math.min(1, t / 0.012) * (t > dur ? Math.max(0, 1 - (t - dur) / (muddy ? 0.25 : 0.04)) : 1);
      const v = 2.2 * b1.run(src) + 1.6 * b2.run(src) + 0.15 * src + (muddy ? 0.35 * (r() * 2 - 1) : 0);
      return vol * e * lp.run(hp.run(v));
    });
  });
}

// ---------------------------------------------------------------- the word ----
// For every frequency row a sine partial whose amplitude follows the glyph coverage (control rate 32 samples).
function word(o: Out, s: (f: number) => number, vol: number) {
  const rnd = mulberry32(606);
  const P = ROWS.map((m, k) => ({
    f: mtof(m),
    y: rowY(m),
    tilt: (mtof(m) / 440) ** -0.5, // −3 dB/oct: glassy, never piercing (the display adds the slope back)
    ph: rnd(),
    vr: 4 + 2.5 * rnd(),
    vp: rnd() * TAU,
    g: D.panG((k % 2 ? 1 : -1) * (0.2 + 0.4 * rnd())),
  }));
  const CR = 32;
  const a = Math.ceil(s(LETTER_F[0] - 4));
  const b = Math.floor(s(WORD_END + 4));
  const nc = Math.ceil((b - a) / CR) + 2;
  const amp = P.map(() => new Float32Array(nc));
  const fOf = (i: number) => ((i / SR) * 60) - (s(0) / SR) * 60; // sample → local frame
  for (let c = 0; c < nc; c++) {
    const f = fOf(a + c * CR);
    let e = 0;
    P.forEach((p, k) => {
      const v = wordCoverage(f, p.y) * p.tilt;
      amp[k][c] = v;
      e += v * v;
    });
    const g = 1 / Math.sqrt(Math.max(3, e));
    for (let k = 0; k < P.length; k++) amp[k][c] *= g;
  }
  for (let i = a; i < b && i < o.L.length; i++) {
    const c = (i - a) / CR;
    const c0 = Math.floor(c);
    const fr = c - c0;
    const t = i / SR;
    let l = 0;
    let r = 0;
    for (let k = 0; k < P.length; k++) {
      const p = P[k];
      p.ph = (p.ph + (p.f * (1 + 0.005 * Math.sin(TAU * p.vr * t + p.vp))) / SR) % 1;
      const A = amp[k][c0] + (amp[k][c0 + 1] - amp[k][c0]) * fr;
      if (A < 1e-6) continue;
      const v = A * Math.sin(TAU * p.ph);
      l += v * p.g[0];
      r += v * p.g[1];
    }
    if (i < 0) continue;
    o.L[i] += vol * l;
    o.R[i] += vol * r;
    o.sendL[i] += vol * l * 0.22;
    o.sendR[i] += vol * r * 0.22;
  }
}

// ---------------------------------------------------------------- damage (AUDIO REPAIR removes it) ----
const HUM = [0.3, 0.9, 0.8, 0.6, 0.48, 0.34, 0.24]; // 60 Hz series (weak fundamental: it would beat with the sub)
function damage(o: Out, s: (f: number) => number) {
  const a = s(T.hum);
  const tb = (s(T.repair) - a) / SR;
  D.put(o, a, tb, 0, 0, (t) => {
    const e = Math.min(1, t / 0.8) * cl((tb - t) / 0.003);
    let y = 0;
    for (let k = 0; k < HUM.length; k++) y += HUM[k] * Math.sin(TAU * 60 * (k + 1) * t + k * 0.7);
    return 0.034 * e * y;
  });
  const r = mulberry32(4206);
  for (const f of CLICKS) {
    const amp = 0.55 + 0.45 * r();
    const sg = r() < 0.5 ? -1 : 1;
    D.put(o, s(f), 0.004, (r() - 0.5) * 0.8, 0, (t, rr) => 0.3 * amp * sg * Math.exp(-t / 0.0003) * (t < 0.00006 ? 1 : 0.7 * (rr() * 2 - 1)));
  }
}

// ---------------------------------------------------------------- render ----
const CH = {
  dm9: {bass: 38, keys: [57, 60, 64, 65]},
  bb: {bass: 34, keys: [57, 62, 65, 69]},
  f9: {bass: 41, keys: [57, 60, 64, 67]},
  c: {bass: 36, keys: [55, 60, 62, 67]},
  dm: {bass: 38, keys: [57, 62, 65, 69]},
};
const BARS = [CH.dm9, CH.bb, CH.f9, CH.c, CH.dm]; // bars 5..9 (f480 + 120 k)
const DROP = [
  [600, G.align],
  [G.flip, G.unflip],
]; // the groove drops out while the two mics cancel

export function synth(ctx: SynthCtx, opt: {clean?: boolean} = {}) {
  const W = local(ctx);
  const {bed, fx, dmg, s} = W;
  const sec = (fa: number, fb: number) => (fb - fa) / 60;

  // ---- bar 1: entrance (lid bursts open at f0) + title over a Dm sine pad ----
  D.hit(fx, s(0), 0.32);
  D.sub(fx, s(0), 38, 1.6, 0.34);
  [108, 105, 103, 101, 98, 96, 93, 91, 89, 86, 84, 81].forEach((m, k) => D.bell(fx, s(2 + k * 3.75), m, 0.05 * (1 - k * 0.04), 0.9, ((k % 3) - 1) * 0.5, 2.0, 0.6, 0.5));
  sinePad(bed, s(-6), sec(-6, 92), [50, 53, 57], 0.16, {att: 0.6, rel: 0.3});
  softKick(bed, s(60), 0.32);

  // ---- bars 2–4: the spectral synth writes MONTAGE ----
  // The chord IS the word (pentatonic glass above 440 Hz); below it only a sub line and mallet notes, so the
  // 100–420 Hz window shows nothing but the hum ladder until AUDIO REPAIR clears it.
  word(fx, s, 0.2);
  const melody = [50, 53, 45, 48, 53, 52, 50];
  LETTER_F.forEach((f, i) => mallet(fx, s(f), melody[i], 0.12, ((i % 3) - 1) * 0.35));
  for (const [f, m] of [
    [120, 38],
    [240, 41],
    [360, 34],
  ])
    D.sub(bed, s(f), m, 1.95, 0.16);
  for (const f of [120, 240, 360]) softKick(bed, s(f), 0.26);
  sinePad(bed, s(T.repair + 4), sec(T.repair + 4, 480), [46, 50, 53, 57], 0.12, {att: 0.5, rel: 0.4});

  // ---- f420 AUDIO REPAIR: impact; hum + clicks stop (the damage bus ends here) ----
  damage(dmg, s);
  D.boom(fx, s(T.repair), 0.22, 2.4);
  D.thump(fx, s(T.repair), 0.3);
  D.sub(fx, s(T.repair), 34, 1.0, 0.25);
  D.riser(fx, s(458), s(480), 0.045, 500, 5000);

  // ---- bars 5–9: the groove ----
  const dropped = (f: number) => DROP.some(([a, b]) => f >= a && f < b);
  for (let bar = 0; bar < 5; bar++) {
    const f0 = 480 + bar * 120;
    const ch = BARS[bar];
    for (let b = 0; b < 4; b++) {
      const fb = f0 + b * 30;
      if (fb >= T.exit) break;
      D.kick(bed, s(fb), 0.4);
      if ((b === 1 || b === 3) && !dropped(fb)) D.clap(bed, s(fb), 0.2, 0.1);
      for (const h of [7.5, 15, 22.5]) if (!dropped(fb + h)) D.hat(bed, s(fb + h), h === 15 ? 0.09 : 0.045, h === 15 && b === 3, h === 15 ? 0.25 : -0.25);
      for (const h of [0, 15]) if (!dropped(fb + h)) D.bassPulse(bed, s(fb + h), ch.bass + (h ? 12 : 0), 0.22, 0.2);
    }
    if (bar > 0 && bar < 4 && !dropped(f0)) D.rhodesChord(bed, s(f0), ch.keys, 1.7, 0.1, 0.3);
  }

  // tool ticks (each card cuts in on its beat)
  for (const t of TOOLS) uiTick(fx, s(t.f), 0.09);

  // DIALOGUE MIXER: a dull, uneven Dm9 voice-chord; at G.presence the tone curve + compressor engage
  const tp = sec(480, G.presence);
  sawChord(
    fx,
    s(480),
    sec(480, 540) + 0.1,
    [50, 57, 60, 64, 65],
    0.42,
    (t) => (t < tp ? 520 : 520 + 4800 * (1 - Math.exp(-(t - tp) / 0.02))),
    (t) => (t < tp ? -3 : 7),
    (t) => (t < tp ? 0.75 + 0.35 * Math.sin(TAU * 7 * t) : 0.95),
  );
  uiTick(fx, s(G.presence), 0.08, 0.3);

  // DIALOGUE NOISE: a broadband floor under a soft line; it drops at G.noiseOff
  {
    const lp = new D.BQ().set(0, 9000, 0.7);
    const hp = new D.BQ().set(1, 150, 0.7);
    const d = sec(540, G.noiseOff);
    D.put(bed, s(540), d + 0.01, 0, 0.1, (t, r) => 0.16 * Math.min(1, t / 0.03) * Math.min(1, (d - t) / 0.01) * lp.run(hp.run(r() * 2 - 1)));
  }
  formantLead(fx, s(540), [62, 65, 69, 65, 62, 60, 62, 65], 0.125, 0.11, false);
  D.hit(fx, s(G.noiseOff), 0.3);

  // MICROPHONE ALIGNMENT: two copies of one odd-harmonic tone. Half a period apart they cancel (flat line);
  // aligned they double; polarity inverted they cancel again; corrected they double.
  const ga = (f: number) => (f < G.align ? 0.03 : f < G.flip ? 1 : f < G.unflip ? 0.03 : 1);
  oddTone(fx, s(600), sec(600, 690) + 0.05, 62, 0.11, (t) => 2 * ga(600 + t * 60), -0.1);
  oddTone(fx, s(600), sec(600, 690) + 0.05, 69, 0.06, (t) => 2 * ga(600 + t * 60), 0.2);
  D.hit(fx, s(G.align), 0.3);
  uiTick(fx, s(G.flip), 0.1, -0.3);
  D.hit(fx, s(G.unflip), 0.24);

  // ROOM REDUCTION: a stab with echo trails, then the same stab dry
  [0, 7.5, 15, 22.5].forEach((d, k) => D.rhodesChord(fx, s(690 + d), CH.bb.keys.map((m) => m + 12), 0.1, 0.16 * 0.55 ** k, 0.9));
  D.rhodesChord(fx, s(G.dry), CH.f9.keys.map((m) => m + 12), 0.22, 0.17, 0);
  D.hit(fx, s(G.dry), 0.26);

  // DIALOGUE LEVELER: a 16th riff jumping in level, then even under the ceiling
  const riff = [65, 69, 72, 74, 72, 69, 67, 65, 65, 69, 72, 74, 72, 69, 67, 65];
  const lv = [1, 0.18, 0.8, 0.3, 1.25, 0.15, 0.95, 0.32];
  riff.forEach((m, k) => {
    const f = 750 + k * 3.75 * 2;
    D.pluck(fx, s(f), m, f < G.level ? 0.2 * lv[k % 8] : 0.17, (k % 2 ? 0.25 : -0.25), 0.2, 0.6, 0.993);
  });
  D.hit(fx, s(G.level), 0.26);

  // LOUDNESS DELIVERY: pass 1 measures a quiet mix, pass 2 normalises, the meter lands on Target
  for (let f = 810; f < G.pass2; f += 7.5) D.put(fx, s(f), 0.03, 0.4, 0, (t) => 0.035 * Math.sin(TAU * 3400 * t) * Math.exp(-t / 0.008));
  uiTick(fx, s(G.pass2), 0.09);
  D.riser(fx, s(G.pass2), s(G.target), 0.1, 300, 8000);
  D.boom(fx, s(G.target), 0.26, 2.2);
  D.thump(fx, s(G.target), 0.28);
  D.rhodesChord(fx, s(G.target), CH.c.keys, 1.0, 0.1, 0.4);

  // BEAT MARKERS: onset candidates the markers rain onto
  ONSETS.forEach((f, k) => wood(fx, s(f), 0.16 + (k === 0 ? 0.05 : 0), ((k % 3) - 1) * 0.4));

  // SPEECH CLEANUP: a muddy, noisy formant line; at G.clean the same line, clear and dry
  formantLead(fx, s(960), [50, 53, 57, 53], 0.125, 0.1, true);
  formantLead(fx, s(G.clean), [57, 60, 62, 65], 0.125, 0.1, false);
  D.hit(fx, s(G.clean), 0.26);

  // EXIT: broadband noise condenses into three pure lines (F major: the RGB band), whoosh into Picture Lab
  uiTick(fx, s(T.exit), 0.08);
  {
    const tri = [77, 81, 84];
    const dur = sec(T.exit, 1092);
    tri.forEach((m, k) => {
      const bp = new D.BQ();
      const f = mtof(m);
      D.put(fx, s(T.exit), dur, (k - 1) * 0.5, 0.5, (t, r) => {
        const u = cl(t / sec(T.exit, 1066));
        if ((Math.round(t * SR) & 31) === 0) bp.set(2, f, 0.8 + 60 * u * u);
        const e = Math.min(1, t / 0.4) * Math.min(1, (dur - t) / 0.2);
        return e * (0.11 * (1 - u) * bp.run(r() * 2 - 1) * 3 + 0.05 * u * u * Math.sin(TAU * f * t));
      });
    });
    sinePad(bed, s(T.exit), sec(T.exit, 1080), [41, 53, 57, 60], 0.14, {att: 0.2, rel: 0.4});
  }
  for (const e of EVENTS.filter((e) => e.kind === 'whoosh')) D.whoosh(fx, s(e.f), 0.12, 0.4, 0.22);

  // ---- bed automation: the loudness beat's quiet first pass, then the second pass lifts it to Target ----
  {
    const a = Math.round(s(810));
    const b = Math.round(s(G.target));
    const m = Math.round(s(G.pass2));
    const q = 10 ** (-9 / 20);
    for (const k of ['L', 'R', 'sendL', 'sendR'] as const)
      for (let i = a; i < b; i++) bed[k][i] *= i < m ? q + (1 - q) * Math.max(0, 1 - (i - a) / (0.006 * SR)) : q + (0.6 - q) * ((i - m) / (b - m));
  }

  duck(bed, EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').map((e) => s(e.f)));
  finish(W, !!opt.clean);
}

export default function render(ctx: SynthCtx) {
  synth(ctx);
}
