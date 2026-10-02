// Shared building blocks for worlds 1–3 (profile, globe, findings): title moment, real-app UI fragments,
// and the two portal motifs that hand off between them (the sphere and the glowing point).
import React from 'react';
import {C, FONT, MONO} from '../../brand';
import {clamp, ease, mix, prog, rgba, sp} from '../../shared';

export {clamp, ease, mix, mixHex, prog, rgba, sp, Glow, Check, Arrow} from '../../shared';

// ------------------------------------------------------------------ portal geometry (shared by both sides)
// profile exit → globe entry: the resume page curls into this sphere
export const SPHERE = {cx: 960, cy: 540, r: 300};
// globe exit → findings entry: everything collapses into this glowing point
export const POINT = {x: 960, y: 540};

// Latitude "lines" of the portal sphere seen edge-on: y offsets as a fraction of r.
export const SPHERE_LATS = [-0.78, -0.56, -0.3, 0, 0.3, 0.56, 0.78];

// The sphere's face: fills its (round, overflow-hidden) parent — shaded body lit from upper left + latitude
// chords (full-width lines clipped by the circle). Used by the curling page AND by the globe's entrance.
export const SphereFace: React.FC<{lines?: number; opacity?: number}> = ({lines = 1, opacity = 1}) => (
  <div style={{position: 'absolute', inset: 0, opacity, background: `radial-gradient(circle at 36% 30%, #dce8ff 0%, ${C.sky} 13%, ${C.cobaltHover} 44%, ${C.panel} 74%, ${C.deep} 100%)`}}>
    {SPHERE_LATS.map((u, i) => (
      <div key={i} style={{position: 'absolute', left: 0, right: 0, top: `${50 + u * 50}%`, height: 2, marginTop: -1, background: rgba(C.ink, 0.5 * lines)}} />
    ))}
    <div style={{position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: `inset 0 0 0 2px ${rgba(C.sky, 0.7)}, inset -30px -40px 90px ${rgba(C.deep, 0.7)}`}} />
  </div>
);

export const PortalSphere: React.FC<{opacity?: number; lines?: number}> = ({opacity = 1, lines = 1}) => {
  const {cx, cy, r} = SPHERE;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity}}>
      <div style={{position: 'absolute', left: cx - r * 1.5, top: cy - r * 1.5, width: r * 3, height: r * 3, borderRadius: '50%', background: `radial-gradient(circle, ${rgba(C.sky, 0.3)} 30%, ${rgba(C.sky, 0.1)} 42%, ${rgba(C.sky, 0)} 62%)`}} />
      <div style={{position: 'absolute', left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, borderRadius: '50%', overflow: 'hidden'}}>
        <SphereFace lines={lines} />
      </div>
    </div>
  );
};

// The portal point: a small hot core inside a soft halo. `color` blends sky → mint across the hand-off.
export const PortalPoint: React.FC<{x?: number; y?: number; size?: number; color: string; opacity?: number}> = ({x = POINT.x, y = POINT.y, size = 1, color, opacity = 1}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity}}>
    <div
      style={{
        position: 'absolute',
        left: x - 260 * size,
        top: y - 260 * size,
        width: 520 * size,
        height: 520 * size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${rgba(color, 0.55)} 0%, ${rgba(color, 0.2)} 16%, ${rgba(color, 0.06)} 38%, ${rgba(color, 0)} 66%)`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: x - 16 * size,
        top: y - 16 * size,
        width: 32 * size,
        height: 32 * size,
        borderRadius: '50%',
        background: `radial-gradient(circle, #ffffff 0%, ${color} 46%, ${rgba(color, 0)} 100%)`,
      }}
    />
  </div>
);

// ------------------------------------------------------------------ title moment (first ~1.5 s)
// idx "0N / 10" (mono), world name (Space Grotesk 700), one-line promise. `keys` = per-character frames
// (typewriter); otherwise the letters rise with a spring from `from`.
export const Title: React.FC<{
  f: number;
  idx: number;
  name: string;
  promise: React.ReactNode;
  accent: string;
  keys?: number[];
  from?: number;
  promiseAt?: number;
  out?: number;
}> = ({f, idx, name, promise, accent, keys, from = 8, promiseAt = 44, out = 104}) => {
  if (f > out + 20 || f < -12) return null;
  const o = ease.cubicIn(prog(f, out, out + 18));
  const idxIn = ease.expoOut(prog(f, 0, 18));
  const pIn = ease.expoOut(prog(f, promiseAt, promiseAt + 22));
  const typing = keys ? f >= keys[0] && f < keys[keys.length - 1] + 30 : false;
  const typed = keys ? keys.filter((k) => f >= k).length : 0;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - o, transform: `translateY(${-40 * o}px)`}}>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(100deg, ${rgba(C.deep, 0.92)} 0%, ${rgba(C.deep, 0.7)} 34%, ${rgba(C.deep, 0)} 58%)`}} />
      <div style={{position: 'absolute', left: 124, top: 168, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.32em', color: accent, opacity: idxIn}}>
        {String(idx).padStart(2, '0')} / 10
      </div>
      <div style={{position: 'absolute', left: 118, top: 204, display: 'flex', alignItems: 'flex-end', fontFamily: FONT, fontWeight: 700, fontSize: 112, lineHeight: 1, letterSpacing: '-0.035em', color: C.ink, whiteSpace: 'pre'}}>
        {name.split('').map((ch, i) => {
          if (keys) {
            const k = keys[i];
            const on = f >= k;
            const strike = on ? clamp((f - k) / 4) : 0;
            return (
              <span key={i} style={{display: 'inline-block', opacity: on ? 1 : 0, transform: `translateY(${(1 - ease.cubicOut(strike)) * 10}px)`, color: strike < 1 ? accent : C.ink}}>
                {ch}
              </span>
            );
          }
          const s = sp(f, from + i * 1.6, {damping: 14, stiffness: 190, mass: 0.7});
          return (
            <span key={i} style={{display: 'inline-block', opacity: clamp(s * 3), transform: `translateY(${(1 - s) * 64}px)`}}>
              {ch}
            </span>
          );
        })}
        {keys && typing ? (
          <span style={{display: 'inline-block', width: 14, height: 92, marginLeft: 8, marginBottom: 6, background: accent, opacity: typed < name.length || Math.floor(f / 8) % 2 === 0 ? 1 : 0}} />
        ) : null}
      </div>
      <div style={{position: 'absolute', left: 124, top: 336, fontFamily: FONT, fontWeight: 500, fontSize: 38, color: C.muted, opacity: pIn, transform: `translateY(${(1 - pIn) * 18}px)`}}>
        {promise}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ UI fragments (real-app look)
export const panelStyle = (accent?: string): React.CSSProperties => ({
  position: 'absolute',
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: 12,
  boxShadow: `0 40px 90px rgba(2,6,30,0.6)${accent ? `, 0 0 70px ${rgba(accent, 0.08)}` : ''}, inset 0 1px 0 rgba(255,255,255,0.04)`,
  fontFamily: FONT,
  color: C.ink,
  overflow: 'hidden',
});

// entrance helper: returns {opacity, transform} for a spring-in from below at frame `at`
export const rise = (f: number, at: number, dy = 60, out?: [number, number]) => {
  const s = sp(f, at, {damping: 16, stiffness: 140, mass: 0.8});
  const o = out ? ease.cubicIn(prog(f, out[0], out[1])) : 0;
  return {opacity: clamp(s * 2.2) * (1 - o), transform: `translateY(${(1 - s) * dy + o * -24}px) scale(${mix(0.96, 1, s)})`};
};

// 7 px controls; cobalt primary. `press` 0..1 pulse (1 = fully pressed), `glow` 0..1 accent halo.
export const Btn: React.FC<{label: React.ReactNode; primary?: boolean; press?: number; icon?: React.ReactNode; fs?: number; h?: number; px?: number; glow?: number; accent?: string; style?: React.CSSProperties}> = ({
  label,
  primary,
  press = 0,
  icon,
  fs = 20,
  h = 48,
  px = 20,
  glow = 0,
  accent = C.coral,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      height: h,
      padding: `0 ${px}px`,
      borderRadius: 7,
      background: primary ? (press > 0.05 ? C.cobaltHover : C.cobalt) : rgba(C.bg, 0.6),
      border: `1px solid ${primary ? rgba('#6f8cff', 0.7) : C.line}`,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: fs,
      color: C.ink,
      whiteSpace: 'nowrap',
      transform: `scale(${1 - 0.06 * press})`,
      boxShadow: glow > 0 ? `0 0 0 ${3 * glow}px ${rgba(accent, 0.55 * glow)}, 0 0 ${40 * glow}px ${rgba(accent, 0.5 * glow)}` : 'none',
      ...style,
    }}
  >
    {icon}
    {label}
  </div>
);

// text-bearing status pill
export const Pill: React.FC<{label: React.ReactNode; color: string; fill?: number; fs?: number; dot?: boolean; style?: React.CSSProperties}> = ({label, color, fill = 0, fs = 15, dot, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      height: fs * 1.9,
      padding: `0 ${fs * 0.8}px`,
      borderRadius: 999,
      border: `1px solid ${rgba(color, 0.75)}`,
      background: rgba(color, 0.08 + 0.16 * fill),
      color,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: fs,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {dot ? <span style={{width: fs * 0.5, height: fs * 0.5, borderRadius: '50%', background: color}} /> : null}
    {label}
  </div>
);

export const SampleChip: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <div
    style={{
      position: 'absolute',
      fontFamily: MONO,
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: '0.16em',
      color: C.soft,
      border: `1px dashed ${rgba(C.soft, 0.6)}`,
      borderRadius: 999,
      padding: '4px 10px',
      ...style,
    }}
  >
    SAMPLE DATA
  </div>
);

// ------------------------------------------------------------------ tiny inline icons (stroke, 24-grid)
const Ico: React.FC<{size: number; color: string; d: string; w?: number}> = ({size, color, d, w = 2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block', flex: 'none'}}>
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const IconDownload = (p: {size: number; color: string}) => <Ico {...p} d="M12 4v11M7 10l5 5 5-5M5 20h14" />;
export const IconDoc = (p: {size: number; color: string}) => <Ico {...p} d="M7 3h7l4 4v14H7zM14 3v4h4M10 13h5M10 17h5" />;
export const IconPlus = (p: {size: number; color: string}) => <Ico {...p} d="M12 5v14M5 12h14" w={2.4} />;
export const IconUser = (p: {size: number; color: string}) => <Ico {...p} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c1-4 4-6 7-6s6 2 7 6" />;
export const IconShield = (p: {size: number; color: string}) => <Ico {...p} d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />;
export const IconPin = (p: {size: number; color: string}) => <Ico {...p} d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />;
export const IconLayers = (p: {size: number; color: string}) => <Ico {...p} d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />;
export const IconPulse = (p: {size: number; color: string}) => <Ico {...p} d="M3 12h4l2-6 4 12 2-6h6" />;
export const IconBriefcase = (p: {size: number; color: string}) => <Ico {...p} d="M4 8h16v11H4zM9 8V5h6v3M4 13h16" />;
export const IconFeed = (p: {size: number; color: string}) => <Ico {...p} d="M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8M6 19h.01" w={2.4} />;
export const IconGlobe = (p: {size: number; color: string}) => <Ico {...p} d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />;
