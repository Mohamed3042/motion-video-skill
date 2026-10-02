import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
export const World:React.FC=()=>{const f=useSegFrame(),p=ease.cubicOut(clamp((f+9)/26)),open=ease.cubicOut(clamp((f+3)/EVENTS[0].f));
return <AbsoluteFill style={{background:'#F5EEDC',fontFamily:FONT,color:'#28457F',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
  <circle cx="1506" cy="255" r="144" fill="#DBB96C" opacity=".65"/>
  <g transform={`translate(1506 255) rotate(${f*.09})`} stroke="#A98D52" strokeWidth="2">{Array.from({length:16},(_,i)=><path key={i} d="M169 0 H194" transform={`rotate(${i*22.5})`}/>)}</g>
  <path d="M141 434 H631 M141 459 H475" stroke="#C3BB9F" strokeWidth="2"/>
  <g transform={`translate(1062 731) scale(${.88+.12*p})`}>
   <ellipse cy="65" rx="556" ry="64" fill="#203968" opacity=".08"/>
   <path d="M-530 -17 L-51 143 L0 99 L51 143 L530 -17 L520 -76 L0 40 L-520 -76Z" fill="#435F99"/>
   {Array.from({length:9},(_,i)=>{const spread=open*(i*13+4);return <g key={i}><path d={`M0 91 Q${-180-spread} ${-47-i*5} ${-490-spread*.4} ${-71-i*13} L${-469-spread*.8} ${-432-i*8} Q${-204-spread} ${-436-i*10} 0 ${-217-i*17}Z`} fill={i%2?'#FFF9E8':'#EEE7D2'} stroke="#C6BDA4" strokeWidth="1.4"/><path d={`M0 91 Q${180+spread} ${-47-i*5} ${490+spread*.4} ${-71-i*13} L${469+spread*.8} ${-432-i*8} Q${204+spread} ${-436-i*10} 0 ${-217-i*17}Z`} fill={i%2?'#FFFCEE':'#EDE6D1'} stroke="#C6BDA4" strokeWidth="1.4"/></g>})}
   <path d="M0 -354 V92" stroke="#7582A1" strokeWidth="3"/>
   {Array.from({length:8},(_,i)=><g key={i} fill="none" stroke="#7E8CAC" strokeWidth="3" opacity=".65"><path d={`M-493 ${-420+i*32} Q-311 ${-405+i*32} -65 ${-320+i*35}`}/><path d={`M65 ${-320+i*35} Q311 ${-405+i*32} 493 ${-420+i*32}`}/></g>)}
   <g fill="#526CBB"><circle cx="-341" cy="-174" r="9"/><circle cx="321" cy="-252" r="9"/><circle cx="395" cy="-139" r="9"/></g>
   <path d="M-341 -174 Q-300 -93 -187 -45 M321 -252 Q227 -152 231 -65 M395 -139 Q470 -15 430 57" fill="none" stroke="#526CBB" strokeWidth="2" strokeDasharray="5 7"/>
  </g>
 </svg>
 <div style={{position:'absolute',left:119,top:147,opacity:p}}><div style={{fontSize:104,fontWeight:700,lineHeight:1.04,letterSpacing:-6}}>MK<br/>Educate</div></div>
 <div style={{position:'absolute',left:123,top:920,width:1685,display:'flex',justifyContent:'space-between',gap:30,fontFamily:BODY,fontSize:32,color:'#435981',opacity:p}}>{['Curriculum contexts','Reviewed source pages','Arabic + English workspace'].map((t,i)=><div key={t} style={{borderTop:'2px solid #B5BECC',paddingTop:19,width:i===2?510:430}}>{t}</div>)}</div>
</AbsoluteFill>};
