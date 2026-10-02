// After its last interaction the pointer glides off the control and fades, so the result label stays readable.
// `from` is the scene-local frame where the exit starts (last click or drag end + ~14 frames for the ripple).
import {clamp, ease} from '../util';

export const cursorOut = (f: number, from: number) => {
  const t = ease.cubicOut(clamp((f - from) / 18));
  return t > 0 ? {opacity: 1 - t, translate: `${28 * t}px ${24 * t}px`} : undefined;
};
