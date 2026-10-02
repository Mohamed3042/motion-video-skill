import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {mulberry32, WORLDS} from '../../timing';
import {EXPO, EXPO_IN, IconSearch, IN_OUT, lerp, pop, pulse, WorldTitle} from '../evolution/kit';
import {QUERY, T, typeFrames} from './timing';

const M = ACCENT.guide; // #2EE6A8
const DEEP = '#0b6b50';
const INK = '#0e211a';
const PAPER = '#eef2ef';

// ---------- Kanizsa ----------
const PCX = 1250;
const PCY = 540;
const H = 165; // half side of the illusory square
const R = 100; // inducer radius
const DISCS = [
  {x: -1, y: -1, mouth: 45},
  {x: 1, y: -1, mouth: 135},
  {x: 1, y: 1, mouth: 225},
  {x: -1, y: 1, mouth: 315},
].map((d, i) => {
  const r = mulberry32(900 + i);
  return {...d, off: (100 + r() * 150) * (r() < 0.5 ? -1 : 1)};
});
const r45 = R * Math.SQRT1_2;
const PAC = `M0 0L${r45} ${r45}A${R} ${R} 0 1 1 ${r45} ${-r45}Z`; // mouth faces +x

const Kanizsa: React.FC<{f: number}> = ({f}) => {
  // page: grows from the Settings portal page (1290,540 · 520×680) into the landscape sheet
  const g = lerp(f, -6, 26, 0, 1, EXPO);
  const pw = 520 + (920 - 520) * g;
  const ph = 680 + (700 - 680) * g;
  const px = 1290 + (PCX - 1290) * g;
  const away = lerp(f, T.real + 6, T.real + 24, 0, 1, EXPO_IN); // the sheet slides off right once the page has left it
  if (away >= 1) return null;
  const breathe = 1 + 0.018 * pulse(f, T.square, 14);
  return (
    <AbsoluteFill style={{translate: `${away * 1200}px ${away * 60}px`, rotate: `${away * 6}deg`}}>
      <div
        style={{
          position: 'absolute',
          left: px - pw / 2,
          top: PCY - ph / 2,
          width: pw,
          height: ph,
          borderRadius: 10,
          background: PAPER,
          boxShadow: '0 50px 120px rgba(0,0,0,0.65)',
        }}
      />
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="gd-disc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#19c48f" />
            <stop offset="1" stopColor="#0b8c66" />
          </linearGradient>
        </defs>
        <g transform={`translate(${PCX} ${PCY}) scale(${breathe})`}>
          {DISCS.map((d, i) => {
            const s = pop(f, 4 + i * 5, 13, 180, 0.6);
            if (s <= 0) return null;
            const ev = T.discs[i];
            const u = lerp(f, ev - 11, ev, 0, 1, IN_OUT);
            const wob = f >= ev ? 7 * Math.sin((f - ev) / 2.2) * Math.exp(-(f - ev) / 5) : 0;
            const a = d.mouth + d.off * (1 - u) + wob;
            const shrink = 1 - lerp(f, T.real + 4, T.real + 18, 0, 1, EXPO_IN);
            return <path key={i} d={PAC} fill="url(#gd-disc)" transform={`translate(${d.x * H} ${d.y * H}) rotate(${a}) scale(${s * shrink})`} />;
          })}
          {/* edge inducers: chevrons whose line-ends stop on the illusory edges (nothing draws the square) */}
          {[0, 90, 180, 270].map((rot) => {
            const gr = lerp(f, T.square - 8, T.square, 0, 1, EXPO);
            if (gr <= 0) return null;
            const apex = [0, -H - 58];
            const ends = [
              [-58, -H],
              [58, -H],
            ];
            return (
              <g key={rot} transform={`rotate(${rot})`} opacity={1 - lerp(f, T.real + 2, T.real + 12)}>
                {ends.map(([x, y], k) => (
                  <line key={k} x1={x} y1={y} x2={x + (apex[0] - x) * gr} y2={y + (apex[1] - y) * gr} stroke={DEEP} strokeWidth={5} strokeLinecap="butt" />
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------- illustrated FAQ cards ----------
type Illo = 'range' | 'mic' | 'wave' | 'ab' | 'gear';
const FAQ: {q: string; illo: Illo}[] = [
  {q: 'How do I calibrate?', illo: 'range'},
  {q: 'How do I record a take?', illo: 'mic'},
  {q: 'What does Live do?', illo: 'wave'},
  {q: 'How do I compare A and B?', illo: 'ab'},
  {q: 'Where is engine status?', illo: 'gear'},
];

const Illustration: React.FC<{kind: Illo; size?: number}> = ({kind, size = 150}) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none">
    {kind === 'range' ? (
      <g>
        {[38, 78].map((y, i) => (
          <g key={y}>
            <rect x={14} y={y} width={132} height={16} rx={8} fill="#ffffff" opacity={0.75} />
            <rect x={14} y={y} width={i ? 92 : 108} height={16} rx={8} fill={M} />
            <rect x={70} y={y - 8} width={52} height={32} rx={8} fill="none" stroke={DEEP} strokeWidth={3} strokeDasharray="5 4" />
          </g>
        ))}
        <circle cx={140} cy={22} r={13} fill={DEEP} />
        <path d="M134 22l4 4 8-8" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ) : kind === 'mic' ? (
      <g stroke={DEEP} strokeWidth={6} strokeLinecap="round">
        <rect x={64} y={14} width={32} height={56} rx={16} fill="#ffffff" />
        <path d="M50 54a30 30 0 0060 0M80 84v18M64 104h32" />
        {[0, 1].map((k) => (
          <path key={k} d={`M${30 - k * 14} ${38 - k * 6}q-10 16 0 32M${130 + k * 14} ${38 - k * 6}q10 16 0 32`} stroke={M} />
        ))}
      </g>
    ) : kind === 'wave' ? (
      <g>
        {[0.3, 0.55, 0.85, 0.5, 1, 0.7, 0.4, 0.8, 0.6, 0.35, 0.65, 0.3].map((h, i) => (
          <rect key={i} x={14 + i * 11.5} y={60 - h * 44} width={7} height={h * 88} rx={3.5} fill={i % 3 === 1 ? DEEP : M} />
        ))}
      </g>
    ) : kind === 'ab' ? (
      <g>
        <rect x={10} y={30} width={56} height={56} rx={14} fill="#ffffff" stroke={DEEP} strokeWidth={4} />
        <rect x={94} y={30} width={56} height={56} rx={14} fill={M} stroke={DEEP} strokeWidth={4} />
        <text x={38} y={71} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={DEEP}>
          A
        </text>
        <text x={122} y={71} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={DEEP}>
          B
        </text>
        <path d="M70 48h18M84 43l5 5-5 5M90 68H72M76 63l-5 5 5 5" stroke={DEEP} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ) : (
      <g>
        <circle cx={80} cy={60} r={34} stroke={DEEP} strokeWidth={14} strokeDasharray="10.7 7.1" />
        <circle cx={80} cy={60} r={27} fill="#ffffff" stroke={DEEP} strokeWidth={5} />
        <circle cx={80} cy={60} r={9} fill={M} />
      </g>
    )}
  </svg>
);

const CW = 250;
const CH = 320;
const CardFace: React.FC<{i: number; glow?: number}> = ({i, glow = 0}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius: 18,
      overflow: 'hidden',
      background: '#f4f7f5',
      boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 0 ${3 * glow}px ${M}, 0 0 ${50 * glow}px ${M}88`,
    }}
  >
    <div style={{height: 166, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#dcf8ee 0%,#b6ebd7 100%)'}}>
      <Illustration kind={FAQ[i].illo} />
    </div>
    <div style={{padding: '16px 20px'}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.2em', color: '#3a8f72'}}>FAQ · 0{i + 1}</div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 23, lineHeight: 1.16, letterSpacing: '-0.015em', color: INK, marginTop: 10}}>{FAQ[i].q}</div>
      <div style={{display: 'flex', gap: 6, marginTop: 14}}>
        {[64, 40].map((w) => (
          <div key={w} style={{width: `${w}%`, height: 6, borderRadius: 3, background: '#d5ddd9'}} />
        ))}
      </div>
    </div>
  </div>
);

// 3-D flipping sheet: front / back faces with hidden backfaces
const Flip: React.FC<{x: number; y: number; w: number; h: number; ang: number; origin?: string; front: React.ReactNode; back: React.ReactNode; style?: React.CSSProperties}> = ({
  x,
  y,
  w,
  h,
  ang,
  origin = 'center',
  front,
  back,
  style,
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, perspective: 1800, ...style}}>
    <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${ang}deg)`, transformOrigin: origin}}>
      <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden'}}>{front}</div>
      <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}>{back}</div>
    </div>
  </div>
);

// deck + fan layout
const DECK = {x: 960, y: 650};
const SLOT_OF = [2, 1, 3, 0, 4]; // card i → fan slot (card 0, the search match, takes the centre)
const FAN_AT = [T.fan[4], T.fan[2], T.fan[3], T.fan[0], T.fan[1]]; // outer cards deal first
const slotPose = (s: number) => {
  const k = s - 2;
  return {x: 960 + k * 232, y: 640 + Math.abs(k) * 22 + k * k * 8, rot: k * 8.5};
};

// exit: everything scatters outward (seeded per element)
const scatter = (f: number, cx: number, cy: number, seed: number) => {
  const u = lerp(f, T.exit, T.exit + 26, 0, 1, EXPO);
  if (u <= 0) return {transform: '', opacity: 1};
  const r = mulberry32(seed);
  let dx = cx - 960 + (r() - 0.5) * 200;
  let dy = cy - 540 + (r() - 0.5) * 200;
  const l = Math.hypot(dx, dy) || 1;
  dx /= l;
  dy /= l;
  const dist = (900 + r() * 400) * u;
  return {
    transform: `translate(${dx * dist}px, ${dy * dist}px) rotate(${(r() - 0.5) * 80 * u}deg) scale(${1 - 0.5 * u})`,
    opacity: 1 - lerp(f, T.exit + 6, T.exit + 22),
  };
};

const PageLeft: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, borderRadius: '18px 4px 4px 18px', background: '#f4f7f5', overflow: 'hidden', padding: 34}}>
    <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.22em', color: '#3a8f72'}}>CALIBRATE</div>
    <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, lineHeight: 1.1, letterSpacing: '-0.02em', color: INK, marginTop: 12}}>Find your normal range.</div>
    <div style={{marginTop: 26, borderRadius: 16, background: 'linear-gradient(160deg,#dcf8ee,#b6ebd7)', padding: '26px 24px'}}>
      {[
        ['English', 0.74],
        ['Arabic', 0.62],
      ].map(([t, w], i) => (
        <div key={t as string} style={{marginTop: i ? 22 : 0}}>
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 18, color: INK}}>{t}</div>
          <div style={{position: 'relative', marginTop: 10, height: 18, borderRadius: 9, background: '#ffffffb0'}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(w as number) * 100}%`, borderRadius: 9, background: M}} />
            <div style={{position: 'absolute', left: '42%', width: '34%', top: -7, bottom: -7, borderRadius: 8, border: `3px dashed ${DEEP}`}} />
          </div>
        </div>
      ))}
      <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 22, fontFamily: MONO, fontWeight: 700, fontSize: 13, letterSpacing: '0.16em', color: DEEP}}>
        <span style={{width: 26, height: 12, borderRadius: 4, border: `2.5px dashed ${DEEP}`}} /> NORMAL RANGE
      </div>
    </div>
    {[88, 72, 80].map((w, i) => (
      <div key={i} style={{width: `${w}%`, height: 8, borderRadius: 4, background: '#d5ddd9', marginTop: i ? 12 : 26}} />
    ))}
  </div>
);

const PageRight: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, borderRadius: '4px 18px 18px 4px', background: '#f4f7f5', overflow: 'hidden', padding: 34}}>
    <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.22em', color: '#3a8f72'}}>CLONE LAB · STEPS</div>
    {['Set up', 'Record', 'Calibrate', 'Train'].map((s, i) => {
      const on = i === 2;
      return (
        <div
          key={s}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: i ? 14 : 24,
            padding: '14px 16px',
            borderRadius: 14,
            background: on ? '#d3f6e9' : '#e8eeeb',
            border: on ? `2px solid ${M}` : '2px solid transparent',
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 17,
              color: on ? '#fff' : INK,
              background: on ? DEEP : '#cfd8d4',
            }}
          >
            {i + 1}
          </span>
          <span style={{fontFamily: FONT, fontWeight: 700, fontSize: 22, color: INK}}>{s}</span>
        </div>
      );
    })}
    <div style={{display: 'flex', justifyContent: 'center', marginTop: 22}}>
      <Illustration kind="mic" size={150} />
    </div>
  </div>
);

const GuideUI: React.FC<{f: number}> = ({f}) => {
  // the real page (ex-illusory square) flies onto the deck, flipping to show FAQ card 1
  const fly = lerp(f, T.real + 6, T.search + 4, 0, 1, IN_OUT);
  const realOn = lerp(f, T.real, T.real + 6, 0, 1, IN_OUT);
  const els: React.ReactNode[] = [];
  let flyEl: React.ReactNode = null; // drawn after the deck so it lands on top
  if (f >= T.real && f < T.search + 4) {
    const w = 2 * H + (CW - 2 * H) * fly;
    const h = 2 * H + (CH - 2 * H) * fly;
    const cx = PCX + (DECK.x - PCX) * fly;
    const cy = PCY + (DECK.y - PCY) * fly - Math.sin(Math.PI * fly) * 120;
    flyEl = (
      <Flip
        key="fly"
        x={cx - w / 2}
        y={cy - h / 2}
        w={w}
        h={h}
        ang={180 * fly}
        style={{opacity: realOn}}
        front={<div style={{position: 'absolute', inset: 0, background: '#ffffff', borderRadius: 4 + 14 * fly, boxShadow: `0 ${30 * realOn}px ${70 * realOn}px rgba(0,0,0,0.35)`}} />}
        back={
          <div style={{position: 'absolute', left: 0, top: 0, width: CW, height: CH, scale: `${w / CW} ${h / CH}`, transformOrigin: 'top left'}}>
            <CardFace i={0} />
          </div>
        }
      />
    );
  }
  // search field
  const sp = pop(f, T.search, 16, 170, 0.7);
  const typed = typeFrames.filter((t) => f >= t).length;
  const caret = Math.floor(f / 15) % 2 === 0 || (typed > 0 && typed < QUERY.length);
  const sc = scatter(f, 960, 230, 41);
  if (sp > 0)
    els.push(
      <div
        key="search"
        style={{
          position: 'absolute',
          left: 960 - 390,
          top: 196,
          width: 780,
          height: 68,
          borderRadius: 34,
          background: '#1b201e',
          border: `1px solid ${typed === QUERY.length ? M + '66' : '#2f3633'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 28px',
          boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
          opacity: Math.min(1, sp * 1.5) * sc.opacity,
          translate: `0px ${(1 - sp) * -40}px`,
          transform: sc.transform,
        }}
      >
        <IconSearch size={28} color={M} />
        <span style={{fontFamily: FONT, fontWeight: 500, fontSize: 27, color: typed ? C.fg : '#6f7a76', whiteSpace: 'pre'}}>
          {typed ? QUERY.slice(0, typed) : 'Search the Guide'}
        </span>
        <span style={{width: 3, height: 32, marginLeft: -12, background: M, opacity: caret && typed ? 1 : 0}} />
        <span style={{marginLeft: 'auto', fontFamily: MONO, fontWeight: 700, fontSize: 14, letterSpacing: '0.2em', color: '#5f6d68'}}>FAQ</span>
      </div>,
    );
  // deck → fan → (card 0 becomes the book)
  const lift = lerp(f, T.lift, T.lift + 18, 0, 1, EXPO);
  const order = [3, 4, 1, 2, 0];
  for (const i of order) {
    if (f < T.real + 22 && i !== 0) continue;
    if (i === 0 && f < T.search + 4) continue;
    const appear = i === 0 ? 1 : lerp(f, T.real + 22 + i * 2, T.real + 34 + i * 2);
    const fan = pop(f, FAN_AT[i], 15, 150, 0.8);
    const s = slotPose(SLOT_OF[i]);
    const stackOff = i === 0 ? 0 : 4 + i * 3;
    let x = DECK.x + (s.x - DECK.x) * fan;
    let y = DECK.y + stackOff + (s.y - DECK.y - stackOff) * fan + (1 - appear) * 70;
    let rot = s.rot * fan + (1 - fan) * (i === 0 ? 0 : (i % 2 ? -3 : 3));
    let scale = 1;
    let op = appear;
    if (i !== 0) {
      op *= 1 - 0.7 * lift;
      y += 50 * lift;
      scale = 1 - 0.08 * lift;
    } else if (lift > 0) {
      x = s.x;
      y = s.y + (565 - s.y) * lift;
      rot = s.rot * (1 - lift);
      scale = 1 + (540 / CH - 1) * lift;
    }
    if (i === 0 && lift > 0) continue; // drawn as the book below
    const glow = i === 0 ? lerp(f, T.fan[4] + 4, T.fan[4] + 16) * (0.6 + 0.4 * Math.sin(f / 7)) : 0;
    const scd = scatter(f, x, y, 60 + i);
    els.push(
      <div
        key={'c' + i}
        style={{
          position: 'absolute',
          left: x - CW / 2,
          top: y - CH / 2,
          width: CW,
          height: CH,
          opacity: op * scd.opacity,
          transform: `${scd.transform} rotate(${rot}deg) scale(${scale})`,
        }}
      >
        <CardFace i={i} glow={glow} />
      </div>,
    );
  }
  els.push(flyEl);
  // the book: card 0 grows into an illustrated page that turns like a book leaf
  if (lift > 0) {
    const s = slotPose(2);
    const k = 1 + (540 / CH - 1) * lift;
    const PWd = CW * k;
    const PHd = CH * k;
    const cy = s.y + (565 - s.y) * lift;
    const turn = lerp(f, T.flip - 12, T.flip + 12, 0, 1, IN_OUT);
    const open = turn; // book slides right so the spread ends centred
    const left = 960 - PWd / 2 + (PWd / 2) * open;
    const scb = scatter(f, 960, cy, 77);
    els.push(
      <div key="book" style={{position: 'absolute', inset: 0, opacity: scb.opacity, transform: scb.transform}}>
        {/* right page (page 2) lies underneath the turning leaf */}
        <div style={{position: 'absolute', left, top: cy - PHd / 2, width: PWd, height: PHd, opacity: turn > 0 ? 1 : 0}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 420, height: 540, scale: `${PWd / 420}`, transformOrigin: 'top left', boxShadow: '0 40px 90px rgba(0,0,0,0.55)', borderRadius: '4px 18px 18px 4px'}}>
            <PageRight />
          </div>
        </div>
        <Flip
          x={left}
          y={cy - PHd / 2}
          w={PWd}
          h={PHd}
          ang={-180 * turn}
          origin="left center"
          front={
            <div style={{position: 'absolute', left: 0, top: 0, width: CW, height: CH, scale: `${k}`, transformOrigin: 'top left'}}>
              <CardFace i={0} glow={0.6 * (1 - lift)} />
            </div>
          }
          back={
            <div style={{position: 'absolute', left: 0, top: 0, width: 420, height: 540, scale: `${PWd / 420}`, transformOrigin: 'top left', boxShadow: '0 40px 90px rgba(0,0,0,0.55)'}}>
              <PageLeft />
            </div>
          }
        />
        {/* spine shadow */}
        <div
          style={{
            position: 'absolute',
            left: left - 30,
            top: cy - PHd / 2,
            width: 60,
            height: PHd,
            background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.18) 50%, transparent)',
            opacity: lerp(f, T.flip, T.flip + 12),
          }}
        />
      </div>,
    );
  }
  // chips
  ['Illustrated', 'Searchable'].forEach((t, i) => {
    const p = pop(f, T.chips[i], 13, 200, 0.6);
    if (p <= 0) return;
    const x = 960 + (i ? 16 : -16);
    const scc = scatter(f, x, 880, 90 + i);
    els.push(
      <div
        key={t}
        style={{
          position: 'absolute',
          top: 862,
          ...(i ? {left: x} : {right: 1920 - x}),
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 50,
          padding: '0 22px',
          borderRadius: 25,
          background: '#1d2321',
          border: `1px solid ${M}55`,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 22,
          color: C.fg,
          opacity: Math.min(1, p * 1.6) * scc.opacity,
          translate: `0px ${(1 - p) * 26}px`,
          transform: scc.transform,
          boxShadow: `0 0 ${30 * pulse(f, T.chips[i], 10)}px ${M}`,
        }}
      >
        <span style={{width: 10, height: 10, borderRadius: 5, background: M, boxShadow: `0 0 10px ${M}`}} />
        {t}
      </div>,
    );
  });
  return <AbsoluteFill>{els}</AbsoluteFill>;
};

// ---------- exit: nine rings in the world accents (portal into the finale) ----------
const Rings: React.FC<{f: number}> = ({f}) => {
  if (f < T.exit) return null;
  const rings = WORLDS.map((w, i) => {
    const at = T.exit + 2 + i * 2;
    const d = lerp(f, at, at + 16, 0, 1, EXPO);
    const r = 64 + i * 46;
    const c = 2 * Math.PI * r;
    const spin = (i % 2 ? -1 : 1) * (f - T.exit) * 0.9 - 90;
    return {d, r, c, spin, col: ACCENT[w.id], i};
  });
  const draw = (blur: boolean) => (
    <g filter={blur ? 'url(#gd-ring-glow)' : undefined} opacity={blur ? 0.8 : 1}>
      {rings.map(({d, r, c, spin, col, i}) =>
        d > 0 ? (
          <circle
            key={i}
            cx={960}
            cy={540}
            r={r * (0.8 + 0.2 * d)}
            fill="none"
            stroke={col}
            strokeWidth={blur ? 14 : 7}
            strokeLinecap="round"
            strokeDasharray={`${c * 0.94 * d} ${c}`}
            transform={`rotate(${spin} 960 540)`}
          />
        ) : null,
      )}
    </g>
  );
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="gd-ring-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      {draw(true)}
      {draw(false)}
    </svg>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  const glowX = 1250 + (960 - 1250) * lerp(f, T.real, T.search + 10, 0, 1, IN_OUT);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(120% 100% at 50% 45%, #0a1a14 0%, #040b08 70%)', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: glowX - 800,
          top: 540 - 700,
          width: 1600,
          height: 1400,
          background: `radial-gradient(ellipse, ${M}22 0%, ${M}08 40%, transparent 65%)`,
        }}
      />
      <Kanizsa f={f} />
      <WorldTitle f={f} index={9} name="GUIDE" promise="Every answer in one place." accent={M} x={150} y={360} out={T.titleOut} />
      <GuideUI f={f} />
      <AbsoluteFill style={{background: 'radial-gradient(110% 95% at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)'}} />
      <Rings f={f} />
    </AbsoluteFill>
  );
};
