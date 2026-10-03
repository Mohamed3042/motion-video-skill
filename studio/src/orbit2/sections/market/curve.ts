// Piecewise eased camera curves shared by stations 7 and 8 (plain TS: imported by shot.ts modules).
import {smoother, type V3} from '../../engine/math.ts';

export type Ease = (t: number) => number;
export const lin: Ease = (t) => t;
export const out3: Ease = (t) => 1 - (1 - t) ** 3;
export const in2: Ease = (t) => t * t;
export {smoother};

const seg = <T,>(f: number, keys: [number, T][], ease: Ease[], mix: (a: T, b: T, t: number) => T): T => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i];
    const [f1, b] = keys[i + 1];
    if (f <= f1) return mix(a, b, (ease[i] ?? smoother)(Math.min(1, Math.max(0, (f - f0) / (f1 - f0)))));
  }
  return keys[keys.length - 1][1];
};
/** piecewise curve through [frame, value] keys; ease[i] shapes segment i (default smoother). */
export const curve = (f: number, keys: [number, number][], ease: Ease[] = []) => seg(f, keys, ease, (a, b, t) => a + (b - a) * t);
export const curve3 = (f: number, keys: [number, V3][], ease: Ease[] = []) =>
  seg(f, keys, ease, (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as V3);
