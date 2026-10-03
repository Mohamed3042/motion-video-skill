import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mpw/worlds/handoff.ts.
// 5 bars @ 120 BPM: bar 1 = 0, 2 = 120, 3 = 240, 4 = 360, 5 = 480.
export const T = {
  xml: 120, // prong 1 labelled: FCP7 XML (brass stab)
  subs: 150, // prong 2: SRT · VTT
  json: 180, // prong 3: JSON REPORT
  box: 246, // the package rises under the fork
  arrive: [282, 290, 298], // a file pulse lands in the package from each prong
  sink: 328, // the fork sinks into the package
  seal: 360, // the lid closes and the tape seals it (impact)
  untouched: 420, // "never modified or re-encoded" check
  lid: 556, // the lid pops open
  pour: 580, // a waveform pours out (into Sound Lab)
};

export const EVENTS: WorldEvent[] = [
  {f: 0, kind: 'hit'},
  {f: T.xml, kind: 'hit'},
  {f: T.subs, kind: 'hit'},
  {f: T.json, kind: 'hit'},
  {f: T.box, kind: 'whoosh'},
  ...T.arrive.map((f) => ({f, kind: 'tick' as const})),
  {f: T.seal, kind: 'impact', shake: 12},
  {f: T.untouched, kind: 'tick'},
  {f: T.lid, kind: 'blip'},
  {f: T.pour, kind: 'whoosh'},
];
// Local frame the finale montage freezes on: the impossible fork with all three prongs labelled.
export const HERO_FRAME = 222;
