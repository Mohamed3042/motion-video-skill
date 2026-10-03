import type {SectionEvent} from '../../timing.ts';

// World 9 · EVIDENCE & AGENTS — local frames (0 = section start). Imported by World.tsx AND scripts/orbit2/sections/engine.ts.
// 120 BPM: beat = 30 f, bar = 120 f.
// Bar 1: café-wall rows shear into stripes; the aperture closes into a tall pole → stripes "climb" (barber pole).
// Bar 2: the aperture widens (impact) — the stripes only ever moved sideways; the band becomes the agent pipeline.
// Bar 3: evidence ledger (publisher · captured · status), one rejected claim struck through.
// Bar 4: AI & research connections chips; the pole returns, turns flat and collapses into two dots.
export const T = {
  lock: 30, // aperture closes into the pole (tick)
  looks: 54, // caption "Looks like it's climbing."
  widen: 120, // impact: the aperture opens wide — the true sideways motion
  stages: [150, 180, 210, 240], // planner → miner → verifier → synthesis (synthesis = bar-3 downbeat hit)
  dock: 246, // pipeline band docks to the top; the ledger panel enters
  rows: [270, 285, 300, 315], // ledger rows land
  reject: 330, // the rejected claim is struck through (hit)
  conn: 345, // connections panel enters
  chips: [360, 375, 390, 405], // Free only · Capped paid · Connected chat · Local model
  pick: 420, // "Free only" selected
  pole: 436, // UI clears, the band closes back into the pole (whoosh)
  turn: 452, // the pole turns flat and collapses
  dots: 474, // two dots remain (tick) — the portal into world 10
};

export const EVENTS: SectionEvent[] = [
  {f: T.lock, kind: 'tick'},
  {f: T.widen, kind: 'impact', shake: 9},
  ...T.stages.slice(0, 3).map((f) => ({f, kind: 'blip' as const})),
  {f: T.stages[3], kind: 'hit'},
  ...T.rows.map((f) => ({f, kind: 'blip' as const})),
  {f: T.reject, kind: 'hit', shake: 5},
  ...T.chips.map((f) => ({f, kind: 'tick' as const})),
  {f: T.pick, kind: 'blip'},
  {f: T.pole, kind: 'whoosh'},
  {f: T.dots, kind: 'tick'},
];
// Local frame the finale montage freezes on (the most iconic frame of this section).
export const HERO_FRAME = 228;

// Exit geometry shared with world 10's entry: two dots on the horizontal centre line.
export const EXIT_DOTS = [
  {x: 760, y: 540},
  {x: 1160, y: 540},
] as const;
export const DOT_R = 15;
