// Station 9 · EVIDENCE & AGENTS — WebGL set: the research spire. A barber-pole sleeve (custom shader; the stripe
// pattern only ever moves along the circumference) inside a lattice tower with four agent floors, a glass core,
// tilted halo rings, a base platform and a crown; far light pillars + an electric nebula behind; dust in front.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useGLFrame} from '../../engine/gl';
import {ACCENT, C} from '../../brand';
import {T} from './timing';
import {BASE_Y, CROWN_Y, FLOOR_Y, H1, H2, P, R1, R2, Y1, Y2, floorDeploy, phase, sleeveGeo} from './spire';
import {Dust, GlowSprite} from './glkit';
import {clamp, mulberry32, smoother} from '../../engine/math';

const A = ACCENT.engine;
const TEAL = ACCENT.anywhere;
const pulse = (f: number, at: number, tau = 10) => (f < at ? 0 : Math.exp(-(f - at) / tau));
const MIDY = (BASE_Y + CROWN_Y) / 2;
const TALL = CROWN_Y - BASE_Y;

const VERT = /* glsl */ `
uniform float uK, uR1, uH1, uY1, uR2, uH2, uY2;
varying vec2 vS;
varying vec3 vN;
varying vec3 vV;
varying float vYY;
void main() {
  float th = uv.x * 6.28318530718 - 3.14159265359;
  float yy = position.y;
  float R = mix(uR1, uR2, uK);
  float H = mix(uH1, uH2, uK);
  float Y = mix(uY1, uY2, uK);
  vec3 p = vec3(R * sin(th), Y + yy * H, R * cos(th));
  vS = vec2(th * R, yy * H);
  vYY = yy;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * vec3(sin(th), 0.0, cos(th)));
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */ `
uniform float uPhase, uP, uDim, uGlow;
uniform vec3 uA, uB, uSeam, uRim;
varying vec2 vS;
varying vec3 vN;
varying vec3 vV;
varying float vYY;
void main() {
  float v = (vS.x - uPhase + vS.y) / uP;
  float fw = fwidth(v);
  float d = abs(fract(v) - 0.5) - 0.25;
  float st = smoothstep(-fw, fw, d);
  float seam = 1.0 - smoothstep(0.0, fw * 1.6 + 0.018, abs(d));
  vec3 N = normalize(gl_FrontFacing ? vN : -vN);
  vec3 V = normalize(vV);
  vec3 L = normalize(vec3(-0.5, 0.45, 0.75));
  float diff = max(dot(N, L), 0.0);
  float facing = max(dot(N, V), 0.0);
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 22.0);
  float rim = pow(1.0 - facing, 2.4);
  vec3 lit = mix(uB * (0.55 + 0.6 * diff), uA * (0.75 + 0.55 * diff), st);
  vec3 col = lit * uDim + uSeam * seam * 0.55 * uDim + vec3(0.8, 0.88, 1.0) * spec * 0.55 + uRim * rim * 0.9;
  col += uA * uGlow * 0.4;
  float lip = smoothstep(0.5, 0.465, abs(vYY));
  col = mix(uSeam, col, lip);
  if (!gl_FrontFacing) col *= 0.45;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const Sleeve: React.FC<{f: number; k: number}> = ({f, k}) => {
  const geo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 240, 1, true, Math.PI, Math.PI * 2), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.DoubleSide,
        uniforms: {
          uK: {value: 0},
          uR1: {value: R1},
          uH1: {value: H1},
          uY1: {value: Y1},
          uR2: {value: R2},
          uH2: {value: H2},
          uY2: {value: Y2},
          uPhase: {value: 0},
          uP: {value: P},
          uDim: {value: 1},
          uGlow: {value: 0},
          uA: {value: new THREE.Color('#5b8bff')},
          uB: {value: new THREE.Color('#0b1a5e')},
          uSeam: {value: new THREE.Color('#e6eeff')},
          uRim: {value: new THREE.Color('#86a8ff')},
        },
      }),
    [],
  );
  const u = mat.uniforms;
  u.uK.value = k;
  u.uPhase.value = phase(f);
  const ignite = smoother((f + 20) / 34);
  u.uDim.value = (0.2 + 0.8 * ignite) * (1 - 0.4 * smoother((f - T.stages[0]) / 40) * (1 - smoother((f - T.pole) / 20)));
  u.uGlow.value = pulse(f, T.widen, 14) + 0.7 * pulse(f, T.lock, 10) + 0.8 * pulse(f, T.dots, 14);
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
};

// Coral tracker beads riding the ring's top rim: they prove the surface only moves sideways.
const Beads: React.FC<{f: number}> = ({f}) => {
  const vis = smoother((f - (T.widen + 8)) / 12) * (1 - smoother((f - (T.stages[1] + 6)) / 18));
  if (vis <= 0.01) return null;
  const {R, Y, H} = sleeveGeo(f);
  return (
    <>
      {[-0.66, -0.33, 0, 0.33, 0.66, 2.3, 2.75, -2.75, -2.3].map((t0, i) => {
        const th = t0 + (phase(f) - phase(T.widen)) / R;
        const p: [number, number, number] = [R * Math.sin(th), Y + H / 2 + 16, R * Math.cos(th)];
        const front = Math.cos(th) > -0.2 ? 1 : 0.45;
        return (
          <group key={i}>
            <mesh position={p}>
              <sphereGeometry args={[15, 16, 12]} />
              <meshBasicMaterial color={'#ffb39b'} toneMapped={false} transparent opacity={vis} />
            </mesh>
            <GlowSprite p={p} s={170} color={C.coral} a={vis * front} />
          </group>
        );
      })}
    </>
  );
};

const BLADES = 18;
const Floor: React.FC<{f: number; i: number}> = ({f, i}) => {
  const d = floorDeploy(f, i);
  if (d <= 0.01) return null;
  const at = T.stages[i];
  const lit = f >= at ? 1 : 0;
  const flash = pulse(f, at, 12);
  const R = 300 * (0.35 + 0.65 * d);
  const spin = f * 0.004 * (i % 2 ? -1 : 1);
  const wave = smoother((f - at) / 26);
  return (
    <group position={[0, FLOOR_Y[i], 0]}>
      <mesh scale={[R, 1, R]}>
        <cylinderGeometry args={[1, 1, 12, 96, 1]} />
        <meshStandardMaterial color={lit ? '#1d3db0' : '#0c1c58'} emissive={A} emissiveIntensity={0.12 + 0.45 * lit + flash} metalness={0.55} roughness={0.28} transparent opacity={0.85 * d} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, spin]} scale={[R + 10, R + 10, 1]}>
        <torusGeometry args={[1, 0.014, 8, 140]} />
        <meshBasicMaterial color={lit ? '#d6e4ff' : '#4363a8'} toneMapped={false} transparent opacity={d} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, -spin * 2]} scale={[R * 1.38, R * 1.38, 1]}>
        <torusGeometry args={[1, 0.005, 6, 160, Math.PI * 1.35]} />
        <meshBasicMaterial color={A} toneMapped={false} transparent opacity={d * (0.3 + 0.7 * lit)} />
      </mesh>
      {/* server blades around the deck: they light in a sweep when the stage completes */}
      {Array.from({length: BLADES}, (_, b) => {
        const a = (b / BLADES) * Math.PI * 2 + spin * 0.5;
        const on = lit * clamp((f - at - b * 0.7) / 4);
        return (
          <mesh key={b} position={[Math.sin(a) * (R * 0.82), 26, Math.cos(a) * (R * 0.82)]} rotation={[0, a, 0]} scale={d}>
            <boxGeometry args={[34, 36, 8]} />
            <meshBasicMaterial color={on > 0.5 ? '#9fbcff' : '#1b2f78'} toneMapped={false} transparent opacity={0.9 * d} />
          </mesh>
        );
      })}
      {/* lit shockwave across the deck */}
      {lit && wave < 1 ? (
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[R * (1 + 1.6 * wave), R * (1 + 1.6 * wave), 1]}>
          <torusGeometry args={[1, 0.01, 6, 120]} />
          <meshBasicMaterial color={'#ffffff'} toneMapped={false} transparent opacity={1 - wave} />
        </mesh>
      ) : null}
      <GlowSprite p={[0, 0, 0]} s={[R * 3.6, R * 1.3]} color={A} a={d * (0.12 + 0.3 * lit + 1.1 * flash)} />
      {flash > 0.02 ? <GlowSprite p={[0, 0, 0]} s={R * 1.4 * (1 + 1.5 * (1 - flash))} color={'#ffffff'} a={flash * 0.8} /> : null}
    </group>
  );
};

// Light packets running up the core between stages (each stage hands its result to the next).
const Packets: React.FC<{f: number}> = ({f}) => (
  <>
    {[0, 1, 2].map((i) => {
      const a = T.stages[i];
      const b = T.stages[i + 1];
      if (f < a || f > b + 4) return null;
      const t = smoother((f - a) / (b - a));
      const y = FLOOR_Y[i] + (FLOOR_Y[i + 1] - FLOOR_Y[i]) * t;
      return <GlowSprite key={i} p={[0, y, 0]} s={[190, 340]} color={'#cfe0ff'} a={Math.sin(Math.PI * clamp(t * 1.1))} />;
    })}
  </>
);

// Lattice tower: four rails with node lights (frames the pole as a tall aperture).
const Lattice: React.FC<{f: number}> = ({f}) => {
  const RR = 250;
  const nodes = 11;
  return (
    <>
      {[0, 1, 2, 3].map((j) => {
        const a = Math.PI / 4 + (j * Math.PI) / 2;
        const x = Math.sin(a) * RR;
        const z = Math.cos(a) * RR;
        return (
          <group key={j}>
            <mesh position={[x, MIDY, z]}>
              <cylinderGeometry args={[5, 5, TALL, 8, 1]} />
              <meshBasicMaterial color={'#3d5fc0'} toneMapped={false} />
            </mesh>
            {Array.from({length: nodes}, (_, q) => {
              const y = BASE_Y + 80 + (q * (TALL - 160)) / (nodes - 1);
              const tw = 0.55 + 0.45 * Math.sin(f * 0.08 + q * 1.7 + j * 2.3);
              return <GlowSprite key={q} p={[x, y, z]} s={70} color={'#9db8ff'} a={0.5 * tw} />;
            })}
          </group>
        );
      })}
    </>
  );
};

// Tilted halo rings drifting around the tower (mid-layer parallax).
const HALOS = [
  {y: -760, r: 560, tx: 0.16, tz: -0.08, arc: 1.5, s: 0.003},
  {y: 620, r: 470, tx: -0.12, tz: 0.1, arc: 1.2, s: -0.004},
  {y: 1240, r: 640, tx: 0.08, tz: 0.14, arc: 1.65, s: 0.0025},
  {y: 1880, r: 400, tx: -0.18, tz: -0.06, arc: 1.3, s: -0.005},
];
const Halos: React.FC<{f: number}> = ({f}) => (
  <>
    {HALOS.map((h, i) => (
      <group key={i} position={[0, h.y, 0]} rotation={[h.tx, 0, h.tz]}>
        <mesh rotation={[Math.PI / 2, 0, f * h.s]} scale={[h.r, h.r, 1]}>
          <torusGeometry args={[1, 0.0035, 6, 200, Math.PI * h.arc]} />
          <meshBasicMaterial color={'#7f9fff'} toneMapped={false} transparent opacity={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, f * h.s + 3.6]} scale={[h.r * 1.04, h.r * 1.04, 1]}>
          <torusGeometry args={[1, 0.0016, 6, 120, Math.PI * 0.4]} />
          <meshBasicMaterial color={'#cfe0ff'} toneMapped={false} transparent opacity={0.7} />
        </mesh>
      </group>
    ))}
  </>
);

// Far layer: distant light pillars (other research spires) and an electric nebula behind the station.
const FAR = (() => {
  const rnd = mulberry32(909);
  return Array.from({length: 9}, (_, i) => ({
    x: (i - 4) * 1300 + (rnd() - 0.5) * 700,
    z: -3200 - rnd() * 5200,
    y: 200 + rnd() * 1200,
    h: 3000 + rnd() * 4000,
    a: 0.18 + rnd() * 0.2,
  }));
})();
const Far: React.FC = () => (
  <>
    <GlowSprite p={[600, 900, -9000]} s={[17000, 9000]} color={'#2a4fd8'} a={0.32} />
    <GlowSprite p={[-2600, 2400, -7000]} s={[9000, 5000]} color={'#5b3fd0'} a={0.16} />
    {FAR.map((p, i) => (
      <group key={i}>
        <GlowSprite p={[p.x, p.y, p.z]} s={[140, p.h]} color={A} a={p.a} />
        <GlowSprite p={[p.x, p.y + p.h * 0.42, p.z]} s={260} color={'#cfe0ff'} a={p.a * 1.6} />
      </group>
    ))}
  </>
);

export const GL: React.FC = () => {
  const f = useGLFrame();
  const g = sleeveGeo(f);
  const litN = T.stages.filter((s) => f >= s).length;
  const coreGlow = 0.5 + 0.25 * litN + 1.2 * pulse(f, T.stages[3], 16);
  const crownP = pulse(f, T.stages[3], 20);
  const teal = smoother((f - (T.dots - 6)) / 12);
  const capA = (0.7 + 1.4 * pulse(f, T.dots, 18)) * (1 - 0.7 * g.k);
  return (
    <group>
      <pointLight position={[0, 600, 500]} color={A} intensity={2.5} distance={0} decay={0} />
      <pointLight position={[-1400, 1600, 1600]} color={C.coral} intensity={0.8} distance={0} decay={0} />
      <Far />
      {/* base platform */}
      <group position={[0, BASE_Y, 0]}>
        <mesh>
          <cylinderGeometry args={[760, 840, 50, 120, 1]} />
          <meshStandardMaterial color="#0a1850" metalness={0.6} roughness={0.35} emissive={A} emissiveIntensity={0.1} />
        </mesh>
        {[380, 560, 740].map((r, i) => (
          <mesh key={r} position={[0, 28, 0]} rotation={[Math.PI / 2, 0, f * 0.003 * (i % 2 ? 1 : -1)]} scale={[r, r, 1]}>
            <torusGeometry args={[1, 0.005 + i * 0.001, 6, 160, Math.PI * (1.2 + 0.3 * i)]} />
            <meshBasicMaterial color={A} toneMapped={false} transparent opacity={0.7} />
          </mesh>
        ))}
        <GlowSprite p={[0, 40, 0]} s={[2400, 600]} color={A} a={0.4} />
      </group>
      <Lattice f={f} />
      <Halos f={f} />
      {/* glass core + filament */}
      <mesh position={[0, MIDY, 0]}>
        <cylinderGeometry args={[72, 72, TALL, 48, 1, true]} />
        <meshStandardMaterial color="#1a2f8a" emissive={'#3a62e0'} emissiveIntensity={0.35} metalness={0.3} roughness={0.15} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, MIDY, 0]}>
        <cylinderGeometry args={[13, 13, TALL, 16, 1]} />
        <meshBasicMaterial color={'#c9d8ff'} toneMapped={false} />
      </mesh>
      <GlowSprite p={[0, MIDY, 0]} s={[300, TALL + 300]} color={A} a={0.3 + 0.12 * litN} />
      <GlowSprite p={[0, MIDY, 0]} s={[120, TALL]} color={'#cfe0ff'} a={0.2 * coreGlow} />
      {FLOOR_Y.map((_, i) => (
        <Floor key={i} f={f} i={i} />
      ))}
      <Packets f={f} />
      {/* crown */}
      <group position={[0, CROWN_Y + 70, 0]}>
        <mesh rotation={[0, f * 0.012, 0]}>
          <octahedronGeometry args={[80, 0]} />
          <meshStandardMaterial color="#cfe0ff" emissive={A} emissiveIntensity={0.7 + 1.4 * crownP} metalness={0.3} roughness={0.2} flatShading />
        </mesh>
        <GlowSprite p={[0, 0, 0]} s={600 + 700 * crownP} color={A} a={0.7 + 0.6 * crownP} />
      </group>
      <Sleeve f={f} k={g.k} />
      {/* aperture lips (top/bottom of the pole, rims of the ring); at the exit they flash as two beacons */}
      {[-1, 1].map((sg) => {
        const y = g.Y + (sg * g.H) / 2;
        return (
          <group key={sg}>
            <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[g.R + 2, g.R + 2, 1]}>
              <torusGeometry args={[1, g.k > 0.5 ? 0.007 : 0.06, 10, 200]} />
              <meshBasicMaterial color={'#e6eeff'} toneMapped={false} />
            </mesh>
            <GlowSprite p={[0, y, 0]} s={[g.R * 2.4 + 260, 200 + 200 * (1 - g.k)]} color={A} a={capA * (1 - teal)} />
            <GlowSprite p={[0, y, 0]} s={(g.R * 2.4 + 420) * (1 + 1.2 * pulse(f, T.dots, 16))} color={TEAL} a={capA * teal} />
          </group>
        );
      })}
      <GlowSprite p={[0, g.Y, 0]} s={[g.R * 2.4 + 500, g.H * 0.9 + 320]} color={A} a={0.16 + 0.9 * pulse(f, T.widen, 16)} />
      <Beads f={f} />
      {/* dust: mid layer around the spire, foreground motes near the camera path */}
      <Dust f={f} seed={91} n={500} box={[[-3000, -1600, -2000], [3000, 2800, 1400]]} color={'#8fb0ff'} size={22} drift={[0.5, 0.3, 0]} opacity={0.7} />
      <Dust f={f} seed={92} n={170} box={[[-2200, -1400, 1300], [2200, 2600, 3600]]} color={'#7d9dff'} size={30} drift={[-0.8, 0.4, 0.4]} opacity={0.55} />
    </group>
  );
};
