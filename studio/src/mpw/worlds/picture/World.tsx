// World 7 · PICTURE LAB (violet + RGB). "Then the picture."
// Entrance: Sound Lab's spectrogram colors condense into an RGB light band; the band writes the title, then
// sweeps as a scanner between the tool beats. Three perception illusions carry the tools:
//   Adelson checker-shadow (Color Balance / Reference Color Match), barber pole / aperture problem (Motion
//   Tracking), induced motion (Shot Stabilization); then quick finishing beats, and the frame becomes a film
//   strip that slides into Library's thumbnail grid.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {mulberry32} from '../../timing';
import {Adelson, ColorMatch} from './checker';
import {Finishing} from './finish';
import {Band, Glow, RGB, Section, VIO, WipeBand, clamp, ease, mix, prog, rgba, sp, type Wipe} from './kit';
import {Stabilization, Tracking} from './motion';
import {T} from './timing';

const TITLE_BAND = 486;
const W0: Wipe = {c: T.w0, dir: -1, from: TITLE_BAND};
const W1: Wipe = {c: T.w1, dir: 1};
const W2: Wipe = {c: T.w2, dir: 1};
const W3: Wipe = {c: T.w3, dir: 1};
const W4: Wipe = {c: T.w4, dir: 1};

// ---------------------------------------------------------------- entrance: spectrogram → RGB band ----
const SPEC_RAMP = ['#0d1714', '#1d4a3d', '#a5c9ad', '#edb654', '#fff4dc'];
const heat = (v: number) => {
  const x = clamp(v) * (SPEC_RAMP.length - 1);
  const i = Math.min(SPEC_RAMP.length - 2, Math.floor(x));
  const t = x - i;
  const a = parseInt(SPEC_RAMP[i].slice(1), 16);
  const b = parseInt(SPEC_RAMP[i + 1].slice(1), 16);
  const ch = (s: number) => Math.round(mix((a >> s) & 255, (b >> s) & 255, t));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
const COLS = 96;
const ROWS = 18;
const SPEC = (() => {
  const r = mulberry32(707);
  const out: string[] = [];
  for (let i = 0; i < COLS; i++) {
    const beat = 0.6 + 0.4 * Math.sin(i * 0.37) * Math.sin(i * 0.11 + 1);
    for (let j = 0; j < ROWS; j++) {
      const low = 1 - j / ROWS; // low frequencies (bottom rows) carry more energy
      out.push(heat(0.15 + 0.75 * beat * (0.35 + 0.65 * (1 - low * low)) * (0.55 + 0.45 * r())));
    }
  }
  return out;
})();
const Spectrogram: React.FC<{f: number}> = ({f}) => {
  if (f >= 4) return null;
  const c = ease.inOut(prog(f, -12, 0));
  const cw = 1920 / COLS;
  const rh = 1080 / ROWS;
  return (
    <AbsoluteFill style={{opacity: 1 - prog(f, -3, 3), transform: `scaleY(${1 - 0.996 * c})`, transformOrigin: '960px 540px'}}>
      <svg width={1920} height={1080} shapeRendering="crispEdges">
        {SPEC.map((col, k) => (
          <rect key={k} x={Math.floor(k / ROWS) * cw} y={1080 - ((k % ROWS) + 1) * rh} width={cw + 0.5} height={rh + 0.5} fill={col} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- title moment ----
const NAME = 'PICTURE LAB';
const Title: React.FC<{f: number}> = ({f}) => {
  if (f > T.w0 + 10) return null;
  const by = f < 0 ? 540 : mix(540, TITLE_BAND, ease.expoOut(prog(f, 0, 14)));
  const idx = ease.expoOut(prog(f, 6, 22));
  const prom = ease.expoOut(prog(f, 26, 46));
  const conv = ease.expoOut(prog(f, 8, 40));
  const d = 22 * (1 - conv);
  const solid = prog(f, 36, 46);
  const letters = (color: string, dx: number, o: number) => (
    <div style={{position: 'absolute', left: 140 + dx, top: 0, display: 'flex', whiteSpace: 'pre', fontFamily: FONT, fontWeight: 800, fontSize: 156, lineHeight: 1, letterSpacing: '-0.035em', color, opacity: o, mixBlendMode: 'screen'}}>
      {NAME.split('').map((ch, i) => {
        const s = sp(f, 4 + i * 1.6, {damping: 15, stiffness: 170, mass: 0.75});
        return (
          <span key={i} style={{display: 'inline-block', transform: `translateY(${(1 - s) * 180}px)`}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 144, top: 262, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: '0.32em', color: VIO, opacity: idx, transform: `translateY(${(1 - idx) * 12}px)`}}>
        07 / 11
      </div>
      {/* letters rise out of the band (clipped at it) */}
      <div style={{position: 'absolute', left: 0, top: 306, width: 1920, height: by - 306 - 4, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 6, width: 1920, height: 170}}>
          {solid < 1 ? (
            <>
              {letters(RGB[0], -d, 1 - solid)}
              {letters(RGB[1], 0, 1 - solid)}
              {letters(RGB[2], d, 1 - solid)}
            </>
          ) : null}
          {solid > 0 ? letters(C.text, 0, solid) : null}
        </div>
      </div>
      <div style={{position: 'absolute', left: 146, top: by + 26, fontFamily: FONT, fontWeight: 500, fontSize: 44, color: C.muted, opacity: prom, transform: `translateY(${(prom - 1) * 24}px)`}}>
        Then the <span style={{color: C.text, fontWeight: 650}}>picture.</span>
      </div>
      <div style={{position: 'absolute', left: 146, top: by + 104, display: 'flex', gap: 12, opacity: prog(f, 44, 60)}}>
        {['COLOR', 'MOTION', 'STABILITY', 'FINISH'].map((t, i) => (
          <div key={t} style={{fontFamily: MONO, fontSize: 15, letterSpacing: '0.2em', color: C.muted, padding: '7px 12px', border: `1px solid ${C.line}`, borderRadius: 6, opacity: prog(f, 44 + i * 4, 54 + i * 4)}}>
            {t}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// the band itself during the entrance + title (afterwards the wipes carry it)
const TitleBand: React.FC<{f: number}> = ({f}) => {
  if (f >= T.w0 - 9) return null;
  const y = f < 0 ? 540 : mix(540, TITLE_BAND, ease.expoOut(prog(f, 0, 14)));
  const flash = f >= 0 ? Math.exp(-f / 9) : prog(f, -8, 0) ** 2;
  const spread = f < 0 ? mix(26, 2, prog(f, -10, 0)) : 2 + 7 * Math.exp(-f / 6) + 1.5 * Math.sin(f / 9);
  return (
    <>
      <Glow x={960} y={y} size={1500} color={VIO} opacity={0.35 * flash} scale={1} />
      <div style={{position: 'absolute', left: -40, top: y - 260, width: 2000, height: 520, background: `radial-gradient(50% 50% at 50% 50%, ${rgba('#ffffff', 0.4)} 0%, rgba(255,255,255,0) 60%)`, opacity: flash, transform: `scaleY(${0.15 + 0.3 * flash})`}} />
      <Band y={y} spread={spread} o={f < 0 ? prog(f, -9, -2) : 1} core={0.6 + 0.4 * flash} />
    </>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(70% 60% at 50% 45%, ${rgba(VIO, 0.09)} 0%, rgba(0,0,0,0) 70%)`}} />
      <Spectrogram f={f} />
      <Section f={f} b={W0}>
        <Title f={f} />
      </Section>
      <Section f={f} a={W0} b={W1}>
        <Adelson f={f} />
      </Section>
      <Section f={f} a={W1} b={W2}>
        <ColorMatch f={f} />
      </Section>
      <Section f={f} a={W2} b={W3}>
        <Tracking f={f} />
      </Section>
      <Section f={f} a={W3} b={W4}>
        <Stabilization f={f} />
      </Section>
      <Section f={f} a={W4}>
        <Finishing f={f} />
      </Section>
      <TitleBand f={f} />
      {[W0, W1, W2, W3, W4].map((w) => (
        <WipeBand key={w.c} f={f} w={w} />
      ))}
    </AbsoluteFill>
  );
};
