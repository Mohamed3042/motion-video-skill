// Station 10 · YOURS, EVERYWHERE — WebGL set: two floating islands (PC monolith, phone), alternating beacons (phi),
// the private link as a light bridge, drifting rock shards, a teal nebula and dust.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useGLFrame} from '../../engine/gl';
import {ACCENT, C} from '../../brand';
import {clamp, mulberry32, smoother, type V3} from '../../engine/math';
import {Dust, GlowSprite} from '../engine/glkit';
import {BEACON_L, BEACON_R, BRIDGE, PC, PC_H, PC_ISLAND, PC_ISLAND_R, PC_W, PH, PH_H, PH_ISLAND, PH_ISLAND_R, PH_W, PH_YAW, B, beacons} from './set';

const A = ACCENT.anywhere;
const pulse = (f: number, at: number, tau = 10) => (f < at ? 0 : Math.exp(-(f - at) / tau));

// low-poly floating rock: flat top slab + jittered underside
const Island: React.FC<{p: V3; r: number; seed: number; f: number}> = ({p, r, seed, f}) => {
  const under = useMemo(() => {
    const g = new THREE.CylinderGeometry(r * 0.95, r * 0.1, r * 0.95, 11, 4);
    const rnd = mulberry32(seed);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const cache = new Map<string, [number, number, number]>();
    for (let i = 0; i < pos.count; i++) {
      const key = `${pos.getX(i).toFixed(2)},${pos.getY(i).toFixed(2)},${pos.getZ(i).toFixed(2)}`;
      if (!cache.has(key)) cache.set(key, [(rnd() - 0.5) * r * 0.16, (rnd() - 0.5) * r * 0.12, (rnd() - 0.5) * r * 0.16]);
      const j = cache.get(key)!;
      const top = pos.getY(i) > r * 0.47;
      pos.setXYZ(i, pos.getX(i) + (top ? 0 : j[0]), pos.getY(i) + (top ? 0 : j[1]), pos.getZ(i) + (top ? 0 : j[2]));
    }
    g.computeVertexNormals();
    return g;
  }, [r, seed]);
  const bob = Math.sin(f * 0.02 + seed) * 10;
  return (
    <group position={[p[0], p[1] + bob, p[2]]}>
      <mesh position={[0, -25, 0]}>
        <cylinderGeometry args={[r, r * 0.96, 50, 11, 1]} />
        <meshStandardMaterial color="#123566" emissive={A} emissiveIntensity={0.05} roughness={0.55} metalness={0.25} flatShading />
      </mesh>
      <mesh geometry={under} position={[0, -50 - r * 0.475, 0]}>
        <meshStandardMaterial color="#0a1d4c" emissive={'#0e3b6a'} emissiveIntensity={0.25} roughness={0.7} metalness={0.15} flatShading />
      </mesh>
      {[0.98, 0.7].map((k, i) => (
        <mesh key={k} position={[0, 2 + i, 0]} rotation={[Math.PI / 2, 0, f * 0.003 * (i ? -1 : 1)]} scale={[r * k, r * k, 1]}>
          <torusGeometry args={[1, i ? 0.004 : 0.006, 6, 120, i ? Math.PI * 1.4 : Math.PI * 2]} />
          <meshBasicMaterial color={A} toneMapped={false} transparent opacity={i ? 0.6 : 0.9} />
        </mesh>
      ))}
      <GlowSprite p={[0, 0, 0]} s={[r * 3, r * 0.9]} color={A} a={0.32} />
      <GlowSprite p={[0, -r * 0.7, 0]} s={r * 1.6} color={'#1d6fa0'} a={0.25} />
    </group>
  );
};

const Beacon: React.FC<{p: V3; on: number}> = ({p, on}) => (
  <group>
    <mesh position={p}>
      <sphereGeometry args={[34, 24, 16]} />
      <meshBasicMaterial color={on > 0.5 ? '#e9feff' : '#2b6b78'} toneMapped={false} />
    </mesh>
    <mesh position={[p[0], p[1] - 50, p[2]]}>
      <cylinderGeometry args={[5, 9, 80, 8, 1]} />
      <meshBasicMaterial color={'#2a5f86'} toneMapped={false} />
    </mesh>
    <GlowSprite p={p} s={620} color={A} a={on} />
    <GlowSprite p={p} s={190} color={'#ffffff'} a={on * 0.95} />
    <GlowSprite p={p} s={[1400, 90]} color={A} a={on * 0.35} />
  </group>
);

// The private link: a tube that grows from the PC to the phone, then carries light packets.
const Bridge: React.FC<{f: number}> = ({f}) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(BRIDGE.map((v) => new THREE.Vector3(...v))), []);
  const SEG = 180;
  const RAD = 10;
  const tubes = useMemo(() => [5, 18, 44].map((r) => new THREE.TubeGeometry(curve, SEG, r, RAD, false)), [curve]);
  const grow = smoother((f - B.press) / (B.land - B.press));
  const fade = 1 - smoother((f - 470) / 30);
  if (grow <= 0.001) return null;
  const n = Math.floor(grow * SEG) * RAD * 6;
  tubes.forEach((t) => t.setDrawRange(0, n));
  const head = curve.getPoint(Math.min(0.999, grow));
  const land = pulse(f, B.land, 14);
  return (
    <group>
      <mesh geometry={tubes[0]}>
        <meshBasicMaterial color={'#e6feff'} toneMapped={false} transparent opacity={fade} />
      </mesh>
      <mesh geometry={tubes[1]}>
        <meshBasicMaterial color={A} toneMapped={false} transparent opacity={0.3 * fade} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh geometry={tubes[2]}>
        <meshBasicMaterial color={A} toneMapped={false} transparent opacity={(0.08 + 0.2 * land) * fade} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {grow < 1 ? <GlowSprite p={[head.x, head.y, head.z]} s={300} color={'#ffffff'} a={0.9} /> : null}
      {/* packets once connected: the phone uses the PC workspace over the link */}
      {f >= B.land
        ? [0, 1, 2].map((i) => {
            const u = ((f - 240) / 70 + i / 3) % 1;
            const q = curve.getPoint(u);
            return <GlowSprite key={i} p={[q.x, q.y, q.z]} s={150} color={'#d8fdff'} a={Math.sin(Math.PI * u) * fade} />;
          })
        : null}
      <GlowSprite p={BRIDGE[3]} s={420 + 600 * land} color={A} a={0.5 * land} />
    </group>
  );
};

const SHARDS = (() => {
  const rnd = mulberry32(1010);
  return Array.from({length: 22}, () => ({
    p: [(rnd() - 0.5) * 4200, -900 + rnd() * 1900, -1400 + rnd() * 2400] as V3,
    s: 18 + rnd() * 60,
    rx: rnd() * 6,
    ry: rnd() * 6,
    v: (rnd() - 0.5) * 0.02,
  }));
})();

const FAR_ISLES = [
  {p: [-3200, -200, -4200] as V3, r: 260, seed: 3},
  {p: [2900, 500, -5200] as V3, r: 320, seed: 5},
  {p: [400, -1100, -6000] as V3, r: 220, seed: 7},
];

export const GL: React.FC = () => {
  const f = useGLFrame();
  const b = beacons(f);
  const ignite = pulse(f, 0, 16);
  const pcGlow = 0.35 + 0.65 * smoother((f - 110) / 20) + 0.6 * pulse(f, 200, 14);
  const phGlow = 0.2 + 0.8 * smoother((f - 236) / 14) + 0.6 * pulse(f, 360, 14);
  const flip = clamp((f - 360) / 20);
  return (
    <group>
      <pointLight position={[0, 900, 1400]} color={A} intensity={1.4} distance={0} decay={0} />
      <pointLight position={[-1800, 1200, 1600]} color={C.coral} intensity={0.6} distance={0} decay={0} />
      {/* far layer: teal nebula + distant islands */}
      <GlowSprite p={[300, 700, -9500]} s={[18000, 9000]} color={'#1aa6b8'} a={0.22} />
      <GlowSprite p={[-3000, 1800, -7000]} s={[8000, 4600]} color={'#2a4fd8'} a={0.16} />
      {FAR_ISLES.map((s) => (
        <Island key={s.seed} p={s.p} r={s.r} seed={s.seed} f={f} />
      ))}
      <Island p={PC_ISLAND} r={PC_ISLAND_R} seed={11} f={f} />
      <Island p={PH_ISLAND} r={PH_ISLAND_R} seed={23} f={f} />
      {/* PC monolith on its stand */}
      <group position={PC}>
        <mesh>
          <boxGeometry args={[PC_W, PC_H, 44]} />
          <meshStandardMaterial color="#071430" metalness={0.75} roughness={0.22} emissive={A} emissiveIntensity={0.04} />
        </mesh>
        <mesh position={[0, -PC_H / 2 - 70, -10]}>
          <boxGeometry args={[110, 160, 60]} />
          <meshStandardMaterial color="#0b1a40" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -PC_H / 2 - 150, 0]}>
          <boxGeometry args={[460, 24, 240]} />
          <meshStandardMaterial color="#0d2050" metalness={0.6} roughness={0.3} emissive={A} emissiveIntensity={0.08} />
        </mesh>
        <mesh position={[0, 0, 23]}>
          <planeGeometry args={[PC_W - 40, PC_H - 40]} />
          <meshBasicMaterial color={'#0c3550'} toneMapped={false} />
        </mesh>
        <GlowSprite p={[0, 0, 30]} s={[PC_W * 0.9, PC_H * 0.8]} color={A} a={0.18} />
        <GlowSprite p={[0, 0, -40]} s={[PC_W * 1.7, PC_H * 1.6]} color={A} a={0.25 * pcGlow} />
      </group>
      {/* phone */}
      <group position={PH} rotation={[0, (PH_YAW * Math.PI) / 180, 0]}>
        <mesh>
          <boxGeometry args={[PH_W, PH_H, 34]} />
          <meshStandardMaterial color="#071430" metalness={0.75} roughness={0.22} emissive={A} emissiveIntensity={0.04} />
        </mesh>
        <mesh rotation={[0, flip * Math.PI * 2, 0]} position={[0, -PH_H / 2 - 70, 0]}>
          <cylinderGeometry args={[150, 190, 16, 32, 1]} />
          <meshBasicMaterial color={'#0f3e5a'} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 18]}>
          <planeGeometry args={[PH_W - 34, PH_H - 34]} />
          <meshBasicMaterial color={'#0c3550'} toneMapped={false} />
        </mesh>
        <GlowSprite p={[0, 0, 26]} s={[PH_W * 0.9, PH_H * 0.8]} color={A} a={0.15} />
        <GlowSprite p={[0, 0, -40]} s={[PH_W * 2.2, PH_H * 1.5]} color={A} a={0.25 * phGlow} />
      </group>
      <Beacon p={BEACON_L} on={Math.min(1, b.l + ignite)} />
      <Beacon p={BEACON_R} on={b.r} />
      <Bridge f={f} />
      {f >= B.whoosh && f < B.whoosh + 40 ? (
        <group position={[840, 200, -60]}>
          <mesh rotation={[Math.PI / 2 - 0.25, 0, 0]} scale={(f - B.whoosh) * 110 + 200}>
            <torusGeometry args={[1, 0.006, 6, 160]} />
            <meshBasicMaterial color={'#d8fdff'} toneMapped={false} transparent opacity={1 - (f - B.whoosh) / 40} />
          </mesh>
          <GlowSprite p={[0, 0, 0]} s={900} color={A} a={pulse(f, B.whoosh, 10)} />
        </group>
      ) : null}
      {SHARDS.map((s, i) => (
        <mesh key={i} position={[s.p[0], s.p[1] + Math.sin(f * 0.015 + i) * 20, s.p[2]]} rotation={[s.rx + f * s.v, s.ry + f * s.v * 0.7, 0]}>
          <icosahedronGeometry args={[s.s, 0]} />
          <meshStandardMaterial color="#10305e" emissive={A} emissiveIntensity={0.08} roughness={0.6} flatShading />
        </mesh>
      ))}
      <Dust f={f} seed={101} n={520} box={[[-3200, -1400, -2400], [3200, 2200, 1600]]} color={'#8ff0f4'} size={20} drift={[0.35, 0.18, 0]} opacity={0.6} />
      <Dust f={f} seed={102} n={160} box={[[-2400, -1200, 1500], [2400, 2400, 4600]]} color={A} size={30} drift={[-0.6, 0.3, 0.3]} opacity={0.5} />
    </group>
  );
};
