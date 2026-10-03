// Sound Lab: small Carbon Studio UI atoms (charcoal panels, amber primary, 6 px radii, mono labels).
import React from 'react';
import {ACCENT, C, FONT, MONO, RADIUS} from '../../brand';

export const SAGE = ACCENT.sound;
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const eo = (x: number) => 1 - (1 - x) ** 3;
export const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
export const back = (x: number) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2; // ease-out with a small overshoot
const rgbOf = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgba = (hex: string, a: number) => `rgba(${rgbOf(hex).join(',')},${a})`;
export const mixHex = (a: string, b: string, t: number) => {
  const [x, y] = [rgbOf(a), rgbOf(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * clamp(t))).join(',')})`;
};
// a frame-driven "press": 1 at f0, decays over ~10 frames
export const pulse = (f: number, f0: number, len = 12) => (f < f0 ? 0 : Math.max(0, 1 - (f - f0) / len) ** 2);

export const Mono: React.FC<{size?: number; color?: string; spacing?: number; weight?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({size = 18, color = C.muted, spacing = 0.2, weight = 700, style, children}) => (
  <div style={{fontFamily: MONO, fontWeight: weight, fontSize: size, letterSpacing: `${spacing}em`, color, whiteSpace: 'nowrap', ...style}}>{children}</div>
);

// Tool label: sage dot + spaced mono caps
export const ToolLabel: React.FC<{name: string; index?: string; size?: number}> = ({name, index, size = 22}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
    <div style={{width: 10, height: 10, borderRadius: 5, background: SAGE, boxShadow: `0 0 12px ${rgba(SAGE, 0.8)}`}} />
    {index ? <Mono size={size} color={C.muted}>{index}</Mono> : null}
    <Mono size={size} color={SAGE} spacing={0.22}>
      {name}
    </Mono>
  </div>
);

export const Panel: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => (
  <div style={{position: 'absolute', background: C.panel, border: `1px solid ${C.line}`, borderRadius: RADIUS.dialog, ...style}}>{children}</div>
);

// on/off toggle chip with an optional value pill
export const Toggle: React.FC<{label: string; on: number; value?: string}> = ({label, on, value}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      height: 46,
      padding: '0 16px 0 12px',
      borderRadius: RADIUS.control,
      background: C.raised,
      border: `1px solid ${on > 0.5 ? rgba(C.amber, 0.55) : C.line}`,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: 19,
      color: C.text,
    }}
  >
    <div style={{width: 38, height: 22, borderRadius: 11, background: mixHex(C.line, C.amber, on), position: 'relative'}}>
      <div style={{position: 'absolute', top: 3, left: 3 + 16 * on, width: 16, height: 16, borderRadius: 8, background: on > 0.5 ? C.onAmber : C.muted}} />
    </div>
    {label}
    {value ? (
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 16, color: C.muted, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: '3px 8px'}}>{value}</div>
    ) : null}
  </div>
);

// amber primary button; `press` = pulse value (0..1)
export const Primary: React.FC<{label: string; press?: number; style?: React.CSSProperties}> = ({label, press = 0, style}) => (
  <div
    style={{
      height: 50,
      padding: '0 26px',
      display: 'flex',
      alignItems: 'center',
      borderRadius: RADIUS.control,
      background: press > 0 ? C.amberHover : C.amber,
      color: C.onAmber,
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: 20,
      transform: `scale(${1 - 0.05 * press})`,
      boxShadow: `0 0 ${10 + 40 * press}px ${rgba(C.amber, 0.25 + 0.5 * press)}`,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {label}
  </div>
);

// two-segment control (amber marks the selection)
export const Segmented: React.FC<{a: string; b: string; t: number}> = ({a, b, t}) => (
  <div style={{position: 'relative', display: 'flex', height: 46, borderRadius: RADIUS.control, background: C.raised, border: `1px solid ${C.line}`, padding: 3}}>
    <div style={{position: 'absolute', top: 3, bottom: 3, left: 3, width: 'calc(50% - 3px)', borderRadius: 4, background: C.amber, transform: `translateX(${t * 100}%)`}} />
    {[a, b].map((s, i) => (
      <div key={s} style={{position: 'relative', width: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 650, fontSize: 19, color: Math.abs(i - t) < 0.5 ? C.onAmber : C.muted}}>
        {s}
      </div>
    ))}
  </div>
);

// labelled slider (v 0..1)
export const Slider: React.FC<{label: string; v: number; w?: number; value?: string}> = ({label, v, w = 440, value}) => (
  <div style={{width: w}}>
    <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontWeight: 500, fontSize: 19, color: C.muted, marginBottom: 12}}>
      <span>{label}</span>
      {value ? <span style={{fontFamily: MONO, fontSize: 16, color: C.text}}>{value}</span> : null}
    </div>
    <div style={{position: 'relative', height: 6, borderRadius: 3, background: C.line}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${v * 100}%`, borderRadius: 3, background: C.amber}} />
      <div style={{position: 'absolute', top: -8, left: `calc(${v * 100}% - 11px)`, width: 22, height: 22, borderRadius: 11, background: C.text, boxShadow: `0 0 0 4px ${rgba(C.amber, 0.25)}`}} />
    </div>
  </div>
);

// rotary knob (v 0..1 → −135°..135°)
export const Knob: React.FC<{label: string; v: number; size?: number}> = ({label, v, size = 104}) => {
  const a = -135 + 270 * v;
  const r = size / 2 - 8;
  const arc = (from: number, to: number) => {
    const p = (d: number) => [size / 2 + r * Math.sin((d * Math.PI) / 180), size / 2 - r * Math.cos((d * Math.PI) / 180)];
    const [x0, y0] = p(from);
    const [x1, y1] = p(to);
    return `M${x0} ${y0} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: size + 70}}>
      <svg width={size} height={size}>
        <path d={arc(-135, 135)} stroke={C.line} strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d={arc(-135, Math.max(-134, a))} stroke={C.amber} strokeWidth={6} fill="none" strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={r - 14} fill={C.raised} stroke={C.line} />
        <line x1={size / 2} y1={size / 2} x2={size / 2 + (r - 22) * Math.sin((a * Math.PI) / 180)} y2={size / 2 - (r - 22) * Math.cos((a * Math.PI) / 180)} stroke={C.text} strokeWidth={4} strokeLinecap="round" />
      </svg>
      <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 17, color: C.muted, textAlign: 'center', lineHeight: 1.2}}>{label}</div>
    </div>
  );
};

// label + value field
export const Field: React.FC<{label: string; value: string; on?: number; w?: number}> = ({label, value, on = 0, w = 440}) => (
  <div style={{width: w, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46, padding: '0 14px', borderRadius: RADIUS.control, background: C.raised, border: `1px solid ${on > 0.5 ? rgba(C.amber, 0.6) : C.line}`}}>
    <span style={{fontFamily: FONT, fontWeight: 500, fontSize: 18, color: C.muted}}>{label}</span>
    <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 16, color: on > 0.5 ? C.amber : C.text}}>{value}</span>
  </div>
);

export const Check: React.FC<{size?: number; color?: string; p?: number}> = ({size = 20, color = SAGE, p = 1}) => (
  <svg width={size} height={size} viewBox="0 0 20 20">
    <path d="M4 10.5 L8.3 14.5 L16 5.5" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={20} strokeDashoffset={20 * (1 - p)} />
  </svg>
);
