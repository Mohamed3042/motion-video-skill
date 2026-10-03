// The shared universe (framework builder):
// - <Environment/>: WebGL, world space — deep space (stars, nebula, dust), the Orbit planet with its chrome ring
//   and coral satellite, the helix trail + station beacons, a camera-rigged light rig (coral key from the
//   satellite side, cobalt fill, cool rim) and the post chain (bloom + ACES, deterministic).
// - <FlightFX/>: screen space, from cameraAt(g) — speed streaks radiating from the travel vanishing point, a
//   light-tunnel edge glow, the coral guide spark leading the hop, and a whoosh-synced flare on every boundary
//   (the BOOM at the drop is a white-hot coral flash). Nothing when docked.
import React, {useLayoutEffect, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {Bloom, EffectComposer, ToneMapping} from '@react-three/postprocessing';
import {ToneMappingMode} from 'postprocessing';
import {C} from '../brand';
import {DROP, mulberry32} from '../timing';
import {cameraAt} from '../engine/camera';
import {H, W, makeCamera} from '../engine/space';
import {clamp, len, mul, norm, sub, type V3} from '../engine/math';
import {Planet} from './planet';
import {Sky} from './sky';
import {BOUNDARIES, SECTIONS} from './timing';
import {sectionAccent} from './portals';
import {mixHex, rgba} from './util';

// ---------------------------------------------------------------- light rig (directions in CAMERA space)
const RIG: Array<{dir: V3; color: string; k: number}> = [
  {dir: [0.62, 0.55, 0.56], color: '#ffc7b0', k: 2.1}, // key: warm coral-white, from the satellite side
  {dir: [-0.8, -0.25, 0.45], color: '#4a68ff', k: 0.85}, // fill: cobalt, low left
  {dir: [0.15, 0.45, -0.88], color: '#bfe0ff', k: 1.3}, // rim: cool, from behind
];

const Rig: React.FC = () => {
  const g = useCurrentFrame();
  const lights = useMemo(() => RIG.map((r) => new THREE.DirectionalLight(r.color, r.k)), []);
  useLayoutEffect(() => {
    const q = makeCamera(cameraAt(g)).quaternion;
    lights.forEach((l, i) => {
      const d = new THREE.Vector3(...RIG[i].dir).normalize().applyQuaternion(q).multiplyScalar(10000);
      l.position.copy(d);
      l.target.position.set(0, 0, 0);
      l.target.updateMatrixWorld();
    });
  }, [g, lights]);
  return (
    <>
      <ambientLight intensity={0.24} color="#c9d5ff" />
      {lights.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </>
  );
};

const Post: React.FC = () => (
  <EffectComposer multisampling={4} frameBufferType={THREE.HalfFloatType}>
    <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.82} luminanceSmoothing={0.28} radius={0.72} />
    <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
  </EffectComposer>
);

export const Environment: React.FC = () => (
  <>
    <color attach="background" args={['#020617']} />
    <Rig />
    <Sky />
    <Planet />
    <Post />
  </>
);

// ================================================================ FlightFX (screen space)
const RAYS = (() => {
  const r = mulberry32(1320);
  return Array.from({length: 140}, () => ({a: r() * Math.PI * 2, ph: r(), sp: 0.6 + r() * 0.9, w: 0.6 + r() * 2.2, warm: r() < 0.18, l: 0.5 + r() * 0.8}));
})();

/** Screen position of the direction of travel (vanishing point) and whether we fly forward into it. */
const vanishing = (g: number) => {
  const c = cameraAt(g);
  const v = sub(cameraAt(g + 1).pos, cameraAt(g - 1).pos);
  const sp = len(v);
  const cam = makeCamera(c);
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
  if (sp < 1e-3) return {x: W / 2, y: H / 2, fwd: 1, speed: 0};
  const u = norm(v);
  const ahead = fwd.x * u[0] + fwd.y * u[1] + fwd.z * u[2];
  const s = ahead >= 0 ? 1 : -1;
  const p = new THREE.Vector3(...(mul(u, s * 1e5) as V3)).add(new THREE.Vector3(...c.pos)).project(cam);
  const x = clamp((p.x * 0.5 + 0.5) * W, -W * 0.3, W * 1.3);
  const y = clamp((-p.y * 0.5 + 0.5) * H, -H * 0.3, H * 1.3);
  return {x, y, fwd: s, speed: sp / 2};
};

const sectionIndexAt = (g: number) => {
  for (let i = SECTIONS.length - 1; i >= 0; i--) if (g >= SECTIONS[i].start) return i;
  return 0;
};

/** Boundary flare intensity: sharp attack into the boundary, longer tail after (the whoosh). */
const flareAt = (g: number) => {
  let best = {k: 0, b: 0};
  for (const b of BOUNDARIES) {
    if (b === 720) continue; // the ignite is drawn by the turn itself
    const t = g - b;
    const k = t < 0 ? Math.exp(t / 3.5) : Math.exp(-t / 10);
    if (k > best.k) best = {k, b};
  }
  return best.k > 0.01 ? best : null;
};

export const FlightFX: React.FC = () => {
  const g = useCurrentFrame();
  const cam = cameraAt(g);
  const a = cam.flight;
  const fl = flareAt(g);
  if (a < 0.02 && !fl) return null;
  const vp = vanishing(g);
  const next = SECTIONS[Math.min(SECTIONS.length - 1, sectionIndexAt(g + 24))];
  const acc = sectionAccent(next.id);
  const tint = mixHex(acc, '#ffffff', 0.35);
  const R = Math.hypot(W, H) * 0.75;
  const drop = fl && fl.b === DROP ? fl.k : 0;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {a >= 0.02 ? (
        <>
          {/* light tunnel: the frame edges glow in the destination's accent, centred on the vanishing point */}
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse 70% 70% at ${((vp.x / W) * 100).toFixed(1)}% ${((vp.y / H) * 100).toFixed(1)}%, rgba(0,0,0,0) 38%, ${rgba(acc, 0.1 * a)} 72%, ${rgba(acc, 0.26 * a)} 100%)`,
            }}
          />
          <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
            {RAYS.map((r, i) => {
              // each ray travels outward (forward flight) or inward (pulling back), frame-driven
              const u0 = (r.ph + g * 0.045 * r.sp) % 1;
              const u = vp.fwd > 0 ? u0 : 1 - u0;
              const r1 = R * (0.08 + 0.92 * u * u);
              const r2 = r1 + R * 0.22 * r.l * a * (0.4 + u);
              const cx = Math.cos(r.a);
              const sy = Math.sin(r.a);
              const op = a * Math.min(1, u * 2.4) * (1 - u) * 1.6;
              if (op < 0.02) return null;
              return (
                <line
                  key={i}
                  x1={(vp.x + cx * r1).toFixed(1)}
                  y1={(vp.y + sy * r1).toFixed(1)}
                  x2={(vp.x + cx * r2).toFixed(1)}
                  y2={(vp.y + sy * r2).toFixed(1)}
                  stroke={r.warm ? C.coral : tint}
                  strokeWidth={(r.w * (0.5 + u)).toFixed(2)}
                  strokeLinecap="round"
                  opacity={Math.min(0.85, op).toFixed(3)}
                />
              );
            })}
          </svg>
          {/* the coral guide spark: leads the hop, sitting just ahead in the vanishing point */}
          {vp.fwd > 0 ? (
            <div
              style={{
                position: 'absolute',
                left: vp.x - 70,
                top: vp.y - 70,
                width: 140,
                height: 140,
                borderRadius: '50%',
                opacity: clamp(a * 1.4),
                background: `radial-gradient(circle, #ffffff 0%, #ffd9cc 6%, ${rgba(C.coral, 0.9)} 14%, ${rgba(C.coral, 0.25)} 34%, ${rgba(C.coral, 0)} 70%)`,
              }}
            />
          ) : null}
        </>
      ) : null}
      {fl ? (
        <>
          {/* anamorphic flare on the whoosh */}
          <div
            style={{
              position: 'absolute',
              left: vp.x - 900 * fl.k,
              top: vp.y - 3 - 4 * fl.k,
              width: 1800 * fl.k,
              height: 6 + 8 * fl.k,
              borderRadius: 999,
              opacity: Math.min(1, fl.k * 1.2),
              background: `linear-gradient(90deg, ${rgba(acc, 0)} 0%, ${rgba(tint, 0.65)} 35%, #ffffff 50%, ${rgba(tint, 0.65)} 65%, ${rgba(acc, 0)} 100%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: vp.x - 340,
              top: vp.y - 340,
              width: 680,
              height: 680,
              borderRadius: '50%',
              opacity: fl.k,
              background: `radial-gradient(circle, ${rgba('#ffffff', 0.9)} 0%, ${rgba(tint, 0.45)} 10%, ${rgba(acc, 0.12)} 34%, ${rgba(acc, 0)} 66%)`,
              mixBlendMode: 'screen',
            }}
          />
        </>
      ) : null}
      {drop > 0.01 ? (
        // BOOM: the dive through the satellite goes white-hot coral at the drop
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${((vp.x / W) * 100).toFixed(1)}% ${((vp.y / H) * 100).toFixed(1)}%, #ffffff 0%, #ffe6dc ${(18 + 30 * drop).toFixed(0)}%, ${rgba(C.coral, 0.95)} ${(46 + 30 * drop).toFixed(0)}%, ${rgba(C.coral, 0.6)} 100%)`,
            opacity: Math.min(1, drop * 1.15),
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
