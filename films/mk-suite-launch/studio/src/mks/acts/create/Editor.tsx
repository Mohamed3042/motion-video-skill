// C · MK Editor app details (05): the page swings in from the right beside its super, squares up, and the camera
// travels down to the three checklists, whose rows tick on 8ths while the camera glides across them.
import React from 'react';
import {Crop, Stage, ease, prog, springAt, type Rect} from '../../kit';
import {Win, track, type Shot} from './parts';
import {CROP, R05} from './rects';
import {T, tickF} from './timing';

const S: Record<string, Shot> = {
  enter: {m: 0.9, fx: 793, fy: 476, ox: 2300, ry: -34, rx: 3, z: -260},
  angled: {m: 0.9, fx: 793, fy: 476, ox: 410, ry: -24, rx: 3, z: -80},
  angled2: {m: 0.9, fx: 793, fy: 476, ox: 400, ry: -21, rx: 2.5, z: -100},
  col: {m: 1.55, fx: 820, fy: 700},
  drift: {m: 1.58, fx: 888, fy: 712},
  away: {m: 1.58, fx: 888, fy: 712, z: -1900, o: 0},
};

const TickRow: React.FC<{f: number; at: number; c: number; r: number; px: (r: Rect) => Rect; m: number}> = ({f, at, c, r, px, m}) => {
  const cx = R05.tickX[c];
  const cy = R05.tickY[r];
  const tx = R05.textX[c];
  const tw = R05.textW[c][r];
  const box = px({x: cx - 10, y: cy - 9, w: 20, h: 18});
  const text = px({x: tx - 3, y: cy - 11, w: tw + 6, h: 22});
  const bar = px({x: cx - 18, y: cy - 14, w: tx + tw + 22 - (cx - 18), h: 28});
  const draw = ease.out(prog(f, at, at + 7));
  const pop = f >= at ? springAt(f, at, {stiffness: 300, damping: 15}) : 0;
  const flash = f >= at ? Math.exp(-(f - at) / 14) : 0;
  return (
    <>
      {/* pending rows sit dimmed until their tick */}
      <div style={{position: 'absolute', left: text.x, top: text.y, width: text.w, height: text.h, background: R05.bg, opacity: 0.62 * (1 - prog(f, at, at + 8))}} />
      {/* the UI's own check is masked and redrawn so it can draw on */}
      <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, background: R05.bg}} />
      {/* row glow: a soft green wash that flashes on the tick and fades (above the masks) */}
      {flash > 0.01 ? (
        <div style={{position: 'absolute', left: bar.x, top: bar.y, width: bar.w, height: bar.h, borderRadius: 8 * m, background: `linear-gradient(90deg, rgba(30,215,96,${0.28 * flash}) 0%, rgba(30,215,96,${0.1 * flash}) 55%, rgba(30,215,96,0) 100%)`}} />
      ) : null}
      {f >= at ? (
        <svg
          width={box.w}
          height={box.h}
          viewBox="0 0 20 18"
          style={{position: 'absolute', left: box.x, top: box.y, overflow: 'visible', transform: `scale(${0.6 + 0.4 * pop})`, filter: `drop-shadow(0 0 ${(2 + 6 * flash) * m}px rgba(30,215,96,${0.5 + 0.5 * flash}))`}}
        >
          <path d="M3.6 10 L8 14.1 L17 4.6" fill="none" stroke="#2EEC8A" strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        </svg>
      ) : null}
    </>
  );
};

// Two AI-render glitches repaired with the screen's own glyphs ("pr•duction", "Approv?l").
const Patch: React.FC<{from: Rect; to: {x: number; y: number}; px: (r: Rect) => Rect; m: number}> = ({from, to, px, m}) => {
  const p = px({x: to.x, y: to.y, w: from.w, h: from.h});
  return <Crop id="05-app-detail" rect={from} scale={m} style={{position: 'absolute', left: p.x, top: p.y}} />;
};

const Fill: React.FC<{r: Rect}> = ({r}) => <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, background: R05.bg}} />;

export const EditorScene: React.FC<{f: number}> = ({f}) => {
  if (f < T.edIn || f > T.edOut + 24) return null;
  const shot = track(f, [
    [T.edIn, S.enter],
    [T.edLand, S.angled, ease.out],
    [T.edDescend, S.angled2],
    [632, S.col],
    [768, S.drift],
    [T.edOut + 24, S.away, ease.in],
  ]);
  const blur = 6 * (1 - ease.out(prog(f, T.edIn, 474))) + 5 * ease.in(prog(f, T.edOut + 4, T.edOut + 24));
  return (
    <Stage>
      <Win id="05-app-detail" crop={CROP} shot={shot} rim={0.4} filter={blur > 0.1 ? `blur(${blur.toFixed(2)}px)` : undefined}>
        {(px, m) => (
          <>
            <Patch from={R05.oFrom} to={R05.oTo} px={px} m={m} />
            <Patch from={R05.aFrom} to={R05.aTo} px={px} m={m} />
            <Fill r={px(R05.aTail)} />

            {Array.from({length: 12}, (_, i) => (
              <TickRow key={i} f={f} at={tickF(i)} c={Math.floor(i / 4)} r={i % 4} px={px} m={m} />
            ))}
          </>
        )}
      </Win>
    </Stage>
  );
};

