import {useCurrentFrame} from 'remotion';
import {PAD} from './timing';

// Inside an act: 0 = the act's first frame. Valid range is [-PAD, length + PAD).
export const useActFrame = () => useCurrentFrame() - PAD;
