// World 5 · Training — "the infinite tunnel" (orange). Droste effect: the Training panel contains a smaller copy of
// itself, forever; the camera falls through it on a seamless log-periodic zoom (see zoom.ts).
import React from 'react';
import {AbsoluteFill, getInputProps, interpolateColors} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ACCENT, C, FONT, MONO, W, H} from '../../brand';
import {useWorldFrame} from '../../frame';
import {CrtScreen} from '../arcade/crt';
import {CHECKS, GATES, Level} from './Level';
import {T} from './timing';
import {Arrow, Check, EXPO_IN, IN_OUT, pop, ramp} from './util';
import {K_CRT, PH, PW, depth, twist, windowW} from './zoom';

const OR = ACCENT.training;
const tunnelOnly = (getInputProps() as {only?: string}).only === 'tunnel'; // debug: verify the Droste loop

const litAt = (f: number, i: number) => ramp(f, T.checks[i], T.checks[i] + 8, 0, 1, IN_OUT);

// ---------- the Droste tunnel ----------
const Tunnel: React.FC = () => {
  const f = useWorldFrame();
  const u = depth(f);
  const tw = twist(f);
  const dim = tunnelOnly ? 0 : 0.5 * (1 - ramp(f, 96, 122, 0, 1, IN_OUT)); // tunnel sits back under the title
  const levels: React.ReactNode[] = [];
  for (let k = Math.ceil(u - 1.6); k <= Math.floor(u + 7.2); k++) {
    const d = k - u;
    const delay = 2.4 * Math.max(0, d); // checks ripple inward through the copies
    const lit = CHECKS.map((_, i) => litAt(f - delay, i));
    // depth fog inward; a level larger than the screen darkens as it passes the camera (only its rim stays)
    const fog = d >= 0 ? 1 - 0.7 ** d : Math.min(0.92, (-d / 0.6) * 0.92);
    levels.push(
      <div
        key={k}
        style={{
          position: 'absolute',
          left: (W - PW) / 2,
          top: (H - PH) / 2,
          width: PW,
          height: PH,
          transform: `rotate(${tw * d}deg) scale(${2 ** -d})`,
        }}
      >
        <Level k={k} lit={lit} fog={1 - (1 - fog) * (1 - dim)} rim={d <= 0 ? 1 : 0.86 ** d} />
      </div>,
    );
  }
  return <AbsoluteFill style={{opacity: tunnelOnly ? 1 : ramp(f, 6, 24, 0, 1, IN_OUT)}}>{levels}</AbsoluteFill>;
};

// ---------- entrance: TTS waveform bars stand up into the nested frames ----------
const Entrance: React.FC<{f: number}> = ({f}) => {
  if (f >= 26) return null;
  const m = ramp(f, -12, 8, 0, 1, IN_OUT);
  const e = ramp(f, -2, 14, 0, 1, IN_OUT);
  const fade = 1 - ramp(f, 12, 26, 0, 1, IN_OUT);
  const u = depth(f);
  const col = interpolateColors(m, [0, 1], [ACCENT.tts, OR]);
  const els: React.ReactNode[] = [];
  for (let j = 0; j < 6; j++) {
    const s = 2 ** (u - j);
    const fw = PW * s;
    const fh = PH * s;
    for (const side of [-1, 1]) {
      const idx = side < 0 ? 5 - j : 6 + j;
      const x0 = 960 + (idx - 5.5) * 38;
      const h0 = 70 + 330 * Math.exp(-(((idx - 5.5) / 3.2) ** 2)) * (0.75 + 0.25 * Math.sin(idx * 2.3));
      const x = x0 + (960 + (side * fw) / 2 - x0) * m;
      const h = h0 + (fh - h0) * m;
      const bw = 16 + (4 - 16) * m;
      els.push(<rect key={`b${j}${side}`} x={x - bw / 2} y={540 - h / 2} width={bw} height={h} rx={bw / 2} fill={col} />);
      // top + bottom edges grow from each standing bar toward the centre
      const len = (fw / 2) * e;
      for (const yy of [540 - fh / 2, 540 + fh / 2]) {
        els.push(<line key={`e${j}${side}${yy}`} x1={x} y1={yy} x2={x - side * len} y2={yy} stroke={col} strokeWidth={4} strokeLinecap="round" opacity={e > 0.01 ? 1 : 0} />);
      }
    }
  }
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <svg width={W} height={H} style={{filter: `drop-shadow(0 0 12px ${OR})`}}>
        {els}
      </svg>
    </AbsoluteFill>
  );
};

// ---------- overlays: title, stepper, gate checks, progress ring, line ----------
const Title: React.FC<{f: number}> = ({f}) => {
  if (f < -2 || f > 118) return null;
  const tin = ramp(f, 0, 26);
  const tout = ramp(f, 92, 118, 0, 1, EXPO_IN);
  const op = ramp(f, 0, 8) * (1 - ramp(f, 104, 118, 0, 1, IN_OUT));
  const sub = ramp(f, 8, 30);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', left: 960 - 900, top: 540 - 520, width: 1800, height: 1040, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 72%)', opacity: op}} />
      <div style={{textAlign: 'center', opacity: op, transform: `scale(${(0.42 + 0.58 * tin) * (1 + 2.4 * tout)})`}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: '0.42em', color: OR, marginBottom: 6}}>05 / 09</div>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 224, letterSpacing: '-0.045em', lineHeight: 1, color: C.fg, textShadow: `0 0 60px rgba(255,122,47,0.45)`}}>TRAINING</div>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 50, letterSpacing: '-0.01em', color: C.fg, marginTop: 22, opacity: sub, transform: `translateY(${(1 - sub) * 24}px)`}}>
          Prepare<span style={{color: OR}}>.</span> Train<span style={{color: OR}}>.</span> Listen<span style={{color: OR}}>.</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TAB_W = 236;
const Stepper: React.FC<{f: number}> = ({f}) => {
  const vin = ramp(f, 96, 120);
  const vout = ramp(f, 414, 436, 0, 1, EXPO_IN);
  if (vin <= 0 || vout >= 1) return null;
  const active = f < T.line ? 0 : f < T.ringDone ? 1 : 2;
  const hx = pop(f, T.line, 16, 160, 0.8) + pop(f, T.ringDone, 16, 160, 0.8); // highlight slides 0 → 1 → 2
  const width = 3 * TAB_W + 2 * 52 + 16;
  return (
    <div
      style={{
        position: 'absolute',
        left: 960 - width / 2,
        top: 146,
        width,
        height: 68,
        borderRadius: 34,
        background: 'rgba(20,20,20,0.88)',
        border: `1px solid ${C.divider}`,
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        opacity: vin * (1 - vout),
        transform: `translateY(${(1 - vin) * -30 - vout * 30}px)`,
      }}
    >
      <div style={{position: 'absolute', left: 8 + hx * (TAB_W + 52), top: 8, width: TAB_W, height: 52, borderRadius: 26, background: C.selection, boxShadow: `inset 0 0 0 1px rgba(255,122,47,0.5)`}} />
      {GATES.map((g, i) => {
        const done = i < active;
        const on = i === active;
        return (
          <React.Fragment key={g}>
            <div style={{position: 'absolute', left: 8 + i * (TAB_W + 52), top: 8, width: TAB_W, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: done || on ? C.green : C.control,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 19,
                  color: done || on ? '#000' : '#8a8a8a',
                }}
              >
                {done ? <Check size={22} color="#000" stroke={3.6} /> : i + 1}
              </div>
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 27, color: on || done ? C.fg : '#8a8a8a'}}>{g}</div>
            </div>
            {i < 2 ? <Arrow size={30} color={i < active ? OR : '#555'} style={{position: 'absolute', left: 8 + i * (TAB_W + 52) + TAB_W + 11, top: 19}} /> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Four check chips, one lights per beat (the same rows light inside every nested copy).
const Chips: React.FC<{f: number}> = ({f}) => {
  const vin = ramp(f, 100, 124);
  const vout = ramp(f, T.line - 6, T.line + 10, 0, 1, EXPO_IN); // the line takes the chips' place
  if (vin <= 0 || vout >= 1) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 876, display: 'flex', justifyContent: 'center', gap: 16, opacity: vin * (1 - vout), transform: `translateY(${(1 - vin) * 30 + vout * 30}px)`}}>
      {CHECKS.map((c, i) => {
        const at = T.checks[i];
        const s = pop(f, at, 11, 210, 0.6);
        const on = f >= at;
        const flash = on ? ramp(f, at, at + 30, 1, 0) : 0;
        return (
          <div
            key={c}
            style={{
              height: 60,
              padding: '0 28px 0 14px',
              borderRadius: 30,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: on ? 'rgba(18,30,22,0.92)' : 'rgba(20,20,20,0.88)',
              border: `1px solid ${on ? 'rgba(30,215,96,0.55)' : C.divider}`,
              boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 ${36 * flash}px rgba(30,215,96,${0.55 * flash})`,
              transform: `scale(${on ? 1 + 0.08 * Math.sin(Math.min(1, s) * Math.PI) : 1})`,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                boxSizing: 'border-box',
                border: `2.5px solid ${on ? C.green : '#444'}`,
                background: on ? C.green : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={24} color="#000" stroke={3.6} draw={ramp(f, at, at + 9, 0, 1, IN_OUT)} />
            </div>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 28, color: on ? C.fg : '#8a8a8a'}}>{c}</div>
          </div>
        );
      })}
    </div>
  );
};

// Training progress: a dial ring around the vanishing point; sweeps once the gates pass, completes → Listen.
const BigRing: React.FC<{f: number}> = ({f}) => {
  const vin = ramp(f, 100, 140, 0, 1, IN_OUT);
  const vout = ramp(f, 404, 430, 0, 1, EXPO_IN);
  if (vin <= 0 || vout >= 1) return null;
  const r = 236;
  const p = ramp(f, T.line, T.ringDone, 0, 1, IN_OUT);
  const done = f >= T.ringDone;
  const burst = done ? ramp(f, T.ringDone, T.ringDone + 36) : 0;
  const circ = 2 * Math.PI * r;
  const a = -Math.PI / 2 + p * 2 * Math.PI;
  const col = done ? C.green : OR;
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i < 96; i++) {
    if (i / 96 > vin) break;
    const t = (i / 96) * 2 * Math.PI - Math.PI / 2;
    const major = i % 8 === 0;
    const r0 = r + 18;
    const r1 = r + (major ? 34 : 26);
    const lit = i / 96 <= p + 1e-6 && p > 0;
    ticks.push(
      <line
        key={i}
        x1={330 + r0 * Math.cos(t)}
        y1={330 + r0 * Math.sin(t)}
        x2={330 + r1 * Math.cos(t)}
        y2={330 + r1 * Math.sin(t)}
        stroke={lit ? col : 'rgba(255,255,255,0.22)'}
        strokeWidth={major ? 3 : 2}
        strokeLinecap="round"
      />,
    );
  }
  return (
    <AbsoluteFill style={{opacity: 1 - vout, transform: `scale(${1 + 0.6 * vout})`}}>
      <svg width={660} height={660} style={{position: 'absolute', left: 960 - 330, top: 540 - 330, overflow: 'visible'}}>
        {ticks}
        <circle cx={330} cy={330} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={3} strokeDasharray={circ} strokeDashoffset={circ * (1 - vin)} transform="rotate(-90 330 330)" />
        {p > 0.001 ? (
          <>
            <circle cx={330} cy={330} r={r} fill="none" stroke={col} strokeOpacity={0.25} strokeWidth={22} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - p)} transform="rotate(-90 330 330)" />
            <circle cx={330} cy={330} r={r} fill="none" stroke={col} strokeWidth={7} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - p)} transform="rotate(-90 330 330)" />
          </>
        ) : null}
        {done ? <circle cx={330} cy={330} r={r * (1 + 0.5 * burst)} fill="none" stroke={C.green} strokeWidth={10 * (1 - burst)} opacity={1 - burst} /> : null}
      </svg>
      {p > 0.001 && !done ? (
        <div
          style={{
            position: 'absolute',
            left: 960 + r * Math.cos(a) - 45,
            top: 540 + r * Math.sin(a) - 45,
            width: 90,
            height: 90,
            borderRadius: 45,
            background: 'radial-gradient(circle, rgba(255,246,230,1) 0%, rgba(255,150,80,0.75) 22%, rgba(255,122,47,0) 70%)',
          }}
        />
      ) : null}
      {done ? (
        <div style={{position: 'absolute', left: 960 - 70, top: 540 - 70, width: 140, height: 140, borderRadius: 70, background: C.green, boxShadow: `0 0 ${80 * (1 - burst) + 30}px rgba(30,215,96,0.6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop(f, T.ringDone, 10, 200, 0.6)})`}}>
          <svg width={60} height={60} viewBox="0 0 24 24">
            <path d="M8 5.5v13l11-6.5z" fill="#000" />
          </svg>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Line: React.FC<{f: number}> = ({f}) => {
  if (f < T.line - 2) return null;
  const vout = ramp(f, 404, 428, 0, 1, EXPO_IN);
  const words: [string, boolean][] = [
    ['Real', false],
    ['gates,', false],
    ['not', true],
    ['guesses.', true],
  ];
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 862, display: 'flex', justifyContent: 'center', gap: 18, opacity: 1 - vout}}>
      {words.map(([w, acc], i) => {
        const s = pop(f, T.line + i * 4, 14, 170, 0.7);
        return (
          <span key={w} style={{display: 'inline-block', fontFamily: FONT, fontWeight: 800, fontSize: 66, letterSpacing: '-0.03em', color: acc ? OR : C.fg, opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 40}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.85)'}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---------- exit: the innermost frame becomes a glowing CRT screen ----------
const Crt: React.FC<{f: number}> = ({f}) => {
  if (f < T.crt) return null;
  return (
    <AbsoluteFill style={{opacity: ramp(f, T.crt, 458, 0, 1, IN_OUT)}}>
      <CrtScreen w={windowW(K_CRT, f)} glow={f < T.crtOn ? 0 : 0.55 + 0.45 * ramp(f, T.crtOn + 1, 476, 0, 1, IN_OUT)} bezel={0.88} />
    </AbsoluteFill>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  const fast = f >= 416 && f < 474;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      {fast && !tunnelOnly ? (
        <CameraMotionBlur samples={5} shutterAngle={180}>
          <Tunnel />
        </CameraMotionBlur>
      ) : (
        <Tunnel />
      )}
      <AbsoluteFill style={{background: 'radial-gradient(circle 420px at 50% 50%, rgba(255,122,47,0.32) 0%, rgba(255,122,47,0.08) 50%, rgba(255,122,47,0) 100%)', mixBlendMode: 'screen'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)'}} />
      {tunnelOnly ? null : (
        <>
          {/* top/bottom shade so the HUD-side overlays read over the moving tunnel */}
          <AbsoluteFill
            style={{
              opacity: ramp(f, 96, 124, 0, 1, IN_OUT) * (1 - ramp(f, 404, 432, 0, 1, IN_OUT)),
              background: 'linear-gradient(180deg, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0) 27%, rgba(0,0,0,0) 64%, rgba(0,0,0,0.9) 100%)',
            }}
          />
          <Title f={f} />
          <Stepper f={f} />
          <BigRing f={f} />
          <Chips f={f} />
          <Line f={f} />
          <Crt f={f} />
          <Entrance f={f} />
        </>
      )}
    </AbsoluteFill>
  );
};
