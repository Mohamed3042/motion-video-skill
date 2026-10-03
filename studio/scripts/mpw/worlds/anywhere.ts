import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {THEME} from '../../../src/mpw/intro/timing.ts';
import {EVENTS, T} from '../../../src/mpw/worlds/anywhere/timing.ts';

// World 11: the intro's D-minor theme returns as a sparse, warm F-major/Rhodes arrangement.
// The mirror has already landed at f0 (the framework owns that boundary impact). UI sounds use
// the picture's exact shared frames; opposite pans distinguish RTL UI from the LTR timeline.
// Independent local bed/FX buses leave 60 ms of clear space before the f390 hit and next edit.
export default function render(ctx: SynthCtx) {
  if (ctx.SR !== D.SR) throw new Error('Anywhere sound requires the shared 44.1 kHz DSP rate');
  const SR = D.SR;
  const base = Math.floor(ctx.at(0));
  const n = Math.ceil(ctx.at(ctx.length) - base + 0.5 * SR);
  const bed = D.makeOut(n);
  const fx = D.makeOut(n);
  const s = (f: number) => ctx.at(f) - base;
  const click = (f: number, vol: number, note: number, pan: number) => {
    D.tick(fx, s(f), vol, note, pan);
    D.clack(fx, s(f), vol * 0.35, pan, 2000);
  };
  const blip = (f: number, note: number, pan0: number, pan1 = pan0) => {
    D.tick(fx, s(f), 0.23, note + 12, pan0);
    D.bell(fx, s(f), note, 0.21, 0.22, pan0, 2, 0.5, 0.12);
    D.bell(fx, s(f) + 0.065 * SR, note + 7, 0.11, 0.28, pan1, 2, 0.4, 0.15);
  };
  // A compact stereo swish whose sharp maximum lands at the named visual frame.
  const swish = (f: number, pan0: number, pan1: number) => {
    const pre = 0.18;
    const post = 0.11;
    const bp = new D.BQ();
    const hp = new D.BQ().set(1, 1600, 0.7);
    D.put(fx, s(f) - pre * SR, pre + post, 0, 0, (t, r) => {
      const u = t - pre;
      const env = u < 0 ? Math.exp(u / 0.025) : Math.exp(-u / 0.022);
      if ((Math.round(t * SR) & 15) === 0) bp.set(2, 1400 + 3500 * Math.exp(-Math.abs(u) / 0.1), 0.9);
      return 0.55 * env * (bp.run(r() * 2 - 1) + 0.35 * hp.run(r() * 2 - 1));
    });
    const a = Math.max(0, Math.ceil(s(f) - pre * SR));
    const b = Math.min(n, Math.ceil(s(f) + post * SR));
    // Re-pan only this swish: the caller orders it before any overlapping UI event.
    for (let i = a; i < b; i++) {
      const [gl, gr] = D.panG(pan0 + (pan1 - pan0) * (i - a) / Math.max(1, b - a));
      const mono = (fx.L[i] + fx.R[i]) / Math.SQRT2;
      fx.L[i] = mono * gl;
      fx.R[i] = mono * gr;
    }
  };

  const harmony = [
    {f: 0, root: 41, notes: [53, 60, 64, 67, 69]}, // Fmaj9, resolving Profile's C6/9
    {f: 120, root: 38, notes: [50, 57, 60, 64, 65]}, // Dm9
    {f: 240, root: 34, notes: [46, 53, 57, 62, 65]}, // Bbmaj7
    {f: 360, root: 36, notes: [48, 55, 57, 60, 64]}, // C6 → finale Dm
  ];
  for (const h of harmony) {
    D.rhodesChord(bed, s(h.f), h.notes, 1.75, 0.28, 0.22);
    D.pad(bed, s(h.f), h.notes.slice(1), 1.8, 0.09, {lp0: 650, lp1: 1200, att: 0.2, rel: 0.2, send: 0.3});
    D.sub(bed, s(h.f), h.root - 12, 1.8, 0.13);
  }
  // Eight-note theme, with rests around the callouts and privacy chips (120 BPM/eighth-note grid).
  [0, 30, 90, 150, 180, 225, 375, 420].forEach((f, i) => {
    D.rhodes(bed, s(f), THEME[i], 0.42, 0.15, i % 2 ? 0.2 : -0.2, 0.22);
  });
  // A restrained half-time pulse; UI events own their own transient instead of sharing a drum hit.
  for (let f = 0; f < 420; f += 15) {
    if (EVENTS.some((e) => Math.abs(e.f - f) < 4)) continue;
    if ([T.reflowWhoosh, T.exitWhoosh].some((v) => f >= v - 15 && f <= v + 3)) continue;
    if (f % 120 === 0 || f % 120 === 60) D.kick(bed, s(f), 0.15);
    if (f % 30 === 15) D.shaker(bed, s(f), 0.026, f % 60 ? -0.25 : 0.25);
  }

  // Reflow / exit swishes first, so their local re-pan cannot touch a later UI voice.
  swish(T.reflowWhoosh, 0.65, 0);
  swish(T.exitWhoosh, -0.35, 0.35);
  click(T.toggle, 0.28, 89, 0.35);
  blip(T.calloutUI, 81, 0.6, -0.6); // right-to-left interface
  blip(T.calloutTL, 81, -0.6, 0.6); // left-to-right timeline
  click(T.phone, 0.28, 93, 0.25);
  T.chips.forEach((f, i) => blip(f, [77, 79, 81, 84][i], -0.25 + i * 0.16));
  D.hit(fx, s(T.stays), 0.42);
  [65, 69, 72, 77].forEach((m, i) => D.bell(fx, s(T.stays) + i * 0.01 * SR, m, 0.05, 0.65, i % 2 ? 0.3 : -0.3, 2, 0.4, 0.15));

  // Clear both beds AND prior FX tails for the full 60 ms before the caption's impact.
  const strong = EVENTS.filter((e) => e.kind === 'hit' || e.kind === 'impact').map((e) => s(e.f));
  const soft = EVENTS.filter((e) => e.kind === 'tick' || e.kind === 'blip').map((e) => s(e.f));
  const whooshes = EVENTS.filter((e) => e.kind === 'whoosh').map((e) => s(e.f));
  const end = s(ctx.length);
  for (let i = 0; i < n; i++) {
    let g = 1;
    let tail = 1;
    for (const c of strong) {
      const dt = (i - c) / SR;
      if (dt >= -0.08 && dt < 0) {
        const duck = dt < -0.06 ? (dt + 0.08) / 0.02 : 1;
        g = Math.min(g, 1 - 0.95 * duck);
        tail = Math.min(tail, 1 - 0.95 * duck);
      } else if (dt >= 0 && dt < 0.06) g = Math.min(g, 0.05 + 0.95 * dt / 0.06);
    }
    for (const c of soft) {
      const dt = (i - c) / SR;
      if (dt >= -0.055 && dt < 0.045) g = Math.min(g, dt < 0 ? 0.3 : 0.3 + 0.7 * dt / 0.045);
    }
    for (const c of whooshes) if (i >= c - 0.2 * SR && i < c + 0.08 * SR) g = Math.min(g, 0.3);
    const boundary = Math.max(0, Math.min(1, (end - 0.06 * SR - i) / (0.14 * SR)));
    bed.L[i] *= g * boundary;
    bed.R[i] *= g * boundary;
    bed.sendL[i] *= g * boundary;
    bed.sendR[i] *= g * boundary;
    fx.L[i] *= tail * boundary;
    fx.R[i] *= tail * boundary;
    fx.sendL[i] *= tail * boundary;
    fx.sendR[i] *= tail * boundary;
  }

  // Match the solo contract (send auditioned at −8 dB) without clipping dry or send buses.
  const k = 10 ** (-8 / 20);
  const L = bed.L.map((v, i) => v + fx.L[i]);
  const R = bed.R.map((v, i) => v + fx.R[i]);
  const SL = bed.sendL.map((v, i) => v + fx.sendL[i]);
  const SRr = bed.sendR.map((v, i) => v + fx.sendR[i]);
  const mL = L.map((v, i) => v + k * SL[i]);
  const mR = R.map((v, i) => v + k * SRr[i]);
  const loudness = D.lufsRange(D.kPrefix(mL), D.kPrefix(mR), Math.round(s(0)), Math.round(end));
  const gain = 10 ** ((-16 - loudness) / 20);
  const env = D.peakEnv(mL);
  const envR = D.peakEnv(mR);
  for (let i = 0; i < n; i++) env[i] = Math.max(env[i], envR[i]);
  const ones = new Float32Array(n).fill(1);
  const [curve] = D.limit(ones, ones, env, gain, -6.2);
  for (let i = 0; i < n; i++) {
    const j = base + i;
    if (j < 0 || j >= ctx.L.length) continue;
    ctx.L[j] += L[i] * curve[i];
    ctx.R[j] += R[i] * curve[i];
    ctx.sendL[j] += SL[i] * curve[i];
    ctx.sendR[j] += SRr[i] * curve[i];
  }
}
