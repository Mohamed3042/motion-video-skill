// Station 7 · My market — WebGL set: the data city. Ground disc, avenue lines + Zöllner hatch strokes (instanced),
// city blocks that rise at street level, and the country × capability matrix as glowing columns. LOCAL coords.
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {spring} from 'remotion';
import {useGLFrame} from '../../engine/gl';
import {clamp, mulberry32, smoother} from '../../engine/math';
import {C} from '../../brand';
import {CAPS, CD, COLX, CW, HL, HMAX, HS, HW, KMAX, LW, NEW_CELL, PAIR, rowZ, S, XL} from './geom';
import {T} from './timing';

const A = '#6f8cff';
const INK = '#d6ddff';
const GROUND = '#050b30';
const pr = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const sm = (f: number, a: number, b: number) => smoother(pr(f, a, b));
const pop = (f: number, at: number, damping = 13, stiffness = 170, mass = 0.7) => (f < at ? 0 : spring({frame: f - at, fps: 60, config: {damping, stiffness, mass}}));
const col = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(t));

// ---------------- textures (deterministic canvases) ----------------
const radialTex = (stops: [number, string][]) => {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [o, s] of stops) gr.addColorStop(o, s);
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const endFadeTex = () => {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 2;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 512, 0);
  gr.addColorStop(0, '#000');
  gr.addColorStop(0.12, '#fff');
  gr.addColorStop(0.88, '#fff');
  gr.addColorStop(1, '#000');
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 2);
  return new THREE.CanvasTexture(c);
};

// dark facade with a sparse grid of lit windows (emissive map, stretched per block)
const windowTex = () => {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 64, 128);
  const rnd = mulberry32(17);
  for (let y = 4; y < 124; y += 8)
    for (let x = 4; x < 60; x += 7) {
      const v = rnd();
      if (v < 0.45) continue;
      const l = Math.round(40 + 200 * v ** 3);
      g.fillStyle = `rgb(${l},${l},${l})`;
      g.fillRect(x, y, 3, 4);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

// ---------------- ground ----------------
const Ground: React.FC<{f: number}> = ({f}) => {
  const tex = useMemo(() => radialTex([[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]), []);
  const glow = useMemo(() => radialTex([[0, 'rgba(111,140,255,0.55)'], [0.35, 'rgba(111,140,255,0.16)'], [1, 'rgba(111,140,255,0)']]), []);
  const g = sm(f, T.turn[0], T.matrix + 30);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]}>
        <planeGeometry args={[11000, 11000]} />
        <meshBasicMaterial color={GROUND} alphaMap={tex} transparent toneMapped={false} depthWrite />
      </mesh>
      {g > 0.01 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <planeGeometry args={[2600, 2000]} />
          <meshBasicMaterial map={glow} transparent opacity={g} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------------- avenues ----------------
const Avenues: React.FC<{f: number}> = ({f}) => {
  const fade = useMemo(() => endFadeTex(), []);
  const pairOn = pr(f, T.pair - 2, T.pair + 8) * (1 - sm(f, 198, 226));
  const street = sm(f, 176, 246); // lines become periwinkle street lights
  const thin = 1 - 0.45 * street;
  const lines: React.ReactNode[] = [];
  for (let k = -KMAX; k <= KMAX; k++) {
    const inGrid = k >= -3 && k <= 3;
    const isPair = PAIR.includes(k);
    let c = col(INK, inGrid ? '#9fb2ff' : A, street);
    if (!inGrid) c = c.multiplyScalar(1 - 0.5 * street);
    if (isPair) c = c.lerp(new THREE.Color(C.coral), pairOn);
    const enter = sm(f, -30 + Math.abs(k) * 1.2, 10 + Math.abs(k) * 1.2);
    lines.push(
      <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, k * S]} scale={[1, Math.max(0.01, enter), 1]}>
        <planeGeometry args={[2 * XL, LW * thin]} />
        <meshBasicMaterial color={c} alphaMap={fade} transparent toneMapped={false} depthWrite={false} />
      </mesh>,
    );
    if (isPair && pairOn > 0.01)
      lines.push(
        <mesh key={'g' + k} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, k * S]}>
          <planeGeometry args={[2 * XL, 46]} />
          <meshBasicMaterial color={C.coral} alphaMap={fade} transparent opacity={0.22 * pairOn} blending={THREE.AdditiveBlending} toneMapped={false} depthWrite={false} />
        </mesh>,
      );
  }
  return <group>{lines}</group>;
};

// ---------------- Zöllner hatches (instanced) ----------------
type Hatch = {k: number; a: number; u: number};
const Hatches: React.FC<{f: number}> = ({f}) => {
  const {mesh, list} = useMemo(() => {
    const list: Hatch[] = [];
    const H = XL - 260;
    for (let k = -KMAX; k <= KMAX; k++) {
      const off = Math.abs(k) % 2 ? HS / 2 : 0;
      for (let a = -H + off; a < H; a += HS) list.push({k, a, u: (a + H) / (2 * H)});
    }
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({toneMapped: false});
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    return {mesh, list};
  }, []);
  const live = f >= T.hatch[0] - 1 && f < T.fade + 60;
  useLayoutEffect(() => {
    if (!live) return;
    const o = new THREE.Object3D();
    const ink = new THREE.Color(INK);
    const gnd = new THREE.Color(GROUND);
    const c = new THREE.Color();
    list.forEach((h, i) => {
      const t0 = h.k % 2 === 0 ? T.hatch[0] : T.hatch[1];
      const s = pop(f, t0 + 12 * h.u, 12, 210, 0.55);
      const fall = smoother(pr(f, T.fade + 18 * h.u, T.fade + 18 * h.u + 20));
      const phi = ((h.k % 2 === 0 ? 45 : -45) * Math.PI) / 180;
      const len = 2 * HL * s * (1 - 0.35 * fall);
      o.position.set(h.a, 3 - 170 * fall * fall, h.k * S);
      o.rotation.set(0, -phi, 0.9 * fall);
      o.scale.set(Math.max(1e-4, len), 1, HW);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      const edge = Math.min(1, Math.min(h.u, 1 - h.u) / 0.1);
      c.copy(ink).lerp(gnd, clamp(fall * 0.8 + (1 - edge)));
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
  }, [f, live, list, mesh]);
  return live ? <primitive object={mesh} /> : null;
};

// ---------------- city blocks (instanced, rise at street level) ----------------
type Block = {x: number; z: number; w: number; d: number; h: number; delay: number; cap: number};
const Blocks: React.FC<{f: number}> = ({f}) => {
  const {mesh, caps, list} = useMemo(() => {
    const rnd = mulberry32(707);
    const list: Block[] = [];
    for (let k = -KMAX; k < KMAX; k++) {
      const z = (k + 0.5) * S;
      let x = -XL + 120 + rnd() * 120;
      while (x < XL - 160) {
        const w = 110 + rnd() * 170;
        const cx = x + w / 2;
        const inMatrix = k >= -4 && k <= 2 && Math.abs(cx) < 760;
        const nearCam = z > 300 && cx > -1500 && cx < 1900;
        const r = Math.hypot(cx / 1.3, z);
        if (!inMatrix && !nearCam && r < 3300) {
          const tower = rnd() < 0.08;
          const h = (tower ? 420 + rnd() * 520 : 50 + rnd() ** 1.6 * 300) * (0.55 + 0.45 * clamp(r / 1400));
          list.push({x: cx, z, w, d: S - 52, h, delay: r * 0.022 + rnd() * 6, cap: rnd()});
        }
        x += w + 36 + rnd() * 50;
      }
    }
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshStandardMaterial({color: '#070e38', emissive: '#9aaaff', emissiveMap: windowTex(), emissiveIntensity: 0.55, roughness: 0.32, metalness: 0.55});
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    mesh.frustumCulled = false;
    const capGeo = new THREE.PlaneGeometry(1, 1);
    capGeo.rotateX(-Math.PI / 2);
    const caps = new THREE.InstancedMesh(capGeo, new THREE.MeshBasicMaterial({toneMapped: false, transparent: true, opacity: 0.9}), list.length);
    caps.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
    caps.frustumCulled = false;
    return {mesh, caps, list};
  }, []);
  const live = f >= 186;
  useLayoutEffect(() => {
    if (!live) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    const dim = new THREE.Color('#1d2c86');
    const lit = new THREE.Color('#8fa4ff');
    list.forEach((b, i) => {
      const s = pop(f, 192 + b.delay, 15, 120, 0.9);
      const h = Math.max(0.01, b.h * s);
      const on = s > 0.002 ? 1 : 0;
      o.position.set(b.x, 0, b.z);
      o.rotation.set(0, 0, 0);
      o.scale.set(b.w * on || 1e-4, h, b.d * on || 1e-4);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      o.position.set(b.x, h + 0.8, b.z);
      o.scale.set((b.w - 10) * on || 1e-4, 1, (b.d - 10) * on || 1e-4);
      o.updateMatrix();
      caps.setMatrixAt(i, o.matrix);
      c.copy(dim).lerp(lit, b.cap > 0.82 ? 0.75 : b.cap * 0.25);
      caps.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    caps.instanceMatrix.needsUpdate = true;
    caps.instanceColor!.needsUpdate = true;
  }, [f, live, list, mesh, caps]);
  return live ? (
    <>
      <primitive object={mesh} />
      <primitive object={caps} />
    </>
  ) : null;
};

// ---------------- matrix columns ----------------
const unitEdges = (() => {
  const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  g.translate(0, 0.5, 0);
  return g;
})();
const ghostEdges = (() => {
  const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(CW, 64, CD));
  g.translate(0, 32, 0);
  return g;
})();

const Ghost: React.FC<{x: number; z: number; o: number}> = ({x, z, o}) => {
  const ref = React.useRef<THREE.LineSegments>(null);
  useLayoutEffect(() => {
    ref.current?.computeLineDistances();
  }, []);
  return (
    <lineSegments ref={ref} geometry={ghostEdges} position={[x, 0, z]}>
      <lineDashedMaterial color={C.soft} dashSize={12} gapSize={9} transparent opacity={0.75 * o} toneMapped={false} />
    </lineSegments>
  );
};

export const cellAt = (r: number, c: number) => T.cols[c] + r * 2;

const Columns: React.FC<{f: number}> = ({f}) => {
  if (f < T.matrix - 2) return null;
  const out = sm(f, T.exit + 30, T.exit + 70);
  const sweepZ = -700 + 1500 * pr(f, T.changes[2], T.changes[2] + 34);
  const sweepOn = f >= T.changes[2] && f < T.changes[2] + 40;
  const nodes: React.ReactNode[] = [];
  CAPS.forEach((cap, r) =>
    cap.v.forEach((v0, c) => {
      const x = COLX[c];
      const z = rowZ(r);
      const at = cellAt(r, c);
      const isNew = r === NEW_CELL.r && c === NEW_CELL.c;
      const v = isNew ? NEW_CELL.v : v0;
      const newS = isNew ? pop(f, T.changes[0], 12, 160, 0.8) : 1;
      if (v === null || (isNew && newS < 0.999)) {
        const g = pop(f, at, 14, 170, 0.7) * (isNew ? 1 - newS : 1) * (1 - out);
        if (g > 0.01) nodes.push(<Ghost key={`g${r}${c}`} x={x} z={z} o={g} />);
        if (v === null) return;
      }
      const s = (isNew ? newS : pop(f, at, 13, 150, 0.75)) * (1 - out);
      if (s <= 0.002) return;
      const h = Math.max(1, HMAX * v * s);
      const flash = Math.exp(-Math.max(0, f - (isNew ? T.changes[0] : at)) / 12);
      const sweep = sweepOn ? Math.exp(-(((z - sweepZ) / 70) ** 2)) : 0;
      const capCol = col('#c9d3ff', '#ffffff', flash + sweep);
      nodes.push(
        <group key={`${r}${c}`} position={[x, 0, z]}>
          <mesh scale={[CW, h, CD]} position={[0, h / 2, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={'#5b78ff'} emissive={'#3a55e8'} emissiveIntensity={0.18 + 0.32 * v + 1.1 * flash + 0.8 * sweep} roughness={0.22} metalness={0.35} transparent opacity={0.86} />
          </mesh>
          <lineSegments geometry={unitEdges} scale={[CW + 1, h + 0.5, CD + 1]}>
            <lineBasicMaterial color={'#dfe6ff'} transparent opacity={0.55 + 0.45 * flash} toneMapped={false} />
          </lineSegments>
          <mesh position={[0, h + 1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[CW - 8, CD - 8]} />
            <meshBasicMaterial color={capCol} toneMapped={false} />
          </mesh>
        </group>,
      );
    }),
  );
  // cell footprints snap onto the street on the matrix hit, before the columns rise
  const plates = CAPS.flatMap((cap, r) =>
    cap.v.map((_, c) => {
      const t = T.matrix + r * 1.5 + c;
      const k = pop(f, t, 14, 220, 0.6) * (1 - out);
      if (k <= 0.01) return null;
      const fl = Math.exp(-Math.max(0, f - t) / 10);
      return (
        <mesh key={`p${r}${c}`} position={[COLX[c], 1.5, rowZ(r)]} rotation={[-Math.PI / 2, 0, 0]} scale={[k, k, 1]}>
          <planeGeometry args={[CW + 22, CD + 22]} />
          <meshBasicMaterial color={A} transparent opacity={0.22 + 0.6 * fl} blending={THREE.AdditiveBlending} toneMapped={false} depthWrite={false} />
        </mesh>
      );
    }),
  );
  return (
    <group>
      {plates}
      {nodes}
      {sweepOn ? (
        <mesh position={[0, 3, sweepZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1100, 10]} />
          <meshBasicMaterial color={'#ffffff'} transparent opacity={0.85 * (1 - pr(f, T.changes[2] + 26, T.changes[2] + 40))} blending={THREE.AdditiveBlending} toneMapped={false} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
};

export const GL: React.FC = () => {
  const f = useGLFrame();
  const lights = sm(f, 180, 250);
  return (
    <group>
      <pointLight position={[0, 700, 300]} color={A} intensity={1.1 * lights} distance={4200} decay={0} />
      <pointLight position={[-2200, 1500, 1800]} color={C.coral} intensity={0.9 * lights} distance={6500} decay={0} />
      <pointLight position={[1800, 600, -1600]} color={'#3d5bff'} intensity={0.7 * lights} distance={5000} decay={0} />
      <Ground f={f} />
      <Avenues f={f} />
      <Hatches f={f} />
      <Blocks f={f} />
      <Columns f={f} />
    </group>
  );
};
