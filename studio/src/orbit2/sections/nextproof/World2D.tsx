import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, ACCENT, FONT, MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {Arrow, Glow, PANEL, Pill, SampleChip, Sparkle, Title, ease, prog, rgba} from '../focus/kit';

const A=ACCENT.nextproof;
const enter=(f:number,at:number)=>ease.cubicOut(prog(f,at,at+24));
const Ponzo:React.FC<{f:number}>=({f})=>{
 const e=enter(f,100)*(1-prog(f,220,240)), proof=enter(f,174);
 const top=390, bottom=725, left=795, width=330;
 return <div style={{position:'absolute',inset:0,opacity:e}}>
  <div style={{position:'absolute',top:140,width:'100%',textAlign:'center',fontSize:52,fontWeight:600}}>The next step can look bigger than it is.</div>
  <svg width={1920} height={1080}>
   <path d="M430 925 L960 245 L1490 925" fill="none" stroke={rgba(A,.76)} strokeWidth={4}/>
   {Array.from({length:10},(_,i)=>{const p=(i+1)/11,y=245+p*p*680,w=(y-245)/680*1060;return <path key={i} d={'M'+(960-w/2)+' '+y+' H'+(960+w/2)} fill="none" stroke={rgba(A,.19)} strokeWidth={2}/>;})}
   {[top,bottom].map((y,i)=><g key={y}><rect x={left} y={y-13} width={width} height={26} rx={5} fill={A}/><text x={left+width+25} y={y+10} fontFamily={MONO} fontSize={24} fill={C.ink}>{i?'B':'A'}</text></g>)}
   {[left,left+width].map(x=><path key={x} d={'M'+x+' '+(top-35)+' V'+(bottom+35)} stroke={C.ink} strokeWidth={2} strokeDasharray="9 9" opacity={proof}/>)}
   <path d={'M'+left+' 827 H'+(left+width)+' M'+left+' 814 V840 M'+(left+width)+' 814 V840'} stroke={C.ink} strokeWidth={3} opacity={proof}/>
  </svg>
  <div style={{position:'absolute',top:863,width:'100%',textAlign:'center',fontSize:36,color:C.ink,opacity:proof}}>Same length. A different perspective.</div>
 </div>;
};
const ProofPanel:React.FC<{f:number}>=({f})=>{
 const e=enter(f,232),out=prog(f,444,466),scenario=enter(f,312);
 return <div style={{...PANEL,left:145,top:155,width:1630,height:755,padding:'35px 40px',boxSizing:'border-box',opacity:e*(1-out),transform:'translateY('+((1-e)*48)+'px)'}}>
  <SampleChip style={{right:38,top:32,fontSize:17}}/>
  <div style={{fontFamily:MONO,fontSize:22,letterSpacing:'.13em',color:A}}>NEXT PROOF</div>
  <div style={{fontSize:50,fontWeight:700,marginTop:13}}>What should I learn next?</div>
  <div style={{display:'flex',gap:32,marginTop:29}}>
   <div style={{width:662,padding:'27px 28px',boxSizing:'border-box',border:'1px solid '+rgba(A,.5),borderRadius:12,background:rgba(A,.06)}}>
    <Pill label="Hypothetical scenario" color={A} size={24}/>
    <div style={{display:'flex',alignItems:'flex-start',gap:18,marginTop:22}}><Sparkle size={43} color={A}/><div style={{fontSize:39,fontWeight:650,lineHeight:1.16}}>Document a SQL reporting project.</div></div>
    <div style={{fontSize:27,lineHeight:1.35,color:C.muted,marginTop:22}}>Explore how a documented example could support a missing requirement.</div>
    <div style={{marginTop:29,padding:'15px 20px',background:C.cobalt,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:29,fontWeight:600}}>View proof plan<Arrow size={32} color={C.ink}/></div>
   </div>
   <div style={{flex:1,minWidth:0,padding:'26px 29px',border:'1px solid '+C.line,borderRadius:12,background:C.raised}}>
    <div style={{fontSize:32,fontWeight:650}}>Evidence coverage</div>
    <div style={{fontSize:24,color:C.soft,marginTop:8}}>Illustrative comparison · not an outcome forecast</div>
    <div style={{fontSize:28,color:C.muted,marginTop:34}}>Current evidence</div>
    <div style={{height:23,background:C.panel,borderRadius:7,marginTop:13,overflow:'hidden'}}><div style={{height:'100%',width:'42%',background:C.sky,borderRadius:7}}/></div>
    <div style={{fontSize:28,color:A,marginTop:27}}>With this proof · scenario only</div>
    <div style={{height:23,background:C.panel,borderRadius:7,marginTop:13,overflow:'hidden'}}><div style={{height:'100%',width:(42+25*scenario)+'%',background:A,borderRadius:7}}/></div>
    <div style={{display:'flex',gap:12,marginTop:34,alignItems:'center',fontSize:24,color:C.soft}}><span>Build</span><Arrow size={23} color={C.soft}/><span>Document</span><Arrow size={23} color={C.soft}/><span>Review</span></div>
   </div>
  </div>
  <div style={{display:'flex',alignItems:'center',gap:18,marginTop:29,padding:'17px 22px',border:'1px solid '+rgba(A,.4),borderRadius:8,background:rgba(A,.075),fontSize:31,fontWeight:600,color:A}}>No skill is added to your profile.</div>
 </div>;
};

export const World:React.FC=()=>{
 const f=useSectionFrame(),exit=ease.inOut(prog(f,444,480));
 return <AbsoluteFill style={{background:C.bg,fontFamily:FONT,color:C.ink,overflow:'hidden'}}>
  <Glow x={960} y={540} size={1100} color={A} opacity={.12}/>
  <Title f={f} index={6} name="NEXT PROOF" promise="Turn an unknown into a useful learning plan." accent={A} mode="steps" from={0} out={82} x={150} y={270}/>
  <Ponzo f={f}/><ProofPanel f={f}/>
  {f>=444?<svg width={1920} height={1080} style={{position:'absolute',inset:0,opacity:exit}}>{Array.from({length:9},(_,i)=><path key={i} d={'M'+(300+i*165)+' 150 V930'} stroke={A} strokeWidth={3}/>) }{Array.from({length:6},(_,i)=><path key={i} d={'M300 '+(150+i*156)+' H1620'} stroke={A} strokeWidth={2}/>)}</svg>:null}
 </AbsoluteFill>;
};
