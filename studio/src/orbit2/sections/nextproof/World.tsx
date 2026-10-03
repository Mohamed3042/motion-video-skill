// 06 · Next proof — CSS-3D layer: in-scene title, the A/B tags and the equal-length guides on the step-bars (same 1:1
// depth as the bars, so units are pixels), the one caption, and the hypothetical-proof holograms (v1 copy verbatim).
import React from 'react';
import {ACCENT, C, MONO} from '../../brand';
import {Card3D, Group3D, useWorldFrame} from '../../engine/space';
import {add, mul, type V3} from '../../engine/math';
import {Arrow, Pill, SampleChip, Sparkle, ease, prog, pulse, rgba} from '../focus/kit';
import {Caption3D, Glass, Holo, HoloHeader, Title3D, rowIn} from '../focus/holo';
import {D, FLY, FY, HOLO_C} from './shot';
import {BAR_LEN, barOffset, camBasis} from './stage';

const A = ACCENT.nextproof;

/** A point given in camera space (x right, y up, px at the 1:1 plane) for frame f. */
const camPt = (f: number, x: number, y: number, depth = D): V3 => {
  const b = camBasis(f);
  return add(add(add(b.pos, mul(b.fw, depth)), mul(b.right, x)), mul(b.up, y));
};

const Tag: React.FC<{f: number; which: 'A' | 'B'}> = ({f, which}) => {
  const a = ease.expoOut(prog(f, which === 'A' ? 56 : 64, which === 'A' ? 78 : 86)) * (1 - ease.cubicIn(prog(f, 236, 248)));
  if (a <= 0.003) return null;
  const [x, y] = barOffset(which, f);
  return (
    <Card3D p={camPt(f, x + BAR_LEN / 2 + 34, y)} billboard w={40} h={40} opacity={a}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 26, color: C.ink, lineHeight: '40px', textShadow: `0 0 12px ${rgba(A, 0.8)}`}}>{which}</div>
    </Card3D>
  );
};

/** Equal-length guides: identical brackets under both bars once they hang side by side. */
const Guides: React.FC<{f: number}> = ({f}) => {
  const a = ease.cubicOut(prog(f, FLY[1] - 4, FLY[1] + 12)) * (1 - ease.cubicIn(prog(f, 234, 246)));
  if (a <= 0.003) return null;
  const draw = ease.expoOut(prog(f, FLY[1] - 2, FLY[1] + 22));
  const [ax, ay] = barOffset('A', f);
  const [bx] = barOffset('B', f);
  const W = 1000;
  const Hh = 300;
  const lock = pulse(f, 214, 30);
  return (
    <Card3D p={camPt(f, 0, ay - 40)} billboard w={W} h={Hh} opacity={a}>
      <svg width={W} height={Hh} style={{overflow: 'visible'}}>
        {[ax, bx].map((cx, i) => {
          const x0 = W / 2 + cx - BAR_LEN / 2;
          const x1 = W / 2 + cx + BAR_LEN / 2;
          const y = Hh / 2 + 56;
          return (
            <g key={i} stroke={C.ink} strokeWidth={2.5} opacity={0.9}>
              {[x0, x1].map((x) => (
                <line key={x} x1={x} x2={x} y1={Hh / 2 - 44} y2={Hh / 2 - 44 + 112 * draw} strokeDasharray="8 8" strokeWidth={2} />
              ))}
              <line x1={x0} x2={x0 + (x1 - x0) * draw} y1={y} y2={y} stroke={lock > 0.02 ? A : C.ink} strokeWidth={3 + 2 * lock} />
              <line x1={x0} x2={x0} y1={y - 12} y2={y + 12} />
              <line x1={x1} x2={x1} y1={y - 12} y2={y + 12} opacity={draw} />
            </g>
          );
        })}
      </svg>
    </Card3D>
  );
};

// ---------------------------------------------------------------- holograms (v1 copy) ----
const ScenarioPanel: React.FC<{f: number}> = ({f}) => (
  <Glass f={f} w={680} accent={A} pad="30px 32px 32px">
    <div style={rowIn(f, 246)}>
      <HoloHeader label="NEXT PROOF" title="What should I learn next?" accent={A} size={46} />
    </div>
    <div style={{height: 1, background: C.line, margin: '22px 0 24px', ...rowIn(f, 254)}} />
    <div style={rowIn(f, 262)}>
      <Pill label="Hypothetical scenario" color={A} size={24} />
    </div>
    <div style={{display: 'flex', alignItems: 'flex-start', gap: 18, marginTop: 22, ...rowIn(f, 272)}}>
      <Sparkle size={43} color={A} />
      <div style={{fontSize: 39, fontWeight: 650, lineHeight: 1.16}}>Document a SQL reporting project.</div>
    </div>
    <div style={{fontSize: 27, lineHeight: 1.35, color: C.muted, marginTop: 20, ...rowIn(f, 284)}}>Explore how a documented example could support a missing requirement.</div>
    <div style={{marginTop: 26, padding: '15px 20px', background: C.cobalt, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 29, fontWeight: 600, ...rowIn(f, 296)}}>
      View proof plan
      <Arrow size={32} color={C.ink} />
    </div>
  </Glass>
);

const CoveragePanel: React.FC<{f: number}> = ({f}) => {
  const cur = ease.expoOut(prog(f, 300, 330));
  const base = ease.expoOut(prog(f, 330, 352));
  const grow = ease.expoOut(prog(f, 360, 392));
  const hit = pulse(f, 360, 46);
  return (
    <Glass f={f} w={940} accent={A} edge="right" glow={hit} pad="30px 36px 32px">
      <SampleChip style={{right: 34, top: 30, fontSize: 22}} />
      <div style={rowIn(f, 276)}>
        <div style={{fontSize: 34, fontWeight: 650}}>Evidence coverage</div>
        <div style={{fontSize: 24, color: C.soft, marginTop: 8}}>Illustrative comparison · not an outcome forecast</div>
      </div>
      <div style={{fontSize: 28, color: C.muted, marginTop: 32, ...rowIn(f, 296)}}>Current evidence</div>
      <div style={{height: 24, background: C.panel, borderRadius: 7, marginTop: 13, overflow: 'hidden', border: `1px solid ${C.line}`}}>
        <div style={{height: '100%', width: `${42 * cur}%`, background: C.sky, borderRadius: 7, boxShadow: `0 0 14px ${rgba(C.sky, 0.6)}`}} />
      </div>
      <div style={{fontSize: 28, color: A, marginTop: 28, ...rowIn(f, 326)}}>With this proof · scenario only</div>
      <div style={{height: 24, background: C.panel, borderRadius: 7, marginTop: 13, overflow: 'hidden', border: `1px solid ${rgba(A, 0.4)}`}}>
        <div style={{height: '100%', width: `${42 * base + 25 * grow}%`, background: A, borderRadius: 7, boxShadow: `0 0 ${14 + 26 * hit}px ${rgba(A, 0.6 + 0.4 * hit)}`}} />
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 34, alignItems: 'center', fontSize: 25, color: C.soft, ...rowIn(f, 340)}}>
        <span>Build</span>
        <Arrow size={24} color={C.soft} />
        <span>Document</span>
        <Arrow size={24} color={C.soft} />
        <span>Review</span>
      </div>
    </Glass>
  );
};

const Footer: React.FC<{f: number}> = ({f}) => (
  <Glass f={f} w={1720} accent={A} edge="left" pad="17px 26px" style={{background: `linear-gradient(90deg, ${rgba(A, 0.14)}, rgba(10,23,76,0.84) 60%)`}}>
    <div style={{fontSize: 31, fontWeight: 600, color: A}}>No skill is added to your profile.</div>
  </Glass>
);

export const World: React.FC = () => {
  const f = useWorldFrame();
  return (
    <>
      <Title3D f={f} p={[-850, FY + 300, 0]} r={[0, 10, 0]} index={6} name="NEXT PROOF" promise="Turn an unknown into a useful learning plan." accent={A} from={-14} out={100} size={130} w={900} />
      <Tag f={f} which="A" />
      <Tag f={f} which="B" />
      <Guides f={f} />
      {f >= 196 && f < 262 ? <Caption3D f={f} at={204} out={240} p={camPt(f, 0, -210)} billboard text="Same length." sub="A different perspective." color={A} size={62} /> : null}

      <Group3D p={HOLO_C}>
        <Holo f={f} at={240} p={[-510, 82, 0]} swing={-40} out={446} outSwing={-55}>
          <ScenarioPanel f={f} />
        </Holo>
        <Holo f={f} at={268} p={[330, 112, 50]} r={[0, -6, 0]} swing={40} out={450} outSwing={55}>
          <CoveragePanel f={f} />
        </Holo>
        <Holo f={f} at={316} p={[0, -300, 30]} swing={-16} push={260} out={442} outSwing={-30}>
          <Footer f={f} />
        </Holo>
      </Group3D>
    </>
  );
};
