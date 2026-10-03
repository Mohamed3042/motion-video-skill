// World 9 · Edit Room (coral). Library's aligned timeline drops to the program track and is razored into two
// alternating stills → beta movement (one ball "moves"; "Every cut is an illusion.") → Camera Director (energy
// follows the speaker, minimum shot length, a first cut builds) → Silence Rough Cut (gaps fold shut, editable cut
// list) → Command Launcher (a recipe chain snaps, locks, runs) → Styled Captions (Clean / Pop / Focus) → the cut
// timeline collapses into one fixation dot for Profile's Troxler world.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {alpha, Check, Chip, CORAL as K, EXPO_IN, handoffColor, HandoffTimeline, IN_OUT, lerp, Mono, Panel, PlayIcon, pop, pulse, Search, tc, ToolLabel, WorldTitle} from '../library/kit';
import {BETA_CUTS, T} from './timing';

const PX = {x0: 220, x1: 1700, y: 840, h: 64}; // program track (V1 of the handoff timeline after the drop)
const CAMC = {A: K, B: '#f2c6a6', C: '#b9a6dc'} as const;
type Cam = keyof typeof CAMC;

// ---------- program track ----------
const BETA_X0 = 260;
const BETA_W = 90; // one still per 8th note at 6 px/frame
const betaX = (f: number) => BETA_X0 + 6 * (f - T.beta[0]);
const DIR_X = (f: number) => PX.x0 + (f - T.director) * (1480 / 180);
const DIR_CUTS: {at: number; cam: Cam}[] = [
  {at: T.director, cam: 'A'},
  {at: T.switches[0], cam: 'B'},
  {at: T.switches[1], cam: 'C'},
  {at: T.switches[2], cam: 'A'},
  {at: T.switches[3], cam: 'B'},
];
const activeCam = (f: number): Cam => DIR_CUTS.filter((c) => f >= c.at).pop()?.cam ?? 'A';

const ProgramTrack: React.FC<{f: number}> = ({f}) => {
  if (f < T.drop[1] - 2) return null;
  const a = lerp(f, T.drop[1] - 2, T.drop[1] + 4);
  // exit: rise to centre, squeeze to a point, round into the fixation dot
  const rise = lerp(f, T.exit + 6, T.exit + 26, 0, 1, IN_OUT);
  const squeeze = lerp(f, T.exit + 12, T.dot - 2, 0, 1, EXPO_IN);
  if (f >= T.dot) return null;
  const cy = PX.y + (540 - PX.y) * rise;
  const beta = f < T.director - 6;
  const betaOut = lerp(f, T.illusion + 6, T.director - 6);
  const chop = lerp(f, T.chop[0], T.chop[1], 0, 1, IN_OUT);
  const segs: React.ReactNode[] = [];
  if (beta) {
    for (let k = 0; BETA_X0 + k * BETA_W < PX.x1; k++) {
      const x = BETA_X0 + k * BETA_W;
      const cut = x <= PX.x0 + (PX.x1 - PX.x0) * chop + 20;
      const isB = k % 2 === 1;
      const lit = betaX(Math.min(f, T.reveal)) >= x && betaX(Math.min(f, T.reveal)) < x + BETA_W && f < T.reveal;
      segs.push(
        <div
          key={k}
          style={{
            position: 'absolute',
            left: x + (cut ? 1.5 : 0),
            width: Math.min(BETA_W, PX.x1 - x) - (cut ? 3 : 0),
            top: 0,
            height: PX.h,
            borderRadius: cut ? 5 : 0,
            background: alpha(isB && cut ? '#f6c4bf' : K, lit ? 0.55 : 0.2),
            border: `1.5px solid ${alpha(K, cut ? 0.85 : 0.5)}`,
            opacity: 1 - betaOut,
          }}
        >
          {cut ? <div style={{position: 'absolute', left: 8, top: 6, fontFamily: MONO, fontWeight: 700, fontSize: 16, color: lit ? C.text : C.muted}}>{isB ? 'B' : 'A'}</div> : null}
        </div>,
      );
    }
  } else {
    const end = Math.min(f, T.switches[3] + 15 + 1000);
    DIR_CUTS.forEach((c, i) => {
      if (f < c.at) return;
      const nx = i + 1 < DIR_CUTS.length ? Math.min(DIR_X(DIR_CUTS[i + 1].at), DIR_X(end)) : DIR_X(Math.min(end, 390));
      const x = DIR_X(c.at);
      const w = Math.max(0, nx - x);
      const flash = pulse(f, c.at, 8);
      segs.push(
        <div key={i} style={{position: 'absolute', left: x + 1.5, width: Math.max(0, w - 3), top: 0, height: PX.h, borderRadius: 5, background: alpha(CAMC[c.cam], 0.3 + 0.4 * flash), border: `1.5px solid ${CAMC[c.cam]}`, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 8, top: 6, fontFamily: MONO, fontWeight: 700, fontSize: 15, color: C.text, whiteSpace: 'nowrap'}}>CAM {c.cam}</div>
        </div>,
      );
    });
  }
  const play = beta ? betaX(Math.max(T.beta[0], Math.min(f, T.reveal))) : DIR_X(Math.max(T.director, Math.min(f, 390)));
  const playOp = beta ? lerp(f, T.beta[0] - 6, T.beta[0]) * (1 - lerp(f, T.reveal, T.reveal + 10)) : lerp(f, T.director, T.director + 8);
  const holdK = lerp(f, T.hold - 4, T.hold + 4) * (1 - lerp(f, T.switches[2] - 6, T.switches[2]));
  const sq = 1 - squeeze;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: a}}>
      <div style={{position: 'absolute', left: 0, top: cy - PX.h / 2, width: 1920, height: PX.h, scale: `${Math.max(0.004, sq)} ${1 - 0.7 * squeeze}`, transformOrigin: '960px 50%', opacity: 1 - lerp(f, T.dot - 3, T.dot)}}>
        <div style={{position: 'absolute', left: 120, top: 0, height: PX.h, display: 'flex', alignItems: 'center', fontFamily: MONO, fontSize: 14, color: C.muted, opacity: 1 - rise, whiteSpace: 'pre'}}>
          {'V1  PROGRAM'}
        </div>
        <div style={{position: 'absolute', left: PX.x0, width: PX.x1 - PX.x0, top: -6, height: PX.h + 12, background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${alpha(C.line, 0.6)}`, opacity: 1 - rise}} />
        {segs}
        <div style={{position: 'absolute', left: play - 1.5, top: -16, width: 3, height: PX.h + 28, background: C.amber, opacity: playOp * (1 - rise), boxShadow: `0 0 12px ${alpha(C.amber, 0.6)}`}} />
        {holdK > 0 ? (
          <div style={{position: 'absolute', left: DIR_X(T.switches[1]), width: DIR_X(T.switches[1] + 45) - DIR_X(T.switches[1]), top: -30, height: 22, borderTop: `2px solid ${C.amber}`, borderLeft: `2px solid ${C.amber}`, borderRight: `2px solid ${C.amber}`, opacity: holdK}}>
            <div style={{position: 'absolute', left: 8, top: -24, fontFamily: MONO, fontSize: 14, color: C.amber, whiteSpace: 'nowrap'}}>minimum shot length · held</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ---------- beta movement ----------
const MON = {x: 880, y: 150, w: 920, h: 560}; // monitor panel; picture inside
const PIC = {x: MON.x + 20, y: MON.y + 46, w: 880, h: 495};
const Stage: React.FC<{w: number; h: number; ballX: number; uid: string}> = ({w, h, ballX, uid}) => (
  <svg width={w} height={h} viewBox="0 0 880 495" preserveAspectRatio="none" style={{display: 'block'}}>
    <defs>
      <radialGradient id={uid + 'bg'} cx="0.5" cy="0.25" r="0.8">
        <stop offset="0" stopColor="#3a2524" />
        <stop offset="1" stopColor="#0d0a0a" />
      </radialGradient>
      <linearGradient id={uid + 'fl'} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2b1d1c" />
        <stop offset="1" stopColor="#120d0d" />
      </linearGradient>
      <radialGradient id={uid + 'ball'} cx="0.38" cy="0.32" r="0.75">
        <stop offset="0" stopColor="#ffd7d1" />
        <stop offset="0.45" stopColor="#ed9690" />
        <stop offset="1" stopColor="#8a3f3a" />
      </radialGradient>
    </defs>
    <rect width={880} height={495} fill={`url(#${uid}bg)`} />
    <rect y={330} width={880} height={165} fill={`url(#${uid}fl)`} />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <line key={i} x1={440} y1={330} x2={-400 + i * 210} y2={495} stroke="#ed9690" strokeOpacity={0.08} />
    ))}
    <line x1={0} x2={880} y1={330} y2={330} stroke="#ed9690" strokeOpacity={0.25} />
    <ellipse cx={ballX} cy={372} rx={70} ry={12} fill="#000" opacity={0.55} />
    <circle cx={ballX} cy={290} r={66} fill={`url(#${uid}ball)`} />
  </svg>
);
const BALL = [250, 630]; // still A, still B

const Beta: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, 22, 40);
  const o = 1 - lerp(f, T.director - 10, T.director + 4, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  const k = f < T.beta[0] ? 0 : Math.floor((Math.min(f, T.reveal - 1) - T.beta[0]) / 15) % 2;
  const split = lerp(f, T.reveal, T.reveal + 20, 0, 1, IN_OUT);
  const cutFlash = BETA_CUTS.reduce((m, c) => Math.max(m, c < T.reveal ? pulse(f, c, 3) : 0), 0);
  // split: still A shrinks into the left half of the monitor, still B into the right half
  const half = {w: 440, h: 248};
  const rA = {x: PIC.x + (PIC.x - PIC.x) * split, y: PIC.y + (330 - PIC.y) * split, w: PIC.w + (half.w - PIC.w) * split, h: PIC.h + (half.h - PIC.h) * split};
  const rB = {x: rA.x + (half.w + 24) * split, y: rA.y, w: rA.w, h: rA.h};
  return (
    <div style={{position: 'absolute', inset: 0, opacity: a * o}}>
      <Panel x={MON.x} y={MON.y} w={MON.w} h={MON.h} glow={K} style={{opacity: 1 - split, translate: `0px ${(1 - a) * 30}px`}}>
        <div style={{position: 'absolute', left: 20, top: 12, display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 20, color: C.text}}>Program</span>
          <Mono size={14}>shared playhead</Mono>
        </div>
        <div style={{position: 'absolute', right: 20, top: 12}}>
          <Mono size={18} color={C.amber}>
            {tc(1, 0, 12, 8 + Math.floor(Math.max(0, f - T.beta[0]) / 2.4) % 17)}
          </Mono>
        </div>
      </Panel>
      {split < 1 && f < T.reveal ? (
        <div style={{position: 'absolute', left: PIC.x, top: PIC.y, width: PIC.w, height: PIC.h, borderRadius: 6, overflow: 'hidden', translate: `0px ${(1 - a) * 30}px`}}>
          <Stage w={PIC.w} h={PIC.h} ballX={BALL[k]} uid="bm" />
          <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0.05 * cutFlash}} />
        </div>
      ) : null}
      {f >= T.reveal
        ? [rA, rB].map((r, i) => (
            <div key={i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h}}>
              <div style={{position: 'absolute', inset: 0, borderRadius: 6, overflow: 'hidden', border: `1.5px solid ${alpha(K, 0.4 + 0.5 * split)}`}}>
                <Stage w={r.w} h={r.h} ballX={BALL[i]} uid={'bs' + i} />
              </div>
              <div style={{position: 'absolute', left: 0, top: -40, opacity: split}}>
                <Chip tone="accent" accent={K} mono>
                  STILL {i ? 'B' : 'A'}
                </Chip>
              </div>
            </div>
          ))
        : null}
      {f >= T.reveal ? (
        <div style={{position: 'absolute', left: PIC.x, top: 610, width: 904, textAlign: 'center', opacity: lerp(f, T.reveal + 12, T.reveal + 24)}}>
          <Mono size={20} color={C.muted}>
            Two stills. Nothing moves. Your eye fills the gap.
          </Mono>
        </div>
      ) : null}
    </div>
  );
};

const BetaText: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.titleOut + 6, T.titleOut + 22);
  const o = 1 - lerp(f, T.director - 10, T.director + 2, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  const big = pop(f, T.illusion, 13, 190, 0.7);
  const watch = 1 - lerp(f, T.illusion - 8, T.illusion);
  const flash = pulse(f, T.illusion, 10);
  return (
    <div style={{position: 'absolute', left: 120, top: 250, width: 700, opacity: o}}>
      <div style={{opacity: a, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: '0.2em', color: K}}>BETA MOVEMENT</div>
      <div style={{position: 'relative', marginTop: 22, height: 300}}>
        <div style={{position: 'absolute', left: 0, top: 0, opacity: a * watch, fontFamily: FONT, fontWeight: 700, fontSize: 64, letterSpacing: '-0.03em', color: C.text, lineHeight: 1.08}}>
          {f < T.reveal ? (
            <>
              Watch the
              <br />
              ball move.
            </>
          ) : (
            <>
              It never
              <br />
              moved.
            </>
          )}
        </div>
        {big > 0 ? (
          <div style={{position: 'absolute', left: 0, top: 0, fontFamily: FONT, fontWeight: 800, fontSize: 92, letterSpacing: '-0.04em', lineHeight: 1.0, color: C.text, opacity: Math.min(1, big * 1.4), scale: `${1.12 - 0.12 * big}`, transformOrigin: 'left center', textShadow: `0 0 ${50 * flash}px ${alpha(K, 0.8 * flash)}`}}>
            Every cut
            <br />
            is an <span style={{color: K}}>illusion.</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ---------- Camera Director ----------
const S1 = [[214, 282], [318, 330], [345, 372], [375, 400]] as const; // speaker 1 (CAM B close-up)
const S2 = [[282, 342], [345, 372]] as const; // speaker 2 (CAM C close-up)
const talking = (f: number, sp: readonly (readonly [number, number])[]) => sp.some(([a, b]) => f >= a && f < b);
const energy = (f: number, sp: readonly (readonly [number, number])[], seed: number) =>
  talking(f, sp) ? 0.55 + 0.45 * Math.abs(Math.sin(f * 0.37 + seed) * Math.sin(f * 0.13 + seed * 2)) : 0.05 + 0.05 * Math.abs(Math.sin(f * 0.5 + seed));
const camEnergy = (f: number, cam: Cam) =>
  cam === 'B' ? energy(f, S1, 1) : cam === 'C' ? energy(f, S2, 4) : talking(f, S1) && talking(f, S2) ? 0.5 + 0.3 * Math.abs(Math.sin(f * 0.3)) : 0.18 + 0.08 * Math.abs(Math.sin(f * 0.21));

const Silhouette: React.FC<{x: number; y: number; s: number; rim: string; glow: number}> = ({x, y, s, rim, glow}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-120 140 C-112 70 -60 52 0 52 C60 52 112 70 120 140 Z" fill="#0a0909" />
    <circle cx={0} cy={0} r={46} fill="#0a0909" />
    <path d="M30 -34 A46 46 0 0 1 34 32" fill="none" stroke={rim} strokeWidth={4} strokeLinecap="round" opacity={0.35 + 0.65 * glow} />
    <path d="M60 64 C90 72 108 96 114 130" fill="none" stroke={rim} strokeWidth={3} strokeLinecap="round" opacity={0.25 + 0.5 * glow} />
  </g>
);
const CamScene: React.FC<{cam: Cam; w: number; h: number; f: number}> = ({cam, w, h, f}) => {
  const e1 = talking(f, S1) ? 1 : 0;
  const e2 = talking(f, S2) ? 1 : 0;
  const bg = cam === 'A' ? ['#3b2a2c', '#121011'] : cam === 'B' ? ['#4a3426', '#140f0c'] : ['#2f2a3d', '#0f0e14'];
  return (
    <svg width={w} height={h} viewBox="0 0 544 306" preserveAspectRatio="xMidYMid slice" style={{display: 'block'}}>
      <defs>
        <radialGradient id={`cd-${cam}`} cx="0.6" cy="0.35" r="0.8">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </radialGradient>
      </defs>
      <rect width={544} height={306} fill={`url(#cd-${cam})`} />
      {cam === 'A' ? (
        <>
          <rect x={60} y={150} width={424} height={10} rx={4} fill="#000" opacity={0.4} />
          <Silhouette x={180} y={150} s={0.62} rim={CAMC.B} glow={e1} />
          <Silhouette x={364} y={150} s={0.62} rim={CAMC.C} glow={e2} />
          <rect x={40} y={232} width={464} height={80} fill="#0b0909" />
        </>
      ) : (
        <Silhouette x={cam === 'B' ? 250 : 294} y={150} s={1.15} rim={CAMC[cam]} glow={cam === 'B' ? e1 : e2} />
      )}
    </svg>
  );
};

const Director: React.FC<{f: number}> = ({f}) => {
  const o = 1 - lerp(f, T.silence - 8, T.silence + 6, 0, 1, IN_OUT);
  if (f < T.director - 4 || o <= 0) return null;
  const act = activeCam(f);
  const cams: {cam: Cam; name: string}[] = [
    {cam: 'A', name: 'Wide'},
    {cam: 'B', name: 'Close · speaker 1'},
    {cam: 'C', name: 'Close · speaker 2'},
  ];
  const sw = T.switches.reduce((m, s) => Math.max(m, pulse(f, s, 9)), 0);
  const held = lerp(f, T.hold - 2, T.hold + 4) * (1 - lerp(f, T.switches[2] - 8, T.switches[2]));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      {cams.map((c, i) => {
        const a = pop(f, T.director + i * 4, 14, 170, 0.7);
        const on = act === c.cam;
        const flash = on ? sw : 0;
        const x = 120 + i * 568;
        const E = camEnergy(f, c.cam);
        return (
          <div key={c.cam} style={{position: 'absolute', left: x, top: 190, width: 544, opacity: Math.min(1, a * 1.5), translate: `0px ${(1 - a) * 40}px`}}>
            <div style={{position: 'relative', width: 544, height: 306, borderRadius: 6, overflow: 'hidden', outline: `${on ? 4 : 1.5}px solid ${on ? C.amber : C.line}`, outlineOffset: on ? 0 : -1, boxShadow: on ? `0 0 ${40 + 60 * flash}px ${alpha(C.amber, 0.25 + 0.4 * flash)}` : '0 20px 50px rgba(0,0,0,0.5)'}}>
              <CamScene cam={c.cam} w={544} h={306} f={f} />
              <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0.12 * flash}} />
              <div style={{position: 'absolute', left: 12, top: 12, display: 'flex', gap: 8}}>
                <Chip tone={on ? 'amber' : 'raised'} mono style={{height: 30, fontSize: 15, fontWeight: 700}}>
                  CAM {c.cam}
                </Chip>
                <Chip tone="raised" style={{height: 30, fontSize: 15, background: 'rgba(16,18,17,0.75)'}}>
                  {c.name}
                </Chip>
              </div>
              {on ? (
                <div style={{position: 'absolute', right: 12, top: 12}}>
                  <Chip tone="amber" mono style={{height: 30, fontSize: 14, fontWeight: 700}}>
                    ACTIVE ANGLE
                  </Chip>
                </div>
              ) : null}
              {c.cam === 'B' && held > 0 && !on ? (
                <div style={{position: 'absolute', right: 12, bottom: 12, opacity: held}}>
                  <Chip tone="accent" accent={C.amber} mono style={{height: 30, fontSize: 14}}>
                    held · minimum shot
                  </Chip>
                </div>
              ) : null}
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 14}}>
              <Mono size={14} style={{width: 110}}>
                speech energy
              </Mono>
              <div style={{display: 'flex', gap: 3, flex: 1}}>
                {Array.from({length: 26}, (_, k) => {
                  const lit = k / 26 < E;
                  return <div key={k} style={{flex: 1, height: 16, borderRadius: 2, background: lit ? (k > 20 ? C.amber : CAMC[c.cam]) : C.raised, opacity: lit ? 1 : 0.8}} />;
                })}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 120, top: 600, display: 'flex', alignItems: 'baseline', gap: 26, opacity: lerp(f, T.director + 20, T.director + 36)}}>
        <span style={{fontFamily: FONT, fontWeight: 700, fontSize: 52, letterSpacing: '-0.03em', color: C.text}}>A first cut to review.</span>
        <Mono size={17}>active angle follows speech energy · minimum shot length · inputs share time zero</Mono>
      </div>
    </div>
  );
};

// ---------- Silence Rough Cut ----------
// waveform layout in "source px": speech blocks with four quiet gaps between them
const GAPS = [
  {a: 300, b: 420},
  {a: 640, b: 760},
  {a: 980, b: 1060},
  {a: 1250, b: 1370},
];
const WX0 = 140;
const WX1 = 1780;
const gapShut = (f: number, i: number) => lerp(f, T.collapse[i] - 7, T.collapse[i], 0, 1, EXPO_IN);
// map a source x to screen x after the folds so far (folded gaps shrink to 0; the remainder re-centres)
const fold = (x: number, f: number) => {
  let dx = 0;
  GAPS.forEach((g, i) => {
    const s = gapShut(f, i);
    const w = g.b - g.a;
    if (x >= g.b) dx += w * s;
    else if (x > g.a) dx += (x - g.a) * s;
  });
  const removed = GAPS.reduce((m, g, i) => m + (g.b - g.a) * gapShut(f, i), 0);
  return x - dx + removed / 2;
};
const amp = (x: number) => {
  if (GAPS.some((g) => x > g.a + 8 && x < g.b - 8)) return 0.03 + 0.02 * Math.abs(Math.sin(x * 0.7));
  return Math.max(0.08, Math.abs(Math.sin(x * 0.045) * 0.6 + Math.sin(x * 0.13 + 1) * 0.3 + Math.sin(x * 0.31) * 0.15));
};
const CUTS = [
  ['00:00:03:12', '00:00:05:10', 'Cut'],
  ['00:00:09:02', '00:00:11:00', 'Cut'],
  ['00:00:14:20', '00:00:16:04', 'Cut'],
  ['00:00:19:15', '00:00:21:13', 'Cut'],
] as const;

const Silence: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.silence, T.silence + 16);
  const o = 1 - lerp(f, T.launcher - 8, T.launcher + 6, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  const det = lerp(f, T.detect, T.detect + 10);
  const bars: React.ReactNode[] = [];
  for (let x = WX0; x < WX1; x += 9) {
    const v = amp(x);
    const sx = fold(x, f);
    const inGap = GAPS.findIndex((g) => x >= g.a && x < g.b);
    const quiet = inGap >= 0 && f >= T.detect;
    bars.push(<rect key={x} x={sx} y={150 - v * 110} width={5} height={Math.max(2, v * 220)} rx={2.5} fill={quiet ? alpha(K, 0.5) : K} opacity={inGap >= 0 ? 1 - gapShut(f, inGap) : 1} />);
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity: a * o}}>
      <Panel x={120} y={190} w={1680} h={330} glow={K}>
        <div style={{position: 'absolute', left: 22, top: 16, right: 22, display: 'flex', alignItems: 'center', gap: 10}}>
          <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.text}}>CAM A · dialogue</span>
          <span style={{flex: 1}} />
          <Chip>Silence threshold</Chip>
          <Chip>Minimum silence</Chip>
          <Chip>Keep around speech</Chip>
        </div>
        <svg width={1680} height={300} style={{position: 'absolute', left: -120, top: 30, overflow: 'visible'}}>
          {/* detected quiet passages: hatched, folding like an accordion */}
          {GAPS.map((g, i) => {
            const s = gapShut(f, i);
            if (s >= 1 || det <= 0) return null;
            const x0 = fold(g.a, f);
            const w = (g.b - g.a) * (1 - s);
            const n = 6;
            const pts = Array.from({length: n + 1}, (_, k) => `${x0 + (w * k) / n},${k % 2 ? 60 : 240}`).join(' ');
            return (
              <g key={i} opacity={det}>
                <rect x={x0} y={50} width={w} height={200} fill={alpha(K, 0.1)} stroke={alpha(K, 0.6)} strokeDasharray="6 5" />
                <polyline points={pts} fill="none" stroke={K} strokeOpacity={0.5} strokeWidth={2} />
              </g>
            );
          })}
          {bars}
          <line x1={WX0} x2={WX1} y1={150 - 0.12 * 110} y2={150 - 0.12 * 110} stroke={C.amber} strokeDasharray="8 6" strokeWidth={1.5} opacity={det} />
          <line x1={WX0} x2={WX1} y1={150 + 0.12 * 110} y2={150 + 0.12 * 110} stroke={C.amber} strokeDasharray="8 6" strokeWidth={1.5} opacity={det} />
          {GAPS.map((g, i) => {
            const k = pulse(f, T.collapse[i], 8);
            return f >= T.collapse[i] ? <rect key={'s' + i} x={fold(g.a, f) - 2} y={40 - 14 * k} width={4} height={220 + 28 * k} rx={2} fill={C.amber} opacity={0.5 + 0.5 * k} /> : null;
          })}
        </svg>
        <div style={{position: 'absolute', left: 22, bottom: 14, opacity: det}}>
          <Mono size={15} color={C.amber}>
            - - silence threshold
          </Mono>
        </div>
      </Panel>
      {/* editable cut list */}
      <div style={{position: 'absolute', left: 120, top: 560, width: 900, opacity: lerp(f, T.list, T.list + 12)}}>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 50, letterSpacing: '-0.03em', color: C.text, lineHeight: 1.1}}>
          Quiet gaps fold shut.
          <br />
          <span style={{color: C.muted}}>Every cut stays editable.</span>
        </div>
        <div style={{marginTop: 20}}>
          <Mono size={17}>Threshold cuts, not creative judgment · review breaths and deliberate pauses</Mono>
        </div>
      </div>
      <Panel x={1100} y={548} w={700} h={232} style={{opacity: lerp(f, T.list, T.list + 10), translate: `${(1 - lerp(f, T.list, T.list + 14)) * 40}px 0px`}}>
        <div style={{position: 'absolute', left: 20, top: 14, display: 'flex', justifyContent: 'space-between', right: 20}}>
          <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 20, color: C.text}}>Cut list</span>
          <Mono size={14}>shorter copy · source untouched</Mono>
        </div>
        {CUTS.map((c, i) => {
          const s = pop(f, T.list + i * 3, 13, 200, 0.6);
          const keep = i === 2 && f >= T.keep;
          const kp = i === 2 ? pulse(f, T.keep, 10) : 0;
          return (
            <div key={i} style={{position: 'absolute', left: 14, right: 14, top: 50 + i * 44, height: 38, borderRadius: 6, background: kp > 0.02 ? alpha(C.amber, 0.12 * kp + 0.04) : C.raised, display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px', opacity: Math.min(1, s * 1.4), translate: `${(1 - s) * 30}px 0px`}}>
              <Mono size={15} color={C.muted}>
                {String(i + 1).padStart(2, '0')}
              </Mono>
              <Mono size={16} color={C.text}>
                {c[0]} – {c[1]}
              </Mono>
              <span style={{flex: 1}} />
              <Mono size={14} color={C.muted}>
                {keep ? 'breath' : 'quiet'}
              </Mono>
              <Chip tone={keep ? 'line' : 'accent'} accent={K} style={{height: 28, fontSize: 15, minWidth: 64, justifyContent: 'center', color: keep ? C.text : K}}>
                {keep ? 'Keep' : 'Cut'}
              </Chip>
            </div>
          );
        })}
      </Panel>
    </div>
  );
};

// ---------- Command Launcher ----------
const STEPS = [
  {name: 'Dialogue Noise', sum: 'Reduce background noise.'},
  {name: 'Dialogue Mixer', sum: 'Shape tone and dynamics.'},
  {name: 'Loudness Delivery', sum: 'Measure and meet the target.'},
  {name: 'Silence Cut', sum: 'Trim quiet passages.'},
];
const Launcher: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.launcher, T.launcher + 14);
  const o = 1 - lerp(f, T.captions - 8, T.captions + 6, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  const typed = 'Dialogue delivery'.slice(0, Math.round(lerp(f, T.launcher + 2, T.launcher + 14, 0, 17, (t) => t)));
  const lock = pop(f, T.lock, 12, 220, 0.6);
  const lp = pulse(f, T.lock, 12);
  const press = pulse(f, T.run, 6);
  const prog = lerp(f, T.run, T.done, 0, 1, (t) => t);
  const BW = 380;
  const GAP = 53;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: a * o}}>
      <Panel x={460} y={220} w={1000} h={72} glow={K} style={{translate: `0px ${(1 - a) * -20}px`, borderColor: alpha(K, 0.5)}}>
        <div style={{position: 'absolute', left: 24, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 16}}>
          <Search size={26} color={K} />
          <span style={{fontFamily: FONT, fontSize: 30, fontWeight: 500, color: C.text}}>{typed}</span>
          <span style={{width: 2.5, height: 30, background: K, opacity: Math.floor(f / 14) % 2 ? 0.2 : 1}} />
        </div>
        <div style={{position: 'absolute', right: 18, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 10}}>
          <Chip tone="accent" accent={K}>Recipe</Chip>
          <Mono size={16}>{T.snaps.filter((s) => f >= s).length} / 8 steps</Mono>
        </div>
      </Panel>
      {STEPS.map((s, i) => {
        const k = pop(f, T.snaps[i] - 10, 13, 210, 0.6);
        const snapped = f >= T.snaps[i];
        const x = 120 + i * (BW + GAP);
        const done = prog * 4 > i + 0.85;
        const runLit = f >= T.run && prog * 4 > i && prog * 4 < i + 1.2;
        const sf = pulse(f, T.snaps[i], 7);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: 380,
              width: BW,
              height: 150,
              borderRadius: 9,
              background: runLit ? '#2d2724' : C.panel,
              border: `${snapped ? 2 : 1}px solid ${done ? C.success : snapped ? alpha(K, 0.7 + 0.3 * sf) : C.line}`,
              boxShadow: `0 24px 60px rgba(0,0,0,0.5)${sf > 0.02 ? `, 0 0 ${40 * sf}px ${alpha(K, 0.6 * sf)}` : ''}`,
              opacity: Math.min(1, k * 1.5),
              translate: `${(1 - k) * 0}px ${(1 - k) * 120}px`,
              rotate: `${(1 - k) * (i % 2 ? 6 : -6)}deg`,
            }}
          >
            <div style={{position: 'absolute', left: 20, top: 18, fontFamily: MONO, fontWeight: 700, fontSize: 18, color: K}}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{position: 'absolute', left: 20, top: 52, fontFamily: FONT, fontWeight: 600, fontSize: 30, color: C.text}}>{s.name}</div>
            <div style={{position: 'absolute', left: 20, top: 96, fontFamily: FONT, fontSize: 19, color: C.muted}}>{s.sum}</div>
            {done ? (
              <div style={{position: 'absolute', right: 16, top: 14}}>
                <Check size={30} color={C.success} draw={lerp(f, T.run + (i + 0.85) * 6, T.run + (i + 0.85) * 6 + 6)} />
              </div>
            ) : null}
            {i < 3 ? (
              <div style={{position: 'absolute', left: BW - 2, top: 60, width: GAP + 4, height: 30, opacity: snapped && f >= T.snaps[i + 1] ? 1 : 0}}>
                <div style={{position: 'absolute', left: 0, right: 0, top: 13, height: 4, borderRadius: 2, background: lock > 0 ? C.amber : C.line, boxShadow: lp > 0.02 ? `0 0 ${20 * lp}px ${C.amber}` : undefined}} />
                <div style={{position: 'absolute', left: (GAP + 4) / 2 - 12, top: 3, width: 24, height: 24, borderRadius: 6, background: lock > 0 ? C.amber : C.raised, border: `1px solid ${lock > 0 ? C.amber : C.line}`, scale: `${0.8 + 0.4 * lp}`}}>
                  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={lock > 0 ? C.onAmber : C.muted} strokeWidth={2.2} strokeLinecap="round">
                    <rect x={6.5} y={11} width={11} height={8} rx={1.5} />
                    <path d={lock > 0.5 ? 'M9 11V8.5a3 3 0 016 0V11' : 'M9 11V8.5a3 3 0 016 0'} />
                  </svg>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 120, top: 586, display: 'flex', alignItems: 'center', gap: 24, opacity: lerp(f, T.lock, T.lock + 12)}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: 60,
            padding: '0 26px',
            borderRadius: 6,
            background: C.amber,
            color: C.onAmber,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 24,
            scale: `${1 - 0.06 * press}`,
            boxShadow: `0 0 ${30 * press}px ${alpha(C.amber, 0.7)}`,
          }}
        >
          <PlayIcon size={20} /> Run workflow on PC
        </div>
        <Mono size={17}>One source passes through 1–8 steps in order · originals and intermediate results are preserved</Mono>
      </div>
      <div style={{position: 'absolute', left: 120, top: 680, opacity: lerp(f, T.done, T.done + 10)}}>
        <span style={{fontFamily: FONT, fontWeight: 700, fontSize: 50, letterSpacing: '-0.03em', color: C.text}}>Save the steps. Run them together.</span>
      </div>
    </div>
  );
};

// ---------- Styled Captions ----------
const WORDS = ['Get', 'to', 'a', 'first', 'cut', 'faster.'];
const STYLES = ['Clean', 'Pop', 'Focus'] as const;
const Captions: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.captions, T.captions + 14);
  const o = 1 - lerp(f, T.exit, T.exit + 14, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  const si = T.styles.filter((s) => f >= s).length - 1;
  const st = si < 0 ? 0 : si;
  const t0 = T.styles[st];
  const sp = pulse(f, t0, 8);
  const FR = {x: 120, y: 175, w: 1060, h: 596};
  return (
    <div style={{position: 'absolute', inset: 0, opacity: a * o}}>
      <div style={{position: 'absolute', left: FR.x, top: FR.y, width: FR.w, height: FR.h, borderRadius: 9, overflow: 'hidden', border: `1px solid ${C.line}`, boxShadow: '0 30px 80px rgba(0,0,0,0.55)', translate: `0px ${(1 - a) * 30}px`}}>
        <CamScene cam="B" w={FR.w} h={FR.h} f={300} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, background: 'linear-gradient(transparent, rgba(0,0,0,0.55))'}} />
        <div style={{position: 'absolute', left: 16, top: 14}}>
          <Chip tone="raised" mono style={{background: 'rgba(16,18,17,0.75)'}}>
            BURN-IN PREVIEW
          </Chip>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 56, display: 'flex', justifyContent: 'center', gap: 24}}>
          {si >= 0
            ? WORDS.map((w, i) => {
                const at = t0 + 2 + i * 4;
                const base: React.CSSProperties = {display: 'inline-block', fontFamily: FONT, fontWeight: 700, fontSize: 60, color: '#fff', letterSpacing: '-0.01em', textShadow: '0 3px 14px rgba(0,0,0,0.85)'};
                if (st === 0) {
                  const k = lerp(f, at, at + 10);
                  return (
                    <span key={i} style={{...base, fontWeight: 600, opacity: k, translate: `0px ${(1 - k) * 14}px`}}>
                      {w}
                    </span>
                  );
                }
                if (st === 1) {
                  const k = pop(f, at, 9, 260, 0.6);
                  return (
                    <span key={i} style={{...base, fontWeight: 800, opacity: Math.min(1, k * 2), scale: `${0.3 + 0.7 * k}`, color: i === WORDS.length - 1 ? K : '#fff'}}>
                      {w}
                    </span>
                  );
                }
                const cur = Math.min(WORDS.length - 1, Math.max(0, Math.floor((f - t0 - 2) / 6)));
                const on = i === cur;
                return (
                  <span key={i} style={{...base, opacity: on ? 1 : 0.42, padding: '0 10px', borderRadius: 8, background: on ? alpha(K, 0.85) : 'transparent', color: on ? '#1d1110' : '#fff', textShadow: on ? 'none' : base.textShadow}}>
                    {w}
                  </span>
                );
              })
            : null}
        </div>
      </div>
      <Panel x={1220} y={175} w={580} h={420} glow={K} style={{translate: `${(1 - a) * 40}px 0px`}}>
        <div style={{position: 'absolute', left: 24, top: 20, fontFamily: FONT, fontWeight: 600, fontSize: 24, color: C.text}}>Caption template</div>
        {STYLES.map((s, i) => {
          const on = si === i;
          const k = on ? sp : 0;
          return (
            <div key={s} style={{position: 'absolute', left: 20, right: 20, top: 74 + i * 84, height: 70, borderRadius: 6, background: on ? alpha(C.amber, 0.14) : C.raised, border: `${on ? 2 : 1}px solid ${on ? C.amber : C.line}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px', scale: `${1 + 0.03 * k}`}}>
              <div style={{width: 20, height: 20, borderRadius: 10, border: `2px solid ${on ? C.amber : C.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {on ? <div style={{width: 10, height: 10, borderRadius: 5, background: C.amber}} /> : null}
              </div>
              <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 26, color: on ? C.text : C.muted}}>{s}</span>
              <span style={{flex: 1}} />
              <Mono size={14}>{['soft fade', 'word pop', 'active word'][i]}</Mono>
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 20, right: 20, bottom: 20, display: 'flex', gap: 10}}>
          <Chip mono>SRT</Chip>
          <Chip mono>ASS</Chip>
          <span style={{flex: 1}} />
          <Chip tone="amber">Burn in</Chip>
        </div>
      </Panel>
      <div style={{position: 'absolute', left: 1220, top: 630, width: 580}}>
        <span style={{fontFamily: FONT, fontWeight: 700, fontSize: 44, letterSpacing: '-0.03em', color: C.text, lineHeight: 1.1}}>Clean. Pop. Focus.</span>
        <div style={{marginTop: 12}}>
          <Mono size={16}>built-in cue animation, rendered into the video</Mono>
        </div>
      </div>
    </div>
  );
};

// ---------- the fixation dot (exit) ----------
const Dot: React.FC<{f: number}> = ({f}) => {
  if (f < T.dot - 6) return null;
  const k = pop(f, T.dot - 6, 12, 200, 0.6);
  const p = pulse(f, T.dot, 14);
  return (
    <>
      <div style={{position: 'absolute', left: 960 - 90, top: 540 - 90, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(C.focus, 0.35 * k + 0.3 * p)} 0%, transparent 65%)`}} />
      <div style={{position: 'absolute', left: 960 - 9, top: 540 - 9, width: 18, height: 18, borderRadius: 9, background: C.focus, scale: `${0.4 + 0.6 * k}`}} />
    </>
  );
};

// ---------- world ----------
export const World: React.FC = () => {
  const f = useWorldFrame();
  const drop = lerp(f, T.drop[0], T.drop[1], 0, 1, IN_OUT);
  const tool = (at: number, out: number, text: string) => <ToolLabel f={f} at={at} out={out} text={text} accent={K} />;
  const bg = lerp(f, 6, 30) * (1 - lerp(f, T.exit + 6, T.dot, 0, 1, IN_OUT));
  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundImage: `linear-gradient(90deg, ${alpha(K, 0.05)} 1px, transparent 1px)`, backgroundSize: '120px 100%', backgroundPosition: `${-f * 0.6}px 0px`, opacity: 0.9 * bg}} />
      <AbsoluteFill style={{background: `radial-gradient(70% 60% at 55% 40%, ${alpha(K, 0.08)} 0%, transparent 70%)`, opacity: bg}} />
      {/* entrance: Library's aligned timeline (identical picture across the cut), dropping to the program track */}
      {f < T.drop[1] + 2 ? (
        <div style={{position: 'absolute', inset: 0, translate: `0px ${300 * drop}px`, opacity: 1 - lerp(f, T.drop[1] - 4, T.drop[1] + 2)}}>
          <HandoffTimeline color={handoffColor(f)} chrome={1 - drop} rows={[1 - drop, 1, 1 - drop]} />
        </div>
      ) : null}
      <ProgramTrack f={f} />
      <WorldTitle f={f} index={9} name="EDIT ROOM" promise="Get to a first cut faster." accent={K} x={120} y={200} out={T.titleOut} size={128} />
      <Beta f={f} />
      <BetaText f={f} />
      {tool(T.director, T.silence, 'CAMERA DIRECTOR')}
      <Director f={f} />
      {tool(T.silence, T.launcher, 'SILENCE ROUGH CUT')}
      <Silence f={f} />
      {tool(T.launcher, T.captions, 'COMMAND LAUNCHER')}
      <Launcher f={f} />
      {tool(T.captions, T.exit + 4, 'STYLED CAPTIONS')}
      <Captions f={f} />
      <Dot f={f} />
    </AbsoluteFill>
  );
};
