// Job Orbit v2 engine: the WebGL layer, locked to the same camera as the CSS layer.
// Sections may export a `GL` component (react-three-fiber JSX, world units = px, y up). It is mounted inside
// <SectionGL id> which places it at the section's origin/yaw and provides useGLFrame() (local frame).
import React, {createContext, useContext, useLayoutEffect} from 'react';
import {useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import type * as THREE from 'three';
import {cameraAt, CAM_SECTIONS, type CamId} from './camera';
import {PLACEMENT} from './layout';
import {H, W} from './space';

const CamSync: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    const c = cameraAt(frame);
    camera.position.set(c.pos[0], c.pos[1], c.pos[2]);
    camera.up.set(0, 1, 0);
    camera.lookAt(c.target[0], c.target[1], c.target[2]);
    if (c.roll) camera.rotateZ((c.roll * Math.PI) / 180);
    camera.fov = c.fov;
    camera.near = 2;
    camera.far = 400000;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  }, [frame, camera]);
  return null;
};

const GLFrameCtx = createContext<{start: number}>({start: 0});
/** Local frame of the enclosing <SectionGL> (0 = section start). */
export const useGLFrame = () => useCurrentFrame() - useContext(GLFrameCtx).start;

export const SectionGL: React.FC<{id: CamId; children: React.ReactNode}> = ({id, children}) => {
  const pl = PLACEMENT[id];
  const start = CAM_SECTIONS.find((s) => s.id === id)!.start;
  return (
    <group position={pl.origin} rotation={[0, pl.yaw, 0]}>
      <GLFrameCtx.Provider value={{start}}>{children}</GLFrameCtx.Provider>
    </group>
  );
};

/** The WebGL canvas (once, behind the CSS layer). Children are r3f nodes in world space. */
export const GLLayer: React.FC<{children: React.ReactNode}> = ({children}) => (
  <ThreeCanvas
    width={W}
    height={H}
    style={{position: 'absolute', left: 0, top: 0}}
    gl={{antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance', alpha: false}}
    camera={{fov: 40, near: 2, far: 400000, position: [0, 0, 1500]}}
  >
    <CamSync />
    {children}
  </ThreeCanvas>
);
