import React, {useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import opentype from 'opentype.js';
import type {Font} from 'opentype.js';
import {createStage} from './stage';

// Everything is driven from useCurrentFrame(); r3f's useFrame is only used to issue the render
// (reflection pass + post-processing composer) after the frame's state has been applied.
const World: React.FC<{font: Font}> = ({font}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const stage = useMemo(() => createStage(font, gl, scene, camera, width, height), [font, gl, scene, camera, width, height]);
  useEffect(() => () => stage.dispose(), [stage]);
  useLayoutEffect(() => {
    stage.update(frame);
  }, [stage, frame]);
  useFrame(() => stage.render(), 1);
  return <primitive object={stage.root} />;
};

export const OpusReel: React.FC = () => {
  const {width, height} = useVideoConfig();
  const [font, setFont] = useState<Font | null>(null);
  const [handle] = useState(() => delayRender('Loading Nunito Black'));
  useEffect(() => {
    fetch(staticFile('opus/fonts/Nunito-Black.ttf'))
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        setFont(opentype.parse(buf));
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);

  return (
    <AbsoluteFill style={{backgroundColor: '#121212'}}>
      {font ? (
        <ThreeCanvas
          width={width}
          height={height}
          flat
          dpr={1}
          gl={{antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'}}
          camera={{fov: 32, near: 0.05, far: 200, position: [0, 1, 8]}}
        >
          <World font={font} />
        </ThreeCanvas>
      ) : null}
      <Audio src={staticFile('opus/music.wav')} />
    </AbsoluteFill>
  );
};
