// 04 · Job focus — CSS-3D layer: in-scene title, calipers that prove the role sphere never changes size, the caption,
// and the focus holograms (copy verbatim from the claim-reviewed v1 World2D).
import React from 'react';
import {ACCENT, C} from '../../brand';
import {Card3D, useWorldFrame} from '../../engine/space';
import {Arrow, Bookmark, Check, Pill, Question, SampleChip, ease, prog, pulse, rgba} from './kit';
import {Caption3D, Glass, Holo, HoloHeader, Title3D, rowIn} from './holo';
import {HOLO_Z, S} from './shot';
import {ROLE_R} from './stage';

const A = ACCENT.focus;

/** Two tangent calipers + a dimension line, billboarded on the sphere's centre plane (so they match its silhouette). */
const Calipers: React.FC<{f: number}> = ({f}) => {
  const a = ease.cubicOut(prog(f, 96, 112)) * (1 - ease.cubicIn(prog(f, 228, 242)));
  if (a <= 0.003) return null;
  const draw = ease.expoOut(prog(f, 96, 124));
  const r = ROLE_R;
  const H = 210;
  const W = 420;
  const lock = pulse(f, 196, 30);
  const col = mixA(lock);
  return (
    <Card3D p={S} billboard w={W} h={2 * H + 120} opacity={a}>
      <svg width={W} height={2 * H + 120} style={{overflow: 'visible'}}>
        {[-r, r].map((x) => (
          <line key={x} x1={W / 2 + x} x2={W / 2 + x} y1={H - H * draw} y2={H + H * draw} stroke={col} strokeWidth={2} strokeDasharray="10 8" opacity={0.85} />
        ))}
        <g transform={`translate(${W / 2}, ${2 * H + 40})`} opacity={draw}>
          <line x1={-r} x2={r} y1={0} y2={0} stroke={col} strokeWidth={2.5} />
          <path d={`M${-r + 12} -8 L${-r} 0 L${-r + 12} 8 M${r - 12} -8 L${r} 0 L${r - 12} 8`} fill="none" stroke={col} strokeWidth={2.5} />
          <line x1={-r} x2={-r} y1={-14} y2={14} stroke={col} strokeWidth={2.5} />
          <line x1={r} x2={r} y1={-14} y2={14} stroke={col} strokeWidth={2.5} />
        </g>
      </svg>
    </Card3D>
  );
};
const mixA = (t: number) => (t > 0.02 ? `rgba(255,${Math.round(247 - 130 * t)},${Math.round(255 - 178 * t)},1)` : A);

// ---------------------------------------------------------------- holograms (v1 copy) ----
const MainPanel: React.FC<{f: number}> = ({f}) => (
  <Glass f={f} w={980} accent={C.coral} pad="34px 38px 34px 40px">
    <SampleChip style={{right: 34, top: 32, fontSize: 22}} />
    <div style={rowIn(f, 248)}>
      <HoloHeader label="JOB FOCUS" title="Your next step." accent={C.coral} size={54} />
    </div>
    <div style={{display: 'flex', gap: 14, marginTop: 22, ...rowIn(f, 262)}}>
      {['All', 'Verified open', 'Saved'].map((t, i) => (
        <div key={t} style={{padding: '9px 22px', fontSize: 28, borderRadius: 7, border: '1px solid ' + (i ? C.line : C.coral), background: i ? rgba(C.raised, 0.8) : rgba(C.coral, 0.16), color: i ? C.muted : C.ink}}>
          {t}
        </div>
      ))}
    </div>
    <div style={{marginTop: 24, border: '1px solid ' + C.line, borderRadius: 12, padding: '24px 28px', background: rgba(C.raised, 0.72), ...rowIn(f, 278)}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontSize: 37, fontWeight: 700}}>Automation engineer</div>
        <Bookmark size={34} color={C.sky} />
      </div>
      <div style={{fontSize: 26, color: C.muted, marginTop: 8}}>Synthetic QA Employer · Cairo</div>
      <div style={{height: 1, background: C.line, margin: '20px 0'}} />
      <div style={{display: 'flex', alignItems: 'center', gap: 17, fontSize: 30, ...rowIn(f, 294)}}>
        <Check size={30} color={C.good} p={ease.cubicOut(prog(f, 296, 314))} />
        <span>Python</span>
        <span style={{color: C.good, marginLeft: 'auto'}}>Supported</span>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 17, fontSize: 30, marginTop: 20, ...rowIn(f, 306)}}>
        <Question size={30} color={C.warning} />
        <span>SQL reporting</span>
        <span style={{color: C.warning, marginLeft: 'auto'}}>Needs evidence</span>
      </div>
      <div style={{fontSize: 24, color: C.soft, marginTop: 22, ...rowIn(f, 318)}}>Inspect the requirement and its source.</div>
    </div>
  </Glass>
);

const ReviewPanel: React.FC<{f: number}> = ({f}) => {
  const hit = pulse(f, 360, 40);
  const on = ease.expoOut(prog(f, 360, 376));
  return (
    <Glass f={f} w={620} accent={C.coral} edge="top" glow={hit} pad="30px 32px">
      <div style={rowIn(f, 296)}>
        <Pill label="REVIEW NEXT" color={C.coral} size={22} />
      </div>
      <div style={{fontSize: 40, fontWeight: 650, lineHeight: 1.17, marginTop: 18, ...rowIn(f, 304)}}>Review missing evidence.</div>
      <div style={{fontSize: 27, lineHeight: 1.36, color: C.muted, marginTop: 14, ...rowIn(f, 314)}}>See what is supported, what conflicts, and what remains unknown.</div>
      <div
        style={{
          marginTop: 26,
          padding: '16px 22px',
          background: C.cobalt,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 29,
          fontWeight: 600,
          border: `1px solid ${rgba(C.coral, 0.25 + 0.6 * on)}`,
          boxShadow: `0 0 ${10 + 34 * on + 30 * hit}px ${rgba(C.coral, 0.12 + 0.3 * on + 0.3 * hit)}`,
          transform: `scale(${1 + 0.035 * hit})`,
          ...rowIn(f, 326),
        }}
      >
        Start review
        <span style={{transform: `translateX(${8 * on}px)`}}>
          <Arrow size={32} color={C.ink} />
        </span>
      </div>
    </Glass>
  );
};

const Footer: React.FC<{f: number}> = ({f}) => (
  <Glass f={f} w={980} accent={A} pad="16px 26px" style={{background: 'rgba(10,22,72,0.72)'}}>
    <div style={{fontSize: 26, color: C.muted}}>Ordered for review — not a prediction of being hired.</div>
  </Glass>
);

export const World: React.FC = () => {
  const f = useWorldFrame();
  const z = HOLO_Z;
  return (
    <>
      <Title3D f={f} p={[-640, 330, 0]} r={[0, 6, 0]} index={4} name="JOB FOCUS" promise="One role. Clear evidence. A next step." accent={A} from={-14} out={92} size={140} w={860} />
      <Calipers f={f} />
      <Caption3D f={f} at={182} out={230} p={[S[0], S[1] - 300, S[2]]} billboard text="Same size." sub="Less noise." color={A} size={66} />

      {/* the focus holograms, pixel-exact at the hero pose */}
      <Holo f={f} at={240} p={[-404, 54, z]} r={[0, 4, 0]} swing={-40} out={446} outSwing={-60}>
        <MainPanel f={f} />
      </Holo>
      <Holo f={f} at={288} p={[478, 96, z + 40]} r={[0, -9, 0]} swing={44} out={450} outSwing={60}>
        <ReviewPanel f={f} />
      </Holo>
      <Holo f={f} at={316} p={[-404, -330, z + 10]} r={[0, 4, 0]} swing={-20} push={260} out={442} outSwing={-40}>
        <Footer f={f} />
      </Holo>
    </>
  );
};
