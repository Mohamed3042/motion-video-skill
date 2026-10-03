// The twelve section-to-section portals. Each runs over 11 active frames centred on its boundary b
// (p = 0 at b-5, 0.5 at b, 1 at b+5); b-6 and b+6 are the clean before/after states, so 12 frames end to end.
// A portal styles the outgoing and incoming section wrappers (masks, zooms, tilts) and draws an overlay (edges, flashes).
// The sections draw their own exit pose / entrance motif; the portal is the blend between them.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, H, W} from '../brand';
import {WORLDS} from '../timing';
import {HALF, SECTIONS, type ShellId} from './timing';
import {CX, CY, clamp, ease, lerp, mixHex, prog, rgba} from './util';

export type Look = {style?: React.CSSProperties; dim?: number; flash?: number; hide?: boolean; top?: boolean};
type OverlayProps = {p: number; g: number; a: string; b: string};
export type Portal = {
  lead?: number; // frames before the boundary the incoming section shows up (default ACTIVE)
  inn?: (p: number, g: number) => Look;
  out?: (p: number, g: number) => Look;
  Overlay?: React.FC<OverlayProps>;
};

export const CHAOS_ACCENT = '#e9e2d0'; // dirty white
export const sectionAccent = (id: ShellId) => (id === 'chaos' ? CHAOS_ACCENT : id === 'turn' || id === 'finale' ? C.coral : ACCENT[id]);
export const ACTIVE = HALF - 1; // 5 frames each side of the boundary
export const portalP = (g: number, b: number) => (g - b + ACTIVE) / (2 * ACTIVE);

const DIAG = Math.hypot(CX, CY);
const f1 = (v: number) => v.toFixed(1);
const pts = (a: [number, number][]) => a.map(([x, y]) => `${f1(x)}px ${f1(y)}px`).join(', ');
const svgPts = (a: [number, number][]) => a.map(([x, y]) => `${f1(x)},${f1(y)}`).join(' ');
const pathPoly = (a: [number, number][]) => `M${a.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L')}Z`;
const pathCircle = (cx: number, cy: number, r: number) => `M${f1(cx - r)} ${f1(cy)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;
const clipPath = (d: string): Look => (d ? {style: {clipPath: `path('${d}')`}} : {hide: true});
const Svg: React.FC<{children: React.ReactNode; glow?: string; blur?: number; opacity?: number}> = ({children, glow, blur = 8, opacity}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity, filter: glow ? `drop-shadow(0 0 ${blur}px ${glow})` : undefined}}>
    {children}
  </svg>
);
const hump = (p: number) => Math.sin(Math.PI * clamp(p)) ** 0.6;

// ---------- 0. chaos → turn (720): gravity ignite ----------
// The noise is pulled into the centre (swirl + shrink), gravity rings contract, a coral point ignites on the boundary
// and the turn opens outward from it inside a coral event horizon.
const igniteR = (p: number) => (DIAG + 60) * ease.cubicOut(prog(p, 0.42, 1));
const ignite: Portal = {
  inn: (p) => {
    const r = igniteR(p);
    return r < 1 ? {hide: true} : {style: {clipPath: `circle(${f1(r)}px at 50% 50%)`, transform: `rotate(${f1(8 * (1 - ease.cubicOut(prog(p, 0.42, 1))))}deg)`}};
  },
  out: (p) => {
    const e = ease.cubicIn(p);
    return {style: {transform: `rotate(${f1(-22 * e)}deg) scale(${(1 - 0.5 * e).toFixed(3)})`}, dim: 0.75 * e};
  },
  Overlay: ({p, b}) => {
    const r = igniteR(p);
    const core = hump(prog(p, 0.3, 0.95));
    return (
      <AbsoluteFill>
        <Svg glow={b} blur={12}>
          {[0, 1, 2].map((j) => {
            const k = clamp(p / 0.5 - j * 0.18);
            if (k <= 0 || k >= 1) return null;
            return <circle key={j} cx={CX} cy={CY} r={lerp(900 - 160 * j, 20, ease.cubicIn(k))} fill="none" stroke={mixHex(CHAOS_ACCENT, b, k)} strokeWidth={2 + 3 * k} opacity={0.65 * Math.sin(Math.PI * k)} />;
          })}
          {r > 1 ? <circle cx={CX} cy={CY} r={r} fill="none" stroke={b} strokeWidth={10 * (1 - prog(p, 0.5, 1)) + 2} opacity={1 - prog(p, 0.7, 1)} /> : null}
          {r > 1 ? <circle cx={CX} cy={CY} r={r * 0.97} fill="none" stroke="#FFF3EC" strokeWidth={1.5} opacity={0.8 * (1 - prog(p, 0.6, 1))} /> : null}
        </Svg>
        <div style={{position: 'absolute', left: CX - 260, top: CY - 260, width: 520, height: 520, borderRadius: '50%', background: `radial-gradient(circle, #FFFFFF 0%, ${rgba('#FFD9CC', 0.95)} 8%, ${rgba(b, 0.75)} 22%, ${rgba(b, 0)} 62%)`, opacity: core, transform: `scale(${(0.35 + 0.9 * core).toFixed(3)})`}} />
      </AbsoluteFill>
    );
  },
};

// ---------- 1. turn → profile (1320): BOOM — the dive into the coral satellite ends white-hot, profile punches in ----------
const STREAKS = Array.from({length: 28}, (_, i) => ({a: (i / 28) * Math.PI * 2 + (i % 3) * 0.05, len: 120 + ((i * 53) % 7) * 34, d: (i * 37) % 5}));
const drop: Portal = {
  inn: (p) => {
    if (p < 0.5) return {hide: true};
    const q = (p - 0.5) / 0.5;
    return {style: {transform: `scale(${(1.22 - 0.22 * ease.expoOut(q)).toFixed(4)})`}};
  },
  out: (p) => ({style: {transform: `scale(${(1 + 0.9 * ease.cubicIn(p)).toFixed(4)})`}}),
  Overlay: ({p, b}) => {
    const q = clamp((p - 0.5) / 0.5);
    const flash = p < 0.5 ? 0.97 * ease.cubicIn(prog(p, 0.12, 0.5)) : 0.95 * (1 - ease.cubicOut(q));
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #FFFFFF 0%, #FFF4EE 30%, ${rgba(C.coral, 0.92)} 78%, ${rgba('#c4381a', 0.95)} 100%)`, opacity: flash}} />
        {p >= 0.5 ? (
          <Svg glow={b} blur={14}>
            {[0, 1].map((j) => {
              const k = ease.expoOut(clamp((q - 0.12 * j) / 0.88));
              if (k <= 0) return null;
              return <circle key={j} cx={CX} cy={CY} r={60 + (1500 - 400 * j) * k} fill="none" stroke={j ? '#FFFFFF' : b} strokeWidth={(j ? 6 : 22) * (1 - k) + 1.5} opacity={1 - k ** 1.5} />;
            })}
            {STREAKS.map((s, i) => {
              const k = ease.cubicOut(clamp((q - 0.04 * s.d) / 0.8));
              if (k <= 0 || k >= 1) return null;
              const r0 = 140 + 1100 * k;
              const r1 = r0 + s.len * (1 - k * 0.6);
              return <line key={i} x1={CX + r0 * Math.cos(s.a)} y1={CY + r0 * Math.sin(s.a)} x2={CX + r1 * Math.cos(s.a)} y2={CY + r1 * Math.sin(s.a)} stroke={i % 2 ? '#FFFFFF' : b} strokeWidth={3} strokeLinecap="round" opacity={0.9 * (1 - k)} />;
            })}
          </Svg>
        ) : null}
      </AbsoluteFill>
    );
  },
};

// ---------- 2. profile → globe (1800): the curled page becomes a sphere, the globe grows out of it ----------
const sphereR = (p: number) => (DIAG + 40) * ease.cubicInOut(prog(p, 0.08, 1)) ** 1.15;
const sphere: Portal = {
  inn: (p) => {
    const r = sphereR(p);
    return r < 2 ? {hide: true} : {style: {clipPath: `circle(${f1(r)}px at 50% 50%)`}};
  },
  out: (p) => ({style: {transform: `scale(${(1 - 0.1 * ease.cubicIn(p)).toFixed(4)})`}, dim: 0.45 * p}),
  Overlay: ({p, a, b}) => {
    const r = sphereR(p);
    if (r < 2) return null;
    const o = 1 - prog(p, 0.65, 1);
    const spin = p * 70;
    return (
      <AbsoluteFill style={{opacity: o}}>
        {/* sphere shading: limb darkening + a soft specular highlight, so the doorway reads as a ball */}
        <div style={{position: 'absolute', left: CX - r, top: CY - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: `radial-gradient(circle at 36% 30%, ${rgba('#FFFFFF', 0.32)} 0%, ${rgba(b, 0.12)} 24%, rgba(0,0,0,0) 52%, ${rgba(C.deep, 0.55)} 100%)`}} />
        <Svg glow={b} blur={12}>
          {[-60, -20, 20, 60].map((m, j) => {
            const ang = ((m + spin) * Math.PI) / 180;
            const rx = Math.abs(r * Math.sin(ang));
            return <ellipse key={j} cx={CX} cy={CY} rx={rx} ry={r} fill="none" stroke={b} strokeWidth={1.6} opacity={0.45} />;
          })}
          {[-0.5, 0, 0.5].map((t, j) => (
            <ellipse key={j} cx={CX} cy={CY + r * t} rx={r * Math.sqrt(1 - t * t)} ry={r * Math.sqrt(1 - t * t) * 0.18} fill="none" stroke={b} strokeWidth={1.4} opacity={0.35} />
          ))}
          <circle cx={CX} cy={CY} r={r} fill="none" stroke={mixHex(a, b, p)} strokeWidth={6} />
          <circle cx={CX} cy={CY} r={r} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.85} />
        </Svg>
      </AbsoluteFill>
    );
  },
};

// ---------- 3. globe → findings (2280): the globe collapses to a glowing point, a star flare opens the next world ----------
const STAR_ROT = (p: number) => (-45 + 45 * ease.cubicOut(prog(p, 0.45, 1))) * (Math.PI / 180);
const starPoly = (p: number): [number, number][] | null => {
  const q = prog(p, 0.45, 1);
  if (q <= 0) return null;
  const R = 2600 * ease.cubicIn(q) + 40 * q;
  const k = lerp(0.18, 0.75, ease.cubicIn(q));
  const rot = STAR_ROT(p);
  return Array.from({length: 8}, (_, i): [number, number] => {
    const rr = i % 2 ? R * k : R;
    const an = rot + (i * Math.PI) / 4;
    return [CX + rr * Math.cos(an), CY + rr * Math.sin(an)];
  });
};
const flare: Portal = {
  inn: (p) => {
    const v = starPoly(p);
    return v ? {style: {clipPath: `polygon(${pts(v)})`}} : {hide: true};
  },
  out: (p) => {
    const e = ease.cubicIn(p);
    return {style: {transform: `scale(${(1 - 0.75 * e).toFixed(4)})`, borderRadius: '50%'}, dim: 0.85 * e};
  },
  Overlay: ({p, a, b}) => {
    const v = starPoly(p);
    const core = hump(prog(p, 0.15, 0.85));
    const streak = hump(prog(p, 0.25, 0.9));
    return (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: CX - 220, top: CY - 220, width: 440, height: 440, borderRadius: '50%', background: `radial-gradient(circle, #FFFFFF 0%, ${rgba(mixHex(a, b, 0.5), 0.85)} 14%, ${rgba(b, 0)} 60%)`, opacity: core, transform: `scale(${(0.3 + core).toFixed(3)})`}} />
        <div style={{position: 'absolute', left: CX - 900 * streak, top: CY - 2, width: 1800 * streak, height: 4, borderRadius: 2, background: `linear-gradient(to right, ${rgba(b, 0)}, #FFFFFF 50%, ${rgba(b, 0)})`, boxShadow: `0 0 18px 4px ${rgba(b, 0.6)}`, opacity: streak}} />
        <div style={{position: 'absolute', left: CX - 2, top: CY - 300 * streak, width: 4, height: 600 * streak, borderRadius: 2, background: `linear-gradient(to bottom, ${rgba(b, 0)}, #FFFFFF 50%, ${rgba(b, 0)})`, opacity: 0.7 * streak}} />
        {v ? (
          <Svg glow={b} blur={10}>
            <polygon points={svgPts(v)} fill="none" stroke={b} strokeWidth={5} strokeLinejoin="round" opacity={1 - prog(p, 0.75, 1)} />
          </Svg>
        ) : null}
      </AbsoluteFill>
    );
  },
};

// ---------- 4. findings → focus (2760): the green dot becomes the centre of an Ebbinghaus figure ----------
// The centre circle grows while its six neighbours shrink — the illusion itself, used as the door.
const ebb = (p: number) => {
  const e = ease.cubicInOut(prog(p, 0.1, 1));
  const R = lerp(18, DIAG + 40, e ** 1.3);
  const sat = Array.from({length: 6}, (_, k) => {
    const an = -Math.PI / 2 + (k * Math.PI) / 3 + 0.5 * e;
    const d = lerp(260, 900, e);
    const r = lerp(150, 0, e) * ease.expoOut(prog(p, 0, 0.3));
    return {x: CX + d * Math.cos(an), y: CY + d * Math.sin(an), r};
  });
  return {R, sat};
};
const ebbinghaus: Portal = {
  inn: (p) => {
    const {R, sat} = ebb(p);
    return clipPath(pathCircle(CX, CY, R) + sat.filter((s) => s.r > 1).map((s) => pathCircle(s.x, s.y, s.r)).join(''));
  },
  out: (p) => ({style: {transform: `scale(${(1 - 0.06 * p).toFixed(4)})`}, dim: 0.4 * p}),
  Overlay: ({p, a, b}) => {
    const {R, sat} = ebb(p);
    const o = 1 - prog(p, 0.7, 1);
    return (
      <Svg glow={b} blur={10} opacity={o}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={mixHex(a, b, prog(p, 0, 0.6))} strokeWidth={5} />
        {sat.map((s, k) => (s.r > 1 ? <circle key={k} cx={s.x} cy={s.y} r={s.r} fill="none" stroke={b} strokeWidth={3} opacity={0.8} /> : null))}
      </Svg>
    );
  },
};

// ---------- 5. focus → fit (3240): the circle squares off; the next world flips in tile by tile, light tiles first ----------
const TILE = 240;
const TILES = (() => {
  const out: {x: number; y: number; d: number; light: boolean}[] = [];
  for (let j = 0; j < 5; j++)
    for (let i = 0; i < 8; i++) {
      const x = TILE / 2 + i * TILE;
      const y = -TILE / 4 + TILE / 2 + j * TILE;
      out.push({x, y, d: Math.hypot(x - CX, y - CY) / DIAG, light: (i + j) % 2 === 0});
    }
  return out;
})();
const tileK = (t: (typeof TILES)[number], p: number) => ease.cubicOut(clamp((p - (t.light ? 0 : 0.22) - 0.3 * t.d) / 0.42));
const checker: Portal = {
  inn: (p) => {
    let d = '';
    for (const t of TILES) {
      const h = (TILE / 2 + 1) * tileK(t, p);
      if (h > 0.5) d += pathPoly([[t.x - h, t.y - h], [t.x + h, t.y - h], [t.x + h, t.y + h], [t.x - h, t.y + h]]);
    }
    return clipPath(d);
  },
  out: (p) => ({style: {transform: `scale(${(1 + 0.05 * p).toFixed(4)})`}, dim: 0.45 * p}),
  Overlay: ({p, b}) => (
    <Svg glow={b} blur={6}>
      {TILES.map((t, i) => {
        const k = tileK(t, p);
        if (k <= 0 || k >= 1) return null;
        const h = (TILE / 2) * k;
        return <rect key={i} x={t.x - h} y={t.y - h} width={2 * h} height={2 * h} fill={t.light ? rgba('#FFFFFF', 0.1 * (1 - k)) : 'none'} stroke={b} strokeWidth={t.light ? 3 : 2} opacity={(1 - k) ** 0.7} />;
      })}
    </Svg>
  ),
};

// ---------- 6. fit → next proof (3720): the checker floor tilts away; the next world opens between converging rails ----------
const VPY = 330;
const rails = (p: number) => {
  const w = 3200 * ease.cubicInOut(prog(p, 0.05, 1));
  const apexY = lerp(VPY, -1700, ease.cubicIn(prog(p, 0.4, 1)));
  return {w, apexY};
};
const railsPortal: Portal = {
  inn: (p) => {
    const {w, apexY} = rails(p);
    return w < 2 ? {hide: true} : {style: {clipPath: `polygon(${pts([[CX - w, H + 20], [CX, apexY], [CX + w, H + 20]])})`}};
  },
  out: (p) => ({style: {transform: `perspective(1100px) rotateX(${f1(42 * ease.cubicIn(p))}deg)`, transformOrigin: '50% 100%'}, dim: 0.5 * p}),
  Overlay: ({p, b}) => {
    const {w, apexY} = rails(p);
    if (w < 2) return null;
    const o = 1 - prog(p, 0.7, 1);
    const L: [number, number] = [CX - w, H + 20];
    const R: [number, number] = [CX + w, H + 20];
    const at = (P: [number, number], t: number): [number, number] => [lerp(P[0], CX, t), lerp(P[1], apexY, t)];
    return (
      <Svg glow={b} blur={10} opacity={o}>
        {Array.from({length: 9}, (_, k) => {
          const t = 1 - 0.72 ** (k + 1 + 3 * p);
          const l = at(L, t);
          const r = at(R, t);
          return <line key={k} x1={l[0]} y1={l[1]} x2={r[0]} y2={r[1]} stroke={b} strokeWidth={4 * (1 - t) + 1} opacity={0.55 * (1 - t)} />;
        })}
        <line x1={L[0]} y1={L[1]} x2={CX} y2={apexY} stroke={b} strokeWidth={7} />
        <line x1={R[0]} y1={R[1]} x2={CX} y2={apexY} stroke={b} strokeWidth={7} />
        <line x1={L[0]} y1={L[1]} x2={CX} y2={apexY} stroke="#FFFFFF" strokeWidth={2} />
        <line x1={R[0]} y1={R[1]} x2={CX} y2={apexY} stroke="#FFFFFF" strokeWidth={2} />
      </Svg>
    );
  },
};

// ---------- 7. next proof → market (4200): the rails straighten into matrix grid lines; columns open left to right ----------
const COLS = 12;
const CW = W / COLS;
const colK = (j: number, p: number) => ease.cubicInOut(clamp((p - 0.035 * j) / 0.6));
const grid: Portal = {
  inn: (p) => {
    let d = '';
    for (let j = 0; j < COLS; j++) {
      const h = (CW / 2 + 1) * colK(j, p);
      if (h > 0.5) d += pathPoly([[CW * (j + 0.5) - h, -20], [CW * (j + 0.5) + h, -20], [CW * (j + 0.5) + h, H + 20], [CW * (j + 0.5) - h, H + 20]]);
    }
    return clipPath(d);
  },
  out: (p) => ({style: {transform: `translateX(${f1(-60 * ease.cubicIn(p))}px)`}, dim: 0.45 * p}),
  Overlay: ({p, a, b}) => {
    const o = 1 - prog(p, 0.75, 1);
    const s = ease.cubicOut(prog(p, 0, 0.45)); // rails (fan from the vanishing point) → vertical grid lines
    return (
      <Svg glow={b} blur={8} opacity={o}>
        {Array.from({length: COLS + 1}, (_, j) => {
          const xb = CW * j;
          const xt = lerp(CX + (xb - CX) * 0.08, xb, s);
          const yt = lerp(VPY, -20, s);
          const k = colK(Math.min(j, COLS - 1), p);
          return <line key={j} x1={xb} y1={H + 20} x2={xt} y2={yt} stroke={mixHex(a, b, s)} strokeWidth={2 + 3 * (1 - k)} opacity={0.4 + 0.6 * (1 - k)} />;
        })}
        {Array.from({length: 9}, (_, i) => {
          const y = 60 + i * 120;
          const k = ease.expoOut(prog(p, 0.15 + 0.03 * i, 0.6 + 0.03 * i));
          return <line key={i} x1={0} y1={y} x2={W * k} y2={y} stroke={b} strokeWidth={1.5} opacity={0.6} />;
        })}
      </Svg>
    );
  },
};

// ---------- 8. market → employers (4680): the grid lines become café-wall rows sliding in from alternating sides ----------
const ROWS8 = 9;
const RH = H / ROWS8;
const rowX = (j: number, p: number) => lerp(-RH * 2, W + RH * 2, ease.cubicInOut(clamp((p - 0.03 * j) / 0.72)));
const cafe: Portal = {
  inn: (p) => {
    let d = '';
    for (let j = 0; j < ROWS8; j++) {
      const X = rowX(j, p);
      if (X <= -RH * 2 + 1) continue;
      const y0 = j * RH - (j === 0 ? 20 : 0.5);
      const y1 = (j + 1) * RH + (j === ROWS8 - 1 ? 20 : 0.5);
      d += j % 2 ? pathPoly([[W - X, y0], [W + 20, y0], [W + 20, y1], [W - X, y1]]) : pathPoly([[-20, y0], [X, y0], [X, y1], [-20, y1]]);
    }
    return clipPath(d);
  },
  out: (p) => ({dim: 0.45 * p}),
  Overlay: ({p, b}) => {
    const o = hump(p);
    return (
      <Svg glow={b} blur={6}>
        {Array.from({length: ROWS8}, (_, j) => {
          const X = rowX(j, p);
          const x = j % 2 ? W - X : X;
          const dir = j % 2 ? 1 : -1; // the tile trails behind the edge
          return (
            <g key={j}>
              <rect x={dir > 0 ? x : x - RH} y={j * RH + 3} width={RH} height={RH - 6} fill={rgba(b, 0.5)} opacity={o} />
              <rect x={dir > 0 ? x + RH : x - 2 * RH} y={j * RH + 3} width={RH} height={RH - 6} fill={rgba(C.deep, 0.85)} opacity={o} />
              <line x1={x} y1={j * RH} x2={x} y2={(j + 1) * RH} stroke="#FFFFFF" strokeWidth={3} opacity={o} />
            </g>
          );
        })}
        {Array.from({length: ROWS8 - 1}, (_, j) => (
          <line key={j} x1={0} y1={(j + 1) * RH} x2={W} y2={(j + 1) * RH} stroke={mixHex(b, '#8d8d99', 0.5)} strokeWidth={4} opacity={0.75 * o} />
        ))}
      </Svg>
    );
  },
};

// ---------- 9. employers → engine (5160): the rows shear into diagonal barber stripes that drift sideways ----------
const SP = 180;
const NSTRIPE = Math.ceil((W + H) / SP) + 4;
const stripe = (k: number, p: number) => {
  const c = (k - 2) * SP + 260 * p; // the stripes slide right while they open
  const hw = (SP / 2 + 2) * ease.cubicOut(clamp((p - 0.025 * k) / 0.55));
  return {c, hw};
};
const barber: Portal = {
  inn: (p) => {
    let d = '';
    for (let k = 0; k < NSTRIPE; k++) {
      const {c, hw} = stripe(k, p);
      if (hw > 0.5) d += pathPoly([[c - hw + 20, -20], [c + hw + 20, -20], [c + hw - H - 20, H + 20], [c - hw - H - 20, H + 20]]);
    }
    return clipPath(d);
  },
  out: (p) => ({style: {transform: `skewX(${f1(-14 * ease.cubicIn(p))}deg)`}, dim: 0.45 * p}),
  Overlay: ({p, b}) => (
    <Svg glow={b} blur={7}>
      {Array.from({length: NSTRIPE}, (_, k) => {
        const {c, hw} = stripe(k, p);
        const q = hw / (SP / 2 + 2);
        if (q <= 0.01 || q >= 0.999) return null;
        return [-1, 1].map((s) => <line key={`${k}${s}`} x1={c + s * hw + 20} y1={-20} x2={c + s * hw - H - 20} y2={H + 20} stroke={s > 0 ? '#FFFFFF' : b} strokeWidth={s > 0 ? 2 : 4} opacity={1 - q} />);
      })}
    </Svg>
  ),
};

// ---------- 10. engine → anywhere (5640): the pole collapses to a line, the line splits into two dots, the dots open ----------
const DOTX = 300;
const twoDots: Portal = {
  inn: (p) => {
    if (p < 0.5) return {hide: true};
    const r = 940 * ease.cubicIn(prog(p, 0.5, 1)) ** 0.8;
    return clipPath(r > 1 ? pathCircle(CX - DOTX, CY, r) + pathCircle(CX + DOTX, CY, r) : '');
  },
  out: (p) => {
    if (p >= 0.5) return {hide: true};
    const q = p / 0.5;
    return {style: {transform: `scale(${(1 + 0.03 * q).toFixed(4)}, ${(1 - 0.996 * q ** 1.6).toFixed(4)})`}, flash: 0.85 * q ** 3, top: true};
  },
  Overlay: ({p, b}) => {
    const c = ease.cubicInOut(prog(p, 0.38, 0.56)); // line halves contract into the two dots
    const line = prog(p, 0.3, 0.42) * (1 - prog(p, 0.52, 0.6));
    const dot = hump(prog(p, 0.4, 0.85));
    const r = 940 * ease.cubicIn(prog(p, 0.5, 1)) ** 0.8;
    const seg = (x0: number, x1: number, k: number) => <div key={k} style={{position: 'absolute', left: Math.min(x0, x1), top: CY - 2, width: Math.abs(x1 - x0), height: 4, background: '#FFFFFF', boxShadow: `0 0 18px 4px ${b}`, opacity: line}} />;
    return (
      <AbsoluteFill>
        {line > 0 ? [seg(lerp(0, CX - DOTX, c), lerp(CX, CX - DOTX, c), 0), seg(lerp(CX, CX + DOTX, c), lerp(W, CX + DOTX, c), 1)] : null}
        {[-1, 1].map((s) => (
          <div key={s} style={{position: 'absolute', left: CX + s * DOTX - 70, top: CY - 70, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, #FFFFFF 0%, #FFFFFF 14%, ${rgba(b, 0.8)} 28%, ${rgba(b, 0)} 70%)`, opacity: dot, transform: `scale(${(0.4 + 0.8 * dot).toFixed(3)})`}} />
        ))}
        {r > 1 ? (
          <Svg glow={b} blur={10} opacity={1 - prog(p, 0.75, 1)}>
            <circle cx={CX - DOTX} cy={CY} r={r} fill="none" stroke={b} strokeWidth={5} />
            <circle cx={CX + DOTX} cy={CY} r={r} fill="none" stroke={b} strokeWidth={5} />
          </Svg>
        ) : null}
      </AbsoluteFill>
    );
  },
};

// ---------- 11. anywhere → finale (6120): the dots multiply into ten orbit rings + a light flash ----------
const flashAt = (p: number) => (p < 0.5 ? 0.92 * ease.cubicIn(p / 0.5) : 0.92 * (1 - ease.cubicOut((p - 0.5) / 0.5)));
const tenRings: Portal = {
  inn: (p) => (p < 0.5 ? {hide: true} : {style: {transform: `scale(${(1.12 - 0.12 * ease.expoOut((p - 0.5) / 0.5)).toFixed(4)})`}}),
  out: (p) => ({style: {transform: `scale(${(1 + 0.2 * ease.cubicIn(p)).toFixed(4)})`}}),
  Overlay: ({p}) => (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #FFFFFF 0%, #EEF3FF 38%, ${rgba(C.cobaltHover, 0.85)} 100%)`, opacity: flashAt(p)}} />
      <Svg>
        {WORLDS.map((w, j) => {
          const k = clamp((p - 0.03 * j) / 0.62);
          if (k <= 0 || k >= 1) return null;
          return (
            <ellipse key={w.id} cx={CX} cy={CY} rx={1300 * ease.expoOut(k)} ry={1300 * ease.expoOut(k) * lerp(0.34, 1, k)} transform={`rotate(-19 ${CX} ${CY})`} fill="none" stroke={ACCENT[w.id]} strokeWidth={14 * (1 - k) + 3} opacity={1 - k ** 2} style={{filter: `drop-shadow(0 0 10px ${ACCENT[w.id]})`}} />
          );
        })}
      </Svg>
    </AbsoluteFill>
  ),
};

export const PORTALS: Portal[] = [ignite, drop, sphere, flare, ebbinghaus, checker, railsPortal, grid, cafe, barber, twoDots, tenRings];

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
