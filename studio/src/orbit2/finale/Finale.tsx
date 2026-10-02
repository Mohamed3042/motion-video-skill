// Finale (102–120 s): a one-beat montage of every world's hero frame through iris wipes, the ten accent orbits
// converge into the planet, the real logo locks at f6480 (boom, shockwave, coral glint on the satellite), end card.
// The fade to navy (118–120 s) is drawn by the Reel above everything.
import React from 'react';
import {AbsoluteFill, Freeze, Img, staticFile, useCurrentFrame} from 'remotion';
import {ACCENT, C, FONT, H, LOGO, MONO, W} from '../brand';
import {FINALE, PAD, WORLDS, mulberry32} from '../timing';
import {SECTION_IMPL} from '../sections';
import {CX, CY, clamp, ease, lerp, mixHex, prog, rgba, smooth} from '../shell/util';
import {CONVERGE, GLINT2, LINES, LOGO_LOCK, MBEAT, MONTAGE_BEATS, RISE} from './timing';

const DIAG = Math.hypot(CX, CY);
const IRIS = 9;
const pad2 = (n: number) => String(n).padStart(2, '0');

// ---------- logo geometry (fractions of the 512 px PNG; measured from orbit-512.png) ----------
const S0 = 500; // logo size at the lock (centred)
const S1 = 300; // after it rises for the end card
const Y1 = 300;
const RING = {x: 0.504, y: 0.49, rx: 0.428, ry: 0.142, rot: -19};
const PLANET = {x: 0.49, y: 0.5, r: 0.282};
const SAT = {x: 0.8, y: 0.25};
const logoAt = (g: number) => {
  const rise = ease.cubicInOut(prog(g, RISE[0], RISE[1]));
  return {y: lerp(CY, Y1, rise), size: lerp(S0, S1, rise)};
};
const rel = (size: number, cy: number, fx: number, fy: number) => [CX + (fx - 0.5) * size, cy + (fy - 0.5) * size] as const;

// ---------- montage ----------
const irisClip = (k: number, e: number) => {
  if (k % 3 === 1) return `circle(${f(((DIAG + 20) * e))}px at 50% 50%)`;
  if (k % 3 === 2) return `inset(${f((CY + 10) * (1 - e))}px ${f((CX + 10) * (1 - e))}px round ${f(48 * (1 - e) + 8)}px)`;
  const R = 1520 * e;
  return `polygon(${CX}px ${f(CY - R)}px, ${f(CX + R)}px ${CY}px, ${CX}px ${f(CY + R)}px, ${f(CX - R)}px ${CY}px)`;
};
function f(v: number) {
  return v.toFixed(1);
}
const IrisEdge: React.FC<{k: number; e: number; color: string}> = ({k, e, color}) => {
  const o = 1 - e ** 3;
  const common = {fill: 'none', stroke: color, strokeWidth: 7, opacity: o};
  let shape: React.ReactNode;
  if (k % 3 === 1) shape = <circle cx={CX} cy={CY} r={(DIAG + 20) * e} {...common} />;
  else if (k % 3 === 2) {
    const ix = (CX + 10) * (1 - e);
    const iy = (CY + 10) * (1 - e);
    shape = <rect x={ix} y={iy} width={Math.max(0, W - 2 * ix)} height={Math.max(0, H - 2 * iy)} rx={48 * (1 - e) + 8} {...common} />;
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
  const {World, HERO_FRAME} = SECTION_IMPL[w.id];
  const t = g - MONTAGE_BEATS[k];
  return (
    <AbsoluteFill style={{clipPath: clip, background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${(1.08 - 0.08 * ease.cubicOut(clamp(t / 40))).toFixed(4)})`}}>
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
    <div style={{position: 'absolute', left: 150, top: 706, opacity: ap * (1 - va), transform: `translateX(${(1 - ap) * -40 + va * 30}px)`}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.32em', color: acc}}>{`${pad2(w.index)} / 10`}</div>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 116, letterSpacing: '-0.035em', lineHeight: 1.04, color: acc, textShadow: `0 0 34px ${rgba(acc, 0.55)}`, whiteSpace: 'nowrap'}}>{w.name}</div>
      <div style={{marginTop: 10, height: 4, width: 220 * ap, background: acc, boxShadow: `0 0 12px ${acc}`}} />
    </div>
  );
};

const planetC = () => rel(S0, CY, PLANET.x, PLANET.y);
const Montage: React.FC<{g: number}> = ({g}) => {
  if (g >= CONVERGE + 34) return null;
  const k = Math.min(WORLDS.length - 1, Math.floor((g - MONTAGE_BEATS[0]) / MBEAT));
  const t = g - MONTAGE_BEATS[k];
  const e = k > 0 ? ease.cubicOut(prog(t, 0, IRIS)) : 1;
  const opening = k > 0 && t < IRIS;
  // After the last beat the hero shrinks into the forming planet.
  const [px, py] = planetC();
  const shrink =
    g >= CONVERGE - 6 ? `circle(${f(lerp(DIAG + 40, PLANET.r * S0, ease.cubicInOut(prog(g, CONVERGE - 6, CONVERGE + 22))))}px at ${f(lerp(CX, px, prog(g, CONVERGE - 6, CONVERGE + 22)))}px ${f(py)}px)` : undefined;
  return (
    <AbsoluteFill style={{opacity: 1 - prog(g, CONVERGE + 16, CONVERGE + 34)}}>
      {opening ? <Hero k={k - 1} g={g} /> : null}
      <Hero k={k} g={g} clip={opening ? irisClip(k, e) : shrink} />
      {opening ? <IrisEdge k={k} e={e} color={ACCENT[WORLDS[k].id]} /> : null}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 34% 26% at 22% 78%, rgba(4,11,54,0.66) 0%, rgba(4,11,54,0) 100%), linear-gradient(to top, rgba(4,11,54,0.78) 0%, rgba(4,11,54,0.35) 32%, rgba(4,11,54,0) 55%)',
          opacity: 1 - smooth(CONVERGE - 8, CONVERGE + 4, g),
        }}
      />
      {g < CONVERGE ? <NameFlash k={k} t={t} /> : null}
    </AbsoluteFill>
  );
};

// ---------- the ten orbits converge onto the logo's ring, the planet forms, the satellite comes round ----------
const conv = (g: number) => ease.cubicInOut(prog(g, CONVERGE - 14, LOGO_LOCK - 2));
const ringGeom = (j: number, g: number) => {
  const e = conv(g);
  const [cx, cy] = rel(S0, CY, RING.x, RING.y);
  const rx = lerp(700 + 62 * j, RING.rx * S0, e);
  return {cx: lerp(CX, cx, e), cy: lerp(CY, cy, e), rx, ry: rx * lerp(0.5 + 0.02 * j, RING.ry / RING.rx, e), rot: RING.rot + (j % 2 ? 1 : -1) * (6 + 2 * j) * (1 - e)};
};
const ConvergeRings: React.FC<{g: number}> = ({g}) => {
  const vis = smooth(CONVERGE - 16, CONVERGE - 2, g);
  if (vis <= 0 || g >= LOGO_LOCK + 2) return null;
  const silver = ease.cubicIn(prog(g, LOGO_LOCK - 10, LOGO_LOCK));
  const t = g - CONVERGE;
  const [px, py] = planetC();
  const pr = PLANET.r * S0 * ease.backOut(prog(g, CONVERGE + 6, CONVERGE + 40));
  const pOp = smooth(CONVERGE + 4, CONVERGE + 22, g);
  // satellite: rides the innermost orbit, then settles on the logo's satellite position for the lock
  const r0 = ringGeom(0, g);
  const phi = -2.2 + 0.075 * (g - LOGO_LOCK);
  const rr = (r0.rot * Math.PI) / 180;
  const ex = r0.cx + r0.rx * Math.cos(phi) * Math.cos(rr) - r0.ry * Math.sin(phi) * Math.sin(rr);
  const ey = r0.cy + r0.rx * Math.cos(phi) * Math.sin(rr) + r0.ry * Math.sin(phi) * Math.cos(rr);
  const [sx0, sy0] = rel(S0, CY, SAT.x, SAT.y);
  const settle = ease.cubicInOut(prog(g, LOGO_LOCK - 12, LOGO_LOCK));
  const sx = lerp(ex, sx0, settle);
  const sy = lerp(ey, sy0, settle);
  const satOp = smooth(CONVERGE + 10, CONVERGE + 24, g);
  return (
    <AbsoluteFill style={{opacity: vis}}>
      {pr > 1 ? (
        <>
          <div style={{position: 'absolute', left: px - pr * 2.2, top: py - pr * 2.2, width: pr * 4.4, height: pr * 4.4, borderRadius: '50%', background: `radial-gradient(circle, ${rgba(C.cobaltHover, 0.45)} 0%, ${rgba(C.cobalt, 0.18)} 40%, rgba(18,42,194,0) 70%)`, opacity: pOp}} />
          <div
            style={{
              position: 'absolute',
              left: px - pr,
              top: py - pr,
              width: 2 * pr,
              height: 2 * pr,
              borderRadius: '50%',
              opacity: pOp,
              background: 'radial-gradient(circle at 34% 28%, #cfe0ff 0%, #6f9bff 9%, #2a55f0 30%, #1533cf 58%, #0b1f9a 84%, #081670 100%)',
              boxShadow: `inset -${f(pr * 0.12)}px -${f(pr * 0.16)}px ${f(pr * 0.3)}px rgba(4,11,54,0.55)`,
            }}
          />
        </>
      ) : null}
      <svg width={W} height={H} style={{position: 'absolute', filter: 'blur(10px)', opacity: 0.55 + 0.45 * silver}}>
        {WORLDS.map((w, j) => {
          const r = ringGeom(j, g);
          return <ellipse key={w.id} cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} transform={`rotate(${f(r.rot)} ${f(r.cx)} ${f(r.cy)})`} fill="none" stroke={mixHex(ACCENT[w.id], '#dfe7f5', silver)} strokeWidth={12} />;
        })}
      </svg>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {WORLDS.map((w, j) => {
          const r = ringGeom(j, g);
          const col = mixHex(ACCENT[w.id], '#eef2fa', silver);
          const n = 30 + 4 * j;
          const circ = Math.PI * (3 * (r.rx + r.ry) - Math.sqrt((3 * r.rx + r.ry) * (r.rx + 3 * r.ry)));
          const dash = circ / n / 2;
          return (
            <g key={w.id} transform={`rotate(${f(r.rot)} ${f(r.cx)} ${f(r.cy)})`}>
              <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} fill="none" stroke={col} strokeWidth={2} opacity={0.6} />
              <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} fill="none" stroke={col} strokeWidth={6} strokeDasharray={`${f(dash)} ${f(dash)}`} strokeDashoffset={f((j % 2 ? 1 : -1) * t * (2.4 + 0.3 * j))} opacity={1 - 0.6 * silver} />
            </g>
          );
        })}
      </svg>
      {satOp > 0 ? (
        <div style={{position: 'absolute', left: sx - 19, top: sy - 19, width: 38, height: 38, borderRadius: '50%', opacity: satOp, background: 'radial-gradient(circle at 35% 30%, #ffd2c2 0%, #ff8a62 30%, #ff754d 55%, #c9431f 100%)', boxShadow: `0 0 26px 6px ${rgba(C.coral, 0.6)}`}} />
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- logo lock ----------
const Glint: React.FC<{x: number; y: number; t: number; size: number}> = ({x, y, t, size}) => {
  const k = t < 0 ? 0 : t < 6 ? ease.cubicOut(t / 6) : Math.exp(-(t - 6) / 12);
  if (k < 0.01) return null;
  const L = size * k;
  const rot = 12 + t * 0.6;
  return (
    <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible', filter: `drop-shadow(0 0 10px ${C.coral}) drop-shadow(0 0 4px #FFFFFF)`}}>
      <g transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)})`}>
        <circle r={L * 0.12} fill="#FFFFFF" opacity={k} />
        <polygon points={`${-L},0 0,${-L * 0.035} ${L},0 0,${L * 0.035}`} fill="#FFFFFF" opacity={k} />
        <polygon points={`0,${-L * 0.7} ${L * 0.03},0 0,${L * 0.7} ${-L * 0.03},0`} fill="#FFFFFF" opacity={k} />
        <g transform="rotate(45)">
          <polygon points={`${-L * 0.32},0 0,${-L * 0.02} ${L * 0.32},0 0,${L * 0.02}`} fill="#FFE6DD" opacity={0.8 * k} />
          <polygon points={`0,${-L * 0.32} ${L * 0.02},0 0,${L * 0.32} ${-L * 0.02},0`} fill="#FFE6DD" opacity={0.8 * k} />
        </g>
      </g>
    </svg>
  );
};

const Lock: React.FC<{g: number}> = ({g}) => {
  if (g < LOGO_LOCK) return null;
  const t = g - LOGO_LOCK;
  const {y, size} = logoAt(g);
  const pop = lerp(0.86, 1, ease.backOut(prog(t, 0, 16)));
  const shock = (d: number, max: number, color: string, w: number) => {
    const k = ease.expoOut(prog(t, d, d + 50));
    if (t < d || k >= 1) return null;
    return <circle key={d} cx={CX} cy={CY} r={size * 0.36 + max * k} fill="none" stroke={color} strokeWidth={w * (1 - k) + 1} opacity={1 - k} />;
  };
  const ek = ease.expoOut(prog(t, 2, 46));
  const [sx, sy] = rel(size * pop, y, SAT.x, SAT.y);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(circle at ${CX}px ${f(y)}px, ${rgba(C.cobaltHover, 0.5)} 0%, ${rgba(C.cobalt, 0.16)} 26%, rgba(18,42,194,0) 52%)`, opacity: 0.55 + 0.45 * Math.exp(-t / 30)}} />
      <AbsoluteFill style={{background: `radial-gradient(circle at ${CX}px ${f(y)}px, ${rgba(C.coral, 0.45)} 0%, ${rgba(C.coral, 0)} 38%)`, opacity: Math.exp(-t / 14)}} />
      {t < 60 ? (
        <svg width={W} height={H} style={{position: 'absolute', overflow: 'visible', filter: `drop-shadow(0 0 16px ${C.coral})`}}>
          {shock(0, 1400, C.coral, 16)}
          {shock(5, 1000, '#FFFFFF', 6)}
          {ek < 1 ? <ellipse cx={CX} cy={CY} rx={size * 0.43 + 1500 * ek} ry={(size * 0.43 + 1500 * ek) * 0.33} transform={`rotate(-19 ${CX} ${CY})`} fill="none" stroke={C.sky} strokeWidth={8 * (1 - ek) + 1} opacity={1 - ek} /> : null}
        </svg>
      ) : null}
      <Img
        src={staticFile(LOGO)}
        style={{
          position: 'absolute',
          left: CX - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          transform: `scale(${pop.toFixed(4)})`,
          opacity: prog(t, 0, 2),
          WebkitMaskImage: 'radial-gradient(closest-side, #000 84%, rgba(0,0,0,0) 100%)',
          maskImage: 'radial-gradient(closest-side, #000 84%, rgba(0,0,0,0) 100%)',
        }}
      />
      <Glint x={sx} y={sy} t={t - 3} size={230} />
      <Glint x={sx} y={sy} t={g - GLINT2} size={130} />
    </AbsoluteFill>
  );
};

// ---------- end card ----------
const line = (g: number, at: number) => ({p: ease.expoOut(prog(g, at, at + 22)), o: prog(g, at, at + 14)});
const EndCard: React.FC<{g: number}> = ({g}) => {
  if (g < LINES[0] - 2) return null;
  const [l0, l1, l2, l3] = LINES.map((x) => line(g, x));
  const centered: React.CSSProperties = {position: 'absolute', left: 0, width: W, textAlign: 'center'};
  return (
    <AbsoluteFill>
      <div
        style={{
          ...centered,
          top: 486,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 124,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          color: C.ink,
          clipPath: `inset(-20px ${(1 - l0.p) * 50}% -20px ${(1 - l0.p) * 50}%)`,
          transform: `translateY(${(1 - l0.p) * 26}px)`,
        }}
      >
        Job Engine <span style={{color: C.coral, textShadow: `0 0 30px ${rgba(C.coral, 0.35)}`}}>Orbit</span>
      </div>
      <div style={{...centered, top: 634, fontFamily: FONT, fontWeight: 500, fontSize: 46, letterSpacing: '-0.01em', color: C.muted, opacity: l1.o, transform: `translateY(${(1 - l1.p) * 22}px)`}}>
        Career intelligence for a broader you.
      </div>
      <div style={{...centered, top: 730, display: 'flex', justifyContent: 'center', opacity: l2.o, transform: `translateY(${(1 - l2.p) * 18}px)`}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: '0.28em', color: C.ink, padding: '12px 22px 12px 28px', borderRadius: 999, border: `1px solid ${C.line}`, background: C.panel, display: 'flex', alignItems: 'center', gap: 12}}>
          <span style={{width: 8, height: 8, borderRadius: '50%', background: C.coral, boxShadow: `0 0 8px ${C.coral}`}} />
          WINDOWS · LOCAL PREVIEW
        </div>
      </div>
      <div style={{...centered, top: 830, fontFamily: FONT, fontWeight: 400, fontSize: 22, letterSpacing: '0.01em', color: C.soft, opacity: 0.85 * l3.o, transform: `translateY(${(1 - l3.p) * 14}px)`}}>
        Research with evidence. Applications require review and authorization.
      </div>
    </AbsoluteFill>
  );
};

// Faint ten-orbit halo behind the end card: the worlds, quietly circling the planet.
const Halo: React.FC<{g: number}> = ({g}) => {
  const vis = smooth(LOGO_LOCK + 10, LOGO_LOCK + 70, g);
  if (vis <= 0) return null;
  const {y, size} = logoAt(g);
  const s = size / S0;
  return (
    <svg width={W} height={H} style={{position: 'absolute', opacity: 0.16 * vis}}>
      {WORLDS.map((w, j) => {
        const rx = (300 + 70 * j) * s * 1.25;
        const ry = rx * 0.34;
        const circ = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
        const dash = circ / (56 + 6 * j) / 2;
        return <ellipse key={w.id} cx={CX} cy={y} rx={rx} ry={ry} transform={`rotate(-19 ${CX} ${f(y)})`} fill="none" stroke={ACCENT[w.id]} strokeWidth={2.5} strokeDasharray={`${f(dash)} ${f(dash)}`} strokeDashoffset={f((j % 2 ? 1 : -1) * (g - LOGO_LOCK) * 0.5)} />;
      })}
    </svg>
  );
};

// Seeded star dust for the space behind the lock.
const STARS = (() => {
  const r = mulberry32(6480);
  return Array.from({length: 90}, () => ({x: r() * W, y: r() * H, s: 0.8 + r() * 1.8, ph: r() * 6.28, sp: 0.02 + r() * 0.04}));
})();
const Space: React.FC<{g: number}> = ({g}) => {
  const o = smooth(CONVERGE - 10, CONVERGE + 20, g);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 70% at 50% 42%, ${C.raised} 0%, ${C.bg} 45%, ${C.deep} 100%)`}} />
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s} fill={C.ink} opacity={0.18 + 0.22 * (0.5 + 0.5 * Math.sin(s.ph + g * s.sp))} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

export const Finale: React.FC = () => {
  const g = useCurrentFrame() - PAD + FINALE.start;
  const flash = g >= LOGO_LOCK ? Math.exp(-(g - LOGO_LOCK) / 7) : 0;
  return (
    <AbsoluteFill style={{background: C.deep}}>
      <Space g={g} />
      <Montage g={g} />
      <ConvergeRings g={g} />
      <Halo g={g} />
      <Lock g={g} />
      <EndCard g={g} />
      {flash > 0.004 ? <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #FFFFFF 0%, #FFE9E1 30%, ${rgba(C.coral, 0.7)} 62%, ${rgba(C.cobalt, 0.5)} 100%)`, opacity: 0.92 * flash}} /> : null}
    </AbsoluteFill>
  );
};
