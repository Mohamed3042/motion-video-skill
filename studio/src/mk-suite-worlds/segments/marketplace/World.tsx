import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease,smooth} from '../../util';
import {EVENTS} from './timing';

export const World:React.FC=()=>{
 const f=useSegFrame(),p=ease.expoOut(clamp((f+10)/30)),scan=smooth(0,EVENTS[0].f+30,f);
 const ringX=640+scan*260,ringY=520-Math.sin(scan*Math.PI)*115;
 return <AbsoluteFill style={{background:'#2C2610',overflow:'hidden'}}>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute'}}>
   <defs><linearGradient id="mp-plinth" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#9C853B"/><stop offset="1" stopColor="#3C3318"/></linearGradient><linearGradient id="mp-screen"><stop stopColor="#504524"/><stop offset=".45" stopColor="#D5BA68"/><stop offset="1" stopColor="#685526"/></linearGradient><radialGradient id="mp-glow"><stop stopColor="#8C7533" stopOpacity=".5"/><stop offset="1" stopColor="#2C2610" stopOpacity="0"/></radialGradient></defs>
   <ellipse cx="775" cy="602" rx="820" ry="550" fill="url(#mp-glow)"/>
   <ellipse cx="690" cy="828" rx="440" ry="132" fill="#171506" stroke="#C3A858" strokeWidth="2"/>
   <ellipse cx="690" cy="812" rx="440" ry="132" fill="none" stroke="#F4C94C" strokeWidth="1" strokeDasharray="2 12"/>
   <g opacity={p} transform={`translate(0 ${(1-p)*110})`}>
    <path d="M 285 700 L 490 630 L 655 700 V 827 L 449 902 L 285 827 Z" fill="url(#mp-plinth)" stroke="#B19951"/>
    <path d="M 285 700 L 450 760 L 655 700 L 490 630 Z" fill="#AE9854"/>
    <path d="M 690 659 L 895 584 L 1060 659 V 834 L 856 909 L 690 834 Z" fill="url(#mp-plinth)" stroke="#B19951"/>
    <path d="M 690 659 L 855 720 L 1060 659 L 895 584 Z" fill="#DDC17C"/>
    <path d="M 435 578 L 645 501 L 810 578 V 698 L 600 775 L 435 698 Z" fill="url(#mp-plinth)" stroke="#B19951"/>
    <path d="M 435 578 L 600 639 L 810 578 L 645 501 Z" fill="#B69C50"/>
    <g transform="translate(610 408) rotate(-10)"><rect x="-68" y="-148" width="136" height="245" rx="24" fill="#E7C879"/><rect x="-57" y="-134" width="114" height="213" rx="15" fill="url(#mp-screen)"/><rect x="-21" y="-128" width="42" height="7" rx="4" fill="#29230E"/></g>
    <g transform="translate(451 585) rotate(6)"><rect x="-121" y="-136" width="230" height="146" rx="10" fill="#DBC077"/><rect x="-109" y="-125" width="207" height="122" fill="url(#mp-screen)"/><path d="M -121 10 L -162 54 H 147 L 109 10 Z" fill="#BCA361"/><path d="M -140 54 H 130" stroke="#F5D897" strokeWidth="6"/></g>
    <g transform="translate(867 537)"><path d="M -70 0 V -48 Q -65 -117 0 -117 Q 66 -117 70 -48 V 0" fill="none" stroke="#E7C879" strokeWidth="20"/><rect x="-87" y="-32" width="33" height="85" rx="16" fill="#D8BD70"/><rect x="53" y="-32" width="33" height="85" rx="16" fill="#D8BD70"/></g>
   </g>
   <g transform={`translate(${ringX} ${ringY}) rotate(-28)`} opacity=".8"><circle r="124" fill="#F5D66E" fillOpacity=".08" stroke="#FFE49B" strokeWidth="10"/><circle r="111" fill="none" stroke="#AE9754" strokeWidth="2"/><path d="M 87 89 L 165 167" stroke="#FFE49B" strokeWidth="20" strokeLinecap="round"/></g>
   <g transform={`translate(1570 422) rotate(${-8+3*Math.sin(f/32)})`} opacity={p}>
    {[-1,0,1].map((i)=><g key={i} transform={`translate(${i*35} ${Math.abs(i)*18}) rotate(${i*13})`}><rect x="-120" y="-86" width="245" height="150" rx="4" fill={i===0?'#DBC787':'#8F7F43'}/><path d="M -95 -52 H 62 M -95 -26 H 93 M -95 0 H 33 M -95 30 H 66" stroke="#5C502C" strokeWidth="7"/></g>)}
   </g>
  </svg>
  <div style={{position:'absolute',top:118,left:100,right:100,fontFamily:FONT,fontWeight:700,fontSize:96,letterSpacing:-4,color:'#F8E8B9',opacity:p}}>MK Marketplace</div>
  <div style={{position:'absolute',left:1176,top:665,fontFamily:BODY,fontSize:33,lineHeight:1.95,color:'#F0DC9E',opacity:ease.expoOut(clamp((f+2)/28))}}>
   <div>Listings + saved items</div><div>Model + condition comparison</div><div>New + used price evidence</div>
  </div>
 </AbsoluteFill>;
};
