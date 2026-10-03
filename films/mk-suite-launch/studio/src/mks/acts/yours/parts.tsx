// Act-local helpers shared by "Make it yours" and the Finale (both owned by builder D).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../../brand';
import {Crop, WINDOW_RECT, clamp, ease, prog, springAt, Super, type CursorKey, type Rect} from '../../kit';
import type {ScreenId} from '../../screens';

export const P = 2200; // Stage perspective (kit default)
// Camera that centers world point (x, y) at magnification s (output px per world px at z = 0).
export const camAt = (x: number, y: number, s: number, ry = 0, rx = 0) => ({x, y, z: P * (1 - 1 / s), ry, rx});
// World coords of a source point inside a 1586-wide window (WINDOW_RECT) centered on the world origin.
export const wx = (sx: number) => sx - WINDOW_RECT.w / 2;
export const wy = (sy: number) => sy - WINDOW_RECT.h / 2;

// A patch of the same screen redrawn on top of itself (e.g. defocused). `o` = window crop origin.
export const Patch: React.FC<{id: ScreenId; r: Rect; o?: {x: number; y: number}; filter?: string; m?: number; radius?: number; style?: React.CSSProperties}> = ({
  id,
  r,
  o = {x: 0, y: 0},
  filter,
  m = 0,
  radius = 0,
  style,
}) => (
  <div style={{position: 'absolute', left: r.x - o.x, top: r.y - o.y, width: r.w, height: r.h, overflow: 'hidden', borderRadius: radius, ...style}}>
    <div style={{position: 'absolute', left: -m, top: -m, filter}}>
      <Crop id={id} rect={{x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m}} scale={1} />
    </div>
  </div>
);

// Depth-of-field stand-in: a blurred, darker copy of a region (for UI that must not be spotlighted).
export const Defocus: React.FC<{id: ScreenId; r: Rect; o?: {x: number; y: number}; blur?: number; dim?: number; sat?: number; radius?: number; opacity?: number}> = ({
  id,
  r,
  o,
  blur = 5,
  dim = 0.45,
  sat = 1,
  radius = 0,
  opacity = 1,
}) => <Patch id={id} r={r} o={o} m={blur * 3} radius={radius} filter={`blur(${blur}px) brightness(${dim}) saturate(${sat})`} style={{opacity}} />;

// Directional motion blur for whip moves (SVG gaussian along x and/or y). Cheap stand-in for CameraMotionBlur.
export const MoBlur: React.FC<{id: string; bx?: number; by?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({id, bx = 0, by = 0, style, children}) => {
  const on = bx > 0.4 || by > 0.4;
  return (
    <AbsoluteFill style={{filter: on ? `url(#${id})` : undefined, ...style}}>
      {on ? (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};
// Blur std-dev for a track moving `d` px between f-1 and f (180° shutter ≈ half the travel, as a gaussian).
export const blurFor = (track: (f: number) => number, f: number, k = 0.3, max = 70) => Math.min(max, Math.abs(track(f) - track(f - 1)) * k);

// The UI's checkbox (green rounded square + dark tick), measured from 08: 29×29 box, r 4.5, fill rgb(58,234,123).
// Act-local variant of kit <Check>: same pop + draw, but the square shape of the real control.
export const BoxTick: React.FC<{f: number; at: number; r: Rect}> = ({f, at, r}) => {
  if (f < at) return null;
  const s = springAt(f, at, {stiffness: 340, damping: 16});
  const draw = ease.out(prog(f, at + 2, at + 11));
  const ring = prog(f, at, at + 22);
  return (
    <svg viewBox="0 0 29 29" width={r.w} height={r.h} style={{position: 'absolute', left: r.x, top: r.y, overflow: 'visible'}}>
      {ring < 1 ? (
        <rect x={-ring * 12} y={-ring * 12} width={29 + ring * 24} height={29 + ring * 24} rx={4.5 + ring * 8} fill="none" stroke={C.green} strokeWidth={2.2 * (1 - ring)} opacity={1 - ring} />
      ) : null}
      <g transform={`translate(14.5 14.5) scale(${0.35 + 0.65 * s}) translate(-14.5 -14.5)`} style={{filter: `drop-shadow(0 0 ${6 * (1 - ring)}px rgba(30,215,96,0.9))`}}>
        <rect x={0} y={0} width={29} height={29} rx={4.5} fill="rgb(58,234,123)" />
        <path d="M7.6 13.9 L13.2 19 L20.6 9.3" fill="none" stroke="#021A08" strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={22} strokeDashoffset={22 * (1 - draw)} />
      </g>
    </svg>
  );
};

// Act-local variant of kit <Cursor>: identical arrow/press, but each click ripple stays pinned where the click
// happened (the kit draws ripples at the cursor's current position, so they slide along to the next target).
export const PinCursor: React.FC<{f: number; path: CursorKey[]; clicks?: number[]; show?: [number, number]; scale?: number}> = ({f, path, clicks = [], show, scale = 1}) => {
  const at = (t: number) => {
    let x = path[0].x;
    let y = path[0].y;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      if (t >= b.f) {
        x = b.x;
        y = b.y;
      } else if (t > a.f) {
        const k = ease.expoInOut(prog(t, a.f, b.f));
        x = a.x + (b.x - a.x) * k;
        y = a.y + (b.y - a.y) * k;
        break;
      } else break;
    }
    return {x, y};
  };
  const ripples = clicks
    .filter((c) => f >= c && f < c + 28)
    .map((c) => {
      const p = (f - c) / 28;
      const q = at(c);
      return (
        <div
          key={c}
          style={{
            position: 'absolute',
            left: q.x - 30 * scale,
            top: q.y - 30 * scale,
            width: 60 * scale,
            height: 60 * scale,
            borderRadius: '50%',
            border: `${3 * scale}px solid ${C.green}`,
            transform: `scale(${0.3 + 1.3 * ease.out(p)})`,
            opacity: (1 - p) * 0.9,
            boxShadow: `0 0 ${20 * scale}px rgba(30,215,96,0.6)`,
          }}
        />
      );
    });
  const vis = show ? Math.min(prog(f, show[0], show[0] + 8), 1 - prog(f, show[1] - 8, show[1])) : 1;
  if (vis <= 0) return <>{ripples}</>;
  let press = 0;
  for (const c of clicks) {
    const t = f - c;
    if (t >= -4 && t < 6) press = Math.max(press, 1 - Math.abs(t - 1) / 5);
  }
  const {x, y} = at(f);
  return (
    <>
      {ripples}
      <svg
        width={34 * scale}
        height={40 * scale}
        viewBox="0 0 34 40"
        style={{position: 'absolute', left: x - 4 * scale, top: y - 2 * scale, opacity: vis, transform: `scale(${1 - 0.12 * press})`, transformOrigin: '4px 2px', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.55))'}}
      >
        <path d="M4 2 L4 31 L11.5 24 L16.5 36 L21.5 34 L16.5 22.5 L27 22.5 Z" fill="#FFFFFF" stroke="#0A0A0A" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </>
  );
};

// A stacked multi-line super: each line is a kit <Super> starting at its own frame (one super, several lines).
export const Lines: React.FC<{f: number; lines: Array<{text: string; start: number; accent?: number[]}>; end: number; size: number; align?: 'left' | 'center' | 'right'; stagger?: number; gap?: number}> = ({
  f,
  lines,
  end,
  size,
  align = 'left',
  stagger = 4,
  gap = 0,
}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap, alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'}}>
    {lines.map((l, i) => (
      <Super key={i} f={f} text={l.text} start={l.start} end={end} size={size} weight={800} align={align} stagger={stagger} accentWords={l.accent} maxWidth={2000} />
    ))}
  </div>
);

// Soft green glow pulse (screen-blended radial) centred at (x, y) in the parent's px.
export const Bloom: React.FC<{x: number; y: number; r: number; o: number; color?: string}> = ({x, y, r, o, color = '30,215,96'}) =>
  o <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(${color},${0.55 * clamp(o, 0, 2)}) 0%, rgba(${color},${0.18 * clamp(o, 0, 2)}) 35%, rgba(${color},0) 70%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
