// PLACEHOLDER environment (the framework builder replaces this file, keeping both exports):
// - <Environment/>: WebGL world-space backdrop shared by every section (planet at the origin, stars, lights).
// - <FlightFX/>: screen-space overlay driven by the camera's flight intensity (speed streaks during hops).
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {cameraAt} from '../engine/camera';
import {mulberry32} from '../engine/math';
import {PLANET_RADIUS} from '../engine/layout';

export const Environment: React.FC = () => {
  const stars = useMemo(() => {
    const rnd = mulberry32(7);
    const n = 4000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const r = 60000 + rnd() * 60000;
      const s = Math.sqrt(1 - u * u);
      pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);
  return (
    <>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[6000, 5000, 9000]} intensity={2.4} />
      <points geometry={stars}>
        <pointsMaterial color="#cfe0ff" size={2.2} sizeAttenuation={false} />
      </points>
      <mesh>
        <sphereGeometry args={[PLANET_RADIUS, 96, 64]} />
        <meshStandardMaterial color="#1a3ae0" roughness={0.3} metalness={0.15} />
      </mesh>
    </>
  );
};

export const FlightFX: React.FC = () => {
  const g = useCurrentFrame();
  const a = cameraAt(g).flight;
  if (a < 0.02) return null;
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(137,183,255,0.18) 100%)', opacity: a}} />;
};
