// Sound-module kit (scaffold-owned, read-only for builders): a local bed + fx bus pair with pre-impact ducking
// ("suck-out"), a fade before the segment's end boundary, and loudness/peak normalisation (about -16 LUFS, peaks
// ≤ -6 dBFS, measured like solo.ts), mixed down into the SynthCtx. Generalized from studio/scripts/mkv/worlds/evolution.ts.
// Usage in scripts/__SLUG__/segments/<id>.ts:
//   const {bed, fx, s, finish} = stage(ctx);   // s(localFrame) → sample index in the local buses
//   D.kick(bed, s(0), 0.5); D.hit(fx, s(EVENT_FRAME), 0.6); ...
//   finish(EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').map((e) => e.f));
import type {SynthCtx} from './types.ts';
import * as D from './dsp.ts';
import {FPS} from '../../src/__SLUG__/timing.ts';

const SR = D.SR;

export function stage(ctx: SynthCtx) {
  const base = Math.floor(ctx.at(-Math.round(FPS / 2)));
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
