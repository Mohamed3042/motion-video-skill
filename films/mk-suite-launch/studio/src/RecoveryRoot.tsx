import React from 'react';
import {Composition} from 'remotion';
import {MksReel, MksActSolo} from './mks/Reel';
import {DURATION, FPS} from './mks/timing';

export const RecoveryRoot: React.FC = () => (
  <>
    <Composition id="MkSuiteLaunch" component={MksReel} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    <Composition id="MksAct" component={MksActSolo} durationInFrames={1464} defaultProps={{id: 'reveal' as const}} fps={FPS} width={1920} height={1080} />
  </>
);
