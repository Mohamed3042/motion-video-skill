// The Fraser tunnel's geometry (plain TS, shared by GL.tsx, World.tsx and shot.ts).
// Seen from DREF on the axis, ring k projects at RHO0·Q^-k px: the exact log-polar spacing of the flat Fraser
// figure. In 3D the rings are SEPARATE closed hoops spread along a deep funnel (depth grows by G per ring).
import {oneToOne} from '../../engine/math.ts';

export const NR = 20; // rings
export const NT = 56; // cord tiles per ring (even: light/dark alternate)
export const M = 32; // checker sectors per washer
export const Q = 1.16; // projected ring-to-ring ratio
export const G = 1.05; // depth growth per ring
export const DREF = 2300; // sweet-spot distance in front of the mouth (z = 0)
export const RHO0 = 700;
export const TWIST = 0.4; // cord tilt from the tangent (rad): the whole illusion
export const TRACE = 4; // the ring the coral light traces

const P = oneToOne(40);
export const RINGS = Array.from({length: NR}, (_, k) => {
  const d = DREF * G ** k;
  return {k, z: DREF - d, r: (RHO0 * Q ** -k * d) / P};
});
export const DEEP = RINGS[NR - 1].z; // ≈ -3500

// timeline (local frames) shared by picture modules
export const TL = {
  ignite: [0, 34] as const, // the coral burst races from the deep end to the mouth
  untwist: [184, 226] as const,
  washerOut: [138, 178] as const,
  recede: [222, 286] as const,
};
