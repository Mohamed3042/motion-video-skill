import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease,smooth} from '../../util';
import {EVENTS} from './timing';

export const World:React.FC=()=>{
 const f=useSegFrame(),p=ease.expoOut(clamp((f+10)/30)),beam=smooth(12,EVENTS[0].f,f);
 const lift=Math.sin(f/35)*12;
 return <AbsoluteFill style={{background:'#EEE9FF',overflow:'hidden'}}>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute'}}>
   <defs><linearGradient id="ta-gem" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FCF9FF"/><stop offset=".52" stopColor="#BA9BFD"/><stop offset="1" stopColor="#7353BB"/></linearGradient><radialGradient id="ta-globe"><stop stopColor="#F9F7FF"/><stop offset="1" stopColor="#D2C4F0"/></radialGradient></defs>
   <circle cx="653" cy="555" r="290" fill="url(#ta-globe)"/>
   <g opacity=".45" stroke="#9677C4" fill="none">
    {[80,160,240,290].map(r=><ellipse key={r} cx="653" cy="555" rx={r} ry="290" strokeWidth="1.5"/>)}
    {[-210,-140,-70,0,70,140,210].map(y=><ellipse key={y} cx="653" cy={555+y} rx={Math.sqrt(290*290-y*y)} ry={Math.max(1,65-Math.abs(y)*.2)} strokeWidth="1.5"/>)}
   </g>
   <ellipse cx="653" cy="786" rx="355" ry="80" fill="none" stroke="#B99DDD" strokeWidth="1.5"/>
   <g opacity={beam}>
    <path d={`M 792 ${375+lift} L 1390 580 L 1335 635 Z`} fill="#C2A3F0" fillOpacity=".4"/>
    <path d={`M 792 ${375+lift} L 1630 438 L 1630 478 Z`} fill="#AD8CEC" fillOpacity=".3"/>
    <path d={`M 792 ${375+lift} L 1630 753 L 1560 793 Z`} fill="#9D86D6" fillOpacity=".25"/>
   </g>
   <g transform={`translate(650 ${347+lift+(1-p)*-150})`} opacity={p}>
    <path d="M -220 -65 L -110 -180 L 105 -180 L 225 -65 L 0 188 Z" fill="url(#ta-gem)" stroke="#FFFFFF" strokeWidth="4"/>
    <path d="M -220 -65 H 225 M -110 -180 L -77 -65 L 0 188 L 75 -65 L 105 -180 M -77 -65 L 0 -180 L 75 -65" fill="none" stroke="#F9F5FF" strokeWidth="3"/>
    <path d="M -220 -65 L -77 -65 L 0 188 Z" fill="#6F4AA5" fillOpacity=".3"/><path d="M 75 -65 L 225 -65 L 0 188 Z" fill="#55328F" fillOpacity=".26"/>
    <circle cx="-130" cy="-92" r="12" fill="#FFFFFF"/>
   </g>
   {[{x:1390,y:610,s:1},{x:1640,y:444,s:.82},{x:1600,y:770,s:1.1}].map((a,i)=><g key={i} transform={`translate(${a.x} ${a.y}) scale(${a.s*p})`}><circle cy="-55" r="27" fill={i===1?'#A180D1':'#7853AF'}/><path d="M -51 45 V -1 Q -48 -26 -26 -27 H 26 Q 49 -26 51 -1 V 45 Z" fill="#D6C5F2" stroke="#9671CA" strokeWidth="2"/><circle r="98" fill="none" stroke="#A280D1" strokeWidth="1.5" strokeDasharray="3 9"/></g>)}
   <path d="M 94 942 H 1812" stroke="#BEAADF"/>
  </svg>
  <div style={{position:'absolute',left:99,top:839,fontFamily:FONT,fontSize:108,fontWeight:700,letterSpacing:-5,color:'#4F327A',opacity:p}}>Talent Atlas</div>
  <div style={{position:'absolute',left:1110,top:118,fontFamily:BODY,fontSize:35,lineHeight:1.8,color:'#654690',opacity:ease.expoOut(clamp((f+2)/28))}}>
   <div>Candidate + role evidence</div><div>Human review</div><div>Regional planning</div>
  </div>
 </AbsoluteFill>;
};
