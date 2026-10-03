// 05 · Your fit — camera (local coords). Descend onto the lit checkerboard in the classic Adelson three-quarter view →
// ORBIT ~83° (and push in) until tiles A and B sit side by side at equal depth, centred → hold while the context falls
// away → rise to the fit hologram at 1:1 → dive out.
import {clamp, lerp, oneToOne, smoother, type Shot, type V3} from '../../engine/math.ts';
import {glide, orbitPos, sine} from '../focus/cam.ts';
import {AB_MID, AZ_SIDE} from './stage.ts';

const D = oneToOne(40);
const O: V3 = [0, -20, 0];
const AZ0 = 30;
const EL0 = 33;
const R0 = 2150;
const EL1 = 31;
const R1 = 1240;
const CANON = orbitPos(O, AZ0, EL0, R0);
const T0: V3 = [230, 190, -230]; // canonical look point: board centre-right, lamp in frame

/** The orbit to the side-by-side view (azimuth, elevation, distance and target all interpolate on the sphere). */
const orbitAt = (f: number): Shot => {
  const t = smoother(clamp((f - 116) / (184 - 116)));
  const push = sine(clamp((f - 184) / 64)); // slow push after the alignment (keeps A/B symmetric about centre)
  const tgt: V3 = [lerp(T0[0], AB_MID[0], t), lerp(T0[1], 10, t) + 30 * push, lerp(T0[2], AB_MID[2], t)];
  const ctr: V3 = [lerp(O[0], AB_MID[0], t), lerp(O[1], 10, t) + 30 * push, lerp(O[2], AB_MID[2], t)];
  return {pos: orbitPos(ctr, lerp(AZ0, AZ_SIDE, t), lerp(EL0, EL1, t) - 4 * push, lerp(R0, R1, t) - 400 * push), target: tgt, fov: 40};
};

/** Hologram frame: floats above the AB midpoint, facing the side-by-side camera direction. */
export const HOLO_C: V3 = [AB_MID[0], 470, AB_MID[2]];
export const HOLO_YAW = AZ_SIDE;
const dir: V3 = [Math.sin((AZ_SIDE * Math.PI) / 180), 0, Math.cos((AZ_SIDE * Math.PI) / 180)];
const right: V3 = [dir[2], 0, -dir[0]];
const at = (fwd: number, side: number, up: number): V3 => [HOLO_C[0] + dir[0] * fwd + right[0] * side, HOLO_C[1] + up, HOLO_C[2] + dir[2] * fwd + right[2] * side];
const HERO0 = at(D + 60, -50, 10);
const HERO1 = at(D - 30, 50, -6);

export const shot = (f: number): Shot => {
  if (f < 116) return glide(f, -24, 116, [orbitPos(O, 40, 46, 2900), orbitPos(O, 34, 41, 2300), CANON], [[200, 160, -200], [220, 140, -220], T0], [40, 40], sine);
  if (f < 240) return orbitAt(f);
  if (f < 300) return glide(f, 240, 300, [orbitAt(240).pos, at(D + 300, -120, 160), HERO0], [orbitAt(240).target, at(0, -60, -120), at(0, -50, 10)]);
  if (f < 444) {
    const t = sine((f - 300) / 144);
    return {pos: [lerp(HERO0[0], HERO1[0], t), lerp(HERO0[1], HERO1[1], t), lerp(HERO0[2], HERO1[2], t)], target: at(0, lerp(-50, 50, t), lerp(10, -6, t)), fov: 40};
  }
  // exit: tip down and dive across the board toward the horizon (the floor becomes the next station's rails)
  const t = clamp((f - 444) / 60);
  const e = t * t * (1.6 - 0.6 * t);
  return {pos: [lerp(HERO1[0], at(D - 700, 50, -280)[0], e), lerp(HERO1[1], at(D - 700, 50, -280)[1], e), lerp(HERO1[2], at(D - 700, 50, -280)[2], e)], target: at(lerp(0, -2600, e), lerp(50, 0, e), lerp(-6, -900, e)), fov: 40};
};
