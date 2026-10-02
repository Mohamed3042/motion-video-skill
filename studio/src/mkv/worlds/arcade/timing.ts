import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mkv/worlds/arcade.ts.
// Bar 1: push into the CRT + title. Bar 2: stage map. Bar 3: take select → SELECT → APPROVE. Bar 4: RESET, CRT off.
export const A = {
  title: 30, // VOICE ARCADE slams in
  stages: [120, 150, 180], // cursor lands on STAGE 1 · 2 · 3
  grid: 212, // map docks left, take grid + tools shelf build
  hops: [240, 255, 270, 285], // cursor hops across take tiles
  select: 300, // SELECT: coin
  approve: 330, // APPROVE: power-up
  reset: 390, // RESET: tiles shuffle back (two more shuffle steps)
  shuffle: [398, 406],
  home: 420, // cursor back on TAKE 01
  collapse: 462, // CRT power-off: the picture collapses…
  line: 471, // …to one bright line (the framework portal splits it into the Evolution grating on the boundary)
} as const;

export const EVENTS: WorldEvent[] = [
  {f: A.title, kind: 'impact', shake: 8},
  ...A.stages.map((f) => ({f, kind: 'blip' as const})),
  ...A.hops.map((f) => ({f, kind: 'tick' as const})),
  {f: A.select, kind: 'hit'},
  {f: A.approve, kind: 'impact', shake: 10},
  {f: A.reset, kind: 'hit'},
  ...A.shuffle.map((f) => ({f, kind: 'tick' as const})),
  {f: A.home, kind: 'tick'},
  {f: A.collapse, kind: 'whoosh'},
  {f: A.line, kind: 'blip'},
];

// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 342;
