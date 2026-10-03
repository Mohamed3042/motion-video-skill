import type {WorldEvent} from '../../timing';

// Local frames (0 = world start). Imported by World.tsx AND scripts/mpw/worlds/profile.ts.
// 120 BPM: beat = 30 f, bar = 120 f. Length 720 (6 bars). Events sit on the 8th-note grid (15 f).
// f0 is the framework's boundary impact (edit 9, iris match): Edit Room's cut timeline lands as the fixation dot.
export const T = {
  dot: 0, // the cut collapses into the fixation dot (framework impact, not repeated here)
  focusText: 24, // "Focus here."
  blobs: [6, 54] as const, // soft clutter blobs fade in, then hold perfectly still (Troxler)
  frame: [44, 84] as const, // the crisp essential panel outline draws
  titleOut: 100,
  holdText: 120, // "Keep your eyes on the dot. The clutter fades."
  resolve: 240, // the essential panel fills with Creative Profile; clutter physically cleared (impact)
  rows: [252, 262, 272] as const, // memory inputs slide in
  approve: 285, // Approve → soft chime
  reject: 315, // Reject → muted thud
  suggest: 345, // a settings suggestion appears
  apply: 375, // you choose to apply it
  toIntel: 420, // whoosh into Intelligence
  checks: [435, 450, 465] as const, // readiness checks: sources, sync, caption spacing tidied (helper blip each)
  marker: 495, // review marker drops on the timeline
  endpoint: 510, // "Your own API endpoint" toggled on
  plan: 525, // proposed plan appears
  planChecks: [540, 555] as const, // you review: two changes ticked
  applyPlan: 570, // "Apply 2 selected changes" (hit)
  toQueue: 600, // whoosh: the panel opens into the whole app (shared desk, D = f − 720)
  jobDone: 645, // Loudness Delivery completes (blip)
  flip: 690, // exit: UI tiles start flipping like mirrors (land on the boundary)
};

export const EVENTS: WorldEvent[] = [
  {f: T.resolve, kind: 'impact', shake: 7},
  {f: T.approve, kind: 'blip'},
  {f: T.reject, kind: 'tick'},
  {f: T.suggest, kind: 'blip'},
  {f: T.apply, kind: 'tick'},
  {f: T.toIntel, kind: 'whoosh'},
  ...T.checks.map((f) => ({f, kind: 'blip' as const})),
  {f: T.marker, kind: 'tick'},
  {f: T.endpoint, kind: 'tick'},
  {f: T.plan, kind: 'blip'},
  ...T.planChecks.map((f) => ({f, kind: 'tick' as const})),
  {f: T.applyPlan, kind: 'hit', shake: 4},
  {f: T.toQueue, kind: 'whoosh'},
  {f: T.jobDone, kind: 'blip'},
];
// Local frame the finale montage freezes on (most iconic frame of this world).
export const HERO_FRAME = 392;
