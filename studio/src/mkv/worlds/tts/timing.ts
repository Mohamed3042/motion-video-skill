import {mulberry32, type WorldEvent} from '../../timing.ts'; // explicit .ts: node imports this file too

// Local frames (0 = world start). Imported by World.tsx AND scripts/mkv/worlds/tts.ts.
// 4 bars @ 120 BPM: bar 1 = 0, bar 2 = 120, bar 3 = 240, bar 4 = 360.
export const LINE = 'Welcome to my channel.';

// one key per character, human-ish rhythm (seeded), a breath after each space
export const KEYS: number[] = (() => {
  const r = mulberry32(404);
  const out: number[] = [];
  let t = 206;
  for (const ch of LINE) {
    out.push(t);
    t += 4 + Math.floor(r() * 3) + (ch === ' ' ? 2 : 0);
  }
  return out;
})();

export const T = {
  title: 15, // world title slams in (an 8th after the downbeat, clear of the boundary impact)
  align: 120, // the anamorphic shards align perfectly on exactly this frame (impact)
  pick: 192, // "My voice" pill selected
  generate: 330, // Generate speech pressed
  dropStart: 338, // letter i starts falling at dropStart + 2i, lands 14 frames later
  dropFall: 14,
  output: 404, // output row: play button + timecode
  play: 416, // play pressed, playhead sweeps the bars
  exit: 440, // bars stand up into nested frames (portal to Training)
};

// landing frame of each non-space character (letters become waveform bars)
export const LAND: number[] = [...LINE].flatMap((ch, i) => (ch === ' ' ? [] : [T.dropStart + 2 * i + T.dropFall]));

export const EVENTS: WorldEvent[] = [
  {f: T.title, kind: 'hit'},
  {f: T.align, kind: 'impact', shake: 12},
  {f: T.pick, kind: 'tick'},
  ...KEYS.map((f) => ({f, kind: 'tick' as const})),
  {f: T.generate, kind: 'hit', shake: 6},
  {f: T.output, kind: 'blip'},
  {f: T.play, kind: 'tick'},
  {f: T.exit + 8, kind: 'whoosh'},
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = T.align;
