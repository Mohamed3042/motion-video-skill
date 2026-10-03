// World 10 · Profile & Intelligence (12 s, focus gold). "It learns your taste, on your terms."
// Troxler fading: a small sharp fixation dot sits among large, very soft, low-contrast, perfectly still blobs of UI
// clutter (pre-blurred radial gradients). Hold your eyes on the dot and the blobs fade from perception while the crisp
// essential panel stays. Then the panel fills: Creative Profile → Intelligence → Queue, and the app's tiles flip like
// mirrors into the Arabic world (shared desk with world 11).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {Desk, ENTER} from '../anywhere/desk';
import {Cursor, EXPO, EXPO_IN, IN_OUT, lerp, pulse, rgba, ToolLabel, WorldTitle} from './kit';
import {CP_TARGETS, CreativeProfile, IN_TARGETS, Intelligence, P} from './panels';
import {T} from './timing';

const A = ACCENT.profile; // #f8ce81
const CX = 960;
const CY = 540;
// the crisp essential panel outline during the Troxler hold
const FR = {x: 600, y: 384, w: 720, h: 312};

// Clutter: large, very soft, low-contrast, static blobs far from the fixation point (eccentricity ≥ 480 px).
const BLOBS = [
  {x: 235, y: 500, rx: 230, ry: 310, c: '#ed9690', a: 0.3, tag: 'UI CLUTTER'},
  {x: 470, y: 860, rx: 320, ry: 120, c: '#8fc1d4', a: 0.26},
  {x: 1690, y: 330, rx: 210, ry: 230, c: '#c79bf2', a: 0.28, tag: 'UI CLUTTER'},
  {x: 1560, y: 600, rx: 120, ry: 120, c: '#7fd1c7', a: 0.24},
  {x: 1700, y: 800, rx: 230, ry: 220, c: '#a5c9ad', a: 0.26},
  {x: 1180, y: 900, rx: 310, ry: 110, c: '#edb654', a: 0.24, tag: 'UI CLUTTER'},
];

// keyframed cursor: [frame, x, y]
const cursorAt = (f: number, keys: [number, number, number][]) => {
  if (f <= keys[0][0]) return {x: keys[0][1], y: keys[0][2]};
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, x0, y0] = keys[i];
    const [f1, x1, y1] = keys[i + 1];
    if (f <= f1) {
      const t = IN_OUT(Math.min(1, (f - f0) / Math.max(1, f1 - f0)));
      return {x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t};
    }
  }
  const k = keys[keys.length - 1];
  return {x: k[1], y: k[2]};
};
const CP_PATH: [number, number, number][] = [
  [262, 1180, 830],
  [279, CP_TARGETS.approve.x, CP_TARGETS.approve.y],
  [292, CP_TARGETS.approve.x, CP_TARGETS.approve.y],
  [309, CP_TARGETS.reject.x, CP_TARGETS.reject.y],
  [326, CP_TARGETS.reject.x, CP_TARGETS.reject.y],
  [368, CP_TARGETS.apply.x, CP_TARGETS.apply.y],
  [382, CP_TARGETS.apply.x, CP_TARGETS.apply.y],
  [410, CP_TARGETS.apply.x + 60, CP_TARGETS.apply.y + 90],
];
const IN_PATH: [number, number, number][] = [
  [490, 1420, 840],
  [504, IN_TARGETS.toggle.x, IN_TARGETS.toggle.y],
  [516, IN_TARGETS.toggle.x, IN_TARGETS.toggle.y],
  [534, IN_TARGETS.row1.x, IN_TARGETS.row1.y],
  [542, IN_TARGETS.row1.x, IN_TARGETS.row1.y],
  [550, IN_TARGETS.row2.x, IN_TARGETS.row2.y],
  [557, IN_TARGETS.row2.x, IN_TARGETS.row2.y],
  [566, IN_TARGETS.apply.x, IN_TARGETS.apply.y],
  [578, IN_TARGETS.apply.x, IN_TARGETS.apply.y],
  [598, IN_TARGETS.apply.x + 80, IN_TARGETS.apply.y + 70],
];
const pressAt = (f: number, frames: number[]) => Math.max(0, ...frames.map((p) => (f >= p - 3 && f < p + 4 ? 1 - Math.abs(f - p) / 4 : 0)));

// Entrance: Edit Room's cut timeline collapses into the fixation dot (lands on f0, the boundary impact).
const CutCollapse: React.FC<{f: number}> = ({f}) => {
  if (f >= 2) return null;
  const k = lerp(f, -14, 0, 0, 1, EXPO_IN);
  const w = 1500 * (1 - k);
  const h = 46 * (1 - k) + 12 * k;
  const cuts = [0, 0.09, 0.21, 0.27, 0.4, 0.52, 0.58, 0.71, 0.8, 0.92, 1];
  return (
    <div style={{position: 'absolute', left: CX - w / 2, top: CY - h / 2, width: w, height: h, opacity: 1 - lerp(f, -2, 1)}}>
      {cuts.slice(0, -1).map((a, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${a * 100}%`,
            width: `calc(${(cuts[i + 1] - a) * 100}% - 4px)`,
            top: 0,
            bottom: 0,
            borderRadius: 4,
            background: i % 2 ? rgba(ACCENT.editroom, 0.55) : rgba(ACCENT.editroom, 0.8),
            boxShadow: `inset 0 2px 0 ${rgba('#ffffff', 0.15)}`,
          }}
        />
      ))}
    </div>
  );
};

const Troxler: React.FC<{f: number}> = ({f}) => {
  // blobs: fade in, then perfectly still (no motion, no flicker) until the panel resolves
  const inA = lerp(f, T.blobs[0], T.blobs[1], 0, 1, IN_OUT);
  const clear = lerp(f, T.resolve, T.resolve + 40, 0, 1, IN_OUT);
  const a = inA * (1 - clear);
  const tags = lerp(f, 56, 72) * (1 - lerp(f, 136, 156));
  return (
    <>
      {a > 0.001
        ? BLOBS.map((b, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: b.x - b.rx,
                top: b.y - b.ry,
                width: 2 * b.rx,
                height: 2 * b.ry,
                opacity: a,
                background: `radial-gradient(closest-side, ${rgba(b.c, b.a)} 0%, ${rgba(b.c, b.a * 0.82)} 28%, ${rgba(b.c, b.a * 0.45)} 58%, ${rgba(b.c, b.a * 0.12)} 82%, ${rgba(b.c, 0)} 100%)`,
              }}
            />
          ))
        : null}
      {tags > 0.01
        ? BLOBS.filter((b) => b.tag).map((b, i) => (
            <div key={i} style={{position: 'absolute', left: b.x - 52, top: b.y - 9, fontFamily: MONO, fontWeight: 500, fontSize: 13, letterSpacing: '0.2em', color: C.muted, opacity: 0.55 * tags}}>
              {b.tag}
            </div>
          ))
        : null}
    </>
  );
};

const FixationDot: React.FC<{f: number}> = ({f}) => {
  if (f < 0 || f > T.resolve + 14) return null;
  const s = (1 - lerp(f, T.resolve, T.resolve + 12, 0, 1, EXPO_IN)) * (1 + 0.35 * pulse(f, 0, 6));
  const ring = pulse(f, 0, 14);
  return (
    <>
      {ring > 0.01 ? (
        <div style={{position: 'absolute', left: CX - 90, top: CY - 90, width: 180, height: 180, borderRadius: 90, border: `2px solid ${rgba(A, 0.7 * ring)}`, scale: String(1.15 - 0.85 * ring)}} />
      ) : null}
      <div style={{position: 'absolute', left: CX - 8, top: CY - 8, width: 16, height: 16, borderRadius: 8, background: '#0a0b0a', scale: String(s)}} />
      <div style={{position: 'absolute', left: CX - 5.5, top: CY - 5.5, width: 11, height: 11, borderRadius: 6, background: A, scale: String(s)}} />
    </>
  );
};

const FocusWords: React.FC<{f: number}> = ({f}) => {
  const out = 1 - lerp(f, T.resolve - 10, T.resolve);
  const a1 = lerp(f, T.focusText, T.focusText + 16) * out;
  const a2 = lerp(f, T.holdText, T.holdText + 18) * out;
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: CY + 34, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 30, color: A, opacity: a1, letterSpacing: '-0.01em'}}>
        Focus here.
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: CY + 80, textAlign: 'center', fontFamily: FONT, fontWeight: 500, fontSize: 21, color: C.muted, opacity: a2}}>
        Keep your eyes on the dot. The clutter fades.
      </div>
    </>
  );
};

// the essential panel: crisp outline (Troxler) → the filled panel P
const Essential: React.FC<{f: number}> = ({f}) => {
  if (f < T.frame[0] || f >= T.toQueue + 24) return null;
  const draw = lerp(f, T.frame[0], T.frame[1]);
  const grow = lerp(f, T.resolve, T.resolve + 22, 0, 1, EXPO);
  const leave = lerp(f, T.toQueue, T.toQueue + 20, 0, 1, EXPO_IN);
  const x = FR.x + (P.x - FR.x) * grow;
  const y = FR.y + (P.y - FR.y) * grow;
  const w = FR.w + (P.w - FR.w) * grow;
  const h = FR.h + (P.h - FR.h) * grow;
  const arm = 26;
  const flash = pulse(f, T.resolve, 12);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: 1 - leave, scale: String(1 - 0.05 * leave), translate: `${-leave * 160}px 0px`}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9,
          background: grow > 0 ? rgba('#1b1f1d', grow) : 'transparent',
          border: `1px solid ${grow > 0.5 ? C.line : rgba(A, 0.32 * draw)}`,
          boxShadow: grow > 0 ? `0 40px 110px rgba(0,0,0,${0.55 * grow}), 0 0 0 ${4 * flash}px ${rgba(A, 0.4 * flash)}` : undefined,
          overflow: 'hidden',
        }}
      >
        {f >= T.resolve && f < T.toIntel + 10 ? (
          <div style={{position: 'absolute', inset: 0, opacity: 1 - lerp(f, T.toIntel - 8, T.toIntel + 6), translate: `${-lerp(f, T.toIntel - 8, T.toIntel + 6, 0, 60, EXPO_IN)}px 0px`}}>
            <CreativeProfile f={f} />
          </div>
        ) : null}
        {f >= T.toIntel - 2 ? (
          <div style={{position: 'absolute', inset: 0, opacity: lerp(f, T.toIntel, T.toIntel + 14), translate: `${lerp(f, T.toIntel - 2, T.toIntel + 18, 70, 0)}px 0px`}}>
            <Intelligence f={f} />
          </div>
        ) : null}
      </div>
      {/* crisp corner brackets */}
      {[0, 1, 2, 3].map((k) => {
        const sx = k % 2 ? -1 : 1;
        const sy = k > 1 ? -1 : 1;
        return (
          <svg key={k} width={arm + 4} height={arm + 4} style={{position: 'absolute', left: k % 2 ? w - arm - 2 : -2, top: k > 1 ? h - arm - 2 : -2, opacity: 1 - grow * 0.6, overflow: 'visible'}}>
            <path
              d={`M${sx > 0 ? 2 : arm + 2} ${sy > 0 ? 2 + arm : 2} V${sy > 0 ? 2 : arm + 2} H${sx > 0 ? 2 + arm : 2}`}
              fill="none"
              stroke={A}
              strokeWidth={2.5}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - draw}
            />
          </svg>
        );
      })}
      {grow < 1 ? (
        <div style={{position: 'absolute', left: 18, top: 14, fontFamily: MONO, fontWeight: 700, fontSize: 13, letterSpacing: '0.2em', color: A, opacity: lerp(f, T.frame[1] - 10, T.frame[1] + 6) * (1 - grow * 3)}}>
          ESSENTIAL
        </div>
      ) : null}
    </div>
  );
};

// Queue beat: left column copy next to the desk
const QueueCopy: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.toQueue + 10, T.toQueue + 28) * (1 - lerp(f, T.flip - 6, T.flip + 8));
  if (a <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 112, top: 360, width: 480, opacity: a, translate: `${(1 - lerp(f, T.toQueue + 10, T.toQueue + 34)) * -30}px 0px`}}>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.03em', color: C.text}}>
        Every job,
        <br />
        <span style={{color: A}}>with progress.</span>
      </div>
      <div style={{fontFamily: FONT, fontSize: 22, color: C.muted, marginTop: 18, lineHeight: 1.45}}>
        Track your jobs and review
        <br />
        their output files, on your PC.
      </div>
    </div>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  const cpCur = f >= 262 && f < 416 ? cursorAt(f, CP_PATH) : null;
  const inCur = f >= 490 && f < 600 ? cursorAt(f, IN_PATH) : null;
  const cpA = lerp(f, 262, 272) * (1 - lerp(f, 398, 412));
  const inA = lerp(f, 490, 500) * (1 - lerp(f, 584, 598));
  const glow = lerp(f, T.resolve, T.resolve + 30) * (1 - lerp(f, T.toQueue, T.toQueue + 30));
  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      {glow > 0.01 ? (
        <div style={{position: 'absolute', left: CX - 900, top: CY - 520, width: 1800, height: 1040, opacity: glow, background: `radial-gradient(closest-side, ${rgba(A, 0.07)}, ${rgba(A, 0)})`}} />
      ) : null}
      <CutCollapse f={f} />
      <Troxler f={f} />
      <Essential f={f} />
      <FixationDot f={f} />
      <FocusWords f={f} />
      <WorldTitle f={f} index={10} lines={['PROFILE & INTELLIGENCE']} promise="It learns your taste, on your terms." accent={A} x={112} y={136} out={T.titleOut} size={86} />
      <ToolLabel f={f} at={T.resolve + 4} out={T.toIntel - 8} text="CREATIVE PROFILE" sub="notes · references · preferences" accent={A} x={P.x} y={P.y - 42} />
      <ToolLabel f={f} at={T.toIntel + 2} out={T.toQueue - 6} text="INTELLIGENCE" sub="rules-based helper · optional endpoint" accent={A} x={P.x} y={P.y - 42} />
      <ToolLabel f={f} at={T.toQueue + 6} out={T.flip - 6} text="QUEUE" accent={A} x={112} y={310} />
      <QueueCopy f={f} />
      {f >= T.toQueue - 2 ? <Desk D={Math.max(f - 720, ENTER - 1)} /> : null}
      {cpCur ? <Cursor x={cpCur.x} y={cpCur.y} press={pressAt(f, [T.approve, T.reject, T.apply])} opacity={cpA} /> : null}
      {inCur ? <Cursor x={inCur.x} y={inCur.y} press={pressAt(f, [T.endpoint, ...T.planChecks, T.applyPlan])} opacity={inA} /> : null}
    </AbsoluteFill>
  );
};
