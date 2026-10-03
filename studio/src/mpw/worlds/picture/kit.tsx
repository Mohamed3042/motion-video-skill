// Picture Lab kit: frame helpers (borrowed from MK Voice), Carbon UI fragments, the RGB light band and band wipes.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO, RADIUS} from '../../brand';
import {clamp, ease, mix, prog, rgba} from '../../../mkv/worlds/live/util';

export {clamp, ease, mix, mixHex, prog, rgba, sp, Glow} from '../../../mkv/worlds/live/util';

export const VIO = ACCENT.picture;
export const RGB = ['#ff3b3b', '#3bff6a', '#3b7bff'];
export const H = 1080;

// ---------------------------------------------------------------- band wipes ----
// A wipe is a horizontal RGB light band crossing the frame in 18 frames, centred on `c`.
// dir +1: band travels down, the NEW layer shows above it. dir -1: travels up, the NEW layer shows below it.
export type Wipe = {c: number; dir: 1 | -1; from?: number};
export const bandY = (f: number, w: Wipe) => {
  const u = ease.inOut(prog(f, w.c - 9, w.c + 9));
  const a = w.from ?? (w.dir > 0 ? -40 : H + 40);
  return mix(a, w.dir > 0 ? H + 40 : -40, u);
};
// Clip a layer that enters on wipe `a` and leaves on wipe `b`.
export const Section: React.FC<{f: number; a?: Wipe; b?: Wipe; children: React.ReactNode}> = ({f, a, b, children}) => {
  if (a && f < a.c - 9) return null;
  if (b && f > b.c + 9) return null;
  let top = 0;
  let bot = 0;
  if (a) {
    const y = bandY(f, a);
    if (a.dir > 0) bot = Math.max(bot, H - y);
    else top = Math.max(top, y);
  }
  if (b) {
    const y = bandY(f, b);
    if (b.dir > 0) top = Math.max(top, y);
    else bot = Math.max(bot, H - y);
  }
  return <AbsoluteFill style={{clipPath: top > 0 || bot > 0 ? `inset(${Math.max(0, top)}px 0 ${Math.max(0, bot)}px 0)` : undefined}}>{children}</AbsoluteFill>;
};

// The RGB light band: three hairlines (R, G, B) that split apart by `spread` px, plus a pre-blurred white core.
export const Band: React.FC<{y: number; spread?: number; o?: number; core?: number; x0?: number; x1?: number}> = ({y, spread = 4, o = 1, core = 1, x0 = -20, x1 = 1940}) => {
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x0, width: x1 - x0, top: y - 90, height: 180, opacity: o, mixBlendMode: 'screen', pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${rgba(VIO, 0.1 * core)} 38%, ${rgba('#ffffff', 0.22 * core)} 50%, ${rgba(VIO, 0.1 * core)} 62%, rgba(0,0,0,0) 100%)`}} />
      {RGB.map((c, i) => (
        <div key={i} style={{position: 'absolute', left: 0, right: 0, top: 90 + (i - 1) * spread - 1.5, height: 3, background: c, boxShadow: `0 0 10px ${c}`}} />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 89, height: 2, background: `rgba(255,255,255,${0.85 * core})`}} />
    </div>
  );
};
export const WipeBand: React.FC<{f: number; w: Wipe}> = ({f, w}) => {
  if (f < w.c - 10 || f > w.c + 10) return null;
  const u = prog(f, w.c - 9, w.c + 9);
  return <Band y={bandY(f, w)} spread={3 + 10 * Math.sin(Math.PI * u)} o={Math.sin(Math.PI * clamp(u * 1.05))} />;
};

// ---------------------------------------------------------------- Carbon UI fragments ----
export const Panel: React.FC<{x: number; y: number; w: number; h: number; o?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({x, y, w, h, o = 1, style, children}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: RADIUS.dialog,
      background: C.panel,
      border: `1px solid ${C.line}`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
      opacity: o,
      transform: `translateY(${(1 - o) * 18}px)`,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Eyebrow: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties}> = ({children, color = C.muted, style}) => (
  <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 13, letterSpacing: '0.16em', color, textTransform: 'uppercase', ...style}}>{children}</div>
);

// range field: label + track (amber fill) + thumb. v in [0, 1].
export const Slider: React.FC<{label: string; v: number; w: number; style?: React.CSSProperties}> = ({label, v, w, style}) => (
  <div style={{width: w, ...style}}>
    <div style={{fontFamily: FONT, fontSize: 17, color: C.muted, marginBottom: 10}}>{label}</div>
    <div style={{position: 'relative', height: 18}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 7, height: 4, borderRadius: 2, background: C.line}} />
      <div style={{position: 'absolute', left: 0, width: `${clamp(v) * 100}%`, top: 7, height: 4, borderRadius: 2, background: C.amber}} />
      <div style={{position: 'absolute', left: `calc(${clamp(v) * 100}% - 9px)`, top: 0, width: 18, height: 18, borderRadius: 9, background: C.amber, boxShadow: `0 0 0 4px ${rgba(C.amber, 0.18)}`}} />
    </div>
  </div>
);

export const Select: React.FC<{label: string; value: string; w: number; style?: React.CSSProperties}> = ({label, value, w, style}) => (
  <div style={{width: w, ...style}}>
    <div style={{fontFamily: FONT, fontSize: 17, color: C.muted, marginBottom: 8}}>{label}</div>
    <div
      style={{
        height: 42,
        borderRadius: RADIUS.control,
        background: C.raised,
        border: `1px solid ${C.line}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        fontFamily: FONT,
        fontSize: 18,
        color: C.text,
        justifyContent: 'space-between',
      }}
    >
      {value}
      <svg width={14} height={14} viewBox="0 0 14 14">
        <path d="M2 5 L7 10 L12 5" fill="none" stroke={C.muted} strokeWidth={2} strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

// primary amber button; `press` = frame it is pressed (ripple + dip), `f` current frame
export const Btn: React.FC<{label: string; f: number; press?: number; w?: number; style?: React.CSSProperties}> = ({label, f, press = 1e9, w, style}) => {
  const d = f - press;
  const dip = d >= 0 ? Math.sin(Math.PI * clamp(d / 8)) : 0;
  const glow = d >= 0 ? Math.exp(-d / 14) : 0;
  return (
    <div
      style={{
        width: w,
        height: 46,
        borderRadius: RADIUS.control,
        background: d >= 0 && d < 5 ? C.amberHover : C.amber,
        color: C.onAmber,
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: 19,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 22px',
        transform: `scale(${1 - 0.05 * dip})`,
        boxShadow: `0 0 ${50 * glow}px ${rgba(C.amber, 0.65 * glow)}`,
        ...style,
      }}
    >
      {label}
    </div>
  );
};

export const Chip: React.FC<{children: React.ReactNode; on?: boolean; color?: string; style?: React.CSSProperties}> = ({children, on, color = C.amber, style}) => (
  <div
    style={{
      height: 34,
      padding: '0 14px',
      borderRadius: RADIUS.control,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontFamily: FONT,
      fontSize: 16,
      fontWeight: on ? 600 : 400,
      background: on ? color : C.panel,
      color: on ? C.onAmber : C.muted,
      border: `1px solid ${on ? color : C.line}`,
      ...style,
    }}
  >
    {children}
  </div>
);

// small mono tool label for each 1–2 s tool beat (violet dot + name), with an RGB-split pop-in
export const ToolLabel: React.FC<{f: number; at: number; text: string; x?: number; y?: number; out?: number}> = ({f, at, text, x = 120, y = 150, out = 1e9}) => {
  const k = ease.expoOut(prog(f, at, at + 14));
  const o = clamp((f - at) / 4) * (1 - prog(f, out - 6, out));
  if (o <= 0) return null;
  const split = 10 * (1 - k);
  const txt = (c: string, dx: number) => (
    <div style={{position: 'absolute', left: 30 + dx, top: 0, whiteSpace: 'nowrap', fontFamily: MONO, fontWeight: 700, fontSize: 21, letterSpacing: '0.24em', color: c, mixBlendMode: 'screen'}}>{text}</div>
  );
  return (
    <div style={{position: 'absolute', left: x, top: y, height: 30, width: 1400, opacity: o}}>
      <div style={{position: 'absolute', left: 0, top: 7, width: 14, height: 14, borderRadius: 7, background: VIO, boxShadow: `0 0 14px ${VIO}`}} />
      {split > 0.3 ? (
        <>
          {txt(RGB[0], -split)}
          {txt(RGB[1], 0)}
          {txt(RGB[2], split)}
        </>
      ) : (
        txt(C.text, 0)
      )}
    </div>
  );
};

// display-type message line (for the illusion payoffs)
export const Message: React.FC<{f: number; at: number; out?: number; x?: number; y?: number; children: React.ReactNode; size?: number}> = ({f, at, out = 1e9, x = 120, y = 868, children, size = 46}) => {
  const k = ease.expoOut(prog(f, at, at + 20));
  const o = clamp((f - at) / 6) * (1 - prog(f, out - 8, out));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, fontFamily: FONT, fontWeight: 650, fontSize: size, letterSpacing: '-0.01em', color: C.text, opacity: o, transform: `translateY(${(1 - k) * 22}px)`, whiteSpace: 'nowrap'}}>
      {children}
    </div>
  );
};

// arrow glyph (fonts lack arrows)
export const ArrowSvg: React.FC<{len: number; angle: number; color: string; width?: number; head?: number}> = ({len, angle, color, width = 5, head = 18}) => (
  <svg width={len + 2 * head} height={len + 2 * head} viewBox={`${-len / 2 - head} ${-len / 2 - head} ${len + 2 * head} ${len + 2 * head}`} style={{position: 'absolute', left: -len / 2 - head, top: -len / 2 - head, overflow: 'visible', transform: `rotate(${angle}deg)`}}>
    <path d={`M${-len / 2} 0 H${len / 2 - 2} M${len / 2 - head} ${-head * 0.7} L${len / 2} 0 L${len / 2 - head} ${head * 0.7}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
