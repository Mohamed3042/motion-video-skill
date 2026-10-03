// Small frame-driven helpers shared by worlds 3 · Review, 4 · Captions and 5 · Handoff.
import React from 'react';
import {spring} from 'remotion';
import {C, FONT, MONO, RADIUS} from '../../brand';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));

export const ease = {
  cubicIn: (t: number) => t * t * t,
  cubicOut: (t: number) => 1 - (1 - t) ** 3,
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  expoIn: (t: number) => (t <= 0 ? 0 : 2 ** (10 * t - 10)),
  backOut: (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
};

type SpringCfg = {damping?: number; stiffness?: number; mass?: number};
// Spring that is exactly 0 before `from`.
export const sp = (f: number, from: number, config: SpringCfg = {damping: 15, stiffness: 170, mass: 0.9}) =>
  f < from ? 0 : spring({frame: f - from, fps: 60, config});

// Flash that peaks exactly on frame `at` (sound and picture share the frame).
export const pulse = (f: number, at: number, len = 14) => (f < at - 2 ? 0 : f < at ? (f - at + 2) / 2 : Math.exp(-(f - at) / (len / 3)));
// Button press: dips on `at`, springs back.
export const pressScale = (f: number, at: number) => (f < at - 3 || f > at + 16 ? 1 : f < at ? 1 - 0.05 * ((f - at + 3) / 3) : 1 - 0.05 * Math.exp(-(f - at) / 4) * Math.cos((f - at) / 3));

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
export const Glow: React.FC<{x: number; y: number; w: number; h?: number; color: string; opacity?: number}> = ({x, y, w, h = w, color, opacity = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      borderRadius: '50%',
      background: `radial-gradient(closest-side, ${rgba(color, 0.8)} 0%, ${rgba(color, 0.3)} 30%, ${rgba(color, 0.08)} 62%, ${rgba(color, 0)} 100%)`,
      opacity,
      pointerEvents: 'none',
    }}
  />
);

// ---- inline SVG glyphs (font subsets lack ✓ → ⇄) ----
export const Check: React.FC<{size: number; color: string; p?: number; width?: number}> = ({size, color, p = 1, width = 8}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block', overflow: 'visible', flexShrink: 0}}>
    <path d="M12 34 L27 48 L53 18" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={70} strokeDashoffset={70 * (1 - p)} />
  </svg>
);
export const Arrow: React.FC<{size: number; color: string; width?: number}> = ({size, color, width = 6}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block', flexShrink: 0}}>
    <path d="M8 32 H54 M38 16 L54 32 L38 48" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const Swap: React.FC<{size: number; color: string; width?: number}> = ({size, color, width = 5}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block', flexShrink: 0}}>
    <path d="M10 22 H52 M40 10 L52 22 L40 34 M54 42 H12 M24 30 L12 42 L24 54" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---- the world title moment: "0N / 11", the name in display type, one promise line ----
export const Title: React.FC<{f: number; index: string; name: string; promise: React.ReactNode; color: string; out: number; size?: number}> = ({
  f,
  index,
  name,
  promise,
  color,
  out,
  size = 132,
}) => {
  const o = ease.cubicIn(prog(f, out, out + 18));
  if (o >= 1) return null;
  const idx = ease.expoOut(prog(f, 2, 22));
  const pr = ease.expoOut(prog(f, 24, 50));
  return (
    <div style={{position: 'absolute', left: 96, top: 150, opacity: 1 - o, transform: `translateY(${-40 * o}px)`}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.32em', color, opacity: idx, transform: `translateX(${(1 - idx) * -20}px)`}}>{index}</div>
      <div style={{display: 'flex', marginTop: 10, fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: '-0.035em', color: C.text, whiteSpace: 'pre'}}>
        {name.split('').map((ch, i) => {
          const s = sp(f, 4 + i * 1.6, {damping: 14, stiffness: 200, mass: 0.7});
          return (
            <span key={i} style={{display: 'inline-block', opacity: clamp(s * 2.5), transform: `translateY(${(1 - s) * 60}px)`}}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{marginTop: 20, fontFamily: FONT, fontWeight: 500, fontSize: 36, color: C.muted, opacity: pr, transform: `translateY(${(1 - pr) * 14}px)`}}>{promise}</div>
    </div>
  );
};

// ---- Carbon controls ----
export const panel = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute',
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: RADIUS.dialog,
  boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
  ...extra,
});

export const Btn: React.FC<{
  f: number;
  label: React.ReactNode;
  at?: number[]; // press frames
  primary?: boolean;
  w?: number | string;
  h?: number;
  fs?: number;
  dim?: boolean;
  accent?: string;
  style?: React.CSSProperties;
}> = ({f, label, at = [], primary, w, h = 46, fs = 19, dim, accent = C.amber, style}) => {
  const s = at.reduce((m, a) => Math.min(m, pressScale(f, a)), 1);
  const fl = at.reduce((m, a) => Math.max(m, pulse(f, a, 18)), 0);
  return (
    <div
      style={{
        width: w,
        height: h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '0 16px',
        boxSizing: 'border-box',
        borderRadius: RADIUS.control,
        background: primary ? accent : fl > 0 ? rgba(accent, 0.1 + 0.25 * fl) : C.raised,
        border: `1px solid ${primary ? accent : fl > 0.02 ? rgba(accent, 0.4 + 0.6 * fl) : C.line}`,
        color: primary ? C.onAmber : dim ? rgba(C.muted, 0.5) : C.text,
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: fs,
        whiteSpace: 'nowrap',
        transform: `scale(${s})`,
        boxShadow: fl > 0.02 ? `0 0 ${30 * fl}px ${rgba(accent, 0.45 * fl)}` : 'none',
        ...style,
      }}
    >
      {label}
    </div>
  );
};

export const Chip: React.FC<{children: React.ReactNode; color: string; fill?: number; style?: React.CSSProperties}> = ({children, color, fill = 0.12, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 30,
      padding: '0 12px',
      borderRadius: RADIUS.control,
      background: rgba(color, fill),
      border: `1px solid ${rgba(color, 0.55)}`,
      color,
      fontFamily: MONO,
      fontWeight: 700,
      fontSize: 15,
      letterSpacing: '0.08em',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

export const MonoLabel: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = C.muted, style}) => (
  <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.18em', color, whiteSpace: 'nowrap', ...style}}>{children}</div>
);
