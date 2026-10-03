// Act-local helpers shared by Work (act 3) and Grow (act 4).
// World convention for these acts: windows are placed at 1 world px = 1 source px (width 1586),
// so the camera alone decides magnification: m = P / (P - Z - camZ). Keep m <= ~1.6 on readable UI.
import React from 'react';
import {At, Crop, Label, Screen, Super, WINDOW_RECT, ease, prog, springAt, type Rect} from '../../kit';
import {C} from '../../brand';
import {H, W} from '../../brand';
import type {ScreenId} from '../../screens';

export const P = 2200; // kit Stage default perspective
export type Cam3 = {x: number; y: number; z: number};
export const mag = (Z: number, camZ: number) => P / (P - Z - camZ);
// Screen position of a world point for an un-rotated camera.
export const project = (X: number, Y: number, Z: number, cam: Cam3) => {
  const m = mag(Z, cam.z);
  return {x: W / 2 + (X - cam.x) * m, y: H / 2 + (Y - cam.y) * m, m};
};
// Camera z that gives magnification m on the Z=0 plane.
export const zFor = (m: number) => P - P / m;
// Window-centre-relative world coords of a source point (window centred at world origin).
export const WC = {x: WINDOW_RECT.w / 2, y: WINDOW_RECT.h / 2};

// A concept window in the 3D stage, 1 world px = 1 source px. `lifted` children live in the window's
// 3D space (use translateZ to pop layers forward); `children` are flat overlays in source px.
export const Win: React.FC<{
  id: ScreenId;
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  o?: number;
  rim?: number;
  children?: React.ReactNode;
  lifted?: React.ReactNode;
}> = ({id, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, o = 1, rim = 0.4, children, lifted}) => (
  <At x={x} y={y} z={z} rx={rx} ry={ry} rz={rz}>
    <div style={{position: 'relative', width: WINDOW_RECT.w, height: WINDOW_RECT.h, transformStyle: 'preserve-3d'}}>
      <Screen id={id} width={WINDOW_RECT.w} rim={rim} style={{opacity: o}}>
        {children}
      </Screen>
      {lifted}
    </div>
  </At>
);

// Flat solid patch (used to hide a region of the screenshot before re-drawing it animated).
export const Fill: React.FC<{r: Rect; color: string; radius?: number; o?: number}> = ({r, color, radius = 0, o = 1}) => (
  <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, background: color, borderRadius: radius, opacity: o}} />
);

// A source-rect slice of a screen drawn at its own place (+dx,dy), 1 px = 1 source px.
export const Slice: React.FC<{id: ScreenId; r: Rect; dx?: number; dy?: number; o?: number; clipH?: number; radius?: number; style?: React.CSSProperties}> = ({
  id,
  r,
  dx = 0,
  dy = 0,
  o = 1,
  clipH,
  radius = 0,
  style,
}) => (
  <div style={{position: 'absolute', left: r.x + dx, top: r.y + dy, width: r.w, height: clipH ?? r.h, overflow: 'hidden', opacity: o, borderRadius: radius, ...style}}>
    <Crop id={id} rect={r} scale={1} />
  </div>
);

// Horizontal-only blur (cheap whip-pan motion blur). Render once, reference with filter: url(#id).
export const HBlurDefs: React.FC<{id: string; sx: number; sy?: number}> = ({id, sx, sy = 0}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={`${Math.max(0, sx)} ${Math.max(0, sy)}`} />
      </filter>
    </defs>
  </svg>
);

// ── Icons (vector, so they can be magnified freely) ──────────────────────────────────────────────
// Work: the UI's layered-stack glyph (from the website's Work column), drawn as three layers that can drop in.
export const StackIcon: React.FC<{size: number; layers?: [number, number, number]; glow?: number}> = ({size, layers = [1, 1, 1], glow = 1}) => {
  const sw = 6.5;
  const lay = (k: number, i: number) => ({opacity: Math.min(1, k * 1.5), transform: `translateY(${(1 - k) * -26}px)`, transformBox: 'fill-box' as const});
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', filter: `drop-shadow(0 0 ${14 * glow}px rgba(30,215,96,${0.55 * glow}))`}}>
      <g fill="none" stroke={C.green} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 66 L12 70 L50 90 L88 70 L80 66" style={lay(layers[2], 2)} />
        <path d="M20 48 L12 52 L50 72 L88 52 L80 48" style={lay(layers[1], 1)} />
        <path d="M50 12 L88 32 L50 52 L12 32 Z" style={lay(layers[0], 0)} />
      </g>
    </svg>
  );
};

// Bars glyph in a 100-unit box: the UI's Activity icon is heights [0.49,1,0.63] (×86), the Grow icon is
// ascending [0.5,0.79,1]. Bar centres at 20/50/80, bottom at 92.
export const ACTIVITY_BARS: [number, number, number] = [0.49, 1, 0.63];
export const GROW_BARS: [number, number, number] = [0.5, 0.79, 1];
export const BarsIcon: React.FC<{size: number; h: [number, number, number]; glow?: number; o?: number}> = ({size, h, glow = 1, o = 1}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', opacity: o, filter: glow > 0 ? `drop-shadow(0 0 ${14 * glow}px rgba(30,215,96,${0.6 * glow}))` : undefined}}>
    {[20, 50, 80].map((cx, i) => {
      const hh = 86 * h[i];
      return <rect key={i} x={cx - 5.5} y={92 - hh} width={11} height={hh} rx={5.5} fill={C.green} />;
    })}
  </svg>
);
// Where the Activity sidebar glyph sits in the 07 screen (source px): a 100-unit box of 23.64 px.
export const ACTIVITY_ICON_BOX: Rect = {x: 40.4, y: 229.3, w: 23.64, h: 23.64};

// ── Chapter card (absolute layout so the icon slot is known; same look as kit <Chapter>) ─────────
export const CH = {x0: 500, row: 528, icon: 210};
export const chapterIconSlot = (x0 = CH.x0) => ({x: x0 + CH.icon / 2, y: CH.row, size: CH.icon});

export const ChapterCard: React.FC<{
  f: number;
  start: number;
  index: string;
  word: string;
  sub: string;
  x0?: number;
  icon?: React.ReactNode; // drawn in the slot (pass null when the icon is animated elsewhere)
  out?: number; // 0..1 exit progress
}> = ({f, start, index, word, sub, x0 = CH.x0, icon, out = 0}) => {
  const line = ease.expoOut(prog(f, start + 4, start + 40));
  const wordX = x0 + CH.icon + 44;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
      <div style={{position: 'absolute', left: x0 + 6, top: CH.row - 200}}>
        <Label f={f} text={index} start={start} color={C.green} size={20} />
      </div>
      {icon ? (
        <div style={{position: 'absolute', left: x0, top: CH.row - CH.icon / 2, width: CH.icon, height: CH.icon}}>{icon}</div>
      ) : null}
      <div style={{position: 'absolute', left: wordX, top: CH.row - 132}}>
        <Super f={f} text={word} start={start + 4} size={230} weight={900} align="left" stagger={0} />
      </div>
      <div style={{position: 'absolute', left: x0 + 6, top: CH.row + 150, height: 3, width: 900 * line, background: `linear-gradient(90deg, ${C.green}, rgba(30,215,96,0))`, boxShadow: '0 0 18px rgba(30,215,96,0.6)'}} />
      <div style={{position: 'absolute', left: x0 + 6, top: CH.row + 180}}>
        <Super f={f} text={sub} start={start + 16} size={44} weight={500} align="left" color={C.sub} stagger={3} />
      </div>
    </div>
  );
};

// Pop-in helper for icon slots (spring scale).
export const pop = (f: number, at: number) => springAt(f, at, {stiffness: 220, damping: 16});
