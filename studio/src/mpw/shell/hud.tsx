// Global HUD as NLE chrome (tinted with the current section's accent, crossfading at every boundary) and the finish.
// Top band: corner brackets, sequence name, act + "0N — WORLD". Bottom band: timecode, a V1/A1 timeline of the 13
// sections (A1 leads at the J-cut and lags at the L-cut), a ruler and the amber playhead. Everything stays in the
// top 120 px / bottom 120 px bands.
import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {C, H, MONO, SAFE, W} from '../brand';
import {ACTS, DURATION, FPS, WORLDS, mulberry32} from '../timing';
import {T0} from '../intro/timing';
import {LOGO_LOCK} from '../finale/timing';
import {BOUNDARIES, EDITS, J_LEAD, L_LAG, SECTIONS, type Section} from './timing';
import {sectionAccent} from './edits';
import {clamp, ease, lerp, mixHex, prog, rgba} from './util';

const sectionIndexAt = (g: number) => {
  for (let i = SECTIONS.length - 1; i >= 0; i--) if (g >= SECTIONS[i].start) return i;
  return 0;
};
const accentBase = (g: number) => sectionAccent(SECTIONS[sectionIndexAt(g)].id);

// Smooth 12-frame colour crossfade centred on every accent change.
export const accentAt = (g: number) => {
  for (let j = g - 5; j <= g + 6; j++) {
    const a = accentBase(j - 1);
    const b = accentBase(j);
    if (a !== b) return mixHex(a, b, ease.cubicInOut(clamp((g - (j - 6)) / 12)));
  }
  return accentBase(g);
};

const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0');
const label = (s: Section) => (s.id === 'intro' ? '00 — PHASE LOCK' : s.id === 'finale' ? 'FINALE — EVERY ANGLE' : `${pad2(s.index)} — ${s.name}`);
const actOf = (s: Section) => {
  const w = WORLDS.find((x) => x.id === s.id);
  return w ? ACTS[w.act] : s.id === 'intro' ? 'PROLOGUE' : 'CODA';
};
const text: React.CSSProperties = {position: 'absolute', fontFamily: MONO, fontWeight: 500, whiteSpace: 'nowrap', color: C.text};

// Timeline geometry: 13 segments sized by duration, separated by small gaps.
const RX0 = 136;
const RX1 = W - 136;
const GAP = 4;
const USABLE = RX1 - RX0 - GAP * (SECTIONS.length - 1);
const segX = SECTIONS.map((s, i) => RX0 + (USABLE * s.start) / DURATION + GAP * i);
const xAt = (g: number) => {
  const i = sectionIndexAt(g);
  return segX[i] + (USABLE * (clamp(g, 0, DURATION) - SECTIONS[i].start)) / DURATION;
};
// A1: same sections, but the sound boundary leads at the J-cut and lags at the L-cut.
const AUDIO_B = BOUNDARIES.map((b, k) => b + (EDITS[k].kind === 'jcut' ? -J_LEAD : EDITS[k].kind === 'lcut' ? L_LAG : 0));
const audioX = (b: number, k: number) => (b === BOUNDARIES[k] ? segX[k + 1] - GAP / 2 : xAt(b));

const Label: React.FC<{g: number; get: (s: Section) => string; size: number; color: string; top: number}> = ({g, get, size, color, top}) => {
  const idx = sectionIndexAt(g);
  const cur = SECTIONS[idx];
  const prev = idx > 0 ? SECTIONS[idx - 1] : null;
  const lt = g - cur.start;
  const lh = size + 5;
  const inn = ease.expoOut(prog(lt, 2, 18));
  const out = ease.cubicOut(prog(lt, 0, 8));
  const changed = prev && get(prev) !== get(cur);
  return (
    <div style={{...text, right: 104, top, width: 640, height: lh, overflow: 'hidden', textAlign: 'right', fontSize: size, lineHeight: `${lh}px`, letterSpacing: '0.2em', color}}>
      {changed && lt < 8 ? <div style={{position: 'absolute', right: 0, transform: `translateY(${-lh * out}px)`, opacity: 1 - out}}>{get(prev)}</div> : null}
      <div style={{position: 'absolute', right: 0, transform: changed ? `translateY(${lh * (1 - inn)}px)` : undefined, opacity: changed ? inn : 1}}>{get(cur)}</div>
    </div>
  );
};

export const Hud: React.FC = () => {
  const g = useCurrentFrame();
  const enter = ease.expoOut(prog(g, T0 + 4, T0 + 34));
  const vis = enter * (1 - ease.cubicInOut(prog(g, LOGO_LOCK + 6, LOGO_LOCK + 30)));
  if (vis <= 0) return null;
  const inset = lerp(26, 0, enter);
  const acc = accentAt(g);
  const tc = `00:${pad2(g / FPS / 60)}:${pad2((g / FPS) % 60)}:${pad2(g % FPS)}`;
  const beat = Math.exp(-(g % 30) / 9);
  const L = 38;
  const M = SAFE + inset;
  const px = xAt(g);
  const ticks: React.ReactNode[] = [];
  for (let s = 0; s <= DURATION / FPS; s++) {
    const x = xAt(Math.min(DURATION - 1, s * FPS));
    ticks.push(<line key={s} x1={x} x2={x} y1={1001} y2={s % 10 ? 1004 : 1008} stroke={C.muted} strokeWidth={1} opacity={s % 10 ? 0.4 : 0.8} />);
  }
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <svg width={W} height={H} style={{position: 'absolute', filter: `drop-shadow(0 0 5px ${rgba(acc, 0.6)})`}}>
        {[
          [M, M, 1, 1],
          [W - M, M, -1, 1],
          [M, H - M, 1, -1],
          [W - M, H - M, -1, -1],
        ].map(([bx, by, sx, sy], i) => (
          <path key={i} d={`M${bx} ${by + sy * L}V${by}H${bx + sx * L}`} fill="none" stroke={acc} strokeWidth={2.5} />
        ))}
      </svg>
      {/* top band */}
      <div style={{...text, left: 104, top: 78, fontSize: 11, letterSpacing: '0.28em', color: C.muted}}>SEQ 01 · MULTICAM EDIT</div>
      <div style={{...text, left: 104, top: 95, fontSize: 15, lineHeight: '20px', letterSpacing: '0.2em', opacity: 0.94}}>
        MONTAGE <span style={{color: C.amber}}>PRO</span> <span style={{color: acc}}>·</span> ELEVEN WORLDS
      </div>
      <Label g={g} get={actOf} size={11} color={C.muted} top={78} />
      <Label g={g} get={label} size={15} color={acc} top={95} />
      {/* bottom band */}
      <div style={{...text, left: RX0, top: 959, fontSize: 14, lineHeight: '16px', letterSpacing: '0.16em', display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{width: 9, height: 9, borderRadius: '50%', background: C.amber, boxShadow: `0 0 ${5 + 9 * beat}px ${C.amber}`, opacity: 0.5 + 0.5 * beat}} />
        <span style={{color: C.amber}}>{tc}</span>
        <span style={{fontSize: 11, letterSpacing: '0.28em', color: C.muted}}>V1 · A1</span>
      </div>
      <div style={{...text, right: 136, top: 961, fontSize: 11, lineHeight: '16px', letterSpacing: '0.28em', color: C.muted}}>SEQUENCE 00:02:44:00 · 1920 × 1080</div>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {SECTIONS.map((s, i) => {
          const x0 = segX[i];
          const w = (USABLE * (s.end - s.start)) / DURATION;
          const col = sectionAccent(s.id);
          const fill = clamp((g - s.start) / (s.end - s.start));
          const live = i === sectionIndexAt(g);
          return (
            <g key={s.id}>
              <rect x={x0} y={987} width={w} height={6} rx={2} fill={rgba(col, 0.2)} />
              {fill > 0 ? <rect x={x0} y={987} width={w * fill} height={6} rx={2} fill={live ? col : rgba(col, 0.62)} /> : null}
            </g>
          );
        })}
        {SECTIONS.map((s, i) => {
          const a = i === 0 ? RX0 : audioX(AUDIO_B[i - 1], i - 1) + GAP / 2;
          const b = i === SECTIONS.length - 1 ? RX1 : audioX(AUDIO_B[i], i) - GAP / 2;
          const col = sectionAccent(s.id);
          const played = clamp((px - a) / Math.max(1, b - a));
          return (
            <g key={s.id}>
              <rect x={a} y={996} width={b - a} height={2.5} fill={rgba(col, 0.2)} />
              {played > 0 ? <rect x={a} y={996} width={(b - a) * played} height={2.5} fill={rgba(col, 0.75)} /> : null}
            </g>
          );
        })}
        {ticks}
        <g style={{filter: `drop-shadow(0 0 5px ${C.amber})`}}>
          <path d={`M${px - 6} 977H${px + 6}V982L${px} 987L${px - 6} 982Z`} fill={C.amber} />
          <rect x={px - 1} y={983} width={2} height={28} fill={C.amber} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Soft grain (~4 %), charcoal vignette, very faint scanlines.
export const Finish: React.FC = () => {
  const g = useCurrentFrame();
  const r = mulberry32(Math.floor(g / 2) * 7919 + 17); // grain moves at 30 fps: filmic, and kind to the encoder
  const ox = Math.floor(r() * 256);
  const oy = Math.floor(r() * 256);
  return (
    <>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(4,5,5,0.3) 80%, rgba(4,5,5,0.62) 100%)'}} />
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.045) 0px, rgba(0,0,0,0.045) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: W + 256,
          height: H + 256,
          backgroundImage: `url(${staticFile('mpw/grain.png')})`,
          backgroundRepeat: 'repeat',
          opacity: 0.04,
          mixBlendMode: 'overlay',
          transform: `translate(${-ox}px, ${-oy}px)`,
        }}
      />
    </>
  );
};
