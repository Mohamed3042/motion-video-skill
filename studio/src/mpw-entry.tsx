// Standalone entry for Montage Pro: Eleven Worlds (keeps the shared Root.tsx untouched).
//   npx remotion render src/mpw-entry.tsx MontageProWorlds ../out/montage-pro-worlds.mp4
//   npx remotion still  src/mpw-entry.tsx MpwWorld out.png --frame=N --props='{"id":"sync"}'
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {MpwReel, MpwWorldSolo} from './mpw/Reel';
import {DURATION, FPS} from './mpw/timing';

const hd = {fps: FPS, width: 1920, height: 1080} as const;

const Root: React.FC = () => (
  <>
    <Composition id="MontageProWorlds" component={MpwReel} durationInFrames={DURATION} {...hd} />
    {/* debug: one world alone; local frame 0 = composition frame 12 (longest world 1080 + 2×12) */}
    <Composition id="MpwWorld" component={MpwWorldSolo} durationInFrames={1104} defaultProps={{id: 'sync' as const}} {...hd} />
  </>
);

registerRoot(Root);
