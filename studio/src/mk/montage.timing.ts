// Montage Pro reel timing. Plain TS, no imports (shared with scripts/mk/music.ts).
// Absolute frames at 60 fps; 120 BPM -> beat = 30 frames.

export const FPS = 60;
export const DURATION = 1200;
export const TRANS = 12;

export const SCENES = [
  {id: 'slate', label: 'Slate', from: 0, to: 120, out: 'flash'},
  {id: 'title', label: 'Montage Pro', from: 120, to: 270, out: 'whip'},
  {id: 'sync', label: 'AudioSync', from: 270, to: 540, out: 'playhead'},
  {id: 'select', label: 'Select', from: 540, to: 750, out: 'iris'},
  {id: 'markers', label: 'Markers', from: 750, to: 930, out: 'whip'},
  {id: 'handoff', label: 'Handoff', from: 930, to: 1050, out: 'zoom'},
  {id: 'end', label: 'Montage Pro', from: 1050, to: 1200, out: 'none'},
] as const;

export const EV = {
  strips: [16, 34, 52, 70], // CAM A, CAM B, CAM C, AUDIO fly in
  riserFrom: 72,
  clap: 120, // slate clap = title slam = boom
  subline: 162,
  scanFrom: 296,
  scanTo: 360,
  snaps: [390, 420, 450], // CAM B, CAM C, AUDIO snap into sync
  locked: 480,
  cams: [600, 630, 660], // camera selection moves
  channels: [690, 705], // audio channel toggles
  markers: [780, 795, 810, 825],
  captions: [846, 861, 876],
  chips: [960, 975, 990], // export files stack into the handoff
  packed: 1020,
  lock: 1080,
  tag: 1098,
  foot: 1122,
} as const;

export const CUTS = [120, 270, 540, 750, 930, 1050] as const;

export const SFX = {
  whooshes: CUTS,
  impacts: [EV.clap, EV.lock],
  hits: EV.snaps,
  clicks: [...EV.cams, ...EV.channels, ...EV.markers, ...EV.chips],
  swishes: [...EV.strips, ...EV.captions],
  blips: [EV.locked, EV.packed],
  riser: [EV.riserFrom, EV.clap],
  riser2: [1050, EV.lock],
} as const;
