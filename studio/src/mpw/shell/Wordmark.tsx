// The MONTAGE PRO wordmark: spaced uppercase, PRO in amber, weight ~450, letter-spacing 0.14 em.
// It is written from its centre outward between an In and an Out bracket: the playhead split in two.
import React from 'react';
import {C, FONT} from '../brand';
import {clamp, rgba} from './util';

const Bracket: React.FC<{side: -1 | 1; h: number; serif: number; color: string}> = ({side, h, serif, color}) => {
  const w = 26;
  const x = side < 0 ? w / 2 + 1.5 : w / 2 - 1.5; // the bar sits on the bracket's centre line
  return (
    <svg width={w} height={h} style={{position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', overflow: 'visible', filter: `drop-shadow(0 0 8px ${rgba(color, 0.8)})`}}>
      <path d={`M${x - side * serif} 1.5H${x}V${h - 1.5}H${x - side * serif}`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="square" />
    </svg>
  );
};

// open: 0 = a single line at the centre, 1 = fully written with the brackets at the edges.
// marks: bracket opacity; glow: extra amber bloom on the letters.
export const Wordmark: React.FC<{x: number; y: number; size: number; open?: number; marks?: number; glow?: number; color?: string}> = ({
  x,
  y,
  size,
  open = 1,
  marks = 1,
  glow = 0,
  color = C.amber,
}) => {
  const e = clamp(open);
  const m = 0.42 * size; // bracket margin outside the letters
  const hb = 1.32 * size;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)'}}>
      <div style={{position: 'relative'}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 450,
            fontSize: size,
            letterSpacing: '0.14em',
            paddingLeft: '0.14em', // balances the tracking after the last letter
            lineHeight: 1,
            whiteSpace: 'nowrap',
            color: C.text,
            clipPath: `inset(-40% ${(50 * (1 - e)).toFixed(3)}% -40% ${(50 * (1 - e)).toFixed(3)}%)`,
            textShadow: `0 0 ${size * 0.4}px ${rgba(color, 0.18 + 0.5 * glow)}`,
          }}
        >
          MONTAGE <span style={{color}}>PRO</span>
        </div>
        {marks > 0
          ? ([-1, 1] as const).map((side) => (
              <div key={side} style={{position: 'absolute', top: 0, bottom: 0, left: `calc(${50 + side * 50 * e}% + ${side * m * e}px)`, opacity: marks}}>
                <Bracket side={side} h={hb} serif={18 * clamp(e * 4)} color={color} />
              </div>
            ))
          : null}
      </div>
    </div>
  );
};
