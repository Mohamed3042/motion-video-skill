import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
export const World:React.FC=()=>{const f=useSegFrame(),p=ease.cubicOut(clamp((f+8)/27));
return <AbsoluteFill style={{background:'#FFE9ED',fontFamily:FONT,color:'#6E2746',overflow:'hidden'}}>
 <div style={{position:'absolute',width:950,height:950,left:-145,top:0,borderRadius:'50%',background:'#F9CDD9'}}/>
 <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
  <g transform="translate(592 780)"><ellipse rx="408" ry="84" fill="#B9668720"/><ellipse cy="-24" rx="372" ry="80" fill="#FFF8F7"/><ellipse cy="-40" rx="355" ry="75" fill="#FFFDF8" stroke="#DB9DB1" strokeWidth="2"/></g>
  {[0,1,2].map(i=>{const rise=ease.cubicOut(clamp((f-i*8)/(EVENTS[0].f-i*8)));const w=296-i*70;const y=612-i*168-(1-rise)*250;return <g key={i} transform={`translate(592 ${y})`}><path d={`M${-w} 0 V104 A${w} 62 0 0 0 ${w} 104 V0Z`} fill={['#E99BBA','#F3B8D0','#FBD7E4'][i]} stroke="#CD7295" strokeWidth="2"/><ellipse rx={w} ry="62" fill="#FFF1F6" stroke="#DB9BB5" strokeWidth="2"/>{Array.from({length:17},(_,j)=>{const a=j/16*Math.PI;return <circle key={j} cx={Math.cos(a)*w*.94} cy={Math.sin(a)*54} r="11" fill="#FFF8F5"/>})}<path d={`M${-w*.88} 53 Q${-w*.45} 102 0 58 T${w*.88} 53`} fill="none" stroke="#FFFFFFAA" strokeWidth="6"/></g>})}
  <g transform={`translate(592 ${205+Math.sin(f*.04)*7})`}><path d="M0 -51 L13 -15 L51 -15 L21 9 L33 47 L0 23 L-33 47 L-21 9 L-51 -15 L-13 -15Z" fill="#C48A35"/><path d="M0 30 V81" stroke="#AC7A3B" strokeWidth="5"/></g>
  <g transform={`translate(864 ${688+Math.sin(f*.03)*8}) rotate(12)`}><rect width="165" height="224" rx="3" fill="#FFFEF8" stroke="#D08EA4" strokeWidth="2"/><path d="M28 38 H137 M28 61 H98 M28 143 H137 M28 166 H119 M28 189 H128" stroke="#E1B7C3" strokeWidth="5"/><ellipse cx="81" cy="107" rx="34" ry="15" fill="none" stroke="#B8748F" strokeWidth="2"/></g>
  {[0,1,2,3,4,5].map(i=><circle key={i} cx={151+Math.cos(i)*330} cy={515+Math.sin(i)*270} r={8+i%3*3} fill="#DFA3BA"/>)}
 </svg>
 <div style={{position:'absolute',left:1088,top:231,opacity:p,transform:`translateY(${(1-p)*30}px)`}}><div style={{fontSize:113,fontWeight:700,lineHeight:.97,letterSpacing:-6}}>Cake<br/>Studio<span style={{color:'#ED6A9B'}}>.</span></div><div style={{marginTop:52,width:115,height:4,background:'#ED6A9B'}}/><div style={{fontFamily:BODY,fontSize:33,lineHeight:1.9,marginTop:38,color:'#87516A'}}>{['Cake design + print prep','Customer approvals','Order + production workflow'].map(t=><div key={t}>{t}</div>)}</div></div>
</AbsoluteFill>};
