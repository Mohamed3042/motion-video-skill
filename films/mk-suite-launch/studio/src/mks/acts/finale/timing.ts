import type {MksEvent} from '../../timing.ts';

// Act 6 · Finale (global 6000–7200). Local frames (0 = act start; 1 beat = 30 f, 1 bar = 120 f).
// Act.tsx animates FROM these numbers, EVENTS sonify them. (The Guide → Welcome pan whoosh lands at
// local −26, i.e. before 6000, so it lives in act 5's EVENTS.)
export const T = {
  sweep: 240, // light sweep crosses the Welcome glass cubes
  match: 360, // match cut: Welcome's MK Voice cube → the website's MK Voice card (whoosh peak)
  cols: [540, 570, 600], // Create · Work · Grow columns light
  swell: 630, // riser into the mark
  lock: 720, // MK SUITE mark locks — green bloom (impact)
  tagline: 780, // "Your tools. One place."
  cww: 840, // "Create · Work · Grow"
  small: 900, // "The new MK Suite · coming in the next update"
  fadeStart: 1050, // slow fade to black on the final chord …
  black: 1196, // … fully black from here (act ends at 1200)
} as const;

export const EVENTS: MksEvent[] = [
  {f: T.sweep, kind: 'whoosh', gain: 0.3},
  {f: T.match, kind: 'whoosh', gain: 0.75},
  ...T.cols.map((f): MksEvent => ({f, kind: 'hit', gain: 0.7})),
  {f: T.swell, kind: 'swell'},
  {f: T.lock, kind: 'impact', shake: 14},
  {f: T.tagline, kind: 'hit', gain: 0.5},
  {f: T.cww, kind: 'hit', gain: 0.35},
];
