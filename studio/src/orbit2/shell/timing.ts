// Reel-level layout: 13 sections (chaos, turn, ten worlds, finale), 12 portal boundaries and the framework's own
// sound events. Plain TS (no JSX): imported by the Reel AND scripts/orbit2/{music,check,stills}.ts.
import {DROP, FINALE, SECTIONS as ORBIT_SECTIONS, type SectionId} from '../timing.ts';
import {LOGO_LOCK, MONTAGE_BEATS} from '../finale/timing.ts';

export type ShellId = SectionId | 'finale';
export type ShellSection = {id: ShellId; kind: 'story' | 'world' | 'finale'; index: number; name: string; start: number; end: number};

export const SECTIONS: ShellSection[] = [...ORBIT_SECTIONS, {id: 'finale', kind: 'finale', index: 11, name: 'ALL WORLDS', ...FINALE}];

// Portal k sits on BOUNDARIES[k] = SECTIONS[k + 1].start and lasts 12 frames centred on it.
export const BOUNDARIES = SECTIONS.slice(1).map((s) => s.start); // 720, 1320, 1800, … 6120
export const HALF = 6;
export const PORTAL_NAMES = [
  'gravity ignite',
  'BOOM: satellite dive + white-hot drop',
  'page → sphere',
  'glowing point → star flare',
  'green dot → Ebbinghaus circles',
  'circle → checker tiles',
  'checker floor tilts → converging rails',
  'rails → matrix grid',
  'grid lines → café-wall rows',
  'rows shear → barber stripes',
  'pole collapses → two dots',
  'dots → ten orbit rings + flash',
] as const;

export type FwEvent = {f: number; kind: 'impact' | 'hit'; shake?: number; what: string};
// Global frames. Every one gets a sound onset on exactly this frame (asserted by scripts/orbit2/check.ts).
export const FW_EVENTS: FwEvent[] = [
  ...BOUNDARIES.map((b, k): FwEvent => ({f: b, kind: 'impact', shake: b === DROP ? 16 : k === 0 ? 8 : 5, what: `portal ${k} (${PORTAL_NAMES[k]})`})),
  ...MONTAGE_BEATS.slice(1).map((f, k): FwEvent => ({f, kind: 'hit', what: `montage beat ${k + 2}`})),
  {f: LOGO_LOCK, kind: 'impact', shake: 13, what: 'logo lock boom'},
];
