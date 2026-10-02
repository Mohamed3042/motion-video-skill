import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp, ease} from '../../util';
import {EVENTS} from './timing';

export const World: React.FC = () => {
 const f=useSegFrame(), p=ease.cubicOut(clamp((f+8)/30));
 const pulse=Math.max(0,1-Math.abs(f-EVENTS[0].f)/24);
 const wave=(y:number,i:number)=>Array.from({length:121},(_,j)=>{const x=780+j*8;const a=Math.sin(j/120*Math.PI);return `${j?'L':'M'}${x},${y+Math.sin(j*.18-f*.065+i*.62)*a*(80+i*5)}`}).join(' ');
 return <AbsoluteFill style={{background:'#071914',color:'#EBFFF4',fontFamily:FONT,overflow:'hidden'}}>
  <div style={{position:'absolute',width:920,height:920,right:10,top:65,borderRadius:'50%',background:'radial-gradient(circle,#24694A55,transparent 68%)'}}/>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <defs><linearGradient id="voiceLine"><stop stopColor="#46E7AB" stopOpacity="0"/><stop offset=".4" stopColor="#B9FFD1"/><stop offset="1" stopColor="#46E7AB" stopOpacity=".1"/></linearGradient></defs>
   <g transform={`translate(1300 526) scale(${.82+.18*p+pulse*.03})`}>
    {Array.from({length:13},(_,i)=><ellipse key={i} rx={110+i*22} ry={340} fill="none" stroke="#46E7AB" strokeWidth={i%3===0?2:1} opacity={.12+i*.025} transform={`rotate(${(i-6)*9+f*.06})`}/>)}
    {[370,398,426].map((r,i)=><circle key={r} r={r} fill="none" stroke="#8FFFC4" strokeWidth={i===1?3:1} opacity={.35} strokeDasharray={`${100+i*18} ${80+i*30}`} transform={`rotate(${f*(i%2?.14:-.08)})`}/>)}
    <path d="M-49 -158 Q-93 -130 -67 -60 Q-36 -4 -80 30 Q-121 78 -71 128 Q-30 159 -15 192 L15 192 Q30 159 71 128 Q121 78 80 30 Q36 -4 67 -60 Q93 -130 49 -158 Z" fill="#D2FFE9" opacity=".94"/>
    <path d="M-83 213 L83 213 M0 197 L0 248 M-52 250 L52 250" fill="none" stroke="#D2FFE9" strokeWidth="6"/>
   </g>
   {Array.from({length:7},(_,i)=><path key={i} d={wave(405+i*42,i)} fill="none" stroke="url(#voiceLine)" strokeWidth={i===3?3:1.2} opacity={.34+i*.06}/>)}
   {[0,1,2].map(i=><g key={i} transform={`translate(${1570+i*46} ${212+i*126})`}><circle r="6" fill="#CDFFE1"/><circle r={15+pulse*18} fill="none" stroke="#46E7AB" opacity=".6"/></g>)}
   <path d="M104 816 H540 L621 732 H804" fill="none" stroke="#46E7AB" strokeWidth="2" opacity=".45"/>
  </svg>
  <div style={{position:'absolute',left:104,top:182,opacity:p,transform:`translateY(${(1-p)*28}px)`}}>
   <div style={{fontSize:112,fontWeight:700,lineHeight:.95,letterSpacing:-7}}>MK<br/>Voice<span style={{color:'#46E7AB'}}>.</span></div>
   <div style={{marginTop:67,fontFamily:BODY,fontSize:36,lineHeight:1.8,color:'#BCDBCD'}}>{['Voice library','Voice conversion','Training controls'].map((t,i)=><div key={t} style={{display:'flex',gap:20,alignItems:'center'}}><span style={{width:7,height:7,borderRadius:10,background:'#46E7AB',opacity:.4+.6*clamp((f-i*5)/15)}}/>{t}</div>)}</div>
  </div>
 </AbsoluteFill>;
};
