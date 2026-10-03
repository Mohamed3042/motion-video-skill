// Act 2 · The turn (720–1320), CSS-3D: the debris falling into orbital rings (shared storm), the real logo PNG
// cross-dissolving over the WebGL planet at the lock (cut out by a code-drawn mask so only the planet, ring and
// satellite cover the render), the title block in front of the planet, and the three benefit holograms that lock
// under their satellites — all pulled into the coral satellite before the dive.
import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, FONT, LOGO, MONO} from '../../brand';
import {Card3D, useWorldFrame} from '../../engine/space';
import {GlassPanel} from '../../engine/glass';
import {add, lerp3, oneToOne, type V3} from '../../engine/math';
import {sp} from '../../shared';
import {LOGO_CARD, satPos} from '../../shell/orbit';
import {Debris} from '../chaos/storm';
import {BEN_PSI, BEN_SHOT, LOCK_SHOT, T0, benPoint, depthOf, unproject} from '../chaos/story';
import {clamp, ease, prog} from '../chaos/util';
import {BENEFITS, LOCK, RELAYOUT, SUCK, TAGLINE, TITLE} from './timing';

// the logo's silhouette (planet ∪ ring band ∪ satellite), feathered: only these pixels of the PNG cover the render
export const MASK = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' width='512' height='512'><defs><filter id='b' x='-10%' y='-10%' width='120%' height='120%'><feGaussianBlur stdDeviation='1.6'/></filter></defs><g filter='url(#b)'><circle cx='254' cy='258' r='148' fill='white'/><ellipse cx='258' cy='243' rx='207' ry='88' transform='rotate(-25.3 258 243)' fill='none' stroke='white' stroke-width='38'/><circle cx='409.5' cy='128.5' r='41' fill='white'/></g></svg>",
)}")`;

const P30 = oneToOne(30);
const TITLE_DEPTH = 6000;
// title block anchors: under the logo at the lock, between planet and benefits after the relayout
const anchor = (y0: number, y1: number) => ({a: unproject(LOCK_SHOT, 960, y0, TITLE_DEPTH), b: unproject(BEN_SHOT, 960, y1, TITLE_DEPTH)});
const T_MONO = anchor(722, 452);
const T_TITLE = anchor(790, 518);
const T_TAG = anchor(858, 582);

const pull = (p: V3, g: number, delay = 0) => {
  const k = ease.cubicIn(prog(g, T0 + SUCK + delay, T0 + SUCK + 34 + delay));
  return {p: lerp3(p, satPos(g), k), k};
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  const g = f + T0;
  const layout = ease.cubicInOut(prog(f, RELAYOUT[0], RELAYOUT[1] + 6));
  const logoIn = prog(f, LOCK - 4, LOCK + 6);
  const logoOut = ease.cubicInOut(prog(f, RELAYOUT[0] - 4, RELAYOUT[0] + 26));
  const tag = ease.expoOut(prog(f, TAGLINE, TAGLINE + 25));
  const ts = TITLE_DEPTH / P30;

  const titleCard = (an: {a: V3; b: V3}, at: number, delay: number, child: React.ReactNode, w: number) => {
    const {p, k} = pull(lerp3(an.a, an.b, layout), g, delay);
    const e = ease.expoOut(prog(f, at, at + 22));
    if (e <= 0 || k >= 1) return null;
    return (
      <Card3D p={add(p, [0, -120 * (1 - e) * ts, 0])} s={ts * (1 - 0.85 * k)} opacity={clamp(e * 1.4) * (1 - k)} w={w}>
        {child}
      </Card3D>
    );
  };

  return (
    <>
      <Debris g={g} from={T0} to={T0 + 130} />
      {/* the real logo, cross-dissolving over the render at the lock */}
      {logoIn > 0 && logoOut < 1 ? (
        <Card3D p={LOGO_CARD.p} w={512} h={512} s={LOGO_CARD.size / 512} opacity={logoIn * (1 - logoOut)} near={10} nearFade={20}>
          <Img src={staticFile(LOGO)} style={{width: 512, height: 512, display: 'block', WebkitMaskImage: MASK, maskImage: MASK, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'}} />
        </Card3D>
      ) : null}
      {titleCard(T_MONO, TITLE - 6, 10, <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: '0.28em', color: C.coral, textAlign: 'center', whiteSpace: 'nowrap'}}>TURN NOISE INTO DIRECTION</div>, 900)}
      {titleCard(T_TITLE, TITLE, 4, <div style={{fontFamily: FONT, fontSize: 82, fontWeight: 700, letterSpacing: '-0.045em', color: C.ink, textAlign: 'center', whiteSpace: 'nowrap', textShadow: '0 10px 30px rgba(2,6,23,0.9)'}}>Job Engine Orbit</div>, 1000)}
      {tag > 0
        ? titleCard(T_TAG, TAGLINE, 0, <div style={{fontFamily: FONT, fontSize: 36, color: C.muted, textAlign: 'center', whiteSpace: 'nowrap'}}>Your next chapter has coordinates.</div>, 1000)
        : null}
      {/* benefit holograms, under their satellites (WebGL), locking on the beat */}
      {BENEFITS.map((b, i) => {
        const at = b.f;
        if (f < at - 2) return null;
        const sat = benPoint(BEN_PSI[i]);
        const d = depthOf(BEN_SHOT, sat);
        const s = d / P30;
        const spring = sp(f, at, {damping: 15, stiffness: 150, mass: 1});
        const {p, k} = pull(add(sat, [0, -150 * s, 0]), g, 6 * i);
        if (k >= 1) return null;
        return (
          <Card3D key={i} p={add(p, [0, 0, 900 * (1 - spring)])} r={[0, 38 * (1 - spring) * (i === 0 ? -1 : 1), 0]} s={s * (1 - 0.85 * k)} opacity={clamp(prog(f, at, at + 6)) * (1 - k)} billboard={false}>
            <GlassPanel accent={b.color} frame={f} w={380} padding="20px 24px 22px" glow={Math.exp(-Math.max(0, f - at) / 14)} edge="top">
              <div style={{textAlign: 'center', fontFamily: FONT, fontSize: 34, fontWeight: 600, lineHeight: 1.28, color: C.ink}}>
                {b.lines[0]}
                <br />
                <span style={{color: b.color}}>{b.lines[1]}</span>
              </div>
            </GlassPanel>
          </Card3D>
        );
      })}
    </>
  );
};
