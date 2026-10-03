import type {MksEvent} from '../../timing.ts';

// Local frames (0 = act start). The composer (scripts/mks/music.ts) renders a sound for every event.
// Act 4 · Grow — picture source: acts/grow/Body.tsx (keep in sync).
export const EVENTS: MksEvent[] = [
  {f: 0, kind: 'impact', gain: 1, shake: 10}, // glyph lands as the Grow icon, bars re-grow, "Grow." slams in
  {f: 160, kind: 'whoosh', gain: 0.8}, // tilt-down pan from the chapter card to Explore
  {f: 240, kind: 'hit', gain: 0.55}, // MK Educate tile lifts out
  {f: 270, kind: 'hit', gain: 0.55}, // Quotation Builder lifts
  {f: 300, kind: 'hit', gain: 0.55}, // Flock Operations lifts
  {f: 334, kind: 'whoosh', gain: 0.45}, // Job Engine / Orbit card flies in and docks
  {f: 364, kind: 'whoosh', gain: 0.45}, // MK Marketplace card flies in and docks
  {f: 426, kind: 'click'}, // cursor clicks MK Educate "View details"
  {f: 449, kind: 'whoosh', gain: 0.7}, // Explore slides out, MK Educate destination slides in
  {f: 510, kind: 'tick', gain: 0.6}, // phone card starts to glow (ring draws, light sweep)
  {f: 520, kind: 'whoosh', gain: 0.3}, // camera drifts onto the phone card
  {f: 544, kind: 'swell', gain: 0.7}, // riser into the phones
  {f: 624, kind: 'impact', gain: 0.7, shake: 4}, // centre phone (22) rises
  {f: 636, kind: 'whoosh', gain: 0.5}, // desktop window turns aside
  {f: 642, kind: 'hit', gain: 0.5}, // left phone (23) fans out
  {f: 660, kind: 'hit', gain: 0.5}, // right phone (24) fans out
  {f: 690, kind: 'hit', gain: 0.6}, // super "On your desk. And on your phone."
  {f: 900, kind: 'swell', gain: 0.9}, // final push + brightening into the framework's bloom at global 4800
  {f: 956, kind: 'whoosh', gain: 0.8}, // push peaks into the cut
];
