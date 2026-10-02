import type {SectionEvent} from '../../timing.ts';

// Local frames (0 = section start). Imported by World.tsx AND scripts/orbit/sections/market.ts.
// 120 BPM, beat = 30 f. Bar 1: rails flatten into grid lines → Zöllner hatches. Bar 2: proof + "Straight comparisons."
// → the field turns into the matrix. Bar 3: matrix cells + capability demand. Bar 4: salary evidence, what changed, café-wall exit.
export const T = {
  titleOut: 92,
  hatch: [30, 60], // hatches grow on every other line, then the rest — the parallel lines start to lean
  pair: 120, // two neighbouring lines light coral: they look like they splay apart
  fade: 150, // hatches retract (sweep along the lines)
  gauge: 165, // equal-gap gauges at both ends of the coral pair
  straight: 180, // "Straight comparisons." (impact)
  turn: [210, 240], // field rotates level and contracts into the matrix grid (whoosh at the midpoint)
  matrix: 240, // matrix panel + country columns snap in (hit)
  cols: [255, 270, 285], // EG · KW · SA cells fill
  demand: 300, // capability demand bars grow
  salary: 360, // Salary evidence card lands (hit)
  changes: [390, 405, 420], // What changed: three ticks
  exit: 432, // UI leaves, row lines run full width and multiply
  cafe: 456, // café-wall tiles grow out of the lines and lock on the boundary (480)
};

export const EVENTS: SectionEvent[] = [
  ...T.hatch.map((f) => ({f, kind: 'tick' as const})),
  {f: T.pair, kind: 'blip'},
  {f: T.fade, kind: 'whoosh'},
  {f: T.gauge, kind: 'tick'},
  {f: T.straight, kind: 'impact', shake: 10},
  {f: (T.turn[0] + T.turn[1]) / 2, kind: 'whoosh'},
  {f: T.matrix, kind: 'hit'},
  ...T.cols.map((f) => ({f, kind: 'blip' as const})),
  {f: T.demand, kind: 'tick'},
  {f: T.salary, kind: 'hit', shake: 6},
  ...T.changes.map((f) => ({f, kind: 'blip' as const})),
  {f: 465, kind: 'whoosh'},
];
// Local frame the finale montage freezes on: the full Zöllner field with the coral pair lit.
export const HERO_FRAME = 136;
