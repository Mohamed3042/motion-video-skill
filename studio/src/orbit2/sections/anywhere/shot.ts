// Station 10 camera (local coords; +z points away from the planet).
// Wide: the two beacons read as ONE light jumping (phi) → swoop in between the islands: two separate lamps, an
// empty gap → 1:1 on the PC workspace → follow the light bridge to the phone → hold on the phone (EN, then the
// RTL flip) → pull back and up, looking back toward the planet: the clean hand-off pose for the finale pull-back.
import {oneToOne, type Shot} from '../../engine/math.ts';
import {glide, type CamKey} from '../engine/cam.ts';
import {PC_CARD, PH_CARD} from './set.ts';

const D = oneToOne(40);
const [px, py, pz] = PC_CARD.p;
const [hx, hy, hz] = PH_CARD.p;

const KEYS: CamKey[] = [
  {f: -40, pos: [-2000, -300, 6800], target: [680, 300, -200]},
  {f: 0, pos: [-320, -420, 5600], target: [840, 260, -100]},
  {f: 60, pos: [330, -380, 4700], target: [840, 300, -100]},
  {f: 102, pos: [830, 120, 2500], target: [830, 520, -100]},
  {f: 118, pos: [830, 110, 2400], target: [830, 530, -100], hold: true},
  {f: 160, pos: [px, py + 60, pz + D], target: [px, py + 60, pz], hold: true},
  {f: 204, pos: [px + 30, py + 56, pz + D - 50], target: [px + 30, py + 56, pz]},
  {f: 232, pos: [900, 240, 3300], target: [880, 120, -80]},
  {f: 268, pos: [hx - 400, hy - 330, hz + 1640], target: [hx - 400, hy + 10, hz], hold: true},
  {f: 346, pos: [hx - 380, hy - 330, hz + 1600], target: [hx - 380, hy + 6, hz]},
  {f: 372, pos: [hx - 350, hy - 330, hz + 1550], target: [hx - 350, hy, hz], hold: true},
  {f: 432, pos: [hx - 340, hy - 330, hz + 1520], target: [hx - 340, hy - 2, hz], hold: true},
  {f: 486, pos: [600, 1500, 4600], target: [300, -900, -4000]},
  {f: 560, pos: [400, 2300, 6600], target: [0, -1890, -9000]},
];

export const shot = (f: number): Shot => glide(KEYS, f);
