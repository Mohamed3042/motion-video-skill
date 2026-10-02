import type {SectionEvent} from '../../timing.ts';

export const EVENTS: SectionEvent[] = [
  {f: 0, kind: 'impact', shake: 6},
  {f: 120, kind: 'hit', shake: 3},
  {f: 240, kind: 'hit'},
  {f: 360, kind: 'hit'},
  {f: 444, kind: 'whoosh'},
];
export const HERO_FRAME = 340;
