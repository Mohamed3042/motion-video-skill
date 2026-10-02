// Intro (owned by the framework job; scaffold placeholder): the brand name settles in on the first beats.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, C, FONT, H} from '../brand';
import {useSegFrame} from '../frame';
import {BEAT} from '../timing';
import {clamp, ease} from '../util';

export const Intro: React.FC = () => {
  const f = useSegFrame();
  const p = ease.expoOut(clamp(f / (2 * BEAT)));
  return (
    <AbsoluteFill style={{background: C.bg, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: Math.round(H * 0.12), color: C.fg, opacity: p, transform: `scale(${0.92 + 0.08 * p})`}}>{BRAND.name}</div>
    </AbsoluteFill>
  );
};
