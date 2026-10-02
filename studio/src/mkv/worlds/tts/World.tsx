// World 4 · TEXT TO SPEECH — "the anamorphic room" (pink). Glass letter shards scattered in 3D align into
// "Type it. Hear it." on exactly one frame, then the TTS tab: pick a voice, type, generate; the letters
// drop and become waveform bars, which stand up into nested frames (portal to Training).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {BoundaryShard} from '../live/shard';
import {Check, Glow, Play, WaveMark, clamp, ease, mix, mixHex, prog, rgba, sp} from '../live/util';
import {mulberry32} from '../../timing';
import {ShardField, fieldOpacity} from './anamorph';
import {KEYS, LINE, T} from './timing';

const PINK = ACCENT.tts;
const ORANGE = ACCENT.training;
const G = C.green;

// layout (screen px)
const CARD = {x: 380, y: 168, w: 1160, h: 712};
const FS = 46; // typed text size (JetBrains Mono: advance 0.6em -> exact glyph positions)
const ADV = FS * 0.6;
const X0 = 460;
const LINE_Y = 500;
const OUT_Y = 774;
const SLIDE = 104;
const CHARS = [...LINE];
const BAR_H = (() => {
  const r = mulberry32(4242);
  return CHARS.map((ch) => (ch === ' ' ? 0 : ch === '.' ? 14 : 'aeiou'.includes(ch.toLowerCase()) ? 64 + r() * 26 : 26 + r() * 36));
})();
const WOB = (() => {
  const r = mulberry32(4343);
  return CHARS.map(() => (r() - 0.5) * 24);
})();
const dropAt = (i: number) => T.dropStart + 2 * i;
const landAt = (i: number) => dropAt(i) + T.dropFall;

// ---------------------------------------------------------------- title ----
const Title: React.FC<{f: number}> = ({f}) => {
  if (f > 116) return null;
  const out = ease.cubicIn(prog(f, 94, 112));
  const idx = ease.expoOut(prog(f, 0, 18));
  const prom = ease.expoOut(prog(f, 26, 48));
  return (
    <AbsoluteFill style={{opacity: 1 - out, transform: `translateY(${-50 * out}px)`}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0) 48%)'}} />
      <div style={{position: 'absolute', left: 120, top: 168, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.32em', color: PINK, opacity: idx}}>04 / 09</div>
      <div style={{position: 'absolute', left: 112, top: 200, display: 'flex', fontFamily: FONT, fontWeight: 900, fontSize: 128, lineHeight: 1, letterSpacing: '-0.04em', color: C.fg, whiteSpace: 'pre'}}>
        {'TEXT TO SPEECH'.split('').map((ch, i) => {
          const s = sp(f, T.title + i * 2, {damping: 13, stiffness: 190, mass: 0.7});
          return (
            <span key={i} style={{display: 'inline-block', opacity: clamp(s * 3), transform: `translateY(${(1 - s) * 70}px) skewX(${(1 - s) * -12}deg)`}}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 120, top: 346, fontFamily: FONT, fontWeight: 500, fontSize: 34, color: C.sub, opacity: prom, transform: `translateY(${(1 - prom) * 16}px)`}}>
        Type text. Pick a voice. <span style={{color: PINK, fontWeight: 700}}>Generate.</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the TTS card ----
const Pill: React.FC<{label: string; sel: number; icon?: boolean}> = ({label, sel, icon}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      height: 58,
      padding: '0 24px',
      borderRadius: 29,
      background: sel > 0 ? rgba(G, 0.12 * sel) : C.control,
      border: `1.5px solid ${sel > 0 ? rgba(G, 0.3 + 0.6 * sel) : C.divider}`,
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: 24,
      color: sel > 0.5 ? C.fg : C.sub,
      transform: `scale(${1 + 0.06 * Math.sin(Math.PI * clamp(sel * 1.2))})`,
    }}
  >
    {icon ? <WaveMark size={30} color={sel > 0.5 ? G : C.sub} /> : null}
    {label}
    {sel > 0 ? <Check size={24} color={G} p={sel} width={10} /> : null}
  </div>
);

const Card: React.FC<{f: number}> = ({f}) => {
  const enter = sp(f, 170, {damping: 17, stiffness: 120, mass: 0.9});
  const out = ease.inOut(prog(f, T.exit - 4, T.exit + 12));
  const sel = clamp(prog(f, T.pick, T.pick + 6));
  const press = f >= T.generate ? Math.sin(Math.PI * clamp((f - T.generate) / 9)) : 0;
  const after = f >= T.generate ? Math.exp(-(f - T.generate) / 18) : 0;
  const ripple = clamp((f - T.generate) / 22);
  const outRow = sp(f, T.output, {damping: 14, stiffness: 180, mass: 0.7});
  const playing = f >= T.play ? (f - T.play) * 4.9 : 0;
  const label = (text: string, top: number) => (
    <div style={{position: 'absolute', left: 48, top, fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.sub}}>{text}</div>
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: CARD.x,
        top: CARD.y,
        width: CARD.w,
        height: CARD.h,
        borderRadius: 32,
        background: 'linear-gradient(180deg, #1b1b1b 0%, #151515 100%)',
        border: `1px solid ${C.selection}`,
        boxShadow: `0 50px 120px rgba(0,0,0,0.7), 0 0 120px ${rgba(PINK, 0.1)}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        opacity: clamp(enter * 2) * (1 - out),
        transform: `translateY(${(1 - enter) * 140}px) scale(${mix(0.93, 1, enter) * mix(1, 0.96, out)})`,
      }}
    >
      <div style={{position: 'absolute', left: 48, top: 38, fontFamily: FONT, fontWeight: 800, fontSize: 38, color: C.fg}}>Text to speech</div>
      <div style={{position: 'absolute', right: 48, top: 46, fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: '0.2em', color: PINK}}>TTS</div>
      {label('Voice', 108)}
      <div style={{position: 'absolute', left: 48, top: 142, display: 'flex', gap: 14}}>
        <Pill label="My voice" sel={sel} icon />
        <Pill label="Character A" sel={0} />
        <Pill label="Character B" sel={0} />
      </div>
      {label('Text', 228)}
      <div
        style={{
          position: 'absolute',
          left: 48,
          top: 262,
          width: CARD.w - 96,
          height: 140,
          borderRadius: 18,
          background: '#0e0e0e',
          border: `1.5px solid ${f >= KEYS[0] - 8 && f < T.generate ? rgba(PINK, 0.6) : C.divider}`,
        }}
      >
        {f < KEYS[0] ? (
          <div style={{position: 'absolute', left: 32, top: 47, fontFamily: MONO, fontWeight: 500, fontSize: FS, lineHeight: 1, color: '#4a4a4a'}}>Type text here...</div>
        ) : null}
      </div>
      {/* Generate speech */}
      <div
        style={{
          position: 'absolute',
          left: 48,
          top: 430,
          width: CARD.w - 96,
          height: 84,
          borderRadius: 42,
          overflow: 'hidden',
          background: G,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 30,
          color: '#000',
          transform: `scale(${1 - 0.035 * press})`,
          boxShadow: `0 0 ${70 * after}px ${rgba(G, 0.6 * after)}`,
        }}
      >
        {f >= T.generate && ripple < 1 ? (
          <div
            style={{
              position: 'absolute',
              left: CARD.w / 2 - 48 - 600,
              top: 42 - 600,
              width: 1200,
              height: 1200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.45)',
              opacity: 1 - ripple,
              transform: `scale(${ease.expoOut(ripple)})`,
            }}
          />
        ) : null}
        <Play size={30} color="#000" />
        Generate speech
      </div>
      {/* output row */}
      <div
        style={{
          position: 'absolute',
          left: 48,
          top: 546,
          width: CARD.w - 96,
          height: 120,
          borderRadius: 18,
          background: '#0e0e0e',
          border: `1.5px ${outRow > 0.5 ? 'solid' : 'dashed'} ${outRow > 0.5 ? '#3a3a3a' : C.divider}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 24,
            top: 24,
            width: 72,
            height: 72,
            borderRadius: 36,
            background: G,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: clamp(outRow * 3),
            transform: `scale(${outRow * (1 - 0.08 * Math.sin(Math.PI * clamp((f - T.play) / 8)))})`,
          }}
        >
          <Play size={30} color="#000" />
        </div>
        <div style={{position: 'absolute', right: 30, top: 44, fontFamily: MONO, fontWeight: 500, fontSize: 26, color: C.sub, opacity: clamp(outRow * 2)}}>
          <span style={{color: C.fg}}>0:00</span> / 0:02
        </div>
        {f >= T.play ? (
          <div style={{position: 'absolute', left: X0 + SLIDE - CARD.x - 48 - 14 + playing, top: 14, width: 3, height: 92, background: '#fff', boxShadow: '0 0 12px #fff', borderRadius: 2}} />
        ) : null}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- typed text + falling letters ----
const Typed: React.FC<{f: number}> = ({f}) => {
  if (f < KEYS[0] - 2 || f > landAt(CHARS.length - 1) + 8) return null;
  const typed = KEYS.filter((k) => k <= f).length;
  const typing = f < KEYS[KEYS.length - 1] + 2;
  const caretOn = (typing || Math.floor((f - KEYS[KEYS.length - 1]) / 15) % 2 === 1) && f < T.generate;
  return (
    <AbsoluteFill>
      {CHARS.map((ch, i) => {
        if (i >= typed || ch === ' ') return null;
        const pop = clamp((f - KEYS[i]) / 5);
        const t = clamp((f - dropAt(i)) / T.dropFall);
        const land = clamp((f - landAt(i)) / 5);
        if (land >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: X0 + i * ADV,
              top: LINE_Y - FS / 2,
              width: ADV,
              textAlign: 'center',
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: FS,
              lineHeight: 1,
              color: mixHex(mixHex(PINK, '#ffffff', pop), PINK, clamp(t * 2)),
              opacity: 1 - land,
              transformOrigin: '50% 100%',
              transform: `translateY(${(OUT_Y - LINE_Y) * t * t}px) rotate(${WOB[i] * t * (1 - land)}deg) scale(${mix(1.25, 1, ease.cubicOut(pop))}) scaleY(${mix(1, 0.25, land)})`,
            }}
          >
            {ch}
          </div>
        );
      })}
      {caretOn ? <div style={{position: 'absolute', left: X0 + typed * ADV + 2, top: LINE_Y - 27, width: 4, height: 54, borderRadius: 2, background: PINK}} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- bars -> nested frames (3D) ----
const ROW_CX = X0 + (CHARS.length / 2) * ADV + SLIDE;
const FRAME_W = 1280;
const FRAME_H = 720;

const Bars: React.FC<{f: number}> = ({f}) => {
  if (f < landAt(0) - 1) return null;
  const slide = SLIDE * ease.inOut(prog(f, T.output - 8, T.output + 10));
  const move = ease.inOut(prog(f, T.exit - 2, T.exit + 18));
  const turn = ease.inOut(prog(f, T.exit + 6, T.exit + 42));
  const spread = 1 + 5 * ease.inOut(prog(f, T.exit + 6, T.exit + 44));
  const push = -1500 * ease.inOut(prog(f, T.exit + 6, T.exit + 44)) + 260 * ease.cubicIn(prog(f, 474, 492));
  const gx = mix(ROW_CX - SLIDE + slide, 960, move);
  const gy = mix(OUT_Y, 540, move);
  const col = mixHex(PINK, ORANGE, ease.inOut(prog(f, T.exit + 14, 488)));
  const playX = f >= T.play ? X0 + SLIDE - 14 + (f - T.play) * 4.9 : -1e9;
  return (
    <AbsoluteFill style={{perspective: 1000, perspectiveOrigin: '960px 540px'}}>
      <div style={{position: 'absolute', left: gx, top: gy, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `translateZ(${push}px) rotateY(${90 * turn}deg)`}}>
        {CHARS.map((ch, i) => {
          if (ch === ' ') return null;
          const lx = (X0 + (i + 0.5) * ADV - (ROW_CX - SLIDE)) * spread;
          const grow = sp(f, landAt(i) - 1, {damping: 9, stiffness: 220, mass: 0.6});
          if (grow <= 0) return null;
          const h = Math.max(2, BAR_H[i] * grow);
          const lit = X0 + (i + 0.5) * ADV + SLIDE <= playX;
          const fo = clamp((turn - 0.18) / 0.4);
          return (
            <div key={i} style={{position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translateX(${lx}px)`}}>
              <div
                style={{
                  position: 'absolute',
                  left: -5,
                  top: -h / 2,
                  width: 10,
                  height: h,
                  borderRadius: 5,
                  background: lit ? '#ffffff' : col,
                  boxShadow: lit ? `0 0 14px ${rgba(PINK, 0.9)}` : 'none',
                  opacity: 1 - clamp((turn - 0.55) / 0.3),
                }}
              />
              {fo > 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    left: -FRAME_W / 2,
                    top: -FRAME_H / 2,
                    width: FRAME_W,
                    height: FRAME_H,
                    borderRadius: 26,
                    border: `6px solid ${col}`,
                    background: rgba(ORANGE, 0.025),
                    opacity: fo,
                    transform: `rotateY(-90deg) scaleY(${mix(h / FRAME_H, 1, ease.cubicOut(fo))})`,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  const t = f - T.align;
  const flash = t >= 0 ? Math.exp(-t / 10) : 0;
  const fo = fieldOpacity(f) * (1 - ease.inOut(prog(f, T.exit - 10, T.exit + 10)));
  const sway = ease.inOut(prog(f, 176, 214)) * (1 - ease.inOut(prog(f, T.exit - 16, T.exit)));
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(60% 55% at 50% 50%, ${rgba(PINK, 0.13)} 0%, rgba(0,0,0,0) 70%)`, opacity: clamp(f / 30)}} />
      <Glow x={960} y={540} size={2000} color={PINK} opacity={0.55 * flash} />
      {/* anamorphic light streak behind the glass on the alignment frame */}
      <div
        style={{
          position: 'absolute',
          left: -100,
          right: -100,
          top: 470,
          height: 140,
          background: `radial-gradient(50% 50% at 50% 50%, ${rgba('#ffffff', 0.5)} 0%, ${rgba(PINK, 0.25)} 30%, ${rgba(PINK, 0)} 100%)`,
          opacity: flash,
          transform: `scaleX(${0.4 + 0.8 * (1 - flash)}) scaleY(${0.5 + 0.5 * flash})`,
        }}
      />
      {fo > 0 ? (
        <AbsoluteFill style={{opacity: fo}}>
          <ShardField f={f} />
        </AbsoluteFill>
      ) : null}
      <Title f={f} />
      <AbsoluteFill style={{perspective: 2400, perspectiveOrigin: '960px 520px'}}>
        <AbsoluteFill
          style={{
            transform: `rotateX(${sway * 1.6 * Math.sin(f / 51)}deg) rotateY(${sway * 2.4 * Math.sin(f / 67 + 1)}deg)`,
            transformOrigin: '960px 520px',
          }}
        >
          <Card f={f} />
          <Typed f={f} />
          <Bars f={f} />
        </AbsoluteFill>
      </AbsoluteFill>
      <BoundaryShard u={f} />
    </AbsoluteFill>
  );
};
