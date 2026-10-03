// Montage Pro: Eleven Worlds. Global layout; single source of truth for picture AND sound.
// Plain TS (no JSX/enums) so `node scripts/mpw/*.ts` can import it.

export const FPS = 60;
export const DURATION = 9840; // 164 s
export const BEAT = 30; // 120 BPM
export const BAR = 120;
export const PAD = 12; // world Sequences start PAD frames early and end PAD frames late (edit overlap)

export type WorldId =
  | 'ingest'
  | 'sync'
  | 'review'
  | 'captions'
  | 'handoff'
  | 'sound'
  | 'picture'
  | 'library'
  | 'editroom'
  | 'profile'
  | 'anywhere';

export type ActId = 'cut' | 'studio' | 'yours';
export type World = {id: WorldId; index: number; name: string; act: ActId; start: number; end: number};

export const WORLDS: World[] = [
  {id: 'ingest', index: 1, name: 'INGEST', act: 'cut', start: 480, end: 1080},
  {id: 'sync', index: 2, name: 'SYNC', act: 'cut', start: 1080, end: 2040},
  {id: 'review', index: 3, name: 'REVIEW', act: 'cut', start: 2040, end: 2640},
  {id: 'captions', index: 4, name: 'CAPTIONS & MARKERS', act: 'cut', start: 2640, end: 3360},
  {id: 'handoff', index: 5, name: 'HANDOFF', act: 'cut', start: 3360, end: 3960},
  {id: 'sound', index: 6, name: 'SOUND LAB', act: 'studio', start: 3960, end: 5040},
  {id: 'picture', index: 7, name: 'PICTURE LAB', act: 'studio', start: 5040, end: 6120},
  {id: 'library', index: 8, name: 'LIBRARY', act: 'studio', start: 6120, end: 6960},
  {id: 'editroom', index: 9, name: 'EDIT ROOM', act: 'studio', start: 6960, end: 7800},
  {id: 'profile', index: 10, name: 'PROFILE & INTELLIGENCE', act: 'yours', start: 7800, end: 8520},
  {id: 'anywhere', index: 11, name: 'ANYWHERE, PRIVATE', act: 'yours', start: 8520, end: 9000},
];

export const ACTS: Record<ActId, string> = {cut: 'ACT I — THE CUT', studio: 'ACT II — THE STUDIO', yours: 'ACT III — YOURS'};

export const INTRO = {start: 0, end: 480};
export const FINALE = {start: 9000, end: 9840};
export const LOGO_LOCK = 9480; // 158.0 s

// Every sound-bearing moment. `f` is LOCAL to its world (0 = world start frame).
// impact/hit may also drive the global camera shake (`shake` = px amplitude, ~5–14).
export type WorldEvent = {f: number; kind: 'impact' | 'hit' | 'tick' | 'whoosh' | 'blip'; shake?: number};

export const worldById = (id: WorldId) => WORLDS.find((w) => w.id === id)!;

export const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
