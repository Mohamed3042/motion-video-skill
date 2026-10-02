import {useCurrentFrame} from 'remotion';
import {PAD} from './timing';

// Inside a world: 0 = the world's first frame. Valid range is [-PAD, length + PAD).
export const useWorldFrame = () => useCurrentFrame() - PAD;
