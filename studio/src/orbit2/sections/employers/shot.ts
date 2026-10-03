// Station 8 · Employers — camera (LOCAL coords).
//   -24…14   fly in toward the vast façade; it lights up on the boundary impact (0)
//   14…52    square-on: the café-wall rows look wedged
//   52…112   dolly along the façade, turning to look down it: the ledges extrude and read dead straight
//   112…430  settle into a pixel-exact (1:1) pose in front of the dossier holograms that swing out of two windows
//   430…504  pull back and rise as the holograms return, into the hop toward station 9
import {type Shot, type V3} from '../../engine/math.ts';
import {curve3, in2, lin, out3, smoother} from '../market/curve.ts';

const POS: [number, V3][] = [
  [-24, [420, 520, 5400]],
  [14, [60, 40, 2640]],
  [52, [0, 0, 2470]],
  [112, [-1350, -60, 1650]],
  [150, [-1290, -50, 1600]],
  [430, [-1200, -40, 1520]],
  [504, [-600, 980, 2700]],
];
const TGT: [number, V3][] = [
  [-24, [0, 60, 0]],
  [14, [0, 20, 0]],
  [52, [0, 0, 0]],
  [112, [520, 0, -60]],
  [150, [520, 0, -60]],
  [430, [540, 0, -60]],
  [504, [1000, 360, -300]],
];
const EASE = [out3, lin, smoother, out3, lin, in2];

export const shot = (f: number): Shot => ({pos: curve3(f, POS, EASE), target: curve3(f, TGT, EASE), fov: 40});
/** the reading pose the dossier holograms are laid out for (pixel-exact at 1:1) */
export const HERO_SHOT = shot(340);
