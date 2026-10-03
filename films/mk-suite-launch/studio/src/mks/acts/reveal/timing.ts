import type {MksEvent} from '../../timing.ts';

// Act 1 · Reveal. Existing picture timings, in local frames (0 = global 600).
// Act.tsx and the composer share these cues; changing sound must never retime the picture.
export const T = {
  drop: 0,
  M1: 180, // Explore → Studio morph
  EX: 240, // layers start separating / camera orbits
  SLAM: 360, // layers lock together and the bloom fires
  CLICK1: 540, // Compact
  CLICK2: 660, // Focus
  PUSH: 788, // final camera push starts
  pushEnd: 852, // camera keyframe continues under the following act's bloom
  pushWhoosh: 836, // fast outgoing move, just before the global 1440 cut
  supers: {
    title: 30,
    redesigned: 372,
    studio: 480,
    compact: 552,
    focus: 672,
    library: 744,
  },
} as const;

// The shell applies all shake. The score skips its synthetic drop when this impact is present,
// keeping one drop at global 600 and adding the previously missing reveal UI sound design.
export const EVENTS: MksEvent[] = [
  {f: T.drop, kind: 'impact', gain: 1.15, shake: 6},
  {f: T.supers.title, kind: 'hit', gain: 0.55},
  {f: T.M1, kind: 'whoosh', gain: 0.45},
  {f: T.EX, kind: 'whoosh', gain: 0.55},
  {f: T.SLAM, kind: 'impact', gain: 0.7, shake: 5},
  {f: T.supers.redesigned, kind: 'hit', gain: 0.45},
  {f: T.supers.studio, kind: 'hit', gain: 0.35},
  {f: T.CLICK1, kind: 'click', gain: 0.85},
  {f: T.supers.compact, kind: 'hit', gain: 0.4},
  {f: T.CLICK2, kind: 'click', gain: 0.85},
  {f: T.supers.focus, kind: 'hit', gain: 0.4},
  {f: T.supers.library, kind: 'hit', gain: 0.5},
  {f: T.PUSH, kind: 'swell', gain: 0.45},
  {f: T.pushWhoosh, kind: 'whoosh', gain: 0.6},
];
