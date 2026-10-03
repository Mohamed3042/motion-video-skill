// Station 8 · Employers — WebGL set: a vast building whose façade is a café wall. Dark bands, light windows
// (instanced) and grey floor ledges that extrude into real 3D slabs while light runs along them. Two windows
// swing open on hinges to release the dossier holograms; the watched employer's window gets a beacon. LOCAL coords.
import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {spring} from 'remotion';
import {useGLFrame} from '../../engine/gl';
import {clamp, smoother} from '../../engine/math';
import {DARK, K0, K1, LIGHT, MORTAR, MORTAR_C, ROW, TILE, windows, X0, X1} from './geom';
import {DOSSIERS} from './layout';
import {T} from './timing';

const A = '#c9b6ff';
const pr = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const sm = (f: number, a: number, b: number) => smoother(pr(f, a, b));
const spr = (f: number, at: number, damping = 15, stiffness = 120, mass = 0.9) => (f < at ? 0 : spring({frame: f - at, fps: 60, config: {damping, stiffness, mass}}));
const W = X1 - X0;
const CX = (X0 + X1) / 2;
const HT = (K1 - K0) * ROW;
const CY = ((K0 + K1) / 2) * ROW;
const OPEN = DOSSIERS.map((d) => d.win);
const isOpenWin = (k: number, x: number) => OPEN.findIndex((w) => w.k === k && Math.abs(w.x - x) < 1);

/** how far the dossier windows are open (0 closed … 1 open) */
export const openAt = (f: number, i: number) => spr(f, T.open + i * 4, 16, 140, 0.8) * (1 - sm(f, T.back + 14 + i * 4, T.back + 34 + i * 4));

const Windows: React.FC<{f: number}> = ({f}) => {
  const {mesh, list} = useMemo(() => {
    const list = windows();
    const geo = new THREE.PlaneGeometry(TILE, ROW);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({toneMapped: false}), list.length);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
    mesh.frustumCulled = false;
    return {mesh, list};
  }, []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const lit = new THREE.Color(LIGHT);
    const dark = new THREE.Color(DARK);
    const c = new THREE.Color();
    const dimUI = 1 - 0.6 * sm(f, T.out - 6, T.out + 30) * (1 - sm(f, T.back + 10, T.back + 50));
    list.forEach((w, i) => {
      const d = Math.hypot(w.x - 0, w.y - 0);
      const on = sm(f, T.light + d * 0.0035, T.light + d * 0.0035 + 8);
      const flash = f >= T.light ? Math.exp(-Math.max(0, f - T.light - d * 0.0035) / 9) * on : 0;
      const hidden = isOpenWin(w.k, w.x) >= 0 && openAt(f, isOpenWin(w.k, w.x)) > 0.001;
      o.position.set(w.x, w.y, 1);
      o.scale.setScalar(hidden ? 1e-4 : 1);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      c.copy(dark).lerp(lit, (0.2 + 0.8 * on) * dimUI);
      c.lerp(new THREE.Color('#ffffff'), 0.5 * flash);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
  }, [f, list, mesh]);
  return <primitive object={mesh} />;
};

// ledge box faces: +x, -x, +y (top, catches light), -y (underside), +z (front = the mortar line), -z
const ledgeMats = (lit: number) => {
  const front = new THREE.Color(MORTAR_C);
  const top = new THREE.Color(MORTAR_C).lerp(new THREE.Color('#e7ddff'), 0.75 * lit);
  const under = new THREE.Color(MORTAR_C).multiplyScalar(0.45);
  return [front, front, top, under, front, front].map((c) => new THREE.MeshBasicMaterial({color: c, toneMapped: false}));
};

const Ledges: React.FC<{f: number}> = ({f}) => {
  const ex = sm(f, T.ledges[0], T.ledges[1]);
  const depth = 3 + 85 * ex;
  const mats = useMemo(() => ledgeMats(1), []);
  const flat = useMemo(() => ledgeMats(0), []);
  const nodes: React.ReactNode[] = [];
  for (let k = K0; k <= K1; k++) {
    const t0 = T.ledges[0] - 2 + Math.abs(k - 1) * 1.6;
    const u = pr(f, t0, t0 + 34);
    const sweep = u > 0 && u < 1;
    nodes.push(
      <mesh key={k} position={[CX, k * ROW, depth / 2]} material={ex > 0.02 ? mats : flat}>
        <boxGeometry args={[W, MORTAR, depth]} />
      </mesh>,
    );
    if (sweep) {
      const x = X0 - 400 + (W + 800) * smoother(u);
      nodes.push(
        <mesh key={'s' + k} position={[x, k * ROW, depth + 1]}>
          <planeGeometry args={[900, MORTAR + 8]} />
          <meshBasicMaterial color={'#ffffff'} transparent opacity={0.95 * Math.sin(Math.PI * u)} blending={THREE.AdditiveBlending} toneMapped={false} depthWrite={false} />
        </mesh>,
        <mesh key={'h' + k} position={[x + 300, k * ROW + MORTAR / 2 + 1, depth / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[600, depth]} />
          <meshBasicMaterial color={A} transparent opacity={0.8 * Math.sin(Math.PI * u)} blending={THREE.AdditiveBlending} toneMapped={false} depthWrite={false} />
        </mesh>,
      );
    }
  }
  return <group>{nodes}</group>;
};

const glowTex = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

const OpenWindows: React.FC<{f: number}> = ({f}) => {
  const glow = useMemo(() => glowTex(), []);
  return (
    <group>
      {OPEN.map((w, i) => {
        const o = openAt(f, i);
        if (o <= 0.001) return null;
        const watch = i === 0 ? spr(f, T.watch, 14, 160, 0.8) * (1 - sm(f, T.back, T.back + 30)) : 0;
        const ring = i === 0 && f >= T.watch ? ((f - T.watch) % 60) / 60 : 0;
        return (
          <group key={i} position={[w.x, w.y, 0]}>
            {/* interior light */}
            <mesh position={[0, 0, 0.5]}>
              <planeGeometry args={[TILE, ROW]} />
              <meshBasicMaterial color={'#f4efff'} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 4]}>
              <planeGeometry args={[TILE * 6, TILE * 6]} />
              <meshBasicMaterial map={glow} color={A} transparent opacity={0.55 * o + 0.3 * watch} blending={THREE.AdditiveBlending} toneMapped={false} depthWrite={false} />
            </mesh>
            {/* the pane, hinged on its left edge, swings out toward the camera */}
            <group position={[-TILE / 2, 0, 2]} rotation={[0, -1.95 * o, 0]}>
              <mesh position={[TILE / 2, 0, 0]}>
                <planeGeometry args={[TILE, ROW]} />
                <meshBasicMaterial color={LIGHT} side={THREE.DoubleSide} toneMapped={false} />
              </mesh>
            </group>
            {watch > 0.01 ? (
              <mesh position={[0, 0, 6]} scale={1 + 1.6 * ring}>
                <ringGeometry args={[TILE * 0.62, TILE * 0.62 + 10, 64]} />
                <meshBasicMaterial color={A} transparent opacity={watch * (1 - ring)} blending={THREE.AdditiveBlending} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
};

const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(W, HT, 1800));

export const GL: React.FC = () => {
  const f = useGLFrame();
  return (
    <group>
      {/* the building body behind the façade */}
      <mesh position={[CX, CY, -902]}>
        <boxGeometry args={[W, HT, 1800]} />
        <meshBasicMaterial color={'#040826'} toneMapped={false} />
      </mesh>
      <lineSegments geometry={edges} position={[CX, CY, -900]}>
        <lineBasicMaterial color={A} transparent opacity={0.35} toneMapped={false} />
      </lineSegments>
      <mesh position={[CX, CY, -1]}>
        <planeGeometry args={[W, HT]} />
        <meshBasicMaterial color={DARK} toneMapped={false} />
      </mesh>
      <Windows f={f} />
      <Ledges f={f} />
      <OpenWindows f={f} />
    </group>
  );
};
