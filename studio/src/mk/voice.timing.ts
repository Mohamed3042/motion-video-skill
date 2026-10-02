// MK Voice reel timing. Plain TS (no imports, erasable syntax only):
// imported by the React scenes AND by scripts/mk/music.ts (node --experimental-strip-types).
// All values are absolute frames at 60 fps. 120 BPM -> one beat = 30 frames, one bar = 120.

export const FPS = 60;
export const DURATION = 1200;
export const TRANS = 12; // every cut is a 12-frame designed transition centred on the cut frame

export const SCENES = [
  {id: 'signal', label: 'Signal', from: 0, to: 180, out: 'zoom'},
  {id: 'title', label: 'MK Voice', from: 180, to: 330, out: 'whip'},
  {id: 'library', label: 'Library', from: 330, to: 570, out: 'iris'},
  {id: 'convert', label: 'Conversion', from: 570, to: 780, out: 'whip'},
  {id: 'prepare', label: 'Dataset', from: 780, to: 960, out: 'flash'},
  {id: 'kinetic', label: 'Workflow', from: 960, to: 1050, out: 'zoom'},
  {id: 'end', label: 'MK Voice', from: 1050, to: 1200, out: 'none'},
] as const;

export const EV = {
  dot: 12, // point of light appears
  waveFrom: 28,
  waveTo: 96,
  bars: [104, 110, 116, 122, 128], // five icon bars snap up
  riserFrom: 120,
  title: 180, // boom + title slam (zoom-through peak)
  subline: 222,
  sweep: 252,
  rows: [366, 381, 396, 411, 426], // library rows land
  select: 468, // row selected
  playFrom: 474,
  nodes: [600, 630, 660], // source, workflow, output nodes
  flowFrom: 672,
  flowTo: 744,
  done: 750, // output ready
  slices: [810, 825, 840, 855, 870], // dataset segment markers
  slidersFrom: 880,
  ready: 930,
  words: [960, 990, 1020], // ORGANIZE. PREPARE. CONVERT.
  lock: 1080, // end-card mark locks
  tag: 1098,
  foot: 1122,
} as const;

export const CUTS = [180, 330, 570, 780, 960, 1050] as const;

// Sound events consumed by the music script (and by the sync assert).
export const SFX = {
  whooshes: CUTS,
  impacts: [EV.title, EV.lock],
  hits: EV.words,
  clicks: [EV.dot, ...EV.bars, ...EV.rows, ...EV.nodes, ...EV.slices],
  blips: [EV.select, EV.done, EV.ready],
  riser: [EV.riserFrom, EV.title],
  riser2: [1050, EV.lock],
} as const;
