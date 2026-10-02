// Outro / end card (owned by the framework job; scaffold placeholder): brand name + tagline.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, BRAND, C, FONT, MONO} from '../brand';
import {useSegFrame} from '../frame';
import {SEGMENTS} from '../timing';
import {Mark} from '../shell/Mark';
import {clamp, ease} from '../util';

export const Outro: React.FC = () => {
  const f = useSegFrame();
  const p = ease.expoOut(clamp((f+6) / 24));
  const q = ease.expoOut(clamp((f+2) / 20));
  return (
    <AbsoluteFill style={{background:C.bg,color:C.fg,fontFamily:FONT,overflow:'hidden'}}>
      <svg width="1920" height="1080" style={{position:'absolute'}}>{SEGMENTS.map((s,i)=>{const a=i/23*Math.PI*2;const r=620+160*(1-p);return <g key={s.id}><line x1={960+Math.cos(a)*r} y1={530+Math.sin(a)*r*.63} x2={960+Math.cos(a)*(r+60)} y2={530+Math.sin(a)*(r+60)*.63} stroke={ACCENT[s.id]} strokeWidth="4" opacity=".4"/><circle cx={960+Math.cos(a)*(r+95)} cy={530+Math.sin(a)*(r+95)*.63} r="4" fill={ACCENT[s.id]}/></g>})}</svg>
      <div style={{position:'absolute',left:0,right:0,top:176,display:'flex',justifyContent:'center',opacity:p}}><Mark size={118}/></div>
      <div style={{position:'absolute',left:0,right:0,top:327,textAlign:'center',fontSize:184,fontWeight:700,letterSpacing:-12,opacity:p,transform:`scale(${.92+.08*p})`}}>MK SUITE<span style={{color:C.primary}}>.</span></div>
      <div style={{position:'absolute',left:0,right:0,top:576,textAlign:'center',fontSize:66,lineHeight:1.2,letterSpacing:-2,opacity:q}}>One suite.<br/><span style={{color:'#EEAA92'}}>One monthly subscription.</span></div>
      <div style={{position:'absolute',left:100,right:100,bottom:78,textAlign:'center',fontFamily:MONO,fontSize:22,lineHeight:1.7,color:'#B5B4C1',opacity:q}}>Subscription concept; product availability varies.<br/>Free cores remain free.</div>
    </AbsoluteFill>
  );
};
