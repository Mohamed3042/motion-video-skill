// World 6 · SOUND LAB (sage) — "Thirty tools. Start with the sound."
// Hero illusion: the soundtrack draws MONTAGE in its own spectrogram. The image is NOT drawn: it is the STFT of the
// audio scripts/mpw/worlds/sound.ts renders (scripts/mpw/worlds/sound-spectro.ts → public/mpw/sound/spec-*.png),
// scrolled so the column under the playhead is always the sound playing on that frame (SPEC maps frame ↔ column).
// Entrance: Handoff's package lid opens and the waveform pours out, then unfolds into the spectrogram.
// AUDIO REPAIR: the hum ladder + click specks are selected and removed (the history wipes to the processed render).
// Then the spectrogram docks into a live strip while eight quick tool beats play; exit: its three last spectral
// lines become an RGB light band (into Picture Lab).
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT, MONO, RADIUS} from '../../brand';
import {useWorldFrame} from '../../frame';
import {SPEC, WAVE} from './spectro.gen';
import {CLICKS, T} from './timing';
import {Rail, Tools} from './tools';
import {Check, Mono, Primary, SAGE, Segmented, Toggle, ToolLabel, clamp, eio, eo, mix, prog, pulse, rgba} from './ui';

// ---------------------------------------------------------------- time ↔ space ----
const V = 4.5; // px per video frame
const PXC = V / SPEC.CPF; // px per spectrogram column
const IMG_W = SPEC.COLS * PXC;
const PL = 96;
const PR = 1824;
const PH0 = 256; // playhead x when it starts travelling
const PARK = 1716; // … and where it parks (from then on the history scrolls left under it)
const HERO = {y: 214, h: 590};
const STRIP = {y: 744, h: 168};
const RIB_Y = 509; // waveform ribbon = hero panel centre line
export const xPh = (f: number) => Math.min(PARK, PH0 + Math.max(0, f - T.move) * V);
export const xAt = (f: number, t: number) => xPh(f) - (f - t) * V; // screen x of the sound at local frame t
const LOGR = Math.log(SPEC.F_MAX / SPEC.F_MIN);
const rowOfHz = (hz: number) => (SPEC.ROWS - 1) * (1 - Math.log(hz / SPEC.F_MIN) / LOGR); // image row (fractional)
const src = (n: string) => staticFile(`mpw/sound/${n}.png`);

// vertical mapping of the image: screen y = imgTop + row * imgH / ROWS, clipped to [top, top + h]
type VMap = {top: number; h: number; imgTop: number; imgH: number};
const EXIT_ROW = rowOfHz(880); // the middle of the three exit lines (F major triad, A5)
function vmap(f: number): VMap {
  const d = eio(prog(f, T.dock, T.dock + 30));
  const top = mix(HERO.y, STRIP.y, d);
  const h = mix(HERO.h, STRIP.h, d);
  const e = eio(prog(f, T.exit + 4, T.exit + 34));
  if (e <= 0) return {top, h, imgTop: top, imgH: h};
  // exit: zoom onto the three lines and squeeze the panel into a band whose centre (the A5 line) rises to y 540
  const k = mix(h / SPEC.ROWS, 1.05, e);
  const yc = mix(top + (EXIT_ROW / SPEC.ROWS) * h, 540, e);
  const t0 = mix(top, 505, e);
  return {top: t0, h: mix(top + h, 575, e) - t0, imgTop: yc - EXIT_ROW * k, imgH: SPEC.ROWS * k};
}
const yOfHz = (hz: number, m: VMap) => m.imgTop + (rowOfHz(hz) / SPEC.ROWS) * m.imgH;

// ---------------------------------------------------------------- backdrop ----
const Backdrop: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill>
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 55% at 50% 52%, ${rgba(SAGE, 0.07)}, rgba(0,0,0,0) 70%)`}} />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.5 * (1 - prog(f, T.exit, T.exit + 30)),
        backgroundImage: `radial-gradient(${rgba(C.muted, 0.09)} 1px, transparent 1.6px)`,
        backgroundSize: '24px 24px',
        backgroundPosition: `${-((f * 0.6) % 24)}px 0px`,
      }}
    />
  </AbsoluteFill>
);

// ---------------------------------------------------------------- entrance: the package pours a waveform ----
const POUR_V = 26; // px per frame the poured waveform travels outward
const Entrance: React.FC<{f: number}> = ({f}) => {
  if (f > 116) return null;
  const lid = eio(prog(f, -12, 2));
  const boxOut = eio(prog(f, 8, 34));
  const glow = clamp(lid * 1.4) * (1 - prog(f, 20, 60));
  const ribOut = prog(f, 94, 112);
  const BX = 960;
  const BY = 566; // box mouth
  const bars: React.ReactNode[] = [];
  for (let side = -1; side <= 1; side += 2)
    for (let i = 0; i < 175; i++) {
      const d = 4 + i * 5;
      const t = f - d / POUR_V;
      const c = (t - SPEC.F0) * SPEC.CPF;
      if (t < -2 || c < 0 || c >= WAVE.length) continue;
      const a = WAVE[Math.floor(c)] * (1 - (d / 900) ** 3);
      const hgt = 4 + a * 150;
      bars.push(<rect key={`${side}${i}`} x={BX + side * d - 1.5} y={RIB_Y - hgt / 2} width={3} height={hgt} rx={1.5} fill={SAGE} opacity={0.35 + 0.65 * a} />);
    }
  return (
    <AbsoluteFill style={{opacity: 1 - ribOut}}>
      {/* package (Handoff's lid opens) */}
      <div style={{position: 'absolute', left: BX - 160, top: BY, width: 320, height: 180, opacity: 1 - boxOut, transform: `translateY(${boxOut * 120}px) scale(${1 - 0.15 * boxOut})`}}>
        <div style={{position: 'absolute', left: 30, top: -60, width: 260, height: 120, background: `radial-gradient(ellipse at 50% 80%, ${rgba(SAGE, 0.55 * glow)}, rgba(0,0,0,0) 70%)`}} />
        <div style={{position: 'absolute', inset: 0, borderRadius: RADIUS.dialog, background: `linear-gradient(180deg, #2b231b, #1b1712)`, border: `2px solid ${rgba('#f0a35e', 0.75)}`}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 70, height: 2, background: rgba('#f0a35e', 0.35)}} />
        <div style={{position: 'absolute', left: 140, top: 0, width: 40, height: 180, background: rgba('#f0a35e', 0.16)}} />
        <div
          style={{
            position: 'absolute',
            left: -10,
            top: -36,
            width: 340,
            height: 38,
            borderRadius: RADIUS.control,
            background: '#3a2c1f',
            border: `2px solid ${rgba('#f0a35e', 0.85)}`,
            transformOrigin: '50% 100%',
            transform: `perspective(700px) rotateX(${lid * 118}deg) translateY(${-lid * 6}px)`,
            opacity: 1 - prog(f, -2, 8),
          }}
        />
      </div>
      {/* poured waveform: the real soundtrack, flowing outward from the box */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <line x1={PL} x2={PR} y1={RIB_Y} y2={RIB_Y} stroke={rgba(SAGE, 0.18 * prog(f, 0, 20))} strokeWidth={1} />
        {bars}
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- title ----
const Title: React.FC<{f: number}> = ({f}) => {
  if (f > 112) return null;
  const out = eio(prog(f, 90, 106));
  const idx = eo(prog(f, 2, 18));
  const prom = eo(prog(f, 22, 42));
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${-40 * out}px)`}}>
      <Mono size={22} color={SAGE} spacing={0.32} style={{position: 'absolute', left: 122, top: 150, opacity: idx}}>
        06 / 11
      </Mono>
      <div style={{position: 'absolute', left: 112, top: 178, display: 'flex', fontFamily: FONT, fontWeight: 800, fontSize: 132, lineHeight: 1, letterSpacing: '-0.02em', color: C.text, whiteSpace: 'pre'}}>
        {'SOUND LAB'.split('').map((ch, i) => {
          const s = eo(prog(f, 4 + i * 1.6, 18 + i * 1.6));
          return (
            <span key={i} style={{display: 'inline-block', opacity: clamp(s * 2), transform: `translateY(${(1 - s) * 60}px)`}}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 120, top: 330, fontFamily: FONT, fontWeight: 500, fontSize: 40, color: C.muted, opacity: prom, transform: `translateY(${(1 - prom) * 14}px)`}}>
        Thirty tools. <span style={{color: SAGE, fontWeight: 650}}>Start with the sound.</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the computed spectrogram ----
const Spectro: React.FC<{f: number; m: VMap; wipe: number; fade: number}> = ({f, m, wipe, fade}) => {
  const ph = xPh(f);
  const left = xAt(f, SPEC.F0) - PXC / 2 - PL;
  const img = (n: string, extra?: React.CSSProperties) => (
    <Img src={src(n)} style={{position: 'absolute', left, top: m.imgTop - m.top, width: IMG_W, height: m.imgH, ...extra}} />
  );
  const done = wipe >= PR;
  const tag = done ? 'proc' : 'orig';
  return (
    <div style={{position: 'absolute', left: PL, top: m.top, width: Math.max(0, ph - PL), height: m.h, overflow: 'hidden', opacity: fade}}>
      {img(done ? 'spec-proc' : 'spec-orig')}
      {!done && wipe > PL ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: wipe - PL, height: m.h, overflow: 'hidden'}}>{img('spec-proc')}</div>
      ) : null}
      {img(`spec-${tag}-glow`, {mixBlendMode: 'screen', opacity: 0.3})}
      {/* fresh ink: the newest columns glow as the playhead writes them */}
      <div style={{position: 'absolute', left: ph - PL - 70, top: 0, width: 70, height: m.h, background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(C.amber, 0.16)})`, mixBlendMode: 'screen'}} />
    </div>
  );
};

// frequency grid + labels, beat ruler, playhead
const Chrome: React.FC<{f: number; m: VMap; a: number}> = ({f, m, a}) => {
  const ph = xPh(f);
  const ticks: React.ReactNode[] = [];
  for (let t = Math.ceil((f - 400) / 30) * 30; t <= f; t += 30) {
    const x = xAt(f, t);
    if (x < PL + 2 || x > PR) continue;
    const bar = t % 120 === 0;
    ticks.push(<div key={t} style={{position: 'absolute', left: x, top: m.top - (bar ? 16 : 9), width: 1, height: bar ? 12 : 6, background: rgba(C.muted, bar ? 0.6 : 0.35)}} />);
    if (bar && t >= 0)
      ticks.push(
        <Mono key={`l${t}`} size={13} color={rgba(C.muted, 0.75)} spacing={0.1} weight={500} style={{position: 'absolute', left: x + 6, top: m.top - 24}}>
          {t / 120 + 1}
        </Mono>,
      );
  }
  return (
    <div style={{position: 'absolute', inset: 0, opacity: a}}>
      <div style={{position: 'absolute', left: PL, top: m.top, width: PR - PL, height: m.h, borderRadius: RADIUS.dialog, border: `1px solid ${C.line}`, pointerEvents: 'none'}} />
      {[100, 1000, 10000].map((hz) => {
        const y = yOfHz(hz, m);
        if (y < m.top + 8 || y > m.top + m.h - 8) return null;
        return (
          <React.Fragment key={hz}>
            <div style={{position: 'absolute', left: PL, width: PR - PL, top: y, height: 1, background: rgba(C.text, 0.06)}} />
            <Mono size={13} color={rgba(C.muted, 0.8)} spacing={0.06} weight={500} style={{position: 'absolute', right: 1920 - PR + 10, top: y + 4}}>
              {hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`}
            </Mono>
          </React.Fragment>
        );
      })}
      {ticks}
      <div style={{position: 'absolute', left: ph - 1, top: m.top - 18, width: 2, height: m.h + 18, background: C.amber, boxShadow: `0 0 14px ${rgba(C.amber, 0.7)}`}} />
      <div style={{position: 'absolute', left: ph - 7, top: m.top - 24, width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: `9px solid ${C.amber}`}} />
    </div>
  );
};

// ---------------------------------------------------------------- AUDIO REPAIR overlay ----
const Repair: React.FC<{f: number; m: VMap}> = ({f, m}) => {
  if (f < 104 || f > T.dock + 14) return null;
  const out = 1 - prog(f, T.dock - 2, T.dock + 10);
  const ui = eo(prog(f, T.repairUi, T.repairUi + 16));
  const sel = eo(prog(f, T.select, T.select + 14));
  const fixed = eio(prog(f, T.repair, T.repair + 18));
  const press = pulse(f, T.repair, 14);
  const ph = xPh(f);
  const yTop = yOfHz(440, m);
  const yBot = yOfHz(100, m);
  const selOut = 1 - prog(f, T.repair + 2, T.repair + 14);
  const caption = 1 - ui;
  return (
    <AbsoluteFill style={{opacity: out}}>
      {/* header */}
      <div style={{position: 'absolute', left: PL, top: 150, opacity: prog(f, 106, 120) * caption, display: 'flex', gap: 18, alignItems: 'center'}}>
        <div style={{width: 8, height: 8, borderRadius: 4, background: SAGE}} />
        <Mono size={17} color={C.muted} spacing={0.24}>
          SPECTROGRAM · COMPUTED FROM THIS SOUNDTRACK
        </Mono>
      </div>
      <div style={{position: 'absolute', left: PL, top: 142, opacity: ui, transform: `translateY(${(1 - ui) * 12}px)`, display: 'flex', alignItems: 'center', gap: 26}}>
        <ToolLabel name="AUDIO REPAIR" index="01" />
        <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 28, color: C.text}}>Clean a recording. Keep the original.</div>
      </div>
      <div style={{position: 'absolute', right: 1920 - PR, top: 136, opacity: ui}}>
        <Segmented a="Original" b="Processed" t={fixed} />
      </div>
      {/* selected band around the hum ladder + click markers */}
      {sel > 0 && selOut > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: selOut}}>
          <div
            style={{
              position: 'absolute',
              left: PL + 6,
              top: yTop,
              width: Math.max(0, (ph - PL - 12) * sel),
              height: yBot - yTop,
              border: `2px dashed ${C.amber}`,
              borderRadius: RADIUS.control,
              background: rgba(C.amber, 0.07),
            }}
          />
          <div style={{position: 'absolute', left: PL + 14, top: yTop - 34, opacity: sel, display: 'flex', gap: 10}}>
            <div style={{background: C.amber, color: C.onAmber, fontFamily: MONO, fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', padding: '5px 10px', borderRadius: 4}}>SELECTED BAND</div>
            <div style={{background: rgba('#000000', 0.55), color: C.amber, fontFamily: MONO, fontWeight: 500, fontSize: 14, padding: '5px 10px', borderRadius: 4}}>HUM · 60 Hz SERIES</div>
          </div>
          {CLICKS.map((cf, i) => {
            const x = xAt(f, cf);
            const a = eo(prog(f, T.select + 4 + i * 0.7, T.select + 12 + i * 0.7));
            if (x < PL + 4 || x > ph - 2 || a <= 0) return null;
            return (
              <React.Fragment key={i}>
                <div style={{position: 'absolute', left: x - 0.5, top: m.top + 4, width: 1, height: m.h - 8, background: rgba(C.amber, 0.28 * a)}} />
                <div style={{position: 'absolute', left: x - 6, top: m.top + 4 - 10 * (1 - a), width: 0, height: 0, opacity: a, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `9px solid ${C.amber}`}} />
              </React.Fragment>
            );
          })}
        </div>
      ) : null}
      {/* the repair sweep */}
      {f >= T.repair && f < T.repair + 22 ? (
        <div
          style={{
            position: 'absolute',
            left: mix(PL, PR, fixed) - 40,
            top: m.top,
            width: 44,
            height: m.h,
            opacity: 1 - prog(f, T.repair + 16, T.repair + 22),
            background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(C.amber, 0.25)} 70%, ${rgba('#fff4dc', 0.9)} 96%, rgba(0,0,0,0))`,
          }}
        />
      ) : null}
      {/* controls */}
      <div style={{position: 'absolute', left: PL, top: 834, width: PR - PL, display: 'flex', alignItems: 'center', gap: 16, opacity: ui, transform: `translateY(${(1 - ui) * 18}px)`}}>
        <Toggle label="Remove hum" value="60 Hz" on={eo(prog(f, T.select, T.select + 6))} />
        <Toggle label="Soften clicks and pops" on={eo(prog(f, T.select + 8, T.select + 14))} />
        <Toggle label="Selected band" value="Attenuate band" on={eo(prog(f, T.select + 2, T.select + 8))} />
        <div style={{flex: 1}} />
        <div style={{display: 'flex', alignItems: 'center', gap: 10, opacity: prog(f, T.repair + 4, T.repair + 12)}}>
          <Check p={eo(prog(f, T.repair + 4, T.repair + 14))} />
          <Mono size={15} color={SAGE} spacing={0.14}>
            ORIGINAL PRESERVED
          </Mono>
        </div>
        <Primary label="Process audio" press={press} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- exit: three spectral lines → RGB band ----
const RGB = ['#ff5f6d', '#7dffa8', '#5f9dff'];
const Band: React.FC<{f: number; m: VMap}> = ({f, m}) => {
  if (f < T.exit + 10) return null;
  const grow = eio(prog(f, T.exit + 14, T.band));
  const ph = xPh(f);
  const ys = [698.5, 880, 1046.5].map((hz) => yOfHz(hz, m));
  const pulseA = 0.85 + 0.15 * Math.sin(f * 0.25);
  const boost = 1 + 0.6 * Math.exp(-(((f - 1076) / 6) ** 2));
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen'}}>
      {ys.map((y, i) => {
        const l = mix(ph, -40, grow);
        const r = mix(ph, 1960, grow);
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: l, top: y - 16, width: r - l, height: 32, opacity: 0.55 * grow * pulseA * boost, background: `linear-gradient(180deg, rgba(0,0,0,0), ${rgba(RGB[i], 0.55)}, rgba(0,0,0,0))`}} />
            <div style={{position: 'absolute', left: l, top: y - 2, width: r - l, height: 4, opacity: clamp(grow * 1.6) * boost, background: RGB[i], boxShadow: `0 0 16px ${RGB[i]}`}} />
          </React.Fragment>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 540 - 1, height: 2, opacity: 0.5 * grow * boost, background: '#ffffff'}} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- world ----
export const World: React.FC = () => {
  const f = useWorldFrame();
  const m = vmap(f);
  const unfold = eio(prog(f, 94, 116));
  const exitFade = 1 - prog(f, T.exit + 26, T.band);
  const fixedX = f < T.repair ? PL : mix(PL, PR, eio(prog(f, T.repair, T.repair + 18)));
  const wipe = f >= T.repair + 18 ? PR + 1 : fixedX;
  const showSpec = f >= 94 && f < T.band + 8;
  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      <Backdrop f={f} />
      {showSpec ? (
        <div style={{position: 'absolute', inset: 0, transformOrigin: `960px ${RIB_Y}px`, transform: `scaleY(${mix(0.02, 1, unfold)})`, opacity: clamp(unfold * 3) * exitFade}}>
          <div style={{position: 'absolute', left: PL, top: m.top, width: PR - PL, height: m.h, borderRadius: RADIUS.dialog, background: '#0d0f0e'}} />
          <Spectro f={f} m={m} wipe={wipe} fade={1} />
          <Chrome f={f} m={m} a={1 - prog(f, T.exit, T.exit + 16)} />
          {f > T.dock + 20 && f < T.exit + 20 ? (
            <Mono size={13} color={rgba(C.muted, 0.9)} spacing={0.2} style={{position: 'absolute', left: PL + 14, top: m.top + 10, opacity: prog(f, T.dock + 24, T.dock + 36) * (1 - prog(f, T.exit, T.exit + 10)), background: rgba('#000000', 0.55), padding: '4px 8px', borderRadius: 4}}>
              LIVE SPECTROGRAM · THIS SOUNDTRACK
            </Mono>
          ) : null}
        </div>
      ) : null}
      <Entrance f={f} />
      <Title f={f} />
      <Repair f={f} m={m} />
      <Rail f={f} />
      <Tools f={f} />
      <Band f={f} m={m} />
    </AbsoluteFill>
  );
};
