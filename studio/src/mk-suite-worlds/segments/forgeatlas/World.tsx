import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
export const World:React.FC=()=>{const f=useSegFrame(),p=ease.cubicOut(clamp((f+8)/28)),assemble=ease.cubicOut(clamp(f/EVENTS[0].f)),drift=Math.sin(f*.014)*15;
return <AbsoluteFill style={{background:'#0B1927',fontFamily:FONT,color:'#E8F6FF',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
  <defs><pattern id="atlasgrid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M72 0 H0 V72" fill="none" stroke="#203345"/></pattern></defs><rect width="1000" height="1080" fill="url(#atlasgrid)" opacity=".4"/>
  <g transform={`translate(583 ${530+drift}) scale(${.85+.15*p})`}>
   <ellipse cx="0" cy="327" rx="365" ry="66" fill="#030D16"/>
   <g fill="none" stroke="#6DC8FA" strokeWidth="2" opacity=".64" transform={`translate(0 ${-(1-assemble)*120})`}><path d="M0 -374 L340 -202 L0 -31 L-340 -202Z M-340 -202 V160 L0 337 L340 160 V-202 M0 -31 V337"/><path d="M0 -374 V-7 M-340 160 L0 -7 L340 160" strokeDasharray="9 12" opacity=".4"/></g>
   <g transform={`translate(0 ${(1-assemble)*70})`}><path d="M-281 132 L-174 -56 L-95 28 L19 -214 L202 95 L270 142 L0 274Z" fill="#376686" stroke="#81B6D7" strokeWidth="2"/><path d="M19 -214 L44 76 L0 274 L-95 28Z" fill="#669ABA"/><path d="M19 -214 L202 95 L44 76Z" fill="#B6DDEF"/><path d="M-174 -56 L-152 147 L-281 132Z" fill="#88B1C8"/><path d="M-95 28 L-152 147 L0 274Z" fill="#27546F"/><path d="M44 76 L202 95 L0 274Z" fill="#4D7F9E"/><path d="M202 95 L270 142 L0 274Z" fill="#234A65"/><path d="M-174 -56 L-152 147 L44 76 L270 142 M-281 132 L0 274 L19 -214" fill="none" stroke="#B2E5FF" strokeWidth="1.4" opacity=".75"/></g>
   {[0,1,2].map(i=><g key={i} transform={`translate(${-300-i*13} ${-330+i*58-(1-assemble)*i*60}) rotate(-26)`}><rect width="166" height="108" fill="#143148" stroke="#588CAF"/><path d="M16 77 L46 38 L79 60 L113 22 L149 77Z" fill="none" stroke="#97CDEE"/></g>)}
  </g>
  <path d="M1035 126 V944 M1048 126 H1118 M1048 944 H1118" fill="none" stroke="#49728B" opacity=".6"/>
 </svg>
 <div style={{position:'absolute',left:1110,top:230,opacity:p,transform:`translateX(${(1-p)*40}px)`}}><div style={{fontSize:107,fontWeight:700,letterSpacing:-6,lineHeight:.98}}>Forge<br/><span style={{color:'#6DC8FA'}}>Atlas</span></div><div style={{width:420,height:2,background:'#417089',margin:'52px 0 35px'}}/><div style={{fontFamily:BODY,fontSize:35,lineHeight:1.9,color:'#B9D0DF'}}>{['Asset + project library','Geometry previews','Blender handoff'].map(t=><div key={t}>{t}</div>)}</div></div>
</AbsoluteFill>};
