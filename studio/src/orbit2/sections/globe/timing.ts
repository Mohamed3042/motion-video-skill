import type {SectionEvent} from '../../timing.ts';

// Local frames (0 = section start). Imported by World.tsx AND scripts/orbit2/sections/globe.ts.
export const EVENTS: SectionEvent[] = [{f:0,kind:'impact',shake:5},{f:120,kind:'hit'},{f:240,kind:'hit'},{f:360,kind:'hit'},{f:444,kind:'whoosh'}];
// Local frame the finale montage freezes on (the most iconic frame of this section).
export const HERO_FRAME = 400;
