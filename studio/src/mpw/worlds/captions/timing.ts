import {mulberry32, type WorldEvent} from '../../timing.ts'; // explicit .ts: node imports this file too

// Local frames (0 = world start). Imported by World.tsx AND scripts/mpw/worlds/captions.ts.
// 6 bars @ 120 BPM: bar 1 = 0, 2 = 120, 3 = 240, 4 = 360, 5 = 480, 6 = 600.
export const LINE = 'Evrey anlge. Evrey wrod.'; // typoglycemia: first/last letters hold, middles scrambled
export const FIXED = 'Every angle. Every word.';

// one key per character from the caret Review handed over; human-ish rhythm, a breath after each space
export const KEYS: number[] = (() => {
  const r = mulberry32(4040);
  const out: number[] = [];
  let t = 0;
  for (const ch of LINE) {
    out.push(t);
    t += 3 + Math.floor(r() * 2) + (ch === ' ' ? 2 : 0);
  }
  return out;
})();

export const T = {
  fix0: 184, // first word fix (each word: two letters snap home, 3 frames apart)
  fixStep: 16,
  fixed: 240, // the line reads right (impact)
  fly: 250, // the line flies into the editor
  imported: 276, // SRT / WebVTT import chips confirm
  search: 324, // "word" typed into search, one key per 4 frames
  found: 342, // search highlight
  shift: 390, // Shift cues: every cue slides together
  split: 450, // Split at playhead
  undo: 480,
  redo: 495,
  marker1: 510, // "Laugh — keep"
  marker2: 540, // "Cut here?"
  exported: 570, // Export SRT / Export WebVTT
  exit: 600, // cue blocks fly and stack into three bars (the next world's prongs)
};
export const SEARCH = 'word';
export const SEARCH_KEYS = [...SEARCH].map((_, i) => T.search + i * 4);
export const STACK_LAND = Array.from({length: 12}, (_, j) => 612 + j * 6);

// Every letter that moves home: from slot → to slot, landing frame (a click per fixed character).
export const MOVES: {from: number; to: number; land: number}[] = (() => {
  const out: {from: number; to: number; land: number}[] = [];
  let w = 0;
  let i = 0;
  while (i < LINE.length) {
    if (!/[a-z]/i.test(LINE[i])) {
      i++;
      continue;
    }
    let j = i;
    while (j < LINE.length && /[a-z]/i.test(LINE[j])) j++;
    const used = new Set<number>();
    let n = 0;
    for (let k = i; k < j; k++) {
      if (LINE[k] === FIXED[k]) continue;
      let to = -1;
      for (let q = i; q < j; q++) if (!used.has(q) && LINE[q] !== FIXED[q] && FIXED[q] === LINE[k]) {
        to = q;
        break;
      }
      used.add(to);
      out.push({from: k, to, land: T.fix0 + w * T.fixStep + n * 3});
      n++;
    }
    w++;
    i = j;
  }
  return out;
})();

export const EVENTS: WorldEvent[] = [
  ...KEYS.map((f) => ({f, kind: 'tick' as const})),
  ...MOVES.map((m) => ({f: m.land, kind: 'tick' as const})),
  {f: T.fixed, kind: 'impact', shake: 8},
  {f: T.fly + 12, kind: 'whoosh'},
  {f: T.imported, kind: 'tick'},
  ...SEARCH_KEYS.map((f) => ({f, kind: 'tick' as const})),
  {f: T.found, kind: 'blip'},
  {f: T.shift, kind: 'tick'},
  {f: T.split, kind: 'hit'},
  {f: T.undo, kind: 'tick'},
  {f: T.redo, kind: 'tick'},
  {f: T.marker1, kind: 'blip'},
  {f: T.marker2, kind: 'blip'},
  {f: T.exported, kind: 'hit', shake: 4},
  ...STACK_LAND.map((f) => ({f, kind: 'tick' as const})),
];
// Local frame the finale montage freezes on: the scrambled line mid-fix, letters snapping home.
export const HERO_FRAME = 229;
