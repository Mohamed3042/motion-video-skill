import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mkv/worlds/evolution.ts.
// 120 BPM: beat = 30 f, bar = 120 f. Bars: 0 title+moiré · 120 convergence · 240 A/B rows · 360 Run comparison.
export const T = {
  titleOut: 100,
  bIn: 6, // grating B (candidate) slides in over grating A (original)
  converge: 60, // B starts rotating/scaling toward A
  reveal: 180, // moiré resolves into the giant "A ⇄ B" (impact)
  release: 224, // B drifts off again; moiré becomes the backdrop
  rowA: 240,
  rowB: 255,
  runBtn: 270,
  editorChip: 285,
  sideCard: 315,
  saved: [330, 345],
  run: 360, // "Run comparison" press (impact) → scan line
  scanEnd: 396,
  kept: 390,
  savedNew: 420, // the new result lands in Saved results
  exit: 446, // UI leaves; gratings rotate into the wireframe cube edge (locked at 480)
};

// Ping-pong motif: A (original) calls hard left, B (candidate) answers hard right — once per bar.
export const PINGS: {f: number; side: 'A' | 'B'; bar: number; step: number}[] = [];
for (let bar = 0; bar < 4; bar++)
  ([[0, 'A'], [15, 'A'], [30, 'A'], [60, 'B'], [75, 'B'], [90, 'B']] as const).forEach(([o, side], step) =>
    PINGS.push({f: bar * 120 + o, side, bar, step}),
  );

export const EVENTS: WorldEvent[] = [
  {f: T.reveal, kind: 'impact', shake: 10},
  {f: T.rowA, kind: 'tick'},
  {f: T.rowB, kind: 'tick'},
  {f: T.runBtn, kind: 'tick'},
  {f: T.editorChip, kind: 'tick'},
  {f: T.sideCard, kind: 'tick'},
  {f: T.saved[0], kind: 'blip'},
  {f: T.saved[1], kind: 'blip'},
  {f: T.run, kind: 'impact', shake: 8},
  {f: T.kept, kind: 'blip'},
  {f: T.savedNew, kind: 'blip'},
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 204;
