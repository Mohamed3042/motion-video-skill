// World 2 · CLONE LAB — "the endless staircase". A Penrose staircase whose four flights are the four tasks;
// an ice orb climbs it forever, one step per beat.
import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ACCENT, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {mulberry32} from '../../timing';
import {EXPO, EXPO_IN, IN_OUT, Letters, enter, mix, mixColor, pop, ramp} from '../myvoice/kit';
import {DEPTH, EDGE_LINE, FLIGHTS, K, P, PORTAL_SCALE, PORTAL_TX, PORTAL_TY, REPS, U, cellAt, treadCentre, type V2} from './geometry';
import {PANEL, Panels, Stepper} from './panels';
import {CAL, CELL_T, LOOP, ORB_F0, REC, SETTLE, SETUP, SPIN, TRAIN} from './timing';

const ICE = ACCENT.clonelab;
const STARTS = [SETUP, REC, CAL, TRAIN];
const END = SETTLE; // the ring settles (static) before the boundary blend
const CAM = Easing.bezier(0.45, 0, 0.12, 1); // camera pull-back from the portal zoom

type Pt = V2;
const pts = (a: Pt[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

const mod = (k: number) => ((k % K) + K) % K;
const rep = (k: number) => (mod(k) === K - 1 ? -1 : mod(k)); // the drawn copy of a cell

// painter's order: back (small x+y) to front
const ORDER = [...REPS].sort((a, b) => {
  const A = cellAt(a);
  const B = cellAt(b);
  return A.x0 + A.x1 + A.y0 + A.y1 - (B.x0 + B.x1 + B.y0 + B.y1) || a - b;
});
// build order: outwards (both ways round the loop) from the top of the TRAIN flight, where the portal edge is
const BUILD = [...REPS].sort((a, b) => {
  const d = (k: number) => Math.min(mod(k - (K - 2)), mod(K - 2 - k));
  return d(a) - d(b) || a - b;
});
const buildAt = (k: number) => -6 + BUILD.indexOf(k) * 1.6;

const topFace = (k: number): Pt[] => {
  const {x0, x1, y0, y1, z} = cellAt(k);
  return [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)];
};
const centroid = (a: Pt[]): Pt => [a.reduce((s, p) => s + p[0], 0) / a.length, a.reduce((s, p) => s + p[1], 0) / a.length];
const STAIR_C = centroid(REPS.map((k) => centroid(topFace(k))));

// orb: lands on cell r at ORB_F0 + CELL_T[r] (+ LOOP per lap); the hop into a cell takes its last 9–13 frames
const orbAt = (f: number) => {
  const lap = Math.floor((f - ORB_F0) / LOOP);
  const o = f - ORB_F0 - lap * LOOP;
  let r = 0;
  while (r + 1 < K && CELL_T[r + 1] <= o) r++;
  const t0 = CELL_T[r];
  const t1 = r + 1 < K ? CELL_T[r + 1] : LOOP;
  const hop = t1 - t0 > 15 ? 13 : 9;
  const h = ramp(o, t1 - hop, t1, IN_OUT);
  const n = lap * K + r;
  const a = treadCentre(n);
  const b = treadCentre(n + 1);
  return {x: mix(a[0], b[0], h), y: mix(a[1], b[1], h), z: mix(a[2], b[2], h), arc: Math.sin(Math.PI * h) * (hop > 9 ? 0.55 : 0.4)};
};
// the most recent frame the orb landed on cell k
const lastLandOn = (f: number, k: number) => {
  const t = ORB_F0 + CELL_T[mod(k)];
  return t + LOOP * Math.floor((f - t) / LOOP);
};

// flight labels sit outside the ring, off each flight's outer side
const LABEL_OFF: Pt[] = [
  [175, -150], // SET UP: up-right
  [70, 190], // RECORD: below
  [-118, 132], // CALIBRATE: down-left
  [-170, -80], // TRAIN: up-left
];
const LABELS = FLIGHTS.map((fl, i) => {
  const c = centroid(fl.cells.map((k) => centroid(topFace(rep(k)))));
  const o = LABEL_OFF[i];
  const len = Math.hypot(o[0], o[1]);
  const u: Pt = [o[0] / len, o[1] / len];
  return {name: fl.name, anchor: c, at: [c[0] + o[0], c[1] + o[1]] as Pt, u};
});

// exit ring (Live's drift-ring motif): 12 segments, black / dark grey / white / green bands
const RING_C: Pt = [960, 540];
const RO = 340;
const RI = 236;
const segAngles = (k: number) => {
  const a0 = -Math.PI / 2 + (k / K) * Math.PI * 2 + 0.03;
  return [a0, a0 + (Math.PI * 2) / K - 0.06];
};
const polar = (r: number, a: number): Pt => [RING_C[0] + r * Math.cos(a), RING_C[1] + r * Math.sin(a)];
const sector = (a0: number, a1: number, steps = 4): Pt[] => {
  const o: Pt[] = [];
  for (let j = 0; j < steps; j++) o.push(polar(RO, a0 + ((a1 - a0) * j) / steps));
  for (let j = 0; j < steps; j++) o.push(polar(RO + ((RI - RO) * j) / steps, a1));
  for (let j = 0; j < steps; j++) o.push(polar(RI, a1 + ((a0 - a1) * j) / steps));
  for (let j = 0; j < steps; j++) o.push(polar(RI + ((RO - RI) * j) / steps, a0));
  return o;
};
const subdiv = (q: Pt[], steps = 4): Pt[] => {
  const o: Pt[] = [];
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    for (let j = 0; j < steps; j++) o.push([a[0] + ((b[0] - a[0]) * j) / steps, a[1] + ((b[1] - a[1]) * j) / steps]);
  }
  return o;
};
const SPIN_TURNS = 0.75;
const rot = (p: Pt, c: Pt, a: number): Pt => {
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};
const BANDS: [number, number, string][] = [
  [0, 0.16, '#000000'],
  [0.16, 0.5, '#3a3a3a'],
  [0.5, 0.66, '#ffffff'],
  [0.66, 1, '#1ED760'],
];

// ---------- the staircase (reads its own frame so CameraMotionBlur can resample it) ----------
const Stairs: React.FC = () => {
  const f = useWorldFrame();
  const camT = ramp(f, 0, 58, CAM);
  const cs = mix(PORTAL_SCALE, 1, camT);
  const ctx = mix(PORTAL_TX, 0, camT);
  const cty = mix(PORTAL_TY, 0, camT);

  const orb = orbAt(f);
  const active = STARTS.findIndex((s, i) => f >= s && f < (STARTS[i + 1] ?? 1e9));
  const flightCells = active >= 0 ? (FLIGHTS[active].cells as readonly number[]).map(rep) : [];
  const doorGlow = ramp(f, TRAIN - 3, TRAIN + 4) * (1 - ramp(f, SPIN + 4, SPIN + 20));
  const doorFlash = f >= TRAIN ? Math.exp(-(f - TRAIN) / 14) : 0;

  // exit morph
  const tm = ramp(f, SPIN, END, IN_OUT);
  const exiting = f >= SPIN;
  const spin = SPIN_TURNS * Math.PI * 2 * tm;
  const pivot: Pt = [mix(STAIR_C[0], RING_C[0], tm), mix(STAIR_C[1], RING_C[1], tm)];
  const wallOp = 1 - ramp(f, SPIN, SPIN + 12);

  const blocks = ORDER.map((k) => {
    const {x0, x1, y0, y1, z} = cellAt(k);
    const a = ramp(f, buildAt(k), buildAt(k) + 18, EXPO);
    if (a <= 0) return null;
    const dy = (1 - a) * U * 0.9;
    const T = (p: Pt): Pt => [p[0], p[1] + dy];
    const top = topFace(k).map(T);
    const xf = [P(x1, y0, z), P(x1, y1, z), P(x1, y1, z - DEPTH), P(x1, y0, z - DEPTH)].map(T);
    const yf = [P(x0, y1, z), P(x1, y1, z), P(x1, y1, z - DEPTH), P(x0, y1, z - DEPTH)].map(T);
    // landing flash on this step + highlight of the active flight
    const lastLand = lastLandOn(f, k);
    const flash = f >= lastLand && f >= SETUP - 30 ? Math.exp(-(f - lastLand) / 10) : 0;
    const hl = flightCells.includes(k) ? 0.22 : 0;
    let topPts = top;
    if (exiting) {
      const [a0, a1] = segAngles(mod(k));
      const src = subdiv(top);
      const dst = sector(a0, a1).map((p) => rot(p, RING_C, -SPIN_TURNS * Math.PI * 2));
      topPts = src.map((s, i) => {
        const m: Pt = [mix(s[0] - STAIR_C[0], dst[i][0] - RING_C[0], tm), mix(s[1] - STAIR_C[1], dst[i][1] - RING_C[1], tm)];
        return rot([pivot[0] + m[0], pivot[1] + m[1]], pivot, spin);
      });
    }
    return (
      <g key={k} opacity={Math.min(1, a * 1.6)}>
        {wallOp > 0 ? (
          <g opacity={wallOp}>
            <polygon points={pts(yf)} fill="url(#cl-yf)" />
            <polygon points={pts(xf)} fill="url(#cl-xf)" />
            <polyline points={pts([yf[0], yf[1], xf[1]])} fill="none" stroke="#bff6ff" strokeOpacity={0.35} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
            <line x1={yf[1][0]} y1={yf[1][1]} x2={yf[2][0]} y2={yf[2][1]} stroke="#9eeeff" strokeOpacity={0.25} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </g>
        ) : null}
        <polygon points={pts(topPts)} fill="url(#cl-top)" stroke="#8ae4f6" strokeOpacity={0.95} strokeWidth={1.4} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {flash + hl > 0.01 ? <polygon points={pts(topPts)} fill="#ffffff" opacity={Math.min(0.85, flash * 0.8 + hl)} /> : null}
        {k === -1 && !exiting ? <Door glow={doorGlow} flash={doorFlash} dy={dy} /> : null}
      </g>
    );
  });

  // orb (+ its shadow on the tread)
  let orbP = P(orb.x, orb.y, orb.z + 0.3 + orb.arc);
  const shadow = P(orb.x, orb.y, orb.z);
  const orbIn = pop(f, 22, 12, 160, 0.7);
  let orbOp = 1;
  if (exiting) {
    const t = ramp(f, SPIN, SPIN + 26, IN_OUT);
    orbP = [mix(orbP[0], RING_C[0], t), mix(orbP[1], RING_C[1], t)];
    orbOp = 1 - ramp(f, SPIN + 14, SPIN + 30);
  }

  // final banded ring
  const bandOp = ramp(f, END - 6, END);
  const res = spin - SPIN_TURNS * Math.PI * 2;

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="cl-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#bdf3fd" />
          </linearGradient>
          <linearGradient id="cl-yf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3cc6e3" />
            <stop offset="0.55" stopColor="#0f4a5a" />
            <stop offset="1" stopColor="#040b0f" />
          </linearGradient>
          <linearGradient id="cl-xf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#156a82" />
            <stop offset="0.55" stopColor="#0a2d39" />
            <stop offset="1" stopColor="#03080b" />
          </linearGradient>
          <radialGradient id="cl-orb">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#dffbff" />
            <stop offset="0.6" stopColor={ICE} stopOpacity={0.55} />
            <stop offset="1" stopColor={ICE} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="cl-door">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#bff6ff" />
            <stop offset="1" stopColor={ICE} />
          </radialGradient>
        </defs>
        <g transform={`translate(${ctx} ${cty}) scale(${cs})`}>
          {blocks}
          {/* orb shadow + orb */}
          {f > 16 ? (
            <g opacity={orbOp}>
              {!exiting ? <ellipse cx={shadow[0]} cy={shadow[1]} rx={U * 0.26 * (1 - orb.arc * 0.5)} ry={U * 0.13 * (1 - orb.arc * 0.5)} fill="#02242e" opacity={0.55 * orbIn} /> : null}
              <circle cx={orbP[0]} cy={orbP[1]} r={58 * orbIn} fill="url(#cl-orb)" opacity={0.55} />
              <circle cx={orbP[0]} cy={orbP[1]} r={15 * orbIn} fill="#ffffff" />
            </g>
          ) : null}
          {/* the portal edge from My Voice */}
          {f < 28 ? (
            <g opacity={1 - ramp(f, 8, 28)} fill="none" strokeLinecap="round">
              <line x1={EDGE_LINE[0][0]} y1={EDGE_LINE[0][1]} x2={EDGE_LINE[1][0]} y2={EDGE_LINE[1][1]} stroke={ICE} strokeWidth={4.5 * 9 / PORTAL_SCALE} opacity={0.08} />
              <line x1={EDGE_LINE[0][0]} y1={EDGE_LINE[0][1]} x2={EDGE_LINE[1][0]} y2={EDGE_LINE[1][1]} stroke={ICE} strokeWidth={4.5 * 3.5 / PORTAL_SCALE} opacity={0.22} />
              <line x1={EDGE_LINE[0][0]} y1={EDGE_LINE[0][1]} x2={EDGE_LINE[1][0]} y2={EDGE_LINE[1][1]} stroke="#E4FBFF" strokeWidth={4.5 / PORTAL_SCALE} />
            </g>
          ) : null}
        </g>
        {bandOp > 0
          ? Array.from({length: K}, (_, k) => {
              const [a0, a1] = segAngles(k);
              return (
                <g key={k} opacity={bandOp}>
                  {BANDS.map(([b0, b1, col], j) => (
                    <polygon key={j} points={pts(sector(a0 + (a1 - a0) * b0, a0 + (a1 - a0) * b1, 3).map((p) => rot([p[0] - RING_C[0] + pivot[0], p[1] - RING_C[1] + pivot[1]], pivot, res)))} fill={col} />
                  ))}
                </g>
              );
            })
          : null}
      </svg>
    </AbsoluteFill>
  );
};

// a doorway standing on the top landing (its back edge, plane y = y0, facing the viewer)
const Door: React.FC<{glow: number; flash: number; dy: number}> = ({glow, flash, dy}) => {
  const {x0, x1, y0, y1, z: z0} = cellAt(-1);
  const X = (t: number) => mix(x0, x1, t);
  const fr = [P(X(0.2), y0, z0), P(X(0.8), y0, z0), P(X(0.8), y0, z0 + 1.45), P(X(0.2), y0, z0 + 1.45)];
  const op = [P(X(0.28), y0, z0), P(X(0.72), y0, z0), P(X(0.72), y0, z0 + 1.3), P(X(0.28), y0, z0 + 1.3)];
  const c = centroid(op);
  const spill = [P(X(0.28), y0, z0), P(X(0.72), y0, z0), P(X(0.86), mix(y0, y1, 0.85), z0), P(X(0.14), mix(y0, y1, 0.85), z0)];
  return (
    <g transform={`translate(0 ${dy})`}>
      <circle cx={c[0]} cy={c[1]} r={U * (0.9 + flash * 0.8)} fill="url(#cl-orb)" opacity={glow * (0.5 + flash * 0.5)} />
      <polygon points={pts(fr)} fill="#071c24" stroke="#bff6ff" strokeOpacity={0.7} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
      <polygon points={pts(op)} fill="#02090c" />
      <polygon points={pts(op)} fill="url(#cl-door)" opacity={glow} />
      <polygon points={pts(spill)} fill="#ffffff" opacity={glow * 0.35} />
    </g>
  );
};

// rising ice dust — the visual Shepard tone
const rnd = mulberry32(7);
const DUST = Array.from({length: 46}, () => ({x: rnd() * 1920, y: rnd() * 1080, v: 0.6 + rnd() * 1.6, r: 0.8 + rnd() * 2.2, o: 0.15 + rnd() * 0.35}));

export const World: React.FC = () => {
  const f = useWorldFrame();
  const titleOut = 92;
  const uiOut = ramp(f, SPIN - 10, SPIN + 6, EXPO_IN);
  const labelsIn = ramp(f, 70, 92);
  const blur = f >= SPIN + 4 && f <= END + 2;

  return (
    <AbsoluteFill style={{background: 'radial-gradient(110% 100% at 32% 58%, #0c2a35 0%, #06141b 45%, #020609 100%)', overflow: 'hidden'}}>
      {/* dust */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {DUST.map((d, i) => {
          const y = (((d.y - f * d.v) % 1120) + 1120) % 1120 - 20;
          return <circle key={i} cx={d.x + Math.sin(f / 40 + i) * 6} cy={y} r={d.r} fill={ICE} opacity={d.o * (0.4 + 0.6 * (1 - y / 1080))} />;
        })}
      </svg>
      {/* glow behind the staircase */}
      <div
        style={{
          position: 'absolute',
          left: 548 - 700,
          top: 560 - 600,
          width: 1400,
          height: 1200,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(79,227,255,0.16), transparent)',
          opacity: ramp(f, 20, 70) * (1 - uiOut),
        }}
      />

      {blur ? (
        <CameraMotionBlur samples={5} shutterAngle={200}>
          <Stairs />
        </CameraMotionBlur>
      ) : (
        <Stairs />
      )}

      {/* flight labels */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: labelsIn * (1 - uiOut)}}>
        {LABELS.map((l, i) => {
          const lit = ramp(f, STARTS[i] - 2, STARTS[i] + 4) * (i < 3 ? 1 - ramp(f, STARTS[i + 1] - 2, STARTS[i + 1] + 4) : 1);
          return (
            <line
              key={i}
              x1={l.anchor[0] + l.u[0] * 40}
              y1={l.anchor[1] + l.u[1] * 32}
              x2={l.at[0] - l.u[0] * 50}
              y2={l.at[1] - l.u[1] * 16}
              stroke={ICE}
              strokeWidth={1.5}
              opacity={0.3 + 0.7 * lit}
              strokeDasharray={lit > 0.5 ? undefined : '3 5'}
            />
          );
        })}
      </svg>
      {LABELS.map((l, i) => {
        const lit = ramp(f, STARTS[i] - 2, STARTS[i] + 4) * (i < 3 ? 1 - ramp(f, STARTS[i + 1] - 2, STARTS[i + 1] + 4) : 1);
        const done = f >= (STARTS[i + 1] ?? 1e9) ? 1 : 0;
        const kick = f >= STARTS[i] ? Math.exp(-(f - STARTS[i]) / 7) : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: l.at[0],
              top: l.at[1],
              transform: `translate(-50%, -50%) scale(${1 + kick * 0.18})`,
              opacity: labelsIn * (1 - uiOut),
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 18px',
              borderRadius: 22,
              border: `1.5px solid ${mixColor('#2f6d7b', ICE, Math.max(lit, done * 0.6))}`,
              background: mixColor('#061419', ICE, lit),
              boxShadow: lit > 0.1 ? `0 0 ${20 + kick * 40}px rgba(79,227,255,${0.35 * lit + kick * 0.4})` : 'none',
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: '0.18em',
              whiteSpace: 'nowrap',
              color: mixColor('#86c9d6', '#001017', lit),
            }}
          >
            <span style={{opacity: 0.6}}>0{i + 1}</span>
            {l.name}
          </div>
        );
      })}

      {/* title moment */}
      {f < titleOut + 30 ? (
        <div style={{position: 'absolute', left: 1080, top: 300}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18, ...enter(f, 32, titleOut - 4)}}>
            <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.42em', color: ICE}}>02 / 09</div>
            <div style={{width: 120 * ramp(f, 36, 62), height: 2, background: ICE, opacity: 0.6}} />
          </div>
          <Letters f={f} text="CLONE" at={36} out={titleOut} size={156} color="#f2fdff" stagger={3} style={{marginTop: 26}} />
          <Letters f={f} text="LAB" at={44} out={titleOut + 4} size={156} color={ICE} stagger={3} style={{marginTop: 4}} />
          <div style={{marginTop: 30, fontFamily: FONT, fontWeight: 500, fontSize: 40, letterSpacing: '-0.01em', color: '#cdeef5', ...enter(f, 54, titleOut + 8)}}>
            One main task at a time.
          </div>
        </div>
      ) : null}

      {/* stepper + panel */}
      <div style={{opacity: ramp(f, titleOut + 8, titleOut + 22) * (1 - uiOut), transform: `translateY(${(1 - ramp(f, titleOut + 8, titleOut + 30)) * 16}px)`}}>
        <Stepper f={f} />
      </div>
      <Panels f={f} out={uiOut} />

      {/* each lit label expands into the panel */}
      {STARTS.map((s, i) => {
        if (f < s || f > s + 26) return null;
        const t = ramp(f, s, s + 16, EXPO);
        const l = LABELS[i].at;
        const w = mix(190, PANEL.w, t);
        const h = mix(44, PANEL.h, t);
        const cx = mix(l[0], PANEL.x + PANEL.w / 2, t);
        const cy = mix(l[1], PANEL.y + PANEL.h / 2, t);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cx - w / 2,
              top: cy - h / 2,
              width: w,
              height: h,
              borderRadius: mix(22, 26, t),
              border: `2px solid ${ICE}`,
              background: `rgba(79,227,255,${0.16 * (1 - t)})`,
              boxShadow: `0 0 40px rgba(79,227,255,0.35)`,
              opacity: 1 - ramp(f, s + 12, s + 26),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

