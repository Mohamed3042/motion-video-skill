// The Training → Arcade doorway. Training's innermost tunnel frame ends as this glowing CRT screen
// (CRT_W0 wide, centred, static over the boundary); the Arcade pushes into the same screen. Both worlds
// draw it with this one component in screen space so the 12-frame boundary blend is seamless.
import React from 'react';
import {W, H} from '../../brand';

export const CRT_W0 = 1000; // screen width at the boundary (16:9)
export const crtRadius = (w: number) => 34 + 0.024 * w;

export const CrtScreen: React.FC<{
  w: number; // screen width (height = 9/16 w), centred on the frame
  glow: number; // 0..1 phosphor warm-up glow over the picture
  bezel: number; // 0..1 dark bezel around the screen
  open?: number; // 0..1 power-on: the glow opens from a bright centre line to the full screen
  lines?: number; // scanline darkness
  children?: React.ReactNode;
}> = ({w, glow, bezel, open = 1, lines = 0.2, children}) => {
  const h = (w * 9) / 16;
  const r = crtRadius(w);
  const box: React.CSSProperties = {position: 'absolute', left: (W - w) / 2, top: (H - h) / 2, width: w, height: h, borderRadius: r};
  const band = Math.max(3, h * open);
  return (
    <>
      <div style={{...box, overflow: 'hidden', background: '#000'}}>
        {children}
        {glow > 0.001 ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (h - band) / 2,
              height: band,
              opacity: glow,
              backgroundImage: 'radial-gradient(ellipse 60% 64% at 50% 50%, #fff8e6 0%, #ffefb0 24%, #ffe066 52%, #ffc838 78%, #ee9a26 100%)',
              backgroundSize: `100% ${h}px`,
              backgroundPosition: 'center',
              boxShadow: open < 1 ? `0 0 ${24 + 40 * (1 - open)}px 6px rgba(255,248,215,0.9)` : undefined,
            }}
          />
        ) : null}
        {/* scanlines, RGB aperture grille, curved-glass falloff, reflection */}
        <div style={{position: 'absolute', inset: 0, background: `repeating-linear-gradient(180deg, rgba(0,0,0,${lines}) 0px, rgba(0,0,0,${lines}) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 4px)`}} />
        <div style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.07, background: 'repeating-linear-gradient(90deg, #ff3030 0px, #ff3030 1px, #30ff30 1px, #30ff30 2px, #3050ff 2px, #3050ff 3px)'}} />
        <div style={{position: 'absolute', inset: 0, borderRadius: r, boxShadow: `inset 0 0 ${w * 0.06}px rgba(30,12,0,0.75)`, background: 'radial-gradient(ellipse 80% 82% at 50% 50%, rgba(0,0,0,0) 64%, rgba(20,8,0,0.5) 100%)'}} />
        <div style={{position: 'absolute', left: '6%', top: '5%', width: '42%', height: '30%', borderRadius: '50%', background: 'radial-gradient(ellipse at 40% 40%, rgba(255,255,255,0.035), rgba(255,255,255,0) 70%)'}} />
      </div>
      {bezel > 0.001 ? (
        <div
          style={{
            ...box,
            opacity: bezel,
            boxShadow: `0 0 0 3px rgba(255,225,77,0.35), 0 0 ${w * 0.09}px rgba(255,200,90,${0.35 * glow + 0.1}), 0 0 0 ${W * 2}px #070707`,
          }}
        />
      ) : null}
    </>
  );
};
