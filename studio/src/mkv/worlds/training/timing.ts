import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mkv/worlds/training.ts.
// 4 bars: title (bar 1) · four gate checks, one per beat (bar 2) · line + progress ring (bar 3) · fall into the CRT (bar 4).
export const T = {
  title: 0,
  checks: [120, 150, 180, 210], // Data · Model · Storage · Listening
  line: 240, // "Real gates, not guesses." + stepper Prepare → Train, ring starts sweeping
  ringDone: 360, // progress ring completes, stepper → Listen
  crt: 446, // the innermost frame starts turning into the CRT screen
  crtOn: 459, // the dark screen lights up (phosphor warm-up); the framework portal then powers the Arcade on
} as const;

export const EVENTS: WorldEvent[] = [
  {f: T.title, kind: 'hit'},
  ...T.checks.map((f) => ({f, kind: 'hit' as const})),
  {f: T.line, kind: 'blip'},
  {f: T.ringDone, kind: 'impact', shake: 10},
  {f: T.crtOn, kind: 'tick'},
];

// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 236;
