// 3D kit for stations 9 and 10 (same builder owns both folders): glass holograms, in-scene titles, captions.
import React from 'react';
import type {V3} from '../../engine/math';
import {Card3D, useWorldFrame} from '../../engine/space';
import {C, FONT, MONO} from '../../brand';
import {EXPO, EXPO_IN, lerp, pop, rgba} from './kit';

/** Spring for hologram arrivals (damping 16 per the brief). */
export const arrive = (f: number, at: number) => pop(f, at, 16, 130, 0.9);

/** Glass body: navy glass, top-left sheen, 1 px line border, 2 px accent edge light, slow diagonal shimmer, scanlines. */
export const HoloBody: React.FC<{
  f: number;
  w: number;
  h: number;
  accent: string;
  edge?: 'left' | 'top' | 'right';
  radius?: number;
  glow?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({f, w, h, accent, edge = 'left', radius = 12, glow = 1, style, children}) => {
  const sx = ((f * 0.45) % 260) - 80; // shimmer band position (%), slow
  const edgeStyle: React.CSSProperties =
    edge === 'left' ? {left: 0, top: 10, bottom: 10, width: 2} : edge === 'right' ? {right: 0, top: 10, bottom: 10, width: 2} : {left: 10, right: 10, top: 0, height: 2};
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        boxSizing: 'border-box',
        borderRadius: radius,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(135deg, rgba(70,110,215,0.34) 0%, rgba(14,32,96,0.82) 26%, rgba(10,24,80,0.86) 70%, rgba(9,20,70,0.9) 100%)`,
        boxShadow: `0 0 0 1px ${rgba(accent, 0.1)}, inset 0 0 46px ${rgba(accent, 0.1 * glow)}, 0 0 80px ${rgba(accent, 0.2 * glow)}, 0 40px 90px rgba(2,6,30,0.5)`,
        overflow: 'hidden',
        fontFamily: FONT,
        color: C.ink,
        ...style,
      }}
    >
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${sx - 14}%, rgba(200,225,255,0.055) ${sx}%, transparent ${sx + 14}%)`}} />
      <div style={{position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(180deg, rgba(190,215,255,0.03) 0px, rgba(190,215,255,0.03) 1px, transparent 1px, transparent 4px)'}} />
      <div style={{position: 'absolute', ...edgeStyle, background: accent, boxShadow: `0 0 12px 2px ${rgba(accent, 0.75)}, 0 0 34px 6px ${rgba(accent, 0.3)}`}} />
      {children}
    </div>
  );
};

/** A glass hologram placed in 3D: springs in on Y-rotation + Z push at `at`, swings away at `out`. */
export const Holo: React.FC<{
  at: number;
  out?: number;
  p: V3;
  r?: V3;
  w: number;
  h: number;
  accent: string;
  swing?: number;
  push?: number;
  edge?: 'left' | 'top' | 'right';
  glow?: number;
  radius?: number;
  bodyStyle?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({at, out = 1e9, p, r = [0, 0, 0], w, h, accent, swing = -62, push = 420, edge, glow, radius, bodyStyle, children}) => {
  const f = useWorldFrame();
  if (f < at) return null;
  const s = arrive(f, at);
  const o = lerp(f, out, out + 20, 0, 1, EXPO_IN);
  if (o >= 1) return null;
  const k = 1 - s;
  return (
    <Card3D p={[p[0] + o * 80 * Math.sign(swing), p[1], p[2] - k * push - o * 500]} r={[r[0] + k * 6, r[1] + k * swing - o * swing * 0.9, r[2]]} w={w} h={h} opacity={Math.min(1, s * 1.8) * (1 - o)}>
      <HoloBody f={f} w={w} h={h} accent={accent} edge={edge} glow={glow} radius={radius} style={bodyStyle}>
        {children}
      </HoloBody>
    </Card3D>
  );
};

/** In-scene world title: "0N / 10" (mono) + name (Space Grotesk 700, letters spring up) + promise line. */
export const TitleBlock: React.FC<{f: number; at: number; index: number; name: string; promise: string; accent: string; size?: number; lines?: string[]}> = ({
  f,
  at,
  index,
  name,
  promise,
  accent,
  size = 120,
  lines,
}) => {
  const rows = lines ?? [name];
  let n = 0;
  return (
    <div style={{whiteSpace: 'nowrap'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20, fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: '0.26em', color: accent, opacity: lerp(f, at, at + 12)}}>
        <span>{String(index).padStart(2, '0')} / 10</span>
        <span style={{width: 180 * lerp(f, at + 2, at + 34), height: 3, background: accent, boxShadow: `0 0 12px ${rgba(accent, 0.8)}`}} />
      </div>
      {rows.map((row, ri) => (
        <div key={ri} style={{display: 'flex', overflow: 'hidden', marginTop: ri ? -size * 0.04 : 10, paddingBottom: size * 0.1}}>
          {[...row].map((ch, i) => {
            const s = pop(f, at + 2 + (n++) * 1.4, 15, 160, 0.8);
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'pre',
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: size,
                  lineHeight: 1,
                  letterSpacing: '-0.035em',
                  color: C.ink,
                  textShadow: `0 0 40px ${rgba(accent, 0.45)}`,
                  translate: `0px ${(1 - s) * size * 1.05}px`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      ))}
      <div style={{fontFamily: FONT, fontWeight: 500, fontSize: size * 0.34, color: C.muted, marginTop: 6, opacity: lerp(f, at + 16, at + 34), translate: `${lerp(f, at + 16, at + 40, 26, 0)}px 0px`}}>{promise}</div>
    </div>
  );
};

/** Short in-scene caption that rises in and fades out. */
export const Caption: React.FC<{f: number; at: number; out: number; size?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({f, at, out, size = 54, children, style}) => {
  const o = lerp(f, at, at + 16) * (1 - lerp(f, out, out + 14, 0, 1, EXPO_IN));
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        whiteSpace: 'nowrap',
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: '-0.02em',
        color: C.ink,
        opacity: o,
        translate: `0px ${lerp(f, at, at + 24, 26, 0, EXPO)}px`,
        textShadow: '0 4px 30px rgba(2,6,30,0.9)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** "Sample data" chip, sized for 3D reading. */
export const Sample: React.FC<{size?: number; style?: React.CSSProperties}> = ({size = 17, style}) => (
  <span
    style={{
      fontFamily: MONO,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: C.soft,
      padding: `${size * 0.32}px ${size * 0.62}px`,
      borderRadius: 7,
      border: `1.5px dashed ${C.line}`,
      whiteSpace: 'nowrap',
      background: 'rgba(7,18,83,0.5)',
      ...style,
    }}
  >
    Sample data
  </span>
);
