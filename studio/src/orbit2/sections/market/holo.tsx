// Glass-hologram kit for stations 7 (My market) and 8 (Employers) — same builder owns both folders.
// Everything here is CSS-3D (Card3D/Group3D) in the station's LOCAL coords and driven by useWorldFrame().
import React from 'react';
import {spring} from 'remotion';
import {C, FONT, MONO} from '../../brand';
import {Card3D, Group3D, useWorldFrame} from '../../engine/space';
import {clamp, mulberry32, oneToOne, type Shot, type V3} from '../../engine/math';
import {EXPO, EXPO_IN, lerp, rgba} from './kit';

export const spr = (f: number, at: number, damping = 15, stiffness = 120, mass = 0.9) =>
  f < at ? 0 : spring({frame: f - at, fps: 60, config: {damping, stiffness, mass}});

// ---------- camera-relative placement (so a hologram can sit pixel-exact in front of a known shot) ----------
type Basis = {pos: V3; fwd: V3; right: V3; up: V3; P: number};
export const basis = (s: Shot): Basis => {
  const d: V3 = [s.target[0] - s.pos[0], s.target[1] - s.pos[1], s.target[2] - s.pos[2]];
  const l = Math.hypot(...d);
  const fwd: V3 = [d[0] / l, d[1] / l, d[2] / l];
  const rx = -fwd[2];
  const rz = fwd[0];
  const rl = Math.hypot(rx, rz) || 1;
  const right: V3 = [rx / rl, 0, rz / rl];
  const up: V3 = [right[1] * fwd[2] - right[2] * fwd[1], right[2] * fwd[0] - right[0] * fwd[2], right[0] * fwd[1] - right[1] * fwd[0]];
  return {pos: s.pos, fwd, right, up, P: oneToOne(s.fov ?? 40)};
};
/** 3D point that projects to screen px (sx, sy) at distance `dist` along the view axis of shot `s`. */
export const anchor = (s: Shot, sx: number, sy: number, dist?: number): V3 => {
  const b = basis(s);
  const d = dist ?? b.P;
  const k = d / b.P;
  return [0, 1, 2].map((i) => b.pos[i] + b.fwd[i] * d + b.right[i] * (sx - 960) * k + b.up[i] * (540 - sy) * k) as V3;
};
/** Euler (order 'YXZ', degrees) that turns a card square to the image plane of shot `s`. */
export const faceShot = (s: Shot): V3 => {
  const b = basis(s);
  const n: V3 = [-b.fwd[0], -b.fwd[1], -b.fwd[2]];
  return [(-Math.asin(clamp(n[1], -1, 1)) * 180) / Math.PI, (Math.atan2(n[0], n[2]) * 180) / Math.PI, 0];
};

// ---------- glass body ----------
export const glass = (accent: string, a = 0.8): React.CSSProperties => ({
  borderRadius: 12,
  border: `1px solid ${C.line}`,
  background: `linear-gradient(135deg, rgba(160,190,255,0.10) 0%, rgba(160,190,255,0.03) 26%, rgba(160,190,255,0) 48%), ${rgba(C.panel, a)}`,
  boxShadow: `inset 0 0 46px ${rgba(accent, 0.1)}, inset 0 1px 0 rgba(255,255,255,0.06), 0 0 70px ${rgba(accent, 0.16)}, 0 30px 80px rgba(2,6,30,0.45)`,
  overflow: 'hidden',
  boxSizing: 'border-box',
  fontFamily: FONT,
  color: C.ink,
});

/** Edge light + slow diagonal shimmer + faint scanlines. Put it first inside a glass card. */
export const GlassFx: React.FC<{accent: string; w: number; edge?: 'left' | 'top' | 'right'; seed?: number; flash?: number}> = ({accent, w, edge = 'left', seed = 0, flash = 0}) => {
  const f = useWorldFrame();
  const period = 260;
  const ph = (((f + seed * 97) % period) + period) % period;
  const x = -0.6 * w + (ph / period) * 2.2 * w;
  const bar: React.CSSProperties =
    edge === 'top'
      ? {left: 14, right: 14, top: 0, height: 2}
      : edge === 'right'
        ? {right: 0, top: 14, bottom: 14, width: 2}
        : {left: 0, top: 14, bottom: 14, width: 2};
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(200,215,255,0.035) 0px, rgba(200,215,255,0.035) 1px, transparent 1px, transparent 4px)'}} />
      <div style={{position: 'absolute', top: -40, bottom: -40, left: x, width: w * 0.32, transform: 'skewX(-24deg)', background: 'linear-gradient(90deg, rgba(220,230,255,0) 0%, rgba(220,230,255,0.05) 50%, rgba(220,230,255,0) 100%)'}} />
      <div style={{position: 'absolute', ...bar, background: accent, boxShadow: `0 0 ${12 + 26 * flash}px ${rgba(accent, 0.9)}, 0 0 4px ${accent}`}} />
      {flash > 0.01 ? <div style={{position: 'absolute', inset: 0, borderRadius: 12, boxShadow: `inset 0 0 0 2px ${rgba(accent, 0.8 * flash)}, inset 0 0 80px ${rgba(accent, 0.25 * flash)}`}} /> : null}
    </>
  );
};

/**
 * A glass hologram: springs in on Y-rotation + Z push (damping 15), leaves the way it came.
 * `p`/`r` = resting pose (r in 'YXZ' order, e.g. from faceShot). Children are absolutely positioned content.
 */
export const Holo: React.FC<{
  p: V3;
  r?: V3;
  w: number;
  h: number;
  accent: string;
  at: number;
  out?: number;
  yawIn?: number;
  push?: number;
  edge?: 'left' | 'top' | 'right';
  seed?: number;
  flash?: number;
  alpha?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({p, r = [0, 0, 0], w, h, accent, at, out, yawIn = 34, push = 340, edge = 'left', seed = 0, flash = 0, alpha = 0.8, style, children}) => {
  const f = useWorldFrame();
  const s = spr(f, at, 15, 120, 0.9);
  const o = out === undefined ? 0 : lerp(f, out, out + 20, 0, 1, EXPO_IN);
  if (s <= 0.002 || o >= 0.999) return null;
  const yaw = (1 - s) * yawIn - o * yawIn * 1.2;
  const z = -(1 - s) * push - o * push * 0.8;
  return (
    <Group3D p={p} r={r} order="YXZ">
      <Group3D p={[0, 0, z]} r={[0, yaw, 0]}>
        <Card3D w={w} h={h} opacity={clamp(s * 1.7) * (1 - o)} style={{...glass(accent, alpha), ...style}}>
          <GlassFx accent={accent} w={w} edge={edge} seed={seed} flash={flash} />
          {children}
        </Card3D>
      </Group3D>
    </Group3D>
  );
};

/** Staggered row reveal (expo-out slide + fade) for content inside a hologram. */
export const Row: React.FC<{at: number; x?: number; y: number; dx?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({at, x = 0, y, dx = -26, style, children}) => {
  const f = useWorldFrame();
  const k = lerp(f, at, at + 22, 0, 1, EXPO);
  if (k <= 0.001) return null;
  return <div style={{position: 'absolute', left: x, top: y, opacity: k, translate: `${(1 - k) * dx}px 0px`, ...style}}>{children}</div>;
};

export const Sample: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <div
    style={{
      position: 'absolute',
      fontFamily: MONO,
      fontWeight: 700,
      fontSize: 16,
      letterSpacing: '0.14em',
      color: C.muted,
      background: rgba(C.raised, 0.9),
      border: `1px solid ${C.line}`,
      borderRadius: 7,
      padding: '6px 11px',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    SAMPLE DATA
  </div>
);

// ---------- big in-scene title: "0N / 10" mono + name (Space Grotesk 700) + promise ----------
export const TitleBlock: React.FC<{f: number; index: number; name: string; promise: string; accent: string; size?: number; at?: number}> = ({f, index, name, promise, accent, size = 150, at = 0}) => {
  const g = f - at;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20, fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: '0.26em', color: accent, opacity: lerp(g, 0, 14)}}>
        <span>{String(index).padStart(2, '0')} / 10</span>
        <span style={{width: 220 * lerp(g, 2, 40), height: 3, background: accent, boxShadow: `0 0 12px ${accent}`}} />
      </div>
      <div style={{display: 'flex', overflow: 'hidden', marginTop: 6, paddingBottom: size * 0.1}}>
        {[...name].map((ch, i) => {
          const s = spr(g, 1 + i * 2, 16, 150, 0.8);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: size,
                lineHeight: 1.02,
                letterSpacing: '-0.04em',
                color: C.ink,
                textShadow: `0 0 40px ${rgba(accent, 0.45)}`,
                translate: `0px ${(1 - s) * size * 1.1}px`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 44, letterSpacing: '-0.01em', color: C.muted, marginTop: 4, opacity: lerp(g, 14, 32), translate: `${lerp(g, 14, 40, 34, 0)}px 0px`}}>{promise}</div>
    </div>
  );
};

// ---------- foreground dust: soft billboard motes (CSS, so they sort correctly in front of holograms) ----------
type Mote = {p: V3; s: number; a: number; ph: number};
const moteCache = new Map<string, Mote[]>();
export const Dust: React.FC<{seed: number; n: number; min: V3; max: V3; accent: string; drift?: V3; size?: [number, number]; far?: number}> = ({
  seed,
  n,
  min,
  max,
  accent,
  drift = [0.25, 0.12, 0.4],
  size = [5, 18],
  far,
}) => {
  const f = useWorldFrame();
  const key = `${seed}:${n}:${min}:${max}`;
  let motes = moteCache.get(key);
  if (!motes) {
    const rnd = mulberry32(seed);
    motes = Array.from({length: n}, () => ({
      p: [0, 1, 2].map((i) => min[i] + rnd() * (max[i] - min[i])) as V3,
      s: size[0] + rnd() ** 2 * (size[1] - size[0]),
      a: 0.35 + rnd() * 0.65,
      ph: rnd() * 6.28,
    }));
    moteCache.set(key, motes);
  }
  return (
    <>
      {motes.map((m, i) => {
        const p: V3 = [m.p[0] + drift[0] * f + 18 * Math.sin(f / 90 + m.ph), m.p[1] + drift[1] * f + 12 * Math.sin(f / 70 + m.ph * 2), m.p[2] + drift[2] * f];
        const tw = 0.7 + 0.3 * Math.sin(f / 23 + m.ph * 3);
        return (
          <Card3D key={i} p={p} billboard w={m.s * 4} h={m.s * 4} near={90} nearFade={520} far={far} opacity={m.a * tw}>
            <div style={{width: '100%', height: '100%', borderRadius: '50%', background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, ${rgba(accent, 0.55)} 14%, ${rgba(accent, 0.12)} 38%, ${rgba(accent, 0)} 66%)`}} />
          </Card3D>
        );
      })}
    </>
  );
};
