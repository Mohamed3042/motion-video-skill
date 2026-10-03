// Logo geometry (measured on public/orbit2/brand/orbit-512.png, 512 px space) and the logo's screen layout over story time g.
import {CX, CY, ease, lerp, prog} from '../chaos/util';
import {LOCK, RELAYOUT} from './timing';

export const T0 = 720; // story frame of the turn's local 0
export const SPHERE = {x: 254, y: 258, r: 145};
export const RING = {x: 258, y: 243, a: 207, b: 88, tilt: -25.3, w: 17}; // centre-line ellipse, w = band width
export const SAT = {x: 409.5, y: 128.5, r: 37};
export const TILT = (RING.tilt * Math.PI) / 180;
export const ASPECT = RING.b / RING.a;

export type Box = {x: number; y: number; s: number}; // logo box centre + size (px)
const S0 = 440;
// Before the planet forms, the box sits so the ring centre is the screen centre (where the coral point ignites).
const PRE: Box = {x: CX - ((RING.x - 256) * S0) / 512, y: CY - ((RING.y - 256) * S0) / 512, s: S0};
const LOCKED: Box = {x: 960, y: 430, s: S0};
export const HERO: Box = {x: 960, y: 300, s: 300};

export const logoBox = (g: number): Box => {
  const e1 = ease.cubicInOut(prog(g, T0 + 70, T0 + LOCK));
  const e2 = ease.cubicInOut(prog(g, T0 + RELAYOUT[0], T0 + RELAYOUT[1]));
  return {x: lerp(lerp(PRE.x, LOCKED.x, e1), HERO.x, e2), y: lerp(lerp(PRE.y, LOCKED.y, e1), HERO.y, e2), s: lerp(S0, HERO.s, e2)};
};
export const toScreen = (b: Box, px: number, py: number): [number, number] => [b.x + ((px - 256) * b.s) / 512, b.y + ((py - 256) * b.s) / 512];
export const ringCenter = (g: number) => toScreen(logoBox(g), RING.x, RING.y);
export const k512 = (b: Box) => b.s / 512;
