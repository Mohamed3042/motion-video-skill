import type {SectionEvent} from '../../timing.ts';

// Act 2 · The turn (720–1320). Local frames, 120 BPM (beat = 30 f, bar = 120 f). Shared by World.tsx and scripts/orbit/sections/turn.ts.
export const IGNITE = 0; // 12.0 s coral point ignites, the noise starts falling into orbit
export const ORDER = 70; // rings are ordered (evenly spaced, one direction)
export const FORM = 84; // planet starts forming, rings collapse into the logo ring
export const LOCK = 120; // 14.0 s real logo resolves: glow + ring shockwave, G major
export const TITLE = 128; // "Job Engine Orbit"
export const TAGLINE = 156; // "Your next chapter has coordinates."
export const RELAYOUT = [222, 262] as const; // logo rises, the benefit orbit draws in
export const BENEFITS = [
  {f: 270, lines: ['Facts you', 'confirm.'], color: '#74e1ba'},
  {f: 360, lines: ['Sources and', 'check dates.'], color: '#89b7ff'},
  {f: 450, lines: ['A clearer', 'next step.'], color: '#ff754d'},
] as const;
export const SUCK = 536; // 21 s riser: labels get pulled into the coral satellite
export const DIVE = [548, 598] as const; // camera dives into the satellite → full-frame coral at the boundary
export const CUT = 596; // sound sucks out ~60 ms before the framework's drop at 600

export const EVENTS: SectionEvent[] = [
  {f: IGNITE, kind: 'impact', shake: 6},
  {f: 40, kind: 'whoosh'},
  {f: LOCK, kind: 'impact', shake: 12},
  ...BENEFITS.map((b): SectionEvent => ({f: b.f, kind: 'hit'})),
  {f: SUCK, kind: 'whoosh'},
];

// Local frame the finale montage freezes on: the planet with all three benefits locked in orbit.
export const HERO_FRAME = 500;
