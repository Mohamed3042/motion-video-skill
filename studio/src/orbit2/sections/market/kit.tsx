// Shared picture kit for worlds 7 (My market) and 8 (Employers) — same builder owns both folders.
// Also holds the café-wall portal geometry, rendered identically by both worlds around their boundary.
import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {C, FONT, MONO} from '../../brand';

export const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EXPO_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const LOCK = Easing.bezier(0.55, 0, 0.25, 1); // fast middle, short firm landing
export const lerp = (f: number, a: number, b: number, from = 0, to = 1, easing: (t: number) => number = EXPO) =>
  interpolate(f, [a, b], [from, to], {...CL, easing});
export const pop = (f: number, at: number, damping = 14, stiffness = 170, mass = 0.7) =>
  f < at ? 0 : spring({frame: f - at, fps: 60, config: {damping, stiffness, mass}});
export const pulse = (f: number, at: number, tau = 10) => (f < at ? 0 : Math.exp(-(f - at) / tau));
export const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  const k = Math.max(0, Math.min(1, t));
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
export const rgba = (hex: string, a: number) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`;
};

// ---------- title moment: "0N / 10" mono, world name Space Grotesk 700, one-line promise ----------
export const WorldTitle: React.FC<{f: number; index: number; name: string; promise: string; accent: string; x: number; y: number; out: number; size?: number}> = ({
  f,
  index,
  name,
  promise,
  accent,
  x,
  y,
  out,
  size = 136,
}) => {
  const leave = lerp(f, out, out + 18, 0, 1, EXPO_IN);
  if (leave >= 1 || f < -2) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: 1 - leave, translate: `${-leave * 60}px 0px`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: '0.24em', color: accent, opacity: lerp(f, 0, 12)}}>
        <span>{String(index).padStart(2, '0')} / 10</span>
        <span style={{width: 170 * lerp(f, 2, 36), height: 2, background: accent, opacity: 0.85}} />
      </div>
      <div style={{display: 'flex', overflow: 'hidden', marginTop: 4, paddingBottom: size * 0.08}}>
        {[...name].map((ch, i) => {
          const s = pop(f, 1 + i * 2, 16, 150, 0.8);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: size,
                lineHeight: 1.02,
                letterSpacing: '-0.04em',
                color: C.ink,
                translate: `0px ${(1 - s) * size * 1.1}px`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 38, letterSpacing: '-0.01em', color: C.muted, marginTop: 6, opacity: lerp(f, 14, 32), translate: `${lerp(f, 14, 40, 30, 0)}px 0px`}}>
        {promise}
      </div>
    </div>
  );
};

// ---------- app-style UI (Orbit: navy panels #0c1c58, 1 px #355287, 12 px radius, 7 px controls) ----------
export const Panel: React.FC<{x: number; y: number; w: number; h: number; style?: React.CSSProperties; glow?: string; children?: React.ReactNode}> = ({x, y, w, h, style, glow, children}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 12,
      background: C.panel,
      border: `1px solid ${C.line}`,
      boxShadow: `0 40px 90px rgba(2,6,32,0.55)${glow ? `, 0 0 110px ${rgba(glow, 0.14)}` : ''}`,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

export const SampleChip: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <div
    style={{
      fontFamily: MONO,
      fontWeight: 500,
      fontSize: 13,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: C.muted,
      background: C.raised,
      border: `1px solid ${C.line}`,
      borderRadius: 7,
      padding: '6px 10px',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    Sample data
  </div>
);

export const Label: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 14, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.soft, ...style}}>{children}</div>
);

// need / skill chip (app: .need-list span — raised panel, line border, muted text)
export const Chip: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 34,
      padding: '0 13px',
      borderRadius: 7,
      background: C.raised,
      border: `1px solid ${C.line}`,
      fontFamily: FONT,
      fontWeight: 500,
      fontSize: 17,
      color: C.muted,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

// ---------- icons (inline SVG; never glyphs) ----------
export const IconCheck: React.FC<{size: number; color: string; draw?: number; width?: number}> = ({size, color, draw = 1, width = 2.6}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M5.5 12.6l4.2 4.2 8.8-9.4" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
  </svg>
);
export const IconArrow: React.FC<{size: number; color: string; up?: boolean}> = ({size, color, up}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    {up ? <path d="M7 17L17 7M8.5 7H17v8.5" /> : <path d="M4.5 12h14.5M13.5 6.5L19 12l-5.5 5.5" />}
  </svg>
);
export const IconSparkle: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M10 2.5l1.9 5.6 5.6 1.9-5.6 1.9L10 17.5l-1.9-5.6L2.5 10l5.6-1.9z" />
    <path d="M18.5 13.5l.95 2.55 2.55.95-2.55.95-.95 2.55-.95-2.55L15 17l2.55-.95z" />
  </svg>
);
export const IconEye: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
    <circle cx={12} cy={12} r={3} />
  </svg>
);
export const IconLink: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13.5a4.5 4.5 0 006.4.4l2.6-2.6a4.5 4.5 0 00-6.4-6.4l-1.2 1.2" />
    <path d="M14 10.5a4.5 4.5 0 00-6.4-.4L5 12.7a4.5 4.5 0 006.4 6.4l1.2-1.2" />
  </svg>
);
export const IconGlobe: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <circle cx={12} cy={12} r={9} />
    <path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
  </svg>
);

// ---------- café-wall portal (market exit → employers entrance) ----------
// Mortar line k sits at y = Y0 + k·ROW. Row k (between lines k and k+1) is dark with light tiles every other TILE,
// odd rows offset by half a tile — the classic wedge arrangement. Market's matrix row lines are lines 0…6.
export const CAFE = {ROW: 72, Y0: 400, TILE: 112, MORTAR: 5, K0: -6, K1: 10, DARK: '#050a33', LIGHT: '#ddd7ff', MORTAR_C: '#8b8fb8'};
export const lineY = (k: number) => CAFE.Y0 + k * CAFE.ROW;
const rowDelay = (k: number) => 1.2 * Math.min(8, Math.abs(k - 3));
// u = how far row k has grown out of its top line (0…1). g = frames relative to the boundary (0 = all rows lock).
export const cafeGrow = (g: number, k: number) => lerp(g, -26 + rowDelay(k), 0, 0, 1, LOCK);

export const CafeWall: React.FC<{
  g: number;
  mortar?: number;
  mortarColor?: string;
  dark?: string;
  light?: string;
  tileOp?: (k: number, x: number) => number; // per-tile opacity (light tiles), x = tile centre
  rowOp?: (k: number) => number;
  x0?: number;
  x1?: number;
}> = ({g, mortar = CAFE.MORTAR, mortarColor = CAFE.MORTAR_C, dark = CAFE.DARK, light = CAFE.LIGHT, tileOp, rowOp, x0 = -60, x1 = 1980}) => {
  const {ROW, TILE, K0, K1} = CAFE;
  const rows: React.ReactNode[] = [];
  for (let k = K0; k < K1; k++) {
    const u = cafeGrow(g, k);
    const ro = rowOp ? rowOp(k) : 1;
    if (u <= 0.001 || ro <= 0.001) continue;
    const top = lineY(k);
    const dir = k % 2 ? 1 : -1;
    const off = (Math.abs(k) % 2) * (TILE / 2) + dir * (1 - u) * TILE * 1.5;
    const tiles: React.ReactNode[] = [];
    const first = Math.floor((x0 - off) / (2 * TILE)) - 1;
    for (let i = first; off + i * 2 * TILE < x1 + TILE; i++) {
      const x = off + i * 2 * TILE;
      const o = (tileOp ? tileOp(k, x + TILE / 2) : 1) * Math.min(1, u * 1.6);
      if (o <= 0.002) continue;
      tiles.push(<rect key={i} x={x} y={0} width={TILE} height={ROW} fill={light} opacity={o} />);
    }
    rows.push(
      <g key={k} transform={`translate(0 ${top}) scale(1 ${u.toFixed(4)})`} opacity={ro}>
        <rect x={x0} y={0} width={x1 - x0} height={ROW} fill={dark} />
        {tiles}
      </g>,
    );
  }
  const lines: React.ReactNode[] = [];
  for (let k = K0; k <= K1; k++) {
    const ro = rowOp ? Math.max(rowOp(k), rowOp(k - 1)) : 1;
    if (ro <= 0.001) continue;
    lines.push(<rect key={k} x={x0} y={lineY(k) - mortar / 2} width={x1 - x0} height={mortar} fill={mortarColor} opacity={ro} />);
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      {rows}
      {lines}
    </svg>
  );
};
