// Smooth camera paths for stations 9 and 10 (plain TS: imported by shot.ts → node scripts too).
// Non-uniform cubic Hermite through keys with Catmull-Rom tangents, so the camera GLIDES through keys instead of
// stopping at each one (engine `keyed` eases to rest at every key). `hold: true` = come to rest at that key.
import type {Shot, V3} from '../../engine/math.ts';

export type CamKey = {f: number; pos: V3; target: V3; fov?: number; hold?: boolean};

const herm = (p0: number, p1: number, m0: number, m1: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
};

export const glide = (keys: CamKey[], f: number): Shot => {
  const n = keys.length;
  if (f <= keys[0].f) return {pos: keys[0].pos, target: keys[0].target, fov: keys[0].fov ?? 40};
  if (f >= keys[n - 1].f) return {pos: keys[n - 1].pos, target: keys[n - 1].target, fov: keys[n - 1].fov ?? 40};
  let i = 0;
  while (keys[i + 1].f < f) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const dt = b.f - a.f;
  const u = (f - a.f) / dt;
  // tangent (per frame) at key j, scaled to this segment's duration. Fritsch–Carlson limited (monotone per axis),
  // so the camera never overshoots a key (no surprise push past a 1:1 reading distance).
  const tan = (j: number, get: (k: CamKey) => number) => {
    const k = keys[j];
    if (k.hold || j === 0 || j === n - 1) return 0;
    const p = keys[j - 1];
    const q = keys[j + 1];
    const d0 = (get(k) - get(p)) / (k.f - p.f);
    const d1 = (get(q) - get(k)) / (q.f - k.f);
    if (d0 * d1 <= 0) return 0;
    const m = (get(q) - get(p)) / (q.f - p.f);
    return Math.sign(m) * Math.min(Math.abs(m), 3 * Math.min(Math.abs(d0), Math.abs(d1))) * dt;
  };
  const ch = (get: (k: CamKey) => number) => herm(get(a), get(b), tan(i, get), tan(i + 1, get), u);
  const v = (sel: 'pos' | 'target'): V3 => [ch((k) => k[sel][0]), ch((k) => k[sel][1]), ch((k) => k[sel][2])];
  return {pos: v('pos'), target: v('target'), fov: ch((k) => k.fov ?? 40)};
};
