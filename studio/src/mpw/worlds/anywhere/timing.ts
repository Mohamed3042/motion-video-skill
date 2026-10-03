import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mpw/worlds/anywhere.ts.
// 120 BPM: beat = 30 f, bar = 120 f. Length 480 (4 bars).
// f0 is the framework's boundary impact (edit 10, "flop: mirror cut"): every UI tile of the shared desk lands mirrored
// into Arabic exactly there (the flip started at Profile f690); the timeline tile never flips.
export const T = {
  lock: 0,
  titleOut: 100,
  toggle: 60, // language toggle shows العربية selected
  calloutUI: 105, // "The interface mirrors." ← (blip, panned right → left)
  calloutTL: 135, // "The timeline keeps running left to right." → (blip, panned left → right)
  reflow: [195, 240] as const, // the window reflows into the phone layout
  reflowWhoosh: 210,
  phone: 240, // phone lands (tick)
  chips: [270, 300, 330, 360] as const, // No cloud · No telemetry · On your PC · Originals never modified
  stays: 390, // "Your media stays yours." (hit)
  exit: [444, 474] as const, // tiles fly into the finale's 4×3 multicam grid
  exitWhoosh: 450,
};

export const EVENTS: WorldEvent[] = [
  {f: T.toggle, kind: 'tick'},
  {f: T.calloutUI, kind: 'blip'},
  {f: T.calloutTL, kind: 'blip'},
  {f: T.reflowWhoosh, kind: 'whoosh'},
  {f: T.phone, kind: 'tick'},
  ...T.chips.map((f) => ({f, kind: 'blip' as const})),
  {f: T.stays, kind: 'hit', shake: 5},
  {f: T.exitWhoosh, kind: 'whoosh'},
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 150;
