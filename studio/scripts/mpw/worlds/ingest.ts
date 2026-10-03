// World 1 · Ingest: dry tape transport, file-copy clicks and a D-minor data groove.
// Every UI action takes its frame from the picture's timing contract. No samples or clocks.
import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {EVENTS, T} from '../../../src/mpw/worlds/ingest/timing.ts';

export default function render(ctx: SynthCtx) {
  const i0 = Math.max(0, Math.floor(ctx.at(-15)));
  const n = Math.min(ctx.L.length, Math.ceil(ctx.at(ctx.length + 30))) - i0;
  const b = D.makeOut(n);
  const at = (f: number) => ctx.at(f) - i0;
  const impacts = EVENTS.filter((e) => e.kind === 'hit' || e.kind === 'impact');
  const guard = (f: number) => !impacts.some((e) => f < e.f && f >= e.f - 4.2);

  // Five bars: the mechanical rhythm gains a bass and a restrained chord as the copy verifies.
  const roots = [38, 38, 34, 36, 38];
  const chords = [[50, 57, 60, 64], [50, 57, 62, 65], [46, 53, 57, 62], [48, 55, 58, 62], [50, 57, 62, 65]];
  for (let bar = 0; bar < 5; bar++) {
    const f0 = bar * 120;
    D.bassPulse(b, at(f0), roots[bar], 0.3, bar < 2 ? 0.12 : 0.18);
    D.bassPulse(b, at(f0 + 75), roots[bar] + 7, 0.17, 0.08);
    // A short filtered key gives the clicks a harmony while keeping the tape machine in front.
    if (bar > 0) D.rhodesChord(b, at(f0), chords[bar], 0.8, 0.08, 0.08);
    for (let k = 0; k < 8; k++) {
      const f = f0 + k * 15;
      if (!guard(f)) continue;
      D.clack(b, at(f), k % 2 ? 0.035 : 0.065, k % 2 ? 0.42 : -0.4, 1100 + 180 * k);
      if (k === 0 || k === 4) D.kick(b, at(f), 0.15);
      if (k % 2) D.hat(b, at(f), 0.025, false, 0.3);
    }
    if (bar >= 2) {
      [74, 77, 81, 79].forEach((m, k) => {
        const f = f0 + k * 30 + 7.5;
        if (guard(f)) D.square(b, at(f), m, 0.055, 0.026, 0.125, -0.45 + k * 0.3, 0.035);
      });
    }
  }

  // The folders fan out; copy ticks move from Source to Copy; re-read blocks converge to the centre.
  T.subs.forEach((f, k) => D.clack(b, at(f), 0.12, -0.6 + k * 0.4, 1500 + k * 240));
  D.whoosh(b, at(T.fly), 0.055, 0.32, 0.11, 0.06, -0.65, 0.45);
  T.files.forEach((f, k) => {
    D.clack(b, at(f), 0.075 + (k % 4) * 0.007, -0.45 + k / 12 * 0.9, 2600 + (k % 4) * 270);
    D.square(b, at(f + 1), [74, 77, 79, 81][k % 4], 0.027, 0.026, 0.125, 0.35, 0.02);
  });
  D.clack(b, at(T.reread), 0.13, 0, 1250);
  T.blocks.forEach((f, k) => D.tick(b, at(f), 0.07, [86, 89, 93, 98][k % 4], (k % 2 ? 1 : -1) * (0.4 - k * 0.04)));
  D.revSwell(b, at(T.match), 0.55, 0.055);
  D.tick(b, at(T.untouched), 0.095, 93, 0.2);
  T.verified.forEach((f, k) => D.bell(b, at(f), [77, 81, 84, 86][k], 0.07, 0.32, -0.45 + 0.3 * k, 2, 0.65, 0.08));
  D.whoosh(b, at(T.exit), 0.065, 0.42, 0.12, 0.06, -0.6, 0.6);

  // Cut every bed and its send before a visual impact, then add the tape-machine attack on that exact frame.
  for (const e of impacts) {
    const s = Math.round(at(e.f));
    for (const x of [b.L, b.R, b.sendL, b.sendR]) {
      const gap = x === b.sendL || x === b.sendR ? 0.25 : 0.06;
      const a = s - Math.round(gap * ctx.SR);
      const fade = Math.round(0.01 * ctx.SR);
      for (let i = Math.max(0, a - fade); i < Math.min(n, s); i++) {
        const g = i < a ? 0.035 + 0.965 * 0.5 * (1 + Math.cos(Math.PI * (i - a + fade) / fade)) : 0.035;
        x[i] *= g;
      }
    }
    D.clack(b, s, e.f === T.match ? 0.2 : 0.14, 0, 1800);
    D.thump(b, s, e.f === T.match ? 0.32 : 0.23);
    if (e.f === T.match) {
      D.hit(b, s, 0.14);
      D.rhodesChord(b, s, [50, 57, 62, 65, 69], 1.15, 0.12, 0.12);
    }
  }

  // Keep tails inside the contract, and bring this world's solo mix to -16 LUFS / below -6 dBTP.
  const tail0 = Math.round(at(ctx.length));
  for (let i = Math.max(0, tail0); i < n; i++) {
    const g = 0.5 + 0.5 * Math.cos(Math.PI * (i - tail0) / Math.max(1, n - tail0));
    for (const x of [b.L, b.R, b.sendL, b.sendR]) x[i] *= g;
  }
  const mixL = new Float64Array(n), mixR = new Float64Array(n);
  const wet = 10 ** (-8 / 20);
  for (let i = 0; i < n; i++) {mixL[i] = b.L[i] + wet * b.sendL[i]; mixR[i] = b.R[i] + wet * b.sendR[i];}
  const env = D.peakEnv(mixL), er = D.peakEnv(mixR);
  for (let i = 0; i < n; i++) env[i] = Math.max(env[i], er[i]);
  let gain = 1;
  for (let k = 0; k < 4; k++) {
    const [l, r] = D.limit(mixL, mixR, env, gain, -6.4);
    gain *= 10 ** ((-16 - D.lufsRange(D.kPrefix(l), D.kPrefix(r), Math.max(0, Math.round(at(0))), Math.min(n, Math.round(at(ctx.length))))) / 20);
  }
  const [l, r] = D.limit(b.L, b.R, env, gain, -6.4);
  const [sl, sr] = D.limit(b.sendL, b.sendR, env, gain, -6.4);
  for (let i = 0; i < n; i++) {ctx.L[i0 + i] += l[i]; ctx.R[i0 + i] += r[i]; ctx.sendL[i0 + i] += sl[i]; ctx.sendR[i0 + i] += sr[i];}
}
