import React from 'react';
import {C, HUES} from './brand';

// Monoline glyphs on a 24-unit grid (same line language as the MK monoline mark).
export const GLYPHS: Record<string, string> = {
  voice: 'M5 10v4M8.5 7v10M12 4v16M15.5 8v8M19 10.5v3',
  audiosync: 'M4 6h16v12H4z M8.5 6v12 M15.5 6v12 M4 10h4.5 M4 14h4.5 M15.5 10H20 M15.5 14H20',
  packaging: 'M4 8l8-4 8 4v8l-8 4-8-4z M4 8l8 4 8-4 M12 12v8',
  tones: 'M9 17V6l10-2v11 M9 17a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0 M19 15a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0',
  macroforge: 'M6 4l11 9.5-5 .8 2.8 5.2-2.2 1.2-2.8-5.2L6 19z',
  reclaim: 'M12 4a8 8 0 1 0 8 8h-8z M14.5 3.4a8 8 0 0 1 6.1 6.1h-6.1z',
  career: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 1 0 0-17 M15.5 8.5l-2 5-5 2 2-5z',
  charforge: 'M12 3.5a2.6 2.6 0 1 0 0 5.2a2.6 2.6 0 1 0 0-5.2 M7.5 20.5l1.4-8.5h6.2l1.4 8.5 M5 12.5l3.5-2h7l3.5 2',
  marketplace: 'M4 12.5V4h8.5l7.5 7.5-8.5 8.5z M8.6 8.6h.01',
  bakery: 'M5 20v-8h14v8z M5 15.2c2.3 1.4 4.7 1.4 7 0s4.7-1.4 7 0 M12 12V8.5 M12 5.2v.01',
  vertical: 'M5 19v-7 M10 19V6 M15 19v-9 M20 19v-4 M3.5 20.5h17',
  portfolio: 'M9 7l-5 5 5 5 M15 7l5 5-5 5',
  education: 'M3 9.5l9-4.5 9 4.5-9 4.5z M7 11.5v4.5c3 2 7 2 10 0v-4.5',
  quoteops: 'M6.5 3.5h8l4 4v13h-12z M14 3.5V8h4.5 M9.5 12.5h6 M9.5 16.5h4',
  automation: 'M4.5 4.5h5v5h-5z M14.5 14.5h5v5h-5z M9.5 7h3.5a2.5 2.5 0 0 1 2.5 2.5v5',
  flock: 'M5 19C5 10.5 10.5 5 19 5c0 8.5-5.5 14-14 14z M5 19l8-8',
  'business-os': 'M4.5 20.5V8l7.5-4 7.5 4v12.5 M9.5 20.5v-5h5v5 M8.5 10.5h.01 M12 10.5h.01 M15.5 10.5h.01',
};

// App icon: rounded square, deep->bright product gradient, white monoline glyph, soft top highlight.
export const ProductIcon: React.FC<{id: string; size: number; glow?: number; style?: React.CSSProperties; noGlyph?: boolean; children?: React.ReactNode}> = ({
  id,
  size,
  glow = 0,
  style,
  noGlyph,
  children,
}) => {
  const h = HUES[id];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(145deg, ${h.base} 0%, ${h.deep} 100%)`,
        boxShadow: `0 ${size * 0.08}px ${size * 0.22}px rgba(0,0,0,0.28)${glow > 0 ? `, 0 0 ${size * 0.6 * glow}px ${h.hue}` : ''}`,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 90% at 30% 15%, ${h.hue}cc 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 40%)`,
        }}
      />
      {noGlyph ? null : (
        <svg viewBox="0 0 24 24" style={{position: 'absolute', left: size * 0.2, top: size * 0.2, width: size * 0.6, height: size * 0.6}}>
          <path d={GLYPHS[id]} fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {children}
    </div>
  );
};

// The MK monoline mark, from the brand favicon (64-unit box, #17181c rounded square, white stroke).
export const MARK_PATH = 'M10 46V18l13 15 13-15v28M43 18v28m1-13 12-15M44 33l12 13';

// Drawn as sub-strokes in writing order: M, K stem, then both K arms together.
const MARK_PARTS = [
  {d: 'M10 46V18l13 15 13-15v28', len: 28 + 2 * Math.hypot(13, 15) + 28, from: 0, to: 0.62},
  {d: 'M43 18v28', len: 28, from: 0.62, to: 0.8},
  {d: 'M44 33l12-15', len: Math.hypot(12, 15), from: 0.8, to: 1},
  {d: 'M44 33l12 13', len: Math.hypot(12, 13), from: 0.8, to: 1},
];

export const MKMark: React.FC<{
  size: number;
  draw?: number; // 0..1 stroke reveal
  bg?: string;
  stroke?: string;
  plate?: number; // 0..1 plate scale-in
}> = ({size, draw = 1, bg = C.night, stroke = '#fff', plate = 1}) => (
  <svg viewBox="0 0 64 64" width={size} height={size} style={{overflow: 'visible'}}>
    <rect x={32 - 32 * plate} y={32 - 32 * plate} width={64 * plate} height={64 * plate} rx={13 * plate} fill={bg} opacity={plate > 0.001 ? 1 : 0} />
    {MARK_PARTS.map((p) => {
      const k = Math.min(1, Math.max(0, (draw - p.from) / (p.to - p.from)));
      return k <= 0 ? null : <path key={p.d} d={p.d} fill="none" stroke={stroke} strokeWidth={4} strokeLinejoin="round" strokeDasharray={`${p.len} ${p.len}`} strokeDashoffset={p.len * (1 - k)} />;
    })}
  </svg>
);
