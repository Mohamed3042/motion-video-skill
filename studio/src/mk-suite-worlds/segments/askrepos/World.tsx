import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';

const lime='#B4F45E';
export const World: React.FC = () => {
 const f=useSegFrame(), open=ease.cubicOut(clamp((f+12)/44)), answer=ease.cubicOut(clamp((f-EVENTS[0].f)/28));
 const offset=clamp((f-EVENTS[1].f)/38)*20;
 return <AbsoluteFill style={{background:'#101C12',color:'#EEFFDD',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{position:'absolute'}}>
 <defs><linearGradient id="repos-strata" x2="0" y2="1"><stop stopColor="#29482A"/><stop offset="1" stopColor="#152719"/></linearGradient><radialGradient id="repos-haze"><stop stopColor="#7FB44D" stopOpacity=".23"/><stop offset="1" stopColor="#101C12" stopOpacity="0"/></radialGradient></defs>
 <ellipse cx="1350" cy="430" rx="660" ry="510" fill="url(#repos-haze)"/>
 {Array.from({length:7},(_,i)=><rect key={i} x={834+i*43} y={134+i*38} width={962-i*86} height={608-i*66} rx="3" fill="none" stroke={lime} strokeOpacity={.05+i*.025}/>)}
 {[4,3,2,1,0].map(i=><g key={i} transform={`translate(${861+i*28+(1-open)*(160-i*15)} ${215+i*115-offset}) skewY(-12)`}>
 <path d="M0 0 H743 V104 H0 Z" fill="url(#repos-strata)" stroke="#6C9450" strokeOpacity=".55"/>
 <path d="M743 0 L797 -32 V72 L743 104 Z" fill="#203520" stroke="#6C9450" strokeOpacity=".45"/>
 <path d="M0 0 L54 -32 H797 L743 0 Z" fill="#314E2D"/>
 <path d="M28 25 L16 40 L28 55 M60 25 L72 40 L60 55" stroke={lime} strokeWidth="3" fill="none" opacity=".7"/>
 {Array.from({length:6},(_,j)=><rect key={j} x={111+j*95} y={25+(j%2)*25} width={44+(j%3)*16} height="7" fill={(j+i)%3===0?lime:'#698861'} opacity=".75"/>)}
 <rect x="110" y="75" width={190+(i%3)*64} height="4" fill="#6C9450"/>
 </g>)}
 <g transform={`translate(1125 ${552-answer*115})`} opacity={answer}>
 <path d="M0 0 H623 L658 33 L623 96 H0 Z" fill={lime}/><path d="M28 31 H467 M28 54 H359 M28 76 H526" stroke="#284D20" strokeWidth="6"/>
 <path d="M599 29 L580 48 L599 68" stroke="#284D20" strokeWidth="5" fill="none"/>
 </g>
 <path d="M1490 276 V390 Q1490 415 1465 415 H1355 M1756 674 V744 Q1756 773 1727 773 H1514" stroke={lime} strokeWidth="3" fill="none" strokeDasharray="9 7" strokeDashoffset={-f*.65}/>
 <circle cx="1490" cy="276" r="9" fill={lime}/><circle cx="1514" cy="773" r="9" fill={lime}/>
 <path d="M102 354 H728 M102 889 H749" stroke={lime} strokeOpacity=".45"/>
 <g transform={`translate(${109+Math.sin(f/60)*8} 466)`}><path d="M0 0 H123 V75 H0 Z" fill="none" stroke={lime} strokeWidth="3"/><path d="M24 26 L39 38 L24 50 M54 51 H87" stroke={lime} strokeWidth="5" fill="none"/><path d="M164 38 H299" stroke={lime} strokeOpacity=".5" strokeDasharray="2 9"/></g>
 </svg>
 <div style={{position:'absolute',left:96,top:174,fontFamily:MONO,fontSize:121,fontWeight:600,letterSpacing:-8,opacity:clamp((f+4)/16)}}>ask-repos</div>
 <div style={{position:'absolute',left:100,top:643,fontFamily:BODY,fontSize:35,lineHeight:1.96,opacity:clamp((f+4)/26)}}><div>Repository indexing</div><div>File + line + commit citations</div><div>Evidence-based answers</div></div>
 </AbsoluteFill>;
};
