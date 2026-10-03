// Small frame-driven helpers shared by the Ingest and Sync worlds.
import React from 'react';
import {spring} from 'remotion';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);

export const ease = {
  cubicIn: (t: number) => t * t * t,
  cubicOut: (t: number) => 1 - (1 - t) ** 3,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  expoIn: (t: number) => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
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

// Pre-blurred radial glow (a gradient, never a blur filter).
export const Glow: React.FC<{x: number; y: number; w: number; h?: number; color: string; opacity?: number}> = ({x, y, w, h = w, color, opacity = 1}) =>
  opacity <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: '50%',
        background: `radial-gradient(closest-side, ${rgba(color, 0.7)} 0%, ${rgba(color, 0.26)} 35%, ${rgba(color, 0.07)} 65%, ${rgba(color, 0)} 100%)`,
        opacity,
        pointerEvents: 'none',
      }}
    />
  );

// Inline glyphs (font subsets lack ✓ and →).
export const Check: React.FC<{size: number; color: string; p?: number; width?: number}> = ({size, color, p = 1, width = 8}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{overflow: 'visible', display: 'block'}}>
    <path d="M12 34 L27 48 L53 18" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={70} strokeDashoffset={70 * (1 - clamp(p))} />
  </svg>
);
export const Arrow: React.FC<{size: number; color: string; width?: number}> = ({size, color, width = 6}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block', overflow: 'visible'}}>
    <path d="M10 32 H52 M37 17 L52 32 L37 47" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const Lock: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block'}}>
    <rect x={14} y={28} width={36} height={26} rx={5} fill="none" stroke={color} strokeWidth={5} />
    <path d="M22 28 V20 a10 10 0 0 1 20 0 V28" fill="none" stroke={color} strokeWidth={5} />
    <circle cx={32} cy={41} r={3.5} fill={color} />
  </svg>
);
