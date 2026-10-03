// Station 3 shared scene state (plain TS): the lilac-chaser ring of 12 lanterns and the carousel it becomes.
// Used by GL.tsx (lanterns, rail, lights) and World.tsx (finding cards, holograms).
import {clamp, lerp, prog, smoother, type V3} from '../../engine/math.ts';

export const T = {
  drop: 0,
  promise: 40,
  titleOut: 84,
  reveal: [84, 118] as const, // camera orbits: the lanterns are 3D bulbs, the gap is an unlit one
  real: 120, // HIT: the missing lantern lights MINT — the dot becomes real
  morph: [140, 190] as const, // lanterns fly out to the carousel rail
  spin: [160, 236] as const, // the carousel spins the cards in, newest first
  cards: [168, 178, 188], // card k springs in at its slot
  header: 196,
  focus: 240, // HIT: newest finding comes forward, source hologram
  evidence: 360, // HIT: view source evidence + dated-status line
  out: 444, // whoosh
};

export const N = 12;
export const RL = 330; // lantern ring radius (XY plane, facing the camera)
export const RC = 1150; // carousel radius (XZ plane); front slot at z = 0
export const YC = -20; // card centre height
export const RAIL = YC - 170; // slot lights / rail height
export const STEP = 30; // deg between slots

/** the chaser: which lantern is switched off at frame f (one step every 6 frames ≈ 0.1 s) */
export const gapAt = (f: number) => (((Math.floor(f / 6) % N) + N) % N);
/** after the hit the gap freezes where the mint light was born */
export const REAL_GAP = gapAt(120);

/** carousel angle offset (deg): cards sweep in from the right-back, then a slow orbital drift; whirl on exit */
export const psiAt = (f: number) => {
  const t = prog(f, T.spin[0], T.spin[1]);
  const arrive = 110 * (1 - (t >= 1 ? 1 : 1 - 2 ** (-8 * t)));
  const drift = 0.02 * Math.max(0, f - T.spin[1]);
  const whirl = 160 * clamp((f - T.out) / 50) ** 2.4;
  return arrive + drift + whirl;
};

/** a point on the carousel at angle phi (deg) and height y */
export const onRing = (phi: number, y: number): V3 => {
  const a = (phi * Math.PI) / 180;
  return [RC * Math.sin(a), y, -RC + RC * Math.cos(a)];
};

/** lantern i: on the small vertical ring, flying to its slot on the rail during the morph */
export const lanternPos = (i: number, f: number): V3 => {
  const th = ((i * 30) * Math.PI) / 180;
  const a: V3 = [RL * Math.cos(th), RL * Math.sin(th), 0];
  const phi = 90 - i * 30; // top lantern → front slot; the ring "lies down" and opens out
  const b = onRing(phi + psiAt(f), RAIL);
  const st = ((i * 5) % N) * 1.2;
  const t = smoother(prog(f, T.morph[0] + st, T.morph[1] + st));
  const p: V3 = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  p[1] += Math.sin(Math.PI * t) * 160;
  p[2] += Math.sin(Math.PI * t) * 220;
  return p;
};
export const morphAt = (i: number, f: number) => {
  const st = ((i * 5) % N) * 1.2;
  return smoother(prog(f, T.morph[0] + st, T.morph[1] + st));
};

/** finding k sits at slot angle (k - 1) * STEP: newest on the left */
export const cardPhi = (k: number, f: number) => (k - 1) * STEP + psiAt(f);
