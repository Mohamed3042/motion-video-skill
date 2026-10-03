// Station 3 · NEW FINDINGS (mint). CSS-3D layer in LOCAL coords: the in-scene title, the fixation cross of the
// lilac chaser, the reveal caption, then three finding cards riding the carousel newest-first; the newest comes
// forward next to its source hologram.
import React from 'react';
import {C, FONT, MONO} from '../../brand';
import {lerp, lerp3, type V3} from '../../engine/math';
import {Card3D, Group3D, useWorldFrame} from '../../engine/space';
import {Button, Caption3D, Chip, clamp, ease, glass, GlassFX, Holo, Motes, prog, pulse, rgba, rowIn, SampleTag, sp, Title3D} from '../profile/holo';
import {cardPhi, onRing, T, YC} from './scene';

const A = C.good;

// v1's claim-reviewed rows (newest first)
const ROWS = [
  {role: 'Data analyst', org: 'Sample Analytics Co.', place: 'Egypt · Cairo', seen: 'Observed Sep 30 · 09:40', status: 'Seen in employer feed', good: true},
  {role: 'Automation specialist', org: 'Example Systems', place: 'Kuwait · Kuwait City', seen: 'Observed Sep 30 · 08:15', status: 'Opening unverified', good: false},
  {role: 'Operations analyst', org: 'Demo Logistics', place: 'Saudi Arabia · Riyadh', seen: 'Observed Sep 29 · 16:30', status: 'Opening unverified', good: false},
];
const CW = 560;
const CH = 262;
const FRONT: V3 = [-520, -10, 240];
const H2 = {p: [330, -10, 140] as V3, w: 620, h: 528};

const FindingCard: React.FC<{k: number; hi: number}> = ({k, hi}) => {
  const r = ROWS[k];
  const col = r.good ? A : C.warning;
  return (
    <div
      style={{
        ...glass(A, 0.88),
        width: CW,
        height: CH,
        padding: '24px 30px',
        boxShadow: `0 0 0 1px ${rgba(A, 0.12 + 0.6 * hi)}, 0 0 ${50 * hi}px ${rgba(A, 0.35 * hi)}, 0 40px 90px rgba(2,6,23,0.55)`,
        ...(hi > 0 ? {background: `linear-gradient(135deg, ${rgba(A, 0.16 * hi)} 0%, rgba(12,28,88,0) 55%), rgba(12,28,88,0.88)`} : {}),
      }}
    >
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, color: k === 0 ? A : C.soft, letterSpacing: '0.12em'}}>{k === 0 ? 'NEWEST' : `#${k + 1}`}</div>
      <div style={{fontSize: 34, fontWeight: 700, marginTop: 6}}>{r.role}</div>
      <div style={{fontSize: 24, color: C.muted, marginTop: 6, whiteSpace: 'nowrap'}}>
        {r.org} · {r.place}
      </div>
      <div style={{marginTop: 16}}>
        <Chip label={r.status} color={col} fs={22} on={r.good ? 0.3 + 0.5 * hi : 0} />
      </div>
      <div style={{fontFamily: MONO, fontWeight: 500, fontSize: 23, color: C.sky, marginTop: 14}}>{r.seen}</div>
      <GlassFX accent={col} edge="top" seed={10 + k} glow={hi} />
    </div>
  );
};

const Source: React.FC<{f: number}> = ({f}) => (
  <div>
    <div style={{fontSize: 34, fontWeight: 700}}>Follow the source.</div>
    <div style={{fontSize: 25, color: C.muted, lineHeight: 1.4, marginTop: 12, ...rowIn(f, T.focus + 14)}}>Open the underlying evidence before you decide what to do.</div>
    <div style={{borderLeft: `3px solid ${A}`, paddingLeft: 22, marginTop: 26, ...rowIn(f, T.focus + 24)}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.1em', color: A}}>PRIMARY SOURCE</div>
      <div style={{fontSize: 29, marginTop: 10}}>Company careers page</div>
      <div style={{fontSize: 24, color: C.muted, marginTop: 8}}>Captured Sep 30, 2026</div>
    </div>
    <div style={{marginTop: 28, ...rowIn(f, T.evidence)}}>
      <Button label="View source evidence ↗" primary fs={25} h={58} glow={pulse(f, T.evidence + 2, 30)} accent={A} />
    </div>
    <div style={{fontSize: 25, lineHeight: 1.4, color: C.warning, marginTop: 22, ...rowIn(f, T.evidence + 12)}}>
      Observed status is dated.
      <br />
      Re-check before applying.
    </div>
  </div>
);

export const World: React.FC = () => {
  const f = useWorldFrame();
  const cross = 1 - prog(f, T.real, T.real + 16);
  const headA = ease.expoOut(prog(f, T.header, T.header + 24)) * (1 - ease.cubicIn(prog(f, T.focus, T.focus + 18)));
  const fwd = sp(f, T.focus, {damping: 16, stiffness: 90, mass: 1});
  const outK = ease.cubicIn(prog(f, T.out, T.out + 26));
  return (
    <>
      <Title3D p={[-640, 250, 250]} r={[0, 4, 0]} idx={3} name="NEW FINDINGS" promise="New observations. Visible evidence." accent={A} from={6} promiseAt={T.promise} out={T.titleOut} size={104} />

      {/* fixation cross: keep your eyes here */}
      {cross > 0 ? (
        <Card3D p={[0, 0, 4]} w={44} h={44} opacity={cross}>
          <div style={{position: 'absolute', left: 20, top: 2, width: 4, height: 40, background: '#0b1040'}} />
          <div style={{position: 'absolute', left: 2, top: 20, width: 40, height: 4, background: '#0b1040'}} />
        </Card3D>
      ) : null}
      <Caption3D p={[0, 410, 140]} billboard at={T.reveal[0] + 16} out={T.real + 6} accent={A} fs={60}>
        Never drawn.
      </Caption3D>

      {/* header over the carousel */}
      {headA > 0 ? (
        <Card3D p={[-60, 330 - (1 - headA) * 30, -20]} w={1500} h={150} opacity={headA}>
          <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', height: '100%', color: C.ink, fontFamily: FONT}}>
            <div style={{textShadow: '0 3px 24px rgba(2,6,23,0.95)'}}>
              <div style={{fontSize: 46, fontWeight: 700}}>Your research, newest first.</div>
              <div style={{fontSize: 28, color: C.muted, marginTop: 8}}>See what was observed — and when.</div>
            </div>
            <SampleTag color={A} fs={20} />
          </div>
        </Card3D>
      ) : null}

      {/* the carousel: three findings hang over their slot lights */}
      {ROWS.map((_, k) => {
        const s = sp(f, T.cards[k], {damping: 15, stiffness: 100, mass: 1});
        if (s <= 0.001) return null;
        const phi = cardPhi(k, f);
        const slot = onRing(phi, YC);
        const hero = k === 0 ? fwd : 0;
        const p = lerp3([slot[0], slot[1] - (1 - s) * 160, slot[2]], FRONT, hero);
        const ry = lerp(phi + (1 - s) * 50, 0, hero);
        const dim = k === 0 ? 1 : 1 - 0.72 * clamp(fwd);
        const fade = k === 0 ? 1 - outK : 1;
        return (
          <Group3D key={k} p={p} r={[0, ry, 0]}>
            <Card3D w={CW} h={CH} opacity={clamp(s * 1.8) * dim * fade} nearFade={200}>
              <FindingCard k={k} hi={k === 0 ? clamp(fwd) * (0.6 + 0.4 * pulse(f, T.focus, 40)) : 0} />
            </Card3D>
          </Group3D>
        );
      })}

      <Holo {...H2} accent={A} at={T.focus + 4} out={T.out + 4} from={1} r={[0, -5, 0]} edge="left" seed={12} pad={34} glow={pulse(f, T.evidence, 30)}>
        <Source f={f} />
      </Holo>

      <Motes seed={303} n={28} box={[-1800, 2200, -1000, 1100, -500, 3000]} color={A} size={[8, 44]} />
    </>
  );
};
