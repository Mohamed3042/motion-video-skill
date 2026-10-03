// Station 3 camera (local coords). Stare at the lilac chaser (fixation), orbit round it so the lanterns are seen
// as 3D bulbs and the "green dot" as an empty socket, pull back as the ring opens into the carousel, read all
// three findings, then push in to the newest one and its source.
import type {Shot} from '../../engine/math.ts';
import {orbit, type OrbitKey} from '../profile/cam.ts';

const K: OrbitKey[] = [
  {f: -24, at: [-320, 20, 0], yaw: -4, pitch: 2, dist: 2400},
  {f: 0, at: [-300, 10, 0], yaw: -2, pitch: 1, dist: 1820},
  {f: 82, at: [-280, 0, 0], yaw: -1, pitch: 0.5, dist: 1640, hold: true},
  {f: 116, at: [0, 0, 0], yaw: 46, pitch: 12, dist: 1380},
  {f: 146, at: [0, -40, -300], yaw: 18, pitch: 14, dist: 2000},
  {f: 196, at: [0, 30, -220], yaw: 2, pitch: 9, dist: 1900},
  {f: 230, at: [0, 60, 0], yaw: 0, pitch: 3, dist: 1560, hold: true},
  {f: 268, at: [-80, 0, 100], yaw: 2, pitch: 1, dist: 1483, hold: true},
  {f: 440, at: [-70, 0, 100], yaw: 0, pitch: 0.5, dist: 1440},
  {f: 474, at: [0, -190, -1000], yaw: -6, pitch: 38, dist: 2700},
  {f: 504, at: [300, -100, -1300], yaw: -16, pitch: 30, dist: 3300, fov: 44},
];

export const shot = (f: number): Shot => orbit(K, f);
