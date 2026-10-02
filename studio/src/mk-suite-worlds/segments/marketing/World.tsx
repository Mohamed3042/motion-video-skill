import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';

export const World: React.FC = () => {
 const f=useSegFrame(), reveal=ease.cubicOut(clamp((f+12)/38)), blast=f<EVENTS[0].f?0:Math.exp(-(f-EVENTS[0].f)/21), fan=ease.cubicOut(clamp((f-25)/90));
 return <AbsoluteFill style={{background:'#F8E8D7',color:'#122D47',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{position:'absolute'}}>
 <defs><linearGradient id="mkt-cone" x2="1" y2="1"><stop stopColor="#FFBB94"/><stop offset=".4" stopColor="#F47352"/><stop offset="1" stopColor="#BC442D"/></linearGradient></defs>
 <path d="M1080 0 L1920 0 L1920 1080 L1610 1080 Z" fill="#F0D6C1"/><circle cx="1690" cy="163" r="49" fill="#F47352"/>
 <g transform={`translate(${(1-reveal)*300} 0)`}>
 <path d="M866 530 L1390 206 L1470 724 L935 682 Z" fill="url(#mkt-cone)"/>
 <path d="M866 530 L934 682 L971 656 L910 505 Z" fill="#142C45"/>
 <path d="M1028 688 L1102 893 L1186 865 L1142 668 Z" fill="#142C45"/>
 <ellipse cx="1430" cy="463" rx="153" ry="285" fill="#152E48" transform="rotate(-9 1430 463)"/>
 <ellipse cx="1430" cy="463" rx="130" ry="257" fill="#D2543B" transform="rotate(-9 1430 463)"/>
 <ellipse cx="1430" cy="463" rx="87" ry="176" fill="#F9B78E" transform="rotate(-9 1430 463)"/>
 <ellipse cx="1430" cy="463" rx="37" ry="87" fill="#173147" transform="rotate(-9 1430 463)"/>
 {[0,1,2,3].map(i=><ellipse key={i} cx={1532+i*82+blast*22} cy={446-i*9} rx={113+i*6} ry={234+i*32} fill="none" stroke="#F47352" strokeWidth={10-i*1.8} opacity={.7-i*.12} transform={`rotate(-9 ${1532+i*82} ${446-i*9})`}/>)}
 {[0,1,2].map(i=><g key={i} transform={`translate(${1360+i*116*fan} ${722+i*14}) rotate(${-18+i*19*fan} 95 104)`}>
 <rect width="181" height="224" fill={i===1?'#F47352':'#FFFAED'} stroke="#142C45" strokeWidth="2"/><rect x="20" y="21" width="141" height="89" fill={i===1?'#142C45':'#F47352'}/><circle cx="90" cy="66" r="25" fill={i===1?'#F6D9BD':'#142C45'}/><path d="M20 140 H150 M20 160 H115 M20 180 H139" stroke="#173147" strokeWidth="6"/></g>)}
 </g><path d="M115 577 C360 668 558 552 784 600" fill="none" stroke="#F47352" strokeWidth="2"/>
 <circle cx={135+clamp(f/120)*570} cy={599+Math.sin(f/36)*17} r="9" fill="#F47352"/><path d="M102 906 H643" stroke="#183249" strokeWidth="2"/>
 </svg>
 <div style={{position:'absolute',left:96,top:150,fontFamily:FONT,fontSize:107,fontWeight:700,letterSpacing:-6,lineHeight:1.02,opacity:clamp((f+4)/16)}}>Marketing<br/>Automation</div>
 <div style={{position:'absolute',left:100,top:672,fontFamily:BODY,fontSize:38,lineHeight:1.86,opacity:clamp((f+4)/26)}}><div>Contacts + consent</div><div>Campaign drafts</div><div>Follow-up planning</div></div>
 </AbsoluteFill>;
};
