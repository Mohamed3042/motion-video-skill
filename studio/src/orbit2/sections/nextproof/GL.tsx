// 06 · Next proof — WebGL set: glowing rails and ties receding to the planet on the horizon, and the two identical
// step-bars (placed from the camera itself, at the same depth). Rails/ties fade with distance in their shader.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ACCENT} from '../../brand';
import {useGLFrame} from '../../engine/gl';
import {prog, smoother} from '../../engine/math';
import {Dust, GlowSprite, raw} from '../focus/gl3d';
import {FY} from './shot';
import {BAR_LEN, BAR_TH, RAIL_X, RAIL_Z, TIE_STEP, barExit, barPos, camPitch} from './stage';

const A = ACCENT.nextproof;

const LINE_V = /* glsl */ `
varying float vD;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vD = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const LINE_F = /* glsl */ `
uniform vec3 uColor;
uniform float uK;
uniform vec2 uFar; // full until uFar.x (distance from the camera), gone at uFar.y
varying float vD;
void main() {
  float a = 1.0 - smoothstep(uFar.x, uFar.y, vD);
  gl_FragColor = vec4(uColor * uK * a, 1.0);
}`;
const useLineMat = (color: string, k: number, far: [number, number]) =>
  useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {uColor: {value: raw(color)}, uK: {value: k}, uFar: {value: new THREE.Vector2(...far)}},
        vertexShader: LINE_V,
        fragmentShader: LINE_F,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

const TIES = (() => {
  const out: number[] = [];
  for (let z = RAIL_Z[1]; z > RAIL_Z[0]; z -= TIE_STEP) out.push(z);
  return out;
})();
const RAIL_LEN = RAIL_Z[1] - RAIL_Z[0];
const RAIL_MID = (RAIL_Z[0] + RAIL_Z[1]) / 2;

export const GL: React.FC = () => {
  const f = useGLFrame();
  const railMat = useLineMat(A, 2.4, [3500, 9000]);
  const tieMat = useLineMat(A, 0.7, [2500, 7500]);
  const barMat = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color(A).multiplyScalar(2.2), transparent: true}), []);
  const out = barExit(f);
  barMat.opacity = 1 - out;
  const pitch = camPitch(f);
  const glowA = 0.55 * (1 - out);
  const pa = barPos('A', f);
  const pb = barPos('B', f);
  const intro = smoother(prog(f, 30, 62));
  return (
    <group>
      <pointLight position={[0, FY + 900, 600]} intensity={1.2} decay={0} distance={5200} color={A} />

      {/* horizon haze where the rails meet the planet */}
      <GlowSprite position={[0, FY + 60, RAIL_Z[0] + 300]} size={5200} color={A} alpha={0.12} pow={1.7} renderOrder={1} />
      <GlowSprite position={[0, FY + 200, RAIL_Z[0] - 600]} size={9000} color="#2345e0" alpha={0.14} pow={1.5} renderOrder={1} />

      {/* rails (glowing, with a soft bed) */}
      {[-RAIL_X, RAIL_X].map((x) => (
        <group key={x}>
          <mesh material={railMat} position={[x, FY, RAIL_MID]}>
            <boxGeometry args={[7, 7, RAIL_LEN, 1, 1, 64]} />
          </mesh>
        </group>
      ))}
      {TIES.map((z) => (
        <mesh key={z} material={tieMat} position={[0, FY - 4, z]}>
          <boxGeometry args={[2 * RAIL_X + 120, 3, 5]} />
        </mesh>
      ))}

      {/* the two identical step-bars, same depth in front of the camera */}
      {out < 0.999
        ? [pa, pb].map((p, i) => (
            <group key={i} position={p} rotation={[-pitch, 0, 0]}>
              <mesh material={barMat}>
                <boxGeometry args={[BAR_LEN, BAR_TH, BAR_TH]} />
              </mesh>
              <GlowSprite position={[0, 0, 0]} size={BAR_LEN * 1.5 * intro} color={A} alpha={glowA * 0.5} pow={2.6} />
            </group>
          ))
        : null}

      <Dust seed={61} count={260} min={[-1800, FY - 200, -3200]} span={[3600, 2400, 6400]} frame={f} color={A} size={[4, 12]} vel={[0, 0.25, 0.3]} jitter={0.4} alpha={0.65} />
      <Dust seed={62} count={360} min={[-3600, FY - 400, -7800]} span={[7200, 3600, 6000]} frame={f} color="#ffd6de" size={[3, 7]} vel={[0.05, 0.1, 0]} jitter={0.2} alpha={0.35} />
    </group>
  );
};
