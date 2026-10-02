import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease,smooth} from '../../util';
import {EVENTS} from './timing';

export const World:React.FC=()=>{
 const f=useSegFrame(),p=ease.expoOut(clamp((f+8)/30)),lock=smooth(15,EVENTS[0].f,f);
 const cx=1330,cy=565;
 const pts=Array.from({length:7},(_,i)=>{const a=i*2.399+.3+f*.001;return {x:cx+Math.cos(a)*(180+i*34),y:cy+Math.sin(a)*(130+i*22)}});
 return <AbsoluteFill style={{background:'#091526',overflow:'hidden'}}>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute'}}>
   <defs><radialGradient id="ob-star"><stop stopColor="#FFF0C4"/><stop offset=".2" stopColor="#F4B15E" stopOpacity=".8"/><stop offset="1" stopColor="#F4B15E" stopOpacity="0"/></radialGradient><radialGradient id="ob-nebula"><stop stopColor="#174060"/><stop offset="1" stopColor="#091526" stopOpacity="0"/></radialGradient></defs>
   <ellipse cx={cx} cy={cy} rx="760" ry="640" fill="url(#ob-nebula)"/>
   {Array.from({length:70},(_,i)=><circle key={i} cx={85+(i*379%1770)} cy={85+(i*173%910)} r={i%6===0?2:1} fill="#EEE0C4" opacity={.2+(i%4)*.12}/>) }
   <g opacity={p} transform={`rotate(-23 ${cx} ${cy})`}>
    {[0,1,2,3].map(i=><ellipse key={i} cx={cx} cy={cy} rx={220+i*82} ry={102+i*49} fill="none" stroke={i===3?'#F4B15E':'#48718B'} strokeWidth={i===3?2:1} strokeDasharray={i===1?'4 13':undefined}/>) }
    <ellipse cx={cx} cy={cy} rx="470" ry="237" fill="none" stroke="#F4B15E" strokeWidth="10" strokeDasharray="90 2000" strokeDashoffset={-f*7}/>
   </g>
   <g opacity={p}>
    {pts.map((pt,i)=><g key={i}><path d={`M ${cx} ${cy} L ${cx+(pt.x-cx)*lock} ${cy+(pt.y-cy)*lock}`} stroke="#CA9658" strokeWidth="1.5" opacity=".5"/><circle cx={pt.x} cy={pt.y} r={8+i*3} fill={i%2?'#F4B15E':'#A9D3E1'}/><circle cx={pt.x} cy={pt.y} r={17+i*3} fill="none" stroke="#EFC993" opacity=".45"/></g>)}
    <circle cx={cx} cy={cy} r={140+8*Math.sin(f/20)} fill="url(#ob-star)"/>
    <path d={`M ${cx} ${cy-71} L ${cx+14} ${cy-14} L ${cx+71} ${cy} L ${cx+14} ${cy+14} L ${cx} ${cy+71} L ${cx-14} ${cy+14} L ${cx-71} ${cy} L ${cx-14} ${cy-14} Z`} fill="#FFE5B3"/>
    <circle cx={cx} cy={cy} r="370" fill="none" stroke="#8F815F" strokeWidth="1" strokeDasharray="2 14"/>
   </g>
   <path d="M 104 850 H 618 M 104 834 V 866 M 618 834 V 866" stroke="#C99D62" strokeWidth="2" opacity=".45"/>
  </svg>
  <div style={{position:'absolute',left:100,top:184,width:700,fontFamily:FONT,fontSize:83,lineHeight:1.06,fontWeight:700,letterSpacing:-4,color:'#FBEBD2',opacity:p}}>Job Engine / Orbit</div>
  <div style={{position:'absolute',left:108,top:506,fontFamily:BODY,fontSize:35,color:'#DBE0E5',lineHeight:2.08,opacity:ease.expoOut(clamp((f+2)/28))}}>{['Job-source research','Evidence-based matching','Geography + skill gaps'].map((t,i)=><div key={t} style={{display:'flex',gap:20,alignItems:'center'}}><span style={{width:8+i*3,height:8+i*3,border:'2px solid #F4B15E',borderRadius:'50%'}}/>{t}</div>)}</div>
 </AbsoluteFill>;
};
