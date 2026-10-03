// D · Ctrl+K: two big keycaps rise, Ctrl goes down and stays down, K strikes on the next beat, then both rush past
// the camera (zoom-through) as the library and its search overlay come forward.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {At, Stage, lerp, prog, springAt} from '../../kit';
import {Key3D} from './parts';
import {T} from './timing';

export const KeysScene: React.FC<{f: number}> = ({f}) => {
  if (f < T.kcIn || f > T.kKey + 14) return null;
  const rise = springAt(f, T.kcIn, {stiffness: 120, damping: 15});
  const thru = prog(f, T.kKey + 2, T.kKey + 13) ** 2; // K lands, then both caps rush the lens
  const o = prog(f, T.kcIn, T.kcIn + 12) * (1 - prog(f, T.kKey + 7, T.kKey + 13));
  if (o <= 0) return null;
  const blur = 10 * thru * thru;
  const strike = f >= T.kKey ? Math.exp(-(f - T.kKey) / 9) : 0; // green flash behind the caps on K
  const held = prog(f, T.ctrl, T.ctrl + 6);
  const glow = 0.08 + 0.08 * held + 0.4 * strike;
  return (
    <>
      <AbsoluteFill style={{opacity: o, background: `radial-gradient(ellipse 34% 26% at 50% 66%, rgba(30,215,96,${glow.toFixed(3)}) 0%, rgba(30,215,96,0) 100%)`}} />
      <Stage>
        <At y={lerp(520, 130, rise)} z={lerp(-300, 0, rise) + 1800 * thru} rx={lerp(48, 26, rise)} o={o} style={{transformOrigin: '0 0', filter: blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
          <div style={{display: 'flex', gap: 46, alignItems: 'flex-end'}}>
            <Key3D f={f} label="Ctrl" press={T.ctrl} release={T.kKey + 10} width={300} size={1.4} />
            <Key3D f={f} label="K" press={T.kKey} width={220} size={1.4} />
          </div>
        </At>
      </Stage>
    </>
  );
};
