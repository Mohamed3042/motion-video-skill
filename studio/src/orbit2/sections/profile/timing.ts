import type {SectionEvent} from '../../timing.ts'; // explicit .ts: node imports this file too

// World 1 · PROFILE & RESUME — local frames (0 = section start = the drop). 4 bars @ 120 BPM, beat = 30 f.
// Imported by World.tsx AND scripts/orbit2/sections/profile.ts.
export const NAME = 'PROFILE & RESUME';
const r32 = (f0: number, n: number) => Array.from({length: n}, (_, i) => Math.round(f0 + i * 3.75)); // 32nd notes

// the title is typed, one key per character on 32nd notes
export const KEYS = r32(7.5, NAME.length);

// the profile fields type themselves (one key per character, 32nds)
export const FIELDS = {name: 'Sam Sample', headline: 'Data analyst'};
export const NAME_KEYS = r32(247.5, FIELDS.name.length);
export const HEAD_KEYS = r32(285, FIELDS.headline.length);

export const T = {
  drop: 0, // BOOM: the coral satellite light bursts into the spiral
  promise: 75, // "Your story. Confirmed." (carriage-return ding)
  traceStart: 120, // a highlight starts tracing ONE ring of the "spiral"
  traceEnd: 180, // ...and closes it: it is a circle (impact) → cords untwist
  recede: 222, // the spiral steps back into a backdrop
  card: 226, // profile card rises
  create: 240, // "Create blank profile" pressed
  evidence: 252, // "Build your evidence" panel rises
  importDoc: 263, // "Import a document" pressed
  formats: r32(270, 6), // PDF · DOCX · TXT · MD · CSV · JSON chips
  confirmA: 300, // Confirm ✓ (Python · Skill)
  confirmB: 308, // Confirm ✓ (project)
  exclude: 315, // Exclude
  returnRv: 330, // Return to review
  page: 334, // resume page slides in
  fly: 345, // confirmed lines lift off and fly into the page (whoosh peak 350)
  landA: 356, // ...land (printer)
  landB: 362,
  downloads: [375, 383, 390], // Download PDF · DOCX · TXT
  matching: 405, // "Use for job matching" switch flips on
  exit: 428, // UI clears; the page travels to centre and curls into the sphere
  curl: 448,
  sphere: 474, // fully a sphere (holds through the hand-off)
};

export const EVENTS: SectionEvent[] = [
  {f: T.drop, kind: 'impact', shake: 10},
  ...KEYS.map((f) => ({f, kind: 'tick' as const})),
  {f: T.promise, kind: 'blip'},
  {f: T.traceStart, kind: 'blip'},
  {f: T.traceEnd, kind: 'hit', shake: 6},
  {f: 236, kind: 'whoosh'},
  {f: T.create, kind: 'hit'},
  {f: T.importDoc, kind: 'tick'},
  ...T.formats.map((f) => ({f, kind: 'tick' as const})),
  {f: T.confirmA, kind: 'hit'},
  {f: T.confirmB, kind: 'tick'},
  {f: T.exclude, kind: 'tick'},
  {f: T.returnRv, kind: 'tick'},
  {f: 350, kind: 'whoosh'},
  {f: T.landA, kind: 'tick'},
  {f: T.landB, kind: 'tick'},
  ...T.downloads.map((f) => ({f, kind: 'blip' as const})),
  {f: T.matching, kind: 'hit', shake: 5},
  {f: 468, kind: 'whoosh'},
];

// Local frame the finale montage freezes on: the traced ring closing over the "spiral".
export const HERO_FRAME = 420;
