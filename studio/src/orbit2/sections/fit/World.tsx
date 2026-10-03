// 05 · Your fit — CSS-3D layer: in-scene title, A/B probe tags, the one caption, and the fit holograms
// (copy verbatim from the claim-reviewed v1 World2D, including the exact colour rule).
import React from 'react';
import {ACCENT, C, FONT} from '../../brand';
import {Card3D, Group3D, useWorldFrame} from '../../engine/space';
import {Check, Cross, Pill, Question, SampleChip, ease, prog, pulse, rgba} from '../focus/kit';
import {Caption3D, Glass, Holo, HoloHeader, Title3D, rowIn} from '../focus/holo';
import {HOLO_C, HOLO_YAW} from './shot';
import {AB_MID, DROP, JOIN_YAW, T, join, probePos} from './stage';

const A = ACCENT.fit;

const Probe: React.FC<{f: number; which: 'A' | 'B'}> = ({f, which}) => {
  const p = probePos(which, f);
  const tag = ease.expoOut(prog(f, which === 'A' ? 62 : 70, which === 'A' ? 84 : 92)) * (1 - ease.cubicIn(prog(f, DROP[0] + 4, DROP[0] + 18)));
  const box = ease.cubicOut(prog(f, 66, 90)) * (1 - ease.cubicIn(prog(f, DROP[0] - 6, DROP[0] + 8)));
  return (
    <>
      {box > 0.003 ? (
        <Group3D p={[p[0], p[1] + 1.5, p[2]]} r={[0, JOIN_YAW * join(f), 0]}>
          <Card3D r={[-90, 0, 0]} w={T} h={T} opacity={box} style={{border: `3px solid ${A}`, boxSizing: 'border-box', boxShadow: `0 0 18px ${rgba(A, 0.6)}`}}>
            <span />
          </Card3D>
        </Group3D>
      ) : null}
      {tag > 0.003 ? (
        <Card3D p={[p[0], p[1] + 150, p[2]]} billboard w={80} h={150} opacity={tag}>
          <div style={{position: 'absolute', left: 6, top: 0, width: 66, height: 66, borderRadius: 33, border: `3px solid ${A}`, background: 'rgba(4,11,54,0.75)', boxShadow: `0 0 22px ${rgba(A, 0.55)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.ink}}>
            {which}
          </div>
          <div style={{position: 'absolute', left: 38, top: 70, width: 3, height: 62 * tag, background: `linear-gradient(${A}, ${rgba(A, 0)})`}} />
        </Card3D>
      ) : null}
    </>
  );
};

const ROWS = [
  {name: 'Python', detail: 'Supported by confirmed facts', color: C.good, Icon: Check},
  {name: 'Work authorization', detail: 'Confirmed mismatch', color: C.red, Icon: Cross},
  {name: 'SQL reporting', detail: 'Missing evidence', color: C.warning, Icon: Question},
];

const MainPanel: React.FC<{f: number}> = ({f}) => (
  <Glass f={f} w={1560} h={630} accent={A} pad="30px 40px">
    <SampleChip style={{right: 38, top: 30, fontSize: 22}} />
    <div style={rowIn(f, 246)}>
      <HoloHeader label="YOUR FIT" title="Requirements, not predictions." accent={A} size={52} />
    </div>
    <div style={{display: 'flex', gap: 42, borderBottom: '1px solid ' + C.line, marginTop: 20, paddingBottom: 12, ...rowIn(f, 256)}}>
      {['Overview', 'Your fit', 'Description', 'History'].map((tab, i) => (
        <div key={tab} style={{fontSize: 29, paddingBottom: 10, color: i === 1 ? C.ink : C.soft, borderBottom: i === 1 ? '3px solid ' + C.coral : '3px solid transparent'}}>
          {tab}
        </div>
      ))}
    </div>
  </Glass>
);

const Row: React.FC<{f: number; k: number; at: number}> = ({f, k, at}) => {
  const {name, detail, color, Icon} = ROWS[k];
  const p = ease.cubicOut(prog(f, at + 4, at + 22));
  const hit = k === 2 ? pulse(f, 360, 44) : 0;
  return (
    <div
      style={{
        width: 1480,
        height: 104,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        padding: '0 26px',
        border: '1px solid ' + rgba(color, 0.5 + 0.4 * hit),
        borderLeft: '5px solid ' + color,
        borderRadius: 9,
        background: `linear-gradient(90deg, ${rgba(color, 0.14 + 0.12 * hit)}, rgba(10,23,76,0.86) 46%)`,
        boxShadow: `0 0 ${16 + 40 * hit}px ${rgba(color, 0.18 + 0.35 * hit)}, 0 18px 50px rgba(2,6,32,0.45)`,
        fontFamily: FONT,
        color: C.ink,
      }}
    >
      <Icon size={39} color={color} p={p} />
      <span style={{fontSize: 34, fontWeight: 600, flex: 1}}>{name}</span>
      <Pill label={detail} color={color} size={27} />
    </div>
  );
};

const Rule: React.FC<{f: number}> = ({f}) => {
  const hit = pulse(f, 360, 50);
  const amber = ease.expoOut(prog(f, 360, 380));
  return (
    <Glass f={f} w={1560} accent={A} edge="bottom" glow={hit} pad="18px 30px">
      <div style={{display: 'flex', alignItems: 'center', gap: 20, fontSize: 29, fontWeight: 600, lineHeight: 1.35, color: C.ink}}>
        <Question size={34} color={A} />
        <span>
          <span style={{color: C.good}}>Green</span> = supported by your facts. <span style={{color: C.red}}>Red</span> = a confirmed mismatch.
          <br />
          <span style={{color: C.warning, textShadow: `0 0 ${18 * amber}px ${rgba(C.warning, 0.7 * amber)}`}}>Amber = missing evidence, not a rejection.</span>
        </span>
      </div>
    </Glass>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  return (
    <>
      <Title3D f={f} p={[-520, 540, -160]} r={[-24, 32, 0]} order="YXZ" index={5} name="YOUR FIT" promise="Supported. Contradicted. Still unknown." accent={A} from={-14} out={104} size={140} w={720} />
      <Probe f={f} which="A" />
      <Probe f={f} which="B" />
      <Caption3D f={f} at={222} out={246} p={[AB_MID[0], 200, AB_MID[2]]} billboard text="Same grey." color={A} size={68} />

      {/* the fit holograms, in a frame that faces the side-by-side camera (pixel-exact at the hero pose) */}
      <Group3D p={HOLO_C} r={[0, HOLO_YAW, 0]}>
        <Holo f={f} at={240} p={[0, 55, 0]} swing={-42} out={446} outSwing={-55}>
          <MainPanel f={f} />
        </Holo>
        {[0, 1, 2].map((k) => (
          <Holo key={k} f={f} at={264 + k * 24} p={[0, 92 - k * 118, 34]} swing={-28} push={360} out={444 + k * 2} outSwing={-50}>
            <Row f={f} k={k} at={264 + k * 24} />
          </Holo>
        ))}
        <Holo f={f} at={330} p={[0, -340, 56]} swing={30} push={300} out={450} outSwing={40}>
          <Rule f={f} />
        </Holo>
      </Group3D>
    </>
  );
};
