// World 4 · CAPTIONS & MARKERS (paper). The caret Review handed over types a caption with scrambled middles
// ("Evrey anlge. Evrey wrod.") that you can still read (typoglycemia); cue text edits snap each letter home,
// one click per letter, and the line lands right. It flies into the Captions & markers workspace: SRT / WebVTT
// import, a cue list with timings, search, Shift cues, Split at playhead, Undo/Redo, markers with labels and notes,
// SRT / VTT export. Exit: the cue blocks fly up and stack into three bars (the Handoff fork's prongs).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO, RADIUS} from '../../brand';
import {useWorldFrame} from '../../frame';
import {Arrow, Btn, Check, Chip, Glow, MonoLabel, Title, clamp, ease, mix, panel, prog, pulse, rgba, sp} from '../review/kit';
import {FIXED, KEYS, LINE, MOVES, SEARCH, SEARCH_KEYS, STACK_LAND, T} from './timing';

const PAPER = ACCENT.captions;
const FS = 92; // JetBrains Mono: advance 0.6 em → exact letter slots
const ADV = FS * 0.6;
const CY = 540;
const N = LINE.length;

// ---------------------------------------------------------------- the big caption line ----
const typedAt = (f: number) => KEYS.reduce((n, k) => n + clamp((f - k) / 3), 0);

const BigLine: React.FC<{f: number}> = ({f}) => {
  const n = typedAt(f);
  const left = 960 - (n * ADV) / 2;
  const fixedPop = pulse(f, T.fixed, 30);
  const blink = f > KEYS[N - 1] + 6 && f < T.fix0 - 24 ? (Math.floor((f - KEYS[N - 1]) / 18) % 2 === 0 ? 1 : 0.15) : 1;
  const caretOn = f < T.fix0 - 24;
  // word being edited (selection)
  const word = Math.floor((f - (T.fix0 - 14)) / T.fixStep);
  const wordMoves = MOVES.filter((_, k) => Math.floor(k / 2) === word);
  const selOn = f >= T.fix0 - 14 && f < T.fixed - 2 && wordMoves.length > 0;
  const selA = selOn ? Math.min(...wordMoves.map((m) => Math.min(m.from, m.to))) : 0;
  const selB = selOn ? Math.max(...wordMoves.map((m) => Math.max(m.from, m.to))) : 0;
  const selU = selOn ? ease.cubicOut(prog(f, T.fix0 - 14 + word * T.fixStep, T.fix0 - 8 + word * T.fixStep)) : 0;
  return (
    <>
      <Glow x={960} y={CY} w={1700} h={420} color={PAPER} opacity={0.07 + 0.25 * fixedPop} />
      {selOn ? (
        <div
          style={{
            position: 'absolute',
            left: left + selA * ADV - 4,
            top: CY - 56,
            width: ((selB - selA + 1) * ADV + 8) * selU,
            height: 112,
            borderRadius: 6,
            background: rgba(C.amber, 0.22),
            border: `2px solid ${rgba(C.amber, 0.8)}`,
          }}
        />
      ) : null}
      {[...LINE].map((ch, i) => {
        const shown = f >= KEYS[i];
        if (!shown) return null;
        const appear = clamp((f - KEYS[i]) / 4);
        const mv = MOVES.find((m) => m.from === i);
        let slot = i;
        let dy = 0;
        let land = 0;
        if (mv) {
          const u = ease.inOut(prog(f, mv.land - 8, mv.land));
          slot = mix(mv.from, mv.to, u);
          dy = (mv.to > mv.from ? -1 : 1) * Math.sin(Math.PI * u) * 78;
          land = pulse(f, mv.land, 16);
        }
        const done = f >= T.fixed;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: left + slot * ADV,
              top: CY - FS * 0.62,
              width: ADV,
              textAlign: 'center',
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: FS,
              lineHeight: 1,
              color: land > 0.05 ? C.amber : PAPER,
              opacity: appear,
              transform: `translateY(${dy + (1 - appear) * 10}px) scale(${1 + 0.18 * land + 0.04 * fixedPop * (done ? 1 : 0)})`,
              textShadow: land > 0.05 ? `0 0 ${24 * land}px ${rgba(C.amber, 0.8)}` : `0 0 30px ${rgba(PAPER, 0.15 + 0.4 * fixedPop)}`,
            }}
          >
            {ch}
          </div>
        );
      })}
      {caretOn ? (
        <div style={{position: 'absolute', left: left + n * ADV - 3, top: CY - 42, width: 6, height: 84, borderRadius: 3, background: C.amber, opacity: blink, boxShadow: `0 0 18px ${rgba(C.amber, 0.6)}`}} />
      ) : null}
      {/* the line lands right: an amber underline sweeps under it */}
      {f >= T.fixed ? (
        <div style={{position: 'absolute', left: left, top: CY + 58, width: N * ADV * ease.expoOut(prog(f, T.fixed, T.fixed + 14)), height: 5, borderRadius: 3, background: C.amber, opacity: 1 - prog(f, T.fly, T.fly + 14)}} />
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- workspace ----
type Cue = {a: number; b: number; text: string};
const BASE: Cue[] = [
  {a: 1.0, b: 3.4, text: 'Four cameras. One take.'},
  {a: 3.5, b: 6.0, text: FIXED},
  {a: 6.2, b: 8.8, text: 'Keep the original sound.'},
  {a: 9.0, b: 11.5, text: 'Let the story breathe.'},
];
const SPLIT_T = 5.2;
const isSplit = (f: number) => f >= T.split && !(f >= T.undo && f < T.redo);
const shiftOf = (f: number) => 0.5 * ease.inOut(prog(f, T.shift, T.shift + 12));
const cuesAt = (f: number): Cue[] => {
  const sh = shiftOf(f);
  const c = BASE.map((q) => ({a: q.a + sh, b: q.b + sh, text: q.text}));
  if (!isSplit(f)) return c;
  return [c[0], {a: c[1].a, b: SPLIT_T, text: 'Every angle.'}, {a: SPLIT_T, b: c[1].b, text: 'Every word.'}, c[2], c[3]];
};
const tc = (s: number) => `00:00:${s.toFixed(3).padStart(6, '0')}`;
const playT = (f: number) => 3.2 + (Math.min(f, T.exit) - 300) * (2 / 150);

// timeline geometry
const TL = {x: 96, y: 664, w: 1752, h: 280};
const X0 = 250;
const PXS = 128; // px per second
const tx = (s: number) => X0 + s * PXS;
const CUE_Y = TL.y + 66;
const CUE_H = 54;
const MK_Y = TL.y + 152;

// cue list geometry
const LIST = {x: 884, y: 206, w: 480, h: 434};
const CARD_H = 80;
const CARD_Y0 = LIST.y + 76;
const cardY = (k: number) => CARD_Y0 + k * (CARD_H + 8);

const Toolbar: React.FC<{f: number; u: number}> = ({f, u}) => {
  const imp = pulse(f, T.imported, 24);
  const chipU = sp(f, T.imported, {damping: 11, stiffness: 240, mass: 0.6});
  return (
    <div style={{position: 'absolute', left: 96, top: 136, width: 1752, height: 52, display: 'flex', alignItems: 'center', gap: 16, opacity: u, transform: `translateY(${(1 - u) * -30}px)`}}>
      <div style={{fontFamily: FONT, fontWeight: 650, fontSize: 32, color: C.text, marginRight: 14}}>Captions &amp; markers</div>
      <Btn f={f} label="Import SRT / VTT" at={[T.imported]} />
      {['SRT', 'WebVTT'].map((x, i) => (
        <Chip key={x} color={f >= T.imported ? C.success : C.muted} fill={0.08 + 0.2 * imp} style={{opacity: clamp(chipU * 2), transform: `scale(${0.7 + 0.3 * chipU})`, marginLeft: i ? -6 : 0}}>
          {f >= T.imported ? <Check size={14} color={C.success} width={10} /> : null}
          {x}
        </Chip>
      ))}
      <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 16, color: C.muted, marginRight: 10}}>
        {cuesAt(f).length} cues · {(f >= T.marker2 ? 2 : f >= T.marker1 ? 1 : 0)} markers
      </div>
      <Btn f={f} label="Undo" at={[T.undo]} w={96} />
      <Btn f={f} label="Redo" at={[T.redo]} w={96} />
    </div>
  );
};

const Preview: React.FC<{f: number; u: number}> = ({f, u}) => (
  <div style={{...panel({left: 96, top: 206, width: 764, height: 434}), overflow: 'hidden', opacity: u, transform: `translateX(${(1 - u) * -60}px)`}}>
    <div style={{position: 'absolute', left: 16, top: 14, right: 16, display: 'flex', alignItems: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 17, color: C.text}}>
      CAM A · Take 03
      <span style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 15, color: C.amber}}>{tc(playT(f))}</span>
    </div>
    <div style={{position: 'absolute', left: 16, top: 50, width: 732, height: 368, borderRadius: 4, overflow: 'hidden', background: 'linear-gradient(180deg, #1d1c19 0%, #262420 60%, #121210 61%, #0c0c0b 100%)'}}>
      <Glow x={520} y={120} w={700} h={420} color={PAPER} opacity={0.12} />
      <svg width={732} height={368} style={{position: 'absolute', inset: 0}}>
        <circle cx={250} cy={150} r={40} fill="#0a0a09" />
        <path d="M170 368 L180 236 Q186 200 220 196 L280 196 Q314 200 320 236 L330 368 Z" fill="#0a0a09" />
        <circle cx={500} cy={168} r={34} fill="#0a0a09" />
        <path d="M434 368 L444 256 Q450 218 480 216 L520 216 Q550 218 556 256 L566 368 Z" fill="#0a0a09" />
        <path d="M80 300 H660 V312 H80 Z" fill="#0d0d0c" />
      </svg>
    </div>
  </div>
);

const CueList: React.FC<{f: number; u: number}> = ({f, u}) => {
  const typed = SEARCH_KEYS.filter((k) => f >= k).length;
  const found = f >= T.found;
  const fp = pulse(f, T.found, 24);
  const cues = cuesAt(f);
  const splitIn = sp(f, isSplit(f) ? (f >= T.redo ? T.redo : T.split) : 1e9, {damping: 16, stiffness: 200, mass: 0.7});
  const sel = isSplit(f) ? 2 : 1;
  return (
    <div style={{...panel({left: LIST.x, top: LIST.y, width: LIST.w, height: LIST.h}), overflow: 'hidden', opacity: u, transform: `translateY(${(1 - u) * 50}px)`}}>
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          right: 16,
          height: 46,
          borderRadius: RADIUS.control,
          border: `1px solid ${f >= SEARCH_KEYS[0] - 6 && f < T.shift ? rgba(C.amber, 0.7) : C.line}`,
          background: '#141816',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          fontFamily: FONT,
          fontSize: 19,
          color: typed ? C.text : rgba(C.muted, 0.7),
        }}
      >
        {typed ? SEARCH.slice(0, typed) : 'Search caption text'}
        {f >= SEARCH_KEYS[0] - 6 && f < T.found + 20 ? <span style={{width: 2, height: 24, marginLeft: 2, background: C.amber}} /> : null}
      </div>
      {cues.map((q, k) => {
        const isSel = k === sel || (isSplit(f) && k === 1);
        const y = cardY(k) - LIST.y;
        const fresh = isSplit(f) && k === 2 ? splitIn : 1;
        const hit = found && q.text.includes('word.');
        const parts = hit ? q.text.split('word') : [q.text];
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              top: y,
              height: CARD_H,
              borderRadius: RADIUS.control,
              background: isSel ? rgba(C.amber, 0.07) : '#151917',
              border: `1px solid ${isSel ? rgba(C.amber, 0.6) : C.line}`,
              borderLeft: `4px solid ${isSel ? C.amber : C.line}`,
              opacity: fresh,
              transform: `translateX(${(1 - fresh) * 40}px)`,
              boxSizing: 'border-box',
              padding: '10px 16px',
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontWeight: 500, fontSize: 14, color: C.muted}}>
              {tc(q.a)}
              <Arrow size={14} color={C.muted} width={6} />
              {tc(q.b)}
            </div>
            <div style={{marginTop: 8, fontFamily: FONT, fontWeight: 600, fontSize: 21, color: PAPER, whiteSpace: 'nowrap'}}>
              {hit ? (
                <>
                  {parts[0]}
                  <span style={{background: rgba(C.amber, 0.35 + 0.4 * fp), borderRadius: 3, padding: '0 3px', color: '#fff8e8', boxShadow: `0 0 ${20 * fp}px ${rgba(C.amber, 0.8)}`}}>word</span>
                  {parts[1]}
                </>
              ) : (
                q.text
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Inspector: React.FC<{f: number; u: number}> = ({f, u}) => {
  const cues = cuesAt(f);
  const q = cues[1];
  const field = (label: string, value: string, x: number, w: number, flash: number) => (
    <div style={{position: 'absolute', left: x, top: 62, width: w}}>
      <div style={{fontFamily: FONT, fontSize: 15, color: C.muted}}>{label}</div>
      <div
        style={{
          marginTop: 6,
          height: 42,
          borderRadius: RADIUS.control,
          border: `1px solid ${flash > 0.02 ? rgba(C.amber, 0.5 + 0.5 * flash) : C.line}`,
          background: flash > 0.02 ? rgba(C.amber, 0.1 * flash) : '#141816',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 18,
          color: C.text,
        }}
      >
        {value}
      </div>
    </div>
  );
  const fl = Math.max(pulse(f, T.shift + 12, 20), pulse(f, T.split, 20), pulse(f, T.undo, 20), pulse(f, T.redo, 20));
  return (
    <div style={{...panel({left: 1388, top: 206, width: 460, height: 434}), opacity: u, transform: `translateX(${(1 - u) * 60}px)`}}>
      <div style={{position: 'absolute', left: 20, top: 18, fontFamily: FONT, fontWeight: 650, fontSize: 21, color: C.text}}>Selected cue</div>
      {field('Start (seconds)', q.a.toFixed(3), 20, 200, fl)}
      {field('End (seconds)', q.b.toFixed(3), 240, 200, fl)}
      <div style={{position: 'absolute', left: 20, top: 150, fontFamily: FONT, fontSize: 15, color: C.muted}}>Caption text</div>
      <div style={{position: 'absolute', left: 20, top: 174, width: 420, height: 56, borderRadius: RADIUS.control, border: `1px solid ${C.line}`, background: '#141816', padding: '0 12px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', fontFamily: FONT, fontSize: 19, color: C.text}}>
        {q.text}
      </div>
      <div style={{position: 'absolute', left: 20, top: 244, width: 420}}>
        <Btn f={f} label="Apply edit" primary w={420} h={44} />
      </div>
      <div style={{position: 'absolute', left: 20, top: 300, display: 'flex', gap: 10}}>
        <Btn f={f} label="Shift cues  +0.5 s" w={205} at={[T.shift]} fs={17} />
        <Btn f={f} label="Split at playhead" w={205} at={[T.split, T.redo]} fs={17} />
      </div>
      <div style={{position: 'absolute', left: 20, top: 356, width: 420}}>
        <Btn f={f} label="Add marker at playhead" w={420} at={[T.marker1, T.marker2]} fs={17} />
      </div>
    </div>
  );
};

const MARKERS = [
  {at: T.marker1, s: 7.0, label: 'Laugh — keep', note: 'note: hold the reaction'},
  {at: T.marker2, s: 10.2, label: 'Cut here?', note: 'note: check CAM B'},
];

const Timeline: React.FC<{f: number; u: number}> = ({f, u}) => {
  const cues = cuesAt(f);
  const ph = tx(playT(f));
  const splitFlash = Math.max(pulse(f, T.split, 24), pulse(f, T.redo, 20));
  const exp = sp(f, T.exported, {damping: 12, stiffness: 220, mass: 0.6});
  return (
    <div style={{...panel({left: TL.x, top: TL.y, width: TL.w, height: TL.h}), overflow: 'hidden', opacity: u, transform: `translateY(${(1 - u) * 50}px)`}}>
      <div style={{position: 'absolute', left: 18, top: 14, fontFamily: FONT, fontWeight: 650, fontSize: 18, color: C.text}}>Timeline</div>
      <div style={{position: 'absolute', right: 16, top: 10, display: 'flex', gap: 10, alignItems: 'center'}}>
        {f >= T.exported ? (
          <div style={{display: 'flex', gap: 8, opacity: clamp(exp * 2), transform: `scale(${0.8 + 0.2 * exp})`}}>
            {['captions.srt', 'captions.vtt'].map((x) => (
              <Chip key={x} color={C.success}>
                <Check size={14} color={C.success} width={10} />
                {x}
              </Chip>
            ))}
          </div>
        ) : null}
        <Btn f={f} label="Export SRT" at={[T.exported]} h={38} fs={16} />
        <Btn f={f} label="Export WebVTT" at={[T.exported]} h={38} fs={16} />
      </div>
      {/* ruler */}
      {Array.from({length: 13}, (_, k) => (
        <React.Fragment key={k}>
          <div style={{position: 'absolute', left: tx(k) - TL.x, top: 52, width: 1, height: 8, background: C.line}} />
          <div style={{position: 'absolute', left: tx(k) - TL.x + 5, top: 46, fontFamily: MONO, fontSize: 12, color: C.muted}}>{`0:${String(k).padStart(2, '0')}`}</div>
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', left: 18, top: CUE_Y - TL.y + 16, fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.muted}}>Captions</div>
      <div style={{position: 'absolute', left: 18, top: MK_Y - TL.y + 16, fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.muted}}>Markers</div>
      {cues.map((q, k) => {
        const sel = k === 1 || (isSplit(f) && k === 2);
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: tx(q.a) - TL.x + 1,
              top: CUE_Y - TL.y,
              width: (q.b - q.a) * PXS - 2,
              height: CUE_H,
              borderRadius: 5,
              background: sel ? rgba(C.amber, 0.16) : rgba(PAPER, 0.12),
              border: `1px solid ${sel ? rgba(C.amber, 0.7) : rgba(PAPER, 0.45)}`,
              boxSizing: 'border-box',
              padding: '6px 10px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 15,
              color: PAPER,
            }}
          >
            {q.text}
          </div>
        );
      })}
      {splitFlash > 0.02 ? <div style={{position: 'absolute', left: tx(SPLIT_T) - TL.x - 2, top: CUE_Y - TL.y - 8, width: 4, height: CUE_H + 16, background: '#fff', opacity: splitFlash, boxShadow: `0 0 20px ${rgba(C.amber, splitFlash)}`}} /> : null}
      {MARKERS.map((m) => {
        if (f < m.at - 10) return null;
        const drop = ease.cubicIn(prog(f, m.at - 10, m.at));
        const bump = pulse(f, m.at, 16);
        const x = tx(m.s) - TL.x;
        return (
          <div key={m.label} style={{position: 'absolute', left: x, top: MK_Y - TL.y, transform: `translateY(${(drop - 1) * 90}px)`, opacity: clamp(drop * 3)}}>
            <div style={{position: 'absolute', left: -1, top: 0, width: 3, height: 64, background: C.amber}} />
            <div style={{position: 'absolute', left: -8, top: -6, width: 16, height: 16, background: C.amber, transform: `rotate(45deg) scale(${1 + 0.5 * bump})`}} />
            <div style={{position: 'absolute', left: 12, top: 4, padding: '5px 10px', borderRadius: 5, background: rgba(C.amber, 0.14 + 0.2 * bump), border: `1px solid ${rgba(C.amber, 0.7)}`, whiteSpace: 'nowrap'}}>
              <div style={{fontFamily: FONT, fontWeight: 650, fontSize: 16, color: C.text}}>{m.label}</div>
              <div style={{fontFamily: FONT, fontSize: 13, color: C.muted, marginTop: 1}}>{m.note}</div>
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: ph - TL.x - 1, top: 44, width: 3, height: TL.h - 52, background: C.amber, boxShadow: `0 0 10px ${rgba(C.amber, 0.5)}`}} />
      <div style={{position: 'absolute', left: ph - TL.x - 7, top: 38, width: 14, height: 14, background: C.amber, transform: 'rotate(45deg)'}} />
    </div>
  );
};

// ---------------------------------------------------------------- exit: the blocks stack into three bars ----
const BAR_X = [740, 910, 1080];
const BAR_W = 100;
const BAR_TOP = 236;
const BAR_BOT = 590;
const BLOCK_H = 84;

const sources = (): {x: number; y: number; w: number; h: number}[] => {
  const f = T.exit;
  const cues = cuesAt(f);
  const tl = cues.map((q) => ({x: tx(q.a) + 1, y: CUE_Y, w: (q.b - q.a) * PXS - 2, h: CUE_H}));
  const cards = cues.map((_, k) => ({x: LIST.x + 16, y: cardY(k), w: LIST.w - 32, h: CARD_H}));
  const mk = MARKERS.map((m) => ({x: tx(m.s) + 12, y: MK_Y + 4, w: 170, h: 48}));
  // interleave so every column gets a mix
  return [tl[0], cards[0], tl[1], cards[1], mk[0], tl[2], cards[2], tl[3], cards[3], mk[1], tl[4], cards[4]];
};
const SRC = sources();

const Stack: React.FC<{f: number}> = ({f}) => {
  if (f < T.exit) return null;
  const merge = ease.inOut(prog(f, STACK_LAND[11] + 4, STACK_LAND[11] + 16));
  return (
    <>
      {SRC.map((r, j) => {
        const land = STACK_LAND[j];
        const u = ease.inOut(prog(f, land - 16, land));
        const col = j % 3;
        const row = Math.floor(j / 3);
        const dx = BAR_X[col];
        const dy = BAR_BOT - (row + 1) * BLOCK_H - row * 6;
        const x = mix(r.x, dx, u);
        const y = mix(r.y, dy, u) - Math.sin(Math.PI * u) * 60;
        const w = mix(r.w, BAR_W, u);
        const h = mix(r.h, BLOCK_H, u);
        const bump = pulse(f, land, 12);
        return (
          <div
            key={j}
            style={{
              position: 'absolute',
              left: x,
              top: y + 4 * bump,
              width: w,
              height: h,
              borderRadius: mix(5, 3, u),
              background: rgba(PAPER, mix(0.16, 0.92, u)),
              border: `1px solid ${rgba(PAPER, mix(0.5, 1, u))}`,
              boxShadow: bump > 0.02 ? `0 0 ${30 * bump}px ${rgba(PAPER, 0.6 * bump)}` : 'none',
              opacity: 1 - merge,
              transform: `rotate(${Math.sin(Math.PI * u) * (j % 2 ? 6 : -6)}deg)`,
            }}
          />
        );
      })}
      {merge > 0
        ? BAR_X.map((x) => (
            <div key={x} style={{position: 'absolute', left: x, top: BAR_TOP, width: BAR_W, height: BAR_BOT - BAR_TOP, borderRadius: 3, background: PAPER, opacity: merge, boxShadow: `0 0 40px ${rgba(PAPER, 0.25)}`}} />
          ))
        : null}
    </>
  );
};

// ---------------------------------------------------------------- world ----
export const World: React.FC = () => {
  const f = useWorldFrame();
  const fly = ease.inOut(prog(f, T.fly, T.fly + 40));
  const ui = (d: number) => sp(f, T.fly + 14 + d, {damping: 17, stiffness: 140, mass: 0.9});
  const out = ease.inOut(prog(f, T.exit, T.exit + 18));
  // the big line flies into the preview as its burned-in caption
  const split = isSplit(f) && f >= T.fly + 40;
  const lineScale = mix(1, 0.4, fly);
  const lineX = mix(0, 478 - 960, fly) + (split ? -((13 * ADV) / 2) * lineScale * ease.inOut(prog(f, f >= T.redo ? T.redo : T.split, (f >= T.redo ? T.redo : T.split) + 8)) : 0);
  const lineY = mix(0, 598 - CY, fly);
  const hideFirst = split ? prog(f, f >= T.redo ? T.redo : T.split, (f >= T.redo ? T.redo : T.split) + 6) : 0;
  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      {/* paper world: faint ruled lines, warm light */}
      <div style={{position: 'absolute', inset: 0, background: `repeating-linear-gradient(180deg, transparent 0 63px, ${rgba(PAPER, 0.035)} 63px 64px)`, opacity: 1 - 0.6 * fly}} />
      <Glow x={960} y={560} w={2000} h={1100} color={PAPER} opacity={0.06} />
      <Title f={f} index="04 / 11" name="CAPTIONS & MARKERS" size={96} color={PAPER} out={104} promise={<>Make every word <span style={{color: PAPER, fontWeight: 650}}>land.</span></>} />
      <Toolbar f={f} u={ui(0) * (1 - out)} />
      <Preview f={f} u={ui(4) * (1 - out)} />
      <CueList f={f} u={ui(8) * (1 - out)} />
      <Inspector f={f} u={ui(12) * (1 - out)} />
      <Timeline f={f} u={ui(16) * (1 - out)} />
      {/* the line: typed, read, fixed, then burned into the preview */}
      <div style={{position: 'absolute', inset: 0, transformOrigin: `960px ${CY}px`, transform: `translate(${lineX}px, ${lineY}px) scale(${lineScale})`, opacity: 1 - out}}>
        <div style={{position: 'absolute', inset: 0, clipPath: hideFirst > 0 ? `inset(0 0 0 ${960 - (N * ADV) / 2 + 13 * ADV * hideFirst}px)` : undefined}}>
          <BigLine f={f} />
        </div>
      </div>
      {/* reading note, then the cue being edited */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', fontFamily: FONT, fontSize: 28, color: C.muted, opacity: prog(f, 100, 118) * (1 - prog(f, 150, 162))}}>
        First and last letters hold. <span style={{color: PAPER}}>You still read it.</span>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center', opacity: prog(f, 160, 174) * (1 - prog(f, T.fly - 4, T.fly + 6))}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', borderRadius: RADIUS.control, background: C.panel, border: `1px solid ${C.line}`, fontFamily: MONO, fontSize: 19, color: C.muted}}>
          <MonoLabel color={C.amber}>CUE 2</MonoLabel>
          {tc(3.5)}
          <Arrow size={18} color={C.muted} width={6} />
          {tc(6.0)}
          <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 19, color: f >= T.fixed ? C.success : C.text, display: 'flex', alignItems: 'center', gap: 8}}>
            {f >= T.fixed ? <Check size={18} color={C.success} width={10} /> : null}
            {f >= T.fixed ? 'Cue text edited' : 'Editing cue text'}
          </span>
        </div>
      </div>
      <Stack f={f} />
    </AbsoluteFill>
  );
};
