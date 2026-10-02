import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {Card, EXPO, EXPO_IN, IconCheck, IconPlay, IconSwap, IN_OUT, Label, lerp, mix, pop, pulse, Wave, waveHeights, WorldTitle} from './kit';
import {PINGS, T} from './timing';

const V = ACCENT.evolution; // #A77BFF
const BG = '#05030a';

// ---------- the moiré: two real line gratings ----------
// A (original): light lines, pitch P = 12 px, 50 % duty, straight. B (candidate): dark bars 8/12 that occlude A,
// slightly rotated, scaled and warped → the beat pattern between them forms large drifting ghost bands.
// The giant "A ⇄ B" exists ONLY as a phase shift φ of B's bars inside the glyph region (φ = P/2 at the reveal):
// there B is in phase with A's dark stripes, so 4 px of every A line passes; outside it B sits on A's light
// stripes and cancels them completely. Both regions have the same duty, so the glyph is only ever visible through
// interference: as B converges onto A the fringes balloon and resolve into the glyph (nothing draws it).
const P = 12;
const stripes = (x0: number, x1: number, y0: number, y1: number, a: number, b: number) => {
  let d = '';
  for (let k = Math.floor(y0 / P); k <= Math.ceil(y1 / P); k++) d += `M${x0} ${k * P + a}H${x1}V${k * P + b}H${x0}Z`;
  return d;
};
const A_W = 2200;
const A_PATH = stripes(-A_W / 2, A_W / 2, -720, 720, 0, 6);
// warped bars: w = vertical displacement sampled every 40 px across x ∈ [-1700, 1700]
const XS = Array.from({length: 86}, (_, i) => -1700 + i * 40);
const wavyStripes = (w: number[], a: number, b: number) => {
  if (w.every((v) => Math.abs(v) < 0.01)) return stripes(-1700, 1700, -1300, 1300, a, b);
  const parts: string[] = [];
  for (let k = Math.floor(-1300 / P); k <= Math.ceil(1300 / P); k++) {
    const y = k * P;
    let d = `M${XS[0]} ${(y + a + w[0]).toFixed(2)}`;
    for (let i = 1; i < XS.length; i++) d += `L${XS[i]} ${(y + a + w[i]).toFixed(2)}`;
    for (let i = XS.length - 1; i >= 0; i--) d += `L${XS[i]} ${(y + b + w[i]).toFixed(2)}`;
    parts.push(d + 'Z');
  }
  return parts.join('');
};
const sstep = (f: number, a: number, b: number) => lerp(f, a, b, 0, 1, IN_OUT);

const Glyph: React.FC<{color: string}> = ({color}) => (
  <g>
    <text x={-455} y={168} fontFamily={FONT} fontWeight={900} fontSize={470} textAnchor="middle" fill={color}>
      A
    </text>
    <text x={455} y={168} fontFamily={FONT} fontWeight={900} fontSize={470} textAnchor="middle" fill={color}>
      B
    </text>
    <path
      d="M-170 -52H165M108 -112L170 -52L108 8M170 72H-165M-108 12L-170 72L-108 132"
      fill="none"
      stroke={color}
      strokeWidth={48}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
);

// cube edge the gratings collapse into (Settings' Necker cube front-left edge)
const EDGE = {x: 1025, y0: 425, y1: 805};

// B's state per frame: transform, warp profile and the glyph phase φ.
const bState = (f: number) => {
  const slide = lerp(f, T.bIn, T.bIn + 76, 1, 0, EXPO);
  const u = Math.max(0, Math.min(1, (f - T.converge) / (T.reveal - T.converge)));
  const k = f < T.reveal ? 1 - u ** 1.6 : 0; // residual misalignment: 1 → 0 exactly on the impact frame
  const rel = sstep(f, T.release, T.release + 50);
  let th = 4.2 * k + rel * (2.1 + 0.6 * Math.sin((f - T.release) / 46));
  if (f >= T.reveal) th += 0.28 * Math.sin((f - T.reveal) / 2.6) * Math.exp(-(f - T.reveal) / 6); // lock wobble
  const sc = 1 + 0.03 * k + 0.008 * rel;
  const ty = k * (26 + 30 * Math.sin(f / 21)) + rel * (f - T.release) * 0.3;
  const amp = 24 * k + 14 * rel;
  const w = XS.map((x) => amp * (0.65 * Math.sin((x / 760) * 6.283 + f / 30) + 0.35 * Math.sin((x / 1330) * 6.283 - f / 47 + 1.3)));
  // the candidate "evolves": the glyph phase grows only in the last stretch of the convergence, then fades again
  const phi = (P / 2) * (sstep(f, 148, 177) - sstep(f, T.release + 4, T.release + 30));
  return {transform: `translate(${960 + slide * 2100} ${540 + ty}) rotate(${th}) scale(${sc})`, w, phi};
};

const Moire: React.FC<{f: number}> = ({f}) => {
  // entrance: the Arcade's collapsed CRT line splits into grating A
  const open = lerp(f, -12, 28, 0, 1, EXPO);
  // exit: A rotates 90° (lines stay visible while turning), then condenses onto the cube edge
  const ex = lerp(f, T.exit + 12, 478, 0, 1, IN_OUT);
  const squeeze = lerp(f, T.exit + 18, 481, 0, 1, (t) => t ** 2.2);
  const sy = 0.003 ** (1 - open + squeeze);
  const sx = 1 + (380 / A_W - 1) * ex;
  const cx = 960 + (EDGE.x - 960) * ex;
  const cy = 540 + ((EDGE.y0 + EDGE.y1) / 2 - 540) * ex;
  const aT = `translate(${cx} ${cy}) rotate(${90 * ex}) scale(${sx} ${sy})`;

  // light level: dim under the title, full for the illusion, backdrop under the UI, full again for the exit
  const level =
    f < 120
      ? lerp(f, 60, 110, 0.55, 1, IN_OUT)
      : f < 300
        ? lerp(f, T.release, T.release + 30, 1, 0.24, IN_OUT)
        : lerp(f, T.exit + 10, T.exit + 22, 0.24, 1, IN_OUT);
  const flash = pulse(f, T.reveal, 9);
  // ping-pong: left (A) half brightens on A's calls, right (B) half on B's answers
  let pa = 0;
  let pb = 0;
  for (const p of PINGS) {
    const v = pulse(f, p.f, 9) * (f >= T.reveal - 2 ? 1 : 0.35);
    if (p.side === 'A') pa = Math.max(pa, v);
    else pb = Math.max(pb, v);
  }
  const silver = ex;
  const stop = (lift: number) => mix(mix(V, '#efe6ff', 0.25 + 0.55 * lift + flash * 0.75), '#e6e6e6', silver);
  const bOp = 1 - lerp(f, T.exit + 4, T.exit + 16, 0, 1, IN_OUT);
  const b = bState(f);
  // bloom: a blurred copy of the real composite (not of the glyph) while the reveal holds
  const bloom =
    f >= T.reveal - 8 && f < T.release + 20 ? lerp(f, T.reveal - 8, T.reveal, 0, 1) * (1 - lerp(f, T.release, T.release + 20, 0, 1)) : 0;

  const svg = (key: string, style?: React.CSSProperties) => (
      <svg key={key} width={1920} height={1080} style={{position: 'absolute', inset: 0, ...style}}>
        <defs>
          <linearGradient id="evo-light" gradientUnits="userSpaceOnUse" x1={-960} y1={0} x2={960} y2={0}>
            <stop offset="0" stopColor={stop(pa * 0.9)} />
            <stop offset="0.5" stopColor={stop(0.18)} />
            <stop offset="1" stopColor={stop(pb * 0.9)} />
          </linearGradient>
          <mask id="evo-in" maskUnits="userSpaceOnUse" x={-1800} y={-1400} width={3600} height={2800}>
            <Glyph color="#fff" />
          </mask>
          <mask id="evo-out" maskUnits="userSpaceOnUse" x={-1800} y={-1400} width={3600} height={2800}>
            <rect x={-1800} y={-1400} width={3600} height={2800} fill="#fff" />
            <Glyph color="#000" />
          </mask>
        </defs>
        <g transform={aT} opacity={level}>
          <path d={A_PATH} fill="url(#evo-light)" />
        </g>
        {bOp > 0 ? (
          <g transform={b.transform} opacity={bOp}>
            <path d={wavyStripes(b.w, -1 + b.phi, 7 + b.phi)} fill={BG} mask="url(#evo-in)" />
            <path d={wavyStripes(b.w, -1, 7)} fill={BG} mask="url(#evo-out)" />
          </g>
        ) : null}
      </svg>
  );
  return (
    <AbsoluteFill>
      {svg('m')}
      {bloom > 0 ? svg('bloom', {filter: 'blur(9px)', opacity: 0.8 * bloom, mixBlendMode: 'screen'}) : null}
      {/* the CRT line we enter on / the cube edge we leave on */}
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 538,
          width: 1600,
          height: 4,
          borderRadius: 2,
          background: '#f4eeff',
          boxShadow: `0 0 18px ${V}, 0 0 50px ${V}`,
          opacity: 1 - lerp(f, -12, 16, 0, 1, IN_OUT),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: EDGE.x - 2,
          top: EDGE.y0,
          width: 4,
          height: EDGE.y1 - EDGE.y0,
          borderRadius: 2,
          background: '#f2f2f2',
          boxShadow: '0 0 16px rgba(255,255,255,0.8), 0 0 44px rgba(230,230,230,0.5)',
          opacity: lerp(f, 468, 482, 0, 1, IN_OUT),
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- UI fragments ----------
const HA = waveHeights(58, 71);
const HB = waveHeights(58, 72);
const CMP = {x: 150, y: 318, w: 930, h: 440};
const SIDE = {x: 1120, y: 318, w: 650, h: 440};
const WAVE_X = 400;
const WAVE_W = 490;

const PlayBtn: React.FC<{on: number; accent: string}> = ({on, accent}) => (
  <div
    style={{
      width: 64,
      height: 64,
      borderRadius: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: mix('#2a2a2a', '#ffffff', on),
      boxShadow: on > 0.05 ? `0 0 ${30 * on}px ${accent}` : undefined,
    }}
  >
    <IconPlay size={30} color={mix('#ffffff', '#000000', on)} />
  </div>
);

const Row: React.FC<{f: number; y: number; at: number; letter: 'A' | 'B'; name: string; sub: string; heights: number[]; play: [number, number]}> = ({
  f,
  y,
  at,
  letter,
  name,
  sub,
  heights,
  play,
}) => {
  const s = pop(f, at, 16, 170, 0.7);
  const isB = letter === 'B';
  const tone = isB ? V : '#ffffff';
  // playing: lit during this row's ping-pong phrase
  const playing = f >= play[0] && f < play[1] ? 1 : 0;
  const on = playing ? Math.min(1, (f - play[0]) / 4) : Math.max(0, 1 - (f - play[1]) / 8) * (f >= play[1] ? 1 : 0);
  const head = lerp(f, play[0], play[1], 0, 1, (t) => t);
  // scan line from the Run comparison press
  const scan = lerp(f, T.run, T.scanEnd, 0, 1, IN_OUT);
  const lit = f >= T.run ? scan : f >= play[0] ? head : 0;
  const ping = Math.max(...PINGS.filter((p) => p.side === letter && p.f >= at).map((p) => pulse(f, p.f, 7)), 0);
  const kept = isB ? pop(f, T.kept, 12, 200, 0.6) : 0;
  const dimA = !isB ? lerp(f, T.kept, T.kept + 12, 1, 0.55) : 1;
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: CMP.w, height: 100, opacity: Math.min(1, s * 1.5), translate: `${(1 - s) * -40}px 0px`}}>
      <div style={{position: 'absolute', left: 32, top: 18}}>
        <PlayBtn on={on} accent={tone} />
      </div>
      <div style={{position: 'absolute', left: 120, top: 20, fontFamily: FONT, opacity: dimA}}>
        <div style={{fontWeight: 700, fontSize: 27, color: C.fg, letterSpacing: '-0.01em'}}>
          <span style={{color: tone}}>{letter}</span> · {name}
        </div>
        <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 15, color: '#8c8c8c', letterSpacing: '0.12em', marginTop: 6}}>{sub}</div>
      </div>
      <div style={{position: 'absolute', left: WAVE_X, top: 8, opacity: dimA}}>
        <Wave heights={heights} w={WAVE_W} h={84} color="#4a4a4a" litColor={tone} lit={lit} amp={0.85 + 0.25 * ping} reveal={lerp(f, at, at + 26, 0, 1)} />
      </div>
      {kept > 0 ? (
        <div
          style={{
            position: 'absolute',
            right: 26,
            top: -14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px 6px 8px',
            borderRadius: 99,
            background: C.green,
            color: '#000',
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 18,
            scale: `${kept}`,
            boxShadow: `0 0 26px ${C.green}88`,
          }}
        >
          <IconCheck size={22} color="#000" />
          Kept
        </div>
      ) : null}
    </div>
  );
};

const CompareCard: React.FC<{f: number}> = ({f}) => {
  const s = pop(f, T.rowA - 6, 18, 140, 0.8);
  const leave = lerp(f, T.exit, T.exit + 16, 0, 1, EXPO_IN);
  if (s <= 0 || leave >= 1) return null;
  const press = pop(f, T.run, 9, 260, 0.5);
  const btnScale = f < T.run - 4 ? 1 : f < T.run ? 1 - 0.07 * ((f - T.run + 4) / 4) : 0.93 + 0.07 * press;
  const btn = pop(f, T.runBtn, 14, 200, 0.6);
  const chip = pop(f, T.editorChip, 14, 200, 0.6);
  const ring = f >= T.run ? lerp(f, T.run, T.run + 26, 0, 1) : 0;
  const scan = lerp(f, T.run, T.scanEnd, 0, 1, IN_OUT);
  const scanOn = f >= T.run && f < T.scanEnd + 10 ? 1 - lerp(f, T.scanEnd, T.scanEnd + 10, 0, 1) : 0;
  return (
    <Card
      x={CMP.x}
      y={CMP.y}
      w={CMP.w}
      h={CMP.h}
      glow={V}
      style={{opacity: Math.min(1, s * 1.4) * (1 - leave), translate: `0px ${(1 - s) * 60 + leave * 50}px`, overflow: 'visible'}}
    >
      <div style={{position: 'absolute', left: 32, top: 22, fontFamily: FONT, fontWeight: 700, fontSize: 28, color: C.fg}}>Compare</div>
      <div style={{position: 'absolute', right: 30, top: 25, display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontSize: 15, letterSpacing: '0.16em', color: '#9a9a9a'}}>
        ORIGINAL <IconSwap size={20} color={V} /> CANDIDATE
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 74, height: 1, background: '#2a2a2a'}} />
      <Row f={f} y={92} at={T.rowA} letter="A" name="Original" sub="TAKE 03 · ORIGINAL" heights={HA} play={[240, 296]} />
      <Row f={f} y={208} at={T.rowB} letter="B" name="Candidate" sub="TAKE 03 · CANDIDATE" heights={HB} play={[300, 356]} />
      {/* scan line across both rows */}
      {scanOn > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: WAVE_X + scan * WAVE_W - 2,
            top: 92,
            width: 4,
            height: 220,
            borderRadius: 2,
            background: '#ffffff',
            opacity: scanOn,
            boxShadow: `0 0 14px #fff, 0 0 40px ${V}, 0 0 80px ${V}`,
          }}
        />
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: 326, height: 1, background: '#2a2a2a'}} />
      <div
        style={{
          position: 'absolute',
          left: 32,
          top: 350,
          height: 62,
          padding: '0 30px 0 24px',
          borderRadius: 31,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: C.green,
          color: '#000',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: '-0.01em',
          opacity: Math.min(1, btn * 1.5),
          scale: `${(0.8 + 0.2 * btn) * btnScale}`,
          boxShadow: `0 0 ${20 + 60 * pulse(f, T.run, 12)}px ${C.green}${f >= T.run ? 'aa' : '44'}`,
        }}
      >
        <IconSwap size={26} color="#000" stroke={2.6} />
        Run comparison
        {ring > 0 && ring < 1 ? (
          <div
            style={{
              position: 'absolute',
              inset: -14 * ring - 2,
              borderRadius: 60,
              border: `3px solid ${C.green}`,
              opacity: 1 - ring,
            }}
          />
        ) : null}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 380,
          top: 358,
          height: 46,
          padding: '0 20px',
          borderRadius: 23,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#242424',
          border: '1px solid #333',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 19,
          color: '#cfcfcf',
          opacity: Math.min(1, chip * 1.5),
          translate: `${(1 - chip) * 30}px 0px`,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{color: C.fg, fontWeight: 700}}>Audio editor</span>
        <span style={{color: '#666'}}>·</span> trim <span style={{color: '#666'}}>·</span> export <span style={{color: '#666'}}>·</span> compare
      </div>
    </Card>
  );
};

const ResultChip: React.FC<{text: string; letter: 'A' | 'B'; fresh?: boolean; style?: React.CSSProperties}> = ({text, letter, fresh, style}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      height: 54,
      padding: '0 16px 0 10px',
      borderRadius: 14,
      background: fresh ? '#2a2440' : '#242424',
      border: `1px solid ${fresh ? V + '88' : '#313131'}`,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: 19,
      color: C.fg,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    <span
      style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: 18,
        color: letter === 'B' ? '#120a24' : '#111',
        background: letter === 'B' ? V : '#e8e8e8',
      }}
    >
      {letter}
    </span>
    {text}
    <span style={{marginLeft: 'auto'}}>
      <IconCheck size={24} color={C.green} />
    </span>
  </div>
);

const SideCard: React.FC<{f: number}> = ({f}) => {
  const s = pop(f, T.sideCard, 18, 140, 0.8);
  const leave = lerp(f, T.exit + 4, T.exit + 20, 0, 1, EXPO_IN);
  if (s <= 0 || leave >= 1) return null;
  const c1 = pop(f, T.saved[0], 14, 210, 0.6);
  const c2 = pop(f, T.saved[1], 14, 210, 0.6);
  const land = pop(f, T.savedNew - 12, 15, 190, 0.7); // the stack makes room just before the new result lands
  const run = 0.5 + 0.5 * Math.sin(f / 5);
  const colX = [28, 340];
  const push = land * 66;
  return (
    <Card
      x={SIDE.x}
      y={SIDE.y}
      w={SIDE.w}
      h={SIDE.h}
      style={{opacity: Math.min(1, s * 1.4) * (1 - leave), translate: `${(1 - s) * 80}px ${leave * 50}px`}}
    >
      {(['New experiments', 'Saved results'] as const).map((t, i) => (
        <div key={t} style={{position: 'absolute', left: colX[i], top: 24, fontFamily: FONT, fontWeight: 700, fontSize: 24, color: C.fg}}>
          {t}
          <div style={{width: 40, height: 3, borderRadius: 2, background: i ? C.green : V, marginTop: 10}} />
        </div>
      ))}
      <div style={{position: 'absolute', left: 318, top: 24, bottom: 24, width: 1, background: '#2a2a2a'}} />
      {/* New experiments */}
      <div
        style={{
          position: 'absolute',
          left: colX[0],
          top: 96,
          width: 266,
          height: 54,
          borderRadius: 14,
          border: '1.5px dashed #444',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 19,
          color: '#bdbdbd',
        }}
      >
        <span style={{fontSize: 28, fontWeight: 400, color: V, marginTop: -3}}>+</span> New experiment
      </div>
      <div
        style={{
          position: 'absolute',
          left: colX[0],
          top: 162,
          width: 266,
          height: 54,
          borderRadius: 14,
          background: '#242424',
          border: '1px solid #313131',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 19,
          color: C.fg,
          opacity: f < T.savedNew - 20 ? 1 : lerp(f, T.savedNew - 20, T.savedNew - 8, 1, 0.35),
        }}
      >
        <span style={{width: 10, height: 10, borderRadius: 5, background: V, boxShadow: `0 0 ${6 + 10 * run}px ${V}`}} />
        Take 03
        <span style={{display: 'flex', alignItems: 'center', gap: 6, color: '#9a9a9a', fontSize: 17}}>
          A <IconSwap size={18} color={V} /> B
        </span>
      </div>
      {/* Saved results stack (new result pushes in on top) */}
      <div style={{position: 'absolute', left: colX[1], top: 96, width: 286}}>
        <ResultChip text="Take 02 · A kept" letter="A" style={{position: 'absolute', left: 0, top: push, width: 286, opacity: Math.min(1, c2 * 1.6), translate: `0px ${(1 - c2) * 30}px`}} />
        <ResultChip text="Take 01 · B kept" letter="B" style={{position: 'absolute', left: 0, top: 66 + push, width: 286, opacity: Math.min(1, c1 * 1.6), translate: `0px ${(1 - c1) * 30}px`}} />
        {f >= T.savedNew ? (
          <ResultChip
            text="Take 03 · B kept"
            letter="B"
            fresh
            style={{position: 'absolute', left: 0, top: 0, width: 286, scale: `${1 + 0.08 * pulse(f, T.savedNew, 6)}`, boxShadow: `0 0 ${40 * pulse(f, T.savedNew, 10)}px ${V}`}}
          />
        ) : null}
      </div>
    </Card>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  const titleScrim = 1 - lerp(f, T.titleOut, T.titleOut + 20, 0, 1, IN_OUT);
  const uiScrim = lerp(f, T.release, T.release + 30, 0, 1) * (1 - lerp(f, T.exit, T.exit + 16, 0, 1));
  const hold = f >= T.reveal - 4 && f < T.release + 24 ? lerp(f, T.reveal - 4, T.reveal, 0, 1) * (1 - lerp(f, T.release, T.release + 24, 0, 1)) : 0;
  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      <Moire f={f} />
      {/* edge vignette over the gratings */}
      <AbsoluteFill style={{background: 'radial-gradient(120% 95% at 50% 50%, rgba(5,3,10,0) 45%, rgba(5,3,10,0.85) 100%)'}} />
      {/* legibility scrims */}
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(5,3,10,0.92) 0%, rgba(5,3,10,0.7) 45%, rgba(5,3,10,0) 75%)', opacity: titleScrim}} />
      <AbsoluteFill style={{background: 'radial-gradient(80% 70% at 50% 58%, rgba(5,3,10,0.55) 0%, rgba(5,3,10,0) 100%)', opacity: uiScrim}} />
      <WorldTitle f={f} index={7} name="EVOLUTION" promise="Experiment. Compare. Keep what's better." accent={V} x={150} y={360} out={T.titleOut} />
      {/* captions under the resolved glyph */}
      {hold > 0 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center', gap: 380, opacity: hold}}>
          {['ORIGINAL', 'CANDIDATE'].map((t, i) => (
            <Label key={t} style={{color: i ? V : '#e9e2ff', fontSize: 20, letterSpacing: '0.34em'}}>
              {t}
            </Label>
          ))}
        </div>
      ) : null}
      <CompareCard f={f} />
      <SideCard f={f} />
      {/* the Take 03 result travelling from the B row into Saved results */}
      <FlyingChip f={f} />
    </AbsoluteFill>
  );
};

const FlyingChip: React.FC<{f: number}> = ({f}) => {
  if (f < T.savedNew - 20 || f >= T.savedNew) return null;
  const u = lerp(f, T.savedNew - 20, T.savedNew, 0, 1, IN_OUT);
  const x0 = CMP.x + CMP.w - 240;
  const y0 = CMP.y + 208;
  const x1 = SIDE.x + 340;
  const y1 = SIDE.y + 96;
  return (
    <ResultChip
      text="Take 03 · B kept"
      letter="B"
      fresh
      style={{
        position: 'absolute',
        left: x0 + (x1 - x0) * u,
        top: y0 + (y1 - y0) * u - Math.sin(Math.PI * u) * 90,
        width: 286,
        scale: `${1 + 0.12 * Math.sin(Math.PI * u)}`,
        boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 40px ${V}66`,
      }}
    />
  );
};

