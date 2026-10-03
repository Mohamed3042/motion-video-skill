import type {MksEvent} from '../../timing.ts';

// Local frames (0 = act start). The composer (scripts/mks/music.ts) renders a sound for every event.
// Act 3 · Work — picture source: acts/work/Body.tsx (keep in sync).
export const EVENTS: MksEvent[] = [
  {f: 0, kind: 'impact', gain: 1, shake: 10}, // "Work." card stops at the end of the whip-pan
  {f: 8, kind: 'tick', gain: 0.5}, // third layer of the stack icon drops in
  {f: 156, kind: 'whoosh', gain: 0.7}, // chapter exits left, Compact library window swings in from the right
  {f: 240, kind: 'click'}, // cursor clicks the "Work" filter chip
  {f: 272, kind: 'whoosh', gain: 0.3}, // non-Work rows collapse
  {f: 286, kind: 'tick', gain: 0.7}, // MacroForge lit
  {f: 296, kind: 'tick', gain: 0.7}, // Reclaim lit
  {f: 306, kind: 'tick', gain: 0.7}, // Cake Studio lit
  {f: 319, kind: 'whoosh', gain: 0.45}, // window turns aside for the super
  {f: 330, kind: 'hit', gain: 0.7}, // super "Automate the desk work."
  {f: 450, kind: 'click'}, // sidebar: Secret Office
  {f: 469, kind: 'whoosh', gain: 0.45}, // window turns back to face camera
  {f: 480, kind: 'hit', gain: 0.7}, // super "Your private desk."
  {f: 523, kind: 'whoosh', gain: 0.4}, // super flies into the page
  {f: 536, kind: 'hit', gain: 0.5}, // super lands as the page title
  {f: 604, kind: 'whoosh', gain: 0.3}, // glide across MK Business OS → office tools
  {f: 675, kind: 'whoosh', gain: 0.4}, // pull back to the whole window
  {f: 690, kind: 'click'}, // sidebar: Activity
  {f: 700, kind: 'tick', gain: 0.45}, // timeline rows cascade in
  {f: 705, kind: 'tick', gain: 0.45},
  {f: 709, kind: 'tick', gain: 0.45},
  {f: 718, kind: 'tick', gain: 0.45},
  {f: 723, kind: 'tick', gain: 0.45},
  {f: 727, kind: 'tick', gain: 0.45},
  {f: 736, kind: 'tick', gain: 0.45},
  {f: 741, kind: 'tick', gain: 0.45},
  {f: 750, kind: 'impact', gain: 0.7, shake: 4}, // "Check before retrying" panel lifts + super "Know what happened…"
  {f: 900, kind: 'swell', gain: 0.9}, // riser into the dive → Grow impact at grow f0 (global 3840)
  {f: 954, kind: 'whoosh', gain: 1}, // camera dives into the Activity glyph (peak just before the cut)
];
