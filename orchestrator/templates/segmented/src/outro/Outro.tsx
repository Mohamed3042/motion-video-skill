// Outro / end card (owned by the framework job; scaffold placeholder): brand name + tagline.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, C, FONT, H} from '../brand';
import {useSegFrame} from '../frame';
import {BEAT} from '../timing';
import {clamp, ease} from '../util';

export const Outro: React.FC = () => {
  const f = useSegFrame();
  const p = ease.expoOut(clamp(f / (2 * BEAT)));
  const q = ease.expoOut(clamp((f - BEAT) / (2 * BEAT)));
  return (
    <AbsoluteFill style={{background: C.bg, alignItems: 'center', justifyContent: 'center', gap: Math.round(H * 0.03)}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: Math.round(H * 0.1), color: C.fg, opacity: p}}>{BRAND.name}</div>
      {BRAND.tagline ? <div style={{fontFamily: FONT, fontWeight: 500, fontSize: Math.round(H * 0.035), color: C.fg, opacity: 0.8 * q}}>{BRAND.tagline}</div> : null}
    </AbsoluteFill>
  );
};
