// The ONE camera: a pure function of the global frame. Plain TS.
// Inside a section, the section's own `shot(localFrame)` drives it (converted to world space by its placement).
// Around every boundary the camera FLIES from the outgoing section's pose to the incoming one's along an arc,
// with an FOV punch — the "hyperspace hop" between stations. Sections therefore must return sensible shots
// for local frames in [-FL, length + FL] (FL = the flight half-length, default 24 frames).
import {FINALE, SECTIONS as STORY_AND_WORLDS, type SectionId} from '../timing.ts';
import {PLACEMENT, toWorld} from './layout.ts';
import {add, clamp, len, lerp, lerp3, mul, norm, smoother, sub, type Shot, type V3} from './math.ts';
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

const worldShot = (s: CamSection, g: number) => {
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

export const cameraAt = (g: number): CamState => {
  const i = indexAt(g);
  const S = CAM_SECTIONS[i];
  // in a flight? (into S from the previous section, or out of S into the next)
  let A: CamSection | null = null;
  let B: CamSection | null = null;
  let b = 0;
  let F = flightOf(S.id);
  if (i > 0 && g < S.start + F.len && F.len > 0) {
    A = CAM_SECTIONS[i - 1];
    B = S;
    b = S.start;
  } else if (i < CAM_SECTIONS.length - 1) {
    const N = CAM_SECTIONS[i + 1];
    const FN = flightOf(N.id);
    if (FN.len > 0 && g >= S.end - FN.len) {
      A = S;
      B = N;
      b = N.start;
      F = FN;
    }
  }
  if (!A || !B) return {...worldShot(S, g), flight: 0, section: S.id};

  const t = smoother((g - (b - F.len)) / (2 * F.len));
  const pa = worldShot(A, g);
  const pb = worldShot(B, g);
  const span = len(sub(pb.pos, pa.pos));
  const bump = Math.sin(Math.PI * t);
  const pos = add(lerp3(pa.pos, pb.pos, t), mul([0, 1, 0], span * F.arc * bump));
  const da = norm(sub(pa.target, pa.pos));
  const db = norm(sub(pb.target, pb.pos));
  const dir = norm(lerp3(da, db, t));
  const dist = lerp(len(sub(pa.target, pa.pos)), len(sub(pb.target, pb.pos)), t);
  return {
    pos,
    target: add(pos, mul(dir, dist)),
    fov: lerp(pa.fov, pb.fov, t) + F.fovPunch * bump,
    roll: lerp(pa.roll, pb.roll, t),
    focus: lerp(pa.focus, pb.focus, t),
    flight: clamp(bump * Math.min(1, span / 1500)),
    section: t < 0.5 ? A.id : B.id,
  };
};
