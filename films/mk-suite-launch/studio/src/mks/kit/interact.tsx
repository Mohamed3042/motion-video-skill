// Interaction props: cursor with click ripples, 3D keycaps, highlight rings, animated checks.
import React from 'react';
import {C, FONT} from '../brand';
import {clamp, ease, lerp, prog, springAt} from './math';
import type {Rect} from './screen';

// ── Cursor ──────────────────────────────────────────────────────────────────────────────────────
// path: keyframes in OUTPUT px of the parent; a move eases (expoOut by default) from the previous key.
// click: frames where a click happens (press squash + green ripple). The cursor fades in/out at `show`.
export type CursorKey = {f: number; x: number; y: number};
export const Cursor: React.FC<{f: number; path: CursorKey[]; clicks?: number[]; show?: [number, number]; scale?: number}> = ({f, path, clicks = [], show, scale = 1}) => {
  let x = path[0].x;
  let y = path[0].y;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (f >= b.f) {
      x = b.x;
      y = b.y;
    } else if (f > a.f) {
      const t = ease.expoInOut(prog(f, a.f, b.f));
      x = lerp(a.x, b.x, t);
      y = lerp(a.y, b.y, t);
      break;
    } else break;
  }
  const vis = show ? Math.min(prog(f, show[0], show[0] + 8), 1 - prog(f, show[1] - 8, show[1])) : 1;
  if (vis <= 0) return null;
  let press = 0;
  const ripples: React.ReactNode[] = [];
  for (const c of clicks) {
    const t = f - c;
    if (t >= -4 && t < 6) press = Math.max(press, 1 - Math.abs(t - 1) / 5);
    if (t >= 0 && t < 28) {
      const p = t / 28;
      ripples.push(
        <div
          key={c}
          style={{
            position: 'absolute',
            left: x - 30 * scale,
            top: y - 30 * scale,
            width: 60 * scale,
            height: 60 * scale,
            borderRadius: '50%',
            border: `${3 * scale}px solid ${C.green}`,
            transform: `scale(${lerp(0.3, 1.6, ease.out(p))})`,
            opacity: (1 - p) * 0.9,
            boxShadow: `0 0 ${20 * scale}px rgba(30,215,96,0.6)`,
          }}
        />,
      );
    }
  }
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

// ── Keycap ──────────────────────────────────────────────────────────────────────────────────────
export const Keycap: React.FC<{f: number; label: string; press: number; width?: number; size?: number; glow?: boolean}> = ({f, label, press, width = 220, size = 1, glow = true}) => {
  const t = f - press;
  const down = t >= -3 && t < 10 ? 1 - Math.abs(t - 1) / 9 : 0;
  const lit = t >= 0 ? Math.max(0, 1 - t / 40) : 0;
  const h = 200 * size;
  const depth = 26 * size * (1 - 0.75 * clamp(down));
  return (
    <div style={{position: 'relative', width: width * size, height: h + 26 * size}}>
      <div style={{position: 'absolute', left: 0, top: 26 * size, width: width * size, height: h, borderRadius: 34 * size, background: '#050606', boxShadow: '0 30px 60px rgba(0,0,0,0.7)'}} />
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
            glow && lit > 0 ? `0 0 ${60 * size}px rgba(30,215,96,${0.55 * lit})` : '0 0 0 rgba(0,0,0,0)',
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

// ── Highlight ring (draws in, then breathes) ─────────────────────────────────────────────────────
export const Highlight: React.FC<{f: number; r: Rect; start: number; end?: number; radius?: number; color?: string; width?: number}> = ({f, r, start, end, radius = 12, color = C.green, width = 3}) => {
  const a = prog(f, start, start + 14);
  const out = end !== undefined ? prog(f, end, end + 10) : 0;
  const o = a * (1 - out);
  if (o <= 0) return null;
  const breathe = 0.75 + 0.25 * Math.sin((f - start) * 0.12);
  const per = 2 * (r.w + r.h);
  return (
    <svg style={{position: 'absolute', left: r.x - 8, top: r.y - 8, overflow: 'visible', opacity: o}} width={r.w + 16} height={r.h + 16}>
      <rect
        x={4}
        y={4}
        width={r.w + 8}
        height={r.h + 8}
        rx={radius}
        fill={`rgba(30,215,96,${0.06 * breathe})`}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={per}
        strokeDashoffset={per * (1 - ease.out(a))}
        style={{filter: `drop-shadow(0 0 ${10 * breathe}px ${color})`}}
      />
    </svg>
  );
};

// ── Check (circle + tick that draws, with a pop) ─────────────────────────────────────────────────
export const Check: React.FC<{f: number; at: number; size?: number; x: number; y: number}> = ({f, at, size = 34, x, y}) => {
  if (f < at) return null;
  const s = springAt(f, at, {stiffness: 260, damping: 14});
  const draw = ease.out(prog(f, at + 2, at + 14));
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" style={{position: 'absolute', left: x - size / 2, top: y - size / 2, transform: `scale(${s})`, overflow: 'visible', filter: 'drop-shadow(0 0 8px rgba(30,215,96,0.7))'}}>
      <circle cx="17" cy="17" r="16" fill={C.green} />
      <path d="M9.5 17.5 L14.8 22.6 L24.8 12" fill="none" stroke="#06200F" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - draw)} />
    </svg>
  );
};
