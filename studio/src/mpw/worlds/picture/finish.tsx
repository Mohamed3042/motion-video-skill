// Quick tool beats in one viewer (FILM FINISH, FLICKER REDUCTION, IMAGE RESTORATION, SCALE & MOTION,
// TITLE & LOWER THIRD), then the exit: the viewer becomes one frame of a film strip, and the strip's frames
// slide off into Library's grid of thumbnails.
import React from 'react';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {mulberry32} from '../../timing';
import {Board} from './checker';
import {Btn, Chip, Eyebrow, Panel, RGB, Select, Slider, ToolLabel, VIO, clamp, ease, mix, prog, rgba} from './kit';
import {FILM, MAST, Mosaic, REF, SRC, SUN, SW, Scene, mixPal} from './scene';
import {T} from './timing';

const VX = 200;
const VY = 184;
const VW = 1120;
const VH = 630;
const K = VW / SW; // scene → viewer scale

// ---------------------------------------------------------------- per-beat image layers ----
const Grain: React.FC<{f: number; w: number; h: number; o: number; color?: boolean; freq?: number; uid: string}> = ({f, w, h, o, color, freq = 0.8, uid}) => {
  if (o <= 0) return null;
  const seed = Math.floor(f / 2);
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, opacity: o, mixBlendMode: color ? 'normal' : 'overlay'}}>
      <filter id={`gr${uid}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={seed} stitchTiles="stitch" />
        {color ? <feColorMatrix type="matrix" values="1.6 0 0 0 -0.3  0 1.6 0 0 -0.3  0 0 1.6 0 -0.3  0 0 0 0 1" /> : <feColorMatrix type="saturate" values="0" />}
      </filter>
      <rect x={0} y={0} width={w} height={h} filter={`url(#gr${uid})`} />
    </svg>
  );
};

// red halation around the highlights (sun, its reflection, the mast light)
const Halation: React.FC<{k: number}> = ({k}) => {
  if (k <= 0) return null;
  const blob = (x: number, y: number, r: number, a: number, key: string) => (
    <div key={key} style={{position: 'absolute', left: x * K - r, top: y * K - r, width: 2 * r, height: 2 * r, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,70,40,0) 30%, rgba(255,70,40,${0.55 * a}) 42%, rgba(255,60,30,${0.18 * a}) 62%, rgba(255,60,30,0) 76%)`}} />
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: k, mixBlendMode: 'screen'}}>
      {blob(SUN.x, SUN.y, 150, 1, 's')}
      {blob(MAST.x, 512 + 0.0011 * (MAST.x - 260) ** 2 - MAST.h - 6, 34, 0.9, 'm')}
      <div style={{position: 'absolute', left: SUN.x * K - 120, top: 650 * K, width: 240, height: 170, borderRadius: '50%', background: 'radial-gradient(50% 50% at 50% 40%, rgba(255,80,40,0.42) 0%, rgba(255,60,30,0) 100%)'}} />
    </div>
  );
};

// irregular exposure flicker: a value held for 3–6 frames, fading out as Flicker Reduction evens it
const FLICK = (() => {
  const r = mulberry32(8100);
  const out: number[] = [];
  let v = 0;
  let hold = 0;
  for (let i = 0; i < 80; i++) {
    if (hold <= 0) {
      v = r();
      hold = 3 + Math.floor(r() * 4);
    }
    out.push(v);
    hold--;
  }
  return out;
})();
export const flickerAt = (f: number) => {
  if (f < T.flicker || f >= T.restore) return 0;
  const a = 1 - ease.inOut(prog(f, T.even - 14, T.even));
  return a * FLICK[Math.min(FLICK.length - 1, Math.floor(f - T.flicker))];
};

const LowerThird: React.FC<{f: number; at: number; scale?: number}> = ({f, at, scale = 1}) => {
  const k = ease.expoOut(prog(f, at, at + 18));
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 56 * scale, top: VH * scale - 170 * scale, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      <div style={{display: 'flex', alignItems: 'stretch', clipPath: `inset(0 ${(1 - k) * 100}% 0 0)`, background: 'rgba(16,18,17,0.88)', borderRadius: 6}}>
        <div style={{width: 8, background: C.amber, borderRadius: '6px 0 0 6px'}} />
        <div style={{padding: '16px 34px 16px 24px'}}>
          <div style={{fontFamily: FONT, fontWeight: 650, fontSize: 44, color: C.text, lineHeight: 1.05}}>Episode 2</div>
          <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 18, letterSpacing: '0.18em', color: C.amber, marginTop: 8}}>TAKE 03 · CAM A</div>
        </div>
      </div>
    </div>
  );
};

// the viewer's picture at frame f (full viewer size)
const ViewerImage: React.FC<{f: number}> = ({f}) => {
  const film = ease.inOut(prog(f, T.finish + 12, T.finish + 40));
  const pal = f < T.flicker ? mixPal(REF, FILM, film) : FILM;
  const grain = f < T.flicker ? 0.5 * film : 0;
  const hal = f < T.flicker ? film : f < T.title ? 0.35 : 0.35;
  const fl = flickerAt(f);
  // restoration: noisy until a before/after divider sweeps clean
  const clean = ease.inOut(prog(f, T.restore + 16, T.restore + 44));
  const noisy = f >= T.restore && f < T.scale;
  // scale & motion: low-res mosaic until the band resolves it on T.crisp
  const crisp = ease.inOut(prog(f, T.crisp - 14, T.crisp));
  const mosaic = f >= T.scale && f < T.crisp;
  const pop = f >= T.crisp && f < T.crisp + 20 ? Math.exp(-(f - T.crisp) / 6) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#000'}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 0.012 * pop})`}}>
        <Scene p={pal} w={VW} h={VH} uid="vw" />
      </div>
      <Halation k={hal} />
      <Grain f={f} w={VW} h={VH} o={grain} uid="fg" freq={0.9} />
      {fl > 0 ? <div style={{position: 'absolute', inset: 0, background: '#000', opacity: 0.34 * fl}} /> : null}
      {noisy ? (
        <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${clean * 100}%)`}}>
          <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)'}} />
          <Grain f={f} w={VW} h={VH} o={0.42} color uid="nz" freq={0.55} />
          <Grain f={f + 1} w={VW} h={VH} o={0.9} uid="nz2" freq={0.6} />
        </div>
      ) : null}
      {noisy && clean > 0 && clean < 1 ? (
        <>
          <div style={{position: 'absolute', left: clean * VW - 1.5, top: 0, width: 3, height: VH, background: C.amber}} />
          <div style={{position: 'absolute', left: clean * VW - 96, top: 24}}>
            <Chip style={{background: 'rgba(16,18,17,0.8)'}}>After</Chip>
          </div>
          <div style={{position: 'absolute', left: clean * VW + 16, top: 24}}>
            <Chip style={{background: 'rgba(16,18,17,0.8)'}}>Before</Chip>
          </div>
        </>
      ) : null}
      {mosaic ? (
        <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${crisp * 100}%)`}}>
          <Mosaic p={FILM} w={VW} h={VH} n={36} />
        </div>
      ) : null}
      {mosaic && crisp > 0 ? (
        <div style={{position: 'absolute', left: crisp * VW - 90, top: 0, width: 180, height: VH, mixBlendMode: 'screen'}}>
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${rgba(VIO, 0.25)} 45%, rgba(255,255,255,0.3) 50%, ${rgba(VIO, 0.25)} 55%, rgba(0,0,0,0) 100%)`}} />
          {RGB.map((c, i) => (
            <div key={i} style={{position: 'absolute', left: 90 + (i - 1) * 5 - 1.5, top: 0, width: 3, height: VH, background: c, boxShadow: `0 0 10px ${c}`}} />
          ))}
        </div>
      ) : null}
      {pop > 0 ? <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0.16 * pop, mixBlendMode: 'screen'}} /> : null}
      {f >= T.title ? <LowerThird f={f} at={T.render + 4} /> : null}
    </div>
  );
};

// ---------------------------------------------------------------- the tool panel (one per beat) ----
const BEATS = [
  {at: T.finish, name: 'FILM FINISH', family: 'Finish', line: 'Shape contrast, color and grain.'},
  {at: T.flicker, name: 'FLICKER REDUCTION', family: 'Picture', line: 'Smooth changing brightness.'},
  {at: T.restore, name: 'IMAGE RESTORATION', family: 'Picture', line: 'Reduce noise. Keep the detail.'},
  {at: T.scale, name: 'SCALE & MOTION', family: 'Picture', line: 'Resize, enhance or change frame rate.'},
  {at: T.title, name: 'TITLE & LOWER THIRD', family: 'Finish', line: 'Add a clean title or lower third.'},
];
const beatOf = (f: number) => BEATS.reduce((b, x, i) => (f >= x.at ? i : b), 0);

const LumaGraph: React.FC<{f: number}> = ({f}) => {
  const W = 412;
  const Hh = 96;
  const n = Math.max(0, Math.min(59, f - T.flicker));
  let d = '';
  for (let k = 0; k <= n; k++) d += `${k ? 'L' : 'M'}${((k / 59) * W).toFixed(1)} ${(26 + 48 * flickerAt(T.flicker + k)).toFixed(1)}`;
  return (
    <svg width={W} height={Hh} style={{display: 'block'}}>
      <rect x={0} y={0} width={W} height={Hh} rx={6} fill="#0a0c0b" stroke={C.line} />
      <line x1={0} x2={W} y1={26} y2={26} stroke="rgba(235,234,226,0.08)" />
      <path d={d} fill="none" stroke={f >= T.even ? C.success : C.amber} strokeWidth={2.5} strokeLinejoin="round" />
      <text x={10} y={Hh - 10} fontFamily={MONO} fontSize={12} letterSpacing="0.12em" fill={C.muted}>
        LUMA OVER TIME
      </text>
    </svg>
  );
};

const ToolPanel: React.FC<{f: number}> = ({f}) => {
  const b = beatOf(f);
  const B = BEATS[b];
  const cut = ease.expoOut(prog(f, B.at, B.at + 10));
  const after = (on: number) => (
    <div style={{display: 'flex', gap: 8}}>
      <Chip on={on < 0.5}>Before</Chip>
      <Chip on={on >= 0.5}>After</Chip>
    </div>
  );
  let body: React.ReactNode = null;
  if (b === 0) {
    const k = ease.inOut(prog(f, T.finish + 12, T.finish + 40));
    body = (
      <>
        <Slider label="Grain strength" v={0.12 + 0.4 * k} w={412} />
        <div style={{height: 26}} />
        <Slider label="Halation strength" v={0.1 + 0.5 * k} w={412} />
        <div style={{height: 34}} />
        {after(k)}
      </>
    );
  } else if (b === 1) {
    body = (
      <>
        <LumaGraph f={f} />
        <div style={{height: 26}} />
        <Slider label="Analysis window (frames)" v={0.45} w={412} />
        <div style={{height: 34}} />
        {after(prog(f, T.even - 14, T.even))}
      </>
    );
  } else if (b === 2) {
    const k = ease.inOut(prog(f, T.restore + 16, T.restore + 44));
    body = (
      <>
        <div style={{display: 'flex', gap: 8}}>
          <Chip on>Spatial</Chip>
          <Chip on>Temporal</Chip>
        </div>
        <div style={{height: 28}} />
        <Slider label="Noise reduction" v={0.15 + 0.5 * k} w={412} />
        <div style={{height: 34}} />
        {after(k)}
      </>
    );
  } else if (b === 3) {
    body = (
      <>
        <Select label="Processor" value="Montage native" w={412} />
        <div style={{height: 22}} />
        <Select label="Frame rate" value="Source" w={412} />
        <div style={{height: 34}} />
        {after(f >= T.crisp ? 1 : 0)}
      </>
    );
  } else {
    body = (
      <>
        <div style={{fontFamily: FONT, fontSize: 17, color: C.muted, marginBottom: 8}}>Title text</div>
        <div style={{height: 42, borderRadius: 6, background: C.raised, border: `1px solid ${C.amber}`, display: 'flex', alignItems: 'center', padding: '0 14px', fontFamily: FONT, fontSize: 18, color: C.text}}>Episode 2</div>
        <div style={{height: 22}} />
        <Slider label="Text size" v={0.5} w={412} />
        <div style={{height: 30}} />
        <Btn label="Render title" f={f} press={T.render} w={412} />
      </>
    );
  }
  return (
    <Panel x={1380} y={VY} w={468} h={VH} o={ease.cubicOut(prog(f, T.w4 - 4, T.w4 + 12)) * (1 - prog(f, T.exit - 6, T.exit + 6))}>
      <div style={{position: 'absolute', left: 28, top: 26, opacity: cut, transform: `translateY(${(1 - cut) * 10}px)`}}>
        <Eyebrow>{`${B.family} · ${B.name}`}</Eyebrow>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 24, color: C.text, marginTop: 10, width: 412}}>{B.line}</div>
      </div>
      <div style={{position: 'absolute', left: 28, top: 150, opacity: cut}}>{body}</div>
      {/* the five beats as a stepper */}
      <div style={{position: 'absolute', left: 28, bottom: 26, display: 'flex', gap: 6}}>
        {BEATS.map((x, i) => (
          <div key={i} style={{width: 76, height: 4, borderRadius: 2, background: i < b ? rgba(C.amber, 0.45) : i === b ? C.amber : C.line}} />
        ))}
      </div>
    </Panel>
  );
};

// ---------------------------------------------------------------- exit: film strip → thumbnail grid ----
const FW = 400;
const FH = 225;
const PITCH = 424;
const CELL = {w: 300, h: 169, gx: 24, gy: 48};
const GRID_X = (1920 - (5 * CELL.w + 4 * CELL.gx)) / 2;
const GRID_Y = 540 - (3 * CELL.h + 2 * CELL.gy) / 2 - 10;
const cellXY = (c: number) => [GRID_X + (c % 5) * (CELL.w + CELL.gx) + CELL.w / 2, GRID_Y + Math.floor(c / 5) * (CELL.h + CELL.gy) + CELL.h / 2];
// strip frame i (−4..4) → grid cell; i = 0 is the viewer itself and lands in the centre
const CELL_OF = [0, 3, 5, 6, 7, 8, 9, 11, 14];
const POP_CELLS = [1, 2, 4, 10, 12, 13];
const NAMES = ['A001_C003', 'A001_C007', 'B002_C001', 'TAKE 03', 'A002_C011', 'B001_C004', 'A003_C002', 'EPISODE 2', 'B003_C009', 'A004_C001', 'A001_C012', 'B002_C006', 'A005_C003', 'B004_C002', 'A002_C005'];

const MiniChecker: React.FC<{w: number; h: number; uid: string}> = ({w, h, uid}) => {
  const s = w / 1150;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: C.canvas}}>
      <div style={{position: 'absolute', left: w / 2 - 800 * s, top: h / 2 - 560 * s, width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: '0 0'}}>
        <Board uid={uid} />
      </div>
    </div>
  );
};
const MiniStripes: React.FC<{w: number; h: number}> = ({w, h}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: w / 2 - w, top: h / 2 - w, width: 2 * w, height: 2 * w, transform: 'rotate(-45deg)', background: `repeating-linear-gradient(180deg, #e8413c 0px, #e8413c 12px, #f1ede6 12px, #f1ede6 24px, #3a5fd9 24px, #3a5fd9 36px, #f1ede6 36px, #f1ede6 48px)`}} />
  </div>
);
const MiniStab: React.FC<{w: number; h: number}> = ({w, h}) => (
  <div style={{position: 'absolute', inset: 0, background: '#141615'}}>
    <div style={{position: 'absolute', left: w * 0.12, top: h * 0.14, right: w * 0.12, bottom: h * 0.14, border: `2px solid ${rgba(C.text, 0.8)}`, borderRadius: 3}} />
    <div style={{position: 'absolute', left: w / 2 - 6, top: h / 2 - 6, width: 12, height: 12, borderRadius: 6, background: '#f3e8ff', boxShadow: `0 0 18px ${VIO}`}} />
  </div>
);
const MiniPlanar: React.FC<{w: number; h: number}> = ({w, h}) => (
  <div style={{position: 'absolute', inset: 0, background: C.canvas, perspective: 600}}>
    <div style={{position: 'absolute', left: w * 0.18, top: h * 0.18, width: w * 0.64, height: h * 0.64, background: 'linear-gradient(135deg, #2a1c44, #4b2f6a)', border: `2px solid ${C.amber}`, transform: 'rotateY(-24deg) rotateX(8deg)'}}>
      <div style={{position: 'absolute', left: '8%', bottom: '12%', width: '55%', height: '24%', background: 'rgba(16,18,17,0.9)', borderLeft: `4px solid ${C.amber}`}} />
    </div>
  </div>
);
const thumb = (i: number, w: number, h: number) => {
  switch (i) {
    case 0:
      return <MiniChecker w={w} h={h} uid={`mc${i}`} />;
    case 1:
      return <Scene p={SRC} w={w} h={h} uid={`t${i}`} />;
    case 2:
      return <MiniStripes w={w} h={h} />;
    case 3:
      return <MiniPlanar w={w} h={h} />;
    case 4:
      return <MiniStab w={w} h={h} />;
    case 5:
      return <Scene p={REF} w={w} h={h} uid={`t${i}`} />;
    case 6:
      return <Mosaic p={FILM} w={w} h={h} n={20} />;
    case 7:
      return <Scene p={mixPal(REF, SRC, 0.5)} w={w} h={h} uid={`t${i}`} />;
    default:
      return <Scene p={FILM} w={w} h={h} uid={`t${i}`} />;
  }
};
const STRIP_THUMB = [0, 1, 2, 3, -1, 4, 5, 6, 7]; // -1 = the live viewer
const POP_THUMB = [8, 5, 1, 7, 6, 2];

const Sprockets: React.FC<{o: number; x: number}> = ({o, x}) => {
  if (o <= 0) return null;
  const holes: React.ReactNode[] = [];
  const off = ((x % 32) + 32) % 32;
  for (let k = -2; k < 64; k++) {
    const hx = k * 32 + off;
    holes.push(<rect key={`t${k}`} x={hx} y={14} width={18} height={13} rx={3} fill="#2a2e2b" />);
    holes.push(<rect key={`b${k}`} x={hx} y={FH + 88 - 27} width={18} height={13} rx={3} fill="#2a2e2b" />);
  }
  return (
    <svg width={1920} height={FH + 88} style={{position: 'absolute', left: 0, top: 540 - FH / 2 - 44, opacity: o}}>
      <rect x={0} y={0} width={1920} height={FH + 88} fill="#050605" />
      {holes}
    </svg>
  );
};

const Exit: React.FC<{f: number}> = ({f}) => {
  const form = ease.inOut(prog(f, T.exit, T.exit + 16));
  const slide = -700 * ease.inOut(prog(f, T.exit + 4, T.exit + 36));
  const band = form * (1 - prog(f, 1066, 1082));
  const gridIn = prog(f, 1074, 1088);
  const depart = (i: number) => ease.inOut(prog(f, 1054 + (i + 4) * 2, 1072 + (i + 4) * 2));
  const frames: React.ReactNode[] = [];
  STRIP_THUMB.forEach((t, k) => {
    const i = k - 4;
    if (i === 0) return;
    const g = depart(i);
    const [gx, gy] = cellXY(CELL_OF[k]);
    const sx = 960 + i * PITCH + slide;
    const x = mix(sx, gx, g);
    const y = mix(540, gy, g);
    const s = mix(1, CELL.w / FW, g);
    const o = clamp(form * 1.4 - Math.abs(i) * 0.08);
    frames.push(
      <div key={k} style={{position: 'absolute', left: x - FW / 2, top: y - FH / 2, width: FW, height: FH, transform: `scale(${s})`, opacity: o, borderRadius: 4 + 2 * g, overflow: 'hidden', outline: g > 0.5 ? `${2 / s}px solid ${rgba(ACCENT.library, 0.9 * gridIn)}` : 'none'}}>
        {thumb(t, FW, FH)}
      </div>,
    );
  });
  POP_CELLS.forEach((c, k) => {
    const p = ease.expoOut(prog(f, 1068 + k * 2, 1084 + k * 2));
    if (p <= 0) return;
    const [x, y] = cellXY(c);
    frames.push(
      <div key={`p${k}`} style={{position: 'absolute', left: x - CELL.w / 2, top: y - CELL.h / 2, width: CELL.w, height: CELL.h, opacity: p, transform: `scale(${mix(0.8, 1, p)})`, borderRadius: 6, overflow: 'hidden', outline: `2px solid ${rgba(ACCENT.library, 0.9 * gridIn)}`}}>
        {thumb(POP_THUMB[k], CELL.w, CELL.h)}
      </div>,
    );
  });
  return (
    <>
      <Sprockets o={band} x={slide} />
      {frames}
      {/* clip names under each cell (Library grid) */}
      {gridIn > 0
        ? NAMES.map((n, c) => {
            const [x, y] = cellXY(c);
            return (
              <div key={c} style={{position: 'absolute', left: x - CELL.w / 2, top: y + CELL.h / 2 + 10, fontFamily: MONO, fontSize: 15, letterSpacing: '0.1em', color: c === 7 ? ACCENT.library : C.muted, opacity: gridIn}}>
                {n}
              </div>
            );
          })
        : null}
    </>
  );
};

// the live viewer: full size during the beats, then frame 0 of the strip, then the centre cell of the grid
const Viewer: React.FC<{f: number}> = ({f}) => {
  const form = ease.inOut(prog(f, T.exit, T.exit + 16));
  const slide = -700 * ease.inOut(prog(f, T.exit + 4, T.exit + 36));
  const g = ease.inOut(prog(f, 1062, 1080));
  const [gx, gy] = cellXY(7);
  const cx = mix(mix(VX + VW / 2, 960, form) + slide, gx, g);
  const cy = mix(mix(VY + VH / 2, 540, form), gy, g);
  const s = mix(mix(1, FW / VW, form), CELL.w / VW, g);
  const gridIn = prog(f, 1074, 1088);
  return (
    <div style={{position: 'absolute', left: cx - VW / 2, top: cy - VH / 2, width: VW, height: VH, transform: `scale(${s})`, borderRadius: 9, overflow: 'hidden', boxShadow: form < 1 ? '0 40px 100px rgba(0,0,0,0.6)' : 'none', outline: `${(g > 0.5 ? 2 : 1) / s}px solid ${g > 0.5 ? rgba(ACCENT.library, gridIn) : C.line}`}}>
      <ViewerImage f={f} />
    </div>
  );
};

export const Finishing: React.FC<{f: number}> = ({f}) => {
  return (
    <>
      <div style={{position: 'absolute', left: 100, top: 120, width: 1320, height: 840, background: `radial-gradient(50% 50% at 50% 50%, ${rgba(VIO, 0.1)} 0%, rgba(0,0,0,0) 70%)`, opacity: 1 - prog(f, T.exit, T.exit + 20)}} />
      {BEATS.map((x, i) => (
        <ToolLabel key={i} f={f} at={x.at + (i === 0 ? 6 : 0)} out={i < BEATS.length - 1 ? BEATS[i + 1].at : T.exit + 4} text={x.name} />
      ))}
      <ToolPanel f={f} />
      {f >= T.exit ? <Exit f={f} /> : null}
      <Viewer f={f} />
    </>
  );
};
