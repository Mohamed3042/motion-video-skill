// The abstract test scene (dusk lake, headland with a mast, sun) used by the color match, the finishing tools,
// the exit film strip and the thumbnails. Geometry is analytic so `sceneColor` can sample it for the mosaic.
import React from 'react';
import {mix, mixHex} from './kit';

export type Pal = {skyTop: string; skyMid: string; horizon: string; sun: string; glow: string; far: string; mid: string; near: string; water: string; waterLo: string; hi: string};

// reference grade (dusk violet → amber)
export const REF: Pal = {skyTop: '#170f2e', skyMid: '#5a3480', horizon: '#f2a35c', sun: '#fff1d2', glow: '#ffb468', far: '#4b2f6a', mid: '#2b1c44', near: '#120c1e', water: '#3a2550', waterLo: '#120c1e', hi: '#ffd08a'};
// ungraded source (flat, cool, green cast)
export const SRC: Pal = {skyTop: '#1c2b2c', skyMid: '#3d5f5b', horizon: '#9fbca5', sun: '#eef5e6', glow: '#b9d6c0', far: '#3a5450', mid: '#26393a', near: '#142021', water: '#2d4544', waterLo: '#142021', hi: '#d5e8da'};
// film finish: richer curves + saturation
export const FILM: Pal = {skyTop: '#120a26', skyMid: '#62308c', horizon: '#ff9a48', sun: '#fff4dc', glow: '#ffa95a', far: '#47265f', mid: '#22143a', near: '#0b0714', water: '#3c2152', waterLo: '#0b0714', hi: '#ffd28a'};

export const mixPal = (a: Pal, b: Pal, t: number): Pal => {
  const o = {} as Pal;
  (Object.keys(a) as (keyof Pal)[]).forEach((k) => (o[k] = mixHex(a[k], b[k], t)));
  return o;
};

export const SW = 1600;
export const SH = 900;
const HOR = 640; // waterline
export const SUN = {x: 1050, y: 468, r: 64};
export const MAST = {x: 300, h: 236};
const yFar = (x: number) => 548 + 26 * Math.sin(x / 170 + 0.6) + 12 * Math.sin(x / 61 + 1.9);
const yMid = (x: number) => 604 + 20 * Math.sin(x / 260 + 2.4) + 8 * Math.sin(x / 83 + 0.7);
const yNear = (x: number) => 512 + 0.0011 * (x - 260) ** 2;
// sun reflection streaks on the water: [y, half width]
const STREAKS = Array.from({length: 11}, (_, i) => [HOR + 14 + i * 21 + (i * i) % 7, 70 - i * 4.2 + ((i * 37) % 13)] as const);

const path = (fn: (x: number) => number, bottom: number, x0 = 0, x1 = SW) => {
  let d = `M${x0} ${bottom}`;
  for (let x = x0; x <= x1; x += 20) d += ` L${x} ${fn(x).toFixed(1)}`;
  return d + ` L${x1} ${bottom} Z`;
};
const FAR = path(yFar, HOR);
const MID = path(yMid, HOR);
const NEAR = path(yNear, SH + 2, 0, 860);
const mastTop = yNear(MAST.x) - MAST.h;

export const Scene: React.FC<{p: Pal; w: number; h: number; uid: string; style?: React.CSSProperties; children?: React.ReactNode}> = ({p, w, h, uid, style, children}) => (
  <svg width={w} height={h} viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="xMidYMid slice" style={{display: 'block', ...style}}>
    <defs>
      <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.skyTop} />
        <stop offset="0.52" stopColor={p.skyMid} />
        <stop offset="1" stopColor={p.horizon} />
      </linearGradient>
      <linearGradient id={`wat${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={p.water} />
        <stop offset="1" stopColor={p.waterLo} />
      </linearGradient>
      <radialGradient id={`glo${uid}`}>
        <stop offset="0" stopColor={p.glow} stopOpacity={0.75} />
        <stop offset="0.35" stopColor={p.glow} stopOpacity={0.25} />
        <stop offset="1" stopColor={p.glow} stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={SW} height={HOR} fill={`url(#sky${uid})`} />
    <circle cx={SUN.x} cy={SUN.y} r={320} fill={`url(#glo${uid})`} />
    <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill={p.sun} />
    <path d={FAR} fill={p.far} />
    <path d={MID} fill={p.mid} />
    <rect x={0} y={HOR} width={SW} height={SH - HOR} fill={`url(#wat${uid})`} />
    {STREAKS.map(([y, hw], i) => (
      <rect key={i} x={SUN.x - hw} y={y} width={hw * 2} height={5} rx={2.5} fill={p.hi} opacity={0.75 - i * 0.05} />
    ))}
    <path d={NEAR} fill={p.near} />
    <path d={`M${MAST.x - 13} ${yNear(MAST.x) + 4} L${MAST.x - 2} ${mastTop} L${MAST.x + 2} ${mastTop} L${MAST.x + 13} ${yNear(MAST.x) + 4} Z`} fill={p.near} />
    <circle cx={MAST.x} cy={mastTop - 6} r={6} fill={p.hi} />
    {children}
  </svg>
);

// Analytic colour of the scene at scene coords (x, y): mirrors <Scene> (used for the low-res mosaic).
const hx = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const lerp3 = (a: number[], b: number[], t: number) => a.map((v, i) => mix(v, b[i], t));
export const sceneColor = (x: number, y: number, p: Pal) => {
  if (y >= yNear(x) && x < 860) return p.near;
  if (Math.abs(x - MAST.x) < 2 + (13 * (y - mastTop)) / MAST.h && y > mastTop) return p.near;
  if (y >= HOR) {
    for (const [sy, hw] of STREAKS) if (y >= sy - 4 && y <= sy + 9 && Math.abs(x - SUN.x) < hw) return mixHex(p.water, p.hi, 0.55);
    return toHex(lerp3(hx(p.water), hx(p.waterLo), (y - HOR) / (SH - HOR)));
  }
  if (y >= yMid(x)) return p.mid;
  if (y >= yFar(x)) return p.far;
  const d = Math.hypot(x - SUN.x, y - SUN.y);
  if (d < SUN.r) return p.sun;
  const u = y / HOR;
  let c = u < 0.52 ? lerp3(hx(p.skyTop), hx(p.skyMid), u / 0.52) : lerp3(hx(p.skyMid), hx(p.horizon), (u - 0.52) / 0.48);
  const g = d < 320 ? (d < 112 ? mix(0.75, 0.25, d / 112) : mix(0.25, 0, (d - 112) / 208)) : 0;
  c = lerp3(c, hx(p.glow), g);
  return toHex(c);
};

// Low-res mosaic of the scene (nearest-neighbour look), `n` columns, rendered at w × h.
export const Mosaic: React.FC<{p: Pal; w: number; h: number; n: number; style?: React.CSSProperties}> = ({p, w, h, n, style}) => {
  const m = Math.round((n * SH) / SW);
  const bw = SW / n;
  const bh = SH / m;
  const cells: React.ReactNode[] = [];
  for (let j = 0; j < m; j++)
    for (let i = 0; i < n; i++) cells.push(<rect key={j * n + i} x={i * bw} y={j * bh} width={bw + 0.6} height={bh + 0.6} fill={sceneColor((i + 0.5) * bw, (j + 0.5) * bh, p)} />);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" style={{display: 'block', ...style}}>
      {cells}
    </svg>
  );
};
