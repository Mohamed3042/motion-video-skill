// Act boundaries: what happens in the 12 frames centred on each one.
//  cut  → straight cut (the act owners make these continuous): only the incoming act from the boundary frame on.
//  zoom → zoom-through: outgoing scales up + brightens out into a soft green-white bloom, incoming scales 0.92 → 1
//         as the bloom fades. The swap is hidden under the bloom peak.
//  whip → whip-pan left (everything travels right → left) with horizontal-only motion blur (SVG feGaussianBlur).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {W} from '../brand';
import {ACTS} from '../timing';
import {ease} from '../kit/math';

export type Tx = 'cut' | 'zoom' | 'whip';
export const TX: Record<number, Tx> = {600: 'cut', 1440: 'zoom', 2880: 'whip', 3840: 'cut', 4800: 'zoom', 6000: 'cut'};
export const HALF = 6;

export type Look = {style: React.CSSProperties; blurX: number};

// Whip speed (px/frame, from the derivative of cubic in-out) → horizontal blur radius.
const whipBlur = (p: number) => Math.min(110, ((W * (p < 0.5 ? 12 * p * p : 12 * (1 - p) ** 2)) / (2 * HALF)) * 0.3);

// How act i looks at global frame g; null = not on screen.
export const lookAt = (i: number, g: number): Look | null => {
  const a = ACTS[i];
  const tin = i > 0 ? TX[a.start] : undefined;
  const tout = i < ACTS.length - 1 ? TX[a.end] : undefined;
  if (g < a.start - (tin === 'whip' ? HALF : 0)) return null;
  if (g >= a.end + (tout === 'whip' ? HALF : 0)) return null;

  let scale = 1;
  let tx = 0;
  let bright = 1;
  let blur = 0;
  let blurX = 0;
  if (tin === 'zoom' && g < a.start + HALF) {
    const q = (g - a.start) / HALF; // 0 at the boundary
    scale *= 0.92 + 0.08 * ease.expoOut(q);
    bright *= 1 + 0.7 * (1 - ease.out(q));
    blur += 5 * (1 - q) ** 2;
  }
  if (tout === 'zoom' && g >= a.end - HALF) {
    const p = (g - (a.end - HALF) + 1) / HALF; // 1/6 .. 1 at the last outgoing frame
    scale *= 1 + 0.5 * ease.in(p);
    bright *= 1 + 1.1 * p * p;
    blur += 7 * p * p;
  }
  if (tin === 'whip' && g < a.start + HALF) {
    const p = (g - (a.start - HALF)) / (2 * HALF);
    tx += W * (1 - ease.inOut(p));
    blurX = whipBlur(p);
  }
  if (tout === 'whip' && g >= a.end - HALF) {
    const p = (g - (a.end - HALF)) / (2 * HALF);
    tx -= W * ease.inOut(p);
    blurX = whipBlur(p);
  }
  const filter = [bright !== 1 ? `brightness(${bright.toFixed(3)})` : '', blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : ''].join(' ').trim();
  return {
    style: {
      transform: scale !== 1 || tx ? `translateX(${tx.toFixed(1)}px) scale(${scale.toFixed(4)})` : undefined,
      filter: filter || undefined,
    },
    blurX,
  };
};

// Green-white light bloom over the zoom-through boundaries (peaks on the two frames around the swap).
export const Bloom: React.FC<{g: number}> = ({g}) => {
  let I = 0;
  for (const [f, t] of Object.entries(TX)) {
    if (t !== 'zoom') continue;
    const u = (g - Number(f) + 0.5) / HALF;
    if (Math.abs(u) < 1) I = Math.max(I, (1 - Math.abs(u)) ** 1.5);
  }
  if (I <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 75% 70% at 50% 50%, rgba(255,255,255,1) 0%, rgba(222,255,234,0.92) 28%, rgba(30,215,96,0.5) 62%, rgba(30,215,96,0) 100%)',
          mixBlendMode: 'screen',
          opacity: I,
        }}
      />
      <AbsoluteFill style={{background: 'rgb(236,255,243)', opacity: 0.6 * I * I}} />
    </AbsoluteFill>
  );
};
