import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {noise2D} from '@remotion/noise';
import {C, FONT, MONO, type Hue} from './brand';

// Real motion blur for fast moves only (5 samples); children must read useCurrentFrame() themselves.
export const Blur: React.FC<{on: boolean; children: React.ReactNode}> = ({on, children}) =>
  on ? (
    <CameraMotionBlur samples={5} shutterAngle={180}>
      {children}
    </CameraMotionBlur>
  ) : (
    <AbsoluteFill>{children}</AbsoluteFill>
  );

// ---------- timing helpers (all driven by the frame number) ----------
export const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EXPO_IN = Easing.bezier(0.7, 0, 0.84, 0);

export const lerp = (f: number, a: number, b: number, from = 0, to = 1, easing: (t: number) => number = EXPO) =>
  interpolate(f, [a, b], [from, to], {...CL, easing});

export const pop = (f: number, at: number, damping = 13, stiffness = 170, mass = 0.7) =>
  spring({frame: f - at, fps: 60, config: {damping, stiffness, mass}});

export const soft = (f: number, at: number) => spring({frame: f - at, fps: 60, config: {damping: 200, stiffness: 120, mass: 0.8}});

// seeded PRNG (mulberry32) - never Math.random
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type Theme = 'dark' | 'light';
export const ink = (t: Theme) => (t === 'dark' ? C.nightInk : C.ink);
export const sub = (t: Theme) => (t === 'dark' ? C.nightSub : C.sub);

// ---------- living background ----------
export const LivingBg: React.FC<{f: number; theme: Theme; hue: Hue; spot?: number}> = ({f, theme, hue, spot = 1}) => {
  const dx = Math.sin(f / 97) * 260 + Math.sin(f / 41) * 60;
  const dy = Math.cos(f / 83) * 140 + Math.sin(f / 57) * 40;
  if (theme === 'light') {
    return (
      <AbsoluteFill style={{background: `radial-gradient(120% 95% at 50% 42%, #ffffff 0%, ${C.paper} 52%, ${C.rail} 100%)`}}>
        <div
          style={{
            position: 'absolute',
            left: 960 - 900,
            top: 540 - 900,
            width: 1800,
            height: 1800,
            translate: `${dx}px ${dy}px`,
            opacity: 0.16 * spot,
            background: `radial-gradient(circle, ${hue.hue} 0%, transparent 58%)`,
          }}
        />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{background: `radial-gradient(115% 100% at 50% 50%, ${hue.deep} 0%, ${C.nightDeep} 78%)`}}>
      <div
        style={{
          position: 'absolute',
          left: 960 - 850,
          top: 540 - 850,
          width: 1700,
          height: 1700,
          translate: `${dx}px ${dy}px`,
          opacity: 0.55 * spot,
          background: `radial-gradient(circle, ${hue.base} 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 960 - 500,
          top: 540 - 500,
          width: 1000,
          height: 1000,
          translate: `${-dx * 0.7}px ${-dy * 0.6}px`,
          opacity: 0.1 * spot,
          background: 'radial-gradient(circle, #ffffff 0%, transparent 60%)',
        }}
      />
    </AbsoluteFill>
  );
};

// faint UI grid that drifts (one element, translated)
export const DotGrid: React.FC<{f: number; theme: Theme; opacity?: number; speed?: number}> = ({f, theme, opacity = 1, speed = 0.25}) => (
  <AbsoluteFill style={{overflow: 'hidden', opacity}}>
    <div
      style={{
        position: 'absolute',
        left: -60,
        top: -60,
        width: 2040,
        height: 1200,
        translate: `${-((f * speed) % 60)}px 0px`,
        backgroundImage: `radial-gradient(circle, ${theme === 'dark' ? 'rgba(255,255,255,0.10)' : 'rgba(16,19,25,0.10)'} 1.4px, transparent 1.6px)`,
        backgroundSize: '60px 60px',
      }}
    />
  </AbsoluteFill>
);

// ---------- type ----------
export const Kicker: React.FC<{children: React.ReactNode; color: string; dot: string; style?: React.CSSProperties}> = ({children, color, dot, style}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT, fontWeight: 600, fontSize: 22, letterSpacing: '0.16em', textTransform: 'uppercase', color, ...style}}>
    <span style={{width: 10, height: 10, borderRadius: 5, background: dot, boxShadow: `0 0 14px ${dot}`}} />
    {children}
  </div>
);

// Letters spring up one by one with a skew; optional chromatic split that settles and glitches once.
export const SlamWord: React.FC<{
  f: number;
  text: string;
  at: number;
  size: number;
  color: string;
  weight?: number;
  stagger?: number;
  split?: [string, string];
  glitchAt?: number;
  sweepAt?: number;
  tracking?: string;
  accentLast?: string;
}> = ({f, text, at, size, color, weight = 800, stagger = 3, split, glitchAt, sweepAt, tracking = '-0.045em', accentLast}) => {
  const letters = [...text];
  const g = glitchAt !== undefined && f >= glitchAt && f < glitchAt + 4 ? 1 : 0;
  const settle = lerp(f, at, at + 26, 1, 0);
  const off = settle * 10 + g * 9;
  const row = (c: string, dx: number, blend?: React.CSSProperties['mixBlendMode'], opacity = 1) => (
    <div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', translate: `${dx}px 0px`, mixBlendMode: blend, opacity}}>
      {letters.map((ch, i) => {
        const s = pop(f, at + i * stagger, 12, 190, 0.6);
        const last = accentLast && i === letters.length - 1;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              color: last ? accentLast : c,
              opacity: interpolate(s, [0, 0.25], [0, 1], CL),
              transform: `translateY(${(1 - s) * size * 0.55}px) scale(${interpolate(s, [0, 1], [1.25, 1])}) skewX(${(1 - s) * -14}deg)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
  return (
    <div style={{position: 'relative', height: size * 1.12, fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.08, letterSpacing: tracking}}>
      <div style={{visibility: 'hidden', whiteSpace: 'pre'}}>{text}</div>
      {split && off > 0.05 ? row(split[0], -off, 'screen', 0.9) : null}
      {split && off > 0.05 ? row(split[1], off, 'screen', 0.9) : null}
      {row(color, 0)}
      {sweepAt !== undefined ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            whiteSpace: 'pre',
            color: 'transparent',
            backgroundImage: 'linear-gradient(100deg, transparent 42%, rgba(255,255,255,0.95) 50%, transparent 58%)',
            backgroundSize: '300% 100%',
            backgroundPositionX: `${lerp(f, sweepAt, sweepAt + 40, 100, 0, IN_OUT)}%`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            opacity: f > sweepAt && f < sweepAt + 42 ? 1 : 0,
          }}
        >
          {text}
        </div>
      ) : null}
    </div>
  );
};

// Kinetic word: springs in with stacked outline echoes above/below; the period takes the accent colour.
export const KineticWord: React.FC<{f: number; text: string; at: number; out: number; color: string; accent: string; size?: number}> = ({
  f,
  text,
  at,
  out,
  color,
  accent,
  size = 230,
}) => {
  if (f < at - 2 || f > out + 2) return null;
  const s = pop(f, at, 11, 220, 0.6);
  const leave = lerp(f, out - 6, out, 0, 1, EXPO_IN);
  const word = (
    <>
      {text}
      <span style={{color: accent}}>.</span>
    </>
  );
  const echo = (k: number) => (
    <div
      key={k}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        top: 0,
        translate: `0px ${k * size * 0.78 * s}px`,
        opacity: (0.4 - Math.abs(k) * 0.13) * s * (1 - leave),
        color: 'transparent',
        WebkitTextStroke: `2px ${color}`,
      }}
    >
      {text}.
    </div>
  );
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          position: 'relative',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: '-0.05em',
          lineHeight: 1,
          width: 1700,
          scale: `${interpolate(s, [0, 1], [1.6, 1]) * (1 + leave * 0.3)}`,
          translate: `0px ${(1 - s) * 60}px`,
          opacity: interpolate(s, [0, 0.2], [0, 1], CL) * (1 - leave),
        }}
      >
        {[-2, -1, 1, 2].map(echo)}
        <div style={{position: 'relative', textAlign: 'center', color}}>{word}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- UI pieces ----------
export const Panel: React.FC<{
  theme: Theme;
  title: string;
  w: number;
  h: number;
  accent: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  right?: React.ReactNode;
}> = ({theme, title, w, h, accent, style, children, right}) => {
  const dark = theme === 'dark';
  return (
    <div
      style={{
        position: 'absolute',
        width: w,
        height: h,
        borderRadius: 22,
        overflow: 'hidden',
        background: dark ? `linear-gradient(180deg, ${C.nightSurface} 0%, #1a1c20 100%)` : C.surface,
        border: `1px solid ${dark ? C.nightLine : C.line}`,
        boxShadow: dark
          ? `0 50px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 90px ${accent}22`
          : '0 30px 70px rgba(35,38,45,0.14), 0 3px 8px rgba(35,38,45,0.06)',
        ...style,
      }}
    >
      <div
        style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '0 26px',
          borderBottom: `1px solid ${dark ? C.nightLine : C.line}`,
          fontFamily: FONT,
          color: dark ? C.nightInk : C.ink,
        }}
      >
        <span style={{fontWeight: 700, fontSize: 22, letterSpacing: '-0.08em'}}>MK</span>
        <span style={{fontWeight: 600, fontSize: 19, letterSpacing: '-0.01em'}}>{title}</span>
        <span style={{marginLeft: 'auto'}}>{right}</span>
      </div>
      <div style={{position: 'relative', width: w, height: h - 61}}>{children}</div>
    </div>
  );
};

export const Chip: React.FC<{theme: Theme; text: string; dot: string; style?: React.CSSProperties; size?: number}> = ({theme, text, dot, style, size = 26}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      padding: `${size * 0.55}px ${size * 1.05}px`,
      borderRadius: 999,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: '-0.01em',
      whiteSpace: 'nowrap',
      color: theme === 'dark' ? C.nightInk : C.ink,
      background: theme === 'dark' ? 'rgba(32,34,39,0.82)' : C.surface,
      border: `1px solid ${theme === 'dark' ? C.nightLine : C.line}`,
      boxShadow: theme === 'dark' ? `0 18px 40px rgba(0,0,0,0.4), 0 0 30px ${dot}22` : '0 13px 30px rgba(35,38,45,0.08), 0 2px 5px rgba(35,38,45,0.04)',
      ...style,
    }}
  >
    <span style={{width: size * 0.42, height: size * 0.42, borderRadius: 99, background: dot, boxShadow: `0 0 12px ${dot}`}} />
    {text}
  </div>
);

export const Mono: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <span style={{fontFamily: MONO, fontWeight: 500, letterSpacing: '0.04em', ...style}}>{children}</span>
);

// Waveform bars (speech-like envelope from smooth noise; one SVG).
export const Bars: React.FC<{
  n: number;
  w: number;
  h: number;
  seed: string;
  t: number;
  color: string;
  amp?: number;
  reveal?: number;
  gap?: number;
  live?: number; // how much the shape breathes over time
  style?: React.CSSProperties;
  color2?: string;
  split?: number; // 0..1: bars left of split use color, right use color2
}> = ({n, w, h, seed, t, color, amp = 1, reveal = 1, gap = 0.38, live = 1, style, color2, split = 1}) => {
  const bw = w / n;
  const rects: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = i / n;
    if (x > reveal) break;
    const env = 0.25 + 0.75 * Math.abs(noise2D(seed + 'e', i * 0.045, 0));
    const v = 0.12 + 0.88 * Math.abs(noise2D(seed, i * 0.21, t * 0.035 * live));
    const edge = Math.min(1, (reveal - x) * n * 0.25);
    const bh = Math.max(3, v * env * h * amp * edge);
    rects.push(
      <rect key={i} x={i * bw + (bw * gap) / 2} y={(h - bh) / 2} width={bw * (1 - gap)} height={bh} rx={Math.min(bw * (1 - gap), bh) / 2} fill={color2 && x > split ? color2 : color} />,
    );
  }
  return (
    <svg width={w} height={h} style={{overflow: 'visible', ...style}}>
      {rects}
    </svg>
  );
};

// Continuous waveform line (sum of sines with a travelling envelope).
export const wavePath = (w: number, h: number, t: number, amp: number, seed: number, pts = 220) => {
  const r = rng(seed);
  const comps = [0, 1, 2, 3].map(() => ({k: 2 + r() * 9, p: r() * 6.28, s: 0.04 + r() * 0.08}));
  let d = '';
  for (let i = 0; i <= pts; i++) {
    const x = i / pts;
    const win = Math.sin(Math.PI * x) ** 1.5;
    let y = 0;
    for (const c of comps) y += Math.sin(x * c.k * 6.283 + c.p + t * c.s * 6.283) / comps.length;
    y *= win * amp * (0.6 + 0.4 * Math.sin(x * 13 + t * 0.05));
    d += `${i === 0 ? 'M' : 'L'}${(x * w).toFixed(1)} ${(h / 2 + y * h * 0.5).toFixed(1)}`;
  }
  return d;
};
