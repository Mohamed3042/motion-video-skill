// CSS-3D kit for stations 1–3 (profile, globe, findings): glass holograms, in-scene titles, captions, motes,
// light comets. Everything is frame-driven (useWorldFrame) and lives in the station's LOCAL coords.
import React, {createContext, useContext} from 'react';
import {C, FONT, MONO} from '../../brand';
import {mulberry32, type V3} from '../../engine/math';
import {Card3D, Group3D, useWorldFrame} from '../../engine/space';
import {clamp, ease, mix, prog, rgba, sp} from '../../shared';

export {clamp, ease, mix, prog, rgba, sp};

// ------------------------------------------------------------------ glass hologram
export const glass = (accent: string, a = 0.8): React.CSSProperties => ({
  position: 'relative',
  boxSizing: 'border-box',
  borderRadius: 12,
  border: `1px solid ${C.line}`,
  background: `linear-gradient(135deg, rgba(120,150,255,0.13) 0%, rgba(120,150,255,0.03) 26%, rgba(12,28,88,0) 50%), rgba(12,28,88,${a})`,
  boxShadow: `0 0 0 1px ${rgba(accent, 0.12)}, 0 40px 90px rgba(2,6,23,0.55), inset 0 0 46px ${rgba(accent, 0.09)}, inset 0 1px 0 rgba(255,255,255,0.07)`,
  fontFamily: FONT,
  color: C.ink,
  overflow: 'hidden',
});

/** Shimmer + scanlines + accent edge light, drawn over a glass body. */
export const GlassFX: React.FC<{accent: string; edge?: 'left' | 'right' | 'top' | 'bottom'; seed?: number; glow?: number}> = ({accent, edge = 'left', seed = 0, glow = 0}) => {
  const f = useWorldFrame();
  const sweep = (((f + seed * 97) % 260) / 260) * 220 - 60; // % position of the diagonal shimmer band
  const vert = edge === 'left' || edge === 'right';
  return (
    <>
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `repeating-linear-gradient(0deg, ${rgba(C.sky, 0.04)} 0px, ${rgba(C.sky, 0.04)} 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)`}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `linear-gradient(112deg, rgba(255,255,255,0) ${sweep - 14}%, rgba(255,255,255,0.055) ${sweep}%, rgba(255,255,255,0) ${sweep + 14}%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          [edge]: 0,
          ...(vert ? {top: 14, bottom: 14, width: 2} : {left: 14, right: 14, height: 2}),
          background: accent,
          boxShadow: `0 0 10px ${accent}, 0 0 ${26 + 30 * glow}px ${rgba(accent, 0.7)}`,
        }}
      />
      {glow > 0 ? <div style={{position: 'absolute', inset: 0, borderRadius: 12, boxShadow: `inset 0 0 0 2px ${rgba(accent, 0.8 * glow)}, inset 0 0 60px ${rgba(accent, 0.25 * glow)}`}} /> : null}
    </>
  );
};

/** Spring-in amount for a hologram (Y-rotation + Z push), and its exit. */
export const holoState = (f: number, at: number, out?: number, outLen = 26) => {
  const s = sp(f, at, {damping: 15, stiffness: 95, mass: 1});
  const o = out !== undefined ? ease.cubicIn(prog(f, out, out + outLen)) : 0;
  return {s, o, vis: f >= at && o < 1};
};

/** Opacity of the enclosing hologram (for its floating layers). */
export const HoloFade = createContext(1);
export const useHoloFade = () => useContext(HoloFade);

export type HoloProps = {
  p: V3;
  r?: V3;
  w: number;
  h?: number;
  accent: string;
  at: number;
  out?: number;
  /** +1 swings in from the right (rotating about Y), -1 from the left */
  from?: 1 | -1;
  edge?: 'left' | 'right' | 'top' | 'bottom';
  glow?: number;
  pad?: number;
  alpha?: number;
  seed?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  /** extra 3D children (chips that float off the glass), in the panel's local coords (px, y up) */
  layers?: React.ReactNode;
};

export const Holo: React.FC<HoloProps> = ({p, r = [0, 0, 0], w, h, accent, at, out, from = 1, edge = 'left', glow = 0, pad = 32, alpha = 0.86, seed = 0, style, children, layers}) => {
  const f = useWorldFrame();
  const {s, o, vis} = holoState(f, at, out);
  if (!vis) return null;
  const ry = r[1] + (1 - s) * 64 * from + o * 40 * from;
  const z = p[2] - (1 - s) * 520 - o * 380;
  const y = p[1] - (1 - s) * 40 + o * 60;
  return (
    <Group3D p={[p[0], y, z]} r={[r[0] + (1 - s) * 8, ry, r[2]]}>
      <Card3D w={w} h={h} opacity={clamp(s * 1.8) * (1 - o)} nearFade={200}>
        <div style={{...glass(accent, alpha), width: w, height: h, padding: pad, ...style}}>
          {children}
          <GlassFX accent={accent} edge={edge} seed={seed} glow={glow} />
        </div>
      </Card3D>
      <HoloFade.Provider value={clamp(s * 1.8) * (1 - o)}>{layers}</HoloFade.Provider>
    </Group3D>
  );
};

/** A staggered row reveal (expo-out slide + fade) — use inside hologram content. */
export const rowIn = (f: number, at: number, dx = 34): React.CSSProperties => {
  const t = ease.expoOut(prog(f, at, at + 20));
  return {opacity: t, transform: `translateX(${(1 - t) * dx}px)`};
};

// ------------------------------------------------------------------ small UI pieces (glass-friendly)
export const Chip: React.FC<{label: React.ReactNode; color: string; on?: number; fs?: number; mono?: boolean; style?: React.CSSProperties}> = ({label, color, on = 0, fs = 22, mono, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: fs * 1.85,
      padding: `0 ${fs * 0.75}px`,
      borderRadius: 999,
      border: `1px solid ${rgba(color, 0.55 + 0.4 * on)}`,
      background: rgba(color, 0.07 + 0.2 * on),
      boxShadow: on > 0 ? `0 0 ${18 * on}px ${rgba(color, 0.45 * on)}` : undefined,
      color: on > 0.5 ? C.ink : color,
      fontFamily: mono ? MONO : FONT,
      fontWeight: mono ? 700 : 600,
      fontSize: fs,
      letterSpacing: mono ? '0.06em' : undefined,
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {label}
  </div>
);

export const Button: React.FC<{label: React.ReactNode; primary?: boolean; press?: number; glow?: number; accent?: string; fs?: number; h?: number; icon?: React.ReactNode; style?: React.CSSProperties}> = ({
  label,
  primary,
  press = 0,
  glow = 0,
  accent = C.coral,
  fs = 23,
  h = 52,
  icon,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      height: h,
      padding: `0 ${fs * 0.9}px`,
      borderRadius: 8,
      background: primary ? (press > 0.05 ? C.cobaltHover : C.cobalt) : 'rgba(7,18,83,0.6)',
      border: `1px solid ${primary ? rgba('#6f8cff', 0.8) : C.line}`,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: fs,
      color: C.ink,
      whiteSpace: 'nowrap',
      transform: `scale(${1 - 0.07 * press})`,
      boxShadow: glow > 0 ? `0 0 0 ${3 * glow}px ${rgba(accent, 0.6 * glow)}, 0 0 ${36 * glow}px ${rgba(accent, 0.55 * glow)}` : 'none',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {icon}
    {label}
  </div>
);

/** 1 at `at`, decaying: a press / flash pulse. */
export const pulse = (f: number, at: number, len = 14) => (f < at ? 0 : Math.exp(-(f - at) / (len / 3)) * clamp((f - at + 1) / 2));

export const Toggle: React.FC<{on: number; color: string; size?: number}> = ({on, color, size = 34}) => (
  <div style={{position: 'relative', width: size * 1.9, height: size, borderRadius: size, background: on > 0.5 ? rgba(color, 0.35) : 'rgba(7,18,83,0.9)', border: `1px solid ${on > 0.5 ? color : C.line}`, boxShadow: on > 0.5 ? `0 0 20px ${rgba(color, 0.6)}` : undefined, flex: 'none'}}>
    <div style={{position: 'absolute', top: 3, left: 3 + on * size * 0.9, width: size - 8, height: size - 8, borderRadius: '50%', background: on > 0.5 ? C.ink : C.soft}} />
  </div>
);

export const SampleTag: React.FC<{color?: string; fs?: number}> = ({color = C.soft, fs = 18}) => (
  <div style={{display: 'inline-flex', fontFamily: MONO, fontWeight: 700, fontSize: fs, letterSpacing: '0.16em', color, border: `1px dashed ${rgba(color, 0.7)}`, borderRadius: 999, padding: '5px 13px', whiteSpace: 'nowrap'}}>SAMPLE DATA</div>
);

// ------------------------------------------------------------------ in-scene title
export const Title3D: React.FC<{
  p: V3;
  r?: V3;
  idx: number;
  name: string;
  promise: React.ReactNode;
  accent: string;
  keys?: number[]; // typed (one key frame per character)
  from?: number; // spring letters from this frame
  promiseAt: number;
  out: number;
  size?: number;
  align?: 'left' | 'center';
}> = ({p, r = [0, 0, 0], idx, name, promise, accent, keys, from = 6, promiseAt, out, size = 132, align = 'left'}) => {
  const f = useWorldFrame();
  if (f < -40 || f > out + 40) return null;
  const o = ease.cubicIn(prog(f, out, out + 26));
  const idxIn = ease.expoOut(prog(f, (keys ? keys[0] : from) - 8, (keys ? keys[0] : from) + 14));
  const pIn = ease.expoOut(prog(f, promiseAt, promiseAt + 24));
  const typed = keys ? keys.filter((k) => f >= k).length : name.length;
  const caret = keys && f >= keys[0] - 10 && f < keys[keys.length - 1] + 34;
  const W = Math.round(name.length * size * 0.66 + 80);
  const shadow = `0 0 34px ${rgba(accent, 0.38)}, 0 4px 28px rgba(2,6,23,0.95)`;
  return (
    <Group3D p={[p[0], p[1] + o * 50, p[2] - o * 260]} r={[r[0], r[1] - o * 12, r[2]]}>
      <Card3D w={W} h={size * 2.3} opacity={1 - o} nearFade={260}>
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 40% 52%, rgba(2,6,23,0.62) 0%, rgba(2,6,23,0.3) 50%, rgba(2,6,23,0) 76%)', display: 'flex', flexDirection: 'column', alignItems: align === 'left' ? 'flex-start' : 'center', justifyContent: 'center', fontFamily: FONT, color: C.ink}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: MONO, fontWeight: 700, fontSize: size * 0.2, letterSpacing: '0.34em', color: accent, opacity: idxIn, textShadow: shadow}}>
            <span style={{width: 70 * idxIn, height: 3, background: accent, boxShadow: `0 0 12px ${accent}`}} />
            {String(idx).padStart(2, '0')} / 10
          </div>
          <div style={{display: 'flex', alignItems: 'flex-end', fontWeight: 700, fontSize: size, lineHeight: 1.04, letterSpacing: '-0.035em', whiteSpace: 'pre', marginTop: size * 0.12, textShadow: shadow}}>
            {name.split('').map((ch, i) => {
              if (keys) {
                const k = keys[i];
                const on = f >= k;
                const strike = on ? clamp((f - k) / 5) : 0;
                return (
                  <span key={i} style={{display: 'inline-block', opacity: on ? 1 : 0, transform: `translateY(${(1 - ease.cubicOut(strike)) * 12}px)`, color: strike < 1 ? accent : C.ink}}>
                    {ch}
                  </span>
                );
              }
              const s = sp(f, from + i * 1.7, {damping: 13, stiffness: 170, mass: 0.7});
              return (
                <span key={i} style={{display: 'inline-block', opacity: clamp(s * 2.5), transform: `translateY(${(1 - s) * 70}px) rotateX(${(1 - s) * -70}deg)`}}>
                  {ch}
                </span>
              );
            })}
            {caret ? <span style={{display: 'inline-block', width: size * 0.11, height: size * 0.8, marginLeft: 10, marginBottom: size * 0.08, background: accent, boxShadow: `0 0 16px ${accent}`, opacity: typed < name.length || Math.floor(f / 8) % 2 === 0 ? 1 : 0}} /> : null}
          </div>
          <div style={{fontWeight: 500, fontSize: size * 0.3, color: C.muted, marginTop: size * 0.16, opacity: pIn, transform: `translateY(${(1 - pIn) * 22}px)`, textShadow: '0 2px 18px rgba(2,6,23,0.95)'}}>{promise}</div>
        </div>
      </Card3D>
    </Group3D>
  );
};

// ------------------------------------------------------------------ 1–3 word caption, set in the scene
export const Caption3D: React.FC<{p: V3; r?: V3; at: number; out: number; children: React.ReactNode; accent: string; fs?: number; billboard?: boolean}> = ({p, r, at, out, children, accent, fs = 64, billboard}) => {
  const f = useWorldFrame();
  const a = ease.expoOut(prog(f, at, at + 22)) * (1 - ease.cubicIn(prog(f, out, out + 18)));
  if (a <= 0) return null;
  return (
    <Card3D p={[p[0], p[1] - (1 - a) * 30, p[2]]} r={r} billboard={billboard} opacity={a} nearFade={200}>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: fs, letterSpacing: '-0.02em', color: C.ink, whiteSpace: 'nowrap', textShadow: `0 0 30px ${rgba(accent, 0.5)}, 0 3px 24px rgba(2,6,23,0.95)`}}>{children}</div>
    </Card3D>
  );
};

// ------------------------------------------------------------------ foreground motes (bokeh dust past the lens)
export const Motes: React.FC<{seed: number; n: number; box: [number, number, number, number, number, number]; color: string; size?: [number, number]; drift?: number}> = ({seed, n, box, color, size = [6, 40], drift = 0.25}) => {
  const f = useWorldFrame();
  const pts = React.useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({length: n}, () => ({
      p: [mix(box[0], box[1], r()), mix(box[2], box[3], r()), mix(box[4], box[5], r())] as V3,
      s: mix(size[0], size[1], r() ** 2),
      ph: r() * 6.28,
      a: 0.35 + 0.6 * r(),
      v: (r() - 0.5) * 2,
    }));
  }, [seed, n, box, size]);
  return (
    <>
      {pts.map((m, i) => {
        const tw = 0.65 + 0.35 * Math.sin(f * 0.05 + m.ph);
        const p: V3 = [m.p[0] + Math.sin(f * 0.006 + m.ph) * 40 + f * drift * m.v, m.p[1] + f * drift * 0.5 + Math.cos(f * 0.008 + m.ph) * 30, m.p[2]];
        return (
          <Card3D key={i} p={p} billboard w={m.s} h={m.s} near={30} nearFade={180} opacity={m.a * tw}>
            <div style={{width: m.s, height: m.s, borderRadius: '50%', background: `radial-gradient(circle, ${rgba('#ffffff', 0.9)} 0%, ${rgba(color, 0.55)} 30%, ${rgba(color, 0)} 70%)`}} />
          </Card3D>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ light comet travelling along a 3D path
export const Comet: React.FC<{path: (t: number) => V3; a: number; b: number; color: string; size?: number; trail?: number; ease?: (t: number) => number}> = ({path, a, b, color, size = 46, trail = 14, ease: e = ease.inOut}) => {
  const f = useWorldFrame();
  if (f < a || f > b + 10) return null;
  const t = e(prog(f, a, b));
  const fade = 1 - prog(f, b, b + 10);
  return (
    <>
      {Array.from({length: trail}, (_, i) => {
        const u = t - i * 0.022;
        if (u < 0) return null;
        const k = 1 - i / trail;
        const s = size * (0.35 + 0.65 * k);
        return (
          <Card3D key={i} p={path(u)} billboard w={s} h={s} near={20} nearFade={80} opacity={fade * k * (i === 0 ? 1 : 0.7)}>
            <div style={{width: s, height: s, borderRadius: '50%', background: `radial-gradient(circle, #ffffff 0%, ${rgba(color, 0.9)} 22%, ${rgba(color, 0.25)} 48%, ${rgba(color, 0)} 70%)`}} />
          </Card3D>
        );
      })}
    </>
  );
};

/** Quadratic bezier in 3D. */
export const bez = (a: V3, c: V3, b: V3) => (t: number): V3 => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], u * u * a[2] + 2 * u * t * c[2] + t * t * b[2]];
};

/** A soft round glow card (billboard) — for sparks and light points in the CSS layer. */
export const Spark: React.FC<{p: V3; size: number; color: string; opacity?: number; core?: boolean}> = ({p, size, color, opacity = 1, core = true}) =>
  opacity <= 0.003 ? null : (
    <Card3D p={p} billboard w={size} h={size} near={20} nearFade={120} opacity={opacity}>
      <div style={{width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle, ${core ? '#ffffff' : rgba(color, 0.9)} 0%, ${rgba(color, 0.75)} 14%, ${rgba(color, 0.22)} 38%, ${rgba(color, 0)} 68%)`}} />
    </Card3D>
  );
