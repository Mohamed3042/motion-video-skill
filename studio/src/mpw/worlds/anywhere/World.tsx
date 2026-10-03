// World 11 · Anywhere, private (8 s, amber). "Your media stays yours."
// Mirror world: the shared desk's UI tiles flip like mirrors into Arabic (right-to-left, Noto Kufi Arabic, the product's
// own labels) and land on f0, while the timeline tile never flips: its playhead and timecode keep running left → right.
// Then the window reflows into the phone layout, local-first chips land on the beat, and every tile flies into the
// finale's 4×3 multicam grid.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {clamp01, IconArrow, IconCheck, IN_OUT, lerp, mixRect, pop, pulse, rgba, ToolLabel, WorldTitle, type Rect} from '../profile/kit';
import {ARABIC, cell, Desk, DESK} from './desk';
import {T} from './timing';

const A = ACCENT.anywhere; // amber

const ChipIcon: React.FC<{i: number; color: string}> = ({i, color}) => {
  const p = {fill: 'none', stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" style={{flexShrink: 0, display: 'block'}}>
      {i === 0 ? (
        <g {...p}>
          <path d="M7 18.5h10.5a4 4 0 00.6-7.95A5.5 5.5 0 007.4 9.2 4.7 4.7 0 007 18.5z" />
          <path d="M4 4l16 16" />
        </g>
      ) : null}
      {i === 1 ? (
        <g {...p}>
          <path d="M4.5 19V15M9 19v-7M13.5 19V9M18 19V5" />
          <path d="M3.5 4l17 16" />
        </g>
      ) : null}
      {i === 2 ? (
        <g {...p}>
          <rect x={3.5} y={4.5} width={17} height={11.5} rx={1.5} />
          <path d="M9 20h6M12 16v4" />
        </g>
      ) : null}
      {i === 3 ? (
        <g {...p}>
          <path d="M6 3.5h7.5l4 4V11M13.5 3.5v4h4M6 3.5v17h5" />
          <rect x={13} y={15} width={7.5} height={5.5} rx={1} />
          <path d="M14.5 15v-1.5a2.25 2.25 0 014.5 0V15" />
        </g>
      ) : null}
    </svg>
  );
};

const CHIPS = ['No cloud', 'No telemetry', 'On your PC', 'Originals never modified'];
const CHIP_W = [252, 316, 290, 486];
const CHIP_CELLS = [0, 1, 4, 8];
const chipRect = (i: number): Rect => ({x: 260, y: 330 + i * 94, w: CHIP_W[i], h: 70});

const Chip: React.FC<{f: number; i: number; ex: number}> = ({f, i, ex}) => {
  const at = T.chips[i];
  const s = pop(f, at, 12, 190, 0.7);
  if (s <= 0.001 && ex <= 0) return null;
  const r = mixRect(chipRect(i), cell(CHIP_CELLS[i]), ex);
  const glow = pulse(f, at, 10) + 0.8 * pulse(f, T.stays + i * 3, 12);
  const content = 1 - clamp01(ex * 1.8);
  return (
    <div
      style={{
        position: 'absolute',
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        borderRadius: 9 - 3 * ex,
        background: ex > 0 ? `rgba(21,24,22,${0.9 + 0.1 * ex})` : C.panel,
        border: `1px solid ${rgba(A, 0.38 + 0.4 * glow)}`,
        boxShadow: glow > 0.02 ? `0 0 0 ${3 * glow}px ${rgba(A, 0.25 * glow)}` : undefined,
        opacity: Math.min(1, s * 1.5),
        scale: String(ex > 0 ? 1 : 0.85 + 0.15 * s),
        translate: `${ex > 0 ? 0 : (1 - s) * -24}px 0px`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 22px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: content, whiteSpace: 'nowrap'}}>
        <ChipIcon i={i} color={A} />
        <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 30, color: C.text, letterSpacing: '-0.01em'}}>{CHIPS[i]}</span>
      </div>
    </div>
  );
};

// callout with a connector into the desk
const Callout: React.FC<{f: number; at: number; out: number; y: number; dir: 1 | -1; label: string; line: string; targetY: number}> = ({f, at, out, y, dir, label, line, targetY}) => {
  const a = lerp(f, at, at + 14) * (1 - lerp(f, out, out + 12));
  if (a <= 0) return null;
  const draw = lerp(f, at + 4, at + 22);
  const flow = ((f - at) * 2.2) % 40;
  return (
    <>
      <div style={{position: 'absolute', left: 112, top: y, width: 500, opacity: a, translate: `${(1 - lerp(f, at, at + 20)) * -20}px 0px`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: '0.2em', color: A}}>
          {dir < 0 ? <IconArrow size={30} color={A} dir={-1} /> : null}
          {label}
          {dir > 0 ? <IconArrow size={30} color={A} dir={1} /> : null}
        </div>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 38, lineHeight: 1.12, letterSpacing: '-0.02em', color: C.text, marginTop: 10}}>{line}</div>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: a}}>
        <path d={`M 560 ${y + 22} H 600 L 640 ${targetY} H 700`} fill="none" stroke={rgba(A, 0.7)} strokeWidth={1.6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        <circle cx={700} cy={targetY} r={4.5 * draw} fill={A} />
        {/* direction ticks travelling the way the region reads */}
        {draw >= 1
          ? [0, 1, 2].map((k) => {
              const x = dir > 0 ? 830 + ((flow + k * 40) % 120) : 820 - ((flow + k * 40) % 120);
              return <path key={k} d={dir > 0 ? `M${x} ${targetY - 5} l6 5 -6 5` : `M${x} ${targetY - 5} l-6 5 6 5`} fill="none" stroke={A} strokeWidth={1.8} opacity={0.75} />;
            })
          : null}
      </svg>
    </>
  );
};

const LangToggle: React.FC<{f: number}> = ({f}) => {
  const s = pop(f, T.toggle, 13, 180, 0.7);
  const a = Math.min(1, s * 1.4) * (1 - lerp(f, T.reflow[0] - 14, T.reflow[0]));
  if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 112, top: 470, opacity: a, scale: String(0.9 + 0.1 * s), transformOrigin: 'left center'}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.22em', color: C.muted, marginBottom: 12}}>MIRROR WORLD</div>
      <div style={{display: 'flex', width: 330, height: 52, borderRadius: 9, border: `1px solid ${C.line}`, background: C.panel, padding: 4, boxSizing: 'border-box', gap: 4}}>
        <span style={{flex: 1, display: 'grid', placeItems: 'center', fontFamily: FONT, fontSize: 18, color: C.muted}}>English</span>
        <span style={{flex: 1, display: 'grid', placeItems: 'center', borderRadius: 6, background: A, fontFamily: ARABIC, fontWeight: 600, fontSize: 19, color: C.onAmber, boxShadow: `0 0 0 ${4 * pulse(f, T.toggle, 8)}px ${rgba(A, 0.3)}`}}>
          العربية
        </span>
      </div>
    </div>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  const ex = lerp(f, T.exit[0], T.exit[1], 0, 1, IN_OUT);
  const stays = pop(f, T.stays, 14, 170, 0.8);
  const staysA = Math.min(1, stays * 1.4) * (1 - lerp(f, T.exit[0] - 4, T.exit[0] + 8));
  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      <Desk D={f} exit={ex} />
      <WorldTitle f={f} index={11} lines={['ANYWHERE,', 'PRIVATE']} promise="Your media stays yours." accent={A} x={112} y={150} out={T.titleOut} size={86} />
      <LangToggle f={f} />
      <Callout f={f} at={T.calloutUI} out={T.reflow[0] - 12} y={196} dir={-1} label="RIGHT-TO-LEFT" line="The interface mirrors." targetY={DESK.y + 81} />
      <Callout f={f} at={T.calloutTL} out={T.reflow[0] - 6} y={744} dir={1} label="LEFT-TO-RIGHT" line="The timeline and timecode keep running." targetY={DESK.y + 576} />
      <ToolLabel f={f} at={T.phone - 6} out={T.exit[0]} text="PHONE LAYOUT" accent={A} x={1592} y={420} />
      {f >= T.phone - 6 && f < T.exit[0] + 6 ? (
        <div style={{position: 'absolute', left: 1592, top: 460, fontFamily: FONT, fontSize: 21, lineHeight: 1.45, color: C.muted, opacity: lerp(f, T.phone, T.phone + 16) * (1 - lerp(f, T.exit[0] - 6, T.exit[0] + 6))}}>
          Same project.
          <br />
          Same timeline.
        </div>
      ) : null}
      <ToolLabel f={f} at={T.chips[0] - 8} out={T.exit[0] - 6} text="LOCAL-FIRST" accent={A} x={260} y={282} />
      {CHIPS.map((_, i) => (
        <Chip key={i} f={f} i={i} ex={ex} />
      ))}
      {staysA > 0 ? (
        <div style={{position: 'absolute', left: 260, top: 726, display: 'flex', alignItems: 'center', gap: 16, opacity: staysA, translate: `0px ${(1 - stays) * 22}px`}}>
          <IconCheck size={40} color={C.onAmber} bg={A} draw={lerp(f, T.stays, T.stays + 10)} />
          <span style={{fontFamily: FONT, fontWeight: 700, fontSize: 46, letterSpacing: '-0.025em', color: C.text}}>
            Your media stays <span style={{color: A}}>yours.</span>
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
