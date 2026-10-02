// Reel-level sound events (owned by the framework job). Plain TS: imported by the Reel AND scripts/__SLUG__/{music,check}.ts.
import {SECTIONS} from '../timing.ts';

// Section k + 1 starts on BOUNDARIES[k]: every boundary is a designed transition with an impact on its frame.
export const BOUNDARIES = SECTIONS.slice(1).map((s) => s.start);

export type FwEvent = {f: number; kind: 'impact' | 'hit'; shake?: number; what: string};
// GLOBAL frames. Every one gets a sound onset on exactly this frame (asserted by scripts/__SLUG__/check.ts).
export const FW_EVENTS: FwEvent[] = BOUNDARIES.map((f, k): FwEvent => ({f, kind: 'impact', shake: 5, what: `boundary → ${SECTIONS[k + 1].id}`}));
