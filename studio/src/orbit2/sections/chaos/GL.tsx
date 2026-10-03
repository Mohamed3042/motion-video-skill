// Act 1 · WebGL: the storm dust (rushes into the cloud at the squeeze) and the cloud's dull roar glow.
import React from 'react';
import {useGLFrame} from '../../engine/gl';
import {Glow3D} from '../../engine/glow';
import {StoryDust} from './storm';
import {T0} from './story';
import {SQUEEZE} from './timing';
import {ease, prog, smooth} from './util';

export const GL: React.FC = () => {
  const g = useGLFrame();
  const roar = smooth(SQUEEZE - 10, SQUEEZE + 50, g) * (1 - ease.cubicIn(prog(g, 696, 716)));
  const flick = 0.85 + 0.15 * Math.sin(0.9 * g) * Math.sin(0.37 * g);
  return (
    <>
      <StoryDust g={g} from={-100} to={T0} />
      {roar > 0.01 && g < T0 ? (
        <>
          <Glow3D size={9000} color="#8f8aa6" opacity={0.16 * roar * flick} />
          <Glow3D size={3600} color="#e1d7c3" opacity={0.2 * roar * flick} />
        </>
      ) : null}
    </>
  );
};
