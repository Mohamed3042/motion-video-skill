// Shared picture kit for worlds 9 (engine) and 10 (anywhere) — same builder owns both folders.
// Real-app look: navy panels #0c1c58, 1 px #355287 borders, 12 px radius, 7 px controls, Space Grotesk.
import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {C, FONT, MONO} from '../../brand';

export const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EXPO_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const lerp = (f: number, a: number, b: number, from = 0, to = 1, easing: (t: number) => number = EXPO) =>
  interpolate(f, [a, b], [from, to], {...CL, easing});
export const pop = (f: number, at: number, damping = 14, stiffness = 170, mass = 0.7) =>
  f < at ? 0 : spring({frame: f - at, fps: 60, config: {damping, stiffness, mass}});
export const pulse = (f: number, at: number, tau = 10) => (f < at ? 0 : Math.exp(-(f - at) / tau));
export const mix = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * Math.max(0, Math.min(1, t)))).join(',')})`;
};
export const rgba = (h: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',')},${a})`;

// Title moment: "0N / 10" mono, world name Space Grotesk 700, one-line promise.
export const WorldTitle: React.FC<{f: number; index: number; name: string; promise: string; accent: string; x: number; y: number; out: number; size?: number}> = ({
  f,
  index,
  name,
  promise,
  accent,
  x,
  y,
  out,
  size = 104,
}) => {
  const leave = lerp(f, out, out + 18, 0, 1, EXPO_IN);
  if (leave >= 1) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: 1 - leave, translate: `0px ${-leave * 40}px`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.24em', color: accent, opacity: lerp(f, 0, 12)}}>
        <span>{String(index).padStart(2, '0')} / 10</span>
        <span style={{width: 140 * lerp(f, 2, 30), height: 2, background: accent, opacity: 0.85}} />
      </div>
      <div style={{display: 'flex', overflow: 'hidden', marginTop: 8, paddingBottom: size * 0.08}}>
        {[...name].map((ch, i) => {
          const s = pop(f, 2 + i * 1.6, 15, 160, 0.8);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: size,
                lineHeight: 1.0,
                letterSpacing: '-0.035em',
                color: C.ink,
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
          fontSize: 34,
          letterSpacing: '-0.01em',
          color: C.muted,
          marginTop: 10,
          opacity: lerp(f, 14, 32),
          translate: `${lerp(f, 14, 38, 24, 0)}px 0px`,
        }}
      >
        {promise}
      </div>
    </div>
  );
};

// Navy app panel (12 px radius, 1 px line border).
export const Panel: React.FC<{x: number; y: number; w: number; h: number; style?: React.CSSProperties; glow?: string; children?: React.ReactNode}> = ({
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
      borderRadius: 12,
      background: `linear-gradient(180deg, ${C.raised} 0%, ${C.panel} 100%)`,
      border: `1px solid ${C.line}`,
      boxShadow: `0 40px 90px rgba(2,6,30,0.65)${glow ? `, 0 0 90px ${rgba(glow, 0.16)}` : ''}`,
      overflow: 'hidden',
      fontFamily: FONT,
      color: C.ink,
      ...style,
    }}
  >
    {children}
  </div>
);

// Text-bearing status pill.
export const Pill: React.FC<{color: string; children: React.ReactNode; size?: number; solid?: boolean; style?: React.CSSProperties}> = ({color, children, size = 15, solid, style}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: `${size * 0.32}px ${size * 0.75}px`,
      borderRadius: 999,
      fontFamily: MONO,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: '0.08em',
      color: solid ? C.bg : color,
      background: solid ? color : rgba(color, 0.12),
      border: `1px solid ${rgba(color, 0.55)}`,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

export const SampleChip: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <span
    style={{
      fontFamily: MONO,
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: C.soft,
      padding: '4px 9px',
      borderRadius: 7,
      border: `1px dashed ${C.line}`,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    Sample data
  </span>
);

export const Label: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = C.soft, style}) => (
  <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase', color, ...style}}>{children}</div>
);

// Pre-blurred glow (radial gradient, no filter).
export const Glow: React.FC<{x: number; y: number; r: number; color: string; a?: number; sx?: number}> = ({x, y, r, color, a = 0.35, sx = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - r,
      top: y - r,
      width: 2 * r,
      height: 2 * r,
      borderRadius: '50%',
      scale: `${sx} 1`,
      background: `radial-gradient(circle, ${rgba(color, a)} 0%, ${rgba(color, a * 0.45)} 30%, ${rgba(color, 0)} 70%)`,
    }}
  />
);

// Deep navy backdrop with a faint accent dot grid.
export const Backdrop: React.FC<{accent: string; grid?: number}> = ({accent, grid = 1}) => (
  <>
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 70% at 50% 48%, ${C.bg} 0%, ${C.deep} 75%)`}} />
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: 0.55 * grid}}>
      <defs>
        <pattern id={`dots-${accent.slice(1)}`} width={48} height={48} patternUnits="userSpaceOnUse">
          <circle cx={24} cy={24} r={1.4} fill={rgba(accent, 0.28)} />
        </pattern>
        <radialGradient id={`dotfade-${accent.slice(1)}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity={1} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id={`dotmask-${accent.slice(1)}`}>
          <rect width={1920} height={1080} fill={`url(#dotfade-${accent.slice(1)})`} />
        </mask>
      </defs>
      <rect width={1920} height={1080} fill={`url(#dots-${accent.slice(1)})`} mask={`url(#dotmask-${accent.slice(1)})`} />
    </svg>
  </>
);

// ---------- icons (inline SVG) ----------
export const IconCheck: React.FC<{size: number; color: string; bg?: string; stroke?: number}> = ({size, color, bg, stroke = 2.6}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flex: 'none'}}>
    {bg ? <circle cx={12} cy={12} r={12} fill={bg} /> : null}
    <path d="M6.5 12.4l3.6 3.6 7.4-8" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconArrow: React.FC<{size: number; color: string; stroke?: number}> = ({size, color, stroke = 2.4}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{flex: 'none'}}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);
export const IconSwap: React.FC<{size: number; color: string; stroke?: number}> = ({size, color, stroke = 2.2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{flex: 'none'}}>
    <path d="M4 8.5h15M15 4.5l4 4-4 4M20 15.5H5M9 11.5l-4 4 4 4" />
  </svg>
);
export const IconX: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" style={{flex: 'none'}}>
    <path d="M7 7l10 10M17 7L7 17" />
  </svg>
);
export const IconLock: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{flex: 'none'}}>
    <rect x={5} y={10.5} width={14} height={10} rx={2.5} />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);
export const IconShield: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" style={{flex: 'none'}}>
    <path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6z" />
    <path d="M8.8 12.2l2.2 2.2 4.3-4.6" />
  </svg>
);
export const IconMonitor: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" style={{flex: 'none'}}>
    <rect x={3} y={4} width={18} height={12} rx={2} />
    <path d="M9 20h6M12 16v4" />
  </svg>
);

// Orbit ring mark (ring + coral arc + satellite) — the app's logo mark, recreated as SVG.
export const OrbitMark: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{flex: 'none'}}>
    <circle cx={20} cy={20} r={14} fill="none" stroke={C.ink} strokeWidth={3.2} />
    <path d="M8.5 11.5A14 14 0 0 1 26 7.3" fill="none" stroke={C.coral} strokeWidth={3.4} strokeLinecap="round" />
    <circle cx={30.5} cy={9.5} r={3.6} fill={C.coral} />
  </svg>
);
