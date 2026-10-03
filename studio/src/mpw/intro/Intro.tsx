// Intro (0–8 s), "phase lock": four camera soundtracks (CAM A, CAM B, CAM C, REC) drift out of phase like Reich
// loops, snap onto the 120 BPM grid one per beat, and at f300 their aligned peaks become the amber playhead.
// The playhead splits into In/Out brackets that write MONTAGE PRO, then closes into the line the first edit opens.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT, H, MONO, RADIUS, W} from '../brand';
import {PAD} from '../timing';
import {Wordmark} from '../shell/Wordmark';
import {CX, CY, clamp, ease, hash, lerp, mixHex, prog, rgba, smooth} from '../shell/util';
import {BEAT_S, CELLS, CLOSE, EXIT, HIT, LANES, LOCKS, PPS, T0, TAG, WRITE, driftAt, gridT, type HitKind} from './timing';

const LANE_Y = [345, 475, 605, 735];
const LANE_H = 104;
const X0 = 310; // waveform area (centred on the playhead column x = 960)
const X1 = 1610;
const STEP = 4;
const TOP = LANE_Y[0] - LANE_H / 2;
const BOT = LANE_Y[3] + LANE_H / 2;
export const WORD_Y = 500;
export const WORD_SIZE = 104;

// Waveform envelope of one hit, d seconds after its onset (what the loop actually sounds like).
const env = (kind: HitKind, d: number) => {
  if (d < 0) return 0;
  switch (kind) {
    case 'kick':
      return Math.exp(-d / 0.11);
    case 'hat':
      return 0.3 * Math.exp(-d / 0.025);
    case 'pluck':
      return 0.8 * Math.exp(-d / 0.14);
    case 'ghost':
      return 0.36 * Math.exp(-d / 0.09);
    case 'bass':
      return 0.72 * Math.min(1, d / 0.02) * (d < 0.3 ? 1 - d : 0.7 * Math.exp(-(d - 0.3) / 0.03));
    case 'shakeAcc':
      return 0.5 * Math.min(1, d / 0.006) * Math.exp(-d / 0.03);
    default:
      return 0.3 * Math.min(1, d / 0.006) * Math.exp(-d / 0.03);
  }
};
const noiseAt = (u: number, seed: number) => {
  const i = Math.floor(u);
  return lerp(hash(i + seed), hash(i + 1 + seed), u - i);
};

// Visual drift of lane k at time t: grows with the tempo error, then slides to 0 over the 6 frames before its lock.
const laneOffset = (k: number, g: number) => {
  const L = LOCKS[k];
  if (g >= L) return 0;
  return driftAt(k, g / 60) * (1 - ease.cubicIn(prog(g, L - 6, L)));
};

const lanePath = (k: number, g: number) => {
  const t = g / 60;
  const off = laneOffset(k, g);
  const hh = LANE_H / 2 - 8;
  const top: string[] = [];
  const bot: string[] = [];
  const nMin = Math.max(0, Math.floor((t - off - 1.6 - T0 / 60) / BEAT_S));
  const nMax = Math.ceil((t - off + 1 - T0 / 60) / BEAT_S);
  for (let x = X0; x <= X1; x += STEP) {
    const tau = t + (x - CX) / PPS - off; // grid time under this pixel
    let a = 0;
    if (tau >= T0 / 60) {
      for (let n = nMin; n <= nMax; n++) for (const [pos, kind] of CELLS[k]) a += env(kind, tau - gridT(n, pos));
    }
    const tex = 0.35 + 0.65 * noiseAt(tau * 230, 7919 * (k + 1));
    const floor = tau >= T0 / 60 ? 0.035 + 0.03 * noiseAt(tau * 90, 31 * (k + 3)) : 0.012;
    const y = hh * Math.min(1, Math.max(floor, a * tex));
    top.push(`${x} ${(LANE_Y[k] - y).toFixed(1)}`);
    bot.push(`${x} ${(LANE_Y[k] + y).toFixed(1)}`);
  }
  return `M${top.join('L')}L${bot.reverse().join('L')}Z`;
};

const Lanes: React.FC<{g: number}> = ({g}) => {
  const vis = (1 - smooth(HIT + 4, HIT + 34, g)) * (g >= T0 ? 1 : 0);
  if (vis <= 0) return null;
  const open = ease.expoOut(prog(g, T0, T0 + 14)); // the tracks switch on from the playhead column outward
  const t = g / 60;
  const beats: number[] = [];
  for (let n = Math.floor((t - 1 - T0 / 60) / BEAT_S); n <= Math.ceil((t + 1 - T0 / 60) / BEAT_S); n++) {
    const x = CX + (gridT(n, 0) - t) * PPS;
    if (x > X0 && x < X1) beats.push(x);
  }
  const collapse = ease.cubicIn(prog(g, HIT, HIT + 30)); // after the hit the lanes fold toward the playhead
  return (
    <AbsoluteFill style={{opacity: vis, clipPath: `inset(0 ${((1 - open) * 50).toFixed(2)}%)`}}>
      <AbsoluteFill style={{transform: `scaleY(${1 - 0.18 * collapse})`, filter: collapse > 0 ? `blur(${(6 * collapse).toFixed(2)}px)` : undefined}}>
        {/* waveform area + beat grid */}
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          {LANE_Y.map((y, k) => (
            <rect key={k} x={X0 - 10} y={y - LANE_H / 2} width={X1 - X0 + 20} height={LANE_H} rx={RADIUS.control} fill={rgba(C.panel, 0.72)} stroke={C.line} strokeWidth={1} />
          ))}
          {beats.map((x, i) => (
            <line key={i} x1={x} x2={x} y1={TOP - 8} y2={BOT + 8} stroke={C.line} strokeWidth={1.5} strokeDasharray="3 5" />
          ))}
          {/* playhead position (heads only: the line itself is made by the peaks) */}
          <path d={`M${CX - 9} ${TOP - 26}H${CX + 9}L${CX} ${TOP - 14}Z`} fill={C.amber} opacity={0.75} />
          <path d={`M${CX - 9} ${BOT + 26}H${CX + 9}L${CX} ${BOT + 14}Z`} fill={C.amber} opacity={0.75} />
        </svg>
        {LANES.map((name, k) => {
          const L = LOCKS[k];
          const locked = ease.cubicOut(prog(g, L - 2, L + 4));
          const flash = g >= L ? Math.exp(-(g - L) / 9) : 0;
          const col = mixHex('#c9cbc2', C.amber, locked);
          const d = lanePath(k, g);
          const y = LANE_Y[k];
          // phase meter: the dot sits off-centre by the lane's drift and snaps home on the lock
          const off = laneOffset(k, g);
          const mx = clamp(off * 260, -52, 52);
          return (
            <React.Fragment key={name}>
              <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
                <defs>
                  <clipPath id={`mpw-lane-${k}`}>
                    <rect x={X0 - 10} y={y - LANE_H / 2} width={X1 - X0 + 20} height={LANE_H} rx={RADIUS.control} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#mpw-lane-${k})`}>
                  {flash > 0.02 ? <rect x={X0 - 10} y={y - LANE_H / 2} width={X1 - X0 + 20} height={LANE_H} fill={C.amber} opacity={0.16 * flash} /> : null}
                  <line x1={X0} x2={X1} y1={y} y2={y} stroke={rgba(col, 0.35)} strokeWidth={1} />
                  {locked > 0 ? <path d={d} fill={C.amber} opacity={0.5 * locked} style={{filter: 'blur(7px)'}} /> : null}
                  <path d={d} fill={col} opacity={lerp(0.62, 0.95, locked)} />
                </g>
              </svg>
              {/* track header */}
              <div
                style={{
                  position: 'absolute',
                  left: 160,
                  top: y - LANE_H / 2,
                  width: 128,
                  height: LANE_H,
                  borderRadius: RADIUS.control,
                  background: C.panel,
                  border: `1px solid ${locked > 0.5 ? rgba(C.amber, 0.7) : C.line}`,
                  boxSizing: 'border-box',
                  padding: '0 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 17, letterSpacing: '0.12em', color: C.text}}>{name}</div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontWeight: 500, fontSize: 11, letterSpacing: '0.2em', color: locked > 0.5 ? C.amber : C.muted}}>
                  <span style={{width: 8, height: 8, borderRadius: 4, boxSizing: 'border-box', border: `1.5px solid ${locked > 0.5 ? C.amber : C.muted}`, background: locked > 0.5 ? C.amber : 'transparent'}} />
                  {k < 3 ? 'CAMERA' : 'RECORDER'}
                </div>
              </div>
              {/* phase meter + status */}
              <div style={{position: 'absolute', left: 1632, top: y - 30, width: 128, height: 60}}>
                <svg width={128} height={22} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                  <line x1={8} x2={120} y1={11} y2={11} stroke={C.line} strokeWidth={2} strokeLinecap="round" />
                  <line x1={64} x2={64} y1={3} y2={19} stroke={rgba(C.amber, 0.6)} strokeWidth={1.5} />
                  <circle cx={64 + mx} cy={11} r={5 + 2 * flash} fill={col} style={{filter: locked > 0 ? `drop-shadow(0 0 6px ${C.amber})` : undefined}} />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 30,
                    width: 128,
                    textAlign: 'center',
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: '0.24em',
                    color: locked > 0.5 ? C.amber : C.muted,
                    transform: `scale(${1 + 0.18 * flash})`,
                  }}
                >
                  {locked > 0.5 ? 'LOCKED' : 'DRIFT'}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// The playhead line: born from the aligned peaks at HIT, folds into the brackets at WRITE, returns for the exit.
const lineHalf = (g: number) => {
  if (g < HIT) return 0;
  const born = lerp((BOT - TOP) / 2, 400, ease.expoOut(prog(g, HIT, HIT + 14)));
  const fold = ease.cubicInOut(prog(g, WRITE - 6, WRITE + 4));
  const back = ease.cubicInOut(prog(g, CLOSE + 12, EXIT));
  return lerp(lerp(born, (1.32 * WORD_SIZE) / 2, fold), CY + 40, back);
};
const Playhead: React.FC<{g: number}> = ({g}) => {
  const hl = lineHalf(g);
  if (hl <= 0) return null;
  const cy = lerp(CY, WORD_Y, ease.cubicInOut(prog(g, WRITE - 6, WRITE + 4)) * (1 - ease.cubicInOut(prog(g, CLOSE + 12, EXIT))));
  // hidden while the brackets carry the line (WRITE … CLOSE)
  const split = g >= WRITE + 2 && g < CLOSE + 14;
  if (split) return null;
  const hot = Math.max(g >= HIT ? Math.exp(-(g - HIT) / 10) : 0, smooth(EXIT - 10, EXIT + 10, g));
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <rect x={CX - 14} y={cy - hl} width={28} height={2 * hl} fill={C.amber} opacity={0.35 + 0.4 * hot} style={{filter: 'blur(14px)'}} />
      <rect x={CX - 2} y={cy - hl} width={4} height={2 * hl} fill={C.amber} />
      <rect x={CX - 0.75} y={cy - hl} width={1.5} height={2 * hl} fill="#FFF6E2" opacity={0.3 + 0.7 * hot} />
    </svg>
  );
};

const PeakFlash: React.FC<{g: number}> = ({g}) => {
  if (g < HIT || g > HIT + 30) return null;
  const k = Math.exp(-(g - HIT) / 7);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {LANE_Y.map((y) => (
        <ellipse key={y} cx={CX} cy={y} rx={60 + 120 * (1 - k)} ry={44} fill={C.amber} opacity={0.4 * k} style={{filter: 'blur(18px)'}} />
      ))}
    </svg>
  );
};

const Title: React.FC<{g: number}> = ({g}) => {
  if (g < WRITE - 2 || g > EXIT) return null;
  const open = ease.expoOut(prog(g, WRITE, WRITE + 26)) * (1 - ease.cubicInOut(prog(g, CLOSE, CLOSE + 16)));
  const marks = 1 - 0.55 * smooth(WRITE + 30, WRITE + 60, g) + 0.55 * smooth(CLOSE - 8, CLOSE, g);
  const tagOut = 1 - smooth(CLOSE - 2, CLOSE + 10, g);
  const phrases = ['Every angle.', 'Every word.', 'In sync.'];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 34% 20% at 50% ${(WORD_Y / H) * 100}%, ${rgba(C.amber, 0.09)} 0%, rgba(0,0,0,0) 100%)`, opacity: open}} />
      <Wordmark x={CX} y={WORD_Y} size={WORD_SIZE} open={open} marks={marks} glow={g >= WRITE ? 0.4 * Math.exp(-(g - WRITE) / 20) : 0} />
      <div style={{position: 'absolute', left: 0, width: W, top: WORD_Y + 112, display: 'flex', justifyContent: 'center', gap: 26, opacity: tagOut}}>
        {phrases.map((p, i) => {
          const a = ease.expoOut(prog(g, TAG[i], TAG[i] + 16));
          return (
            <span
              key={p}
              style={{
                fontFamily: FONT,
                fontWeight: 500,
                fontSize: 40,
                letterSpacing: '-0.005em',
                color: i === 2 ? C.amber : C.text,
                opacity: a,
                transform: `translateY(${(1 - a) * 16}px)`,
                filter: a < 1 ? `blur(${((1 - a) * 6).toFixed(2)}px)` : undefined,
              }}
            >
              {p}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Intro: React.FC = () => {
  const g = useCurrentFrame() - PAD; // the intro's Sequence starts PAD frames before 0 (like the worlds)
  const sub = g >= T0 ? Math.exp(-(g - T0) / 10) : 0;
  const hit = g >= HIT ? Math.exp(-(g - HIT) / 8) : 0;
  return (
    <AbsoluteFill style={{background: '#000000'}}>
      <AbsoluteFill style={{background: C.canvas, opacity: smooth(T0, T0 + 40, g)}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${rgba(C.amber, 0.07)} 0%, rgba(0,0,0,0) 70%)`, opacity: smooth(T0, 200, g)}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 4% 40% at 50% 50%, ${rgba(C.amber, 0.5)} 0%, rgba(0,0,0,0) 100%)`, opacity: sub}} />
      <Lanes g={g} />
      <PeakFlash g={g} />
      <Playhead g={g} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 30% 60% at 50% 50%, ${rgba('#FFF2D6', 0.32)} 0%, ${rgba(C.amber, 0.1)} 45%, rgba(0,0,0,0) 80%)`, opacity: hit}} />
      <Title g={g} />
    </AbsoluteFill>
  );
};
