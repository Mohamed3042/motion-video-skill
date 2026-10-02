import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mkv/worlds/guide.ts.
// 420 frames = 14 beats. 0 title + Kanizsa · 140 square → page · 176 search · 240 FAQ deck · 306 page flip · 396 exit.
export const QUERY = 'How do I calibrate?';
export const T = {
  titleOut: 112,
  discs: [30, 45, 60, 75], // each pac-man disc clicks into place (bell)
  square: 90, // edge inducers complete: the illusory square is fully formed
  real: 140, // the square becomes a real page
  toDeck: 156, // the page flips over onto the FAQ deck (swish peak)
  search: 168,
  typeFrom: 176, // one character every 3 frames
  fan: [240, 248, 255, 263, 270], // FAQ cards fan out like a deck (swish each)
  lift: 292,
  flip: 318, // the illustrated page turns (swish peak, mid-turn)
  chips: [345, 360],
  exit: 396, // pages scatter into the nine finale rings
};
export const typeFrames = [...QUERY].map((_, i) => T.typeFrom + i * 3);

export const EVENTS: WorldEvent[] = [
  ...T.discs.map((f) => ({f, kind: 'tick' as const})),
  {f: T.square, kind: 'hit', shake: 5},
  {f: T.toDeck, kind: 'whoosh'},
  ...typeFrames.map((f) => ({f, kind: 'tick' as const})),
  ...T.fan.map((f) => ({f, kind: 'whoosh' as const})),
  {f: T.flip, kind: 'whoosh'},
  ...T.chips.map((f) => ({f, kind: 'blip' as const})),
  {f: T.exit + 2, kind: 'whoosh'},
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 120;
