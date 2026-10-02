import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
export const World:React.FC=()=>{const f=useSegFrame(),p=ease.cubicOut(clamp((f+6)/26)),fold=ease.cubicOut(clamp((f-10)/EVENTS[0].f));
return <AbsoluteFill style={{background:'#F1F3FF',fontFamily:FONT,color:'#183277',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
  <defs><pattern id="editorGrid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0 H0 V60" fill="none" stroke="#DCE2F5"/></pattern><linearGradient id="editorFace"><stop stopColor="#426AFE"/><stop offset="1" stopColor="#2148D2"/></linearGradient></defs>
  <rect width="1920" height="1080" fill="url(#editorGrid)"/>
  <g transform={`translate(1210 520) scale(${.86+.14*p}) rotate(${(1-fold)*-13})`}>
   <ellipse cx="28" cy="313" rx="365" ry="63" fill="#1E47D3" opacity=".1"/>
   <g fill="none" stroke="#758EE0" strokeWidth="2" strokeDasharray="10 10" opacity={1-fold*.75}><path d="M-270 -160 H270 V160 H-270 Z M-90 -340 V340 M90 -340 V340 M-270 -160 L-440 -160 V160 H-270 M270 -160 H440 V160 H270 M-90 -340 H90 M-90 340 H90"/></g>
   <g transform={`translate(0 ${(1-fold)*80})`}>
    <path d={`M-230 -140 L0 ${-270*fold} L230 -140 L0 ${-10-35*fold}Z`} fill="#85A0FF" stroke="#315AE0" strokeWidth="2"/>
    <path d="M-230 -140 L0 -45 L0 294 L-230 168Z" fill="#476EFF"/>
    <path d="M0 -45 L230 -140 L230 168 L0 294Z" fill="url(#editorFace)"/>
    <path d={`M-230 -140 L${-230-(1-fold)*200} ${-270+(1-fold)*100} L${0-(1-fold)*150} ${-366+(1-fold)*100} L0 -270Z`} fill="#CDD8FF" stroke="#6A88F0" strokeWidth="2"/>
    <path d={`M0 -270 L${0+(1-fold)*180} ${-366+(1-fold)*100} L${230+(1-fold)*220} ${-271+(1-fold)*100} L230 -140Z`} fill="#A7BCFF" stroke="#6A88F0" strokeWidth="2"/>
    <path d="M-165 -24 L-165 103 M-137 -10 L-137 117 M-110 3 L-110 132 M-82 17 L-82 144" stroke="#EEF2FF" strokeWidth="9"/>
    <circle cx="114" cy="83" r="42" fill="none" stroke="#B5C8FF" strokeWidth="3" transform="skewY(-25)"/>
   </g>
   {[-350,350].flatMap(x=>[-300,290].map(y=><g key={`${x}${y}`} transform={`translate(${x} ${y})`} stroke="#ED823C" strokeWidth="3"><path d="M-17 0 H17 M0 -17 V17"/><circle r="28" fill="none" strokeWidth="1"/></g>))}
  </g>
 </svg>
 <div style={{position:'absolute',left:106,top:144,opacity:p}}><div style={{fontSize:104,fontWeight:700,lineHeight:1,letterSpacing:-6}}>MK Editor</div><div style={{marginTop:35,width:118,height:118,border:'2px solid #476EFF',transform:`rotate(${f*.12})`,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{width:64,height:64,background:'#476EFF',transform:'rotate(45deg)'}}/></div></div>
 <div style={{position:'absolute',left:108,top:643,fontFamily:BODY,fontSize:36,lineHeight:1.9,opacity:p}}>{['Box + pouch layouts','Artwork + font checks','Printer approval handoffs'].map(t=><div key={t}>{t}</div>)}</div>
</AbsoluteFill>};
