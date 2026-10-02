// Finale (77–90 s), "nine worlds, one voice": a one-beat montage of every world's hero frame through portal
// wipes, the nine accent rings converge and collapse into the green mark (logo lock), then the end card.
import React from 'react';
import {AbsoluteFill, Freeze, useCurrentFrame} from 'remotion';
import {loadFont} from '@remotion/google-fonts/InstrumentSerif';
import {ACCENT, C, FONT, H, MONO, W} from '../brand';
import {FINALE, PAD, WORLDS} from '../timing';
import {WORLD_IMPL} from '../worlds';
import {Mark} from '../shell/Mark';
import {CX, CY, clamp, ease, lerp, mixHex, prog, rgba, smooth} from '../shell/util';
import {CONVERGE, LINES, LOGO_LOCK, MBEAT, MONTAGE_BEATS, RISE} from './timing';

const SERIF = loadFont('italic', {weights: ['400'], subsets: ['latin']}).fontFamily;
const DIAG = Math.hypot(CX, CY);
const IRIS = 9;

// Portal wipe shape for montage beat k at progress e (0 → closed, 1 → full frame).
const irisClip = (k: number, e: number) => {
  if (k % 3 === 1) return `circle(${(DIAG + 20) * e}px at 50% 50%)`;
  if (k % 3 === 2) return `inset(${(CY + 10) * (1 - e)}px ${(CX + 10) * (1 - e)}px round ${48 * (1 - e) + 8}px)`;
  const R = 1520 * e;
  return `polygon(${CX}px ${CY - R}px, ${CX + R}px ${CY}px, ${CX}px ${CY + R}px, ${CX - R}px ${CY}px)`;
};
const IrisEdge: React.FC<{k: number; e: number; color: string}> = ({k, e, color}) => {
  const o = 1 - e ** 3;
  const common = {fill: 'none', stroke: color, strokeWidth: 7, opacity: o};
  let shape: React.ReactNode;
  if (k % 3 === 1) shape = <circle cx={CX} cy={CY} r={(DIAG + 20) * e} {...common} />;
  else if (k % 3 === 2) {
    const ix = (CX + 10) * (1 - e);
    const iy = (CY + 10) * (1 - e);
    shape = <rect x={ix} y={iy} width={W - 2 * ix} height={H - 2 * iy} rx={48 * (1 - e) + 8} {...common} />;
  } else {
    const R = 1520 * e;
    shape = <polygon points={`${CX},${CY - R} ${CX + R},${CY} ${CX},${CY + R} ${CX - R},${CY}`} {...common} />;
  }
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: `drop-shadow(0 0 12px ${color})`}}>
      {shape}
    </svg>
  );
};

// One world's hero frame (frozen), with a slow camera pull-back for life.
const Hero: React.FC<{k: number; g: number; clip?: string}> = ({k, g, clip}) => {
  const w = WORLDS[k];
  const {World, HERO_FRAME} = WORLD_IMPL[w.id];
  const t = g - MONTAGE_BEATS[k];
  return (
    <AbsoluteFill style={{clipPath: clip, background: C.bg}}>
      <AbsoluteFill style={{transform: `scale(${1.08 - 0.08 * ease.cubicOut(clamp(t / 40))})`}}>
        <Freeze frame={HERO_FRAME + PAD}>
          <World />
        </Freeze>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const NameFlash: React.FC<{k: number; t: number}> = ({k, t}) => {
  const w = WORLDS[k];
  const acc = ACCENT[w.id];
  const ap = ease.expoOut(prog(t, 1, 8));
  const va = ease.cubicIn(prog(t, 23, 30));
  return (
    <div style={{position: 'absolute', left: 150, top: 690, opacity: ap * (1 - va), transform: `translateX(${(1 - ap) * -40 + va * 30}px)`}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.32em', color: acc}}>{`0${w.index} / 09`}</div>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 128, letterSpacing: '-0.035em', lineHeight: 1.02, color: acc, textShadow: `0 0 34px ${rgba(acc, 0.55)}`, whiteSpace: 'nowrap'}}>{w.name}</div>
      <div style={{marginTop: 10, height: 4, width: 220 * ap, background: acc, boxShadow: `0 0 12px ${acc}`}} />
    </div>
  );
};

const Montage: React.FC<{g: number}> = ({g}) => {
  if (g >= CONVERGE + 26) return null;
  const k = Math.min(WORLDS.length - 1, Math.floor((g - MONTAGE_BEATS[0]) / MBEAT));
  const t = g - MONTAGE_BEATS[k];
  const e = k > 0 ? ease.cubicOut(prog(t, 0, IRIS)) : 1;
  const opening = k > 0 && t < IRIS;
  // After the last beat the Guide hero shrinks into the innermost converging ring.
  const shrink = g >= CONVERGE - 6 ? `circle(${lerp(DIAG + 20, Math.max(0, ringR(0, g) - 5), smooth(CONVERGE - 6, CONVERGE + 6, g)).toFixed(1)}px at 50% 50%)` : undefined;
  return (
    <AbsoluteFill>
      {opening ? <Hero k={k - 1} g={g} /> : null}
      <Hero k={k} g={g} clip={opening ? irisClip(k, e) : shrink} />
      {opening ? <IrisEdge k={k} e={e} color={ACCENT[WORLDS[k].id]} /> : null}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 34% 26% at 22% 76%, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 100%), linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 32%, rgba(0,0,0,0) 55%)',
          opacity: 1 - smooth(CONVERGE - 8, CONVERGE + 4, g),
        }}
      />
      {g < CONVERGE ? <NameFlash k={k} t={t} /> : null}
    </AbsoluteFill>
  );
};

// The nine accent rings: converge from wide to a tight bundle, then collapse into the mark at LOGO_LOCK.
const ringR = (j: number, g: number) => {
  const e = ease.cubicInOut(prog(g, CONVERGE - 12, LOGO_LOCK - 4));
  const c = ease.cubicIn(prog(g, LOGO_LOCK - 7, LOGO_LOCK));
  return lerp(640 + 70 * j, 112 + 9 * j, e) * (1 - 0.9 * c);
};
const ConvergeRings: React.FC<{g: number}> = ({g}) => {
  const vis = smooth(CONVERGE - 14, CONVERGE - 2, g);
  if (vis <= 0 || g >= LOGO_LOCK) return null;
  const c = ease.cubicIn(prog(g, LOGO_LOCK - 7, LOGO_LOCK));
  const t = g - CONVERGE;
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <svg width={W} height={H} style={{position: 'absolute', filter: 'blur(12px)', opacity: 0.6 + 0.4 * c}}>
        {WORLDS.map((w, j) => (
          <circle key={w.id} cx={CX} cy={CY} r={ringR(j, g)} fill="none" stroke={mixHex(ACCENT[w.id], C.green, c)} strokeWidth={14} />
        ))}
      </svg>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {WORLDS.map((w, j) => {
          const r = ringR(j, g);
          const circ = 2 * Math.PI * r;
          const n = 36 + 4 * j;
          const col = mixHex(ACCENT[w.id], C.green, c);
          return (
            <g key={w.id}>
              <circle cx={CX} cy={CY} r={r} fill="none" stroke={col} strokeWidth={2} opacity={0.5} />
              <circle cx={CX} cy={CY} r={r} fill="none" stroke={col} strokeWidth={7} strokeDasharray={`${circ / n / 2} ${circ / n / 2}`} transform={`rotate(${(j % 2 ? 1 : -1) * t * (1.2 + 0.15 * j)} ${CX} ${CY})`} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Lock: React.FC<{g: number}> = ({g}) => {
  if (g < LOGO_LOCK) return null;
  const t = g - LOGO_LOCK;
  const rise = ease.cubicInOut(prog(g, RISE[0], RISE[1]));
  const y = lerp(CY, 318, rise);
  const size = lerp(236, 176, rise);
  const pop = lerp(0.35, 1, ease.backOut(prog(t, 0, 14)));
  const shock = (d: number, max: number) => {
    const k = ease.expoOut(prog(t, d, d + 46));
    if (t < d || k >= 1) return null;
    const r = 110 + max * k;
    return <circle key={d} cx={CX} cy={y} r={r} fill="none" stroke={d ? '#FFFFFF' : C.green} strokeWidth={9 * (1 - k) + 1} opacity={1 - k} />;
  };
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(circle at ${CX}px ${y}px, ${rgba(C.green, 0.55)} 0%, ${rgba(C.green, 0.12)} 22%, rgba(0,0,0,0) 48%)`, opacity: 0.35 + 0.65 * Math.exp(-t / 28)}} />
      <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible', filter: `drop-shadow(0 0 16px ${C.green})`}}>
        {shock(0, 1300)}
        {shock(6, 900)}
      </svg>
      <div style={{position: 'absolute', left: CX - size / 2, top: y - size / 2, transform: `scale(${pop})`}}>
        <Mark size={size} glow={0.35 + 0.65 * Math.exp(-t / 20)} grow={(i) => ease.backOut(prog(t, Math.abs(i - 3) * 1.5, 12 + Math.abs(i - 3) * 1.5))} />
      </div>
    </AbsoluteFill>
  );
};

const line = (g: number, at: number) => ({p: ease.expoOut(prog(g, at, at + 22)), o: prog(g, at, at + 14)});

const EndCard: React.FC<{g: number}> = ({g}) => {
  if (g < LINES[0] - 2) return null;
  const [l0, l1, l2, l3, l4] = LINES.map((f) => line(g, f));
  const centered: React.CSSProperties = {position: 'absolute', left: 0, width: W, textAlign: 'center'};
  return (
    <AbsoluteFill>
      <div
        style={{
          ...centered,
          top: 424,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 150,
          letterSpacing: '-0.05em',
          lineHeight: 1.05,
          color: C.fg,
          clipPath: `inset(-20px ${(1 - l0.p) * 50}% -20px ${(1 - l0.p) * 50}%)`,
          transform: `translateY(${(1 - l0.p) * 26}px)`,
        }}
      >
        MK Voice
      </div>
      <div style={{...centered, top: 598, fontFamily: SERIF, fontStyle: 'italic', fontSize: 74, color: C.green, opacity: l1.o, transform: `translateY(${(1 - l1.p) * 22}px)`, textShadow: `0 0 30px ${rgba(C.green, 0.35)}`}}>
        Nine worlds. One voice.
      </div>
      <div style={{...centered, top: 704, fontFamily: FONT, fontWeight: 500, fontSize: 34, letterSpacing: '-0.01em', color: C.sub, opacity: l2.o, transform: `translateY(${(1 - l2.p) * 20}px)`}}>
        Your voice. Your studio. On your PC.
      </div>
      <div style={{...centered, top: 782, display: 'flex', justifyContent: 'center', opacity: l3.o, transform: `translateY(${(1 - l3.p) * 18}px)`}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: '0.28em', color: C.fg, padding: '12px 22px 12px 28px', borderRadius: 999, border: `1px solid ${C.divider}`, background: C.surface, display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}`}} />
          WINDOWS · LOCAL PREVIEW
        </div>
      </div>
      <div style={{...centered, top: 872, fontFamily: FONT, fontWeight: 400, fontSize: 20, letterSpacing: '0.02em', color: C.sub, opacity: 0.65 * l4.o}}>Made for your own recordings.</div>
    </AbsoluteFill>
  );
};

// Faint nine-ring halo behind the end card: the worlds, quietly orbiting the mark.
const Halo: React.FC<{g: number}> = ({g}) => {
  const vis = smooth(LOGO_LOCK + 10, LOGO_LOCK + 60, g);
  if (vis <= 0) return null;
  const y = lerp(CY, 318, ease.cubicInOut(prog(g, RISE[0], RISE[1])));
  return (
    <svg width={W} height={H} style={{position: 'absolute', opacity: 0.1 * vis}}>
      {WORLDS.map((w, j) => {
        const r = 190 + 64 * j;
        const c = 2 * Math.PI * r;
        const n = 60 + 6 * j;
        return <circle key={w.id} cx={CX} cy={y} r={r} fill="none" stroke={ACCENT[w.id]} strokeWidth={3} strokeDasharray={`${c / n / 2} ${c / n / 2}`} transform={`rotate(${(j % 2 ? 1 : -1) * (g - LOGO_LOCK) * 0.12} ${CX} ${y})`} />;
      })}
    </svg>
  );
};

export const Finale: React.FC = () => {
  const g = useCurrentFrame() - PAD + FINALE.start;
  const flash = g >= LOGO_LOCK ? Math.exp(-(g - LOGO_LOCK) / 7) : 0;
  return (
    <AbsoluteFill style={{background: C.black}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%, #151515 0%, #000000 70%)', opacity: smooth(CONVERGE, LOGO_LOCK, g)}} />
      <Montage g={g} />
      <ConvergeRings g={g} />
      <Halo g={g} />
      <Lock g={g} />
      <EndCard g={g} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #FFFFFF 0%, ${rgba(C.green, 0.85)} 45%, ${rgba(C.green, 0.25)} 100%)`, opacity: 0.9 * flash}} />
    </AbsoluteFill>
  );
};
