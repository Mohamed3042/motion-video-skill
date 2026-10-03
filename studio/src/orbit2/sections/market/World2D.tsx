// World 7 · MY MARKET (periwinkle) — Zöllner illusion. Ponzo rails flatten into grid lines; short alternating hatches make
// the parallel lines lean; the hatches retract and gauges prove the gap is constant: "Straight comparisons." The same
// lines then rotate level and become the country × capability matrix. Exit: the row lines grow café-wall tiles.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {CafeWall, CAFE, Chip, EXPO, EXPO_IN, IconCheck, IN_OUT, Label, lerp, mix, Panel, pop, pulse, rgba, SampleChip, WorldTitle} from './kit';
import {T} from './timing';

const A = ACCENT.market; // #6f8cff
const INK_LINE = '#d6ddff';
const MLINE = '#5870c4'; // matrix row lines
const DEG = Math.PI / 180;
const S = CAFE.ROW; // line spacing (= matrix row height = café-wall row)
const KMAX = 16;
const HS = 30; // hatch spacing along a line
const HL = 28; // hatch half length
const HALF = 1150; // half length of a field line during the illusion
const PAIR = [-2, -1]; // the two lines that light up coral

// matrix geometry (screen): grid x 152…960, row lines y = 616 + 72k for k = -3…3 (= café lines 0…6)
const GX0 = 152;
const GX1 = 960;
const GCX = (GX0 + GX1) / 2;
const GCY = CAFE.Y0 + 3 * S;
const COL0 = 432;
const COLW = 176;

type Pt = [number, number];
const field = (f: number) => {
  const th = (-45 * lerp(f, 6, 46, 0, 1, IN_OUT) + 45 * lerp(f, T.turn[0], T.turn[1], 0, 1, IN_OUT)) * DEG;
  const p = 1.14 * (1 - lerp(f, -12, 20, 0, 1, IN_OUT)); // perspective strength (rails converge while p > 0)
  const tt = lerp(f, T.turn[0], T.turn[1], 0, 1, IN_OUT);
  const px = 960 + (GCX - 960) * tt;
  const py = 540 + (GCY - 540) * tt;
  const [c, s] = [Math.cos(th), Math.sin(th)];
  const proj = (a: number, b: number): Pt => {
    const X = a * c - b * s;
    const Y = a * s + b * c;
    const w = 1 + (p * (540 - Y)) / 1000;
    return [px + X / w, py - 540 + 540 - (540 - Y) / w];
  };
  const depth = (b: number) => 1 + (p * (540 - b)) / 1000;
  return {th, p, proj, depth};
};
const P = (q: Pt) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;

const Zollner: React.FC<{f: number}> = ({f}) => {
  const {p, proj, depth} = field(f);
  const turn = lerp(f, T.turn[0] + 4, T.turn[1] - 2, 0, 1, IN_OUT);
  const ext = lerp(f, T.exit + 6, T.exit + 20, 0, 1, IN_OUT); // exit: lines run full width, thicken into mortar
  const width = 4.5 + (1.6 - 4.5) * turn + (CAFE.MORTAR - 1.6) * ext;
  const base = mix(mix(INK_LINE, MLINE, turn), CAFE.MORTAR_C, ext);
  const pairOn = lerp(f, T.pair - 2, T.pair + 8) * (1 - lerp(f, 198, 222, 0, 1, IN_OUT));
  const hatchLive = f >= T.hatch[0] - 1 && f < T.fade + 26;
  const lines: React.ReactNode[] = [];
  const glows: React.ReactNode[] = [];
  for (let k = -KMAX; k <= KMAX; k++) {
    const b = k * S;
    const inGrid = k >= -3 && k <= 3;
    const inWall = k >= CAFE.K0 - 3 && k <= CAFE.K1 - 3;
    // opacity: ties fade with depth during the perspective entrance; outer lines leave as the field becomes the matrix
    let op = lerp(f, -12, 18, 0.45, 1) * Math.min(1, 1.5 / depth(b));
    if (!inGrid) op *= 1 - lerp(f, T.turn[0] - 2, T.turn[0] + 18, 0, 1, IN_OUT);
    if (inGrid) op *= 1 - 0.35 * turn;
    // a-range (along the line)
    let a0 = -HALF + (-(GCX - GX0) + HALF) * turn;
    let a1 = HALF + (GX1 - GCX - HALF) * turn;
    if (f >= T.exit && inWall) {
      const d = 1.2 * Math.max(0, Math.abs(k) - 3);
      const e = lerp(f, T.exit + 6 + d, T.exit + 16 + d, 0, 1, IN_OUT);
      if (!inGrid) {
        op = e;
        a0 = -404 * e;
        a1 = 404 * e;
      }
      a0 += (-(GCX + 60) - a0) * ext;
      a1 += (1980 - GCX - a1) * ext;
      op = inGrid ? op + (1 - op) * ext : op;
    }
    if (op <= 0.004) continue;
    const isPair = PAIR.includes(k) && pairOn > 0.001;
    const col = isPair ? mix(base, C.coral, pairOn) : base;
    const q0 = proj(a0, b);
    const q1 = proj(a1, b);
    let d = `M${P(q0)}L${P(q1)}`;
    if (hatchLive) {
      const t0 = k % 2 === 0 ? T.hatch[0] : T.hatch[1];
      const phi = (k % 2 === 0 ? 45 : -45) * DEG;
      const [hc, hs] = [Math.cos(phi), Math.sin(phi)];
      const off = Math.abs(k) % 2 ? HS / 2 : 0;
      for (let a = -HALF + HS / 2 + off; a < HALF - HS / 2; a += HS) {
        const u = (a + HALF) / (2 * HALF);
        let s = pop(f, t0 + 10 * u, 12, 210, 0.55);
        s *= 1 - lerp(f, T.fade + 12 * u, T.fade + 9 + 12 * u, 0, 1, IN_OUT);
        if (s <= 0.01) continue;
        const L = HL * s;
        d += `M${P(proj(a - L * hc, b - L * hs))}L${P(proj(a + L * hc, b + L * hs))}`;
      }
    }
    lines.push(<path key={k} d={d} stroke={col} strokeWidth={k === 0 || inGrid ? width : 4.5} fill="none" opacity={op} />);
    if (isPair) glows.push(<path key={'g' + k} d={d} stroke={C.coral} strokeWidth={14} fill="none" opacity={0.22 * pairOn} strokeLinecap="round" />);
  }
  // Ponzo rails (vertical family): converge to a vanishing point, flatten, then leave as the field tilts
  const rails: React.ReactNode[] = [];
  const railOut = 1 - lerp(f, 18, 42, 0, 1, IN_OUT);
  if (railOut > 0) {
    const bmin = -1400 - 6600 * (p / 1.14);
    const bmax = Math.min(1400, 540 + 850 / Math.max(p, 1e-3));
    for (let j = -KMAX; j <= KMAX; j++) {
      const rail = Math.abs(j) === 4;
      const op = (rail ? 1 : lerp(f, -12, 10, 0.22, 0.5)) * railOut;
      const q0 = proj(j * S, bmin);
      const q1 = proj(j * S, bmax);
      rails.push(
        <line
          key={j}
          x1={q0[0]}
          y1={q0[1]}
          x2={q1[0]}
          y2={q1[1]}
          stroke={rail ? mix(C.red, INK_LINE, lerp(f, -10, 14)) : INK_LINE}
          strokeWidth={rail ? 6 : 3}
          opacity={op}
        />,
      );
    }
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      {rails}
      {glows}
      {lines}
      <Gauges f={f} proj={proj} />
    </svg>
  );
};

// equal-gap gauges between the coral pair (drawn in field space, so they ride the rotation)
const Gauges: React.FC<{f: number; proj: (a: number, b: number) => Pt}> = ({f, proj}) => {
  const on = pop(f, T.gauge, 15, 180, 0.7) * (1 - lerp(f, 196, 212, 0, 1, IN_OUT));
  if (on <= 0.01) return null;
  const [b0, b1] = [PAIR[0] * S, PAIR[1] * S];
  return (
    <g opacity={Math.min(1, on * 1.4)}>
      {[-330, 330].map((a) => {
        const m = (b0 + b1) / 2;
        const h = ((b1 - b0) / 2 - 7) * on;
        const p0 = proj(a, m - h);
        const p1 = proj(a, m + h);
        const nx = (p1[0] - p0[0]) / Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        const ny = (p1[1] - p0[1]) / Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        const [tx, ty] = [-ny, nx];
        const head = (q: Pt, dir: number) => `M${q[0] - dir * nx * 9 + tx * 6} ${q[1] - dir * ny * 9 + ty * 6}L${q[0]} ${q[1]}L${q[0] - dir * nx * 9 - tx * 6} ${q[1] - dir * ny * 9 - ty * 6}`;
        const mid: Pt = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
        const tick = (o: number) => `M${mid[0] + nx * o - tx * 9} ${mid[1] + ny * o - ty * 9}L${mid[0] + nx * o + tx * 9} ${mid[1] + ny * o + ty * 9}`;
        return (
          <g key={a} stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <path d={`M${P(p0)}L${P(p1)}`} />
            <path d={head(p0, -1)} />
            <path d={head(p1, 1)} />
            <path d={tick(-3.5) + tick(3.5)} />
          </g>
        );
      })}
    </g>
  );
};

const ParallelPill: React.FC<{f: number}> = ({f}) => {
  const s = pop(f, T.gauge + 4, 14, 190, 0.7);
  const out = lerp(f, 194, 208, 0, 1, EXPO_IN);
  if (s <= 0.01 || out >= 1) return null;
  const {proj} = field(f);
  const [x, y] = proj(-40, ((PAIR[0] + PAIR[1]) / 2) * S);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        translate: '-50% -50%',
        scale: `${0.8 + 0.2 * s}`,
        opacity: Math.min(1, s * 1.5) * (1 - out),
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 16px',
        borderRadius: 7,
        background: rgba(C.bg, 0.92),
        border: `1px solid ${C.coral}`,
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 17,
        letterSpacing: '0.2em',
        color: C.ink,
        boxShadow: `0 0 30px ${rgba(C.coral, 0.35)}`,
      }}
    >
      <svg width={18} height={18} viewBox="0 0 18 18">
        <path d="M6.5 2v14M11.5 2v14" stroke={C.coral} strokeWidth={2.4} strokeLinecap="round" />
      </svg>
      SAME GAP
    </div>
  );
};

const Straight: React.FC<{f: number}> = ({f}) => {
  if (f < T.straight - 1) return null;
  const out = lerp(f, 214, 230, 0, 1, EXPO_IN);
  if (out >= 1) return null;
  const s = pop(f, T.straight, 13, 210, 0.7);
  const flash = pulse(f, T.straight, 8);
  const words = ['Straight', 'comparisons.'];
  return (
    <div
      style={{
        position: 'absolute',
        left: 960,
        top: 782,
        translate: `-50% ${out * 40}px`,
        scale: `${0.92 + 0.08 * s}`,
        opacity: Math.min(1, s * 2) * (1 - out),
        display: 'flex',
        gap: 26,
        padding: '22px 46px 26px',
        borderRadius: 16,
        background: rgba('#050b38', 0.94),
        border: `1px solid ${rgba(A, 0.55)}`,
        boxShadow: `0 30px 80px rgba(2,6,30,0.6), 0 0 ${40 + 80 * flash}px ${rgba(A, 0.25 + 0.4 * flash)}`,
        whiteSpace: 'nowrap',
      }}
    >
      {words.map((w, i) => {
        const k = pop(f, T.straight + i * 3, 14, 200, 0.7);
        return (
          <span
            key={w}
            style={{display: 'inline-block', fontFamily: FONT, fontWeight: 700, fontSize: 84, lineHeight: 1, letterSpacing: '-0.035em', color: i === 0 ? A : C.ink, translate: `0px ${(1 - k) * 30}px`, opacity: Math.min(1, k * 2)}}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---------------- the matrix (country × capability) ----------------
const COUNTRIES = [
  {code: 'EG', name: 'Egypt'},
  {code: 'KW', name: 'Kuwait'},
  {code: 'SA', name: 'Saudi Arabia'},
];
const CAPS: {name: string; v: (number | null)[]}[] = [
  {name: 'AI automation', v: [0.92, 0.38, 0.62]},
  {name: 'Python', v: [0.74, 0.52, 0.8]},
  {name: 'Data pipelines', v: [0.46, null, 0.56]},
  {name: 'Cloud platforms', v: [0.62, 0.3, 0.72]},
  {name: 'Docker containers', v: [0.55, 0.22, null]},
  {name: 'SQL & analytics', v: [0.4, 0.48, 0.34]},
];
const FILTERS = ['Raw observations', 'Verified vacancies', 'Eligible opportunities', 'Evidence coverage'];

const Matrix: React.FC<{f: number}> = ({f}) => {
  const out = lerp(f, T.exit - 2, T.exit + 14, 0, 1, IN_OUT);
  const chrome = lerp(f, T.matrix - 8, T.matrix + 10) * (1 - out);
  if (chrome <= 0.002) return null;
  const snap = pulse(f, T.matrix, 12);
  const colGrow = lerp(f, T.matrix, T.matrix + 16, 0, 1, EXPO);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: chrome}}>
        <div style={{position: 'absolute', left: 152, top: 192, fontFamily: FONT, fontWeight: 700, fontSize: 31, color: C.ink, letterSpacing: '-0.01em'}}>Country × capability matrix</div>
        <div style={{position: 'absolute', left: 152, top: 236, fontFamily: FONT, fontWeight: 500, fontSize: 18, color: C.muted}}>Counts of your saved research — not the whole market</div>
        <SampleChip style={{position: 'absolute', right: 1920 - 960, top: 194}} />
        <div style={{position: 'absolute', left: 152, top: 280, display: 'flex', gap: 8}}>
          {FILTERS.map((t, i) => (
            <div
              key={t}
              style={{
                height: 36,
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 18,
                border: `1px solid ${i === 1 ? C.coral : C.line}`,
                background: i === 1 ? rgba(C.coral, 0.08) : 'transparent',
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: 15,
                color: i === 1 ? C.ink : C.muted,
                whiteSpace: 'nowrap',
                opacity: lerp(f, T.matrix + i * 2, T.matrix + 10 + i * 2),
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <Label style={{position: 'absolute', left: 152, top: 366, fontSize: 13}}>Capability / role</Label>
        {COUNTRIES.map((c, i) => {
          const s = pop(f, T.matrix + 2 + i * 3, 14, 200, 0.7);
          return (
            <div key={c.code} style={{position: 'absolute', left: COL0 + i * COLW, width: COLW, top: 338, textAlign: 'center', opacity: Math.min(1, s * 1.5), translate: `0px ${(1 - s) * 14}px`}}>
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 14, letterSpacing: '0.2em', color: A}}>{c.code}</div>
              <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 20, color: C.ink, marginTop: 2}}>{c.name}</div>
            </div>
          );
        })}
        {CAPS.map((r, i) => (
          <div
            key={r.name}
            style={{
              position: 'absolute',
              left: 168,
              top: CAFE.Y0 + i * S,
              height: S,
              display: 'flex',
              alignItems: 'center',
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: 21,
              color: C.ink,
              opacity: lerp(f, T.matrix + 4 + i * 2, T.matrix + 16 + i * 2),
              translate: `${lerp(f, T.matrix + 4 + i * 2, T.matrix + 22 + i * 2, -16, 0)}px 0px`,
            }}
          >
            {r.name}
          </div>
        ))}
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          {[0, 1, 2].map((i) => {
            const x = COL0 + i * COLW;
            return <line key={i} x1={x} x2={x} y1={330} y2={330 + (CAFE.Y0 + 6 * S - 330) * colGrow} stroke={MLINE} strokeWidth={1.6} opacity={0.65} />;
          })}
          {snap > 0.01 ? <rect x={GX0 - 8} y={CAFE.Y0 - 8} width={GX1 - GX0 + 16} height={6 * S + 16} rx={10} fill="none" stroke={A} strokeWidth={2} opacity={snap * 0.9} /> : null}
        </svg>
      </div>
      {/* cells: one column per beat-and-a-half (EG, KW, SA) */}
      {CAPS.map((r, ri) =>
        r.v.map((v, ci) => {
          const at = T.cols[ci] + ri * 2;
          const s = pop(f, at, 13, 190, 0.6);
          if (s <= 0.01) return null;
          const glow = pulse(f, at, 10);
          const x = COL0 + ci * COLW + 9;
          const y = CAFE.Y0 + ri * S + 9;
          const w = COLW - 18;
          const h = S - 18;
          const common: React.CSSProperties = {position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 7, opacity: Math.min(1, s * 1.5) * (1 - out), scale: `${0.7 + 0.3 * s}`};
          if (v === null)
            return (
              <div key={`${ri}-${ci}`} style={{...common, border: `1.5px dashed ${rgba(C.soft, 0.55)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 13, letterSpacing: '0.14em', color: C.soft}}>
                UNKNOWN
              </div>
            );
          return (
            <div
              key={`${ri}-${ci}`}
              style={{
                ...common,
                background: `linear-gradient(180deg, ${rgba(A, 0.16 + 0.62 * v)} 0%, ${rgba(A, 0.1 + 0.5 * v)} 100%)`,
                border: `1px solid ${rgba('#aab9ff', 0.2 + 0.4 * v)}`,
                boxShadow: glow > 0.01 ? `0 0 ${24 * glow}px ${rgba(A, 0.8 * glow)}` : undefined,
              }}
            >
              <div style={{position: 'absolute', left: 12, right: 12, bottom: 10, height: 4, borderRadius: 2, background: rgba('#ffffff', 0.12)}}>
                <div style={{width: `${100 * v * lerp(f, at + 2, at + 22)}%`, height: 4, borderRadius: 2, background: rgba('#ffffff', 0.85)}} />
              </div>
            </div>
          );
        }),
      )}
    </>
  );
};

// ---------------- right column: capability demand · salary evidence · what changed ----------------
const DEMAND = [
  {name: 'AI automation', v: 0.92},
  {name: 'Python', v: 0.78},
  {name: 'Data pipelines', v: 0.61},
  {name: 'Cloud platforms', v: 0.52},
  {name: 'Docker containers', v: 0.4},
];
const RX = 1040;
const RW = 760;

const cardIn = (f: number, at: number, i: number) => {
  const s = pop(f, at, 15, 170, 0.75);
  const out = lerp(f, T.exit - 4 + i * 3, T.exit + 10 + i * 3, 0, 1, EXPO_IN);
  return {s, out, style: {opacity: Math.min(1, s * 1.6) * (1 - out), translate: `${(1 - s) * 90 + out * 80}px 0px`} as React.CSSProperties};
};

const Demand: React.FC<{f: number}> = ({f}) => {
  const {s, out, style} = cardIn(f, T.demand - 14, 0);
  if (s <= 0.005 || out >= 1) return null;
  return (
    <Panel x={RX} y={170} w={RW} h={262} style={style} glow={A}>
      <div style={{position: 'absolute', left: 32, top: 24, fontFamily: FONT, fontWeight: 700, fontSize: 26, color: C.ink}}>Capability demand</div>
      <div style={{position: 'absolute', left: 32, top: 62, fontFamily: FONT, fontWeight: 500, fontSize: 16, color: C.muted}}>From your saved research</div>
      <SampleChip style={{position: 'absolute', right: 28, top: 26}} />
      {DEMAND.map((d, i) => {
        const g = lerp(f, T.demand + i * 3, T.demand + 26 + i * 3, 0, 1, EXPO);
        return (
          <div key={d.name} style={{position: 'absolute', left: 32, right: 32, top: 104 + i * 30, height: 24, display: 'flex', alignItems: 'center', gap: 18}}>
            <div style={{width: 210, fontFamily: FONT, fontWeight: 500, fontSize: 17, color: C.muted, whiteSpace: 'nowrap'}}>{d.name}</div>
            <div style={{position: 'relative', flex: 1, height: 12, borderRadius: 6, background: C.raised}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${100 * d.v * g}%`, borderRadius: 6, background: `linear-gradient(90deg, ${rgba(A, 0.55)}, ${A})`, boxShadow: `0 0 14px ${rgba(A, 0.45)}`}} />
            </div>
          </div>
        );
      })}
    </Panel>
  );
};

const SALARY: {code: string; range?: [number, number]}[] = [
  {code: 'EG', range: [0.18, 0.5]},
  {code: 'KW'},
  {code: 'SA', range: [0.34, 0.72]},
];
const Salary: React.FC<{f: number}> = ({f}) => {
  const {s, out, style} = cardIn(f, T.salary - 2, 1);
  if (s <= 0.005 || out >= 1) return null;
  const flash = pulse(f, T.salary, 10);
  return (
    <Panel x={RX} y={454} w={RW} h={212} style={{...style, borderColor: mix(C.line, A, flash)}} glow={A}>
      <div style={{position: 'absolute', left: 32, top: 24, fontFamily: FONT, fontWeight: 700, fontSize: 26, color: C.ink}}>Salary evidence</div>
      <div style={{position: 'absolute', left: 32, top: 56, fontFamily: FONT, fontSize: 18, color: C.muted}}>Illustrative ranges · currencies / units differ</div>
      <SampleChip style={{position: 'absolute', right: 28, top: 26}} />
      {SALARY.map((r, i) => {
        const g = lerp(f, T.salary + 4 + i * 4, T.salary + 30 + i * 4, 0, 1, EXPO);
        return (
          <div key={r.code} style={{position: 'absolute', left: 32, right: 32, top: 80 + i * 40, height: 30, display: 'flex', alignItems: 'center', gap: 18}}>
            <div style={{width: 40, fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.16em', color: A}}>{r.code}</div>
            {r.range ? (
              <>
                <div style={{position: 'relative', width: 400, height: 10, borderRadius: 5, background: C.raised}}>
                  <div
                    style={{
                      position: 'absolute',
                      top: -3,
                      height: 16,
                      left: `${100 * r.range[0]}%`,
                      width: `${100 * (r.range[1] - r.range[0]) * g}%`,
                      borderRadius: 8,
                      background: `linear-gradient(90deg, ${rgba(C.good, 0.6)}, ${C.good})`,
                    }}
                  />
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 11px', borderRadius: 14, border: `1px solid ${rgba(C.good, 0.5)}`, background: rgba(C.good, 0.1), fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.good, opacity: g}}>
                  Sourced · dated
                </div>
              </>
            ) : (
              <>
                <div style={{width: 400, height: 10, borderRadius: 5, border: `1.5px dashed ${rgba(C.soft, 0.5)}`}} />
                <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 15, color: C.soft, opacity: g}}>Undisclosed pay stays unknown</div>
              </>
            )}
          </div>
        );
      })}
    </Panel>
  );
};

const CHANGES = ['Data pipelines — newly observed in Kuwait', 'Salary evidence — added for Egypt', 'Sources — re-checked and dated'];
const Changes: React.FC<{f: number}> = ({f}) => {
  const {s, out, style} = cardIn(f, T.changes[0] - 14, 2);
  if (s <= 0.005 || out >= 1) return null;
  return (
    <Panel x={RX} y={688} w={RW} h={196} style={style} glow={A}>
      <div style={{position: 'absolute', left: 32, top: 24, fontFamily: FONT, fontWeight: 700, fontSize: 26, color: C.ink}}>What changed</div>
      {CHANGES.map((t, i) => {
        const at = T.changes[i];
        const k = pop(f, at, 13, 210, 0.6);
        const glow = pulse(f, at, 9);
        return (
          <div key={t} style={{position: 'absolute', left: 32, right: 32, top: 74 + i * 38, height: 32, display: 'flex', alignItems: 'center', gap: 14}}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                border: `1.5px solid ${k > 0.05 ? C.good : C.line}`,
                background: rgba(C.good, 0.14 * k),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scale: `${1 + 0.35 * glow}`,
                boxShadow: glow > 0.02 ? `0 0 ${18 * glow}px ${rgba(C.good, glow)}` : undefined,
              }}
            >
              <IconCheck size={20} color={C.good} draw={lerp(f, at, at + 10)} />
            </div>
            <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 18, color: k > 0.05 ? C.ink : C.soft, opacity: 0.5 + 0.5 * Math.min(1, k)}}>{t}</div>
          </div>
        );
      })}
    </Panel>
  );
};

export const World: React.FC = () => {
  const f = useSectionFrame();
  const panelOn = lerp(f, T.turn[0] + 14, T.matrix + 6) * (1 - lerp(f, T.exit, T.exit + 16, 0, 1, IN_OUT));
  const titleShade = lerp(f, -6, 8) * (1 - lerp(f, T.titleOut + 2, T.titleOut + 26, 0, 1, IN_OUT));
  const g = f - 480; // frames relative to the market → employers boundary
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(90% 80% at 55% 45%, #0d1f78 0%, ${C.bg} 55%, ${C.deep} 100%)`}} />
      <div style={{position: 'absolute', left: 960 - 800, top: 540 - 800, width: 1600, height: 1600, background: `radial-gradient(circle, ${rgba(A, 0.13)} 0%, ${rgba(A, 0.04)} 38%, transparent 64%)`}} />
      {panelOn > 0.002 ? <Panel x={120} y={170} w={872} h={704} style={{opacity: panelOn}} glow={A} /> : null}
      {f < T.cafe ? <Zollner f={f} /> : null}
      <Matrix f={f} />
      <Demand f={f} />
      <Salary f={f} />
      <Changes f={f} />
      <ParallelPill f={f} />
      {titleShade > 0.002 ? (
        <AbsoluteFill style={{background: `linear-gradient(90deg, ${rgba('#050b38', 0.95)} 0%, ${rgba('#050b38', 0.88)} 36%, ${rgba('#050b38', 0)} 64%)`, opacity: titleShade}} />
      ) : null}
      <WorldTitle f={f} index={7} name="MY MARKET" promise="See the market you're in." accent={A} x={120} y={372} out={T.titleOut} />
      <Straight f={f} />
      {f >= T.cafe ? <CafeWall g={g} /> : null}
    </AbsoluteFill>
  );
};
