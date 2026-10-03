// Station 1 · WebGL set: the Fraser spiral as a deep funnel of twisted-cord hoops (real lit 3D tiles over
// log-polar checker washers). Down the axis it reads as one spiral; side-on it is twenty separate circles.
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useGLFrame} from '../../engine/gl';
import {clamp, prog, smooth, smoother} from '../../engine/math';
import {C} from '../../brand';
import {Dust, Glow, Nebula, StationLights} from './gl3';
import {DEEP, M, NR, NT, RINGS, TL, TRACE, TWIST} from './tunnel';
import {T} from './timing';

const TAU = Math.PI * 2;
const LIGHT = new THREE.Color('#ffd2bf');
const DARK = new THREE.Color('#4a1d3e');

/** brightness of ring k at frame f: dim before the drop, ignited by the coral wave, dimmer as a backdrop */
export const ringLight = (k: number, f: number) => {
  const wave = prog(f, TL.ignite[0], TL.ignite[1]) * (NR + 5); // wave front travels deep → mouth
  const lit = clamp((wave - (NR - 1 - k)) / 4);
  const base = 0.22 + 0.78 * smooth(lit);
  return base * (1 - 0.66 * smoother(prog(f, TL.recede[0], TL.recede[1])));
};

// emissive follows the instance colour (so each ring can be dimmed/ignited on its own)
const tileMaterial = () => {
  const m = new THREE.MeshStandardMaterial({color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.62, roughness: 0.42, metalness: 0.15});
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;');
  };
  return m;
};

const Tiles: React.FC<{f: number}> = ({f}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mat = useMemo(tileMaterial, []);
  const tw = TWIST * (1 - smoother(prog(f, TL.untwist[0], TL.untwist[1])));
  useLayoutEffect(() => {
    const m = ref.current!;
    if (!m.instanceColor) m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NR * NT * 3), 3);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    let n = 0;
    for (const {k, z, r} of RINGS) {
      const len = ((TAU * r) / NT) * 1.04;
      const L = ringLight(k, f);
      for (let i = 0; i < NT; i++) {
        const th = ((i + 0.5 * (k % 2)) * TAU) / NT;
        o.position.set(r * Math.cos(th), r * Math.sin(th), z);
        o.rotation.set(0, 0, th + Math.PI / 2 + tw);
        o.scale.set(len, r * 0.058, r * 0.05);
        o.updateMatrix();
        m.setMatrixAt(n, o.matrix);
        c.copy(i % 2 ? DARK : LIGHT).multiplyScalar(L);
        m.setColorAt(n, c);
        n++;
      }
    }
    m.instanceMatrix.needsUpdate = true;
    m.instanceColor!.needsUpdate = true;
  }, [f, tw]);
  return <instancedMesh ref={ref} args={[geo, mat, NR * NT]} frustumCulled={false} />;
};

// checker washers (static geometry, vertex colours), one per ring in the ring's own plane
const useWashers = () =>
  useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const A = new THREE.Color('#3a2a5c');
    const B = new THREE.Color('#0b1040');
    const SEG = 4;
    for (const {k, z, r} of RINGS) {
      const r0 = r / Math.sqrt(1.16);
      const r1 = r * Math.sqrt(1.16);
      const off = (k * Math.PI) / M;
      const zz = z - r * 0.04;
      for (let i = 0; i < M; i++) {
        const cc = (i + k) % 2 ? A : B;
        for (let s = 0; s < SEG; s++) {
          const a0 = off + ((i + s / SEG) * TAU) / M;
          const a1 = off + ((i + (s + 1) / SEG) * TAU) / M;
          const p = (rr: number, a: number) => [rr * Math.cos(a), rr * Math.sin(a), zz];
          const q = [p(r0, a0), p(r1, a0), p(r1, a1), p(r0, a0), p(r1, a1), p(r0, a1)];
          for (const v of q) {
            pos.push(...v);
            col.push(cc.r, cc.g, cc.b);
          }
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, []);

const Trace: React.FC<{f: number}> = ({f}) => {
  const p = smoother(prog(f, T.traceStart, T.traceEnd));
  const {r, z} = RINGS[TRACE];
  const q = Math.max(0.002, Math.round(p * 400) / 400);
  const geo = useMemo(() => new THREE.TorusGeometry(r, r * 0.022, 10, 180, TAU * q), [q, r]);
  if (f < T.traceStart) return null;
  const closed = prog(f, T.traceEnd, T.traceEnd + 30);
  const head = Math.PI / 2 + TAU * q;
  const fade = 1 - 0.7 * smoother(prog(f, TL.recede[0], TL.recede[1]));
  return (
    <group position={[0, 0, z + r * 0.06]}>
      <mesh geometry={geo} rotation={[0, 0, Math.PI / 2]}>
        <meshBasicMaterial color={C.coral} toneMapped={false} transparent opacity={fade} />
      </mesh>
      <Glow p={[r * Math.cos(head), r * Math.sin(head), 0]} size={r * (0.5 + 0.6 * (1 - closed))} color={C.coral} opacity={(1 - closed * 0.7) * fade} />
      {/* when it closes: the whole circle flashes */}
      <Glow size={r * 3.2} color={C.coral} opacity={Math.exp(-Math.max(0, f - T.traceEnd) / 10) * (f >= T.traceEnd ? 0.55 : 0)} />
    </group>
  );
};

export const GL: React.FC = () => {
  const f = useGLFrame();
  const washers = useWashers();
  const recede = smoother(prog(f, TL.recede[0], TL.recede[1]));
  const wA = (1 - 0.88 * smooth(prog(f, TL.washerOut[0], TL.washerOut[1]))) * (1 - 0.0 * recede) + 0.4 * smooth(prog(f, 228, 280));
  const spin = 0.12 + f * 0.0011; // slow orbital drift of the whole set (rad)
  // the drop: the satellite's coral light bursts into the deep end and races to the mouth
  const wave = prog(f, TL.ignite[0], TL.ignite[1]);
  const waveZ = DEEP + (200 - DEEP) * smooth(wave);
  const waveR = (() => {
    for (let k = NR - 1; k > 0; k--) if (RINGS[k - 1].z >= waveZ) return RINGS[k].r + ((RINGS[k - 1].r - RINGS[k].r) * (waveZ - RINGS[k].z)) / (RINGS[k - 1].z - RINGS[k].z);
    return RINGS[0].r * 1.1;
  })();
  const burst = f >= 0 ? Math.exp(-f / 16) : 0;
  return (
    <group>
      <StationLights accent={C.coral} />
      <Nebula color={C.coral} p={[200, 900, -6200]} size={11000} opacity={0.16} />
      <group position={[0, 0, -2600 * recede]} rotation={[0, 0, spin]}>
        <Tiles f={f} />
        <mesh geometry={washers}>
          <meshBasicMaterial vertexColors transparent opacity={clamp(wA) * (1 - 0.6 * recede)} side={THREE.DoubleSide} depthWrite={wA > 0.98} />
        </mesh>
        <Trace f={f} />
        {/* the satellite's light, living at the far end of the funnel */}
        <Glow p={[0, 0, DEEP - 200]} size={900 + 3200 * burst} color={C.coral} opacity={0.5 + 0.5 * burst} />
        <Glow p={[0, 0, DEEP - 200]} size={260} color="#ffffff" opacity={0.65 + 0.35 * burst} />
        <pointLight position={[0, 0, DEEP + 400]} color={C.coral} intensity={1.4 + 5 * burst} decay={0} distance={6000} />
        {wave > 0 && wave < 1 ? (
          <>
            <mesh position={[0, 0, waveZ]}>
              <torusGeometry args={[waveR, waveR * 0.03, 8, 120]} />
              <meshBasicMaterial color="#ffb59c" toneMapped={false} transparent opacity={Math.sin(Math.PI * wave)} />
            </mesh>
            <pointLight position={[0, 0, waveZ + 200]} color={C.coral} intensity={4 * Math.sin(Math.PI * wave)} decay={0} distance={2400} />
          </>
        ) : null}
      </group>
      <Dust f={f} seed={11} n={420} box={[-3200, 3200, -1800, 2000, -4200, 2600]} color="#ffb59c" size={16} opacity={0.55} />
    </group>
  );
};
