// Station 10 set geometry shared by the CSS layer, the WebGL layer and the camera (plain TS, local coords, y up).
// Two floating islands: the PC monolith (left) and the phone (right). Their beacons alternate (phi: one light
// seems to jump); the private link is a light bridge from the PC to the phone.
import type {V3} from '../../engine/math.ts';

// The PC monolith stands on the station origin: it hides the framework's station beacon from the front, so no
// third light ever competes with the two phi beacons.
export const PC_ISLAND: V3 = [0, -470, 0];
export const PC_ISLAND_R = 600;
export const PC: V3 = [0, 20, 0]; // monolith centre (front face at z = PC[2] + 24)
export const PC_W = 1080;
export const PC_H = 640;
export const PC_CARD = {p: [PC[0], PC[1], PC[2] + 26] as V3, w: 1000, h: 580};

export const PH_ISLAND: V3 = [1680, -440, -160];
export const PH_ISLAND_R = 400;
export const PH: V3 = [1680, 40, -160]; // phone centre
export const PH_YAW = -8; // degrees, turned slightly toward the PC side
export const PH_W = 440;
export const PH_H = 830;
export const PH_CARD = {p: [PH[0], PH[1], PH[2] + 20] as V3, w: 410, h: 790};

export const BEACON_L: V3 = [PC[0], PC[1] + PC_H / 2 + 80, PC[2]];
export const BEACON_R: V3 = [PH[0], PH[1] + PH_H / 2 + 80, PH[2]];

// light bridge (private link) control points: PC right edge → arc → phone left edge
export const BRIDGE: V3[] = [
  [PC[0] + PC_W / 2 - 10, PC[1] + 120, PC[2] + 10],
  [740, 470, 160],
  [1210, 520, 40],
  [PH[0] - PH_W / 2 + 6, PH[1] + 150, PH[2]],
];

/** Phi: the two beacons alternate (period 24 f); no light ever travels between them. */
export const PHI_END = 120;
export const beacons = (f: number) => {
  if (f < 0) return {l: 0.06, r: 0.06}; // dark until the arrival impact
  if (f < PHI_END) {
    // 24-frame cycle (strong apparent motion); from f72 the cycle slows to 40 f as the camera closes in: two lamps
    const ph = f < 72 ? (f % 24) / 24 : ((f - 72) % 40) / 40;
    return {l: ph < 0.42 ? 1 : 0.06, r: ph >= 0.5 && ph < 0.92 ? 1 : 0.06};
  }
  const steady = f < 240 ? 0.3 : 0.75;
  return {l: steady, r: steady};
};

// beat map (matches timing.ts EVENTS: 0 impact · 120 hit · 240 hit · 360 hit · 444 whoosh)
export const B = {arrive: 0, pc: 120, press: 200, land: 240, flip: 360, out: 436, whoosh: 444};
