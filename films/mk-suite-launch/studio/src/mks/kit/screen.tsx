// Real UI on screen: crops of the concept screens, framed as floating desktop windows.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C} from '../brand';
import {SCALE_STORED, screenFile, srcSize, type ScreenId} from '../screens';

export type Rect = {x: number; y: number; w: number; h: number}; // 1× source pixels

// <Crop>: the sub-rectangle `rect` of a screen, drawn at `scale` (output px per 1× source px).
export const Crop: React.FC<{id: ScreenId; rect?: Rect; scale: number; radius?: number; style?: React.CSSProperties}> = ({id, rect, scale, radius = 0, style}) => {
  const s = srcSize(id);
  const r = rect ?? {x: 0, y: 0, w: s.w, h: s.h};
  return (
    <div style={{position: 'relative', width: r.w * scale, height: r.h * scale, overflow: 'hidden', borderRadius: radius, ...style}}>
      <Img
        src={staticFile(screenFile(id))}
        style={{position: 'absolute', left: -r.x * scale, top: -r.y * scale, width: s.w * scale, height: s.h * scale, maxWidth: 'none'}}
      />
    </div>
  );
};

// Desktop concepts carry a small "DESIGN CONCEPT" label near the bottom (measured: its top edge sits at y ≈ 940
// on 12-help, 948 on 03/13, 954–966 elsewhere; left OR right side): windows trim it by default.
// Never show y > 936 of a desktop screen.
export const WINDOW_RECT: Rect = {x: 0, y: 0, w: 1586, h: 936};

// <Screen>: a whole concept screen (or a crop) as a premium floating window.
// `width` = on-screen width in px; height follows the crop's aspect. Centered on its own box.
// Default crop for desktop screens = WINDOW_RECT (label trimmed); phones show in full.
export const Screen: React.FC<{
  id: ScreenId;
  width: number;
  rect?: Rect;
  rim?: number; // 0..1 green rim-light strength
  shadow?: number; // 0..1
  radius?: number; // in 1× source px (scaled)
  style?: React.CSSProperties;
  children?: React.ReactNode; // overlays positioned in OUTPUT px over the window (use toPx)
}> = ({id, width, rect, rim = 0.35, shadow = 1, radius = 16, style, children}) => {
  const s = srcSize(id);
  const r = rect ?? (s.w > s.h ? WINDOW_RECT : {x: 0, y: 0, w: s.w, h: s.h});
  const scale = width / r.w;
  const rad = radius * scale;
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: r.h * scale,
        borderRadius: rad,
        boxShadow: [
          `0 ${40 * shadow}px ${120 * shadow}px rgba(0,0,0,${0.75 * shadow})`,
          `0 0 0 1px ${C.line}`,
          rim > 0 ? `0 0 ${60 * rim}px rgba(30,215,96,${0.18 * rim})` : '',
        ]
          .filter(Boolean)
          .join(', '),
        ...style,
      }}
    >
      <Crop id={id} rect={r} scale={scale} radius={rad} />
      {/* top-edge light catch */}
      <div style={{position: 'absolute', inset: 0, borderRadius: rad, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', pointerEvents: 'none'}} />
      {children}
    </div>
  );
};

// Map a 1× source rect to output px inside a <Screen width={width} rect={crop}>.
export const toPx = (r: Rect, width: number, crop?: Rect, phone = false): Rect => {
  const c = crop ?? {x: 0, y: 0, w: phone ? 992 : 1586, h: phone ? 1586 : 992};
  const k = width / c.w;
  return {x: (r.x - c.x) * k, y: (r.y - c.y) * k, w: r.w * k, h: r.h * k};
};

export const STORED = SCALE_STORED;
