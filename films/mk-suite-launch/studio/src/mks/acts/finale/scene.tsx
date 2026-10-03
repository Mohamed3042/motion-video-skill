// One continuous 3D shot spanning the act 5 → finale seam: Guide (12) → camera pans through space → Welcome (13),
// then drifts into Welcome's floating product cubes (parallax layer split + a light sweep across the glass).
// Keyed on g = FINALE-local frame, so "Make it yours" renders it with g = f − 1200 and the finale with g = f:
// whatever the shell does at frame 6000 (straight cut or overlap), both sides draw the identical picture.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {At, Crop, Screen, Stage, ease, kf, prog, type Rect} from '../../kit';
import {Bloom, MoBlur, Patch, camAt, wx, wy} from '../yours/parts';

export const WX = 2300; // world x of the Welcome window (Guide sits at the origin)
// g-frames of this shot's moments (the whoosh at panPeak belongs to act 5's EVENTS: it lands before 6000).
export const GW = {panStart: -60, panPeak: -26, panEnd: 10, sweep: 240, drift: 120, cut: 366} as const;

// One continuous move from the drift into the match cut: slow glide across the cubes that keeps accelerating.
const glide = (t: number) => 0.3 * t ** 1.6 + 0.7 * t ** 5;
const lx = (g: number) =>
  kf(g, [
    [-270, 0],
    [GW.panStart, 330],
    [GW.panEnd, WX, ease.quintInOut],
    [GW.drift, WX + 30],
    [GW.cut, WX + wx(1170), glide],
  ]);
const ly = (g: number) =>
  kf(g, [
    [-270, -146],
    [GW.panStart, -212],
    [GW.panEnd, 0, ease.quintInOut],
    [GW.drift, -10],
    [GW.cut, wy(300), glide],
  ]);
const sc = (g: number) =>
  kf(g, [
    [-270, 0.86],
    [GW.panStart, 1.1],
    [GW.panPeak, 0.74],
    [GW.panEnd, 1.0],
    [GW.drift, 1.06],
    [GW.cut, 2.5, glide],
  ]);

// Welcome's cube cluster as a parallax layer (1× source px).
// Solid ellipse (centre 1140,440; radii 461×330) holds every cube incl. the MK Tones label; the feather ring
// (to 530×380) only crosses dark pedestals and the soft ribbon, so the drift never shows a double image.
const CL: Rect = {x: 600, y: 60, w: 986, h: 800};
const MASK = 'radial-gradient(530px 380px at 540px 380px, #000 87%, rgba(0,0,0,0) 100%)';
const ORIGIN = {x: 1172 - CL.x, y: 338 - CL.y}; // where the camera drifts to
const CARDS: Rect = {x: 520, y: 578, w: 252, h: 224}; // right column of the pin cards (+ dark gutter)

const CubeLayer: React.FC<{g: number}> = ({g}) => {
  const p = ease.inOut(prog(g, 40, GW.cut)); // parallax amount (0 = aligned with the base)
  // camera drifts right and up → the nearer layer slides further left/down and grows faster
  const dx = -24 * p;
  const dy = 10 * p;
  const s = 1 + 0.045 * p;
  const sw = prog(g, GW.sweep - 34, GW.sweep + 34); // light sweep crosses the glass, centred on GW.sweep
  const sweepOn = sw > 0 && sw < 1;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 16}}>
      <div
        style={{
          position: 'absolute',
          left: CL.x,
          top: CL.y,
          width: CL.w,
          height: CL.h,
          overflow: 'hidden',
          transform: `translate(${dx}px, ${dy}px) scale(${s})`,
          transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`,
          WebkitMaskImage: MASK,
          maskImage: MASK,
        }}
      >
        <Crop id="13-welcome" rect={CL} scale={1} />
        {sweepOn ? (
          <>
            <div
              style={{
                position: 'absolute',
                top: -200,
                height: CL.h + 400,
                width: 420,
                left: -470 + (CL.w + 860) * ease.inOut(sw),
                transform: 'skewX(-22deg)',
                background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 100%)',
                mixBlendMode: 'overlay',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: -200,
                height: CL.h + 400,
                width: 110,
                left: -315 + (CL.w + 860) * ease.inOut(sw),
                transform: 'skewX(-22deg)',
                background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0) 100%)',
                mixBlendMode: 'screen',
              }}
            />
          </>
        ) : null}
      </div>
      {/* the 'Pin your first tools' cards poke into the layer's feather ring: keep them on the base plane */}
      <Patch id="13-welcome" r={CARDS} />
    </div>
  );
};

export const GuideWelcome: React.FC<{g: number}> = ({g}) => {
  const cam = camAt(lx(g), ly(g), sc(g), kf(g, [[GW.panStart, 0], [GW.panPeak, -5], [GW.panEnd, 0]]));
  // screen-space speed of the content at frame centre = world pan speed × magnification
  const bx = Math.min(48, Math.abs(lx(g) - lx(g - 1)) * sc(g) * 0.28);
  const guideRy = kf(g, [[GW.panStart + 20, 0], [GW.panEnd, -24, ease.in]]);
  const welcomeRy = kf(g, [[GW.panStart, 26], [GW.panEnd + 30, 0, ease.out]]);
  // the Guide's green cube breathes while "Answers, built in." is up
  const cube = kf(g, [[-200, 0], [-170, 1], [-80, 0.7], [-40, 0]]);
  return (
    <MoBlur id="gw-mb" bx={bx}>
      <Stage cam={cam}>
        {g < GW.panEnd + 24 ? (
          <At x={0} y={0} ry={guideRy}>
            <Screen id="12-help" width={1586}>
              <Bloom x={1235} y={215} r={170} o={cube * 0.8} />
            </Screen>
          </At>
        ) : null}
        {g > GW.panStart - 10 ? (
          <At x={WX} y={0} ry={welcomeRy}>
            <Screen id="13-welcome" width={1586}>
              <CubeLayer g={g} />
            </Screen>
          </At>
        ) : null}
      </Stage>
    </MoBlur>
  );
};
