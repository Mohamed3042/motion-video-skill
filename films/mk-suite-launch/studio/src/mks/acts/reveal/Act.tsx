// Act 1 · Reveal (600–1440): the drop lands on the assembled Explore window → pull back to a floating window
// ("The new MK Suite.") → Studio library (01) explodes into seven layers while the camera orbits, then slams
// together → a cursor flips Studio → Compact → Focus with a layered morph → Focus pushes toward camera.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../../brand';
import {useActFrame} from '../../frame';
import {At, Backdrop, Cursor, Stage, Super, WINDOW_RECT, ease, kf, lerp, prog, springAt, type Rect} from '../../kit';
import type {ScreenId} from '../../screens';
import {ExploreWindow, SEAM_RIM} from '../coldopen/seam';
import {K} from '../coldopen/world';
import {ExplodedFace, MORPH_LEN, MorphFace, StaticFace} from './Face';
import {TOGGLE} from './layout';
import {T} from './timing';

const P = 2200; // Stage perspective
const k = K; // layout px per source px (window laid out at the seam size: 1713 × 1043)
const WW = WINDOW_RECT.w * k;
const WH = WINDOW_RECT.h * k;
const zFor = (scale: number) => P * (1 - 1 / scale); // camera dolly that shows the window at `scale`
const Z_REST = zFor(0.74 / K); // resting window: 0.74 px per source px (1174 × 715)
const Y_REST = 146; // window center sits at screen y ≈ 440 (82–797); supers live below it

// Beats (local frames)
const {M1, EX, SLAM, CLICK1, CLICK2, PUSH} = T;

const explode = (f: number) => kf(f, [[EX, 0], [EX + 54, 1, ease.expoOut], [SLAM - 14, 1.04, ease.linear], [SLAM, 0, ease.in]]);

const camAt = (f: number) => {
  const push = ease.in(prog(f, PUSH, T.pushEnd));
  return {
    x: lerp(0, 386 * k * 0.75, push),
    y: kf(f, [[0, 0], [100, Y_REST, ease.expoOut], [EX, Y_REST], [EX + 30, 120], [SLAM - 10, 125], [SLAM + 10, Y_REST], [PUSH, Y_REST], [T.pushEnd, -168 * k * 0.75, ease.in]]),
    z:
      kf(f, [[0, 0], [100, Z_REST, ease.expoOut], [EX, Z_REST + 30], [EX + 40, Z_REST - 520], [SLAM - 4, Z_REST - 430], [SLAM + 30, Z_REST], [PUSH, Z_REST + 70]]) +
      push * (zFor(1.22) - (Z_REST + 70)),
    rx: kf(f, [[0, 0], [46, 5], [120, 0], [EX, 0], [EX + 52, -9, ease.out], [SLAM - 14, -6], [SLAM, 0, ease.in], [PUSH, 0], [T.pushEnd, 3, ease.in]]),
    ry: kf(f, [[0, 0], [46, -7], [120, 0], [EX, 0], [EX + 52, 20, ease.out], [SLAM - 14, -12], [SLAM, 0, ease.in]]),
  };
};

// Impact bloom (green-white, screen blend): the drop at 0 and the slam.
const bloom = (f: number) => {
  const hit = (t0: number, amp: number, len: number) => (f < t0 ? 0 : amp * Math.exp(-(f - t0) / len) * Math.min(1, 0.55 + (f - t0) * 0.25));
  return Math.max(hit(T.drop, 0.62, 10), hit(SLAM, 0.32, 7));
};

const Bloom: React.FC<{i: number}> = ({i}) =>
  i <= 0.004 ? null : (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: i, background: 'radial-gradient(ellipse 62% 58% at 50% 45%, rgba(242,255,247,0.9) 0%, rgba(160,240,195,0.42) 38%, rgba(30,215,96,0.12) 64%, rgba(30,215,96,0) 86%)'}} />
  );

const BottomSuper: React.FC<{f: number; text: string; start: number; end: number; size?: number}> = ({f, text, start, end, size = 96}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: 838, display: 'flex', justifyContent: 'center'}}>
    <Super f={f} text={text} start={start} end={end} size={size} />
  </div>
);

// Sliding green light on the layout toggle (rides from the old active button to the new one).
const TogglePill: React.FC<{f: number; t0: number; from: Rect; to: Rect}> = ({f, t0, from, to}) => {
  if (f < t0 || f > t0 + 26) return null;
  const s = springAt(f, t0, {stiffness: 260, damping: 22});
  const o = Math.min(1, prog(f, t0, t0 + 3)) * (1 - prog(f, t0 + 14, t0 + 26));
  const r = {x: lerp(from.x, to.x, s), y: lerp(from.y, to.y, s), w: lerp(from.w, to.w, s), h: lerp(from.h, to.h, s)};
  return (
    <div
      style={{
        position: 'absolute',
        left: r.x * k,
        top: r.y * k,
        width: r.w * k,
        height: r.h * k,
        borderRadius: 9 * k,
        opacity: o,
        border: `${2 * k}px solid ${C.green}`,
        boxShadow: `0 0 ${26 * k}px rgba(30,215,96,0.75), inset 0 0 ${16 * k}px rgba(30,215,96,0.35)`,
      }}
    />
  );
};

const Face: React.FC<{f: number; rim: number}> = ({f, rim}) => {
  const morph = (a: ScreenId, b: ScreenId, t0: number) => <MorphFace a={a} b={b} f={f} t0={t0} k={k} rim={rim} />;
  if (f < M1) return <StaticFace id="04-explore" k={k} rim={rim} />;
  if (f < M1 + MORPH_LEN) return morph('04-explore', '01-library-studio', M1);
  const e = explode(f);
  if (f >= EX && f < SLAM && e > 0.002) return <ExplodedFace k={k} e={e} rim={rim} glow={Math.min(1, e)} />;
  if (f < CLICK1) return <StaticFace id="01-library-studio" k={k} rim={rim} />;
  if (f < CLICK1 + MORPH_LEN) return morph('01-library-studio', '02-library-compact', CLICK1);
  if (f < CLICK2) return <StaticFace id="02-library-compact" k={k} rim={rim} />;
  if (f < CLICK2 + MORPH_LEN) return morph('02-library-compact', '03-library-focus', CLICK2);
  return <StaticFace id="03-library-focus" k={k} rim={rim} />;
};

const CURSOR = [
  {f: 466, x: 1470 * k, y: 700 * k},
  {f: 528, x: 1382 * k, y: 47 * k},
  {f: 612, x: 1390 * k, y: 52 * k},
  {f: 650, x: 1512 * k, y: 47 * k},
  {f: 690, x: 1516 * k, y: 50 * k},
  {f: 730, x: 1560 * k, y: 300 * k},
];

export const Act: React.FC = () => {
  const f = useActFrame();
  const g = 600 + f; // global frame (backdrop drift continues from act 0)
  if (f <= 0) {
    // f = 0 is the exact act-0 end state; the drop's bloom starts on it
    return (
      <AbsoluteFill style={{background: C.stage}}>
        <Backdrop f={g} glow={0.9} />
        <ExploreWindow />
        {f === 0 ? <Bloom i={bloom(0)} /> : null}
      </AbsoluteFill>
    );
  }
  const cam = camAt(f);
  const rim = kf(f, [[0, SEAM_RIM], [90, 1]]);
  const bump = (t0: number) => (f >= t0 && f < t0 + 30 ? Math.sin(Math.PI * prog(f, t0, t0 + 30)) : 0);
  const s = 1 - 0.02 * Math.max(bump(M1), bump(CLICK1), bump(CLICK2));
  const drift = Math.sin(f * 0.012) * 6;
  return (
    <AbsoluteFill style={{background: C.stage}}>
      <Backdrop f={g} glow={kf(f, [[0, 0.9], [4, 1.3], [60, 1]])} />
      <Stage cam={cam} perspective={P}>
        <At y={drift} s={s}>
          <div style={{position: 'relative', width: WW, height: WH, transformStyle: 'preserve-3d'}}>
            <Face f={f} rim={rim} />
            <TogglePill f={f} t0={CLICK1} from={TOGGLE.studio} to={TOGGLE.compact} />
            <TogglePill f={f} t0={CLICK2} from={TOGGLE.compact} to={TOGGLE.focus} />
            <Cursor f={f} path={CURSOR} clicks={[CLICK1, CLICK2]} show={[466, 736]} scale={1.55} />
          </div>
        </At>
      </Stage>
      <Bloom i={bloom(f)} />
      <BottomSuper f={f} text="The new MK Suite." start={T.supers.title} end={150} size={118} />
      <BottomSuper f={f} text="Redesigned from the ground up." start={T.supers.redesigned} end={456} />
      <BottomSuper f={f} text="Studio." start={T.supers.studio} end={528} />
      <BottomSuper f={f} text="Compact." start={T.supers.compact} end={636} />
      <BottomSuper f={f} text="Focus." start={T.supers.focus} end={726} />
      <BottomSuper f={f} text="Your library, your way." start={T.supers.library} end={800} />
    </AbsoluteFill>
  );
};
