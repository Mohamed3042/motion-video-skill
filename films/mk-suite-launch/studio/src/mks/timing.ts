// MK Suite — launch film (120 s). Global layout: single source of truth for picture AND sound.
// Plain TS (no JSX/enums) so `node scripts/mks/*.ts` can import it.

export const FPS = 60;
export const DURATION = 7200; // 120 s
export const BPM = 120;
export const BEAT = 30; // frames per beat
export const BAR = 120; // frames per bar
export const PAD = 12; // act Sequences start PAD frames early and end PAD late (transition overlap)

export type ActId = 'coldopen' | 'reveal' | 'create' | 'work' | 'grow' | 'yours' | 'finale';
export type Act = {id: ActId; index: number; name: string; start: number; end: number};

export const ACTS: Act[] = [
  {id: 'coldopen', index: 0, name: 'COLD OPEN', start: 0, end: 600},
  {id: 'reveal', index: 1, name: 'REVEAL', start: 600, end: 1440},
  {id: 'create', index: 2, name: 'CREATE', start: 1440, end: 2880},
  {id: 'work', index: 3, name: 'WORK', start: 2880, end: 3840},
  {id: 'grow', index: 4, name: 'GROW', start: 3840, end: 4800},
  {id: 'yours', index: 5, name: 'MAKE IT YOURS', start: 4800, end: 6000},
  {id: 'finale', index: 6, name: 'FINALE', start: 6000, end: 7200},
];

// Sound-bearing moments, LOCAL to their act (0 = act start). The composer renders a sound for every event.
// click = cursor click · key = keycap press · type = one typed character · tick = check/row light ·
// whoosh = camera move / transition (event frame = PEAK of the whoosh) · hit = title/word landing ·
// impact = big moment (boom) · swell = start of a riser that ends on the next impact.
export type EventKind = 'click' | 'key' | 'type' | 'tick' | 'whoosh' | 'hit' | 'impact' | 'swell';
export type MksEvent = {f: number; kind: EventKind; gain?: number; shake?: number};

export const actById = (id: ActId) => ACTS.find((a) => a.id === id)!;
// Beat grid helper: local frame of bar b (0-based), beat n (0-3), optional eighth (0|1).
export const beatF = (bar: number, beat = 0, eighth = 0) => bar * BAR + beat * BEAT + eighth * (BEAT / 2);

export const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
