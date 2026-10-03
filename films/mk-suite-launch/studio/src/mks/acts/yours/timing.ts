import type {MksEvent} from '../../timing.ts';

// Act 5 · Make it yours (global 4800–6000). Local frames (0 = act start; 1 beat = 30 f, 1 bar = 120 f).
// Act.tsx animates FROM these numbers, EVENTS sonify them — one source of truth for picture and sound.
export const T = {
  super1: 30, // "Make it your suite." (lands on beat 1)
  push: 186, // camera push into the bundle builder (whoosh peak)
  clickTab: 210, // cursor clicks "Build a bundle"
  ticks: [240, 270, 300], // MK Voice, MK Editor, Montage Pro tick (cursor click + tick each)
  pulse: 330, // "Creator bundle · 3 apps" pulses
  pullBack: 368, // camera pulls back (whoosh peak)
  super2: [390, 420, 450], // "One app." "A bundle." "Or everything." ↔ the three tabs light
  dialog: 506, // Review your selection scales in (whoosh peak)
  rows: [570, 600, 630], // the three apps + their 12-month terms highlight
  whipA: 720, // whip pan → Settings
  dark: 750, // "Dark."
  clickLight: 780, // cursor clicks the Light theme → circular reveal; "Light."
  reveal: 798, // reveal wavefront peak
  yours: 810, // "Yours."
  whipB: 950, // whip up → Guide
  answers: 990, // "Answers, built in."
  bridge: 1174, // camera pans from Guide to Welcome across the seam (whoosh peak; = finale g −26)
} as const;

export const EVENTS: MksEvent[] = [
  {f: T.super1, kind: 'hit', gain: 0.7},
  {f: T.push, kind: 'whoosh', gain: 0.45},
  {f: T.clickTab, kind: 'click'},
  ...T.ticks.flatMap((f): MksEvent[] => [
    {f, kind: 'click'},
    {f, kind: 'tick'},
  ]),
  {f: T.pulse, kind: 'hit', gain: 0.8},
  {f: T.pullBack, kind: 'whoosh', gain: 0.4},
  ...T.super2.map((f): MksEvent => ({f, kind: 'hit', gain: 0.55})),
  {f: T.dialog, kind: 'whoosh', gain: 0.55},
  ...T.rows.map((f): MksEvent => ({f, kind: 'tick'})),
  {f: T.whipA, kind: 'whoosh', gain: 0.8},
  {f: T.dark, kind: 'hit', gain: 0.45},
  {f: T.clickLight, kind: 'click'},
  {f: T.reveal, kind: 'whoosh', gain: 0.6},
  {f: T.yours, kind: 'hit', gain: 0.75},
  {f: T.whipB, kind: 'whoosh', gain: 0.8},
  {f: T.answers, kind: 'hit', gain: 0.6},
  {f: T.bridge, kind: 'whoosh', gain: 0.85},
];
