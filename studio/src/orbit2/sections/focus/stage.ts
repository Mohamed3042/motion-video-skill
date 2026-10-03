// 04 · Job focus — the Ebbinghaus set, shared by World (CSS) and GL. Plain TS, frame-driven, seeded.
import {clamp, lerp, mulberry32, prog, smoother, type V3} from '../../engine/math.ts';
import {S} from './shot.ts';

export const ROLE_R = 80; // the role sphere — never changes size
export const SWAP = 120; // the hit: noise starts drifting away, calm spheres arrive

const rnd = mulberry32(404);
// Giant noise spheres: a tight Ebbinghaus ring of big inducers (+ a few huge ones in front/behind for depth).
export const NOISE = Array.from({length: 7}, (_, i) => {
  const a = (i / 7) * Math.PI * 2 + 0.35;
  return {a, ring: 440 + rnd() * 24, r: 140 + rnd() * 26, z: (rnd() - 0.5) * 140, out: 1500 + rnd() * 500, dz: i % 3 === 0 ? 700 : -900 - rnd() * 900, spin: rnd() * 6};
});
export const NOISE_FAR = Array.from({length: 6}, (_, i) => {
  const a = (i / 6) * Math.PI * 2 + rnd() * 0.6;
  const front = i % 2 === 0;
  return {a, ring: front ? 1050 + rnd() * 250 : 1300 + rnd() * 500, r: front ? 210 + rnd() * 90 : 260 + rnd() * 160, z: front ? 650 + rnd() * 250 : -1300 - rnd() * 900};
});
export const CALM = Array.from({length: 10}, (_, i) => ({a: (i / 10) * Math.PI * 2 + 0.15, r: 31, ring: 168}));

const ringRot = (f: number) => f * 0.0016;

/** Where the whole sphere stage sits (it recedes behind the holograms after the reveal). */
export const stageOffset = (f: number): V3 => {
  const t = smoother(prog(f, 236, 312));
  return [lerp(0, 760, t), lerp(0, 330, t), lerp(0, -2300, t)];
};

export const noisePos = (i: number, f: number): V3 => {
  const n = NOISE[i];
  const t = smoother(prog(f, SWAP + i * 5, SWAP + 74 + i * 5));
  const a = n.a + ringRot(f) + t * 0.5;
  const ring = lerp(n.ring, n.out, t);
  return [S[0] + Math.cos(a) * ring, S[1] + Math.sin(a) * ring, S[2] + n.z + t * n.dz];
};
export const noiseFarPos = (i: number, f: number): V3 => {
  const n = NOISE_FAR[i];
  const t = smoother(prog(f, SWAP - 6 + i * 4, SWAP + 70 + i * 4));
  const a = n.a + ringRot(f) * 0.6;
  const ring = n.ring * (1 + 0.9 * t);
  return [S[0] + Math.cos(a) * ring, S[1] + Math.sin(a) * ring * 0.8, S[2] + n.z + (n.z > 0 ? 500 : -900) * t];
};
/** Calm spheres fly in from depth and settle (slight overshoot) around the role sphere. */
export const calmPos = (i: number, f: number): V3 => {
  const c = CALM[i];
  const p = clamp((f - (SWAP + 18 + i * 3)) / 62);
  const e = p >= 1 ? 1 : 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2; // back-out
  const a = c.a - ringRot(f) * 0.8 + (1 - e) * 1.4;
  const ring = lerp(820, c.ring, e);
  return [S[0] + Math.cos(a) * ring, S[1] + Math.sin(a) * ring, S[2] + lerp(-2200, 0, clamp(e))];
};
export const calmVisible = (i: number, f: number) => f >= SWAP + 18 + i * 3;
