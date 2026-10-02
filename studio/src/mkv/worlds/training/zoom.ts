// Droste camera. Level k (k ∈ ℤ, larger = deeper) is the same 1600×900 panel drawn at screen scale R^(k-u) and
// rotation twist·(k-u) about the frame centre; its centre window (R × panel) is exactly where level k+1 sits.
// u(f) is the camera depth in levels. Every level renders identical content (gate label cycles k mod 3), so the
// picture at depth u and u+3 is the same image: a seamless log-periodic loop. Speed is constant (1 level / 60 f)
// over [60, 420], i.e. a loop period of 180 frames there.
import {CRT_W0} from '../arcade/crt';
import {integ, smooth, type Knot} from './util';

export const R = 0.5;
export const PW = 1600;
export const PH = 900;
const V = 1 / 60; // levels per frame while cruising
export const K_CRT = 8; // the level whose window becomes the CRT screen
const S_IN = 0.92; // screen scale of level 0 while the frames form

const knots = (vPeak: number): Knot[] => [
  [-12, 0],
  [12, 0],
  [60, V],
  [420, V],
  [446, vPeak],
  [480, 0],
];
const U0 = Math.log2(S_IN);
// Peak speed solved so that at f = 480 level K_CRT's window is exactly CRT_W0 wide (the Arcade's doorway).
const A = integ(knots(0), 480);
const B = integ(knots(1), 480) - A;
const V_PEAK = (K_CRT + Math.log2(CRT_W0 / (PW * R)) - U0 - A) / B;
const KNOTS = knots(V_PEAK);

export const depth = (f: number) => U0 + integ(KNOTS, f);
const TWIST = 7; // degrees per level
export const twist = (f: number) => TWIST * smooth(12, 90, f) * (1 - smooth(420, 446, f));
// Screen width of level k's centre window at frame f.
export const windowW = (k: number, f: number) => PW * R * 2 ** (depth(f) - k);
