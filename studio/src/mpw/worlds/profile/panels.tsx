// World 10 panel views: Creative Profile and Intelligence, laid out absolutely inside the essential panel P
// so the cursor targets below are exact. Copy follows the product's own UI strings (src/profiles, src/intelligence).
import React from 'react';
import {C, FONT, MONO} from '../../brand';
import {IconCheck, IconFile, IconNote, IconSpark, IconX, lerp, pop, pulse, rgba} from './kit';
import {T} from './timing';

export const P = {x: 300, y: 250, w: 1320, h: 610};
const A = '#f8ce81';

// cursor targets (screen px) and the frames they are pressed on
export const CP_TARGETS = {
  approve: {x: P.x + 541, y: P.y + 364},
  reject: {x: P.x + 657, y: P.y + 488},
  apply: {x: P.x + 1165, y: P.y + 447},
};
export const IN_TARGETS = {
  toggle: {x: P.x + 703, y: P.y + 173},
  row1: {x: P.x + 719, y: P.y + 311},
  row2: {x: P.x + 719, y: P.y + 367},
  apply: {x: P.x + 984, y: P.y + 488},
};

const abs = (x: number, y: number, extra?: React.CSSProperties): React.CSSProperties => ({position: 'absolute', left: x, top: y, ...extra});
const H2: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.text, letterSpacing: '-0.01em'}}>{children}</div>;
const Sub: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => <div style={{fontFamily: FONT, fontSize: 13.5, color: C.muted, marginTop: 6, ...style}}>{children}</div>;
const Eyebrow: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = C.amber}) => (
  <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', color}}>{children}</div>
);
const Btn: React.FC<{w: number; h?: number; primary?: boolean; children: React.ReactNode; style?: React.CSSProperties}> = ({w, h = 32, primary, children, style}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      fontFamily: FONT,
      fontWeight: primary ? 600 : 500,
      fontSize: 14,
      background: primary ? C.amber : C.raised,
      color: primary ? C.onAmber : C.text,
      border: `1px solid ${primary ? C.amber : C.line}`,
      ...style,
    }}
  >
    {children}
  </div>
);
const press = (f: number, at: number) => (f >= at - 2 && f < at + 5 ? 1 : 0);

// tiny before/after waveform for a reviewed result
const MiniWave: React.FC<{w: number; seed: number; color: string}> = ({w, seed, color}) => (
  <svg width={w} height={22} style={{display: 'block'}}>
    {Array.from({length: 46}, (_, i) => {
      const v = 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + seed) * Math.cos(i * 0.31 + seed * 2));
      return <rect key={i} x={i * (w / 46)} y={11 - v * 10} width={w / 46 - 1.5} height={v * 20} rx={1} fill={color} />;
    })}
  </svg>
);

// ---------------- CREATIVE PROFILE ----------------
export const CreativeProfile: React.FC<{f: number}> = ({f}) => {
  const col = (k: number) => 32 + k * 425;
  const colIn = (k: number) => lerp(f, T.resolve + 4 + k * 5, T.resolve + 24 + k * 5);
  const approved = f >= T.approve;
  const rejected = f >= T.reject;
  const sug = pop(f, T.suggest, 13, 160, 0.7);
  const applied = f >= T.apply;
  const rowsIn = (i: number) => lerp(f, T.rows[i], T.rows[i] + 14);
  return (
    <>
      {/* header */}
      <div style={abs(32, 26, {opacity: lerp(f, T.resolve, T.resolve + 14)})}>
        <Eyebrow>YOUR CREATIVE MEMORY</Eyebrow>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 38, letterSpacing: '-0.02em', color: C.text, marginTop: 8, lineHeight: 1.1}}>
          Make it yours. <span style={{color: C.amber}}>With every cut.</span>
        </div>
        <Sub style={{fontSize: 15}}>Learns your preferred settings from results you approve.</Sub>
      </div>
      <div style={abs(890, 30, {display: 'flex', alignItems: 'center', gap: 12, opacity: lerp(f, T.resolve + 6, T.resolve + 20)})}>
        <span style={{width: 40, height: 40, borderRadius: 6, border: `1px solid ${rgba(C.amber, 0.6)}`, display: 'grid', placeItems: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 15, color: C.amber}}>DS</span>
        <div>
          <div style={{fontFamily: FONT, fontSize: 12, color: C.muted}}>Creative profile</div>
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 16, color: C.text}}>Doc series</div>
        </div>
        <Btn w={150} style={{marginLeft: 18}}>Export profile</Btn>
      </div>
      {/* metrics */}
      <div style={abs(32, 146, {display: 'flex', gap: 34, alignItems: 'baseline', opacity: lerp(f, T.resolve + 8, T.resolve + 22)})}>
        {[
          [3, 'Memory inputs'],
          [approved ? 1 : 0, 'Approved results'],
          [f >= T.suggest ? 1 : 0, 'Settings suggestions'],
        ].map(([n, l], i) => (
          <span key={i} style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
            <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 24, color: C.text, scale: String(1 + 0.25 * pulse(f, i === 1 ? T.approve : i === 2 ? T.suggest : 1e9, 8))}}>{n}</span>
            <span style={{fontFamily: FONT, fontSize: 13, color: C.muted}}>{l}</span>
          </span>
        ))}
      </div>
      <div style={abs(32, 182, {width: P.w - 64, height: 1, background: C.line})} />
      {/* columns */}
      {['Feed your memory', 'Reviewed results', 'Settings for you'].map((t, k) => (
        <div
          key={t}
          style={abs(col(k), 196, {
            width: 405,
            height: 340,
            borderRadius: 9,
            background: '#1f2421',
            border: `1px solid ${C.line}`,
            opacity: colIn(k),
            translate: `0px ${(1 - colIn(k)) * 18}px`,
          })}
        >
          <div style={{position: 'absolute', left: 18, top: 16}}>
            <H2>{t}</H2>
            <Sub>{['Notes and references from your work.', 'Your review shapes the next settings suggestion.', 'From your preferences and approved results.'][k]}</Sub>
          </div>
        </div>
      ))}
      {/* 1 · memory inputs */}
      {[
        {icon: <IconNote size={18} color={C.amber} />, t: 'Interview edit preference', s: 'note · Preserve natural pauses.'},
        {icon: <IconFile size={18} color={C.amber} />, t: 'Take 03 · reference.wav', s: 'reference file · stays on this PC'},
        {icon: <IconSpark size={17} color={C.amber} />, t: 'Saved preference', s: 'Dialogue Leveler · gentle'},
      ].map((r, i) => (
        <div
          key={i}
          style={abs(col(0) + 14, 282 + i * 80, {
            width: 377,
            height: 68,
            borderRadius: 6,
            background: C.raised,
            border: `1px solid ${C.line}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 14px',
            boxSizing: 'border-box',
            opacity: rowsIn(i),
            translate: `${(1 - rowsIn(i)) * -22}px 0px`,
          })}
        >
          {r.icon}
          <div>
            <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.text}}>{r.t}</div>
            <div style={{fontFamily: FONT, fontSize: 12.5, color: C.muted, marginTop: 2}}>{r.s}</div>
          </div>
        </div>
      ))}
      {/* 2 · reviewed results: Approve / Reject */}
      {[
        {t: 'Audio Repair · Take 03.wav', at: T.approve, ok: true, done: approved},
        {t: 'Film Finish · CAM B', at: T.reject, ok: false, done: rejected},
      ].map((r, i) => {
        const x = col(1) + 14;
        const y = 282 + i * 124;
        const flash = pulse(f, r.at, 12);
        const tone = r.ok ? C.success : C.error;
        const inA = lerp(f, T.rows[i] + 4, T.rows[i] + 18);
        return (
          <div
            key={i}
            style={abs(x, y, {
              width: 377,
              height: 112,
              borderRadius: 6,
              background: C.raised,
              border: `1px solid ${r.done ? rgba(tone, 0.7) : C.line}`,
              boxShadow: flash > 0.01 ? `0 0 0 ${3 * flash}px ${rgba(tone, 0.35 * flash)}` : undefined,
              opacity: inA * (r.done && !r.ok ? 0.72 : 1),
              translate: `0px ${(1 - inA) * 14}px`,
            })}
          >
            <div style={{position: 'absolute', left: 14, top: 12, fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.text}}>{r.t}</div>
            <div style={{position: 'absolute', left: 14, top: 36, display: 'flex', gap: 10, alignItems: 'center'}}>
              <span style={{fontFamily: MONO, fontSize: 10.5, color: C.muted}}>BEFORE</span>
              <MiniWave w={110} seed={i * 3 + 1} color={rgba(C.muted, 0.5)} />
              <span style={{fontFamily: MONO, fontSize: 10.5, color: C.muted}}>AFTER</span>
              <MiniWave w={110} seed={i * 3 + 1.4} color={rgba(r.ok ? C.success : C.muted, 0.7)} />
            </div>
            {r.done ? (
              <div style={{position: 'absolute', left: 14, top: 66, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT, fontWeight: 600, fontSize: 14, color: tone, scale: String(0.9 + 0.1 * pop(f, r.at, 12, 220))}}>
                {r.ok ? <IconCheck size={22} color={C.onAmber} bg={C.success} /> : <IconX size={22} color={C.error} />}
                {r.ok ? 'Approved' : 'Rejected'}
                <span style={{fontFamily: FONT, fontWeight: 400, fontSize: 12.5, color: C.muted, marginLeft: 6}}>{r.ok ? 'shapes the next suggestion' : 'not used for suggestions'}</span>
              </div>
            ) : (
              <div style={{position: 'absolute', left: 14, top: 66, display: 'flex', gap: 12}}>
                <Btn w={112} style={{scale: String(1 - 0.06 * press(f, r.ok ? T.approve : -99))}}>
                  <IconCheck size={16} color={C.success} /> Approve
                </Btn>
                <Btn w={100} style={{scale: String(1 - 0.06 * press(f, r.ok ? -99 : T.reject))}}>
                  <IconX size={16} color={C.error} /> Reject
                </Btn>
              </div>
            )}
          </div>
        );
      })}
      {/* 3 · settings for you: a suggestion you choose to apply */}
      <div style={abs(col(2) + 18, 290, {width: 360, fontFamily: FONT, fontSize: 14, lineHeight: 1.45, color: C.muted, opacity: 1 - sug})}>
        Approve or reject a completed result after comparing Before and After.
      </div>
      {sug > 0.01 ? (
        <div
          style={abs(col(2) + 14, 282, {
            width: 377,
            height: 204,
            borderRadius: 6,
            background: C.raised,
            border: `1px solid ${applied ? rgba(C.success, 0.7) : rgba(C.amber, 0.55)}`,
            opacity: Math.min(1, sug * 1.4),
            scale: String(0.94 + 0.06 * sug),
          })}
        >
          <div style={{position: 'absolute', left: 14, top: 14}}>
            <Eyebrow>SUGGESTED FOR THIS PROFILE</Eyebrow>
            <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 19, color: C.text, marginTop: 8}}>Audio Repair · gentle noise reduction</div>
            <div style={{fontFamily: FONT, fontSize: 13, color: C.muted, marginTop: 6, width: 340, lineHeight: 1.4}}>From 1 approved result and your saved preferences. Nothing changes until you apply it.</div>
          </div>
          <div style={{position: 'absolute', left: 14, top: 148, display: 'flex', gap: 12}}>
            <Btn w={150} h={34}>Preview settings</Btn>
            {applied ? (
              <Btn w={186} h={34} style={{background: rgba(C.success, 0.16), border: `1px solid ${rgba(C.success, 0.7)}`, color: C.success, scale: String(0.92 + 0.08 * pop(f, T.apply, 12, 220))}}>
                <IconCheck size={17} color={C.success} /> Applied by you
              </Btn>
            ) : (
              <Btn w={186} h={34} primary>
                Open tool &amp; apply
              </Btn>
            )}
          </div>
        </div>
      ) : null}
      {/* footer: the honest line */}
      <div style={abs(32, 556, {display: 'flex', alignItems: 'center', gap: 22, opacity: lerp(f, T.resolve + 30, T.resolve + 46)})}>
        <span style={{display: 'flex', alignItems: 'center', gap: 9, padding: '7px 13px', borderRadius: 6, border: `1px solid ${rgba(A, 0.45)}`, fontFamily: FONT, fontWeight: 600, fontSize: 14.5, color: A}}>
          <IconCheck size={16} color={A} /> Local calibration. Not model training.
        </span>
        <span style={{fontFamily: FONT, fontSize: 13.5, color: C.muted}}>Notes, preferences and approved results travel with your profile · media stays on your PC · portable JSON</span>
      </div>
    </>
  );
};

// ---------------- INTELLIGENCE ----------------
const Checkbox: React.FC<{on: number; f: number; at: number}> = ({on, f, at}) => (
  <span
    style={{
      width: 22,
      height: 22,
      borderRadius: 5,
      flexShrink: 0,
      background: on ? C.amber : 'transparent',
      border: `1.5px solid ${on ? C.amber : C.muted}`,
      display: 'grid',
      placeItems: 'center',
      scale: String(1 + 0.2 * pulse(f, at, 6)),
    }}
  >
    {on ? <IconCheck size={18} color={C.onAmber} draw={lerp(f, at, at + 8)} stroke={3} /> : null}
  </span>
);

const SpacedCaption: React.FC<{f: number}> = ({f}) => {
  const t = lerp(f, T.checks[2] - 2, T.checks[2] + 12);
  const words = ['One', 'quiet', 'moment.'];
  const extra = [22, 34];
  return (
    <span style={{display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 5, background: '#141715', border: `1px solid ${C.line}`, fontFamily: FONT, fontSize: 15, color: C.text}}>
      {words.map((w, i) => (
        <span key={i} style={{marginLeft: i ? 5 + extra[i - 1] * (1 - t) : 0, position: 'relative'}}>
          {i ? (
            <span style={{position: 'absolute', right: '100%', top: 2, bottom: 2, width: extra[i - 1] * (1 - t), marginRight: 2, borderRadius: 3, background: rgba(C.error, 0.35 * (1 - t))}} />
          ) : null}
          {w}
        </span>
      ))}
    </span>
  );
};

export const Intelligence: React.FC<{f: number}> = ({f}) => {
  const enter = (d: number) => lerp(f, T.toIntel + d, T.toIntel + d + 16);
  const on = lerp(f, T.endpoint, T.endpoint + 8);
  const planIn = pop(f, T.plan, 14, 170);
  const done = f >= T.applyPlan;
  const checks = [
    {t: 'Sources readable', s: '4 cameras · 12 clips', at: T.checks[0]},
    {t: 'Sync complete', s: '3 sessions, in shooting order', at: T.checks[1]},
    {t: 'Caption spacing tidied', s: '', at: T.checks[2]},
    {t: 'Review marker added', s: '', at: T.marker},
  ];
  return (
    <>
      <div style={abs(32, 24, {display: 'flex', alignItems: 'center', gap: 12, opacity: enter(0)})}>
        <IconSpark size={30} color={C.amber} />
        <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 30, color: C.text, letterSpacing: '-0.01em'}}>Intelligence</span>
        <span style={{marginLeft: 10, padding: '5px 11px', borderRadius: 6, border: `1px solid ${rgba(C.amber, 0.55)}`, fontFamily: FONT, fontSize: 13.5, color: C.amber}}>Local helper · no API</span>
      </div>
      <div style={abs(32, 70, {fontFamily: FONT, fontSize: 15, color: C.muted, opacity: enter(4)})}>Project rules and exact text operations. No language model is used.</div>
      <div style={abs(900, 30, {display: 'flex', gap: 2, opacity: enter(6)})}>
        {['Ask', 'Plan', 'Review', 'History'].map((t, i) => {
          const act = (i === 2) === f >= T.plan || (i === 0 && f < T.plan);
          const sel = f >= T.plan ? i === 2 : i === 0;
          void act;
          return (
            <span key={t} style={{width: 92, textAlign: 'center', padding: '8px 0', fontFamily: FONT, fontSize: 14.5, color: sel ? C.amber : C.muted, borderBottom: `2px solid ${sel ? C.amber : C.line}`}}>
              {t}
            </span>
          );
        })}
      </div>
      <div style={abs(32, 108, {width: P.w - 64, height: 1, background: C.line, opacity: enter(6)})} />
      {/* left: the rules-based helper */}
      <div style={abs(32, 128, {opacity: enter(8)})}>
        <Eyebrow>LOCAL HELPER · RULES-BASED</Eyebrow>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 21, color: C.text, marginTop: 8}}>Readiness checks</div>
      </div>
      {checks.map((c, i) => {
        const shown = lerp(f, c.at - 10, c.at - 2);
        const ok = f >= c.at;
        return (
          <div
            key={i}
            style={abs(32, 196 + i * 86, {
              width: 600,
              height: 74,
              borderRadius: 6,
              background: C.raised,
              border: `1px solid ${ok ? rgba(C.success, 0.45) : C.line}`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '0 16px',
              boxSizing: 'border-box',
              opacity: shown,
              translate: `${(1 - shown) * -18}px 0px`,
            })}
          >
            <span style={{width: 28, height: 28, display: 'grid', placeItems: 'center', scale: String(1 + 0.3 * pulse(f, c.at, 7))}}>
              {ok ? <IconCheck size={28} color={C.onAmber} bg={C.success} draw={lerp(f, c.at, c.at + 8)} /> : <span style={{width: 20, height: 20, borderRadius: 10, border: `2px solid ${C.muted}`, opacity: 0.6}} />}
            </span>
            <div style={{flex: 1}}>
              <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 16, color: C.text}}>{c.t}</div>
              {c.s ? <div style={{fontFamily: FONT, fontSize: 13, color: C.muted, marginTop: 3}}>{c.s}</div> : null}
              {i === 2 ? (
                <div style={{marginTop: 5, display: 'flex', alignItems: 'center', gap: 10}}>
                  <SpacedCaption f={f} />
                  <span style={{fontFamily: FONT, fontSize: 12.5, color: C.muted}}>selected cue · words and timing unchanged</span>
                </div>
              ) : null}
            </div>
            {i === 3 ? (
              <svg width={250} height={46} style={{display: 'block'}}>
                <rect x={0} y={24} width={250} height={14} rx={3} fill="#141715" stroke={C.line} />
                {Array.from({length: 11}, (_, k) => (
                  <line key={k} x1={k * 25} y1={24} x2={k * 25} y2={k % 5 === 0 ? 31 : 28} stroke={C.muted} strokeOpacity={0.5} />
                ))}
                {(() => {
                  const drop = lerp(f, T.marker, T.marker + 10, 0, 1, (t) => 1 - (1 - t) ** 3);
                  const y = -20 + 44 * drop;
                  return f >= T.marker - 6 ? (
                    <g transform={`translate(75 ${y - 24})`} opacity={Math.min(1, drop * 3)}>
                      <line x1={0} y1={6} x2={0} y2={38} stroke={C.amber} strokeWidth={2} />
                      <path d="M0 4h13l-3.5 4.5 3.5 4.5H0z" fill={C.amber} />
                    </g>
                  ) : null;
                })()}
                <text x={92} y={18} fontFamily={MONO} fontSize={11} fill={C.amber} opacity={lerp(f, T.marker + 4, T.marker + 12)}>
                  00:00:30:00
                </text>
              </svg>
            ) : null}
          </div>
        );
      })}
      {/* right: optional, your own endpoint → a plan you review */}
      <div style={abs(680, 128, {opacity: enter(12)})}>
        <Eyebrow color={C.muted}>OPTIONAL</Eyebrow>
      </div>
      <div style={abs(680, 150, {display: 'flex', alignItems: 'center', gap: 14, opacity: enter(14)})}>
        <span style={{width: 46, height: 26, borderRadius: 13, background: on > 0.5 ? C.amber : C.raised, border: `1px solid ${on > 0.5 ? C.amber : C.line}`, position: 'relative', flexShrink: 0}}>
          <span style={{position: 'absolute', top: 3, left: 3 + 20 * on, width: 18, height: 18, borderRadius: 9, background: on > 0.5 ? C.onAmber : C.muted}} />
        </span>
        <div>
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 18, color: C.text}}>Your own API endpoint</div>
          <div style={{fontFamily: FONT, fontSize: 13, color: C.muted, marginTop: 2}}>Configured by you · key encrypted for your Windows user</div>
        </div>
      </div>
      {planIn > 0.01 ? (
        <div
          style={abs(680, 230, {
            width: 608,
            height: 314,
            borderRadius: 9,
            background: '#1f2421',
            border: `1px solid ${rgba(C.amber, 0.4)}`,
            opacity: Math.min(1, planIn * 1.5),
            translate: `0px ${(1 - planIn) * 20}px`,
          })}
        >
          <div style={{position: 'absolute', left: 16, top: 14, display: 'flex', alignItems: 'baseline', gap: 12}}>
            <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 18, color: C.text}}>Proposed plan</span>
            <span style={{fontFamily: FONT, fontSize: 13, color: C.muted}}>3 changes · nothing applies until you review</span>
          </div>
          {[
            {t: 'Add marker “Laugh — keep” at 00:01:12:00', at: T.planChecks[0]},
            {t: 'Caption cue 4: “gonna” → “going to”', at: T.planChecks[1]},
            {t: 'Open Loudness Delivery', at: 1e9},
          ].map((r, i) => {
            const isOn = f >= r.at;
            return (
              <div key={i} style={{position: 'absolute', left: 16, top: 58 + i * 56, width: 576, height: 46, borderRadius: 6, background: C.raised, border: `1px solid ${isOn ? rgba(C.amber, 0.5) : C.line}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px', boxSizing: 'border-box'}}>
                {i < 2 ? <Checkbox on={isOn ? 1 : 0} f={f} at={r.at} /> : <span style={{width: 22}} />}
                <span style={{flex: 1, fontFamily: FONT, fontSize: 14.5, color: i < 2 ? C.text : C.muted}}>{r.t}</span>
                {i === 2 ? <Btn w={64} h={28}>Open</Btn> : null}
              </div>
            );
          })}
          <div style={{position: 'absolute', left: 16, top: 236}}>
            {done ? (
              <Btn w={576} h={44} style={{background: rgba(C.success, 0.14), border: `1px solid ${rgba(C.success, 0.7)}`, color: C.success, fontSize: 15.5, scale: String(0.96 + 0.04 * pop(f, T.applyPlan, 12, 220))}}>
                <IconCheck size={20} color={C.success} /> Applied together · one Undo step
              </Btn>
            ) : (
              <Btn w={576} h={44} primary style={{fontSize: 15.5, scale: String(1 - 0.04 * press(f, T.applyPlan))}}>
                Apply 2 selected changes
              </Btn>
            )}
          </div>
        </div>
      ) : null}
      <div style={abs(680, 556, {display: 'flex', alignItems: 'center', gap: 18, opacity: lerp(f, T.plan + 8, T.plan + 22)})}>
        <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 17, color: A}}>You review every change before it applies.</span>
        <span style={{fontFamily: FONT, fontSize: 13, color: C.muted}}>No autonomous rendering or cutting.</span>
      </div>
    </>
  );
};
