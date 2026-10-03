// Station 2 shared scene state (plain TS): globe size, the flat-disc → globe inflation, which country is in
// scope at a frame, and the globe's orientation. Used by GL.tsx (WebGL globe) and World.tsx (holograms).
import {clamp, prog, smoother, type V3} from '../../engine/math.ts';

export const RG = 460; // globe radius = stereokinetic disc radius
export const T = {
  drop: 0,
  promise: 40,
  titleOut: 84,
  tilt: [80, 118] as const, // camera rises: the "sphere" is a flat disc
  inflate: 120, // HIT: the disc becomes a real globe
  scope: 128, // scope hologram
  kw: 240, // HIT: Kuwait in scope, dossier
  sa: 360, // HIT: Saudi Arabia, stepper
  steps: [372, 384, 396, 408],
  out: 444, // whoosh
};

export const COUNTRIES = [
  {id: 'EG' as const, name: 'Egypt', city: 'Cairo', lon: 30.8, lat: 26.8},
  {id: 'KW' as const, name: 'Kuwait', city: 'Kuwait City', lon: 47.5, lat: 29.3},
  {id: 'SA' as const, name: 'Saudi Arabia', city: 'Riyadh', lon: 45.1, lat: 23.9},
];
export const selAt = (f: number) => (f < T.kw ? 0 : f < T.sa ? 1 : 2);

const backOut = (t: number) => {
  const x = clamp(t);
  return 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;
};
/** 0 = flat disc, 1 = full sphere (springs out of the disc on the hit). */
export const inflateAt = (f: number) => (f < T.inflate ? 0.015 : Math.max(0.015, backOut(prog(f, T.inflate, T.inflate + 34))));
/** exit: the globe collapses into a point */
export const collapseAt = (f: number) => 1 - smoother(prog(f, T.out + 2, T.out + 30));

/** Globe orientation (deg): longitude / latitude brought to face the camera (+z). */
export const viewAt = (f: number) => {
  const spin = 1 - smoother(prog(f, T.inflate - 6, T.inflate + 48)); // spins in while inflating
  const k1 = smoother(prog(f, T.kw, T.kw + 40));
  const k2 = smoother(prog(f, T.sa, T.sa + 40));
  const c = COUNTRIES;
  let lon = c[0].lon + (c[1].lon - c[0].lon) * k1 + (c[2].lon - c[1].lon) * k2;
  let lat = c[0].lat + (c[1].lat - c[0].lat) * k1 + (c[2].lat - c[1].lat) * k2;
  lon += -150 * spin + 6 * Math.sin(f * 0.008);
  lat += -8 * spin;
  return {lon: lon - 15, lat: lat - 2}; // the camera sits right of the globe: aim so the country faces it
};

const D = Math.PI / 180;
/** unit direction of (lon, lat) in the globe's own frame (matches three's SphereGeometry + equirect uv) */
export const dir = (lon: number, lat: number): V3 => [Math.cos(lat * D) * Math.cos(lon * D), Math.sin(lat * D), -Math.cos(lat * D) * Math.sin(lon * D)];

/** (lon, lat) → station-local position on the oriented, inflated globe (globe centre at the origin). */
export const onGlobe = (lon: number, lat: number, f: number, lift = 1.0): V3 => {
  const v = viewAt(f);
  const [x, y, z] = dir(lon, lat);
  // Ry(-(90 + lon0)) then Rx(lat0)
  const ry = -(90 + v.lon) * D;
  const x1 = x * Math.cos(ry) + z * Math.sin(ry);
  const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
  const rx = v.lat * D;
  const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
  const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
  const s = collapseAt(f);
  return [x1 * RG * lift * s, y2 * RG * lift * s, z2 * RG * lift * inflateAt(f) * s];
};
