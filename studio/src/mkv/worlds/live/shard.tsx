// The Live -> TTS portal: the "y" of "your" in the Live words panel detaches as a pink glass shard.
// Rendered by BOTH worlds from the same pose function so the 12-frame boundary blend is seamless.
// u = frames relative to the boundary (Live: f - 480, TTS: f).
import React from 'react';
import {ACCENT, FONT} from '../../brand';
import {Glow, ease, mix, mixHex, prog, rgba} from './util';

// Live words line layout (Inter 800, line-height 1). The line is split at X0 so the "y" of "your"
// starts at a known x without measuring text.
export const WORDS = {S0: 52, S1: 104, cx: 960, cy: 560, k: 1.835};
export const wordsX0 = (S: number) => WORDS.cx + WORDS.k * S;

const PINK = ACCENT.tts;
// glass plate around the glyph, in em (glyph box: 0.6em x 1em)
const PLATE = [
  [-0.14, 0.16],
  [0.66, 0.22],
  [0.76, 0.84],
  [0.3, 1.24],
  [-0.18, 0.96],
];

export const BoundaryShard: React.FC<{u: number}> = ({u}) => {
  if (u < -28 || u > 40) return null;
  const S = WORDS.S1;
  const x0 = wordsX0(S);
  const top = WORDS.cy - S / 2;
  const gx = 0.3 * S;
  const gy = 0.66 * S;
  const lift = ease.cubicOut(prog(u, -28, -17));
  const fly = ease.inOut(prog(u, -21, 0));
  const back = ease.inOut(prog(u, 0, 38));
  const tx = mix(0, 960 - (x0 + gx), fly) + mix(0, -40, back);
  const ty = -38 * lift * (1 - fly) + mix(0, 540 - (top + gy), fly) + mix(0, -30, back);
  const scale = mix(1, 1.12, lift) * mix(1, 3.3, fly) * mix(1, 0.42, back);
  const ry = 30 * fly + 34 * back + 6 * Math.sin(u / 9);
  const rx = -16 * fly - 10 * back;
  const rz = -9 * lift + 15 * fly + 12 * back;
  const pink = lift;
  const color = mixHex('#ffffff', PINK, pink);
  const opacity = 1 - prog(u, 16, 38);
  const pts = PLATE.map(([x, y]) => `${(x * S).toFixed(1)},${(y * S).toFixed(1)}`).join(' ');
  const clip = `polygon(${PLATE.map(([x, y]) => `${(x * S).toFixed(1)}px ${(y * S).toFixed(1)}px`).join(',')})`;
  const glow = pink * (1 - back) * 0.5;
  return (
    <div style={{position: 'absolute', inset: 0, perspective: 1400, perspectiveOrigin: '960px 540px', opacity, pointerEvents: 'none'}}>
      {glow > 0.01 ? <Glow x={x0 + gx + tx} y={top + gy + ty} size={260 * scale} color={PINK} opacity={glow} /> : null}
      <div
        style={{
          position: 'absolute',
          left: x0,
          top,
          width: 0.6 * S,
          height: S,
          transformOrigin: `${gx}px ${gy}px`,
          transform: `translate(${tx}px, ${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`,
        }}
      >
        <svg width={0.6 * S} height={S} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: pink}}>
          <defs>
            <linearGradient id="bshard-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={PINK} stopOpacity={0.34} />
              <stop offset="0.55" stopColor={PINK} stopOpacity={0.08} />
              <stop offset="1" stopColor="#ffffff" stopOpacity={0.22} />
            </linearGradient>
          </defs>
          <polygon points={pts} fill="url(#bshard-g)" stroke={rgba(PINK, 0.95)} strokeWidth={1.6} strokeLinejoin="round" />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: S,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color,
            clipPath: clip,
            whiteSpace: 'pre',
          }}
        >
          y
        </div>
      </div>
    </div>
  );
};
