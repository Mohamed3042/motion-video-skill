// 3D stage: a perspective space with a dark backdrop. Objects are placed with <At>; the camera moves the world.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, H, W} from '../brand';

export type Cam = {x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number};

// Backdrop: deep stage with a soft green floor glow + a drifting light (call with the frame).
export const Backdrop: React.FC<{f: number; glow?: number; tint?: string}> = ({f, glow = 1, tint = '30,215,96'}) => {
  const dx = 260 * Math.sin(f * 0.004 + 0.8);
  const dy = 120 * Math.sin(f * 0.0031 + 2.1);
  return (
    <AbsoluteFill style={{background: C.stage}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 55% at 50% 108%, rgba(${tint},${0.16 * glow}) 0%, rgba(${tint},0) 70%)`}} />
      <div
        style={{
          position: 'absolute',
          left: W / 2 - 900 + dx,
          top: H / 2 - 700 + dy,
          width: 1800,
          height: 1400,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,${0.045 * glow}) 0%, rgba(255,255,255,0) 60%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// <Stage cam perspective>: children are placed in a 3D world whose origin is the frame center.
// The camera is applied as the inverse transform of the world (dolly z>0 = move toward the scene).
export const Stage: React.FC<{cam?: Cam; perspective?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({cam = {}, perspective = 2200, children, style}) => {
  const {x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0} = cam;
  return (
    <AbsoluteFill style={{perspective, perspectiveOrigin: '50% 50%', overflow: 'hidden', ...style}}>
      <div
        style={{
          position: 'absolute',
          left: W / 2,
          top: H / 2,
          width: 0,
          height: 0,
          transformStyle: 'preserve-3d',
          transform: `translate3d(0,0,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) translate3d(${-x}px, ${-y}px, 0)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// <At>: place a child (centered) at a 3D position inside <Stage>.
export const At: React.FC<{x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; s?: number; o?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  s = 1,
  o = 1,
  children,
  style,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      transformStyle: 'preserve-3d',
      transformOrigin: '0 0', // with the trailing translate(-50%,-50%) this makes rotations/scale pivot on the child's centre
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s}) translate(-50%, -50%)`,
      opacity: o,
      ...style,
    }}
  >
    {children}
  </div>
);
