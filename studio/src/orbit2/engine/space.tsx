// Job Orbit v2 engine: the CSS 3D layer. Crisp HTML/SVG placed in the SAME 3D space and seen through the SAME
// camera as the WebGL layer (three.js CSS3DRenderer math, done declaratively per frame).
//
//   <Space>                       viewport + camera (once, in the Reel)
//     <SectionSpace id="fit">     a section's local frame (placement origin + yaw); provides useWorldFrame()
//       <Group3D p r s>           3D group (nest freely). NEVER put opacity/filter/overflow on groups
//         <Card3D p r w h ...>    a leaf: HTML content centred on its origin, in its local XY plane
//
// Units: world units = CSS px. A Card3D seen from `oneToOne(fov)` units away is pixel-exact (crispest text).
// Local axes inside a Card3D's content are normal CSS (x right, y DOWN); 3D positions `p` are y UP.
import React, {createContext, useContext, useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {cameraAt, type CamId, type CamState} from './camera';
import {PLACEMENT} from './layout';
import {clamp, type V3} from './math';
import {CAM_SECTIONS} from './camera';

export const W = 1920;
export const H = 1080;

export const makeCamera = (c: CamState) => {
  const cam = new THREE.PerspectiveCamera(c.fov, W / H, 2, 400000);
  cam.position.set(c.pos[0], c.pos[1], c.pos[2]);
  cam.up.set(0, 1, 0);
  cam.lookAt(c.target[0], c.target[1], c.target[2]);
  if (c.roll) cam.rotateZ((c.roll * Math.PI) / 180);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};

const n = (x: number) => (Math.abs(x) < 1e-9 ? 0 : +x.toFixed(6));
/** Conjugate by S = diag(1,-1,1,1): converts a y-up matrix into a y-down CSS matrix3d. */
export const cssMatrix = (m: THREE.Matrix4) => {
  const e = m.elements;
  return `matrix3d(${[e[0], -e[1], e[2], e[3], -e[4], e[5], -e[6], -e[7], e[8], -e[9], e[10], e[11], e[12], -e[13], e[14], e[15]].map(n).join(',')})`;
};

type Ctx = {
  cam: CamState;
  camera: THREE.PerspectiveCamera;
  P: number; // CSS perspective in px (== the 1:1 distance)
  world: THREE.Matrix4; // parent's world matrix
  sectionStart: number;
  section: CamId | null;
};
const SpaceCtx = createContext<Ctx | null>(null);
const useSpace = () => {
  const c = useContext(SpaceCtx);
  if (!c) throw new Error('3D nodes must be inside <Space>');
  return c;
};

/** The camera state for the current frame (world space). */
export const useCam = () => useSpace().cam;
/** Local frame of the enclosing <SectionSpace> (0 = section start). */
export const useWorldFrame = () => {
  const f = useCurrentFrame();
  return f - useSpace().sectionStart;
};

/** Project a point given in the CURRENT local space (inside groups/sections) to screen pixels. */
export const useProject = () => {
  const {camera, world, P} = useSpace();
  return (p: V3) => {
    const v = new THREE.Vector3(p[0], p[1], p[2]).applyMatrix4(world);
    const view = v.clone().applyMatrix4(camera.matrixWorldInverse);
    const ndc = v.clone().project(camera);
    const z = -view.z; // distance in front of the camera (negative = behind)
    return {x: (ndc.x * 0.5 + 0.5) * W, y: (-ndc.y * 0.5 + 0.5) * H, depth: z, scale: z > 0 ? P / z : 0, visible: z > 1 && Math.abs(ndc.x) < 1.4 && Math.abs(ndc.y) < 1.4};
  };
};

export const Space: React.FC<{children: React.ReactNode; cam?: CamState}> = ({children, cam: camIn}) => {
  const frame = useCurrentFrame();
  const cam = useMemo(() => camIn ?? cameraAt(frame), [camIn, frame]);
  const camera = useMemo(() => makeCamera(cam), [cam]);
  const P = camera.projectionMatrix.elements[5] * (H / 2);
  const ctx: Ctx = {cam, camera, P, world: new THREE.Matrix4(), sectionStart: 0, section: null};
  return (
    <AbsoluteFill style={{perspective: `${P}px`, perspectiveOrigin: '50% 50%', overflow: 'hidden', pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          transformStyle: 'preserve-3d',
          transformOrigin: '0 0',
          transform: `translate(${W / 2}px, ${H / 2}px) translateZ(${n(P)}px) ${cssMatrix(camera.matrixWorldInverse)}`,
        }}
      >
        <SpaceCtx.Provider value={ctx}>{children}</SpaceCtx.Provider>
      </div>
    </AbsoluteFill>
  );
};

const local = (p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s: number | V3 = 1, order: THREE.EulerOrder = 'XYZ') => {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r[0] * Math.PI) / 180, (r[1] * Math.PI) / 180, (r[2] * Math.PI) / 180, order));
  const sc = typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(s[0], s[1], s[2]);
  return m.compose(new THREE.Vector3(p[0], p[1], p[2]), q, sc);
};

const GroupDiv: React.FC<{m: THREE.Matrix4; children: React.ReactNode}> = ({m, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformStyle: 'preserve-3d', transformOrigin: '0 0', transform: cssMatrix(m)}}>{children}</div>
);

/** A section's local frame. Mount it only around the section's time window (the Reel does this). */
export const SectionSpace: React.FC<{id: CamId; children: React.ReactNode}> = ({id, children}) => {
  const c = useSpace();
  const pl = PLACEMENT[id];
  const m = local(pl.origin, [0, (pl.yaw * 180) / Math.PI, 0]);
  const start = CAM_SECTIONS.find((s) => s.id === id)!.start;
  return (
    <GroupDiv m={m}>
      <SpaceCtx.Provider value={{...c, world: c.world.clone().multiply(m), sectionStart: start, section: id}}>{children}</SpaceCtx.Provider>
    </GroupDiv>
  );
};

type NodeProps = {p?: V3; r?: V3; s?: number | V3; order?: THREE.EulerOrder};

/** A 3D group. Children are other groups/cards. No opacity/filter here (CSS would flatten the 3D). */
export const Group3D: React.FC<NodeProps & {children: React.ReactNode; visible?: boolean}> = ({p, r, s, order, children, visible = true}) => {
  const c = useSpace();
  if (!visible) return null;
  const m = local(p, r, s, order);
  return (
    <GroupDiv m={m}>
      <SpaceCtx.Provider value={{...c, world: c.world.clone().multiply(m)}}>{children}</SpaceCtx.Provider>
    </GroupDiv>
  );
};

export type Card3DProps = NodeProps & {
  children: React.ReactNode;
  /** content box size in px (optional; otherwise the content sizes itself) */
  w?: number;
  h?: number;
  /** face the camera (ignores r) */
  billboard?: boolean;
  /** fade out as it nears the camera (default true): fully gone at `near`, fully visible at `nearFade` */
  near?: number;
  nearFade?: number;
  /** fade with distance: fully visible until `far`, gone at `far * 1.6` (default: off) */
  far?: number;
  /** depth of field: px of blur per 1000 units away from the focus distance (default 0 = off; keep ≤ 6) */
  dof?: number;
  opacity?: number;
  style?: React.CSSProperties;
};

/** A leaf card: HTML/SVG content centred on the node origin, lying in the node's local XY plane. */
export const Card3D: React.FC<Card3DProps> = ({p = [0, 0, 0], r, s, order, children, w, h, billboard, near = 60, nearFade = 420, far, dof = 0, opacity = 1, style}) => {
  const c = useSpace();
  let m = local(p, r, s, order);
  if (billboard) {
    // rotation that cancels the parent's world rotation, then takes the camera's
    const parentQ = new THREE.Quaternion();
    c.world.decompose(new THREE.Vector3(), parentQ, new THREE.Vector3());
    const q = parentQ.invert().multiply(c.camera.quaternion);
    const sc = typeof s === 'number' || s === undefined ? new THREE.Vector3(s ?? 1, s ?? 1, s ?? 1) : new THREE.Vector3(...s);
    m = new THREE.Matrix4().compose(new THREE.Vector3(...p), q, sc);
  }
  const worldPos = new THREE.Vector3().setFromMatrixPosition(c.world.clone().multiply(m));
  const depth = -worldPos.clone().applyMatrix4(c.camera.matrixWorldInverse).z;
  if (depth < near) return null;
  let a = opacity * clamp((depth - near) / Math.max(1, nearFade - near));
  if (far !== undefined) a *= 1 - clamp((depth - far) / (far * 0.6));
  if (a <= 0.003) return null;
  const blur = dof > 0 ? Math.min(14, (Math.abs(depth - c.cam.focus) / 1000) * dof) : 0;
  return (
    <GroupDiv m={m}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: w,
          height: h,
          transform: 'translate(-50%, -50%)',
          transformOrigin: '0 0',
          opacity: a,
          filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
          backfaceVisibility: 'hidden',
          ...style,
        }}
      >
        {children}
      </div>
    </GroupDiv>
  );
};
