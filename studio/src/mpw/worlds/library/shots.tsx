// Abstract generated "footage" (no people, no stock): every shot is a seeded SVG drawing in a 160×90 frame.
import React from 'react';
import {mulberry32} from '../../timing';

export type Kind = 'street' | 'coast' | 'hills' | 'city' | 'room' | 'studio' | 'forest' | 'desert' | 'stage';

const Sky: React.FC<{id: string; a: string; b: string; c?: string}> = ({id, a, b, c}) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={a} />
        <stop offset={c ? '0.55' : '1'} stopColor={b} />
        {c ? <stop offset="1" stopColor={c} /> : null}
      </linearGradient>
    </defs>
    <rect width={160} height={90} fill={`url(#${id})`} />
  </>
);
const Glow: React.FC<{id: string; x: number; y: number; r: number; color: string; o?: number}> = ({id, x, y, r, color, o = 0.8}) => (
  <>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={o} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
  </>
);
const ridge = (r: () => number, y: number, amp: number) => {
  const p = [r() * 6, r() * 6, r() * 6];
  let d = `M0 90 L0 ${y}`;
  for (let x = 0; x <= 160; x += 4) d += ` L${x} ${(y - amp * (0.5 * Math.sin(x * 0.045 + p[0]) + 0.3 * Math.sin(x * 0.11 + p[1]) + 0.2 * Math.sin(x * 0.23 + p[2]))).toFixed(1)}`;
  return d + ' L160 90 Z';
};

const Street: React.FC<{u: string; r: () => number; bus?: boolean}> = ({u, r, bus = true}) => {
  const vx = 88 + r() * 8;
  return (
    <>
      <Sky id={u + 's'} a="#16202c" b="#4a4a55" c="#d48a5c" />
      <Glow id={u + 'g'} x={vx} y={50} r={40} color="#ffb070" o={0.55} />
      <polygon points={`0,6 ${vx - 8},46 ${vx - 8},54 0,84`} fill="#1d232b" />
      <polygon points={`160,14 ${vx + 8},47 ${vx + 8},54 160,74`} fill="#222830" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={0} y1={18 + i * 12} x2={vx - 8} y2={47.5 + i * 1.3} stroke="#e8b070" strokeOpacity={0.18} strokeWidth={0.7} strokeDasharray="2 3" />
      ))}
      <polygon points={`${vx - 8},54 ${vx + 8},54 160,90 0,90`} fill="#14171b" />
      <line x1={vx} y1={54} x2={vx + 4} y2={90} stroke="#e9d3a6" strokeOpacity={0.45} strokeWidth={0.8} strokeDasharray="5 5" />
      {[0.2, 0.45, 0.7].map((t, i) => (
        <g key={i}>
          <line x1={vx + 8 + (160 - vx) * t * 0.9} y1={54 - 26 * (1 - t) * 0.2 - 8 * t} x2={vx + 8 + (160 - vx) * t * 0.9} y2={54 + 26 * t} stroke="#0d0f12" strokeWidth={0.6 + t} />
          <circle cx={vx + 8 + (160 - vx) * t * 0.9} cy={54 - 8 * t - 26 * (1 - t) * 0.2} r={0.8 + t * 1.2} fill="#ffd9a0" />
        </g>
      ))}
      {bus ? (
        <g>
          <rect x={vx + 14} y={52} width={30} height={16} rx={2} fill="#2f3a3f" />
          <rect x={vx + 16} y={54.5} width={26} height={5} rx={1} fill="#f0c37a" opacity={0.85} />
          <rect x={vx + 14} y={64} width={30} height={2} fill="#101315" />
        </g>
      ) : null}
    </>
  );
};

export const Shot: React.FC<{kind: Kind; seed: number; uid: string; w: number; h: number; style?: React.CSSProperties; t?: number}> = ({kind, seed, uid, w, h, style, t = 0}) => {
  const r = mulberry32(seed * 977 + 13);
  const u = `${uid}-`;
  let body: React.ReactNode = null;
  if (kind === 'street') body = <Street u={u} r={r} />;
  else if (kind === 'coast') {
    const sx = 50 + r() * 70;
    body = (
      <>
        <Sky id={u + 's'} a="#22324a" b="#c98a64" c="#f1c08a" />
        <Glow id={u + 'g'} x={sx} y={52} r={34} color="#ffd29a" o={0.7} />
        <circle cx={sx} cy={52} r={7} fill="#ffe6bd" />
        <rect y={56} width={160} height={34} fill="#18303a" />
        {Array.from({length: 9}, (_, i) => (
          <line key={i} x1={sx - 6 - i * 2 + Math.sin(t / 20 + i) * 2} x2={sx + 6 + i * 2} y1={58 + i * 3.4} y2={58 + i * 3.4} stroke="#ffd9a6" strokeOpacity={0.5 - i * 0.045} strokeWidth={0.9} />
        ))}
      </>
    );
  } else if (kind === 'hills') {
    body = (
      <>
        <Sky id={u + 's'} a="#33475a" b="#a9b9bd" />
        <path d={ridge(r, 46, 16)} fill="#6a7e86" />
        <path d={ridge(r, 60, 14)} fill="#46596244" />
        <path d={ridge(r, 62, 12)} fill="#3a4b52" />
        <path d={ridge(r, 76, 10)} fill="#222d31" />
      </>
    );
  } else if (kind === 'city') {
    const bs = Array.from({length: 11}, (_, i) => ({x: i * 15 - 4 + r() * 4, w: 10 + r() * 8, h: 22 + r() * 44}));
    body = (
      <>
        <Sky id={u + 's'} a="#0b111b" b="#22324a" />
        <circle cx={128} cy={18} r={6} fill="#dfe8ea" opacity={0.85} />
        {bs.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={90 - b.h} width={b.w} height={b.h} fill={i % 2 ? '#111822' : '#151d28'} />
            {Array.from({length: Math.floor(b.h / 6)}, (_, j) =>
              [0, 1].map((k) => (r() > 0.55 ? <rect key={`${j}-${k}`} x={b.x + 2 + k * (b.w / 2)} y={92 - b.h + j * 6} width={2.2} height={2.2} fill={r() > 0.5 ? '#f2c77e' : '#7fd1c7'} opacity={0.75} /> : null)),
            )}
          </g>
        ))}
      </>
    );
  } else if (kind === 'room') {
    body = (
      <>
        <rect width={160} height={90} fill="#2b2420" />
        <rect y={64} width={160} height={26} fill="#1a1512" />
        <rect x={98} y={14} width={38} height={40} fill="#e8d4a8" opacity={0.92} />
        <line x1={117} y1={14} x2={117} y2={54} stroke="#2b2420" strokeWidth={2} />
        <polygon points="98,54 136,54 120,90 60,90" fill="#e8d4a8" opacity={0.12} />
        <rect x={22} y={52} width={56} height={18} rx={5} fill="#4a3a32" />
        <rect x={20} y={46} width={60} height={10} rx={4} fill="#5a463c" />
        <line x1={88} y1={36} x2={88} y2={70} stroke="#151110" strokeWidth={1.2} />
        <polygon points="82,30 94,30 91,38 85,38" fill="#e9b36e" />
      </>
    );
  } else if (kind === 'studio') {
    const hx = 64 + r() * 32;
    body = (
      <>
        <defs>
          <radialGradient id={u + 'b'} cx="0.55" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#42535a" />
            <stop offset="1" stopColor="#111518" />
          </radialGradient>
        </defs>
        <rect width={160} height={90} fill={`url(#${u}b)`} />
        <path d={`M${hx - 30} 90 C${hx - 28} 66 ${hx - 14} 60 ${hx} 60 C${hx + 14} 60 ${hx + 28} 66 ${hx + 30} 90 Z`} fill="#0a0c0d" />
        <circle cx={hx} cy={40} r={13} fill="#0a0c0d" />
        <path d={`M${hx + 9} 30 A13 13 0 0 1 ${hx + 10} 50`} fill="none" stroke="#7fd1c7" strokeOpacity={0.6} strokeWidth={1.4} />
      </>
    );
  } else if (kind === 'forest') {
    body = (
      <>
        <Sky id={u + 's'} a="#22302a" b="#8aa08a" />
        {Array.from({length: 16}, (_, i) => {
          const d = r();
          return <rect key={i} x={r() * 160} y={0} width={2 + d * 7} height={90} fill={d > 0.6 ? '#141b17' : d > 0.3 ? '#2c3a32' : '#4b5c50'} opacity={0.6 + d * 0.4} />;
        })}
        <rect y={74} width={160} height={16} fill="#18201b" />
      </>
    );
  } else if (kind === 'desert') {
    body = (
      <>
        <Sky id={u + 's'} a="#3e4664" b="#e2b48a" />
        <circle cx={40 + r() * 80} cy={30} r={6} fill="#fff0d6" opacity={0.9} />
        <path d={ridge(r, 58, 8)} fill="#c08a5c" />
        <path d={ridge(r, 70, 9)} fill="#9a6a45" />
        <path d={ridge(r, 82, 6)} fill="#6e4a31" />
      </>
    );
  } else {
    body = (
      <>
        <rect width={160} height={90} fill="#0d1112" />
        {[0, 1, 2].map((i) => (
          <polygon key={i} points={`${20 + i * 50},0 ${34 + i * 50},0 ${70 + i * 40},90 ${40 + i * 40},90`} fill={i === 1 ? '#edb654' : '#7fd1c7'} opacity={0.18 + 0.08 * i} />
        ))}
        <rect y={70} width={160} height={20} fill="#16191a" />
        <ellipse cx={80} cy={72} rx={40} ry={4} fill="#7fd1c7" opacity={0.2} />
      </>
    );
  }
  return (
    <svg width={w} height={h} viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" style={{display: 'block', ...style}}>
      {body}
    </svg>
  );
};

// ---------- the change-blindness frame (Media QC) ----------
// A detailed night street, 1600×900 units. `changed` = the frame where one region is frozen: the rooftop block of
// the third building (water tower + two top floors) holds stale picture. Low-interest region, salient distractors
// elsewhere (neon sign, moon, tail-lights) so the flicker paradigm hides it.
export const FREEZE_BOX = {x: 996, y: 92, w: 278, h: 236}; // in frame units (1600×900)

// per-window hash so the frozen region never shifts any other detail
const hash = (x: number, y: number) => mulberry32(x * 7919 + y * 104729)();

export const NightStreet: React.FC<{changed: boolean; w: number; h: number; uid: string}> = ({changed, w, h, uid}) => {
  const stars = mulberry32(4242);
  const far = mulberry32(777);
  const blds = [
    {x: -20, w: 230, top: 120},
    {x: 210, w: 190, top: 230},
    {x: 400, w: 150, top: 320},
    {x: 1270, w: 350, top: 90},
    {x: 1030, w: 210, top: changed ? 300 : 200},
    {x: 900, w: 140, top: 340},
  ];
  const win = (bx: number, bw: number, top: number, key: string) => {
    const out: React.ReactNode[] = [];
    for (let y = 72; y < 640; y += 34) {
      if (y < top + 20) continue;
      for (let x = bx + 16; x < bx + bw - 22; x += 30) {
        const v = hash(x, y);
        out.push(<rect key={`${key}-${x}-${y}`} x={x} y={y} width={14} height={18} fill={v > 0.62 ? '#f3c983' : v > 0.5 ? '#7fd1c7' : '#1b2430'} opacity={v > 0.5 ? 0.85 : 1} />);
      }
    }
    return out;
  };
  return (
    <svg width={w} height={h} viewBox="0 0 1600 900" style={{display: 'block'}}>
      <defs>
        <linearGradient id={uid + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070b12" />
          <stop offset="0.6" stopColor="#16233a" />
          <stop offset="1" stopColor="#3b3550" />
        </linearGradient>
        <radialGradient id={uid + 'moon'}>
          <stop offset="0" stopColor="#e9f1f2" stopOpacity={0.5} />
          <stop offset="1" stopColor="#e9f1f2" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={uid + 'neon'}>
          <stop offset="0" stopColor="#7fd1c7" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7fd1c7" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={uid + 'road'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151820" />
          <stop offset="1" stopColor="#090a0d" />
        </linearGradient>
      </defs>
      <rect width={1600} height={900} fill={`url(#${uid}sky)`} />
      {Array.from({length: 40}, (_, i) => (
        <circle key={i} cx={stars() * 1600} cy={stars() * 300} r={1 + stars() * 1.5} fill="#dfe8ea" opacity={0.25 + stars() * 0.5} />
      ))}
      <circle cx={600} cy={140} r={170} fill={`url(#${uid}moon)`} />
      <circle cx={600} cy={140} r={46} fill="#e8eff0" />
      <circle cx={588} cy={130} r={9} fill="#c9d3d6" opacity={0.6} />
      {/* far skyline */}
      {Array.from({length: 14}, (_, i) => (
        <rect key={i} x={540 + i * 40} y={430 - (far() * 120 + 40)} width={36} height={300} fill="#1a2232" />
      ))}
      {/* buildings */}
      {blds.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.top} width={b.w} height={700 - b.top} fill={i % 2 ? '#121924' : '#0f151e'} />
          <rect x={b.x} y={b.top} width={b.w} height={8} fill="#26303f" />
          {win(b.x, b.w, b.top, 'b' + i)}
        </g>
      ))}
      {/* third building's rooftop: water tower + top floors (absent in the frozen frame) */}
      {!changed ? (
        <g>
          <rect x={1100} y={120} width={58} height={56} rx={6} fill="#0f151e" />
          <rect x={1096} y={112} width={66} height={12} fill="#26303f" />
          <line x1={1108} y1={176} x2={1104} y2={200} stroke="#0f151e" strokeWidth={6} />
          <line x1={1150} y1={176} x2={1154} y2={200} stroke="#0f151e" strokeWidth={6} />
        </g>
      ) : null}
      {/* neon sign (salient distractor) */}
      <circle cx={310} cy={360} r={150} fill={`url(#${uid}neon)`} />
      <rect x={250} y={300} width={120} height={120} rx={14} fill="none" stroke="#9ff0e6" strokeWidth={8} />
      <rect x={278} y={330} width={64} height={60} rx={6} fill="#7fd1c7" opacity={0.85} />
      {/* road */}
      <polygon points="0,700 1600,700 1600,900 0,900" fill={`url(#${uid}road)`} />
      <polygon points="700,700 900,700 1300,900 300,900" fill="#1b1f27" />
      {[0, 1, 2, 3].map((i) => (
        <polygon key={i} points={`${792 - i * 4},${712 + i * 46} ${808 + i * 4},${712 + i * 46} ${810 + i * 6},${736 + i * 52} ${790 - i * 6},${736 + i * 52}`} fill="#e9d3a6" opacity={0.5} />
      ))}
      {/* street lamps */}
      {[150, 560, 1050, 1450].map((x, i) => (
        <g key={i}>
          <rect x={x} y={500} width={8} height={210} fill="#0a0d12" />
          <rect x={x - 20} y={492} width={48} height={10} rx={4} fill="#0a0d12" />
          <ellipse cx={x + 4} cy={706} rx={70} ry={12} fill="#f3c983" opacity={0.18} />
          <circle cx={x + 4} cy={505} r={9} fill="#ffe2a8" />
        </g>
      ))}
      {/* parked car with tail-lights (salient) */}
      <rect x={1130} y={730} width={260} height={70} rx={20} fill="#1d2633" />
      <rect x={1170} y={700} width={170} height={50} rx={18} fill="#1d2633" />
      <rect x={1136} y={752} width={30} height={14} rx={5} fill="#ed6a5e" />
      <rect x={1354} y={752} width={30} height={14} rx={5} fill="#ed6a5e" />
      <ellipse cx={1260} cy={806} rx={150} ry={10} fill="#000" opacity={0.5} />
    </svg>
  );
};

// ---------- zoetrope (Proxy Preparation) ----------
// Twelve slits; behind each, one still of a bouncing ball. `theta` (deg) turns the drum. Stopped: each window holds
// its own still, so you see twelve poses. Spinning past sync (`lock` → 1): the slats smear into a blur and every
// window shows the stills in rapid succession (pose = slit + `anim`), i.e. the ball moves only while the drum spins.
const POSES = 12;
const BallPose: React.FC<{k: number; uid: string}> = ({k, uid}) => {
  const u = ((k % POSES) + POSES) % POSES / POSES;
  const hgt = Math.abs(Math.sin(Math.PI * u)); // 0 at contact
  const squash = hgt < 0.18 ? 1 - hgt / 0.18 : 0;
  const by = 160 - 19 - hgt * 96;
  return (
    <g>
      <rect width={100} height={185} fill={`url(#${uid}fr)`} />
      <line x1={6} x2={94} y1={162} y2={162} stroke="#7fd1c7" strokeOpacity={0.35} strokeWidth={1.5} />
      <ellipse cx={50} cy={163} rx={22 - hgt * 10} ry={3.5} fill="#000" opacity={0.6 - hgt * 0.3} />
      <ellipse cx={50} cy={by + squash * 6} rx={19 * (1 + 0.3 * squash)} ry={19 * (1 - 0.3 * squash)} fill="#edb654" />
      <ellipse cx={44} cy={by - 6 + squash * 6} rx={6} ry={4.5} fill="#fff3d6" opacity={0.6} />
    </g>
  );
};

export const Zoetrope: React.FC<{cx: number; cy: number; R: number; H: number; theta: number; lock: number; anim: number; blur: number; uid: string}> = ({
  cx,
  cy,
  R,
  H,
  theta,
  lock,
  anim,
  blur,
  uid,
}) => {
  // a cylinder seen slightly from above: anything at drum height h sits on the arc y = h + ry·cos(angle)
  const ry = R * 0.13;
  const top = cy - H / 2;
  const bot = cy + H / 2;
  const wTop = top + 30;
  const wh = H - 64;
  const windows = (th: number, op: number, key: string, moving: boolean) =>
    Array.from({length: POSES}, (_, j) => {
      const a = ((th + j * 30) * Math.PI) / 180;
      const c = Math.cos(a);
      if (c <= 0.06) return null;
      const x = cx + R * Math.sin(a);
      const y = wTop + ry * c;
      const w = 122 * c;
      const k = moving ? j + Math.floor(anim) : j;
      return (
        <g key={key + j} opacity={op * Math.min(1, c * 2.2)}>
          <rect x={x - w / 2 - 2} y={y - 2} width={w + 4} height={wh + 4} fill="#050707" />
          <svg x={x - w / 2} y={y} width={w} height={wh} viewBox="0 0 100 185" preserveAspectRatio="none">
            <BallPose k={k} uid={uid} />
          </svg>
          <rect x={x - w / 2} y={y} width={w} height={wh} fill="#000" opacity={(1 - c) * 0.6} />
        </g>
      );
    });
  const band = (h: number, b: number) => (
    <g key={b}>
      {Array.from({length: 36}, (_, k) => {
        const a = ((theta + k * 10 + b * 5) * Math.PI) / 180;
        const c = Math.cos(a);
        if (c <= 0.05) return null;
        return <rect key={k} x={cx + R * Math.sin(a) - 5 * c} y={h + ry * c - 4} width={10 * c} height={8} rx={2} fill="#7fd1c7" opacity={(0.6 + 0.3 * blur) * (1 - lock) * Math.min(1, c * 2)} />;
      })}
      {lock > 0 ? <path d={`M${cx - R * 0.97} ${h + ry * 0.24} A${R * 0.97} ${ry} 0 0 0 ${cx + R * 0.97} ${h + ry * 0.24}`} fill="none" stroke="#7fd1c7" strokeWidth={7} strokeLinecap="round" opacity={0.45 * lock} /> : null}
    </g>
  );
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={uid + 'body'} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#060808" />
          <stop offset="0.38" stopColor="#202826" />
          <stop offset="0.55" stopColor="#2c3633" />
          <stop offset="1" stopColor="#060808" />
        </linearGradient>
        <linearGradient id={uid + 'fr'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d3533" />
          <stop offset="1" stopColor="#0d1716" />
        </linearGradient>
        <linearGradient id={uid + 'in'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#222b28" />
          <stop offset="1" stopColor="#070909" />
        </linearGradient>
      </defs>
      {/* stand */}
      <rect x={cx - 8} y={bot + ry} width={16} height={96} fill="#1b201e" />
      <ellipse cx={cx} cy={bot + ry + 98} rx={150} ry={20} fill="#141917" stroke="#2a332f" />
      <ellipse cx={cx} cy={bot + ry + 108} rx={260} ry={30} fill="#000" opacity={0.35} />
      {/* opening (inner far wall) + body front face */}
      <ellipse cx={cx} cy={top} rx={R} ry={ry} fill={`url(#${uid}in)`} />
      <path d={`M${cx - R} ${top} A${R} ${ry} 0 0 0 ${cx + R} ${top} L${cx + R} ${bot} A${R} ${ry} 0 0 1 ${cx - R} ${bot} Z`} fill={`url(#${uid}body)`} />
      {blur > 0.02 ? windows(theta - 9, 0.25 * blur * (1 - lock), 'g1', false) : null}
      {blur > 0.02 ? windows(theta + 9, 0.25 * blur * (1 - lock), 'g2', false) : null}
      {lock < 1 ? windows(theta, (1 - lock) * (1 - 0.15 * blur), 'w', false) : null}
      {lock > 0 ? windows(0, lock, 'L', true) : null}
      {/* spinning slats: a faint flickering smear over the windows */}
      {lock > 0.01 ? (
        <g opacity={lock}>
          {Array.from({length: 26}, (_, i) => {
            const x = cx - R + ((i * 47 + anim * 61) % (2 * R));
            const c = Math.cos(Math.asin(Math.max(-1, Math.min(1, (x - cx) / R))));
            return <rect key={i} x={x} y={wTop + ry * c} width={5 * c} height={wh} fill="#2c3633" opacity={0.22} />;
          })}
        </g>
      ) : null}
      {band(top + 14, 0)}
      {band(bot - 16, 1)}
      {/* rims */}
      <ellipse cx={cx} cy={top} rx={R} ry={ry} fill="none" stroke="#3c4844" strokeWidth={2} />
      <path d={`M${cx - R} ${top} A${R} ${ry} 0 0 0 ${cx + R} ${top}`} fill="none" stroke="#7fd1c7" strokeOpacity={0.7} strokeWidth={3} />
      <path d={`M${cx - R} ${bot} A${R} ${ry} 0 0 0 ${cx + R} ${bot}`} fill="none" stroke="#7fd1c7" strokeOpacity={0.3} strokeWidth={2} />
      <ellipse cx={cx} cy={top - ry * 0.05} rx={9} ry={4} fill="#4a5752" />
    </svg>
  );
};
