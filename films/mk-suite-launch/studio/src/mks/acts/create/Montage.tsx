// B · Montage Pro in the Focus library (03): fly-in, push on the film-strip hero, hover the two action cards,
// then the window tilts back into a floor under the super.
import React from 'react';
import {Cursor, Highlight, ease, lerp, prog} from '../../kit';
import {Stage} from '../../kit';
import {Sweep, Win, track, type Shot} from './parts';
import {CROP03, LABEL03, R03} from './rects';
import {T} from './timing';

const S: Record<string, Shot> = {
  far: {m: 0.94, fx: 793, fy: 483, z: -2600, ry: 34, rx: 12, o: 0},
  land: {m: 0.94, fx: 793, fy: 483, ry: 5, rx: 2},
  hero: {m: 1.5, fx: 900, fy: 362},
  cards: {m: 1.5, fx: 933, fy: 577},
  cards2: {m: 1.53, fx: 943, fy: 582},
  tilt: {m: 0.98, fx: 793, fy: 483, oy: 250, rx: 56, z: -60},
  tilt2: {m: 0.98, fx: 793, fy: 483, oy: 238, rx: 54, z: -110},
  out: {m: 0.98, fx: 793, fy: 483, ox: -2300, oy: 238, rx: 54, ry: 8, z: -300},
};

// Cursor in 1× source px: in from below, hover "Align cameras", then curve UNDER the "Prepare captions" card
// (never crosses it) to hover "Export an editing handoff".
const cursorAt = (f: number) => {
  const A = {x: 664, y: 606};
  const B = {x: 1498, y: 604};
  if (f < T.alignHover) {
    const t = ease.out(prog(f, T.alignHover - 16, T.alignHover));
    return {x: lerp(900, A.x, t), y: lerp(900, A.y, t)};
  }
  if (f < T.alignHover + 26) {
    const t = ease.inOut(prog(f, T.alignHover, T.alignHover + 26));
    return {x: A.x + 10 * t, y: A.y - 4 * t};
  }
  if (f < T.exportHover) {
    const t = ease.inOut(prog(f, T.alignHover + 26, T.exportHover));
    const c = {x: 960, y: 820}; // quadratic control point below the cards row (cards end at y 648)
    const a = {x: A.x + 10, y: A.y - 4};
    return {x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * B.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * B.y};
  }
  const t = ease.inOut(prog(f, T.exportHover, T.mpTilt + 12));
  return {x: B.x + 12 * t, y: B.y - 4 * t};
};

export const MontageScene: React.FC<{f: number}> = ({f}) => {
  if (f < T.mpIn || f > 484) return null;
  const base = track(f, [
    [T.mpIn, S.far],
    [T.mpLand, S.land, ease.out],
    [T.mpPushEnd, S.hero],
    [T.mpCards, S.cards],
    [T.mpTilt, S.cards2],
    [394, S.tilt],
    [446, S.tilt2],
    [482, S.out, ease.in],
  ]);
  const shot: Shot = {...base, o: (base.o ?? 1) * prog(f, 140, 156)}; // appears once the chapter card has flown past
  const flyBlur = 7 * (1 - ease.out(prog(f, T.mpIn, 158))) + 6 * ease.in(prog(f, 455, 482));
  const dim = prog(f, T.mpCards - 16, T.mpCards + 4) * (1 - prog(f, T.mpTilt, T.mpTilt + 20));
  return (
    <Stage>
      <Win id="03-library-focus" crop={CROP03} shot={shot} rim={0.45} filter={flyBlur > 0.1 ? `blur(${flyBlur.toFixed(2)}px)` : undefined}>
        {(px, m) => {
          const c = cursorAt(f);
          const cp = px({x: c.x, y: c.y, w: 0, h: 0});
          const cap = px(R03.captions);
          const lab = px(LABEL03.rect);
          return (
            <>
              <div style={{position: 'absolute', left: lab.x, top: lab.y, width: lab.w, height: lab.h, background: LABEL03.fill}} />
              <Sweep r={px(R03.filmArt)} p={prog(f, 166, T.mpPushEnd + 6)} strength={0.2} />
              {dim > 0 ? <div style={{position: 'absolute', left: cap.x, top: cap.y, width: cap.w, height: cap.h, borderRadius: 12 * m, background: 'rgba(8,9,9,0.62)', opacity: dim}} /> : null}
              <Highlight f={f} r={px(R03.align)} start={T.alignHover - 4} end={T.exportHover - 8} radius={12 * m} width={2.5 * m} />
              <Highlight f={f} r={px(R03.export)} start={T.exportHover - 2} end={T.mpTilt + 6} radius={12 * m} width={2.5 * m} />
              <Cursor f={f} path={[{f: 0, x: cp.x, y: cp.y}]} show={[T.alignHover - 16, T.mpTilt + 14]} scale={0.75 * m} />
            </>
          );
        }}
      </Win>
    </Stage>
  );
};
