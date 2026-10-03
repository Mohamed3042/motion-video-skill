// Act 1 · The noise (0–720), CSS-3D: the debris storm, the kinetic lines as giant type on the camera path
// (each slams in on its hit and is flown through just before the next), and the headline over the cloud.
import React from 'react';
import {C, FONT, MONO} from '../../brand';
import {Card3D, useWorldFrame} from '../../engine/space';
import {rgba} from '../../shared';
import {Debris} from './storm';
import {HEADLINE_Z, LINE3D, T0} from './story';
import {HEADLINE} from './timing';
import {clamp, ease, prog} from './util';

const KineticLine: React.FC<{i: number; g: number}> = ({i, g}) => {
  const L = LINE3D[i];
  if (g < L.f - 1 || g > L.pass + 14) return null;
  const e = ease.expoOut(prog(g, L.f, L.f + 13));
  const flash = g >= L.f ? Math.exp(-(g - L.f) / 8) : 0;
  const z = L.p[2] - 2600 * (1 - e);
  return (
    <Card3D p={[L.p[0], L.p[1], z]} r={[0, L.rotY * (0.4 + 0.6 * (1 - e)), 0]} near={140} nearFade={1300} opacity={clamp((g - L.f + 1) / 5)}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: L.fontSize,
          letterSpacing: '-0.045em',
          lineHeight: 1.05,
          color: C.ink,
          whiteSpace: 'nowrap',
          textShadow: `0 0 ${(L.fontSize * 0.3).toFixed(0)}px ${rgba(C.sky, 0.28 + 0.55 * flash)}, 0 ${(L.fontSize * 0.08).toFixed(0)}px ${(L.fontSize * 0.25).toFixed(0)}px rgba(2,6,23,0.9)`,
        }}
      >
        {L.text}
      </div>
    </Card3D>
  );
};

// "The job hunt is noise." — 1:1 at mid-hold in front of the cloud; sucked into the cloud at the cut
const Headline: React.FC<{g: number}> = ({g}) => {
  if (g < HEADLINE - 1 || g >= T0) return null;
  const h = ease.expoOut(prog(g, HEADLINE, HEADLINE + 16));
  const suck = ease.cubicIn(prog(g, 700, 716));
  return (
    <Card3D p={[0, 20, HEADLINE_Z - 500 * (1 - h) - 2600 * suck]} s={(0.94 + 0.06 * h) * (1 - 0.5 * suck)} opacity={h * (1 - suck)} w={1500}>
      <div style={{textAlign: 'center', fontFamily: FONT, color: C.ink}}>
        <div style={{fontFamily: MONO, fontSize: 23, letterSpacing: '0.25em', color: C.muted, marginBottom: 28}}>TOO MANY SIGNALS. TOO LITTLE CLARITY.</div>
        <div style={{fontSize: 122, fontWeight: 700, letterSpacing: '-0.055em', lineHeight: 1.04, textShadow: '0 14px 40px rgba(2,6,23,0.95), 0 0 60px rgba(2,6,23,0.8)'}}>
          The job hunt
          <br />
          is<span style={{color: C.coral, paddingLeft: 25, textShadow: `0 0 34px ${rgba(C.coral, 0.45)}`}}>noise.</span>
        </div>
      </div>
    </Card3D>
  );
};

export const World: React.FC = () => {
  const g = useWorldFrame(); // chaos local frame = story frame
  return (
    <>
      <Debris g={g} from={-100} to={T0} />
      {LINE3D.map((_, i) => (
        <KineticLine key={i} i={i} g={g} />
      ))}
      <Headline g={g} />
    </>
  );
};
