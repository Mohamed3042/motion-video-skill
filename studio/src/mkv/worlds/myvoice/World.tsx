// World 1 · MY VOICE — "the mirror". Rubin's vase on amber; the vase contour is a live waveform.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {mulberry32} from '../../timing';
import {PORTAL_LINE} from '../clonelab/geometry';
import {EXPO, EXPO_IN, IN_OUT, Icon, Letters, card, enter, mix, mixColor, pop, ramp} from './kit';
import {CARD, CHARS, COMP, DETACH, EVENTS, EXIT, PEAK, TABS} from './timing';
import {PROFILES, blendProfile, contour, facePath, linePath, SAMPLES} from './vase';

const AMB = ACCENT.myvoice;
const CREAM = '#FFE7BF';
const TINTS = ['#E8492F', '#FFF0D4', '#52203F'];
const CHAR_NAMES = ['Character A', 'Character B', 'Character C'];

// every moment the contour should ripple: Rhodes comps + all world events
const HITS = [...[0, 120, 240, 360].flatMap((b) => COMP.map((c) => b + c)), ...EVENTS.filter((e) => e.kind !== 'whoosh').map((e) => e.f)].sort((a, b) => a - b);
const RINGS = [PEAK, CARD, ...CHARS];

const COLX = 1040;
const COLW = 760;
const CARD_Y = 246;
const WAVE_X0 = 1158;
const WAVE_X1 = 1756;
const WAVE_Y = CARD_Y + 206;

// ---------- medallion state ----------
const medal = (f: number) => {
  const a = ramp(f, 98, 140, IN_OUT);
  const b = ramp(f, 194, 238, IN_OUT);
  const c = ramp(f, 440, 468, IN_OUT); // exit: back to centre, where the portal line forms
  const e = pop(f, -10, 17, 120, 0.9);
  const R = mix(mix(mix(240, 360, a), 300, b), 330, c) * mix(0.62, 1, e);
  return {cx: mix(mix(960, 560, b), 960, c), cy: mix(mix(mix(622, 540, a), 548, b), 540, c), R};
};

const profileAt = (f: number) => {
  let p = PROFILES[0];
  CHARS.forEach((at, i) => {
    p = blendProfile(p, PROFILES[i + 1], pop(f, at - 5, 12, 170, 0.7));
  });
  return p;
};

const rippleAmp = (f: number) => {
  let a = 0.005 + 0.004 * ramp(f, PEAK - 10, PEAK + 10) * (1 - ramp(f, 230, 260));
  for (const h of HITS) if (f >= h) a += 0.014 * Math.exp(-(f - h) / 14);
  return a;
};

// 0 = read the vase (cylindrical shading), 1 = read the faces (rim-lit profiles)
const modeAt = (f: number) => {
  let m = 0.35;
  for (const [at, v] of [
    [PEAK, 0],
    [150, 1],
    [180, 0],
    [210, 0.5],
    [300, 0.9],
    [330, 0.3],
    [CHARS[0], 1],
  ])
    m = mix(m, v, ramp(f, at - 5, at + 7, IN_OUT));
  return m;
};

// card waveform target (absolute px)
const rnd = mulberry32(11);
const BURSTS = Array.from({length: 5}, () => ({c: rnd(), w: 0.05 + rnd() * 0.08, a: 0.45 + rnd() * 0.55}));
const cardWave = (i: number, f: number): [number, number] => {
  const u = i / SAMPLES;
  let env = 0.08;
  for (const b of BURSTS) env += b.a * Math.exp(-(((u - b.c) / b.w) ** 2));
  env = Math.min(1, env) * Math.sin(Math.PI * u) ** 0.6;
  const w = 0.62 * Math.sin(i * 0.66 + f * 0.31) + 0.38 * Math.sin(i * 1.47 - f * 0.47);
  return [WAVE_X0 + (WAVE_X1 - WAVE_X0) * u, WAVE_Y + 46 * env * w];
};

const pathOf = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');

// glowing stroke: two soft passes + a crisp core
const GlowLine: React.FC<{d: string; color: string; glow: string; width?: number; opacity?: number}> = ({d, color, glow, width = 3, opacity = 1}) => (
  <g opacity={opacity} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={glow} strokeWidth={width * 9} opacity={0.08} />
    <path d={d} stroke={glow} strokeWidth={width * 3.5} opacity={0.22} />
    <path d={d} stroke={color} strokeWidth={width} />
  </g>
);

// a single generic profile silhouette in a circle (avatars)
const Avatar: React.FC<{size: number; bg: string; fg: string; profile: number[]}> = ({size, bg, fg, profile}) => {
  const pts = contour(profile, 0, 0, -1.1, 1.1);
  return (
    <svg width={size} height={size} viewBox="-1 -1 2 2" style={{display: 'block', flexShrink: 0, borderRadius: '50%'}}>
      <circle r={1} fill={bg} />
      <g transform="translate(0.5 0.12) scale(1.1)">
        <path d={facePath(pts, -1)} fill={fg} />
      </g>
    </svg>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  const {cx, cy, R} = medal(f);
  const prof = profileAt(f);
  const amp = rippleAmp(f);
  const mode = modeAt(f);
  const pts = contour(prof, f, amp);

  // entrance / exit envelopes
  const facesIn = 1 - ramp(f, -10, 24, EXPO);
  const facesOut = ramp(f, 440, 462, EXPO_IN);
  const faceDx = (facesIn * 0.95 + facesOut * 0.8) as number;
  const faceOpacity = ramp(f, -10, 6) * (1 - ramp(f, 448, 462));
  const discOpacity = ramp(f, -12, 2) * (1 - ramp(f, 450, 468));
  const decorOpacity = ramp(f, 4, 40) * (1 - ramp(f, EXIT, EXIT + 16));
  const morph = f >= 444; // exit: the contour leaves the medallion and straightens

  // character tint
  const tintAmt = ramp(f, CHARS[0] - 4, CHARS[0] + 5);
  const tint = mixColor(mixColor(TINTS[0], TINTS[1], ramp(f, CHARS[1] - 4, CHARS[1] + 5)), TINTS[2], ramp(f, CHARS[2] - 4, CHARS[2] + 5));
  const flash = CHARS.reduce((a, at) => a + (f >= at - 2 ? Math.exp(-(f - at + 2) / 7) : 0), 0);

  const leftFace = facePath(pts, -1, -faceDx);
  const rightFace = facePath(pts, 1, faceDx);
  const lLine = linePath(pts.map(([w, y]) => [-w - faceDx, y]));
  const rLine = linePath(pts.map(([w, y]) => [w + faceDx, y]));

  // ---------- overlay lines (absolute px) ----------
  const flyPts = contour(prof, f, amp, -0.9, 0.9);
  let flyD = '';
  let flyOn = false;
  if (f >= DETACH - 2 && f < EXIT + 30) {
    flyOn = true;
    const N = flyPts.length - 1;
    const p = flyPts.map(([w, y], i) => {
      const src: [number, number] = [cx + R * w, cy + R * y];
      const dst = cardWave(i, f);
      const t = ramp(f, DETACH + (N - i) * 0.08, DETACH + 30 + (N - i) * 0.08, IN_OUT);
      const lift = Math.sin(Math.PI * t) * 70;
      return [mix(src[0], dst[0], t), mix(src[1], dst[1], t) - lift] as [number, number];
    });
    flyD = pathOf(p);
  }
  const colOut = (i: number) => ramp(f, EXIT + i * 2, EXIT + 12 + i * 2, EXPO_IN);
  const cardOut = colOut(1);

  let exitD = '';
  let exitStroke = CREAM;
  if (morph) {
    // stage 1: each contour straightens in place (vertical); stage 2: both pivot and merge into the stair edge
    const [E0, E1] = PORTAL_LINE;
    const Y0 = -0.88;
    const Y1 = 0.9;
    const ex = contour(prof, f, amp * (1 - ramp(f, 444, 458)), Y0, Y1);
    const N = ex.length - 1;
    const t1 = ramp(f, 442, 458, IN_OUT);
    const t2 = ramp(f, 454, 478, IN_OUT);
    const angT = Math.atan2(E1[1] - E0[1], E1[0] - E0[0]);
    const ang = mix(-Math.PI / 2, angT, t2);
    const lenT = Math.hypot(E1[0] - E0[0], E1[1] - E0[1]);
    const len = mix(R * (Y1 - Y0), lenT, t2);
    const side = (s: 1 | -1) => {
      const mcx = mix(cx + s * R * 0.2, 960, t2);
      const mcy = mix(cy + R * ((Y0 + Y1) / 2), 540, t2);
      return pathOf(
        ex.map(([w, y], i) => {
          const u = i / N;
          const curved: [number, number] = [cx + R * s * (w + faceDx), cy + R * y];
          // straight version (a rigid segment), top (u = 0) at the far end of its direction
          const sx = mcx + (0.5 - u) * len * Math.cos(ang);
          const sy = mcy + (0.5 - u) * len * Math.sin(ang);
          return [mix(curved[0], sx, t1), mix(curved[1], sy, t1)];
        }),
      );
    };
    exitD = side(-1) + side(1);
    exitStroke = mixColor(CREAM, '#E4FBFF', ramp(f, 462, 488));
  }

  // tabs highlight index
  const TAB_W = [168, 136, 136, 172];
  const TAB_X = TAB_W.map((_, i) => TAB_W.slice(0, i).reduce((a, b) => a + b + 12, 0));
  const hIdx = TABS.slice(1).reduce((a, t) => a + ramp(f, t - 11, t, EXPO), 0);
  const hFloor = Math.min(2, Math.floor(hIdx));
  const hT = hIdx - hFloor;
  const hX = mix(TAB_X[hFloor], TAB_X[hFloor + 1], hT);
  const hW = mix(TAB_W[hFloor], TAB_W[hFloor + 1], hT);
  const tabPop = TABS.slice(1).reduce((a, t) => a + (f >= t ? Math.exp(-(f - t) / 6) : 0), 0);

  // ripple rings (sound made visible)
  const rings = RINGS.filter((h) => f >= h && f < h + 50).map((h) => (f - h) / 50);

  // glow pulse
  const pulse = HITS.reduce((a, h) => a + (f >= h ? Math.exp(-(f - h) / 12) : 0), 0);

  // title
  const titleOut = 96;

  return (
    <AbsoluteFill style={{background: 'radial-gradient(120% 100% at 50% 45%, #21160a 0%, #0e0a06 55%, #060403 100%)', overflow: 'hidden'}}>
      {/* warm glow behind the medallion */}
      <div
        style={{
          position: 'absolute',
          left: cx - R * 2.4,
          top: cy - R * 2.4,
          width: R * 4.8,
          height: R * 4.8,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,181,71,${0.3 + 0.08 * Math.min(1, pulse)}) 0%, rgba(255,140,40,0.08) 38%, transparent 62%)`,
          opacity: discOpacity,
        }}
      />

      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="mv-disc">
            <circle r={1} />
          </clipPath>
          <linearGradient id="mv-vase" gradientUnits="userSpaceOnUse" x1={-0.62} y1={0} x2={0.62} y2={0}>
            <stop offset="0" stopColor="#9a5212" />
            <stop offset="0.3" stopColor="#f2a540" />
            <stop offset="0.43" stopColor="#ffe0a3" />
            <stop offset="0.52" stopColor="#ffc865" />
            <stop offset="0.78" stopColor="#e08a26" />
            <stop offset="1" stopColor="#7a3e0c" />
          </linearGradient>
          <linearGradient id="mv-litL" gradientUnits="userSpaceOnUse" x1={-1} y1={0} x2={-0.05} y2={0}>
            <stop offset="0" stopColor="#0b0704" />
            <stop offset="0.7" stopColor="#3a210b" />
            <stop offset="1" stopColor="#7a4716" />
          </linearGradient>
          <linearGradient id="mv-litR" gradientUnits="userSpaceOnUse" x1={1} y1={0} x2={0.05} y2={0}>
            <stop offset="0" stopColor="#0b0704" />
            <stop offset="0.7" stopColor="#3a210b" />
            <stop offset="1" stopColor="#7a4716" />
          </linearGradient>
          <radialGradient id="mv-disc-g" gradientUnits="userSpaceOnUse" cx={-0.2} cy={-0.35} r={1.4}>
            <stop offset="0" stopColor="#ffc96f" />
            <stop offset="1" stopColor="#e8902c" />
          </radialGradient>
        </defs>

        {/* entrance: the intro's amber ring rushes past the camera */}
        {f < 20 ? (
          <g opacity={1 - ramp(f, 2, 18)} fill="none">
            {[0, 1].map((k) => {
              // constant-speed dive: the radius grows exponentially, so the ring rushes past the camera
              const r = 420 * (1600 / 420) ** ramp(f + k * 6, -12, 14, (t) => t) - k * 60;
              return (
                <g key={k}>
                  <circle cx={960} cy={540} r={r} stroke={AMB} strokeWidth={r * 0.045} opacity={0.14} />
                  <circle cx={960} cy={540} r={r} stroke={AMB} strokeWidth={r * 0.016} opacity={k ? 0.5 : 0.95} />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* ripple rings */}
        {rings.map((t, i) => (
          <circle key={i} cx={cx} cy={cy} r={R * (1.04 + t * 0.55)} fill="none" stroke={AMB} strokeWidth={2.5 * (1 - t)} opacity={0.55 * (1 - t) * discOpacity} />
        ))}

        {/* dial decoration */}
        <g transform={`translate(${cx} ${cy})`} opacity={decorOpacity}>
          <circle r={R + 18} fill="none" stroke={AMB} strokeWidth={1.4} opacity={0.5} />
          <g transform={`rotate(${f * 0.06})`}>
            {Array.from({length: 72}, (_, i) => {
              const major = i % 6 === 0;
              const a = (i / 72) * Math.PI * 2;
              const r0 = R + 26;
              const r1 = R + (major ? 40 : 32);
              return (
                <line
                  key={i}
                  x1={Math.cos(a) * r0}
                  y1={Math.sin(a) * r0}
                  x2={Math.cos(a) * r1}
                  y2={Math.sin(a) * r1}
                  stroke={AMB}
                  strokeWidth={major ? 2 : 1.2}
                  opacity={major ? 0.75 : 0.35}
                />
              );
            })}
          </g>
        </g>

        {/* the medallion */}
        <g transform={`translate(${cx} ${cy}) scale(${R})`}>
          <g opacity={discOpacity}>
            <circle r={1} fill="url(#mv-disc-g)" />
            <g clipPath="url(#mv-disc)">
              <rect x={-1} y={-1} width={2} height={2} fill="url(#mv-vase)" opacity={(1 - mode) * 0.95} />
              <rect x={-1} y={-1} width={2} height={2} fill="#6a3000" opacity={mode * 0.28} />
            </g>
          </g>
          <g clipPath="url(#mv-disc)" opacity={faceOpacity}>
            <path d={leftFace} fill="#0c0805" />
            <path d={rightFace} fill="#0c0805" />
            <path d={leftFace} fill="url(#mv-litL)" opacity={mode} />
            <path d={rightFace} fill="url(#mv-litR)" opacity={mode} />
            <path d={leftFace} fill={tint} opacity={tintAmt * 0.94} />
            <path d={rightFace} fill={tint} opacity={tintAmt * 0.94} />
            <path d={leftFace} fill="#fff6e6" opacity={Math.min(0.5, flash * 0.5)} />
            <path d={rightFace} fill="#fff6e6" opacity={Math.min(0.5, flash * 0.5)} />
            {!morph ? (
              <g fill="none" strokeLinejoin="round">
                {[lLine, rLine].map((d, i) => (
                  <g key={i}>
                    <path d={d} stroke={AMB} strokeWidth={14} opacity={0.12 + 0.12 * mode} vectorEffect="non-scaling-stroke" />
                    <path d={d} stroke={CREAM} strokeWidth={2.6} opacity={0.55 + 0.4 * mode} vectorEffect="non-scaling-stroke" />
                  </g>
                ))}
              </g>
            ) : null}
          </g>
          <circle r={1} fill="none" stroke="#ffd18a" strokeWidth={1.5} opacity={0.6 * discOpacity} vectorEffect="non-scaling-stroke" />
        </g>

      </svg>

      {/* ---------- bar 1: title ---------- */}
      {f < titleOut + 40 ? (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 138, display: 'flex', justifyContent: 'center', ...enter(f, 4, titleOut - 2)}}>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.42em', color: AMB}}>01 / 09</div>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 176, display: 'flex', justifyContent: 'center'}}>
            <Letters f={f} text="MY VOICE" at={2} out={titleOut} size={138} color="#fff7ea" stagger={3} />
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 902, display: 'flex', justifyContent: 'center', ...enter(f, 26, titleOut + 2)}}>
            <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 40, letterSpacing: '-0.01em', color: '#f3e3c8'}}>
              Your voice, <span style={{color: AMB, fontWeight: 700}}>learned.</span>
            </div>
          </div>
        </>
      ) : null}

      {/* ---------- bar 2: the illusion's caption, lit with whichever reading the shading favours ---------- */}
      {f > PEAK - 4 && f < 214 ? (
        <div
          style={{
            position: 'absolute',
            left: 1436,
            top: 468,
            fontFamily: MONO,
            fontWeight: 700,
            letterSpacing: '0.3em',
            opacity: ramp(f, PEAK + 4, PEAK + 18) * (1 - ramp(f, 192, 204)),
            transform: `translateX(${(1 - ramp(f, PEAK + 4, PEAK + 24)) * 24}px)`,
          }}
        >
          <div style={{fontSize: 15, color: '#7d6646', marginBottom: 14}}>FIG. 01</div>
          {(['FACES', 'VASE'] as const).map((w, i) => {
            const on = i ? 1 - mode : mode;
            return (
              <div key={w} style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 26, lineHeight: 1.5, color: mixColor('#5e4c34', AMB, on)}}>
                <span style={{width: 9, height: 9, borderRadius: 5, background: AMB, opacity: on, boxShadow: `0 0 12px ${AMB}`}} />
                {w}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ---------- bar 3: pill tabs ---------- */}
      {f >= TABS[0] - 14 && f < 372 ? (
        <div style={{position: 'absolute', left: COLX, top: 160, height: 54, width: COLW, ...enter(f, TABS[0] - 10, 350)}}>
          {TAB_W.map((w, i) => (
            <div key={i} style={{position: 'absolute', left: TAB_X[i], top: 0, width: w, height: 54, borderRadius: 27, background: C.control}} />
          ))}
          <div
            style={{
              position: 'absolute',
              left: hX,
              top: 0,
              width: hW,
              height: 54,
              borderRadius: 27,
              background: C.green,
              boxShadow: `0 0 ${24 + tabPop * 30}px rgba(30,215,96,${0.35 + tabPop * 0.3})`,
              transform: `scale(${1 + tabPop * 0.06})`,
            }}
          />
          {['Profiles', 'Setup', 'Intake', 'Compare'].map((t, i) => {
            const on = Math.max(0, 1 - Math.abs(hX + hW / 2 - (TAB_X[i] + TAB_W[i] / 2)) / (TAB_W[i] * 0.5));
            return (
              <div
                key={t}
                style={{
                  position: 'absolute',
                  left: TAB_X[i],
                  top: 0,
                  width: TAB_W[i],
                  height: 54,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 23,
                  color: mixColor('#ffffff', '#000000', on),
                }}
              >
                {t}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ---------- bar 4: headline ---------- */}
      {f >= CHARS[0] - 6 ? (
        <div style={{position: 'absolute', left: COLX, top: 150, width: COLW + 40, ...enter(f, CHARS[0], EXIT, 22)}}>
          <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 46, letterSpacing: '-0.03em', color: '#fff', whiteSpace: 'nowrap'}}>
            Your profile. <span style={{color: AMB}}>Your characters.</span>
          </div>
        </div>
      ) : null}

      {/* ---------- profile card ---------- */}
      {f >= 208 && f < EXIT + 30 ? (
        <div
          style={{
            ...card,
            left: COLX,
            top: CARD_Y,
            width: COLW,
            height: 276,
            opacity: ramp(f, 208, 230) * (1 - cardOut),
            transform: `translateX(${(1 - ramp(f, 208, 240)) * 70 + cardOut * 80}px)`,
          }}
        >
          <div style={{position: 'absolute', left: 32, top: 30, display: 'flex', alignItems: 'center', gap: 22, ...enter(f, 222)}}>
            <Avatar size={76} bg="#2a1d10" fg={AMB} profile={PROFILES[0]} />
            <div>
              <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 36, color: '#fff', letterSpacing: '-0.02em'}}>My voice</div>
              <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 22, color: C.sub, marginTop: 4}}>Personal profile</div>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              right: 30,
              top: 46,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 22,
              background: C.control,
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 20,
              color: '#fff',
              ...enter(f, 232),
            }}
          >
            <span style={{width: 10, height: 10, borderRadius: 5, background: C.green, boxShadow: `0 0 10px ${C.green}`}} />
            Saved
          </div>
          <div style={{position: 'absolute', left: 32, right: 32, top: 132, height: 1, background: C.divider, opacity: ramp(f, 226, 246)}} />
          <div
            style={{
              position: 'absolute',
              left: 34,
              top: WAVE_Y - CARD_Y - 30,
              width: 60,
              height: 60,
              borderRadius: 30,
              background: C.green,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${pop(f, CARD - 4, 12, 200)})`,
            }}
          >
            <Icon name="play" size={30} color="#000" />
          </div>
        </div>
      ) : null}

      {/* ---------- characters ---------- */}
      {CHARS.map((at, i) => {
        if (f < at - 14) return null;
        const active = ramp(f, at - 3, at + 3) * (i < 2 ? 1 - ramp(f, CHARS[i + 1] - 3, CHARS[i + 1] + 3) : 1);
        const s = pop(f, at - 12, 15, 190, 0.7);
        const out = colOut(2 + i);
        return (
          <div
            key={i}
            style={{
              ...card,
              left: COLX,
              top: 548 + i * 100,
              width: COLW,
              height: 84,
              borderRadius: 18,
              boxShadow: 'none',
              border: `2px solid ${mixColor(C.selection, C.green, active)}`,
              background: mixColor(C.surface, '#1f1f1f', active),
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '0 22px',
              opacity: Math.min(1, s * 1.5) * (1 - out),
              transform: `translateX(${(1 - s) * 80 + out * 80}px)`,
            }}
          >
            <Avatar size={56} bg="#2a2118" fg={TINTS[i]} profile={PROFILES[i + 1]} />
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 28, color: '#fff', flex: 1}}>{CHAR_NAMES[i]}</div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                border: `2px solid ${mixColor('#5a5a5a', C.green, active)}`,
                background: active > 0.5 ? C.green : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="play" size={22} color={active > 0.5 ? '#000' : '#fff'} />
            </div>
          </div>
        );
      })}

      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {/* contour → card waveform */}
        {flyOn ? (
          <g transform={`translate(${cardOut * 80} 0)`} opacity={1 - cardOut}>
            <GlowLine d={flyD} color={CREAM} glow={AMB} width={3} />
          </g>
        ) : null}
        {/* exit: contour straightens into the first stair edge */}
        {morph ? <GlowLine d={exitD} color={exitStroke} glow={mixColor(AMB, '#4FE3FF', ramp(f, 462, 488))} width={mix(3, 4.5, ramp(f, 460, 480))} /> : null}
      </svg>

      {/* exit glow at the stair edge */}
      {f > 470 ? (
        <div
          style={{
            position: 'absolute',
            left: 960 - 420,
            top: 540 - 420,
            width: 840,
            height: 840,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(140,230,255,0.22) 0%, transparent 60%)',
            opacity: ramp(f, 470, 486),
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

