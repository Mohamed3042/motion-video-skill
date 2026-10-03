// Private preview entry for acts 5 + 6 only (immune to other acts being mid-edit).
// MksAct = one act alone (local 0 = frame 12, like Root's MksAct); MksTail = acts 5→6 back to back as the shell
// sequences them (frame 0 = global 4788), to check the 6000 seam.
import React from 'react';
import {AbsoluteFill, Composition, Sequence, registerRoot} from 'remotion';
import {C} from '../../../src/mks/brand';
import {PAD} from '../../../src/mks/timing';
import {Act as Yours} from '../../../src/mks/acts/yours/Act';
import {Act as Finale} from '../../../src/mks/acts/finale/Act';

const Solo: React.FC<{id: string}> = ({id}) => <AbsoluteFill style={{background: C.stage}}>{id === 'finale' ? <Finale /> : <Yours />}</AbsoluteFill>;
const Tail: React.FC = () => (
  <AbsoluteFill style={{background: C.stage}}>
    <Sequence from={0} durationInFrames={1200 + 2 * PAD}>
      <Yours />
    </Sequence>
    <Sequence from={1200} durationInFrames={1200 + 2 * PAD}>
      <Finale />
    </Sequence>
  </AbsoluteFill>
);
const hd = {fps: 60, width: 1920, height: 1080} as const;
registerRoot(() => (
  <>
    <Composition id="MksAct" component={Solo} durationInFrames={1224} defaultProps={{id: 'yours'}} {...hd} />
    <Composition id="MksTail" component={Tail} durationInFrames={2424} {...hd} />
  </>
));
