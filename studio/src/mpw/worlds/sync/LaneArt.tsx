// One stereo track's waveforms (lane-local coordinates, LANE.h tall). Word bursts and the rest are drawn
// identically until `boost` > 0 (only after the reveal), so a single track never gives the word away.
// After the reveal the floor recedes and the bursts swell to fill their channel, so the word reads solid.
import React from 'react';
import {mix, mixHex} from './kit';
import {BARS, CH_H, chY, type Bar} from './word';

const pathOf = (lane: number, pick: (b: Bar) => boolean, grow = 1) =>
  [0, 1]
    .map((ch) =>
      BARS[lane][ch]
        .filter(pick)
        .map((b) => {
          const a = Math.min(CH_H / 2 + 1, b.a * grow);
          return `M${b.x.toFixed(1)} ${(chY(ch) - a).toFixed(1)}V${(chY(ch) + a).toFixed(1)}`;
        })
        .join(''),
    )
    .join('');
const PATH_WORD = [0, 1, 2, 3].map((i) => pathOf(i, (b) => b.word));
const PATH_REST = [0, 1, 2, 3].map((i) => pathOf(i, (b) => !b.word));

export const LaneArt: React.FC<{lane: number; color: string; boost?: number; opacity?: number}> = ({lane, color, boost = 0, opacity = 0.95}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
    <path d={PATH_REST[lane]} stroke={color} strokeOpacity={opacity * mix(1, 0.14, boost)} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path
      d={boost > 0.01 ? pathOf(lane, (b) => b.word, 1 + 0.2 * boost) : PATH_WORD[lane]}
      stroke={boost > 0 ? mixHex(color, '#ffe7b0', 0.45 * boost) : color}
      strokeOpacity={opacity}
      strokeWidth={mix(3, 3.6, boost)}
      strokeLinecap={boost > 0.5 ? 'butt' : 'round'}
      fill="none"
    />
  </svg>
);
