import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
export const World:React.FC=()=>{const f=useSegFrame(),p=ease.cubicOut(clamp((f+9)/27)),float=Math.sin(f*.025)*12,turn=Math.sin(f*.017)*.12,flash=Math.max(0,1-(f-EVENTS[0].f)/24);
return <AbsoluteFill style={{background:'#160D25',fontFamily:FONT,color:'#F7EDFF',overflow:'hidden'}}>
 <div style={{position:'absolute',right:70,top:80,width:1050,height:950,background:'radial-gradient(ellipse,#7145A955,transparent 63%)'}}/>
 <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
  <g transform="translate(1300 850)">{[310,370,420].map((r,i)=><ellipse key={r} rx={r} ry={r*.24} fill={i===0?'#3D255C':'none'} stroke="#B88CEB" strokeWidth={i===2?1:2} opacity={.3+i*.13}/>)}<ellipse rx="272" ry="50" fill="#0D0814"/></g>
  <g transform={`translate(1300 ${390+float}) scale(${p*(1+turn)} ${p})`} stroke="#DABFFF" strokeLinejoin="round">
   <path d="M-58 -212 L0 -247 L58 -212 L67 -145 L0 -114 L-67 -145Z" fill="#B295D4"/><path d="M0 -247 V-114 L67 -145 L58 -212Z" fill="#5F4484"/>
   <path d="M-51 -117 H51 L129 -66 L93 156 L0 205 L-93 156 L-129 -66Z" fill="#8253B0"/><path d="M0 -102 L129 -66 L93 156 L0 205Z" fill="#5C387F"/>
   <path d="M-129 -66 L-189 -5 L-218 124 L-189 151 L-154 90 L-105 22Z M129 -66 L189 -5 L218 124 L189 151 L154 90 L105 22Z" fill="#9374B4"/>
   <path d="M-94 163 L-8 202 L-25 415 L-99 415Z M8 202 L94 163 L99 415 L25 415Z" fill="#6A468D"/><path d="M-25 415 L-101 415 L-122 446 H-17Z M25 415 L101 415 L122 446 H17Z" fill="#C0A0DE"/>
   <path d="M-142 -81 L-65 -124 L0 -94 L65 -124 L142 -81 L160 80 L102 99 L85 -10 L100 166 L0 208 L-100 166 L-85 -10 L-102 99 L-160 80Z" fill={`hsl(${265+Math.sin(f*.018)*32},53%,66%)`} opacity=".65" strokeWidth="2" transform={`translate(0 ${-16*(1-clamp(f/70))})`}/>
   <path d="M0 -94 V208 M-142 -81 L0 30 L142 -81 M-100 166 L0 30 L100 166" fill="none" opacity=".7"/>
  </g>
  <g transform={`translate(1300 486) rotate(${f*.05})`} fill="none" stroke="#C395FF" opacity=".38"><ellipse rx="345" ry="126" transform="rotate(-64)"/><ellipse rx="376" ry="116" transform="rotate(64)"/><path d="M-400 -188 L0 -370 L400 -188 L400 255 L0 431 L-400 255Z" strokeDasharray="7 17"/></g>
  {[0,1,2,3].map(i=><circle key={i} cx={108+i*62} cy="875" r={15+(i===2?Math.max(0,flash)*5:0)} fill={['#C395FF','#8F7CC4','#DDA5DB','#B2C9FF'][i]}/>)}
 </svg>
 <div style={{position:'absolute',left:104,top:190,opacity:p}}><div style={{fontSize:95,fontWeight:700,letterSpacing:-5,lineHeight:1}}>CharForge<br/><span style={{color:'#C395FF'}}>Studio</span></div></div>
 <div style={{position:'absolute',left:110,top:552,fontFamily:BODY,fontSize:33,lineHeight:1.85,opacity:p,color:'#CFC0DE'}}>{['Character import + preview','Garment colour variants','Prepared-character preview'].map(t=><div key={t}>{t}</div>)}</div>
</AbsoluteFill>};
