// Shared picture kit for worlds 10 (Profile & Intelligence) and 11 (Anywhere, private). Same builder owns both folders.
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
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
export const rgba = (hex: string, a: number) =>
  `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

export type Rect = {x: number; y: number; w: number; h: number};
export const mixRect = (a: Rect, b: Rect, t: number): Rect => ({x: mixN(a.x, b.x, t), y: mixN(a.y, b.y, t), w: mixN(a.w, b.w, t), h: mixN(a.h, b.h, t)});

// World title moment: "NN / 11", display name, one promise line.
export const WorldTitle: React.FC<{
  f: number;
  index: number;
  lines: string[];
  promise: string;
  accent: string;
  x: number;
  y: number;
  out: number;
  size?: number;
}> = ({f, index, lines, promise, accent, x, y, out, size = 100}) => {
  const leave = lerp(f, out, out + 18, 0, 1, EXPO_IN);
  if (leave >= 1) return null;
  let k = 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: 1 - leave, translate: `0px ${-leave * 40}px`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: '0.24em', color: accent, opacity: lerp(f, 0, 14)}}>
        <span>{String(index).padStart(2, '0')} / 11</span>
        <span style={{width: 150 * lerp(f, 2, 34), height: 2, background: accent, opacity: 0.8}} />
      </div>
      {lines.map((line, li) => (
        <div key={li} style={{display: 'flex', overflow: 'hidden', marginTop: li ? -size * 0.1 : 6, paddingBottom: size * 0.06}}>
          {[...line].map((ch) => {
            const s = pop(f, 2 + k++ * 1.6, 15, 150, 0.8);
            return (
              <span
                key={k}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'pre',
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: size,
                  lineHeight: 1.04,
                  letterSpacing: '-0.035em',
                  color: C.text,
                  translate: `0px ${(1 - s) * size * 1.05}px`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      ))}
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 38,
          letterSpacing: '-0.01em',
          color: C.muted,
          marginTop: 12,
          opacity: lerp(f, 16, 34),
          translate: `${lerp(f, 16, 40, 26, 0)}px 0px`,
        }}
      >
        {promise}
      </div>
    </div>
  );
};

// Small mono tool label ("CREATIVE PROFILE") with a short accent rule.
export const ToolLabel: React.FC<{f: number; at: number; out?: number; text: string; accent: string; x: number; y: number; sub?: string}> = ({f, at, out = 1e9, text, accent, x, y, sub}) => {
  const a = lerp(f, at, at + 14) * (1 - lerp(f, out, out + 10));
  if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: a, display: 'flex', alignItems: 'center', gap: 14}}>
      <span style={{width: 26 * lerp(f, at, at + 18), height: 2, background: accent}} />
      <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 19, letterSpacing: '0.22em', color: accent, translate: `${lerp(f, at, at + 18, -10, 0)}px 0px`}}>{text}</span>
      {sub ? <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 15, letterSpacing: '0.12em', color: C.muted}}>{sub}</span> : null}
    </div>
  );
};

// ---------- inline SVG glyphs (fonts' latin subsets lack ✓ → ✦) ----------
export const IconCheck: React.FC<{size: number; color: string; bg?: string; draw?: number; stroke?: number}> = ({size, color, bg, draw = 1, stroke = 2.6}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink: 0, display: 'block'}}>
    {bg ? <circle cx={12} cy={12} r={12} fill={bg} /> : null}
    <path d="M6.5 12.4l3.6 3.6 7.4-8" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
  </svg>
);
export const IconX: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink: 0, display: 'block'}}>
    <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
  </svg>
);
// → (dir 1) or ← (dir -1)
export const IconArrow: React.FC<{size: number; color: string; dir?: 1 | -1; stroke?: number}> = ({size, color, dir = 1, stroke = 2.4}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink: 0, display: 'block', transform: dir < 0 ? 'scaleX(-1)' : undefined}}>
    <path d="M3.5 12h16M13.5 6l6 6-6 6" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconSpark: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink: 0, display: 'block'}}>
    <path d="M12 2.8c.6 4.6 3.1 7.6 9.2 9.2-6.1 1.6-8.6 4.6-9.2 9.2-.6-4.6-3.1-7.6-9.2-9.2 6.1-1.6 8.6-4.6 9.2-9.2z" fill="none" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
  </svg>
);
export const IconChevron: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink: 0, display: 'block'}}>
    <path d="M6 9.5l6 6 6-6" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconFile: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink: 0, display: 'block'}}>
    <path d="M6.5 3.5h7l4 4v13h-11z M13.5 3.5v4h4" fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </svg>
);
export const IconNote: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink: 0, display: 'block'}}>
    <path d="M5 6.5h14M5 11.5h14M5 16.5h9" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);
export const IconLock: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flexShrink: 0, display: 'block'}}>
    <rect x={5} y={10.5} width={14} height={10} rx={2} fill="none" stroke={color} strokeWidth={1.9} />
    <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" fill="none" stroke={color} strokeWidth={1.9} />
  </svg>
);
// mouse pointer
export const Cursor: React.FC<{x: number; y: number; press?: number; opacity?: number}> = ({x, y, press = 0, opacity = 1}) => (
  <svg width={34} height={40} viewBox="0 0 34 40" style={{position: 'absolute', left: x - 4, top: y - 3, opacity, scale: String(1 - 0.12 * press), transformOrigin: '4px 3px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'}}>
    <path d="M4 3l0 27 7-6.5 4.6 10.5 4.6-2-4.6-10.3 9.6-.4z" fill="#f4f2ea" stroke="#151715" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

// Carbon panel surface.
export const panelStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  position: 'absolute',
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: 9,
  overflow: 'hidden',
  ...extra,
});

// Abstract camera picture (no real people): silhouette on a graded backdrop with a sweeping light bar.
export const CamPicture: React.FC<{w: number; h: number; variant: number; t: number; label?: string; labelSize?: number}> = ({w, h, variant, t, label, labelSize = 11}) => {
  const bg = [
    ['#2a2f2a', '#151816'],
    ['#2c2a24', '#141310'],
    ['#232a2e', '#121618'],
    ['#2b2529', '#151214'],
  ][variant % 4];
  const sx = [0.38, 0.55, 0.5, 0.64][variant % 4];
  const sc = [0.55, 0.75, 1.05, 0.62][variant % 4];
  const bar = ((t * 0.006 + variant * 0.27) % 1.4) - 0.2;
  return (
    <svg width={w} height={h} viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" style={{display: 'block'}}>
      <defs>
        <linearGradient id={`cam-bg-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </linearGradient>
      </defs>
      <rect width={160} height={90} fill={`url(#cam-bg-${variant})`} />
      <rect x={bar * 160 - 10} y={0} width={14} height={90} fill="#f8ce81" opacity={0.08} />
      <rect x={0} y={68} width={160} height={22} fill="#000" opacity={0.18} />
      <g transform={`translate(${sx * 160} ${90}) scale(${sc})`}>
        <ellipse cx={0} cy={-58} rx={11} ry={13} fill="#0b0d0c" opacity={0.92} />
        <path d="M-30 0 C-30 -26 -20 -40 0 -40 C20 -40 30 -26 30 0 Z" fill="#0b0d0c" opacity={0.92} />
      </g>
      {label ? (
        <text x={6} y={6 + labelSize} fontFamily="JetBrains Mono, monospace" fontSize={labelSize} fontWeight={700} fill="#ebeae2" opacity={0.85}>
          {label}
        </text>
      ) : null}
    </svg>
  );
};
