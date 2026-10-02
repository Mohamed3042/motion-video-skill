// PLACEHOLDER for segment "__ID__" (the segment builder replaces this file). Deterministic: frame-driven only.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, H, SAFE, W} from '../../brand';
import {useSegFrame} from '../../frame';
import {segById} from '../../timing';
import {clamp, ease} from '../../util';

export const World: React.FC = () => {
  const f = useSegFrame();
  const seg = segById('__ID__');
  const len = seg.end - seg.start;
  const p = ease.expoOut(clamp(f / 30));
  return (
    <AbsoluteFill style={{background: C.bg, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: Math.round(H * 0.09), color: ACCENT.__ID__, opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
        {seg.name}
      </div>
      <div style={{position: 'absolute', left: SAFE, bottom: SAFE, height: 6, width: (W - 2 * SAFE) * clamp(f / len), background: ACCENT.__ID__}} />
    </AbsoluteFill>
  );
};
