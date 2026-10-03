// World 10 · Profile & Intelligence — warm felt piano + Rhodes, D minor ↔ F major, 120 BPM.
// Troxler hold (bars 1–2): no drums, a pedalled piano chord and a sparse motif, nothing that pulls the eye.
// f240 impact (the panel resolves) starts a soft groove. Approve = soft two-bell chime, Reject = muted felt thud,
// a gentle helper blip per readiness check (D-minor pentatonic, rising), ticks for marker / toggle / plan checks,
// a hit on "Apply 2 selected changes", swishes on the panel changes, and a REVERSED swell that sucks out 65 ms
// before the boundary (its forward mirror image opens world 11).
// Also exports the small stage/instrument kit used by world 11 (same builder).
import type {SynthCtx} from '../types.ts';
import * as D from '../../mkv/dsp.ts';
import {EVENTS, T} from '../../../src/mpw/worlds/profile/timing.ts';

const SR = D.SR;
const noise = (r: () => number) => r() * 2 - 1;

// ---------- stage: local bed + fx buses, pre-impact ducking, loudness/peak normalisation, mixdown into ctx ----------
export function stage(ctx: SynthCtx) {
  const base = Math.floor(ctx.at(-30));
  const n = Math.ceil(ctx.at(ctx.length) + 0.7 * SR) - base;
  const bed = D.makeOut(n);
  const fx = D.makeOut(n);
  const s = (f: number) => ctx.at(f) - base; // world frame → local sample (fractional)
  // ducks: the bed (and earlier fx tails) dip −18 dB from 60 ms before each impact/hit → clean transient.
  // The bed also fades out just before the world's end boundary (the framework's edit impact).
  // soft: ticks/blips — the bed only dips ~−8 dB for 50 ms so each UI sound reads as its own onset.
  const finish = (ducks: number[], soft: number[] = [], target = -16, ceilDb = -6) => {
    const g = new Float64Array(n).fill(1);
    for (const f of ducks) {
      const c = s(f);
      for (let i = Math.max(0, Math.floor(c - 0.1 * SR)); i < Math.min(n, c + 0.002 * SR); i++) {
        const t = (i - c) / SR;
        const d = t < -0.09 ? 0 : t < -0.06 ? (t + 0.09) / 0.03 : t < 0 ? 1 : 1 - t / 0.002;
        g[i] = Math.min(g[i], 1 - 0.88 * d);
      }
    }
    const gx = g.slice();
    for (const f of soft) {
      const c = s(f);
      for (let i = Math.max(0, Math.floor(c - 0.08 * SR)); i < Math.min(n, c + 0.06 * SR); i++) {
        const t = (i - c) / SR;
        const d = t < -0.07 ? 0 : t < -0.05 ? (t + 0.07) / 0.02 : t < 0 ? 1 : Math.max(0, 1 - t / 0.06);
        g[i] = Math.min(g[i], 1 - 0.6 * d);
      }
    }
    const cEnd = s(ctx.length);
    for (let i = Math.max(0, Math.floor(cEnd - 0.2 * SR)); i < n; i++) g[i] = Math.min(g[i], Math.max(0, Math.min(1, (cEnd - 0.07 * SR - i) / (0.13 * SR))));
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
    // measure like solo.ts does (send mixed in at −8 dB)
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
    for (let it = 0; it < 5; it++) {
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
// UI tick: short pitched click + noise snap
export function click(o: D.Out, s: number, vol: number, freq = 3000, pan = 0, send = 0.08) {
  D.put(o, s, 0.06, pan, send, (t, r) => vol * (Math.sin(D.TAU * freq * t) * Math.exp(-t / 0.006) + noise(r) * Math.exp(-t / 0.0012) * 0.7));
}
// two-tone sine blip; the second tone can sit elsewhere in the stereo field (p2)
export function blip(o: D.Out, s: number, vol: number, m1: number, m2: number, pan = 0, p2 = pan) {
  D.put(o, s, 0.012, pan, 0, (t, r) => vol * 1.3 * noise(r) * Math.exp(-t / 0.0018)); // crisp onset
  D.bell(o, s, m1, vol, 0.32, pan, 2, 0.45, 0.2);
  D.bell(o, s + 0.065 * SR, m2, vol, 0.7, p2, 2, 0.45, 0.3);
}
// paper/air swish, energy peaking on sample `c`
export function swish(o: D.Out, c: number, vol: number, pre = 0.14, post = 0.1, pan = 0.25, lo = 900, hi = 6500) {
  const bp = new D.BQ();
  D.put(o, c - pre * SR, pre + post, pan, 0.2, (t, r) => {
    const u = t - pre;
    const e = u < 0 ? (1 + u / pre) ** 2.5 : Math.exp(-u / (post * 0.35));
    if ((Math.round(t * SR) & 15) === 0) bp.set(2, lo * (hi / lo) ** Math.min(1, t / pre), 1.4);
    return vol * e * (0.75 + 0.25 * Math.sin(D.TAU * 31 * t)) * bp.run(noise(r)) * 2.2;
  });
}
// warm felt piano: inharmonic partials, two-stage decay, soft hammer
export function piano(o: D.Out, s: number, m: number, dur: number, vol: number, pan = 0, send = 0.35, bright = 1) {
  const f0 = D.mtof(m);
  const tau = 3.2 * 0.5 ** ((m - 45) / 24);
  const P: [number, number, number][] = [];
  for (let k = 1; k <= 9; k++) {
    const fk = k * f0 * Math.sqrt(1 + 0.00032 * k * k);
    if (fk > 7000) break;
    P.push([fk, (bright * (k === 1 ? 1 : 0.85)) / k ** 1.55, tau / (1 + 0.45 * (k - 1))]);
  }
  const lp = new D.BQ().set(0, 500 + f0, 0.7);
  const rel = 0.45;
  D.put(o, s, dur + rel, pan, send, (t, r) => {
    let y = 0;
    for (const [fk, a, tk] of P) y += a * Math.sin(D.TAU * fk * t) * (0.6 * Math.exp(-t / (tk * 0.22)) + 0.4 * Math.exp(-t / tk));
    const env = Math.min(1, t / 0.003) * (t > dur ? Math.max(0, 1 - (t - dur) / rel) : 1);
    return vol * env * (0.55 * y + 0.35 * lp.run(noise(r)) * Math.exp(-t / 0.01));
  });
}
export function pianoChord(o: D.Out, s: number, notes: number[], dur: number, vol: number, roll = 0.018, send = 0.4) {
  notes.forEach((m, j) => piano(o, s + j * roll * SR, m, dur, vol / Math.sqrt(notes.length), (j / Math.max(1, notes.length - 1)) * 0.7 - 0.35, send));
}
// soft brush/shaker
export function shaker(o: D.Out, s: number, vol: number, pan = 0.25) {
  const bp = new D.BQ().set(2, 6500, 0.9);
  D.put(o, s, 0.09, pan, 0.06, (t, r) => vol * bp.run(noise(r)) * Math.min(1, t / 0.006) * Math.exp(-t / 0.028) * 2);
}
// felt kick (rounder than dsp.kick)
export function softKick(o: D.Out, s: number, vol: number) {
  let ph = 0;
  D.put(o, s, 0.4, 0, 0, (t) => {
    ph += (D.TAU * (48 + 70 * Math.exp(-t / 0.035))) / SR;
    return vol * Math.sin(ph) * Math.exp(-t / 0.18) * Math.min(1, t * 2500);
  });
}
// muted felt thud ("reject")
export function thud(o: D.Out, s: number, vol: number, pan = 0) {
  let ph = 0;
  const lp = new D.BQ().set(0, 420, 0.8);
  D.put(o, s, 0.35, pan, 0.08, (t, r) => {
    ph += (D.TAU * (70 + 60 * Math.exp(-t / 0.03))) / SR;
    return vol * Math.min(1, t * 3000) * (Math.sin(ph) * Math.exp(-t / 0.09) + 1.6 * lp.run(noise(r)) * Math.exp(-t / 0.025));
  });
}
// a sustained swell whose envelope runs FORWARD (bloom: loud → soft) or REVERSED (soft → loud, hard cut)
export function swell(o: D.Out, s0: number, s1: number, notes: number[], vol: number, reversed: boolean) {
  const dur = (s1 - s0) / SR;
  const bp = new D.BQ();
  notes.forEach((m, j) => {
    const f = D.mtof(m);
    D.put(o, s0, dur, (j % 2 ? 0.45 : -0.45) * (reversed ? 1 : -1), 0.55, (t) => {
      const u = reversed ? t / dur : 1 - t / dur;
      const e = u ** 3.2 * (reversed ? Math.min(1, (dur - t) * 600) : Math.min(1, t * 600));
      return (vol * e * (Math.sin(D.TAU * f * t) + 0.3 * Math.sin(D.TAU * 2 * f * t + 0.4) + 0.12 * Math.sin(D.TAU * 3 * f * t))) / notes.length;
    });
  });
  D.put(o, s0, dur, 0, 0.6, (t, r) => {
    const u = reversed ? t / dur : 1 - t / dur;
    if ((Math.round(t * SR) & 31) === 0) bp.set(2, 400 * (6000 / 400) ** u, 1.1);
    return vol * 0.55 * u ** 3.5 * bp.run(noise(r)) * (reversed ? Math.min(1, (dur - t) * 600) : Math.min(1, t * 600));
  });
}

// ---------- the world ----------
const BAR = 120;
// chords per half-bar slot (frames → notes), roots for bass
const HARM: {f: number; notes: number[]; root: number}[] = [
  {f: 0, notes: [50, 57, 64, 65, 69], root: 38}, // Dm(add9)
  {f: 120, notes: [46, 53, 57, 62, 65], root: 34}, // Bbmaj7
  {f: 240, notes: [53, 60, 64, 67, 69], root: 41}, // Fmaj9
  {f: 360, notes: [55, 58, 62, 65, 69], root: 43}, // Gm9
  {f: 480, notes: [50, 57, 60, 64, 65], root: 38}, // Dm9
  {f: 600, notes: [46, 53, 57, 60, 62], root: 34}, // Bbmaj9
  {f: 660, notes: [48, 55, 57, 62, 64], root: 36}, // C6/9 → (F opens world 11)
];

export default function render(ctx: SynthCtx) {
  const {bed, fx, s, finish} = stage(ctx);
  const L = ctx.length; // 720

  // --- harmony: pedalled piano chords + a soft pad under everything ---
  HARM.forEach((h, k) => {
    const end = k + 1 < HARM.length ? HARM[k + 1].f : L - 8;
    const dur = (end - h.f) / 60;
    const calm = h.f < T.resolve;
    pianoChord(bed, s(h.f), [h.root, ...h.notes], dur + 0.2, calm ? 0.34 : 0.26, calm ? 0.028 : 0.012);
    D.pad(bed, s(h.f), h.notes, dur, calm ? 0.13 : 0.1, {lp0: calm ? 500 : 900, lp1: calm ? 1100 : 1600, att: calm ? 0.9 : 0.25, rel: 0.4, send: 0.6});
    D.sub(bed, s(h.f), h.root - 12, dur - 0.05, calm ? 0.1 : 0.13);
  });
  // Troxler motif: sparse, high, soft (rising over Dm, falling over Bb)
  [
    [30, 69],
    [60, 72],
    [75, 74],
    [90, 76],
    [150, 74],
    [180, 72],
    [195, 69],
    [210, 65],
  ].forEach(([f, m], i) => piano(bed, s(f), m + 12, 1.2, 0.12, i % 2 ? 0.3 : -0.2, 0.55, 0.7));

  // --- the groove: from the resolve to the reverse swell ---
  for (let f = T.resolve; f < 660; f += 15) {
    const inBar = (f - T.resolve) % BAR;
    const h = [...HARM].reverse().find((x) => x.f <= f)!;
    // the groove leaves room: no bed onset on a frame that carries a UI tick/blip
    if (EVENTS.some((e) => (e.kind === 'tick' || e.kind === 'blip') && Math.abs(e.f - f) < 3)) continue;
    if (EVENTS.some((e) => e.kind === 'whoosh' && f > e.f - 20 && f < e.f)) continue; // a clear runway into each swish
    if (inBar === 0 || inBar === 60 || (f >= 480 && inBar === 105)) softKick(bed, s(f), 0.42);
    if (inBar === 30 || inBar === 90) click(bed, s(f), 0.09, 1700, -0.15, 0.12);
    shaker(bed, s(f), inBar % 30 === 15 ? 0.05 : 0.03, (f / 15) % 2 ? 0.35 : -0.35);
    if (inBar === 0 || inBar === 45 || inBar === 75) D.bassPulse(bed, s(f), h.root - (inBar === 75 ? 0 : 12), 0.22, 0.2);
    if (f >= 480 && f < 600 && inBar % 30 === 15) D.bassPulse(bed, s(f), h.root - 12, 0.1, 0.12);
    if (inBar === 75) D.rhodesChord(bed, s(f), h.notes.map((m) => m + 12), 0.3, 0.12, 0.45);
  }
  shaker(bed, s(660), 0.03, 0.3);
  shaker(bed, s(675), 0.022, -0.3);

  // --- events ---
  // f240: the panel resolves (impact)
  D.hit(fx, s(T.resolve), 0.5);
  D.boom(fx, s(T.resolve), 0.32, 1.8);
  [77, 81, 84, 88, 91].forEach((m, j) => D.bell(fx, s(T.resolve) + j * 0.02 * SR, m, 0.05, 2.4, j % 2 ? 0.5 : -0.5, 2, 0.9, 0.6));
  // Approve: soft rising two-bell chime (C6 → F6)
  D.bell(fx, s(T.approve), 84, 0.34, 1.4, 0.15, 2, 0.6, 0.45);
  D.bell(fx, s(T.approve) + 0.07 * SR, 89, 0.28, 1.8, 0.25, 2, 0.6, 0.5);
  click(fx, s(T.approve), 0.2, 3200, 0.1);
  // Reject: muted felt thud
  thud(fx, s(T.reject), 0.75, 0);
  click(fx, s(T.reject), 0.12, 900, 0);
  // a suggestion appears; you apply it
  blip(fx, s(T.suggest), 0.24, 81, 88, 0.35);
  click(fx, s(T.apply), 0.4, 2600, 0.3);
  D.bell(fx, s(T.apply), 93, 0.06, 0.8, 0.3, 2, 0.5, 0.4);
  // into Intelligence
  swish(fx, s(T.toIntel), 0.5, 0.2, 0.12, 0.3, 700, 7000);
  D.whoosh(fx, s(T.toIntel), 0.18, 0.28, 0.16);
  // readiness checks: gentle helper blips, rising D-minor pentatonic
  T.checks.forEach((f, i) => blip(fx, s(f), 0.24, [74, 77, 81][i], [81, 84, 86][i], -0.3 + i * 0.2));
  // review marker drops: a tick with a little falling glide
  click(fx, s(T.marker), 0.6, 1500, -0.1);
  D.bell(fx, s(T.marker), 86, 0.12, 0.5, -0.1, 2, 0.4, 0.3);
  {
    let ph = 0;
    D.put(fx, s(T.marker), 0.12, -0.1, 0.2, (t) => {
      ph += (1400 - 4000 * t) / SR;
      return 0.05 * Math.sin(D.TAU * ph) * Math.exp(-t / 0.04);
    });
  }
  // "Your own API endpoint" toggle: switch clack (two clicks)
  click(fx, s(T.endpoint), 0.4, 1800, 0.25);
  click(fx, s(T.endpoint) + 0.018 * SR, 0.22, 2900, 0.25);
  // the plan appears; you tick two changes
  blip(fx, s(T.plan), 0.22, 79, 86, 0.3);
  T.planChecks.forEach((f, i) => {
    click(fx, s(f), 0.7, 2400 + i * 300, 0.25);
    D.bell(fx, s(f), 93 + i * 2, 0.1, 0.35, 0.25, 2, 0.4, 0.25);
  });
  // Apply 2 selected changes: hit + bell chord
  D.hit(fx, s(T.applyPlan), 0.42);
  [74, 77, 81, 84].forEach((m, j) => D.bell(fx, s(T.applyPlan) + j * 0.015 * SR, m, 0.06, 0.9, j % 2 ? 0.4 : -0.4, 2, 0.8, 0.5));
  // into the whole app (queue)
  swish(fx, s(T.toQueue), 0.5, 0.24, 0.14, -0.2, 500, 6000);
  D.whoosh(fx, s(T.toQueue), 0.55, 0.3, 0.2);
  // a job completes
  blip(fx, s(T.jobDone), 0.24, 84, 91, 0.2);
  // exit: the tiles flip — a REVERSED swell into the mirror, sucked out 65 ms before the boundary impact
  swell(fx, s(672), s(L) - 0.065 * SR, [60, 64, 67, 72, 76, 79], 0.42, true);

  finish(
    EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').map((e) => e.f),
    EVENTS.filter((e) => e.kind === 'tick' || e.kind === 'blip' || e.kind === 'whoosh').map((e) => e.f),
  );
}
