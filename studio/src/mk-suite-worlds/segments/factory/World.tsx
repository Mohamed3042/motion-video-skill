import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';

const orange='#FF9250';
const Cube:React.FC<{x:number;y:number;size?:number}>=({x,y,size=1})=><g transform={`translate(${x} ${y}) scale(${size})`}><path d="M0 -53 L61 -18 L0 17 L-61 -18 Z" fill="#FFB584"/><path d="M-61 -18 L0 17 V88 L-61 52 Z" fill="#D96935"/><path d="M61 -18 L0 17 V88 L61 52 Z" fill="#FF9250"/><path d="M0 17 V88 M-61 -18 L0 17 L61 -18" stroke="#6B311E" strokeOpacity=".5" strokeWidth="2" fill="none"/></g>;
export const World: React.FC=()=>{
 const f=useSegFrame(), infeed=ease.cubicInOut(clamp(f/60)), review=ease.cubicOut(clamp((f-EVENTS[0].f)/38)), project=ease.cubicOut(clamp((f-EVENTS[1].f)/62)), drift=Math.sin(f/27)*4;
 const cx=990+infeed*286+project*328, cy=614+drift-project*54;
 const armX=1220+review*260, armY=418+Math.sin(clamp((f-32)/80)*Math.PI)*105;
 return <AbsoluteFill style={{background:'#171C26',color:'#F8EEE2',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{position:'absolute'}}>
 <defs><clipPath id="factory-beltclip"><path d="M858 733 L1228 889 L1810 652 L1443 506 Z"/></clipPath><radialGradient id="factory-haze"><stop stopColor="#FF8A44" stopOpacity=".17"/><stop offset="1" stopColor="#171C26" stopOpacity="0"/></radialGradient><linearGradient id="factory-belt" x2="0" y2="1"><stop stopColor="#566073"/><stop offset="1" stopColor="#252C39"/></linearGradient></defs>
 <ellipse cx="1340" cy="628" rx="650" ry="510" fill="url(#factory-haze)"/>
 {Array.from({length:20},(_,i)=><path key={i} d={`M${770+i*55} 157 V995`} stroke="#657084" strokeOpacity=".07"/>)}
 <path d="M858 733 L1228 889 L1810 652 L1443 506 Z" fill="#272E3D" stroke="#8790A3" strokeWidth="2"/>
 <path d="M858 733 V794 L1228 950 V889 Z" fill="#202531" stroke="#454D5F" strokeWidth="2"/>
 <path d="M1228 889 V950 L1810 713 V652 Z" fill="url(#factory-belt)" stroke="#454D5F" strokeWidth="2"/>
 <g clipPath="url(#factory-beltclip)">{Array.from({length:14},(_,i)=>{const x=915+i*58+((f*1.6)%58);return <path key={i} d={`M${x} ${756-(x-915)*.402} l161 68`} stroke="#8F98AB" strokeWidth="5" strokeOpacity=".35"/>;})}</g>
 <path d="M948 507 V268 H1750 V627" fill="none" stroke="#464F60" strokeWidth="33"/>
 <path d="M948 507 V268 H1750 V627" fill="none" stroke="#A1A6B1" strokeWidth="3"/>
 <path d="M967 277 H1731" stroke={orange} strokeWidth="6" strokeDasharray="15 8"/>
 <rect x={armX-66} y="240" width="132" height="69" rx="8" fill="#717986" stroke="#FFB484" strokeWidth="3"/>
 <path d={`M${armX} 310 L${armX} ${armY} L${cx-20} ${cy-104}`} stroke="#606A7C" strokeWidth="30" fill="none" strokeLinejoin="round"/>
 <path d={`M${armX} 310 L${armX} ${armY} L${cx-20} ${cy-104}`} stroke="#FFAE77" strokeWidth="5" fill="none" strokeLinejoin="round"/>
 <circle cx={armX} cy={armY} r="27" fill="#222936" stroke={orange} strokeWidth="8"/>
 <path d={`M${cx-58} ${cy-97} V${cy-66} M${cx+20} ${cy-97} V${cy-66} M${cx-58} ${cy-97} H${cx+20}`} stroke="#CED2D9" strokeWidth="10" fill="none"/>
 <g opacity={1-project*.6}><Cube x={cx} y={cy}/></g>
 <g transform="translate(1282 541)" opacity={review*(1-project*.8)}><ellipse rx="111" ry="147" fill="none" stroke="#6DAFBC" strokeWidth="4"/><ellipse rx="82" ry="113" fill="none" stroke="#B0F2EF" strokeWidth="2"/><path d="M-129 0 H129 M0 -168 V168" stroke="#B0F2EF" strokeOpacity=".35"/></g>
 <g transform={`translate(1599 521) scale(${.2+project*.8})`} opacity={project}>
 <Cube x={0} y={0} size={1.18}/>
 {[-1,1].map(i=><g key={i} transform={`translate(${i*102} ${-i*44}) skewY(${i*17})`}><rect x="-47" y="-70" width="94" height="136" rx="5" fill="#F8EEE2" stroke="#FF9250" strokeWidth="3"/><path d="M-31 -42 H28 M-31 -19 H18 M-31 3 H31 M-31 26 H13" stroke="#5B5960" strokeWidth="5"/></g>)}
 </g>
 <path d="M99 506 H666" stroke={orange} strokeWidth="3"/><path d="M99 947 H666" stroke="#687180" strokeOpacity=".5"/>
 </svg>
 <div style={{position:'absolute',left:96,top:167,fontFamily:FONT,fontSize:116,fontWeight:700,letterSpacing:-6,lineHeight:1.04,opacity:clamp((f+4)/16)}}>MK<br/>Factory</div>
 <div style={{position:'absolute',left:99,top:651,fontFamily:BODY,fontSize:36,lineHeight:1.92,opacity:clamp((f+4)/26)}}><div>Business intake + AI review</div><div>Visual references</div><div>Tasks + release records</div></div>
 </AbsoluteFill>;
};
