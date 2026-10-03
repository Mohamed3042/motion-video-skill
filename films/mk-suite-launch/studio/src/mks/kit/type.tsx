// Typography: supers (word-by-word spring entrance) and chapter cards.
import React from 'react';
import {C, FONT, MONO} from '../brand';
import {ease, lerp, prog, springAt} from './math';

// <Super>: a headline whose words spring in one by one from `start`, and leave from `end` (12 f).
// Position it with a wrapping absolutely-positioned div. `accentWords` (indices) render in MK green.
export const Super: React.FC<{
  f: number;
  text: string;
  start: number;
  end?: number;
  size?: number;
  weight?: number;
  align?: 'left' | 'center' | 'right';
  color?: string;
  accentWords?: number[];
  stagger?: number;
  sub?: string; // optional subline (Inter 500, grey)
  subSize?: number;
  maxWidth?: number;
}> = ({f, text, start, end, size = 96, weight = 800, align = 'center', color = C.fg, accentWords = [], stagger = 4, sub, subSize, maxWidth = 1500}) => {
  if (f < start - 2) return null;
  const out = end !== undefined ? ease.in(prog(f, end, end + 12)) : 0;
  if (out >= 1) return null;
  const words = text.split(' ');
  const subS = subSize ?? Math.round(size * 0.32);
  const subIn = ease.out(prog(f, start + words.length * stagger + 4, start + words.length * stagger + 22));
  return (
    <div style={{textAlign: align, maxWidth, opacity: 1 - out, transform: `translateY(${-24 * out}px)`, filter: out > 0 ? `blur(${8 * out}px)` : undefined}}>
      <div style={{fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 1.02, letterSpacing: -size * 0.035, color}}>
        {words.map((w, i) => {
          const s = springAt(f, start + i * stagger, {stiffness: 210, damping: 20});
          const blur = Math.max(0, 1 - prog(f, start + i * stagger, start + i * stagger + 10));
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: i < words.length - 1 ? size * 0.24 : 0,
                transform: `translateY(${lerp(size * 0.45, 0, s)}px)`,
                opacity: Math.min(1, s * 1.4),
                filter: blur > 0.02 ? `blur(${10 * blur}px)` : undefined,
                color: accentWords.includes(i) ? C.green : undefined,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      {sub ? (
        <div style={{marginTop: size * 0.28, fontFamily: FONT, fontWeight: 500, fontSize: subS, color: C.sub, letterSpacing: -subS * 0.01, opacity: subIn, transform: `translateY(${12 * (1 - subIn)}px)`}}>{sub}</div>
      ) : null}
    </div>
  );
};

// <Label>: tiny mono label (e.g. "02 — CREATE").
export const Label: React.FC<{f: number; text: string; start: number; end?: number; color?: string; size?: number}> = ({f, text, start, end, color = C.sub, size = 18}) => {
  const a = ease.out(prog(f, start, start + 16));
  const out = end !== undefined ? prog(f, end, end + 10) : 0;
  return (
    <div style={{fontFamily: MONO, fontWeight: 500, fontSize: size, letterSpacing: size * 0.18, color, opacity: a * (1 - out), transform: `translateX(${(1 - a) * -20}px)`}}>{text}</div>
  );
};

// <Chapter>: full-frame chapter card — giant word with an icon, subline, a sweeping green line.
// Occupies [start, end]; the parent decides the transition into/out of it.
export const Chapter: React.FC<{f: number; start: number; end: number; index: string; word: string; sub: string; icon?: React.ReactNode}> = ({f, start, end, index, word, sub, icon}) => {
  const line = ease.expoOut(prog(f, start + 4, start + 40));
  const out = ease.in(prog(f, end - 16, end));
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - out, transform: `scale(${1 + 0.06 * out})`}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 26}}>
        <Label f={f} text={index} start={start} color={C.green} size={20} />
        <div style={{display: 'flex', alignItems: 'center', gap: 40}}>
          {icon ? <div style={{transform: `scale(${springAt(f, start + 2)})`}}>{icon}</div> : null}
          <Super f={f} text={word} start={start + 4} size={230} weight={900} align="left" stagger={0} />
        </div>
        <div style={{height: 3, width: 900 * line, background: `linear-gradient(90deg, ${C.green}, rgba(30,215,96,0))`, boxShadow: '0 0 18px rgba(30,215,96,0.6)'}} />
        <Super f={f} text={sub} start={start + 16} size={44} weight={500} align="left" color={C.sub} stagger={3} />
      </div>
    </div>
  );
};
