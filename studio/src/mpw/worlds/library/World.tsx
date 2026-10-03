// World 8 · Library (aqua). Picture Lab's film strip breaks into a thumbnail grid → keyword search → PC Media
// Catalog (visual + spoken-word match, jump to source) → Local Transcription → Media QC (change blindness: flicker
// paradigm, then QC flags the frozen region) → Proxy Preparation (zoetrope) → Timecode Assembly (LTC → aligned
// tracks) → the aligned clips are the hand-off to the Edit Room.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, MONO} from '../../brand';
import {useWorldFrame} from '../../frame';
import {AQUA as A, alpha, Arrow, Check, Chip, ClipBody, EXPO, EXPO_IN, handoffColor, HandoffTimeline, IN_OUT, lerp, LinkIcon, mix, Mono, Panel, pop, pulse, Search, tc, TL, TL_CLIPS, ToolLabel, WorldTitle} from './kit';
import {FREEZE_BOX, type Kind, NightStreet, Shot, Zoetrope} from './shots';
import {T} from './timing';

type Rect = {x: number; y: number; w: number; h: number};
const mixRect = (a: Rect, b: Rect, t: number): Rect => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t});

// ---------- the footage ----------
const THUMBS: {kind: Kind; seed: number; cam: 'A' | 'B' | 'C'; name: string; dur: string}[] = [
  {kind: 'street', seed: 1, cam: 'A', name: 'A001_C003', dur: '00:42'},
  {kind: 'coast', seed: 2, cam: 'B', name: 'B002_C011', dur: '01:06'},
  {kind: 'studio', seed: 3, cam: 'C', name: 'C004_C002', dur: '03:18'},
  {kind: 'hills', seed: 4, cam: 'B', name: 'B002_C014', dur: '00:27'},
  {kind: 'city', seed: 5, cam: 'A', name: 'A001_C007', dur: '00:55'},
  {kind: 'room', seed: 6, cam: 'B', name: 'B003_C001', dur: '02:10'},
  {kind: 'forest', seed: 7, cam: 'C', name: 'C004_C009', dur: '00:31'},
  {kind: 'desert', seed: 8, cam: 'A', name: 'A002_C001', dur: '01:12'},
  {kind: 'stage', seed: 9, cam: 'B', name: 'B003_C004', dur: '00:48'},
  {kind: 'coast', seed: 10, cam: 'C', name: 'C005_C003', dur: '00:39'},
  {kind: 'street', seed: 11, cam: 'B', name: 'B003_C008', dur: '01:27'},
  {kind: 'hills', seed: 12, cam: 'A', name: 'A002_C006', dur: '00:22'},
  {kind: 'studio', seed: 13, cam: 'C', name: 'C005_C010', dur: '04:02'},
  {kind: 'city', seed: 14, cam: 'B', name: 'B004_C002', dur: '00:58'},
  {kind: 'room', seed: 15, cam: 'A', name: 'A002_C011', dur: '01:41'},
  {kind: 'desert', seed: 16, cam: 'C', name: 'C006_C001', dur: '00:35'},
  {kind: 'forest', seed: 17, cam: 'A', name: 'A003_C002', dur: '00:50'},
  {kind: 'stage', seed: 18, cam: 'C', name: 'C006_C004', dur: '02:33'},
];
const cellTitle = (i: number): Rect => ({x: 862 + (i % 4) * 238, y: 266 + Math.floor(i / 4) * 141, w: 222, h: 125});
const cellLib = (i: number): Rect => ({x: 120 + (i % 6) * 283.2, y: 300 + Math.floor(i / 6) * 168.5, w: 264, h: 148.5});
const stripRect = (i: number, f: number): Rect => ({x: 40 + i * 262 - (f + 12) * 7, y: 475, w: 232, h: 130});

const Thumb: React.FC<{i: number; r: Rect; dim: number; hi: number; violet: number; style?: React.CSSProperties}> = ({i, r, dim, hi, violet, style}) => {
  const t = THUMBS[i];
  return (
    <div
      style={{
        position: 'absolute',
        left: r.x,
        top: r.y,
        width: r.w,
        height: r.h,
        borderRadius: 6,
        overflow: 'hidden',
        border: `1.5px solid ${mix(C.line, A, hi)}`,
        boxShadow: hi > 0.01 ? `0 0 ${28 * hi}px ${alpha(A, 0.35 * hi)}` : '0 12px 30px rgba(0,0,0,0.45)',
        ...style,
      }}
    >
      <Shot kind={t.kind} seed={t.seed} uid={`lt${i}`} w={r.w} h={r.h} />
      {violet > 0.01 ? <div style={{position: 'absolute', inset: 0, background: '#c79bf2', mixBlendMode: 'color', opacity: violet * 0.7}} /> : null}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 44, background: 'linear-gradient(transparent, rgba(8,10,10,0.85))'}} />
      <div style={{position: 'absolute', left: 9, bottom: 7, display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 13, color: C.text, opacity: 1 - violet}}>
        <span style={{padding: '1px 6px', borderRadius: 4, background: hi > 0.5 ? A : 'rgba(255,255,255,0.12)', color: hi > 0.5 ? C.canvas : C.text, fontWeight: 700}}>CAM {t.cam}</span>
        <span>{t.name}</span>
      </div>
      <div style={{position: 'absolute', right: 8, top: 6, fontFamily: MONO, fontSize: 12, color: C.text, opacity: 0.75 * (1 - violet)}}>{t.dur}</div>
      {dim > 0.01 ? <div style={{position: 'absolute', inset: 0, background: C.canvas, opacity: 0.8 * dim}} /> : null}
    </div>
  );
};

const FilmBand: React.FC<{f: number}> = ({f}) => {
  const o = 1 - lerp(f, 2, 20);
  if (o <= 0) return null;
  const off = -(f + 12) * 7;
  return (
    <div style={{position: 'absolute', left: 0, top: 540 - 96, width: 1920, height: 192, background: '#050606', opacity: o, overflow: 'hidden'}}>
      {[10, 168].map((y) => (
        <div key={y} style={{position: 'absolute', left: 0, top: y, width: 1920, height: 14}}>
          {Array.from({length: 70}, (_, k) => (
            <div key={k} style={{position: 'absolute', left: ((k * 34 + off) % 2380) + 2380 * (k * 34 + off < 0 ? 1 : 0) - 200, top: 0, width: 18, height: 14, borderRadius: 3, background: '#2a2f2d'}} />
          ))}
        </div>
      ))}
    </div>
  );
};

const Grid: React.FC<{f: number}> = ({f}) => {
  if (f > 246) return null;
  const filt = lerp(f, T.libFilter, T.libFilter + 12) * (1 - lerp(f, T.catalog, T.catalog + 10));
  const street = lerp(f, T.catKeys[5], T.catKeys[5] + 6);
  return (
    <>
      {THUMBS.map((t, i) => {
        let r: Rect;
        let s = 1;
        let violet = 0;
        if (i < 8) {
          const p = lerp(f, i * 2.2, 22 + i * 2.2, 0, 1, IN_OUT);
          r = mixRect(stripRect(i, f), cellTitle(i), p);
          violet = 1 - p;
        } else if (i < 16) {
          r = cellTitle(i);
          s = pop(f, 10 + (i - 8) * 2.4, 13, 170, 0.7);
        } else {
          r = cellLib(i);
          s = pop(f, T.reflow + 18 + (i - 16) * 3, 13, 170, 0.7);
        }
        if (i < 16) {
          const q = lerp(f, T.reflow + i * 1.1, T.reflow + 24 + i * 1.1, 0, 1, IN_OUT);
          r = mixRect(r, cellLib(i), q);
        }
        const e = lerp(f, 228 + i * 0.6, 242 + i * 0.6, 0, 1, EXPO_IN);
        if (s <= 0.001 || e >= 1) return null;
        const match = t.cam === 'B';
        const scan = f >= T.libFilter - 6 && f < T.libFilter + 16 ? pulse(f, T.libFilter + (i % 6) * 1.2, 6) : 0;
        return (
          <Thumb
            key={i}
            i={i}
            r={r}
            dim={Math.max(match ? 0 : filt, t.kind === 'street' ? 0 : street)}
            hi={Math.max(match ? Math.max(filt, scan) : scan * 0.5, t.kind === 'street' ? street : 0)}
            violet={violet}
            style={{scale: `${s}`, opacity: Math.min(1, s * 1.4) * (1 - e), translate: `0px ${e * 40}px`}}
          />
        );
      })}
    </>
  );
};

// ---------- search ----------
const SearchBar: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.reflow + 4, T.reflow + 20);
  const o = 1 - lerp(f, 248, 258);
  if (a <= 0 || o <= 0) return null;
  const cat = f >= T.catalog - 2;
  const keys = cat ? T.catKeys : T.libKeys;
  const word = cat ? 'street' : 'CAM B';
  const n = keys.filter((k) => f >= k).length;
  const last = n ? keys[n - 1] : -99;
  const kp = pulse(f, last, 7);
  const wipe = cat ? 1 : 1 - lerp(f, T.catalog - 8, T.catalog - 2);
  const caret = Math.floor(f / 16) % 2 === 0 ? 1 : 0.15;
  return (
    <Panel x={120} y={200} w={1680} h={72} glow={A} style={{opacity: a * o, translate: `0px ${(1 - a) * -18}px`, borderColor: mix(C.line, A, 0.35 + 0.65 * kp)}}>
      <div style={{position: 'absolute', left: 24, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 18}}>
        <Search size={28} color={n ? A : C.muted} />
        <div style={{position: 'relative', fontFamily: FONT, fontSize: 30, fontWeight: 500, color: C.text, display: 'flex', alignItems: 'center', opacity: wipe}}>
          {n === 0 ? <span style={{color: C.muted, opacity: 0.7}}>{cat ? 'Spoken words or what is in the shot…' : 'Filename, camera or caption words…'}</span> : null}
          {[...word.slice(0, n)].map((ch, k) => {
            const s = pop(f, keys[k], 12, 260, 0.5);
            return (
              <span key={k} style={{display: 'inline-block', whiteSpace: 'pre', scale: `${0.6 + 0.4 * s}`, color: k === n - 1 ? mix(C.text, A, kp) : C.text}}>
                {ch}
              </span>
            );
          })}
          {n > 0 || f % 32 < 16 ? <span style={{width: 2.5, height: 32, background: A, marginLeft: 4, opacity: caret}} /> : null}
        </div>
      </div>
      <div style={{position: 'absolute', right: 18, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 10}}>
        {cat ? (
          <>
            <Mono size={14} style={{letterSpacing: '0.16em', marginRight: 6}}>
              SEARCHABLE CONTENT
            </Mono>
            <Chip>Metadata</Chip>
            <Chip tone="accent" accent={A}>
              <Check size={18} color={A} /> Transcript
            </Chip>
            <Chip tone="accent" accent={A}>
              <Check size={18} color={A} /> Visual
            </Chip>
          </>
        ) : (
          <>
            <Chip>All sources ▾</Chip>
            <Chip>All media ▾</Chip>
          </>
        )}
      </div>
    </Panel>
  );
};

const LibCount: React.FC<{f: number}> = ({f}) => {
  const o = lerp(f, T.reflow + 20, T.reflow + 34) * (1 - lerp(f, 186, 196));
  if (o <= 0) return null;
  const filt = f >= T.libFilter;
  const p = pulse(f, T.libFilter, 10);
  return (
    <div style={{position: 'absolute', left: 120, top: 806, width: 1680, display: 'flex', justifyContent: 'space-between', opacity: o}}>
      <Mono size={20} color={filt ? A : C.muted} style={{scale: `${1 + 0.12 * p}`, transformOrigin: 'left'}}>
        {filt ? '6 / 18 clips · camera B' : '18 / 18 clips'}
      </Mono>
      <Mono size={18}>Project keyword search · filename · camera · metadata · imported words</Mono>
    </div>
  );
};

// ---------- PC Media Catalog + Local Transcription ----------
const VIEW: Rect = {x: 120, y: 200, w: 940, h: 529};
const CARD_V: Rect = {x: 120, y: 300, w: 760, h: 428};
const CARD_S0: Rect = {x: 920, y: 300, w: 880, h: 250};
const CARD_S1: Rect = {x: 1100, y: 200, w: 700, h: 250};

const Viewer: React.FC<{f: number}> = ({f}) => {
  const a = pop(f, T.catResults, 14, 160, 0.7);
  const o = 1 - lerp(f, 380, 392);
  if (a <= 0 || o <= 0) return null;
  const p = lerp(f, 252, T.land, 0, 1, IN_OUT);
  const r = mixRect(CARD_V, VIEW, p);
  const word = lerp(f, T.jump2, T.jump2 + 8);
  const flash = pulse(f, T.land, 7) + 0.7 * pulse(f, T.jump2, 7);
  const tcNow = f < T.jump - 6 ? tc(0, 3, 41, 12) : f < T.land ? tc(0, Math.floor(lerp(f, T.jump - 6, T.land, 0, 3)), Math.floor((f * 7) % 60), Math.floor((f * 13) % 25)) : f < T.jump2 ? tc(0, 3, 41, 12) : tc(0, 7, 18, 5);
  return (
    <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, opacity: Math.min(1, a * 1.5) * o, scale: `${0.94 + 0.06 * a}`}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 9, overflow: 'hidden', border: `1.5px solid ${mix(C.line, A, 0.6 + 0.4 * flash)}`, boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 ${60 * flash}px ${alpha(A, 0.4 * flash)}`}}>
        <Shot kind="street" seed={1} uid="lv-a" w={r.w} h={r.h} style={{position: 'absolute', inset: 0}} />
        {word > 0 ? (
          <div style={{position: 'absolute', inset: 0, opacity: word}}>
            <Shot kind="studio" seed={3} uid="lv-b" w={r.w} h={r.h} />
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 34, textAlign: 'center', fontFamily: FONT, fontWeight: 600, fontSize: 30, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.9)'}}>
              So we&apos;ll meet on the <span style={{color: A}}>street</span> after.
            </div>
          </div>
        ) : null}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 64, background: 'linear-gradient(rgba(8,10,10,0.85), transparent)'}} />
        <div style={{position: 'absolute', left: 16, top: 14, display: 'flex', gap: 10, alignItems: 'center'}}>
          {p < 0.5 ? (
            <>
              <Chip tone="accent" accent={A} mono>
                VISUAL MATCH
              </Chip>
              <Chip tone="raised">Sampled frame · CAM A · Take 03</Chip>
            </>
          ) : (
            <>
              <Chip tone="accent" accent={A} mono>
                SOURCE
              </Chip>
              <Chip tone="raised">{f < T.jump2 ? 'A001_C003.mov' : 'C004_C002.mov'}</Chip>
            </>
          )}
        </div>
        <div style={{position: 'absolute', right: 16, top: 16, fontFamily: MONO, fontWeight: 700, fontSize: 22, color: C.amber, background: 'rgba(8,10,10,0.7)', padding: '4px 10px', borderRadius: 6}}>{tcNow}</div>
        {p < 0.5 ? (
          <div style={{position: 'absolute', left: 16, bottom: 14, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 1 - p * 2}}>
            <Chip tone="line" style={{background: 'rgba(8,10,10,0.7)'}}>
              Review candidate
            </Chip>
            <Chip tone="amber">
              Jump to source <Arrow size={18} color={C.onAmber} />
            </Chip>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const SourceStrip: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.jump, T.jump + 12);
  const o = 1 - lerp(f, 380, 392);
  if (a <= 0 || o <= 0) return null;
  const W = VIEW.w;
  const ph = f < T.jump ? 0.05 : f < T.jump2 ? lerp(f, T.jump - 4, T.land, 0.05, 0.34, EXPO) : lerp(f, T.jump2 - 2, T.jump2 + 8, 0.34, 0.72, EXPO);
  const mk = (x: number, label: string, at: number) => {
    const k = pop(f, at, 12, 220, 0.6);
    return (
      <div style={{position: 'absolute', left: x * W - 9, top: 6, width: 18, height: 18, rotate: '45deg', background: A, scale: `${k}`, boxShadow: `0 0 ${20 * pulse(f, at, 10)}px ${A}`}}>
        </div>
    );
  };
  return (
    <div style={{position: 'absolute', left: VIEW.x, top: 762, width: W, height: 60, opacity: a * o}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 13, height: 6, borderRadius: 3, background: C.raised}} />
      <div style={{position: 'absolute', left: 0, width: ph * W, top: 13, height: 6, borderRadius: 3, background: alpha(C.amber, 0.45)}} />
      {mk(0.34, 'visual', T.jump)}
      {[[0.34, 'visual match', T.jump], [0.72, 'spoken word', T.jump + 4]].map(([x, l, at]) => (
        <div key={l as string} style={{position: 'absolute', left: (x as number) * W, top: 34, translate: '-50% 0px', fontFamily: MONO, fontSize: 15, color: A, whiteSpace: 'nowrap', opacity: lerp(f, at as number, (at as number) + 8)}}>
          {l}
        </div>
      ))}
      {mk(0.72, 'spoken word', T.jump + 4)}
      <div style={{position: 'absolute', left: ph * W - 1.5, top: -4, width: 3, height: 38, background: C.amber, boxShadow: `0 0 12px ${C.amber}`}} />
      <div style={{position: 'absolute', left: 0, top: -24, fontFamily: MONO, fontSize: 14, color: C.muted}}>Timed matches jump to the source</div>
    </div>
  );
};

const WAVE = Array.from({length: 64}, (_, i) => Math.max(0.12, Math.abs(Math.sin(i * 0.9) * 0.6 + Math.sin(i * 0.37 + 1) * 0.4)) * (i % 13 > 10 ? 0.25 : 1));
const SpokenCard: React.FC<{f: number}> = ({f}) => {
  const a = pop(f, T.catResults + 4, 14, 160, 0.7);
  const o = 1 - lerp(f, 380, 392);
  if (a <= 0 || o <= 0) return null;
  const r = mixRect(CARD_S0, CARD_S1, lerp(f, 252, T.land, 0, 1, IN_OUT));
  const hl = pulse(f, T.jump2, 12);
  return (
    <Panel x={r.x} y={r.y} w={r.w} h={r.h} glow={A} style={{opacity: Math.min(1, a * 1.5) * o, translate: `${(1 - a) * 40}px 0px`, borderColor: mix(C.line, A, 0.3 + hl)}}>
      <div style={{position: 'absolute', left: 22, top: 18, display: 'flex', gap: 10, alignItems: 'center'}}>
        <Chip tone="accent" accent={A} mono>
          SPOKEN WORD
        </Chip>
        <Mono size={15}>local word timestamps</Mono>
      </div>
      <div style={{position: 'absolute', right: 22, top: 22, fontFamily: MONO, fontWeight: 700, fontSize: 22, color: C.amber}}>{tc(0, 7, 18, 5)}</div>
      <div style={{position: 'absolute', left: 22, right: 22, top: 74, fontFamily: FONT, fontSize: 30, fontWeight: 500, color: C.muted, lineHeight: 1.3}}>
        “…so we&apos;ll meet on the{' '}
        <span style={{color: C.canvas, background: A, borderRadius: 5, padding: '0 6px', boxShadow: `0 0 ${24 * hl}px ${A}`}}>street</span> after.”
      </div>
      <svg width={r.w - 44} height={50} style={{position: 'absolute', left: 22, bottom: 16}}>
        {WAVE.map((v, i) => {
          const x = (i / WAVE.length) * (r.w - 44);
          return <rect key={i} x={x} y={25 - v * 20} width={(r.w - 44) / WAVE.length - 3} height={v * 40} rx={2} fill={i >= 40 && i < 44 ? A : C.line} />;
        })}
      </svg>
    </Panel>
  );
};

const SRT: [number, string, boolean][] = [
  [T.cues[0], '41', false],
  [T.cues[0], '00:07:16,200 --> 00:07:18,900', true],
  [T.cues[1], "So we'll meet on the street after.", false],
  [T.cues[2], '42', false],
  [T.cues[2], '00:07:19,040 --> 00:07:21,500', true],
  [T.cues[2] + 6, 'Keep the second take.', false],
];
const Transcription: React.FC<{f: number}> = ({f}) => {
  const a = pop(f, T.transcribe, 14, 160, 0.7);
  const o = 1 - lerp(f, 380, 392);
  if (a <= 0 || o <= 0) return null;
  const sweep = lerp(f, T.transcribe + 4, T.cues[1] + 10, 0, 1, (t) => t);
  return (
    <Panel x={1100} y={470} w={700} h={340} glow={A} style={{opacity: Math.min(1, a * 1.5) * o, translate: `0px ${(1 - a) * 40}px`}}>
      <div style={{position: 'absolute', left: 22, top: 18, right: 22, display: 'flex', alignItems: 'center', gap: 10}}>
        <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.text}}>Transcribed on this PC</span>
        <span style={{flex: 1}} />
        <Chip tone="accent" accent={A}>Local model</Chip>
        <Chip mono>SRT</Chip>
        <Chip mono>TXT</Chip>
      </div>
      <svg width={656} height={40} style={{position: 'absolute', left: 22, top: 70}}>
        {WAVE.map((v, i) => {
          const x = (i / WAVE.length) * 656;
          return <rect key={i} x={x} y={20 - v * 17} width={656 / WAVE.length - 3} height={v * 34} rx={2} fill={i / WAVE.length < sweep ? A : C.line} />;
        })}
        <rect x={sweep * 656} y={0} width={2.5} height={40} fill={C.amber} />
      </svg>
      <div style={{position: 'absolute', left: 22, top: 128, fontFamily: MONO, fontSize: 21, lineHeight: '31px'}}>
        {SRT.map(([at, line, isTc], k) => {
          const s = lerp(f, at, at + 10);
          const chars = Math.round(line.length * lerp(f, at, at + 12, 0, 1, (t) => t));
          return (
            <div key={k} style={{opacity: s, color: isTc ? C.amber : C.text, whiteSpace: 'pre', height: 31}}>
              {line.slice(0, chars)}
            </div>
          );
        })}
      </div>
    </Panel>
  );
};

// ---------- Media QC & Dailies: change blindness ----------
const QF: Rect = {x: 120, y: 230, w: 1120, h: 630}; // picture area (header bar above it)
type Ph = 'A' | 'B' | 'blank';
const qcPhase = (f: number): Ph => {
  if (f >= T.flag) {
    if (f < T.flag + 12) return 'B';
    return Math.floor((f - T.flag - 12) / 12) % 2 === 0 ? 'A' : 'B'; // no blank: now the change pops
  }
  const t = (((f - T.qc) % T.cycle) + T.cycle) % T.cycle;
  return t < 24 ? 'A' : t < 30 ? 'blank' : t < 54 ? 'B' : 'blank';
};

const QCFrame: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.qc - 4, T.qc + 8);
  const o = 1 - lerp(f, 598, 610, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  const ph = qcPhase(f);
  const flag = pop(f, T.flag, 12, 190, 0.6);
  const ring = pulse(f, T.flag, 12);
  const k = QF.w / 1600;
  const box = {x: QF.x + FREEZE_BOX.x * k, y: QF.y + FREEZE_BOX.y * k, w: FREEZE_BOX.w * k, h: FREEZE_BOX.h * k};
  const L = 26;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: a * o}}>
      <div style={{position: 'absolute', left: QF.x, top: QF.y - 40, width: QF.w, height: QF.h + 40, borderRadius: 9, background: C.panel, border: `1px solid ${C.line}`, boxShadow: '0 30px 80px rgba(0,0,0,0.55)'}} />
      <div style={{position: 'absolute', left: QF.x + 16, top: QF.y - 31, display: 'flex', gap: 14, alignItems: 'center'}}>
        <Mono size={16} color={C.text}>
          A001_C007.mov · CAM A · Take 03
        </Mono>
      </div>
      <div style={{position: 'absolute', left: QF.x + QF.w - 16, top: QF.y - 33, translate: '-100% 0px'}}>
        <Mono size={18} color={ph === 'blank' ? C.muted : C.amber}>
          {ph === 'blank' ? '—— blank ——' : ph === 'A' ? tc(0, 12, 4, 9) : tc(0, 12, 4, 10)}
        </Mono>
      </div>
      <div style={{position: 'absolute', left: QF.x, top: QF.y, width: QF.w, height: QF.h, overflow: 'hidden', borderRadius: '0 0 8px 8px'}}>
        {ph === 'blank' ? <div style={{position: 'absolute', inset: 0, background: '#4c514e'}} /> : <NightStreet changed={ph === 'B'} w={QF.w} h={QF.h} uid={'qc' + ph} />}
      </div>
      {flag > 0 ? (
        <>
          <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, background: alpha(C.amber, 0.12 * flag), outline: `2px solid ${alpha(C.amber, 0.55 * flag)}`, scale: `${1.4 - 0.4 * flag}`}} />
          {[0, 1, 2, 3].map((c) => (
            <div
              key={c}
              style={{
                position: 'absolute',
                left: box.x + (c % 2 ? box.w - L : 0),
                top: box.y + (c > 1 ? box.h - L : 0),
                width: L,
                height: L,
                borderColor: C.amber,
                borderStyle: 'solid',
                borderWidth: `${c < 2 ? 5 : 0}px ${c % 2 ? 5 : 0}px ${c > 1 ? 5 : 0}px ${c % 2 ? 0 : 5}px`,
                opacity: flag,
                translate: `${(c % 2 ? 1 : -1) * (1 - flag) * 60}px ${(c > 1 ? 1 : -1) * (1 - flag) * 60}px`,
              }}
            />
          ))}
          <div style={{position: 'absolute', left: box.x + box.w / 2 - 160, top: box.y + box.h / 2 - 160, width: 320, height: 320, borderRadius: '50%', border: `3px solid ${C.amber}`, opacity: ring * 0.8, scale: `${0.3 + (1 - ring) * 1.2}`}} />
          <div style={{position: 'absolute', left: box.x, top: box.y + box.h + 12, opacity: flag, translate: `0px ${(1 - flag) * 14}px`}}>
            <Chip tone="amber" mono style={{height: 40, fontSize: 19, fontWeight: 700}}>
              Freeze {tc(0, 12, 4, 10)}
            </Chip>
          </div>
        </>
      ) : null}
    </div>
  );
};

// the QC lanes under the picture: video lane + audio lane; flags land on their report rows
const QCLanes: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.qc + 6, T.qc + 20);
  const o = 1 - lerp(f, 598, 610, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  const W = QF.w;
  const play = lerp(f, T.qc, T.flag, 0.08, 0.3, (t) => t);
  const fl = (x: number, at: number, w = 10, col: string = C.amber) => {
    const k = pop(f, at, 12, 220, 0.6);
    return k > 0 ? <div style={{position: 'absolute', left: x * W, top: -4, width: w, height: 26, borderRadius: 3, background: col, scale: `1 ${k}`, boxShadow: `0 0 ${18 * pulse(f, at, 10)}px ${col}`}} /> : null;
  };
  return (
    <div style={{position: 'absolute', left: QF.x, top: 876, width: W, height: 70, opacity: a * o}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 18, borderRadius: 4, background: alpha(A, 0.16), border: `1px solid ${alpha(A, 0.4)}`}} />
      <svg width={W} height={30} style={{position: 'absolute', left: 0, top: 30}}>
        {Array.from({length: 140}, (_, i) => {
          const x = (i / 140) * W;
          const silent = i >= 98 && i < 112;
          const v = silent ? 0.04 : 0.25 + 0.75 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23));
          return <rect key={i} x={x} y={15 - v * 13} width={W / 140 - 2.5} height={Math.max(1.5, v * 26)} rx={1} fill={silent && f >= T.rows[2] ? C.amber : alpha(A, 0.6)} />;
        })}
      </svg>
      {fl(0.3, T.rows[0])}
      {fl(0.52, T.rows[1], 10, '#000')}
      {f >= T.rows[1] ? <div style={{position: 'absolute', left: 0.52 * W - 2, top: -6, width: 14, height: 30, border: `2px solid ${C.amber}`, borderRadius: 4, opacity: lerp(f, T.rows[1], T.rows[1] + 6)}} /> : null}
      <div style={{position: 'absolute', left: play * W, top: -8, width: 3, height: 70, background: C.text, opacity: f < T.flag ? 0.8 : 0.3}} />
    </div>
  );
};

const PhaseCue: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.qc + 10, T.qc + 28);
  const o = 1 - lerp(f, T.flag - 6, T.flag);
  if (a <= 0 || o <= 0) return null;
  const ph = qcPhase(f);
  const box = (label: string, on: boolean) => (
    <div style={{flex: 1, height: 64, borderRadius: 6, border: `1.5px solid ${on ? A : C.line}`, background: on ? alpha(A, 0.14) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 20, color: on ? A : C.muted}}>
      {label}
    </div>
  );
  return (
    <div style={{position: 'absolute', left: 1290, top: 300, width: 510, opacity: a * o, translate: `${(1 - a) * 30}px 0px`}}>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 60, letterSpacing: '-0.03em', color: C.text, lineHeight: 1.05}}>Spot the change.</div>
      <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 28, color: C.muted, marginTop: 18, lineHeight: 1.35}}>
        Two frames, one blank between.
        <br />
        One region is frozen.
      </div>
      <div style={{display: 'flex', gap: 10, marginTop: 40}}>
        {box('A', ph === 'A')}
        {box('blank', ph === 'blank')}
        {box('A′', ph === 'B')}
      </div>
    </div>
  );
};

const QC_ROWS: {name: string; time: string; icon: 'freeze' | 'black' | 'silence'}[] = [
  {name: 'Freeze', time: tc(0, 12, 4, 10), icon: 'freeze'},
  {name: 'Black frame', time: tc(0, 12, 9, 2), icon: 'black'},
  {name: 'Silent passage', time: `${tc(0, 12, 15, 0)} – ${tc(0, 12, 17, 12)}`, icon: 'silence'},
];
const QCReport: React.FC<{f: number}> = ({f}) => {
  const a = pop(f, T.flag, 14, 170, 0.7);
  const o = 1 - lerp(f, 598, 610, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  return (
    <Panel x={1290} y={190} w={510} h={670} glow={C.amber} style={{opacity: Math.min(1, a * 1.5) * o, translate: `${(1 - a) * 60}px 0px`}}>
      <div style={{position: 'absolute', left: 24, top: 22, right: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 26, color: C.text}}>Media QC report</span>
        <Chip tone="accent" accent={C.amber}>
          Advisory
        </Chip>
      </div>
      <Mono size={15} style={{position: 'absolute', left: 24, top: 70}}>
        A001_C007.mov · every frame decoded
      </Mono>
      {QC_ROWS.map((r, i) => {
        const s = pop(f, T.rows[i], 13, 200, 0.6);
        const hl = pulse(f, T.rows[i], 14);
        return (
          <div
            key={r.name}
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              top: 118 + i * 116,
              height: 100,
              borderRadius: 6,
              background: mix(C.raised, '#3a3424', hl),
              border: `1px solid ${i === 0 ? alpha(C.amber, 0.7) : C.line}`,
              opacity: Math.min(1, s * 1.4),
              translate: `${(1 - s) * 40}px 0px`,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '0 18px',
            }}
          >
            <div style={{width: 52, height: 52, borderRadius: 6, background: C.canvas, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}>
              {r.icon === 'freeze' ? (
                <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth={2} strokeLinecap="round">
                  <rect x={4} y={4} width={16} height={16} rx={2} />
                  <path d="M10 9v6M14 9v6" />
                </svg>
              ) : r.icon === 'black' ? (
                <div style={{width: 30, height: 20, background: '#000', border: `1.5px solid ${C.amber}`, borderRadius: 3}} />
              ) : (
                <svg width={32} height={30} viewBox="0 0 26 24" fill="none" stroke={C.amber} strokeWidth={2} strokeLinecap="round">
                  <path d="M2 12h3M5 7v10M8 9v6M11 12h8M19 9v6M22 6v12M25 12h-1" />
                </svg>
              )}
            </div>
            <div>
              <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 25, color: C.text}}>{r.name}</div>
              <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 18, color: C.amber, marginTop: 4}}>{r.time}</div>
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 24, right: 24, bottom: 24, fontFamily: FONT, fontSize: 20, color: C.muted, lineHeight: 1.4, opacity: lerp(f, T.rows[2] + 6, T.rows[2] + 18)}}>
        Detection is advisory. Inspect intentional black, still shots and silence.
      </div>
    </Panel>
  );
};

// ---------- Proxy Preparation: zoetrope ----------
const JOBS = ['A001_C003', 'B002_C011', 'C004_C002'];
const theta = (f: number) => {
  const u = Math.max(0, Math.min(1, (f - 606) / 54));
  return (8 * 54 * u ** 3) / 3; // ω ramps to 8°/frame (physical), then the lock takes over
};
const ProxyStage: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.proxy, T.proxy + 16);
  const o = 1 - lerp(f, 712, 726, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  const lock = lerp(f, T.sync - 10, T.sync, 0, 1, IN_OUT);
  const blur = lerp(f, 625, 655);
  const anim = Math.max(0, f - T.sync + 10) * (12 / 30); // one bounce per beat
  const sp = pulse(f, T.sync, 14);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: a * o}}>
      <div style={{position: 'absolute', left: 590 - 420, top: 500 - 420, width: 840, height: 840, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(A, 0.1 + 0.12 * sp)} 0%, transparent 62%)`}} />
      <div style={{position: 'absolute', inset: 0, translate: `0px ${(1 - a) * 40}px`}}>
        <Zoetrope cx={590} cy={500} R={330} H={290} theta={theta(f)} lock={lock} anim={anim} blur={blur} uid="zt" />
      </div>
      <div style={{position: 'absolute', left: 590, top: 238, translate: '-50% 0px', display: 'flex', gap: 10}}>
        <Chip tone={lock > 0.5 ? 'accent' : 'line'} accent={A} mono style={{scale: `${1 + 0.1 * sp}`}}>
          {lock > 0.5 ? 'SPINNING · THE STILLS MOVE' : f < 612 ? 'STOPPED · 12 STILLS' : 'SPINNING UP'}
        </Chip>
      </div>
      <Panel x={1080} y={250} w={720} h={430} glow={A}>
        <div style={{position: 'absolute', left: 24, top: 20, right: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 25, color: C.text}}>H.264 proxies</span>
          <Mono size={15}>source links kept</Mono>
        </div>
        {JOBS.map((j, i) => {
          const done = T.jobs[i];
          const pr = lerp(f, T.proxy + 6 + i * 4, done, 0, 1, (t) => t);
          const ok = pop(f, done, 12, 220, 0.6);
          return (
            <div key={j} style={{position: 'absolute', left: 16, right: 16, top: 80 + i * 112, height: 96, borderRadius: 6, background: C.raised, border: `1px solid ${ok > 0.5 ? alpha(A, 0.5) : C.line}`}}>
              <div style={{position: 'absolute', left: 18, top: 16, display: 'flex', alignItems: 'center', gap: 12}}>
                <Mono size={18} color={C.text}>
                  {j}.mov
                </Mono>
                <Arrow size={18} color={C.muted} />
                <Mono size={18} color={ok > 0.5 ? A : C.muted}>
                  {j}_proxy.mp4
                </Mono>
              </div>
              <div style={{position: 'absolute', right: 18, top: 14, display: 'flex', alignItems: 'center', gap: 8, opacity: ok}}>
                <LinkIcon size={20} color={A} />
                <Check size={26} color={C.success} draw={ok} />
              </div>
              <div style={{position: 'absolute', left: 18, right: 18, bottom: 18, height: 8, borderRadius: 4, background: C.canvas}}>
                <div style={{width: `${pr * 100}%`, height: '100%', borderRadius: 4, background: ok > 0.5 ? A : C.amber}} />
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
};

// ---------- Timecode Assembly: LTC → aligned tracks ----------
const ltcBits = (h: number, m: number, s: number, fr: number) => {
  const b: number[] = [];
  const put = (v: number, n: number) => {
    for (let i = 0; i < n; i++) b.push((v >> i) & 1);
  };
  put(fr % 10, 4), put(0, 4), put(Math.floor(fr / 10), 2), put(0, 2), put(0, 4);
  put(s % 10, 4), put(0, 4), put(Math.floor(s / 10), 3), put(0, 1), put(0, 4);
  put(m % 10, 4), put(0, 4), put(Math.floor(m / 10), 3), put(0, 1), put(0, 4);
  put(h % 10, 4), put(0, 4), put(Math.floor(h / 10), 2), put(0, 2), put(0, 4);
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1].forEach((v) => b.push(v)); // sync word
  return b;
};
// bi-phase mark: a transition at every bit edge, an extra one mid-cell for a 1 → half-cell levels
const LTC_HALF = (() => {
  const out: number[] = [];
  let lv = 0;
  for (let k = 0; k < 3; k++)
    for (const bit of ltcBits(1, 0, 12, 6 + k)) {
      lv ^= 1;
      out.push(lv);
      if (bit) lv ^= 1;
      out.push(lv);
    }
  return out;
})();

const LtcStrip: React.FC<{f: number}> = ({f}) => {
  const a = lerp(f, T.tc - 2, T.tc + 12);
  const o = 1 - lerp(f, T.exit, T.exit + 16, 0, 1, IN_OUT);
  if (a <= 0 || o <= 0) return null;
  const hw = 4.2;
  const W = 1180;
  const off = (f * 9) % (160 * hw);
  const rects: React.ReactNode[] = [];
  let start = -1;
  for (let k = 0; k <= LTC_HALF.length; k++) {
    const on = k < LTC_HALF.length && LTC_HALF[k] === 1;
    if (on && start < 0) start = k;
    if (!on && start >= 0) {
      const x = start * hw - off;
      if (x < W && x + (k - start) * hw > 0) rects.push(<rect key={k} x={x} y={0} width={(k - start) * hw} height={56} fill={A} />);
      start = -1;
    }
  }
  const read = f >= T.ltc;
  const rp = pulse(f, T.ltc, 12);
  const fr = read ? 8 + Math.floor((f - T.ltc) / 2.4) : Math.floor((f * 37) % 25);
  const s = read ? 12 + Math.floor(fr / 25) : Math.floor((f * 13) % 60);
  return (
    <Panel x={120} y={180} w={1680} h={104} glow={A} style={{opacity: a * o, translate: `0px ${(1 - a) * -20}px`}}>
      <div style={{position: 'absolute', left: 22, top: 24, display: 'flex', flexDirection: 'column', gap: 6}}>
        <Chip tone="accent" accent={A} mono>
          LTC
        </Chip>
        <Mono size={13}>audio fallback</Mono>
      </div>
      <svg width={W} height={56} style={{position: 'absolute', left: 140, top: 24, opacity: 0.85}}>
        {rects}
      </svg>
      <div style={{position: 'absolute', left: 140 + W / 2 - 1, top: 14, width: 2, height: 76, background: C.amber, opacity: 0.8}} />
      <div style={{position: 'absolute', right: 22, top: 18, textAlign: 'right'}}>
        <Mono size={13}>{read ? 'RECORDED TIMECODE' : 'READING…'}</Mono>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 38, color: read ? C.amber : C.muted, textShadow: rp > 0.02 ? `0 0 ${24 * rp}px ${C.amber}` : undefined}}>{tc(1, 0, s % 60, fr % 25)}</div>
      </div>
    </Panel>
  );
};

// each camera track carries its own offset until the recorded timecode lines them up (tracks move as units)
const ROW_OFF = [-230, 250, -150];
const CLIP_THUMB = [1, 10, 0, 4, 7]; // THUMBS index shown on each video clip while it is still a thumbnail
const thumbAt = (i: number): Rect => ({x: 250 + i * 290, y: 452, w: 240, h: 135});
const Assembly: React.FC<{f: number}> = ({f}) => {
  if (f < T.tc) return null;
  const al = [0, 1, 2].map((r) => pop(f, T.align - 4 + r, 15, 200, 0.7));
  const offsets = TL_CLIPS.map((c) => ROW_OFF[c.row] * (1 - al[c.row]));
  const morph = TL_CLIPS.map((c, i) => (c.row === 2 ? 1 : lerp(f, T.tc + 18 + i * 4, T.tc + 38 + i * 4, 0, 1, IN_OUT)));
  const clipIn = TL_CLIPS.map((c, i) => (c.row === 2 ? lerp(f, T.tc + 44, T.tc + 60) : morph[i] >= 1 ? 1 : 0));
  const color = handoffColor(f - 840);
  const chips = lerp(f, T.align + 6, T.align + 18) * (1 - lerp(f, T.exit, T.exit + 14, 0, 1, IN_OUT));
  return (
    <>
      <HandoffTimeline color={color} chrome={lerp(f, T.tc + 6, T.tc + 22)} offsets={offsets} clipIn={clipIn} playGlow={pulse(f, T.align, 14)} />
      <div style={{position: 'absolute', inset: 0, clipPath: `inset(0px ${1920 - TL.x1 - 4}px 0px ${TL.x0 - 4}px)`}}>
      {TL_CLIPS.map((c, i) => {
        if (c.row === 2 || morph[i] >= 1) return null;
        const s = pop(f, T.tc + 2 + i * 3, 13, 180, 0.7);
        if (s <= 0) return null;
        const r = mixRect(thumbAt(i), {x: c.a + offsets[i], y: TL.rows[c.row] - TL.h / 2, w: c.b - c.a, h: TL.h}, morph[i]);
        const m = morph[i];
        return (
          <div key={i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, scale: `${s}`, opacity: Math.min(1, s * 1.5)}}>
            <ClipBody w={r.w} h={r.h} color={color} seed={c.seed} name={c.name} label={m} />
            <div style={{position: 'absolute', inset: 0, borderRadius: 6, overflow: 'hidden', opacity: 1 - m, border: `1.5px solid ${C.line}`}}>
              <Shot kind={THUMBS[CLIP_THUMB[i]].kind} seed={THUMBS[CLIP_THUMB[i]].seed} uid={`la${i}`} w={r.w} h={r.h} />
            </div>
          </div>
        );
      })}
      </div>
      <div style={{position: 'absolute', left: 120, top: 712, width: 1680, display: 'flex', gap: 12, alignItems: 'center', opacity: chips}}>
        <Chip tone="accent" accent={A}>
          <Check size={20} color={A} /> Aligned by recorded timecode
        </Chip>
        <Chip tone="raised">FCP7 XML</Chip>
        <Chip tone="raised">Timing report</Chip>
        <span style={{flex: 1}} />
        <Mono size={16}>Embedded metadata stays authoritative</Mono>
      </div>
    </>
  );
};

// ---------- world ----------
export const World: React.FC = () => {
  const f = useWorldFrame();
  const tool = (at: number, out: number, text: string, n?: string) => <ToolLabel f={f} at={at} out={out} text={text} accent={A} n={n} />;
  const bg = 1 - lerp(f, T.exit + 10, 828, 0, 1, IN_OUT); // plain canvas across the cut into the Edit Room
  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${alpha(A, 0.09)} 1.2px, transparent 1.4px)`, backgroundSize: '32px 32px', backgroundPosition: `${-f * 0.2}px 0px`, opacity: 0.8 * bg}} />
      <AbsoluteFill style={{background: `radial-gradient(70% 60% at 60% 45%, ${alpha(A, 0.07)} 0%, transparent 70%)`, opacity: bg}} />
      <FilmBand f={f} />
      <Grid f={f} />
      <WorldTitle f={f} index={8} name="LIBRARY" promise="Find anything you shot." accent={A} x={120} y={330} out={T.titleOut} />
      {tool(T.reflow, T.catalog, 'FOOTAGE LIBRARY')}
      <SearchBar f={f} />
      <LibCount f={f} />
      {tool(T.catalog, T.transcribe, 'PC MEDIA CATALOG')}
      <Viewer f={f} />
      <SourceStrip f={f} />
      <SpokenCard f={f} />
      {tool(T.transcribe, T.qc - 4, 'LOCAL TRANSCRIPTION')}
      <Transcription f={f} />
      {tool(T.qc, T.proxy, 'MEDIA QC & DAILIES')}
      <QCFrame f={f} />
      <QCLanes f={f} />
      <PhaseCue f={f} />
      <QCReport f={f} />
      {tool(T.proxy, T.tc, 'PROXY PREPARATION')}
      <ProxyStage f={f} />
      {tool(T.tc, T.exit + 8, 'TIMECODE ASSEMBLY')}
      <LtcStrip f={f} />
      <Assembly f={f} />
    </AbsoluteFill>
  );
};
