// MK Suite — launch film (120 s): the shell. Seven acts stitched by the boundary treatments in shell/transitions,
// one camera shake driven by every event that carries `shake`, the bloom, the global grade and the score.
// No content of its own: the acts own every pixel.
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C} from './brand';
import {ACTS, PAD, type ActId} from './timing';
import {ACT_IMPL} from './acts';
import {Grade, shake} from './kit';
import {Bloom, lookAt} from './shell/transitions';

const SHAKES = ACTS.flatMap((a) => ACT_IMPL[a.id].EVENTS.filter((e) => e.shake).map((e) => ({f: a.start + e.f, amp: e.shake!})));

const Shot: React.FC<{i: number}> = ({i}) => {
  const a = ACTS[i];
  const look = lookAt(i, useCurrentFrame() + a.start - PAD);
  if (!look) return null;
  const {Act} = ACT_IMPL[a.id];
  const fid = `mks-whip-${a.id}`;
  const blurred = look.blurX > 0.5;
  return (
    <>
      {blurred ? (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <filter id={fid} x="-0.2" y="0" width="1.4" height="1" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation={`${look.blurX.toFixed(1)} 0`} />
          </filter>
        </svg>
      ) : null}
      <AbsoluteFill style={{...look.style, filter: [look.style.filter, blurred ? `url(#${fid})` : ''].join(' ').trim() || undefined, overflow: 'hidden'}}>
        <Act />
      </AbsoluteFill>
    </>
  );
};

export const MksReel: React.FC = () => {
  const g = useCurrentFrame();
  const s = shake(g, SHAKES);
  return (
    <AbsoluteFill style={{background: C.stage, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: s.x || s.y ? `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px)` : undefined}}>
        {ACTS.map((a, i) => (
          <Sequence key={a.id} from={a.start - PAD} durationInFrames={a.end - a.start + 2 * PAD} name={`${a.index} ${a.name}`} layout="none">
            <Shot i={i} />
          </Sequence>
        ))}
      </AbsoluteFill>
      <Bloom g={g} />
      <Grade f={g} />
      <Audio src={staticFile('mks/music.wav')} />
    </AbsoluteFill>
  );
};

// Debug composition: one act alone, local frame 0 at composition frame PAD. Used by act builders.
export const MksActSolo: React.FC<{id: ActId}> = ({id}) => {
  const {Act} = ACT_IMPL[id];
  return (
    <AbsoluteFill style={{background: C.stage}}>
      <Act />
    </AbsoluteFill>
  );
};
