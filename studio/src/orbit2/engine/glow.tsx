// Job Orbit v2 engine helper (additive): soft glows for the WebGL layer.
//   glowTexture()            radial falloff texture (white), cached; tint it with the material colour
//   <Glow3D p size color/>   an additive, camera-facing glow sprite (world units), never writes depth
// Sections may use these for light sources, beacons, hot cores (bloom then adds the halo).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import type {V3} from './math';

let cached: THREE.Texture | null = null;
/** 256² radial falloff (bright core, long soft tail). Drawn once in code. */
export const glowTexture = () => {
  if (cached) return cached;
  const N = 256;
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x + 0.5 - N / 2, y + 0.5 - N / 2) / (N / 2);
      const a = d >= 1 ? 0 : Math.exp(-d * d * 7) * 0.85 + Math.max(0, 1 - d) ** 3 * 0.15;
      const i = (y * N + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(255 * Math.min(1, a));
    }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.NoColorSpace;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  cached = t;
  return t;
};

/** Additive glow sprite. `intensity` > 1 pushes the core into bloom. */
export const Glow3D: React.FC<{p?: V3; size: number; color: string; opacity?: number; intensity?: number; renderOrder?: number}> = ({p = [0, 0, 0], size, color, opacity = 1, intensity = 1, renderOrder = 10}) => {
  const mat = useMemo(
    () => new THREE.SpriteMaterial({map: glowTexture(), color: new THREE.Color(color), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: true}),
    [color],
  );
  mat.opacity = opacity;
  mat.color.set(color).multiplyScalar(intensity);
  if (opacity <= 0.002 || size <= 0) return null;
  return <sprite position={p} scale={[size, size, 1]} material={mat} renderOrder={renderOrder} />;
};
