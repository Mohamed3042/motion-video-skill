import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mkv/worlds/settings.ts.
// 120 BPM: beat = 30 f. Bars: 0 title + Necker flips · 120 solidify · 240 status · 360 "Runs on your PC." + unfold.
export const T = {
  titleOut: 112,
  flips: [60, 90, 120], // Necker depth reading flips (perceptual: shading swaps, no rotation)
  solid: 150, // wireframe solidifies into the brushed-silver engine block (impact), then it really rotates
  card: 172,
  tabs: [195, 210, 225, 240, 255], // Overview · Audio tools · Storage · About · back to Overview
  rows: [270, 285, 300, 315], // status rows report in (blip each)
  storage: 330, // local-storage bar fills
  pc: 390, // "Runs on your PC."
  exit: 440, // block turns face-on and shrinks
  unfold: [460, 474], // side faces unfold flat (tick when they land)
  page: [474, 488], // the cross net becomes a page (Guide's portal)
};

export const EVENTS: WorldEvent[] = [
  ...T.flips.map((f) => ({f, kind: 'tick' as const})),
  {f: T.solid, kind: 'impact', shake: 12},
  ...T.tabs.map((f) => ({f, kind: 'tick' as const})),
  ...T.rows.map((f) => ({f, kind: 'blip' as const})),
  {f: T.storage, kind: 'tick'},
  {f: T.pc, kind: 'hit'},
  {f: T.unfold[1], kind: 'tick'},
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 166;
