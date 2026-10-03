// Station 10 · YOURS, EVERYWHERE (teal) — CSS-3D layer (local coords, y up).
// Phi: from far away the two island beacons read as one light jumping; the camera swoops in between them and the
// gap is empty (two lamps blinking in place). Then the PC workspace hologram, the private link as a light bridge
// (GL.tsx), the same workspace on the phone, and the English ⇄ العربية flip (a real 3D card flip, RTL).
// Copy is v1's claim-reviewed copy (World2D.tsx).
import React from 'react';
import {Card3D, Group3D, useWorldFrame} from '../../engine/space';
import {ACCENT, ARABIC, C, FONT, MONO} from '../../brand';
import {Caption, HoloBody, Holo, Sample, TitleBlock, arrive} from '../engine/holo';
import {EXPO_IN, IconShield, IconSwap, IN_OUT, lerp, mix, Pill, pop, pulse, rgba} from '../engine/kit';
import {B, PC_CARD, PH_CARD, PH_YAW} from './set';

const A = ACCENT.anywhere;

const Ico: React.FC<{size: number; color: string; d: string}> = ({size, color, d}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{flex: 'none'}}>
    <path d={d} />
  </svg>
);
const IconUser: React.FC<{size: number; color: string}> = (p) => <Ico {...p} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c1-4 4-6 7-6s6 2 7 6" />;
const IconGlobe: React.FC<{size: number; color: string}> = (p) => <Ico {...p} d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />;

const Btn: React.FC<{label: React.ReactNode; icon?: React.ReactNode; fs: number; h: number; press?: number; glow?: number; style?: React.CSSProperties}> = ({label, icon, fs, h, press = 0, glow = 0, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      height: h,
      padding: `0 ${fs * 0.95}px`,
      borderRadius: 7,
      background: mix(C.cobalt, C.cobaltHover, press),
      border: `1px solid ${C.cobaltHover}`,
      color: C.ink,
      fontWeight: 600,
      fontSize: fs,
      whiteSpace: 'nowrap',
      scale: `${1 - 0.05 * press}`,
      boxShadow: `0 0 ${10 + 50 * glow}px ${rgba(A, 0.25 + 0.5 * glow)}`,
      ...style,
    }}
  >
    {icon}
    {label}
  </div>
);

// ---------- PC workspace hologram ----------
const PcCard: React.FC<{f: number}> = ({f}) => {
  const press = pulse(f, B.press, 10) * (f >= B.press ? 1 : 0);
  const linked = lerp(f, B.press + 8, B.press + 24);
  return (
    <Holo at={B.pc} out={B.out} p={PC_CARD.p} w={PC_CARD.w} h={PC_CARD.h} accent={A} swing={52} push={300} edge="top">
      <div style={{height: 72, background: 'rgba(20,38,95,0.85)', borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 16, padding: '0 32px', fontSize: 28, color: C.muted}}>
        <IconShield size={32} color={A} /> PC · Local workspace
        <Sample size={16} style={{marginLeft: 'auto'}} />
      </div>
      <div style={{position: 'absolute', left: 38, top: 108, width: 92, height: 92, display: 'grid', placeItems: 'center', borderRadius: '50%', background: rgba(A, 0.12), border: `1.5px solid ${rgba(A, 0.55)}`}}>
        <IconUser size={52} color={A} />
      </div>
      <div style={{position: 'absolute', left: 156, top: 106, fontSize: 44, fontWeight: 600}}>Sam Sample</div>
      <div style={{position: 'absolute', left: 158, top: 162, fontSize: 30, color: C.muted}}>Automation engineer</div>
      <div style={{position: 'absolute', left: 38, top: 232, display: 'flex', gap: 16}}>
        <Pill color={C.good} size={24}>Python</Pill>
        <Pill color={C.good} size={24}>Workflow automation</Pill>
      </div>
      {/* separate profiles: one active, others stay separate */}
      <div style={{position: 'absolute', left: 38, top: 318, display: 'flex', alignItems: 'center', gap: 14}}>
        {[A, C.soft, C.soft].map((c, i) => (
          <div key={i} style={{width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `1.5px solid ${rgba(c, i ? 0.45 : 0.9)}`, background: rgba(c, i ? 0.05 : 0.16), opacity: i ? 0.7 : 1}}>
            <IconUser size={26} color={c} />
          </div>
        ))}
        <span style={{fontSize: 30, color: C.muted, marginLeft: 10}}>Separate profiles for every person</span>
      </div>
      <div style={{position: 'absolute', left: 38, right: 38, bottom: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <Btn label="Open private link" icon={<IconGlobe size={32} color={C.ink} />} fs={30} h={68} press={press} glow={press * 0.8 + linked * 0.3} />
        <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, color: A, opacity: linked}}>
          <div style={{width: 12, height: 12, borderRadius: '50%', background: A, boxShadow: `0 0 12px ${A}`}} />
          Private connection
        </div>
      </div>
    </Holo>
  );
};

// ---------- phone: English front, Arabic (RTL) back; a real 3D flip ----------
const PhoneFace: React.FC<{f: number; ar?: boolean}> = ({f, ar}) => {
  const ready = lerp(f, B.land + 4, B.land + 22);
  const head = (
    <div style={{position: 'absolute', left: 28, right: 28, top: 52, display: 'flex', flexDirection: ar ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center'}}>
      <div style={{fontSize: 28, color: A}}>Phone companion</div>
      <IconShield size={30} color={A} />
    </div>
  );
  return (
    <HoloBody f={f} w={PH_CARD.w} h={PH_CARD.h} accent={A} radius={40} edge="top" style={{border: `3px solid ${rgba(A, 0.65)}`}}>
      <div style={{width: 110, height: 10, borderRadius: 20, background: C.line, margin: '20px auto 0'}} />
      {head}
      {ar ? (
        <div dir="rtl" lang="ar" style={{position: 'absolute', left: 28, right: 28, top: 130, fontFamily: ARABIC, textAlign: 'right'}}>
          <div style={{fontSize: 38, fontWeight: 700, lineHeight: 1.3}}>الملف والسيرة الذاتية</div>
          <div style={{fontSize: 34, marginTop: 22}}>سام مثال</div>
          <div style={{display: 'inline-block', fontSize: 28, color: C.warning, marginTop: 20, padding: '6px 18px', borderRadius: 999, border: `1px solid ${rgba(C.warning, 0.55)}`, background: rgba(C.warning, 0.1)}}>أدلة تحتاج إلى مراجعة</div>
          <div style={{fontSize: 30, color: C.muted, marginTop: 26, lineHeight: 1.6}}>راجع أدلتك قبل تأكيد المعلومات.</div>
        </div>
      ) : (
        <div style={{position: 'absolute', left: 28, right: 28, top: 130}}>
          <div style={{fontSize: 36, fontWeight: 600}}>Profile &amp; resume</div>
          <div style={{fontSize: 34, marginTop: 22}}>Sam Sample</div>
          <div style={{marginTop: 18}}>
            <Pill color={C.warning} size={22}>Evidence to review</Pill>
          </div>
          <div style={{fontSize: 30, color: C.muted, marginTop: 26, lineHeight: 1.4}}>Review your evidence. Keep facts in your control.</div>
        </div>
      )}
      <div style={{position: 'absolute', left: 28, right: 28, bottom: 36, display: 'flex', justifyContent: ar ? 'flex-end' : 'flex-start', opacity: ready}}>
        <Btn label={ar ? <span style={{fontFamily: ARABIC}}>مراجعة الأدلة</span> : 'Review your evidence'} fs={28} h={66} />
      </div>
      <Sample size={14} style={{position: 'absolute', bottom: 120, [ar ? 'left' : 'right']: 28}} />
    </HoloBody>
  );
};

const Phone: React.FC<{f: number}> = ({f}) => {
  if (f < B.land - 6) return null;
  const on = arrive(f, B.land - 6);
  const leave = lerp(f, B.out, B.out + 20, 0, 1, EXPO_IN);
  if (leave >= 1) return null;
  const flip = lerp(f, B.flip - 2, B.flip + 22, 0, 1, IN_OUT);
  const z = (1 - on) * -120 - leave * 400 + 60 * Math.sin(Math.PI * flip);
  const op = Math.min(1, on * 1.6) * (1 - leave);
  return (
    <Group3D p={[PH_CARD.p[0], PH_CARD.p[1], PH_CARD.p[2] + z]} r={[0, PH_YAW + flip * 180 + leave * 40, 0]}>
      <Card3D opacity={op} w={PH_CARD.w} h={PH_CARD.h}>
        <PhoneFace f={f} />
      </Card3D>
      <Card3D r={[0, 180, 0]} opacity={op} w={PH_CARD.w} h={PH_CARD.h}>
        <PhoneFace f={f} ar />
      </Card3D>
    </Group3D>
  );
};

// ---------- language + display modes ----------
const Modes: React.FC<{f: number}> = ({f}) => {
  const ar = lerp(f, B.flip, B.flip + 20, 0, 1, IN_OUT);
  const sel = pop(f, B.flip + 40, 14, 200, 0.6);
  return (
    <Holo at={B.flip - 4} out={B.out - 2} p={[960, -175, 60]} w={760} h={190} accent={A} swing={-50} push={260}>
      <div style={{position: 'absolute', left: 30, top: 26, display: 'flex', alignItems: 'center', gap: 16}}>
        <Pill color={A} size={24} solid={ar > 0.5}>
          English <IconSwap size={24} color={ar > 0.5 ? C.bg : A} />
          <span style={{fontFamily: ARABIC, letterSpacing: 0}}>العربية</span>
        </Pill>
      </div>
      <div style={{position: 'absolute', left: 30, top: 104, display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{fontSize: 26, color: C.muted, marginRight: 6}}>Display</span>
        {['Standard', 'Calm dark', 'Soft light'].map((s, i) => (
          <Pill key={s} color={i === 1 ? A : C.soft} size={21} solid={i === 1 && sel > 0.5} style={{scale: i === 1 ? `${1 + 0.1 * pulse(f, B.flip + 40, 10)}` : undefined}}>
            {s}
          </Pill>
        ))}
      </div>
    </Holo>
  );
};

export const World: React.FC = () => {
  const f = useWorldFrame();
  const titleOut = lerp(f, 62, 84, 0, 1, EXPO_IN);
  const head = arrive(f, B.pc + 8);
  const headOut = lerp(f, B.press + 10, B.press + 30, 0, 1, EXPO_IN);
  return (
    <>
      {/* in-scene title: floats in front of the islands; the camera swoops past it */}
      {titleOut < 1 ? (
        <Card3D p={[530, 420, 2600]} billboard opacity={1 - titleOut}>
          <TitleBlock f={f} at={-8} index={10} name="YOURS, EVERYWHERE" promise="Private by design." accent={A} size={150} />
        </Card3D>
      ) : null}
      {f >= 80 && f < 134 ? (
        <Card3D p={[830, 300, 300]} billboard>
          <Caption f={f} at={82} out={118} size={54}>
            Two lights. One apparent journey.
          </Caption>
        </Card3D>
      ) : null}
      {/* headline above the PC monolith */}
      {f >= B.pc + 8 && headOut < 1 ? (
        <Card3D p={[PC_CARD.p[0], PC_CARD.p[1] + PC_CARD.h / 2 + 100, PC_CARD.p[2] + 40]} opacity={Math.min(1, head) * (1 - headOut)}>
          <div style={{textAlign: 'center', whiteSpace: 'nowrap', translate: `0px ${(1 - head) * 30}px`}}>
            <div style={{fontWeight: 600, fontSize: 46, fontFamily: FONT, color: C.ink, letterSpacing: '-0.02em'}}>Local workspace. Your choice of connections.</div>
            <div style={{fontFamily: FONT, fontSize: 28, color: C.muted, marginTop: 10}}>Optional external providers · Phone companion over a private link</div>
          </div>
        </Card3D>
      ) : null}
      <PcCard f={f} />
      <Phone f={f} />
      {f >= B.land + 4 && f < B.out + 20 ? (
        <Card3D p={[920, 330, 60]}>
          <Caption f={f} at={B.land + 6} out={B.out} size={46}>
            Your PC workspace, on your phone.
          </Caption>
        </Card3D>
      ) : null}
      <Modes f={f} />
      {f >= B.land + 10 && f < B.out + 20 ? (
        <Card3D p={[920, 250, 60]} opacity={lerp(f, B.land + 20, B.land + 36) * (1 - lerp(f, B.out, B.out + 16, 0, 1, EXPO_IN))}>
          <div style={{fontFamily: MONO, fontSize: 22, color: C.soft, whiteSpace: 'nowrap', letterSpacing: '0.04em'}}>Keep your PC awake · Same private Tailnet</div>
        </Card3D>
      ) : null}
    </>
  );
};
