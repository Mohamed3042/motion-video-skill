// World 1 · INGEST (parchment). The intro's playhead line draws the day folder around itself; four camera
// subfolders fan out; they become the SOURCE column of a verified copy. A dense SHA-256 hex stream pours from
// Source to Copy, and its brightness pattern is a giant ✓ that resolves only as the two hashes match, block by
// block. Originals are never touched. Exit: each camera's audio peeks out as a waveform strip (Sync's lanes).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO, RADIUS} from '../../brand';
import {useWorldFrame} from '../../frame';
import {mulberry32} from '../../timing';
import {Check, Glow, Lock, clamp, ease, mix, mixHex, prog, rgba, smooth, sp} from '../sync/kit';
import {Lanes, MUTED, TRACKS} from '../sync/Lanes';
import {offsetPx} from '../sync/timing';
import {LANE, laneY} from '../sync/word';
import {CLIPS, T} from './timing';

const P = ACCENT.ingest; // parchment
const HOT = '#fbf1d8';
const SYNC_LEN = 600; // this world's length: Sync's frame = f − 600

// ---------------------------------------------------------------- geometry ----
const FD = {x: 960, tabY: 268, y: 300, r: 1720, b: 812}; // the day folder (left edge = the intro's playhead x)
const SRC = {x: 120, w: 320};
const CPY = {x: 1480, w: 320};
const HF = {x: 470, y: 377, w: 980, rows: 23, adv: 9.6, lh: 18}; // hex field
const COLS = Math.ceil(HF.w / HF.adv) + 1;

// ---------------------------------------------------------------- hex stream ----
const HEX = '0123456789abcdef';
const ROWSTR = Array.from({length: HF.rows}, (_, r) => {
  const rnd = mulberry32(5000 + r * 31);
  let s = '';
  for (let k = 0; k < 640; k++) s += HEX[Math.floor(rnd() * 16)];
  return s;
});
const SPEED = Array.from({length: HF.rows}, (_, r) => 2.6 + 3.2 * mulberry32(7000 + r)()); // px per frame
const hash3 = (a: number, b: number, c: number) => {
  let x = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1274126177)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
};
// The ✓, in field pixels: a thick stroke; MASK[r][c] = 0..1 coverage of each character cell.
const CK = [
  [236, 222],
  [418, 362],
  [770, 48],
];
const segDist = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const vx = bx - ax;
  const vy = by - ay;
  const t = clamp(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy));
  return Math.hypot(px - ax - t * vx, py - ay - t * vy);
};
const MASK = Array.from({length: HF.rows}, (_, r) =>
  Array.from({length: COLS}, (_, c) => {
    const x = (c + 0.5) * HF.adv;
    const y = (r + 0.5) * HF.lh;
    const d = Math.min(segDist(x, y, CK[0][0], CK[0][1], CK[1][0], CK[1][1]), segDist(x, y, CK[1][0], CK[1][1], CK[2][0], CK[2][1]));
    return 1 - smooth(clamp((d - 34) / 20));
  }),
);
const LEVELS = [rgba(P, 0.09), rgba(P, 0.16), rgba(P, 0.25), rgba(P, 0.37), rgba(P, 0.55), rgba(P, 0.8), HOT];

// stream speed multiplier: pours during copy, slows as the hashes converge, nearly still on the match
const mul = (k: number) => (k < 300 ? 1 : k < 360 ? mix(1, 0.14, (k - 300) / 60) : 0.14);
const travel = (f: number) => {
  let s = 0;
  for (let k = 100; k < f; k++) s += mul(k);
  return s;
};
// How resolved the ✓ is: one step per matched hash block, the last snap on the match.
export const resolveAt = (f: number) =>
  (0.8 * T.blocks.reduce((a, b) => a + ease.cubicOut(prog(f, b, b + 10)), 0)) / T.blocks.length + 0.2 * ease.cubicOut(prog(f, T.match, T.match + 6));

const HexField: React.FC<{f: number; o: number}> = ({f, o}) => {
  if (o <= 0) return null;
  const R = resolveAt(f);
  const S = travel(f);
  const hot = f >= T.match ? Math.exp(-(f - T.match) / 9) : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: HF.x,
        top: HF.y,
        width: HF.w,
        height: HF.rows * HF.lh,
        overflow: 'hidden',
        opacity: o,
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%)',
        maskImage: 'linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%)',
      }}
    >
      {ROWSTR.map((str, r) => {
        const px = S * SPEED[r];
        const shift = Math.floor(px / HF.adv);
        const frac = px - shift * HF.adv;
        const runs: {lv: number; txt: string}[] = [];
        for (let c = -1; c < COLS - 1; c++) {
          const n = c - shift;
          const ch = str[((n % str.length) + str.length) % str.length];
          const u = hash3(r, n, Math.floor(f / 5) + (n & 7));
          const noise = 0.06 + 0.42 * u * u + (u > 0.965 ? 0.45 : 0);
          const m = MASK[r][Math.max(0, c)];
          let b = mix(noise, 0.07 + 0.93 * m, R);
          if (m > 0.5) b += 0.5 * hot;
          const lv = Math.min(6, Math.max(0, Math.floor(b * 6.2)));
          const last = runs[runs.length - 1];
          if (last && last.lv === lv) last.txt += ch;
          else runs.push({lv, txt: ch});
        }
        return (
          <div key={r} style={{position: 'absolute', left: frac - HF.adv, top: r * HF.lh, whiteSpace: 'pre', fontFamily: MONO, fontWeight: 500, fontSize: 16, lineHeight: `${HF.lh}px`}}>
            {runs.map((run, k) => (
              <span key={k} style={{color: LEVELS[run.lv]}}>
                {run.txt}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- hashes ----
const hexOf = (seed: number) => {
  const r = mulberry32(seed);
  return Array.from({length: 64}, () => HEX[Math.floor(r() * 16)]).join('');
};
const SHA = hexOf(2026);
const HashLine: React.FC<{f: number; label: string; y: number; lead: number}> = ({f, label, y, lead}) => (
  <div style={{position: 'absolute', left: HF.x + 8, top: y, display: 'flex', alignItems: 'center', gap: 18, fontFamily: MONO, fontSize: 15, whiteSpace: 'pre'}}>
    <div style={{width: 150, fontWeight: 700, letterSpacing: '0.18em', fontSize: 12, color: C.muted}}>{label}</div>
    <div style={{display: 'flex', gap: 9}}>
      {T.blocks.map((at, k) => {
        const typed = Math.round(clamp((f - (at - lead - 8)) / 8) * 8);
        const ok = f >= at;
        const flash = ok ? Math.exp(-(f - at) / 8) : 0;
        const txt = SHA.slice(k * 8, k * 8 + typed) + '·'.repeat(8 - typed);
        return (
          <div key={k} style={{position: 'relative', color: ok ? mixHex(P, HOT, flash) : typed ? rgba(P, 0.6) : rgba(C.muted, 0.35), fontWeight: ok ? 700 : 500}}>
            {txt}
            <div style={{position: 'absolute', left: 0, right: 0, bottom: -5, height: 2, borderRadius: 1, background: P, opacity: ok ? 0.75 + 0.25 * flash : 0}} />
          </div>
        );
      })}
    </div>
  </div>
);

// ---------------------------------------------------------------- small UI ----
const FolderIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 40 32" style={{display: 'block'}}>
    <path d="M2 6 a3 3 0 0 1 3 -3 h10 l4 4 h16 a3 3 0 0 1 3 3 v17 a3 3 0 0 1 -3 3 h-30 a3 3 0 0 1 -3 -3 z" fill={rgba(color, 0.14)} stroke={color} strokeWidth={2} strokeLinejoin="round" />
  </svg>
);
const WaveGlyph: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{display: 'block'}}>
    {[10, 18, 28, 18, 10].map((h, k) => (
      <rect key={k} x={7 + k * 6} y={20 - h / 2} width={3} height={h} rx={1.5} fill={color} />
    ))}
  </svg>
);

// One camera folder: inside the day folder (wide, with clip thumbnails), then the SOURCE card, then Sync's header.
const CameraCard: React.FC<{f: number; i: number}> = ({f, i}) => {
  const land = T.subs[i];
  const pop = ease.backOut(prog(f, land - 10, land));
  if (pop <= 0) return null;
  const fly = ease.inOut(prog(f, T.fly + i * 3, T.fly + 30 + i * 3));
  const toHeader = ease.inOut(prog(f, T.peek, T.peek + 26));
  const x = mix(FD.x + 30, SRC.x, fly);
  const w = mix(mix(FD.r - FD.x - 60, SRC.w, fly), 156, toHeader);
  const y0 = laneY(0) + 6;
  const y = mix(y0, laneY(i), pop);
  const thumbs = 1 - prog(fly, 0, 0.35);
  const locked = ease.expoOut(prog(f, T.untouched, T.untouched + 12));
  const copying = T.files.filter((k, j) => fileCam(j) === i);
  const active = f >= copying[0] - 8 && f < copying[copying.length - 1] + 8;
  const fade = 1 - prog(f, T.peek + 8, T.peek + 26); // hands over to Sync's header
  const name = TRACKS[i].name;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: LANE.h,
        opacity: clamp(pop * 1.4) * fade,
        transform: `rotate(${(1 - pop) * (i - 1.5) * -4}deg)`,
        transformOrigin: '30% 0%',
      }}
    >
      <div style={{position: 'absolute', inset: 0, borderRadius: RADIUS.control, background: C.panel, border: `1px solid ${active ? rgba(P, 0.8) : mixHex(C.line, P, 0.25)}`, boxShadow: '0 14px 40px rgba(0,0,0,0.45)'}} />
      <div style={{position: 'absolute', left: 18, top: 22}}>{i === 3 ? <WaveGlyph size={36} color={P} /> : <FolderIcon size={36} color={P} />}</div>
      <div style={{position: 'absolute', left: 68, top: 14, fontFamily: FONT, fontWeight: 700, fontSize: 28, color: C.text}}>{name}</div>
      <div style={{position: 'absolute', left: 68, top: 56, height: 24, padding: '0 10px', borderRadius: 12, border: `1px solid ${rgba(P, 0.55)}`, display: 'flex', alignItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', color: P, whiteSpace: 'nowrap', opacity: 1 - toHeader}}>
        {CLIPS[i]} clips
      </div>
      {/* clip thumbnails (inside the day folder only) */}
      <div style={{position: 'absolute', left: 210, top: 16, display: 'flex', gap: 10, opacity: thumbs}}>
        {Array.from({length: CLIPS[i]}, (_, k) => (
          <div key={k} style={{position: 'relative', width: 112, height: 66, borderRadius: 5, overflow: 'hidden', background: i === 3 ? '#171a18' : `linear-gradient(135deg, #2c2b25 0%, #1a1c19 60%, #121412 100%)`, border: `1px solid ${C.line}`}}>
            {i === 3 ? (
              <div style={{position: 'absolute', left: 36, top: 13}}>
                <WaveGlyph size={40} color={rgba(P, 0.6)} />
              </div>
            ) : (
              <div style={{position: 'absolute', left: 30 + k * 9, top: 18, width: 22, height: 22, borderRadius: 11, background: '#34352d', boxShadow: '0 30px 0 12px #2a2b25'}} />
            )}
            <div style={{position: 'absolute', right: 6, bottom: 4, fontFamily: MONO, fontSize: 10, color: C.muted}}>0:{String(18 + ((k * 7 + i * 5) % 40)).padStart(2, '0')}</div>
          </div>
        ))}
      </div>
      {/* originals never touched */}
      <div style={{position: 'absolute', right: 16, top: 34, opacity: locked * (1 - toHeader), transform: `scale(${mix(0.6, 1, locked)})`}}>
        <Lock size={30} color={P} />
      </div>
    </div>
  );
};
// which camera each of the 12 copied files belongs to (in order)
const fileCam = (j: number) => (j < 4 ? 0 : j < 7 ? 1 : j < 10 ? 2 : 3);

const CopyRow: React.FC<{f: number; i: number}> = ({f, i}) => {
  const enter = ease.expoOut(prog(f, T.fly + 18 + i * 4, T.fly + 40 + i * 4));
  const out = ease.cubicIn(prog(f, T.peek - 14 + i * 2, T.peek + 8 + i * 2));
  if (enter <= 0 || out >= 1) return null;
  const files = T.files.filter((_, j) => fileCam(j) === i);
  const done = files.filter((at) => f >= at).length;
  const ver = T.verified[i];
  const v = ease.backOut(prog(f, ver - 6, ver + 4));
  const vFlash = f >= ver ? Math.exp(-(f - ver) / 10) : 0;
  return (
    <div style={{position: 'absolute', left: CPY.x + (1 - enter) * 80 + out * 60, top: laneY(i), width: CPY.w, height: LANE.h, opacity: enter * (1 - out)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: RADIUS.control, background: C.panel, border: `1px solid ${v > 0 ? mixHex(C.line, P, 0.4 + 0.6 * vFlash) : C.line}`}} />
      <div style={{position: 'absolute', left: 18, top: 14, fontFamily: FONT, fontWeight: 700, fontSize: 22, color: C.text}}>{TRACKS[i].name}</div>
      <div style={{position: 'absolute', left: 18 + (TRACKS[i].name.length > 2 ? 72 : 44), top: 20, fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: C.muted}}>
        {done}/{CLIPS[i]}
      </div>
      {/* progress */}
      <div style={{position: 'absolute', left: 18, right: 18, top: 54, height: 6, borderRadius: 3, background: C.raised}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(done / CLIPS[i]) * 100}%`, borderRadius: 3, background: P}} />
      </div>
      <div style={{position: 'absolute', left: 18, top: 70, fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', color: v > 0.3 ? P : C.muted}}>
        {v > 0.3 ? 'VERIFIED' : done === CLIPS[i] ? (f >= T.reread ? 'RE-READING' : 'COPIED') : 'COPYING'}
      </div>
      <div style={{position: 'absolute', right: 16, top: 16, opacity: clamp(v), transform: `scale(${v})`}}>
        <div style={{width: 34, height: 34, borderRadius: 17, background: rgba(P, 0.16 + 0.3 * vFlash), border: `1.5px solid ${P}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Check size={22} color={P} width={10} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- title + labels ----
const Title: React.FC<{f: number}> = ({f}) => {
  if (f > T.fly + 10) return null;
  const out = ease.cubicIn(prog(f, T.fly - 22, T.fly));
  const idx = ease.expoOut(prog(f, 4, 20));
  const prom = ease.expoOut(prog(f, 26, 50));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: 1 - out, transform: `translateY(${-24 * out}px)`}}>
      <div style={{position: 'absolute', left: 122, top: 300, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: '0.32em', color: P, opacity: idx, whiteSpace: 'nowrap'}}>01 / 11</div>
      <div style={{position: 'absolute', left: 114, top: 330, display: 'flex', fontFamily: FONT, fontWeight: 800, fontSize: 132, lineHeight: 1, letterSpacing: '-0.035em', color: C.text}}>
        {'INGEST'.split('').map((ch, i) => {
          const s = sp(f, 6 + i * 3, {damping: 13, stiffness: 190, mass: 0.7});
          return (
            <span key={i} style={{display: 'inline-block', opacity: clamp(s * 3), transform: `translateY(${(1 - s) * 60}px)`}}>
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 122, top: 478, fontFamily: FONT, fontWeight: 500, fontSize: 36, color: C.muted, opacity: prom, transform: `translateY(${(1 - prom) * 14}px)`, whiteSpace: 'nowrap'}}>
        Bring the <span style={{color: P, fontWeight: 650}}>shoot</span> in.
      </div>
      <div style={{position: 'absolute', left: 122, top: 548, width: 360 * prom, height: 1, background: rgba(P, 0.4)}} />
    </div>
  );
};

const Steps: React.FC<{f: number}> = ({f}) => {
  const o = ease.expoOut(prog(f, T.fly + 4, T.fly + 24)) * (1 - ease.cubicIn(prog(f, T.peek + 40, T.peek + 70)));
  if (o <= 0) return null;
  const words: [string, number, number][] = [
    ['Copy.', T.fly, T.reread],
    ['Re-read.', T.reread, T.reread + 60],
    ['Verify.', T.reread + 60, T.match],
  ];
  const all = f >= T.match ? 1 : 0;
  const nt = ease.expoOut(prog(f, T.untouched - 4, T.untouched + 14));
  return (
    <div style={{position: 'absolute', left: 122, top: 146, opacity: o, transform: `translateY(${(1 - o) * 12}px)`}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.32em', color: P, whiteSpace: 'nowrap'}}>VERIFIED INGEST · SHA-256</div>
      <div style={{display: 'flex', gap: 18, marginTop: 12, fontFamily: FONT, fontWeight: 700, fontSize: 56, lineHeight: '64px', letterSpacing: '-0.015em', whiteSpace: 'nowrap'}}>
        {words.map(([w, a, b]) => {
          const on = f >= a && f < b;
          const past = f >= b;
          return (
            <span key={w} style={{color: all || on ? (on && !all ? HOT : P) : past ? rgba(P, 0.6) : rgba(C.muted, 0.35)}}>
              {w}
            </span>
          );
        })}
        <span style={{display: 'flex', alignItems: 'center', gap: 12, marginLeft: 26, fontSize: 40, fontWeight: 600, color: C.text, opacity: nt, transform: `translateX(${(1 - nt) * -16}px)`}}>
          <Lock size={34} color={P} />
          Originals never touched.
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- the day folder ----
const DayFolder: React.FC<{f: number}> = ({f}) => {
  const draw = ease.inOut(prog(f, 0, T.fold));
  const fill = ease.cubicOut(prog(f, T.fold - 10, T.fold + 8));
  const out = ease.inOut(prog(f, T.fly - 4, T.fly + 22));
  if (out >= 1) return null;
  const midY = (FD.y + FD.b) / 2;
  const top = `M${FD.x} ${FD.tabY + 8} Q${FD.x} ${FD.tabY} ${FD.x + 8} ${FD.tabY} H${FD.x + 236} L${FD.x + 266} ${FD.y} H${FD.r - 10} Q${FD.r} ${FD.y} ${FD.r} ${FD.y + 10} V${midY}`;
  const bot = `M${FD.x} ${FD.b - 8} Q${FD.x} ${FD.b} ${FD.x + 8} ${FD.b} H${FD.r - 10} Q${FD.r} ${FD.b} ${FD.r} ${FD.b - 10} V${midY}`;
  const flash = f >= T.fold ? Math.exp(-(f - T.fold) / 10) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
      <svg style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'visible'}}>
        <defs>
          <linearGradient id="ingFolder" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#24221b" />
            <stop offset="1" stopColor="#161612" />
          </linearGradient>
        </defs>
        <path
          d={`M${FD.x} ${FD.tabY + 8} Q${FD.x} ${FD.tabY} ${FD.x + 8} ${FD.tabY} H${FD.x + 236} L${FD.x + 266} ${FD.y} H${FD.r - 10} Q${FD.r} ${FD.y} ${FD.r} ${FD.y + 10} V${FD.b - 10} Q${FD.r} ${FD.b} ${FD.r - 10} ${FD.b} H${FD.x + 8} Q${FD.x} ${FD.b} ${FD.x} ${FD.b - 8} Z`}
          fill="url(#ingFolder)"
          opacity={fill}
        />
        <path d={top} fill="none" stroke={mixHex(P, HOT, flash)} strokeWidth={2.5} strokeDasharray={1400} strokeDashoffset={1400 * (1 - draw)} strokeLinejoin="round" />
        <path d={bot} fill="none" stroke={mixHex(P, HOT, flash)} strokeWidth={2.5} strokeDasharray={1400} strokeDashoffset={1400 * (1 - draw)} strokeLinejoin="round" />
        <line x1={FD.x + 2} y1={FD.y} x2={FD.r - 2} y2={FD.y} stroke={rgba(P, 0.25)} strokeWidth={1} opacity={fill} />
      </svg>
      <div style={{position: 'absolute', left: FD.x + 26, top: FD.tabY + 7, fontFamily: MONO, fontWeight: 700, fontSize: 14, letterSpacing: '0.2em', color: P, opacity: fill}}>DAY 2</div>
      <div style={{position: 'absolute', left: FD.x + 30, top: FD.y + 22, fontFamily: MONO, fontSize: 15, color: C.muted, opacity: ease.cubicOut(prog(f, T.fold, T.fold + 14)), whiteSpace: 'nowrap'}}>
        D:\Shoot\Day 2\
      </div>
      <div style={{position: 'absolute', right: 1920 - FD.r + 30, top: FD.y + 20, fontFamily: MONO, fontWeight: 700, fontSize: 13, letterSpacing: '0.16em', color: P, opacity: ease.cubicOut(prog(f, T.subs[3], T.subs[3] + 14)), whiteSpace: 'nowrap'}}>
        4 CAMERAS · 12 CLIPS
      </div>
    </div>
  );
};

// The intro's playhead: a full-height amber line at x = 960 that shrinks onto the folder's left edge.
const EdgeLine: React.FC<{f: number}> = ({f}) => {
  const out = ease.inOut(prog(f, T.fly - 4, T.fly + 22));
  if (out >= 1) return null;
  const k = ease.inOut(prog(f, -6, 20));
  const y0 = mix(-40, FD.tabY + 8, k);
  const y1 = mix(1120, FD.b - 8, k);
  const col = mixHex(C.amber, P, ease.cubicOut(prog(f, 2, 22)));
  const glow = 0.5 * (1 - k) + 0.25 * (f >= T.fold ? Math.exp(-(f - T.fold) / 12) : 0);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
      <div style={{position: 'absolute', left: FD.x - 20, top: y0, width: 40, height: y1 - y0, background: `linear-gradient(90deg, ${rgba(col, 0)} 0%, ${rgba(col, 0.5)} 50%, ${rgba(col, 0)} 100%)`, opacity: glow}} />
      <div style={{position: 'absolute', left: FD.x - mix(2, 1.5, k), top: y0, width: mix(4, 3, k), height: y1 - y0, background: col}} />
    </div>
  );
};

// ---------------------------------------------------------------- world ----
export const World: React.FC = () => {
  const f = useWorldFrame();
  const field = ease.cubicOut(prog(f, T.fly + 8, T.fly + 30)) * (1 - ease.cubicIn(prog(f, T.peek - 6, T.peek + 24)));
  const hashes = ease.cubicOut(prog(f, T.reread - 10, T.reread + 6)) * (1 - ease.cubicIn(prog(f, T.peek - 10, T.peek + 14)));
  const match = f >= T.match ? Math.exp(-(f - T.match) / 22) : 0;
  const checkGlow = resolveAt(f) * (1 - ease.cubicIn(prog(f, T.peek - 6, T.peek + 20)));
  const colHeads = ease.cubicOut(prog(f, T.fly + 20, T.fly + 40)) * (1 - ease.cubicIn(prog(f, T.peek - 10, T.peek + 10)));

  // exit: Sync's lanes, exactly as Sync draws them before anything locks
  const sf = f - SYNC_LEN;
  const reveal = [0, 1, 2, 3].map((i) => ease.inOut(prog(f, T.peek + 10 + i * 5, T.peek + 58 + i * 5)));
  const showLanes = f >= T.peek + 8;
  const punch = 0.012 * (f >= T.match ? Math.exp(-(f - T.match) / 12) : 0);

  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      {/* ledger atmosphere: warm wash + faint ruled lines */}
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(75% 65% at 60% 55%, ${rgba(P, 0.055)} 0%, rgba(0,0,0,0) 70%)`}} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5 * (1 - prog(f, T.peek, T.peek + 40)),
          backgroundImage: `repeating-linear-gradient(180deg, ${rgba(P, 0.035)} 0px, ${rgba(P, 0.035)} 1px, transparent 1px, transparent 36px)`,
        }}
      />
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + punch})`, transformOrigin: '960px 586px'}}>
        <Glow x={HF.x + 480} y={HF.y + 210} w={1300} h={640} color={P} opacity={0.32 * checkGlow + 0.5 * match} />
        <DayFolder f={f} />
        <EdgeLine f={f} />
        {/* column heads */}
        <div style={{position: 'absolute', left: SRC.x + 2, top: 340, fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.24em', color: C.muted, opacity: colHeads}}>SOURCE · CAMERA CARDS</div>
        <div style={{position: 'absolute', left: CPY.x + 2, top: 340, fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.24em', color: C.muted, opacity: colHeads}}>COPY · INGEST FOLDER</div>
        <div style={{position: 'absolute', left: HF.x + 8, top: 340, fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.24em', color: rgba(P, 0.7), opacity: colHeads}}>
          {f < T.reread ? 'COPYING →' : f < T.match ? 'RE-READING BOTH SIDES' : 'SHA-256 MATCH'}
        </div>
        <HexField f={f} o={field} />
        {/* the hashes */}
        {hashes > 0 ? (
          <div style={{opacity: hashes}}>
            <HashLine f={f} label="SOURCE  SHA-256" y={818} lead={6} />
            <HashLine f={f} label="COPY    SHA-256" y={850} lead={0} />
          </div>
        ) : null}
        {[0, 1, 2, 3].map((i) => (
          <CopyRow key={i} f={f} i={i} />
        ))}
        {showLanes ? (
          <Lanes
            lanes={[0, 1, 2, 3].map((i) => ({offset: offsetPx(i, sf), color: MUTED, lock: 0}))}
            headers={ease.cubicOut(prog(f, T.peek + 10, T.peek + 30))}
            reveal={reveal}
          />
        ) : null}
        {[0, 1, 2, 3].map((i) => (
          <CameraCard key={i} f={f} i={i} />
        ))}
      </div>
      <Title f={f} />
      <Steps f={f} />
    </AbsoluteFill>
  );
};
