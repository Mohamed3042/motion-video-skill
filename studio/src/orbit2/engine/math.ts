// Job Orbit v2 engine: tiny vector math. Plain TS (no JSX, no three) so node scripts can import it too.
// World space: x right, y UP, z toward the viewer (three.js convention). 1 unit = 1 CSS px at the 1:1 plane.

export type V3 = [number, number, number];

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const smoother = (t: number) => {
  const x = clamp(t);
  return x * x * x * (x * (6 * x - 15) + 10);
};
/** Rotate a vector about the world Y axis by `a` radians (right-handed: +a turns +z toward +x). */
export const rotY = (v: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
};

/**
 * A camera pose. `pos` and `target` are in the coordinate space of whoever returns it
 * (a section returns LOCAL coords; the engine converts to world). fov is vertical, in degrees.
 * `focus` (optional) = distance from the camera that is perfectly sharp for depth-of-field helpers.
 */
export type Shot = {pos: V3; target: V3; fov?: number; roll?: number; focus?: number};

/**
 * Keyframed camera helper for sections: piecewise smoother-step interpolation between keys.
 * Keys must be sorted by f. Before the first / after the last key the end pose holds
 * (sections should still provide keys covering [-24, length + 24] so flights have somewhere to come from / go to).
 */
export type Key = {f: number} & Shot;
export const keyed = (keys: Key[], f: number, ease: (t: number) => number = smoother): Shot => {
  if (f <= keys[0].f) return keys[0];
  const last = keys[keys.length - 1];
  if (f >= last.f) return last;
  let i = 0;
  while (keys[i + 1].f < f) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = ease((f - a.f) / (b.f - a.f));
  return {
    pos: lerp3(a.pos, b.pos, t),
    target: lerp3(a.target, b.target, t),
    fov: lerp(a.fov ?? 40, b.fov ?? 40, t),
    roll: lerp(a.roll ?? 0, b.roll ?? 0, t),
    focus: a.focus !== undefined || b.focus !== undefined ? lerp(a.focus ?? len(sub(a.target, a.pos)), b.focus ?? len(sub(b.target, b.pos)), t) : undefined,
  };
};

/** Catmull-Rom through points (uniform), t in [0,1] across the whole list. Good for long smooth camera drifts. */
export const catmull = (pts: V3[], t: number): V3 => {
  const n = pts.length - 1;
  const x = clamp(t) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const u = x - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(n, i + 2)];
  const c = (k: number) =>
    0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u);
  return [c(0), c(1), c(2)];
};

/** Default 1:1 distance: a plane at this distance from a fov-degree camera shows 1 unit = 1 px (1080 px tall frame). */
export const oneToOne = (fov = 40, H = 1080) => (0.5 * H) / Math.tan(((fov / 2) * Math.PI) / 180);

export const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
