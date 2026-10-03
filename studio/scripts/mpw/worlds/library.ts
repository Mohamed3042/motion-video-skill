// World 8 · Library — sound. Minimal glitch / data in D minor, 120 BPM (bar 1 downbeat = local frame 0).
// A thin bed of data clicks, a short kick, sub pulses and a filtered pad (Dm9 | Bbmaj9 | Fmaj9 | C6/9 …); search
// keystrokes as bright ticks, a whoosh into the jump-to-source, a shutter tick on each picture of the flicker
// paradigm (the bed drops to a drone so you can concentrate), the QC alert ping, a zoetrope whirr that climbs with
// the drum's speed and locks into a flutter at sync, real bi-phase LTC (the timecode literally sounds like itself),
// and the alignment impact. Also exports the small kit Edit Room's script reuses.
import type {SynthCtx} from '../types.ts';
import {BQ, clap, hat, kick, kPrefix, limit, lufsRange, makeOut, mtof, pad, peakEnv, put, SR, TAU, thump, whoosh, type Out} from '../../mkv/dsp.ts';
import {mulberry32} from '../../../src/mpw/timing.ts';
import {EVENTS, T} from '../../../src/mpw/worlds/library/timing.ts';

// ---------- kit (shared with editroom.ts) ----------
// A world-local bus: Out arrays covering [at(-15), at(length + 45)); S(f) = local sample index of world frame f.
export type Bus = Out & {ctx: SynthCtx; i0: number; n: number; S: (f: number) => number};
export const bus = (ctx: SynthCtx): Bus => {
  const i0 = Math.max(0, Math.floor(ctx.at(-15)));
  const n = Math.min(ctx.L.length, Math.ceil(ctx.at(ctx.length + 45))) - i0;
  return {...makeOut(n), ctx, i0, n, S: (f: number) => ctx.at(f) - i0};
};

// Clear the bed before an impact/hit: everything already on the bus dips to `floor` over the `pre` seconds before
// frame f (send dips over a longer window so reverb input is quiet too), snapping back exactly on f.
export function duck(b: Bus, f: number, floor = 0.08, pre = 0.065) {
  const e = Math.round(b.S(f));
  const fade = Math.round(0.01 * SR);
  const dip = (arr: Float64Array, a: number) => {
    for (let j = Math.max(0, a); j < Math.min(b.n, e); j++) {
      const g = j < a + fade ? 1 - (1 - floor) * ((j - a) / fade) : floor;
      arr[j] *= g;
    }
  };
  const a = e - Math.round(pre * SR);
  dip(b.L, a);
  dip(b.R, a);
  const as = e - Math.round(0.25 * SR);
  dip(b.sendL, as);
  dip(b.sendR, as);
}

// Gain to the loudness target, look-ahead true-peak limit to the ceiling, then add into the track.
export function finish(b: Bus, target = -16, ceilDb = -6.3) {
  const {ctx} = b;
  const sg = 10 ** (-8 / 20); // the solo mixes the send in dry at -8 dB: limit what it will hear
  const cL = new Float64Array(b.n);
  const cR = new Float64Array(b.n);
  for (let i = 0; i < b.n; i++) {
    cL[i] = b.L[i] + sg * b.sendL[i];
    cR[i] = b.R[i] + sg * b.sendR[i];
  }
  const env = peakEnv(cL);
  const er = peakEnv(cR);
  for (let i = 0; i < env.length; i++) env[i] = Math.max(env[i], er[i]);
  const a0 = Math.max(0, Math.round(b.S(0)));
  const a1 = Math.min(b.n, Math.round(b.S(ctx.length)));
  let gain = 1;
  for (let it = 0; it < 4; it++) {
    const [mL, mR] = limit(cL, cR, env, gain, ceilDb);
    gain *= 10 ** ((target - lufsRange(kPrefix(mL), kPrefix(mR), a0, a1)) / 20);
  }
  // one gain curve (from the combined envelope) for dry and send alike
  const [dL, dR] = limit(b.L, b.R, env, gain, ceilDb);
  const [sL, sR] = limit(b.sendL, b.sendR, env, gain, ceilDb);
  for (let i = 0; i < b.n; i++) {
    ctx.L[b.i0 + i] += dL[i];
    ctx.R[b.i0 + i] += dR[i];
    ctx.sendL[b.i0 + i] += sL[i];
    ctx.sendR[b.i0 + i] += sR[i];
  }
}

// a voice starting exactly at frame f
export const at = (b: Bus, f: number, dur: number, pan: number, send: number, fn: (t: number, r: () => number) => number) => put(b, b.S(f), dur, pan, send, fn);
const nz = (r: () => number) => r() * 2 - 1;

// UI tick: a crisp key/click (bandpassed noise snap + tiny pitched body)
export function tick(b: Bus, f: number, vol: number, pitch = 2400, pan = 0) {
  const bp = new BQ().set(2, pitch * 1.6, 1.2);
  at(b, f, 0.06, pan, 0.05, (t, r) => vol * (Math.min(1, t * 8000) * (2.2 * bp.run(nz(r)) * Math.exp(-t / 0.006) + 0.5 * Math.sin(TAU * pitch * t) * Math.exp(-t / 0.012))));
}
// soft two-partial sine blip
export function blip(b: Bus, f: number, m: number, vol: number, pan = 0, send = 0.2, dur = 0.18) {
  const fr = mtof(m);
  at(b, f, dur, pan, send, (t) => vol * Math.min(1, t * 2000) * Math.exp(-t / (dur * 0.3)) * (Math.sin(TAU * fr * t) + 0.25 * Math.sin(TAU * fr * 2.01 * t)));
}
// FM ping with a decaying index (alerts, locks)
export function ping(b: Bus, f: number, m: number, vol: number, dur = 0.9, pan = 0, send = 0.3, ratio = 2.0, idx = 1.6) {
  const fr = mtof(m);
  at(b, f, dur, pan, send, (t) => vol * Math.min(1, t * 3000) * Math.exp(-t / (dur * 0.3)) * Math.sin(TAU * fr * t + idx * Math.exp(-t / 0.08) * Math.sin(TAU * fr * ratio * t)));
}
// sine sub with soft edges
export function subNote(b: Bus, f: number, m: number, dur: number, vol: number) {
  const fr = mtof(m);
  at(b, f, dur + 0.08, 0, 0, (t) => vol * Math.sin(TAU * fr * t) * Math.min(1, t / 0.012) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.08) : 1));
}

// ---------- Library ----------
const CH = [
  [50, 53, 57, 60, 64], // Dm9
  [46, 50, 53, 57, 60], // Bbmaj9
  [53, 57, 60, 64, 67], // Fmaj9
  [48, 52, 55, 57, 62], // C6/9
];
const ROOT = [38, 34, 41, 36]; // D2 Bb1 F2 C2
const MOTIF = [74, 77, 81, 79, 76, 74, 72, 69]; // D5 F5 A5 G5 E5 D5 C5 A4

export default function render(ctx: SynthCtx) {
  const b = bus(ctx);
  const r = mulberry32(8080);
  const qcQuiet = (f: number) => f >= T.qc - 6 && f < T.flag; // flicker: the bed drops to a drone

  // ---- bed ----
  // pad, one chord per bar (bars 4–5 are the QC section: a held Dm drone instead)
  [0, 120, 240, 600, 720].forEach((f, i) => {
    const notes = CH[[0, 1, 2, 1, 3][i]];
    pad(b, b.S(f), notes, 2.0, 0.11, {lp0: 500, lp1: 1500, att: 0.25, rel: 0.6, send: 0.25});
  });
  pad(b, b.S(360), [50, 57, 62], 3.0, 0.09, {lp0: 900, lp1: 500, att: 0.3, rel: 0.6, send: 0.2});
  pad(b, b.S(T.flag), CH[0], 1.0, 0.1, {lp0: 1600, lp1: 700, att: 0.02, rel: 0.4, send: 0.25});
  // drone under the flicker: D2 + A2 sine with a slow beating, rising a touch toward the flag
  at(b, T.qc - 6, (T.flag - T.qc + 6) / 60, 0, 0.1, (t) => {
    const u = t / ((T.flag - T.qc + 6) / 60);
    return 0.16 * Math.min(1, t / 0.3) * (1 - 0.6 * Math.max(0, (u - 0.9) / 0.1)) * (Math.sin(TAU * mtof(38) * t) + 0.5 * Math.sin(TAU * mtof(45) * 1.003 * t) + 0.12 * u * Math.sin(TAU * mtof(57) * t));
  });

  // kick + sub (minimal: 1 and the "and" of 2), clap on 4, offbeat hats; out during the flicker
  for (let bar = 0; bar < 7; bar++) {
    const f0 = bar * 120;
    for (const off of [0, 45]) {
      const f = f0 + off;
      if (qcQuiet(f)) continue;
      kick(b, b.S(f), off ? 0.55 : 0.7);
      subNote(b, f, ROOT[[0, 1, 2, 3, 0, 1, 3][bar] % 4] + 12, off ? 0.18 : 0.32, 0.22);
    }
    if (!qcQuiet(f0 + 90) && bar > 0) clap(b, b.S(f0 + 90), 0.16, 0.1);
    for (let k = 0; k < 4; k++) {
      const f = f0 + k * 30 + 15;
      if (!qcQuiet(f)) hat(b, b.S(f), 0.09, false, 0.3);
    }
  }
  // data clicks: seeded 16th-note sprinkles, very short, panned around
  for (let f = 0; f < 830; f += 7.5) {
    const p = r();
    const pan = r() * 1.6 - 0.8;
    const hp = new BQ().set(1, 5000 + 4000 * r(), 0.8);
    if (qcQuiet(f) || p < 0.45 || EVENTS.some((e) => Math.abs(e.f - f) < 4)) continue;
    at(b, f, 0.02, pan, 0.03, (t, rr) => 0.12 * hp.run(nz(rr)) * Math.exp(-t / 0.0015));
  }
  // data motif: tiny square blips (bars 2, 3, 6, 7), quiet
  for (const bar of [1, 2, 5, 6]) {
    for (let k = 0; k < 8; k++) {
      const f = bar * 120 + k * 15;
      if (r() < 0.3) continue;
      const fr = mtof(MOTIF[(k + bar) % 8]);
      at(b, f, 0.09, k % 2 ? 0.4 : -0.4, 0.2, (t) => 0.045 * Math.min(1, t * 1500) * Math.exp(-t / 0.035) * (Math.sin(TAU * fr * t) > 0 ? 1 : -1) * 0.6);
    }
  }

  // ---- zoetrope whirr: band noise + a tone, amplitude-modulated at the slit rate, rising with the spin ----
  {
    const f0 = T.proxy + 6;
    const f1 = T.tc + 4;
    const bp = new BQ();
    let ph = 0;
    let am = 0;
    at(b, f0, (f1 - f0) / 60, 0, 0.12, (t, rr) => {
      const fl = f0 + t * 60;
      const u = Math.max(0, Math.min(1, (fl - 606) / 54));
      const lock = fl >= T.sync ? 1 : 0;
      const rev = lock ? 2 : u * u * 1.6; // revolutions per second (perceptual)
      const slit = rev * 12; // slits passing per second
      am += slit / SR;
      ph += (90 + 200 * rev) / SR;
      if ((Math.round(t * SR) & 31) === 0) bp.set(2, 400 + 900 * rev, 2.5);
      const gate = 0.55 + 0.45 * Math.sin(TAU * am);
      const env = Math.min(1, t / 0.4) * Math.min(1, ((f1 - f0) / 60 - t) * 4);
      return env * (0.1 + 0.08 * rev) * gate * (1.6 * bp.run(nz(rr)) + 0.35 * Math.sin(TAU * ph));
    });
  }
  // ---- LTC: actual bi-phase mark at 25 fps (80 bits/frame → 1 kHz / 2 kHz square), band-limited and quiet ----
  {
    const f0 = T.tc + 2;
    const f1 = T.exit + 10;
    const lp = new BQ().set(0, 5500, 0.7);
    const hp = new BQ().set(1, 500, 0.7);
    const cell = SR / 2000; // one bit = 1/2000 s
    const bits = (k: number) => {
      // tc 01:00:12:08 + k frames; data bits only matter for the timbre, sync word keeps it LTC-like
      const fr = (8 + k) % 25;
      const word: number[] = [];
      const p = (v: number, n: number) => {
        for (let i = 0; i < n; i++) word.push((v >> i) & 1);
      };
      p(fr % 10, 4), p(0, 4), p(Math.floor(fr / 10), 2), p(0, 6), p(2, 4), p(0, 4), p(1, 3), p(0, 5), p(0, 4), p(0, 4), p(0, 3), p(0, 5), p(1, 4), p(0, 4), p(0, 2), p(0, 6);
      return [...word, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1];
    };
    const half: number[] = [];
    let lv = 1;
    for (let k = 0; k < 40; k++)
      for (const bit of bits(k)) {
        lv = -lv; // transition at every bit edge
        half.push(lv);
        if (bit) lv = -lv; // and mid-cell for a 1
        half.push(lv);
      }
    void cell;
    at(b, f0, (f1 - f0) / 60, -0.15, 0, (t) => {
      const env = Math.min(1, t / 0.05) * Math.min(1, ((f1 - f0) / 60 - t) * 6) * (t < (T.ltc - f0) / 60 ? 0.6 : 1);
      return 0.05 * env * lp.run(hp.run(half[Math.floor(t * 4000) % half.length]));
    });
  }

  // ---- events that are not impacts/hits ----
  for (const e of EVENTS) {
    if (e.kind === 'tick') {
      if (e.f >= T.qc && e.f < T.flag) {
        // shutter: each new picture after the blank
        tick(b, e.f, 0.5, 1500, -0.1);
        at(b, e.f, 0.08, 0, 0, (t) => 0.35 * Math.sin(TAU * 140 * t) * Math.exp(-t / 0.02) * Math.min(1, t * 4000));
      } else if (T.jobs.includes(e.f)) {
        tick(b, e.f, 0.45, 3200, 0.3);
        blip(b, e.f, 86 + T.jobs.indexOf(e.f) * 3, 0.12, 0.3, 0.2, 0.12);
      } else tick(b, e.f, 0.55, 2400 + ((e.f * 37) % 900), ((e.f * 13) % 7) / 10 - 0.3);
    } else if (e.kind === 'blip') {
      const m = e.f === T.ltc ? 86 : e.f === T.catResults ? 81 : e.f === T.libFilter ? 79 : 84;
      blip(b, e.f, m, 0.22, 0.2);
      blip(b, e.f + 4, m + 5, 0.16, -0.2);
    } else if (e.kind === 'whoosh') whoosh(b, b.S(e.f), 0.5, 0.4, 0.2);
  }

  // ---- impacts/hits: clear the bed, then land ----
  for (const e of EVENTS) if (e.kind === 'impact' || e.kind === 'hit') duck(b, e.f);
  // land on the source: thump + ping
  thump(b, b.S(T.land), 0.9);
  ping(b, T.land, 81, 0.2, 0.7, 0.2, 0.3, 3.0, 1.2);
  // QC flag: alert ping (two tones, echoing) over a sub thump
  thump(b, b.S(T.flag), 1.0);
  subNote(b, T.flag, 38, 0.5, 0.45);
  [0, 9, 18].forEach((d, k) => {
    ping(b, T.flag + d, 81, 0.32 * 0.55 ** k, 0.6, k % 2 ? 0.4 : -0.2, 0.35, 2.0, 1.4);
    ping(b, T.flag + d + 4.5, 88, 0.26 * 0.55 ** k, 0.6, k % 2 ? -0.4 : 0.2, 0.35, 2.0, 1.4);
  });
  // zoetrope sync: lock clunk + bright ping
  thump(b, b.S(T.sync), 0.85);
  ping(b, T.sync, 86, 0.2, 0.8, 0, 0.35, 3.5, 2.0);
  // timecode alignment: big impact + D chord ping
  thump(b, b.S(T.align), 1.0);
  subNote(b, T.align, 38, 0.9, 0.5);
  at(b, T.align, 2.2, 0, 0.3, (t, rr) => 0.25 * Math.exp(-t / 0.5) * nz(rr) * Math.exp(-t / 0.04));
  [62, 69, 74].forEach((m, k) => ping(b, T.align + k * 0.5, m, 0.14, 1.6, k - 1, 0.4, 1.0, 0.8));

  finish(b);
}
