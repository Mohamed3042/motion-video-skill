// The hidden word. Every track is a stereo clip: two channel waveforms (L over R), so the four tracks stack eight
// symmetric waveform rows. "IN SYNC" is set in an 8-row pixel face; row r is channel r&1 of track r>>1, and a
// filled pixel is simply a loud burst in that channel. Alone, each track reads as noisy stereo audio with
// transients; only when all four tracks sit at the same offset do the stacked bursts spell the word.
import {mulberry32} from '../../timing.ts';

export const LANE = {x0: 290, x1: 1800, top: 372, h: 100, gap: 8};
export const LANE_W = LANE.x1 - LANE.x0;
export const laneY = (i: number) => LANE.top + i * (LANE.h + LANE.gap);
export const STACK_H = 4 * LANE.h + 3 * LANE.gap;

const FACE: Record<string, string[]> = {
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#.#.#', '#..##', '#..##', '#...#'],
  S: ['.###.', '#...#', '#....', '.###.', '....#', '....#', '#...#', '.###.'],
  Y: ['#...#', '#...#', '.#.#.', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#....', '#...#', '.###.'],
};
const GAP = 1; // columns between letters
const SPACE = 3; // columns for the space

// cells[row] = set of filled columns
const COLS: boolean[][] = Array.from({length: 8}, () => []);
let cursor = 0;
for (const ch of 'IN SYNC') {
  if (ch === ' ') {
    cursor += SPACE - GAP;
    continue;
  }
  const g = FACE[ch];
  g.forEach((row, r) => [...row].forEach((c, k) => (COLS[r][cursor + k] = c === '#')));
  cursor += g[0].length + GAP;
}
export const WORD_COLS = cursor - GAP;
export const U = 40; // px per column
export const WORD_W = WORD_COLS * U;
export const WORD_X = Math.round((LANE_W - WORD_W) / 2); // lane-local x where the word starts (at zero offset)

const covered = (lx: number, row: number) => {
  const c = Math.floor((lx - WORD_X) / U);
  return c >= 0 && c < WORD_COLS && !!COLS[row][c];
};

// Waveform bars per lane and channel (lane-local x). a: half-height in px around the channel's centre line.
export const PITCH = 4;
export const CH_H = LANE.h / 2; // one channel row
export const chY = (ch: number) => CH_H / 2 + ch * CH_H; // channel centre, lane-local
const CLIP_START = [-150, -60, -230, 18]; // lane-local x where each camera's clip begins
export const clipStart = (i: number) => CLIP_START[i];
export const CLIP_END = LANE_W + 420;
export type Bar = {x: number; a: number; word: boolean};

export const BARS: Bar[][][] = [0, 1, 2, 3].map((lane) =>
  [0, 1].map((ch) => {
    const r = mulberry32(9100 + lane * 77 + ch * 13);
    const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
    const half = CH_H / 2 - 3;
    const bars: Bar[] = [];
    for (let x = CLIP_START[lane] + PITCH / 2; x < CLIP_END; x += PITCH) {
      // smooth loudness envelope (phrases) + per-bar jitter
      const env = Math.max(0, 0.5 + 0.5 * Math.sin(x / 61 + ph[0]) * Math.sin(x / 23 + ph[1]) + 0.18 * Math.sin(x / 9.7 + ph[2]));
      const inWord = x > WORD_X - 8 && x < WORD_X + WORD_W + 8;
      let a = inWord ? 1 + 3.2 * env * r() : 2 + 13 * env * (0.4 + 0.6 * r());
      if (!inWord && r() < 0.03) a = half * (0.75 + 0.25 * r());
      const w = covered(x, lane * 2 + ch);
      if (w) a = half * (0.86 + 0.14 * r());
      bars.push({x, a: Math.min(half, a), word: w});
    }
    return bars;
  }),
);
