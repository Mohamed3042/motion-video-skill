// The twelve world-to-world EDITS, designed as an editor's cuts. Each runs over 11 active frames centred on its
// boundary b (p = 0 at b-5, 0.5 at b, 1 at b+5); b-6 and b+6 are the clean before/after states (12 frames).
// An edit styles the outgoing and incoming section wrappers (clips, moves, blur) and draws an overlay on top.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, H, MONO, W} from '../brand';
import {tileRect} from '../finale/timing';
import {BOUNDARIES, HALF, J_LEAD, SECTIONS, type SectionId} from './timing';
import {CX, CY, clamp, ease, hash, lerp, mixHex, prog, rgba} from './util';

export type Look = {style?: React.CSSProperties; dim?: number; flash?: number; hide?: boolean; top?: boolean};
type OverlayProps = {p: number; g: number; b: number; k: number; a: string; c: string};
export type Edit = {
  lead?: number; // frames before b the incoming section mounts (default ACTIVE)
  pre?: number; // frames before b the overlay starts (default ACTIVE)
  inn?: (p: number, d: number) => Look; // d = g - b
  out?: (p: number, d: number) => Look;
  Overlay?: React.FC<OverlayProps>;
};

export const sectionAccent = (id: SectionId) => (id === 'intro' || id === 'finale' ? C.amber : ACCENT[id]);
export const ACTIVE = HALF - 1; // 5 frames each side of the boundary
export const editP = (g: number, b: number) => (g - b + ACTIVE) / (2 * ACTIVE);

const DIAG = Math.hypot(CX, CY);
const bump = (p: number) => Math.sin(Math.PI * clamp(p));
const Svg: React.FC<{children: React.ReactNode; glow?: string; blur?: number; opacity?: number}> = ({children, glow, blur = 8, opacity}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity, filter: glow ? `drop-shadow(0 0 ${blur}px ${glow})` : undefined}}>
    {children}
  </svg>
);
// Directional (motion) blur: an SVG filter the section wrappers reference while it is mounted.
const BlurDef: React.FC<{id: string; sx: number; sy: number}> = ({id, sx, sy}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <defs>
      <filter id={id} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
        <feGaussianBlur stdDeviation={`${sx.toFixed(2)} ${sy.toFixed(2)}`} edgeMode="duplicate" />
      </filter>
    </defs>
  </svg>
);
// A recorded-sound squiggle along y (deterministic, scrolls with g).
const wavePath = (y: number, amp: number, g: number, seed: number, x0 = -20, x1 = W + 20) => {
  let d = '';
  for (let x = x0; x <= x1; x += 6) {
    const u = (x + g * 9) / 7;
    const i = Math.floor(u);
    const n = lerp(hash(i + seed), hash(i + 1 + seed), u - i);
    const e = 0.35 + 0.65 * Math.abs(Math.sin(x / 97 + seed + g * 0.05));
    d += `${d ? 'L' : 'M'}${x} ${(y + (n * 2 - 1) * amp * e).toFixed(1)}`;
  }
  return d;
};

// ---------- 0. intro → Ingest: MATCH CUT, the playhead line splits into the edges of the opening folder ----------
const match: Edit = {
  inn: (p) => {
    if (p < 0.5) return {hide: true};
    const e = ease.expoOut((p - 0.5) / 0.5);
    return {style: {clipPath: `inset(-10px ${(CX * (1 - e)).toFixed(1)}px)`, transform: `scale(${1.04 - 0.04 * e})`}};
  },
  Overlay: ({p, c}) => {
    const e = p < 0.5 ? 0 : ease.expoOut((p - 0.5) / 0.5);
    const hot = p < 0.5 ? ease.cubicIn(p / 0.5) : 1 - e;
    return (
      <Svg glow={C.amber} blur={12}>
        {(e > 0 ? [-1, 1] : [0]).map((s) => {
          const x = CX + s * CX * e;
          return (
            <g key={s} opacity={1 - e ** 3}>
              <rect x={x - 2.5} y={-10} width={5} height={H + 20} fill={mixHex(C.amber, c, e)} />
              <rect x={x - 1} y={-10} width={2} height={H + 20} fill="#FFF6E2" opacity={0.4 + 0.6 * hot} />
            </g>
          );
        })}
        {p < 0.62 ? <rect x={CX - 40} y={0} width={80} height={H} fill={C.amber} opacity={0.25 * hot} style={{filter: 'blur(30px)'}} /> : null}
      </Svg>
    );
  },
};

// ---------- 1. Ingest → Sync: MATCH CUT on four waveform strips; the new world opens inside them ----------
const STRIP_Y = [330, 470, 610, 750];
const stripH = (p: number) => lerp(1.5, 345, ease.cubicInOut(prog(p, 0.38, 1)));
const strips: Edit = {
  inn: (p) => {
    if (p < 0.38) return {hide: true};
    const h = stripH(p);
    const d = STRIP_Y.map((y) => `M-10 ${(y - h).toFixed(1)}H${W + 10}V${(y + h).toFixed(1)}H-10Z`).join('');
    return {style: {clipPath: `path('${d}')`}};
  },
  out: (p) => ({style: {transform: `scale(${1 + 0.03 * ease.cubicIn(p)})`}, dim: 0.45 * p}),
  Overlay: ({p, g, a, c}) => {
    const o = bump(p) ** 0.6;
    const h = p < 0.38 ? 0 : stripH(p);
    const col = mixHex(a, c, p);
    return (
      <Svg glow={col} blur={8} opacity={o}>
        {STRIP_Y.map((y, k) => (
          <g key={k}>
            {[-1, 1].map((s) => (
              <path key={s} d={wavePath(y + s * h, 10 + 18 * (1 - p), g, 101 * (k + 1) + (s > 0 ? 7 : 0))} fill="none" stroke={col} strokeWidth={2.5} />
            ))}
          </g>
        ))}
      </Svg>
    );
  },
};

// ---------- 2. Sync → Review: WHIP PAN left with a horizontal motion blur ----------
const whipX = (p: number) => W * ease.cubicInOut(p);
const WHIP_BLUR = "url(#mpw-blur-whip)";
const whip: Edit = {
  out: (p) => ({style: {transform: `translateX(${-whipX(p)}px)`, filter: WHIP_BLUR}}),
  inn: (p) => ({style: {transform: `translateX(${W - whipX(p)}px)`, filter: WHIP_BLUR}}),
  Overlay: ({p, c}) => {
    const s = bump(p) ** 2;
    const seam = W - whipX(p);
    return (
      <AbsoluteFill>
        <BlurDef id="mpw-blur-whip" sx={90 * s} sy={0} />
        <Svg>
          {Array.from({length: 18}, (_, i) => {
            const y = 150 + hash(i * 13 + 5) * 780;
            const len = 300 + hash(i * 7 + 1) * 700;
            const x = W - (whipX(p) * (1.4 + hash(i)) + hash(i * 3) * W) % (W + len);
            return <rect key={i} x={x} y={y} width={len} height={1 + 2 * hash(i * 5)} fill={i % 3 ? '#FFFFFF' : c} opacity={0.18 * s} />;
          })}
          <rect x={seam - 60} y={0} width={120} height={H} fill={c} opacity={0.22 * s} style={{filter: 'blur(40px)'}} />
        </Svg>
      </AbsoluteFill>
    );
  },
};

// ---------- 3. Review → Captions: L-CUT, an edit line sweeps across; the outgoing sound lingers ----------
const lineX = (p: number) => lerp(-40, W + 40, ease.cubicInOut(p));
const lcut: Edit = {
  inn: (p) => ({style: {clipPath: `inset(-10px ${(W - lineX(p)).toFixed(1)}px -10px -10px)`}}),
  out: (p) => ({dim: 0.25 * p}),
  Overlay: ({p, c}) => {
    const x = lineX(p);
    const o = Math.min(1, bump(p) * 2.2);
    const fy = 842;
    const foot = 160 * ease.expoOut(prog(p, 0.1, 0.6)); // the audio edit point trails the picture cut: an "L"
    return (
      <AbsoluteFill style={{opacity: o}}>
        <Svg glow={c} blur={10}>
          <rect x={x - 70} y={0} width={70} height={H} fill={c} opacity={0.12} style={{filter: 'blur(24px)'}} />
          <path d={`M${x} 0V${fy}H${x + foot}`} fill="none" stroke={c} strokeWidth={4} />
          <path d={`M${x} 0V${fy}H${x + foot}`} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.8} />
          <path d={`M${x} ${fy + 22}V${H}`} fill="none" stroke={c} strokeWidth={2} strokeDasharray="6 6" opacity={0.7} />
        </Svg>
        <div style={{position: 'absolute', left: x + 14, top: fy - 34, fontFamily: MONO, fontWeight: 700, fontSize: 14, letterSpacing: '0.28em', color: c, whiteSpace: 'nowrap'}}>L-CUT</div>
      </AbsoluteFill>
    );
  },
};


// ---------- 4. Captions → Handoff: SMASH CUT through black ----------
const smash: Edit = {
  out: (_p, d) => (d >= -2 ? {hide: true} : {style: {transform: `scale(${1 + 0.07 * ease.cubicIn(prog(d, -6, -3))})`}, flash: 0.12 * prog(d, -5, -3)}),
  inn: (_p, d) => (d < 0 ? {hide: true} : {style: {transform: `scale(${1.06 - 0.06 * ease.expoOut(prog(d, 0, 5))})`, filter: `brightness(${(1 + 0.4 * Math.exp(-d / 2)).toFixed(3)}) contrast(${(1 + 0.12 * Math.exp(-d / 2)).toFixed(3)})`}}),
  Overlay: ({b, g}) => (g === b - 2 || g === b - 1 ? <AbsoluteFill style={{background: '#000000'}} /> : null),
};

// ---------- 5. Handoff → Sound Lab (Act I → II): TIMELINE ZOOM-THROUGH ----------
// The camera pulls back until the world is one clip on a timeline track, slides one clip right, and dives in.
const ZMIN = 0.3;
const CLIP_GAP = 120;
const zoomZ = (p: number) => lerp(1, ZMIN, bump(p) ** 0.8);
const zoomPan = (p: number) => (W + CLIP_GAP) * ease.cubicInOut(prog(p, 0.22, 0.78));
const clipStyle = (xc: number, p: number): React.CSSProperties => {
  const z = zoomZ(p);
  return {transform: `translateX(${((xc - zoomPan(p)) * z).toFixed(1)}px) scale(${z.toFixed(4)})`, borderRadius: (10 * (1 - z)) / z / (1 - ZMIN)};
};
const zoom: Edit = {
  out: (p) => ({style: clipStyle(0, p)}),
  inn: (p) => ({style: clipStyle(W + CLIP_GAP, p)}),
  Overlay: ({p, k}) => {
    const z = zoomZ(p);
    const o = clamp((1 - z) / (1 - ZMIN) * 1.6);
    const pan = zoomPan(p);
    const ch = H * z;
    const cw = W * z;
    const top = CY - ch / 2;
    const items: React.ReactNode[] = [];
    for (let j = -2; j <= 3; j++) {
      const s = SECTIONS[k + j];
      if (!s) continue;
      const x = CX + (j * (W + CLIP_GAP) - pan) * z - cw / 2;
      if (x > W || x + cw < 0) continue;
      const acc = sectionAccent(s.id);
      const live = j === 0 || j === 1;
      items.push(
        <g key={j}>
          {live ? null : (
            <g>
              <rect x={x} y={top} width={cw} height={ch} rx={10} fill={C.panel} />
              {[0.3, 0.45, 0.6].map((f, i) => (
                <rect key={i} x={x + cw * 0.12} y={top + ch * f} width={cw * (0.76 - 0.18 * i)} height={ch * 0.06} rx={4} fill={rgba(acc, 0.22 - 0.05 * i)} />
              ))}
            </g>
          )}
          <rect x={x} y={top} width={cw} height={ch} rx={10} fill="none" stroke={acc} strokeWidth={live ? 3 : 2} opacity={live ? 1 : 0.6} />
          <text x={x + 4} y={top + ch + 30} fill={acc} fontFamily={MONO} fontWeight={700} fontSize={15} letterSpacing="0.2em">
            {`${String(s.index).padStart(2, '0')}  ${s.name}`}
          </text>
        </g>,
      );
    }
    const ry = top - 48;
    const ticks: React.ReactNode[] = [];
    for (let i = -40; i <= 40; i++) {
      const x = CX + (i * 60 - (pan % 60)) * z * 3;
      if (x < 0 || x > W) continue;
      ticks.push(<line key={i} x1={x} x2={x} y1={ry + (i % 5 ? 12 : 0)} y2={ry + 22} stroke={C.muted} strokeWidth={1.5} opacity={0.7} />);
    }
    return (
      <AbsoluteFill style={{opacity: o}}>
        <Svg>
          <rect x={-10} y={top - 14} width={W + 20} height={ch + 28} fill="none" stroke={C.line} strokeWidth={1.5} />
          {ticks}
          {items}
          <g style={{filter: `drop-shadow(0 0 8px ${C.amber})`}}>
            <path d={`M${CX - 11} ${ry - 16}H${CX + 11}V${ry - 4}L${CX} ${ry + 6}L${CX - 11} ${ry - 4}Z`} fill={C.amber} />
            <rect x={CX - 1.5} y={ry} width={3} height={ch + 76} fill={C.amber} />
          </g>
        </Svg>
      </AbsoluteFill>
    );
  },
};

// ---------- 6. Sound Lab → Picture Lab: FILM-GATE SLIP with a sprocket flash ----------
const FL = 96; // frame line between the two frames
const gateS = (p: number) => (p < 0.5 ? 0.5 * ease.cubicIn(p / 0.5) : 0.5 + 0.5 * ease.backOut((p - 0.5) / 0.5));
const gateY = (p: number) => (H + FL) * gateS(p);
const gate: Edit = {
  out: (p) => ({style: {transform: `translateY(${-gateY(p)}px)`, filter: 'url(#mpw-blur-gate)'}}),
  inn: (p) => ({style: {transform: `translateY(${H + FL - gateY(p)}px)`, filter: 'url(#mpw-blur-gate)'}}),
  Overlay: ({p, b, c}) => {
    const Y = gateY(p);
    const lineTop = H - Y;
    const s = bump(p);
    const flash = s ** 3;
    const holes: React.ReactNode[] = [];
    for (let j = -20; j <= 20; j++) {
      const y = lineTop + FL / 2 + j * 66 - 12;
      if (y < -40 || y > H + 40) continue;
      for (const x of [22, W - 22 - 34]) holes.push(<rect key={`${j}-${x}`} x={x} y={y} width={34} height={24} rx={5} fill="#F6E7C8" opacity={0.85} />);
    }
    return (
      <AbsoluteFill>
        <BlurDef id="mpw-blur-gate" sx={0} sy={34 * s ** 2} />
        <AbsoluteFill style={{opacity: Math.min(1, s * 2)}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 78, height: H, background: 'rgba(10,8,6,0.92)'}} />
          <div style={{position: 'absolute', right: 0, top: 0, width: 78, height: H, background: 'rgba(10,8,6,0.92)'}} />
          <div style={{position: 'absolute', left: 0, top: lineTop, width: W, height: FL, background: '#0A0806'}} />
          <div style={{position: 'absolute', left: 120, top: lineTop + FL / 2 - 9, fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.34em', color: '#E9A74F', opacity: 0.85, whiteSpace: 'nowrap'}}>
            {`MONTAGE PRO  ▸  ${String(SECTIONS[BOUNDARIES.indexOf(b) + 1].index).padStart(2, '0')}  ${SECTIONS[BOUNDARIES.indexOf(b) + 1].name}  ▸  KEY ${String(b).padStart(5, '0')}`}
          </div>
          <Svg>{holes}</Svg>
        </AbsoluteFill>
        <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 30% at 50% ${((lineTop + FL / 2) / H) * 100}%, rgba(255,246,226,0.95) 0%, ${rgba('#F0A35E', 0.55)} 35%, ${rgba(c, 0.15)} 65%, rgba(0,0,0,0) 85%)`, opacity: 0.9 * flash, mixBlendMode: 'screen'}} />
      </AbsoluteFill>
    );
  },
};

// ---------- 7. Picture Lab → Library: J-CUT, the Library's sound leads (0.5 s), its picture rises after it ----------
const riseY = (p: number) => lerp(H + 30, -30, ease.cubicInOut(p));
const jcut: Edit = {
  pre: J_LEAD,
  inn: (p) => ({style: {clipPath: `inset(${riseY(p).toFixed(1)}px -10px -10px -10px)`}}),
  out: (p) => ({style: {transform: `translateY(${-50 * ease.cubicIn(p)}px)`}, dim: 0.35 * p}),
  Overlay: ({p, g, b, c}) => {
    const lead = ease.cubicOut(prog(g, b - J_LEAD, b - ACTIVE)); // the sound has already arrived
    const y = g < b - ACTIVE ? 900 : riseY(p);
    const amp = (6 + 22 * lead) * (g < b - ACTIVE ? 1 : 1 - 0.6 * p);
    const o = g < b - ACTIVE ? lead : 1 - p ** 4;
    return (
      <AbsoluteFill style={{opacity: o}}>
        <Svg glow={c} blur={8}>
          <path d={wavePath(y, amp, g, 4242, -20, g < b - ACTIVE ? lerp(-20, W + 20, lead) : W + 20)} fill="none" stroke={c} strokeWidth={2.5} />
        </Svg>
        {g < b - ACTIVE + 3 ? (
          <div style={{position: 'absolute', left: 110, top: 848, fontFamily: MONO, fontWeight: 700, fontSize: 14, letterSpacing: '0.28em', color: c, opacity: Math.min(1, lead * 1.5) * (1 - prog(g, b - ACTIVE, b - ACTIVE + 3))}}>
            {`J-CUT  ·  A1 ▸ ${String(SECTIONS[BOUNDARIES.indexOf(b) + 1].index).padStart(2, '0')} ${SECTIONS[BOUNDARIES.indexOf(b) + 1].name}`}
          </div>
        ) : null}
      </AbsoluteFill>
    );
  },
};

// ---------- 8. Library → Edit Room: STUTTER CUT, two stills alternate into apparent motion (beta movement) ----------
// frame offset d → which picture shows and its x offset
const STUTTER: Record<number, ['out' | 'in', number]> = {[-5]: ['out', 0], [-4]: ['out', -26], [-3]: ['in', 34], [-2]: ['out', -14], [-1]: ['in', 16]};
const stutter: Edit = {
  out: (_p, d) => {
    const s = STUTTER[d];
    if (d >= 0 || (s && s[0] === 'in')) return {hide: true};
    return {style: {transform: `translateX(${s ? s[1] : 0}px)`}};
  },
  inn: (_p, d) => {
    const s = STUTTER[d];
    if (d < 0 && (!s || s[0] === 'out')) return {hide: true};
    return {style: {transform: `translateX(${d < 0 ? s[1] : 0}px)`}, flash: d === 0 ? 0.08 : 0};
  },
  Overlay: ({g, b, c}) => {
    const d = g - b;
    const s = STUTTER[d];
    if (!(s && s[0] === 'in') && d !== 0) return null;
    return <AbsoluteFill style={{boxShadow: `inset 0 0 0 6px ${c}, inset 0 0 60px ${rgba(c, 0.4)}`}} />;
  },
};

// ---------- 9. Edit Room → Profile (Act II → III): IRIS MATCH, the cut point closes to the fixation dot ----------
const irisOut = (p: number) => DIAG * (1 - ease.cubicIn(clamp(p / 0.5)));
const irisIn = (p: number) => 10 + (DIAG + 20) * ease.cubicInOut(clamp((p - 0.5) / 0.5));
const iris: Edit = {
  out: (p) => (p >= 0.5 ? {hide: true} : {style: {clipPath: `circle(${irisOut(p).toFixed(1)}px at 50% 50%)`}}),
  inn: (p) => (p <= 0.5 ? {hide: true} : {style: {clipPath: `circle(${irisIn(p).toFixed(1)}px at 50% 50%)`}}),
  Overlay: ({p, a, c}) => {
    const r = p < 0.5 ? irisOut(p) : irisIn(p);
    const col = p < 0.5 ? a : c;
    const dot = 1 - Math.abs(p - 0.5) / 0.5;
    return (
      <Svg glow={col} blur={10}>
        <circle cx={CX} cy={CY} r={r} fill="none" stroke={col} strokeWidth={4} opacity={1 - Math.abs(p - 0.5) ** 3 * 8} />
        <circle cx={CX} cy={CY} r={9 + 5 * dot ** 4} fill={C.focus} opacity={Math.min(1, dot * 1.8)} />
      </Svg>
    );
  },
};

// ---------- 10. Profile → Anywhere: FLOP, a mirror cut (the picture turns over around its vertical axis) ----------
const flop: Edit = {
  out: (p) => (p >= 0.5 ? {hide: true} : {style: {transform: `perspective(2400px) rotateY(${(88 * ease.cubicIn(p / 0.5)).toFixed(2)}deg)`}, dim: 0.6 * ease.cubicIn(p / 0.5)}),
  inn: (p) => (p < 0.5 ? {hide: true} : {style: {transform: `perspective(2400px) rotateY(${(-88 * (1 - ease.cubicOut((p - 0.5) / 0.5))).toFixed(2)}deg)`}, dim: 0.6 * (1 - ease.cubicOut((p - 0.5) / 0.5))}),
  Overlay: ({p, a, c}) => {
    const o = clamp(1 - Math.abs(p - 0.5) / 0.22);
    if (o <= 0) return null;
    return (
      <Svg glow={mixHex(a, c, p)} blur={16}>
        <rect x={CX - 2} y={60} width={4} height={H - 120} fill={mixHex(a, c, p)} opacity={o} />
        <rect x={CX - 0.75} y={60} width={1.5} height={H - 120} fill="#FFFFFF" opacity={o} />
      </Svg>
    );
  },
};

// ---------- 11. Anywhere → Finale: MULTICAM PULL-BACK, the picture shrinks into its tile of the 4×3 grid ----------
const T11 = tileRect(11);
const pullE = (p: number) => ease.cubicInOut(p);
const pullRect = (p: number) => {
  const e = pullE(p);
  return {x: lerp(0, T11.x, e), y: lerp(0, T11.y, e), w: lerp(W, T11.w, e), h: lerp(H, T11.h, e)};
};
const multicam: Edit = {
  out: (p) => {
    const r = pullRect(p);
    const s = r.w / W;
    return {
      style: {transformOrigin: '0 0', transform: `translate(${r.x.toFixed(1)}px, ${r.y.toFixed(1)}px) scale(${s.toFixed(4)})`, borderRadius: (6 * pullE(p)) / s, opacity: 1 - prog(p, 0.8, 1)},
      top: true,
    };
  },
  Overlay: ({p}) => {
    const r = pullRect(p);
    const o = ease.cubicOut(prog(p, 0.15, 0.6));
    return (
      <Svg glow={C.amber} blur={10} opacity={o}>
        <rect x={r.x - 3} y={r.y - 3} width={r.w + 6} height={r.h + 6} rx={8} fill="none" stroke={C.amber} strokeWidth={4} />
      </Svg>
    );
  },
};

export const EDIT_IMPL: Edit[] = [match, strips, whip, lcut, smash, zoom, gate, jcut, stutter, iris, flop, multicam];

// Overlay of whichever edit is active at global frame g (drawn above the sections, inside the camera shake).
export const EditOverlay: React.FC<{g: number}> = ({g}) => {
  for (let k = 0; k < EDIT_IMPL.length; k++) {
    const b = BOUNDARIES[k];
    const E = EDIT_IMPL[k];
    if (!E.Overlay || g < b - (E.pre ?? ACTIVE) || g > b + ACTIVE) continue;
    const O = E.Overlay;
    return <O p={clamp(editP(g, b))} g={g} b={b} k={k} a={sectionAccent(SECTIONS[k].id)} c={sectionAccent(SECTIONS[k + 1].id)} />;
  }
  return null;
};
