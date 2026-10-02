// Outro / end card: brand, the approved closing line, and a roll call of all 23 products in film order.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, BODY, C, FONT, MONO} from '../brand';
import {useSegFrame} from '../frame';
import {SEGMENTS} from '../timing';
import {Mark} from '../shell/Mark';
import {clamp, ease, rgba} from '../util';

export const Outro: React.FC = () => {
  const f = useSegFrame();
  const p = ease.expoOut(clamp((f + 6) / 24));
  const q = ease.expoOut(clamp((f + 2) / 20));
  return (
    <AbsoluteFill style={{background: C.bg, color: C.fg, fontFamily: FONT, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 104, display: 'flex', justifyContent: 'center', opacity: p}}><Mark size={96} /></div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 232, textAlign: 'center', fontSize: 164, lineHeight: 1, fontWeight: 700, letterSpacing: -11, opacity: p, transform: `scale(${0.92 + 0.08 * p})`}}>MK SUITE<span style={{color: C.primary}}>.</span></div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center', fontSize: 62, lineHeight: 1.2, letterSpacing: -2, opacity: q}}>One suite.<br /><span style={{color: '#EEAA92'}}>One monthly subscription.</span></div>
      <div style={{position: 'absolute', left: 110, right: 110, top: 664, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, fontFamily: BODY, fontSize: 21}}>
        {SEGMENTS.map((s, i) => {
          const t = ease.cubicOut(clamp((f - 4 - i * 1.6) / 14));
          return (
            <div key={s.id} style={{display: 'flex', alignItems: 'center', gap: 10, height: 42, padding: '0 16px', borderRadius: 21, background: rgba(ACCENT[s.id], 0.1), border: `1.5px solid ${rgba(ACCENT[s.id], 0.38)}`, color: '#DCD9E3', opacity: t, transform: `translateY(${14 * (1 - t)}px)`}}>
              <span style={{width: 9, height: 9, borderRadius: 5, background: ACCENT[s.id]}} />{s.name}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 100, right: 100, bottom: 78, textAlign: 'center', fontFamily: MONO, fontSize: 22, lineHeight: 1.7, color: '#B5B4C1', opacity: q}}>Subscription concept; product availability varies.<br />Free cores remain free.</div>
    </AbsoluteFill>
  );
};
