// Act 0 world: a forward-travelling camera through a field of product-art shards.
// Units: world px. A point at depth d (= Z − T) projects with scale F/d. The Explore window ends on the plane
// Z = ZW at depth F (scale 1), drawn at K output px per source px — the exact state act 1 starts from.
import {mulberry32} from '../../timing.ts';
import {ease, kf, type Ease} from '../../kit/math.ts';
import {TILE} from './shards.ts';

export const F = 1500; // focal length (px)
export const K = 1.08; // Explore window scale at the act-0/act-1 seam (window 1713×1043, centered)
export const WIN_C = {x: 793, y: 468}; // center of the trimmed window rect (kit WINDOW_RECT 1586×936)

// ── Camera travel T(f): integral of a smooth speed curve (world px per frame) ─────────────────────
const SPEED: Array<[number, number, Ease?]> = [
  [-12, 5],
  [176, 6],
  [240, 62, ease.in],
  [338, 80, ease.linear],
  [360, 122],
  [410, 126],
  [470, 9, ease.out],
  [594, 0],
];
export const STOP = 594; // camera at rest from here to the seam
const STEP = 0.25;
const F0 = -12;
const TT: number[] = [0];
for (let i = 1, f = F0; f < 640; i++, f += STEP) TT[i] = TT[i - 1] + (kf(f, SPEED) + kf(f + STEP, SPEED)) * 0.5 * STEP;
export const camT = (f: number) => {
  const u = (Math.min(Math.max(f, F0), 639) - F0) / STEP;
  const i = Math.floor(u);
  return TT[i] + (TT[i + 1] - TT[i]) * (u - i);
};
export const T_END = camT(STOP);
export const ZW = T_END + F;

// Camera lateral drift + roll (settles to exactly 0 before the assembly).
const settle = (f: number) => 1 - ease.inOut(Math.min(Math.max((f - 470) / 90, 0), 1));
export const camXY = (f: number) => ({
  x: (60 * Math.sin(f * 0.011 + 0.4) + 30 * Math.sin(f * 0.027)) * settle(f),
  y: (34 * Math.sin(f * 0.009 + 1.3)) * settle(f),
});

// ── The rush: one word per passing card ─────────────────────────────────────────────────────────
export const D_BEAT = 1500; // card depth at its beat: showcased in a corner, then it whooshes past
const XO = 600;
const YO = 250;
const CORNER = [
  [-1, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
];
export const WORDS: Array<{word: string; shard: string; f: number; next: number}> = [
  {word: 'Voices.', shard: 'h-voice', f: 240, next: 270},
  {word: 'Videos.', shard: 'h-montage', f: 270, next: 300},
  {word: 'Packaging.', shard: 'h-editor', f: 300, next: 330},
  {word: 'Music.', shard: 'h-tones', f: 330, next: 360},
  {word: 'Characters.', shard: 'h-charforge', f: 360, next: 375},
  {word: 'Automations.', shard: 'h-macroforge', f: 375, next: 390},
  {word: 'Quotes.', shard: 'x-quotes', f: 390, next: 405},
  {word: 'Classrooms.', shard: 'x-educate', f: 405, next: 420},
];

// ── Cards ───────────────────────────────────────────────────────────────────────────────────────
export type CardSpec = {
  key: string;
  shard: string;
  aspect: number; // w / h
  x: number;
  y: number;
  z: number;
  w: number; // world width
  rx: number;
  ry: number;
  rz: number;
  spin: number; // slow drift rotation speed (deg / frame)
  glint: number; // frame offset of its glint cycle
  kind: 'hero' | 'filler' | 'grid';
  beat?: number; // hero: the frame its word lands
  appear?: boolean; // intro shard: lights up at its glint frame (with that glint)
  grid?: {row: number; col: number; x: number; y: number; w: number}; // final pose on the window plane
};

export const ASPECT: Record<string, number> = {
  'x-voice': 409 / 138, 'x-montage': 407 / 138, 'x-editor': 410 / 138, 'x-tones': 409 / 138, 'x-macroforge': 407 / 138,
  'x-reclaim': 410 / 138, 'x-educate': 409 / 134, 'x-quotes': 407 / 134, 'x-flock': 410 / 134,
  'h-voice': 548 / 253, 'h-montage': 836 / 412, 'h-editor': 262 / 150, 'h-tones': 262 / 150, 'h-charforge': 263 / 150,
  'h-macroforge': 263 / 150, 'h-orbit': 150 / 106, 'h-market': 160 / 106,
};

const GRID_ORDER = ['voice', 'montage', 'editor', 'tones', 'macroforge', 'reclaim', 'educate', 'quotes', 'flock'];
// Landing frames per row (eighth notes) — each row ticks as it locks into place.
export const LAND = [510, 525, 540];
export const FLY = 30; // flight duration (frames) into the tile

const build = (): CardSpec[] => {
  const r = mulberry32(20261003);
  const cards: CardSpec[] = [];
  WORDS.forEach((wd, i) => {
    const [sx, sy] = CORNER[i % 4];
    const aspect = ASPECT[wd.shard];
    cards.push({
      key: `hero-${i}`,
      shard: wd.shard,
      aspect,
      x: sx * XO,
      y: sy * YO,
      z: camT(wd.f) + D_BEAT,
      w: aspect > 2.5 ? 640 : aspect > 1.9 ? 600 : 520,
      rx: -sy * 8,
      ry: sx * 14,
      rz: sx * sy * -3,
      spin: 0,
      glint: wd.f - 26,
      kind: 'hero',
      beat: wd.f,
    });
  });
  const pool = Object.keys(ASPECT);
  let prev = '';
  const pick = () => {
    let shard = pool[Math.floor(r() * pool.length)];
    if (shard.slice(2) === prev.slice(2)) shard = pool[(pool.indexOf(shard) + 5) % pool.length];
    prev = shard;
    return shard;
  };
  // Intro constellation: composed in SCREEN space at f120 (where the opening line sits), spread over the
  // whole frame at depths 900–7000, keeping a clear band for the type. These are the first cards the rush passes.
  const T120 = camT(120);
  for (let i = 0; i < 14; i++) {
    const shard = pick();
    const ws = 150 + r() * 210; // on-screen width at f120
    const hs = ws / ASPECT[shard];
    let sx = 0;
    let sy = 0;
    do {
      sx = 90 + r() * 1740;
      sy = 60 + r() * 960;
    } while (Math.abs(sy - 540) < 120 + hs / 2 && Math.abs(sx - 960) < 640 + ws / 2);
    const d = 900 + ((i + r()) / 14) ** 1.3 * 6100;
    cards.push({
      key: `intro-${i}`,
      shard,
      aspect: ASPECT[shard],
      x: ((sx - 960) * d) / F,
      y: ((sy - 540) * d) / F,
      z: T120 + d,
      w: (ws * d) / F,
      rx: (r() - 0.5) * 30,
      ry: (r() - 0.5) * 50,
      rz: (r() - 0.5) * 16,
      spin: (r() - 0.5) * 0.08,
      glint: 15 * Math.floor(r() * 8), // = its entrance: shards light up one by one on the eighth-note pulse
      appear: true,
      kind: 'filler',
    });
  }
  // Rush tunnel: fillers around the camera path through the rush (radius keeps the center free for type).
  const N = 46;
  const z0 = T120 + 7000;
  const z1 = camT(430);
  for (let i = 0; i < N; i++) {
    const shard = pick();
    const ang = r() * Math.PI * 2;
    const rad = 680 + r() * 1200;
    const z = z0 + ((i + r()) / N) * (z1 - z0);
    cards.push({
      key: `fill-${i}`,
      shard,
      aspect: ASPECT[shard],
      x: Math.cos(ang) * rad * 1.25,
      y: Math.sin(ang) * rad * 0.8,
      z,
      w: 260 + r() * 260,
      rx: (r() - 0.5) * 30,
      ry: (r() - 0.5) * 50,
      rz: (r() - 0.5) * 16,
      spin: (r() - 0.5) * 0.06,
      glint: Math.floor(r() * 300),
      kind: 'filler',
    });
  }
  // The nine Explore tiles: wait far ahead in a loose cloud, then fly into their exact tiles.
  GRID_ORDER.forEach((name, i) => {
    const t = TILE[name];
    const row = Math.floor(i / 3);
    const col = i % 3;
    const gx = (t.x + t.w / 2 - WIN_C.x) * K;
    const gy = (t.y + t.h / 2 - WIN_C.y) * K;
    const ang = (i / 9) * Math.PI * 2 + 0.25 + (r() - 0.5) * 0.3; // a ring around the super
    const rad = 1 + (r() - 0.5) * 0.16;
    cards.push({
      key: `grid-${name}`,
      shard: `x-${name}`,
      aspect: t.w / t.h,
      x: Math.cos(ang) * rad * 1650,
      y: Math.sin(ang) * rad * 760,
      z: ZW + 350 + r() * 700,
      w: t.w * K,
      rx: (r() - 0.5) * 36,
      ry: (r() - 0.5) * 60,
      rz: (r() - 0.5) * 20,
      spin: (r() - 0.5) * 0.08,
      glint: Math.floor(r() * 300),
      kind: 'grid',
      grid: {row, col, x: gx, y: gy, w: t.w * K},
    });
  });
  return cards;
};
export const CARDS = build();

// Bokeh: soft discs far away (parallax only).
export const BOKEH = (() => {
  const r = mulberry32(777);
  const hues = ['30,215,96', '47,199,242', '255,122,46', '63,123,255', '255,180,58', '143,107,255', '255,255,255'];
  return new Array(46).fill(0).map((_, i) => ({
    x: (r() - 0.5) * 9000,
    y: (r() - 0.5) * 5200,
    z: 3000 + r() * (ZW + 9000),
    size: 60 + r() * 260,
    a: 0.05 + r() * 0.14,
    hue: hues[i % hues.length],
    ph: r() * 6.28,
  }));
})();

// Dust: tiny motes through the rush; drawn as streaks along their screen-space motion (speed you can feel).
export const DUST = (() => {
  const r = mulberry32(4242);
  const z0 = camT(200);
  const z1 = camT(470) + 600;
  return new Array(150).fill(0).map(() => {
    const ang = r() * Math.PI * 2;
    const rad = 160 + r() * 1500;
    return {x: Math.cos(ang) * rad * 1.3, y: Math.sin(ang) * rad * 0.8, z: z0 + r() * (z1 - z0), size: 2 + r() * 4, a: 0.25 + r() * 0.5, green: r() < 0.3};
  });
})();
