// Reel-level layout: 13 sections, 12 edits, and the framework's own sound events.
// Plain TS (no JSX): imported by the Reel AND scripts/mpw/{music,check,stills}.ts.
import {FINALE, INTRO, WORLDS, type WorldId} from '../timing.ts';
import {HIT, LANES, LOCKS, T0} from '../intro/timing.ts';
import {LOGO_LOCK, MONTAGE_BEATS, SNAPS} from '../finale/timing.ts';

export type SectionId = 'intro' | WorldId | 'finale';
export type Section = {id: SectionId; index: number; name: string; start: number; end: number};

export const SECTIONS: Section[] = [{id: 'intro', index: 0, name: 'PHASE LOCK', ...INTRO}, ...WORLDS, {id: 'finale', index: 12, name: 'FINALE', ...FINALE}];

// Edit k sits on BOUNDARIES[k] = SECTIONS[k + 1].start and lasts 12 frames centred on it.
export const BOUNDARIES = SECTIONS.slice(1).map((s) => s.start);
export const HALF = 6;
export type EditKind = 'match' | 'strips' | 'whip' | 'lcut' | 'smash' | 'zoom' | 'gate' | 'jcut' | 'stutter' | 'iris' | 'flop' | 'multicam';
export const EDITS: {kind: EditKind; name: string; shake: number}[] = [
  {kind: 'match', name: 'match cut: playhead line → folder edge', shake: 6},
  {kind: 'strips', name: 'match cut: four waveform strips', shake: 4},
  {kind: 'whip', name: 'whip pan left, directional blur', shake: 5},
  {kind: 'lcut', name: 'L-cut: edit line sweep, Review audio lingers', shake: 3},
  {kind: 'smash', name: 'smash cut through black', shake: 9},
  {kind: 'zoom', name: 'timeline zoom-through (Act I → II), tape stop', shake: 6},
  {kind: 'gate', name: 'film-gate slip + sprocket flash', shake: 5},
  {kind: 'jcut', name: 'J-cut: Library audio leads 0.5 s, picture rises', shake: 3},
  {kind: 'stutter', name: 'stutter cut (beta movement)', shake: 5},
  {kind: 'iris', name: 'iris match: cut point → fixation dot (Act II → III)', shake: 5},
  {kind: 'flop', name: 'flop: mirror cut', shake: 4},
  {kind: 'multicam', name: 'multicam pull-back into the grid', shake: 8},
];
export const J_LEAD = 30; // frames the J-cut's incoming sound leads its picture
export const L_LAG = 30; // frames the L-cut's outgoing sound lingers

export type FwEvent = {f: number; kind: 'impact' | 'hit'; shake?: number; what: string};
// Global frames. Every one gets a sound onset on exactly this frame (asserted by scripts/mpw/check.ts).
export const FW_EVENTS: FwEvent[] = [
  {f: T0, kind: 'impact', shake: 8, what: 'intro sub hit'},
  ...LOCKS.map((f, k): FwEvent => ({f, kind: 'hit', shake: 3, what: `intro lock ${LANES[k]}`})),
  {f: HIT, kind: 'hit', shake: 12, what: 'intro playhead hit'},
  ...BOUNDARIES.map((b, k): FwEvent => ({f: b, kind: 'impact', shake: EDITS[k].shake, what: `edit ${k} (${EDITS[k].name})`})),
  ...MONTAGE_BEATS.slice(1).map((f, k): FwEvent => ({f, kind: 'hit', what: `montage cut ${k + 2}`})),
  ...SNAPS.map((f, k): FwEvent => ({f, kind: 'hit', shake: 3, what: `finale sync snap ${k + 1}`})),
  {f: LOGO_LOCK, kind: 'impact', shake: 14, what: 'logo lock'},
];
