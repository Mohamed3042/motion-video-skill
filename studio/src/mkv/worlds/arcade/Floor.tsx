// The arcade floor: a scintillating grid (Schrauf, Lingelbach & Wist 1997) laid in perspective.
// Real configuration only: mid-gray bars on black, white discs (≈1.5× bar width) on every intersection.
// The dark dots that flicker inside the white discs are not drawn anywhere; the visual system adds them.
import React from 'react';
import {W} from '../../brand';

export const HORIZON = 660;
const F = 300; // focal length (px), wide lens so the near rows look down steeply; camera height = 1 world unit
const S = 0.32; // grid period (world units)
const B = 0.03; // bar half-width  → bar ≈ 19 % of the period
const RHO = 0.046; // disc radius     → disc ≈ 1.5 × bar width
const Z0 = 0.5;
const Z1 = 6;
const GRAY = '#808080';

const sy = (z: number) => HORIZON + F / z;
const sx = (X: number, z: number) => W / 2 + (F * X) / z;

export const Floor: React.FC<{scroll: number}> = ({scroll}) => {
  const bars: React.ReactNode[] = [];
  const discs: React.ReactNode[] = [];
  const phase = scroll - Math.floor(scroll);
  const rows: number[] = [];
  for (let n = 0; ; n++) {
    const z = (n + 1 - phase) * S;
    if (z > Z1) break;
    if (z >= Z0 - B) rows.push(z);
  }
  for (const z of rows) {
    const y0 = sy(z + B);
    bars.push(<rect key={`h${z.toFixed(4)}`} x={0} y={y0} width={W} height={sy(z - B) - y0} fill={GRAY} />);
  }
  for (let j = -40; j <= 40; j++) {
    const X = j * S;
    bars.push(
      <polygon
        key={`v${j}`}
        points={`${sx(X - B, Z0)},${sy(Z0)} ${sx(X + B, Z0)},${sy(Z0)} ${sx(X + B, Z1)},${sy(Z1)} ${sx(X - B, Z1)},${sy(Z1)}`}
        fill={GRAY}
      />,
    );
  }
  for (const z of rows) {
    if (z > 4.6) continue;
    const cy = (sy(z + RHO) + sy(z - RHO)) / 2;
    const ry = (sy(z - RHO) - sy(z + RHO)) / 2;
    const rx = (F * RHO) / z;
    const jMax = Math.min(40, Math.ceil((W / 2 + rx) / ((F * S) / z)));
    for (let j = -jMax; j <= jMax; j++) discs.push(<ellipse key={`d${j}${z.toFixed(4)}`} cx={sx(j * S, z)} cy={cy} rx={rx} ry={ry} fill="#fff" />);
  }
  return (
    <svg width={W} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id="arcade-floor-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={1} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <clipPath id="arcade-floor-clip">
          <rect x={0} y={HORIZON} width={W} height={1080 - HORIZON} />
        </clipPath>
      </defs>
      <g clipPath="url(#arcade-floor-clip)">
        {bars}
        {discs}
      </g>
      <rect x={0} y={HORIZON} width={W} height={150} fill="url(#arcade-floor-fade)" />
    </svg>
  );
};
