// 04 · Job focus — WebGL set: the Ebbinghaus spheres (lit, real), starlight dust and glows.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ACCENT, C} from '../../brand';
import {useGLFrame} from '../../engine/gl';
import {prog, smoother} from '../../engine/math';
import {Dust, GlowSprite, raw} from './gl3d';
import {CALM, NOISE, NOISE_FAR, ROLE_R, calmPos, calmVisible, noiseFarPos, noisePos, stageOffset} from './stage';

const A = ACCENT.focus;

const RIM_V = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const RIM_F = /* glsl */ `
uniform vec3 uColor; uniform float uAlpha; uniform float uPow;
varying vec3 vN; varying vec3 vV;
void main() {
  float r = 1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  gl_FragColor = vec4(uColor, pow(r, uPow) * uAlpha);
}`;
/** Additive fresnel rim shell (draw just outside a sphere). */
export const useRim = (color: string, alpha: number, pow = 3) => {
  const m = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {uColor: {value: new THREE.Vector3()}, uAlpha: {value: 1}, uPow: {value: 3}},
        vertexShader: RIM_V,
        fragmentShader: RIM_F,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  m.uniforms.uColor.value.copy(raw(color));
  m.uniforms.uAlpha.value = alpha;
  m.uniforms.uPow.value = pow;
  return m;
};

const Ball: React.FC<{p: [number, number, number]; r: number; mat: THREE.Material; rim?: THREE.Material; rimK?: number; seg?: number}> = ({p, r, mat, rim, rimK = 1.012, seg = 64}) => (
  <group position={p}>
    <mesh material={mat}>
      <sphereGeometry args={[r, seg, Math.round(seg * 0.75)]} />
    </mesh>
    {rim ? (
      <mesh material={rim} renderOrder={5}>
        <sphereGeometry args={[r * rimK, seg, Math.round(seg * 0.75)]} />
      </mesh>
    ) : null}
  </group>
);

export const GL: React.FC = () => {
  const f = useGLFrame();
  const noiseMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#131d4c', roughness: 0.58, metalness: 0.5}), []);
  const farMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#0f173f', roughness: 0.62, metalness: 0.45}), []);
  const roleMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#f3f7ff', roughness: 0.22, metalness: 0.05, emissive: new THREE.Color('#c9d8ff'), emissiveIntensity: 0.55}), []);
  const calmMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#cfdcff', roughness: 0.3, metalness: 0.1, emissive: new THREE.Color('#89b7ff'), emissiveIntensity: 0.35}), []);
  const noiseRim = useRim('#6f8cff', 1.0, 2.3);
  const roleRim = useRim(C.coral, 1.0, 2.2);
  const calmRim = useRim(A, 0.6, 2.5);
  const off = stageOffset(f);
  const settle = smoother(prog(f, 150, 220));
  return (
    <group>
      {/* station light: starlight key, coral key from the satellite side, cobalt fill (windowed so neighbours stay unlit) */}
      <pointLight position={[700, 900, 1700]} intensity={2.4} decay={0} distance={5200} color="#eef3ff" />
      <pointLight position={[-1600, 350, 500]} intensity={0.9} decay={0} distance={5200} color={C.coral} />
      <pointLight position={[200, -1400, -600]} intensity={1.1} decay={0} distance={5200} color="#2345e0" />

      {/* far nebula glow behind the set (depth layer 3, with the planet) */}
      <GlowSprite position={[300, 200, -3800]} size={6400} color="#2345e0" alpha={0.16} pow={1.6} renderOrder={1} />
      <GlowSprite position={[-900, -300, -2600]} size={3600} color={A} alpha={0.05} pow={1.8} renderOrder={1} />

      {/* giant noise spheres */}
      {NOISE.map((_, i) => (
        <Ball key={i} p={noisePos(i, f)} r={NOISE[i].r} mat={noiseMat} rim={noiseRim} />
      ))}
      {NOISE_FAR.map((n, i) => (
        <Ball key={`far${i}`} p={noiseFarPos(i, f)} r={n.r} mat={farMat} rim={noiseRim} seg={48} />
      ))}

      {/* the role sphere + its calm companions (recede together behind the holograms later) */}
      <group position={off}>
        <GlowSprite position={[0, 0, -20]} size={ROLE_R * 5.2} color={A} alpha={0.22 + 0.2 * settle} pow={2.6} />
        <Ball p={[0, 0, 0]} r={ROLE_R} mat={roleMat} rim={roleRim} rimK={1.006} seg={96} />
        {CALM.map((c, i) => (calmVisible(i, f) ? <Ball key={i} p={calmPos(i, f)} r={c.r} mat={calmMat} rim={calmRim} seg={40} /> : null))}
      </group>

      {/* dust: foreground motes drifting past the lens + a finer mid layer */}
      <Dust seed={41} count={260} min={[-1800, -1100, -1400]} span={[3600, 2200, 3600]} frame={f} color={A} size={[4, 14]} vel={[0.25, 0.35, 0.6]} jitter={0.6} alpha={0.75} />
      <Dust seed={42} count={420} min={[-2600, -1600, -3600]} span={[5200, 3200, 3400]} frame={f} color="#89b7ff" size={[3, 7]} vel={[0.1, 0.15, 0]} jitter={0.3} alpha={0.5} />
    </group>
  );
};
