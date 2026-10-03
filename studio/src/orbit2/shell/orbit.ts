// The Orbit planet as a 3D object that matches the real logo (public/orbit2/brand/orbit-512.png), plus its
// state over the global frame g (formation in the turn, satellite orbit, docking at the finale lock). Plain TS.
//
// Logo measurements (512 px PNG, y down): sphere (254,258) r145 · ring centre-line ellipse (258,243) a207 b88,
// rotated −25.3° · satellite (409.5,128.5) r37 — the satellite sits exactly on the ring ellipse (φ ≈ 26°, far side).
// In 3D (y up, planet at the origin, radius PLANET_RADIUS) the ring is a circle tilted so that b/a = sin(tilt)
// seen from +z, rolled 25.3°; LOGO_CAM looks from +z so the render lines up with the PNG (LOGO_CARD).
import {PLANET_RADIUS} from '../engine/layout.ts';
import {clamp, oneToOne, type Shot, type V3} from '../engine/math.ts';
import {LOGO_LOCK} from '../timing.ts';

const D2R = Math.PI / 180;
export const PR = PLANET_RADIUS;
const K = PR / 145; // world units per logo px (at the planet's centre plane)

export const RING_R = 207 * K;
export const RING_TUBE = 9 * K;
export const RING_TILT = Math.asin(88 / 207); // ring normal tipped toward +z by this
export const RING_ROLL = 25.3 * D2R;
export const RING_OFF: V3 = [4 * K, 15 * K, 0]; // ring centre relative to the planet centre (logo artistry)
export const SAT_R = 37 * K;
export const SAT_PHI0 = Math.atan2(38.77 / 88, 185.9 / 207); // ≈ 26.1°: the logo's satellite phase on the ring

/** Point on the ring (angle φ, radius r) in world space, relative to the planet centre. */
export const ringPoint = (phi: number, r = RING_R): V3 => {
  // torus-local (x, y, 0) → tilt about X by −(90° − tilt) → roll about Z → offset
  const x = r * Math.cos(phi);
  const y0 = r * Math.sin(phi);
  const a = -(Math.PI / 2 - RING_TILT);
  const y = y0 * Math.cos(a);
  const z = y0 * Math.sin(a);
  const c = Math.cos(RING_ROLL);
  const s = Math.sin(RING_ROLL);
  return [x * c - y * s + RING_OFF[0], x * s + y * c + RING_OFF[1], z + RING_OFF[2]];
};

// ---------------------------------------------------------------- the lock view (render ≡ logo PNG)
export const LOGO_FOV = 30;
export const LOGO_PX = 500; // logo box size on screen at the lock
const sphereR = (145 / 512) * LOGO_PX; // sphere radius on screen (px)
export const LOGO_D = Math.sqrt(1 + (oneToOne(LOGO_FOV) / sphereR) ** 2) * PR; // silhouette radius = sphereR exactly
export const LOGO_CAM: Shot = {pos: [0, 0, LOGO_D], target: [0, 0, 0], fov: LOGO_FOV};
/** The PNG as a front-facing card at the planet's centre plane: size (units) and centre offset. */
export const LOGO_CARD = (() => {
  const s = (LOGO_PX * LOGO_D) / oneToOne(LOGO_FOV); // card units for LOGO_PX screen px at distance LOGO_D
  const k = s / 512;
  return {size: s, p: [2 * k, 2 * k, 0] as V3};
})();

// ---------------------------------------------------------------- state over the film
// Turn timing (global): ignite 720, planet forms 804 → locks 840 (logo), satellite orbits from 960.
export const IGNITE_G = 720;
export const FORM_G = 804;
export const LOCK_G = 840;
const ORBIT_G = 960;
const OMEGA = -0.0045; // satellite angular speed, rad/frame (one orbit ≈ 23 s; clockwise: near side at the dive)
const DOCK = [6300, LOGO_LOCK] as const; // finale: the satellite slows onto its logo position for the lock

const smoothstep = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
const backOut = (t: number) => {
  const x = clamp(t);
  return 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2;
};

/** 0 → 1: the planet grows out of the coral point (turn), stays 1 for the rest of the film. */
export const planetForm = (g: number) => (g < FORM_G ? 0 : backOut((g - FORM_G) / (LOCK_G - FORM_G)));
/** 0 → 1: the silver ring condenses out of the debris rings. */
export const ringForm = (g: number) => smoothstep((g - (FORM_G + 10)) / (LOCK_G - FORM_G - 8));

const phiFree = (g: number) => SAT_PHI0 + OMEGA * (g - ORBIT_G);
// docking: hermite from (φ(DOCK0), ω) to the next φ0 + 2πn with zero speed at the lock
const DOCK_TARGET = (() => {
  const p0 = phiFree(DOCK[0]);
  const minEnd = p0 + (OMEGA * (DOCK[1] - DOCK[0])) / 2; // keep moving the same way, then stop on φ0 (mod 2π)
  const n = (minEnd - SAT_PHI0) / (2 * Math.PI);
  return SAT_PHI0 + 2 * Math.PI * (OMEGA < 0 ? Math.floor(n) : Math.ceil(n));
})();

/** Satellite phase on the ring and its radius factor (0 inside the planet → 1 on the ring). */
export const satState = (g: number): {phi: number; r: number; scale: number; vis: number} => {
  if (g < FORM_G) return {phi: SAT_PHI0 - 4, r: 0, scale: 0, vis: 0};
  if (g < LOCK_G) {
    const t = (g - FORM_G) / (LOCK_G - FORM_G);
    const e = 1 - (1 - t) ** 3;
    return {phi: SAT_PHI0 - 4 * (1 - e), r: e, scale: 0.35 + 0.65 * e, vis: smoothstep(t * 3)};
  }
  if (g < ORBIT_G) return {phi: SAT_PHI0, r: 1, scale: 1, vis: 1};
  if (g < DOCK[0]) return {phi: phiFree(g), r: 1, scale: 1, vis: 1};
  if (g >= DOCK[1]) return {phi: SAT_PHI0, r: 1, scale: 1, vis: 1};
  const T = DOCK[1] - DOCK[0];
  const u = (g - DOCK[0]) / T;
  const p0 = phiFree(DOCK[0]);
  const h = (u: number) => {
    const u2 = u * u;
    const u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * OMEGA * T + (-2 * u3 + 3 * u2) * DOCK_TARGET;
  };
  return {phi: h(u), r: 1, scale: 1, vis: 1};
};

/** Satellite centre in world space. */
export const satPos = (g: number): V3 => {
  const s = satState(g);
  const p = ringPoint(s.phi, RING_R * s.r);
  // emerge from the planet centre (r = 0) rather than from the ring offset
  return [p[0] - RING_OFF[0] * (1 - s.r), p[1] - RING_OFF[1] * (1 - s.r), p[2] - RING_OFF[2] * (1 - s.r)];
};
