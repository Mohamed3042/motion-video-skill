// Station 1 camera (local coords; +z points away from the planet). Arrive at the mouth of the Fraser funnel,
// glide down its axis (it reads as a spiral), bank 70° to the side (twenty separate hoops), swing back to
// read the holograms at 1:1, then pan right toward station 2.
import type {Shot} from '../../engine/math.ts';
import {orbit, type OrbitKey} from './cam.ts';

const K: OrbitKey[] = [
  {f: -24, at: [-640, 0, -700], yaw: -7, pitch: 4, dist: 5200},
  {f: 0, at: [-760, 0, -560], yaw: -5, pitch: 3, dist: 4300},
  {f: 96, at: [-820, 0, -480], yaw: -3.5, pitch: 2, dist: 3900},
  {f: 150, at: [0, 0, -1600], yaw: 0, pitch: 0, dist: 2350, fov: 47, roll: -24},
  {f: 194, at: [0, 0, -1500], yaw: 70, pitch: 6, dist: 4500, fov: 40, roll: 0},
  {f: 224, at: [0, 0, -1420], yaw: 73, pitch: 7, dist: 4400},
  {f: 270, at: [-300, 10, 160], yaw: 4, pitch: 1, dist: 1500, hold: true},
  {f: 326, at: [-290, 10, 160], yaw: 2, pitch: 1, dist: 1490},
  {f: 352, at: [110, 10, 100], yaw: -1, pitch: 1, dist: 1880},
  {f: 376, at: [430, 10, 100], yaw: -2.5, pitch: 0.5, dist: 1500, hold: true},
  {f: 428, at: [440, 10, 100], yaw: -3.5, pitch: 0.5, dist: 1480},
  {f: 470, at: [760, 60, -220], yaw: -16, pitch: 3, dist: 2100},
  {f: 504, at: [1250, 120, -620], yaw: -28, pitch: 4, dist: 2700, fov: 44},
];

export const shot = (f: number): Shot => orbit(K, f);
