// Standalone entry: Job Orbit v2 ("The Flight") without importing other film projects.
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {OrbitReel, OrbitSectionSolo} from './Reel';
import {EngineTest} from './engine/Test';

const OrbitCompositions: React.FC = () => (
  <>
    <Composition id="JobOrbit2" component={OrbitReel} durationInFrames={7200} fps={60} width={1920} height={1080} />
    <Composition id="Orbit2Section" component={OrbitSectionSolo} durationInFrames={744} fps={60} width={1920} height={1080} defaultProps={{id: 'profile' as const}} />
    <Composition id="Orbit2EngineTest" component={EngineTest} durationInFrames={7200} fps={60} width={1920} height={1080} />
  </>
);
registerRoot(OrbitCompositions);
