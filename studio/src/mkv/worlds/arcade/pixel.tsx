// Pixel-art kit for the Arcade: Press Start 2P, a 6 px pixel grid, crisp-edged sprites (no smooth scaling).
import React from 'react';
import {loadFont} from '@remotion/google-fonts/PressStart2P';

export const PIXEL = loadFont('normal', {weights: ['400'], subsets: ['latin']}).fontFamily;
export const P = 6; // one chunky pixel
export const snap = (v: number, p = P) => Math.round(v / p) * p;

export const Y = '#FFE14D';
export const PAL: Record<string, string> = {
  Y,
  O: '#FF9F1C',
  W: '#FFFFFF',
  K: '#000000',
  G: '#1ED760',
  D: '#7a5a00',
  S: '#8a8a8a',
};

// Bitmap sprite from rows of palette chars ('.' = transparent); horizontal runs merged into one rect each.
export const Sprite: React.FC<{art: string[]; x: number; y: number; px?: number; pal?: Record<string, string>; style?: React.CSSProperties}> = ({
  art,
  x,
  y,
  px = P,
  pal = PAL,
  style,
}) => {
  const rects: React.ReactNode[] = [];
  art.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const ch = row[c];
      if (ch === '.') {
        c++;
        continue;
      }
      let e = c;
      while (e < row.length && row[e] === ch) e++;
      rects.push(<rect key={`${r}-${c}`} x={c * px} y={r * px} width={(e - c) * px} height={px} fill={pal[ch]} />);
      c = e;
    }
  });
  const w = Math.max(...art.map((a) => a.length)) * px;
  return (
    <svg width={w} height={art.length * px} shapeRendering="crispEdges" style={{position: 'absolute', left: snap(x, px), top: snap(y, px), overflow: 'visible', ...style}}>
      {rects}
    </svg>
  );
};

export const ART = {
  cursor: [
    'K.........',
    'KK........',
    'KYK.......',
    'KWYK......',
    'KWYYK.....',
    'KWYYYK....',
    'KWYYYYK...',
    'KWYYYYYK..',
    'KWYYYYYYK.',
    'KWYYKKKKK.',
    'KYKYYK....',
    'KK.KYYK...',
    'K...KYK...',
    '....KK....',
  ],
  marker: ['YYYYYYYYY', '.YYYYYYY.', '..YYYYY..', '...YYY...', '....Y....'],
  check: ['......GG', '.....GG.', 'GG..GG..', '.GGGG...', '..GG....'],
  star: ['..W..', '..Y..', 'WYWYW', '..Y..', '..W..'],
  coin: [
    ['..YYYY..', '.YWYYYY.', 'YWYYYYOY', 'YWYYYYOY', 'YWYYYYOY', 'YWYYYYOY', '.YYYYOY.', '..YYYY..'],
    ['...YY...', '..YWYY..', '..WYYO..', '..WYYO..', '..WYYO..', '..WYYO..', '..YYOY..', '...YY...'],
    ['...YY...', '...WY...', '...WO...', '...WO...', '...WO...', '...WO...', '...YO...', '...YY...'],
    ['...YY...', '..YYWY..', '..OYYW..', '..OYYW..', '..OYYW..', '..OYYW..', '..YOYY..', '...YY...'],
  ],
  arrow: ['Y...', 'YY..', 'YYY.', 'YY..', 'Y...'],
  wrench: ['.....YY.', '....Y..Y', '....Y.YY', '...YYYY.', '..YYY...', '.YYY....', 'YYY.....', 'YY......'],
  sliders: ['.Y....Y.', '.Y...YYY', 'YYY...Y.', '.Y....Y.', '.Y....Y.', '.Y..YYY.', '.Y....Y.', '.Y....Y.'],
  lens: ['.YYYY...', 'Y....Y..', 'Y....Y..', 'Y....Y..', 'Y....Y..', '.YYYYYY.', '......YY', '.......Y'],
};

// Notched pixel box (clipped corners), the arcade's panel/tile shape.
export const notch = (n = P) =>
  `polygon(${n}px 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, ${n}px 100%, 0 calc(100% - ${n}px), 0 ${n}px)`;

export const PixelText: React.FC<{size: 16 | 24 | 32 | 48 | 64 | 96; color?: string; glow?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
  size,
  color = Y,
  glow = 0.55,
  style,
  children,
}) => (
  <div
    style={{
      fontFamily: PIXEL,
      fontSize: size,
      lineHeight: 1,
      color,
      whiteSpace: 'pre',
      textShadow: glow > 0 ? `0 0 ${Math.round(size * 0.35)}px rgba(255,225,77,${glow})` : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);
