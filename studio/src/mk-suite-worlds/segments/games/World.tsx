import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';

const pink='#EF76FF';
const ship='M0 -40 L16 -10 L48 18 L28 26 L11 18 L0 41 L-11 18 L-28 26 L-48 18 L-16 -10 Z';
export const World:React.FC=()=>{
 const f=useSegFrame(), enter=ease.cubicOut(clamp((f+12)/36)), pulse=f<EVENTS[0].f?0:Math.exp(-(f-EVENTS[0].f)/25), constellation=ease.cubicOut(clamp((f-EVENTS[1].f)/72));
 const points=[[1020,289],[1614,265],[1768,626],[1218,807]];
 return <AbsoluteFill style={{background:'#110A30',color:'#FFF0FF',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{position:'absolute'}}>
 <defs><linearGradient id="games-copy"><stop stopColor="#110A30" stopOpacity=".96"/><stop offset=".72" stopColor="#110A30" stopOpacity=".82"/><stop offset="1" stopColor="#110A30" stopOpacity="0"/></linearGradient><radialGradient id="games-aura"><stop stopColor="#773BBD" stopOpacity=".6"/><stop offset="1" stopColor="#110A30" stopOpacity="0"/></radialGradient><linearGradient id="games-sun" x2="0" y2="1"><stop stopColor="#FFAD6D"/><stop offset=".5" stopColor="#F578E8"/><stop offset="1" stopColor="#763FBA"/></linearGradient><clipPath id="games-disc"><circle cx="1390" cy="435" r="265"/></clipPath></defs>
 <ellipse cx="1390" cy="470" rx="790" ry="580" fill="url(#games-aura)"/>
 <g clipPath="url(#games-disc)" opacity=".34"><rect x="1110" y="158" width="560" height="570" fill="url(#games-sun)"/>{Array.from({length:12},(_,i)=><rect key={i} x="1110" y={410+i*26} width="560" height={3+i*1.4} fill="#110A30"/>)}</g>
 <path d="M0 797 L938 628 L1268 544 L1920 726 V1080 H0 Z" fill="#20113F"/>
 {Array.from({length:17},(_,i)=><path key={i} d={`M1268 544 L${-350+i*170} 1110`} stroke="#9D46B6" strokeOpacity=".35" strokeWidth="2"/>)}
 {Array.from({length:10},(_,i)=>{const z=((i+f/40)%10)/10,y=557+Math.pow(z,2)*570;return <path key={i} d={`M0 ${y} H1920`} stroke="#CE5CCD" strokeOpacity={.15+z*.18} strokeWidth="2"/>;})}
 <path d="M808 785 L913 625 L990 722 L1089 559 L1190 734 L1310 543 L1460 732 L1635 561 L1880 770" fill="#221A49" stroke="#9A5FBD" strokeWidth="2"/>
 <g transform={`translate(1379 493) scale(${.9+enter*.1+pulse*.035})`}>
 {[4,3,2,1,0].map(i=>{const s=.42+i*.175,rotate=(i%2?1:-1)*(10+Math.sin(f/60)*7)*(1-constellation*.6);return <g key={i} transform={`rotate(${rotate}) scale(${s})`}><path d="M-278 -271 H192 L309 -154 V247 H-179 L-278 148 Z" fill="none" stroke={i%2?'#816AEF':pink} strokeWidth={i===4?7:3} opacity={.32+i*.13}/><path d="M-273 -185 V-266 H-192 M226 243 H304 V166" fill="none" stroke="#FFE1FF" strokeWidth="6" opacity=".75"/></g>;})}
 <path d={ship} transform={`translate(${Math.sin(f/48)*53} ${30+Math.cos(f/37)*20}) scale(1.9)`} fill="#EFC9FF" stroke="#9A54DD" strokeWidth="4"/>
 <path d="M-24 118 L0 213 L24 118 Z" fill={pink} opacity={.4+pulse*.5}/>
 </g>
 <path d="M1020 289 L1614 265 L1768 626 L1218 807 Z" stroke="#F6B3FF" strokeWidth="2" fill="none" strokeDasharray="8 10" opacity={constellation*.65}/>
 {points.map(([x,y],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${i*15+Math.sin(f/65+i)*6})`} opacity={.55+constellation*.45}>
 {i===0?<path d="M0 -53 L54 0 L0 53 L-54 0 Z" fill="#2E1655" stroke="#FFB68B" strokeWidth="4"/>:i===1?<circle r="48" fill="#25134A" stroke="#9A88FF" strokeWidth="4"/>:i===2?<rect x="-46" y="-46" width="92" height="92" rx="19" fill="#2E1655" stroke={pink} strokeWidth="4"/>:<path d="M0 -53 L54 40 L-54 40 Z" fill="#25134A" stroke="#76D9EF" strokeWidth="4"/>}
 <path d={ship} transform="scale(.46)" fill="#F7DCFF"/></g>)}
 {Array.from({length:25},(_,i)=><circle key={i} cx={822+((i*137)%984)} cy={95+((i*83)%751)} r={i%4===0?2.4:1.3} fill="#F5D1FF" opacity={.25+.3*Math.sin(i+f/75)**2}/>)}
 <rect x="0" y="520" width="820" height="277" fill="url(#games-copy)"/><path d="M100 481 H699" stroke={pink} strokeWidth="2"/>
 </svg>
 <div style={{position:'absolute',left:96,top:167,fontFamily:FONT,fontSize:125,fontWeight:700,letterSpacing:-6,lineHeight:1,opacity:clamp((f+4)/16)}}>MK Games</div>
 <div style={{position:'absolute',left:100,top:551,fontFamily:BODY,fontSize:37,lineHeight:1.92,opacity:clamp((f+4)/26)}}><div>Game library + showcases</div><div>Signed updates + rollback</div><div>Phone browse companion</div></div>
 </AbsoluteFill>;
};
