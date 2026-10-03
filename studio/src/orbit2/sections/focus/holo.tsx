// Shared CSS-3D kit for stations 4–6 (focus, fit, nextproof): glass holograms that spring into 3D, in-scene titles and
// short captions. Everything is a Card3D (fades/opacity live on cards, never on groups). Frame-driven only.
import React from 'react';
import {C, FONT, MONO} from '../../brand';
import {Card3D, Group3D} from '../../engine/space';
import type {V3} from '../../engine/math';
import {clamp, ease, mix, prog, rgba, sp} from './kit';

type Edge = 'left' | 'right' | 'top' | 'bottom';

/** Navy glass body: sheen, 1 px line, 12 px radius, 2 px accent edge light, faint inner glow, slow scanline shimmer. */
export const Glass: React.FC<{
  f: number;
  w: number;
  h?: number;
  accent: string;
  edge?: Edge;
  pad?: string | number;
  glow?: number; // 0..1 extra accent glow (beats)
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({f, w, h, accent, edge = 'left', pad = '30px 36px', glow = 0, children, style}) => {
  const vertical = edge === 'left' || edge === 'right';
  const band = ((f * 3.1) % (w + 900)) - 450; // shimmer band x
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        boxSizing: 'border-box',
        padding: pad,
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(142deg, rgba(70,104,200,0.34) 0%, rgba(12,28,88,0.80) 30%, rgba(10,23,76,0.84) 100%)`,
        boxShadow: `inset 0 0 ${40 + 30 * glow}px ${rgba(accent, 0.07 + 0.1 * glow)}, inset 0 1px 0 rgba(255,255,255,0.09), 0 0 ${18 + 40 * glow}px ${rgba(accent, 0.1 + 0.25 * glow)}, 0 30px 90px rgba(2,6,32,0.5)`,
        overflow: 'hidden',
        fontFamily: FONT,
        color: C.ink,
        ...style,
      }}
    >
      {/* scanlines (slow drift) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(180deg, rgba(190,212,255,0.035) 0px, rgba(190,212,255,0.035) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)',
          backgroundPosition: `0 ${(f * 0.4) % 4}px`,
          pointerEvents: 'none',
        }}
      />
      {/* diagonal shimmer band */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          bottom: -40,
          left: band,
          width: 260,
          transform: 'skewX(-24deg)',
          background: 'linear-gradient(90deg, rgba(220,232,255,0) 0%, rgba(220,232,255,0.05) 50%, rgba(220,232,255,0) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* accent edge light */}
      <div
        style={{
          position: 'absolute',
          ...(vertical ? {top: 16, bottom: 16, width: 2, [edge]: 0} : {left: 18, right: 18, height: 2, [edge]: 0}),
          background: accent,
          boxShadow: `0 0 10px ${accent}, 0 0 26px ${rgba(accent, 0.7)}`,
          opacity: 0.9,
        }}
      />
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};

/**
 * A hologram arriving in 3D: springs in on Y rotation + a Z push (damping ~15), optional swing-out at `out`.
 * `p`/`r` are the resting pose (local coords; r in degrees).
 */
export const Holo: React.FC<{
  f: number;
  at: number;
  p: V3;
  r?: V3;
  w?: number;
  h?: number;
  swing?: number;
  push?: number;
  out?: number;
  outSwing?: number;
  damping?: number;
  children: React.ReactNode;
}> = ({f, at, p, r = [0, 0, 0], w, h, swing = -38, push = 520, out, outSwing = 50, damping = 15, children}) => {
  const s = sp(f, at, {damping, stiffness: 120, mass: 1});
  if (s <= 0.002) return null;
  const o = out === undefined ? 0 : ease.cubicIn(prog(f, out, out + 26));
  if (o >= 0.999) return null;
  const k = 1 - s;
  return (
    <Group3D p={[p[0], p[1] + o * 80, p[2] - k * push - o * 500]} r={[r[0] + k * 6, r[1] + k * swing + o * outSwing, r[2]]}>
      <Card3D w={w} h={h} opacity={clamp(s * 1.7) * (1 - o)}>
        {children}
      </Card3D>
    </Group3D>
  );
};

/** Row reveal inside a hologram: expo-out slide + fade on a beat. */
export const rowIn = (f: number, at: number, dx = 34): React.CSSProperties => {
  const p = ease.expoOut(prog(f, at, at + 20));
  return {opacity: p, transform: `translateX(${(1 - p) * dx}px)`};
};

/** The station title, set big in the scene: "0N / 10" (mono), the name (Space Grotesk 700), the promise line. */
export const Title3D: React.FC<{
  f: number;
  p: V3;
  r?: V3;
  index: number;
  name: string;
  promise: string;
  accent: string;
  from?: number;
  out?: number;
  size?: number;
  w?: number;
  align?: 'left' | 'center';
  order?: 'XYZ' | 'YXZ';
}> = ({f, p, r = [0, 0, 0], index, name, promise, accent, from = -10, out = 120, size = 150, w = 1300, align = 'left', order}) => {
  const o = ease.cubicIn(prog(f, out, out + 22));
  if (f < from - 2 || o >= 0.999) return null;
  const idx = ease.expoOut(prog(f, from, from + 22));
  const prom = ease.expoOut(prog(f, from + 26, from + 50));
  const line = ease.expoOut(prog(f, from + 6, from + 40));
  return (
    <Group3D p={[p[0], p[1] + o * 60, p[2] - o * 240]} r={r} order={order}>
      <Card3D w={w} opacity={1 - o} style={{textAlign: align}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: 20, opacity: idx, transform: `translateX(${(1 - idx) * -30}px)`}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: size * 0.2, letterSpacing: '0.3em', color: accent, textShadow: `0 0 18px ${rgba(accent, 0.6)}`}}>
            {String(index).padStart(2, '0')} / 10
          </div>
          <div style={{width: 130 * line, height: 2, background: rgba(accent, 0.8), boxShadow: `0 0 10px ${accent}`}} />
        </div>
        <div style={{marginTop: size * 0.1, fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1, letterSpacing: '-0.035em', color: C.ink, whiteSpace: 'pre', textShadow: `0 0 40px ${rgba(accent, 0.25)}`}}>
          {name.split('').map((ch, i) => {
            const q = ease.expoOut(prog(f, from + 3 + i * 2.2, from + 30 + i * 2.2));
            return (
              <span key={i} style={{display: 'inline-block', opacity: q, transform: `translateY(${(1 - q) * size * 0.35}px)`}}>
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{marginTop: size * 0.16, fontFamily: FONT, fontWeight: 500, fontSize: Math.max(34, size * 0.26), color: C.muted, opacity: prom, transform: `translateY(${(1 - prom) * 16}px)`}}>
          {promise}
        </div>
      </Card3D>
    </Group3D>
  );
};

/** A short in-scene caption (1–3 words) that confirms what the camera just showed. */
export const Caption3D: React.FC<{f: number; at: number; out?: number; p: V3; r?: V3; text: string; sub?: string; color: string; size?: number; billboard?: boolean}> = ({
  f,
  at,
  out = 1e9,
  p,
  r,
  text,
  sub,
  color,
  size = 64,
  billboard,
}) => {
  const a = ease.expoOut(prog(f, at, at + 18)) * (1 - ease.cubicIn(prog(f, out, out + 16)));
  if (a <= 0.003) return null;
  return (
    <Card3D p={p} r={r} billboard={billboard} w={1400} opacity={a} style={{textAlign: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: size, letterSpacing: '-0.02em', color, textShadow: `0 0 26px ${rgba(color, 0.55)}`, transform: `translateY(${(1 - a) * 18}px) scale(${mix(0.94, 1, a)})`}}>
        {text}
      </div>
      {sub ? <div style={{marginTop: 10, fontFamily: FONT, fontWeight: 500, fontSize: size * 0.5, color: C.muted}}>{sub}</div> : null}
    </Card3D>
  );
};

export const HoloHeader: React.FC<{label: string; title: string; accent: string; size?: number}> = ({label, title, accent, size = 52}) => (
  <>
    <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: '0.16em', color: accent}}>{label}</div>
    <div style={{fontFamily: FONT, fontSize: size, fontWeight: 700, marginTop: 10, letterSpacing: '-0.015em'}}>{title}</div>
  </>
);
