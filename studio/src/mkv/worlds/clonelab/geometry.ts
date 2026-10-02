// Penrose staircase geometry (plain TS, shared by Clone Lab and My Voice's exit line).
//
// The trick: an open spiral whose end sits at start + (SHIFT, SHIFT) in plan and RISE_LOOP higher. In this
// orthographic projection a plan move of (+1,+1) drops 2*S on screen, exactly what RISE_LOOP lifts back up, so
// the spiral's end lands on its own start: the loop closes on screen while every step really goes up.
// Flights are narrow treads, corners are flat landings (only treads rise, so each rise is a real, readable step).
import {FLIGHT_TREADS} from './timing';

export const ISO_S = 0.58;
export const ISO_C = Math.sqrt(1 - ISO_S * ISO_S);
export const U = 98; // px per plan unit
export const TREAD = 0.5; // tread depth (plan units)
export const DEPTH = 1.35; // wall height below each tread (screen units)
export const WIDTH = 1.6; // flight width
export const SHIFT = 2;

// SET UP +x, RECORD +y, CALIBRATE −x, TRAIN −y; each side ends on a flat landing. Long sides − short sides = SHIFT.
const DIRS: [number, number][] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];
const RISES = FLIGHT_TREADS.reduce((a, n) => a + n, 0); // 16
export const RISE = (2 * ISO_S * SHIFT) / RISES; // per tread, screen units
export const RISE_LOOP = RISE * RISES;

export type Box = {x0: number; x1: number; y0: number; y1: number; z: number; landing: boolean};
const BASE: Box[] = [];
{
  let px = 0;
  let py = 0;
  let z = 0;
  const hw = WIDTH / 2;
  FLIGHT_TREADS.forEach((n, si) => {
    const [dx, dy] = DIRS[si];
    for (let i = 0; i < n; i++) {
      z += RISE;
      const ax = px;
      const ay = py;
      px += dx * TREAD;
      py += dy * TREAD;
      BASE.push(
        dx
          ? {x0: Math.min(ax, px), x1: Math.max(ax, px), y0: py - hw, y1: py + hw, z, landing: false}
          : {x0: px - hw, x1: px + hw, y0: Math.min(ay, py), y1: Math.max(ay, py), z, landing: false},
      );
    }
    const [ndx, ndy] = DIRS[(si + 1) % 4];
    const cx = px + dx * hw;
    const cy = py + dy * hw;
    BASE.push({x0: cx - hw, x1: cx + hw, y0: cy - hw, y1: cy + hw, z, landing: true});
    px = cx + ndx * hw;
    py = cy + ndy * hw;
  });
}
export const K = BASE.length; // 20 cells per loop

// cell k for ANY integer k (k + K is the same cell one loop up: the same place on screen)
export const cellAt = (k: number): Box & {r: number} => {
  const n = Math.floor(k / K);
  const r = k - n * K;
  const b = BASE[r];
  const d = n * SHIFT;
  return {x0: b.x0 + d, x1: b.x1 + d, y0: b.y0 + d, y1: b.y1 + d, z: b.z + n * RISE_LOOP, landing: b.landing, r};
};

const NAMES = ['SET UP', 'RECORD', 'CALIBRATE', 'TRAIN'];
export const FLIGHTS = NAMES.map((name, i) => {
  const first = FLIGHT_TREADS.slice(0, i).reduce((a, n) => a + n + 1, 0);
  return {name, cells: Array.from({length: FLIGHT_TREADS[i] + 1}, (_, j) => first + j)};
});

// The loop is cut between TRAIN's last tread and the top landing (drawn one loop down as −1): that move goes
// away from the viewer, so painting cells −1…K−2 back-to-front by x+y keeps every overlap consistent.
export const REPS = Array.from({length: K}, (_, i) => i - 1);

// Where the drawing sits on screen (staircase on the left, panels on the right).
export const STAIR_CX = 540;
export const STAIR_CY = 560;
const OX = STAIR_CX - 0.2 * ISO_C * U;
const OY = STAIR_CY - 1.4 * U;

export type V2 = [number, number];
export const P = (x: number, y: number, z: number): V2 => [OX + (x - y) * ISO_C * U, OY + ((x + y) * ISO_S - z) * U];

export const treadCentre = (k: number): [number, number, number] => {
  const c = cellAt(k);
  return [(c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2, c.z];
};

// The diagonal "stair edge" shared with My Voice's exit: the staircase's left rim, from the CALIBRATE landing
// up the TRAIN flight to the top landing (where the door is).
const L34 = cellAt(FLIGHTS[2].cells[FLIGHTS[2].cells.length - 1]);
const L41 = cellAt(K - 1);
export const ENTRY_EDGE: [V2, V2] = [P(L34.x0, L34.y1, L34.z), P(L41.x0, L41.y0, L41.z)];

// The portal: Clone Lab opens with the camera zoomed onto that edge, centred on screen, then pulls back.
// My Voice's exit line lands exactly on PORTAL_LINE (the edge extended by EDGE_EXT at both ends, seen through the zoom).
export const PORTAL_SCALE = 1.7;
const EM: V2 = [(ENTRY_EDGE[0][0] + ENTRY_EDGE[1][0]) / 2, (ENTRY_EDGE[0][1] + ENTRY_EDGE[1][1]) / 2];
export const PORTAL_TX = 960 - PORTAL_SCALE * EM[0];
export const PORTAL_TY = 540 - PORTAL_SCALE * EM[1];
export const EDGE_EXT = 0.12;
const ext = (a: V2, b: V2): V2 => [a[0] + (a[0] - b[0]) * EDGE_EXT, a[1] + (a[1] - b[1]) * EDGE_EXT];
const toPortal = (p: V2): V2 => [PORTAL_TX + PORTAL_SCALE * p[0], PORTAL_TY + PORTAL_SCALE * p[1]];
export const EDGE_LINE: [V2, V2] = [ext(ENTRY_EDGE[0], ENTRY_EDGE[1]), ext(ENTRY_EDGE[1], ENTRY_EDGE[0])]; // lower-left → upper-right
export const PORTAL_LINE: [V2, V2] = [toPortal(EDGE_LINE[0]), toPortal(EDGE_LINE[1])];
