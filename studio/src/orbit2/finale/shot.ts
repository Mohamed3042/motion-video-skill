// Finale camera (world coords; the finale's placement is the identity).
// 0–110: pull back and up from station 10 to reveal the whole system, then a slow high sweep (≈110° of yaw)
// while the stations light one per beat; 286–356: swoop down and round onto the logo view, landing at the lock
// (6480); RISE: back off so the logo sits high and small for the end card; then a slow ease-in to the fade.
import type {FlightIn} from '../engine/camera.ts';
import {PLACEMENT, toWorld} from '../engine/layout.ts';
import {add, clamp, lerp, lerp3, oneToOne, smooth, smoother, type Shot, type V3} from '../engine/math.ts';
import {LOGO_D, LOGO_FOV} from '../shell/orbit.ts';
import {FINALE} from '../timing.ts';
import {CONVERGE, LOGO_LOCK, RISE} from './timing.ts';

export const FLIGHT_IN: FlightIn = {len: 24, arc: 0.1, fovPunch: 8};

const D2R = Math.PI / 180;
const F0 = FINALE.start;
const L = (g: number) => g - F0; // global → local
const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const inOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

const PL = PLACEMENT.anywhere;
const NEAR10: Shot = {pos: toWorld(PL, [0, 160, 2300]), target: toWorld(PL, [0, 0, 0]), fov: 40};
/** Orbit pose around the planet: yaw (deg), elevation (deg), distance, looking at (0, ty, 0). */
const orbitPose = (yaw: number, elev: number, dist: number, ty: number): Shot => {
  const h = dist * Math.cos(elev * D2R);
  return {pos: [h * Math.sin(yaw * D2R), dist * Math.sin(elev * D2R), h * Math.cos(yaw * D2R)], target: [0, ty, 0], fov: 40};
};
const yaw10 = (PL.yaw * 180) / Math.PI;

/** End-card framing: the logo (planet) high and small, as v1 (centre y 300, 300 px box). */
const P30 = oneToOne(LOGO_FOV);
export const CARD_D = (LOGO_D * 500) / 300;
export const CARD_SHOT: Shot = {pos: [0, 0, CARD_D], target: [0, -(240 / P30) * CARD_D, 0], fov: LOGO_FOV};
const LOCK_SHOT: Shot = {pos: [0, 0, LOGO_D], target: [0, 0, 0], fov: LOGO_FOV};

export const shot = (f: number): Shot => {
  const g = f + F0;
  // 1) reveal: pull back and up from station 10 into the high sweep
  const rev = inOut(prog(f, 0, 120));
  const sweep = smoother(prog(f, 40, L(CONVERGE) + 10));
  const yaw = lerp(yaw10 + 6, yaw10 + 6 + 112, sweep);
  const elev = lerp(14, 33, smooth(prog(f, 20, 260)));
  const dist = lerp(15500, 27500, inOut(prog(f, 10, 200)));
  const wide = orbitPose(yaw, elev, dist, lerp(1200, -600, sweep));
  let pos = lerp3(NEAR10.pos, wide.pos, rev);
  let target = lerp3(NEAR10.target, wide.target, rev);
  let fov = 40;
  // 2) converge: swoop down and round onto the logo view, landing on the lock
  const sw = inOut(prog(g, CONVERGE - 18, LOGO_LOCK - 2));
  if (sw > 0) {
    // go round on the orbit (yaw → 0, elevation → 0, distance → LOGO_D) rather than cutting across
    const y = lerp(yaw, 0, sw);
    const e = lerp(elev, 0, sw);
    const d = lerp(dist, LOGO_D, sw);
    const arc = orbitPose(y, e, d, lerp(-600, 0, sw));
    pos = lerp3(pos, arc.pos, Math.min(1, sw * 1.6));
    pos = lerp3(pos, LOCK_SHOT.pos, smooth(prog(g, LOGO_LOCK - 26, LOGO_LOCK - 2)));
    target = lerp3(target, LOCK_SHOT.target, sw);
    fov = lerp(40, LOGO_FOV, sw);
  }
  // 3) rise for the end card, then a slow ease-in
  const rise = inOut(prog(g, RISE[0], RISE[1]));
  if (g >= LOGO_LOCK) {
    pos = lerp3(LOCK_SHOT.pos, CARD_SHOT.pos, rise);
    target = lerp3(LOCK_SHOT.target, CARD_SHOT.target, rise);
    fov = LOGO_FOV;
    const ein = smooth(prog(g, RISE[1], 7200));
    pos = add(pos, [0, 0, -520 * ein]);
  }
  return {pos: pos as V3, target: target as V3, fov, roll: 0};
};
