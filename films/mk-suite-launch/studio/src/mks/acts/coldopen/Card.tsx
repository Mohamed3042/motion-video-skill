// A glass shard: crop of real product art with a glass edge, a travelling glint and pre-blurred bokeh levels.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {BLUR} from './shards';

// Blur fractions (sigma / card width) of the baked levels: 0 = sharp.
const LEVELS = [0, ...BLUR.map((b) => b.sigma)];

export type CardPose = {
  shard: string;
  hue: string; // 'r,g,b'
  X: number; // screen center
  Y: number;
  w: number; // screen width
  aspect: number;
  rx: number;
  ry: number;
  rz: number;
  o: number; // opacity
  blur: number; // sigma as a fraction of card width
  glass: number; // 0..1 glass dressing (edge, sheen, glow); 0 = the bare crop
  glint: number; // 0..1 sweep position, <0 = none
  flash?: number; // 0..1 landing rim flash
  radiusBottom?: number; // 0..1 (1 = rounded like the top)
};

const blurred = (shard: string, lvl: number, w: number, h: number, o: number) => {
  const b = BLUR[lvl - 1];
  const k = w / b.width;
  const pad = Math.ceil(b.pad * b.width) * k;
  return (
    <Img
      key={lvl}
      src={staticFile(`mks/coldopen/${shard}-b${lvl}.png`)}
      style={{position: 'absolute', left: -pad, top: -pad, width: w + 2 * pad, height: h + 2 * pad, opacity: o, maxWidth: 'none'}}
    />
  );
};

export const Card: React.FC<{p: CardPose}> = ({p}) => {
  const {w} = p;
  const h = w / p.aspect;
  if (p.o <= 0.003 || w < 3) return null;
  // pick the two levels around p.blur; the lower one stays opaque until halfway (no alpha dip)
  let lo = 0;
  while (lo < LEVELS.length - 2 && p.blur > LEVELS[lo + 1]) lo++;
  const t = Math.min(1, Math.max(0, (p.blur - LEVELS[lo]) / (LEVELS[lo + 1] - LEVELS[lo])));
  const oLo = Math.min(1, 2 * (1 - t));
  const oHi = Math.min(1, 2 * t);
  const r = Math.max(2, 0.022 * w);
  const rb = r * (p.radiusBottom ?? 1);
  const sharp = lo === 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        opacity: p.o,
        transform: `translate(${p.X - w / 2}px, ${p.Y - h / 2}px) perspective(${Math.max(900, w * 3)}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg)`,
      }}
    >
      {sharp && oLo > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${r}px ${r}px ${rb}px ${rb}px`,
            overflow: 'hidden',
            opacity: oLo,
            boxShadow: p.glass > 0 && w > 70 ? `0 0 ${0.14 * w}px rgba(${p.hue},${0.24 * p.glass})` : undefined,
          }}
        >
          <Img src={staticFile(`mks/coldopen/${p.shard}.jpg`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
          {p.glass > 0 ? (
            <>
              <div style={{position: 'absolute', inset: 0, opacity: p.glass, background: 'linear-gradient(140deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.04) 32%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.18) 100%)'}} />
              {p.glint >= 0 && p.glint <= 1 ? (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: `${-60 + 160 * p.glint}%`,
                    width: '45%',
                    opacity: p.glass * Math.sin(Math.PI * p.glint),
                    background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0) 100%)',
                    mixBlendMode: 'screen',
                  }}
                />
              ) : null}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  opacity: p.glass,
                  boxShadow: `inset 0 0 0 ${Math.max(1, w / 420)}px rgba(255,255,255,0.20), inset 0 ${Math.max(1, w / 300)}px 0 rgba(255,255,255,0.38)`,
                }}
              />
            </>
          ) : null}
          {p.flash ? (
            <div style={{position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: `inset 0 0 0 ${Math.max(1.5, w / 220)}px rgba(160,255,200,${0.9 * p.flash}), inset 0 0 ${w * 0.08}px rgba(30,215,96,${0.6 * p.flash})`}} />
          ) : null}
        </div>
      ) : null}
      {!sharp && oLo > 0 ? blurred(p.shard, lo, w, h, oLo) : null}
      {oHi > 0 ? blurred(p.shard, lo + 1, w, h, oHi) : null}
    </div>
  );
};
