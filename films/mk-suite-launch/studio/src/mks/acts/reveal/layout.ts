// Measured regions (1x source px, 1586×992 screens; windows use the kit trim WINDOW_RECT 1586×936 — never y > 936).
import type {Rect} from '../../kit';
import type {ScreenId} from '../../screens';

// Window chrome shared by the library/explore screens: sidebar (bg #080808, border at x=270) and top bar row.
export const SIDE: Rect = {x: 0, y: 0, w: 280, h: 936};
export const TOP: Rect = {x: 280, y: 0, w: 1306, h: 80};

// Content bands (complementary crops of x≥280, y≥80) cut along measured gaps; they animate in the morph.
export const BANDS: Partial<Record<ScreenId, Rect[]>> = {
  '04-explore': [
    {x: 280, y: 80, w: 1306, h: 176}, // title + chips (chips end y 244, tiles start 264)
    {x: 280, y: 256, w: 1306, h: 234}, // tile row 1 (264–481)
    {x: 280, y: 490, w: 1306, h: 235}, // row 2 (499–716)
    {x: 280, y: 725, w: 1306, h: 211}, // row 3 (733–946, cut at 936)
  ],
  '01-library-studio': [
    {x: 280, y: 80, w: 1306, h: 120}, // "Your studio."
    {x: 280, y: 200, w: 1306, h: 278}, // hero row (207–464)
    {x: 280, y: 478, w: 1306, h: 280}, // pinned (495–735)
    {x: 280, y: 758, w: 1306, h: 178}, // more (781–926)
  ],
  '02-library-compact': [
    {x: 280, y: 80, w: 917, h: 190}, // title + chips + search
    {x: 280, y: 270, w: 917, h: 317}, // table head + rows to the 586 separator
    {x: 280, y: 587, w: 917, h: 349}, // rows to 924
    {x: 1197, y: 80, w: 389, h: 856}, // MK Editor detail panel (divider at x 1207)
  ],
  '03-library-focus': [
    {x: 280, y: 80, w: 1306, h: 424}, // Montage Pro hero + film strip
    {x: 280, y: 504, w: 1306, h: 166}, // action cards (506–647)
    {x: 280, y: 670, w: 1306, h: 266}, // other apps (release row cut by the trim)
  ],
};

// Active layout toggle (green outline), measured: Studio x1184–1297, Compact 1305–1441, Focus 1448–1561, y 21–66.
export const TOGGLE: Record<'studio' | 'compact' | 'focus', Rect> = {
  studio: {x: 1184, y: 21, w: 114, h: 45},
  compact: {x: 1305, y: 21, w: 137, h: 46},
  focus: {x: 1448, y: 21, w: 114, h: 47},
};

// Exploded view of 01: seven layers (backplate + six lifted pieces). z = depth at full separation (layout px).
export const LAYERS: Array<{name: string; r: Rect; z: number; dx: number; dy: number}> = [
  {name: 'sidebar', r: {x: 0, y: 0, w: 271, h: 936}, z: 230, dx: -110, dy: 0},
  {name: 'topbar', r: {x: 296, y: 14, w: 1274, h: 58}, z: 390, dx: 0, dy: -60},
  {name: 'header', r: {x: 300, y: 92, w: 420, h: 104}, z: 520, dx: -30, dy: -50},
  {name: 'hero', r: {x: 300, y: 203, w: 1266, h: 265}, z: 650, dx: 0, dy: -20},
  {name: 'pinned', r: {x: 300, y: 488, w: 1266, h: 250}, z: 790, dx: 0, dy: 25},
  {name: 'more', r: {x: 300, y: 774, w: 1266, h: 156}, z: 930, dx: 0, dy: 50},
];
