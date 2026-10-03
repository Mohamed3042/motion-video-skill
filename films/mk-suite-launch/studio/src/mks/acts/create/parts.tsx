// Act-local building blocks: precise window framing, a held keycap, the UI's pen icon, light sweeps.
import React from 'react';
import {C, FONT} from '../../brand';
import {At, Screen, clamp, ease, lerp, prog, toPx, type Rect} from '../../kit';
import type {ScreenId} from '../../screens';

// ── Window framing ───────────────────────────────────────────────────────────────────────────────
// Shot: the source point (fx, fy) of the screen lands at frame centre + (ox, oy); m = output px per 1× source px.
// Rotations pivot on the window centre. (The kit's <At> keeps the default transform-origin 50% 50%, which with its
// trailing translate(-50%,-50%) pivots rotations on the bottom-right corner — we override it with '0 0'.)
export type Shot = {m: number; fx: number; fy: number; ox?: number; oy?: number; z?: number; rx?: number; ry?: number; rz?: number; o?: number};

export const Win: React.FC<{
  id: ScreenId;
  crop: Rect;
  shot: Shot;
  rim?: number;
  shadow?: number;
  filter?: string;
  children?: (px: (r: Rect) => Rect, m: number) => React.ReactNode;
}> = ({id, crop, shot, rim = 0.4, shadow = 1, filter, children}) => {
  const {m, fx, fy, ox = 0, oy = 0, z = 0, rx = 0, ry = 0, rz = 0, o = 1} = shot;
  if (o <= 0.001) return null;
  const width = crop.w * m;
  const x = (crop.x + crop.w / 2 - fx) * m + ox;
  const y = (crop.y + crop.h / 2 - fy) * m + oy;
  const px = (r: Rect) => toPx(r, width, crop);
  return (
    <At x={x} y={y} z={z} rx={rx} ry={ry} rz={rz} o={o} style={{transformOrigin: '0 0'}}>
      <Screen id={id} width={width} rect={crop} rim={rim} shadow={shadow} style={filter ? {filter} : undefined}>
        {children?.(px, m)}
      </Screen>
    </At>
  );
};

// Interpolate two shots (t 0..1, already eased).
export const mix = (a: Shot, b: Shot, t: number): Shot => {
  const k = (n?: number, q?: number) => lerp(n ?? 0, q ?? 0, t);
  return {m: k(a.m, b.m), fx: k(a.fx, b.fx), fy: k(a.fy, b.fy), ox: k(a.ox, b.ox), oy: k(a.oy, b.oy), z: k(a.z, b.z), rx: k(a.rx, b.rx), ry: k(a.ry, b.ry), rz: k(a.rz, b.rz), o: lerp(a.o ?? 1, b.o ?? 1, t)};
};

// Shot track: keys [frame, shot, ease?] — ease applies to the segment arriving at the key (like kit kf).
export const track = (f: number, keys: Array<[number, Shot, ((t: number) => number)?]>): Shot => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, s1, e] = keys[i];
    if (f <= f1) {
      const [f0, s0] = keys[i - 1];
      return mix(s0, s1, (e ?? ease.inOut)((f - f0) / (f1 - f0)));
    }
  }
  return keys[keys.length - 1][1];
};

// ── Light sweep: a soft diagonal band of light crossing a rect (output px), screen-blended ─────────
export const Sweep: React.FC<{r: Rect; p: number; strength?: number; radius?: number; angle?: number}> = ({r, p, strength = 0.22, radius = 0, angle = 18}) => {
  if (p <= 0 || p >= 1) return null;
  const band = Math.max(r.w, r.h) * 0.42;
  const x = lerp(-band * 1.4, r.w + band * 0.4, ease.inOut(p));
  return (
    <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden', borderRadius: radius, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: -r.h * 0.5,
          width: band,
          height: r.h * 2,
          transform: `skewX(${-angle}deg)`,
          background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(235,255,244,${strength}) 50%, rgba(255,255,255,0) 100%)`,
        }}
      />
    </div>
  );
};

// ── Keycap that can be held (kit Keycap is momentary; a chord needs Ctrl to stay down under K) ─────
export const Key3D: React.FC<{f: number; label: string; press: number; release?: number; width?: number; size?: number}> = ({f, label, press, release, width = 220, size = 1}) => {
  const t = f - press;
  let down: number;
  if (release === undefined) down = t >= -3 && t < 10 ? 1 - Math.abs(t - 1) / 9 : 0;
  else down = Math.min(prog(f, press - 3, press + 1), 1 - prog(f, release, release + 7));
  down = clamp(down);
  const lit = t >= 0 ? (release !== undefined && f < release ? 1 : Math.max(0, 1 - (f - (release ?? press)) / 40)) : 0;
  const h = 200 * size;
  const depth = 26 * size * (1 - 0.75 * down);
  return (
    <div style={{position: 'relative', width: width * size, height: h + 26 * size}}>
      <div style={{position: 'absolute', left: 0, top: 26 * size, width: width * size, height: h, borderRadius: 34 * size, background: '#050606', boxShadow: `0 ${30 + 10 * down}px 60px rgba(0,0,0,0.7)`}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 26 * size - depth,
          width: width * size,
          height: h,
          borderRadius: 34 * size,
          background: 'linear-gradient(180deg, #2B2E2D 0%, #1A1C1B 55%, #121413 100%)',
          boxShadow: [
            'inset 0 2px 0 rgba(255,255,255,0.14)',
            'inset 0 -6px 14px rgba(0,0,0,0.6)',
            lit > 0 ? `0 0 ${60 * size}px rgba(30,215,96,${0.55 * lit})` : '0 0 0 rgba(0,0,0,0)',
            `0 0 0 ${1.5 * size}px ${lit > 0 ? `rgba(30,215,96,${0.3 + 0.6 * lit})` : '#2E302F'}`,
          ].join(', '),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 70 * size,
          color: lit > 0 ? `rgb(${lerp(255, 30, lit * 0.6)},${lerp(255, 215, lit * 0.6)},${lerp(255, 96, lit * 0.6)})` : '#F2F2F2',
          letterSpacing: -1,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ── The UI's Create icon: an outlined pencil (from the website entry, 21), drawn on with `draw` 0..1 ─
// Axis from the tip (10,54) to the cap (54,10); half-width 7; ferrule line 10 px below the cap.
export const PenIcon: React.FC<{size?: number; draw?: number; glow?: number}> = ({size = 170, draw = 1, glow = 1}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{overflow: 'visible', filter: `drop-shadow(0 0 ${14 * glow}px rgba(30,215,96,${0.55 * glow}))`}}>
    <path
      d="M10 54 L24.85 49.05 L54.55 19.35 A7 7 0 0 0 44.65 9.45 L14.95 39.15 Z"
      fill="none"
      stroke={C.green}
      strokeWidth={4.4}
      strokeLinejoin="round"
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - draw}
    />
    <path d="M47.45 26.45 L37.55 16.55" fill="none" stroke={C.green} strokeWidth={4.4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp(draw * 1.6 - 0.6)} />
  </svg>
);
