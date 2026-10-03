// Placeholder helper: a v1 (2D, full-frame) section shown as a framed 1920×1080 hologram screen at its station.
import React from 'react';
import {Sequence} from 'remotion';
import {PAD} from '../timing';
import {CAM_SECTIONS, type CamId} from './camera';
import {Card3D} from './space';

export const LegacyScreen: React.FC<{id: CamId; Comp: React.FC}> = ({id, Comp}) => {
  const s = CAM_SECTIONS.find((x) => x.id === id)!;
  return (
    <Card3D w={1920} h={1080} style={{overflow: 'hidden', borderRadius: 18, boxShadow: '0 0 0 2px rgba(137,183,255,0.5), 0 0 80px rgba(18,42,194,0.6)'}}>
      <Sequence from={s.start - PAD} durationInFrames={s.end - s.start + 2 * PAD} layout="none">
        <div style={{position: 'absolute', inset: 0}}>
          <Comp />
        </div>
      </Sequence>
    </Card3D>
  );
};
