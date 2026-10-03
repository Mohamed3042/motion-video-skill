import type {MksEvent} from '../../timing.ts';

// Act 2 · Create — one source of truth for picture AND sound. Local frames (0 = act start, beat = 30).
export const T = {
  // A · chapter card "Create." (enters under the framework's zoom-through bloom at 0)
  chapterEnd: 152,
  // B · Montage Pro, Focus (03)
  mpIn: 132, // fly-in from depth starts
  mpLand: 168,
  mpPushEnd: 236, // push-in on the film-strip hero
  mpCards: 270, // camera settled on the action cards
  alignHover: 270, // beat 9
  exportHover: 315, // 8th after beat 10
  mpTilt: 360, // beat 12: window tilts back into a floor under the super
  mpSuper: 390, // beat 13
  mpSuperOut: 442,
  // C · MK Editor, app details (05)
  edIn: 448,
  edLand: 488,
  edSuper: 480, // beat 16 — super on the left while the page swings in from the right
  edSuperOut: 552,
  edDescend: 548, // camera squares up and travels down to the checklists
  tick0: 600, // first check row (beat 20); then one row per 8th (15 f) → 765
  edOut: 772, // window recedes as the keycaps rise
  // D · Ctrl+K search (16 over 01)
  kcIn: 786,
  kcSuper: 812, // just after the Editor super has fully left (564)
  ctrl: 840, // beat 28 — Ctrl held from here
  kKey: 870, // beat 29 — K: overlay drops in
  type0: 900, // beat 30: "voice" on 16ths
  voiceHl: 960, // beat 32: MK Voice result highlights
  enter: 1020, // beat 34
  // E · pinned run (01)
  voice: 1080, // beat 36
  tones: 1200, // beat 40
  charforge: 1320, // beat 44
  runOff: 1404,
} as const;

export const TYPED = 'voice';
export const typeF = (i: number) => T.type0 + Math.round(i * 7.5); // 900, 908, 915, 923, 930
export const tickF = (i: number) => T.tick0 + i * 15; // 12 rows: 600 … 765

const RAW: MksEvent[] = [
  {f: 0, kind: 'impact', gain: 1, shake: 10}, // "Create." lands out of the bloom
  {f: 150, kind: 'whoosh', gain: 0.8}, // Montage Pro window flies in from depth
  {f: T.alignHover, kind: 'tick', gain: 0.5}, // hover ring: Align cameras
  {f: T.exportHover, kind: 'tick', gain: 0.5}, // hover ring: Export an editing handoff
  {f: T.mpTilt + 8, kind: 'whoosh', gain: 0.45}, // window tilts back
  {f: T.mpSuper, kind: 'hit', gain: 0.6}, // "Bring your footage together."
  {f: 470, kind: 'whoosh', gain: 0.8}, // MK Editor page slides in
  {f: T.edSuper, kind: 'hit', gain: 0.6}, // "From packaging artwork to production."
  {f: 580, kind: 'whoosh', gain: 0.35}, // camera travels down to the checklists
  ...Array.from({length: 12}, (_, i): MksEvent => ({f: tickF(i), kind: 'tick', gain: 0.7})),
  {f: 792, kind: 'whoosh', gain: 0.4}, // window recedes, keycaps rise
  {f: T.kcSuper, kind: 'swell', gain: 0.7}, // riser into the K impact
  {f: T.ctrl, kind: 'key', gain: 0.9},
  {f: T.kKey, kind: 'key', gain: 1},
  {f: T.kKey, kind: 'impact', gain: 0.7, shake: 6}, // search overlay drops in
  ...Array.from(TYPED, (_, i): MksEvent => ({f: typeF(i), kind: 'type', gain: 0.8})),
  {f: T.voiceHl, kind: 'hit', gain: 0.55}, // MK Voice result highlights
  {f: T.enter, kind: 'key', gain: 0.7}, // Enter: overlay closes
  {f: T.voice, kind: 'whoosh', gain: 0.6}, // MK Voice card lifts out of the library
  {f: T.tones, kind: 'whoosh', gain: 0.6},
  {f: T.tones + 6, kind: 'hit', gain: 0.5}, // "MK Tones"
  {f: T.charforge, kind: 'whoosh', gain: 0.6},
  {f: T.charforge + 6, kind: 'hit', gain: 0.5}, // "CharForge Studio"
  {f: 1380, kind: 'swell', gain: 0.6}, // riser toward the Work chapter impact (global 2880)
  {f: 1438, kind: 'whoosh', gain: 0.9}, // run-off into the framework's whip-pan (peak speed ~1440)
];
export const EVENTS: MksEvent[] = RAW.sort((a, b) => a.f - b.f);
