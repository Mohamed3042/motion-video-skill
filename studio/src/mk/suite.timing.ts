// MK Suite family reel timing. Plain TS, no imports (shared with scripts/mk/music.ts).
// Absolute frames at 60 fps; 120 BPM -> beat = 30 frames.

export const FPS = 60;
export const DURATION = 1200;
export const TRANS = 12;

export const SCENES = [
  {id: 'mark', label: 'MK Suite', from: 0, to: 180, out: 'zoom'},
  {id: 'library', label: 'Library', from: 180, to: 420, out: 'whip'},
  {id: 'families', label: 'Families', from: 420, to: 600, out: 'zoom'},
  {id: 'voice', label: 'MK Voice', from: 600, to: 780, out: 'whip'},
  {id: 'montage', label: 'Montage Pro', from: 780, to: 960, out: 'iris'},
  {id: 'end', label: 'Together', from: 960, to: 1200, out: 'none'},
] as const;

const icons: number[] = [];
for (let i = 0; i < 17; i++) icons.push(198 + i * 4);

export const EV = {
  drawFrom: 10,
  drawTo: 84,
  markLock: 90,
  word: 102,
  tagline: 126,
  icons, // 17 product tiles land, one every 4 frames
  count: 300,
  catalog: 330,
  words: [420, 450, 480], // CREATE. WORK. GROW.
  sort: 516,
  voiceWave: 612,
  voiceChips: [660, 675, 690],
  snaps: [822, 852, 882], // Montage clips snap into sync
  montageChips: [900, 915, 930],
  ring: 972,
  lock: 1020,
  wordmark: 1036,
  tag: 1062,
  foot: 1092,
} as const;

export const CUTS = [180, 420, 600, 780, 960] as const;

export const SFX = {
  whooshes: CUTS,
  impacts: [EV.markLock, EV.lock],
  hits: [...EV.words, ...EV.snaps],
  clicks: [...EV.voiceChips, ...EV.montageChips, EV.sort],
  notes: icons, // pitched ticks, one per product tile
  blips: [EV.count],
  riser: [40, EV.markLock],
  riser2: [972, EV.lock],
} as const;
