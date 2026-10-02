import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT, LOGO, MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {Backdrop, NoiseField, StoryOffset} from '../chaos/noise';
import {ease, prog, rgba} from '../chaos/util';
import {logoBox} from './geom';
import {BENEFITS, LOCK, TITLE, TAGLINE} from './timing';
export const World: React.FC = () => {
  const f=useSectionFrame(); const box=logoBox(f+720);
  const formed=ease.cubicOut(prog(f,84,LOCK)); const layout=ease.cubicInOut(prog(f,222,262));
  const title=ease.expoOut(prog(f,TITLE,TITLE+22)); const tag=ease.expoOut(prog(f,TAGLINE,TAGLINE+25));
  const exit=ease.cubicIn(prog(f,548,598));
  return <StoryOffset.Provider value={720}><AbsoluteFill style={{fontFamily:FONT,color:C.ink}}>
    <Backdrop/><NoiseField/>
    <div style={{position:'absolute',left:box.x-300,top:box.y-300,width:600,height:600,borderRadius:'50%',background:`radial-gradient(circle,${rgba(C.coral,.22)} 0%,transparent 67%)`,opacity:prog(f,0,12)}}/>
    <div style={{position:'absolute',left:948,top:528,width:24,height:24,borderRadius:'50%',background:C.coral,boxShadow:'0 0 80px 28px #ff754d88',opacity:1-formed}}/>
    <div style={{position:'absolute',left:box.x-box.s/2,top:box.y-box.s/2,width:box.s,height:box.s,opacity:formed,transform:`scale(${1+exit*11})`,transformOrigin:'81% 25%'}}><Img src={staticFile(LOGO)} style={{width:'100%',height:'100%',objectFit:'contain',maskImage:'radial-gradient(closest-side,#000 84%,transparent 100%)'}}/></div>
    <div style={{position:'absolute',left:100,right:100,top:620-layout*145,textAlign:'center',opacity:title*(1-exit),transform:`translateY(${(1-title)*35}px)`}}>
      <div style={{fontFamily:MONO,fontSize:22,letterSpacing:'.28em',color:C.coral,marginBottom:18}}>TURN NOISE INTO DIRECTION</div>
      <div style={{fontSize:82,fontWeight:700,letterSpacing:'-.045em'}}>Job Engine Orbit</div>
      <div style={{fontSize:36,color:C.muted,marginTop:15,opacity:tag}}>Your next chapter has coordinates.</div>
    </div>
    <svg width={1920} height={1080} style={{position:'absolute',opacity:layout*(1-exit)}}><path d="M425 725 Q960 685 1495 725" fill="none" stroke={C.line} strokeWidth={2}/></svg>
    {BENEFITS.map((b,i)=>{const p=ease.expoOut(prog(f,b.f,b.f+22)); return <div key={i} style={{position:'absolute',left:240+i*535,top:720,width:370,textAlign:'center',opacity:p*(1-exit),transform:`translateY(${(1-p)*40}px)`}}>
      <div style={{width:12,height:12,borderRadius:'50%',background:b.color,margin:'0 auto 25px',boxShadow:`0 0 20px ${b.color}`}}/>
      <div style={{fontSize:34,fontWeight:600,lineHeight:1.28}}>{b.lines[0]}<br/><span style={{color:b.color}}>{b.lines[1]}</span></div>
    </div>})}
    <AbsoluteFill style={{background:C.coral,opacity:prog(f,588,600)}}/>
  </AbsoluteFill></StoryOffset.Provider>;
};
