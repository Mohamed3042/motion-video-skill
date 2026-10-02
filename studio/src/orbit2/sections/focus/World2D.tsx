import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, ACCENT, FONT, MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {Arrow, Bookmark, Check, Glow, PANEL, Pill, Question, SampleChip, Title, ease, mix, prog, rgba, stars} from './kit';

const A = ACCENT.focus;
const SKY = stars(41, 44);
const enter = (f: number, at: number) => ease.cubicOut(prog(f, at, at + 24));
const Ebbinghaus: React.FC<{f: number}> = ({f}) => {
  const p = enter(f, 100);
  const compare = ease.inOut(prog(f, 172, 218));
  const out = 1 - prog(f, 220, 240);
  const cy = 550;
  return <div style={{position:'absolute',inset:0,opacity:p*out}}>
    <div style={{position:'absolute',top:155,width:'100%',textAlign:'center',fontSize:52,fontWeight:600,color:C.ink}}>The same role. A different frame.</div>
    <svg width={1920} height={1080}>
      {[0,1].map(side => {
        const cx = mix(side ? 1315 : 605, 960, compare);
        const orbit = side ? 145 : 230;
        const outerR = side ? 38 : 92;
        return <g key={side}>
          {Array.from({length:side ? 10 : 7},(_,i) => {
            const n=side ? 10 : 7;
            const angle=i/n*Math.PI*2+f*0.0009;
            return <circle key={i} cx={cx+Math.cos(angle)*orbit*(1+compare*.45)} cy={cy+Math.sin(angle)*orbit*(1+compare*.45)} r={outerR} fill={rgba(C.sky,side?.22:.1)} stroke={rgba(C.sky,.28)} strokeWidth={2} opacity={1-compare}/>;
          })}
          <circle cx={cx} cy={cy} r={64} fill={A} stroke={C.coral} strokeWidth={4} />
          <circle cx={cx} cy={cy} r={83} fill="none" stroke={A} strokeWidth={2} opacity={compare}/>
        </g>;
      })}
      <path d="M896 675 H1024 M896 662 V688 M1024 662 V688" stroke={C.coral} strokeWidth={3} opacity={compare}/>
    </svg>
    <div style={{position:'absolute',top:750,width:'100%',textAlign:'center',fontSize:36,color:C.muted,opacity:1-compare}}>Noise changes what feels important.</div>
    <div style={{position:'absolute',top:725,width:'100%',textAlign:'center',fontSize:38,color:C.ink,opacity:compare}}>Same size. Less noise.</div>
  </div>;
};

const FocusPanel: React.FC<{f: number}> = ({f}) => {
  const e=enter(f,232), out=ease.inOut(prog(f,444,466));
  const review=enter(f,360);
  return <div style={{...PANEL,left:170,top:152,width:1580,height:756,padding:'38px 42px',opacity:e*(1-out),transform:'translateY('+((1-e)*60)+'px) scale('+(1-out*.06)+')',boxSizing:'border-box'}}>
    <SampleChip style={{right:38,top:35,fontSize:17}}/>
    <div style={{fontFamily:MONO,fontSize:22,letterSpacing:'.13em',color:C.coral}}>JOB FOCUS</div>
    <div style={{fontSize:54,fontWeight:700,marginTop:12}}>Your next step.</div>
    <div style={{display:'flex',gap:16,marginTop:22}}>
      {['All','Verified open','Saved'].map((t,i)=><div key={t} style={{padding:'10px 22px',fontSize:28,borderRadius:7,border:'1px solid '+(i?C.line:C.coral),background:i?C.raised:rgba(C.coral,.16),color:i?C.muted:C.ink}}>{t}</div>)}
    </div>
    <div style={{display:'flex',gap:32,marginTop:26}}>
      <div style={{flex:1,minWidth:0,border:'1px solid '+C.line,borderRadius:12,padding:'26px 28px',background:C.raised}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={{fontSize:37,fontWeight:700}}>Automation engineer</div><Bookmark size={34} color={C.sky}/></div>
        <div style={{fontSize:26,color:C.muted,marginTop:8}}>Synthetic QA Employer · Cairo</div>
        <div style={{height:1,background:C.line,margin:'24px 0'}}/>
        <div style={{display:'flex',alignItems:'center',gap:17,fontSize:30}}><Check size={30} color={C.good}/><span>Python</span><span style={{color:C.good,marginLeft:'auto'}}>Supported</span></div>
        <div style={{display:'flex',alignItems:'center',gap:17,fontSize:30,marginTop:23}}><Question size={30} color={C.warning}/><span>SQL reporting</span><span style={{color:C.warning,marginLeft:'auto'}}>Needs evidence</span></div>
        <div style={{fontSize:24,color:C.soft,marginTop:28}}>Inspect the requirement and its source.</div>
      </div>
      <div style={{width:540,border:'1px solid '+rgba(C.coral,.7),borderRadius:12,padding:'27px 28px',background:rgba(C.coral,.055)}}>
        <Pill label="REVIEW NEXT" color={C.coral} size={20}/>
        <div style={{fontSize:40,fontWeight:650,lineHeight:1.17,marginTop:18}}>Review missing evidence.</div>
        <div style={{fontSize:27,lineHeight:1.35,color:C.muted,marginTop:16}}>See what is supported, what conflicts, and what remains unknown.</div>
        <div style={{marginTop:24,padding:'16px 22px',background:C.cobalt,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:29,fontWeight:600,boxShadow:'0 0 '+(review*28)+'px '+rgba(C.coral,review*.23)}}>Start review<Arrow size={32} color={C.ink}/></div>
      </div>
    </div>
    <div style={{marginTop:25,fontSize:26,color:C.soft}}>Ordered for review — not a prediction of being hired.</div>
  </div>;
};

export const World: React.FC = () => {
  const f=useSectionFrame();
  const exit=ease.inOut(prog(f,444,480));
  return <AbsoluteFill style={{background:C.bg,fontFamily:FONT,color:C.ink,overflow:'hidden'}}>
    {SKY.map((s,i)=><div key={i} style={{position:'absolute',left:s.x,top:s.y,width:s.r,height:s.r,borderRadius:'50%',background:C.ink,opacity:.12+.10*Math.sin(f*s.sp+s.ph)}}/>)}
    <Glow x={960} y={540} size={1040} color={A} opacity={.09}/>
    <Title f={f} index={4} name="JOB FOCUS" promise="One role. Clear evidence. A next step." accent={A} mode="quiet" from={0} out={82} x={140} y={265}/>
    <Ebbinghaus f={f}/>
    <FocusPanel f={f}/>
    {f>=444?<div style={{position:'absolute',left:960-130*exit,top:560-130*exit,width:260*exit,height:260*exit,background:A,opacity:exit,borderRadius:(1-exit)*50+'%',transform:'rotate('+(exit*3)+'deg)'}}/>:null}
  </AbsoluteFill>;
};
