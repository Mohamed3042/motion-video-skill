// Station 1 · PROFILE & RESUME (coral). CSS-3D layer in LOCAL coords: the in-scene title at the funnel mouth,
// the reveal caption beside the hoops, then the glass holograms: profile card, evidence panel with fact chips
// that lift off the glass when confirmed, and the 3D resume page the confirmed lines fly into.
import React from 'react';
import {C, FONT, MONO} from '../../brand';
import type {V3} from '../../engine/math';
import {Card3D, useWorldFrame} from '../../engine/space';
import {Check, Arrow} from '../../shared';
import {IconDoc, IconDownload, IconUser} from './kit';
import {bez, Button, Caption3D, Chip, clamp, Comet, ease, Holo, Motes, prog, pulse, rgba, rowIn, SampleTag, Spark, Title3D, Toggle, useHoloFade} from './holo';
import {FIELDS, HEAD_KEYS, KEYS, NAME, NAME_KEYS, T} from './timing';

const A = C.coral;

// ------------------------------------------------------------------ hologram placement (local coords)
const H1A = {p: [-770, 305, 200] as V3, w: 680, h: 190};
const H1B = {p: [-580, -102, 160] as V3, w: 900, h: 565};
const H2 = {p: [520, 5, 100] as V3, w: 660, h: 740};
const OUT1 = 428;
const OUT2 = 446;

// fact chips (rows that lift off the evidence panel), in H1B's local coords
const FACTS = [
  {name: 'Python', kind: 'skill', act: T.confirmA},
  {name: 'Analytics dashboard', kind: 'project', act: T.confirmB},
  {name: 'Draft summary', kind: 'draft', act: T.exclude},
];
const factY = (i: number) => H1B.h / 2 - 312 - i * 92;
// resume page (a layer floating in front of H2) and its two confirmed lines
const PAGE = {y: H2.h / 2 - 76 - 190, z: 46, w: 600, h: 380};
const lineWorld = (i: number): V3 => [H2.p[0] - 150, H2.p[1] + PAGE.y + 190 - 222 - i * 46, H2.p[2] + PAGE.z + 4];
const chipWorld = (i: number): V3 => [H1B.p[0] + 300, H1B.p[1] + factY(i), H1B.p[2] + 40];

const typed = (s: string, keys: number[], f: number) => s.slice(0, keys.filter((k) => f >= k).length);

// ------------------------------------------------------------------ holograms
const ProfileCard: React.FC<{f: number}> = ({f}) => {
  const press = pulse(f, T.create, 16);
  const made = f >= T.create;
  const name = typed(FIELDS.name, NAME_KEYS, f);
  const head = typed(FIELDS.headline, HEAD_KEYS, f);
  const caret = (on: boolean) => (on && Math.floor(f / 8) % 2 === 0 ? <span style={{display: 'inline-block', width: 3, height: '0.9em', background: A, marginLeft: 3, verticalAlign: '-0.1em'}} /> : null);
  return (
    <div style={{display: 'flex', alignItems: 'center', height: '100%', gap: 26}}>
      <div style={{width: 96, height: 96, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: rgba(A, 0.12 + 0.25 * press), border: `2px solid ${rgba(A, made ? 0.9 : 0.4)}`, boxShadow: made ? `0 0 28px ${rgba(A, 0.45)}` : undefined}}>
        <IconUser size={50} color={made ? C.ink : C.soft} />
      </div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 38, fontWeight: 700, height: 46, color: name ? C.ink : rgba(C.soft, 0.7)}}>
          {name || (made ? '' : 'New profile')}
          {caret(made && f < NAME_KEYS[NAME_KEYS.length - 1] + 6)}
        </div>
        <div style={{fontSize: 26, color: C.muted, height: 34, marginTop: 6}}>
          {head}
          {caret(f >= HEAD_KEYS[0] - 4 && f < HEAD_KEYS[HEAD_KEYS.length - 1] + 30)}
        </div>
      </div>
      {f < T.create + 10 ? (
        <Button label="Create blank profile" primary press={press} glow={0.5 + 0.5 * Math.sin(f * 0.25) * (1 - prog(f, T.create - 1, T.create))} accent={A} fs={23} h={54} style={{opacity: 1 - prog(f, T.create + 2, T.create + 10)}} />
      ) : (
        <div style={rowIn(f, T.create + 8, 20)}>
          <Chip label="Profile evidence" color={A} on={0.4} fs={22} />
        </div>
      )}
    </div>
  );
};

const EvidencePanel: React.FC<{f: number}> = ({f}) => {
  const imp = pulse(f, T.importDoc, 16);
  return (
    <div style={{display: 'flex', flexDirection: 'column'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 34}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.16em', color: A}}>BUILD YOUR EVIDENCE</div>
        <SampleTag fs={18} />
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 20, ...rowIn(f, T.evidence + 6)}}>
        <Button label="Import a document" icon={<IconDoc size={26} color={C.ink} />} press={imp} glow={imp} accent={A} fs={24} h={56} />
        <div style={{fontSize: 23, color: C.muted, opacity: prog(f, T.formats[0] - 4, T.formats[0] + 6)}}>formats</div>
      </div>
      <div style={{display: 'flex', gap: 12, marginTop: 16, height: 42}}>
        {['PDF', 'DOCX', 'TXT', 'MD', 'CSV', 'JSON'].map((s, i) => {
          const t = ease.backOut(prog(f, T.formats[i], T.formats[i] + 12));
          return (
            <div key={s} style={{opacity: clamp(t * 2), transform: `translateY(${(1 - t) * 18}px) scale(${0.8 + 0.2 * t})`}}>
              <Chip label={s} color={C.sky} mono fs={22} on={pulse(f, T.formats[i], 18)} />
            </div>
          );
        })}
      </div>
      <div style={{fontSize: 23, color: C.muted, marginTop: 30, ...rowIn(f, T.evidence + 24)}}>Review each extracted fact</div>
    </div>
  );
};

const FactChip: React.FC<{f: number; i: number}> = ({f, i}) => {
  const fact = FACTS[i];
  const isEx = i === 2;
  const done = f >= fact.act;
  const p = pulse(f, fact.act, 18);
  const back = isEx ? pulse(f, T.returnRv, 22) : 0;
  const good = done && !isEx;
  const col = good ? C.good : done ? C.soft : C.warning;
  const lift = good ? ease.backOut(prog(f, fact.act, fact.act + 16)) : 0;
  const t = ease.expoOut(prog(f, T.evidence + 30 + i * 6, T.evidence + 52 + i * 6));
  const struck = done && isEx;
  const fade = useHoloFade();
  return (
    <Card3D p={[0, factY(i) - (1 - t) * 30, 6 + lift * 34]} w={H1B.w - 64} h={80} opacity={t * fade}>
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px 0 24px',
          fontFamily: FONT,
          color: C.ink,
          background: good ? `linear-gradient(90deg, ${rgba(C.good, 0.2)}, rgba(7,18,83,0.92) 60%)` : 'rgba(7,18,83,0.9)',
          border: `1px solid ${good ? rgba(C.good, 0.9) : C.line}`,
          boxShadow: good ? `0 0 ${24 + 30 * p}px ${rgba(C.good, 0.35 + 0.4 * p)}, 0 ${10 + 16 * lift}px 30px rgba(2,6,23,0.6)` : '0 8px 20px rgba(2,6,23,0.4)',
          opacity: struck ? 0.55 : 1,
        }}
      >
        <div style={{flex: 1, display: 'flex', alignItems: 'baseline', gap: 14, minWidth: 0}}>
          <span style={{fontSize: 29, fontWeight: 700, textDecoration: struck ? 'line-through' : undefined}}>{fact.name}</span>
          <span style={{fontSize: 23, color: C.muted}}>· {fact.kind}</span>
        </div>
        {done ? (
          <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
            <Chip label={good ? <><Check size={22} color={C.good} p={prog(f, fact.act, fact.act + 10)} width={10} />Confirmed</> : 'Excluded'} color={col} on={good ? 0.5 + 0.5 * p : 0} fs={22} />
            {isEx ? <Button label="Return to review" fs={22} h={46} glow={0.25 + 0.75 * back} press={back * 0.6} accent={C.sky} /> : null}
          </div>
        ) : (
          <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
            <Chip label="Review" color={C.warning} fs={22} />
            <Button label="Confirm" primary fs={22} h={46} press={!isEx ? pulse(f, fact.act - 3, 6) : 0} />
            <Button label="Exclude" fs={22} h={46} press={isEx ? pulse(f, fact.act - 3, 6) : 0} />
          </div>
        )}
      </div>
    </Card3D>
  );
};

const ResumePage: React.FC<{f: number}> = ({f}) => {
  const lines = [
    {label: 'Skill', v: 'Python', at: T.landA},
    {label: 'Project', v: 'Analytics dashboard', at: T.landB},
  ];
  const t = ease.expoOut(prog(f, T.page + 6, T.page + 30));
  const fade = useHoloFade();
  return (
    <Card3D p={[0, PAGE.y - (1 - t) * 40, PAGE.z]} r={[0, 0, -1.2 * (1 - t)]} w={PAGE.w} h={PAGE.h} opacity={t * fade}>
      <div style={{width: '100%', height: '100%', boxSizing: 'border-box', borderRadius: 8, background: 'linear-gradient(160deg, #ffffff 0%, #eef3ff 70%, #dfe8ff 100%)', color: '#071253', padding: '34px 36px', fontFamily: FONT, boxShadow: `0 30px 70px rgba(2,6,23,0.6), 0 0 0 1px rgba(255,255,255,0.6), 0 0 60px ${rgba(A, 0.18)}`}}>
        <div style={{fontSize: 38, fontWeight: 700, letterSpacing: '-0.01em'}}>Sam Sample</div>
        <div style={{fontSize: 23, marginTop: 8, letterSpacing: '0.14em', fontWeight: 600, color: '#2b3b7a'}}>DATA ANALYST</div>
        <div style={{height: 4, background: A, margin: '24px 0 22px', borderRadius: 2}} />
        {lines.map((l) => {
          const a = prog(f, l.at - 1, l.at + 3);
          const fl = pulse(f, l.at, 22);
          return (
            <div key={l.v} style={{fontSize: 27, height: 46, display: 'flex', alignItems: 'center', opacity: a, transform: `translateY(${(1 - a) * -10}px)`}}>
              <span style={{background: rgba(A, 0.28 * fl), borderRadius: 6, padding: '2px 6px', margin: '0 -6px'}}>
                <b>{l.label}:</b> {l.v}
              </span>
            </div>
          );
        })}
        {/* empty ruled lines: the page holds only what was confirmed */}
        {[0, 1].map((i) => (
          <div key={i} style={{height: 10, width: i ? '44%' : '62%', borderRadius: 5, background: 'rgba(7,18,83,0.08)', marginTop: 20}} />
        ))}
      </div>
    </Card3D>
  );
};

const ResumeHolo: React.FC<{f: number}> = ({f}) => {
  const on = ease.inOut(prog(f, T.matching, T.matching + 10));
  const sw = pulse(f, T.matching, 24);
  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: '0.14em', color: A, height: 30}}>
        CONFIRMED <Arrow size={24} color={A} /> RESUME
      </div>
      <div style={{height: PAGE.h + 26}} />
      <div style={{display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, ...rowIn(f, T.downloads[0] - 12)}}>
        {['PDF', 'DOCX', 'TXT'].map((s, i) => {
          const p = pulse(f, T.downloads[i], 18);
          return <Button key={s} label={s} icon={<IconDownload size={24} color={p > 0.1 ? A : C.ink} />} press={p * 0.8} glow={p} accent={A} fs={23} h={52} />;
        })}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 26, padding: '14px 18px', borderRadius: 12, border: `1px solid ${on > 0.5 ? rgba(C.good, 0.7) : C.line}`, background: rgba(C.good, 0.1 * on), boxShadow: sw > 0 ? `0 0 ${40 * sw}px ${rgba(C.good, 0.5 * sw)}` : undefined, ...rowIn(f, T.matching - 16)}}>
        <Toggle on={on} color={C.good} size={36} />
        <div style={{fontSize: 26, fontWeight: 600}}>Use for job matching</div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ the world
export const World: React.FC = () => {
  const f = useWorldFrame();
  return (
    <>
      <Title3D p={[-1374, 410, 1300]} r={[0, 8, 0]} idx={1} name={NAME} promise="Your story. Confirmed." accent={A} keys={KEYS} promiseAt={T.promise} out={122} size={122} />

      {/* the reveal, confirmed in three words once the eye has seen it */}
      <Caption3D p={[1500, 640, -1500]} r={[0, 72, 0]} at={T.traceEnd + 4} out={T.recede + 4} accent={A} fs={92}>
        No spin. <span style={{color: A}}>Just facts.</span>
      </Caption3D>

      {/* headline of the product beat, floating over the receded funnel */}
      <Caption3D p={[300, 250, 40]} at={T.card + 30} out={T.page - 8} accent={A} fs={46}>
        <div style={{whiteSpace: 'normal', width: 560, lineHeight: 1.18}}>Build a profile from facts you confirm.</div>
      </Caption3D>

      <Holo {...H1A} accent={A} at={T.card} out={OUT1} from={-1} r={[0, 5, 0]} pad={34} seed={1}>
        <ProfileCard f={f} />
      </Holo>
      <Holo
        {...H1B}
        accent={A}
        at={T.evidence}
        out={OUT1 + 4}
        from={-1}
        r={[0, 3, 0]}
        pad={30}
        seed={2}
        layers={FACTS.map((_, i) => (
          <FactChip key={i} f={f} i={i} />
        ))}
      >
        <EvidencePanel f={f} />
      </Holo>
      <Holo {...H2} accent={A} at={T.page} out={OUT2} from={1} r={[0, -4, 0]} edge="right" pad={30} seed={3} glow={pulse(f, T.matching, 30)} layers={<ResumePage f={f} />}>
        <ResumeHolo f={f} />
      </Holo>

      {/* confirmed lines lift off the chips and fly into the page as light */}
      {[0, 1].map((i) => {
        const a = chipWorld(i);
        const b = lineWorld(i);
        const at = i ? T.fly + 5 : T.fly;
        const land = i ? T.landB : T.landA;
        return <Comet key={i} path={bez(a, [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 300, 520], b)} a={at} b={land} color={i ? '#ffd2bf' : A} size={60} trail={16} />;
      })}
      {[T.landA, T.landB].map((at, i) => (
        <Spark key={i} p={lineWorld(i)} size={240} color={A} opacity={pulse(f, at, 18)} />
      ))}

      {/* exit: the resume leaves as a coral light toward the next station */}
      <Comet path={bez([H2.p[0], H2.p[1] + 60, H2.p[2] + 60], [1500, 500, 200], [3800, 600, -1400])} a={448} b={498} color={A} size={80} trail={18} ease={ease.expoIn} />

      <Motes seed={101} n={30} box={[-1800, 2600, -1000, 1000, -600, 3300]} color={A} size={[8, 46]} />
    </>
  );
};
