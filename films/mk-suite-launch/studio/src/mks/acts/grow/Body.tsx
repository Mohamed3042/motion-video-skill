// Act 4 · Grow (global 3840–4800). Local frame f: 0 = act start (the seam cut).
// Chapter (glyph lands from the Work dive) → Explore: the Grow tools lift out of the grid, Job Engine / Orbit and
// MK Marketplace dock beneath → MK Educate web destination, its phone card glows → the three phone concepts
// rise in a 3D fan beside the desktop window → push forward into the next act's bloom.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../../brand';
import {At, Backdrop, Crop, Cursor, Highlight, Stage, Super, WINDOW_RECT, clamp, ease, kf, lerp, prog, springAt, type Rect} from '../../kit';
import {ChapterCard, Fill, HBlurDefs, P, Win, zFor, type Cam3} from '../work/parts';
import {GROW_X0} from '../work/seam';
import {SeamGlyph} from '../work/Body';
import type {ScreenId} from '../../screens';

const EXPLORE = '04-explore' as const;
const STUDIO = '01-library-studio' as const;
const EDUCATE = '06-web-destination' as const;

// ── Explore tiles (04) and the More row (01), source px ──────────────────────────────────────────
const TILES: Rect[] = [
  {x: 302, y: 734, w: 411, h: 202}, // MK Educate (tiles end at 947; crops stop at the y 936 limit)
  {x: 729, y: 734, w: 408, h: 202}, // Quotation Builder
  {x: 1151, y: 734, w: 411, h: 202}, // Flock Operations
];
const T_TILE = [240, 270, 300];
const MORE: Rect[] = [
  {x: 725, y: 818, w: 413, h: 109}, // Job Engine / Orbit
  {x: 1149, y: 818, w: 413, h: 109}, // MK Marketplace
];
const T_MORE = [330, 360];
const MORE_DOCK = [{x: 507, y: 996}, {x: 944, y: 996}]; // window coords (below the grid)
const T_CLICK = 426;
const T_SWAP = 432; // 04 slides out, 06 slides in
const PHONE_CARD: Rect = {x: 931, y: 438, w: 627, h: 220};
const T_GLOW = 510;
const T_PHONES = [624, 642, 660];
const S_PHONE = {start: 690, end: 872};

// ── Camera (world; windows at 1 px = 1 source px, window centre at world origin) ─────────────────
const camAt = (f: number): Cam3 => {
  const keys = (i: number) =>
    kf(
      f,
      (
        [
          [140, [0, 0, 0.95]],
          [204, [0, 0, 0.95]],
          [238, [139, 330, 1.1]],
          [320, [139, 360, 1.1]],
          [372, [139, 500, 1.08]],
          [T_CLICK, [139, 520, 1.1]],
          [T_SWAP, [139, 520, 1.1]],
          [470, [0, 0, 0.95]],
          [480, [0, 0, 0.95]],
          [560, [451, 65, 1.35]],
          [600, [460, 60, 1.38]],
          [664, [0, 0, 1]],
          [900, [20, 0, 1.06]],
          [972, [336, -56, 1.9]],
        ] as Array<[number, [number, number, number]]>
      ).map(([kfF, v]) => [kfF, v[i]] as [number, number, ((t: number) => number)?]),
    );
  // the final push accelerates (ease.in) — rebuild the last segment with its own ease
  const push = f > 900 ? ease.in(prog(f, 900, 972)) : 0;
  const x = f > 900 ? lerp(20, 336, push) : keys(0);
  const y = f > 900 ? lerp(0, -56, push) : keys(1);
  const m = f > 900 ? Math.exp(lerp(Math.log(1.06), Math.log(1.9), push)) : keys(2);
  return {x, y, z: zFor(m)};
};

// ── Chapter ──────────────────────────────────────────────────────────────────────────────────────
const PAN = {a: 128, b: 192, d: 1250};
const panD = (f: number) => PAN.d * ease.inOut(prog(f, PAN.a, PAN.b));
const GrowChapter: React.FC<{f: number}> = ({f}) => {
  return (
    <AbsoluteFill style={{transform: `translateY(${-panD(f)}px) scale(${1 + 0.03 * ease.inOut(prog(f, 12, 150))})`}}>
      <ChapterCard f={f} start={-8} index="04 — GROW" word="Grow." sub="Go further with the MK ecosystem." x0={GROW_X0} icon={null} />
      <SeamGlyph t={f} />
    </AbsoluteFill>
  );
};

// ── Explore window with lifted tiles ─────────────────────────────────────────────────────────────
const Lift: React.FC<{id: ScreenId; r: Rect; x: number; y: number; z: number; o?: number; glow: number; s?: number}> = ({id, r, x, y, z, o = 1, glow, s = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: r.w,
      height: r.h,
      opacity: o,
      transform: `translateZ(${z}px) scale(${s})`,
      borderRadius: 12,
      boxShadow: `0 ${24 + z * 0.12}px ${60 + z * 0.3}px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,${0.06 + 0.1 * glow}), 0 0 ${36 * glow}px rgba(30,215,96,${0.22 * glow})`,
    }}
  >
    <Crop id={id} rect={r} scale={1} radius={12} />
    <div style={{position: 'absolute', inset: 0, borderRadius: 12, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)'}} />
  </div>
);

const ExploreWin: React.FC<{f: number}> = ({f}) => {
  const out = ease.inOut(prog(f, T_SWAP, T_SWAP + 34));
  const dim = 0.6 * ease.out(prog(f, T_TILE[0] - 4, T_TILE[0] + 20));
  const lifts = TILES.map((_, i) => springAt(f, T_TILE[i], {stiffness: 170, damping: 15}));
  const mores = MORE.map((_, i) => springAt(f, T_MORE[i], {stiffness: 120, damping: 16}));
  return (
    <Win
      id={EXPLORE}
      x={lerp(0, -2300, out)}
      y={(PAN.d - panD(f)) / 0.95}
      z={-300 * out}
      ry={lerp(0, 24, out)}
      lifted={
        <>
          {TILES.map((r, i) =>
            lifts[i] <= 0 ? null : <Lift key={i} id={EXPLORE} r={r} x={r.x} y={r.y - 10 * lifts[i]} z={150 * lifts[i]} glow={clamp(1 - (f - T_TILE[i]) / 40) * 0.8 + 0.25} />,
          )}
          <div style={{position: 'absolute', left: 0, top: 0, transform: 'translateZ(160px)'}}>
            <Cursor f={f} path={[{f: 392, x: 1060, y: 1160}, {f: 420, x: 642, y: 912}]} clicks={[T_CLICK]} show={[390, T_SWAP + 6]} />
          </div>
          {MORE.map((r, i) =>
            mores[i] <= 0 ? null : (
              <Lift key={`m${i}`} id={STUDIO} r={r} x={lerp(MORE_DOCK[i].x + 1500, MORE_DOCK[i].x, mores[i])} y={MORE_DOCK[i].y} z={lerp(420, 150, mores[i])} o={clamp(mores[i] * 2)} glow={clamp(1 - (f - T_MORE[i]) / 40) * 0.8 + 0.25} />
            ),
          )}
        </>
      }
    >
      <Fill r={WINDOW_RECT} color="#000" o={dim} radius={16} />
      {TILES.map((r, i) => (
        <Fill key={i} r={r} color="rgb(8,8,8)" radius={12} o={clamp(lifts[i] * 3)} />
      ))}
    </Win>
  );
};

// ── MK Educate destination window (06): slides in, phone card glows, then turns aside ────────────
const EducateWin: React.FC<{f: number}> = ({f}) => {
  const inn = ease.inOut(prog(f, T_SWAP, T_SWAP + 34));
  const aside = ease.inOut(prog(f, 604, 668));
  const glow = ease.out(prog(f, T_GLOW, T_GLOW + 24));
  const pulse = 0.75 + 0.25 * Math.sin((f - T_GLOW) * 0.13);
  return (
    <Win id={EDUCATE} x={lerp(2300, 0, inn) - 560 * aside} y={-60 * aside} z={-760 * aside} ry={lerp(-24, 0, inn) + 24 * aside} rim={0.4 + 0.4 * glow}>
      {glow > 0 ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: 1390 - 260,
              top: 540 - 260,
              width: 520,
              height: 520,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(30,215,96,${0.42 * glow * pulse}) 0%, rgba(30,215,96,${0.12 * glow * pulse}) 40%, rgba(30,215,96,0) 70%)`,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: PHONE_CARD.x,
              top: PHONE_CARD.y,
              width: PHONE_CARD.w,
              height: PHONE_CARD.h,
              borderRadius: 16,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -40,
                bottom: -40,
                width: 160,
                left: lerp(-200, 760, prog(f, T_GLOW + 4, T_GLOW + 40)),
                transform: 'skewX(-18deg)',
                background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.10), rgba(255,255,255,0))',
              }}
            />
          </div>
        </>
      ) : null}
      <Highlight f={f} r={PHONE_CARD} start={T_GLOW} end={604} radius={18} width={2.5} />
    </Win>
  );
};

// ── Phones (22, 23, 24) as devices ───────────────────────────────────────────────────────────────
const PH = 0.34; // phone scale in world px per source px
const PHONE_W = 992 * PH;
const PHONE_H = 1586 * PH;
const Phone: React.FC<{id: ScreenId; glow: number; sheen: number}> = ({id, glow, sheen}) => {
  const b = 12;
  return (
    <div
      style={{
        position: 'relative',
        width: PHONE_W + 2 * b,
        height: PHONE_H + 2 * b,
        borderRadius: 58,
        background: 'linear-gradient(160deg, #1c1e1d 0%, #0a0b0b 45%, #141615 100%)',
        boxShadow: [`0 40px 90px rgba(0,0,0,0.75)`, `0 0 0 1.5px #2E3130`, `inset 0 1px 0 rgba(255,255,255,0.18)`, `0 0 ${50 * glow}px rgba(30,215,96,${0.25 * glow})`].join(', '),
      }}
    >
      <div style={{position: 'absolute', left: b, top: b}}>
        <Crop id={id} scale={PH} radius={46} />
      </div>
      <div style={{position: 'absolute', left: b, top: b, width: PHONE_W, height: PHONE_H, borderRadius: 46, background: 'linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 32%)', pointerEvents: 'none'}} />
      {sheen > 0 && sheen < 1 ? (
        <div style={{position: 'absolute', left: b, top: b, width: PHONE_W, height: PHONE_H, borderRadius: 46, overflow: 'hidden', pointerEvents: 'none'}}>
          <div style={{position: 'absolute', top: -200, bottom: -200, width: 120, left: lerp(-260, PHONE_W + 140, sheen), transform: 'rotate(18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.16), rgba(255,255,255,0))'}} />
        </div>
      ) : null}
    </div>
  );
};

const PHONES: Array<{id: ScreenId; x: number; y: number; z: number; ry: number; rz: number}> = [
  {id: '23-phone-detail', x: 46, y: -6, z: 60, ry: 14, rz: -8},
  {id: '24-phone-more', x: 640, y: -6, z: 60, ry: -16, rz: 8},
  {id: '22-phone-library', x: 336, y: -56, z: 200, ry: 0, rz: 0},
];
const PHONE_T = [T_PHONES[1], T_PHONES[2], T_PHONES[0]]; // centre phone (22) first, then the wings

const PhoneFan: React.FC<{f: number}> = ({f}) => (
  <>
    {PHONES.map((p, i) => {
      const s = springAt(f, PHONE_T[i], {stiffness: 120, damping: 15});
      if (s <= 0) return null;
      const fan = ease.out(prog(f, PHONE_T[i] + 4, PHONE_T[i] + 30));
      const glow = 0.4 + 0.6 * clamp(1 - (f - PHONE_T[i]) / 50);
      return (
        <At key={p.id} x={lerp(336, p.x, fan)} y={lerp(1000, p.y, s)} z={p.z} rx={lerp(-30, 0, s)} ry={p.ry * fan} rz={p.rz * fan} o={clamp(s * 2)}>
          <Phone id={p.id} glow={glow} sheen={prog(f, 744 + 14 * i, 790 + 14 * i)} />
        </At>
      );
    })}
  </>
);

export const GrowBody: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f);
  const bloom = ease.in(prog(f, 900, 972));
  const vy = Math.abs(panD(f + 1) - panD(f));
  return (
    <AbsoluteFill style={{background: C.stage, overflow: 'hidden'}}>
      <Backdrop f={f + 3840} glow={1 + 0.6 * bloom} />
      <HBlurDefs id="gr-vb" sx={0} sy={Math.min(30, vy * 0.4)} />
      <AbsoluteFill style={{filter: vy > 1 ? 'url(#gr-vb)' : undefined}}>
      {f >= PAN.a ? (
        <Stage cam={{...cam, ry: kf(f, [[640, 0], [900, -5, ease.inOut], [972, -7, ease.in]])}} perspective={P}>
          {f < T_SWAP + 36 ? <ExploreWin f={f} /> : null}
          {f >= T_SWAP ? <EducateWin f={f} /> : null}
          {f >= T_PHONES[0] - 2 ? <PhoneFan f={f} /> : null}
        </Stage>
      ) : null}
      {f < PAN.b ? <GrowChapter f={f} /> : null}
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 944, display: 'flex', justifyContent: 'center'}}>
        <Super f={f} text="On your desk. And on your phone." start={S_PHONE.start} end={S_PHONE.end} size={70} accentWords={[4, 5]} maxWidth={1800} />
      </div>
      {bloom > 0 ? (
        <AbsoluteFill style={{background: `radial-gradient(ellipse 65% 65% at 50% 46%, rgba(225,255,236,${0.55 * bloom}) 0%, rgba(30,215,96,${0.22 * bloom}) 45%, rgba(30,215,96,0) 80%)`, mixBlendMode: 'screen', pointerEvents: 'none'}} />
      ) : null}
    </AbsoluteFill>
  );
};
