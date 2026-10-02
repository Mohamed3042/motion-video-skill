// Intro (0–6 s), "One voice. Nine worlds.": a green line ignites, vibrates into a waveform, splits into nine
// accent strands that curl into a rotating moiré tunnel of rings; "MK Voice" slams in; the camera dives into amber.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ACCENT, C, FONT, H, MONO, W} from '../brand';
import {PAD, WORLDS} from '../timing';
import {Mark} from '../shell/Mark';
import {CX, CY, clamp, ease, lerp, mixHex, prog, rgba, smooth} from '../shell/util';
import {CURL, DIVE, IGNITE, SPLIT, TAGLINE, TITLE, WAVE, diveZoom, ringRadius} from './timing';

const COLORS = WORLDS.map((w) => ACCENT[w.id]);
const NPTS = 200;
const DIAG = Math.hypot(CX, CY);

// Vibrating-string displacement at s ∈ [0,1] (pinned at both ends), strand i gets its own phase.
const wave = (s: number, g: number, i: number) => {
  const t = g / 60;
  const ph = i * 0.55;
  const env = Math.sin(Math.PI * s) ** 0.9;
  return (
    env *
    (0.62 * Math.sin(2 * Math.PI * 3 * s - 7.1 * t + ph) +
      0.28 * Math.sin(2 * Math.PI * 7.3 * s + 11.3 * t + 1.7 * ph) +
      0.16 * Math.sin(2 * Math.PI * 13 * s - 17 * t + 0.6 + ph))
  );
};

// Strand i as a path: a straight waveform that curls (constant curvature) into ring i, closing at the top.
const strandPath = (g: number, i: number, s0: number, s1: number) => {
  const split = ease.cubicInOut(prog(g, SPLIT[0], SPLIT[1]));
  const k = ease.cubicInOut(prog(g, CURL[0] + 2 * i, CURL[1] - 16 + 2 * i));
  const amp = 74 * smooth(WAVE[0], WAVE[1] - 16, g) * (1 - 0.4 * split) * (1 - k);
  const yi = CY + (i - 4) * 46 * split;
  const ri = ringRadius(i);
  const phi = 2 * Math.PI * k;
  const len = lerp(W + 60, 2 * Math.PI * ri, k);
  const ym = lerp(yi, CY + ri, k);
  let d = '';
  for (let n = 0; n <= NPTS; n++) {
    const s = lerp(s0, s1, n / NPTS);
    const disp = amp * wave(s, g, i);
    let x: number;
    let y: number;
    if (phi < 1e-4) {
      x = CX + (s - 0.5) * len;
      y = ym + disp;
    } else {
      const R = len / phi;
      const a = (s - 0.5) * phi;
      x = CX + (R + disp) * Math.sin(a);
      y = ym - R + (R + disp) * Math.cos(a);
    }
    d += `${n ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return {d, split};
};

const Strands: React.FC<{g: number}> = ({g}) => {
  const fadeOut = 1 - smooth(176, 198, g);
  if (g < IGNITE || fadeOut <= 0) return null;
  const hl = 0.5 * ease.expoOut(prog(g, IGNITE, IGNITE + 8)); // ignite: the line runs out from the centre
  const hot = Math.exp(-(g - IGNITE) / 14);
  const paths = WORLDS.map((_, i) => ({i, ...strandPath(g, i, 0.5 - hl, 0.5 + hl)}));
  const col = (i: number, split: number) => mixHex(C.green, COLORS[i], split);
  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <svg width={W} height={H} style={{position: 'absolute', filter: 'blur(9px)', opacity: 0.85}}>
        {paths.map(({i, d, split}) => (
          <path key={i} d={d} fill="none" stroke={col(i, split)} strokeWidth={12 + 10 * hot} strokeLinecap="round" />
        ))}
      </svg>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {paths.map(({i, d, split}) => (
          <path key={i} d={d} fill="none" stroke={col(i, split)} strokeWidth={4} strokeLinecap="round" />
        ))}
        <path d={paths[4].d} fill="none" stroke="#FFFFFF" strokeWidth={1.6} opacity={0.35 + 0.65 * hot} strokeLinecap="round" />
      </svg>
    </AbsoluteFill>
  );
};

// Nine dashed rings, each two dash layers with slightly different counts turning in opposite directions → moiré.
const Rings: React.FC<{g: number}> = ({g}) => {
  const vis = smooth(168, 190, g);
  if (vis <= 0) return null;
  const z = diveZoom(g);
  const zs = z ** 0.5;
  const t = g - 168;
  const pulse = g >= TITLE ? Math.exp(-((g - TITLE) % 30) / 7) : 0;
  const dimForTitle = 1 - 0.45 * smooth(TITLE - 4, TITLE + 6, g) * (1 - smooth(318, DIVE, g));
  const items: React.ReactNode[] = [];
  const glow: React.ReactNode[] = [];
  WORLDS.forEach((w, i) => {
    const r = ringRadius(i) * z * (1 + 0.014 * pulse);
    if (r > DIAG + 150) return;
    const c = 2 * Math.PI * r;
    // Fine radial gratings (~13 px period); the two layers differ by 3 dashes, so they beat into 3 lobes
    // per ring that drift as the layers counter-rotate: solid where the gratings interleave, dashed where they align.
    const n1 = Math.round((2 * Math.PI * ringRadius(i)) / 13);
    const n2 = n1 + 3;
    const dir = i % 2 ? 1 : -1;
    const col = COLORS[i];
    const rotA = dir * t * (0.5 + 0.05 * i);
    const rotB = -dir * t * 0.3;
    items.push(
      <g key={w.id}>
        <circle cx={CX} cy={CY} r={r} fill="none" stroke={col} strokeWidth={1.5 * zs} opacity={0.4} />
        <circle cx={CX} cy={CY} r={r} fill="none" stroke={col} strokeWidth={13 * zs} strokeDasharray={`${c / n1 / 2} ${c / n1 / 2}`} transform={`rotate(${rotA} ${CX} ${CY})`} />
        <circle cx={CX} cy={CY} r={r} fill="none" stroke={col} strokeWidth={13 * zs} strokeDasharray={`${c / n2 / 2} ${c / n2 / 2}`} transform={`rotate(${rotB} ${CX} ${CY})`} opacity={0.8} />
      </g>,
    );
    glow.push(<circle key={w.id} cx={CX} cy={CY} r={r} fill="none" stroke={col} strokeWidth={14 * zs} opacity={0.5} />);
  });
  return (
    <AbsoluteFill style={{opacity: vis * dimForTitle}}>
      <svg width={W} height={H} style={{position: 'absolute', filter: 'blur(16px)', opacity: 0.55 + 0.3 * pulse}}>
        {glow}
      </svg>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {items}
      </svg>
    </AbsoluteFill>
  );
};

const Title: React.FC<{g: number}> = ({g}) => {
  if (g < TITLE - 7 || g > DIVE + 4) return null;
  const slam = prog(g, TITLE - 7, TITLE);
  const settle = g >= TITLE ? 1 + 0.045 * Math.exp(-(g - TITLE) / 4) * Math.cos((g - TITLE) * 0.9) : lerp(2.3, 1, ease.cubicIn(slam));
  const exit = ease.cubicIn(prog(g, 316, DIVE + 2));
  const scale = settle * (1 + 0.4 * exit);
  const op = clamp(slam * 1.8) * (1 - exit);
  const tagN = 'ONE VOICE. NINE WORLDS.';
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 46% 34% at 50% 52%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0) 100%)', opacity: smooth(TITLE - 6, TITLE + 8, g) * (1 - exit)}} />
      <div style={{position: 'absolute', left: 0, top: CY - 100, width: W, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 44, transform: `scale(${scale})`, opacity: op}}>
        <div style={{transform: `translateX(${-34 * (1 - ease.expoOut(prog(g, TITLE, TITLE + 16)))}px)`}}>
          <Mark size={156} glow={0.25 + 0.6 * Math.exp(-(g - TITLE) / 12)} grow={(i) => ease.backOut(prog(g, TITLE + 1 + Math.abs(i - 3) * 2, TITLE + 15 + Math.abs(i - 3) * 2))} />
        </div>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 176, letterSpacing: '-0.045em', color: C.fg, lineHeight: 1, textShadow: '0 0 50px rgba(30,215,96,0.28)'}}>MK Voice</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: CY + 138,
          width: W,
          textAlign: 'center',
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: '0.5em',
          color: C.fg,
          opacity: 1 - exit,
          transform: `scale(${1 + 0.25 * exit})`,
        }}
      >
        {tagN.split('').map((ch, j) => (
          <span key={j} style={{opacity: prog(g, TAGLINE + j * 0.8, TAGLINE + 4 + j * 0.8), color: ch === '.' ? C.green : undefined}}>
            {ch}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Intro: React.FC = () => {
  const g = useCurrentFrame() - PAD; // the intro's Sequence starts PAD frames before 0 (like the worlds)
  const flash = g >= IGNITE ? Math.exp(-(g - IGNITE) / 9) : 0;
  const titleFlash = g >= TITLE ? Math.exp(-(g - TITLE) / 7) : 0;
  return (
    <AbsoluteFill style={{background: C.black}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(30,215,96,0.09) 0%, rgba(18,18,18,0.6) 35%, rgba(0,0,0,0) 75%)', opacity: smooth(IGNITE, 120, g)}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 16% at 50% 50%, ${rgba(C.green, 0.55)} 0%, rgba(0,0,0,0) 70%)`, opacity: flash}} />
      <Rings g={g} />
      <Strands g={g} />
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.5) 0%, rgba(30,215,96,0.18) 40%, rgba(0,0,0,0) 75%)', opacity: titleFlash * 0.8}} />
      <Title g={g} />
    </AbsoluteFill>
  );
};
