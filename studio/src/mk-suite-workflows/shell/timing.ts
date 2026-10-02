// Reel-level sound events (owned by the framework job). Plain TS: imported by the Reel AND scripts/mk-suite-workflows/{music,check}.ts.
import {SECTIONS} from '../timing.ts';

// Section k + 1 starts on BOUNDARIES[k]: every boundary is a designed transition with an impact on its frame.
export const BOUNDARIES = SECTIONS.slice(1).map((s) => s.start);

export type FwEvent = {f: number; kind: 'impact' | 'hit'; shake?: number; what: string};
// GLOBAL frames. Every one gets a sound onset on exactly this frame (asserted by scripts/mk-suite-workflows/check.ts).
export const INTRO_HITS = [30,120];
export const FW_EVENTS: FwEvent[] = [...INTRO_HITS.map((f):FwEvent=>({f,kind:'hit',shake:4,what:'intro typography'})),...BOUNDARIES.map((f, k): FwEvent => ({f, kind: 'impact', shake: 3, what: `boundary → ${SECTIONS[k + 1].id}`}))];
