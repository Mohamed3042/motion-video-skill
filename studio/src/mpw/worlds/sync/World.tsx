// World 2 · SYNC (amber, the hero). Four camera tracks of noisy audio; each carries a quarter of the strokes of a
// hidden word. They lock one by one (reference, coarse chunk vote, fine window, drift) and on the last lock the
// stacked peaks read IN SYNC. A one-beat nudge dissolves and re-forms it; the day zooms out into sync groups in
// shooting order with one weak clip flagged; then the aligned tracks become Review's four camera tiles.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO, RADIUS} from '../../brand';
import {useWorldFrame} from '../../frame';
import {mulberry32} from '../../timing';
import {Arrow, Check, Glow, clamp, ease, mix, mixHex, prog, rgba, smooth, sp} from './kit';
import {Lanes, MUTED, TRACKS, type LaneState} from './Lanes';
import {LaneArt} from './LaneArt';
import {NUDGE_PX, T, offsetPx} from './timing';
import {LANE, LANE_W, STACK_H, clipStart, laneY} from './word';

const AMBER = ACCENT.sync;

const SAGE = C.success;
const STEEL = '#8fc1d4';
const imp = (f: number, at: number, tau = 10) => (f >= at ? Math.exp(-(f - at) / tau) : 0);

// ---------------------------------------------------------------- title ----
const Title: React.FC<{f: number}> = ({f}) => {
  if (f > 124) return null;
  const out = ease.cubicIn(prog(f, 96, 118));
  const idx = ease.expoOut(prog(f, 0, 16));
  const prom = ease.expoOut(prog(f, 22, 46));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: 1 - out, transform: `translateY(${-28 * out}px)`}}>
      <div style={{position: 'absolute', left: 122, top: 142, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: '0.32em', color: AMBER, opacity: idx, whiteSpace: 'nowrap'}}>
        02 / 11
      </div>
      <div style={{position: 'absolute', left: 116, top: 166, display: 'flex', fontFamily: FONT, fontWeight: 800, fontSize: 118, lineHeight: 1, letterSpacing: '-0.035em', color: C.text}}>
        {'SYNC'.split('').map((ch, i) => {
          const s = sp(f, 4 + i * 3, {damping: 13, stiffness: 190, mass: 0.7});
          return (
            <span key={i} style={{display: 'inline-block', opacity: clamp(s * 3), transform: `translateY(${(1 - s) * 60}px)`}}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 122, top: 296, fontFamily: FONT, fontWeight: 500, fontSize: 30, color: C.muted, opacity: prom, transform: `translateY(${(1 - prom) * 14}px)`, whiteSpace: 'nowrap'}}>
        Matched by <span style={{color: AMBER, fontWeight: 650}}>the sound they recorded.</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- engine panels ----
const Kicker: React.FC<{label: string; lines: React.ReactNode[]; o: number}> = ({label, lines, o}) => (
  <div style={{position: 'absolute', left: 122, top: 150, opacity: o, transform: `translateY(${(1 - o) * 12}px)`}}>
    <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.32em', color: AMBER, whiteSpace: 'nowrap'}}>{label}</div>
    {lines.map((l, i) => (
      <div key={i} style={{fontFamily: FONT, fontWeight: 650, fontSize: 34, lineHeight: '42px', color: i ? C.muted : C.text, marginTop: i ? 0 : 14, whiteSpace: 'nowrap'}}>
        {l}
      </div>
    ))}
  </div>
);
const win = (f: number, a: number, b: number, fade = 12) => ease.cubicOut(prog(f, a, a + fade)) * (1 - ease.cubicIn(prog(f, b - fade, b)));

// screen x of a clip-local x on lane i (zoom 1)
const sx = (i: number, lx: number, f: number) => LANE.x0 + lx + offsetPx(i, f);

// COARSE: 60 s chunks of C2 cast votes into an offset histogram; the tallest cluster wins.
const HB = {x0: 880, x1: 1790, base: 318, n: 23};
const binX = (b: number) => HB.x0 + ((b + 0.5) * (HB.x1 - HB.x0)) / HB.n;
const VOTE_BIN = [14, 14, 5, 14, 15, 14, 19, 13, 14, 14];
const CHUNK = 120;
const CH0 = 40; // clip-local x of the first chunk (keeps all ten inside the visible lane)
const CL = 3; // the coarse beat votes on the ZOOM recorder
const Coarse: React.FC<{f: number}> = ({f}) => {
  const o = win(f, 116, 244, 14);
  if (o <= 0) return null;
  const counts = new Map<number, number>();
  const won = ease.expoOut(prog(f, T.win, T.win + 14));
  return (
    <>
      <Kicker label="COARSE" lines={['60 s chunks cast votes.', 'The largest cluster wins.']} o={o} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o}}>
        {/* axis */}
        <div style={{position: 'absolute', left: HB.x0, top: HB.base, width: HB.x1 - HB.x0, height: 1.5, background: rgba(C.text, 0.35)}} />
        {Array.from({length: HB.n + 1}, (_, b) => (
          <div key={b} style={{position: 'absolute', left: HB.x0 + (b * (HB.x1 - HB.x0)) / HB.n, top: HB.base + 3, width: 1, height: b % 5 ? 5 : 9, background: rgba(C.text, 0.3)}} />
        ))}
        <div style={{position: 'absolute', left: HB.x1 - 160, top: HB.base + 8, width: 160, textAlign: 'right', fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em', color: C.muted}}>OFFSET</div>
        <div style={{position: 'absolute', left: HB.x0, top: HB.base + 8, fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em', color: C.muted}}>VOTES</div>
        {/* winning cluster */}
        <Glow x={binX(14)} y={HB.base - 50} w={260} h={170} color={AMBER} opacity={0.55 * won} />
        <div
          style={{
            position: 'absolute',
            left: binX(13) - 15,
            top: HB.base - 128,
            width: binX(15) - binX(13) + 30,
            height: 122,
            borderRadius: RADIUS.control,
            border: `1.5px solid ${rgba(AMBER, 0.9 * won)}`,
          }}
        />
        <div style={{position: 'absolute', left: binX(15) + 26, top: HB.base - 126, fontFamily: MONO, fontWeight: 700, fontSize: 13, letterSpacing: '0.2em', color: AMBER, opacity: won, whiteSpace: 'nowrap'}}>
          LARGEST CLUSTER
        </div>
        {/* votes */}
        {T.votes.map((land, k) => {
          const b = VOTE_BIN[k];
          const n = counts.get(b) ?? 0;
          counts.set(b, n + 1);
          const t0 = land - 11;
          if (f < t0 - 6) return null;
          const u = ease.inOut(prog(f, t0, land));
          const cx = sx(CL, CH0 + k * CHUNK + CHUNK / 2, Math.min(f, land));
          const fromY = laneY(CL) + LANE.h / 2;
          const toX = binX(b);
          const toY = HB.base - 10 - n * 17;
          const x = mix(cx, toX, u);
          const y = mix(fromY, toY, u) - Math.sin(Math.PI * u) * 70;
          const landed = f >= land;
          const hot = landed ? imp(f, land, 8) : 0;
          const inWin = VOTE_BIN[k] >= 13 && VOTE_BIN[k] <= 15;
          const col = inWin ? AMBER : MUTED;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: x - 16,
                top: y - 7,
                width: 32,
                height: 14,
                borderRadius: 2,
                background: landed ? mixHex(col, '#fff4d6', hot) : rgba(AMBER, 0.95),
                boxShadow: landed && hot > 0.05 ? `0 0 ${18 * hot}px ${rgba(AMBER, 0.8 * hot)}` : 'none',
                opacity: clamp((f - (t0 - 6)) / 6) * (landed && !inWin ? mix(1, 0.55, won) : 1),
              }}
            />
          );
        })}
        {/* chunk grid on C2 + the chunk that is voting */}
        {Array.from({length: 11}, (_, k) => {
          const lx = CH0 + k * CHUNK;
          const x = sx(CL, lx, f);
          if (x < LANE.x0 + 2 || x > LANE.x1 - 2) return null;
          return <div key={k} style={{position: 'absolute', left: x, top: laneY(CL) + 6, width: 0, height: LANE.h - 12, borderLeft: `1.5px dashed ${rgba(C.text, 0.28)}`}} />;
        })}
        {T.votes.map((land, k) => {
          const a = prog(f, land - 14, land - 10) * (1 - prog(f, land - 2, land + 6));
          if (a <= 0) return null;
          const x = sx(CL, CH0 + k * CHUNK, f);
          return (
            <div key={k} style={{position: 'absolute', left: x, top: laneY(CL) + 2, width: CHUNK, height: LANE.h - 4, borderRadius: 5, border: `2px solid ${rgba(AMBER, 0.9 * a)}`, background: rgba(AMBER, 0.1 * a)}}>
              <div style={{position: 'absolute', left: 8, top: 6, fontFamily: MONO, fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', color: AMBER}}>60 s</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// FINE: four short windows on C3, one magnified; the cross-correlation peak is refined between samples.
const WINS = [170, 520, 870, 1220];
const WIN_W = 96;
const ZP = {x: 880, y: 146, w: 600, h: 176};
const CP = {x: 1510, y: 146, w: 280, h: 176};
const sampleWave = (seed: number) => {
  const r = mulberry32(seed);
  const pts: number[] = [];
  let v = 0;
  for (let k = 0; k < 90; k++) {
    v = v * 0.55 + (r() * 2 - 1) * 0.9;
    pts.push(Math.sin(k * 0.55) * 0.55 * Math.sin(k * 0.071 + 1) + v * 0.6);
  }
  return pts;
};
const REF_WAVE = sampleWave(3131);
const Fine: React.FC<{f: number}> = ({f}) => {
  const o = win(f, 236, 362, 14);
  if (o <= 0) return null;
  const active = T.windows.reduce((a, w, k) => (f >= w ? k : a), -1);
  const shift = 34 * (1 - ease.inOut(prog(f, 288, 332))); // px of residual lag in the magnified window
  const aligned = prog(f, 326, 336);
  const pk = ease.expoOut(prog(f, T.peak, T.peak + 12));
  const toPts = (sh: number, amp: number) =>
    REF_WAVE.map((v, k) => {
      const x = ZP.x + 20 + k * 6.6 + sh;
      return `${x.toFixed(1)},${(ZP.y + ZP.h / 2 + v * amp).toFixed(1)}`;
    }).join(' ');
  const wx = active >= 0 ? sx(2, WINS[active], f) : 0;
  // correlation lollipops around the peak (sub-sample vertex between bars 3 and 4)
  const LOL = [0.18, 0.31, 0.56, 0.93, 0.82, 0.42, 0.22];
  const lx = (k: number) => CP.x + 34 + k * 34;
  const ly = (v: number) => CP.y + CP.h - 26 - v * 112;
  const vx = lx(3) + 0.34 * 34;
  return (
    <>
      <Kicker label="FINE" lines={['Short windows, matched closely.', 'Refined between samples.']} o={o} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o}}>
        {/* window brackets on C3 */}
        {WINS.map((lxw, k) => {
          const x = sx(2, lxw, f);
          const on = f >= T.windows[k] ? 1 : 0.35;
          const hot = imp(f, T.windows[k], 9);
          return (
            <div key={k} style={{position: 'absolute', left: x, top: laneY(2) - 3, width: WIN_W, height: LANE.h + 6, borderRadius: 6, border: `2px solid ${rgba(AMBER, on)}`, background: rgba(AMBER, 0.06 + 0.22 * hot), opacity: prog(f, 244 + k * 4, 252 + k * 4)}}>
              <div style={{position: 'absolute', left: 6, top: -22, fontFamily: MONO, fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', color: AMBER, opacity: on}}>W{k + 1}</div>
            </div>
          );
        })}
        {/* magnifier rays from the active window */}
        {active >= 0 ? (
          <svg style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'visible'}}>
            <path d={`M${wx} ${laneY(2) - 3} L${ZP.x} ${ZP.y + ZP.h} M${wx + WIN_W} ${laneY(2) - 3} L${ZP.x + ZP.w} ${ZP.y + ZP.h}`} stroke={rgba(AMBER, 0.35)} strokeWidth={1.2} fill="none" />
          </svg>
        ) : null}
        {/* zoom panel */}
        <div style={{position: 'absolute', left: ZP.x, top: ZP.y, width: ZP.w, height: ZP.h, borderRadius: RADIUS.dialog, background: '#141816', border: `1px solid ${rgba(AMBER, 0.45)}`, overflow: 'hidden'}} />
        <div style={{position: 'absolute', left: ZP.x + 14, top: ZP.y + 10, fontFamily: MONO, fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', color: C.muted}}>
          W{Math.max(1, active + 1)} · C1 / C3 · SAMPLE LEVEL
        </div>
        <svg style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'visible'}}>
          <defs>
            <clipPath id="zp">
              <rect x={ZP.x + 2} y={ZP.y + 2} width={ZP.w - 4} height={ZP.h - 4} rx={8} />
            </clipPath>
          </defs>
          <g clipPath="url(#zp)">
            {Array.from({length: 22}, (_, k) => (
              <line key={k} x1={ZP.x + 20 + k * 26.4} y1={ZP.y + 30} x2={ZP.x + 20 + k * 26.4} y2={ZP.y + ZP.h - 10} stroke={rgba(C.text, 0.06)} />
            ))}
            <polyline points={toPts(0, 46)} fill="none" stroke={AMBER} strokeWidth={2.4} strokeLinejoin="round" />
            <polyline points={toPts(shift, 46)} fill="none" stroke={mixHex(STEEL, AMBER, aligned)} strokeOpacity={0.9} strokeWidth={2} strokeDasharray={aligned > 0.5 ? undefined : '5 4'} strokeLinejoin="round" />
          </g>
        </svg>
        {/* correlation peak panel */}
        <div style={{position: 'absolute', left: CP.x, top: CP.y, width: CP.w, height: CP.h, borderRadius: RADIUS.dialog, background: '#141816', border: `1px solid ${C.line}`}} />
        <div style={{position: 'absolute', left: CP.x + 14, top: CP.y + 10, fontFamily: MONO, fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', color: C.muted}}>CORRELATION</div>
        <svg style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'visible'}}>
          <line x1={CP.x + 18} y1={ly(0)} x2={CP.x + CP.w - 18} y2={ly(0)} stroke={rgba(C.text, 0.3)} />
          {LOL.map((v, k) => {
            const a = prog(f, 300 + k * 2, 306 + k * 2);
            return (
              <g key={k} opacity={a}>
                <line x1={lx(k)} y1={ly(0)} x2={lx(k)} y2={ly(v * a)} stroke={k >= 2 && k <= 4 ? AMBER : MUTED} strokeWidth={2} />
                <circle cx={lx(k)} cy={ly(v * a)} r={4} fill={k >= 2 && k <= 4 ? AMBER : MUTED} />
              </g>
            );
          })}
          {/* parabola through the top three */}
          <path
            d={Array.from({length: 41}, (_, k) => {
              const x = lx(1.6) + (k / 40) * (lx(5.4) - lx(1.6));
              const u = (x - vx) / 34;
              const v = 0.985 - 0.36 * u * u;
              return `${k ? 'L' : 'M'}${x.toFixed(1)} ${ly(v).toFixed(1)}`;
            }).join('')}
            fill="none"
            stroke={AMBER}
            strokeWidth={2}
            strokeDasharray={260}
            strokeDashoffset={260 * (1 - pk)}
            opacity={0.9}
          />
          <line x1={vx} y1={ly(0)} x2={vx} y2={ly(0.985)} stroke={rgba('#fff4d6', 0.9 * pk)} strokeWidth={1.5} strokeDasharray="3 3" />
          <rect x={vx - 6} y={ly(0.985) - 6} width={12} height={12} transform={`rotate(45 ${vx} ${ly(0.985)})`} fill="#fff4d6" opacity={pk} />
        </svg>
        <div style={{position: 'absolute', left: vx - 80, width: 160, textAlign: 'center', top: ly(0) + 6, fontFamily: MONO, fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', color: '#fff4d6', opacity: pk, whiteSpace: 'nowrap'}}>
          SUB-SAMPLE PEAK
        </div>
      </div>
    </>
  );
};

// DRIFT: offsets measured along the recording sit on a gently sloped line. Measured and reported, not corrected.
const DP = {x0: 880, x1: 1790, y0: 154, y1: 318};
const DOTS = (() => {
  const r = mulberry32(777);
  return Array.from({length: 14}, (_, k) => ({u: (k + 0.5) / 14, j: (r() - 0.5) * 12}));
})();
const driftY = (u: number) => mix(DP.y1 - 44, DP.y0 + 46, u);
const Drift: React.FC<{f: number}> = ({f}) => {
  const o = win(f, 356, 476, 14);
  if (o <= 0) return null;
  const line = ease.inOut(prog(f, T.drift - 22, T.drift));
  const lane = 0.5 * ease.cubicOut(prog(f, T.drift - 6, T.drift + 20));
  const y3 = laneY(1);
  return (
    <>
      <Kicker label="DRIFT" lines={['Clock drift:', 'measured and reported.']} o={o} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o}}>
        <div style={{position: 'absolute', left: DP.x0, top: DP.y1, width: DP.x1 - DP.x0, height: 1.5, background: rgba(C.text, 0.35)}} />
        <div style={{position: 'absolute', left: DP.x0, top: DP.y0, width: 1.5, height: DP.y1 - DP.y0, background: rgba(C.text, 0.2)}} />
        <div style={{position: 'absolute', left: DP.x1 - 260, top: DP.y1 + 8, width: 260, textAlign: 'right', fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em', color: C.muted}}>TIME IN CLIP</div>
        <div style={{position: 'absolute', left: DP.x0 + 12, top: DP.y0 - 2, fontFamily: MONO, fontSize: 12, letterSpacing: '0.18em', color: C.muted}}>OFFSET · C2 vs C1</div>
        <svg style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'visible'}}>
          {DOTS.map((d, k) => {
            const a = prog(f, 362 + k * 1.5, 368 + k * 1.5);
            const x = mix(DP.x0 + 30, DP.x1 - 30, d.u);
            return <circle key={k} cx={x} cy={driftY(d.u) + d.j} r={4.5} fill={AMBER} opacity={0.85 * a} />;
          })}
          <line
            x1={DP.x0 + 10}
            y1={driftY(-0.02)}
            x2={mix(DP.x0 + 10, DP.x1 - 10, line)}
            y2={mix(driftY(-0.02), driftY(1.02), line)}
            stroke="#fff4d6"
            strokeWidth={2}
            opacity={0.9}
          />
          {/* the faint sloped line echoed over the ZOOM track */}
          <line x1={LANE.x0} y1={y3 + 76} x2={mix(LANE.x0, LANE.x1, line)} y2={y3 + 76 - 38 * line} stroke={AMBER} strokeWidth={1.5} strokeDasharray="7 6" opacity={lane * (1 - prog(f, 452, 474))} />
        </svg>
      </div>
    </>
  );
};

// ---------------------------------------------------------------- nudge control ----
const Nudge: React.FC<{f: number}> = ({f}) => {
  const o = win(f, 532, 628, 12);
  if (o <= 0) return null;
  const plus = Math.sin(Math.PI * prog(f, T.nudge - 3, T.nudge + 7));
  const minus = Math.sin(Math.PI * prog(f, T.back - 11, T.back - 1));
  const val = f >= T.nudge && f < T.back - 8 ? '+1 ms' : '0 ms';
  const btn = (label: string, p: number): React.CSSProperties => ({
    width: 44,
    height: 40,
    borderRadius: RADIUS.control,
    background: p > 0.05 ? mixHex(C.raised, AMBER, p) : C.raised,
    border: `1px solid ${C.line}`,
    color: p > 0.5 ? C.onAmber : C.text,
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: `scale(${1 - 0.08 * p})`,
  });
  return (
    <div style={{position: 'absolute', left: 1468, top: 846, opacity: o, transform: `translateY(${(1 - o) * 10}px)`}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.22em', color: C.muted, marginBottom: 8, whiteSpace: 'nowrap'}}>MANUAL OFFSET · C3</div>
      <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
        <div style={btn('-', minus)}>−</div>
        <div style={{width: 148, height: 40, borderRadius: RADIUS.control, background: '#141816', border: `1px solid ${val === '0 ms' ? C.line : AMBER}`, display: 'flex', alignItems: 'center', paddingLeft: 14, fontFamily: MONO, fontWeight: 700, fontSize: 18, color: val === '0 ms' ? C.text : AMBER}}>
          {val}
        </div>
        <div style={btn('+', plus)}>+</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- sync groups ----
type Clip = {lane: number; a: number; b: number};
const GROUPS: {name: string; color: string; clips: Clip[]}[] = [
  {name: 'G1 · Episode 1', color: AMBER, clips: [{lane: 0, a: 6, b: 446}, {lane: 1, a: 30, b: 453}, {lane: 2, a: 0, b: 420}, {lane: 3, a: 52, b: 440}]},
  {name: 'G2 · Episode 2', color: SAGE, clips: [{lane: 0, a: 498, b: 890}, {lane: 1, a: 520, b: 905}, {lane: 3, a: 506, b: 872}]},
  {name: 'G3 · Episode 3', color: STEEL, clips: [{lane: 0, a: 952, b: 1470}, {lane: 1, a: 946, b: 1496}, {lane: 2, a: 982, b: 1462}, {lane: 3, a: 1004, b: 1430}]},
];
const miniBars = (seed: number, w: number) => {
  const r = mulberry32(seed);
  let d = '';
  for (let x = 6; x < w - 4; x += 4) {
    const env = 0.35 + 0.65 * Math.abs(Math.sin(x / 37 + seed) * Math.sin(x / 13));
    const h = 3 + 26 * env * (0.5 + 0.5 * r());
    d += `M${x} ${-h}V${h}`;
  }
  return d;
};
const MINI = GROUPS.map((g, gi) => g.clips.map((c) => miniBars(gi * 31 + c.lane * 7 + 5, c.b - c.a)));

const Groups: React.FC<{f: number; vis: number}> = ({f, vis}) => {
  if (vis <= 0) return null;
  const head = ease.expoOut(prog(f, T.groups[0] - 10, T.groups[0] + 14));
  const review = ease.expoOut(prog(f, T.review, T.review + 14));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: vis}}>
      <div style={{position: 'absolute', left: 122, top: 150, opacity: head, transform: `translateY(${(1 - head) * 12}px)`}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.32em', color: AMBER}}>SYNC GROUPS</div>
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 52, lineHeight: '60px', marginTop: 12, color: C.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>
          Every session. Every camera. <span style={{color: AMBER}}>In order.</span>
        </div>
      </div>
      {GROUPS.map((g, gi) => {
        const land = T.groups[gi];
        const gx = LANE.x0 + Math.min(...g.clips.map((c) => c.a));
        const m = ease.expoOut(prog(f, land - 4, land + 10));
        return (
          <React.Fragment key={gi}>
            {/* sequence marker */}
            <div style={{position: 'absolute', left: gx, top: 326, opacity: m, transform: `translateY(${(1 - m) * -10}px)`, display: 'flex', alignItems: 'center', gap: 8}}>
              <svg width={14} height={26} viewBox="0 0 14 26" style={{display: 'block'}}>
                <path d="M1 1 H13 V12 L7 18 L1 12 Z" fill={g.color} />
                <line x1={7} y1={18} x2={7} y2={26} stroke={g.color} strokeWidth={2} />
              </svg>
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', color: g.color, whiteSpace: 'nowrap', marginTop: -8}}>{g.name}</div>
            </div>
            {g.clips.map((c, j) => {
              const at = land - (3 - c.lane) * 3 - 2;
              const s = gi === 0 ? 1 : sp(f, at - 8, {damping: 15, stiffness: 210, mass: 0.7});
              const flagged = gi === 2 && c.lane === 3;
              const y = laneY(c.lane);
              const col = flagged ? mixHex(g.color, MUTED, 0.5 * review) : g.color;
              const outline = gi === 0 ? ease.expoOut(prog(f, land - 6, land + 8)) : 1;
              return (
                <div
                  key={j}
                  style={{
                    position: 'absolute',
                    left: LANE.x0 + c.a,
                    top: y + 6,
                    width: c.b - c.a,
                    height: LANE.h - 12,
                    opacity: clamp(s * 2),
                    transform: `translateY(${(1 - s) * -60}px)`,
                  }}
                >
                  <div style={{position: 'absolute', inset: 0, borderRadius: 6, background: rgba(col, 0.13), border: `1.5px solid ${rgba(col, 0.75 * outline)}`}} />
                  <svg style={{position: 'absolute', left: 0, top: (LANE.h - 12) / 2 + 6, width: 1, height: 1, overflow: 'visible'}}>
                    <path d={MINI[gi][j]} stroke={col} strokeOpacity={0.62} strokeWidth={2} strokeLinecap="round" />
                  </svg>
                  <div style={{position: 'absolute', left: 10, top: 6, fontFamily: MONO, fontWeight: 700, fontSize: 11, color: rgba(C.text, 0.8), whiteSpace: 'nowrap'}}>
                    {TRACKS[c.lane].name}_{String(12 + gi * 9 + c.lane).padStart(4, '0')}
                  </div>
                  {flagged ? (
                    <svg style={{position: 'absolute', left: -5, top: -5, width: c.b - c.a + 10, height: LANE.h - 2, overflow: 'visible'}}>
                      <rect x={1} y={1} width={c.b - c.a + 8} height={LANE.h - 4} rx={8} fill="none" stroke={AMBER} strokeWidth={2.5} strokeDasharray="10 7" strokeDashoffset={-f * 0.8} opacity={review} />
                    </svg>
                  ) : null}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
      {/* shooting order */}
      <div style={{position: 'absolute', left: 1560, top: 296, display: 'flex', alignItems: 'center', gap: 10, opacity: ease.expoOut(prog(f, T.groups[2], T.groups[2] + 16))}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.22em', color: C.muted}}>SHOOTING ORDER</div>
        <Arrow size={22} color={C.muted} width={5} />
      </div>
      {/* needs review */}
      <div
        style={{
          position: 'absolute',
          left: LANE.x0 + 1004,
          top: laneY(3) + LANE.h + 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 38,
          padding: '0 16px',
          borderRadius: RADIUS.control,
          border: `1.5px solid ${AMBER}`,
          background: rgba(AMBER, 0.12),
          opacity: review,
          transform: `translateY(${(1 - review) * 10}px)`,
        }}
      >
        <div style={{width: 9, height: 9, borderRadius: 5, background: AMBER}} />
        <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 20, color: AMBER, whiteSpace: 'nowrap'}}>Needs review</div>
        <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 13, letterSpacing: '0.1em', color: C.muted, whiteSpace: 'nowrap'}}>weak match</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- exit: tracks → Review's 2×2 tiles ----
export const TILE = {x: 320, y: 172, w: 632, h: 356, gap: 16};
const BUST = [
  {x: 0.5, s: 0.82, light: 30},
  {x: 0.62, s: 1.12, light: 72},
  {x: 0.36, s: 0.98, light: 22},
  {x: 0.5, s: 1, light: 50},
];
const tileRect = (i: number) => ({x: TILE.x + (i % 2) * (TILE.w + TILE.gap), y: TILE.y + (i >> 1) * (TILE.h + TILE.gap), w: TILE.w, h: TILE.h});
const Tiles: React.FC<{f: number}> = ({f}) => {
  if (f < T.tiles) return null;
  const pic = ease.cubicOut(prog(f, T.tiles + 14, T.tiles + 46));
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const a = {x: LANE.x0, y: laneY(i), w: LANE_W, h: LANE.h};
        const b = tileRect(i);
        const st = ease.inOut(prog(f, T.tiles + i * 3, T.tiles + 34 + i * 3));
        const r = {x: mix(a.x, b.x, st), y: mix(a.y, b.y, st), w: mix(a.w, b.w, st), h: mix(a.h, b.h, st)};
        const s = r.w / LANE_W; // uniform scale of the waveform band
        const bandH = LANE.h * s;
        const bandY = mix(0, r.h - bandH - 10 * st, st);
        const audioOnly = i === 3; // the ZOOM recorder has no picture
        const bust = BUST[i];
        const barX = 200 + (f - T.tiles) * 15 - r.x; // one light bar in screen space: continuous across tiles
        return (
          <div key={i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: RADIUS.control, overflow: 'hidden', background: '#151917', border: `1.5px solid ${rgba(AMBER, mix(0.6, 0.85, st))}`}}>
            {/* camera picture (abstract) */}
            <div style={{position: 'absolute', inset: 0, opacity: pic}}>
              {audioOnly ? (
                <>
                  <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(90% 80% at 50% 40%, #1f2421 0%, #121513 100%)'}} />
                  <svg style={{position: 'absolute', left: r.w / 2 - 48, top: r.h * 0.36 - 48, width: 96, height: 96}} viewBox="0 0 64 64">
                    {[14, 24, 40, 24, 14].map((h, k) => (
                      <rect key={k} x={11 + k * 9} y={32 - h / 2} width={5} height={h} rx={2.5} fill={rgba(AMBER, 0.75)} />
                    ))}
                  </svg>
                </>
              ) : (
                <>
                  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(70% 80% at ${bust.light}% 26%, #3a3a30 0%, #23261f 38%, #141715 75%, #0e100f 100%)`}} />
                  <div style={{position: 'absolute', left: 0, right: 0, top: r.h * 0.72, bottom: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.5))'}} />
                  <svg style={{position: 'absolute', left: r.w * bust.x, top: r.h * 0.22, width: 1, height: 1, overflow: 'visible'}}>
                    <defs>
                      <linearGradient id={`bust${i}`} x1={bust.light < 50 ? 0 : 1} y1={0} x2={bust.light < 50 ? 1 : 0} y2={0.4}>
                        <stop offset="0" stopColor="#4a4a3c" />
                        <stop offset="0.45" stopColor="#262a25" />
                        <stop offset="1" stopColor="#181b19" />
                      </linearGradient>
                    </defs>
                    <g transform={`scale(${bust.s})`}>
                      <ellipse cx={0} cy={36} rx={33} ry={38} fill={`url(#bust${i})`} />
                      <path d="M-26 76 C-30 92 -36 100 -64 108 C-104 120 -118 150 -122 220 L122 220 C118 150 104 120 64 108 C36 100 30 92 26 76 Z" fill={`url(#bust${i})`} />
                    </g>
                  </svg>
                  {/* the light bar crosses the tiles as one motion: they share a clock */}
                  <div style={{position: 'absolute', left: barX, top: -60, width: 120, height: r.h + 120, transform: 'rotate(16deg)', background: `linear-gradient(90deg, ${rgba(AMBER, 0)} 0%, ${rgba(AMBER, 0.16)} 50%, ${rgba(AMBER, 0)} 100%)`}} />
                </>
              )}
              <div style={{position: 'absolute', left: 14, top: 12, fontFamily: MONO, fontWeight: 700, fontSize: 14, letterSpacing: '0.16em', color: AMBER}}>{audioOnly ? 'ZOOM · AUDIO' : TRACKS[i].name}</div>
              <div style={{position: 'absolute', right: 14, top: 12, fontFamily: MONO, fontWeight: 500, fontSize: 13, color: C.muted}}>00:12:04:{String(10 + Math.floor((f - T.tiles) / 2) % 50).padStart(2, '0')}</div>
            </div>
            {/* the track's waveform band, shrinking to the tile's audio strip */}
            <div style={{position: 'absolute', left: 0, top: bandY, width: LANE_W, height: LANE.h, transform: `scale(${s})`, transformOrigin: '0 0', opacity: mix(1, 0.75, st)}}>
              <LaneArt lane={i} color={AMBER} boost={1} />
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- world ----
export const World: React.FC = () => {
  const f = useWorldFrame();

  // lanes
  const groupIn = ease.inOut(prog(f, T.zoomOut - 6, T.zoomOut + 30));
  const groupOut = ease.inOut(prog(f, T.zoomIn, T.zoomIn + 34));
  const gm = groupIn * (1 - groupOut);
  const nudgeAmt = clamp(offsetPx(2, f) / NUDGE_PX) * (f > T.sync ? 1 : 0);
  const lanes: LaneState[] = [0, 1, 2, 3].map((i) => {
    const L = T.lock[i];
    const lk = ease.cubicOut(prog(f, L, L + 10));
    return {
      offset: offsetPx(i, f),
      color: mixHex(MUTED, AMBER, lk),
      lock: lk * (1 - (i === 2 ? 0.7 * nudgeAmt : 0)),
      flash: f >= L && f < L + 26 ? (f - L) / 26 : f >= T.back && f < T.back + 26 && i === 2 ? (f - T.back) / 26 : 0,
    };
  });
  const boost = ease.cubicOut(prog(f, T.sync, T.sync + 10)) * (1 - 0.7 * nudgeAmt);
  const lanesVis = 1 - prog(f, T.tiles, T.tiles + 1);
  const status = [0, 1, 2, 3].map((i) => (i === 0 ? 'REFERENCE' : i === 2 && nudgeAmt > 0.3 ? 'NUDGED +1 ms' : 'MATCHED'));

  // impacts
  const punch = 0.03 * imp(f, T.sync, 14) + 0.008 * (imp(f, T.lock[0], 8) + imp(f, T.lock[1], 8) + imp(f, T.lock[2], 8) + imp(f, T.back, 8));
  const syncGlow = f >= T.sync ? 0.9 * imp(f, T.sync, 26) + 0.32 : 0;
  const glowVis = (1 - gm) * (1 - nudgeAmt * 0.8) * (1 - prog(f, T.tiles, T.tiles + 20));
  const flash = imp(f, T.sync, 5);

  const ruler = (1 - gm) * (1 - prog(f, T.tiles, T.tiles + 16));
  const groupsResult = ease.cubicOut(prog(f, T.sync + 14, T.sync + 34)) * (1 - prog(f, T.zoomOut - 10, T.zoomOut));

  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      {/* atmosphere */}
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(70% 60% at 55% 58%, ${rgba(AMBER, 0.05)} 0%, rgba(0,0,0,0) 70%)`}} />
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + punch})`, transformOrigin: '1045px 596px'}}>
        <Glow x={LANE.x0 + LANE_W / 2} y={LANE.top + STACK_H / 2} w={1900} h={760} color={AMBER} opacity={syncGlow * glowVis * 0.55} />
        {/* ruler */}
        <div style={{position: 'absolute', left: LANE.x0, top: 342, width: LANE_W, height: 22, opacity: ruler * prog(f, 8, 26)}}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: rgba(C.text, 0.16)}} />
          {Array.from({length: 31}, (_, k) => (
            <div key={k} style={{position: 'absolute', left: k * 50, bottom: 0, width: 1, height: k % 5 ? 5 : 11, background: rgba(C.text, k % 5 ? 0.18 : 0.32)}} />
          ))}
          {Array.from({length: 7}, (_, k) => (
            <div key={k} style={{position: 'absolute', left: k * 250 + 6, top: -2, fontFamily: MONO, fontSize: 11, color: rgba(C.muted, 0.8)}}>
              00:12:0{4 + Math.floor(k / 2)}:{k % 2 ? '30' : '00'}
            </div>
          ))}
        </div>
        {lanesVis > 0 ? (
          <Lanes
            lanes={lanes}
            wordBoost={boost}
            zoom={mix(1, 0.3, gm)}
            contentOpacity={1 - smooth(prog(gm, 0.4, 0.85))}
            status={status}
          />
        ) : null}
        {/* reveal flash across the stack */}
        {flash > 0.02 && gm < 0.5 ? <div style={{position: 'absolute', left: LANE.x0, top: LANE.top, width: LANE_W, height: STACK_H, borderRadius: RADIUS.control, background: rgba('#fff4d6', 0.22 * flash)}} /> : null}
        <Groups f={f} vis={smooth(prog(gm, 0.3, 0.8))} />
        <Tiles f={f} />
      </div>
      <Title f={f} />
      <Coarse f={f} />
      <Fine f={f} />
      <Drift f={f} />
      {/* result line under the stack */}
      <div style={{position: 'absolute', left: LANE.x0, top: 852, display: 'flex', alignItems: 'center', gap: 12, opacity: groupsResult}}>
        <Check size={24} color={AMBER} p={ease.cubicOut(prog(f, T.sync + 14, T.sync + 30))} width={9} />
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.2em', color: AMBER, whiteSpace: 'nowrap'}}>
          {nudgeAmt > 0.3 ? 'C3 NUDGED · 3 OF 4 ALIGNED' : 'G1 · 4 OF 4 MATCHED BY SOUND'}
        </div>
      </div>
      <Nudge f={f} />
    </AbsoluteFill>
  );
};
