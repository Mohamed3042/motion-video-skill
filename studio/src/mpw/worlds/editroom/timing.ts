import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mpw/worlds/editroom.ts.
// 120 BPM: beat = 30 f, bar = 120 f, 8th = 15 f. 840 f = 7 bars.
export const T = {
  drop: [4, 36], // Library's aligned timeline drops to the program track
  chop: [36, 56], // V1 is razored into alternating stills A | B
  titleOut: 84,
  beta: [30, 150], // the playhead plays A,B,A,B… one still per 8th note: you see one ball moving
  reveal: 150, // the two stills separate: nothing ever moved
  illusion: 180, // "Every cut is an illusion."
  director: 210, // CAMERA DIRECTOR
  switches: [240, 285, 345, 375], // A→B, B→C, C→A, A→B (a clack on every switch)
  hold: 318, // CAM B spikes but the minimum shot length holds the cut
  silence: 390, // SILENCE ROUGH CUT
  detect: 412,
  collapse: [435, 450, 465, 480], // the quiet gaps fold shut (the beat stutters exactly here)
  list: 495,
  keep: 516, // a breath is switched back to Keep (the list is editable)
  launcher: 540, // COMMAND LAUNCHER
  snaps: [555, 570, 585, 600],
  lock: 615, // the recipe chain locks
  run: 630,
  done: 654,
  captions: 660, // STYLED CAPTIONS
  styles: [675, 705, 735], // Clean · Pop · Focus
  exit: 780, // everything but the cut timeline leaves
  dot: 822, // the cut timeline has collapsed into one fixation dot (Profile's Troxler world)
};
export const BETA_CUTS = Array.from({length: 8}, (_, i) => 45 + i * 15); // 45 … 150

export const EVENTS: WorldEvent[] = [
  ...BETA_CUTS.map((f) => ({f, kind: 'tick' as const})),
  {f: T.illusion, kind: 'impact', shake: 8},
  ...T.switches.map((f) => ({f, kind: 'tick' as const})),
  {f: T.detect, kind: 'blip'},
  ...T.collapse.map((f) => ({f, kind: 'hit' as const})),
  {f: T.list, kind: 'blip'},
  {f: T.keep, kind: 'tick'},
  ...T.snaps.map((f) => ({f, kind: 'tick' as const})),
  {f: T.lock, kind: 'hit', shake: 5},
  {f: T.run, kind: 'tick'},
  {f: T.done, kind: 'blip'},
  ...T.styles.map((f) => ({f, kind: 'tick' as const})),
  {f: T.exit + 10, kind: 'whoosh'},
  {f: T.dot, kind: 'tick'},
];
// Local frame the finale montage freezes on: Camera Director mid-cut.
export const HERO_FRAME = 300;
