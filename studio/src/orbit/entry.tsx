// Standalone entry: rebuild Orbit without importing other film projects.
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {OrbitReel, OrbitSectionSolo} from './Reel';
const OrbitCompositions: React.FC = () => <>
  <Composition id="JobOrbit" component={OrbitReel} durationInFrames={7200} fps={60} width={1920} height={1080}/>
  <Composition id="OrbitSection" component={OrbitSectionSolo} durationInFrames={744} fps={60} width={1920} height={1080} defaultProps={{id:'profile' as const}}/>
</>;
registerRoot(OrbitCompositions);
