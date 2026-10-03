// 06 · Next proof — camera (local coords). Descend to rail level → hold the Ponzo view (rails converge to the planet,
// two identical step-bars hang at the SAME depth) → fly down the rails while the bars swing level, side by side →
// rise slightly to the proof holograms at 1:1 → climb out over the rails.
import {clamp, lerp, oneToOne, prog, smoother, type Shot, type V3} from '../../engine/math.ts';
import {glide, sine} from '../focus/cam.ts';

export const D = oneToOne(40);
export const FY = -500; // rail floor
const DEG = Math.PI / 180;
export const PITCH0 = 11.25; // horizon 295 px above centre: the classic Ponzo framing
const Z0 = 2200;

/** Camera on the rail axis: z, eye height above the floor, pitch down (deg). */
export const railCam = (z: number, h: number, pitch: number, x = 0): Shot => ({
  pos: [x, FY + h, z],
  target: [x, FY + h - Math.sin(pitch * DEG) * 1000, z - Math.cos(pitch * DEG) * 1000],
  fov: 40,
});

export const FLY = [122, 200] as const;
const flyCam = (f: number): Shot => {
  const ramp = Math.min(f - 50, 70);
  const zPush = Z0 - 100 * (ramp / 70) ** 1.6 - 2.29 * Math.max(0, f - 120);
  const u = smoother(prog(f, FLY[0], FLY[1]));
  return railCam(zPush - 3500 * u - 1.6 * Math.max(0, f - FLY[1]), lerp(500, 420, u), lerp(PITCH0, 3, u));
};

export const HERO_Z = -1980;
export const HERO_H = 470;
const HERO = railCam(HERO_Z, HERO_H, 0);
const HERO_END = railCam(HERO_Z - 70, HERO_H - 12, 0, 36);
/** Hologram plane centre (pixel-exact at the hero pose). */
export const HOLO_C: V3 = [0, FY + HERO_H, HERO_Z - D];

export const shot = (f: number): Shot => {
  if (f < 50) {
    const P0 = railCam(Z0, 500, PITCH0);
    return glide(f, -24, 50, [[520, 1500, 5000], [200, 520, 3500], P0.pos], [[0, -300, 900], [0, -240, 1900], P0.target], [40, 40], sine);
  }
  if (f < 240) return flyCam(f);
  if (f < 300) {
    const a = flyCam(240);
    return glide(f, 240, 300, [a.pos, [0, FY + 470, HERO_Z + 60], HERO.pos], [a.target, [0, FY + 455, HERO_Z - 940], HERO.target]);
  }
  if (f < 444) {
    const t = sine((f - 300) / 144);
    return {pos: [lerp(0, 36, t), lerp(HERO.pos[1], HERO_END.pos[1], t), lerp(HERO_Z, HERO_Z - 70, t)], target: [lerp(0, 36, t), lerp(HERO.target[1], HERO_END.target[1], t), lerp(HERO.target[2], HERO_END.target[2], t)], fov: 40};
  }
  // exit: climb and tip down over the rails, accelerating into the hop
  const t = clamp((f - 444) / 60);
  const e = t * t * (1.6 - 0.6 * t);
  const p = HERO_END.pos;
  return {pos: [lerp(p[0], 0, e), lerp(p[1], p[1] + 900, e), lerp(p[2], p[2] - 1500, e)], target: [lerp(36, 0, e), lerp(HERO_END.target[1], FY, e), lerp(HERO_END.target[2], p[2] - 3200, e)], fov: 40};
};
