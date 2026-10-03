// COLOR BALANCE · REFERENCE COLOR MATCH.
// 1) Adelson's checker-shadow: square A (dark, lit) and square B (light, in the cylinder's shadow) are painted
//    with the SAME value (#787878). An eyedropper reads both, a bridge of that exact value joins them and a
//    luma scope traced along A→B (computed from the same geometry) puts both on one line.
// 2) A split-frame match: the source half takes on the reference's color until the seam disappears.
import React from 'react';
import {C, FONT, MONO} from '../../brand';
import {Btn, Chip, Eyebrow, Message, Panel, Select, Slider, ToolLabel, VIO, clamp, ease, mix, prog, rgba} from './kit';
import {REF, SRC, Scene, mixPal} from './scene';
import {T} from './timing';

// ---------------------------------------------------------------- board geometry ----
const N = 6;
const HW = 90; // half width of a square's diamond
const HH = 52; // half height
const CX = 800;
const TOP = 230;
const THICK = 34;
const P = (u: number, v: number): [number, number] => [CX + (u - v) * HW, TOP + (u + v) * HH];
const pts = (a: [number, number][]) => a.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');

// the four exact values: B (light, shadowed) === A (dark, lit)
export const LIT_L = '#c8c8c8';
export const SAME = '#787878';
const SH_D = '#484848';
const isLight = (i: number, j: number) => (i + j) % 2 === 0;
export const A_IJ = [0, 1] as const;
export const B_IJ = [3, 3] as const;
export const A_XY = P(A_IJ[0] + 0.5, A_IJ[1] + 0.5); // (710, 334)
export const B_XY = P(B_IJ[0] + 0.5, B_IJ[1] + 0.5); // (800, 594)

// cylinder right of B; light from the right, so its shadow falls straight left (screen space)
const CYL = {u: 4.91, v: 2.09, r: 0.9, h: 262};
const [CCX, CCY] = P(CYL.u, CYL.v);
const RX = CYL.r * HW * Math.SQRT2;
const RY = CYL.r * HH * Math.SQRT2;
const X_END = 120;
// top / bottom shadow boundary (screen y) at screen x: widening with distance from the cylinder
const shTop = (x: number) => CCY - RY - 0.15 * (CCX - x);
const shBot = (x: number) => CCY + RY + 0.236 * (CCX - x);
const SHADOW = pts([[CCX, shTop(CCX)], [CCX, shBot(CCX)], [X_END, shBot(X_END)], [X_END, shTop(X_END)]]);
const PEN = 14; // penumbra (mask blur sigma, px)

const squares = (lit: boolean) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const light = isLight(i, j);
      const fill = lit ? (light ? LIT_L : SAME) : light ? SAME : SH_D;
      out.push(<polygon key={`${i}-${j}`} points={pts([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)])} fill={fill} />);
    }
  return out;
};
// front faces of the board slab: alternating to continue the checker
const faces = (lit: boolean) => {
  const out: React.ReactNode[] = [];
  for (let k = 0; k < N; k++) {
    const l = isLight(k, N - 1);
    const a = P(k, N);
    const b = P(k + 1, N);
    out.push(<polygon key={`L${k}`} points={pts([a, b, [b[0], b[1] + THICK], [a[0], a[1] + THICK]])} fill={lit ? (l ? '#8a8a8a' : '#4a4a4a') : l ? '#4f4f4f' : '#2a2a2a'} />);
    const c = P(N, k);
    const d = P(N, k + 1);
    const r = isLight(N - 1, k);
    out.push(<polygon key={`R${k}`} points={pts([c, d, [d[0], d[1] + THICK], [c[0], c[1] + THICK]])} fill={lit ? (r ? '#a4a4a4' : '#5c5c5c') : r ? '#5e5e5e' : '#363636'} />);
  }
  return out;
};

export const Board: React.FC<{uid?: string}> = ({uid = 'b'}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
    <defs>
      <filter id={`pen${uid}`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={PEN} />
      </filter>
      <mask id={`shm${uid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
        <rect x={0} y={0} width={1920} height={1080} fill="black" />
        <g filter={`url(#pen${uid})`}>
          <polygon points={SHADOW} fill="white" />
        </g>
      </mask>
      <linearGradient id={`cyl${uid}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#2c1d40" />
        <stop offset="0.35" stopColor="#5d3f86" />
        <stop offset="0.74" stopColor="#c9a6f2" />
        <stop offset="0.86" stopColor="#e2cdfa" />
        <stop offset="1" stopColor="#9a74c6" />
      </linearGradient>
      <linearGradient id={`cylt${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#a985d4" />
        <stop offset="1" stopColor="#e8d6fb" />
      </linearGradient>
      <radialGradient id={`ao${uid}`}>
        <stop offset="0.55" stopColor="#000" stopOpacity={0.55} />
        <stop offset="1" stopColor="#000" stopOpacity={0} />
      </radialGradient>
    </defs>
    {/* lit board, then the same board in shadow values revealed through the soft-edged shadow mask */}
    {squares(true)}
    {faces(true)}
    <g mask={`url(#shm${uid})`}>
      {squares(false)}
      {faces(false)}
    </g>
    {/* cylinder */}
    <ellipse cx={CCX} cy={CCY + 4} rx={RX * 1.12} ry={RY * 1.12} fill={`url(#ao${uid})`} />
    <path d={`M${CCX - RX} ${CCY - CYL.h} L${CCX - RX} ${CCY} A${RX} ${RY} 0 0 0 ${CCX + RX} ${CCY} L${CCX + RX} ${CCY - CYL.h} Z`} fill={`url(#cyl${uid})`} />
    <ellipse cx={CCX} cy={CCY - CYL.h} rx={RX} ry={RY} fill={`url(#cylt${uid})`} />
    {/* the letters (Adelson's labels) */}
    {[['A', A_XY], ['B', B_XY]].map(([l, [x, y]]) => (
      <text key={l as string} x={x as number} y={(y as number) + 14} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill="#f4f4f4">
        {l as string}
      </text>
    ))}
  </svg>
);

// ---------------------------------------------------------------- luma along the line A → B (from the geometry) ----
const PROFILE = (() => {
  const s0 = -0.12;
  const s1 = 1.8;
  const n = 260;
  const out: {s: number; y: number}[] = [];
  const sm = (d: number) => clamp(0.5 + d / (2.5 * PEN)); // ≈ the mask's Gaussian penumbra
  for (let k = 0; k <= n; k++) {
    const s = mix(s0, s1, k / n);
    const x = mix(A_XY[0], B_XY[0], s);
    const y = mix(A_XY[1], B_XY[1], s);
    const d = (x - CX) / HW;
    const e = (y - TOP) / HH;
    const i = Math.min(N - 1, Math.max(0, Math.floor((d + e) / 2)));
    const j = Math.min(N - 1, Math.max(0, Math.floor((e - d) / 2)));
    const base = isLight(i, j) ? 200 : 120;
    const shade = sm(y - shTop(x)) * sm(shBot(x) - y);
    out.push({s: (s - s0) / (s1 - s0), y: base * (1 - 0.4 * shade)});
  }
  return {pts: out, sA: (0 - s0) / (s1 - s0), sB: (1 - s0) / (s1 - s0)};
})();

const SCOPE = {w: 380, h: 230};
const Scope: React.FC<{f: number}> = ({f}) => {
  const draw = ease.inOut(prog(f, T.bridge, T.proof - 4));
  const sy = (y: number) => SCOPE.h - 16 - (y / 255) * (SCOPE.h - 32);
  const d = PROFILE.pts.map((p, k) => `${k ? 'L' : 'M'}${(p.s * SCOPE.w).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ');
  const proof = f >= T.proof ? 1 : 0;
  const pk = f >= T.proof ? Math.exp(-(f - T.proof) / 12) : 0;
  const mark = (s: number, l: string) => {
    const on = clamp((draw - s) * 12);
    if (on <= 0) return null;
    return (
      <g opacity={on}>
        <circle cx={s * SCOPE.w} cy={sy(120)} r={7 + 5 * pk} fill={proof ? C.amber : '#ffffff'} />
        <text x={s * SCOPE.w} y={sy(120) - 16} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={20} fill={C.text}>
          {l}
        </text>
      </g>
    );
  };
  return (
    <svg width={SCOPE.w} height={SCOPE.h} style={{display: 'block', overflow: 'visible'}}>
      <rect x={0} y={0} width={SCOPE.w} height={SCOPE.h} rx={6} fill="#0a0c0b" stroke={C.line} />
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={0} x2={SCOPE.w} y1={sy(g * 255)} y2={sy(g * 255)} stroke="rgba(235,234,226,0.08)" />
      ))}
      <path d={d} fill="none" stroke={rgba(VIO, 0.35)} strokeWidth={8} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#efe3ff" strokeWidth={2.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} strokeLinejoin="round" />
      {proof ? (
        <line x1={0} x2={SCOPE.w * clamp((f - T.proof + 2) / 8)} y1={sy(120)} y2={sy(120)} stroke={C.amber} strokeWidth={2.5} strokeDasharray="10 7" />
      ) : null}
      {mark(PROFILE.sA, 'A')}
      {mark(PROFILE.sB, 'B')}
    </svg>
  );
};

const Readout: React.FC<{f: number; at: number; l: string}> = ({f, at, l}) => {
  const k = ease.expoOut(prog(f, at, at + 12));
  const lit = f >= T.proof ? 1 : 0;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 16, height: 46, opacity: clamp((f - at + 1) / 3), transform: `translateX(${(1 - k) * 30}px)`}}>
      <div style={{width: 40, height: 40, borderRadius: 6, background: SAME, border: `1px solid ${lit ? C.amber : C.line}`}} />
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 26, color: C.text, width: 24}}>{l}</div>
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 26, letterSpacing: '0.06em', color: lit ? C.amber : C.text}}>{SAME}</div>
    </div>
  );
};

// eyedropper ring: travels in from the panel, samples A, then B
const Dropper: React.FC<{f: number}> = ({f}) => {
  if (f < 148 || f > 206) return null;
  const toA = ease.inOut(prog(f, 148, T.pickA));
  const toB = ease.inOut(prog(f, T.pickA + 4, T.pickB));
  const x = mix(mix(1380, A_XY[0], toA), B_XY[0], toB);
  const y = mix(mix(560, A_XY[1], toA), B_XY[1], toB);
  const hitA = f >= T.pickA ? Math.exp(-(f - T.pickA) / 6) : 0;
  const hitB = f >= T.pickB ? Math.exp(-(f - T.pickB) / 6) : 0;
  const o = clamp((f - 148) / 5) * (1 - prog(f, 196, 206));
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: o, overflow: 'visible'}}>
      {[[A_XY, hitA], [B_XY, hitB]].map(([p, h], i) =>
        (h as number) > 0.02 ? <circle key={i} cx={(p as number[])[0]} cy={(p as number[])[1]} r={40 + 50 * (1 - (h as number))} fill="none" stroke={C.amber} strokeWidth={3} opacity={h as number} /> : null,
      )}
      <circle cx={x} cy={y} r={40} fill="none" stroke={C.amber} strokeWidth={3.5} />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1={x + 40 * Math.cos((a * Math.PI) / 180)} y1={y + 40 * Math.sin((a * Math.PI) / 180)} x2={x + 54 * Math.cos((a * Math.PI) / 180)} y2={y + 54 * Math.sin((a * Math.PI) / 180)} stroke={C.amber} strokeWidth={3.5} strokeLinecap="round" />
      ))}
    </svg>
  );
};

// the bridge: a bar of the exact same value joining A and B
const Bridge: React.FC<{f: number}> = ({f}) => {
  const grow = ease.inOut(prog(f, T.bridge, T.bridge + 20));
  const back = ease.inOut(prog(f, T.bridgeOff, T.bridgeOff + 14));
  if (grow <= 0 || back >= 1) return null;
  const [ax, ay] = A_XY;
  const [bx, by] = B_XY;
  const a0 = back;
  const a1 = grow;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <line x1={mix(ax, bx, a0)} y1={mix(ay, by, a0)} x2={mix(ax, bx, a1)} y2={mix(ay, by, a1)} stroke={SAME} strokeWidth={56} />
      {/* letters stay on top of the bridge */}
      {[['A', A_XY], ['B', B_XY]].map(([l, [x, y]]) => (
        <text key={l as string} x={x as number} y={(y as number) + 14} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={40} fill="#f4f4f4">
          {l as string}
        </text>
      ))}
    </svg>
  );
};

export const Adelson: React.FC<{f: number}> = ({f}) => {
  const panel = ease.cubicOut(prog(f, 128, 146));
  const proof = f >= T.proof ? Math.exp(-(f - T.proof) / 16) : 0;
  return (
    <>
      <div style={{position: 'absolute', left: 300, top: 160, width: 1000, height: 780, background: `radial-gradient(50% 50% at 50% 55%, ${rgba(VIO, 0.12)} 0%, rgba(0,0,0,0) 70%)`}} />
      <Board />
      <Bridge f={f} />
      <Dropper f={f} />
      <ToolLabel f={f} at={114} out={300} text="COLOR BALANCE · REFERENCE COLOR MATCH" />
      <Panel x={1416} y={196} w={432} h={640} o={panel}>
        <div style={{position: 'absolute', left: 26, top: 24}}>
          <Eyebrow>Scope · luma A → B</Eyebrow>
        </div>
        <div style={{position: 'absolute', left: 26, top: 62}}>
          {f >= T.pickA ? <Readout f={f} at={T.pickA} l="A" /> : null}
          <div style={{height: 10}} />
          {f >= T.pickB ? <Readout f={f} at={T.pickB} l="B" /> : null}
        </div>
        <div style={{position: 'absolute', left: 26, top: 188}}>
          <Scope f={f} />
        </div>
        {f >= T.proof ? (
          <div style={{position: 'absolute', right: 26, top: 432, transform: `scale(${1 + 0.25 * proof})`, transformOrigin: '100% 50%'}}>
            <Chip on>A = B</Chip>
          </div>
        ) : null}
        <Slider label="Exposure (stops)" v={0.5} w={380} style={{position: 'absolute', left: 26, top: 486}} />
        <Slider label="Contrast" v={0.5} w={380} style={{position: 'absolute', left: 26, top: 556}} />
      </Panel>
      <Message f={f} at={T.proof} out={302}>
        Your eyes adapt. <span style={{color: C.amber}}>Scopes don't.</span>
      </Message>
    </>
  );
};

// ---------------------------------------------------------------- split-frame match to a reference ----
const VW = 1100;
const VH = 619;
const VX = 150;
const VY = 200;
export const ColorMatch: React.FC<{f: number}> = ({f}) => {
  const amt = ease.inOut(prog(f, T.match, T.match + 36));
  const seam = 1 - prog(f, T.match + 30, T.match + 42);
  const slider = ease.inOut(prog(f, 312, 326));
  const done = ease.expoOut(prog(f, T.match + 36, T.match + 50));
  const split = VW / 2;
  return (
    <>
      <ToolLabel f={f} at={308} out={400} text="REFERENCE COLOR MATCH" />
      <div style={{position: 'absolute', left: VX, top: VY, width: VW, height: VH, borderRadius: 9, overflow: 'hidden', border: `1px solid ${C.line}`, boxShadow: '0 40px 100px rgba(0,0,0,0.6)'}}>
        <Scene p={REF} w={VW} h={VH} uid="cmR" />
        <div style={{position: 'absolute', left: split, top: 0, width: VW - split, height: VH, overflow: 'hidden'}}>
          <Scene p={mixPal(SRC, REF, amt)} w={VW} h={VH} uid="cmS" style={{marginLeft: -split}} />
        </div>
        <div style={{position: 'absolute', left: split - 1, top: 0, width: 2, height: VH, background: C.text, opacity: 0.9 * seam}} />
        <div style={{position: 'absolute', left: split - 16, top: VH / 2 - 16, width: 32, height: 32, borderRadius: 16, background: C.text, opacity: seam, boxShadow: '0 4px 14px rgba(0,0,0,0.5)'}} />
        <div style={{position: 'absolute', left: 20, top: 20, opacity: seam}}>
          <Chip style={{background: 'rgba(16,18,17,0.78)'}}>Reference</Chip>
        </div>
        <div style={{position: 'absolute', left: split + 20, top: 20, opacity: seam}}>
          <Chip style={{background: 'rgba(16,18,17,0.78)'}}>Source</Chip>
        </div>
        {done > 0 ? (
          <div style={{position: 'absolute', right: 20, top: 20, opacity: done, transform: `translateY(${(1 - done) * -10}px)`}}>
            <Chip on color={C.success}>Matched to reference</Chip>
          </div>
        ) : null}
      </div>
      <Panel x={1320} y={VY} w={480} h={VH} o={ease.cubicOut(prog(f, 300, 318))}>
        <div style={{position: 'absolute', left: 28, top: 26}}>
          <Eyebrow>Color · Reference Color Match</Eyebrow>
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 26, color: C.text, marginTop: 10}}>Balance a shot against a reference.</div>
        </div>
        <div style={{position: 'absolute', left: 28, top: 136, display: 'flex', gap: 16, alignItems: 'center'}}>
          <div style={{width: 160, height: 90, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.amber}`}}>
            <Scene p={REF} w={160} h={90} uid="cmT" />
          </div>
          <div>
            <div style={{fontFamily: FONT, fontSize: 17, color: C.muted}}>Reference</div>
            <div style={{fontFamily: MONO, fontSize: 18, color: C.text, marginTop: 6}}>Take 01 · CAM A</div>
          </div>
        </div>
        <Select label="Match method" value="Lab statistical" w={424} style={{position: 'absolute', left: 28, top: 262}} />
        <Slider label="Match amount" v={0.15 + 0.7 * slider} w={424} style={{position: 'absolute', left: 28, top: 372}} />
        <Btn label="Process on PC" f={f} press={T.match} w={424} style={{position: 'absolute', left: 28, top: 470}} />
        <div style={{position: 'absolute', left: 28, top: 540, fontFamily: FONT, fontSize: 16, color: C.muted, width: 424}}>Sampled source color, transferred to the reference.</div>
      </Panel>
    </>
  );
};
