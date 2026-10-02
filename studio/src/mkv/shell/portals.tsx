// The ten world-to-world portals. Each runs over 11 active frames centred on its boundary b
// (p = 0 at b-5, 0.5 at b, 1 at b+5); b-6 and b+6 are the clean before/after states, so 12 frames end to end.
// A portal styles the outgoing and incoming section wrappers (masks, zooms) and draws an overlay (edges, flashes).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, H, W} from '../brand';
import {WORLDS, mulberry32} from '../timing';
import {diveZoom, ringRadius} from '../intro/timing';
import {HALF, SECTIONS, type SectionId} from './timing';
import {CX, CY, clamp, ease, lerp, mixHex, prog, rgba} from './util';

export type Look = {style?: React.CSSProperties; dim?: number; flash?: number; hide?: boolean; top?: boolean};
type OverlayProps = {p: number; g: number; a: string; b: string};
export type Portal = {
  lead?: number; // frames before the boundary the incoming section shows up (default HALF - 1)
  inn?: (p: number, g: number) => Look;
  out?: (p: number, g: number) => Look;
  Overlay?: React.FC<OverlayProps>;
};

export const sectionAccent = (id: SectionId) => (id === 'intro' || id === 'finale' ? C.green : ACCENT[id]);
export const ACTIVE = HALF - 1; // 5 frames each side of the boundary
export const portalP = (g: number, b: number) => (g - b + ACTIVE) / (2 * ACTIVE);

const DIAG = Math.hypot(CX, CY);
const pts = (a: [number, number][]) => a.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ');
const svgPts = (a: [number, number][]) => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const Svg: React.FC<{children: React.ReactNode; glow?: string; blur?: number}> = ({children, glow, blur = 8}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: glow ? `drop-shadow(0 0 ${blur}px ${glow})` : undefined}}>
    {children}
  </svg>
);

// ---------- 0. intro → My Voice: the camera dives through the amber ring ----------
const amberR = (g: number) => ringRadius(0) * diveZoom(g);
const ringDive: Portal = {
  lead: 12,
  inn: (_p, g) => {
    const s = lerp(0.8, 1, ease.cubicOut(prog(g, 348, 366)));
    const r = amberR(g) - 3;
    return r > DIAG + 40 ? {} : {style: {transform: `scale(${s})`, clipPath: `circle(${(Math.max(0, r) / s).toFixed(1)}px at 50% 50%)`}};
  },
  Overlay: ({g}) => {
    const r = amberR(g);
    const z = diveZoom(g);
    if (r > DIAG + 120) return null;
    return (
      <Svg glow={ACCENT.myvoice} blur={14}>
        <circle cx={CX} cy={CY} r={r} fill="none" stroke={ACCENT.myvoice} strokeWidth={6 * z ** 0.45} />
        <circle cx={CX} cy={CY} r={r} fill="none" stroke="#FFF4DD" strokeWidth={1.6 * z ** 0.45} opacity={0.9} />
      </Svg>
    );
  },
};

// ---------- 1. vase contour → stair edge: a staircase front sweeps across ----------
// Steps rise 120 px per 150 px (≈39°, the slope of My Voice's exit diagonal); on the boundary frame the
// front crosses the screen centre, where that diagonal sits.
const SX = 150;
const STEP = 120;
const ROWS = 10;
const T0 = -ROWS * SX - 40;
const T1 = 2 * (CX - (CY / STEP) * SX) - T0;
const stairFront = (p: number): [number, number][] => {
  const t = lerp(T0, T1, ease.cubicInOut(p));
  const f: [number, number][] = [];
  for (let k = 0; k < ROWS; k++) f.push([t + k * SX, H - k * STEP], [t + k * SX, H - (k + 1) * STEP]);
  return f;
};
const stairs: Portal = {
  inn: (p) => {
    const f = stairFront(p);
    return {style: {clipPath: `polygon(${pts([[-20, H + 20], [f[0][0], H + 20], ...f, [f[f.length - 1][0], -20], [-20, -20]])})`}};
  },
  out: (p) => ({style: {transform: `translateX(${-90 * ease.cubicInOut(p)}px)`}, dim: 0.35 * p}),
  Overlay: ({p, a, b}) => {
    const f = stairFront(p);
    const o = Math.sin(Math.PI * p) ** 0.5;
    return (
      <Svg glow={b} blur={10}>
        <defs>
          <linearGradient id="mkv-stair" x1="0" y1={H} x2="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        </defs>
        {f.map(([x, y], k) =>
          k % 2 ? null : <rect key={k} x={x - SX * 0.42} y={y - STEP} width={SX * 0.42} height={STEP} fill="url(#mkv-stair)" opacity={0.16 * o} />,
        )}
        <polyline points={svgPts(f.map(([x, y]) => [x - SX * 0.42, y]))} fill="none" stroke="url(#mkv-stair)" strokeWidth={2} opacity={0.5 * o} />
        <polyline points={svgPts(f)} fill="none" stroke="url(#mkv-stair)" strokeWidth={8} strokeLinejoin="miter" opacity={o} />
        <polyline points={svgPts(f)} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.85 * o} />
      </Svg>
    );
  },
};

// ---------- 2. staircase → signal ring: 24 wedges fan open inside a growing segment ring ----------
const SEG = 24;
const segGeom = (p: number) => ({R: 1180 * ease.cubicInOut(clamp(p * 1.04)), q: ease.expoOut(p), rot: -Math.PI / 2 + 2.4 * p});
const segments: Portal = {
  inn: (p) => {
    const {R, q, rot} = segGeom(p);
    if (R < 2) return {hide: true};
    const half = (Math.PI / SEG) * q * 1.04;
    let d = '';
    for (let j = 0; j < SEG; j++) {
      const a = rot + (j * 2 * Math.PI) / SEG;
      const x1 = CX + R * Math.cos(a - half);
      const y1 = CY + R * Math.sin(a - half);
      const x2 = CX + R * Math.cos(a + half);
      const y2 = CY + R * Math.sin(a + half);
      d += `M${CX} ${CY}L${x1.toFixed(1)} ${y1.toFixed(1)}A${R.toFixed(1)} ${R.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z`;
    }
    return {style: {clipPath: `path('${d}')`}};
  },
  out: (p) => ({style: {transform: `rotate(${-10 * ease.cubicIn(p)}deg) scale(${1 + 0.12 * ease.cubicIn(p)})`}, dim: 0.3 * p}),
  Overlay: ({p, a, b}) => {
    const {R, q, rot} = segGeom(p);
    if (R < 2) return null;
    const c = 2 * Math.PI * R;
    const seg = (c / SEG) * Math.max(0.12, q) * 0.86;
    const o = 1 - p ** 4;
    return (
      <Svg glow={b} blur={12}>
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={b}
          strokeWidth={16}
          strokeDasharray={`${seg} ${c / SEG - seg}`}
          strokeDashoffset={-((rot * R) % c) + seg / 2}
          opacity={o}
        />
        <circle cx={CX} cy={CY} r={R * 0.93} fill="none" stroke={a} strokeWidth={3} opacity={0.8 * o} />
      </Svg>
    );
  },
};

// ---------- 3. ring → letter shards: the incoming world assembles from flying triangular shards ----------
type Shard = {v: [number, number][]; c: [number, number]; delay: number; spin: number};
const SHARDS: Shard[] = (() => {
  const r = mulberry32(1800);
  const cols = 6;
  const rows = 4;
  const V: [number, number][] = [];
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= cols; i++) {
      let x = (i / cols) * W + (i > 0 && i < cols ? (r() - 0.5) * 0.7 * (W / cols) : 0);
      let y = (j / rows) * H + (j > 0 && j < rows ? (r() - 0.5) * 0.7 * (H / rows) : 0);
      if (i === 0) x = -40;
      if (i === cols) x = W + 40;
      if (j === 0) y = -40;
      if (j === rows) y = H + 40;
      V.push([x, y]);
    }
  const out: Shard[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = V[j * (cols + 1) + i];
      const b = V[j * (cols + 1) + i + 1];
      const c = V[(j + 1) * (cols + 1) + i + 1];
      const d = V[(j + 1) * (cols + 1) + i];
      const tris = (i + j) % 2 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      for (const t of tris) {
        const area = (t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[2][0] - t[0][0]) * (t[1][1] - t[0][1]);
        const v = area < 0 ? [t[0], t[2], t[1]] : t; // one winding for every shard, so the nonzero union has no holes
        const cx = (v[0][0] + v[1][0] + v[2][0]) / 3;
        const cy = (v[0][1] + v[1][1] + v[2][1]) / 3;
        out.push({v, c: [cx, cy], delay: 0.4 * Math.min(1, Math.hypot(cx - CX, cy - CY) / 1000) + 0.12 * r(), spin: (r() - 0.5) * 80});
      }
    }
  return out;
})();
const shardAt = (s: Shard, p: number) => {
  const q = clamp((p - s.delay) / 0.46);
  if (q <= 0) return null;
  const e = ease.expoOut(q);
  const sc = 1.04 * e;
  const a = (s.spin * (1 - e) * Math.PI) / 180;
  const [cx, cy] = s.c;
  const ox = (cx - CX) * 0.3 * (1 - e);
  const oy = (cy - CY) * 0.3 * (1 - e);
  const v = s.v.map(([x, y]): [number, number] => {
    const dx = (x - cx) * sc;
    const dy = (y - cy) * sc;
    return [cx + ox + dx * Math.cos(a) - dy * Math.sin(a), cy + oy + dx * Math.sin(a) + dy * Math.cos(a)];
  });
  return {v, q};
};
const shards: Portal = {
  inn: (p) => {
    let d = '';
    for (const s of SHARDS) {
      const t = shardAt(s, p);
      if (t) d += `M${t.v.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
    }
    return d ? {style: {clipPath: `path('${d}')`}} : {hide: true};
  },
  out: (p) => ({style: {transform: `scale(${1 + 0.06 * p})`}, dim: 0.3 * p}),
  Overlay: ({p, b}) => (
    <Svg glow={b} blur={6}>
      {SHARDS.map((s, i) => {
        const t = shardAt(s, p);
        if (!t || t.q >= 1) return null;
        return <polygon key={i} points={svgPts(t.v)} fill={rgba('#FFFFFF', 0.16 * (1 - t.q) ** 2)} stroke={b} strokeWidth={2.5} opacity={(1 - t.q) * 0.95} />;
      })}
    </Svg>
  ),
};

// ---------- 4. shards → tunnel frames: nested frames rush at the camera, the new world fills the innermost ----------
const tz = (p: number) => 0.05 * 22 ** (p ** 1.1);
const rectPts = (z: number): [number, number][] => [
  [CX - CX * z, CY - CY * z],
  [CX + CX * z, CY - CY * z],
  [CX + CX * z, CY + CY * z],
  [CX - CX * z, CY + CY * z],
];
const tunnel: Portal = {
  inn: (p) => {
    const z = tz(p);
    const ix = CX * (1 - z);
    const iy = CY * (1 - z);
    return {style: {clipPath: `inset(${iy.toFixed(1)}px ${ix.toFixed(1)}px)`}};
  },
  out: (p) => ({style: {transform: `scale(${1 + 1.6 * ease.cubicIn(p)})`}, dim: 0.4 * p}),
  Overlay: ({p, a, b}) => {
    const z = tz(p);
    return (
      <Svg glow={b} blur={10}>
        {[0, 1, 2, 3, 4].map((j) => {
          const zj = z * 1.5 ** j;
          if (zj > 1.7) return null;
          const o = clamp((1.7 - zj) / 0.5) * (1 - p ** 3);
          return <polygon key={j} points={svgPts(rectPts(zj))} fill="none" stroke={mixHex(b, a, j / 4)} strokeWidth={j ? 3 : 5} opacity={o} />;
        })}
      </Svg>
    );
  },
};

// ---------- 5. tunnel → CRT screen: the old world sinks to black, a CRT powers on (line, then opens) ----------
const crt: Portal = {
  inn: (p) => {
    if (p < 0.5) return {hide: true};
    const q = (p - 0.5) / 0.5;
    const hh = lerp(3, CY + 4, ease.cubicOut(q));
    return {style: {clipPath: `inset(${(CY - hh).toFixed(1)}px 0px)`}, flash: 0.85 * (1 - q) ** 2};
  },
  out: (p) => (p >= 0.5 ? {hide: true} : {style: {transform: `scale(${1 + 0.9 * ease.cubicIn(p / 0.5)})`}, dim: ease.cubicIn(p / 0.5) ** 0.7}),
  Overlay: ({p, b}) => {
    if (p < 0.5) {
      const w = W * ease.expoOut(prog(p, 0.08, 0.5));
      return (
        <AbsoluteFill>
          <div style={{position: 'absolute', left: CX - w / 2, top: CY - 2, width: w, height: 4, background: '#FFFFFF', boxShadow: `0 0 18px 4px ${b}, 0 0 60px 10px ${rgba(b, 0.6)}`}} />
          <div style={{position: 'absolute', left: CX - 60, top: CY - 60, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, #FFFFFF 0%, ${rgba(b, 0.7)} 30%, transparent 70%)`, opacity: prog(p, 0.05, 0.3)}} />
        </AbsoluteFill>
      );
    }
    const q = (p - 0.5) / 0.5;
    const hh = lerp(3, CY + 4, ease.cubicOut(q));
    return (
      <AbsoluteFill style={{opacity: 1 - q}}>
        <AbsoluteFill
          style={{
            top: CY - hh,
            bottom: CY - hh,
            height: 'auto',
            backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)',
          }}
        />
        {[CY - hh, CY + hh - 3].map((y, i) => (
          <div key={i} style={{position: 'absolute', left: 0, top: y, width: W, height: 3, background: '#FFFFFF', boxShadow: `0 0 16px 4px ${b}`}} />
        ))}
      </AbsoluteFill>
    );
  },
};

// ---------- 6. CRT collapse → grating: the old screen collapses to a line that splits into fine grating bars ----------
const GN = 27;
const grating: Portal = {
  inn: (p) => {
    if (p < 0.5) return {hide: true};
    const q = (p - 0.5) / 0.5;
    const spread = ease.cubicOut(q);
    const hh = lerp(1.5, H / GN / 2 + 1, q ** 1.5);
    let d = '';
    for (let j = 0; j < GN; j++) {
      const y = CY + ((j + 0.5) * (H / GN) - CY) * spread;
      d += `M-10 ${(y - hh).toFixed(1)}H${W + 10}V${(y + hh).toFixed(1)}H-10Z`;
    }
    return {style: {clipPath: `path('${d}')`}};
  },
  out: (p) => {
    if (p >= 0.5) return {hide: true};
    const q = p / 0.5;
    return {style: {transform: `scale(${1 + 0.03 * q}, ${1 - 0.996 * q ** 1.6})`}, flash: 0.9 * q ** 3, top: true};
  },
  Overlay: ({p, a, b}) => {
    const line = clamp(1 - Math.abs(p - 0.5) / 0.22);
    const q = clamp((p - 0.5) / 0.5);
    const spread = ease.cubicOut(q);
    return (
      <AbsoluteFill>
        {line > 0 ? <div style={{position: 'absolute', left: 0, top: CY - 2, width: W, height: 4, background: '#FFFFFF', opacity: line, boxShadow: `0 0 20px 5px ${a}, 0 0 50px 8px ${rgba(b, 0.5)}`}} /> : null}
        {p > 0.5 ? (
          <Svg glow={b} blur={6}>
            {Array.from({length: GN}, (_, j) => {
              const y = CY + ((j + 0.5) * (H / GN) - CY) * spread;
              return <line key={j} x1={0} x2={W} y1={y} y2={y} stroke={j % 2 ? b : '#FFFFFF'} strokeWidth={1.5} opacity={(1 - q) * 0.8} />;
            })}
          </Svg>
        ) : null}
      </AbsoluteFill>
    );
  },
};

// ---------- 7. grating → cube edge: the new world opens inside a wireframe cube silhouette ----------
const hexGeom = (p: number) => {
  const R = 1340 * p ** 1.6;
  const rot = ((30 * (1 - ease.cubicOut(p)) - 90) * Math.PI) / 180;
  const v = Array.from({length: 6}, (_, k): [number, number] => [CX + R * Math.cos(rot + (k * Math.PI) / 3), CY + R * Math.sin(rot + (k * Math.PI) / 3)]);
  return {R, v};
};
const cube: Portal = {
  inn: (p) => {
    const {R, v} = hexGeom(p);
    return R < 2 ? {hide: true} : {style: {clipPath: `polygon(${pts(v)})`}};
  },
  out: (p) => ({style: {transform: `rotate(${14 * ease.cubicIn(p)}deg) scale(${1 + 0.22 * ease.cubicIn(p)})`}, dim: 0.3 * p}),
  Overlay: ({p, a, b}) => {
    const {R, v} = hexGeom(p);
    if (R < 2) return null;
    const o = 1 - p ** 4;
    const col = mixHex(a, b, p);
    return (
      <Svg glow={col} blur={8}>
        <polygon points={svgPts(v)} fill="none" stroke={col} strokeWidth={4} opacity={o} />
        {[1, 3, 5].map((k) => (
          <line key={k} x1={CX} y1={CY} x2={v[k][0]} y2={v[k][1]} stroke={col} strokeWidth={3} opacity={0.75 * o} />
        ))}
        {[0, 2, 4].map((k) => (
          <line key={k} x1={CX} y1={CY} x2={v[k][0]} y2={v[k][1]} stroke={col} strokeWidth={2} strokeDasharray="10 12" opacity={0.3 * o} />
        ))}
      </Svg>
    );
  },
};

// ---------- 8. cube → page: a page turns across, its curled back lit in the incoming accent ----------
const SLANT = 0.22;
const pageX = (p: number) => lerp(W + 330, -330, ease.cubicInOut(p));
const page: Portal = {
  inn: (p) => {
    const X = pageX(p);
    const xe = (y: number) => X + SLANT * (y - CY);
    return {style: {clipPath: `polygon(${pts([[xe(-20), -20], [W + 20, -20], [W + 20, H + 20], [xe(H + 20), H + 20]])})`}};
  },
  out: (p) => ({style: {transform: `translateX(${-70 * ease.cubicInOut(p)}px)`}, dim: 0.35 * p}),
  Overlay: ({p, b}) => {
    const X = pageX(p);
    const xe = (y: number) => X + SLANT * (y - CY);
    const nx = 1 / Math.hypot(1, SLANT);
    const ny = -SLANT / Math.hypot(1, SLANT);
    const curl = 170;
    const shadow = 130;
    return (
      <Svg>
        <defs>
          <linearGradient id="mkv-curl" gradientUnits="userSpaceOnUse" x1={X - curl * nx} y1={CY - curl * ny} x2={X} y2={CY}>
            <stop offset="0" stopColor={b} stopOpacity={0} />
            <stop offset="0.75" stopColor={mixHex(b, '#FFFFFF', 0.6)} stopOpacity={0.45} />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.95} />
          </linearGradient>
          <linearGradient id="mkv-shadow" gradientUnits="userSpaceOnUse" x1={X} y1={CY} x2={X + shadow * nx} y2={CY + shadow * ny}>
            <stop offset="0" stopColor="#000000" stopOpacity={0.6} />
            <stop offset="1" stopColor="#000000" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={svgPts([[xe(-20), -20], [xe(-20) + shadow / nx, -20], [xe(H + 20) + shadow / nx, H + 20], [xe(H + 20), H + 20]])} fill="url(#mkv-shadow)" />
        <polygon points={svgPts([[xe(-20) - curl / nx, -20], [xe(-20), -20], [xe(H + 20), H + 20], [xe(H + 20) - curl / nx, H + 20]])} fill="url(#mkv-curl)" />
        <line x1={xe(-20)} y1={-20} x2={xe(H + 20)} y2={H + 20} stroke="#FFFFFF" strokeWidth={2} style={{filter: `drop-shadow(0 0 8px ${b})`}} />
      </Svg>
    );
  },
};

// ---------- 9. pages → nine colored rings + light flash into the finale ----------
const flashAt = (p: number) => (p < 0.5 ? 0.95 * ease.cubicIn(p / 0.5) : 0.95 * (1 - ease.cubicOut((p - 0.5) / 0.5)));
const rings: Portal = {
  inn: (p) => (p < 0.5 ? {hide: true} : {style: {transform: `scale(${1.12 - 0.12 * ease.expoOut((p - 0.5) / 0.5)})`}}),
  out: (p) => ({style: {transform: `scale(${1 + 0.2 * ease.cubicIn(p)})`}}),
  Overlay: ({p}) => (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #FFFFFF 0%, #F4FFF8 40%, ${rgba(C.green, 0.85)} 100%)`, opacity: flashAt(p)}} />
      <Svg>
        {WORLDS.map((w, j) => {
          const k = clamp((p - 0.035 * j) / 0.62);
          if (k <= 0 || k >= 1) return null;
          return <circle key={w.id} cx={CX} cy={CY} r={1250 * ease.expoOut(k)} fill="none" stroke={ACCENT[w.id]} strokeWidth={14 * (1 - k) + 3} opacity={1 - k ** 2} style={{filter: `drop-shadow(0 0 10px ${ACCENT[w.id]})`}} />;
        })}
      </Svg>
    </AbsoluteFill>
  ),
};

export const PORTALS: Portal[] = [ringDive, stairs, segments, shards, tunnel, crt, grating, cube, page, rings];

// Overlays for whichever portal is active at global frame g (drawn above the sections, inside the camera shake).
export const PortalOverlay: React.FC<{g: number}> = ({g}) => {
  for (let k = 0; k < PORTALS.length; k++) {
    const b = SECTIONS[k + 1].start;
    const P = PORTALS[k];
    if (!P.Overlay || g < b - (P.lead ?? ACTIVE) || g > b + ACTIVE) continue;
    const O = P.Overlay;
    return <O p={clamp(portalP(g, b))} g={g} a={sectionAccent(SECTIONS[k].id)} b={sectionAccent(SECTIONS[k + 1].id)} />;
  }
  return null;
};
