// Shared picture kit for worlds 8 (Library) and 9 (Edit Room). Same builder owns both folders.
import React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';

export const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EXPO_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const lerp = (f: number, a: number, b: number, from = 0, to = 1, easing: (t: number) => number = EXPO) =>
  interpolate(f, [a, b], [from, to], {...CL, easing});
export const pop = (f: number, at: number, damping = 14, stiffness = 170, mass = 0.7) =>
  f < at ? 0 : spring({frame: f - at, fps: 60, config: {damping, stiffness, mass}});
export const pulse = (f: number, at: number, tau = 10) => (f < at ? 0 : Math.exp(-(f - at) / tau));
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const [x, y] = [rgb(a), rgb(b)];
  const k = Math.max(0, Math.min(1, t));
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
export const alpha = (h: string, a: number) => `rgba(${rgb(h).join(',')},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
// SMPTE-style HH:MM:SS:FF
export const tc = (h: number, m: number, s: number, fr: number) => [h, m, s, fr].map((v) => String(v).padStart(2, '0')).join(':');

export const AQUA = ACCENT.library;
export const CORAL = ACCENT.editroom;

// ---------- title moment ----------
export const WorldTitle: React.FC<{f: number; index: number; name: string; promise: string; accent: string; x: number; y: number; out: number; size?: number}> = ({
  f,
  index,
  name,
  promise,
  accent,
  x,
  y,
  out,
  size = 150,
}) => {
  const leave = lerp(f, out, out + 16, 0, 1, EXPO_IN);
  if (leave >= 1) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: 1 - leave, translate: `0px ${-leave * 40}px`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: '0.24em', color: accent, opacity: lerp(f, 0, 12)}}>
        <span>{String(index).padStart(2, '0')} / 11</span>
        <span style={{width: 150 * lerp(f, 2, 30), height: 2, background: accent, opacity: 0.8}} />
      </div>
      <div style={{display: 'flex', overflow: 'hidden', marginTop: 4, paddingBottom: size * 0.05}}>
        {[...name].map((ch, i) => {
          const s = pop(f, 1 + i * 2, 15, 160, 0.8);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: size,
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                color: C.text,
                translate: `0px ${(1 - s) * size * 1.05}px`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 38, color: C.muted, marginTop: 10, opacity: lerp(f, 14, 30), translate: `${lerp(f, 14, 36, 24, 0)}px 0px`}}>{promise}</div>
    </div>
  );
};

// Small mono tool label ("FOOTAGE LIBRARY") with an accent tick; wipes in at `at`, out at `out`.
export const ToolLabel: React.FC<{f: number; at: number; out: number; text: string; accent: string; x?: number; y?: number; n?: string}> = ({f, at, out, text, accent, x = 120, y = 146, n}) => {
  const a = lerp(f, at, at + 14);
  const o = 1 - lerp(f, out - 8, out + 2, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: 14, opacity: o, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: '0.2em'}}>
      <span style={{width: 10, height: 10, borderRadius: 2, background: accent, scale: `${a}`}} />
      <span style={{color: accent, clipPath: `inset(0 ${(1 - a) * 100}% 0 0)`}}>{text}</span>
      {n ? <span style={{color: C.muted, opacity: 0.7 * a, fontWeight: 500}}>{n}</span> : null}
      <span style={{width: 90 * a, height: 1, background: accent, opacity: 0.5}} />
    </div>
  );
};

// ---------- Carbon UI pieces ----------
export const Panel: React.FC<{x: number; y: number; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode; glow?: string}> = ({x, y, w, h, style, children, glow}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 9,
      background: C.panel,
      border: `1px solid ${C.line}`,
      boxShadow: `0 30px 70px rgba(0,0,0,0.5)${glow ? `, 0 0 90px ${alpha(glow, 0.12)}` : ''}`,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<{children: React.ReactNode; tone?: 'amber' | 'line' | 'accent' | 'raised'; accent?: string; style?: React.CSSProperties; mono?: boolean}> = ({
  children,
  tone = 'line',
  accent = C.amber,
  style,
  mono,
}) => {
  const t = {
    amber: {background: C.amber, color: C.onAmber, border: `1px solid ${C.amber}`},
    line: {background: 'transparent', color: C.muted, border: `1px solid ${C.line}`},
    accent: {background: alpha(accent, 0.12), color: accent, border: `1px solid ${alpha(accent, 0.55)}`},
    raised: {background: C.raised, color: C.text, border: `1px solid ${C.line}`},
  }[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 34,
        padding: '0 14px',
        borderRadius: 6,
        fontFamily: mono ? MONO : FONT,
        fontWeight: mono ? 500 : 600,
        fontSize: mono ? 16 : 18,
        whiteSpace: 'nowrap',
        ...t,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const Mono: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 18, color = C.muted, style}) => (
  <span style={{fontFamily: MONO, fontWeight: 500, fontSize: size, color, letterSpacing: '0.02em', whiteSpace: 'nowrap', ...style}}>{children}</span>
);

// ---------- inline icons (fonts may lack ✓ →) ----------
export const Check: React.FC<{size?: number; color?: string; draw?: number; width?: number}> = ({size = 22, color = C.success, draw = 1, width = 2.6}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flex: 'none'}}>
    <path d="M5.5 12.6l4.2 4.2 8.8-9.6" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
  </svg>
);
export const Arrow: React.FC<{size?: number; color?: string}> = ({size = 20, color = C.muted}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{flex: 'none'}}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);
export const Search: React.FC<{size?: number; color?: string}> = ({size = 24, color = C.muted}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" style={{flex: 'none'}}>
    <circle cx={10.5} cy={10.5} r={6.5} />
    <path d="M15.5 15.5L20 20" />
  </svg>
);
export const LinkIcon: React.FC<{size?: number; color?: string}> = ({size = 20, color = C.muted}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" style={{flex: 'none'}}>
    <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
  </svg>
);
export const PlayIcon: React.FC<{size?: number; color?: string}> = ({size = 18, color = C.onAmber}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flex: 'none'}}>
    <path d="M7 4.5v15l12.5-7.5z" fill={color} />
  </svg>
);

// ---------- the shared edit: Library exit = Edit Room entrance ----------
// Three tracks of clips aligned on one timecode line (x = 960). `g` = frames relative to the Library → Edit Room
// boundary (Library passes f − 840, Edit Room passes f), so both worlds draw the identical picture over the overlap.
export const TL = {x0: 220, x1: 1700, ruler: 388, rows: [450, 540, 630], h: 70, play: 960};
export const TL_CLIPS: {row: number; a: number; b: number; name: string; seed: number}[] = [
  {row: 0, a: 360, b: 880, name: 'CAM B · B002_C011', seed: 4},
  {row: 0, a: 940, b: 1540, name: 'CAM B · B002_C012', seed: 9},
  {row: 1, a: 260, b: 760, name: 'CAM A · A001_C003', seed: 1},
  {row: 1, a: 820, b: 1260, name: 'CAM A · A001_C004', seed: 6},
  {row: 1, a: 1320, b: 1660, name: 'CAM A · A001_C005', seed: 13},
  {row: 2, a: 240, b: 1680, name: 'REC · ZOOM_0007.wav', seed: 21},
];
export const ROW_NAMES = ['V2  CAM B', 'V1  CAM A', 'A1  REC'];

// deterministic speech-ish envelope 0..1 at x (px), per seed
export const envAt = (x: number, seed: number) => {
  const a = Math.sin(x * 0.043 + seed) * 0.5 + Math.sin(x * 0.0117 + seed * 2.1) * 0.35 + Math.sin(x * 0.19 + seed * 0.7) * 0.25;
  return Math.max(0.06, Math.min(1, 0.45 + a * 0.55));
};

export const ClipBody: React.FC<{w: number; h: number; color: string; audio?: boolean; seed: number; name: string; label?: number}> = ({w, h, color, audio, seed, name, label = 1}) => (
  <div style={{position: 'absolute', inset: 0, borderRadius: 6, background: alpha(color, audio ? 0.14 : 0.22), border: `1.5px solid ${alpha(color, 0.85)}`, overflow: 'hidden'}}>
    {audio ? (
      <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: Math.max(0, Math.floor(w / 6))}, (_, i) => {
          const v = envAt(i * 6, seed) * (h * 0.36);
          return <rect key={i} x={i * 6 + 2} y={h / 2 - v + 6} width={3} height={v * 2 - 6 > 0 ? v * 2 - 6 : 1} rx={1.5} fill={color} opacity={0.75} />;
        })}
      </svg>
    ) : (
      <div style={{position: 'absolute', left: 0, right: 0, top: 22, bottom: 0, display: 'flex', gap: 2, opacity: 0.55}}>
        {Array.from({length: Math.max(1, Math.round(w / 92))}, (_, i) => (
          <div key={i} style={{flex: 1, background: `linear-gradient(160deg, ${alpha(color, 0.5)}, ${alpha('#0c1312', 0.9)} ${50 + ((seed * 7 + i * 13) % 30)}%)`}} />
        ))}
      </div>
    )}
    <div style={{position: 'absolute', left: 10, top: 3, fontFamily: MONO, fontWeight: 500, fontSize: 14, color: C.text, opacity: 0.9 * label, whiteSpace: 'nowrap'}}>{name}</div>
  </div>
);

// The handoff timeline. `color` is the clip tint; `chrome` scales ruler/headers opacity; `slide`/`spread` let a world
// animate clips into place (offset px per clip index, 0 = aligned).
export const HandoffTimeline: React.FC<{color: string; chrome?: number; offsets?: number[]; clipIn?: number[]; playGlow?: number; rows?: number[]}> = ({
  color,
  chrome = 1,
  offsets,
  clipIn,
  playGlow = 0,
  rows = [1, 1, 1],
}) => (
  <div style={{position: 'absolute', inset: 0}}>
    {/* ruler */}
    <div style={{position: 'absolute', left: TL.x0, width: TL.x1 - TL.x0, top: TL.ruler - 30, height: 30, opacity: chrome}}>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: C.line}} />
      {Array.from({length: 38}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: i * 40, bottom: 0, width: 1, height: i % 4 === 0 ? 12 : 6, background: i % 4 === 0 ? C.muted : C.line}} />
      ))}
      {Array.from({length: 10}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: i * 160 + 6, top: 0, fontFamily: MONO, fontSize: 14, color: C.muted}}>
          {tc(1, 0, 8 + i, 0)}
        </div>
      ))}
    </div>
    {TL.rows.map((y, r) => (
      <div key={r} style={{position: 'absolute', left: 120, top: y - TL.h / 2, width: 92, height: TL.h, display: 'flex', alignItems: 'center', fontFamily: MONO, fontWeight: 500, fontSize: 14, color: C.muted, opacity: chrome * rows[r], whiteSpace: 'pre'}}>
        {ROW_NAMES[r]}
      </div>
    ))}
    {TL.rows.map((y, r) => (
      <div key={'l' + r} style={{position: 'absolute', left: TL.x0, width: TL.x1 - TL.x0, top: y - TL.h / 2 - 5, height: TL.h + 10, background: 'rgba(255,255,255,0.018)', borderTop: `1px solid ${alpha(C.line, 0.6)}`, opacity: chrome * rows[r]}} />
    ))}
    <div style={{position: 'absolute', inset: 0, clipPath: `inset(0px ${1920 - TL.x1 - 4}px 0px ${TL.x0 - 4}px)`}}>
    {TL_CLIPS.map((c, i) => {
      const k = clipIn ? clipIn[i] : 1;
      if (k <= 0 || rows[c.row] <= 0) return null;
      const dx = offsets ? offsets[i] : 0;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c.a + dx,
            top: TL.rows[c.row] - TL.h / 2,
            width: c.b - c.a,
            height: TL.h,
            opacity: Math.min(1, k * 1.5) * rows[c.row],
            scale: `${0.9 + 0.1 * k}`,
          }}
        >
          <ClipBody w={c.b - c.a} h={TL.h} color={color} audio={c.row === 2} seed={c.seed} name={c.name} />
        </div>
      );
    })}
    </div>
    {/* aligned timecode line = playhead */}
    <div style={{position: 'absolute', left: TL.play - 1.5, top: TL.ruler - 34, width: 3, height: TL.rows[2] + TL.h / 2 + 14 - (TL.ruler - 34), background: C.amber, opacity: chrome, boxShadow: `0 0 ${10 + 30 * playGlow}px ${alpha(C.amber, 0.5 + 0.5 * playGlow)}`}} />
    <div style={{position: 'absolute', left: TL.play - 9, top: TL.ruler - 44, width: 18, height: 14, background: C.amber, clipPath: 'polygon(0 0,100% 0,100% 55%,50% 100%,0 55%)', opacity: chrome}} />
  </div>
);
// Tint across the Library → Edit Room overlap (g = frames from the boundary).
export const handoffColor = (g: number) => mix(AQUA, CORAL, lerp(g, -10, 14, 0, 1, IN_OUT));
