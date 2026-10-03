// Station 2 camera (local coords). Face-on to the turning disc (it reads as a sphere), rise 58° above it (a flat
// plate), swing back down as it inflates into a real globe, then settle on the globe + hologram column.
import type {Shot} from '../../engine/math.ts';
import {orbit, type OrbitKey} from '../profile/cam.ts';

const K: OrbitKey[] = [
  {f: -24, at: [300, 60, 0], yaw: -6, pitch: 4, dist: 2700},
  {f: 0, at: [320, 40, 0], yaw: -4, pitch: 2.5, dist: 2120},
  {f: 78, at: [300, 30, 0], yaw: -2, pitch: 1.5, dist: 1880},
  {f: 118, at: [0, -40, 0], yaw: -12, pitch: 58, dist: 1900},
  {f: 160, at: [380, 120, 0], yaw: 3, pitch: 6, dist: 1640},
  {f: 196, at: [430, 150, 0], yaw: 4, pitch: 2, dist: 1490, hold: true},
  {f: 236, at: [432, 140, 0], yaw: 3.5, pitch: 1.5, dist: 1485},
  {f: 272, at: [430, 72, 20], yaw: 3, pitch: 0, dist: 1480, hold: true},
  {f: 440, at: [432, 66, 20], yaw: 0.5, pitch: 0, dist: 1450},
  {f: 472, at: [250, 40, 0], yaw: -2, pitch: 2, dist: 1900},
  {f: 504, at: [650, 100, -300], yaw: -14, pitch: 3, dist: 2600, fov: 44},
];

export const shot = (f: number): Shot => orbit(K, f);
