import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C,FONT,MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {Title,Btn,Pill,panelStyle,prog,ease,rgba} from '../profile/kit';
const ROWS=[['Data analyst','Sample Analytics Co.','Egypt · Cairo','Observed Sep 30 · 09:40'],['Automation specialist','Example Systems','Kuwait · Kuwait City','Observed Sep 30 · 08:15'],['Operations analyst','Demo Logistics','Saudi Arabia · Riyadh','Observed Sep 29 · 16:30']];
export const World:React.FC=()=>{
 const f=useSectionFrame(),p=ease.inOut(prog(f,108,135)),out=1-prog(f,444,477),gap=Math.floor(f/5)%12;
 return <AbsoluteFill style={{background:C.deep,fontFamily:FONT,color:C.ink}}>
   <svg width={1920} height={1080} style={{position:'absolute',opacity:(1-.91*p)*out}}>
     {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <circle key={i} cx={960+330*Math.cos(a)} cy={570+330*Math.sin(a)} r={35} fill="#da94be" opacity={i===gap?0:.66}/>})}
     <path d="M940 570H980M960 550V590" stroke={C.good} strokeWidth={3}/>
   </svg>
   <Title f={f} idx={3} name="FRESH FINDINGS" promise="New observations. Visible evidence." accent={C.good}/>
   <div style={{position:'absolute',left:112,right:112,top:156,opacity:p*out,transform:`translateY(${(1-p)*50}px)`}}>
     <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div><div style={{fontSize:44,fontWeight:700}}>Your research, newest first.</div><div style={{fontSize:27,color:C.muted,marginTop:12}}>See what was observed — and when.</div></div><Pill label="SAMPLE DATA" color={C.good} fs={20}/></div>
     <div style={{display:'flex',gap:26,marginTop:33}}>
       <div style={{...panelStyle(C.good),position:'relative',width:1020,padding:28,boxSizing:'border-box'}}>
         <div style={{fontFamily:MONO,fontSize:19,color:C.good,letterSpacing:'.12em',marginBottom:21}}>RECENT OBSERVATIONS</div>
         {ROWS.map((r,i)=><div key={r[0]} style={{borderTop:`1px solid ${C.line}`,padding:'24px 18px',background:i===0&&f>=240?rgba(C.good,.09):'transparent',opacity:prog(f,120+i*8,137+i*8)}}>
           <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:32,fontWeight:700}}>{r[0]}</div><Pill label={i===0?'Seen in employer feed':'Opening unverified'} color={i===0?C.good:C.warning} fs={19}/></div>
           <div style={{fontSize:25,color:C.muted,marginTop:10}}>{r[1]} · {r[2]}</div>
           <div style={{fontFamily:MONO,fontSize:20,color:C.sky,marginTop:16}}>{r[3]}</div>
         </div>)}
       </div>
       <div style={{...panelStyle(),position:'relative',width:650,padding:32,boxSizing:'border-box',opacity:prog(f,240,256),transform:`translateX(${(1-ease.expoOut(prog(f,240,263)))*75}px)`}}>
         <div style={{fontSize:31,fontWeight:700}}>Follow the source.</div>
         <div style={{fontSize:25,color:C.muted,lineHeight:1.45,marginTop:16}}>Open the underlying evidence before you decide what to do.</div>
         <div style={{borderLeft:`3px solid ${C.good}`,paddingLeft:22,marginTop:34}}>
           <div style={{fontFamily:MONO,fontSize:19,color:C.good}}>PRIMARY SOURCE</div>
           <div style={{fontSize:29,marginTop:13}}>Company careers page</div>
           <div style={{fontSize:24,color:C.muted,marginTop:13}}>Captured Sep 30, 2026</div>
         </div>
         <div style={{marginTop:31,opacity:prog(f,360,373)}}><Btn label="View source evidence ↗" primary fs={25} h={57}/><div style={{fontSize:24,lineHeight:1.4,color:C.warning,marginTop:27}}>Observed status is dated.<br/>Re-check before applying.</div></div>
       </div>
     </div>
   </div>
 </AbsoluteFill>;
};
