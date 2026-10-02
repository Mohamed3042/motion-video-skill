// Reel-level layout: 11 sections, 10 portal boundaries, and the framework's own sound events.
// Plain TS (no JSX): imported by the Reel AND scripts/mkv/{music,check}.ts.
import {FINALE, INTRO, WORLDS, type WorldId} from '../timing.ts';
import {IGNITE, TITLE} from '../intro/timing.ts';
import {LOGO_LOCK, MONTAGE_BEATS} from '../finale/timing.ts';

export type SectionId = 'intro' | WorldId | 'finale';
export type Section = {id: SectionId; index: number; name: string; start: number; end: number};

export const SECTIONS: Section[] = [
  {id: 'intro', index: 0, name: 'INTRO', ...INTRO},
  ...WORLDS,
  {id: 'finale', index: 10, name: 'FINALE', ...FINALE},
];

// Portal k sits on BOUNDARIES[k] = SECTIONS[k + 1].start and lasts 12 frames centred on it.
export const BOUNDARIES = SECTIONS.slice(1).map((s) => s.start);
export const HALF = 6;
export const PORTAL_NAMES = [
  'amber ring dive',
  'vase contour → stair edge',
  'staircase → signal ring',
  'ring → letter shards',
  'shards → tunnel frames',
  'tunnel → CRT power-on',
  'CRT collapse → grating',
  'grating → cube edge',
  'cube → page turn',
  'pages → nine rings + light flash',
] as const;

export type FwEvent = {f: number; kind: 'impact' | 'hit'; shake?: number; what: string};
// Global frames. Every one gets a sound onset on exactly this frame (asserted by scripts/mkv/check.ts).
export const FW_EVENTS: FwEvent[] = [
  {f: IGNITE, kind: 'impact', shake: 10, what: 'intro sub impact'},
  {f: TITLE, kind: 'hit', shake: 12, what: 'intro title hit'},
  ...BOUNDARIES.map((b, k): FwEvent => ({f: b, kind: 'impact', shake: 5, what: `portal ${k} (${PORTAL_NAMES[k]})`})),
  ...MONTAGE_BEATS.slice(1).map((f, k): FwEvent => ({f, kind: 'hit', what: `montage beat ${k + 2}`})),
  {f: LOGO_LOCK, kind: 'impact', shake: 14, what: 'logo lock boom'},
];
