// Intro "phase lock" (0–8 s). Global frames (the intro starts at 0). Plain TS: shared by the picture AND the sound,
// so the waveforms on screen are drawn from exactly the hits the soundtrack plays.
export const T0 = 30; // sub hit: four waveforms appear, four loops start in unison
export const LOCKS = [180, 210, 240, 270] as const; // CAM A, CAM B, CAM C, REC snap onto the 120 BPM grid (one per beat)
export const HIT = 300; // the aligned peaks become the amber playhead
export const WRITE = 330; // In/Out brackets open from the playhead and write MONTAGE PRO
export const TAG = [366, 381, 396] as const; // "Every angle." "Every word." "In sync."
export const CLOSE = 444; // brackets close back into one line
export const EXIT = 468; // the line becomes the first world's folder edge (edit 0 at 480)

export const LANES = ['CAM A', 'CAM B', 'CAM C', 'REC'] as const;
export const BEAT_S = 0.5;
export const PPS = 720; // waveform scroll, px per second (one beat = 360 px)

// Tempo error of each loop while it drifts (Reich phasing): +5 % late … −6 % early.
export const DRIFT = [0.05, -0.06, 0.07, -0.045] as const;

export type HitKind = 'kick' | 'hat' | 'pluck' | 'ghost' | 'bass' | 'shakeAcc' | 'shake';
// One-beat cells: drum, pluck, bass, shaker. [position in beats, kind]
export const CELLS: [number, HitKind][][] = [
  [[0, 'kick'], [0.5, 'hat']],
  [[0, 'pluck'], [0.5, 'ghost']],
  [[0, 'bass']],
  [[0, 'shakeAcc'], [0.25, 'shake'], [0.5, 'shake'], [0.75, 'shake']],
];

const t0 = T0 / 60;
export const lockS = (k: number) => LOCKS[k] / 60;
// Grid time (s) of beat n, position pos.
export const gridT = (n: number, pos: number) => t0 + (n + pos) * BEAT_S;
// Drift offset (s) of lane k at time t while it is still drifting.
export const driftAt = (k: number, t: number) => DRIFT[k] * Math.max(0, t - t0);
// When a drifting grid hit actually sounds: s = g + DRIFT·(s − t0)  ⇒  s = (g − DRIFT·t0) / (1 − DRIFT).
export const soundT = (k: number, g: number) => (g - DRIFT[k] * t0) / (1 - DRIFT[k]);

// Theme (D minor): one pluck note per beat, an 8-beat phrase. Bass per bar: D D B♭ C.
export const THEME = [74, 77, 81, 79, 77, 76, 74, 72];
export const BASS = [38, 38, 34, 36];
export const pitchOf = (kind: HitKind, n: number) =>
  kind === 'pluck' ? THEME[n % 8] : kind === 'ghost' ? THEME[n % 8] - 12 : kind === 'bass' ? BASS[Math.floor(n / 4) % 4] : 0;

// Every hit the intro loops play: {s: time in seconds, lane, kind, n}. Drifting hits that would land in the
// 70 ms before a lock/hit frame are dropped, so every snap is a clean transient (and lanes "wait" for the grid).
export type LoopHit = {s: number; lane: number; kind: HitKind; n: number};
const GUARD = 0.07;
const STOP = (EXIT - 6) / 60; // the loops stop just before the edit
export const loopHits = (): LoopHit[] => {
  const out: LoopHit[] = [];
  const marks = [...LOCKS, HIT].map((f) => f / 60);
  for (let lane = 0; lane < 4; lane++) {
    for (let n = 0; gridT(n, 0) < STOP; n++) {
      for (const [pos, kind] of CELLS[lane]) {
        const g = gridT(n, pos);
        const drifting = g < lockS(lane) - 1e-9;
        const s = drifting ? soundT(lane, g) : g;
        if (s >= STOP) continue;
        if (drifting && s >= lockS(lane) - GUARD) continue;
        if (marks.some((m) => s < m - 1e-9 && s >= m - GUARD)) continue;
        out.push({s, lane, kind, n});
      }
    }
  }
  return out;
};
