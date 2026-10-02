import {Composition} from 'remotion';
import {OpusReel} from './opus/Reel';
import {MkVoiceReel, MkMontageReel, MkSuiteReel} from './mk/Reels';
import {MkvReel, MkvWorldSolo} from './mkv/Reel';
// <mvo:imports> (motion orchestrator inserts generated imports below this line)
import {Compositions as MkSuiteWorkflowsCompositions} from './mk-suite-workflows/Root'; // mvo:mk-suite-workflows
import {Compositions as MkSuiteWorldsCompositions} from './mk-suite-worlds/Root'; // mvo:mk-suite-worlds

const hd = {fps: 60, width: 1920, height: 1080} as const;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="OpusMotion" component={OpusReel} durationInFrames={1500} {...hd} />
    <Composition id="MkVoice" component={MkVoiceReel} durationInFrames={1200} {...hd} />
    <Composition id="MkMontage" component={MkMontageReel} durationInFrames={1200} {...hd} />
    <Composition id="MkSuite" component={MkSuiteReel} durationInFrames={1200} {...hd} />
    <Composition id="MkVoiceWorlds" component={MkvReel} durationInFrames={5400} {...hd} />
    {/* debug: one world alone; local frame 0 = composition frame 12 */}
    <Composition id="MkvWorld" component={MkvWorldSolo} durationInFrames={504} defaultProps={{id: 'myvoice' as const}} {...hd} />
    {/* <mvo:compositions> (motion orchestrator inserts generated compositions below this line) */}
    <MkSuiteWorkflowsCompositions />{/* mvo:mk-suite-workflows */}
    <MkSuiteWorldsCompositions />{/* mvo:mk-suite-worlds */}
  </>
);
