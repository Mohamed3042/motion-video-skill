// Job Orbit v2 engine helper (additive): the glass-hologram panel from the brief's art direction.
//   <GlassPanel accent="#74e1ba" frame={f} w={420}>…</GlassPanel>
// navy glass body (#0c1c58 ≈ 78%) with a top-left sheen, 1 px #355287 border, 12 px radius, a 2 px accent edge
// light (left by default) with a faint inner glow, and a slow diagonal scanline shimmer (≈4%) driven by `frame`.
// Put it inside a Card3D; animate the Card3D (spring Y-rotation + Z push), never the panel's opacity alone.
import React from 'react';

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const GlassPanel: React.FC<{
  accent: string;
  frame: number;
  w?: number;
  h?: number;
  edge?: 'left' | 'top' | 'right' | 'bottom' | 'none';
  padding?: number | string;
  radius?: number;
  glow?: number; // 0…1 extra accent glow (e.g. on a lock / hit)
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({accent, frame, w, h, edge = 'left', padding = '22px 26px', radius = 12, glow = 0, style, children}) => {
  const sweep = ((frame * 0.9) % 520) - 160; // shimmer band position (% of the panel diagonal)
  const edgeStyle: React.CSSProperties =
    edge === 'none'
      ? {display: 'none'}
      : edge === 'left' || edge === 'right'
        ? {top: 10, bottom: 10, width: 2, [edge]: -1}
        : {left: 10, right: 10, height: 2, [edge]: -1};
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        boxSizing: 'border-box',
        padding,
        borderRadius: radius,
        border: '1px solid #355287',
        background: `linear-gradient(135deg, rgba(137,183,255,0.13) 0%, rgba(137,183,255,0.03) 32%, rgba(12,28,88,0) 55%), rgba(12,28,88,0.8)`,
        boxShadow: `inset 0 0 ${24 + 30 * glow}px ${rgba(accent, 0.08 + 0.22 * glow)}, 0 0 ${18 + 40 * glow}px ${rgba(accent, 0.12 + 0.35 * glow)}, 0 18px 50px rgba(2,6,23,0.55)`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(115deg, rgba(255,255,255,0) ${sweep - 14}%, rgba(255,255,255,0.045) ${sweep}%, rgba(255,255,255,0) ${sweep + 14}%), repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 4px)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{position: 'absolute', borderRadius: 2, background: accent, boxShadow: `0 0 12px ${accent}, 0 0 4px ${accent}`, ...edgeStyle}} />
      <div style={{position: 'relative'}}>{children}</div>
    </div>
  );
};
