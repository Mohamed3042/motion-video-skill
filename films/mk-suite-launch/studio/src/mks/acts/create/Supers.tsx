// The act's supers (one at a time; each sits in open stage, never over the UI it talks about).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Super} from '../../kit';
import {T} from './timing';

export const Supers: React.FC<{f: number}> = ({f}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {/* above the Montage window as it tilts back into a floor */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center'}}>
      <Super f={f} text="Bring your footage together." start={T.mpSuper} end={T.mpSuperOut} size={104} />
    </div>
    {/* left of the MK Editor page while it swings in on the right */}
    <div style={{position: 'absolute', left: 104, top: 360}}>
      <Super f={f} text="From packaging artwork to production." start={T.edSuper} end={T.edSuperOut} size={80} align="left" maxWidth={640} />
    </div>
    {/* above the keycaps */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center'}}>
      <Super f={f} text="Everything, one keystroke away." start={T.kcSuper} end={T.kKey - 10} size={96} accentWords={[2]} maxWidth={1780} />
    </div>
  </AbsoluteFill>
);
