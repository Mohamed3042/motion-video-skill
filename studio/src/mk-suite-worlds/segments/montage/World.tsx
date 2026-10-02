import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
export const World:React.FC=()=>{const f=useSegFrame(),p=ease.cubicOut(clamp((f+8)/27)),lock=ease.cubicOut(clamp((f-12)/(EVENTS[0].f-12)));
return <AbsoluteFill style={{background:'#1B0711',fontFamily:FONT,color:'#FFF3F1',overflow:'hidden'}}>
 <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 77% 48%,#73203C88,transparent 58%)'}}/>
 <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
  <defs><linearGradient id="montA" x2="1" y2="1"><stop stopColor="#FE9A76"/><stop offset="1" stopColor="#67357E"/></linearGradient><linearGradient id="montB" x2="0" y2="1"><stop stopColor="#693159"/><stop offset="1" stopColor="#FD5A6E"/></linearGradient></defs>
  <g transform="translate(794 153) rotate(-8)">
   {[0,1,2].map((i)=><g key={i} transform={`translate(${(1-lock)*(i%2?-280:360)+Math.sin(f*.012+i)*8} ${i*254})`}>
    <rect x="-90" y="0" width="1390" height="219" rx="8" fill="#0D090E" stroke="#B9526C" strokeWidth="2"/>
    {Array.from({length:25},(_,j)=><g key={j} fill="#DDADBD" opacity=".7"><rect x={j*53-63} y="11" width="24" height="13" rx="3"/><rect x={j*53-63} y="195" width="24" height="13" rx="3"/></g>)}
    {[0,1,2,3].map(j=><g key={j} transform={`translate(${j*310-60} 35)`}><rect width="294" height="150" fill={i%2?'url(#montB)':'url(#montA)'}/><circle cx={70+j*15} cy="51" r={25+i*7} fill="#FFD9B6" opacity=".8"/><path d={`M0 145 L${80+j*20} ${65+i*14} L160 123 L232 58 L294 150Z`} fill={i%2?'#321D44':'#3D254D'}/><path d="M0 146 Q60 97 140 144 T294 117 V150 H0Z" fill="#141326" opacity=".65"/></g>)}
   </g>)}
   <path d="M590 -23 V773" stroke="#FFF5E9" strokeWidth="5"/><path d="M571 -34 L609 -34 L590 -11Z" fill="#FFF5E9"/>
  </g>
  {[0,1,2].map(i=><path key={i} d={`M114 ${864+i*20} H${510+i*45}`} stroke="#FF536A" strokeWidth="3" opacity={.3+i*.2}/>)}
 </svg>
 <div style={{position:'absolute',left:104,top:160,opacity:p,transform:`translateY(${(1-p)*28}px)`}}><div style={{fontSize:110,fontWeight:700,lineHeight:.97,letterSpacing:-6}}>Montage<br/><span style={{color:'#FF536A'}}>Pro</span></div></div>
 <div style={{position:'absolute',left:110,top:545,fontFamily:BODY,fontSize:34,lineHeight:1.85,opacity:p,color:'#E8BBC9'}}>{['Multicamera alignment','Camera + audio selection','XML + captions + markers'].map(t=><div key={t}>{t}</div>)}</div>
</AbsoluteFill>};
