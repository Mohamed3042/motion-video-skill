// Camera helper for stations 1–3 (plain TS: imported by shot.ts files). A pose is an ORBIT around a pivot
// (`at`), so moves between keys sweep along arcs instead of cutting straight lines. Every parameter is
// interpolated with a cubic Hermite spline (Catmull-Rom tangents) so the camera glides THROUGH keys;
// `hold: true` zeroes the tangent at a key (anticipate → settle → glide on).
import type {Shot, V3} from '../../engine/math.ts';

export type OrbitKey = {
  f: number;
  at: V3; // pivot the camera looks at
  yaw: number; // deg, 0 = camera on +z of the pivot, +90 = on +x
  pitch: number; // deg, + = camera above the pivot
  dist: number;
  fov?: number;
  roll?: number;
  hold?: boolean;
};

const D2R = Math.PI / 180;

const hermite = (fs: number[], vs: number[], holds: boolean[], f: number) => {
  const n = fs.length;
  if (f <= fs[0]) return vs[0];
  if (f >= fs[n - 1]) return vs[n - 1];
  let i = 0;
  while (fs[i + 1] < f) i++;
  const tan = (k: number) => {
    if (holds[k] || k === 0 || k === n - 1) return 0;
    return (vs[k + 1] - vs[k - 1]) / (fs[k + 1] - fs[k - 1]);
  };
  const h = fs[i + 1] - fs[i];
  const t = (f - fs[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * vs[i] + (t3 - 2 * t2 + t) * h * tan(i) + (-2 * t3 + 3 * t2) * vs[i + 1] + (t3 - t2) * h * tan(i + 1);
};

export const orbit = (keys: OrbitKey[], f: number): Shot => {
  const fs = keys.map((k) => k.f);
  const holds = keys.map((k) => !!k.hold);
  const v = (g: (k: OrbitKey) => number) => hermite(fs, keys.map(g), holds, f);
  const at: V3 = [v((k) => k.at[0]), v((k) => k.at[1]), v((k) => k.at[2])];
  const yaw = v((k) => k.yaw) * D2R;
  const pitch = v((k) => k.pitch) * D2R;
  const dist = v((k) => k.dist);
  const pos: V3 = [at[0] + dist * Math.sin(yaw) * Math.cos(pitch), at[1] + dist * Math.sin(pitch), at[2] + dist * Math.cos(yaw) * Math.cos(pitch)];
  return {pos, target: at, fov: v((k) => k.fov ?? 40), roll: v((k) => k.roll ?? 0)};
};
