import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mkv/worlds/myvoice.ts.
// Bar 1 title · bar 2 Rubin's vase peak + contour detaches · bar 3 profile card + pill tabs · bar 4 characters + exit.
export const PEAK = 120; // medallion arrives centred, the vase/face flipping starts
export const DETACH = 198; // the vase contour lifts off …
export const CARD = 240; // … and lands as the profile card's waveform
export const TABS = [252, 270, 300, 330]; // Profiles (shown) → Setup → Intake → Compare
export const CHARS = [360, 390, 420]; // Character A / B / C
export const EXIT = 436; // UI leaves, the contour straightens into the stair edge
// Rhodes comp rhythm inside every bar (beat 1, the "and" of 2, beat 4): the vase contour ripples on these.
export const COMP = [0, 45, 90];

export const EVENTS: WorldEvent[] = [
  {f: PEAK, kind: 'hit'},
  {f: 222, kind: 'whoosh'}, // whooshes are marked at their peak: mid-flight of the contour
  {f: CARD, kind: 'hit', shake: 5},
  {f: TABS[1], kind: 'blip'},
  {f: TABS[2], kind: 'blip'},
  {f: TABS[3], kind: 'blip'},
  {f: CHARS[0], kind: 'hit', shake: 7},
  {f: CHARS[1], kind: 'hit'},
  {f: CHARS[2], kind: 'hit'},
  {f: 466, kind: 'whoosh'}, // the line pivots into the stair edge
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 140;
