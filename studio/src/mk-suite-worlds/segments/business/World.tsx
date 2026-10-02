import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease,smooth} from '../../util';
import {EVENTS} from './timing';

const towers=[{x:880,y:750,h:165,w:100},{x:1075,y:850,h:310,w:120},{x:1305,y:725,h:220,w:105},{x:1535,y:830,h:375,w:100},{x:1110,y:575,h:195,w:80},{x:1510,y:580,h:180,w:65}];
export const World:React.FC=()=>{
 const f=useSegFrame(),p=ease.expoOut(clamp((f+10)/30)),rise=smooth(4,EVENTS[0].f,f),trace=smooth(40,130,f);
 return <AbsoluteFill style={{background:'#221211',overflow:'hidden'}}>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute'}}>
   <defs><linearGradient id="bo-face" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#F8B38B"/><stop offset="1" stopColor="#6C3028"/></linearGradient><radialGradient id="bo-aura"><stop stopColor="#65352D" stopOpacity=".65"/><stop offset="1" stopColor="#221211" stopOpacity="0"/></radialGradient></defs>
   <ellipse cx="1320" cy="620" rx="700" ry="620" fill="url(#bo-aura)"/>
   <g opacity=".33">
    {Array.from({length:12},(_,i)=><path key={i} d={`M ${640+i*60} 970 L ${1800+i*60} 330 M 640 ${320+i*60} L 1810 ${960+i*60}`} stroke="#815447" strokeWidth="1"/>)}
   </g>
   <path d="M 650 825 L 1210 485 L 1810 800 L 1260 1000 Z" fill="#391E1A" stroke="#8C5843" strokeWidth="2"/>
   <path d="M 785 785 L 1285 512 L 1685 742 L 1138 946 Z" fill="none" stroke="#F08F66" opacity=".2" strokeWidth="12"/>
   <g opacity={p}>
   {towers.map((t,i)=>{const h=t.h*rise;return <g key={i}>
     <path d={`M ${t.x-t.w} ${t.y} L ${t.x} ${t.y+t.w*.55} L ${t.x+t.w} ${t.y} L ${t.x} ${t.y-t.w*.55} Z`} fill="#1A0E0D" opacity=".6"/>
     <path d={`M ${t.x-t.w} ${t.y-h} L ${t.x} ${t.y-h+t.w*.55} V ${t.y+t.w*.55} L ${t.x-t.w} ${t.y} Z`} fill="url(#bo-face)" stroke="#D68567" strokeWidth="1"/>
     <path d={`M ${t.x} ${t.y-h+t.w*.55} L ${t.x+t.w} ${t.y-h} V ${t.y} L ${t.x} ${t.y+t.w*.55} Z`} fill="#773E33" stroke="#D68567" strokeWidth="1"/>
     <path d={`M ${t.x-t.w} ${t.y-h} L ${t.x} ${t.y-h-t.w*.55} L ${t.x+t.w} ${t.y-h} L ${t.x} ${t.y-h+t.w*.55} Z`} fill="#E7A57B" stroke="#FFD1AA" strokeWidth="1"/>
     {Array.from({length:Math.floor(t.h/40)},(_,j)=><path key={j} d={`M ${t.x-t.w+14} ${t.y-h+27+j*32*rise} L ${t.x-14} ${t.y-h+27+j*32*rise+t.w*.38}`} stroke="#FFE2BF" strokeWidth="3" opacity=".55"/>)}
   </g>})}
   </g>
   <g opacity={trace}>
    <path d="M 875 475 L 1090 255 L 1320 430 L 1550 312" fill="none" stroke="#FCC399" strokeWidth="3" strokeDasharray="8 10"/>
    {[{x:875,y:475},{x:1090,y:255},{x:1320,y:430},{x:1550,y:312}].map((t,i)=><g key={i} transform={`translate(${t.x} ${t.y+Math.sin(f/24+i)*8})`}><path d="M 0 -32 L 54 0 L 0 32 L -54 0 Z" fill="#EBA47D" fillOpacity=".17" stroke="#FFD5AA" strokeWidth="2"/><circle r="7" fill="#FFE1B7"/></g>)}
   </g>
  </svg>
  <div style={{position:'absolute',left:96,top:113,width:1140,fontFamily:FONT,fontSize:94,fontWeight:700,letterSpacing:-5,color:'#FFE9D6',opacity:p}}>MK Business OS</div>
  <div style={{position:'absolute',left:106,top:344,fontFamily:BODY,fontSize:34,lineHeight:2,color:'#F0BA9A',opacity:ease.expoOut(clamp((f+2)/28))}}>
    <div>Company research + sources</div><div>Opportunity discovery</div><div>Cost + time scenarios</div>
  </div>
  <div style={{position:'absolute',left:108,top:670,width:205,height:205,border:'1px solid #98624F',borderRadius:'50%',transform:`rotate(${f*.3}deg)`,opacity:.65}}><div style={{position:'absolute',left:43,top:43,width:117,height:117,border:'1px solid #F08F66',transform:'rotate(45deg)'}}/><div style={{position:'absolute',left:90,top:90,width:24,height:24,background:'#F8B591',borderRadius:'50%'}}/></div>
 </AbsoluteFill>;
};
