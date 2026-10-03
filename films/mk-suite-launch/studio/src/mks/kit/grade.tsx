// Global finish: vignette + very fine grain (a small soft tile, shifted per frame). Used once by the shell.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {mulberry32} from '../timing';

const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.2'/></filter><rect width='220' height='220' filter='url(#n)'/></svg>`,
  );

export const Grade: React.FC<{f: number; grain?: number; vignette?: number}> = ({f, grain = 0.035, vignette = 0.55}) => {
  const r = mulberry32(Math.floor(f / 2) * 7919 + 3);
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)`, pointerEvents: 'none'}} />
      <AbsoluteFill style={{backgroundImage: `url("${NOISE}")`, backgroundPosition: `${Math.floor(r() * 220)}px ${Math.floor(r() * 220)}px`, opacity: grain, mixBlendMode: 'overlay', pointerEvents: 'none'}} />
    </>
  );
};
