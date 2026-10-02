import {useCurrentFrame} from 'remotion';
import {PAD} from './timing';

// Inside a section (intro, segment, outro): 0 = the section's first frame. Valid range is [-PAD, length + PAD).
export const useSegFrame = () => useCurrentFrame() - PAD;
