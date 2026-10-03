import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {PhoneReel, PhoneWorldSolo} from './phone/Reel';
import {DURATION,FPS} from './mpw/timing';
const Root:React.FC=()=> <>
 <Composition id="MontageProPhone" component={PhoneReel} width={1080} height={1920} fps={FPS} durationInFrames={DURATION}/>
 <Composition id="MontagePhoneWorld" component={PhoneWorldSolo} width={1080} height={1920} fps={FPS} durationInFrames={1104} defaultProps={{id:'sync' as const}}/>
</>;
registerRoot(Root);
