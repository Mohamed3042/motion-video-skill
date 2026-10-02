import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {Backdrop, NoiseField, camJitter} from './noise';
import {LINES, HEADLINE} from './timing';
import {ease, prog} from './util';
export const World: React.FC = () => {
  const f=useSectionFrame(); const jitter=camJitter(f);
  const current=LINES.reduce((n,l,i)=>f>=l.f?i:n,-1);
  const line=current<0?null:LINES[current]; const age=line?f-line.f:0;
  const enter=ease.expoOut(prog(age,0,9)); const headline=ease.expoOut(prog(f,HEADLINE,HEADLINE+15));
  return <AbsoluteFill style={{fontFamily:FONT,color:C.ink}}>
    <Backdrop/>
    <AbsoluteFill style={{transform:`translate(${jitter.x}px,${jitter.y}px) rotate(${jitter.rot}deg)`}}><NoiseField/></AbsoluteFill>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at center, rgba(2,6,23,.78) 0%, transparent 66%)',opacity:current>=0?.82:0}}/>
    {line&&<div style={{position:'absolute',left:100,right:100,top:425,textAlign:'center',fontSize:current>=4?89:112,fontWeight:700,letterSpacing:'-.05em',lineHeight:1.1,opacity:enter*(1-prog(f,530,549)),transform:`translateY(${(1-enter)*45}px) scale(${1+(1-enter)*.15})`,textShadow:'0 12px 35px #020617'}}>{line.text}</div>}
    <div style={{position:'absolute',left:100,right:100,top:388,textAlign:'center',opacity:headline,transform:`scale(${.94+.06*headline})`}}>
      <div style={{fontFamily:MONO,fontSize:23,letterSpacing:'.25em',color:C.muted,marginBottom:28}}>TOO MANY SIGNALS. TOO LITTLE CLARITY.</div>
      <div style={{fontSize:122,fontWeight:700,letterSpacing:'-.055em',lineHeight:1.04}}>The job hunt<br/>is<span style={{color:C.coral,paddingLeft:25}}>noise.</span></div>
    </div>
  </AbsoluteFill>;
};
