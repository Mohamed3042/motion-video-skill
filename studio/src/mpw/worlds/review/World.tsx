// World 3 · REVIEW (steel). Sync's four aligned tracks fold into a 2×2 multicam grid. The four tiles are four
// cameras on one stage; a light bar sweeps across all of them. As recorded, each camera runs at its own offset,
// so the bar jumps and breaks at every seam; as the offsets snap to zero (one per beat) it becomes one continuous
// motion (cross-frame continuity). Then the Review workspace: source thumbnails beside the synchronized picture,
// one shared amber playhead, one inspector with 1 ms nudges and Undo/Redo. Exit: the playhead becomes a caret.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO, RADIUS} from '../../brand';
import {useWorldFrame} from '../../frame';
import {mulberry32} from '../../timing';
import {Btn, Check, Chip, Glow, MonoLabel, Title, ease, mix, mixHex, panel, prog, pulse, rgba, sp} from './kit';
import {LOCKS, OFFSETS, T, beamsX} from './timing';

const ST = ACCENT.review;
const TW = 514;
const TH = 289;
const MW = 1040;
const MH = 590;
const TILES = [
  {x: 0, y: 0},
  {x: 526, y: 0},
  {x: 0, y: 301},
  {x: 526, y: 301},
];
const CAMS = ['CAM A', 'CAM B', 'CAM C', 'CAM D'];
const DOCK = {s: 1, tx: 364, ty: 186};
const HERO = {s: 0.84, tx: 1250 - 520 * 0.84, ty: 560 - 295 * 0.84};
const SLOPE = Math.tan((14 * Math.PI) / 180);

// camera offset (frames) at world frame f: snaps to 0 on its lock frame
const offAt = (i: number, f: number) => OFFSETS[i] * (1 - ease.inOut(prog(f, LOCKS[i] - 6, LOCKS[i])));
const locked = (i: number, f: number) => i === 0 || f >= LOCKS[i];

// ---------------------------------------------------------------- the stage all four cameras see ----
const Stage: React.FC<{t: number}> = ({t}) => {


  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: MW, height: MH, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0b1519 0%, #11212a 58%, #182d36 74.4%, #0a1215 74.6%, #070c0e 100%)'}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: MW, height: 440, background: `repeating-linear-gradient(90deg, ${rgba(ST, 0.07)} 0 2px, transparent 2px 104px)`}} />
      <div style={{position: 'absolute', left: 0, top: 440, width: MW, height: 150, background: `repeating-linear-gradient(90deg, ${rgba(ST, 0.04)} 0 1px, transparent 1px 52px)`}} />
      {/* two light bars half a sweep apart: wall wash, the bar with a trailing tail, a floor reflection */}
      {beamsX(t).map((x, k) => (
        <React.Fragment key={k}>
          <Glow x={x} y={250} w={560} h={520} color={ST} opacity={0.26} />
          <div
            style={{
              position: 'absolute',
              left: x - 330,
              top: -140,
              width: 400,
              height: MH + 280,
              transformOrigin: '330px 50%',
              transform: 'rotate(14deg)',
              background: `linear-gradient(90deg, ${rgba(ST, 0)} 0%, ${rgba(ST, 0.07)} 40%, ${rgba(ST, 0.16)} 66%, rgba(196,230,242,0.55) 78%, #f5fcff 80.5%, #f5fcff 84.5%, rgba(196,230,242,0.5) 87%, ${rgba(ST, 0.1)} 93%, ${rgba(ST, 0)} 100%)`,
            }}
          />
          <Glow x={x + SLOPE * (515 - MH / 2)} y={520} w={420} h={90} color="#cfeaf3" opacity={0.55} />
        </React.Fragment>
      ))}
      {/* silhouettes and a boom pole: static, so they line up across the seams in any state */}
      <svg width={MW} height={MH} style={{position: 'absolute', left: 0, top: 0}}>
        <path d="M70 46 L770 236" stroke="#05090b" strokeWidth={7} strokeLinecap="round" />
        <rect x={752} y={226} width={58} height={22} rx={11} transform="rotate(15 781 237)" fill="#05090b" />
        <circle cx={300} cy={236} r={40} fill="#05090b" />
        <path d="M222 590 L232 334 Q236 292 272 288 L328 288 Q364 292 368 334 L378 590 Z" fill="#05090b" />
        <path d="M600 470 H1010 V482 H600 Z M630 482 h10 v108 h-10 Z M970 482 h10 v108 h-10 Z" fill="#06090b" />
        <circle cx={812} cy={360} r={30} fill="#05090b" />
        <path d="M762 470 L768 424 Q772 396 796 394 L828 394 Q852 396 856 424 L862 470 Z" fill="#05090b" />
      </svg>
    </div>
  );
};

// one camera's view of the stage at its own time
const View: React.FC<{i: number; f: number}> = ({i, f}) => (
  <div style={{position: 'absolute', left: -TILES[i].x, top: -TILES[i].y}}>
    <Stage t={f + offAt(i, f)} />
  </div>
);

// Sync's track strips (the entrance shape): amber waveform lanes
const WAVE = (() => {
  const r = mulberry32(3030);
  return Array.from({length: 96}, (_, k) => 0.18 + 0.82 * Math.abs(Math.sin(k * 0.37 + 1.3)) * (0.35 + 0.65 * r()));
})();
const StripWave: React.FC<{color: string}> = ({color}) => (
  <svg width="100%" height="100%" viewBox="0 0 960 56" preserveAspectRatio="none" style={{position: 'absolute', inset: 0}}>
    {WAVE.map((a, k) => (
      <rect key={k} x={k * 10 + 2} y={28 - a * 22} width={5} height={a * 44} rx={2} fill={color} />
    ))}
  </svg>
);

// ---------------------------------------------------------------- the 2×2 grid ----
const Tile: React.FC<{i: number; f: number; group: {s: number; tx: number; ty: number}}> = ({i, f, group}) => {
  // entrance: Sync's track strip (screen space → grid space) narrows into its column, then opens into its tile
  const foldX = ease.inOut(prog(f, i * 2, 12 + i * 2));
  const fold = ease.inOut(prog(f, 9 + i * 2, 25 + i * 2));
  const sx = (240 - group.tx) / group.s;
  const sy = (380 + i * 84 - 26 - group.ty) / group.s;
  const sw = 1440 / group.s;
  const sh = 52 / group.s;
  const x = mix(sx, TILES[i].x, foldX);
  const w = mix(sw, TW, foldX);
  const y = mix(sy, TILES[i].y, fold);
  const h = mix(sh, TH, fold);
  const content = prog(f, 12 + i * 2, 28 + i * 2);
  const flash = i > 0 ? pulse(f, LOCKS[i], 26) : 0;
  const off = offAt(i, f);
  const isLocked = locked(i, f);
  const edge = mixHex(C.amber, '#2c3a40', fold);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        overflow: 'hidden',
        borderRadius: RADIUS.control,
        border: `1.5px solid ${flash > 0.02 ? mixHex(edge, '#e6f6fb', flash) : edge}`,
        boxShadow: flash > 0.02 ? `0 0 ${40 * flash}px ${rgba(ST, 0.7 * flash)}` : 'none',
        background: '#0a1013',
      }}
    >
      {fold < 1 ? (
        <div style={{position: 'absolute', inset: 0, background: rgba(C.amber, 0.14), opacity: 1 - prog(f, 10 + i * 2, 22 + i * 2)}}>
          <StripWave color={C.amber} />
        </div>
      ) : null}
      <div style={{position: 'absolute', inset: 0, opacity: content}}>
        <View i={i} f={f} />
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
        {flash > 0.02 ? <div style={{position: 'absolute', inset: 0, background: rgba(ST, 0.22 * flash)}} /> : null}
        <div style={{position: 'absolute', left: 12, top: 12, padding: '4px 9px', borderRadius: 4, background: 'rgba(5,9,11,0.72)', fontFamily: MONO, fontWeight: 700, fontSize: 15, letterSpacing: '0.1em', color: ST}}>
          {CAMS[i]}
        </div>
        <div style={{position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 4, background: 'rgba(5,9,11,0.72)', fontFamily: MONO, fontWeight: 700, fontSize: 14, letterSpacing: '0.08em', color: isLocked ? ST : C.muted}}>
          {i === 0 ? (
            'REFERENCE'
          ) : isLocked ? (
            <>
              <Check size={15} color={ST} width={10} />
              SYNCED
            </>
          ) : (
            `OFFSET ${off >= 0 ? '+' : '−'}${(Math.abs(off) / 60).toFixed(2)} s`
          )}
        </div>
      </div>
    </div>
  );
};

const Grid: React.FC<{f: number; dock: number; out: number}> = ({f, dock, out}) => {
  const g = {s: mix(HERO.s, DOCK.s, dock), tx: mix(HERO.tx, DOCK.tx, dock), ty: mix(HERO.ty, DOCK.ty, dock)};
  const lockAll = pulse(f, T.lockD, 40);
  const inSync = f >= T.lockD;
  const chipPop = sp(f, T.lockD, {damping: 10, stiffness: 260, mass: 0.6});
  const tc = 9 + Math.max(0, Math.min(f, T.exit) - T.dock) / 60;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(${g.tx}px, ${g.ty}px) scale(${g.s})`, opacity: 1 - out}}>
      {/* the seam cross lights up on the lock: one picture */}
      {lockAll > 0.02 ? (
        <>
          <div style={{position: 'absolute', left: 514, top: -10, width: 12, height: MH + 20, background: rgba(ST, 0.9 * lockAll), boxShadow: `0 0 40px ${rgba(ST, lockAll)}`}} />
          <div style={{position: 'absolute', left: -10, top: 289, width: MW + 20, height: 12, background: rgba(ST, 0.9 * lockAll), boxShadow: `0 0 40px ${rgba(ST, lockAll)}`}} />
        </>
      ) : null}
      {TILES.map((_, i) => (
        <Tile key={i} i={i} f={f} group={g} />
      ))}
      {/* header: status chip + the product's own preview label + shared timecode */}
      <div style={{position: 'absolute', left: 0, top: -48, width: MW, height: 34, display: 'flex', alignItems: 'center', gap: 18, opacity: prog(f, 20, 40)}}>
        <Chip color={inSync ? ST : C.muted} fill={inSync ? 0.16 + 0.3 * lockAll : 0.06} style={{transform: `scale(${inSync ? 1 + 0.18 * (1 - chipPop) : 1})`}}>
          {inSync ? <Check size={16} color={ST} width={10} /> : null}
          {inSync ? 'IN SYNC' : 'AS RECORDED'}
        </Chip>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 14, opacity: dock}}>
          <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.text}}>Multicamera preview</span>
          <span style={{fontFamily: FONT, fontWeight: 500, fontSize: 17, color: C.muted}}>Shared playhead · approximate preview</span>
        </div>
        <div style={{marginLeft: 'auto', fontFamily: MONO, fontWeight: 700, fontSize: 22, color: C.amber, opacity: dock}}>00:00:{tc.toFixed(3).padStart(6, '0')}</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- sources, inspector, timeline ----
const Sources: React.FC<{f: number; u: number}> = ({f, u}) => {
  const words = [
    ['Reference', C.muted],
    ['Strong', C.success],
    ['Strong', C.success],
    ['Needs review', C.amber],
  ];
  return (
    <div style={{...panel({left: 96, top: 186, width: 244, height: 590}), opacity: u, transform: `translateX(${(1 - u) * -60}px)`}}>
      <div style={{position: 'absolute', left: 18, top: 18, fontFamily: FONT, fontWeight: 700, fontSize: 17, letterSpacing: '0.08em', color: C.text}}>SOURCES</div>
      {CAMS.map((cam, i) => {
        const sel = i === 3;
        return (
          <div
            key={cam}
            style={{
              position: 'absolute',
              left: 10,
              top: 56 + i * 132,
              width: 222,
              height: 122,
              borderRadius: RADIUS.control,
              background: sel ? rgba(C.amber, 0.08) : C.raised,
              border: `1px solid ${sel ? rgba(C.amber, 0.75) : C.line}`,
            }}
          >
            <div style={{position: 'absolute', left: 10, top: 10, width: 112, height: 63, overflow: 'hidden', borderRadius: 4, background: '#0a1013'}}>
              <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `scale(${112 / TW})`}}>
                <View i={i} f={f} />
              </div>
            </div>
            <div style={{position: 'absolute', left: 132, top: 12, fontFamily: FONT, fontWeight: 600, fontSize: 19, color: C.text}}>{cam}</div>
            <div style={{position: 'absolute', left: 132, top: 40, fontFamily: MONO, fontWeight: 500, fontSize: 13, color: C.muted}}>Take 03</div>
            <div style={{position: 'absolute', left: 132, top: 58, fontFamily: MONO, fontWeight: 500, fontSize: 13, color: C.muted}}>0:28</div>
            <div style={{position: 'absolute', left: 12, top: 86, fontFamily: FONT, fontWeight: 600, fontSize: 16, color: locked(i, f) ? words[i][1] : rgba(C.muted, 0.6)}}>
              {locked(i, f) ? words[i][0] : 'As recorded'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Inspector: React.FC<{f: number; u: number}> = ({f, u}) => {
  const val = f < T.nudgeMinus ? '0' : f < T.nudgePlus ? '−1' : f < T.undo ? '0' : f < T.redo ? '−1' : '0';
  const changes = [T.nudgeMinus, T.nudgePlus, T.undo, T.redo];
  const fieldFlash = changes.reduce((m, a) => Math.max(m, pulse(f, a, 20)), 0);
  const rows = [
    ['CAM A', 'Reference', C.muted],
    ['CAM B', 'Strong', C.success],
    ['CAM C', 'Strong', C.success],
    ['CAM D', 'Needs review', C.amber],
  ];
  const sep = (top: number) => <div style={{position: 'absolute', left: 22, right: 22, top, height: 1, background: C.line}} />;
  return (
    <div style={{...panel({left: 1428, top: 186, width: 420, height: 590}), opacity: u, transform: `translateX(${(1 - u) * 60}px)`}}>
      <div style={{position: 'absolute', left: 24, top: 20, fontFamily: FONT, fontWeight: 650, fontSize: 23, color: C.text}}>Clip</div>
      <Chip color={C.amber} style={{position: 'absolute', right: 22, top: 18}}>CAM D</Chip>
      {sep(66)}
      {rows.map(([cam, word, col], i) => (
        <div key={cam} style={{position: 'absolute', left: 24, right: 24, top: 82 + i * 38, height: 30, display: 'flex', alignItems: 'center'}}>
          <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 16, color: i === 3 ? C.text : C.muted}}>{cam}</span>
          <span style={{marginLeft: 'auto', fontFamily: FONT, fontWeight: 600, fontSize: 18, color: locked(i, f) ? col : rgba(C.muted, 0.45), opacity: locked(i, f) ? 1 : 0.8}}>
            {locked(i, f) ? (i === 0 ? word : `Synced · ${word}`) : '—'}
          </span>
        </div>
      ))}
      {sep(240)}
      <MonoLabel style={{position: 'absolute', left: 24, top: 258}}>MANUAL OFFSET</MonoLabel>
      <div style={{position: 'absolute', left: 24, top: 288, display: 'flex', gap: 8, alignItems: 'center'}}>
        <Btn f={f} label="−" w={46} at={[]} fs={22} />
        <div
          style={{
            width: 200,
            height: 46,
            boxSizing: 'border-box',
            borderRadius: RADIUS.control,
            border: `1px solid ${fieldFlash > 0.02 ? rgba(C.amber, 0.5 + 0.5 * fieldFlash) : C.line}`,
            background: fieldFlash > 0.02 ? rgba(C.amber, 0.1 * fieldFlash) : '#141816',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 24,
            color: C.text,
          }}
        >
          {val}
        </div>
        <Btn f={f} label="+" w={46} at={[]} fs={22} />
        <span style={{fontFamily: FONT, fontSize: 18, color: C.muted}}>ms</span>
      </div>
      <div style={{position: 'absolute', left: 24, top: 346, fontFamily: FONT, fontSize: 15, color: C.muted}}>Arrow keys move 1 ms · Shift 10 ms</div>
      <div style={{position: 'absolute', left: 24, top: 380, display: 'flex', gap: 10}}>
        <Btn f={f} label="Nudge −1 ms" w={181} at={[T.nudgeMinus]} />
        <Btn f={f} label="Nudge +1 ms" w={181} at={[T.nudgePlus]} />
      </div>
      <div style={{position: 'absolute', left: 24, top: 438, display: 'flex', gap: 10}}>
        <Btn f={f} label="Undo" w={181} at={[T.undo]} />
        <Btn f={f} label="Redo" w={181} at={[T.redo]} />
      </div>
      {sep(510)}
      <div style={{position: 'absolute', left: 24, right: 24, top: 524, fontFamily: FONT, fontSize: 15, lineHeight: 1.45, color: C.muted}}>
        Preview is approximate; unsupported codecs use a proxy.
      </div>
    </div>
  );
};

const LANE0 = 250;
const LANE1 = 1836;
const CLIPS = [
  {a: 262, b: 1690},
  {a: 420, b: 1820},
  {a: 330, b: 1520},
  {a: 520, b: 1780},
];
const playheadX = (f: number) => 700 + (Math.min(f, 500) - T.dock) * 1.55;

const Timeline: React.FC<{f: number; u: number}> = ({f, u}) => {
  const top = 796;
  return (
    <div style={{...panel({left: 96, top, width: 1752, height: 148}), overflow: 'hidden', opacity: u, transform: `translateY(${(1 - u) * 50}px)`}}>
      {/* ruler */}
      {Array.from({length: 27}, (_, k) => {
        const x = LANE0 - 96 + k * 60;
        return (
          <React.Fragment key={k}>
            <div style={{position: 'absolute', left: x, top: 0, width: 1, height: k % 2 ? 6 : 10, background: C.line}} />
            {k % 2 === 0 ? <div style={{position: 'absolute', left: x + 5, top: 3, fontFamily: MONO, fontSize: 12, color: C.muted}}>{`0:${String(k).padStart(2, '0')}`}</div> : null}
          </React.Fragment>
        );
      })}
      {CAMS.map((cam, i) => {
        const shift = offAt(i, f) * 6;
        const y = 26 + i * 30;
        return (
          <React.Fragment key={cam}>
            <div style={{position: 'absolute', left: 16, top: y + 4, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.text}}>
              <div style={{width: 10, height: 10, borderRadius: 2, background: i === 3 ? C.amber : ST}} />
              {cam}
            </div>
            <div
              style={{
                position: 'absolute',
                left: CLIPS[i].a - 96 + shift,
                top: y,
                width: CLIPS[i].b - CLIPS[i].a,
                height: 24,
                borderRadius: 4,
                background: i === 3 ? rgba(C.amber, 0.22) : rgba(ST, 0.16),
                border: `1px solid ${i === 3 ? rgba(C.amber, 0.7) : rgba(ST, 0.45)}`,
                fontFamily: FONT,
                fontSize: 13,
                color: C.text,
                padding: '3px 8px',
                boxSizing: 'border-box',
              }}
            >
              {cam} · Take 03
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- world ----
export const World: React.FC = () => {
  const f = useWorldFrame();
  const dock = sp(f, 104, {damping: 18, stiffness: 110, mass: 1});
  const ui = (d: number) => sp(f, 108 + d, {damping: 17, stiffness: 140, mass: 0.9});
  const uiFlash = pulse(f, T.dock, 24);
  const out = ease.inOut(prog(f, T.exit, T.exit + 34));
  const collapse = ease.inOut(prog(f, T.exit - 4, T.exit + 26));
  // the shared playhead: on the timeline, then it flies to centre and becomes the caption caret
  const fly = ease.inOut(prog(f, 500, 572));
  const px = mix(playheadX(f), 960, fly);
  const pTop = mix(796, 498, fly);
  const pBot = mix(944, 582, fly);
  const pw = mix(3, 6, fly);
  const land = pulse(f, T.caret, 20);
  const phOn = ui(10);
  return (
    <AbsoluteFill style={{background: C.canvas, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
        <Glow x={1150} y={520} w={1700} h={1100} color={ST} opacity={0.12} />
        <Glow x={300} y={200} w={900} h={700} color={ST} opacity={0.05} />
      </div>
      <Title f={f} index="03 / 11" name="REVIEW" color={ST} out={92} promise={<>See every angle <span style={{color: ST, fontWeight: 650}}>at once.</span></>} />
      {/* exit: the whole workspace collapses into the shared playhead */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: `${playheadX(T.exit)}px 870px`,
          transform: `scale(${1 - 0.985 * collapse}, ${1 - 0.25 * collapse})`,
          opacity: 1 - prog(f, T.exit + 14, T.exit + 34),
        }}
      >
        <Sources f={f} u={ui(0)} />
        <Inspector f={f} u={ui(6)} />
        <Timeline f={f} u={ui(10)} />
        <Grid f={f} dock={dock} out={0} />
      </div>
      {uiFlash > 0.02 ? (
        <div style={{position: 'absolute', left: 96, top: 186, width: 1752, height: 758, borderRadius: RADIUS.dialog, border: `2px solid ${rgba(ST, 0.6 * uiFlash)}`, pointerEvents: 'none'}} />
      ) : null}
      {/* the one shared playhead */}
      {phOn > 0.01 ? (
        <>
          {fly > 0 ? <Glow x={px} y={(pTop + pBot) / 2} w={160 + 120 * land} h={(pBot - pTop) * 1.6} color={C.amber} opacity={0.35 * fly + 0.4 * land} /> : null}
          <div
            style={{
              position: 'absolute',
              left: px - pw / 2,
              top: pTop,
              width: pw,
              height: pBot - pTop,
              borderRadius: pw / 2,
              background: C.amber,
              opacity: phOn,
              boxShadow: `0 0 ${10 + 20 * fly}px ${rgba(C.amber, 0.6)}`,
            }}
          />
          <div style={{position: 'absolute', left: px - 8, top: pTop - 8, width: 16, height: 16, background: C.amber, transform: 'rotate(45deg)', opacity: phOn * (1 - fly)}} />
        </>
      ) : null}
      {/* every camera's offset readout counts toward 0; a quiet guide while the illusion plays */}
      <div style={{position: 'absolute', left: 96, top: 560, width: 560, opacity: prog(f, 40, 60) * (1 - prog(f, 92, 108))}}>
        <MonoLabel color={rgba(ST, 0.9)}>FOLLOW THE LIGHT BAR</MonoLabel>
        <div style={{marginTop: 12, fontFamily: FONT, fontSize: 24, lineHeight: 1.4, color: C.muted}}>
          Four cameras, one stage. As recorded, it jumps at every seam.
        </div>
      </div>
    </AbsoluteFill>
  );
};
