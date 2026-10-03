// World 9 · EVIDENCE & AGENTS (electric blue) — the barber pole / aperture problem.
// One striped sheet slides purely SIDEWAYS the whole time (screen-anchored, constant speed). Seen through the tall
// aperture of a pole it reads as climbing; when the aperture opens wide the true sideways motion shows, and the band
// becomes the agent pipeline planner → miner → verifier → synthesis. Then the evidence ledger and AI connections;
// the pole returns, turns flat and collapses into two dots (portal to world 10).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {DOT_R, EXIT_DOTS, T} from './timing';
import {EXPO, EXPO_IN, Glow, IconArrow, IconCheck, IconX, IN_OUT, Label, lerp, mix, Panel, Pill, pop, pulse, rgba, SampleChip, WorldTitle, Backdrop} from './kit';

const A = ACCENT.engine; // #4d7cff
const PALE = '#e9efff';
const LAV = ACCENT.employers;
const TEAL = ACCENT.anywhere;
const P = 120; // stripe period (px, vertical at a fixed x)
const V = 3.2; // sideways surface speed, px / frame (constant for the whole world)
const X0 = 960; // the sheet is anchored to the screen: stripe A where (y - x + X0 + phase) mod P < P/2

type Geo = {cx: number; cy: number; w: number; h: number; flat: number; rot: number};

const POLE = {cx: 1390, cy: 545, w: 160, h: 720};
const BAND = {cx: 960, cy: 520, w: 1680, h: 170};
const DOCK = {cx: 960, cy: 196, w: 1680, h: 64};
const MID = {cx: 960, cy: 540, w: 150, h: 640};

const blend = (a: Omit<Geo, 'flat' | 'rot'>, b: Omit<Geo, 'flat' | 'rot'>, t: number) => ({
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

// Aperture over time.
const geoAt = (f: number): Geo => {
  if (f < T.widen) {
    const t = lerp(f, 6, 36, 0, 1, IN_OUT);
    const full = {cx: 960, cy: 540, w: 2000, h: 1160};
    return {...blend(full, POLE, t), flat: 1 - lerp(f, 22, 38, 0, 1, IN_OUT), rot: 0};
  }
  if (f < T.dock) {
    const t = lerp(f, T.widen, T.widen + 26, 0, 1, EXPO);
    return {...blend(POLE, BAND, t), flat: lerp(f, T.widen, T.widen + 10, 0, 1, EXPO), rot: 0};
  }
  if (f < T.pole) return {...blend(BAND, DOCK, lerp(f, T.dock, T.dock + 26, 0, 1, IN_OUT)), flat: 1, rot: 0};
  const t = lerp(f, T.pole, T.pole + 20, 0, 1, IN_OUT);
  const g = blend(DOCK, MID, t);
  // turn flat + collapse: rotate 90°, shorten to the dot spacing, body thins to nothing
  const k = lerp(f, T.turn, T.dots, 0, 1, IN_OUT);
  const len = g.h + (EXIT_DOTS[1].x - EXIT_DOTS[0].x - g.h) * k;
  return {cx: g.cx, cy: g.cy, w: g.w * (1 - lerp(f, T.turn + 8, T.dots, 0, 1, EXPO_IN)), h: len, flat: 1 - lerp(f, T.pole + 6, T.pole + 20, 0, 1, IN_OUT), rot: 90 * k};
};

// Stripe polygons in the aperture's local frame (unrotated): x(s) maps the surface coordinate s onto the screen,
// cylinder (R·sin(s/R)) ↔ flat sheet (s). The pattern is screen-anchored in flat mode.
const Stripes: React.FC<{g: Geo; phase: number; colA: string; colB: string; id: string; opacity: number}> = ({g, phase, colA, colB, id, opacity}) => {
  const {cx, cy, w, h, flat, rot} = g;
  const R = Math.max(0.5, w / 2);
  const sMax = (1 - flat) * ((Math.PI * R) / 2) + flat * (w / 2);
  const N = flat > 0.999 ? 2 : 40;
  const ss = Array.from({length: N}, (_, i) => -sMax + (2 * sMax * i) / (N - 1));
  const xs = ss.map((s) => cx + (1 - flat) * R * Math.sin(s / R) + flat * s);
  const off = cx - X0 - (phase % P); // y_k(s) = s + off + k·P (stripe A spans +P/2 below)
  const top = cy - h / 2;
  const bot = cy + h / 2;
  const k0 = Math.floor((top - sMax - off - P) / P);
  const k1 = Math.ceil((bot + sMax - off) / P);
  const polys: string[] = [];
  for (let k = k0; k <= k1; k++) {
    const pts: string[] = [];
    for (let i = 0; i < N; i++) pts.push(`${xs[i].toFixed(1)},${(ss[i] + off + k * P).toFixed(1)}`);
    for (let i = N - 1; i >= 0; i--) pts.push(`${xs[i].toFixed(1)},${(ss[i] + off + k * P + P / 2).toFixed(1)}`);
    polys.push(pts.join(' '));
  }
  const shade = 1 - flat;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity, overflow: 'visible'}}>
      <defs>
        <clipPath id={`ap-${id}`}>
          <rect x={cx - w / 2} y={top} width={Math.max(0, w)} height={h} rx={Math.min(w, h) * 0.08 * shade} />
        </clipPath>
        <linearGradient id={`cyl-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#020824" stopOpacity={0.78} />
          <stop offset="0.22" stopColor="#020824" stopOpacity={0.18} />
          <stop offset="0.34" stopColor="#ffffff" stopOpacity={0.2} />
          <stop offset="0.42" stopColor="#ffffff" stopOpacity={0.02} />
          <stop offset="0.7" stopColor="#020824" stopOpacity={0.22} />
          <stop offset="1" stopColor="#020824" stopOpacity={0.85} />
        </linearGradient>
      </defs>
      <g transform={`rotate(${rot} ${cx} ${cy})`}>
        <g clipPath={`url(#ap-${id})`}>
          <rect x={cx - w / 2} y={top} width={Math.max(0, w)} height={h} fill={colB} />
          {polys.map((p, i) => (
            <polygon key={i} points={p} fill={colA} />
          ))}
          {shade > 0.01 ? <rect x={cx - w / 2} y={top} width={Math.max(0, w)} height={h} fill={`url(#cyl-${id})`} opacity={shade} /> : null}
        </g>
        {/* glass tube edges */}
        <rect x={cx - w / 2} y={top} width={Math.max(0, w)} height={h} fill="none" stroke={rgba(PALE, 0.5)} strokeWidth={1.5} rx={Math.min(w, h) * 0.08 * shade} />
      </g>
    </svg>
  );
};

// Café-wall rows (employers' motif) shearing into the diagonal stripes.
const CafeWall: React.FC<{f: number; phase: number}> = ({f, phase}) => {
  const op = 1 - lerp(f, 2, 14, 0, 1, IN_OUT);
  if (op <= 0) return null;
  const t = lerp(f, -12, 6, 0, 1, IN_OUT);
  const hr = P / 2;
  const rows = Math.ceil(1080 / hr) + 2;
  const wrap = (v: number) => ((((v + 60) % 120) + 120) % 120) - 60;
  const K = wrap(540 + X0 + phase - 120);
  const dark = mix('#0b1440', A, t);
  const light = mix(LAV, PALE, t);
  return (
    <AbsoluteFill style={{opacity: op}}>
      {Array.from({length: rows}, (_, r) => {
        const y = r * hr - hr;
        const yc = y + hr / 2;
        const bxCafe = (r % 2) * 30;
        const bx = bxCafe + ((yc - 540 + K) - bxCafe) * t;
        return (
          <div
            key={r}
            style={{
              position: 'absolute',
              left: 0,
              top: y,
              width: 1920,
              height: hr,
              background: `repeating-linear-gradient(90deg, ${light} 0px, ${light} 60px, ${dark} 60px, ${dark} 120px)`,
              backgroundPositionX: bx,
              borderTop: `3px solid ${rgba('#8a90b4', 1 - t)}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// The pole's two end caps — they ride the long axis of the aperture and become the two exit dots.
const Caps: React.FC<{f: number; g: Geo}> = ({f, g}) => {
  const vis = lerp(f, 26, 36);
  if (vis <= 0) return null;
  // long-axis angle: 90° = vertical (pole), 0° = horizontal (band)
  let ang = 90;
  let d = g.h / 2;
  if (f >= T.widen && f < T.pole) {
    const t = lerp(f, T.widen, T.widen + 26, 0, 1, EXPO);
    ang = 90 * (1 - t);
    d = (1 - t) * (g.h / 2) + t * (g.w / 2);
  } else if (f >= T.pole) {
    const t = lerp(f, T.pole, T.pole + 20, 0, 1, IN_OUT);
    ang = 90 * t - g.rot;
    d = t * (g.h / 2) + (1 - t) * (g.w / 2);
  }
  const rad = (ang * Math.PI) / 180;
  const docked = f >= T.dock && f < T.pole ? lerp(f, T.dock, T.dock + 26, 0, 1, IN_OUT) * (1 - lerp(f, T.pole, T.pole + 12)) : 0;
  const r = DOT_R * (1 + 0.5 * pulse(f, T.widen, 12) - 0.35 * docked);
  const teal = lerp(f, T.dots - 6, T.dots + 16, 0, 1, IN_OUT);
  const col = mix(A, TEAL, teal);
  return (
    <>
      {[-1, 1].map((sg) => {
        const x = g.cx + sg * Math.cos(rad) * (d + 4);
        const y = g.cy + sg * Math.sin(rad) * (d + 4);
        const blink = f >= T.dots ? 1 + 0.25 * Math.max(0, Math.sin(((f - T.dots) / 15) * Math.PI + (sg > 0 ? Math.PI : 0))) : 1;
        return (
          <React.Fragment key={sg}>
            <Glow x={x} y={y} r={r * 5} color={col} a={0.4 * vis} />
            <div
              style={{
                position: 'absolute',
                left: x - r * blink,
                top: y - r * blink,
                width: 2 * r * blink,
                height: 2 * r * blink,
                borderRadius: '50%',
                opacity: vis,
                background: `radial-gradient(circle at 38% 35%, #ffffff 0%, ${mix(col, '#ffffff', 0.35)} 35%, ${col} 75%)`,
                boxShadow: `0 0 18px ${rgba(A, 0.8)}`,
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

const Caption: React.FC<{f: number; at: number; out: number; x: number; y: number; children: React.ReactNode; align?: 'left' | 'center'}> = ({f, at, out, x, y, children, align = 'left'}) => {
  const o = lerp(f, at, at + 14) * (1 - lerp(f, out, out + 12, 0, 1, EXPO_IN));
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: align === 'center' ? x - 800 : x,
        top: y,
        width: align === 'center' ? 1600 : undefined,
        textAlign: align,
        opacity: o,
        translate: `0px ${lerp(f, at, at + 20, 18, 0)}px`,
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: 44,
        letterSpacing: '-0.02em',
        color: C.ink,
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {children}
    </div>
  );
};

const UpArrow: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V5M6 11l6-6 6 6" />
  </svg>
);

// ---------- bar 2: the agent pipeline on the band ----------
const STAGES = [
  {name: 'Planner', role: 'planner', what: 'Plans the research'},
  {name: 'Miner', role: 'miner', what: 'Collects public sources'},
  {name: 'Verifier', role: 'verifier', what: 'Re-checks at the source'},
  {name: 'Synthesis', role: 'synthesis', what: 'Builds on accepted evidence'},
];
const NODE_X = [330, 750, 1170, 1590];

const Pipeline: React.FC<{f: number; g: Geo}> = ({f, g}) => {
  const vis = lerp(f, T.widen + 14, T.widen + 30) * (1 - lerp(f, T.pole - 8, T.pole + 6, 0, 1, EXPO_IN));
  if (vis <= 0) return null;
  const dock = lerp(f, T.dock, T.dock + 26, 0, 1, IN_OUT);
  const big = 1 - lerp(f, T.dock, T.dock + 12, 0, 1, EXPO_IN);
  const small = lerp(f, T.dock + 14, T.dock + 30);
  const scale = 1 - 0.45 * dock;
  return (
    <>
      {STAGES.map((s, i) => {
        const at = T.stages[i];
        const on = pop(f, at, 13, 190, 0.6);
        const lit = f >= at;
        const x = NODE_X[i] + dock * (i * -60 + 40);
        const y = g.cy;
        const R = 40 * scale * (0.92 + 0.08 * Math.min(1, on));
        const flash = pulse(f, at, 9);
        return (
          <React.Fragment key={s.role}>
            {/* connector arrow to the next stage */}
            {i < 3 ? (
              <div
                style={{
                  position: 'absolute',
                  left: x + R + 18 * scale,
                  top: y - 1.5,
                  width: (NODE_X[i + 1] - NODE_X[i] + dock * -60) - 2 * R - 36 * scale,
                  height: 3,
                  opacity: vis,
                  background: `linear-gradient(90deg, ${rgba(A, f >= T.stages[i + 1] ? 1 : 0.25)} ${lerp(f, at, T.stages[i + 1], 0, 100, IN_OUT)}%, ${rgba(PALE, 0.18)} 0%)`,
                  boxShadow: f >= T.stages[i + 1] ? `0 0 12px ${rgba(A, 0.7)}` : undefined,
                }}
              />
            ) : null}
            {lit ? <Glow x={x} y={y} r={R * 3.2} color={A} a={vis * (0.35 + 0.4 * flash)} /> : null}
            <div
              style={{
                position: 'absolute',
                left: x - R,
                top: y - R,
                width: 2 * R,
                height: 2 * R,
                borderRadius: '50%',
                opacity: vis,
                background: lit ? mix(A, '#ffffff', flash * 0.6) : C.panel,
                border: `2px solid ${lit ? '#ffffff' : C.line}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(2,6,30,0.6)',
                scale: `${0.7 + 0.3 * Math.min(1.1, on || 0)}`,
              }}
            >
              {lit ? (
                <IconCheck size={R * 1.1} color="#ffffff" stroke={3} />
              ) : (
                <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 20 * scale, color: C.soft}}>{String(i + 1).padStart(2, '0')}</span>
              )}
            </div>
            {/* big labels under the band */}
            {big > 0 ? (
              <div style={{position: 'absolute', left: x - 170, top: y + 112, width: 340, textAlign: 'center', opacity: vis * big * (0.45 + 0.55 * Math.min(1, on))}}>
                <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.2em', color: lit ? A : C.soft}}>{s.role.toUpperCase()}</div>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 36, color: lit ? C.ink : C.soft, marginTop: 4, letterSpacing: '-0.02em'}}>{s.name}</div>
                <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 21, color: C.muted, marginTop: 4}}>{s.what}</div>
              </div>
            ) : null}
            {/* compact inline labels when docked */}
            {small > 0 ? (
              <div style={{position: 'absolute', left: x + R + 12, top: y - 14, opacity: vis * small, fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.ink, whiteSpace: 'nowrap'}}>
                {s.name}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ---------- bar 3: evidence ledger ----------
const LEDGER = [
  {claim: 'Opening observed in employer feed', pub: 'Synthetic QA Employer · careers page', cap: 'Sep 30, 2026, 6:27 AM', st: 'VERIFIED'},
  {claim: 'Role asks for SQL and Python', pub: 'Sample ATS board', cap: 'Sep 30, 2026, 6:29 AM', st: 'VERIFIED'},
  {claim: 'Team is expanding this year', pub: 'Sample business news', cap: 'Sep 29, 2026, 9:12 PM', st: 'REPORTED'},
  {claim: 'Salary band confirmed', pub: 'Search snippet · no primary source', cap: 'Not captured', st: 'REJECTED'},
] as const;

const stColor = (s: string) => (s === 'VERIFIED' ? C.good : s === 'REPORTED' ? C.warning : C.red);

const Ledger: React.FC<{f: number}> = ({f}) => {
  const enter = lerp(f, T.dock + 4, T.dock + 34);
  const leave = lerp(f, T.pole - 10, T.pole + 8, 0, 1, EXPO_IN);
  if (enter <= 0 || leave >= 1) return null;
  const strike = lerp(f, T.reject, T.reject + 12, 0, 1, IN_OUT);
  return (
    <Panel x={120} y={262 + (1 - enter) * 60 + leave * 40} w={1010} h={650} glow={A} style={{opacity: enter * (1 - leave)}}>
      <div style={{padding: '30px 34px 0'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <div>
            <div style={{fontWeight: 700, fontSize: 34, letterSpacing: '-0.02em'}}>Evidence</div>
            <div style={{fontSize: 19, color: C.muted, marginTop: 6}}>Each claim is tied to its publisher, capture time, and verification status.</div>
          </div>
          <SampleChip style={{marginTop: 6}} />
        </div>
        <div style={{display: 'flex', fontFamily: MONO, fontWeight: 700, fontSize: 13, letterSpacing: '0.16em', color: C.soft, marginTop: 26, paddingBottom: 10, borderBottom: `1px solid ${C.line}`}}>
          <span style={{width: 560}}>CLAIM · PUBLISHER</span>
          <span style={{width: 250}}>CAPTURED</span>
          <span>STATUS</span>
        </div>
        {LEDGER.map((r, i) => {
          const at = T.rows[i];
          const s = pop(f, at, 15, 200, 0.6);
          const rej = r.st === 'REJECTED';
          const shownSt = rej && f < T.reject ? 'REPORTED' : r.st;
          const flash = pulse(f, at, 8) + (rej ? pulse(f, T.reject, 10) : 0);
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                height: 92,
                borderBottom: `1px solid ${rgba(C.line, 0.7)}`,
                opacity: Math.min(1, s) * (rej ? 1 - 0.35 * strike : 1),
                translate: `${(1 - Math.min(1, s)) * -40}px 0px`,
                background: rgba(rej && f >= T.reject ? C.red : A, 0.1 * Math.min(1, flash)),
              }}
            >
              <div style={{width: 560, position: 'relative'}}>
                <div style={{fontSize: 24, fontWeight: 600, color: C.ink, display: 'inline-block', position: 'relative'}}>
                  {rej ? '“' + r.claim + '”' : r.claim}
                  {rej ? (
                    <div style={{position: 'absolute', left: -4, top: '54%', height: 3, width: `calc(${strike * 100}% + 8px)`, background: C.red, boxShadow: `0 0 10px ${rgba(C.red, 0.8)}`}} />
                  ) : null}
                </div>
                <div style={{fontSize: 17, color: C.soft, marginTop: 4}}>{r.pub}</div>
              </div>
              <div style={{width: 250, fontFamily: MONO, fontWeight: 500, fontSize: 16, color: C.muted}}>{r.cap}</div>
              <Pill color={stColor(shownSt)} size={15}>
                {shownSt === 'VERIFIED' ? <IconCheck size={15} color={C.good} stroke={3} /> : shownSt === 'REJECTED' ? <IconX size={14} color={C.red} /> : null}
                {shownSt === 'REJECTED' ? 'Rejected' : shownSt}
              </Pill>
            </div>
          );
        })}
        <div style={{display: 'flex', gap: 26, marginTop: 20, fontFamily: MONO, fontSize: 13.5, fontWeight: 500, color: C.soft, letterSpacing: '0.04em', opacity: lerp(f, T.reject + 10, T.reject + 26)}}>
          <span>
            <b style={{color: C.good}}>VERIFIED</b> = verified observation
          </span>
          <span>
            <b style={{color: C.warning}}>REPORTED</b> = reported, unverified
          </span>
          <span style={{color: C.red}}>Snippets can't become verified observations.</span>
        </div>
      </div>
    </Panel>
  );
};

// ---------- bar 4: AI & research connections ----------
const ROUTES = [
  {t: 'Free only', d: 'Zero chargeable API dispatches.'},
  {t: 'Capped paid', d: 'Needs a named provider, model and saved cap.'},
  {t: 'Connected chat', d: 'Research stages wait for your connected chat.'},
  {t: 'Local model', d: 'Uses a local endpoint you set up.'},
];

const Connections: React.FC<{f: number}> = ({f}) => {
  const enter = lerp(f, T.conn, T.conn + 26);
  const leave = lerp(f, T.pole - 4, T.pole + 12, 0, 1, EXPO_IN);
  if (enter <= 0 || leave >= 1) return null;
  const picked = f >= T.pick;
  const pk = pop(f, T.pick, 12, 210, 0.6);
  return (
    <Panel x={1180 + (1 - enter) * 80} y={262 + leave * 40} w={620} h={650} glow={A} style={{opacity: enter * (1 - leave)}}>
      <div style={{padding: '30px 30px 0'}}>
        <Label color={A}>Settings</Label>
        <div style={{fontWeight: 700, fontSize: 32, letterSpacing: '-0.02em', marginTop: 8}}>AI & research connections</div>
        <div style={{fontSize: 18, color: C.muted, marginTop: 6, lineHeight: 1.35}}>Choose a spending policy, then check which routes can actually work.</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 22}}>
          {ROUTES.map((r, i) => {
            const s = pop(f, T.chips[i], 14, 220, 0.55);
            const sel = picked && i === 0;
            return (
              <div
                key={r.t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  height: 82,
                  padding: '0 18px',
                  borderRadius: 7,
                  border: `1px solid ${sel ? C.cobaltHover : C.line}`,
                  background: sel ? mix(C.cobalt, C.cobaltHover, pulse(f, T.pick, 12)) : rgba(C.bg, 0.55),
                  opacity: Math.min(1, s),
                  translate: `${(1 - Math.min(1, s)) * 50}px 0px`,
                  boxShadow: sel ? `0 0 ${30 * Math.min(1, pk)}px ${rgba(A, 0.55)}` : undefined,
                }}
              >
                <div style={{width: 24, height: 24, borderRadius: '50%', border: `2px solid ${sel ? '#fff' : C.soft}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
                  {sel ? <div style={{width: 12 * Math.min(1, pk), height: 12 * Math.min(1, pk), borderRadius: '50%', background: '#fff'}} /> : null}
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontSize: 24, fontWeight: 700, color: C.ink}}>{r.t}</div>
                  <div style={{fontSize: 16, color: sel ? '#dfe6ff' : C.soft, marginTop: 2}}>{r.d}</div>
                </div>
                {sel ? <IconCheck size={26} color="#fff" stroke={3} /> : null}
              </div>
            );
          })}
        </div>
        <div style={{fontFamily: MONO, fontSize: 13.5, color: C.soft, marginTop: 18, letterSpacing: '0.04em', opacity: lerp(f, T.pick + 4, T.pick + 18)}}>This screen never sends an API key.</div>
      </div>
    </Panel>
  );
};

export const World: React.FC = () => {
  const f = useSectionFrame();
  const g = geoAt(f);
  const phase = V * (f + 12);
  const push = 1 + 0.025 * lerp(f, 0, 480, 0, 1, (t) => t);
  // stripe colours: dimmed while the band carries UI on top of it
  const dim = lerp(f, T.widen + 18, T.widen + 40) * (1 - lerp(f, T.pole, T.pole + 16));
  const colA = mix(A, '#2a4bb8', dim * 0.55);
  const colB = mix(PALE, '#1a2b78', dim * 0.82);
  const stripesOn = lerp(f, 2, 12, 0, 1, (t) => t);
  // tracker dots: true sideways motion, visible right after the aperture opens
  const trk = lerp(f, T.widen + 6, T.widen + 18) * (1 - lerp(f, T.stages[1] - 6, T.stages[1] + 10));
  const hit = pulse(f, T.widen, 14);
  return (
    <AbsoluteFill style={{background: C.deep, overflow: 'hidden'}}>
      <Backdrop accent={A} />
      <AbsoluteFill style={{scale: `${push}`}}>
        <Glow x={g.cx} y={g.cy} r={Math.max(g.w, g.h) * 0.75} color={A} a={0.22 + 0.25 * hit} sx={g.w > g.h ? 1.6 : 0.6} />
        <CafeWall f={f} phase={phase} />
        <Stripes g={g} phase={phase} colA={colA} colB={colB} id="pole" opacity={stripesOn} />
        {trk > 0
          ? [-560, 40, 640].map((x0, i) => {
              const x = x0 + V * (f - T.widen) + 960 - 300;
              return (
                <div key={i} style={{position: 'absolute', left: x - 9, top: g.cy - 9, width: 18, height: 18, borderRadius: '50%', background: C.coral, opacity: trk, boxShadow: `0 0 14px ${C.coral}`}}>
                  <div style={{position: 'absolute', left: 22, top: 1, opacity: 0.9}}>
                    <IconArrow size={16} color={C.coral} />
                  </div>
                </div>
              );
            })
          : null}
        <Caps f={f} g={g} />
        <Pipeline f={f} g={g} />
        <Ledger f={f} />
        <Connections f={f} />
      </AbsoluteFill>
      <WorldTitle f={f} index={9} name="EVIDENCE & AGENTS" promise="Trace claims to sources and dates." accent={A} x={150} y={300} out={100} size={96} />
      <Caption f={f} at={T.looks} out={T.widen - 10} x={150} y={640}>
        <UpArrow size={44} color={A} />
        Looks like it's climbing.
      </Caption>
      <Caption f={f} at={T.widen + 4} out={T.stages[1]} x={960} y={300} align="center">
        It never climbs. It only slides sideways.
        <IconArrow size={44} color={C.coral} />
      </Caption>
      <Caption f={f} at={T.stages[1] + 6} out={T.dock - 6} x={960} y={300} align="center">
        <span style={{fontSize: 40}}>
          Agent activity <span style={{color: C.soft, fontWeight: 500}}>— states from the real worker, no simulated progress.</span>
        </span>
      </Caption>
    </AbsoluteFill>
  );
};
