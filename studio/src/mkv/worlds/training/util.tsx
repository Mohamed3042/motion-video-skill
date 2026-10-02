// Small frame-driven helpers + glyphs shared by the Training and Arcade worlds.
import React from 'react';
import {Easing, interpolate, spring} from 'remotion';

export const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EXPO_IN = Easing.bezier(0.7, 0, 0.84, 0);

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ramp = (f: number, a: number, b: number, from = 0, to = 1, easing: (t: number) => number = EXPO) =>
  interpolate(f, [a, b], [from, to], {...CL, easing});
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Spring that is exactly 0 before `at` (safe with fractional frames inside motion blur).
export const pop = (f: number, at: number, damping = 13, stiffness = 170, mass = 0.7) =>
  f < at ? 0 : spring({frame: f - at, fps: 60, config: {damping, stiffness, mass}});

// ✓ and → are drawn (the Latin font subsets lack them).
export const Check: React.FC<{size: number; color: string; stroke?: number; draw?: number; style?: React.CSSProperties}> = ({
  size,
  color,
  stroke = 3,
  draw = 1,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{overflow: 'visible', ...style}}>
    <path
      d="M5 12.5l4.6 4.6L19.2 7.4"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - draw}
    />
  </svg>
);

export const Arrow: React.FC<{size: number; color: string; stroke?: number; style?: React.CSSProperties}> = ({size, color, stroke = 2.4, style}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
    <path d="M4 12h15M13.5 6.5L19 12l-5.5 5.5" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// MK Voice mark: 7 rounded green bars (symmetric heights) on a black rounded square (radius 22%).
export const Mark: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => {
  const hs = [0.28, 0.5, 0.72, 0.9, 0.72, 0.5, 0.28];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <rect width={100} height={100} rx={22} fill="#000" />
      {hs.map((h, i) => (
        <rect key={i} x={17 + i * 10} y={50 - h * 33} width={6} height={h * 66} rx={3} fill="#1ED760" />
      ))}
    </svg>
  );
};

// ∫ v df from the first knot to f for a piecewise-linear speed curve [frame, speed][] (exact; fractional frames ok).
export type Knot = [number, number];
export const integ = (ks: Knot[], f: number) => {
  let u = 0;
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, va] = ks[i];
    const [b, vb] = ks[i + 1];
    if (f <= a) break;
    const x = Math.min(f, b);
    const vx = va + ((vb - va) * (x - a)) / (b - a);
    u += ((va + vx) / 2) * (x - a);
  }
  return u;
};
