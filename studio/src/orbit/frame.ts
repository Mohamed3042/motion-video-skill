import {useCurrentFrame} from 'remotion';
import {PAD} from './timing';

// Inside a section: 0 = the section's first frame. Valid range is [-PAD, length + PAD).
export const useSectionFrame = () => useCurrentFrame() - PAD;
