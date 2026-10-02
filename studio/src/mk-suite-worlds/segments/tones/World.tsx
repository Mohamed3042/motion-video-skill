import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
export const World: React.FC=()=>{const f=useSegFrame(),p=ease.cubicOut(clamp((f+10)/32)),impact=Math.max(0,1-Math.abs(f-EVENTS[0].f)/18);
return <AbsoluteFill style={{background:'#FFF3DC',fontFamily:FONT,color:'#452919',overflow:'hidden'}}>
 <div style={{position:'absolute',width:900,height:900,borderRadius:'50%',background:'#F2D0A5',right:-150,top:-210}}/>
 <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
  <g transform={`translate(945 802) rotate(-17) scale(${.85+.15*p})`}>
   <ellipse cx="340" cy="130" rx="620" ry="100" fill="#A4601E" opacity=".08"/>
   {Array.from({length:12},(_,i)=>{const x=i*69,y=-i*42;const press=Math.max(0,1-Math.abs((f-36)%144-i*12)/10)*22;return <g key={i} transform={`translate(${x} ${y+press+(1-p)*i*20})`}><path d="M0 0 L67 0 L89 42 L23 42 Z" fill="#FFFDF4" stroke="#C6A67C"/><path d="M23 42 L89 42 L89 228 L23 228 Z" fill={i%3===0?'#F7CC83':'#FDF4DF'} stroke="#C9AF8D"/><path d="M0 0 L23 42 L23 228 L0 185 Z" fill="#DFBC8B"/>{i%7!==2&&i%7!==6?<path d="M40 -4 L65 -4 L75 16 L50 16 L50 132 L40 111 Z" fill="#452919"/>:null}</g>})}
   {[0,1,2,3,4,5,6].map((i)=>{const bob=Math.sin(f*.07+i)*12;return <g key={i} transform={`translate(${i*104+9} ${-210-i*41+bob-(1-p)*200})`}><rect x="0" y="0" width="43" height={63+i%3*19} rx="20" fill={i%2?'#C55421':'#EF9840'} opacity=".94"/><path d="M21 10 V38" stroke="#FFF0CD" strokeWidth="2" opacity=".65"/></g>})}
   <path d="M20 -160 Q140 -160 220 -282 T443 -345 T705 -463" stroke="#B65C28" strokeWidth="3" fill="none" strokeDasharray="5 12" opacity=".6"/>
  </g>
  <circle cx="734" cy="248" r={51+impact*20} fill="none" stroke="#ED823C" strokeWidth="2"/>
  <circle cx="734" cy="248" r="17" fill="#ED823C"/>
  <path d="M104 474 H526" stroke="#CDB69A" strokeWidth="2"/>
 </svg>
 <div style={{position:'absolute',left:104,top:166,opacity:p,transform:`translateX(${(1-p)*-35}px)`}}><div style={{fontSize:120,fontWeight:700,letterSpacing:-8,lineHeight:1}}>MK Tones</div><div style={{width:170,height:12,background:'#ED823C',marginTop:37,transform:`scaleX(${p})`,transformOrigin:'left'}}/></div>
 <div style={{position:'absolute',left:108,top:554,fontFamily:BODY,fontSize:37,lineHeight:1.85,opacity:p,color:'#704A30'}}>{['Melody correction','Instrument sketches','WAV + MIDI exports'].map(t=><div key={t}>{t}</div>)}</div>
</AbsoluteFill>};
