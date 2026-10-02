// Job Engine Orbit — "Your next chapter has coordinates" (120 s). Global layout; single source of truth
// for picture AND sound. Plain TS (no JSX/enums) so `node scripts/orbit/*.ts` can import it.

export const FPS = 60;
export const DURATION = 7200; // 120 s
export const BEAT = 30; // 120 BPM
export const BAR = 120;
export const PAD = 12; // section Sequences start PAD frames early and end PAD frames late (portal overlap)

export type StoryId = 'chaos' | 'turn';
export type WorldId = 'profile' | 'globe' | 'findings' | 'focus' | 'fit' | 'nextproof' | 'market' | 'employers' | 'engine' | 'anywhere';
export type SectionId = StoryId | WorldId;

export type Section = {id: SectionId; kind: 'story' | 'world'; index: number; name: string; start: number; end: number};

export const SECTIONS: Section[] = [
  {id: 'chaos', kind: 'story', index: 0, name: 'THE NOISE', start: 0, end: 720},
  {id: 'turn', kind: 'story', index: 0, name: 'ORBIT', start: 720, end: 1320},
  {id: 'profile', kind: 'world', index: 1, name: 'PROFILE & RESUME', start: 1320, end: 1800},
  {id: 'globe', kind: 'world', index: 2, name: 'THE GLOBE', start: 1800, end: 2280},
  {id: 'findings', kind: 'world', index: 3, name: 'NEW FINDINGS', start: 2280, end: 2760},
  {id: 'focus', kind: 'world', index: 4, name: 'JOB FOCUS', start: 2760, end: 3240},
  {id: 'fit', kind: 'world', index: 5, name: 'YOUR FIT', start: 3240, end: 3720},
  {id: 'nextproof', kind: 'world', index: 6, name: 'NEXT PROOF', start: 3720, end: 4200},
  {id: 'market', kind: 'world', index: 7, name: 'MY MARKET', start: 4200, end: 4680},
  {id: 'employers', kind: 'world', index: 8, name: 'EMPLOYERS', start: 4680, end: 5160},
  {id: 'engine', kind: 'world', index: 9, name: 'EVIDENCE & AGENTS', start: 5160, end: 5640},
  {id: 'anywhere', kind: 'world', index: 10, name: 'YOURS, EVERYWHERE', start: 5640, end: 6120},
];
export const WORLDS = SECTIONS.filter((s) => s.kind === 'world') as Array<Section & {id: WorldId}>;

export const DROP = 1320; // 22.0 s — BOOM into world 1
export const FINALE = {start: 6120, end: 7200};
export const LOGO_LOCK = 6480; // 108.0 s

// Every sound-bearing moment. `f` is LOCAL to its section (0 = section start frame).
// impact/hit may also drive the global camera shake (`shake` = px amplitude, ~5–14).
export type SectionEvent = {f: number; kind: 'impact' | 'hit' | 'tick' | 'whoosh' | 'blip'; shake?: number};

export const sectionById = (id: SectionId) => SECTIONS.find((s) => s.id === id)!;

export const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
