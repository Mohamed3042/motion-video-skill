// Peripheral-drift ("rotating snakes") field: concentric rings of 4-step segments in Kitaoka's
// luminance order black -> dark gray -> white -> light (brand green), repeated. Adjacent rings run the
// order in opposite directions, so a completely static ring appears to drift (black->dark->white->light),
// alternating clockwise / counter-clockwise ring by ring.
import React from 'react';
import {mulberry32} from '../../timing';
import {T} from './timing';
import {clamp, ease, mix, mixHex, prog} from './util';

export const CX = 960;
export const CY = 540;
export const R0 = 330; // inner radius (the title disc sits inside)
const WIDTH = 60;
const STEP = 66;
const COUNT = 12;
export const ENTRY_RING = 3; // the ring that arrives spinning from Clone Lab's staircase

// luminance order along the drift direction
const COLORS = ['#000000', '#2b4a36', '#ffffff', '#1ED760'];
const FRACS = [0, 0.2, 0.5, 0.7, 1];

type Ring = {r0: number; r1: number; dir: 1 | -1; phase: number; paths: string[]; rate: number};

const pt = (r: number, a: number) => `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY + r * Math.sin(a)).toFixed(2)}`;

const RINGS: Ring[] = (() => {
  const rnd = mulberry32(303);
  return Array.from({length: COUNT}, (_, i) => {
    const r0 = R0 + i * STEP;
    const r1 = r0 + WIDTH;
    const n = Math.max(16, Math.round((2 * Math.PI * (r0 + WIDTH / 2)) / (WIDTH * 1.9)));
    const U = (2 * Math.PI) / n;
    const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const tw = 0.11 * U * dir; // slanted edges: the "snake scale" look
    const paths = ['', '', '', ''];
    for (let u = 0; u < n; u++) {
      const base = u * U;
      for (let c = 0; c < 4; c++) {
        // dir = +1: order runs with increasing angle (clockwise on screen); -1: mirrored
        const fa = dir === 1 ? FRACS[c] : 1 - FRACS[c + 1];
        const fb = dir === 1 ? FRACS[c + 1] : 1 - FRACS[c];
        const a = base + fa * U;
        const b = base + fb * U;
        paths[c] +=
          `M${pt(r1, a - tw)} A${r1} ${r1} 0 0 1 ${pt(r1, b - tw)} L${pt(r0, b + tw)} A${r0} ${r0} 0 0 0 ${pt(r0, a + tw)}Z`;
      }
    }
    // real rotation follows the illusory direction; inner rings turn a little faster
    return {r0, r1, dir, phase: rnd() * 360, paths, rate: 1.25 * (520 / (r0 + 30)) ** 0.55};
  });
})();

// Rotation speed profile (base deg/frame) after Live starts: spin-up on the drop, push into Overdrive, surge.
const speed = (t: number) => {
  if (t < T.drop) return 0;
  const up = ease.cubicOut(prog(t, T.drop, T.drop + 16));
  const push = 0.7 * ease.cubicIn(prog(t, 240, T.overdrive));
  const surge = t >= T.overdrive ? 0.6 + 2.8 * Math.exp(-(t - T.overdrive) / 20) - 0.7 : 0;
  return up * (1 + push + surge);
};
export const spinAt = (f: number) => {
  let s = 0;
  for (let t = T.drop; t < f; t += 0.5) s += speed(Math.min(t, f)) * Math.min(0.5, f - t);
  return s;
};

const RingG: React.FC<{ring: Ring; angle: number; opacity?: number; scale?: number; tint?: number}> = ({
  ring,
  angle,
  opacity = 1,
  scale = 1,
  tint = 0,
}) => (
  <g
    transform={`translate(${CX} ${CY}) scale(${scale}) rotate(${angle}) translate(${-CX} ${-CY})`}
    opacity={opacity}
  >
    {ring.paths.map((d, c) => (
      <path key={c} d={d} fill={c === 3 && tint > 0 ? mixHex('#1ED760', '#4FE3FF', tint) : COLORS[c]} />
    ))}
  </g>
);

export const DriftRings: React.FC<{f: number}> = ({f}) => {
  const spin = spinAt(f);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {RINGS.map((ring, i) => {
        if (i === ENTRY_RING) {
          // arrives spinning (Clone Lab's staircase spun into this ring), decelerates and locks on frame 0
          const off = (g: number) => (g < 0 ? 0.42 * g * g : 0);
          const base = ring.phase + ring.dir * spin * ring.rate;
          const tint = clamp(-f / 12);
          const ghosts = f < -0.5 ? [0.2, 0.4, 0.6, 0.8] : [];
          return (
            <g key={i}>
              {ghosts.map((k) => (
                <RingG key={k} ring={ring} angle={base - ring.dir * off(f - k)} opacity={0.32} tint={tint} />
              ))}
              <RingG ring={ring} angle={base - ring.dir * off(f)} opacity={ghosts.length ? 0.55 : 1} tint={tint} />
            </g>
          );
        }
        const d = 1.6 * Math.abs(i - ENTRY_RING);
        const a = ease.cubicOut(prog(f, d - 2, d + 9));
        if (a <= 0) return null;
        return (
          <RingG key={i} ring={ring} angle={ring.phase + ring.dir * spin * ring.rate} opacity={a} scale={mix(i > ENTRY_RING ? 0.93 : 1.08, 1, a)} />
        );
      })}
      <circle cx={CX} cy={CY} r={R0 - 10} fill="none" stroke="#1ED760" strokeOpacity={0.55} strokeWidth={2} />
    </svg>
  );
};
