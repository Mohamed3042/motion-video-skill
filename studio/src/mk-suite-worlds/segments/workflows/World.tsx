import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';

export const World: React.FC = () => {
 const f=useSegFrame(), enter=ease.cubicOut(clamp((f+10)/34)), gate=ease.backOut(clamp((f-EVENTS[0].f)/24));
 const paths=['M835 675 C970 675 939 431 1120 431 S1265 768 1442 768 S1635 454 1780 454','M840 793 C1000 793 944 538 1116 538 S1285 876 1454 876 S1625 561 1780 561','M852 538 C1040 538 1010 838 1196 838 S1280 426 1465 426 S1630 677 1780 677'];
 return <AbsoluteFill style={{background:'#F3F0FF',color:'#2B2255',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{position:'absolute'}}>
 <defs><linearGradient id="wf-tube"><stop stopColor="#D2C9FF"/><stop offset=".5" stopColor="#9C85E7"/><stop offset="1" stopColor="#6750B3"/></linearGradient></defs>
 <circle cx="1470" cy="651" r="400" fill="#E9E3FF"/><circle cx="1470" cy="651" r="358" fill="none" stroke="#D3C8F2"/>
 <g opacity={enter} transform={`translate(${(1-enter)*120} 0)`}>
 {paths.map((d,i)=><g key={d}>
 <path d={d} fill="none" stroke="#CDC4E4" strokeWidth="42" strokeLinecap="round" transform="translate(0 18)" opacity=".6"/>
 <path d={d} fill="none" stroke="url(#wf-tube)" strokeWidth="38" strokeLinecap="round"/>
 <path d={d} fill="none" stroke="#F9F7FF" strokeWidth="6" strokeLinecap="round" opacity=".5" transform="translate(0 -8)"/>
 <path d={d} fill="none" stroke={i===1?'#594095':'#FFFFFF'} strokeWidth="14" strokeLinecap="round" strokeDasharray="1 177" strokeDashoffset={-f*3.2-i*60}/>
 </g>)}
 <g transform="translate(1284 646)"><circle r="109" fill="#F3F0FF" stroke="#D7CEEF" strokeWidth="14"/>
 <circle r="109" fill="none" stroke="#7F61C9" strokeWidth="14" strokeDasharray={`${Math.PI*218*clamp(f/60)} 1000`} transform="rotate(-90)"/>
 <circle r="81" fill="#2C2455"/><path d={`M-29 ${18-35*gate} L-3 ${42-35*gate} L40 ${-6-35*gate}`} fill="none" stroke="#F3F0FF" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity={clamp(gate)}/>
 <path d="M-26 -4 H26" stroke="#F3F0FF" strokeWidth="9" strokeLinecap="round" opacity={1-clamp(gate)}/></g>
 {[0,1,2].map(i=><g key={i} transform={`translate(${1705+i*7} ${354+i*119}) rotate(${(-9+i*9)*gate+Math.sin(f*.003)*3})`}>
 <rect x="-64" y="-37" width="128" height="74" rx="13" fill={i===1?'#2B2255':'#FCFAFF'} stroke="#B4A5D4" strokeWidth="2"/>
 <path d="M-37 -12 H23 M-37 4 H36 M-37 20 H6" stroke={i===1?'#D6C7FF':'#A194C4'} strokeWidth="5"/></g>)}
 </g><path d="M98 587 H649" stroke="#A194EF" strokeWidth="2"/>
 {[0,1,2].map(i=><circle key={i} cx={112+i*39} cy="925" r={i===1?10:5} fill="#8C76C3"/>)}
 </svg>
 <div style={{position:'absolute',left:96,top:160,fontFamily:FONT,fontSize:105,fontWeight:500,lineHeight:1.05,letterSpacing:-5,opacity:clamp((f+4)/16)}}>Managed<br/>Workflows</div>
 <div style={{position:'absolute',left:99,top:650,fontFamily:BODY,fontSize:37,lineHeight:1.9,opacity:clamp((f+4)/26)}}><div>Role-checked approvals</div><div>Retries + audit records</div><div>Discovery-led templates</div></div>
 </AbsoluteFill>;
};
