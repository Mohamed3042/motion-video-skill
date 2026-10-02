import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';

const gold='#C8AD66';
const Sheep:React.FC<{x:number;y:number;s?:number}>=({x,y,s=1})=><g transform={`translate(${x} ${y}) scale(${s})`}><ellipse cx="2" cy="22" rx="49" ry="14" fill="#0F231B" opacity=".25"/><path d="M-25 11 V33 M24 11 V33" stroke="#14271D" strokeWidth="9" strokeLinecap="round"/><rect x="-43" y="-19" width="84" height="47" rx="23" fill="#F6EAC6"/><circle cx="-23" cy="-13" r="17" fill="#F6EAC6"/><circle cx="0" cy="-18" r="19" fill="#F6EAC6"/><ellipse cx="39" cy="0" rx="19" ry="25" fill="#182C22"/><path d="M35 -16 L49 -31 L55 -16" fill="#182C22"/></g>;
export const World: React.FC=()=>{
 const f=useSegFrame(), enter=ease.cubicOut(clamp((f+12)/45)), records=ease.backOut(clamp((f-EVENTS[0].f)/32)), theta=f*.003;
 return <AbsoluteFill style={{background:'#233A28',color:'#FAF0D5',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{position:'absolute'}}>
 <defs><radialGradient id="flock-sun"><stop stopColor="#CBBD77" stopOpacity=".23"/><stop offset="1" stopColor="#233A28" stopOpacity="0"/></radialGradient></defs>
 <ellipse cx="1520" cy="287" rx="600" ry="540" fill="url(#flock-sun)"/>
 <circle cx="1640" cy="247" r="88" fill={gold}/><circle cx="1640" cy="247" r="110" fill="none" stroke={gold} strokeOpacity=".2"/>
 <path d="M0 849 C420 607 668 1022 1022 678 S1570 626 1920 298 V1080 H0 Z" fill="#334C30"/>
 <path d="M0 944 C429 683 754 1117 1095 764 S1563 697 1920 392 V1080 H0 Z" fill="#3C5634"/>
 {Array.from({length:19},(_,i)=><path key={i} d={`M-30 ${922+i*22} C440 ${606+i*22} 746 ${1020+i*19} 1090 ${653+i*24} S1590 ${652+i*19} 1970 ${282+i*26}`} fill="none" stroke={gold} strokeOpacity={i%3===0?.21:.10} strokeWidth={i%3===0?2:1} transform={`translate(0 ${Math.sin(f/80+i*.3)*5})`}/>)}
 <g opacity={enter}>
 <ellipse cx="1320" cy="629" rx="327" ry="224" fill="#35513B" fillOpacity=".4" stroke={gold} strokeOpacity=".65" strokeWidth="2" strokeDasharray="2 15" strokeDashoffset={-f*.35}/>
 <ellipse cx="1320" cy="629" rx="274" ry="178" fill="none" stroke="#91A064" strokeOpacity=".3"/>
 {[0,1,2,3].map(i=>{const a=i*Math.PI/2+theta;return <Sheep key={i} x={1320+279*Math.cos(a)} y={622+171*Math.sin(a)} s={.65+.25*(Math.sin(a)+1)/2}/>;})}
 <Sheep x={1330} y={630} s={1.65}/>
 {[0,1,2].map(i=><g key={i} transform={`translate(${1070+i*244} ${533+(i%2)*249}) scale(${Math.max(0,records)})`}>
 <path d="M0 18 V-59" stroke={gold} strokeWidth="3"/><path d="M0 -53 C37 -87 91 -75 76 -36 C39 -9 10 -27 0 -53 Z" fill={gold}/><path d="M15 -48 L58 -54" stroke="#294330" strokeWidth="4"/><circle cy="18" r="7" fill={gold}/></g>)}
 </g><path d="M99 630 H652" stroke={gold} strokeWidth="2"/>
 </svg>
 <div style={{position:'absolute',left:96,top:149,fontFamily:FONT,fontSize:106,fontWeight:500,letterSpacing:-5,lineHeight:1.04,opacity:clamp((f+4)/16)}}>Flock<br/>Operations</div>
 <div style={{position:'absolute',left:99,top:699,fontFamily:BODY,fontSize:37,lineHeight:1.87,opacity:clamp((f+4)/26)}}><div>Flock + lifecycle records</div><div>Costs + worker updates</div><div>Attributed change history</div></div>
 </AbsoluteFill>;
};
