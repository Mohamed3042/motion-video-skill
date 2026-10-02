import {Composition} from 'remotion';
import {MkVoiceReel, MkMontageReel, MkSuiteReel} from './Reels';

// Standalone entry with only the MK reels (same ids/settings as src/Root.tsx), so MK renders
// don't depend on other reels compiling while they are being built.
const hd = {fps: 60, width: 1920, height: 1080, durationInFrames: 1200} as const;

export const MkRoot: React.FC = () => (
  <>
    <Composition id="MkVoice" component={MkVoiceReel} {...hd} />
    <Composition id="MkMontage" component={MkMontageReel} {...hd} />
    <Composition id="MkSuite" component={MkSuiteReel} {...hd} />
  </>
);
