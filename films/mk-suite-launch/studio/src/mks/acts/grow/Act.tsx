import {useActFrame} from '../../frame';
import {GrowBody} from './Body';
import {WorkBody} from '../work/Body';

// Act 4 · Grow. Before its start (PAD overlap) it still draws the end of Work (shared seam).
export const Act: React.FC = () => {
  const f = useActFrame();
  return f < 0 ? <WorkBody f={f + 960} /> : <GrowBody f={f} />;
};
