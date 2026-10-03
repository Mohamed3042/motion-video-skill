import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mpw/worlds/library.ts.
// 120 BPM: beat = 30 f, bar = 120 f. 840 f = 7 bars.
export const T = {
  gridIn: 30, // Picture Lab's film strip has broken into the thumbnail grid
  titleOut: 80,
  reflow: 88, // grid reflows under the search bar
  libKeys: [105, 113, 120, 128, 135], // "CAM B"
  libFilter: 150, // results filter to camera B
  catalog: 186, // PC MEDIA CATALOG
  catKeys: [195, 203, 210, 218, 225, 233], // "street"
  catResults: 240, // visual match + spoken word cards
  jump: 258, // whoosh peak: jump to the source
  land: 270, // playhead lands on the sampled visual match
  jump2: 285, // second jump: the spoken-word timestamp
  transcribe: 300, // LOCAL TRANSCRIPTION
  cues: [324, 342, 360],
  qc: 390, // MEDIA QC & DAILIES: the flicker paradigm starts
  cycle: 60, // A 24 f · blank 6 f · A′ 24 f · blank 6 f (cycle starts on 390, 450, 510)
  flag: 540, // QC flags the frozen region on the A′ onset
  rows: [540, 556, 572],
  proxy: 600, // PROXY PREPARATION
  jobs: [630, 642, 654],
  sync: 660, // zoetrope reaches sync: the stills start to move
  tc: 720, // TIMECODE ASSEMBLY
  ltc: 735, // LTC read
  align: 780, // tracks snap into timecode alignment
  exit: 800, // chrome fades; the aligned clips are the hand-off to the Edit Room
};

export const EVENTS: WorldEvent[] = [
  ...T.libKeys.map((f) => ({f, kind: 'tick' as const})),
  {f: T.libFilter, kind: 'blip'},
  ...T.catKeys.map((f) => ({f, kind: 'tick' as const})),
  {f: T.catResults, kind: 'blip'},
  {f: T.jump, kind: 'whoosh'},
  {f: T.land, kind: 'hit'},
  {f: T.jump2, kind: 'blip'},
  ...T.cues.map((f) => ({f, kind: 'blip' as const})),
  ...[420, 450, 480, 510].map((f) => ({f, kind: 'tick' as const})), // each new picture after a blank
  {f: T.flag, kind: 'impact', shake: 9},
  ...T.rows.slice(1).map((f) => ({f, kind: 'tick' as const})),
  ...T.jobs.map((f) => ({f, kind: 'tick' as const})),
  {f: T.sync, kind: 'hit'},
  {f: T.ltc, kind: 'blip'},
  {f: T.align, kind: 'impact', shake: 6},
];
// Local frame the finale montage freezes on: the QC flag on the frozen region.
export const HERO_FRAME = 566;
