import React from 'react';
import {Img, staticFile} from 'remotion';
import {ACCENT, C, FONT, MONO, Scene, Label, Chip, clamp, prog, eo, eio, mix, rgba, pulse, useWorldFrame, Wave} from '../kit';
import {SPEC, WAVE} from '../../mpw/worlds/sound/spectro.gen';
import {T, G, TOOLS, LETTER_F, WORD_END, ONSETS, type ToolId} from '../../mpw/worlds/sound/timing';

const S = ACCENT.sound;
const WORD_COL = (LETTER_F[0] - SPEC.F0) * SPEC.CPF;
const WORD_COLS = (WORD_END - LETTER_F[0]) * SPEC.CPF;
const xyPath = (points: [number,number][]) => points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
const text = {fontFamily:FONT,fontSize:42,fontWeight:600,color:C.text,lineHeight:1.2} as const;
const mini = {fontFamily:MONO,fontSize:36,color:C.muted,lineHeight:1.3} as const;

// These are the original STFT pixels, not a drawn imitation of the word.
// Frame-to-column mapping is the same SPEC contract used by the audio renderer.
const Spectrogram:React.FC<{f:number;word?:boolean;height:number;uid:string}> = ({f,word=true,height,uid}) => {
 const col=(f-SPEC.F0)*SPEC.CPF;
 const start=word?WORD_COL:Math.max(0,col-220), span=word?WORD_COLS:220;
 const visible=word?clamp(col-start,0,span):span, scale=840/span;
 const repair=eo(prog(f,T.repair,T.repair+18));
 const play=clamp((col-start)/span)*840;
 return <div style={{position:'relative',height,width:840,marginLeft:36,overflow:'hidden',background:'#0a100d',borderRadius:8}}>
  <div data-spectrogram={uid} style={{position:'absolute',left:0,top:0,width:visible*scale,height,overflow:'hidden'}}>
   <Img src={staticFile('mpw/sound/spec-orig.png')} style={{position:'absolute',left:-start*scale,top:0,width:SPEC.COLS*scale,height,maxWidth:'none'}}/>
   <div style={{position:'absolute',left:0,top:0,width:840*repair,height,overflow:'hidden'}}><Img src={staticFile('mpw/sound/spec-proc.png')} style={{position:'absolute',left:-start*scale,top:0,width:SPEC.COLS*scale,height,maxWidth:'none'}}/></div>
  </div>
  {f>=T.select&&f<T.repair+18&&<div style={{position:'absolute',left:0,right:0,bottom:0,height:height*.19,border:`3px solid ${C.amber}`,background:rgba(C.amber,.08),opacity:1-repair}}/>}
  {f<WORD_END&&word&&<div style={{position:'absolute',left:play,top:0,bottom:0,width:3,background:C.amber,boxShadow:`0 0 24px ${rgba(C.amber,.7)}`}}/>}
 </div>;
};

const Action:React.FC<{label:string;at:number;f:number;done?:string;style?:React.CSSProperties}> = ({label,at,f,done,style}) => <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',minHeight:82,padding:'18px 28px',borderRadius:8,border:`2px solid ${f>=at?S:C.line}`,background:f>=at?rgba(S,.16):C.panel,color:f>=at?S:C.text,fontSize:36,fontWeight:600,transform:`scale(${1-.035*pulse(f,at,12)})`,...style}}>{f>=at&&done?done:label}</div>;

const Envelope:React.FC<{f:number;noise:number;clean?:boolean}> = ({f,noise,clean=false}) => <svg width={912} height={430}>
 <line x1={16} x2={896} y1={210} y2={210} stroke={C.line} strokeWidth={2}/>
 {Array.from({length:132},(_,i)=>{
  const u=i/131,e=[.12,.28,.45,.62,.82].reduce((v,c,j)=>v+(0.65+j*.07)*Math.exp(-(((u-c)/.038)**2)),0);
  const n=noise*(.4+.6*Math.sin(i*12.9+f*.51)**2),speech=e*(clean?140:100+30*Math.sin(i*.17)**2);
  return <g key={i}><rect x={16+u*880} y={210-speech} width={4} height={speech*2+2} rx={2} fill={S}/><rect x={20+u*880} y={210-n*100} width={2} height={n*200} fill={rgba(C.muted,.7)}/></g>;
 })}
 <text x={36} y={405} fontFamily={MONO} fontSize={36} fill={noise<.04?S:C.muted}>{noise<.04?'SPEECH KEPT':'VOICE + BACKGROUND'}</text>
</svg>;

const Mixer:React.FC<{f:number}> = ({f}) => {
 const k=eo(prog(f,G.presence,G.presence+12));
 const pts=Array.from({length:181},(_,i)=>{const u=i/180,low=-90*k/(1+Math.exp((u-.2)*30)),presence=90*k*Math.exp(-(((u-.71)/.09)**2)),roll=-70*(1-k)/(1+Math.exp(-(u-.7)*25));return [36+u*840,226-low-presence-roll] as [number,number];});
 return <><svg width={912} height={440}>
  {[80,220,360].map(y=><line key={y} x1={24} x2={888} y1={y} y2={y} stroke={C.line} strokeWidth={2} strokeDasharray="6 10"/>)}
  <path d={`${xyPath(pts)} L888 380 L24 380 Z`} fill={rgba(S,.1)}/><path d={xyPath(pts)} fill="none" stroke={S} strokeWidth={6}/>
  <circle cx={24+.71*864} cy={226-90*k} r={12} fill={C.amber}/>
  <text x={36} y={430} fontFamily={MONO} fontSize={36} fill={C.muted}>LOW</text><text x={620} y={430} fontFamily={MONO} fontSize={36} fill={C.muted}>PRESENCE</text>
 </svg><div style={{margin:'15px 36px 0',display:'flex',gap:20,alignItems:'center'}}><Action label="Tone + compression" at={G.presence} f={f} done="Tone shaped"/><div style={{...mini,color:S,flex:1}}>Dynamics controlled</div></div></>;
};

const Microphones:React.FC<{f:number}> = ({f}) => {
 const lock=eio(prog(f,G.align,G.align+8)),phase=Math.PI*(1-lock);
 const polarity=f<G.flip?1:f<G.unflip?Math.cos(Math.PI*eio(prog(f,G.flip,G.flip+6))):Math.cos(Math.PI*(1-eio(prog(f,G.unflip,G.unflip+6))));
 const wave=(y:number,fn:(p:number)=>number)=>xyPath(Array.from({length:220},(_,i)=>{const p=i/219*Math.PI*10+f*.11;return [185+i/219*704,y-fn(p)*56] as [number,number];}));
 const aligned=f>=G.align,flipped=f>=G.flip&&f<G.unflip;
 return <><svg width={912} height={450}>
  {[['MIC A',100],['MIC B',245],['SUM',390]].map(([name,y])=><g key={name}><text x={36} y={Number(y)+10} fontFamily={MONO} fontSize={36} fill={C.muted}>{name}</text><line x1={185} x2={890} y1={Number(y)} y2={Number(y)} stroke={C.line} strokeWidth={2}/></g>)}
  <path d={wave(100,p=>Math.sin(p))} fill="none" stroke={S} strokeWidth={5}/>
  <path d={wave(245,p=>polarity*Math.sin(p+phase))} fill="none" stroke={C.amber} strokeWidth={5}/>
  <path d={wave(390,p=>Math.sin(p)+polarity*Math.sin(p+phase))} fill="none" stroke={aligned&&!flipped?S:C.error} strokeWidth={5}/>
 </svg><div style={{display:'flex',gap:16,margin:'20px 36px 0'}}><Action label="Align recordings" at={G.align} f={f} done="Aligned"/><Chip accent={flipped?C.error:S} style={{fontSize:36}}>{flipped?'Polarity flipped':f>=G.unflip?'Polarity corrected':'Polarity +'}</Chip></div></>;
};

const Room:React.FC<{f:number}> = ({f}) => {
 const k=eo(prog(f,G.dry,G.dry+10));
 return <><svg width={912} height={470}>
  <line x1={30} x2={882} y1={355} y2={355} stroke={C.line} strokeWidth={2}/>
  {[0,1,2,3,4,5].map(i=>{const h=i===0?250:220*.68**i*(1-k);return <g key={i}><rect x={75+i*135} y={355-h} width={28} height={h} rx={8} fill={i?rgba(S,.6):S}/><text x={i?470:36} y={i?435:45} fontFamily={MONO} fontSize={36} fill={C.muted}>{i===0?'DIRECT':i===1?'REFLECTIONS':''}</text></g>;})}
 </svg><div style={{marginLeft:36}}><Action label="Reduce room" at={G.dry} f={f} done="Dry voice remains"/></div></>;
};

const Leveler:React.FC<{f:number}> = ({f}) => {
 const k=eo(prog(f,G.level,G.level+8));
 return <><svg width={912} height={470}>
  <line x1={12} x2={900} y1={105} y2={105} stroke={C.amber} strokeWidth={3} strokeDasharray="8 10"/>
  <text x={36} y={65} fontFamily={MONO} fontSize={36} fill={C.amber}>CEILING</text>
  {Array.from({length:20},(_,i)=>{const before=70+260*Math.sin(i*3.9)**2,after=215+20*Math.sin(i*.7),h=mix(before,after,k);return <rect key={i} x={18+i*44} y={390-h} width={26} height={h} rx={6} fill={before>285&&k<.5?C.error:S}/>;})}
  <line x1={12} x2={900} y1={390} y2={390} stroke={C.line} strokeWidth={2}/>
 </svg><div style={{marginLeft:36}}><Action label="Level dialogue" at={G.level} f={f} done="Levels smoothed"/></div></>;
};

const Loudness:React.FC<{f:number}> = ({f}) => {
 const first=clamp((f-810)/30),second=clamp((f-G.pass2)/30),land=eo(prog(f,G.target,G.target+8));
 return <><div style={{display:'flex',gap:30,margin:'28px 36px 0'}}>{['1 · Measure','2 · Normalize'].map((l,i)=><div key={l} style={{flex:1}}><Label size={36} color={i===0||f>=G.pass2?S:C.muted}>{l}</Label><div style={{height:9,background:C.line,marginTop:18,borderRadius:5}}><div style={{height:'100%',width:`${(i?second:first)*100}%`,background:S,borderRadius:5}}/></div></div>)}</div>
  <svg width={912} height={300} style={{marginTop:30}}><rect x={36} y={110} width={840} height={60} rx={12} fill={C.line}/><rect x={36} y={110} width={mix(430,709,second)} height={60} rx={12} fill={S}/><line x1={745} x2={745} y1={76} y2={205} stroke={C.amber} strokeWidth={6}/><text x={645} y={255} fontFamily={MONO} fontSize={36} fill={C.amber}>TARGET</text><text x={36} y={38} fontFamily={MONO} fontSize={36} fill={C.muted}>MEASURED LOUDNESS</text></svg>
  <div style={{...text,marginLeft:36,width:840,fontSize:56,color:land>0?S:C.text,transform:`scale(${1+.035*pulse(f,G.target)})`}}>{f>=G.target?'Target reached':'Measured. Then normalized.'}</div></>;
};

const Beats:React.FC<{f:number}> = ({f}) => <><div style={{marginTop:42}}><Wave f={f} width={912} height={220} color={S}/></div><svg width={912} height={240}>
 <line x1={22} x2={890} y1={125} y2={125} stroke={C.line} strokeWidth={4}/>
 {ONSETS.map((at,i)=>{const k=eo(prog(f,at,at+6)),x=60+i*158;return <g key={at} opacity={f>=at?1:0} transform={`translate(0 ${-70*(1-k)})`}><path d={`M${x-15} 60 L${x+15} 60 L${x} 83 Z`} fill={C.amber}/><line x1={x} x2={x} y1={80} y2={155} stroke={C.amber} strokeWidth={4}/><text x={x} y={210} textAnchor="middle" fontFamily={MONO} fontSize={36} fill={C.muted}>{i+1}</text></g>;})}
 </svg><div style={{marginLeft:36}}><Action label="Export markers" at={952} f={f} done="Onset candidates ready"/></div></>;

const Tool:React.FC<{f:number;id:ToolId}> = ({f,id}) => {
 if(id==='mixer')return <Mixer f={f}/>;
 if(id==='noise'){const k=eo(prog(f,G.noiseOff,G.noiseOff+10));return <><Envelope f={f} noise={.65*(1-k)}/><div style={{marginLeft:36}}><Action label="Reduce background" at={G.noiseOff} f={f} done="Noise reduced"/></div></>;}
 if(id==='mic')return <Microphones f={f}/>;
 if(id==='room')return <Room f={f}/>;
 if(id==='leveler')return <Leveler f={f}/>;
 if(id==='loudness')return <Loudness f={f}/>;
 if(id==='beats')return <Beats f={f}/>;
 const k=eo(prog(f,G.clean,G.clean+10));
 return <><Envelope f={f} noise={.5*(1-k)} clean={k>.5}/><div style={{marginLeft:36}}><Action label="Clean speech" at={G.clean} f={f} done="Dialogue easier to follow"/></div></>;
};

export const Sound:React.FC = () => {
 const f=useWorldFrame(),tool=TOOLS.find(t=>f>=t.f&&f<t.f+t.len),dock=eio(prog(f,T.dock,T.dock+24)),exit=eio(prog(f,T.exit,T.band));
 const ready=f>=T.repair;
 const footer=tool?tool.line:f>=T.exit?'Sound becomes color.':ready?'Clean a recording. Keep the original.':'The music writes its own name.';
 return <Scene id="sound" title={'Sound Lab.'} subtitle={'Thirty tools.\nStart with the sound.'} footer={footer} note={tool?'Authored workspace demonstration · local processing':'Actual spectrogram pixels, computed from this soundtrack.'}>
  {f<T.reveal+12&&<div style={{position:'absolute',inset:0,opacity:1-prog(f,T.reveal,T.reveal+12)}}>
   <div style={{position:'absolute',left:226,top:300,width:460,height:260,border:`3px solid ${rgba('#f0a35e',.75)}`,borderRadius:12,background:'#241f17',transform:`translateY(${eo(prog(f,0,40))*110}px)`,opacity:1-eo(prog(f,24,76))}}><div style={{position:'absolute',left:-12,right:-12,top:-16,height:40,border:`3px solid ${S}`,background:C.panel,transformOrigin:'50% 100%',transform:`perspective(600px) rotateX(${eo(prog(f,-12,12))*110}deg)`}}/></div>
   <svg width={912} height={410} style={{position:'absolute',top:90}}>{Array.from({length:150},(_,i)=>{const c=Math.floor((f-SPEC.F0)*SPEC.CPF)-Math.abs(i-75)*2,a=WAVE[Math.max(0,c)]||0,h=6+190*a*appearDistance(f,i);return <rect key={i} x={i*6} y={205-h/2} width={3} height={h} rx={1.5} fill={S}/>;})}</svg>
   <Label size={36} style={{position:'absolute',top:565,left:36}}>FROM THE HANDOFF TO THE STUDIO</Label>
  </div>}
  {f>=T.reveal&&f<T.exit+12&&<div style={{position:'absolute',left:0,top:mix(70,680,dock),opacity:1-exit,transform:`translateY(${-80*exit}px)`}}>
   {dock<1&&<Label size={36} color={S} style={{marginBottom:20,marginLeft:36}}>THIS SOUNDTRACK · LIVE SPECTROGRAM</Label>}
   <Spectrogram f={f} word={f<480} height={mix(450,118,dock)} uid="phone-sound"/>
   {dock<.9&&<div style={{display:'flex',justifyContent:'space-between',margin:'16px 36px 0'}}><Label size={36} color={C.muted}>11 kHz</Label><Label size={36} color={C.muted}>40 Hz</Label></div>}
  </div>}
  {f>=T.repairUi&&f<480&&<div style={{position:'absolute',top:660,left:36,width:840,opacity:eo(prog(f,T.repairUi,T.repairUi+18))*(1-dock)}}>
   <Label size={36} color={S}>AUDIO REPAIR</Label><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:20}}><Action label="Process audio" at={T.repair} f={f} done="Original kept"/><Chip accent={S} style={{fontSize:36}}>{ready?'After':'Hum + clicks'}</Chip></div>
  </div>}
  {tool&&<div style={{position:'absolute',left:0,top:0,width:912,opacity:1-prog(f,T.exit,T.exit+10)}}>
   <Label size={36} color={S} style={{marginLeft:36}}>{tool.name}</Label><div style={{marginTop:36}}><Tool f={f} id={tool.id}/></div>
   <div style={{display:'flex',gap:9,position:'absolute',top:655,left:36}}>{Array.from({length:9},(_,i)=><div key={i} style={{width:84,height:5,background:i<=TOOLS.indexOf(tool)+1?S:C.line,borderRadius:3}}/>)}</div>
  </div>}
  {f>=T.exit&&<div style={{position:'absolute',left:0,right:0,top:mix(680,320,exit),height:mix(118,92,exit),overflow:'hidden',opacity:exit}}>
   {['#ff3b3b','#3bff6a','#3b7bff'].map((col,i)=><div key={col} style={{position:'absolute',top:i*30,left:0,width:'100%',height:16,background:col,boxShadow:`0 0 28px ${rgba(col,.35)}`,transform:`translateX(${(1-exit)*(i-1)*120}px)`}}/>)}
  </div>}
 </Scene>;
};

function appearDistance(f:number,i:number){return clamp((f-Math.abs(i-75)*.55)/20);}
