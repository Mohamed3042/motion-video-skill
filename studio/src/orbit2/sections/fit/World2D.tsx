import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, ACCENT, FONT, MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {Check, Cross, DARK, LIGHT, FloorPortal, Glow, PANEL, Pill, Question, SampleChip, Title, ease, prog, rgba} from '../focus/kit';

const A=ACCENT.fit;
const enter=(f:number,at:number)=>ease.cubicOut(prog(f,at,at+24));
const CheckerShadow: React.FC<{f:number}>=({f})=>{
  const show=enter(f,100)*(1-prog(f,220,240));
  const proof=enter(f,174);
  const tile=102, x0=603, y0=275;
  return <div style={{position:'absolute',inset:0,opacity:show}}>
    <div style={{position:'absolute',top:150,width:'100%',textAlign:'center',fontSize:52,fontWeight:600}}>Context changes how things look.</div>
    <svg width={1920} height={1080}>
      <defs><linearGradient id="fit-cylinder" x1="0" x2="1"><stop offset="0" stopColor="#263c51"/><stop offset=".5" stopColor="#78a39d"/><stop offset="1" stopColor="#314859"/></linearGradient></defs>
      {Array.from({length:5},(_,row)=>Array.from({length:7},(_,col)=><rect key={row+'-'+col} x={x0+col*tile} y={y0+row*tile} width={tile} height={tile} fill={(row+col)%2===0?LIGHT:DARK}/>))}
      <path d={'M'+(x0+3*tile)+' '+y0+' H'+(x0+7*tile)+' V'+(y0+5*tile)+' H'+(x0+3*tile)+' Z'} fill="#000" opacity={.5}/>
      <path d={'M'+(x0+6*tile)+' '+(y0-18)+' v130 a55 22 0 0 0 110 0 v-130 Z'} fill="url(#fit-cylinder)"/>
      <ellipse cx={x0+6*tile+55} cy={y0-18} rx={55} ry={22} fill="#94b8af"/>
      <path d={'M'+(x0+2.5*tile)+' '+(y0+1.5*tile)+' L'+(x0+3.5*tile)+' '+(y0+3.5*tile)} stroke={DARK} strokeWidth={54} opacity={proof}/>
      <rect x={x0+2*tile} y={y0+tile} width={tile} height={tile} fill="none" stroke={A} strokeWidth={4} opacity={proof}/>
      <rect x={x0+3*tile} y={y0+3*tile} width={tile} height={tile} fill="none" stroke={A} strokeWidth={4} opacity={proof}/>
      <text x={x0+2.5*tile} y={y0+1.5*tile+15} fill="#fff" fontFamily={FONT} fontSize={42} fontWeight={700} textAnchor="middle">A</text>
      <text x={x0+3.5*tile} y={y0+3.5*tile+15} fill="#fff" fontFamily={FONT} fontSize={42} fontWeight={700} textAnchor="middle">B</text>
    </svg>
    <div style={{position:'absolute',top:837,width:'100%',textAlign:'center',fontSize:38,color:A,opacity:proof}}>A and B are exactly the same grey.</div>
  </div>;
};
const FitPanel: React.FC<{f:number}>=({f})=>{
 const e=enter(f,232),out=prog(f,444,466);
 const rows=[
  {name:'Python',detail:'Supported by confirmed facts',color:C.good,Icon:Check},
  {name:'Work authorization',detail:'Confirmed mismatch',color:C.red,Icon:Cross},
  {name:'SQL reporting',detail:'Missing evidence',color:C.warning,Icon:Question}
 ];
 return <div style={{...PANEL,left:150,top:152,width:1620,height:766,padding:'30px 38px',boxSizing:'border-box',opacity:e*(1-out),transform:'translateY('+((1-e)*50)+'px)'}}>
   <SampleChip style={{right:38,top:32,fontSize:17}}/>
   <div style={{fontFamily:MONO,fontSize:22,color:A,letterSpacing:'.13em'}}>YOUR FIT</div>
   <div style={{fontSize:52,fontWeight:700,marginTop:13}}>Requirements, not predictions.</div>
   <div style={{display:'flex',gap:42,borderBottom:'1px solid '+C.line,marginTop:21,paddingBottom:14}}>
    {['Overview','Your fit','Description','History'].map((tab,i)=><div key={tab} style={{fontSize:29,paddingBottom:10,color:i===1?C.ink:C.soft,borderBottom:i===1?'3px solid '+C.coral:'3px solid transparent'}}>{tab}</div>)}
   </div>
   {rows.map(({name,detail,color,Icon},i)=>{
    const p=enter(f,258+i*24);
    return <div key={name} style={{display:'flex',alignItems:'center',gap:22,height:112,marginTop:13,padding:'0 23px',border:'1px solid '+rgba(color,.46),borderLeft:'5px solid '+color,borderRadius:8,background:rgba(color,.055),opacity:p,transform:'translateX('+((1-p)*35)+'px)'}}>
      <Icon size={39} color={color}/><span style={{fontSize:34,fontWeight:600,flex:1}}>{name}</span><Pill label={detail} color={color} size={27}/>
    </div>;
   })}
   <div style={{display:'flex',alignItems:'center',gap:18,marginTop:24,color:A,fontSize:29,fontWeight:600,lineHeight:1.35,opacity:enter(f,312)}}><Question size={33} color={A}/><span>Green = supported by your facts. Red = a confirmed mismatch. Amber = missing evidence, not a rejection.</span></div>
 </div>;
};

export const World:React.FC=()=>{
 const f=useSectionFrame();
 return <AbsoluteFill style={{background:C.bg,fontFamily:FONT,color:C.ink,overflow:'hidden'}}>
  <Glow x={960} y={565} size={1120} color={A} opacity={.11}/>
  <Title f={f} index={5} name="YOUR FIT" promise="Supported. Contradicted. Still unknown." accent={A} mode="bounce" from={0} out={82} x={150} y={270}/>
  <CheckerShadow f={f}/><FitPanel f={f}/>
  {f>=444?<div style={{opacity:prog(f,444,458)}}><FloorPortal t={f-480}/></div>:null}
 </AbsoluteFill>;
};
