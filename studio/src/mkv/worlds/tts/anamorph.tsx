// Anamorphic typography: "Type it. Hear it." is cut into triangular glass shards, each pushed to its own
// depth Z and scaled by (P - Z) / P about the perspective origin. From the one camera pose (yaw = pitch = 0)
// every shard projects back onto its exact place in the phrase; anywhere else it is a scattered 3D sculpture.
import React from 'react';
import {loadFont} from '@remotion/google-fonts/InstrumentSerif';
import {ACCENT, FONT} from '../../brand';
import {mulberry32} from '../../timing';
import {T} from './timing';
import {clamp, ease, mix, mixHex, prog, rgba} from '../live/util';

export const SERIF = loadFont('italic', {weights: ['400'], subsets: ['latin']}).fontFamily;

const PINK = ACCENT.tts;
export const P = 1500; // camera distance (CSS perspective)
const ZP = -950; // orbit pivot depth
const CX = 960;
const CY = 540;

// ---- camera: one smooth pass through the exact viewpoint on T.align ----
// |f - A|^1.5 keeps velocity at 0 on the frame but still converges visibly until the last few frames.
export const camera = (f: number) => {
  const d = f - T.align;
  const a = Math.abs(d) ** 1.5;
  const yaw = d < 0 ? -0.0264 * a : 0.0175 * a; // -40deg at f=-12, +22deg two seconds later
  const pitch = d < 0 ? 0.0105 * a : -0.0078 * a;
  return {yaw, pitch};
};

// ---- shards: jittered grid over the phrase, each quad split into two triangles ----
const BOX = {x0: 196, x1: 1724, y0: 404, y1: 676};
const COLS = 14;
const ROWS = 3;
type Shard = {
  bx: number;
  by: number;
  bw: number;
  bh: number;
  pts: [number, number][];
  inner: boolean[]; // edge i (pts[i] -> pts[i+1]) is an interior crack (not on the phrase box outline)
  fill: number; // plate opacity falls off toward the box edges so the aligned plates read as a soft glow, not a box
  z: number;
  k: number;
  dn: number; // normalized depth (0 near .. 1 far) for fog away from the viewpoint
  glint: number;
  tint: number;
};

const SHARDS: Shard[] = (() => {
  const r = mulberry32(4040);
  const cw = (BOX.x1 - BOX.x0) / COLS;
  const ch = (BOX.y1 - BOX.y0) / ROWS;
  const V: [number, number][][] = [];
  for (let j = 0; j <= ROWS; j++) {
    V.push([]);
    for (let i = 0; i <= COLS; i++) {
      const jx = i > 0 && i < COLS ? (r() - 0.5) * 0.7 * cw : 0;
      const jy = j > 0 && j < ROWS ? (r() - 0.5) * 0.6 * ch : 0;
      V[j].push([BOX.x0 + i * cw + jx, BOX.y0 + j * ch + jy]);
    }
  }
  const out: Shard[] = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const a = V[j][i];
      const b = V[j][i + 1];
      const c = V[j + 1][i + 1];
      const d = V[j + 1][i];
      const tris: [number, number][][] = r() < 0.5 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      for (const tri of tris) {
        const xs = tri.map((p) => p[0]);
        const ys = tri.map((p) => p[1]);
        const bx = Math.floor(Math.min(...xs)) - 2;
        const by = Math.floor(Math.min(...ys)) - 2;
        const z = -2300 + r() * 2700;
        const onEdge = (p: [number, number]) => p[0] === BOX.x0 || p[0] === BOX.x1 || p[1] === BOX.y0 || p[1] === BOX.y1;
        const sameSide = (p: [number, number], q: [number, number]) =>
          (p[0] === q[0] && (p[0] === BOX.x0 || p[0] === BOX.x1)) || (p[1] === q[1] && (p[1] === BOX.y0 || p[1] === BOX.y1));
        const mx = (xs[0] + xs[1] + xs[2]) / 3;
        const my = (ys[0] + ys[1] + ys[2]) / 3;
        const ex = (mx - CX) / ((BOX.x1 - BOX.x0) / 2);
        const ey = (my - CY) / ((BOX.y1 - BOX.y0) / 2);
        out.push({
          bx,
          by,
          bw: Math.ceil(Math.max(...xs)) + 2 - bx,
          bh: Math.ceil(Math.max(...ys)) + 2 - by,
          pts: tri.map(([x, y]) => [x - bx, y - by] as [number, number]),
          inner: tri.map((p, e) => !(onEdge(p) && onEdge(tri[(e + 1) % 3]) && sameSide(p, tri[(e + 1) % 3]))),
          fill: clamp(1.1 - Math.sqrt(ex * ex * 0.8 + ey * ey * 1.6)),
          z,
          k: (P - z) / P,
          dn: (400 - z) / 2700,
          glint: 0.7 + r() * 2.2,
          tint: r(),
        });
      }
    }
  }
  return out;
})();

const DUST = (() => {
  const r = mulberry32(4141);
  return Array.from({length: 70}, () => ({x: (r() - 0.5) * 3000, y: (r() - 0.5) * 1700, z: -2600 + r() * 3000, s: 4 + r() * 9, o: 0.25 + r() * 0.6}));
})();

// The phrase, laid out identically inside every shard (screen coordinates).
const Phrase: React.FC<{flash: number}> = ({flash}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{display: 'flex', alignItems: 'baseline', gap: 46, whiteSpace: 'pre', transform: 'translateY(-6px)'}}>
      <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 178, lineHeight: 1, letterSpacing: '-0.045em', color: mixHex('#FFD4E7', '#ffffff', flash)}}>Type it.</span>
      <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: 222, lineHeight: 1, letterSpacing: '-0.01em', color: mixHex(PINK, '#ffffff', flash * 0.6)}}>Hear it.</span>
    </div>
  </div>
);

export const ShardField: React.FC<{f: number}> = ({f}) => {
  const {yaw, pitch} = camera(f);
  const t = f - T.align;
  const flash = t >= 0 ? Math.exp(-t / 9) : 0;
  const near = clamp(1 - Math.abs(yaw) / 3); // how close to the viewpoint we are (crack lines soften)
  const yr = (yaw * Math.PI) / 180;
  const pr = (pitch * Math.PI) / 180;
  return (
    <div style={{position: 'absolute', inset: 0, perspective: P, perspectiveOrigin: `${CX}px ${CY}px`}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transformOrigin: `${CX}px ${CY}px ${ZP}px`,
          transform: `rotateX(${pitch}deg) rotateY(${yaw}deg)`,
        }}
      >
        {DUST.map((d, i) => (
          <div
            key={`d${i}`}
            style={{
              position: 'absolute',
              left: CX + d.x - d.s / 2,
              top: CY + d.y - d.s / 2,
              width: d.s,
              height: d.s,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${rgba('#ffffff', d.o)} 0%, ${rgba(PINK, d.o * 0.5)} 40%, ${rgba(PINK, 0)} 72%)`,
              transform: `translateZ(${d.z}px)`,
            }}
          />
        ))}
        {SHARDS.map((s, i) => {
          const g = Math.max(0, Math.cos(yr * 2.2 + pr * 1.6 - s.glint)) ** 24;
          const plate = mix(0.55, 0.1, near) + mix(0.45, 0.9, near) * s.fill;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: s.bx,
                top: s.by,
                width: s.bw,
                height: s.bh,
                opacity: 1 - 0.5 * s.dn * (1 - near),
                transformOrigin: `${CX - s.bx}px ${CY - s.by}px`,
                transform: `translateZ(${s.z.toFixed(1)}px) scale(${s.k.toFixed(5)})`,
                clipPath: `polygon(${s.pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: plate,
                  background: `linear-gradient(${120 + s.tint * 90}deg, ${rgba(PINK, 0.2 + 0.1 * s.tint)} 0%, ${rgba(PINK, 0.04)} 60%, ${rgba('#ffffff', 0.1)} 100%)`,
                }}
              />
              <div style={{position: 'absolute', left: -s.bx, top: -s.by, width: 1920, height: 1080}}>
                <Phrase flash={flash} />
              </div>
              <div style={{position: 'absolute', inset: 0, background: rgba('#ffffff', 0.55 * g)}} />
              <svg width={s.bw} height={s.bh} style={{position: 'absolute', left: 0, top: 0}}>
                {s.pts.map((p, e) => {
                  const q = s.pts[(e + 1) % 3];
                  const a = s.inner[e] ? mix(0.85, 0.28, near) * mix(1, s.fill, near) : 0.85 * (1 - near);
                  return a > 0.01 ? <line key={e} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={rgba(PINK, a)} strokeWidth={2.4} strokeLinecap="round" /> : null;
                })}
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const fieldOpacity = (f: number) => ease.cubicOut(prog(f, 0, 26)) * (1 - 0.72 * ease.inOut(prog(f, 168, 214)));
