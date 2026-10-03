// WebGL kit for stations 1–3: soft glow sprites, accent dust, far nebula, station lights. LOCAL coords, frame-driven.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mulberry32, type V3} from '../../engine/math';

// one shared radial-falloff texture (white; tint with material colour)
let GLOW: THREE.DataTexture | null = null;
export const glowTex = () => {
  if (GLOW) return GLOW;
  const N = 128;
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = (x + 0.5) / N - 0.5;
      const dy = (y + 0.5) / N - 0.5;
      const r = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
      const a = Math.pow(1 - r, 2.2) * (0.55 + 0.45 * Math.exp(-r * r * 18));
      const i = (y * N + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(255 * a);
    }
  GLOW = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  GLOW.needsUpdate = true;
  GLOW.magFilter = THREE.LinearFilter;
  GLOW.minFilter = THREE.LinearFilter;
  return GLOW;
};

/** Additive soft glow (billboard sprite). `size` in world units. */
export const Glow: React.FC<{p?: V3; size: number; color: string; opacity?: number; sx?: number; ro?: number}> = ({p = [0, 0, 0], size, color, opacity = 1, sx = 1, ro = 0}) =>
  opacity <= 0.002 ? null : (
    <sprite position={p} scale={[size * sx, size, 1]} renderOrder={ro}>
      <spriteMaterial map={glowTex()} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );

/** Accent dust: soft points in a box, slowly drifting (midground particles). */
export const Dust: React.FC<{f: number; seed: number; n: number; box: [number, number, number, number, number, number]; color: string; size?: number; opacity?: number; spin?: number}> = ({
  f,
  seed,
  n,
  box,
  color,
  size = 14,
  opacity = 0.8,
  spin = 0.0004,
}) => {
  const geo = useMemo(() => {
    const r = mulberry32(seed);
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([box[0] + (box[1] - box[0]) * r(), box[2] + (box[3] - box[2]) * r(), box[4] + (box[5] - box[4]) * r()], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, n]);
  const cx = (box[0] + box[1]) / 2;
  const cz = (box[4] + box[5]) / 2;
  return (
    <group position={[cx, f * 0.15, cz]} rotation={[0, f * spin, 0]}>
      <points geometry={geo} position={[-cx, 0, -cz]}>
        <pointsMaterial map={glowTex()} color={color} size={size} sizeAttenuation transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </points>
    </group>
  );
};

/** Far accent haze behind a station (tints the far layer so each station reads as its own place). */
export const Nebula: React.FC<{color: string; p?: V3; size?: number; opacity?: number}> = ({color, p = [0, 600, -5200], size = 9000, opacity = 0.22}) => (
  <>
    <Glow p={p} size={size} color={color} opacity={opacity} sx={1.5} />
    <Glow p={[p[0] - size * 0.25, p[1] - size * 0.08, p[2] - 400]} size={size * 0.6} color="#2345e0" opacity={opacity * 0.9} />
  </>
);

/** Key (coral, satellite side) + cobalt fill + cool rim — local to the station (decay 0, range-limited). */
export const StationLights: React.FC<{accent: string; power?: number; range?: number}> = ({accent, power = 1.6, range = 7000}) => (
  <>
    <pointLight position={[-1800, 1400, 2200]} color="#ff9a76" intensity={power} decay={0} distance={range} />
    <pointLight position={[2200, -600, 1600]} color="#3d5cff" intensity={0.9} decay={0} distance={range} />
    <pointLight position={[0, 1600, -2600]} color={accent} intensity={1.2} decay={0} distance={range} />
  </>
);

// a flat disc with a soft edge (alpha 1 to 80 % of the radius, then a smooth falloff)
let SOFT: THREE.DataTexture | null = null;
export const softDiscTex = () => {
  if (SOFT) return SOFT;
  const N = 256;
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const r = Math.hypot((x + 0.5) / N - 0.5, (y + 0.5) / N - 0.5) * 2;
      const t = Math.min(1, Math.max(0, (r - 0.72) / 0.28));
      const i = (y * N + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(255 * (1 - t * t * (3 - 2 * t)));
    }
  SOFT = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  SOFT.needsUpdate = true;
  SOFT.magFilter = THREE.LinearFilter;
  SOFT.minFilter = THREE.LinearFilter;
  return SOFT;
};

// gaussian blob: a blurred disc (alpha 1 at the centre, ~0.5 at 40 % of the radius)
let BLOB: THREE.DataTexture | null = null;
export const blobTex = () => {
  if (BLOB) return BLOB;
  const N = 128;
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const r = Math.hypot((x + 0.5) / N - 0.5, (y + 0.5) / N - 0.5) * 2;
      const i = (y * N + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(255 * Math.exp(-((r / 0.48) ** 2) * 2.6) * (1 - r * r * r));
    }
  BLOB = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  BLOB.needsUpdate = true;
  BLOB.magFilter = THREE.LinearFilter;
  BLOB.minFilter = THREE.LinearFilter;
  return BLOB;
};

/** Soft glow with normal (not additive) blending — a blurred disc of colour, e.g. the lilac-chaser lanterns. */
export const Blur: React.FC<{p?: V3; size: number; color: string; opacity?: number; ro?: number}> = ({p = [0, 0, 0], size, color, opacity = 1, ro = 0}) =>
  opacity <= 0.002 ? null : (
    <sprite position={p} scale={[size, size, 1]} renderOrder={ro}>
      <spriteMaterial map={blobTex()} color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </sprite>
  );
