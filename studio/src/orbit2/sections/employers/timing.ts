import type {SectionEvent} from '../../timing.ts';

// Local frames (0 = section start). EVENTS are unchanged from v1 (the score hits them); T = picture beats.
export const T = {
  light: 0, // impact: the façade's windows switch on in a sweep from the centre
  titleOut: 92,
  ledges: [56, 92], // floor ledges extrude while the camera dollies; light runs along every ledge
  caption: 88, // "Straight rows."
  open: 106, // two windows swing open
  out: 120, // hit: the employer dossiers swing out of the windows
  sources: 240, // hit: captured source rows light up · "Needs come from accepted public observations."
  watch: 360, // hit: Watch employer on · "Find unexpected opportunities"
  back: 430, // dossiers return into their windows
  exit: 444, // whoosh: pull back into the hop
};

export const EVENTS: SectionEvent[] = [
  {f: 0, kind: 'impact', shake: 6},
  {f: 120, kind: 'hit', shake: 3},
  {f: 240, kind: 'hit'},
  {f: 360, kind: 'hit'},
  {f: 444, kind: 'whoosh'},
];
// Local frame the finale montage revisits: both dossiers open with their captured sources lit.
export const HERO_FRAME = 340;
