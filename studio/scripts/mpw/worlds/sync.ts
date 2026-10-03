// World 2 · Sync: four offset stems find the shared grid. The picture's offsetPx is also their audio delay.
// C1 / kick locks at 120, ZOOM / bass at 240, C3 / pluck at 360, C2 / pad at 480; the melody then nudges and returns.
import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {EVENTS, PX_MS, T, offsetPx} from '../../../src/mpw/worlds/sync/timing.ts';

const THEME = [74, 77, 81, 79, 77, 76, 74, 72];
const ROOTS = [38, 38, 34, 36, 38, 34, 41, 36];
const CHORDS = [[50, 57, 62, 65], [50, 57, 60, 64], [46, 53, 57, 62], [48, 55, 58, 62], [50, 57, 62, 65], [46, 53, 57, 62], [53, 60, 64, 67], [48, 55, 57, 62]];

export default function render(ctx: SynthCtx) {
  const i0 = Math.max(0, Math.floor(ctx.at(-15)));
  const n = Math.min(ctx.L.length, Math.ceil(ctx.at(ctx.length + 30))) - i0;
  const b = D.makeOut(n);
  const at = (f: number) => ctx.at(f) - i0;
  const driftFrame = (lane: number, f: number) => f + offsetPx(lane, f) * PX_MS * 60 / 1000;
  const soundAt = (lane: number, f: number) => at(driftFrame(lane, f));
  const impacts = EVENTS.filter((e) => e.kind === 'hit' || e.kind === 'impact');
  const guard = (lane: number, f: number) => {
    const sf = driftFrame(lane, f);
    return !impacts.some((e) => sf < e.f && sf >= e.f - 4.2);
  };

  // All four voices arrive in the first bar, each at the offset shown on its camera lane.
  // Before a lock the same phrase drifts; after it its beat events share the precise 30-frame grid.
  for (let beat = 0; beat < 32; beat++) {
    const f = beat * 30;
    const bar = Math.floor(beat / 4);
    if (guard(0, f)) D.kick(b, soundAt(0, f), f < T.sync ? 0.2 : 0.25);
    if (guard(0, f + 15)) D.hat(b, soundAt(0, f + 15), f < T.sync ? 0.025 : 0.05, beat % 4 === 3, 0.35);
    if (f >= 90 && guard(3, f)) {
      D.bassPulse(b, soundAt(3, f), ROOTS[bar] + (beat % 4 === 3 ? 7 : 0), 0.27, f < T.sync ? 0.12 : 0.19);
    }
    if (f >= 60 && guard(2, f)) {
      D.pluck(b, soundAt(2, f), THEME[beat % 8], f < T.sync ? 0.13 : 0.2, -0.35, 0.16, 0.65, 0.996);
      // A soft electronic tine keeps the melody legible among the four drifting voices.
      D.bell(b, soundAt(2, f), THEME[beat % 8] + 12, 0.014, 0.25, -0.35, 2, 0.5, 0.06);
    }
    if (f >= 30 && guard(1, f)) {
      D.pad(b, soundAt(1, f), CHORDS[bar], 0.25, f < T.sync ? 0.09 : 0.16, {lp0: 850, lp1: f < T.sync ? 1700 : 2900, att: 0.035, rel: 0.13, send: 0.2});
    }
    if (f >= T.sync && beat % 2 === 1 && guard(0, f)) D.clap(b, soundAt(0, f), 0.085, 0.15);
  }

  // Coarse voting, fine windows and measured drift each have a distinct small sound.
  T.votes.forEach((f, k) => D.clack(b, at(f), 0.075, -0.45 + k * 0.09, 1500 + (k % 3) * 420));
  D.tick(b, at(T.win), 0.095, 93, 0.2);
  T.windows.forEach((f, k) => D.tick(b, at(f), 0.075, [86, 89, 93, 98][k], -0.3 + k * 0.2));
  D.bell(b, at(T.peak), 98, 0.065, 0.4, 0.25, 2, 0.6, 0.08);
  D.square(b, at(T.drift), 81, 0.12, 0.026, 0.25, 0.4, 0.05);
  D.riser(b, at(T.sync - 48), at(T.sync) - 0.06 * ctx.SR, 0.09, 500, 7000);
  D.tick(b, at(T.nudge), 0.08, 96, -0.4);
  // The C3 melody audibly slips by the same one-beat visual nudge; a brief noisy edge marks the broken word.
  D.put(b, at(T.nudge), (T.back - T.nudge) / 60 - 0.06, -0.35, 0.02, (t, rnd) => 0.018 * (rnd() * 2 - 1) * Math.min(1, t / 0.012) * Math.max(0, 1 - t / 0.44));
  D.whoosh(b, at(T.zoomOut), 0.065, 0.36, 0.16, 0.06, -0.5, 0.5);
  T.groups.forEach((f, k) => {
    D.clack(b, at(f), 0.08, -0.35 + k * 0.35, 1700);
    D.bell(b, at(f), [77, 81, 86][k], 0.065, 0.42, -0.35 + k * 0.35, 2, 0.6, 0.1);
  });
  D.tick(b, at(T.review), 0.07, 79, 0.5);
  D.whoosh(b, at(T.zoomIn), 0.055, 0.3, 0.12, 0.06, 0.5, -0.5);
  D.revSwell(b, at(T.tiles), 0.4, 0.055);

  // Waiting for the grid: every lock clears 60 ms of dry bed and 250 ms of reverb send, then lands on its frame.
  for (const e of impacts) {
    const s = Math.round(at(e.f));
    for (const x of [b.L, b.R, b.sendL, b.sendR]) {
      const gap = x === b.sendL || x === b.sendR ? 0.25 : 0.06;
      const a = s - Math.round(gap * ctx.SR), fade = Math.round(0.01 * ctx.SR);
      for (let i = Math.max(0, a - fade); i < Math.min(n, s); i++) {
        const g = i < a ? 0.035 + 0.965 * 0.5 * (1 + Math.cos(Math.PI * (i - a + fade) / fade)) : 0.035;
        x[i] *= g;
      }
    }
    const big = e.f === T.sync;
    D.tick(b, s, big ? 0.15 : 0.11, e.f === 120 ? 86 : e.f === 240 ? 89 : e.f === 360 ? 93 : 98, 0);
    D.thump(b, s, big ? 0.36 : 0.25);
    if (big) {
      D.hit(b, s, 0.2);
      D.boom(b, s, 0.12, 1.7);
      D.rhodesChord(b, s, [50, 57, 62, 65, 69], 1.6, 0.1, 0.15);
    }
    if (e.f === T.back) D.bell(b, s, 98, 0.05, 0.5, -0.25, 2, 0.8, 0.1);
  }

  const tail0 = Math.round(at(ctx.length));
  for (let i = Math.max(0, tail0); i < n; i++) {
    const g = 0.5 + 0.5 * Math.cos(Math.PI * (i - tail0) / Math.max(1, n - tail0));
    for (const x of [b.L, b.R, b.sendL, b.sendR]) x[i] *= g;
  }
  const mixL = new Float64Array(n), mixR = new Float64Array(n), wet = 10 ** (-8 / 20);
  for (let i = 0; i < n; i++) {mixL[i] = b.L[i] + wet * b.sendL[i]; mixR[i] = b.R[i] + wet * b.sendR[i];}
  const env = D.peakEnv(mixL), er = D.peakEnv(mixR);
  for (let i = 0; i < n; i++) env[i] = Math.max(env[i], er[i]);
  let gain = 1;
  for (let k = 0; k < 4; k++) {
    const [l, r] = D.limit(mixL, mixR, env, gain, -6.4);
    gain *= 10 ** ((-16 - D.lufsRange(D.kPrefix(l), D.kPrefix(r), Math.max(0, Math.round(at(0))), Math.min(n, Math.round(at(ctx.length))))) / 20);
  }
  const [l, r] = D.limit(b.L, b.R, env, gain, -6.4), [sl, sr] = D.limit(b.sendL, b.sendR, env, gain, -6.4);
  for (let i = 0; i < n; i++) {ctx.L[i0 + i] += l[i]; ctx.R[i0 + i] += r[i]; ctx.sendL[i0 + i] += sl[i]; ctx.sendR[i0 + i] += sr[i];}
}
