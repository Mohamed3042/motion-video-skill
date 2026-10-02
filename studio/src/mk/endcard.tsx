import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT, type Hue} from './brand';
import {CL, EXPO, IN_OUT, LivingBg, ink, lerp, pop, rng, sub, type Theme} from './kit';

type Props = {
  theme: Theme;
  hue: Hue;
  from: number; // scene start (particles begin)
  lock: number; // icon locks (boom)
  tag: number;
  foot: number;
  duration: number;
  icon: (size: number, glow: number) => React.ReactNode;
  title: string;
  tagline: string;
  footer: string;
  fine?: string;
  behind?: React.ReactNode;
};

const N = 640;

// End card: particles swirl in and assemble the icon, it locks (glow pulse + shockwave), rises, type wipes in.
export const EndCard: React.FC<Props> = ({theme, hue, from, lock, tag, foot, duration, icon, title, tagline, footer, fine, behind}) => {
  const f = useCurrentFrame();
  const S = 190;
  const rise = lerp(f, lock + 10, lock + 34, 0, 1, EXPO);
  const cy = 540 - rise * 215;
  const s = pop(f, lock - 3, 11, 200, 0.6);
  const p = interpolate(f, [from, lock], [0, 1], {...CL, easing: IN_OUT});
  const r = rng(4242);
  const dots: React.ReactNode[] = [];
  if (f < lock + 8) {
    for (let i = 0; i < N; i++) {
      const a = r() * Math.PI * 2;
      const rad = 700 + r() * 800;
      const tx = (r() - 0.5) * S * 0.86;
      const ty = (r() - 0.5) * S * 0.86;
      const size = 1.5 + r() * 2.6;
      const swirl = (1 - p) * (1.2 + r() * 0.8);
      const sx = Math.cos(a + swirl) * rad;
      const sy = Math.sin(a + swirl) * rad * 0.62;
      const x = 960 + sx + (tx - sx) * p;
      const y = 540 + sy + (ty - sy) * p;
      const op = interpolate(f, [from, from + 10, lock, lock + 8], [0, 0.95, 0.95, 0], CL);
      dots.push(<circle key={i} cx={x} cy={y} r={size} fill={i % 3 === 0 ? hue.glow : theme === 'dark' ? '#ffffff' : hue.base} opacity={op} />);
    }
  }
  const ring = (delay: number, max: number) => {
    const k = lerp(f, lock + delay, lock + delay + 34, 0, 1, EXPO);
    if (f < lock + delay || k >= 1) return null;
    const R = 60 + k * max;
    return (
      <div
        style={{
          position: 'absolute',
          left: 960 - R,
          top: 540 - R,
          width: R * 2,
          height: R * 2,
          borderRadius: '50%',
          border: `${3 - k * 2}px solid ${hue.glow}`,
          boxShadow: `0 0 30px ${hue.hue}`,
          opacity: 1 - k,
        }}
      />
    );
  };
  const pulse = interpolate(f, [lock - 2, lock + 4, lock + 40], [0, 1, 0.25], CL);
  const wipe = lerp(f, tag - 8, tag + 22, 0, 1, EXPO);
  const fade = interpolate(f, [duration - 40, duration - 1], [0, theme === 'dark' ? 0.55 : 0.22], CL);
  return (
    <AbsoluteFill>
      <LivingBg f={f} theme={theme} hue={hue} spot={0.8} />
      {behind}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 960px ${cy}px, ${hue.hue}${theme === 'dark' ? '55' : '22'} 0%, transparent 32%)`,
          opacity: pulse,
        }}
      />
      {ring(0, 900)}
      {ring(5, 560)}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {dots}
      </svg>
      {f >= lock - 4 ? (
        <div style={{position: 'absolute', left: 960 - S / 2, top: cy - S / 2, width: S, height: S, scale: `${interpolate(s, [0, 1], [0.7, 1])}`, opacity: interpolate(s, [0, 0.3], [0, 1], CL)}}>
          {icon(S, 0.35 + pulse * 0.9)}
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 455,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 150,
          letterSpacing: '-0.05em',
          lineHeight: 1.05,
          color: ink(theme),
          clipPath: `inset(0px ${(1 - wipe) * 50}% 0px ${(1 - wipe) * 50}%)`,
          translate: `0px ${(1 - wipe) * 30}px`,
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 640,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 42,
          letterSpacing: '-0.02em',
          color: sub(theme),
          opacity: lerp(f, tag + 10, tag + 30),
          translate: `0px ${lerp(f, tag + 10, tag + 34, 24, 0)}px`,
        }}
      >
        {tagline}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 742, display: 'flex', justifyContent: 'center', opacity: lerp(f, foot, foot + 20), translate: `0px ${lerp(f, foot, foot + 24, 18, 0)}px`}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: ink(theme),
            padding: '14px 26px',
            borderRadius: 999,
            border: `1px solid ${theme === 'dark' ? C.nightLine : C.line}`,
            background: theme === 'dark' ? 'rgba(32,34,39,0.7)' : C.surface,
          }}
        >
          {footer}
        </div>
      </div>
      {fine ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 850,
            textAlign: 'center',
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: 22,
            color: sub(theme),
            opacity: lerp(f, foot + 14, foot + 34) * 0.8,
          }}
        >
          {fine}
        </div>
      ) : null}
      <AbsoluteFill style={{background: theme === 'dark' ? C.nightDeep : C.paper, opacity: fade}} />
    </AbsoluteFill>
  );
};
