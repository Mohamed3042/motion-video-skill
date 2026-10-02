import React from 'react';
import {AbsoluteFill, Audio, interpolate, interpolateColors, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, MONO, type Hue} from './brand';
import {CL, EXPO, EXPO_IN, IN_OUT, rng, type Theme} from './kit';

export type SceneTiming = {readonly id: string; readonly label: string; readonly from: number; readonly to: number; readonly out: string};
export type SceneSpec = {t: SceneTiming; Comp: React.FC; theme: Theme; origin?: [number, number]};

const W = 1920;

// ---------- designed transitions (12 frames, centred on the cut) ----------
type Look = {style: React.CSSProperties; dirBlur: number; blur: number; visible: boolean};

const look = (type: string, phase: 'in' | 'out', p: number, origin: [number, number]): Look => {
  const o = `${origin[0]}px ${origin[1]}px`;
  const base: Look = {style: {}, dirBlur: 0, blur: 0, visible: true};
  if (type === 'zoom') {
    if (phase === 'out')
      return {
        ...base,
        visible: p < 0.62,
        blur: interpolate(p, [0.15, 0.6], [0, 14], CL),
        style: {transformOrigin: o, scale: `${interpolate(p, [0, 0.62], [1, 6], {...CL, easing: EXPO_IN})}`, opacity: interpolate(p, [0.4, 0.62], [1, 0], CL)},
      };
    return {...base, visible: p > 0.38, style: {transformOrigin: '960px 540px', scale: `${interpolate(p, [0.38, 1], [1.35, 1], {...CL, easing: EXPO})}`, opacity: interpolate(p, [0.38, 0.6], [0, 1], CL)}};
  }
  if (type === 'whip') {
    const b = Math.sin(Math.PI * p) * 70;
    if (phase === 'out')
      return {...base, dirBlur: b, visible: p < 0.8, style: {translate: `${interpolate(p, [0, 1], [0, -W * 0.6], {...CL, easing: EXPO_IN})}px 0px`, opacity: interpolate(p, [0.45, 0.8], [1, 0], CL)}};
    return {...base, dirBlur: b, visible: p > 0.2, style: {translate: `${interpolate(p, [0, 1], [W * 0.6, 0], {...CL, easing: EXPO})}px 0px`, opacity: interpolate(p, [0.2, 0.5], [0, 1], CL)}};
  }
  if (type === 'iris') {
    if (phase === 'out') return {...base, style: {transformOrigin: o, scale: `${interpolate(p, [0, 1], [1, 0.94], {...CL, easing: IN_OUT})}`}};
    const r = interpolate(p, [0, 1], [0, 2300], {...CL, easing: IN_OUT});
    return {...base, visible: p > 0, style: {clipPath: `circle(${r}px at ${o})`, transformOrigin: o, scale: `${interpolate(p, [0, 1], [1.12, 1], {...CL, easing: EXPO})}`}};
  }
  if (type === 'flash') {
    if (phase === 'out') return {...base, visible: p < 0.5, style: {transformOrigin: o, scale: `${interpolate(p, [0, 0.5], [1, 1.07], {...CL, easing: EXPO_IN})}`}};
    return {...base, visible: p >= 0.5, style: {scale: `${interpolate(p, [0.5, 1], [1.1, 1], {...CL, easing: EXPO})}`}};
  }
  if (type === 'playhead') {
    if (phase === 'out') return {...base, style: {translate: `${interpolate(p, [0, 1], [0, -80], {...CL, easing: IN_OUT})}px 0px`}};
    const x = interpolate(p, [0, 1], [0, W], {...CL, easing: IN_OUT});
    return {...base, visible: p > 0, style: {clipPath: `inset(0px ${W - x}px 0px 0px)`}};
  }
  return base;
};

const SceneLayer: React.FC<{spec: SceneSpec; prev?: SceneSpec; f: number; T: number}> = ({spec, prev, f, T}) => {
  const {t} = spec;
  let lk: Look = {style: {}, dirBlur: 0, blur: 0, visible: true};
  if (prev && f < t.from + T / 2) lk = look(prev.t.out, 'in', (f - (t.from - T / 2)) / T, prev.origin ?? [960, 540]);
  else if (t.out !== 'none' && f >= t.to - T / 2) lk = look(t.out, 'out', (f - (t.to - T / 2)) / T, spec.origin ?? [960, 540]);
  if (!lk.visible) return null;
  const fid = `mkdb-${t.id}`;
  const filters = [lk.dirBlur > 0.5 ? `url(#${fid})` : '', lk.blur > 0.3 ? `blur(${lk.blur.toFixed(1)}px)` : ''].filter(Boolean).join(' ');
  const {Comp} = spec;
  return (
    <AbsoluteFill style={{...lk.style, filter: filters || undefined}}>
      {lk.dirBlur > 0.5 ? (
        <svg style={{position: 'absolute', width: 0, height: 0}}>
          <defs>
            <filter id={fid} x="-10%" y="0%" width="120%" height="100%">
              <feGaussianBlur stdDeviation={`${lk.dirBlur.toFixed(1)} 0`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      <Comp />
    </AbsoluteFill>
  );
};

// Overlays drawn at the cut point: flash, iris ring, playhead.
const CutOverlay: React.FC<{spec: SceneSpec; f: number; T: number; hue: Hue}> = ({spec, f, T, hue}) => {
  const {t} = spec;
  const p = (f - (t.to - T / 2)) / T;
  if (p < 0 || p > 1) return null;
  const o = spec.origin ?? [960, 540];
  if (t.out === 'zoom' || t.out === 'flash') {
    const a = t.out === 'flash' ? (p < 0.5 ? interpolate(p, [0.15, 0.5], [0, 1], CL) : interpolate(p, [0.5, 1], [1, 0], CL)) : (p < 0.55 ? interpolate(p, [0.28, 0.55], [0, 0.95], CL) : interpolate(p, [0.55, 1], [0.95, 0], CL));
    return <AbsoluteFill style={{background: `radial-gradient(circle at ${o[0]}px ${o[1]}px, #ffffff 0%, #ffffff 30%, ${hue.glow} 100%)`, opacity: a}} />;
  }
  if (t.out === 'iris') {
    const r = interpolate(p, [0, 1], [0, 2300], {...CL, easing: IN_OUT});
    return (
      <div
        style={{
          position: 'absolute',
          left: o[0] - r,
          top: o[1] - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          border: `4px solid ${hue.glow}`,
          boxShadow: `0 0 40px ${hue.hue}, inset 0 0 40px ${hue.hue}`,
          opacity: interpolate(p, [0, 0.1, 0.8, 1], [0, 1, 1, 0], CL),
        }}
      />
    );
  }
  if (t.out === 'playhead') {
    const x = interpolate(p, [0, 1], [0, W], {...CL, easing: IN_OUT});
    return (
      <AbsoluteFill style={{opacity: interpolate(p, [0, 0.08, 0.92, 1], [0, 1, 1, 0], CL)}}>
        <div style={{position: 'absolute', left: x - 2, top: 0, width: 4, height: 1080, background: hue.glow, boxShadow: `0 0 30px ${hue.hue}, 0 0 80px ${hue.hue}`}} />
        <div style={{position: 'absolute', left: x - 16, top: 112, width: 32, height: 26, background: hue.glow, clipPath: 'polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%)'}} />
      </AbsoluteFill>
    );
  }
  return null;
};

// ---------- camera shake: smooth sines, decaying over 22 frames ----------
export type Shake = {at: number; amp: number};
const shakeAt = (f: number, shakes: readonly Shake[]) => {
  let x = 0;
  let y = 0;
  for (const s of shakes) {
    const d = f - s.at;
    if (d < 0 || d > 22) continue;
    const k = s.amp * (1 - d / 22) ** 2;
    x += k * (Math.sin(d * 1.7 + s.at) * 0.65 + Math.sin(d * 3.1 + s.at * 0.37) * 0.35);
    y += k * (Math.cos(d * 1.45 + s.at * 0.7) * 0.6 + Math.sin(d * 2.6 + 1) * 0.4);
  }
  return [x, y];
};

// ---------- global layers ----------
const Bracket: React.FC<{x: number; y: number; sx: number; sy: number; color: string}> = ({x, y, sx, sy, color}) => (
  <svg style={{position: 'absolute', left: x - (sx < 0 ? 28 : 0), top: y - (sy < 0 ? 28 : 0), overflow: 'visible'}} width={28} height={28}>
    <path d={`M${sx > 0 ? 0 : 28} ${sy > 0 ? 28 : 0} V${sy > 0 ? 0 : 28} H${sx > 0 ? 28 : 0}`} fill="none" stroke={color} strokeWidth={2} opacity={0.7} />
  </svg>
);

const tc = (f: number) => {
  const fr = Math.floor(f);
  const s = Math.floor(fr / 60);
  const p = (n: number) => String(n).padStart(2, '0');
  return `00:00:${p(s)}:${p(fr % 60)}`;
};

const Hud: React.FC<{f: number; color: string; accent: string; product: string; label: string; idx: number; right: string; duration: number}> = ({
  f,
  color,
  accent,
  product,
  label,
  idx,
  right,
  duration,
}) => {
  const txt: React.CSSProperties = {position: 'absolute', fontFamily: FONT, fontWeight: 600, fontSize: 15, letterSpacing: '0.2em', textTransform: 'uppercase', color, opacity: 0.82, whiteSpace: 'nowrap'};
  const blink = 0.35 + 0.65 * Math.max(0, Math.sin((f / 60) * Math.PI * 2));
  const prog = f / (duration - 1);
  return (
    <AbsoluteFill>
      <Bracket x={72} y={72} sx={1} sy={1} color={color} />
      <Bracket x={1848} y={72} sx={-1} sy={1} color={color} />
      <Bracket x={72} y={1008} sx={1} sy={-1} color={color} />
      <Bracket x={1848} y={1008} sx={-1} sy={-1} color={color} />
      <div style={{...txt, left: 116, top: 76}}>
        <span style={{fontWeight: 700, letterSpacing: '0.02em'}}>MK</span> Suite · {product}
      </div>
      <div style={{...txt, right: 116, top: 76}}>
        {String(idx + 1).padStart(2, '0')} — {label}
      </div>
      <div style={{...txt, left: 116, top: 970, display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{width: 10, height: 10, borderRadius: 5, background: C.nightRed, opacity: blink, boxShadow: `0 0 12px ${C.nightRed}`}} />
        Local preview
        <span style={{fontFamily: MONO, letterSpacing: '0.06em', fontWeight: 500, opacity: 0.85}}>{tc(f)}</span>
      </div>
      <div style={{...txt, right: 116, top: 970}}>{right}</div>
      <div style={{position: 'absolute', left: 116, top: 1000, width: 1688, height: 2, background: color, opacity: 0.16}} />
      <div style={{position: 'absolute', left: 116, top: 999, width: 1688 * prog, height: 4, borderRadius: 2, background: accent, boxShadow: `0 0 10px ${accent}, 0 0 22px ${accent}`}} />
    </AbsoluteFill>
  );
};

const Finish: React.FC<{f: number; dark: number}> = ({f, dark}) => {
  const r = rng(Math.floor(f) * 7919 + 13);
  const gx = Math.floor(r() * 256);
  const gy = Math.floor(r() * 256);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, ${interpolateColors(dark, [0, 1], ['rgba(70,58,46,0.16)', 'rgba(3,4,8,0.62)'])} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.5,
          backgroundImage: `repeating-linear-gradient(0deg, ${dark > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(16,19,25,0.03)'} 0px, ${dark > 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(16,19,25,0.03)'} 1px, transparent 1px, transparent 4px)`,
        }}
      />
      <AbsoluteFill style={{overflow: 'hidden', opacity: 0.07, mixBlendMode: 'overlay'}}>
        <div style={{position: 'absolute', left: -gx, top: -gy, width: 1920 + 512, height: 1080 + 512, backgroundImage: `url(${staticFile('mk/grain.png')})`, backgroundSize: '256px 256px'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- the reel shell ----------
export const ReelShell: React.FC<{
  scenes: SceneSpec[];
  T: number;
  duration: number;
  hue: Hue;
  product: string;
  right: string;
  audio: string;
  shakes: readonly Shake[];
}> = ({scenes, T, duration, hue, product, right, audio, shakes}) => {
  const f = useCurrentFrame();
  // continuous dark-ness for HUD / finish colouring across transitions
  let dark = scenes[0].theme === 'dark' ? 1 : 0;
  let idx = 0;
  for (let i = 1; i < scenes.length; i++) {
    const cut = scenes[i].t.from;
    const target = scenes[i].theme === 'dark' ? 1 : 0;
    dark = interpolate(f, [cut - T / 2, cut + T / 2], [dark, target], CL);
    if (f >= cut) idx = i;
  }
  const [sx, sy] = shakeAt(f, shakes);
  const hudColor = interpolateColors(dark, [0, 1], [C.ink, '#ffffff']);
  return (
    <AbsoluteFill style={{background: interpolateColors(dark, [0, 1], [C.paper, C.nightDeep])}}>
      <AbsoluteFill style={{translate: `${sx}px ${sy}px`}}>
        {scenes.map((s, i) => {
          const start = i === 0 ? 0 : s.t.from - T / 2;
          const end = i === scenes.length - 1 ? duration : s.t.to + T / 2;
          if (f < start || f >= end) return null;
          return <SceneLayer key={s.t.id} spec={s} prev={scenes[i - 1]} f={f} T={T} />;
        })}
        {scenes.map((s) => (
          <CutOverlay key={s.t.id + '-o'} spec={s} f={f} T={T} hue={hue} />
        ))}
      </AbsoluteFill>
      <Finish f={f} dark={dark} />
      <Hud f={f} color={hudColor} accent={hue.hue} product={product} label={scenes[idx].t.label} idx={idx} right={right} duration={duration} />
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
