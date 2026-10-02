import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';

export const World: React.FC = () => {
  const f=useSegFrame(), p=ease.expoOut(clamp((f+9)/30));
  const phase=Math.min(1,Math.max(0,f/EVENTS[0].f));
  const keys=Array.from({length:8},(_,i)=>({x:220+i*180,y:630+Math.sin(i*.72)*135}));
  return <AbsoluteFill style={{background:'#291406',overflow:'hidden'}}>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute'}}>
      <defs><linearGradient id="mf-key" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#FFD29B"/><stop offset="1" stopColor="#FC8D51"/></linearGradient><radialGradient id="mf-bg"><stop stopColor="#A34D1B" stopOpacity=".32"/><stop offset="1" stopColor="#291406" stopOpacity="0"/></radialGradient></defs>
      <ellipse cx="910" cy="685" rx="1080" ry="450" fill="url(#mf-bg)"/>
      <path d="M 140 660 C 430 900 800 865 970 655 S 1300 530 1720 685" fill="none" stroke="#703818" strokeWidth="60"/>
      <path d="M 140 660 C 430 900 800 865 970 655 S 1300 530 1720 685" fill="none" stroke="#FB9A57" strokeWidth="3" strokeDasharray="8 18" strokeDashoffset={-f*5}/>
      {keys.map((k,i)=>{const press=Math.pow(Math.max(0,Math.cos((f-i*9-8)/13)),10)*22;return <g key={i} transform={`translate(${k.x} ${k.y+(1-p)*150+press}) rotate(${(i-3)*-3})`} opacity={p}>
        <rect x="-67" y="-24" width="145" height="150" rx="24" fill="#140A04" opacity=".4"/>
        <path d="M -75 -64 L 75 -64 L 87 71 Q 85 97 61 103 L -66 103 Q -91 102 -88 72 Z" fill="#9C4620"/>
        <rect x="-75" y="-80" width="150" height="144" rx="24" fill="url(#mf-key)" stroke="#FFE2B5" strokeWidth="2"/>
        <rect x="-52" y="-60" width="104" height="91" rx="18" fill="#FFF2D9" fillOpacity=".16"/>
        {i%3===0?<path d="M -24 -8 H 22 M 7 -24 L 23 -8 L 7 8" stroke="#623113" strokeWidth="7" strokeLinecap="round" fill="none"/>:i%3===1?<path d="M -22 -15 V 9 Q 0 30 22 9 V -15" stroke="#623113" strokeWidth="7" fill="none"/>:<circle cx="0" cy="-4" r="20" fill="none" stroke="#623113" strokeWidth="7"/>}
      </g>})}
      <g transform={`translate(1570 379) rotate(${f*.55})`}>
        <circle r="118" fill="none" stroke="#633018" strokeWidth="38"/>
        {Array.from({length:12},(_,i)=><path key={i} d="M 0 -136 V -104" stroke="#FF824B" strokeWidth="14" transform={`rotate(${i*30})`}/>)}
        <circle r="64" fill="none" stroke="#FFBA79" strokeWidth="4"/>
      </g>
      <path d={`M ${270+phase*1190} ${548-Math.sin(phase*Math.PI)*58} l 0 62 18 -16 15 31 17 -8 -15 -31 24 -2 Z`} fill="#FFF5DE" stroke="#633018" strokeWidth="3"/>
      <path d="M 100 957 H 1820" stroke="#633018"/>
    </svg>
    <div style={{position:'absolute',left:96,top:132,fontFamily:FONT,fontWeight:700,fontSize:116,letterSpacing:-6,color:'#FFF0DB',opacity:p}}>MacroForge</div>
    <div style={{position:'absolute',left:108,top:305,fontFamily:BODY,fontSize:35,lineHeight:1.8,color:'#F8BC8F',opacity:ease.expoOut(clamp((f+2)/28))}}>
      <div>Record keyboard + mouse</div><div>Edit macros + hotkeys</div><div>Profiles + conditions</div>
    </div>
  </AbsoluteFill>;
};
