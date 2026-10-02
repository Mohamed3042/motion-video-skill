// World 6 · Voice Arcade — "the arcade" (yellow CRT). We push into the CRT that the Training tunnel turned into;
// the floor is a scintillating grid; UI is pixel-snapped Press Start 2P; it ends with the CRT collapsing to a line.
import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {ACCENT, MONO, W, H} from '../../brand';
import {useWorldFrame} from '../../frame';
import {mulberry32} from '../../timing';
import {EXPO, IN_OUT, integ, ramp, type Knot} from '../training/util';
import {CrtScreen} from './crt';
import {Floor, HORIZON} from './Floor';
import {ART, P, PixelText, Sprite, Y, notch, snap} from './pixel';
import {A} from './timing';

const G = '#1ED760';
const DIM = '#4a4a4a';
const stepped = (p: number, n: number) => Math.round(p * n) / n;
const blink = (f: number, period: number) => Math.floor(f / period) % 2 === 0;
const lastAt = (frames: readonly number[], f: number) => frames.filter((x) => f >= x).length - 1;

// floor scroll speed (cells per frame): rushes in with the push, cruises half a cell per beat, rushes out
const SCROLL: Knot[] = [
  [-12, 0.1],
  [36, 1 / 60],
  [436, 1 / 60],
  [462, 0.09],
  [492, 0.09],
];

const rnd = mulberry32(606);
const STARS = Array.from({length: 46}, () => ({x: snap(80 + rnd() * 1760, 3), y: snap(130 + rnd() * 470, 3), s: rnd() < 0.3 ? 6 : 3, ph: Math.floor(rnd() * 4), a: 0.3 + 0.45 * rnd()}));
const WAVES = Array.from({length: 8}, (_, t) => {
  const r = mulberry32(900 + t * 17);
  return Array.from({length: 9}, (_, i) => snap(6 + 30 * Math.sin((Math.PI * (i + 0.5)) / 9) ** 0.7 * (0.35 + 0.65 * r()), 6));
});

// ---------- layout ----------
const TILE = {w: 204, h: 120};
const slot = (s: number) => ({x: 516 + (s % 4) * 228, y: 294 + Math.floor(s / 4) * 144});
const PERMS = [
  [5, 2, 7, 0, 6, 1, 3, 4],
  [3, 6, 1, 4, 0, 7, 2, 5],
];
const SEL = 6; // the take that gets selected / approved (TAKE 07)
const HOPS = [0, 1, 5, 6];

const tilePos = (i: number, f: number) => {
  const times = [A.reset, ...A.shuffle];
  const slots = [i, PERMS[0][i], PERMS[1][i], i];
  let k = -1;
  for (let j = 0; j < times.length; j++) if (f >= times[j]) k = j;
  const cur = slot(slots[k + 1]);
  if (k < 0) return cur;
  const prev = slot(slots[k]);
  const p = stepped(ramp(f, times[k], times[k] + 4, 0, 1, IN_OUT), 3);
  return {x: snap(prev.x + (cur.x - prev.x) * p), y: snap(prev.y + (cur.y - prev.y) * p - Math.sin(p * Math.PI) * 24)};
};

const BIG = [540, 960, 1380].map((cx) => ({x: cx - 150, y: 294, w: 300, h: 168}));
const COL = [0, 1, 2].map((i) => ({x: 96, y: 306 + i * 84, w: 300, h: 66}));

// ---------- pieces ----------
const Box: React.FC<{x: number; y: number; w: number; h: number; border: string; bg?: string; children?: React.ReactNode; style?: React.CSSProperties}> = ({
  x,
  y,
  w,
  h,
  border,
  bg = '#0d0d0d',
  children,
  style,
}) => (
  <div style={{position: 'absolute', left: snap(x), top: snap(y), width: snap(w), height: snap(h), clipPath: notch(), background: border, ...style}}>
    <div style={{position: 'absolute', left: P, top: P, right: P, bottom: P, clipPath: notch(), background: bg, boxShadow: 'inset -6px -6px 0 rgba(0,0,0,0.45)'}}>{children}</div>
  </div>
);

const Sky: React.FC<{f: number}> = ({f}) => (
  <>
    {STARS.map((s, i) => (Math.floor(f / 15) + s.ph) % 4 === 0 ? null : <div key={i} style={{position: 'absolute', left: s.x, top: s.y, width: s.s, height: s.s, background: i % 3 ? '#fff' : Y, opacity: s.a}} />)}
    <div style={{position: 'absolute', left: 0, top: HORIZON - 150, width: W, height: 150, background: 'linear-gradient(180deg, rgba(255,225,77,0) 0%, rgba(255,225,77,0.16) 100%)'}} />
    <div style={{position: 'absolute', left: 0, top: HORIZON - 3, width: W, height: 3, background: Y, boxShadow: '0 0 18px 2px rgba(255,225,77,0.7)'}} />
  </>
);

const Title: React.FC<{f: number}> = ({f}) => {
  if (f < 14 || f >= 112) return null;
  // drop in, land on the impact frame, small stepped bounce
  const drop = f < A.title ? snap(-150 * ((A.title - f) / 6) ** 1.6, 12) : f < A.title + 2 ? 12 : f < A.title + 4 ? -6 : 0;
  const flash = f >= A.title && f < A.title + 4;
  const wipe = f >= 100 ? stepped(ramp(f, 100, 110, 0, 1, (t) => t), 5) : 0; // rows vanish bottom-up
  const showWord = f >= A.title - 6;
  const ext = ['#3a1505', '#B4441A', '#FF9F1C'];
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 540, clipPath: `inset(0 0 ${wipe * 310}px 0)`}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 246, textAlign: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: '0.4em', color: Y, opacity: f < 18 ? 0 : 1}}>
        06 / 09
      </div>
      {showWord ? (
        <div style={{position: 'absolute', left: 384, top: 300 + drop}}>
          {ext.map((c, i) => (
            <PixelText key={c} size={96} color={c} glow={0} style={{position: 'absolute', left: (3 - i) * 6, top: (3 - i) * 6}}>
              VOICE ARCADE
            </PixelText>
          ))}
          <PixelText size={96} color={flash ? '#fff' : Y} glow={0.7} style={{position: 'relative'}}>
            VOICE ARCADE
          </PixelText>
        </div>
      ) : null}
      {f >= 48 && blink(f - 48, 15) ? (
        <PixelText size={32} color="#fff" glow={0.35} style={{position: 'absolute', left: 0, right: 0, top: 474, textAlign: 'center'}}>
          INSERT VOICE
        </PixelText>
      ) : null}
    </div>
  );
};

const Stages: React.FC<{f: number}> = ({f}) => {
  if (f < 112) return null;
  const p = stepped(ramp(f, A.grid - 8, A.grid + 10, 0, 1, IN_OUT), 6); // big map → docked column
  const col = p >= 0.5;
  const at = lastAt(A.stages, f);
  return (
    <>
      <PixelText size={24} style={{position: 'absolute', left: col ? 96 : 0, right: col ? undefined : 0, top: col ? 258 : 198, textAlign: col ? 'left' : 'center'}}>
        {col ? 'STAGES' : 'STAGE MAP'}
      </PixelText>
      {/* dotted path with arrowheads (map only) */}
      {p === 0
        ? [0, 1].map((i) => {
            const x0 = BIG[i].x + BIG[i].w + 18;
            const x1 = BIG[i + 1].x - 30;
            const lit = at > i;
            const dots: React.ReactNode[] = [];
            for (let x = x0; x <= x1 - 6; x += 18) dots.push(<div key={x} style={{position: 'absolute', left: snap(x), top: 372, width: P, height: P, background: lit ? Y : DIM}} />);
            return (
              <React.Fragment key={i}>
                {dots}
                <Sprite art={ART.arrow} x={x1} y={363} pal={{Y: lit ? Y : DIM}} />
              </React.Fragment>
            );
          })
        : null}
      {[0, 1, 2].map((i) => {
        const b = BIG[i];
        const c = COL[i];
        const show = f >= 114 + i * 2;
        if (!show) return null;
        const r = {x: b.x + (c.x - b.x) * p, y: b.y + (c.y - b.y) * p, w: b.w + (c.w - b.w) * p, h: b.h + (c.h - b.h) * p};
        const done = i < at || (i === 2 && f >= A.approve);
        const cur = i === at && !done;
        const border = done ? G : cur ? (blink(f, 8) ? Y : '#b89a1c') : DIM;
        const ink = done ? G : cur ? Y : '#8a8a8a';
        return (
          <Box key={i} {...r} border={border} bg={cur ? '#1c1700' : '#0d0d0d'}>
            {col ? (
              <>
                <PixelText size={24} color={ink} glow={cur ? 0.5 : 0} style={{position: 'absolute', left: 18, top: 15}}>
                  STAGE {i + 1}
                </PixelText>
                {done ? <Sprite art={ART.check} x={c.w - 72} y={18} /> : null}
              </>
            ) : (
              <>
                <PixelText size={24} color={ink} glow={0} style={{position: 'absolute', left: 0, right: 0, top: 24, textAlign: 'center'}}>
                  STAGE
                </PixelText>
                <PixelText size={64} color={ink} glow={cur ? 0.6 : 0} style={{position: 'absolute', left: 0, right: 0, top: 66, textAlign: 'center'}}>
                  {i + 1}
                </PixelText>
                {done ? <Sprite art={ART.check} x={b.w - 66} y={b.h - 54} /> : null}
              </>
            )}
          </Box>
        );
      })}
      {/* stage cursor: drops onto STAGE 1, hops to 2 and 3 on the beat */}
      {p === 0 && f >= 112 ? <StageCursor f={f} /> : null}
    </>
  );
};

const StageCursor: React.FC<{f: number}> = ({f}) => {
  const cx = (i: number) => BIG[i].x + BIG[i].w / 2 - 27;
  const baseY = 294 - 48;
  let x = cx(0);
  let y = baseY - snap(Math.max(0, A.stages[0] - f) * 14);
  for (let i = 1; i < 3; i++) {
    const s = A.stages[i];
    if (f >= s - 8 && f < s) {
      const t = (f - (s - 8)) / 8;
      x = cx(i - 1) + (cx(i) - cx(i - 1)) * t;
      y = baseY - Math.sin(t * Math.PI) * 60;
    } else if (f >= s) x = cx(i);
  }
  const bob = f >= A.stages[0] && blink(f, 15) ? 0 : 6;
  return <Sprite art={ART.marker} x={x} y={y + (f >= A.stages[0] ? bob : 0)} />;
};

const Grid: React.FC<{f: number}> = ({f}) => {
  if (f < A.grid) return null;
  const header = 'SELECT YOUR TAKE';
  const chars = Math.min(header.length, Math.floor((f - A.grid) / 1.5));
  const selected = f >= A.select && f < A.reset;
  const approved = f >= A.approve && f < A.reset;
  const shuffling = f >= A.reset && f < A.shuffle[1] + 6;
  const hop = lastAt(A.hops, f);
  const hover = f >= A.hops[0] && f < A.reset ? HOPS[hop] : f >= A.home ? 0 : -1;
  return (
    <>
      <PixelText size={32} style={{position: 'absolute', left: 0, right: 0, top: 228, textAlign: 'center'}}>
        {f >= A.approve && f < A.approve + 54 ? '' : header.slice(0, chars).padEnd(header.length, ' ')}
      </PixelText>
      {Array.from({length: 8}, (_, i) => {
        if (f < A.grid + 2 + i * 2) return null;
        const pos = tilePos(i, f);
        const isSel = i === SEL && selected;
        const isApp = i === SEL && approved;
        const isHover = i === hover && !shuffling;
        const fresh = f < A.grid + 4 + i * 2;
        const border = fresh || shuffling ? '#fff' : isApp ? G : isSel || isHover ? Y : DIM;
        const lift = isHover || isSel ? -6 : 0;
        const barC = isApp ? G : isSel ? Y : null;
        return (
          <Box key={i} x={pos.x} y={pos.y + lift} w={TILE.w} h={TILE.h} border={border} bg={isSel ? '#1f1a00' : '#0d0d0d'}>
            <svg width={102} height={36} shapeRendering="crispEdges" style={{position: 'absolute', left: 45, top: 12}}>
              {WAVES[i].map((hh, b) => (
                <rect key={b} x={b * 12} y={(36 - hh) / 2 - ((36 - hh) / 2) % 6} width={6} height={hh} fill={isApp ? G : isSel || isHover ? Y : '#9a9a9a'} />
              ))}
            </svg>
            <div style={{position: 'absolute', left: 0, right: 0, top: 60, height: 42, background: barC ?? 'transparent'}} />
            <PixelText size={24} color={barC ? '#000' : isHover ? Y : '#cfcfcf'} glow={0} style={{position: 'absolute', left: 0, right: 0, top: 69, textAlign: 'center'}}>
              TAKE 0{i + 1}
            </PixelText>
            {isApp ? <Sprite art={ART.check} x={150} y={12} /> : null}
          </Box>
        );
      })}
      <TakeCursor f={f} />
      <Buttons f={f} />
    </>
  );
};

const TakeCursor: React.FC<{f: number}> = ({f}) => {
  const on = (f >= A.hops[0] && f < A.reset) || f >= A.home;
  if (!on) return null;
  const tip = (i: number) => {
    const s = slot(i);
    return {x: s.x + TILE.w - 30, y: s.y + TILE.h - 18};
  };
  let p = tip(f >= A.home ? 0 : HOPS[0]);
  if (f < A.reset) {
    for (let i = 1; i < 4; i++) {
      const h = A.hops[i];
      const a = tip(HOPS[i - 1]);
      const b = tip(HOPS[i]);
      if (f >= h - 5 && f < h) {
        const t = (f - (h - 5)) / 5;
        p = {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 30};
      } else if (f >= h) p = b;
    }
  }
  const press = [A.select, A.approve].some((e) => f >= e && f < e + 5) ? 6 : 0;
  return <Sprite art={ART.cursor} x={p.x + press} y={p.y + press} />;
};

const BTN: [string, number][] = [
  ['SELECT', A.select],
  ['APPROVE', A.approve],
  ['RESET', A.reset],
];
const Buttons: React.FC<{f: number}> = ({f}) => {
  if (f < A.grid + 18) return null;
  const widths = BTN.map(([t]) => t.length * 24 + 60);
  let x = 960 - (widths.reduce((a, b) => a + b, 0) + 24 * 2) / 2;
  return (
    <>
      {BTN.map(([t, at], i) => {
        const bx = x;
        x += widths[i] + 24;
        const hot = f >= at && f < at + 14;
        const down = f >= at && f < at + 4 ? 6 : 0;
        return (
          <Box key={t} x={bx} y={588 + down} w={widths[i]} h={54} border={hot ? Y : '#5a5a5a'} bg={hot ? Y : '#111'}>
            <PixelText size={24} color={hot ? '#000' : '#bdbdbd'} glow={0} style={{position: 'absolute', left: 0, right: 0, top: 9, textAlign: 'center'}}>
              {t}
            </PixelText>
          </Box>
        );
      })}
    </>
  );
};

const Tools: React.FC<{f: number}> = ({f}) => {
  if (f < A.grid + 4) return null;
  const dx = snap(300 * (1 - stepped(ramp(f, A.grid + 4, A.grid + 16, 0, 1, (t) => t), 4)));
  const icons = [ART.wrench, ART.sliders, ART.lens];
  return (
    <div style={{position: 'absolute', left: dx, top: 0, width: W, height: H}}>
      <PixelText size={24} style={{position: 'absolute', left: 1524, top: 258}}>
        TOOLS
      </PixelText>
      <PixelText size={16} color={blink(f, 30) ? '#9a9a9a' : '#5a5a5a'} glow={0} style={{position: 'absolute', left: 1680, top: 262}}>
        OPTIONAL
      </PixelText>
      {icons.map((art, i) => (
        <Box key={i} x={1524 + i * 108} y={306} w={84} h={84} border={DIM} bg="#0d0d0d">
          <Sprite art={art} x={12} y={12} />
        </Box>
      ))}
      <div style={{position: 'absolute', left: 1518, top: 402, width: 312, height: 12, background: Y, boxShadow: 'inset 0 -6px 0 #9a7a10, 0 0 14px rgba(255,225,77,0.5)'}} />
      {[0, 1].map((i) => (
        <div key={i} style={{position: 'absolute', left: 1530 + i * 276, top: 414, width: 12, height: 30, background: '#9a7a10'}} />
      ))}
    </div>
  );
};

const Coin: React.FC<{f: number}> = ({f}) => {
  const t = f - A.select;
  if (t < 0 || t >= 30 || (t >= 20 && blink(t, 2))) return null;
  const s = slot(SEL);
  const rise = snap(170 * (1 - (1 - Math.min(1, t / 18)) ** 3));
  return <Sprite art={ART.coin[Math.floor(t / 3) % 4]} x={s.x + TILE.w / 2 - 24} y={s.y + 30 - rise} />;
};

const PowerUp: React.FC<{f: number}> = ({f}) => {
  const t = f - A.approve;
  if (t < 0 || t >= 54) return null;
  const s = slot(SEL);
  const cx = s.x + TILE.w / 2;
  const cy = s.y + TILE.h / 2;
  const stars: React.ReactNode[] = [];
  if (t < 30) {
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + 0.3;
      const d = 30 + 210 * (1 - (1 - t / 30) ** 2);
      if (t > 18 && blink(t + k, 2)) continue;
      stars.push(<Sprite key={k} art={ART.star} x={cx + Math.cos(a) * d - 15} y={cy + Math.sin(a) * d * 0.7 - 15} />);
    }
  }
  const showBanner = t < 12 ? blink(t, 3) : true;
  return (
    <>
      {stars}
      {showBanner ? (
        <Box x={960 - 252} y={198} w={504} h={90} border={G} bg="#061a0d" style={{boxShadow: '0 0 30px rgba(30,215,96,0.5)'}}>
          <PixelText size={48} color={G} glow={0} style={{position: 'absolute', left: 0, right: 0, top: 15, textAlign: 'center', textShadow: '0 0 16px rgba(30,215,96,0.8)'}}>
            APPROVED
          </PixelText>
        </Box>
      ) : null}
    </>
  );
};

// Everything on the CRT, in 1920×1080 screen coordinates.
const Picture: React.FC<{f: number}> = ({f}) => {
  const flash = [0.85, 0.85, 0.55, 0.55, 0.3, 0.3, 0.12, 0.12][f - A.approve] ?? 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sky f={f} />
      <Floor scroll={integ(SCROLL, f)} />
      <Title f={f} />
      <Stages f={f} />
      <Tools f={f} />
      <Grid f={f} />
      <Coin f={f} />
      <PowerUp f={f} />
      {flash > 0 ? <AbsoluteFill style={{background: '#fffbe6', opacity: flash}} /> : null}
    </AbsoluteFill>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  // entrance: the framework portal opens a CRT band on the boundary; the screen starts as warm phosphor glow
  const glow = 1 - ramp(f, 3, 24, 0, 1, IN_OUT);
  // exit: picture collapses to a bright line, which splits into the Evolution grating
  const squash = ramp(f, A.collapse, A.line, 0, 1, (t) => t * t);
  const white = ramp(f, A.collapse + 4, A.line, 0, 1, (t) => t * t);
  const split = ramp(f, 480, 492, 0, 1, EXPO); // the framework portal takes over on the boundary; this only shows solo
  const lineCol = interpolateColors(split, [0, 1], ['#ffffff', ACCENT.evolution]);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <CrtScreen w={W} glow={glow} bezel={1} lines={0.16}>
        <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
          {f < A.line ? (
            <AbsoluteFill style={{transform: `scale(${1 - 0.08 * squash}, ${1 - 0.994 * squash})`, filter: squash > 0 ? `brightness(${1 + 1.6 * squash})` : undefined}}>
              <Picture f={f} />
              {white > 0 ? <AbsoluteFill style={{background: '#fff', opacity: white}} /> : null}
            </AbsoluteFill>
          ) : null}
          {f >= A.line - 2
            ? Array.from({length: 46}, (_, i) => {
                const base = 540 + (i - 22.5) * 23.4;
                const yy = 540 + (base - 540) * split;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: 0,
                      width: W,
                      top: yy - 1.5,
                      height: 3,
                      background: lineCol,
                      opacity: split > 0 ? 1 : i === 22 ? 1 : 0,
                      boxShadow: split < 0.6 ? `0 0 ${18 * (1 - split)}px rgba(255,255,255,0.8)` : undefined,
                    }}
                  />
                );
              })
            : null}
        </div>
      </CrtScreen>
    </AbsoluteFill>
  );
};
