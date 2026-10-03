// Engine self-test composition (Orbit2EngineTest): CSS cards and WebGL markers at the SAME 3D points must coincide.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {WORLDS} from '../timing';
import {GLLayer, SectionGL} from './gl';
import {Card3D, Group3D, SectionSpace, Space, useCam} from './space';

const MARK: [number, number, number] = [300, 200, 0];

const Hud: React.FC = () => {
  const c = useCam();
  return (
    <Card3D p={[0, 0, 0]} w={760} h={420} style={{border: '2px solid #89b7ff', background: 'rgba(12,28,88,0.55)', color: '#f3f7ff', font: '600 34px sans-serif', padding: 24, boxSizing: 'border-box'}}>
      <div>station · {c.section}</div>
      <div style={{fontSize: 22, marginTop: 12, opacity: 0.8}}>flight {c.flight.toFixed(2)} · fov {c.fov.toFixed(1)}</div>
      <div style={{position: 'absolute', left: 380 - 6, top: 210 - 6, width: 12, height: 12, borderRadius: 6, background: '#ff754d'}} />
    </Card3D>
  );
};

export const EngineTest: React.FC = () => (
  <AbsoluteFill style={{background: '#040b36'}}>
    <GLLayer>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3000, 4000, 5000]} intensity={2.2} />
      <mesh>
        <sphereGeometry args={[900, 64, 48]} />
        <meshStandardMaterial color="#122ac2" roughness={0.35} metalness={0.1} />
      </mesh>
      {WORLDS.map((w) => (
        <SectionGL key={w.id} id={w.id}>
          <mesh position={MARK}>
            <sphereGeometry args={[30, 24, 16]} />
            <meshBasicMaterial color="#ff754d" />
          </mesh>
          <mesh position={[0, 0, -2]}>
            <planeGeometry args={[800, 460]} />
            <meshBasicMaterial color="#0c1c58" />
          </mesh>
        </SectionGL>
      ))}
    </GLLayer>
    <Space>
      {WORLDS.map((w) => (
        <SectionSpace key={w.id} id={w.id}>
          <Hud />
          <Card3D p={MARK} w={110} h={110} style={{border: '4px solid #74e1ba', borderRadius: 60, boxSizing: 'border-box'}}>
            <span />
          </Card3D>
          <Group3D p={[-700, 0, -300]} r={[0, 35, 0]}>
            <Card3D w={420} h={260} style={{background: 'rgba(255,117,77,0.25)', border: '2px solid #ff754d', color: 'white', font: '600 28px sans-serif', padding: 16, boxSizing: 'border-box'}}>
              rotated group (y 35°)
            </Card3D>
          </Group3D>
        </SectionSpace>
      ))}
    </Space>
  </AbsoluteFill>
);
