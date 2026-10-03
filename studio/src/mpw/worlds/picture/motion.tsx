// MOTION TRACKING + SHOT STABILIZATION.
// Barber pole / aperture problem: "/" stripes translate up-left (perpendicular to themselves). Through a tall
// slot only the line ends at the slot edges are visible, and they slide straight UP. "Track clip" opens the
// aperture: markers on the surface (always there, outside the slot) are locked by trackers whose vectors show
// the true diagonal. Then a planar track pins a lower third to a moving surface.
// Induced motion (Duncker): a dot that never moves sits inside a swaying camera frame and seems to wander;
// the stabilized second pass locks the frame and the "motion" disappears.
import React from 'react';
import {C, FONT, MONO} from '../../brand';
import {ArrowSvg, Btn, Chip, Eyebrow, Glow, Message, Panel, Select, Slider, ToolLabel, VIO, clamp, ease, mix, prog, rgba} from './kit';
import {T} from './timing';

// ---------------------------------------------------------------- barber pole ----
const SX = 760; // slot centre x
const SY0 = 200;
const SY1 = 820;
const SLOT = 150;
const OPEN = 1000;
const BANDW = 34;
const STRIPES = ['#e8413c', '#f1ede6', '#3a5fd9', '#f1ede6'];
const PERIOD = BANDW * STRIPES.length;
const SPEED = 2.6; // px / frame, perpendicular to the stripes
const STEP = SPEED / Math.SQRT2; // screen px / frame on each axis (up-left)
const sOf = (f: number) => SPEED * (f - 380);
// tracking markers printed on the surface (screen position at f = 488); they move with the surface
const MARK0 = 488;
const MARKS: [number, number][] = [
  [470, 380],
  [1060, 420],
  [420, 690],
  [1150, 660],
];
const markAt = (k: number, f: number): [number, number] => [MARKS[k][0] - STEP * (f - MARK0), MARKS[k][1] - STEP * (f - MARK0)];

const Stripes: React.FC<{f: number}> = ({f}) => {
  const s = sOf(f) % PERIOD;
  return (
    <div style={{position: 'absolute', left: SX - 1500, top: (SY0 + SY1) / 2 - 1500, width: 3000, height: 3000, transform: 'rotate(-45deg)'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: -PERIOD,
          width: 3000,
          height: 3000 + 2 * PERIOD,
          transform: `translateY(${-s}px)`,
          background: `repeating-linear-gradient(180deg, ${STRIPES.map((c, i) => `${c} ${i * BANDW}px, ${c} ${(i + 1) * BANDW}px`).join(', ')})`,
        }}
      />
    </div>
  );
};

const TrackBox: React.FC<{f: number; k: number}> = ({f, k}) => {
  const L = T.locks[k];
  const [x, y] = markAt(k, f);
  const seek = prog(f, T.track + 10 + k * 3, L);
  if (seek <= 0) return null;
  const locked = f >= L;
  const flash = locked ? Math.exp(-(f - L) / 7) : 0;
  const size = locked ? 64 + 26 * flash : mix(130, 70, ease.cubicOut(seek));
  const off = locked ? 0 : 40 * (1 - ease.cubicOut(seek));
  const bx = x + off * (k % 2 ? -1 : 1);
  const by = y + off * 0.6;
  const col = locked ? C.amber : C.text;
  // trail of past positions + the true motion vector
  const vec = ease.cubicOut(prog(f, T.locks[3], T.locks[3] + 18));
  const trailFrom = Math.max(L, f - 40);
  const [tx, ty] = markAt(k, trailFrom);
  return (
    <>
      {locked && f > L ? <line x1={tx} y1={ty} x2={x} y2={y} stroke={rgba(C.amber, 0.7)} strokeWidth={3} strokeDasharray="2 6" strokeLinecap="round" /> : null}
      {vec > 0 ? (
        <g opacity={vec}>
          <line x1={x} y1={y} x2={x - 92 * vec} y2={y - 92 * vec} stroke={C.amber} strokeWidth={5} strokeLinecap="round" />
          <path d={`M${x - 92 * vec + 4} ${y - 92 * vec + 22} L${x - 92 * vec} ${y - 92 * vec} L${x - 92 * vec + 22} ${y - 92 * vec + 4}`} fill="none" stroke={C.amber} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
      <g opacity={clamp(seek * 3)}>
        <rect x={bx - size / 2} y={by - size / 2} width={size} height={size} rx={6} fill="none" stroke={col} strokeWidth={locked ? 3.5 : 2} strokeDasharray={locked ? undefined : '8 6'} />
        {locked
          ? [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => (
              <path key={i} d={`M${bx + (sx * size) / 2} ${by + (sy * size) / 2 - sy * 16} L${bx + (sx * size) / 2} ${by + (sy * size) / 2} L${bx + (sx * size) / 2 - sx * 16} ${by + (sy * size) / 2}`} fill="none" stroke={C.amber} strokeWidth={6} strokeLinecap="round" />
            ))
          : null}
        <text x={bx + size / 2 + 8} y={by - size / 2 + 14} fontFamily={MONO} fontWeight={700} fontSize={16} letterSpacing="0.12em" fill={col} stroke="#101211" strokeWidth={5} paintOrder="stroke" strokeLinejoin="round">
          {`TRK ${k + 1}`}
        </text>
      </g>
    </>
  );
};

const BarberPole: React.FC<{f: number}> = ({f}) => {
  const open = ease.inOut(prog(f, T.track, T.track + 16));
  const w = mix(SLOT, OPEN, open);
  const x0 = SX - w / 2;
  const pole = 1 - open;
  const out = ease.inOut(prog(f, T.planar - 12, T.planar + 4));
  const seeIn = prog(f, 418, 430);
  const trueIn = ease.expoOut(prog(f, T.locks[3] + 4, T.locks[3] + 22));
  if (out >= 1) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - out, transform: `scale(${1 - 0.04 * out})`, transformOrigin: `${SX}px 510px`}}>
      {/* the aperture: everything inside it is the striped surface */}
      <div style={{position: 'absolute', left: x0, top: SY0, width: w, height: SY1 - SY0, overflow: 'hidden', borderRadius: mix(14, 9, open), boxShadow: '0 40px 100px rgba(0,0,0,0.6)'}}>
        <div style={{position: 'absolute', left: -x0, top: -SY0, width: 1920, height: 1080}}>
          <Stripes f={f} />
          {open > 0 ? (
            <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
              {MARKS.map((_, k) => {
                const [x, y] = markAt(k, f);
                return (
                  <g key={k}>
                    <circle cx={x} cy={y} r={15} fill="#111" />
                    <circle cx={x} cy={y} r={9} fill="#fff" />
                    <path d={`M${x} ${y - 9} V${y + 9} M${x - 9} ${y} H${x + 9}`} stroke="#111" strokeWidth={2.5} />
                  </g>
                );
              })}
              {MARKS.map((_, k) => (
                <TrackBox key={k} f={f} k={k} />
              ))}
            </svg>
          ) : null}
        </div>
        {/* cylindrical glass shading (the barber pole) */}
        <div style={{position: 'absolute', inset: 0, opacity: pole, background: 'linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.12) 22%, rgba(255,255,255,0.22) 36%, rgba(255,255,255,0) 52%, rgba(0,0,0,0.22) 78%, rgba(0,0,0,0.66) 100%)'}} />
      </div>
      {/* pole caps */}
      {pole > 0.01
        ? [SY0 - 34, SY1 - 6].map((y, i) => (
            <div key={i} style={{position: 'absolute', left: SX - SLOT / 2 - 14, top: y, width: SLOT + 28, height: 40, borderRadius: 10, opacity: pole, background: 'linear-gradient(90deg, #2b302d 0%, #6a726c 30%, #c9cfc9 42%, #7c847e 60%, #2b302d 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'}} />
          ))
        : null}
      {/* what you see vs. what moves */}
      <div style={{position: 'absolute', left: SX + SLOT / 2 + 64, top: 420, opacity: seeIn * (1 - open), width: 260}}>
        <div style={{position: 'absolute', left: 30, top: 18, width: 0, height: 0}}>
          <ArrowSvg len={120} angle={-90} color={C.muted} width={5} />
        </div>
        <Eyebrow style={{position: 'absolute', left: 74, top: -12, whiteSpace: 'nowrap'}}>What you see</Eyebrow>
        <div style={{position: 'absolute', left: 74, top: 12, fontFamily: FONT, fontSize: 30, fontWeight: 600, color: C.text, whiteSpace: 'nowrap'}}>Straight up?</div>
      </div>
      {trueIn > 0 ? (
        <div style={{position: 'absolute', left: SX - OPEN / 2, top: SY1 + 26, opacity: trueIn, transform: `translateY(${(1 - trueIn) * 16}px)`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderRadius: 9, background: 'rgba(16,18,17,0.86)', border: `1px solid ${C.amber}`}}>
            <svg width={44} height={44} viewBox="0 0 44 44">
              <path d="M38 38 L8 8 M8 26 V8 H26" fill="none" stroke={C.amber} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <Eyebrow color={C.amber}>True motion</Eyebrow>
              <div style={{fontFamily: FONT, fontSize: 28, fontWeight: 650, color: C.text, marginTop: 4}}>Diagonal. Trackers don't guess.</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------- planar track ----
const SURF = {w: 720, h: 405};
const Planar: React.FC<{f: number}> = ({f}) => {
  const inn = ease.inOut(prog(f, T.planar - 10, T.planar + 8));
  if (inn <= 0) return null;
  const t = f - T.planar;
  const ry = -24 + 17 * Math.sin(t / 34);
  const rx = 9 * Math.sin(t / 29 + 1);
  const rz = -3 * Math.sin(t / 41 + 0.5);
  const tx = 80 * Math.sin(t / 38);
  const ty = 24 * Math.sin(t / 31 + 2);
  const pins = f >= T.pins ? 1 : 0;
  const pinFlash = f >= T.pins ? Math.exp(-(f - T.pins) / 8) : 0;
  const seek = prog(f, T.planar, T.pins);
  const lt = ease.expoOut(prog(f, T.pinLT, T.pinLT + 16));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: inn, perspective: 1500, perspectiveOrigin: '760px 500px'}}>
      <div style={{position: 'absolute', left: 760 - SURF.w / 2 + tx, top: 510 - SURF.h / 2 + ty, width: SURF.w, height: SURF.h, transformStyle: 'preserve-3d', transform: `rotateY(${ry}deg) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${mix(0.9, 1, inn)})`}}>
        {/* the surface: a printed panel with texture the planar tracker can follow */}
        <div style={{position: 'absolute', inset: 0, borderRadius: 4, overflow: 'hidden', background: 'linear-gradient(135deg, #2a1c44 0%, #4b2f6a 45%, #1c1430 100%)', boxShadow: '0 50px 90px rgba(0,0,0,0.6)'}}>
          <svg width={SURF.w} height={SURF.h} style={{position: 'absolute', inset: 0}}>
            {Array.from({length: 9}, (_, i) => (
              <line key={`v${i}`} x1={(i + 1) * 72} x2={(i + 1) * 72} y1={0} y2={SURF.h} stroke="rgba(255,255,255,0.07)" />
            ))}
            {Array.from({length: 5}, (_, i) => (
              <line key={`h${i}`} y1={(i + 1) * 67.5} y2={(i + 1) * 67.5} x1={0} x2={SURF.w} stroke="rgba(255,255,255,0.07)" />
            ))}
            <circle cx={560} cy={120} r={62} fill="#c79bf2" opacity={0.85} />
            <circle cx={598} cy={140} r={30} fill="#ff6a5a" opacity={0.8} />
            <rect x={70} y={70} width={210} height={14} rx={7} fill="#f1ede6" opacity={0.75} />
            <rect x={70} y={98} width={140} height={14} rx={7} fill="#f1ede6" opacity={0.4} />
            <rect x={420} y={250} width={90} height={90} fill="#3a5fd9" opacity={0.85} />
          </svg>
          {/* planar mesh after the pins lock */}
          {pins ? (
            <svg width={SURF.w} height={SURF.h} style={{position: 'absolute', inset: 0, opacity: 0.55 * (1 - prog(f, T.pinLT, T.pinLT + 20)) + 0.15}}>
              {[1, 2, 3].map((i) => (
                <line key={`mv${i}`} x1={(i * SURF.w) / 4} x2={(i * SURF.w) / 4} y1={0} y2={SURF.h} stroke={C.amber} strokeWidth={2} />
              ))}
              {[1, 2].map((i) => (
                <line key={`mh${i}`} y1={(i * SURF.h) / 3} y2={(i * SURF.h) / 3} x1={0} x2={SURF.w} stroke={C.amber} strokeWidth={2} />
              ))}
            </svg>
          ) : null}
          {/* the pinned lower third */}
          {lt > 0 ? (
            <div style={{position: 'absolute', left: 40, top: 262, height: 98, width: 430, clipPath: `inset(0 ${(1 - lt) * 100}% 0 0)`, background: 'rgba(16,18,17,0.92)', borderRadius: 6, display: 'flex', alignItems: 'center'}}>
              <div style={{width: 8, alignSelf: 'stretch', background: C.amber, borderRadius: '6px 0 0 6px'}} />
              <div style={{paddingLeft: 24}}>
                <div style={{fontFamily: FONT, fontWeight: 650, fontSize: 36, color: C.text, lineHeight: 1.1}}>Episode 2</div>
                <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 17, letterSpacing: '0.16em', color: C.amber, marginTop: 6}}>TAKE 03 · CAM B</div>
              </div>
            </div>
          ) : null}
        </div>
        {/* tracking quad + corner pins */}
        <div style={{position: 'absolute', inset: -2, border: `${pins ? 3 : 2}px ${pins ? 'solid' : 'dashed'} ${pins ? C.amber : rgba(C.text, 0.7)}`, borderRadius: 4, opacity: clamp(seek * 3)}} />
        {[[0, 0], [1, 0], [1, 1], [0, 1]].map(([cx, cy], i) => (
          <div key={i} style={{position: 'absolute', left: cx * SURF.w - 11, top: cy * SURF.h - 11, width: 22, height: 22, borderRadius: 11, background: pins ? C.amber : 'transparent', border: `3px solid ${pins ? C.amber : C.text}`, opacity: clamp(seek * 3), transform: `scale(${1 + 0.8 * pinFlash})`, boxShadow: pins ? `0 0 ${24 * pinFlash + 6}px ${rgba(C.amber, 0.8)}` : 'none'}} />
        ))}
      </div>
    </div>
  );
};

export const Tracking: React.FC<{f: number}> = ({f}) => {
  const planar = f >= T.planar - 4;
  const progress = clamp((f - T.track) / 100);
  return (
    <>
      <div style={{position: 'absolute', left: 160, top: 140, width: 1200, height: 800, background: `radial-gradient(50% 50% at 50% 50%, ${rgba(VIO, 0.1)} 0%, rgba(0,0,0,0) 70%)`}} />
      <ToolLabel f={f} at={396} out={620} text="MOTION TRACKING" />
      <BarberPole f={f} />
      <Planar f={f} />
      <Panel x={1400} y={200} w={448} h={620} o={ease.cubicOut(prog(f, 400, 418))}>
        <div style={{position: 'absolute', left: 28, top: 26}}>
          <Eyebrow>Picture · Motion Tracking</Eyebrow>
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 26, color: C.text, marginTop: 10}}>Follow a surface. Blur or mask it.</div>
        </div>
        <div style={{position: 'absolute', left: 28, top: 132, fontFamily: FONT, fontSize: 17, color: C.muted}}>Motion model</div>
        <div style={{position: 'absolute', left: 28, top: 162, display: 'flex', gap: 10}}>
          <Chip on={!planar}>Translation</Chip>
          <Chip on={planar}>Planar</Chip>
        </div>
        <Select label="Output" value={planar ? 'Review' : 'Review'} w={392} style={{position: 'absolute', left: 28, top: 226}} />
        <Btn label="Track clip" f={f} press={T.track} w={392} style={{position: 'absolute', left: 28, top: 334}} />
        {/* tracking progress across the clip, with a keyframe tick per tracked point */}
        <div style={{position: 'absolute', left: 28, top: 412, width: 392}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 15, color: C.muted, letterSpacing: '0.08em'}}>
            <span>00:00:12:04</span>
            <span>{f >= T.pins ? 'PLANAR LOCK' : f >= T.locks[3] ? '4 POINTS' : f >= T.track ? 'TRACKING' : 'READY'}</span>
          </div>
          <div style={{position: 'relative', height: 8, marginTop: 12, borderRadius: 4, background: C.line}}>
            <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${progress * 100}%`, borderRadius: 4, background: C.amber}} />
          </div>
          <div style={{position: 'relative', height: 22, marginTop: 8}}>
            {[...T.locks, T.pins].map((L, i) => (f >= L ? <div key={i} style={{position: 'absolute', left: `${((L - T.track) / 100) * 100}%`, top: 0, width: 3, height: 16, background: C.amber, borderRadius: 1}} /> : null))}
          </div>
        </div>
        <Slider label="Search area" v={0.42} w={392} style={{position: 'absolute', left: 28, top: 500}} />
      </Panel>
    </>
  );
};

// ---------------------------------------------------------------- induced motion → stabilization ----
const FX = 860;
const FY = 528;
const FW = 1040;
const FH = 585;
const STAB0 = 597;
const amp = (f: number) => prog(f, STAB0, STAB0 + 14) * (1 - ease.inOut(prog(f, T.stabilize, T.lock)));
const shakeAt = (f: number) => {
  const t = (f - STAB0) / 60;
  const a = amp(f);
  return {
    x: a * (52 * Math.sin(2 * Math.PI * 0.55 * t + 0.4) + 11 * Math.sin(2 * Math.PI * 1.9 * t + 2)),
    y: a * (30 * Math.sin(2 * Math.PI * 0.8 * t + 1.3) + 7 * Math.sin(2 * Math.PI * 2.6 * t)),
    r: a * 1.3 * Math.sin(2 * Math.PI * 0.45 * t + 0.8),
  };
};
// the measured camera path (x) used by the panel graph
const rawX = (f: number) => {
  const t = (f - STAB0) / 60;
  return 52 * Math.sin(2 * Math.PI * 0.55 * t + 0.4) + 11 * Math.sin(2 * Math.PI * 1.9 * t + 2);
};

const PathGraph: React.FC<{f: number}> = ({f}) => {
  const W = 352;
  const Hh = 120;
  const f0 = STAB0;
  const f1 = T.stabilize;
  const drawn = prog(f, T.measure, T.stabilize);
  const flat = ease.inOut(prog(f, T.stabilize, T.lock));
  const n = 90;
  let d = '';
  for (let k = 0; k <= n * drawn; k++) {
    const fr = mix(f0, f1, k / n);
    d += `${k ? 'L' : 'M'}${((k / n) * W).toFixed(1)} ${(Hh / 2 - rawX(fr) * 0.8).toFixed(1)}`;
  }
  return (
    <svg width={W} height={Hh} style={{display: 'block'}}>
      <rect x={0} y={0} width={W} height={Hh} rx={6} fill="#0a0c0b" stroke={C.line} />
      <line x1={0} x2={W} y1={Hh / 2} y2={Hh / 2} stroke="rgba(235,234,226,0.08)" />
      <path d={d} fill="none" stroke={C.amber} strokeWidth={2.5} strokeLinejoin="round" opacity={1 - 0.6 * flat} />
      {flat > 0 ? <line x1={0} x2={W * flat} y1={Hh / 2} y2={Hh / 2} stroke={C.success} strokeWidth={3.5} strokeLinecap="round" /> : null}
    </svg>
  );
};

export const Stabilization: React.FC<{f: number}> = ({f}) => {
  const s = shakeAt(f);
  const locked = f >= T.lock;
  const lockK = locked ? Math.exp(-(f - T.lock) / 10) : 0;
  const panel = ease.cubicOut(prog(f, T.measure - 8, T.measure + 8));
  return (
    <>
      <ToolLabel f={f} at={612} out={760} text="SHOT STABILIZATION" />
      {/* the camera frame: everything here moves together */}
      <div style={{position: 'absolute', left: FX - FW / 2, top: FY - FH / 2, width: FW, height: FH, transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg)`}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: 6, border: `2px solid ${rgba(C.text, 0.85)}`, background: 'rgba(255,255,255,0.015)'}} />
        <svg width={FW} height={FH} style={{position: 'absolute', inset: 0}}>
          {[1, 2].map((i) => (
            <g key={i}>
              <line x1={(i * FW) / 3} x2={(i * FW) / 3} y1={0} y2={FH} stroke="rgba(235,234,226,0.13)" strokeWidth={1.5} />
              <line y1={(i * FH) / 3} y2={(i * FH) / 3} x1={0} x2={FW} stroke="rgba(235,234,226,0.13)" strokeWidth={1.5} />
            </g>
          ))}
          {[[0, 0], [1, 0], [1, 1], [0, 1]].map(([cx, cy], i) => {
            const x = cx * FW + (cx ? -26 : 26);
            const y = cy * FH + (cy ? -26 : 26);
            const sx = cx ? 1 : -1;
            const sy = cy ? 1 : -1;
            return <path key={i} d={`M${x} ${y - sy * 40} L${x} ${y} L${x - sx * 40} ${y}`} transform={`translate(${sx * 0} ${sy * 0})`} fill="none" stroke={C.amber} strokeWidth={5} strokeLinecap="round" />;
          })}
        </svg>
        <div style={{position: 'absolute', left: 52, top: 46, display: 'flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: '0.18em', color: C.text}}>
          <div style={{width: 14, height: 14, borderRadius: 7, background: '#ff4a3d', opacity: Math.floor(f / 20) % 2 ? 0.4 : 1}} />
          REC
        </div>
        <div style={{position: 'absolute', right: 52, top: 46, fontFamily: MONO, fontWeight: 500, fontSize: 18, letterSpacing: '0.1em', color: C.muted}}>CAM A</div>
        {locked ? (
          <div style={{position: 'absolute', right: 46, bottom: 40, transform: `scale(${1 + 0.2 * lockK})`, transformOrigin: '100% 100%'}}>
            <Chip on color={C.success}>Stabilized</Chip>
          </div>
        ) : null}
      </div>
      {/* the subject: it never moves */}
      <Glow x={FX} y={FY} size={150} color={VIO} opacity={0.75} />
      <div style={{position: 'absolute', left: FX - 13, top: FY - 13, width: 26, height: 26, borderRadius: 13, background: '#f3e8ff'}} />
      <Panel x={1440} y={236} w={408} h={560} o={panel}>
        <div style={{position: 'absolute', left: 26, top: 24}}>
          <Eyebrow>Camera · Shot Stabilization</Eyebrow>
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 24, color: C.text, marginTop: 10}}>Steady handheld camera movement.</div>
        </div>
        <div style={{position: 'absolute', left: 26, top: 152, fontFamily: FONT, fontSize: 18, color: f >= T.stabilize ? C.muted : C.text}}>
          <span style={{fontFamily: MONO, color: C.amber, marginRight: 10}}>1</span>Measure camera motion
        </div>
        <div style={{position: 'absolute', left: 26, top: 188}}>
          <PathGraph f={f} />
        </div>
        <div style={{position: 'absolute', left: 26, top: 330, fontFamily: FONT, fontSize: 18, color: f >= T.stabilize ? C.text : C.muted}}>
          <span style={{fontFamily: MONO, color: C.amber, marginRight: 10}}>2</span>Render a stabilized copy
        </div>
        <Btn label="Stabilize" f={f} press={T.stabilize} w={356} style={{position: 'absolute', left: 26, top: 368}} />
        <Slider label="Smoothing (frames)" v={0.62} w={356} style={{position: 'absolute', left: 26, top: 452}} />
      </Panel>
      <div style={{position: 'absolute', left: FX - 200, width: 400, top: FY + FH / 2 + 46, textAlign: 'center', opacity: prog(f, 624, 636) * (1 - prog(f, T.stabilize - 6, T.stabilize + 4))}}>
        <Eyebrow style={{fontSize: 16}}>Watch the dot</Eyebrow>
      </div>
      <Message f={f} at={T.lock + 6} out={762}>
        The camera moved. <span style={{color: VIO}}>Not the subject.</span>
      </Message>
    </>
  );
};
