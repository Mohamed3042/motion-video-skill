// MK Voice — Nine Worlds. Global layout; single source of truth for picture AND sound.
// Plain TS (no JSX/enums) so `node scripts/mkv/*.ts` can import it.

export const FPS = 60;
export const DURATION = 5400; // 90 s
export const BEAT = 30; // 120 BPM
export const BAR = 120;
export const PAD = 12; // world Sequences start PAD frames early and end PAD frames late (transition overlap)

export type WorldId = 'myvoice' | 'clonelab' | 'live' | 'tts' | 'training' | 'arcade' | 'evolution' | 'settings' | 'guide';

export type World = {id: WorldId; index: number; name: string; start: number; end: number};

export const WORLDS: World[] = [
  {id: 'myvoice', index: 1, name: 'MY VOICE', start: 360, end: 840},
  {id: 'clonelab', index: 2, name: 'CLONE LAB', start: 840, end: 1320},
  {id: 'live', index: 3, name: 'LIVE', start: 1320, end: 1800},
  {id: 'tts', index: 4, name: 'TEXT TO SPEECH', start: 1800, end: 2280},
  {id: 'training', index: 5, name: 'TRAINING', start: 2280, end: 2760},
  {id: 'arcade', index: 6, name: 'VOICE ARCADE', start: 2760, end: 3240},
  {id: 'evolution', index: 7, name: 'EVOLUTION', start: 3240, end: 3720},
  {id: 'settings', index: 8, name: 'SETTINGS', start: 3720, end: 4200},
  {id: 'guide', index: 9, name: 'GUIDE', start: 4200, end: 4620},
];

export const INTRO = {start: 0, end: 360};
export const FINALE = {start: 4620, end: 5400};
export const LOGO_LOCK = 4920; // 82.0 s

// Every sound-bearing moment. `f` is LOCAL to its world (0 = world start frame).
// impact/hit may also drive the global camera shake (`shake` = px amplitude, ~6–14).
export type WorldEvent = {f: number; kind: 'impact' | 'hit' | 'tick' | 'whoosh' | 'blip'; shake?: number};

export const worldById = (id: WorldId) => WORLDS.find((w) => w.id === id)!;

export const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
