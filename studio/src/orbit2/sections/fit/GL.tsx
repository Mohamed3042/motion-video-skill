// 05 · Your fit — WebGL set: a real checkerboard lit by one lamp, a cylinder whose shadow is RAY-CAST per pixel
// (analytic cylinder occlusion, mirrored from stage.ts), and the probe tiles A and B. Tiles write display values
// directly (no tone mapping) so the solved albedo makes A and B render to the same grey.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {ACCENT} from '../../brand';
import {useGLFrame} from '../../engine/gl';
import {mulberry32, prog, smoother} from '../../engine/math';
import {Dust, GlowSprite} from '../focus/gl3d';
import {AMB, A_IJ, B_IJ, CYL, DARK_ALBEDO, DIR, JOIN_YAW, LAMP, LIGHT_ALBEDO, N, T, THICK, caster, dropOf, isLight, join, probePos, tileCenter} from './stage';

const A = ACCENT.fit;

const TILE_V = /* glsl */ `
uniform vec3 uHome;
varying vec3 vP;
varying vec3 vN;
void main() {
  vP = uHome + position;
  vN = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const TILE_F = /* glsl */ `
uniform vec3 uAlbedo;
uniform vec3 uLamp;
uniform vec4 uCyl; // x, z, r, h
uniform float uAmb;
uniform float uDir;
uniform float uAlpha;
varying vec3 vP;
varying vec3 vN;
float occl(vec3 P) {
  vec3 D = uLamp - P;
  float t0 = clamp((0.0 - P.y) / D.y, 0.0, 1.0);
  float t1 = clamp((uCyl.w - P.y) / D.y, 0.0, 1.0);
  vec2 q = P.xz - uCyl.xy;
  float dd = dot(D.xz, D.xz);
  float ts = min(t1, max(t0, -dot(q, D.xz) / dd));
  float d = length(q + ts * D.xz);
  float s = 6.0 + 0.12 * ts * length(D);
  return 1.0 - smoothstep(uCyl.z - s, uCyl.z + s, d);
}
void main() {
  // side faces take the top-face light at their edge, darkened by a fixed factor (so A and B stay consistent)
  vec3 P = vP;
  vec3 Nn = normalize(vN);
  float side = 1.0;
  if (Nn.y < 0.5) { P.y = 0.0; Nn = vec3(0.0, 1.0, 0.0); side = 0.62; }
  vec3 L = uLamp - P;
  float dist = length(L);
  float diff = max(dot(Nn, L / dist), 0.0);
  float att = pow(2300.0 / dist, 0.5);
  float k = side * (uAmb + uDir * diff * att * (1.0 - occl(P)));
  gl_FragColor = vec4(uAlbedo * k, uAlpha);
}`;

const rnd = mulberry32(505);
const TUMBLE = Array.from({length: N * N}, () => [(rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.7, 0.8 + rnd() * 0.5]);
const isProbe = (i: number, j: number) => (i === A_IJ[0] && j === A_IJ[1]) || (i === B_IJ[0] && j === B_IJ[1]);

export const GL: React.FC = () => {
  const f = useGLFrame();
  const mats = useMemo(
    () =>
      Array.from({length: N * N}, (_, k) => {
        const i = k % N;
        const j = Math.floor(k / N);
        const c = tileCenter(i, j);
        const alb = isLight(i, j) ? LIGHT_ALBEDO : DARK_ALBEDO;
        return new THREE.ShaderMaterial({
          uniforms: {
            uHome: {value: new THREE.Vector3(c[0], -THICK / 2, c[2])},
            uAlbedo: {value: new THREE.Vector3(...alb)},
            uLamp: {value: new THREE.Vector3(...LAMP)},
            uCyl: {value: new THREE.Vector4(CYL.x, CYL.z, CYL.r, CYL.h)},
            uAmb: {value: AMB},
            uDir: {value: DIR},
            uAlpha: {value: 1},
          },
          vertexShader: TILE_V,
          fragmentShader: TILE_F,
          transparent: true,
        });
      }),
    [],
  );
  const plinth = useMemo(() => new THREE.MeshStandardMaterial({color: '#0b1440', roughness: 0.5, metalness: 0.6}), []);
  const edge = useMemo(() => new THREE.MeshBasicMaterial({color: A, transparent: true}), []);
  const cyl = useMemo(() => new THREE.MeshStandardMaterial({color: '#5f968c', roughness: 0.34, metalness: 0.08}), []);
  const lampMat = useMemo(() => new THREE.MeshBasicMaterial({color: '#fff3e0'}), []);

  const ground = smoother(prog(f, 184, 222)); // plinth + context fall away
  const lift = caster(f);
  const jn = join(f);
  const probeOut = smoother(prog(f, 246, 292)); // the joined slab sinks away under the hologram
  edge.opacity = 0.85 * (1 - ground);
  const W = N * T;

  const tiles: React.ReactNode[] = [];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      const c = tileCenter(i, j);
      const m = mats[k];
      if (isProbe(i, j)) {
        const which = i === A_IJ[0] ? 'A' : 'B';
        const p = probePos(which, f);
        m.uniforms.uAlpha.value = 1 - probeOut;
        if (probeOut >= 0.999) continue;
        tiles.push(
          <mesh key={k} material={m} position={[p[0], p[1] - THICK / 2 - 260 * probeOut * probeOut, p[2]]} rotation={[0, (JOIN_YAW * Math.PI * jn) / 180, 0]}>
            <boxGeometry args={[T - 3, THICK, T - 3]} />
          </mesh>,
        );
        continue;
      }
      const d = dropOf(i, j, f);
      const a = 1 - smoother(Math.min(1, d * 1.5));
      m.uniforms.uAlpha.value = a;
      if (a <= 0.003) continue;
      const tm = TUMBLE[k];
      tiles.push(
        <mesh key={k} material={m} position={[c[0], -THICK / 2 - 900 * tm[2] * d * d, c[2]]} rotation={[tm[0] * d, 0, tm[1] * d]}>
          <boxGeometry args={[T - 3, THICK, T - 3]} />
        </mesh>,
      );
    }

  return (
    <group>
      {/* the lamp: one warm key (windowed so neighbouring stations stay unlit) + a cool fill */}
      <pointLight position={LAMP} intensity={2.3} decay={0} distance={5200} color="#ffe9cc" />
      <pointLight position={[-1400, 500, 1200]} intensity={0.5} decay={0} distance={5200} color="#6f8cff" />
      <mesh position={LAMP} material={lampMat}>
        <sphereGeometry args={[30, 32, 24]} />
      </mesh>
      <GlowSprite position={LAMP} size={520} color="#fff1dc" alpha={0.9} pow={3.2} />
      <GlowSprite position={LAMP} size={1700} color={A} alpha={0.32} pow={2.2} />

      {/* far glows: amber haze behind the set */}
      <GlowSprite position={[600, 300, -3600]} size={7000} color={A} alpha={0.07} pow={1.6} renderOrder={1} />
      <GlowSprite position={[-1800, -400, -2800]} size={4200} color="#2345e0" alpha={0.12} pow={1.6} renderOrder={1} />

      {/* plinth with amber edge light */}
      {ground < 0.999 ? (
        <group position={[0, -THICK - 900 * ground * ground, 0]}>
          <mesh material={plinth} position={[0, -45, 0]}>
            <boxGeometry args={[W + 60, 90, W + 60]} />
          </mesh>
          {[
            [0, 0, (W + 60) / 2, W + 60, 5],
            [0, 0, -(W + 60) / 2, W + 60, 5],
            [(W + 60) / 2, 0, 0, 5, W + 60],
            [-(W + 60) / 2, 0, 0, 5, W + 60],
          ].map(([x, y, z, sx, sz], k) => (
            <mesh key={k} material={edge} position={[x, y, z]}>
              <boxGeometry args={[sx, 4, sz]} />
            </mesh>
          ))}
        </group>
      ) : null}
      {tiles}

      {/* the shadow caster: lifts away (the shadow it cast stays painted — the greys are what the eye saw) */}
      {lift < 0.999 ? (
        <mesh material={cyl} position={[CYL.x, CYL.h / 2 + 1500 * lift * lift, CYL.z]}>
          <cylinderGeometry args={[CYL.r, CYL.r, CYL.h, 72]} />
        </mesh>
      ) : null}

      <Dust seed={51} count={300} alpha={0.6 * (1 - 0.75 * smoother(prog(f, 170, 184)) * (1 - smoother(prog(f, 236, 256))))} min={[-2000, -900, -2000]} span={[4000, 2600, 4000]} frame={f} color={A} size={[4, 13]} vel={[0.2, 0.3, 0.25]} jitter={0.5} />
      <Dust seed={52} count={380} min={[-3000, -1600, -3600]} span={[6000, 3600, 3000]} frame={f} color="#c9b6ff" size={[3, 7]} vel={[0.05, 0.1, 0]} jitter={0.2} alpha={0.35} />
    </group>
  );
};
