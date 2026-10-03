// 04 · Job focus — camera (local coords; +z away from the planet).
// Arrive past the in-scene title → settle on the role sphere → ORBIT IT AT A CONSTANT DISTANCE while the noise drifts away
// (so its screen size provably never changes: the Ebbinghaus reveal) → truck to the hologram plane at 1:1 → push out.
import {clamp, lerp, oneToOne, smoother, type Shot, type V3} from '../../engine/math.ts';
import {glide, orbitPos, sine} from './cam.ts';

export const S: V3 = [0, 0, 0]; // the role sphere
export const HOLO_Z = 300; // hologram plane (pixel-exact at the hero pose)
export const R_ORBIT = 1650; // constant camera distance to the role sphere during the swap
const D = oneToOne(40);

const AZ0 = -15;
const AZ1 = 12;
const EL0 = 15;
const EL1 = 9;
const orbitAt = (f: number): V3 => {
  const t = smoother(clamp((f - 116) / (210 - 116)));
  const drift = 0.05 * (f - 116); // keeps gliding (never parks) while the caption reads
  return orbitPos(S, AZ0 + (AZ1 - AZ0) * t + Math.max(0, drift), EL0 + (EL1 - EL0) * t, R_ORBIT);
};
const ORB0 = orbitAt(116);
const ORB_END = orbitAt(240);
const HERO0: V3 = [-40, 14, HOLO_Z + D + 50];
const HERO1: V3 = [30, -8, HOLO_Z + D - 34];

export const shot = (f: number): Shot => {
  if (f < 116)
    return glide(
      f,
      -24,
      116,
      [[-760, 560, 3300], [-600, 470, 2400], ORB0],
      [[-400, 170, 0], [-260, 110, 0], S],
      [40, 40],
      sine,
    );
  if (f < 240) return {pos: orbitAt(f), target: S, fov: 40};
  if (f < 300) return glide(f, 240, 300, [ORB_END, HERO0], [S, [-40, 14, HOLO_Z]]);
  if (f < 444) {
    const t = sine((f - 300) / 144);
    return {pos: [lerp(HERO0[0], HERO1[0], t), lerp(HERO0[1], HERO1[1], t), lerp(HERO0[2], HERO1[2], t)], target: [lerp(-40, 30, t), lerp(14, -8, t), HOLO_Z], fov: 40};
  }
  // exit: accelerate forward through the gap where the panels swung away, toward the guiding star
  const t = clamp((f - 444) / 60);
  const e = t * t * (1.6 - 0.6 * t);
  return {pos: [lerp(HERO1[0], 260, e), lerp(HERO1[1], 220, e), lerp(HERO1[2], HOLO_Z + 200, e)], target: [lerp(30, 340, e), lerp(-8, 260, e), lerp(HOLO_Z, -2600, e)], fov: 40};
};
