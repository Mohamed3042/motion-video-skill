import type {MksEvent} from '../../timing.ts';

// Local frames (0 = act start). The composer (scripts/mks/music.ts) renders a sound for every event.
// The big drop (impact) at global 600 belongs to act 1 (its local frame 0).
export const EVENTS: MksEvent[] = [
  {f: 120, kind: 'hit', gain: 0.55}, // "You make a lot of things."
  {f: 222, kind: 'swell', gain: 0.5}, // camera starts to rush
  // the rush: each word lands on its beat as its card is showcased; the card whooshes past ~8 f later
  {f: 240, kind: 'hit', gain: 0.8}, // Voices.
  {f: 248, kind: 'whoosh', gain: 0.6},
  {f: 270, kind: 'hit', gain: 0.8}, // Videos.
  {f: 278, kind: 'whoosh', gain: 0.6},
  {f: 300, kind: 'hit', gain: 0.8}, // Packaging.
  {f: 308, kind: 'whoosh', gain: 0.6},
  {f: 330, kind: 'hit', gain: 0.8}, // Music.
  {f: 338, kind: 'whoosh', gain: 0.6},
  {f: 360, kind: 'hit', gain: 0.85}, // Characters.
  {f: 365, kind: 'whoosh', gain: 0.45},
  {f: 375, kind: 'hit', gain: 0.85}, // Automations.
  {f: 380, kind: 'whoosh', gain: 0.45},
  {f: 390, kind: 'hit', gain: 0.85}, // Quotes.
  {f: 395, kind: 'whoosh', gain: 0.45},
  {f: 405, kind: 'hit', gain: 0.9}, // Classrooms.
  {f: 410, kind: 'whoosh', gain: 0.45},
  {f: 420, kind: 'hit', gain: 0.7}, // "One place for all of it." (camera brakes)
  {f: 480, kind: 'swell', gain: 0.9}, // riser into the drop at global 600
  {f: 510, kind: 'tick', gain: 0.8}, // tile row 1 locks in
  {f: 525, kind: 'tick', gain: 0.8}, // row 2
  {f: 540, kind: 'tick', gain: 0.8}, // row 3
  {f: 550, kind: 'whoosh', gain: 0.4}, // header / chips / top bar / sidebar slide in
];
