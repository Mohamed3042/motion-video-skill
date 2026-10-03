// Camera helpers for stations 4–6 (plain TS so shot.ts stays importable by node scripts).
import {catmull, clamp, lerp, lerp3, smoother, type Shot, type V3} from '../../engine/math.ts';

const DEG = Math.PI / 180;

/** A point on a sphere around `c`: azimuth (deg, 0 = +z, +90 = +x), elevation (deg), distance. */
export const orbitPos = (c: V3, az: number, el: number, d: number): V3 => [
  c[0] + d * Math.cos(el * DEG) * Math.sin(az * DEG),
  c[1] + d * Math.sin(el * DEG),
  c[2] + d * Math.cos(el * DEG) * Math.cos(az * DEG),
];

/** Smooth glide through several poses (Catmull-Rom on pos and target), eased over [f0, f1]. */
export const glide = (f: number, f0: number, f1: number, pos: V3[], target: V3[], fov: [number, number] = [40, 40], ease = smoother): Shot => {
  const t = ease(clamp((f - f0) / (f1 - f0)));
  return {pos: catmull(pos, t), target: catmull(target, t), fov: lerp(fov[0], fov[1], t)};
};

/** Blend two shots (t ∈ 0..1, already eased). */
export const mixShot = (a: Shot, b: Shot, t: number): Shot => ({
  pos: lerp3(a.pos, b.pos, t),
  target: lerp3(a.target, b.target, t),
  fov: lerp(a.fov ?? 40, b.fov ?? 40, t),
  roll: lerp(a.roll ?? 0, b.roll ?? 0, t),
});

/** Ease-in-out sine (gentle anticipation/glide). */
export const sine = (t: number) => (1 - Math.cos(Math.PI * clamp(t))) / 2;
