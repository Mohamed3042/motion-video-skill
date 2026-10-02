// Global HUD (tinted with the current world's accent, crossfading at every boundary) and the finish layers.
import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {ACCENT, C, H, MONO, SAFE, W} from '../brand';
import {DURATION, FPS, WORLDS, mulberry32} from '../timing';
import {CONVERGE, MBEAT, MONTAGE} from '../finale/timing';
import {SECTIONS} from './timing';
import {sectionAccent} from './portals';
import {clamp, ease, lerp, mixHex, prog, rgba} from './util';

const sectionIndexAt = (g: number) => {
  for (let i = SECTIONS.length - 1; i >= 0; i--) if (g >= SECTIONS[i].start) return i;
  return 0;
};

// Accent without crossfade: the section's accent; during the finale montage, the hero world's accent.
const accentBase = (g: number) => {
  const s = SECTIONS[sectionIndexAt(g)];
  if (s.id === 'finale' && g < CONVERGE) return ACCENT[WORLDS[Math.floor((g - MONTAGE) / MBEAT)].id];
  return sectionAccent(s.id);
};

// Smooth 12-frame colour crossfade centred on every accent change.
export const accentAt = (g: number) => {
  for (let j = g - 5; j <= g + 6; j++) {
    const a = accentBase(j - 1);
    const b = accentBase(j);
    if (a !== b) return mixHex(a, b, ease.cubicInOut(clamp((g - (j - 6)) / 12)));
  }
  return accentBase(g);
};

const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0');
const hudText: React.CSSProperties = {
  position: 'absolute',
  fontFamily: MONO,
  fontWeight: 500,
  fontSize: 15,
  letterSpacing: '0.2em',
  color: C.fg,
  whiteSpace: 'nowrap',
  lineHeight: '20px',
};
const TOTAL = W - 2 * 104;
const GAP = 6;

export const Hud: React.FC = () => {
  const g = useCurrentFrame();
  const vis = ease.expoOut(prog(g, 44, 74)) * (1 - ease.cubicInOut(prog(g, 4930, 4962)));
  if (vis <= 0) return null;
  const inset = lerp(26, 0, ease.expoOut(prog(g, 44, 74)));
  const acc = accentAt(g);
  const idx = sectionIndexAt(g);
  const cur = SECTIONS[idx];
  const prev = idx > 0 ? SECTIONS[idx - 1] : null;
  const lt = g - cur.start;
  const labelIn = ease.expoOut(prog(lt, 2, 18));
  const labelOut = ease.cubicOut(prog(lt, 0, 8));
  const label = (s: (typeof SECTIONS)[number]) => `${pad2(s.index)} — ${s.name}`;
  const tc = `00:${pad2(g / FPS / 60)}:${pad2((g / FPS) % 60)}:${pad2(g % FPS)}`;
  const beat = Math.exp(-(g % 30) / 9);
  const L = 38;
  const M = SAFE + inset;
  const usable = TOTAL - GAP * (SECTIONS.length - 1);
  let x = 0;
  return (
    <AbsoluteFill style={{opacity: vis}}>
      <svg width={W} height={H} style={{position: 'absolute', filter: `drop-shadow(0 0 6px ${rgba(acc, 0.7)})`}}>
        {[
          [M, M, 1, 1],
          [W - M, M, -1, 1],
          [M, H - M, 1, -1],
          [W - M, H - M, -1, -1],
        ].map(([bx, by, sx, sy], i) => (
          <path key={i} d={`M${bx} ${by + sy * L}V${by}H${bx + sx * L}`} fill="none" stroke={acc} strokeWidth={2.5} />
        ))}
      </svg>
      <div style={{...hudText, left: 104, top: 92, opacity: 0.92}}>
        MK VOICE <span style={{color: acc}}>·</span> NINE WORLDS
      </div>
      <div style={{...hudText, right: 104, top: 92, width: 520, height: 20, overflow: 'hidden', textAlign: 'right', color: acc}}>
        {prev && lt < 8 ? (
          <div style={{position: 'absolute', right: 0, transform: `translateY(${-20 * labelOut}px)`, opacity: 1 - labelOut}}>{label(prev)}</div>
        ) : null}
        <div style={{position: 'absolute', right: 0, transform: `translateY(${20 * (1 - labelIn)}px)`, opacity: labelIn}}>{label(cur)}</div>
      </div>
      <div style={{...hudText, left: 104, top: 950, display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{width: 10, height: 10, borderRadius: '50%', background: acc, boxShadow: `0 0 ${6 + 10 * beat}px ${acc}`, opacity: 0.55 + 0.45 * beat}} />
        <span>LOCAL</span>
        <span style={{opacity: 0.6}}>{tc}</span>
      </div>
      <div style={{...hudText, right: 104, top: 950, opacity: 0.92}}>WINDOWS · LOCAL PREVIEW</div>
      {SECTIONS.map((s, i) => {
        const w = (usable * (s.end - s.start)) / DURATION;
        const left = 104 + x;
        x += w + GAP;
        const fill = clamp((g - s.start) / (s.end - s.start));
        const live = i === idx;
        return (
          <div key={s.id} style={{position: 'absolute', left, top: 986, width: w, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.16)', overflow: 'hidden'}}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: live ? acc : rgba(acc, 0.55),
                boxShadow: live ? `0 0 8px ${acc}` : undefined,
                transformOrigin: 'left center',
                transform: `scaleX(${fill})`,
              }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Soft grain (~4%), black vignette, very faint scanlines.
export const Finish: React.FC = () => {
  const g = useCurrentFrame();
  const r = mulberry32(Math.floor(g / 2) * 7919 + 13); // grain moves at 30 fps: filmic, and kinder to the encoder
  const ox = Math.floor(r() * 256);
  const oy = Math.floor(r() * 256);
  return (
    <>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 78% 78% at 50% 50%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.32) 78%, rgba(0,0,0,0.68) 100%)'}} />
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: W + 256,
          height: H + 256,
          backgroundImage: `url(${staticFile('mkv/grain.png')})`,
          backgroundRepeat: 'repeat',
          opacity: 0.04,
          mixBlendMode: 'overlay',
          transform: `translate(${-ox}px, ${-oy}px)`,
        }}
      />
    </>
  );
};
