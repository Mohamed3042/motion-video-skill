// Small helpers shared by the Live and TTS worlds (frame-driven only).
import React from 'react';
import {spring} from 'remotion';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));

export const ease = {
  cubicIn: (t: number) => t * t * t,
  cubicOut: (t: number) => 1 - (1 - t) ** 3,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  sine: (t: number) => (1 - Math.cos(Math.PI * t)) / 2,
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  expoIn: (t: number) => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
  expoInOut: (t: number) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2,
  backOut: (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
};

type SpringCfg = {damping?: number; stiffness?: number; mass?: number};
// Spring that is exactly 0 before `from` (safe with fractional frames).
export const sp = (f: number, from: number, config: SpringCfg = {damping: 14, stiffness: 170, mass: 1}) =>
  f < from ? 0 : spring({frame: f - from, fps: 60, config});

// '#RRGGBB' + alpha -> rgba()
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

// Pre-blurred radial glow (gradient, never a blur filter).
export const Glow: React.FC<{x: number; y: number; size: number; color: string; opacity?: number; scale?: number}> = ({
  x,
  y,
  size,
  color,
  opacity = 1,
  scale = 1,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${rgba(color, 0.85)} 0%, ${rgba(color, 0.32)} 22%, ${rgba(color, 0.09)} 46%, ${rgba(color, 0)} 70%)`,
      opacity,
      transform: `scale(${scale})`,
    }}
  />
);

// Inline SVG glyphs (Latin font subsets lack ✓ and →).
export const Check: React.FC<{size: number; color: string; p?: number; width?: number}> = ({size, color, p = 1, width = 9}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{overflow: 'visible', display: 'block'}}>
    <path
      d="M12 34 L27 48 L53 18"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={70}
      strokeDashoffset={70 * (1 - p)}
    />
  </svg>
);

export const Arrow: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block'}}>
    <path d="M10 32 H52 M36 16 L52 32 L36 48" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Play: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block'}}>
    <path d="M22 14 L52 32 L22 50 Z" fill={color} stroke={color} strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

export const MicIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block'}}>
    <rect x={23} y={8} width={18} height={32} rx={9} fill={color} />
    <path d="M14 30 a18 18 0 0 0 36 0 M32 48 V56 M22 56 H42" fill="none" stroke={color} strokeWidth={4.5} strokeLinecap="round" />
  </svg>
);

export const PhonesIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block'}}>
    <path d="M12 40 V32 a20 20 0 0 1 40 0 V40" fill="none" stroke={color} strokeWidth={4.5} strokeLinecap="round" />
    <rect x={9} y={36} width={12} height={18} rx={5} fill={color} />
    <rect x={43} y={36} width={12} height={18} rx={5} fill={color} />
  </svg>
);

// The MK Voice mark: 7 rounded symmetric bars.
export const WaveMark: React.FC<{size: number; color: string; amp?: number[]}> = ({size, color, amp}) => {
  const hs = amp ?? [0.3, 0.55, 0.8, 1, 0.8, 0.55, 0.3];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block'}}>
      {hs.map((h, i) => {
        const bh = Math.max(6, h * 44);
        return <rect key={i} x={8 + i * 7.2} y={32 - bh / 2} width={4.6} height={bh} rx={2.3} fill={color} />;
      })}
    </svg>
  );
};
