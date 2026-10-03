// Shared WebGL helpers for stations 4–6: additive glow sprites (shader billboards, no useFrame), seeded drifting dust,
// and raw (un-tonemapped) colour uniforms. All motion is driven by the frame passed in.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mulberry32, type V3} from '../../engine/math';

/** Hex → raw RGB vector (no colour management), for ShaderMaterials that write display values directly. */
export const raw = (hex: string, k = 1) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3((((n >> 16) & 255) / 255) * k, (((n >> 8) & 255) / 255) * k, ((n & 255) / 255) * k);
};

const SPRITE_V = /* glsl */ `
uniform float uSize;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  mv.xy += position.xy * uSize;
  gl_Position = projectionMatrix * mv;
}`;
const SPRITE_F = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
uniform float uPow;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(clamp(1.0 - d, 0.0, 1.0), uPow);
  gl_FragColor = vec4(uColor, a * uAlpha);
}`;

/** Camera-facing additive glow (billboarded in the vertex shader). size = diameter in world units. */
export const GlowSprite: React.FC<{position: V3; size: number; color: string; alpha?: number; pow?: number; renderOrder?: number}> = ({position, size, color, alpha = 1, pow = 2.2, renderOrder = 10}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {uSize: {value: 1}, uColor: {value: new THREE.Vector3()}, uAlpha: {value: 1}, uPow: {value: 2}},
        vertexShader: SPRITE_V,
        fragmentShader: SPRITE_F,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  mat.uniforms.uSize.value = size;
  mat.uniforms.uColor.value.copy(raw(color));
  mat.uniforms.uAlpha.value = alpha;
  mat.uniforms.uPow.value = pow;
  if (alpha <= 0.002) return null;
  return (
    <mesh position={position} material={mat} renderOrder={renderOrder} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};

const DUST_V = /* glsl */ `
attribute float aSize;
attribute vec3 aVel;
attribute float aPhase;
uniform float uFrame;
uniform vec3 uMin;
uniform vec3 uSpan;
uniform float uScale;
varying float vA;
void main() {
  vec3 p = uMin + mod(position + aVel * uFrame - uMin, uSpan);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float z = -mv.z;
  gl_PointSize = clamp(aSize * uScale / max(z, 1.0), 0.0, 90.0);
  vA = (0.6 + 0.4 * sin(uFrame * 0.045 + aPhase)) * smoothstep(40.0, 420.0, z);
  // soften the wrap seams: fade near the box faces
  vec3 q = (p - uMin) / uSpan;
  vec3 e = smoothstep(0.0, 0.08, q) * smoothstep(1.0, 0.92, q);
  vA *= e.x * e.y * e.z;
  gl_Position = projectionMatrix * mv;
}`;
const DUST_F = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(clamp(1.0 - d, 0.0, 1.0), 1.7);
  gl_FragColor = vec4(uColor, a * vA * uAlpha);
}`;

/** Seeded dust in a box [min, min+span], drifting with `vel` (units/frame ± jitter). Sizes in world units. */
export const Dust: React.FC<{seed: number; count: number; min: V3; span: V3; frame: number; color: string; size?: [number, number]; vel?: V3; jitter?: number; alpha?: number}> = ({
  seed,
  count,
  min,
  span,
  frame,
  color,
  size = [3, 9],
  vel = [0, 0.4, 0],
  jitter = 0.5,
  alpha = 1,
}) => {
  const geo = useMemo(() => {
    const r = mulberry32(seed);
    const pos = new Float32Array(count * 3);
    const v = new Float32Array(count * 3);
    const s = new Float32Array(count);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos.set([min[0] + r() * span[0], min[1] + r() * span[1], min[2] + r() * span[2]], i * 3);
      v.set([vel[0] + (r() - 0.5) * jitter, vel[1] + (r() - 0.5) * jitter, vel[2] + (r() - 0.5) * jitter], i * 3);
      const k = r();
      s[i] = size[0] + (size[1] - size[0]) * k * k;
      ph[i] = r() * 6.283;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aVel', new THREE.BufferAttribute(v, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(s, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, count]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uFrame: {value: 0},
          uMin: {value: new THREE.Vector3()},
          uSpan: {value: new THREE.Vector3()},
          uScale: {value: 1484},
          uColor: {value: new THREE.Vector3()},
          uAlpha: {value: 1},
        },
        vertexShader: DUST_V,
        fragmentShader: DUST_F,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  mat.uniforms.uFrame.value = frame;
  mat.uniforms.uMin.value.set(...min);
  mat.uniforms.uSpan.value.set(...span);
  mat.uniforms.uColor.value.copy(raw(color));
  mat.uniforms.uAlpha.value = alpha;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={20} />;
};
