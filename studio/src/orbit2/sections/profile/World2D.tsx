import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C,FONT,MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {Fraser,CX,CY,RADII,TRACE_RING} from './fraser';
import {Title,Btn,Pill,panelStyle,prog,ease,rgba,PortalSphere} from './kit';
import {KEYS,T} from './timing';
export const World: React.FC = () => {
  const f=useSectionFrame();
  const settle=ease.inOut(prog(f,T.traceStart,T.traceEnd));
  const ui=ease.expoOut(prog(f,222,246)); const exit=ease.inOut(prog(f,440,474));
  const circle=RADII[TRACE_RING];
  const checked=f>=T.confirmA;
  return <AbsoluteFill style={{background:C.deep,fontFamily:FONT,color:C.ink}}>
    <AbsoluteFill style={{opacity:1-.86*ui}}>
      <Fraser twistOf={()=>.40*(1-settle)} rot={f<180?f*.045:8.1} scale={1.55-.4*ui} reveal={1600} bgA="#342652" bgB={C.deep} lightCol="#ffd0bb" darkCol="#441d39">
        <circle cx={CX} cy={CY} r={circle} fill="none" stroke={C.coral} strokeWidth={7} pathLength={1} strokeDasharray={`${prog(f,120,180)} 1`} transform={`rotate(-90 ${CX} ${CY})`}/>
      </Fraser>
    </AbsoluteFill>
    <Title f={f} idx={1} name="PROFILE & RESUME" promise="Your story. Confirmed." accent={C.coral} keys={KEYS} promiseAt={75} out={112}/>
    <div style={{position:'absolute',left:100,right:100,top:820,fontSize:36,textAlign:'center',opacity:prog(f,120,133)*(1-prog(f,208,226))}}>Looks like a spiral. <span style={{color:C.coral}}>Built from circles.</span></div>
    <div style={{position:'absolute',inset:0,opacity:ui*(1-exit),transform:`translateY(${(1-ui)*65}px)`}}>
      <div style={{position:'absolute',left:110,top:150,fontSize:42,fontWeight:700}}>Build a profile from facts you confirm.</div>
      <div style={{position:'absolute',right:110,top:167,fontFamily:MONO,fontSize:19,color:C.muted}}>SAMPLE DATA</div>
      <div style={{...panelStyle(C.coral),left:110,top:234,width:965,height:625,padding:36,boxSizing:'border-box'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div><div style={{fontSize:34,fontWeight:700}}>Sam Sample</div><div style={{fontSize:26,color:C.muted,marginTop:8}}>Data analyst</div></div><Pill label="Profile evidence" color={C.coral} fs={22}/></div>
        <div style={{marginTop:28,padding:'20px 23px',border:`1px dashed ${C.line}`,borderRadius:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:28}}>Import a document</span><div style={{fontFamily:MONO,fontSize:19,color:C.sky}}>PDF · DOCX · TXT</div>
        </div>
        <div style={{fontSize:23,color:C.muted,marginTop:30,marginBottom:15}}>Review each extracted fact</div>
        {['Python · skill','Analytics dashboard · project'].map((s,i)=><div key={s} style={{display:'flex',alignItems:'center',justifyContent:'space-between',borderTop:`1px solid ${C.line}`,padding:'22px 0',fontSize:29}}>
          <span>{s}</span><Pill label={f>=T.confirmA+i*8?'✓ Confirmed':'Review'} color={f>=T.confirmA+i*8?C.good:C.warning} fs={21}/>
        </div>)}
        <div style={{marginTop:21,display:'flex',gap:16}}><Btn label={checked?'Facts confirmed':'Confirm facts'} primary fs={24} h={53}/><Btn label="Exclude" fs={24} h={53}/></div>
      </div>
      <div style={{...panelStyle(),left:1110,top:234,width:700,height:625,padding:36,boxSizing:'border-box',opacity:prog(f,332,350),transform:`translateX(${(1-ease.expoOut(prog(f,332,355)))*100}px)`}}>
        <div style={{fontFamily:MONO,fontSize:20,color:C.coral,letterSpacing:'.12em'}}>CONFIRMED → RESUME</div>
        <div style={{background:'#f3f7ff',color:'#071253',borderRadius:8,padding:30,marginTop:25,height:300,boxSizing:'border-box'}}>
          <div style={{fontSize:34,fontWeight:700}}>Sam Sample</div><div style={{fontSize:24,marginTop:10}}>DATA ANALYST</div>
          <div style={{height:3,background:C.coral,margin:'24px 0'}}/>
          <div style={{fontSize:25,opacity:prog(f,356,366)}}>Skill: Python</div>
          <div style={{fontSize:25,lineHeight:1.4,marginTop:13,opacity:prog(f,362,372)}}>Project: Analytics dashboard</div>
        </div>
        <div style={{marginTop:25,display:'flex',gap:13,opacity:prog(f,375,395)}}>{['PDF','DOCX','TXT'].map(s=><Btn key={s} label={s} fs={23} h={48}/>)}</div>
        <div style={{fontSize:24,color:C.good,marginTop:25,opacity:prog(f,405,414)}}>✓ Use confirmed facts for matching</div>
      </div>
    </div>
    <PortalSphere opacity={exit}/>
  </AbsoluteFill>;
};
