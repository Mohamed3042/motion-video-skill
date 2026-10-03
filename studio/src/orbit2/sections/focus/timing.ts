import type {SectionEvent} from '../../timing.ts';

// Local frames; 480-frame world. Shared visual/audio onsets.
export const EVENTS: SectionEvent[] = [
  {f:0,kind:'impact',shake:5},
  {f:120,kind:'hit'},
  {f:240,kind:'hit',shake:3},
  {f:360,kind:'hit'},
  {f:444,kind:'whoosh'}
];
export const HERO_FRAME = 340;
