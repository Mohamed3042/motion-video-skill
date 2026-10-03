// Station 9 · EVIDENCE & AGENTS (electric blue) — CSS-3D layer (local coords, y up).
// The research spire (GL.tsx) is a barber pole: its stripes seem to climb. At T.widen its aperture opens into a wide
// ring and the same stripes visibly slide sideways (coral beads ride along). The camera then rises past the agent
// floors planner → miner → verifier → synthesis, and docks at the crown where the evidence ledger and the
// AI & research connections holograms float. Copy is v1's claim-reviewed copy (World2D.tsx).
import React from 'react';
import {Card3D, useWorldFrame} from '../../engine/space';
import {ACCENT, C, FONT, MONO} from '../../brand';
import {T} from './timing';
import {CONN, FLOOR_Y, LEDGER, R2, Y2} from './spire';
import {Caption, Holo, Sample, TitleBlock, arrive} from './holo';
import {EXPO_IN, IconArrow, IconCheck, IconX, IN_OUT, lerp, mix, Pill, pop, pulse, rgba} from './kit';

const A = ACCENT.engine;


const UpArrow: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20V5M6 11l6-6 6 6" />
  </svg>
);

// ---------- agent floors ----------
const STAGES = [
  {name: 'Planner', role: 'planner', what: 'Plans the research'},
  {name: 'Miner', role: 'miner', what: 'Collects public sources'},
  {name: 'Verifier', role: 'verifier', what: 'Re-checks at the source'},
  {name: 'Synthesis', role: 'synthesis', what: 'Builds on accepted evidence'},
];

const FloorLabel: React.FC<{f: number; i: number}> = ({f, i}) => {
  const at = T.stages[i];
  const lit = f >= at;
  const flash = pulse(f, at, 10);
  const out = T.dock + 40 + i * 4;
  const w = 770;
  const h = 158;
  return (
    <Holo at={at - 14} out={out} p={[660, FLOOR_Y[i] + 60, 480]} r={[0, -12, 0]} w={w} h={h} accent={A} swing={-50} push={260} glow={0.5 + 1.5 * flash}>
      <div style={{position: 'absolute', left: 30, top: 24, display: 'flex', alignItems: 'center', gap: 14}}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: lit ? mix(A, '#ffffff', flash * 0.6) : 'rgba(7,18,83,0.8)',
            border: `2px solid ${lit ? '#ffffff' : C.line}`,
            boxShadow: lit ? `0 0 ${18 + 30 * flash}px ${rgba(A, 0.9)}` : undefined,
          }}
        >
          {lit ? <IconCheck size={30} color="#fff" stroke={3} /> : <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 18, color: C.soft}}>{String(i + 1).padStart(2, '0')}</span>}
        </div>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: '0.2em', color: lit ? A : C.soft}}>
          {String(i + 1).padStart(2, '0')} · {STAGES[i].role.toUpperCase()}
        </div>
      </div>
      <div style={{position: 'absolute', left: 30, top: 84, display: 'flex', alignItems: 'baseline', gap: 18, whiteSpace: 'nowrap'}}>
        <span style={{fontWeight: 700, fontSize: 48, letterSpacing: '-0.02em', color: lit ? C.ink : C.muted}}>{STAGES[i].name}</span>
        <span style={{fontWeight: 500, fontSize: 31, color: C.muted}}>{STAGES[i].what}</span>
      </div>
    </Holo>
  );
};

// ---------- evidence ledger ----------
const ROWS = [
  {claim: 'Opening observed in employer feed', pub: 'Synthetic QA Employer · careers page', cap: 'Sep 30, 2026, 6:27 AM', st: 'VERIFIED'},
  {claim: 'Role asks for SQL and Python', pub: 'Sample ATS board', cap: 'Sep 30, 2026, 6:29 AM', st: 'VERIFIED'},
  {claim: 'Team is expanding this year', pub: 'Sample business news', cap: 'Sep 29, 2026, 9:12 PM', st: 'REPORTED'},
  {claim: 'Salary band confirmed', pub: 'Search snippet · no primary source', cap: 'Not captured', st: 'REJECTED'},
] as const;
const stColor = (s: string) => (s === 'VERIFIED' ? C.good : s === 'REPORTED' ? C.warning : C.red);

const Ledger: React.FC<{f: number}> = ({f}) => {
  const strike = lerp(f, T.reject, T.reject + 12, 0, 1, IN_OUT);
  return (
    <Holo at={T.dock} out={T.pole} p={LEDGER.p} w={LEDGER.w} h={LEDGER.h} accent={A} swing={-64}>
      <div style={{padding: '36px 44px 0 46px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <div>
            <div style={{fontWeight: 700, fontSize: 46, letterSpacing: '-0.02em'}}>Evidence</div>
            <div style={{fontSize: 24, color: C.muted, marginTop: 8}}>Each claim is tied to its publisher, capture time, and verification status.</div>
          </div>
          <Sample size={17} style={{marginTop: 10}} />
        </div>
        <div style={{display: 'flex', fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: '0.16em', color: C.soft, marginTop: 30, paddingBottom: 12, borderBottom: `1px solid ${C.line}`}}>
          <span style={{width: 640}}>CLAIM · PUBLISHER</span>
          <span style={{width: 300}}>CAPTURED</span>
          <span>STATUS</span>
        </div>
        {ROWS.map((r, i) => {
          const at = T.rows[i];
          const s = Math.min(1, pop(f, at, 15, 200, 0.6));
          const rej = r.st === 'REJECTED';
          const shown = rej && f < T.reject ? 'REPORTED' : r.st;
          const flash = pulse(f, at, 8) + (rej ? pulse(f, T.reject, 12) : 0);
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                height: 112,
                borderBottom: `1px solid ${rgba(C.line, 0.7)}`,
                opacity: s * (rej ? 1 - 0.3 * strike : 1),
                translate: `${(1 - s) * -60}px 0px`,
                background: rgba(rej && f >= T.reject ? C.red : A, 0.14 * Math.min(1, flash)),
              }}
            >
              <div style={{width: 640}}>
                <div style={{fontSize: 31, fontWeight: 600, display: 'inline-block', position: 'relative', whiteSpace: 'nowrap'}}>
                  {rej ? '“' + r.claim + '”' : r.claim}
                  {rej ? <div style={{position: 'absolute', left: -6, top: '54%', height: 4, width: `calc(${strike * 100}% + 12px)`, background: C.red, boxShadow: `0 0 12px ${rgba(C.red, 0.9)}`}} /> : null}
                </div>
                <div style={{fontSize: 22, color: C.soft, marginTop: 6, whiteSpace: 'nowrap'}}>{r.pub}</div>
              </div>
              <div style={{width: 300, fontFamily: MONO, fontWeight: 500, fontSize: 21, color: C.muted}}>{r.cap}</div>
              <Pill color={stColor(shown)} size={21} style={{scale: rej ? `${1 + 0.18 * pulse(f, T.reject, 10)}` : undefined}}>
                {shown === 'VERIFIED' ? <IconCheck size={21} color={C.good} stroke={3} /> : shown === 'REJECTED' ? <IconX size={20} color={C.red} /> : null}
                {shown === 'REJECTED' ? 'Rejected' : shown}
              </Pill>
            </div>
          );
        })}
        <div style={{display: 'flex', flexWrap: 'wrap', columnGap: 34, rowGap: 8, marginTop: 20, fontFamily: MONO, fontSize: 19, fontWeight: 500, color: C.soft, letterSpacing: '0.03em', opacity: lerp(f, T.reject + 8, T.reject + 24), whiteSpace: 'nowrap'}}>
          <span>
            <b style={{color: C.good}}>VERIFIED</b> = verified observation
          </span>
          <span>
            <b style={{color: C.warning}}>REPORTED</b> = reported, unverified
          </span>
          <span style={{color: C.red, flexBasis: '100%'}}>Snippets can't become verified observations.</span>
        </div>
      </div>
    </Holo>
  );
};

// ---------- AI & research connections ----------
const ROUTES = [
  {t: 'Free only', d: 'Zero chargeable API dispatches.'},
  {t: 'Capped paid', d: 'Needs a named provider, model and saved cap.'},
  {t: 'Connected chat', d: 'Research stages wait for your connected chat.'},
  {t: 'Local model', d: 'Uses a local endpoint you set up.'},
];

const Connections: React.FC<{f: number}> = ({f}) => {
  const picked = f >= T.pick;
  const pk = Math.min(1, pop(f, T.pick, 12, 210, 0.6));
  const turn = lerp(f, T.conn + 4, T.conn + 34, -16, -3, IN_OUT);
  return (
    <Holo at={T.conn} out={T.pole + 2} p={CONN.p} r={[0, turn, 0]} w={CONN.w} h={CONN.h} accent={A} swing={60}>
      <div style={{padding: '36px 40px 0 44px'}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: '0.18em', color: A}}>SETTINGS</div>
        <div style={{fontWeight: 700, fontSize: 40, letterSpacing: '-0.02em', marginTop: 10}}>AI & research connections</div>
        <div style={{fontSize: 23, color: C.muted, marginTop: 8, lineHeight: 1.35}}>Choose a spending policy, then check which routes can actually work.</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 14, marginTop: 26}}>
          {ROUTES.map((r, i) => {
            const s = Math.min(1, pop(f, T.chips[i], 14, 220, 0.55));
            const sel = picked && i === 0;
            return (
              <div
                key={r.t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  height: 98,
                  padding: '0 22px',
                  borderRadius: 7,
                  border: `1px solid ${sel ? C.cobaltHover : C.line}`,
                  background: sel ? mix(C.cobalt, C.cobaltHover, pulse(f, T.pick, 12)) : 'rgba(7,18,83,0.55)',
                  opacity: s,
                  translate: `${(1 - s) * 60}px 0px`,
                  boxShadow: sel ? `0 0 ${36 * pk}px ${rgba(A, 0.6)}` : undefined,
                }}
              >
                <div style={{width: 30, height: 30, borderRadius: '50%', border: `2.5px solid ${sel ? '#fff' : C.soft}`, display: 'grid', placeItems: 'center', flex: 'none'}}>
                  {sel ? <div style={{width: 15 * pk, height: 15 * pk, borderRadius: '50%', background: '#fff'}} /> : null}
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontSize: 29, fontWeight: 700}}>{r.t}</div>
                  <div style={{fontSize: 21, color: sel ? '#dfe6ff' : C.soft, marginTop: 3}}>{r.d}</div>
                </div>
                {sel ? <IconCheck size={34} color="#fff" stroke={3} /> : null}
              </div>
            );
          })}
        </div>
        <div style={{fontFamily: MONO, fontSize: 18, color: C.soft, marginTop: 22, letterSpacing: '0.04em', opacity: lerp(f, T.pick + 4, T.pick + 18)}}>This screen never sends an API key.</div>
      </div>
    </Holo>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  const titleOut = lerp(f, 110, 134, 0, 1, EXPO_IN);
  const agentIn = arrive(f, T.stages[0] - 10);
  return (
    <>
      {/* in-scene title: stands on the left of the spire, the camera rises away from it */}
      {titleOut < 1 ? (
        <Card3D p={[-1000, 260, 450 - titleOut * 200]} billboard opacity={1 - titleOut}>
          <TitleBlock f={f} at={-10} index={9} name="EVIDENCE & AGENTS" lines={['EVIDENCE', '& AGENTS']} promise="Trace claims to sources and dates." accent={A} size={168} />
        </Card3D>
      ) : null}
      {/* the illusion, then the truth */}
      {f >= T.looks && f < T.widen + 4 ? (
        <Card3D p={[-820, -300, 520]} r={[0, 12, 0]}>
          <Caption f={f} at={T.looks} out={T.widen - 12} size={58}>
            <UpArrow size={58} color={A} />
            Looks like it's climbing.
          </Caption>
        </Card3D>
      ) : null}
      {f >= T.widen + 2 && f < T.stages[1] + 6 ? (
        <Card3D p={[-60, Y2 + 480, R2 * 0.55]} billboard>
          <Caption f={f} at={T.widen + 12} out={T.stages[1] - 6} size={62}>
            It never climbs. It only slides sideways.
            <IconArrow size={58} color={C.coral} />
          </Caption>
        </Card3D>
      ) : null}
      {/* agent floors */}
      {f >= T.stages[0] - 10 && f < T.dock + 40 ? (
        <Card3D p={[-780, 260, 420]} r={[0, 10, 0]} opacity={Math.min(1, agentIn) * (1 - lerp(f, T.stages[2], T.stages[2] + 20, 0, 1, EXPO_IN))}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18, whiteSpace: 'nowrap'}}>
            <span style={{fontFamily: FONT, fontWeight: 700, fontSize: 44, color: C.ink, letterSpacing: '-0.02em'}}>Agent activity</span>
            <Sample size={17} />
          </div>
        </Card3D>
      ) : null}
      {STAGES.map((_, i) => (
        <FloorLabel key={i} f={f} i={i} />
      ))}
      <Ledger f={f} />
      <Connections f={f} />
    </>
  );
};
