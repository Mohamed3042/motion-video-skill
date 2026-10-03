// Station 9 set geometry shared by the CSS layer, the WebGL layer and the camera (plain TS, local coords, y up).
// The research spire stands on the station axis (x = 0, z = 0). Its striped SLEEVE is a barber pole: the stripe
// pattern only ever moves along the surface's circumference (sideways). At T.widen the sleeve's aperture opens:
// the tall thin pole morphs into a wide short ring around the planner floor, and the same stripes, at the same
// surface speed, visibly slide sideways. At T.pole it closes back into the pole.
import {clamp, smoother} from '../../engine/math.ts';
import {T} from './timing.ts';

export const P = 110; // stripe period along the surface (units)
const ringR = (n: number) => (n * P) / (2 * Math.PI); // circumference = n periods → seamless wrap
export const R1 = ringR(8); // pole radius ≈ 140
export const R2 = ringR(52); // ring radius ≈ 910
export const H1 = 3400;
export const Y1 = 300; // pole spans -1400 … 2000
export const H2 = 150;
export const FLOOR_Y = [-300, 300, 900, 1500]; // planner, miner, verifier, synthesis
export const Y2 = FLOOR_Y[0];
export const BASE_Y = -1430;
export const CROWN_Y = 2060;
export const V = 3.4; // surface speed, units / frame (constant)

export const phase = (f: number) => V * (f + 40);

const expo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
/** sleeve morph: 0 = tall pole, 1 = wide ring (the opened aperture) */
export const sleeveK = (f: number) => {
  if (f < T.pole) return expo((f - T.widen) / 30);
  return 1 - smoother((f - T.pole) / 30);
};
export const sleeveGeo = (f: number) => {
  const k = sleeveK(f);
  return {k, R: R1 + (R2 - R1) * k, H: H1 + (H2 - H1) * k, Y: Y1 + (Y2 - Y1) * k};
};
// hologram anchors at the crown (CSS layer + camera)
export const LEDGER = {p: [-1000, 1650, 700] as [number, number, number], w: 1250, h: 770};
export const CONN = {p: [900, 1650, 560] as [number, number, number], w: 790, h: 770};

/** floors deploy out of the opened sleeve (0 → 1), staggered bottom to top */
export const floorDeploy = (f: number, i: number) => smoother((f - (T.widen + 6 + i * 5)) / 26);
