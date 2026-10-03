// Rects measured on the 1× concept PNGs (1586×992) with a pixel probe (ffmpeg rawvideo + node).
import type {Rect} from '../../kit';

// Window crops: the "DESIGN CONCEPT" label sits at y 959–967 (01/05/16) and y 948–956 (03, next to the real
// "Windows | Check release details" footer at y 937–959), so the kit's WINDOW_RECT (h 966) would show it.
// 01/05/16: trim to 952. 03: keep 966 (so the sidebar's "Help" isn't cut) and paint the label out.
export const CROP03: Rect = {x: 0, y: 0, w: 1586, h: 966};
export const LABEL03 = {rect: {x: 298, y: 943, w: 146, h: 18}, fill: 'rgb(16,16,15)'};
export const CROP: Rect = {x: 0, y: 0, w: 1586, h: 952}; // 01, 05, 16

// 03 · Montage Pro, Focus
export const R03 = {
  align: {x: 306, y: 506, w: 406, h: 142}, // "Align cameras"
  captions: {x: 728, y: 506, w: 393, h: 142}, // "Prepare captions" — never spotlight (dimmed while the others glow)
  export: {x: 1137, y: 506, w: 423, h: 142}, // "Export an editing handoff"
  filmArt: {x: 690, y: 70, w: 896, h: 436}, // film-strip artwork of the hero
};

// 05 · MK Editor app details
export const R05 = {
  panel: {x: 303, y: 612, w: 1010, h: 333},
  tickX: [334.5, 690, 1025], // check glyph centres per column
  tickY: [724.5, 749.5, 773.5, 798.5], // per row
  textX: [360, 715, 1051],
  textW: [
    [197, 182, 148, 144],
    [191, 172, 211, 145],
    [157, 142, 101, 138],
  ],
  // glyph transplants that repair two AI-render glitches with the screen's own letters:
  oFrom: {x: 558, y: 226, w: 14, h: 18}, // the "o" of "to" …
  oTo: {x: 597, y: 226}, // … over the green blob in "pr•duction."
  aFrom: {x: 1109, y: 634, w: 10, h: 24}, // the "a" of "handoff" …
  aTo: {x: 1079, y: 634}, // … over the broken "a" (+ green tail) in "Approval"
  aTail: {x: 1076, y: 647, w: 3, h: 6}, // the green smear's last pixels left of the transplant
  bg: '#141414',
};

// 16 · search overlay (Ctrl K)
export const R16 = {
  dialog: {x: 436, y: 190, w: 859, h: 609},
  textMask: {x: 527, y: 316, w: 98, h: 47}, // inside the 2 px green field border (y 310–368)
  fieldFill: 'rgb(14,23,18)',
  textX: 540, // left ink edge of "v"
  baseline: 348.5, // x-height 335–348 → Inter ≈ 26 px
  fontSize: 24.4, // tuned so the ink width matches the image (58 px for "voice"), letter-spacing -0.35
  caret: {x: 604, y: 325, w: 2, h: 30},
  results: {x: 458, y: 392, w: 815, h: 300}, // "Apps" … "Destinations" row (masked until typed)
  appsBlock: {x: 458, y: 392, w: 815, h: 150},
  destBlock: {x: 458, y: 552, w: 815, h: 140},
  voice: {x: 471, y: 429, w: 787, h: 106}, // MK Voice result (green-bordered)
  enter: {x: 648, y: 735, w: 56, h: 34},
  dialogBg: '#131313',
};

// 01 · Studio library
export const R01 = {
  voiceHero: {x: 303, y: 207, w: 807, h: 257},
  editor: {x: 302, y: 531, w: 306, h: 204},
  tones: {x: 621, y: 531, w: 305, h: 204},
  charforge: {x: 938, y: 531, w: 306, h: 204},
  macroforge: {x: 1256, y: 531, w: 306, h: 204},
  ctrlK: {x: 1003, y: 28, w: 67, h: 31},
  main: {x: 270, y: 0, w: 1316, h: 952}, // content pane (dims under the search overlay; sidebar stays lit)
};
