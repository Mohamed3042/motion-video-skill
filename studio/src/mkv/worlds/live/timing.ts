import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mkv/worlds/live.ts.
// 4 bars @ 120 BPM: bar 1 = 0, bar 2 = 120, bar 3 = 240, bar 4 = 360.
export const T = {
  lock: 0, // entry ring locks; the drift field is completely static for bar 1
  drop: 120, // Live starts: the rings really turn, house drops
  nodes: [150, 158, 165], // MIC, VOICE, OUTPUT nodes light
  echo: 255, // Echo cancellation toggle snaps on
  monitor: 270, // Monitor toggle snaps on
  overdrive: 300, // Overdrive flips: surge + glow ring
  gpu: 330, // "Renderer · GPU" status chip
  words: 360, // Live words panel lands
  wordAt: [368, 375, 383, 390, 398], // the five words appear
  grow: [404, 446] as const, // text size + panel size grow
  detach: 452, // a letter detaches as a shard (portal to TTS)
};

export const EVENTS: WorldEvent[] = [
  {f: T.lock, kind: 'hit'},
  {f: T.drop, kind: 'impact', shake: 10},
  ...T.nodes.map((f) => ({f, kind: 'tick' as const})),
  {f: T.echo, kind: 'tick'},
  {f: T.monitor, kind: 'tick'},
  {f: T.overdrive, kind: 'impact', shake: 12},
  {f: T.gpu, kind: 'blip'},
  {f: T.words, kind: 'hit'},
  ...T.wordAt.map((f) => ({f, kind: 'tick' as const})),
  {f: T.detach, kind: 'blip'},
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 96;
