// The Work → Grow seam (global frame 3840), owned on both sides. t = frames relative to the cut
// (work local f - 960, grow local f). The camera rushes into the green Activity glyph of the 07 sidebar;
// a vector copy takes over and lands as the Grow chapter icon, where its bars re-grow into the Grow glyph.
import {ACTIVITY_BARS, ACTIVITY_ICON_BOX, GROW_BARS, P, WC, chapterIconSlot, mag, type Cam3} from './parts';
import {clamp, ease, lerp, prog} from '../../kit';

export const SEAM_START = -60; // zoom begins 60 f before the cut
export const GROW_X0 = 500; // Grow chapter block left edge
// Camera of the Activity wide shot at the moment the zoom starts (must match work/Body camAt(900)).
export const SEAM_CAM0: Cam3 = {x: 120, y: 96, z: 0};
const ICON = {X: ACTIVITY_ICON_BOX.x + ACTIVITY_ICON_BOX.w / 2 - WC.x, Y: ACTIVITY_ICON_BOX.y + ACTIVITY_ICON_BOX.h / 2 - WC.y};

export type SeamIcon = {x: number; y: number; size: number; bars: [number, number, number]; m: number; glow: number};

// Icon state in SCREEN px for t in [SEAM_START, +inf).
export const seamIcon = (t: number): SeamIcon => {
  const slot = chapterIconSlot(GROW_X0);
  const m0 = mag(0, SEAM_CAM0.z);
  const m1 = slot.size / ACTIVITY_ICON_BOX.w;
  const x0 = 960 + (ICON.X - SEAM_CAM0.x) * m0;
  const y0 = 540 + (ICON.Y - SEAM_CAM0.y) * m0;
  const p = prog(t, SEAM_START, 0);
  const u = p ** 2.4; // accelerate into the cut
  const m = Math.exp(lerp(Math.log(m0), Math.log(m1), u));
  // position eases earlier than the zoom so the glyph travels to its slot while still small
  const pu = ease.inOut(prog(t, SEAM_START, -4));
  // landing slam: a quick damped overshoot of size after the cut
  const s = t > 0 ? 1 + 0.14 * Math.exp(-t / 7) * Math.sin(t / 2.2) : 1;
  const b = ease.backOut(prog(t, -4, 16));
  const bars = [0, 1, 2].map((i) => lerp(ACTIVITY_BARS[i], GROW_BARS[i], b)) as [number, number, number];
  return {
    x: lerp(x0, slot.x, pu),
    y: lerp(y0, slot.y, pu),
    size: ACTIVITY_ICON_BOX.w * m * s,
    bars,
    m,
    glow: clamp(0.4 + 0.9 * u + (t > 0 ? 0.5 * Math.exp(-t / 14) : 0), 0, 1.4),
  };
};

// Camera that keeps the window's glyph exactly under the vector icon (t < 0 only).
export const seamCam = (t: number): Cam3 => {
  const s = seamIcon(Math.min(t, 0));
  return {x: ICON.X - (s.x - 960) / s.m, y: ICON.Y - (s.y - 540) / s.m, z: P - P / s.m};
};
