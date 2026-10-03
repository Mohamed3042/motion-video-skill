// The ONE camera: a pure function of the global frame. Plain TS.
// Inside a section, the section's own `shot(localFrame)` drives it (converted to world space by its placement).
// Around every boundary the camera FLIES from the outgoing section's pose to the incoming one's — the
// "hyperspace hop" between stations. Sections therefore must return sensible shots for local frames in
// [-FL, length + FL] (FL = the flight half-length, default 24 frames).
//
// Flight shape (internals; API unchanged):
// - the path swings ALONG THE ORBIT around the planet (cylindrical interpolation when both ends are out in the
//   station ring), bulging slightly outward and up (`arc`), so the planet stays in view and the hop reads as
//   travelling along the system rather than cutting through it;
// - mid-hop the view turns partway into the direction of travel (≤ 22°) and banks into the turn (≤ 9° roll),
//   then settles back onto the incoming shot — no spins: the turn is capped and fades with the hop;
// - an FOV punch peaks just after the boundary (the whoosh), easing out.
import {FINALE, SECTIONS as STORY_AND_WORLDS, type SectionId} from '../timing.ts';
import {PLACEMENT, toWorld} from './layout.ts';
import {add, clamp, cross, dot, len, lerp, lerp3, mul, norm, smooth, smoother, sub, type Shot, type V3} from './math.ts';
import {SHOTS} from '../shots.ts';

export type FlightIn = {len?: number; arc?: number; fovPunch?: number};
export type ShotModule = {shot: (f: number) => Shot; FLIGHT_IN?: FlightIn};

export type CamId = SectionId | 'finale';
export type CamSection = {id: CamId; start: number; end: number};
export const CAM_SECTIONS: CamSection[] = [...STORY_AND_WORLDS.map(({id, start, end}) => ({id, start, end})), {id: 'finale', ...FINALE}];

export type CamState = {
  pos: V3;
  target: V3;
  fov: number;
  roll: number;
  focus: number; // sharp distance for DOF helpers
  flight: number; // 0 (docked) … 1 (mid-hop), for streak / blur overlays
  section: CamId; // which section "owns" this frame
};

const DEF_FL = 24;
const flightOf = (id: CamId) => ({len: DEF_FL, arc: 0.16, fovPunch: 16, ...(SHOTS[id].FLIGHT_IN ?? {})});

type Pose = {pos: V3; target: V3; fov: number; roll: number; focus: number};
const worldShot = (s: CamSection, g: number): Pose => {
  const sh = SHOTS[s.id].shot(g - s.start);
  const pl = PLACEMENT[s.id];
  const pos = toWorld(pl, sh.pos);
  const target = toWorld(pl, sh.target);
  return {pos, target, fov: sh.fov ?? 40, roll: sh.roll ?? 0, focus: sh.focus ?? len(sub(sh.target, sh.pos))};
};

const indexAt = (g: number) => {
  for (let i = 0; i < CAM_SECTIONS.length; i++) if (g < CAM_SECTIONS[i].end) return i;
  return CAM_SECTIONS.length - 1;
};

/** Which flight (if any) covers frame g: outgoing A, incoming B, boundary b and the incoming flight settings. */
const flightAt = (g: number) => {
  const i = indexAt(g);
  const S = CAM_SECTIONS[i];
  const F = flightOf(S.id);
  if (i > 0 && g < S.start + F.len && F.len > 0) return {S, A: CAM_SECTIONS[i - 1], B: S, b: S.start, F};
  if (i < CAM_SECTIONS.length - 1) {
    const N = CAM_SECTIONS[i + 1];
    const FN = flightOf(N.id);
    if (FN.len > 0 && g >= S.end - FN.len) return {S, A: S, B: N, b: N.start, F: FN};
  }
  return {S, A: null, B: null, b: 0, F};
};

const TAU = Math.PI * 2;
const RING_MIN = 2600; // both ends at least this far from the planet's axis → travel along the orbit
const wrapPi = (a: number) => a - TAU * Math.round(a / TAU);

/** Flight path between two positions, t in [0,1]: cylindrical (along the orbit) blended with a straight line. */
const hopPos = (a: V3, b: V3, t: number, arc: number): V3 => {
  const span = len(sub(b, a));
  const bump = Math.sin(Math.PI * t);
  const straight = lerp3(a, b, t);
  const ra = Math.hypot(a[0], a[2]);
  const rb = Math.hypot(b[0], b[2]);
  const w = smooth((Math.min(ra, rb) - RING_MIN) / 2400);
  let p = straight;
  if (w > 0) {
    const ta = Math.atan2(a[0], a[2]);
    const tb = ta + wrapPi(Math.atan2(b[0], b[2]) - ta);
    const th = lerp(ta, tb, t);
    const r = lerp(ra, rb, t) + span * 0.12 * bump; // swing slightly outward: more of the system in view
    p = lerp3(straight, [r * Math.sin(th), straight[1], r * Math.cos(th)], w);
  }
  return add(p, [0, span * arc * bump, 0]);
};

/** Rotate unit vector v toward unit vector u by `ang` radians (Rodrigues, about v×u). */
const turnToward = (v: V3, u: V3, ang: number): V3 => {
  const ax = cross(v, u);
  const s = len(ax);
  if (s < 1e-6 || ang <= 0) return v;
  const k = mul(ax, 1 / s);
  const c = Math.cos(ang);
  const sn = Math.sin(ang);
  return norm(add(add(mul(v, c), mul(cross(k, v), sn)), mul(k, dot(k, v) * (1 - c))));
};

const LOOK_MAX = (22 * Math.PI) / 180;
const BANK_MAX = 9;
// Outgoing sections whose shot must keep the camera until past the boundary (the turn dives INTO the satellite:
// the hop only takes over inside the white-hot drop flash). Value = fraction of the window held.
const OUT_HOLD: Partial<Record<CamId, number>> = {turn: 0.47};

export const cameraAt = (g: number): CamState => {
  const {S, A, B, b, F} = flightAt(g);
  if (!A || !B) return {...worldShot(S, g), flight: 0, section: S.id};

  const hold = OUT_HOLD[A.id] ?? 0;
  const T = (x: number) => {
    const u = smoother((x - (b - F.len)) / (2 * F.len));
    return hold ? smoother((u - hold) / (1 - hold)) : u;
  };
  const t = T(g);
  const pa = worldShot(A, g);
  const pb = worldShot(B, g);
  const span = len(sub(pb.pos, pa.pos));
  const bump = Math.sin(Math.PI * t);
  const pos = hopPos(pa.pos, pb.pos, t, F.arc);

  // base view: the two shots' directions blended (never a spin: lerp of unit vectors, renormalised)
  const da = norm(sub(pa.target, pa.pos));
  const db = norm(sub(pb.target, pb.pos));
  let dir = norm(lerp3(da, db, t));
  if (len(lerp3(da, db, t)) < 0.2) dir = t < 0.5 ? da : db; // opposite views: no flip through zero

  // look into the travel direction mid-hop (finite difference of the path, both shots re-posed at g ± 1)
  const posAt = (x: number) => hopPos(worldShot(A, x).pos, worldShot(B, x).pos, T(x), F.arc);
  const vel = sub(posAt(g + 1), posAt(g - 1));
  const speed = len(vel);
  const travel = speed > 1e-3 ? mul(vel, 1 / speed) : dir;
  const strength = bump * Math.min(1, span / 2000);
  const ang = Math.acos(clamp(dot(dir, travel), -1, 1));
  const look = Math.min(LOOK_MAX, ang * 0.45) * strength * smooth((dot(dir, travel) + 0.35) / 0.5);
  const turned = turnToward(dir, travel, look);
  // bank into the turn: the turn axis' vertical component says left (+) or right (−)
  const axis = cross(dir, travel);
  const bank = BANK_MAX * clamp(axis[1] * 1.6, -1, 1) * strength;

  const dist = lerp(len(sub(pa.target, pa.pos)), len(sub(pb.target, pb.pos)), t);
  // fov punch: rises with the hop, peaks a touch after the boundary, eases out
  const punch = Math.sin(Math.PI * t) ** 1.5;
  return {
    pos,
    target: add(pos, mul(turned, dist)),
    fov: lerp(pa.fov, pb.fov, t) + F.fovPunch * punch,
    roll: lerp(pa.roll, pb.roll, t) + bank,
    focus: lerp(pa.focus, pb.focus, t),
    flight: clamp(bump * Math.min(1, span / 1500)),
    section: t < 0.5 ? A.id : B.id,
  };
};
