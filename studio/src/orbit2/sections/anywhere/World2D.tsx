// Phi apparent motion connects a local PC workspace and a private-link phone companion.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, ARABIC, C, FONT, MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {Btn, ease, IconGlobe, IconShield, IconUser, panelStyle, Pill, PortalPoint, prog, rgba, rise, SampleChip, Title} from '../profile/kit';
import {EXIT_DOTS} from '../engine/timing';

const A = ACCENT.anywhere;
const pulse = (f: number, at: number) => Math.sin(Math.PI * prog(f, at, at + 20));

export const World: React.FC = () => {
  const f = useSectionFrame();
  const devices = ease.expoOut(prog(f, 106, 140));
  const phoneReady = ease.expoOut(prog(f, 240, 260));
  const arabic = ease.inOut(prog(f, 360, 380));
  const exit = ease.inOut(prog(f, 444, 480));
  const uiOut = 1 - ease.cubicIn(prog(f, 438, 460));
  // Separate dots alternate; no dot actually moves between them (the phi illusion).
  const phiWindow = 1 - ease.cubicIn(prog(f, 94, 116));
  const phase = ((Math.max(0, f) % 24) / 24);
  const phiL = phase < .42 ? 1 : .12;
  const phiR = phase >= .5 && phase < .92 ? 1 : .12;
  return (
    <AbsoluteFill style={{background: C.bg, color: C.ink, fontFamily: FONT}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 68% 45%, ${rgba(A, .12)}, transparent 60%)`}} />
      {EXIT_DOTS.map((pt, i) => <PortalPoint key={i} x={pt.x} y={pt.y} size={1.2} color={A} opacity={phiWindow * (f < 12 ? 1 : i === 0 ? phiL : phiR)} />)}
      <Title f={f} idx={10} name="YOURS, EVERYWHERE" promise="Private by design." accent={A} />
      <div style={{position: 'absolute', left: 640, top: 655, fontSize: 28, color: C.muted, opacity: ease.expoOut(prog(f, 50, 70)) * phiWindow}}>Two lights. One apparent journey.</div>
      <div style={{position: 'absolute', inset: 0, opacity: uiOut}}>
        <div style={{position: 'absolute', left: 125, top: 146, ...rise(f, 108, 35)}}><div style={{fontSize: 43, fontWeight: 600}}>Local workspace. Your choice of connections.</div><div style={{fontSize: 28, color: C.muted, marginTop: 13}}>Optional external providers · Phone companion over a private link</div></div>
        <div style={{...panelStyle(A), left: 126, top: 292, width: 938, height: 491, ...rise(f, 120, 85)}}>
          <div style={{height: 65, background: C.raised, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 15, fontSize: 26, color: C.muted}}><IconShield size={29} color={A} /> PC · Local workspace<SampleChip style={{right: 25, top: 21, fontSize: 14}} /></div>
          <div style={{position: 'absolute', left: 35, top: 98, width: 80, height: 80, display: 'grid', placeItems: 'center', borderRadius: '50%', background: rgba(A, .12), border: `1px solid ${rgba(A, .5)}`}}><IconUser size={46} color={A} /></div>
          <div style={{position: 'absolute', left: 139, top: 96, fontSize: 38, fontWeight: 600}}>Sam Sample</div><div style={{position: 'absolute', left: 141, top: 145, fontSize: 28, color: C.muted}}>Automation engineer</div>
          <div style={{position: 'absolute', left: 35, top: 214, display: 'flex', gap: 15}}><Pill label="Python" color={C.good} fs={27} /><Pill label="Workflow automation" color={C.good} fs={27} /></div>
          <div style={{position: 'absolute', left: 37, top: 294, fontSize: 28, color: C.muted}}>Separate profiles for every person</div>
          <div style={{position: 'absolute', left: 35, bottom: 32, right: 35, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}><Btn label="Open private link" icon={<IconGlobe size={30} color={C.ink} />} primary fs={28} h={64} press={pulse(f, 200)} accent={A} glow={pulse(f, 200) * .6} /><div style={{fontSize: 26, color: A, opacity: ease.expoOut(prog(f, 208, 223))}}>Private connection</div></div>
        </div>
        <div style={{position: 'absolute', left: 202, top: 783, width: 786, height: 20, borderRadius: '0 0 16px 16px', background: C.line, opacity: devices}} />
        <div style={{position: 'absolute', left: 1162, top: 340, width: 488, height: 502, ...rise(f, 131, 75)}}>
          <div style={{...panelStyle(A), inset: 0, border: `3px solid ${rgba(A, .7)}`, borderRadius: 32, boxShadow: `0 24px 75px ${rgba(C.deep, .7)}`}}>
            <div style={{width: 110, height: 9, borderRadius: 20, background: C.line, margin: '19px auto 0'}} />
            <div style={{position: 'absolute', left: 26, right: 26, top: 49, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><div style={{fontSize: 27, color: A}}>Phone companion</div><IconShield size={27} color={A} /></div>
            <div style={{position: 'absolute', left: 26, right: 26, top: 111, opacity: 1 - arabic, transform: `translateX(${-26 * arabic}px)`}}><div style={{fontSize: 32, fontWeight: 600}}>Profile &amp; resume</div><div style={{fontSize: 31, marginTop: 21}}>Sam Sample</div><div style={{marginTop: 16}}><Pill label="Evidence to review" color={C.warning} fs={24} /></div><div style={{fontSize: 27, color: C.muted, marginTop: 23, lineHeight: 1.4}}>Review your evidence. Keep facts in your control.</div></div>
            <div dir="rtl" style={{position: 'absolute', left: 26, right: 26, top: 111, fontFamily: ARABIC, opacity: arabic, transform: `translateX(${26 * (1 - arabic)}px)`}}><div style={{fontSize: 34, fontWeight: 600}}>الملف والسيرة الذاتية</div><div style={{fontSize: 31, marginTop: 17}}>سام مثال</div><div style={{fontSize: 27, color: C.warning, marginTop: 14}}>أدلة تحتاج إلى مراجعة</div><div style={{fontSize: 27, color: C.muted, marginTop: 19, lineHeight: 1.5}}>راجع أدلتك قبل تأكيد المعلومات.</div></div>
            <div style={{position: 'absolute', left: 26, bottom: 31, opacity: phoneReady}}><Btn label={f < 374 ? 'Review your evidence' : <span style={{fontFamily: ARABIC}}>مراجعة الأدلة</span>} primary fs={26} h={62} px={22} /></div>
          </div>
        </div>
        <div style={{position: 'absolute', left: 1142, top: 262, fontSize: 28, color: C.muted, opacity: devices}}>Your PC workspace, on your phone.</div>
        {/* Echoes the title illusion without claiming live synchronization. */}
        <div style={{position: 'absolute', left: 1100, top: 508, opacity: devices}}>{[0, 1].map(i => <div key={i} style={{width: 11, height: 11, borderRadius: '50%', marginBottom: 17, background: A, opacity: i ? phiR : phiL}} />)}</div>
        <div style={{position: 'absolute', left: 126, top: 864, display: 'flex', alignItems: 'center', gap: 20, ...rise(f, 360, 32)}}><Pill label={<span>English <span style={{padding: '0 12px'}}>↔</span><span style={{fontFamily: ARABIC}}>العربية</span></span>} color={A} fs={27} fill={arabic} /><div style={{height: 48, width: 1, background: C.line, margin: '0 10px'}} /><div style={{fontSize: 27, color: C.muted}}>Display</div>{['Standard', 'Calm dark', 'Soft light'].map((s, i) => <Pill key={s} label={s} color={i === 1 ? A : C.soft} fs={25} fill={i === 1 ? 1 : 0} />)}</div>
        <div style={{position: 'absolute', left: 128, top: 923, fontFamily: MONO, fontSize: 20, color: C.soft, opacity: devices}}>Keep your PC awake · Same private Tailnet</div>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: exit}}>{Array.from({length: 10}, (_, i) => {const a = (i / 10) * Math.PI * 2 - Math.PI / 2; const r = 280 * ease.expoOut(prog(f, 446 + i * 1.1, 474)); return <circle key={i} cx={960 + Math.cos(a) * r} cy={540 + Math.sin(a) * r} r={40 + 45 * exit} fill="none" stroke={A} strokeWidth={3} opacity={.35 + .65 * exit} />;})}</svg>
    </AbsoluteFill>
  );
};
