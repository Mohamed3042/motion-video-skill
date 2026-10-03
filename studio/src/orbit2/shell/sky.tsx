// Deep space around the Orbit system (WebGL, world space): seeded starfield with a faint galactic band,
// cobalt/violet nebula veils, camera-wrapped dust for foreground parallax, the helix orbit trail that links the
// ten stations, and a beacon at every station (fades out as the camera arrives, so it never sits on a set).
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {Line2} from 'three/examples/jsm/lines/Line2.js';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry.js';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {ACCENT} from '../brand';
import {WORLDS} from '../timing';
import {cameraAt} from '../engine/camera';
import {PLACEMENT, STATION_RADIUS} from '../engine/layout';
import {clamp, len, mulberry32, smooth, sub, type V3} from '../engine/math';
import {Glow3D, glowTexture} from '../engine/glow';
import {W} from '../engine/space';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- stars
const STAR_VS = /* glsl */ `
attribute float size; attribute vec3 tint; attribute float phase;
uniform float uFrame; uniform float uBright;
varying vec3 vC;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float tw = 0.78 + 0.22 * sin(uFrame * (0.03 + 0.05 * phase) + phase * 40.0);
  gl_PointSize = size;
  vC = tint * tw * uBright;
}`;
const STAR_FS = /* glsl */ `
varying vec3 vC;
void main(){
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-r * r * 4.5) + 0.5 * exp(-r * r * 22.0);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;

const Stars: React.FC<{bright: number; frame: number}> = ({bright, frame}) => {
  const {geo, mat} = useMemo(() => {
    const rnd = mulberry32(20261003);
    const n = 9000;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const tint = new Float32Array(n * 3);
    const phase = new Float32Array(n);
    // galactic band: a great circle tilted across the sky
    const bandN: V3 = [0.32, 0.88, -0.35];
    const bl = Math.hypot(...bandN);
    for (let i = 0; i < n; i++) {
      let x: number;
      let y: number;
      let z: number;
      for (;;) {
        const u = rnd() * 2 - 1;
        const th = rnd() * TAU;
        const s = Math.sqrt(1 - u * u);
        x = s * Math.cos(th);
        y = u;
        z = s * Math.sin(th);
        const off = Math.abs((x * bandN[0] + y * bandN[1] + z * bandN[2]) / bl);
        if (i % 3 !== 0 || rnd() < Math.exp(-off * off * 18)) break; // a third of the stars crowd into the band
      }
      const r = 160000 + rnd() * 90000;
      pos.set([x * r, y * r, z * r], i * 3);
      const big = rnd();
      size[i] = big > 0.992 ? 4.2 + rnd() * 2.5 : big > 0.94 ? 2.4 + rnd() * 1.4 : 1.1 + rnd() * 1.3;
      const k = big > 0.992 ? 2.6 : big > 0.94 ? 1.3 : 0.55 + 0.45 * rnd();
      const temp = rnd();
      const c = temp < 0.12 ? [1.0, 0.82, 0.68] : temp < 0.5 ? [0.78, 0.86, 1.0] : [0.92, 0.95, 1.0];
      tint.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
      phase[i] = rnd();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
    geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: {uFrame: {value: 0}, uBright: {value: 1}},
      vertexShader: STAR_VS,
      fragmentShader: STAR_FS,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });
    return {geo, mat};
  }, []);
  mat.uniforms.uFrame.value = frame;
  mat.uniforms.uBright.value = bright;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={-10} />;
};

// ---------------------------------------------------------------- nebula veils (procedural texture, drawn once)
let nebulaTex: THREE.Texture | null = null;
const nebulaTexture = () => {
  if (nebulaTex) return nebulaTex;
  const N = 256;
  const rnd = mulberry32(4711);
  const blobs = Array.from({length: 46}, () => {
    const a = rnd() * TAU;
    const d = Math.sqrt(rnd()) * 0.36;
    return {x: 0.5 + Math.cos(a) * d, y: 0.5 + Math.sin(a) * d * 0.62, r: 0.06 + rnd() * 0.18, k: 0.25 + rnd() * 0.75};
  });
  const data = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N;
      const v = (y + 0.5) / N;
      let s = 0;
      for (const b of blobs) {
        const d2 = ((u - b.x) ** 2 + (v - b.y) ** 2) / (b.r * b.r);
        s += b.k * Math.exp(-d2 * 2.2);
      }
      const edge = Math.max(0, 1 - Math.hypot(u - 0.5, (v - 0.5) / 0.7) * 2) ** 1.5;
      const a = Math.min(1, 0.5 * s) * edge;
      const i = (y * N + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 255;
      data[i + 3] = Math.round(255 * a);
    }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  nebulaTex = t;
  return t;
};

const NEBULAE: Array<{dir: V3; size: number; color: string; op: number; rot: number}> = [
  {dir: [-0.6, 0.35, -0.72], size: 260000, color: '#2340ff', op: 0.34, rot: 0.4},
  {dir: [0.75, 0.1, -0.65], size: 220000, color: '#6a3cff', op: 0.24, rot: -0.7},
  {dir: [0.2, -0.45, 0.87], size: 240000, color: '#1f35d8', op: 0.3, rot: 1.9},
  {dir: [-0.85, -0.2, 0.48], size: 200000, color: '#5530e0', op: 0.2, rot: 2.6},
  {dir: [0.1, 0.92, 0.38], size: 280000, color: '#1a2fb0', op: 0.24, rot: 0.9},
  {dir: [0.55, 0.3, 0.78], size: 180000, color: '#7a46ff', op: 0.16, rot: -1.4},
];

const Nebula: React.FC<{k: number}> = ({k}) => {
  const mats = useMemo(
    () => NEBULAE.map((n) => new THREE.SpriteMaterial({map: nebulaTexture(), color: new THREE.Color(n.color), rotation: n.rot, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false})),
    [],
  );
  return (
    <>
      {NEBULAE.map((n, i) => {
        mats[i].opacity = n.op * k;
        const l = Math.hypot(...n.dir);
        const D = 300000;
        return <sprite key={i} position={[(n.dir[0] / l) * D, (n.dir[1] / l) * D, (n.dir[2] / l) * D]} scale={[n.size, n.size * 0.7, 1]} material={mats[i]} renderOrder={-20} frustumCulled={false} />;
      })}
    </>
  );
};

// ---------------------------------------------------------------- dust (wraps around the camera)
const DUST_VS = /* glsl */ `
attribute float size; attribute float tint;
uniform vec3 uCam; uniform float uCell; uniform float uP; uniform float uFrame;
varying float vA; varying float vT;
void main(){
  vec3 p = position + vec3(sin(uFrame * 0.011 + position.y * 0.001) * 60.0, uFrame * 0.9, cos(uFrame * 0.009 + position.x * 0.001) * 60.0);
  p = mod(p - uCam, uCell) - 0.5 * uCell + uCam;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float d = -mv.z;
  gl_PointSize = clamp(size * uP / max(d, 1.0), 0.0, 40.0);
  vA = smoothstep(90.0, 520.0, d) * (1.0 - smoothstep(uCell * 0.28, uCell * 0.46, length(p - uCam)));
  vT = tint;
}`;
const DUST_FS = /* glsl */ `
uniform float uOp;
varying float vA; varying float vT;
void main(){
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.15, r);
  if (a * vA < 0.003) discard;
  vec3 c = vT > 0.92 ? vec3(1.0, 0.55, 0.38) : vT > 0.6 ? vec3(0.55, 0.68, 1.0) : vec3(0.82, 0.88, 1.0);
  gl_FragColor = vec4(c * a * vA * uOp, 1.0);
}`;

const Dust: React.FC<{cam: V3; fov: number; op: number; frame: number}> = ({cam, fov, op, frame}) => {
  const CELL = 7000;
  const {geo, mat} = useMemo(() => {
    const rnd = mulberry32(31337);
    const n = 2600;
    const pos = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const tint = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos.set([rnd() * CELL, rnd() * CELL, rnd() * CELL], i * 3);
      size[i] = rnd() < 0.04 ? 14 + rnd() * 16 : 2.5 + rnd() * 5;
      tint[i] = rnd();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('tint', new THREE.BufferAttribute(tint, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: {uCam: {value: new THREE.Vector3()}, uCell: {value: CELL}, uP: {value: 1483}, uFrame: {value: 0}, uOp: {value: 1}},
      vertexShader: DUST_VS,
      fragmentShader: DUST_FS,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });
    return {geo, mat};
  }, []);
  mat.uniforms.uCam.value.set(...cam);
  mat.uniforms.uP.value = 540 / Math.tan(((fov / 2) * Math.PI) / 180);
  mat.uniforms.uFrame.value = frame;
  mat.uniforms.uOp.value = op;
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={20} />;
};

// ---------------------------------------------------------------- helix trail + beacons
const STATION = WORLDS.map((w) => ({id: w.id, accent: ACCENT[w.id], origin: PLACEMENT[w.id].origin}));
/** Point on the helix through the stations, s = station index (fractional, may extend beyond 0…9). */
export const helixPoint = (s: number, r = STATION_RADIUS): V3 => {
  const yaw = ((s * 36 - 18) * Math.PI) / 180;
  return [r * Math.sin(yaw), (s - 4.5) * 420, r * Math.cos(yaw)];
};
const accentAtS = (s: number) => {
  const i = Math.max(0, Math.min(STATION.length - 1, Math.floor(s)));
  const j = Math.min(STATION.length - 1, i + 1);
  const t = clamp(s - i);
  return new THREE.Color(STATION[i].accent).lerp(new THREE.Color(STATION[j].accent), smooth(t));
};

const Trail: React.FC<{op: number}> = ({op}) => {
  const line = useMemo(() => {
    const pts: number[] = [];
    const cols: number[] = [];
    for (let s = -0.7; s <= 9.7001; s += 0.02) {
      pts.push(...helixPoint(s));
      const c = accentAtS(s);
      const fadeEnds = smooth((s + 0.7) / 0.6) * smooth((9.7 - s) / 0.6);
      cols.push(c.r * fadeEnds, c.g * fadeEnds, c.b * fadeEnds);
    }
    const geo = new LineGeometry();
    geo.setPositions(pts);
    geo.setColors(cols);
    const mat = new LineMaterial({linewidth: 1.6, vertexColors: true, transparent: true, depthWrite: false, worldUnits: false});
    mat.blending = THREE.AdditiveBlending;
    mat.resolution.set(W, 1080);
    const l = new Line2(geo, mat);
    l.computeLineDistances();
    l.frustumCulled = false;
    l.renderOrder = 5;
    return l;
  }, []);
  (line.material as LineMaterial).opacity = op;
  line.visible = op > 0.003;
  return <primitive object={line} />;
};

const Beacons: React.FC<{cam: V3; op: number; frame: number}> = ({cam, op, frame}) => (
  <>
    {STATION.map((s, i) => {
      const d = len(sub(s.origin, cam));
      const k = op * smooth((d - 2600) / 4200);
      if (k <= 0.003) return null;
      const pulse = 0.82 + 0.18 * Math.sin(frame * 0.07 + i * 1.7);
      return (
        <group key={s.id} position={s.origin}>
          <Glow3D size={1700} color={s.accent} opacity={0.55 * k * pulse} />
          <Glow3D size={300} color="#ffffff" opacity={0.9 * k} intensity={1.6} />
          <Glow3D size={520} color={s.accent} opacity={k} intensity={2.2} />
        </group>
      );
    })}
  </>
);

// keep the texture warm (first use inside a frame would otherwise upload mid-render)
glowTexture();

/** Everything in the deep-space backdrop, driven by the global frame. */
export const Sky: React.FC = () => {
  const g = useCurrentFrame();
  const cam = cameraAt(g);
  // chaos: dim stars, no system; the turn lights the sky; trails and beacons appear once the planet exists
  const sky = 0.42 + 0.58 * smooth((g - 700) / 140);
  // the system lights after the turn; in the finale it collapses into the planet (converge → lock)
  const system = smooth((g - 1180) / 120) * (1 - smooth((g - 6400) / 70));
  return (
    <>
      <Stars bright={sky} frame={g} />
      <Nebula k={0.5 + 0.5 * smooth((g - 700) / 160)} />
      <Dust cam={cam.pos} fov={cam.fov} op={0.85} frame={g} />
      <Trail op={0.55 * system} />
      <Beacons cam={cam.pos} op={system} frame={g} />
    </>
  );
};
