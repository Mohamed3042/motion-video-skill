import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx, the Ingest exit AND scripts/mpw/worlds/sync.ts.
// 8 bars @ 120 BPM (bar = 120 f). Lanes top→bottom: C1, C2, C3, ZOOM. Four stems enter offset and lock one by
// one on the bar downbeats: C1/kick @120 (reference), ZOOM/bass @240 (coarse vote), C3/pluck @360 (fine
// window), C2/pad @480 (drift → IN SYNC). The last lane to lock is a middle one, so the word stays broken
// until the very last frame of alignment.
export const STEM = ['kick', 'pad', 'pluck', 'bass'] as const; // per lane
export const T = {
  lock: [120, 480, 360, 240] as const, // lane i snaps to zero offset exactly here
  votes: [130, 138, 146, 154, 162, 170, 178, 186, 194, 202] as const, // coarse: one 60 s chunk votes per tick
  win: 210, // tallest cluster wins
  windows: [262, 274, 286, 298] as const, // fine: four short windows light up
  peak: 318, // sub-sample peak found
  drift: 390, // drift line drawn through the votes
  sync: 480, // IN SYNC impact (last lock)
  nudge: 570, // +1 ms pressed: the word dissolves
  back: 600, // −1 ms pressed: the word re-forms
  zoomOut: 636, // timeline zooms out to the whole day
  groups: [666, 702, 738] as const, // G1, G2, G3 land (clips stack across cameras)
  review: 780, // one weak clip flagged "Needs review"
  zoomIn: 846, // back into G1
  tiles: 900, // the aligned tracks become Review's four camera tiles
};

// Offsets (px on the lane timeline) of each track's clip before it locks. Smooth drift, then an accelerating
// slide that lands on exactly 0 at its lock frame, a small settle after (not on the final lock).
const BASE = [0, 206, -168, 236];
const AMP = [96, 44, 36, 30];
const W = [1 / 38, 1 / 47, 1 / 53, 1 / 61];
const PH = [0, 1.3, 4.1, 2.2];
const FINAL = 1; // lane that locks last (no settle wobble: the word must be crisp on the impact)
export const PX_MS = 0.6; // audio delay per px of visual offset (the music drifts exactly as the picture does)

const expoIn = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 2 ** (10 * t - 10));
export const NUDGE_PX = 78;

export const offsetPx = (i: number, f: number): number => {
  const L = T.lock[i];
  const drift = BASE[i] + AMP[i] * Math.sin(W[i] * f + PH[i]);
  const SLIDE = 28;
  let o: number;
  if (f >= L) {
    const k = f - L;
    o = i === FINAL ? 0 : -Math.sign(BASE[i] || 1) * 7 * Math.exp(-k / 5) * Math.sin(k / 2.2);
  } else {
    const u = Math.min(1, Math.max(0, (f - (L - SLIDE)) / SLIDE));
    o = drift * (1 - u ** 2.6); // accelerating slide, lands on 0 exactly at the lock frame
  }
  // one-beat nudge on C3 (pluck)
  if (i === 2 && f >= T.nudge - 2 && f < T.back) {
    const a = Math.min(1, (f - (T.nudge - 2)) / 6);
    const b = expoIn((f - (T.back - 10)) / 10);
    o += NUDGE_PX * (1 - (1 - a) ** 3) * (1 - b);
  }
  return o;
};

export const EVENTS: WorldEvent[] = [
  {f: 120, kind: 'hit'},
  ...T.votes.map((f) => ({f, kind: 'tick' as const})),
  {f: T.win, kind: 'blip'},
  {f: 240, kind: 'hit', shake: 4},
  ...T.windows.map((f) => ({f, kind: 'tick' as const})),
  {f: T.peak, kind: 'blip'},
  {f: 360, kind: 'hit', shake: 5},
  {f: T.sync, kind: 'impact', shake: 13},
  {f: T.nudge, kind: 'tick'},
  {f: T.back, kind: 'hit', shake: 5},
  {f: T.zoomOut, kind: 'whoosh'},
  ...T.groups.map((f) => ({f, kind: 'blip' as const})),
  {f: T.review, kind: 'blip'},
  {f: T.zoomIn, kind: 'whoosh'},
  {f: T.tiles, kind: 'hit'},
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 540;
