import {useActFrame} from '../../frame';
import {WorkBody} from './Body';
import {GrowBody} from '../grow/Body';

// Act 3 · Work. Past its end (PAD overlap) it already draws Grow, so the 3840 seam is identical
// whichever act the shell shows on that frame.
export const Act: React.FC = () => {
  const f = useActFrame();
  return f < 960 ? <WorkBody f={f} /> : <GrowBody f={f - 960} />;
};
