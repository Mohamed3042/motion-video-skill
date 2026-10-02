// The MK Voice mark: 7 rounded green bars with symmetric heights on a black rounded square (radius 22%).
import {C} from '../brand';

export const BARS = [0.34, 0.66, 0.48, 1, 0.48, 0.66, 0.34];

// grow: 0..1 per bar (bar intro); glow: 0..1 extra green glow around the tile.
export const Mark: React.FC<{size: number; grow?: (i: number) => number; glow?: number; bars?: string}> = ({size, grow, glow = 0, bars = C.green}) => {
  const bw = size * 0.07;
  const gap = size * 0.032;
  const total = 7 * bw + 6 * gap;
  const maxH = size * 0.56;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: 'linear-gradient(160deg, #161616 0%, #000000 60%)',
        boxShadow: `inset 0 0 0 ${Math.max(1, size * 0.006)}px rgba(255,255,255,0.09), 0 0 ${size * 0.5 * glow}px rgba(30,215,96,${0.55 * glow}), 0 ${size * 0.08}px ${size * 0.25}px rgba(0,0,0,0.6)`,
        position: 'relative',
      }}
    >
      <svg width={size} height={size} style={{position: 'absolute', inset: 0}}>
        {BARS.map((h, i) => {
          const k = grow ? Math.max(0, Math.min(1.2, grow(i))) : 1;
          const bh = Math.max(bw, maxH * h * k);
          return (
            <rect
              key={i}
              x={(size - total) / 2 + i * (bw + gap)}
              y={size / 2 - bh / 2}
              width={bw}
              height={bh}
              rx={bw / 2}
              fill={bars}
              opacity={k <= 0 ? 0 : 1}
            />
          );
        })}
      </svg>
    </div>
  );
};
