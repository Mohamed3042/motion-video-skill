import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {Card, EXPO, EXPO_IN, IN_OUT, Label, lerp, MarkBars, mix, pop, pulse, WorldTitle} from '../evolution/kit';
import {T} from './timing';

const S = ACCENT.settings; // #E6E6E6
const BG = '#0b0c0e';
const PAPER = '#eef2ef';
const CX = 1290;
const CY = 540;
const deg = Math.PI / 180;

// ---------- cube geometry ----------
type V3 = [number, number, number];
type V2 = [number, number];
type Face = {id: 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz'; n: V3; t1: V3; t2: V3};
const FACES: Face[] = [
  {id: 'px', n: [1, 0, 0], t1: [0, 1, 0], t2: [0, 0, 1]},
  {id: 'nx', n: [-1, 0, 0], t1: [0, 0, 1], t2: [0, 1, 0]},
  {id: 'py', n: [0, 1, 0], t1: [0, 0, 1], t2: [1, 0, 0]},
  {id: 'ny', n: [0, -1, 0], t1: [1, 0, 0], t2: [0, 0, 1]},
  {id: 'pz', n: [0, 0, 1], t1: [1, 0, 0], t2: [0, 1, 0]},
  {id: 'nz', n: [0, 0, -1], t1: [-1, 0, 0], t2: [0, 1, 0]},
];
const QUAD: V2[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const corners = (F: Face): V3[] => QUAD.map(([a, b]) => [0, 1, 2].map((i) => F.n[i] + F.t1[i] * a + F.t2[i] * b) as V3);
const VERTS: V3[] = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) VERTS.push([x, y, z]);
const EDGES: [number, number][] = [];
VERTS.forEach((a, i) => VERTS.forEach((b, j) => j > i && a.filter((v, k) => v !== b[k]).length === 1 && EDGES.push([i, j])));
const onFace = (v: V3, F: Face) => F.n.every((c, k) => c === 0 || v[k] === c);

// projections: 2×3 linear maps onto the screen (y down)
type M = number[];
const OBL: M = [190, 0, -75, 0, -190, 75]; // Necker drawing: back square offset up-right
const rot = (th: number, ph: number, s: number) => {
  const [ct, st, cp, sp] = [Math.cos(th), Math.sin(th), Math.cos(ph), Math.sin(ph)];
  const R = [
    [ct, 0, st],
    [sp * st, cp, -sp * ct],
    [-cp * st, sp, cp * ct],
  ];
  return {R, m: [s * R[0][0], s * R[0][1], s * R[0][2], -s * R[1][0], -s * R[1][1], -s * R[1][2]]};
};
const proj = (m: M, v: V3, cy = CY): V2 => [CX + m[0] * v[0] + m[1] * v[1] + m[2] * v[2], cy + m[3] * v[0] + m[4] * v[1] + m[5] * v[2]];
const area = (p: V2[]) => p.reduce((s, a, i) => s + a[0] * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * a[1], 0) / 2;
const pts = (p: V2[]) => p.map((q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`).join(' ');
const LIGHT: V3 = (() => {
  const v: V3 = [-0.45, 0.75, 0.55];
  const l = Math.hypot(...v);
  return v.map((c) => c / l) as V3;
})();

// The two depth readings of the Necker drawing (same 2-D lines, opposite depth):
// reading 1 = viewer above-right (+x, +y, +z faces in front), reading 2 = viewer below-left (−x, −y, −z in front).
const OBL_AREA = Object.fromEntries(FACES.map((F) => [F.id, area(corners(F).map((v) => proj(OBL, v)))]));
const TINT: Record<Face['id'], number> = {py: 0.38, pz: 0.22, px: 0.11, nz: 0.24, nx: 0.14, ny: 0.06};

// portal edge (from Evolution): x = −1, z = +1 → screen x 1025, y 425…805
const PORTAL = [VERTS.findIndex((v) => v.join() === '-1,-1,1'), VERTS.findIndex((v) => v.join() === '-1,1,1')];
const vdist = (i: number) => Math.min(...PORTAL.map((p) => VERTS[i].filter((c, k) => c !== VERTS[p][k]).length));

const NeckerWire: React.FC<{f: number; w2: number; op: number; glow: number}> = ({f, w2, op, glow}) => {
  const P = VERTS.map((v) => proj(OBL, v, CY + Math.sin(f / 37) * 4));
  const reading = (F: Face) => (OBL_AREA[F.id] < 0 ? 1 - w2 : w2); // weight of this face being "in front"
  const visW = (a: number, b: number) => Math.max(...FACES.filter((F) => onFace(VERTS[a], F) && onFace(VERTS[b], F)).map(reading));
  const tintsOn = lerp(f, 12, 34);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: op}}>
      <defs>
        <linearGradient id="set-tint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={1} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0.35} />
        </linearGradient>
        <filter id="set-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {FACES.map((F) => {
        const o = TINT[F.id] * reading(F) * tintsOn;
        return o > 0.002 ? <polygon key={F.id} points={pts(corners(F).map((v) => proj(OBL, v, CY + Math.sin(f / 37) * 4)))} fill="url(#set-tint)" opacity={o} /> : null;
      })}
      {[0, 1].map((layer) => (
        <g key={layer} filter={layer === 0 ? 'url(#set-glow)' : undefined} opacity={layer === 0 ? 0.55 * glow : 1}>
          {EDGES.map(([a, b], i) => {
            const [da, db] = [vdist(a), vdist(b)];
            const [s, e] = da <= db ? [a, b] : [b, a];
            const d0 = Math.min(da, db);
            const isPortal = da === 0 && db === 0;
            const grow = isPortal ? 1 : lerp(f, -6 + d0 * 9, 6 + d0 * 9, 0, 1, EXPO);
            if (grow <= 0) return null;
            const p = P[s];
            const q: V2 = [p[0] + (P[e][0] - p[0]) * grow, p[1] + (P[e][1] - p[1]) * grow];
            const vis = visW(a, b);
            return (
              <line
                key={i}
                x1={p[0]}
                y1={p[1]}
                x2={q[0]}
                y2={q[1]}
                stroke={S}
                strokeWidth={layer === 0 ? 7 : 3.2}
                strokeLinecap="round"
                strokeDasharray={vis < 0.5 ? '10 9' : undefined}
                opacity={0.24 + 0.76 * vis}
              />
            );
          })}
        </g>
      ))}
      {VERTS.map((v, i) => {
        // the vertex nearest the viewer in the current reading glows
        const near = (v[0] + v[1] + v[2] === 3 ? 1 - w2 : 0) + (v[0] + v[1] + v[2] === -3 ? w2 : 0);
        const appear = lerp(f, -6 + vdist(i) * 9, 6 + vdist(i) * 9);
        return <circle key={i} cx={P[i][0]} cy={P[i][1]} r={5 + 5 * near} fill={near > 0.5 ? '#fff' : S} opacity={appear * (0.55 + 0.45 * near)} />;
      })}
    </svg>
  );
};

// ---------- the solid engine block ----------
const SKIN_STOPS = ['#cfd0d2', '#babbbe', '#d9dadc', '#c3c4c7', '#e3e4e6', '#b3b4b7', '#cdced0', '#c0c1c4', '#dcdde0', '#b8b9bc', '#d2d3d6'];

const FaceDetail: React.FC<{id: Face['id']}> = ({id}) => {
  if (id === 'pz' || id === 'nz')
    return (
      <g>
        <rect x={22} y={22} width={56} height={56} rx={12} fill="#1a1b1d" opacity={0.92} />
        <rect x={22} y={22} width={56} height={56} rx={12} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
        {[0.3, 0.55, 0.8, 1, 0.8, 0.55, 0.3].map((h, i) => (
          <rect key={i} x={30.6 + i * 5.9} y={50 - h * 17} width={3.4} height={h * 34} rx={1.7} fill={id === 'pz' ? C.green : '#d8d8d8'} />
        ))}
        {id === 'pz' ? <circle cx={86} cy={88} r={2.2} fill={C.green} /> : null}
      </g>
    );
  if (id === 'py' || id === 'ny')
    return (
      <g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={20} y={22 + i * 10.5} width={60} height={4.5} rx={2.25} fill="#3a3b3e" opacity={0.85} />
        ))}
      </g>
    );
  return (
    <g>
      <rect x={16} y={16} width={68} height={68} rx={8} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      {[
        [24, 24],
        [76, 24],
        [24, 76],
        [76, 76],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={3.6} fill="#8d8e91" />
          <circle cx={x - 0.6} cy={y - 0.6} r={2} fill="#e9eaec" />
        </g>
      ))}
    </g>
  );
};

type Skin = {id: Face['id']; c: V3[]; nv: V3};
// draws one face: affine map of a 100×100 local square onto the projected parallelogram
const FaceSkin: React.FC<{p: V2[]; id: Face['id']; nv: V3; opacity: number}> = ({p, id, nv, opacity}) => {
  // local origin = corner 3, u → corner 2, v → corner 0 (keeps front-face art upright)
  const [o, ux, vy] = [p[3], p[2], p[0]];
  const m = [(ux[0] - o[0]) / 100, (ux[1] - o[1]) / 100, (vy[0] - o[0]) / 100, (vy[1] - o[1]) / 100, o[0], o[1]];
  const lam = Math.max(0, nv[0] * LIGHT[0] + nv[1] * LIGHT[1] + nv[2] * LIGHT[2]);
  const b = 0.42 + 0.72 * lam;
  const sheen = 0.5 + 0.85 * nv[0] - 0.3 * nv[1];
  return (
    <g transform={`matrix(${m.map((v) => v.toFixed(4)).join(' ')})`} opacity={opacity}>
      <defs>
        <linearGradient id={`set-sheen-${id}`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset={Math.max(0, sheen - 0.3)} stopColor="#fff" stopOpacity={0} />
          <stop offset={Math.min(1, Math.max(0, sheen))} stopColor="#fff" stopOpacity={0.55} />
          <stop offset={Math.min(1, sheen + 0.3)} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect width={100} height={100} fill="url(#set-brushed)" />
      <rect width={100} height={100} fill={b < 1 ? '#000' : '#fff'} opacity={b < 1 ? (1 - b) * 0.9 : (b - 1) * 0.6} />
      <rect width={100} height={100} fill={`url(#set-sheen-${id})`} />
      <rect x={5} y={5} width={90} height={90} rx={5} fill="none" stroke="#000" strokeOpacity={0.28} strokeWidth={2.4} vectorEffect="non-scaling-stroke" />
      <rect x={5.8} y={5.8} width={88.4} height={88.4} rx={5} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      <g opacity={0.35 + 0.65 * b}>
        <FaceDetail id={id} />
      </g>
      <rect width={100} height={100} fill="none" stroke="#fff" strokeOpacity={0.75} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </g>
  );
};

const unfoldPt = (v: V3, n: V3, a: number): V3 => {
  // rotate a side face about its hinge with the front face (z = +1) outward by angle a
  const d = 1 - v[2];
  const out = [...v] as V3;
  const k = n[0] !== 0 ? 0 : 1;
  const s = n[k];
  out[k] = s + s * d * Math.sin(a);
  out[2] = 1 - d * Math.cos(a);
  return out;
};

const Block: React.FC<{f: number}> = ({f}) => {
  const spin = lerp(f, T.solid, 462, 0, 1, IN_OUT);
  const th = (-30 - 330 * spin) * deg;
  const ph = 22 * (1 - lerp(f, 380, 462, 0, 1, IN_OUT)) * deg;
  const sc = 168 + (110 - 168) * lerp(f, 428, 462, 0, 1, IN_OUT);
  const u = lerp(f, T.solid, T.solid + 48, 0, 1, IN_OUT); // oblique Necker drawing → true rotation
  const {R, m: mr} = rot(th, ph, sc);
  const m = OBL.map((v, i) => v + (mr[i] - v) * u);
  const cy = CY + Math.sin(f / 37) * 4 * (1 - lerp(f, 430, 460));
  const al = lerp(f, T.unfold[0], T.unfold[1], 0, Math.PI / 2, IN_OUT);
  const morph = lerp(f, T.page[0], T.page[1], 0, 1, IN_OUT);
  const pieces: {id: Face['id']; p: V2[]; nv: V3}[] = [];
  for (const F of FACES) {
    let c = corners(F);
    let n = F.n;
    if (al > 0 && F.id !== 'pz' && F.id !== 'nz') {
      c = c.map((v) => unfoldPt(v, F.n, al));
      const k = F.n[0] !== 0 ? 0 : 1;
      n = [0, 0, 0];
      n[k] = F.n[k] * Math.cos(al);
      n[2] = Math.sin(al);
    }
    const p = c.map((v) => proj(m, v, cy));
    if (area(p) >= -1) continue;
    const nv = [0, 1, 2].map((r) => R[r][0] * n[0] + R[r][1] * n[1] + R[r][2] * n[2]) as V3;
    pieces.push({id: F.id, p, nv});
  }
  // page morph: flap outer corners travel to the page corners; the pieces tile the page exactly
  const PW = 260;
  const PH = 340;
  const flat = morph > 0;
  // inner (centre-square) corners lead outward so the flaps never pinch into a bow-tie; outer corners → page corners
  const mIn = lerp(f, T.page[0], T.page[1] - 3, 0, 1, EXPO);
  const morphPt = (q: V2): V2 => {
    const [dx, dy] = [q[0] - CX, q[1] - cy];
    const inner = Math.abs(dx) <= 112 && Math.abs(dy) <= 112;
    const t: V2 = inner ? [CX + Math.sign(dx) * PW * 0.62, cy + Math.sign(dy) * PH * 0.62] : [CX + Math.sign(dx) * PW, cy + Math.sign(dy) * PH];
    const k = inner ? mIn : morph;
    return [q[0] + (t[0] - q[0]) * k, q[1] + (t[1] - q[1]) * k];
  };
  const skinOut = 1 - lerp(f, T.page[0], T.page[0] + 5, 0, 1);
  const solidIn = lerp(f, T.solid - 3, T.solid + 5, 0, 1, IN_OUT);
  const flash = pulse(f, T.solid, 7);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="set-brushed" x1="0" y1="0" x2="0.12" y2="1">
          {SKIN_STOPS.map((c, i) => (
            <stop key={i} offset={i / (SKIN_STOPS.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      {flat
        ? pieces.map((pc) => {
            const lam = Math.max(0, pc.nv[0] * LIGHT[0] + pc.nv[1] * LIGHT[1] + pc.nv[2] * LIGHT[2]);
            return (
              <polygon
                key={pc.id}
                points={pts(pc.p.map(morphPt))}
                fill={mix(mix('#a4a5a8', '#e2e3e5', lam), PAPER, morph)}
                stroke={PAPER}
                strokeOpacity={morph}
                strokeWidth={1.5}
              />
            );
          })
        : null}
      {flat ? pieces.map((pc) => <polygon key={'s' + pc.id} points={pts(pc.p.map(morphPt))} fill="none" stroke="#6b6d70" strokeWidth={1.4} opacity={(1 - morph) * 0.9} />) : null}
      {skinOut > 0 ? pieces.map((pc) => <FaceSkin key={pc.id} p={pc.p} id={pc.id} nv={pc.nv} opacity={solidIn * skinOut} />) : null}
      {flash > 0.01 ? (
        <circle cx={CX} cy={cy} r={240 + 260 * (1 - flash)} fill="none" stroke="#fff" strokeWidth={6 * flash} opacity={flash} />
      ) : null}
    </svg>
  );
};

// ---------- UI ----------
const TABS = ['Overview', 'Audio tools', 'Storage', 'About'];
const ROWS: {name: string; status: string; icon: React.ReactNode}[] = [
  {name: 'Voice engine', status: 'Ready', icon: <MarkBars size={30} color="#e6e6e6" />},
  {
    name: 'GPU acceleration',
    status: 'Available',
    icon: (
      <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#e6e6e6" strokeWidth={1.8}>
        <rect x={5} y={5} width={14} height={14} rx={2} />
        <rect x={9} y={9} width={6} height={6} rx={1} />
        <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'Microphone',
    status: 'Connected',
    icon: (
      <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#e6e6e6" strokeWidth={1.8} strokeLinecap="round">
        <rect x={9} y={3} width={6} height={11} rx={3} />
        <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M8.5 21h7" />
      </svg>
    ),
  },
  {
    name: 'Storage',
    status: 'Ready',
    icon: (
      <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#e6e6e6" strokeWidth={1.8} strokeLinecap="round">
        <rect x={3} y={6} width={18} height={12} rx={2.5} />
        <path d="M7 14h5" />
        <circle cx={16.5} cy={14} r={1} fill="#e6e6e6" />
      </svg>
    ),
  },
];

const SettingsCard: React.FC<{f: number}> = ({f}) => {
  const s = pop(f, T.card, 18, 140, 0.8);
  const leave = lerp(f, T.exit, T.exit + 16, 0, 1, EXPO_IN);
  if (s <= 0 || leave >= 1) return null;
  // active tab follows the sequence; the underline springs between tabs
  let idx = -1;
  T.tabs.forEach((t, i) => {
    if (f >= t) idx = i === 4 ? 0 : i;
  });
  const STEPS = [0, 1, 1, 1, -3]; // underline moves 0 → 1 → 2 → 3 → back to 0
  const ux = T.tabs.reduce((a, t, i) => a + STEPS[i] * pop(f, t, 16, 220, 0.6), 0);
  const ul = pop(f, T.tabs[0], 16, 220, 0.6);
  const W = 780;
  const fill = (a: number, b: number) => lerp(f, a, b, 0, 1, IN_OUT);
  return (
    <Card x={150} y={196} w={W} h={664} glow="#e6e6e6" style={{opacity: Math.min(1, s * 1.4) * (1 - leave), translate: `${(1 - s) * -60}px ${leave * 40}px`}}>
      <div style={{position: 'absolute', left: 36, top: 28, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.fg, letterSpacing: '-0.02em'}}>Settings</div>
      {TABS.map((t, i) => {
        const on = idx === i ? 1 : 0;
        const flash = T.tabs.reduce((a, tf, k) => Math.max(a, (k === 4 ? 0 : k) === i ? pulse(f, tf, 9) : 0), 0);
        return (
          <div
            key={t}
            style={{
              position: 'absolute',
              left: 36 + i * 168,
              top: 98,
              width: 160,
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 23,
              color: on ? '#fff' : '#8f8f8f',
              textShadow: flash > 0.02 ? `0 0 ${18 * flash}px rgba(255,255,255,${flash})` : undefined,
              whiteSpace: 'nowrap',
            }}
          >
            {t}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 36 + ux * 168, top: 134, width: 64, height: 3, borderRadius: 2, background: C.green, opacity: ul, scale: `${ul} 1`, transformOrigin: 'left'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 146, height: 1, background: '#2a2a2a'}} />
      <div style={{position: 'absolute', left: 36, right: 36, top: 172, display: 'flex', justifyContent: 'space-between', opacity: lerp(f, T.card + 6, T.card + 20)}}>
        <Label>Engine status</Label>
        <Label style={{color: '#6f6f6f'}}>as reported by the engine</Label>
      </div>
      {ROWS.map((r, i) => {
        const a = pop(f, T.card + 10 + i * 4, 16, 180, 0.7);
        const rep = f >= T.rows[i];
        const k = pop(f, T.rows[i], 12, 220, 0.6);
        const blink = pulse(f, T.rows[i], 8);
        const scan = 0.35 + 0.35 * Math.sin(f / 4 + i);
        return (
          <div
            key={r.name}
            style={{
              position: 'absolute',
              left: 36,
              right: 36,
              top: 206 + i * 68,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              borderBottom: '1px solid #262626',
              opacity: Math.min(1, a * 1.5),
              translate: `${(1 - a) * 30}px 0px`,
              fontFamily: FONT,
            }}
          >
            <div style={{width: 34, display: 'flex', justifyContent: 'center'}}>{r.icon}</div>
            <div style={{fontWeight: 600, fontSize: 24, color: C.fg}}>{r.name}</div>
            <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, minWidth: 170}}>
              <span
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 7,
                  background: rep ? C.green : '#555',
                  opacity: rep ? 1 : scan,
                  boxShadow: rep ? `0 0 ${10 + 26 * blink}px ${C.green}` : undefined,
                  scale: rep ? `${1 + 0.6 * blink}` : undefined,
                }}
              />
              <span style={{position: 'relative', fontWeight: 600, fontSize: 22}}>
                <span style={{color: '#6a6a6a', opacity: 1 - k}}>Checking</span>
                <span style={{position: 'absolute', left: 0, top: 0, color: C.green, opacity: k, translate: `0px ${(1 - k) * 10}px`}}>{r.status}</span>
              </span>
            </div>
          </div>
        );
      })}
      {/* local storage */}
      <div style={{position: 'absolute', left: 36, right: 36, top: 500, opacity: lerp(f, T.storage - 14, T.storage)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 24, color: C.fg}}>Local storage</div>
          <Label>on this PC</Label>
        </div>
        <div style={{position: 'relative', marginTop: 18, height: 16, borderRadius: 8, background: '#2a2a2a', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${38 * fill(T.storage, T.storage + 26)}%`, background: 'linear-gradient(90deg,#f4f4f4,#bdbdbd)'}} />
          <div
            style={{position: 'absolute', left: '38%', top: 0, bottom: 0, width: `${20 * fill(T.storage + 18, T.storage + 42)}%`, background: C.green, boxShadow: `0 0 16px ${C.green}`}}
          />
        </div>
        <div style={{display: 'flex', gap: 30, marginTop: 16, fontFamily: FONT, fontWeight: 500, fontSize: 18, color: '#a8a8a8'}}>
          {[
            ['#e6e6e6', 'Voice models'],
            [C.green, 'Recordings'],
            ['#3a3a3a', 'Free'],
          ].map(([c, t]) => (
            <span key={t} style={{display: 'flex', alignItems: 'center', gap: 9}}>
              <span style={{width: 10, height: 10, borderRadius: 3, background: c}} />
              {t}
            </span>
          ))}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 36,
          top: 594,
          height: 46,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderRadius: 23,
          border: '1px solid #444',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 19,
          color: '#e6e6e6',
          opacity: lerp(f, T.storage + 10, T.storage + 26),
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#e6e6e6" strokeWidth={2.2} strokeLinecap="round" style={{rotate: `${lerp(f, T.rows[0] - 30, T.rows[3], 0, 720, IN_OUT)}deg`}}>
          <path d="M20 12a8 8 0 11-2.3-5.6M20 4v4h-4" />
        </svg>
        Refresh status
      </div>
    </Card>
  );
};

const RunsOnPC: React.FC<{f: number}> = ({f}) => {
  const leave = lerp(f, T.exit, T.exit + 14, 0, 1, EXPO_IN);
  if (f < T.pc - 4 || leave >= 1) return null;
  const words = ['Runs', 'on', 'your', 'PC.'];
  return (
    <div style={{position: 'absolute', left: CX - 500, width: 1000, top: 852, display: 'flex', justifyContent: 'center', gap: 16, opacity: 1 - leave}}>
      {words.map((w, i) => {
        const s = pop(f, T.pc + i * 3, 13, 200, 0.6);
        return (
          <span
            key={w}
            style={{
              display: 'inline-block',
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 60,
              letterSpacing: '-0.03em',
              color: i === 3 ? C.green : C.fg,
              opacity: Math.min(1, s * 1.6),
              translate: `0px ${(1 - s) * 40}px`,
              textShadow: i === 3 ? `0 0 30px ${C.green}66` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  // perceptual flips: start in reading 2, flip at each beat (2→1→2→1); solidify lands in reading 1
  const w2 = 1 - T.flips.reduce((a, fl, i) => a + (i % 2 ? -1 : 1) * lerp(f, fl - 3, fl + 4, 0, 1, IN_OUT), 0);
  const flipGlow = Math.max(...T.flips.map((fl) => pulse(f, fl - 1, 8)));
  const wireOp = 1 - lerp(f, T.solid - 1, T.solid + 9, 0, 1, IN_OUT);
  const dark = lerp(f, T.page[0], T.page[1] + 4, 0, 1, IN_OUT);
  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      {/* engineering backdrop: faint grid + silver haze behind the block */}
      <AbsoluteFill
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          backgroundPosition: `${-f * 0.15}px 0px`,
          opacity: 1 - dark * 0.7,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: CX - 700,
          top: CY - 700,
          width: 1400,
          height: 1400,
          background: 'radial-gradient(circle, rgba(220,224,230,0.16) 0%, rgba(220,224,230,0.05) 35%, transparent 62%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: CX - 330,
          top: CY + 300,
          width: 660,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, transparent 70%)',
          opacity: lerp(f, T.solid, T.solid + 30) * (1 - lerp(f, 440, 470)),
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(110% 90% at 40% 50%, transparent 50%, rgba(0,0,0,0.7) 100%)'}} />
      {/* page shadow under the unfolded net */}
      <div
        style={{
          position: 'absolute',
          left: CX - 270,
          top: CY - 330,
          width: 540,
          height: 700,
          borderRadius: 8,
          boxShadow: '0 40px 90px rgba(0,0,0,0.7)',
          opacity: dark,
        }}
      />
      {f >= T.solid - 4 ? <Block f={f} /> : null}
      {wireOp > 0 ? <NeckerWire f={f} w2={w2} op={wireOp} glow={0.5 + flipGlow} /> : null}
      <WorldTitle f={f} index={8} name="SETTINGS" promise="Status straight from the engine." accent={S} x={150} y={360} out={T.titleOut} size={150} />
      <SettingsCard f={f} />
      <RunsOnPC f={f} />
    </AbsoluteFill>
  );
};

