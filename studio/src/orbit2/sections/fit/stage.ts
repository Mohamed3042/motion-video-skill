// 05 · Your fit — the Adelson set (plain TS, shared by GL, World and shot): a 6×6 checkerboard lit by one lamp, a
// cylinder casting a real (analytic, ray-cast) shadow, and the two probe tiles A (dark, lit) and B (light, shadowed).
// The dark albedo is SOLVED so that A and B render to the same grey (see `shade`): that is the tuning, not a fake.
import {clamp, prog, smoother, type V3} from '../../engine/math.ts';

export const T = 150; // tile size
export const N = 6;
export const THICK = 50;
export const LAMP: V3 = [900, 760, -900];
export const CYL = {x: 269, z: -154, r: 150, h: 270};
export const AMB = 0.26;
export const DIR = 0.58;
export const LIGHT_ALBEDO: V3 = [0.84, 0.855, 0.89];

export const tileCenter = (i: number, j: number): V3 => [(i - 2.5) * T, 0, (j - 2.5) * T];
export const isLight = (i: number, j: number) => (i + j) % 2 === 0;
export const A_IJ = [2, 1] as const; // dark tile, in the light
export const B_IJ = [3, 3] as const; // light tile, in the shadow
export const A_POS = tileCenter(...A_IJ);
export const B_POS = tileCenter(...B_IJ);
export const AB_MID: V3 = [(A_POS[0] + B_POS[0]) / 2, 0, (A_POS[2] + B_POS[2]) / 2];
/** Camera azimuth (deg) at which A and B sit side by side at equal depth (view ⟂ A→B), A on the left. */
export const AZ_SIDE = (Math.atan2(-(B_POS[2] - A_POS[2]), B_POS[0] - A_POS[0]) * 180) / Math.PI;

// ---- the lighting model (mirrored exactly in the GL shader) ----
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Cylinder occlusion of the ray P→LAMP (0 = lit, 1 = umbra), soft penumbra growing with distance to the occluder. */
export const occlusion = (P: V3) => {
  const D: V3 = [LAMP[0] - P[0], LAMP[1] - P[1], LAMP[2] - P[2]];
  const t0 = clamp((0 - P[1]) / D[1]);
  const t1 = clamp((CYL.h - P[1]) / D[1]);
  const qx = P[0] - CYL.x;
  const qz = P[2] - CYL.z;
  const dd = D[0] * D[0] + D[2] * D[2];
  const ts = Math.min(t1, Math.max(t0, -(qx * D[0] + qz * D[2]) / dd));
  const d = Math.hypot(qx + ts * D[0], qz + ts * D[2]);
  const s = 6 + 0.12 * ts * Math.hypot(...D);
  return 1 - smoothstep(CYL.r - s, CYL.r + s, d);
};
/** Light reaching a top-face point (before albedo). */
export const irradiance = (P: V3) => {
  const L: V3 = [LAMP[0] - P[0], LAMP[1] - P[1], LAMP[2] - P[2]];
  const dist = Math.hypot(...L);
  const diff = Math.max(0, L[1] / dist);
  const att = Math.pow(2300 / dist, 0.5);
  return AMB + DIR * diff * att * (1 - occlusion(P));
};
// Solve the dark albedo so rendered(A) == rendered(B) at the tile centres.
const kA = irradiance(A_POS);
const kB = irradiance(B_POS);
export const DARK_ALBEDO: V3 = LIGHT_ALBEDO.map((c) => (c * kB) / kA) as V3;
export const AB_GREY = LIGHT_ALBEDO.map((c) => c * kB) as V3; // the shared rendered value (display 0..1)

// ---- choreography ----
export const DROP = [186, 212] as const; // the context falls away
export const LIFT = [194, 228] as const; // the caster lifts
export const JOIN = [206, 230] as const; // A and B glide edge to edge
export const caster = (f: number) => smoother(prog(f, LIFT[0], LIFT[1]));
/** Per-tile drop progress (0 home … 1 gone), staggered outward from the AB midpoint. */
export const dropOf = (i: number, j: number, f: number) => {
  if ((i === A_IJ[0] && j === A_IJ[1]) || (i === B_IJ[0] && j === B_IJ[1])) return 0;
  const c = tileCenter(i, j);
  const r = Math.hypot(c[0] - AB_MID[0], c[2] - AB_MID[2]);
  const a = DROP[0] + r * 0.02;
  return clamp((f - a) / (DROP[1] - DROP[0]));
};
/** A / B slide toward each other (rotating to align with the view) until they touch. */
export const join = (f: number) => smoother(prog(f, JOIN[0], JOIN[1]));
const sideDir = (() => {
  const v = [B_POS[0] - A_POS[0], B_POS[2] - A_POS[2]];
  const l = Math.hypot(v[0], v[1]);
  return [v[0] / l, v[1] / l];
})();
const GAP = Math.hypot(B_POS[0] - A_POS[0], B_POS[2] - A_POS[2]);
/** Extra yaw (deg) that turns a tile edge parallel to the A→B direction. */
export const JOIN_YAW = (() => {
  const a = (Math.atan2(sideDir[1], sideDir[0]) * 180) / Math.PI; // angle of A→B from +x (toward +z)
  const m = ((a % 90) + 90) % 90;
  return m > 45 ? 90 - m : -m;
})();
export const probePos = (which: 'A' | 'B', f: number): V3 => {
  const j = join(f);
  const s = ((GAP - T) / 2) * j * (which === 'A' ? 1 : -1);
  const base = which === 'A' ? A_POS : B_POS;
  const lift = 40 * smoother(prog(f, DROP[0], DROP[1]));
  return [base[0] + sideDir[0] * s, base[1] + lift, base[2] + sideDir[1] * s];
};
