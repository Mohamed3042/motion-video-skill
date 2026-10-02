// World 3 · LIVE — "the signal city" (green). Peripheral-drift rings, static for bar 1, then they really turn
// and tilt into a floor under the Live UI: signal path, monitor & cleanup toggles + Overdrive, Live words.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {noise2D} from '@remotion/noise';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {DriftRings, R0} from './rings';
import {BoundaryShard, WORDS, wordsX0} from './shard';
import {T} from './timing';
import {Arrow, Glow, MicIcon, PhonesIcon, WaveMark, clamp, ease, mix, mixHex, prog, rgba, sp} from './util';

const G = ACCENT.live;
const PAN1 = [220, 248] as const;
const PAN2 = [334, 362] as const;
const panAt = (f: number) => 1920 * (ease.sine(prog(f, PAN1[0], PAN1[1])) + ease.sine(prog(f, PAN2[0], PAN2[1])));
const inPan = (f: number) => (f > PAN1[0] - 1 && f < PAN1[1] + 1) || (f > PAN2[0] - 1 && f < PAN2[1] + 1);

// ---------------------------------------------------------------- floor (rings) ----
const Floor: React.FC<{f: number}> = ({f}) => {
  const tilt = ease.inOut(prog(f, 122, 162));
  const beat = f >= T.drop && f < 446 ? Math.exp(-(((f - T.drop) % 30) / 7)) : 0;
  const out = ease.inOut(prog(f, 446, 474));
  const pan = panAt(f);
  const od = f >= T.overdrive ? Math.exp(-(f - T.overdrive) / 16) : 0;
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '960px 540px',
          transform: `perspective(1100px) translateY(${370 * tilt}px) rotateX(${63 * tilt}deg) translateX(${-pan * 0.22}px) scale(${1 + 0.3 * tilt + 0.04 * od})`,
          opacity: mix(1, 0.62 + 0.18 * beat + 0.3 * od, tilt),
        }}
      >
        <DriftRings f={f} />
      </div>
      {/* fog toward the horizon + darkening so the UI reads */}
      <AbsoluteFill
        style={{
          opacity: tilt,
          background: 'linear-gradient(180deg, #000 0%, #000 50%, rgba(0,0,0,0.55) 68%, rgba(0,0,0,0.2) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -200,
          right: -200,
          top: 470,
          height: 260,
          opacity: tilt * (0.55 + 0.45 * od),
          background: `radial-gradient(50% 50% at 50% 50%, ${rgba(G, 0.28)} 0%, ${rgba(G, 0.06)} 55%, rgba(0,0,0,0) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- title (bar 1) ----
const Title: React.FC<{f: number}> = ({f}) => {
  if (f > 136) return null;
  const out = ease.cubicIn(prog(f, 112, 132));
  const idx = ease.expoOut(prog(f, 2, 22));
  const prom = ease.expoOut(prog(f, 30, 52));
  const prom2 = ease.expoOut(prog(f, 40, 62));
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 + 0.25 * out})`}}>
      <div style={{position: 'absolute', left: 960 - R0, top: 540 - R0, width: R0 * 2, height: R0 * 2, borderRadius: '50%', background: '#000'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 380,
          textAlign: 'center',
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: '0.32em',
          color: G,
          opacity: idx,
          transform: `translateY(${(1 - idx) * 14}px)`,
        }}
      >
        03 / 09
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 412,
          display: 'flex',
          justifyContent: 'center',
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 196,
          lineHeight: 1,
          letterSpacing: '-0.045em',
          color: C.fg,
        }}
      >
        {'LIVE'.split('').map((ch, i) => {
          const s = sp(f, 4 + i * 4, {damping: 13, stiffness: 190, mass: 0.7});
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: clamp(s * 3),
                transform: `translateY(${(1 - s) * 90}px) scale(${mix(1.3, 1, s)}) skewX(${(1 - s) * -12}deg)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 628,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 30,
          color: C.fg,
          opacity: prom,
          transform: `translateY(${(1 - prom) * 16}px)`,
        }}
      >
        Speak. Hear the voice.
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 668,
          textAlign: 'center',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 30,
          color: G,
          opacity: prom2,
          transform: `translateY(${(1 - prom2) * 16}px)`,
        }}
      >
        In real time.
      </div>
    </AbsoluteFill>
  );
};

// a shockwave ring + bloom on impacts
const Burst: React.FC<{f: number; at: number; x: number; y: number; size: number}> = ({f, at, x, y, size}) => {
  const t = f - at;
  if (t < 0 || t > 40) return null;
  const p = ease.expoOut(prog(t, 0, 34));
  return (
    <>
      <Glow x={x} y={y} size={size * 1.4} color={G} opacity={(1 - prog(t, 0, 26)) * 0.85} scale={0.6 + 0.6 * p} />
      <div
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          border: `3px solid ${G}`,
          opacity: 1 - prog(t, 6, 36),
          transform: `scale(${0.08 + 0.92 * p})`,
        }}
      />
    </>
  );
};

// ---------------------------------------------------------------- UI pieces ----
const card: React.CSSProperties = {
  position: 'absolute',
  borderRadius: 30,
  background: 'linear-gradient(180deg, #1b1b1b 0%, #151515 100%)',
  border: `1px solid ${C.selection}`,
  boxShadow: '0 40px 100px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
  overflow: 'hidden',
};

const Toggle: React.FC<{f: number; at: number; big?: boolean}> = ({f, at, big}) => {
  const s = sp(f, at, {damping: 11, stiffness: 260, mass: 0.6});
  const on = clamp(prog(f, at, at + 5));
  const w = big ? 118 : 104;
  const h = big ? 64 : 58;
  const k = h - 12;
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: h / 2,
        background: on > 0 ? `linear-gradient(90deg, ${rgba(G, on)} 0%, ${rgba(G, on)} 100%), #3a3a3a` : '#3a3a3a',
        boxShadow: on > 0 ? `0 0 ${24 * on}px ${rgba(G, 0.45 * on)}` : 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 6 + s * (w - k - 12),
          top: 6,
          width: k,
          height: k,
          borderRadius: '50%',
          background: on > 0.5 ? '#ffffff' : '#c8c8c8',
          boxShadow: '0 3px 8px rgba(0,0,0,0.45)',
          transform: `scaleX(${1 + 0.18 * Math.sin(Math.PI * clamp(prog(f, at, at + 8)))})`,
        }}
      />
    </div>
  );
};

const NODES = [
  {label: 'MIC', value: 'Default input', icon: 'mic'},
  {label: 'VOICE', value: 'My voice', icon: 'voice'},
  {label: 'OUTPUT', value: 'Default output', icon: 'out'},
] as const;
const NODE_X = [48, 540, 1032];
const NODE_W = 360;
const PULSES = [T.nodes[0], 180, 210, 240];

const SignalCard: React.FC<{f: number}> = ({f}) => {
  const enter = sp(f, 134, {damping: 18, stiffness: 120, mass: 0.9});
  const lit = (i: number) => clamp(prog(f, T.nodes[i], T.nodes[i] + 4));
  const mon = ease.expoOut(prog(f, 168, 196));
  // monitor waveform: scrolls left, newest audio on the right
  const sh = Math.max(0, f - 150) * 5;
  const first = Math.floor(sh / 8);
  const off = sh - first * 8;
  const bars: React.ReactNode[] = [];
  for (let i = 0; i < 170; i++) {
    const idx = first + i;
    const env = clamp(0.15 + 0.85 * Math.abs(noise2D('lv-env', idx * 0.028, 0)) * 1.6);
    const v = 0.1 + 0.9 * Math.abs(noise2D('lv-bar', idx * 0.31, 0));
    const age = i / 169;
    const h = Math.max(4, v * env * 104 * clamp((f - 150 - (169 - i) * 0.4) / 10));
    bars.push(<rect key={idx} x={i * 8 - off} y={56 - h / 2} width={4} height={h} rx={2} fill={G} opacity={0.18 + 0.82 * age ** 1.6} />);
  }
  return (
    <div
      style={{
        ...card,
        left: 240,
        top: 172,
        width: 1440,
        height: 500,
        opacity: clamp(enter * 2),
        transform: `translateY(${(1 - enter) * 120}px) scale(${mix(0.94, 1, enter)})`,
      }}
    >
      {/* tabs: the real Live views */}
      <div style={{position: 'absolute', left: 48, top: 34, display: 'flex', gap: 46, fontFamily: FONT, fontWeight: 600, fontSize: 26}}>
        {['Live', 'Convert recording', 'Evaluate'].map((t, i) => (
          <div key={t} style={{color: i === 0 ? C.fg : C.sub, paddingBottom: 10, borderBottom: i === 0 ? `3px solid ${G}` : '3px solid transparent'}}>
            {t}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 48,
          top: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '9px 20px',
          borderRadius: 99,
          background: rgba(G, 0.13),
          border: `1px solid ${rgba(G, 0.45)}`,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 22,
          color: G,
        }}
      >
        <span style={{width: 12, height: 12, borderRadius: 6, background: G, boxShadow: `0 0 14px ${G}`, opacity: 0.55 + 0.45 * Math.cos(((f - 120) / 30) * Math.PI * 2)}} />
        Live
      </div>
      <div style={{position: 'absolute', left: 48, right: 48, top: 92, height: 1, background: C.divider}} />
      {/* signal track + pulses (behind the nodes) */}
      <div style={{position: 'absolute', left: NODE_X[0] + NODE_W / 2, width: NODE_X[2] - NODE_X[0], top: 191, height: 3, background: '#2c2c2c', borderRadius: 2}} />
      {PULSES.map((p0) => {
        const t = (f - p0) / 15;
        if (t < 0 || t > 1) return null;
        const x = NODE_X[0] + NODE_W / 2 + t * (NODE_X[2] - NODE_X[0]);
        return (
          <React.Fragment key={p0}>
            <div style={{position: 'absolute', left: x - 220, top: 189, width: 220, height: 7, borderRadius: 4, background: `linear-gradient(90deg, ${rgba(G, 0)} 0%, ${rgba(G, 0.9)} 85%, #fff 100%)`}} />
            <Glow x={x} y={192} size={90} color={G} opacity={0.9} />
          </React.Fragment>
        );
      })}
      {NODES.map((n, i) => {
        const l = lit(i);
        const flash = Math.max(0, ...PULSES.map((p0) => Math.exp(-Math.abs(f - (p0 + i * 7.5)) / 3) * (f >= p0 + i * 7.5 - 1 ? 1 : 0)));
        const col = l > 0.5 ? G : '#8a8a8a';
        return (
          <div
            key={n.label}
            style={{
              position: 'absolute',
              left: NODE_X[i],
              top: 126,
              width: NODE_W,
              height: 132,
              borderRadius: 24,
              background: C.control,
              border: `1.5px solid ${l > 0 ? rgba(G, 0.25 + 0.5 * l) : C.divider}`,
              boxShadow: `0 0 ${40 * flash}px ${rgba(G, 0.55 * flash)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '0 24px',
              transform: `scale(${1 + 0.04 * flash})`,
            }}
          >
            <div style={{width: 84, height: 84, borderRadius: 18, background: '#101010', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {n.icon === 'mic' ? <MicIcon size={48} color={col} /> : n.icon === 'voice' ? <WaveMark size={56} color={col} /> : <PhonesIcon size={48} color={col} />}
            </div>
            <div>
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 17, letterSpacing: '0.18em', color: l > 0.5 ? G : C.sub}}>{n.label}</div>
              <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 28, color: C.fg, marginTop: 6, whiteSpace: 'nowrap'}}>{n.value}</div>
            </div>
          </div>
        );
      })}
      {/* live monitor */}
      <div style={{position: 'absolute', left: 48, top: 296, fontFamily: FONT, fontWeight: 600, fontSize: 24, color: C.fg, opacity: mon}}>Live monitoring</div>
      <div style={{position: 'absolute', right: 48, top: 300, display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontWeight: 500, fontSize: 17, letterSpacing: '0.16em', color: C.sub, opacity: mon}}>
        MIC <Arrow size={20} color={C.sub} /> VOICE <Arrow size={20} color={C.sub} /> OUTPUT
      </div>
      <div style={{position: 'absolute', left: 48, top: 344, width: 1344, height: 112, borderRadius: 18, background: '#0d0d0d', border: `1px solid ${C.divider}`, overflow: 'hidden', opacity: mon}}>
        <svg width={1344} height={112} style={{position: 'absolute', left: 0, top: 0}}>
          {bars}
        </svg>
        <div style={{position: 'absolute', right: 0, top: 0, width: 3, height: 112, background: G, boxShadow: `0 0 18px ${G}`}} />
      </div>
    </div>
  );
};

const ROWS = [
  {title: 'Echo cancellation', sub: 'Cleanup', at: T.echo},
  {title: 'Monitor', sub: 'Hear the converted voice', at: T.monitor},
  {title: 'Overdrive', sub: '', at: T.overdrive},
];

const Bolt: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block'}}>
    <path d="M36 6 L14 36 H30 L26 58 L50 26 H34 Z" fill={color} strokeLinejoin="round" />
  </svg>
);
const Chip: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{display: 'block'}}>
    <rect x={16} y={16} width={32} height={32} rx={6} fill="none" stroke={color} strokeWidth={4} />
    <rect x={25} y={25} width={14} height={14} rx={2} fill={color} />
    {[22, 32, 42].map((p) => (
      <path key={p} d={`M${p} 8 V14 M${p} 50 V56 M8 ${p} H14 M50 ${p} H56`} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
    ))}
  </svg>
);

const ControlsCard: React.FC<{f: number}> = ({f}) => {
  const od = f >= T.overdrive ? Math.exp(-(f - T.overdrive) / 14) : 0;
  const odOn = clamp(prog(f, T.overdrive, T.overdrive + 6));
  const gpu = sp(f, T.gpu, {damping: 12, stiffness: 200, mass: 0.7});
  return (
    <div
      style={{
        ...card,
        overflow: 'visible',
        left: 1920 + 400,
        top: 176,
        width: 1120,
        height: 540,
        border: `1px solid ${odOn > 0 ? rgba(G, 0.25 + 0.6 * od) : C.selection}`,
        boxShadow: `0 40px 100px rgba(0,0,0,0.65), 0 0 ${120 * odOn}px ${rgba(G, 0.12 + 0.35 * od)}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        transform: `scale(${1 + 0.025 * od * Math.cos((f - T.overdrive) * 0.5)})`,
      }}
    >
      <div style={{position: 'absolute', left: 52, top: 42, fontFamily: FONT, fontWeight: 800, fontSize: 36, color: C.fg, letterSpacing: '-0.01em'}}>Monitor & cleanup</div>
      <div
        style={{
          position: 'absolute',
          right: 48,
          top: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 20px 10px 14px',
          borderRadius: 99,
          background: C.control,
          border: `1px solid ${C.divider}`,
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 22,
          color: C.sub,
          opacity: clamp(gpu * 3),
          transform: `scale(${mix(0.6, 1, gpu)})`,
          transformOrigin: 'right center',
        }}
      >
        <Chip size={30} color={G} />
        <span>Renderer</span>
        <span style={{color: '#555'}}>·</span>
        <span style={{color: C.fg, fontWeight: 800}}>GPU</span>
        <span style={{width: 10, height: 10, borderRadius: 5, background: G, marginLeft: 4, boxShadow: `0 0 10px ${G}`}} />
      </div>
      {ROWS.map((r, i) => {
        const top = 124 + i * 132;
        const isOd = i === 2;
        const on = clamp(prog(f, r.at, r.at + 5));
        return (
          <React.Fragment key={r.title}>
            <div style={{position: 'absolute', left: 52, right: 52, top: top - 8, height: 1, background: C.divider}} />
            <div
              style={{
                position: 'absolute',
                left: 52,
                top: top + 18,
                width: 72,
                height: 72,
                borderRadius: 18,
                background: isOd && on > 0 ? rgba(G, 0.16 * on) : C.control,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i === 0 ? (
                <svg width={40} height={40} viewBox="0 0 64 64">
                  <path d="M8 32 Q 18 12 28 32 T 48 32" fill="none" stroke={on > 0.5 ? G : '#9a9a9a'} strokeWidth={5} strokeLinecap="round" />
                  <path d="M40 18 L56 46" stroke={on > 0.5 ? G : '#9a9a9a'} strokeWidth={5} strokeLinecap="round" />
                </svg>
              ) : i === 1 ? (
                <PhonesIcon size={38} color={on > 0.5 ? G : '#9a9a9a'} />
              ) : (
                <Bolt size={40} color={on > 0.5 ? G : '#9a9a9a'} />
              )}
            </div>
            <div style={{position: 'absolute', left: 150, top: top + (r.sub ? 16 : 32), fontFamily: FONT, fontWeight: 700, fontSize: isOd ? 38 : 32, color: C.fg}}>
              {r.title}
            </div>
            {r.sub ? (
              <div style={{position: 'absolute', left: 150, top: top + 60, fontFamily: FONT, fontWeight: 400, fontSize: 22, color: C.sub}}>{r.sub}</div>
            ) : null}
            <div style={{position: 'absolute', right: 52, top: top + 26}}>
              {isOd ? (
                <div style={{position: 'absolute', left: 59, top: 32, width: 0, height: 0}}>
                  <Glow x={0} y={0} size={260} color={G} opacity={0.9 * od} scale={0.7 + 0.5 * (1 - od)} />
                  {[0, 7].map((d) => {
                    const t = f - T.overdrive - d;
                    if (t < 0 || t > 40) return null;
                    const p = ease.expoOut(prog(t, 0, 36));
                    return (
                      <div
                        key={d}
                        style={{
                          position: 'absolute',
                          left: -60,
                          top: -60,
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          border: `${d ? 2 : 4}px solid ${G}`,
                          opacity: 1 - prog(t, 4, 40),
                          transform: `scale(${1 + 6 * p})`,
                        }}
                      />
                    );
                  })}
                </div>
              ) : null}
              <Toggle f={f} at={r.at} big={isOd} />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const WORD_LIST = [
  {t: 'Live', side: 0},
  {t: 'words,', side: 0},
  {t: 'sized', side: 0},
  {t: 'your', side: 1},
  {t: 'way.', side: 1},
];

const Cursor: React.FC = () => (
  <svg width={40} height={40} viewBox="0 0 40 40" style={{display: 'block', overflow: 'visible'}}>
    <path d="M4 3 L4 31 L11.5 24 L17 36 L22 34 L16.5 22.5 L27 22.5 Z" fill="#fff" stroke="#000" strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

const WordsPanel: React.FC<{f: number}> = ({f}) => {
  const enter = sp(f, T.words - 2, {damping: 16, stiffness: 150, mass: 0.8});
  const g = ease.inOut(prog(f, T.grow[0], T.grow[1]));
  const out = ease.inOut(prog(f, 446, 468));
  const S = mix(WORDS.S0, WORDS.S1, g);
  const w = mix(1000, 1640, g);
  const h = mix(300, 430, g);
  const cx = 3840 + 960;
  const cy = 540;
  const X0 = wordsX0(S) + 3840;
  const top = WORDS.cy - S / 2;
  const word = (i: number) => {
    const s = sp(f, T.wordAt[i], {damping: 15, stiffness: 210, mass: 0.6});
    const fresh = clamp(1 - (f - T.wordAt[i]) / 26);
    return {opacity: clamp(s * 2.5), transform: `translateY(${(1 - s) * 0.4 * S}px)`, color: mixHex('#ffffff', G, fresh)};
  };
  const curIn = clamp(prog(f, 392, 400)) * (1 - clamp(prog(f, 446, 452)));
  const textStyle: React.CSSProperties = {
    position: 'absolute',
    top,
    fontFamily: FONT,
    fontWeight: 800,
    fontSize: S,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    whiteSpace: 'pre',
    display: 'flex',
  };
  return (
    <>
      <div
        style={{
          ...card,
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          opacity: clamp(enter * 2) * (1 - out),
          transform: `translateY(${(1 - enter) * 90 + out * 30}px) scale(${mix(0.9, 1, enter) * mix(1, 0.97, out)})`,
          border: `1px solid ${g > 0 && g < 1 ? rgba(G, 0.5) : C.selection}`,
        }}
      >
        <div style={{position: 'absolute', left: 34, top: 28, display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT, fontWeight: 700, fontSize: 24, color: C.sub}}>
          <span style={{width: 11, height: 11, borderRadius: 6, background: G, boxShadow: `0 0 12px ${G}`}} />
          Live words
        </div>
        <div style={{position: 'absolute', right: 34, top: 30, display: 'flex', alignItems: 'center', gap: 16}}>
          <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: '0.16em', color: C.sub}}>TEXT SIZE</span>
          <span style={{fontFamily: FONT, fontWeight: 700, fontSize: 16, color: C.sub}}>A</span>
          <div style={{position: 'relative', width: 200, height: 6, borderRadius: 3, background: '#3a3a3a'}}>
            <div style={{position: 'absolute', left: 0, top: 0, height: 6, width: 30 + 150 * g, borderRadius: 3, background: G}} />
            <div style={{position: 'absolute', left: 30 + 150 * g - 11, top: -8, width: 22, height: 22, borderRadius: 11, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.5)'}} />
          </div>
          <span style={{fontFamily: FONT, fontWeight: 700, fontSize: 26, color: C.sub}}>A</span>
        </div>
        {/* resize grip */}
        <svg width={34} height={34} viewBox="0 0 34 34" style={{position: 'absolute', right: 14, bottom: 14}}>
          {[10, 18, 26].map((d) => (
            <path key={d} d={`M${32 - d} 32 L32 ${32 - d}`} stroke={g > 0 && g < 1 ? G : '#666'} strokeWidth={3} strokeLinecap="round" />
          ))}
        </svg>
      </div>
      {/* the words (screen space so the detaching "y" has a known position) */}
      <div style={{position: 'absolute', inset: 0, opacity: (1 - out) * clamp(enter * 3)}}>
        <div style={{...textStyle, right: 1920 - X0}}>
          {WORD_LIST.slice(0, 3).map((wd, i) => (
            <span key={wd.t} style={{display: 'inline-block', ...word(i)}}>
              {wd.t + ' '}
            </span>
          ))}
        </div>
        <div style={{...textStyle, left: X0}}>
          <span style={{display: 'inline-block', ...word(3)}}>
            <span style={{opacity: f >= T.detach ? 0 : 1}}>y</span>our{' '}
          </span>
          <span style={{display: 'inline-block', ...word(4)}}>way.</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: cx + w / 2 - 30, top: cy + h / 2 - 30, opacity: curIn, transform: `translate(${(1 - curIn) * 30}px, ${(1 - curIn) * 30}px)`}}>
        <Cursor />
      </div>
    </>
  );
};

// cards layer: reads the frame itself so CameraMotionBlur can sub-sample the pans
const Cards: React.FC = () => {
  const f = useWorldFrame();
  if (f < 120 || f > 470) return null;
  const pan = panAt(f);
  const sway = Math.min(1, Math.max(0, (f - 130) / 40));
  return (
    <AbsoluteFill style={{perspective: 2200, perspectiveOrigin: '960px 500px'}}>
      <AbsoluteFill
        style={{
          transform: `translateX(${-pan}px) rotateY(${sway * 2.2 * Math.sin(f / 62)}deg) rotateX(${sway * (1.6 + 1.2 * Math.sin(f / 47))}deg)`,
          transformOrigin: `${960 + pan}px 540px`,
        }}
      >
        {f < PAN1[1] + 2 ? <SignalCard f={f} /> : null}
        {f > PAN1[0] - 2 && f < PAN2[1] + 2 ? <ControlsCard f={f} /> : null}
        {f > PAN2[0] - 2 ? <WordsPanel f={f} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Floor f={f} />
      <Title f={f} />
      <Burst f={f} at={T.drop} x={960} y={540} size={900} />
      {inPan(f) ? (
        <CameraMotionBlur samples={8} shutterAngle={180}>
          <Cards />
        </CameraMotionBlur>
      ) : (
        <Cards />
      )}
      <AbsoluteFill style={{pointerEvents: 'none', opacity: f >= T.overdrive ? 0.22 * Math.exp(-(f - T.overdrive) / 8) : 0, background: G, mixBlendMode: 'screen'}} />
      <BoundaryShard u={f - 480} />
    </AbsoluteFill>
  );
};
