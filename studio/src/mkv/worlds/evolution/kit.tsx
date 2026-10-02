// Shared picture kit for worlds 7–9 (Evolution, Settings, Guide). Same builder owns all three folders.
import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {C, FONT, MONO} from '../../brand';
import {mulberry32} from '../../timing';

export const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EXPO_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const lerp = (f: number, a: number, b: number, from = 0, to = 1, easing: (t: number) => number = EXPO) =>
  interpolate(f, [a, b], [from, to], {...CL, easing});
export const pop = (f: number, at: number, damping = 14, stiffness = 170, mass = 0.7) =>
  f < at ? 0 : spring({frame: f - at, fps: 60, config: {damping, stiffness, mass}});
// exponential decay pulse after a frame (0 before it)
export const pulse = (f: number, at: number, tau = 10) => (f < at ? 0 : Math.exp(-(f - at) / tau));
export const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => (h[0] === '#' ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) : h.slice(4, -1).split(',').map(Number));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * Math.max(0, Math.min(1, t)))).join(',')})`;
};

// World title moment: index "0N / 09", big name (Inter 900), one-line promise.
export const WorldTitle: React.FC<{
  f: number;
  index: number;
  name: string;
  promise: string;
  accent: string;
  x: number;
  y: number;
  out: number;
  size?: number;
}> = ({f, index, name, promise, accent, x, y, out, size = 168}) => {
  const leave = lerp(f, out, out + 18, 0, 1, EXPO_IN);
  if (leave >= 1) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: 1 - leave, translate: `0px ${-leave * 46}px`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: '0.24em', color: accent, opacity: lerp(f, 0, 14)}}>
        <span>{String(index).padStart(2, '0')} / 09</span>
        <span style={{width: 150 * lerp(f, 2, 34), height: 2, background: accent, opacity: 0.8}} />
      </div>
      <div style={{display: 'flex', overflow: 'hidden', marginTop: 6, paddingBottom: size * 0.06}}>
        {[...name].map((ch, i) => {
          const s = pop(f, 2 + i * 2.2, 15, 150, 0.8);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: size,
                lineHeight: 1.02,
                letterSpacing: '-0.045em',
                color: C.fg,
                translate: `0px ${(1 - s) * size * 1.05}px`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 38,
          letterSpacing: '-0.01em',
          color: '#d9d9d9',
          marginTop: 14,
          opacity: lerp(f, 16, 34),
          translate: `${lerp(f, 16, 40, 26, 0)}px 0px`,
        }}
      >
        {promise}
      </div>
    </div>
  );
};

// ---------- app-style UI pieces (Spotify-like dark: #181818 surfaces, #242424 controls, green primary) ----------
export const Card: React.FC<{x: number; y: number; w: number; h: number; style?: React.CSSProperties; glow?: string; children?: React.ReactNode}> = ({
  x,
  y,
  w,
  h,
  style,
  glow,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 22,
      background: 'linear-gradient(180deg, #1c1c1c 0%, #151515 100%)',
      border: '1px solid #2e2e2e',
      boxShadow: `0 50px 110px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.025) inset${glow ? `, 0 0 120px ${glow}26` : ''}`,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Label: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8a8a8a', ...style}}>{children}</div>
);

// ---------- icons (inline SVG; Inter's latin subset lacks ✓ → ⇄) ----------
export const IconPlay: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M8 5.5v13l10.5-6.5z" fill={color} />
  </svg>
);
export const IconCheck: React.FC<{size: number; color: string; bg?: string}> = ({size, color, bg}) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    {bg ? <circle cx={12} cy={12} r={12} fill={bg} /> : null}
    <path d="M6.5 12.4l3.6 3.6 7.4-8" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconSwap: React.FC<{size: number; color: string; stroke?: number}> = ({size, color, stroke = 2.2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8.5h15M15 4.5l4 4-4 4M20 15.5H5M9 11.5l-4 4 4 4" />
  </svg>
);
export const IconArrow: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);
export const IconSearch: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
    <circle cx={10.5} cy={10.5} r={6.5} />
    <path d="M15.5 15.5L20 20" />
  </svg>
);
// MK mark: 7 rounded symmetric bars
export const MarkBars: React.FC<{size: number; color: string}> = ({size, color}) => {
  const hs = [0.3, 0.55, 0.8, 1, 0.8, 0.55, 0.3];
  return (
    <svg width={size} height={size} viewBox="0 0 70 70">
      {hs.map((h, i) => (
        <rect key={i} x={5 + i * 9.2} y={35 - h * 28} width={5.4} height={h * 56} rx={2.7} fill={color} />
      ))}
    </svg>
  );
};

// Deterministic speech-like waveform bars. `lit` 0..1 = how far the highlight has travelled (left → right).
export const waveHeights = (n: number, seed: number) => {
  const r = mulberry32(seed);
  const env = [r(), r(), r(), r()].map((v) => 0.4 + v * 0.6);
  return Array.from({length: n}, (_, i) => {
    const x = i / (n - 1);
    const e = env[Math.min(3, Math.floor(x * 4))] * Math.sin(Math.PI * (0.06 + x * 0.88)) ** 0.6;
    return Math.max(0.08, e * (0.35 + 0.65 * r()));
  });
};
export const Wave: React.FC<{
  heights: number[];
  w: number;
  h: number;
  color: string;
  litColor?: string;
  lit?: number;
  amp?: number;
  reveal?: number;
  style?: React.CSSProperties;
}> = ({heights, w, h, color, litColor, lit = 0, amp = 1, reveal = 1, style}) => {
  const n = heights.length;
  const bw = w / n;
  return (
    <svg width={w} height={h} style={{overflow: 'visible', ...style}}>
      {heights.map((v, i) => {
        const x = i / n;
        if (x > reveal) return null;
        const bh = Math.max(3, v * h * amp * Math.min(1, (reveal - x) * n * 0.3));
        return <rect key={i} x={i * bw + bw * 0.2} y={(h - bh) / 2} width={bw * 0.6} height={bh} rx={bw * 0.3} fill={litColor && x < lit ? litColor : color} />;
      })}
    </svg>
  );
};
