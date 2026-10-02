// Small motion + UI kit shared by the My Voice and Clone Lab worlds.
import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {C, FONT} from '../../brand';

export const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EXPO_IN = Easing.bezier(0.7, 0, 0.84, 0);

// 0→1 over [a, b] with easing, clamped
export const ramp = (f: number, a: number, b: number, easing: (t: number) => number = EXPO) => interpolate(f, [a, b], [0, 1], {...CL, easing});
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const pop = (f: number, at: number, damping = 14, stiffness = 180, mass = 0.7) =>
  spring({frame: f - at, fps: 60, config: {damping, stiffness, mass}});

// hex colour blend
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mixColor = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  const k = Math.min(1, Math.max(0, t));
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

// in (springy rise) → hold → out (quick lift); returns style for an element
export const enter = (f: number, at: number, out = 1e9, dy = 26, outDy = -18): React.CSSProperties => {
  const s = pop(f, at, 16, 170, 0.7);
  const o = ramp(f, out, out + 14, EXPO_IN);
  return {
    opacity: Math.min(1, s * 1.4) * (1 - o),
    transform: `translateY(${(1 - s) * dy + o * outDy}px)`,
  };
};

// Title letters that spring up one by one.
export const Letters: React.FC<{f: number; text: string; at: number; out?: number; size: number; color: string; weight?: number; stagger?: number; tracking?: string; style?: React.CSSProperties}> = ({
  f,
  text,
  at,
  out = 1e9,
  size,
  color,
  weight = 900,
  stagger = 3,
  tracking = '-0.045em',
  style,
}) => (
  <div style={{display: 'flex', fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1, letterSpacing: tracking, color, whiteSpace: 'pre', ...style}}>
    {[...text].map((ch, i) => {
      const s = pop(f, at + i * stagger, 13, 190, 0.6);
      const o = ramp(f, out + i * 1.5, out + i * 1.5 + 12, EXPO_IN);
      return (
        <span
          key={i}
          style={{
            display: 'inline-block',
            opacity: interpolate(s, [0, 0.3], [0, 1], CL) * (1 - o),
            transform: `translateY(${(1 - s) * size * 0.5 - o * size * 0.35}px) skewX(${(1 - s) * -10}deg)`,
          }}
        >
          {ch}
        </span>
      );
    })}
  </div>
);

// ---------- icons (stroke icons, 24 grid) ----------
export const Icon: React.FC<{name: 'play' | 'mic' | 'chev' | 'check' | 'arrow'; size: number; color: string; stroke?: number}> = ({name, size, color, stroke = 2.2}) => {
  const p = {fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flexShrink: 0}}>
      {name === 'play' ? <path d="M8 5.5v13l10.5-6.5z" fill={color} stroke="none" /> : null}
      {name === 'mic' ? (
        <>
          <rect x="9" y="3" width="6" height="11" rx="3" {...p} />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" {...p} />
        </>
      ) : null}
      {name === 'chev' ? <path d="M6 9l6 6 6-6" {...p} /> : null}
      {name === 'check' ? <path d="M5 12.5l4.5 4.5L19 7.5" {...p} /> : null}
      {name === 'arrow' ? <path d="M5 12h14M13 6l6 6-6 6" {...p} /> : null}
    </svg>
  );
};

// App-style surfaces
export const card: React.CSSProperties = {
  position: 'absolute',
  background: C.surface,
  borderRadius: 22,
  border: `1px solid ${C.selection}`,
  boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
};
