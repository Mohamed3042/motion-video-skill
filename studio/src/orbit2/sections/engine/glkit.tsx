// WebGL kit for stations 9 and 10: pre-blurred additive glows and drifting foreground dust (frame-driven, seeded).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mulberry32, type V3} from '../../engine/math';

let RADIAL: THREE.Texture | null = null;
/** Soft radial falloff texture (built once, deterministic). */
export const radialTex = () => {
  if (RADIAL) return RADIAL;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.14)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  RADIAL = new THREE.CanvasTexture(c);
  RADIAL.colorSpace = THREE.SRGBColorSpace;
  return RADIAL;
};

/** Additive billboard glow. `s` = diameter in units (number or [w, h]). */
export const GlowSprite: React.FC<{p: V3; s: number | [number, number]; color: string; a?: number}> = ({p, s, color, a = 1}) => {
  if (a <= 0.003) return null;
  const [w, h] = typeof s === 'number' ? [s, s] : s;
  return (
    <sprite position={p} scale={[w, h, 1]}>
      <spriteMaterial map={radialTex()} color={color} transparent opacity={Math.min(1, a)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );
};

/** Drifting dust motes in a box (local coords). Foreground layer: seen big and soft when near the lens. */
export const Dust: React.FC<{f: number; seed: number; n: number; box: [V3, V3]; color: string; size?: number; drift?: V3; opacity?: number}> = ({
  f,
  seed,
  n,
  box,
  color,
  size = 7,
  drift = [0.4, 0.25, 0],
  opacity = 0.8,
}) => {
  const geo = useMemo(() => {
    const rnd = mulberry32(seed);
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = box[0][k] + rnd() * (box[1][k] - box[0][k]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, [seed, n, JSON.stringify(box)]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <points geometry={geo} position={[drift[0] * f, drift[1] * f, drift[2] * f]}>
      <pointsMaterial map={radialTex()} color={color} size={size} sizeAttenuation transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </points>
  );
};
