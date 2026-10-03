import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mpw/worlds/ingest.ts.
// 5 bars @ 120 BPM (bar = 120 f): the day folder opens · copy · re-read + verify (the ✓ resolves) · originals
// untouched · the clips' audio peeks out as four waveform strips (Sync's opening pose).
export const T = {
  fold: 24, // the intro's playhead line has drawn the day folder around itself (folder closes: tape thump)
  subs: [30, 45, 60, 75] as const, // C1 · C2 · C3 · ZOOM subfolders fan out
  fly: 132, // the four camera folders fly to the SOURCE column
  files: Array.from({length: 12}, (_, k) => 140 + 8 * k), // one tick per copied file (140 … 228)
  reread: 240, // RE-READ both sides
  blocks: Array.from({length: 8}, (_, k) => 246 + 15 * k), // one tick per matched hash block (246 … 351)
  match: 360, // both SHA-256 match: the ✓ is fully resolved (impact)
  untouched: 384, // "Originals never touched." (lock)
  verified: [396, 408, 420, 432] as const, // each camera's copy marked VERIFIED
  peek: 480, // the clips' audio peeks out as four waveform strips (tape thump)
  exit: 588, // whoosh into Sync
};
// files per camera, copied in order (12 ticks)
export const CLIPS = [4, 3, 3, 2];

export const EVENTS: WorldEvent[] = [
  {f: T.fold, kind: 'hit'},
  ...T.subs.map((f) => ({f, kind: 'tick' as const})),
  {f: T.fly, kind: 'whoosh'},
  ...T.files.map((f) => ({f, kind: 'tick' as const})),
  ...T.blocks.map((f) => ({f, kind: 'tick' as const})),
  {f: T.match, kind: 'impact', shake: 9},
  {f: T.untouched, kind: 'blip'},
  ...T.verified.map((f) => ({f, kind: 'blip' as const})),
  {f: T.peek, kind: 'hit', shake: 4},
  {f: T.exit, kind: 'whoosh'},
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 372;
