// The window face in its three modes — static, morphing between layouts, exploded into layers.
// All sizes in layout px: k = px per 1x source px; the face is 1586k × 936k (kit WINDOW_RECT), origin top-left.
import React from 'react';
import {C} from '../../brand';
import {Crop, WINDOW_RECT, ease, prog, springAt, type Rect} from '../../kit';
import type {ScreenId} from '../../screens';
import {BANDS, LAYERS, SIDE, TOP} from './layout';

const shadowOf = (rim: number) => `0 40px 120px rgba(0,0,0,0.75), 0 0 0 1px ${C.line}, 0 0 ${60 * rim}px rgba(30,215,96,${0.18 * rim})`;

// Window shell: frame shadow + green rim (unclipped), content clipped to the rounded window.
const Shell: React.FC<{k: number; rim: number; children: React.ReactNode; style?: React.CSSProperties}> = ({k, rim, children, style}) => {
  const w = WINDOW_RECT.w * k;
  const h = WINDOW_RECT.h * k;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: 16 * k, boxShadow: shadowOf(rim), ...style}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 16 * k, overflow: 'hidden', background: 'rgb(14,14,14)'}}>{children}</div>
      <div style={{position: 'absolute', inset: 0, borderRadius: 16 * k, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)', pointerEvents: 'none'}} />
    </div>
  );
};

const At2: React.FC<{r: Rect; k: number; children: React.ReactNode; style?: React.CSSProperties}> = ({r, k, children, style}) => (
  <div style={{position: 'absolute', left: r.x * k, top: r.y * k, width: r.w * k, height: r.h * k, ...style}}>{children}</div>
);

export const StaticFace: React.FC<{id: ScreenId; k: number; rim: number}> = ({id, k, rim}) => (
  <Shell k={k} rim={rim}>
    <Crop id={id} rect={WINDOW_RECT} scale={k} />
  </Shell>
);

// Layout morph A → B starting at t0: the chrome cross-dissolves (only the toggle / nav highlight differ),
// A's content bands lift away top-down (fade, rise, blur) while B's bands spring up from below, staggered.
export const MORPH_LEN = 46;
export const MorphFace: React.FC<{a: ScreenId; b: ScreenId; f: number; t0: number; k: number; rim: number}> = ({a, b, f, t0, k, rim}) => {
  const chromeB = ease.inOut(prog(f, t0 + 2, t0 + 12));
  const bandsA = BANDS[a] ?? [];
  const bandsB = BANDS[b] ?? [];
  return (
    <Shell k={k} rim={rim}>
      {bandsA.map((r, i) => {
        const t = prog(f, t0 + i * 2, t0 + i * 2 + 11);
        if (t >= 1) return null;
        return (
          <At2 key={`a${i}`} r={r} k={k} style={{opacity: 1 - ease.in(t), transform: `translateY(${-22 * k * ease.in(t)}px) scale(${1 - 0.025 * t})`, filter: t > 0.02 ? `blur(${7 * t}px)` : undefined}}>
            <Crop id={a} rect={r} scale={k} />
          </At2>
        );
      })}
      {bandsB.map((r, i) => {
        const st = t0 + 7 + i * 3;
        if (f < st) return null;
        const s = springAt(f, st, {stiffness: 190, damping: 21});
        const blur = 9 * (1 - ease.out(prog(f, st, st + 12)));
        return (
          <At2 key={`b${i}`} r={r} k={k} style={{opacity: Math.min(1, s * 1.6), transform: `translateY(${44 * k * (1 - s)}px) scale(${0.985 + 0.015 * s})`, filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
            <Crop id={b} rect={r} scale={k} />
          </At2>
        );
      })}
      {[SIDE, TOP].map((r, i) => (
        <React.Fragment key={i}>
          <At2 r={r} k={k}>
            <Crop id={a} rect={r} scale={k} />
          </At2>
          {chromeB > 0 ? (
            <At2 r={r} k={k} style={{opacity: chromeB}}>
              <Crop id={b} rect={r} scale={k} />
            </At2>
          ) : null}
        </React.Fragment>
      ))}
    </Shell>
  );
};

// Exploded 01: the backplate keeps dark sockets where layers lifted out; six layers float at depth e·z.
export const ExplodedFace: React.FC<{k: number; e: number; rim: number; glow: number}> = ({k, e, rim, glow}) => {
  const id: ScreenId = '01-library-studio';
  const sock = Math.min(1, e * 4);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d'}}>
      <Shell k={k} rim={rim}>
        <Crop id={id} rect={WINDOW_RECT} scale={k} />
        {LAYERS.map((l) => (
          <At2
            key={l.name}
            r={l.r}
            k={k}
            style={{borderRadius: 10 * k, background: `rgba(6,7,7,${sock})`, boxShadow: `inset 0 0 0 ${k}px rgba(255,255,255,${0.06 * sock}), inset 0 ${8 * k}px ${24 * k}px rgba(0,0,0,${0.6 * sock})`}}
          >
            {null}
          </At2>
        ))}
      </Shell>
      {LAYERS.map((l) => (
        <div
          key={l.name}
          style={{
            position: 'absolute',
            left: l.r.x * k,
            top: l.r.y * k,
            width: l.r.w * k,
            height: l.r.h * k,
            borderRadius: 10 * k,
            transform: `translate3d(${l.dx * k * e}px, ${l.dy * k * e}px, ${l.z * e}px)`,
            boxShadow: `0 ${30 * e}px ${70 * e}px rgba(0,0,0,${0.55 * Math.min(1, e * 2)}), 0 0 0 ${k}px rgba(255,255,255,${0.16 * sock}), 0 0 ${40 * glow}px rgba(30,215,96,${0.22 * glow})`,
          }}
        >
          <Crop id={id} rect={l.r} scale={k} radius={10 * k} />
        </div>
      ))}
    </div>
  );
};
