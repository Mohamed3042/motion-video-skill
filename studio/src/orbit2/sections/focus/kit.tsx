// Shared kit for worlds 4–6 (focus, fit, nextproof — one builder): frame-driven helpers, inline glyphs, the world
// title, real-app fragment chrome, and the board/floor projection that carries the focus → fit → nextproof portals.
import React from 'react';
import {spring} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));

export const ease = {
  cubicIn: (t: number) => t * t * t,
  cubicOut: (t: number) => 1 - (1 - t) ** 3,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  sine: (t: number) => (1 - Math.cos(Math.PI * t)) / 2,
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  expoInOut: (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2),
  backOut: (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
};

type SpringCfg = {damping?: number; stiffness?: number; mass?: number};
// Spring that is exactly 0 before `from`.
export const sp = (f: number, from: number, config: SpringCfg = {damping: 14, stiffness: 170, mass: 1}) =>
  f < from ? 0 : spring({frame: f - from, fps: 60, config});

export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
export const mixHex = (h1: string, h2: string, t: number) => {
  const a = parseInt(h1.slice(1), 16);
  const b = parseInt(h2.slice(1), 16);
  const ch = (s: number) => Math.round(mix((a >> s) & 255, (b >> s) & 255, clamp(t)));
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
};
// smooth decaying ring/pulse 0..1 after frame `at`
export const pulse = (f: number, at: number, len = 24) => (f < at ? 0 : Math.exp(-(f - at) / (len / 3)) * clamp((f - at) / 2));

// Pre-blurred radial glow (gradient, never a blur filter).
export const Glow: React.FC<{x: number; y: number; size: number; color: string; opacity?: number}> = ({x, y, size, color, opacity = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${rgba(color, 0.7)} 0%, ${rgba(color, 0.26)} 24%, ${rgba(color, 0.07)} 48%, ${rgba(color, 0)} 70%)`,
      opacity,
    }}
  />
);

// ---------------------------------------------------------------- inline glyphs (font subsets lack ✓ → ⇄) ----
const G = (size: number, children: React.ReactNode, style?: React.CSSProperties) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block', overflow: 'visible', flex: 'none', ...style}}>
    {children}
  </svg>
);
export const Check: React.FC<{size: number; color: string; p?: number; width?: number}> = ({size, color, p = 1, width = 7}) =>
  G(size, <path d="M12 34 L27 48 L53 18" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={70} strokeDashoffset={70 * (1 - p)} />);
export const Cross: React.FC<{size: number; color: string; p?: number; width?: number}> = ({size, color, p = 1, width = 7}) =>
  G(
    size,
    <path d="M18 18 L46 46 M46 18 L18 46" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={80} strokeDashoffset={80 * (1 - p)} />,
  );
export const Question: React.FC<{size: number; color: string; width?: number}> = ({size, color, width = 5}) =>
  G(
    size,
    <>
      <circle cx={32} cy={32} r={25} fill="none" stroke={color} strokeWidth={width} />
      <path d="M24 25 a8.5 8.5 0 1 1 11 8 c-2.4 1 -3 2.6 -3 5" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
      <circle cx={32} cy={46} r={3.4} fill={color} />
    </>,
  );
export const Arrow: React.FC<{size: number; color: string; width?: number}> = ({size, color, width = 6}) =>
  G(size, <path d="M10 32 H52 M36 16 L52 32 L36 48" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />);
export const Sparkle: React.FC<{size: number; color: string}> = ({size, color}) =>
  G(
    size,
    <>
      <path d="M28 10 C30 24 34 28 48 30 C34 32 30 36 28 50 C26 36 22 32 8 30 C22 28 26 24 28 10 Z" fill="none" stroke={color} strokeWidth={4.5} strokeLinejoin="round" />
      <path d="M49 8 v10 M44 13 h10" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </>,
  );
export const Bookmark: React.FC<{size: number; color: string; fill?: boolean}> = ({size, color, fill}) =>
  G(size, <path d="M18 10 H46 V54 L32 43 L18 54 Z" fill={fill ? color : 'none'} stroke={color} strokeWidth={4.5} strokeLinejoin="round" />);
export const Pin: React.FC<{size: number; color: string}> = ({size, color}) =>
  G(
    size,
    <>
      <path d="M32 56 C20 42 14 33 14 25 a18 18 0 0 1 36 0 c0 8 -6 17 -18 31 Z" fill="none" stroke={color} strokeWidth={4.5} strokeLinejoin="round" />
      <circle cx={32} cy={25} r={6} fill="none" stroke={color} strokeWidth={4.5} />
    </>,
  );
export const Cursor: React.FC<{x: number; y: number; press?: number; opacity?: number}> = ({x, y, press = 0, opacity = 1}) => (
  <svg
    width={46}
    height={46}
    viewBox="0 0 64 64"
    style={{position: 'absolute', left: x - 6, top: y - 4, opacity, transform: `scale(${1 - 0.14 * press})`, transformOrigin: '6px 4px', overflow: 'visible', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.45))'}}
  >
    <path d="M8 6 L8 50 L20 39 L28 57 L36 53 L28 36 L44 36 Z" fill={C.ink} stroke={C.deep} strokeWidth={3.5} strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------- world title ----
// "0N / 10" mono, the world name in Space Grotesk 700 (letters animated per world mood), a one-line promise.
export const Title: React.FC<{
  f: number;
  index: number;
  name: string;
  promise: React.ReactNode;
  accent: string;
  mode: 'quiet' | 'bounce' | 'steps';
  from?: number;
  out?: number;
  x?: number;
  y?: number;
}> = ({f, index, name, promise, accent, mode, from = 12, out = 104, x = 120, y = 150}) => {
  if (f > out + 20 || f < from - 2) return null;
  const o = ease.cubicIn(prog(f, out, out + 18));
  const idx = ease.expoOut(prog(f, from, from + 20));
  const prom = ease.expoOut(prog(f, from + 22, from + 46));
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: 1 - o, transform: `translateY(${-34 * o}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: idx, transform: `translateX(${(1 - idx) * -24}px)`}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.3em', color: accent}}>{String(index).padStart(2, '0')} / 10</div>
        <div style={{width: 90 * idx, height: 2, background: rgba(accent, 0.7)}} />
      </div>
      <div style={{display: 'flex', marginTop: 14, fontFamily: FONT, fontWeight: 700, fontSize: 112, lineHeight: 1, letterSpacing: '-0.035em', color: C.ink, whiteSpace: 'pre'}}>
        {name.split('').map((ch, i) => {
          let st: React.CSSProperties;
          if (mode === 'quiet') {
            const p = ease.cubicOut(prog(f, from + 4 + i * 2.5, from + 34 + i * 2.5));
            st = {opacity: p, transform: `translateY(${(1 - p) * 22}px)`};
          } else if (mode === 'bounce') {
            const s = sp(f, from + 2 + i * 1.6, {damping: 9, stiffness: 230, mass: 0.7});
            st = {opacity: clamp(s * 3), transform: `translateY(${(1 - s) * 80}px) scale(${mix(0.6, 1, Math.min(1.2, s))})`};
          } else {
            // stepwise: each letter climbs up three quantised steps, like stairs
            const p = prog(f, from + 2 + i * 2, from + 20 + i * 2);
            const q = Math.min(1, Math.floor(p * 3 + 0.0001) / 3 + ease.cubicOut((p * 3) % 1) / 3);
            st = {opacity: clamp(p * 4), transform: `translateY(${(1 - q) * 60}px)`};
          }
          return (
            <span key={i} style={{display: 'inline-block', ...st}}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{marginTop: 18, fontFamily: FONT, fontWeight: 500, fontSize: 34, color: C.muted, opacity: prom, transform: `translateY(${(1 - prom) * 14}px)`}}>{promise}</div>
    </div>
  );
};

// ---------------------------------------------------------------- real-app fragment chrome ----
export const PANEL: React.CSSProperties = {
  position: 'absolute',
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: 12,
  boxShadow: '0 40px 110px rgba(2,6,32,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
};
export const SampleChip: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <div
    style={{
      position: 'absolute',
      fontFamily: MONO,
      fontWeight: 500,
      fontSize: 13,
      letterSpacing: '0.16em',
      color: C.soft,
      border: `1px solid ${C.line}`,
      borderRadius: 7,
      padding: '6px 10px',
      background: rgba(C.deep, 0.5),
      ...style,
    }}
  >
    SAMPLE DATA
  </div>
);
// text-bearing status pill
export const Pill: React.FC<{label: string; color: string; size?: number; style?: React.CSSProperties}> = ({label, color, size = 20, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      height: size * 1.75,
      padding: `0 ${size * 0.6}px`,
      borderRadius: 7,
      background: rgba(color, 0.13),
      border: `1px solid ${rgba(color, 0.55)}`,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: size,
      color,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {label}
  </div>
);
// The Orbit ring mark (as in the app header): soft ring + coral core.
export const RingMark: React.FC<{size: number; spin?: number}> = ({size, spin = 0}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block', flex: 'none'}}>
    <circle cx={32} cy={32} r={28} fill="none" stroke={C.muted} strokeWidth={3} opacity={0.75} />
    <circle cx={32} cy={32} r={28} fill="none" stroke={C.coral} strokeWidth={3.4} strokeDasharray="40 136" strokeLinecap="round" transform={`rotate(${-90 + spin} 32 32)`} />
    <circle cx={32} cy={32} r={6.5} fill={C.coral} />
  </svg>
);

// ---------------------------------------------------------------- board / floor projection ----
// Board coords (u, v) in tile units around the board centre, z up. Camera: spin rz about z, tilt rx about the screen x
// axis (0 = top-down), perspective distance d (px), k px per tile, centred at (cx, cy).
export type Cam = {cx: number; cy: number; k: number; rz: number; rx: number; d: number};
export const proj = (u: number, v: number, z: number, c: Cam) => {
  const cz = Math.cos(c.rz);
  const sz = Math.sin(c.rz);
  const x = (u * cz - v * sz) * c.k;
  const y = (u * sz + v * cz) * c.k;
  const h = z * c.k;
  const yy = y * Math.cos(c.rx) - h * Math.sin(c.rx);
  const depth = y * Math.sin(c.rx) + h * Math.cos(c.rx);
  const s = c.d / (c.d - depth);
  return {x: c.cx + x * s, y: c.cy + yy * s, s};
};
export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  cx: mix(a.cx, b.cx, t),
  cy: mix(a.cy, b.cy, t),
  k: mix(a.k, b.k, t),
  rz: mix(a.rz, b.rz, t),
  rx: mix(a.rx, b.rx, t),
  d: 1 / mix(1 / a.d, 1 / b.d, t), // interpolate perspective strength, not distance
});
type P = {x: number; y: number};
export const pathOf = (pts: P[], close = true) => 'M' + pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L') + (close ? ' Z' : '');

const DEG = Math.PI / 180;
export const TOP_CAM: Cam = {cx: 960, cy: 560, k: 110, rz: 0, rx: 0, d: 4000};
export const BOARD_CAM: Cam = {cx: 960, cy: 560, k: 110, rz: 45 * DEG, rx: 55 * DEG, d: 4000};
export const FLOOR_CAM: Cam = {cx: 960, cy: 600, k: 110, rz: 0, rx: 70 * DEG, d: 1000};
export const GRID_CAM: Cam = {cx: 960, cy: 560, k: 110, rz: 0, rx: 0, d: 4000};

// Adelson greys: the dark tile is EXACTLY the light tile under the 50 % shadow (184,192,208) × 0.5 = (92,96,104).
export const LIGHT = '#b8c0d0';
export const DARK = '#5c6068';
export const tileColor = (i: number, j: number) => (((i + j) % 2) + 2) % 2 === 0 ? LIGHT : DARK;

// Portal focus → fit (t = frames from the boundary): the square tile (top view) turns into the board's diamond view.
export const tileCam = (t: number) => lerpCam(TOP_CAM, BOARD_CAM, ease.inOut(prog(t, -6, 22)));
// Portal fit → nextproof: the diamond board tilts back into a receding floor.
export const floorCam = (t: number) => lerpCam(BOARD_CAM, FLOOR_CAM, ease.inOut(prog(t, -36, 6)));
// Portal nextproof → market: the floor un-tilts into a flat matrix grid.
export const gridCam = (t: number) => lerpCam(FLOOR_CAM, GRID_CAM, ease.inOut(prog(t, -24, 10)));

// One checker tile (cell centre i, j), optionally shrunk toward its centre.
export const tilePath = (i: number, j: number, c: Cam, scale = 1) =>
  pathOf(
    [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ].map(([a, b]) => proj(i + a * scale, j + b * scale, 0, c)),
  );

// The checker floor portal shared by fit (t ∈ [-36, 12)) and nextproof (t ∈ [-12, ∞)): tiles extend into the distance,
// grid lines appear, tiles fade, and only the two board edges stay as Ponzo rails with faint perspective ties.
export const RAIL_U = 2.5;
export const FLOOR_V: [number, number] = [-120, 6];
export const FloorPortal: React.FC<{t: number; railAlpha?: number}> = ({t, railAlpha = 1}) => {
  const c = floorCam(Math.min(t, 6));
  const ext = ease.inOut(prog(t, -26, -2)); // extra rows fade in
  const tilesA = 1 - ease.inOut(prog(t, -4, 20));
  const lines = ease.inOut(prog(t, -30, -8));
  const inner = lines * (1 - ease.inOut(prog(t, 4, 22)));
  const col = mixHex(ACCENT.fit, ACCENT.nextproof, prog(t, -14, 10));
  const side = 1 - prog(t, -36, -16);
  const tiles: React.ReactNode[] = [];
  if (tilesA > 0.001) {
    for (let j = -40; j <= 5; j++) {
      const inBoard = j >= -2 && j <= 2;
      const a = (inBoard ? 1 : ext) * tilesA;
      if (a < 0.003) continue;
      for (let i = -2; i <= 2; i++) tiles.push(<path key={`${i}_${j}`} d={tilePath(i, j, c)} fill={tileColor(i, j)} opacity={a * (inBoard ? 1 : 0.8)} />);
    }
  }
  const vFar = mix(-2.5, FLOOR_V[0], ext);
  const vNear = mix(2.5, FLOOR_V[1], ext);
  const seg = (u0: number, v0: number, u1: number, v1: number) => {
    const p = proj(u0, v0, 0, c);
    const q = proj(u1, v1, 0, c);
    return `M${p.x.toFixed(2)} ${p.y.toFixed(2)} L${q.x.toFixed(2)} ${q.y.toFixed(2)}`;
  };
  const ties: React.ReactNode[] = [];
  for (let v = Math.ceil(vFar); v <= Math.floor(vNear); v++) {
    const s = proj(0, v, 0, c).s;
    const a = lines * clamp(s * 1.6 - 0.1) * (v > 2.5 || v < -2.5 ? ext : 1) * mix(0.9, 0.42, prog(t, 0, 24));
    if (a < 0.01) continue;
    ties.push(<path key={v} d={seg(-RAIL_U, v, RAIL_U, v)} stroke={col} strokeWidth={1.6} opacity={a} />);
  }
  const front = side > 0.001 ? [
    // board thickness (front faces), fades as the floor tilts away
    pathOf([proj(-2.5, 2.5, 0, c), proj(2.5, 2.5, 0, c), proj(2.5, 2.5, -0.24, c), proj(-2.5, 2.5, -0.24, c)]),
    pathOf([proj(2.5, -2.5, 0, c), proj(2.5, 2.5, 0, c), proj(2.5, 2.5, -0.24, c), proj(2.5, -2.5, -0.24, c)]),
  ] : [];
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="np-rail-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={col} stopOpacity={0} />
          <stop offset="0.12" stopColor={col} stopOpacity={0.9} />
          <stop offset="1" stopColor={col} stopOpacity={1} />
        </linearGradient>
      </defs>
      {front.map((d, k) => (
        <path key={k} d={d} fill={k ? '#1a2350' : '#232d5c'} opacity={side} />
      ))}
      {tiles}
      {ties}
      {[-1.5, -0.5, 0.5, 1.5].map((u) => (
        <path key={u} d={seg(u, vFar, u, vNear)} stroke={col} strokeWidth={1.4} opacity={inner * 0.7} />
      ))}
      {[-RAIL_U, RAIL_U].map((u) => (
        <g key={u} opacity={lines * railAlpha}>
          <path d={seg(u, vFar, u, vNear)} stroke={col} strokeWidth={14} opacity={0.12} strokeLinecap="round" />
          <path d={seg(u, vFar, u, vNear)} stroke="url(#np-rail-fade)" strokeWidth={3.2} strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
};

// soft starfield (seeded), slow twinkle — used by the quiet focus world
export const stars = (seed: number, n: number) => {
  let s = seed;
  const r = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({length: n}, () => ({x: r() * 1920, y: r() * 1080, r: 0.6 + r() * 1.6, ph: r() * 6.28, sp: 0.02 + r() * 0.05}));
};
