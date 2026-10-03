// Station 7 · My market — camera (LOCAL coords). An orbit rig: target T, distance R, pitch (90 = straight down),
// yaw (+ = camera swings to +x, looking back left), roll. Each parameter has its own eased curve.
//   -24…36   arrive high above the data city, rolled 45°: the avenues are a Zöllner field (they look tilted)
//   36…140   slow descent while the hatches grow and the coral pair lights
//   138…186  unroll: the avenues swing level as the hatches fall away; "Straight comparisons." at 180
//   140…248  tilt down to street level: the avenues are parallel streets, the city and the matrix columns rise
//   248…432  glide right along the matrix while the holograms land; 432…504 rise and swing toward Employers
import {type Shot, type V3} from '../../engine/math.ts';
import {curve, in2, lin, out3, smoother} from './curve.ts';

const D2R = Math.PI / 180;

export const rig = (f: number) => {
  const pitch = curve(f, [[140, 89.97], [248, 30], [432, 27], [504, 17]], [smoother, smoother, in2]);
  const R = curve(f, [[-24, 4700], [36, 3330], [140, 3070], [248, 2050], [432, 1900], [504, 2300]], [out3, lin, smoother, smoother, in2]);
  const roll = curve(f, [[-24, 66], [36, 49], [140, 45], [186, 0]], [out3, lin, smoother]);
  const yaw = curve(f, [[276, 0], [360, 7], [432, 8], [504, -14]], [smoother, lin, in2]);
  const tx = curve(f, [[276, 0], [356, 240], [432, 262], [504, 1500]], [smoother, lin, in2]);
  const ty = curve(f, [[140, 0], [248, 200], [432, 230], [504, 420]], [smoother, smoother, in2]);
  const tz = curve(f, [[140, -80], [248, 60], [432, 70], [504, -700]], [smoother, smoother, in2]);
  return {T: [tx, ty, tz] as V3, R, pitch, yaw, roll};
};

export const shot = (f: number): Shot => {
  const {T, R, pitch, yaw, roll} = rig(f);
  const p = pitch * D2R;
  const y = yaw * D2R;
  return {pos: [T[0] + R * Math.cos(p) * Math.sin(y), T[1] + R * Math.sin(p), T[2] + R * Math.cos(p) * Math.cos(y) + 0.6], target: T, fov: 40, roll};
};
