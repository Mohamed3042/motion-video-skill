// Intro (owned by the framework job; scaffold placeholder): the brand name settles in on the first beats.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../brand';
import {useSegFrame} from '../frame';
import {SEGMENTS} from '../timing';
import {Mark} from '../shell/Mark';
import {clamp, ease} from '../util';

export const Intro: React.FC = () => {
  const f = useSegFrame();
  const p = ease.expoOut(clamp((f-48) / 36));
  const hookOut = clamp((f-40)/18);
  const colors=SEGMENTS.map(s=>ACCENT[s.id]);
  return (
    <AbsoluteFill style={{background:'#10121A',color:C.fg,fontFamily:FONT,overflow:'hidden'}}>
      <svg width="1920" height="1080" style={{position:'absolute'}}>
        {colors.map((c,i)=>{const a=i/23*Math.PI*2+f*.002;const r=200+340*p;return <g key={i} transform={`translate(960 535) rotate(${a*180/Math.PI})`}><path d={`M${r} -${24+i*3} Q${r+130} 0 ${r} ${24+i*3}`} stroke={c} fill="none" strokeWidth={3+i%4} opacity={.25+.5*p}/><circle cx={r} cy="0" r={3+i%5} fill={c}/></g>})}
        {[0,1,2].map(i=><ellipse key={i} cx="960" cy="540" rx={740+i*95} ry={280+i*70} stroke="#FFFFFF" strokeOpacity=".05" fill="none" transform={`rotate(${-18+i*14} 960 540)`}/>)}
      </svg>
      <div style={{position:'absolute',left:100,top:92,display:'flex',alignItems:'center',gap:18,fontFamily:MONO,fontSize:23,letterSpacing:4}}><Mark size={48}/><span>MK SUITE</span></div>
      <div style={{position:'absolute',left:0,right:0,top:300,textAlign:'center',fontSize:128,lineHeight:1.03,fontWeight:700,letterSpacing:-7,opacity:1-hookOut,transform:`translateY(${-80*hookOut}px)`}}>EVERY IDEA.<br/><span style={{color:C.primary}}>HAS A WORLD.</span></div>
      <div style={{position:'absolute',left:0,right:0,top:340,textAlign:'center',fontSize:240,lineHeight:1,fontWeight:700,letterSpacing:-16,opacity:p,transform:`translateY(${80*(1-p)}px) scale(${.88+.12*p})`}}>MK SUITE<span style={{color:C.primary}}>.</span></div>
      <div style={{position:'absolute',left:0,right:0,top:638,textAlign:'center',fontSize:37,letterSpacing:5,opacity:p}}>EVERY IDEA HAS A WORLD</div>
      <div style={{position:'absolute',left:0,right:0,top:815,display:'flex',justifyContent:'center',gap:80}}>{['CREATE','WORK','GROW'].map((x,i)=><div key={x} style={{fontSize:30,letterSpacing:7,opacity:clamp((f-122-i*8)/14),transform:`translateY(${20*(1-clamp((f-122-i*8)/14))}px)`}}><span style={{color:colors[i*8],marginRight:22}}>●</span>{x}</div>)}</div>
      <div style={{position:'absolute',right:100,bottom:91,fontFamily:MONO,fontSize:20,color:'#999AA8',opacity:p}}>23 SOFTWARE WORLDS</div>
    </AbsoluteFill>
  );
};
