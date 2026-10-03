import type {WorldEvent} from '../../timing';

// World 7 · PICTURE LAB (1080 f, 9 bars @ 120 BPM; bar k downbeat = 120k). Local frames, 0 = world start.
// Imported by World.tsx AND scripts/mpw/worlds/picture.ts (keep value imports out: node strips types only).
export const T = {
  band: 0, // spectrogram colors condense into the RGB band (hit, bar 1)
  w0: 108, // band rises through the title, revealing the checker-shadow board (wipe centre)
  // COLOR BALANCE · REFERENCE COLOR MATCH — Adelson checker shadow
  pickA: 168, // eyedropper samples A
  pickB: 186, // eyedropper samples B
  bridge: 204, // the bridge + scope trace start drawing
  bridgeW: 216, // bridge whoosh peak
  proof: 240, // scope proves A = B (impact, bar 3)
  bridgeOff: 280, // bridge retracts: the illusion comes back
  w1: 306, // wipe to the split-frame color match
  match: 330, // "Process on PC": source half matches the reference
  w2: 390, // wipe to MOTION TRACKING (barber pole behind a slot)
  track: 470, // "Track clip": the aperture opens
  locks: [488, 495, 503, 510], // tracker points lock (mechanical ticks)
  planar: 540, // planar surface takes over
  pins: 552, // four corner pins lock
  pinLT: 570, // lower third pinned to the surface
  w3: 606, // wipe to SHOT STABILIZATION (induced motion)
  measure: 666, // measure pass draws the camera path
  stabilize: 696, // second pass: render the stabilized copy
  lock: 720, // the frame locks (hit, bar 7)
  w4: 750, // wipe to the finishing viewer
  finish: 750, // FILM FINISH
  flicker: 810, // FLICKER REDUCTION
  even: 840, // exposure evens out (hit, bar 8)
  restore: 870, // IMAGE RESTORATION
  scale: 930, // SCALE & MOTION
  crisp: 960, // native scaling resolves the mosaic (hit, bar 9)
  title: 990, // TITLE & LOWER THIRD
  render: 996, // "Render title"
  exit: 1036, // the frame becomes a film strip
  slide: 1056, // strip slides (whoosh peak) into Library's thumbnail grid
};

export const EVENTS: WorldEvent[] = [
  {f: T.band, kind: 'hit', shake: 6},
  {f: T.w0, kind: 'whoosh'},
  {f: T.pickA, kind: 'tick'},
  {f: T.pickB, kind: 'tick'},
  {f: T.bridgeW, kind: 'whoosh'},
  {f: T.proof, kind: 'impact', shake: 10},
  {f: T.w1, kind: 'whoosh'},
  {f: T.match, kind: 'tick'},
  {f: T.w2, kind: 'whoosh'},
  {f: T.track, kind: 'tick'},
  ...T.locks.map((f) => ({f, kind: 'tick' as const})),
  {f: T.pins, kind: 'tick'},
  {f: T.pinLT, kind: 'blip'},
  {f: T.w3, kind: 'whoosh'},
  {f: T.stabilize, kind: 'tick'},
  {f: T.lock, kind: 'hit'},
  {f: T.w4, kind: 'whoosh'},
  {f: T.flicker, kind: 'tick'},
  {f: T.even, kind: 'hit'},
  {f: T.restore, kind: 'tick'},
  {f: T.scale, kind: 'tick'},
  {f: T.crisp, kind: 'hit'},
  {f: T.render, kind: 'tick'},
  {f: T.slide, kind: 'whoosh'},
];

// Local frame the finale montage freezes on: the checker-shadow proof (bridge + scope, A = B).
export const HERO_FRAME = 252;
