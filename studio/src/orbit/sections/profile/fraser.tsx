// The Fraser spiral, built honestly: CONCENTRIC circles, each drawn as a "twisted cord" of short tiles that
// alternate light/dark and are tilted by `twist` from the circle's tangent, over a log-polar checkerboard.
// The tilt makes the circles read as one inward spiral. twist → 0 untwists the cords: plain circles.
import React from 'react';
import {C} from '../../brand';

export const CX = 960;
export const CY = 540;
const Q = 1.17; // ring-to-ring radius ratio (log spacing keeps every ring self-similar)
const R0 = 34;
const NR = 24;
const NT = 56; // tiles per ring (even → light/dark alternate cleanly)
const M = 32; // background sectors
export const RADII = Array.from({length: NR}, (_, k) => R0 * Q ** k);
export const TRACE_RING = 12; // the ring the highlight traces (r ≈ 223 px before zoom)
const TAU = Math.PI * 2;

const pt = (r: number, a: number) => `${(CX + r * Math.cos(a)).toFixed(1)} ${(CY + r * Math.sin(a)).toFixed(1)}`;

// log-polar checkerboard (static): cells between the cords, shifted half a cell per ring → spiral bands
const BG = (() => {
  let d = '';
  for (let k = 0; k <= NR; k++) {
    const r0 = R0 * Q ** (k - 0.5);
    const r1 = R0 * Q ** (k + 0.5);
    const off = (k * TAU) / M / 2;
    for (let i = 0; i < M; i++) {
      if ((i + k) % 2) continue;
      const a0 = off + (i * TAU) / M;
      const a1 = a0 + TAU / M;
      d += `M${pt(r0, a0)}L${pt(r1, a0)}A${r1.toFixed(1)} ${r1.toFixed(1)} 0 0 1 ${pt(r1, a1)}L${pt(r0, a1)}A${r0.toFixed(1)} ${r0.toFixed(1)} 0 0 0 ${pt(r0, a0)}Z`;
    }
  }
  return d;
})();

// cord tiles for one twist profile; twistOf(k) gives each ring's tilt (radians)
const cords = (twistOf: (k: number) => number): [string, string] => {
  let light = '';
  let dark = '';
  for (let k = 0; k < NR; k++) {
    const r = RADII[k];
    const w = r * 0.05;
    const tw = twistOf(k);
    const len = ((TAU * r) / NT) * 1.02;
    for (let i = 0; i < NT; i++) {
      const th = ((i + 0.5 * (k % 2)) * TAU) / NT;
      const cx = CX + r * Math.cos(th);
      const cy = CY + r * Math.sin(th);
      const ax = th + Math.PI / 2 + tw; // tile long axis = tangent rotated by the twist
      const ux = (Math.cos(ax) * len) / 2;
      const uy = (Math.sin(ax) * len) / 2;
      const vx = (-Math.sin(ax) * w) / 2;
      const vy = (Math.cos(ax) * w) / 2;
      const d = `M${(cx - ux - vx).toFixed(1)} ${(cy - uy - vy).toFixed(1)}L${(cx + ux - vx).toFixed(1)} ${(cy + uy - vy).toFixed(1)}L${(cx + ux + vx).toFixed(1)} ${(cy + uy + vy).toFixed(1)}L${(cx - ux + vx).toFixed(1)} ${(cy - uy + vy).toFixed(1)}Z`;
      if (i % 2) dark += d;
      else light += d;
    }
  }
  return [light, dark];
};

export const Fraser: React.FC<{
  twistOf: (k: number) => number;
  rot: number; // deg
  scale: number;
  reveal: number; // px radius of the entrance mask
  bgA: string;
  bgB: string;
  lightCol?: string;
  darkCol?: string;
  children?: React.ReactNode; // drawn inside the same transform (e.g. the trace)
}> = ({twistOf, rot, scale, reveal, bgA, bgB, lightCol = C.ink, darkCol = C.deep, children}) => {
  const [light, dark] = cords(twistOf);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <radialGradient id="fr-mask-g" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={Math.max(1, reveal)}>
          <stop offset="0.82" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id="fr-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <rect width={1920} height={1080} fill="url(#fr-mask-g)" />
        </mask>
      </defs>
      <rect width={1920} height={1080} fill={bgB} />
      <g mask="url(#fr-mask)">
        <g transform={`translate(${CX} ${CY}) rotate(${rot}) scale(${scale}) translate(${-CX} ${-CY})`}>
          <path d={BG} fill={bgA} />
          <path d={light} fill={lightCol} />
          <path d={dark} fill={darkCol} />
          {children}
        </g>
      </g>
    </svg>
  );
};
