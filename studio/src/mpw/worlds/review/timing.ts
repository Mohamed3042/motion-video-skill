import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mpw/worlds/review.ts.
// 5 bars @ 120 BPM: bar 1 = 0, 2 = 120, 3 = 240, 4 = 360, 5 = 480.
export const T = {
  dock: 120, // the UI assembles around the grid (sources, inspector, timeline)
  lockB: 240, // CAM B snaps into sync
  lockC: 270, // CAM C snaps into sync
  lockD: 300, // CAM D snaps: all four in sync, the light bar becomes one motion (impact)
  nudgeMinus: 360, // Nudge −1 ms
  nudgePlus: 390, // Nudge +1 ms
  undo: 420,
  redo: 450,
  exit: 492, // UI clears; the shared playhead flies to centre and becomes the caption caret
  caret: 576, // the caret lands
};

// Sync offsets (frames) of each camera tile as recorded; CAM A is the reference.
// Chosen so each tile's bars sit about half a spacing off its neighbours (maximally broken) until it locks.
export const OFFSETS = [0, 20, -21, 59];
export const LOCKS = [0, T.lockB, T.lockC, T.lockD];

// Light bars: three bars 520 px apart sweep left to right at 13 px/frame, x in grid space (grid is 1040 px wide).
export const SWEEP = {speed: 13, spacing: 520};
export const beamsX = (t: number) => {
  const p = (((t * SWEEP.speed) % SWEEP.spacing) + SWEEP.spacing) % SWEEP.spacing;
  return [p - 260, p + 260, p + 780];
};

export const EVENTS: WorldEvent[] = [
  {f: 0, kind: 'hit'},
  {f: T.dock, kind: 'hit'},
  {f: T.lockB, kind: 'tick'},
  {f: T.lockC, kind: 'tick'},
  {f: T.lockD, kind: 'impact', shake: 9},
  {f: T.nudgeMinus, kind: 'blip'},
  {f: T.nudgePlus, kind: 'blip'},
  {f: T.undo, kind: 'tick'},
  {f: T.redo, kind: 'tick'},
  {f: 540, kind: 'whoosh'},
  {f: T.caret, kind: 'tick'},
];
// Local frame the finale montage freezes on: all four tiles in sync, the light bar one continuous line.
export const HERO_FRAME = 304;
