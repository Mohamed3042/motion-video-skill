// 06 · Next proof — the Ponzo set (plain TS, shared by GL and World). Two IDENTICAL step-bars hang in front of the
// camera at the same depth (the 1:1 plane, so 1 unit = 1 px): stacked A over B in the Ponzo view, then swung level,
// side by side, as the camera flies down the rails. Their placement is derived from the camera itself.
import {add, cross, mul, norm, prog, smoother, sub, type V3} from '../../engine/math.ts';
import {D, FLY, shot} from './shot.ts';

export const BAR_LEN = 330;
export const BAR_TH = 24;
export const RAIL_X = 400;
export const TIE_STEP = 230;
export const RAIL_Z: [number, number] = [-7800, 2800];

/** Camera basis for frame f (right, up, forward) + position. */
export const camBasis = (f: number) => {
  const s = shot(f);
  const fw = norm(sub(s.target, s.pos));
  const right = norm(cross(fw, [0, 1, 0]));
  const up = cross(right, fw);
  return {pos: s.pos, fw, right, up};
};

/** Bar offsets in camera space (x right, y up, px at the 1:1 plane). */
export const barOffset = (which: 'A' | 'B', f: number): [number, number] => {
  const u = smoother(prog(f, FLY[0] + 2, FLY[1] - 4));
  const arc = Math.sin(Math.PI * u);
  const x = (which === 'A' ? -1 : 1) * 215 * u + (which === 'A' ? -60 : 60) * arc * 0.4;
  const y = which === 'A' ? 150 + (40 - 150) * u + 30 * arc : -185 + (40 + 185) * u - 30 * arc;
  return [x, y];
};
/** After the reveal the bars sink away under the holograms. */
export const barExit = (f: number) => smoother(prog(f, 238, 276));

export const barPos = (which: 'A' | 'B', f: number): V3 => {
  const b = camBasis(f);
  const [x, y] = barOffset(which, f);
  const drop = barExit(f);
  return add(add(add(b.pos, mul(b.fw, D + 300 * drop)), mul(b.right, x)), mul(b.up, y - 360 * drop));
};
/** Pitch of the camera (rad, positive = looking down) — bars face the camera. */
export const camPitch = (f: number) => Math.asin(-camBasis(f).fw[1]);
