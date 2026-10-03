// Station 9 camera (local coords; +z points away from the planet). One continuous glide:
// arrive low beside the pole (stripes "climb") → at the impact crane up and back so the opened ring is seen from
// above (stripes slide sideways) → rise past the four agent floors as they light → dock 1:1 on the evidence ledger →
// truck to the connections panel → pull back and right (toward station 10) as the pole re-forms.
import {oneToOne, type Shot} from '../../engine/math.ts';
import {glide, type CamKey} from './cam.ts';
import {CONN, LEDGER} from './spire.ts';

const D = oneToOne(40);
const [lx, ly, lz] = LEDGER.p;
const [cx, cy, cz] = CONN.p;

const KEYS: CamKey[] = [
  {f: -40, pos: [-2400, -1100, 4300], target: [-500, 200, 0]},
  {f: 0, pos: [-1300, -760, 3100], target: [-160, 300, 0]},
  {f: 60, pos: [-1080, -700, 2700], target: [-120, 330, 0]},
  {f: 112, pos: [-960, -680, 2500], target: [-100, 350, 0], hold: true},
  {f: 132, pos: [-1050, -40, 3350], target: [-40, -160, 0]},
  {f: 150, pos: [-820, 560, 2900], target: [0, -180, 0]},
  {f: 182, pos: [-480, 400, 2100], target: [160, 340, 0]},
  {f: 212, pos: [-420, 980, 2000], target: [160, 930, 0]},
  {f: 242, pos: [-380, 1560, 2000], target: [80, 1540, 0]},
  {f: 280, pos: [lx, ly, lz + D], target: [lx, ly, lz], hold: true},
  {f: 348, pos: [lx + 30, ly - 6, lz + D - 50], target: [lx + 30, ly - 6, lz], hold: true},
  {f: 382, pos: [cx, cy, cz + D], target: [cx, cy, cz], hold: true},
  {f: 428, pos: [cx - 20, cy - 6, cz + D - 50], target: [cx - 20, cy - 6, cz]},
  {f: 472, pos: [400, 1300, 4900], target: [0, 650, 0]},
  {f: 530, pos: [1700, 1700, 6500], target: [600, 650, 0]},
];

export const shot = (f: number): Shot => glide(KEYS, f);
