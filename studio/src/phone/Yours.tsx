import React from 'react';
import {loadFont as loadKufi} from '@remotion/google-fonts/NotoKufiArabic';
import {Shot} from '../mpw/worlds/library/shots';
import {T as LT} from '../mpw/worlds/library/timing';
import {T as ET} from '../mpw/worlds/editroom/timing';
import {T as PT} from '../mpw/worlds/profile/timing';
import {T as AT} from '../mpw/worlds/anywhere/timing';
import {ACCENT, C, MONO, Scene, Label as BaseLabel, Chip, Wave, appear, clamp, eio, eo, mix, prog, pulse, rgba, useWorldFrame} from './kit';

// All geometry below belongs to the native 912 × 820 portrait stage. Only the
// abstract footage drawings and the original audiovisual cue constants are reused.
const AR = loadKufi('normal', {weights:['400','500','600','700'],subsets:['arabic']}).fontFamily;
const A = ACCENT.library;
const pos = (left:number,top:number):React.CSSProperties => ({position:'absolute',left,top});
const row:React.CSSProperties = {display:'flex',alignItems:'center',gap:20};
const Label:React.FC<React.ComponentProps<typeof BaseLabel>> = ({size=36,...props}) => <BaseLabel {...props} size={Math.max(36,size)}/>;
const rise = (f:number,at:number):React.CSSProperties => {
 const p=appear(f,at,15);return {opacity:p,transform:`translateY(${(1-p)*22}px)`};
};
const Check:React.FC<{color?:string;size?:number}> = ({color=C.success,size=44}) => <svg width={size} height={size} viewBox="0 0 48 48"><path d="M8 24l10 11L40 12" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Arrow:React.FC<{color?:string;left?:boolean}> = ({color=C.amber,left=false}) => <svg width="58" height="44" viewBox="0 0 58 44" style={{transform:left?'rotate(180deg)':undefined}}><path d="M3 22h47M34 7l16 15-16 15" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const FrameLabel:React.FC<{name:string;right?:string;color?:string}> = ({name,right,color=C.muted}) => <div style={{...row,justifyContent:'space-between',width:840,marginLeft:36}}><Label color={color}>{name}</Label>{right&&<Label color={color}>{right}</Label>}</div>;

const SourceFrame:React.FC<{f:number;w?:number;h?:number;uid:string;changed?:boolean;freeze?:boolean}> = ({f,w=912,h=390,uid,changed=false,freeze=false}) => <svg width={w} height={h} viewBox="0 0 912 390" style={{display:'block'}}>
 <defs><linearGradient id={uid+'sky'} x2="0" y2="1"><stop stopColor="#142b32"/><stop offset="1" stopColor="#4d746f"/></linearGradient><radialGradient id={uid+'light'}><stop stopColor="#f4cba6" stopOpacity=".8"/><stop offset="1" stopColor="#f4cba6" stopOpacity="0"/></radialGradient></defs>
 <rect width="912" height="390" fill={`url(#${uid}sky)`}/><circle cx="594" cy="108" r="180" fill={`url(#${uid}light)`}/>
 <path d="M0 20l364 186v74L0 390z" fill="#1c2f32"/><path d="M912 52L490 203v78l422 109z" fill="#253b3b"/>
 {[0,1,2,3,4].map(i=><path key={i} d={`M0 ${80+i*52}L364 ${220+i*11}M912 ${100+i*48}L490 ${220+i*11}`} stroke="#b0cec1" strokeOpacity=".16" strokeWidth="3"/>)}
 <path d="M364 262h126l422 128H0z" fill="#132021"/><path d="M432 260l4 130" stroke="#e4dcc4" strokeWidth="4" strokeDasharray="18 22" opacity=".5"/>
 <g transform={`translate(${freeze?600:600+Math.sin(f*.09)*38},254)`}><rect width="135" height="72" rx="7" fill="#658776"/><rect x="12" y="9" width="107" height="24" fill={changed?'#345452':'#edb654'}/><circle cx="25" cy="74" r="10" fill="#0b1112"/><circle cx="109" cy="74" r="10" fill="#0b1112"/></g>
 <circle cx={236+(f%160)*1.2} cy="318" r="12" fill="#8fc1d4" opacity=".8"/>
</svg>;

const Search:React.FC<{text:string;f:number;at:number;accent?:string}> = ({text,f,at,accent=A}) => <div style={{...row,height:104,borderBottom:`3px solid ${accent}`,background:rgba(accent,.06),padding:'0 36px',boxSizing:'border-box',width:912}}>
 <svg width="42" height="42" viewBox="0 0 48 48"><circle cx="20" cy="20" r="13" stroke={accent} strokeWidth="4" fill="none"/><path d="M30 30l13 13" stroke={accent} strokeWidth="4"/></svg>
 <span style={{fontSize:46,fontWeight:600}}>{text}</span><span style={{height:44,width:3,background:accent,opacity:f>=at?1:0}}/>
</div>;

const LibraryGrid:React.FC<{f:number}> = ({f}) => {
 const query='CAM B'.slice(0,LT.libKeys.filter(x=>f>=x).length),filter=eo(prog(f,LT.libFilter,LT.libFilter+18));
 return <>
  <FrameLabel name="FOOTAGE LIBRARY" right="LOCAL" color={A}/>
  <div style={{...pos(0,64),...rise(f,LT.reflow)}}><Search text={query||'Search your footage'} f={f} at={LT.libKeys[0]}/></div>
  {[0,1,2,3,4,5].map(i=>{
   const selected=i===1||i===4,p=appear(f,LT.gridIn+i*4,18),x=(i%2)*470,y=200+Math.floor(i/2)*193;
   return <div key={i} style={{...pos(x,y),width:442,opacity:p*(selected?1:1-filter*.84),transform:`translateY(${(1-p)*40}px) scale(${1+(selected?.02:-.04)*filter})`,transformOrigin:'center'}}>
    <Shot kind={(['street','coast','hills','city','street','forest'] as const)[i]} seed={24+i} uid={'ph-lib-'+i} w={442} h={132} t={f/60}/>
    <div style={{...row,justifyContent:'space-between',marginTop:10,padding:'0 36px'}}><Label color={selected&&filter>.5?A:C.text}>{selected?'CAM B':'CAM '+(i%2?'C':'A')}</Label><Label>0{i+1}</Label></div>
    {selected&&filter>.1&&<div style={{position:'absolute',inset:-3,border:`3px solid ${A}`,opacity:filter,pointerEvents:'none'}}/>}
   </div>;
  })}
 </>;
};

const Catalog:React.FC<{f:number}> = ({f}) => {
 const text='street'.slice(0,LT.catKeys.filter(x=>f>=x).length),jump=f>=LT.jump2?1:f>=LT.jump?0:-1;
 return <>
  <FrameLabel name="PC MEDIA CATALOG" right="ON YOUR PC" color={A}/>
  <div style={pos(0,70)}><Search text={text} f={f} at={LT.catKeys[0]}/></div>
  <div style={{...pos(0,208),opacity:appear(f,LT.catResults,15),transform:`translateX(${pulse(f,LT.jump,12)*-30}px)`}}><SourceFrame f={f} uid="ph-cat" h={320}/><div style={{...pos(36,258),background:C.canvas,padding:'8px 18px',fontFamily:MONO,fontSize:36,color:A}}>00:12:04:10</div></div>
  {['Visual match · sampled','“street” · spoken word'].map((s,i)=><div key={s} style={{...pos(0,554+i*118),...row,justifyContent:'space-between',width:840,padding:'20px 36px',background:jump===i?rgba(A,.13):C.panel,borderLeft:`5px solid ${jump===i?A:C.line}`,...rise(f,LT.catResults+i*8)}}><div><div style={{fontSize:38,fontWeight:600}}>{s}</div><Label style={{marginTop:8}}>{i?'00:12:08:03':'00:12:04:10'} → source</Label></div><Arrow color={jump===i?A:C.muted}/></div>)}
 </>;
};

const Transcription:React.FC<{f:number}> = ({f}) => <>
 <FrameLabel name="LOCAL TRANSCRIPTION" right="SRT + TEXT" color={A}/>
 <div style={{...pos(0,90),width:912,height:154,borderBottom:`2px solid ${C.line}`}}><Wave f={f} width={912} height={142} color={A}/></div>
 {['Every angle.','Every word.','Your cut.'].map((s,i)=><div key={s} style={{...pos(0,294+i*145),width:840,padding:'24px 36px',background:C.panel,...rise(f,LT.cues[i])}}><Label color={A}>00:00:0{i*2+1}.000 → 00:00:0{i*2+3}.000</Label><div style={{fontSize:48,fontWeight:650,marginTop:16}}>{s}</div></div>)}
 <div style={{...pos(0,762),...row,opacity:appear(f,LT.cues[2],12)}}><Check color={A}/><Label color={A}>LOCAL · TIMESTAMPED</Label></div>
</>;

const Quality:React.FC<{f:number}> = ({f}) => {
 const phase=(f-LT.qc)%LT.cycle,blank=f<LT.flag&&(phase>=24&&phase<30||phase>=54),changed=phase>=30,flag=f>=LT.flag;
 return <>
  <FrameLabel name="MEDIA QC & DAILIES" color={A}/>
  <div style={{...pos(0,88),height:386,width:912,background:'#060908'}}>
   {!blank&&<SourceFrame f={f} changed={changed||flag} freeze={changed||flag} uid="ph-qc"/>}
   {flag&&<><svg width="912" height="390" style={{position:'absolute',inset:0}}><rect x="576" y="238" width="192" height="111" fill={rgba(A,.08)} stroke={A} strokeWidth={4+6*pulse(f,LT.flag)}/><path d="M575 238l-92-45" stroke={A} strokeWidth="3"/></svg><Label color={A} style={pos(238,147)}>FREEZE</Label></>}
  </div>
  {!flag?<div style={{...pos(0,530),width:912,textAlign:'center'}}><div style={{fontSize:58,fontWeight:650}}>What changed?</div><Label style={{marginTop:22}}>A · BLANK · A′ · BLANK</Label><div style={{fontSize:42,color:C.muted,marginTop:32}}>Your eyes miss a cut.<br/>QC points to the source.</div></div>:['Freeze · 00:12:04:10','Black frame · 00:12:09:02','Silence · 00:12:14:00'].map((s,i)=><div key={s} style={{...pos(0,510+i*91),...row,width:840,padding:'17px 36px',background:rgba(A,i?.05:.13),...rise(f,LT.rows[i])}}><span style={{width:16,height:16,borderRadius:8,background:A}}/><span style={{fontSize:38,fontWeight:i?500:650}}>{s}</span></div>)}
 </>;
};

const Proxy:React.FC<{f:number}> = ({f}) => {
 const lock=eo(prog(f,LT.sync,LT.sync+20)),theta=(f-LT.proxy)*.026;
 return <>
  <FrameLabel name="PROXY PREPARATION" right="SOURCE LINKS" color={A}/>
  <svg width="912" height="530" style={pos(0,66)} viewBox="0 0 912 530">
   <ellipse cx="456" cy="434" rx="274" ry="32" fill="#050909" opacity=".5"/>
   <circle cx="456" cy="256" r="218" fill={rgba(A,.025)} stroke={rgba(A,.28)} strokeWidth="3"/>
   {Array.from({length:12},(_,i)=>{const ang=i*Math.PI/6+theta,x=456+Math.cos(ang)*254,y=256+Math.sin(ang)*206,k=lock>.5?Math.floor((f-LT.sync)/4):i;return <g key={i} transform={`translate(${x-48},${y-49}) rotate(${(1-lock)*(ang*180/Math.PI+90)},48,49)`}><rect width="96" height="98" rx="4" fill={C.panel} stroke={rgba(A,.5)} strokeWidth="2"/><path d="M8 82h80" stroke={C.line} strokeWidth="2"/><ellipse cx="48" cy={50-Math.abs(Math.sin(k*Math.PI/6))*29} rx="17" ry="17" fill={C.amber}/></g>;})}
   <circle cx="456" cy="256" r="80" fill={C.canvas}/><circle cx="456" cy={280-Math.abs(Math.sin((f-LT.sync)*.13))*63*lock} r="27" fill={A}/><path d="M412 307h88" stroke={C.line} strokeWidth="3"/>
  </svg>
  <div style={{...pos(0,612),width:912,textAlign:'center',fontSize:45,fontWeight:650,color:A}}>{lock>.7?'Stills become motion.':'Frames enter the zoetrope.'}</div>
  <div style={{...pos(0,700),...row,justifyContent:'center'}}>{['CAM A','CAM B','REC'].map((s,i)=><Chip key={s} accent={A} active={f>=LT.jobs[i]} style={{opacity:appear(f,LT.jobs[i],10)}}>{s} {f>=LT.sync?'✓':'↗'}</Chip>)}</div>
 </>;
};

const Timecode:React.FC<{f:number}> = ({f}) => {
 const sync=eo(prog(f,LT.align,LT.align+12));
 return <>
  <FrameLabel name="TIMECODE ASSEMBLY" right="FCP7 XML" color={A}/>
  <div style={{...pos(0,85),...row,justifyContent:'center',height:118,width:912,background:rgba(A,.08)}}><Label size={50} color={A}>01:12:04:10</Label><Arrow color={A}/><Label size={34}>RECORDED TC</Label></div>
  <svg width="912" height="438" style={pos(0,241)}>
   {[0,1,2,3].map(i=><g key={i}><text x="36" y={64+i*105} fill={C.muted} fontSize="36" fontFamily={MONO}>{['CAM A','CAM B','CAM C','REC'][i]}</text><rect x={188+(1-sync)*[48,157,-18,99][i]} y={24+i*105} width={620-i*46} height="58" rx="5" fill={rgba([A,C.amber,C.success,C.focus][i],.16)} stroke={[A,C.amber,C.success,C.focus][i]} strokeWidth="2"/>{Array.from({length:Math.floor((620-i*46-28)/8)},(_,j)=><path key={j} d={`M${200+j*8+(1-sync)*[48,157,-18,99][i]} ${42+i*105}v${12+Math.abs(Math.sin(j*1.72+i))*24}`} stroke={[A,C.amber,C.success,C.focus][i]} strokeWidth="2"/>)}</g>)}
   <path d="M188 0v435" stroke={A} strokeWidth={3+6*pulse(f,LT.align)}/>
  </svg>
  <div style={{...pos(0,724),...row,justifyContent:'center',opacity:appear(f,LT.align,10)}}><Check color={A}/><Label color={A}>ALIGNED FROM TIMECODE</Label></div>
 </>;
};

export const Library:React.FC = () => {
 const f=useWorldFrame();
 const mode=f<LT.catalog?0:f<LT.transcribe?1:f<LT.qc?2:f<LT.proxy?3:f<LT.tc?4:5;
 const subtitle=['Keyword search. Local sources.','Visual matches and spoken words.','Speech becomes timed text.','Find what your eyes miss.','Playable copies. Source links.','Recorded timecode, aligned.'][mode];
 const footer=['Find anything you shot.','Jump straight to the source.','Timestamped, on your PC.','Flags to review, not verdicts.','Your originals stay intact.','An editable FCP7 XML.'][mode];
 return <Scene id="library" title={'Find your\nnext shot.'} subtitle={subtitle} footer={footer} note="Local search and transcription. QC is advisory.">
  {mode===0?<LibraryGrid f={f}/>:mode===1?<Catalog f={f}/>:mode===2?<Transcription f={f}/>:mode===3?<Quality f={f}/>:mode===4?<Proxy f={f}/>:<Timecode f={f}/>}
 </Scene>;
};

const EA=ACCENT.editroom;
const BallStill:React.FC<{right:boolean;w:number;h:number;highlight?:boolean}> = ({right,w,h,highlight=false}) => <svg width={w} height={h} viewBox="0 0 912 380" style={{display:'block'}}><rect width="912" height="380" fill={highlight?rgba(EA,.11):C.panel}/><path d="M68 308h776" stroke={C.line} strokeWidth="4"/><ellipse cx={right?666:246} cy="309" rx="55" ry="12" fill="#060708"/><circle cx={right?666:246} cy="248" r="57" fill={EA}/><ellipse cx={right?649:229} cy="229" rx="19" ry="13" fill="#f9e6de" opacity=".6"/></svg>;
const CutStrip:React.FC<{f:number;y:number;collapsed?:number}> = ({f,y,collapsed=0}) => <svg width="912" height="130" style={pos(0,y)}>
 {Array.from({length:12},(_,i)=>{const x=mix(i*76,456,collapsed),w=74*(1-collapsed);return <g key={i}><rect x={x} y="24" width={w} height="68" rx="3" fill={rgba(i%2?EA:C.amber,.2)} stroke={i%2?EA:C.amber} strokeWidth="2"/>{collapsed<.8&&<text x={x+w/2} y="70" textAnchor="middle" fontFamily={MONO} fontSize="36" fill={C.text}>{i%2?'B':'A'}</text>}</g>;})}
 <path d={`M${Math.min(900,40+((f%150)/150)*830)} 0v116`} stroke={EA} strokeWidth="4"/>
</svg>;

const Beta:React.FC<{f:number}> = ({f}) => {
 const right=(Math.floor((f-ET.beta[0])/15)%2+2)%2===1,reveal=eio(prog(f,ET.reveal,ET.reveal+18));
 return <>
  <FrameLabel name="BETA MOVEMENT" right="TWO STILLS" color={EA}/>
  {reveal<1?<div style={{...pos(0,106),opacity:1-reveal}}><BallStill right={right} w={912} h={380}/></div>:null}
  {reveal>0&&[false,true].map((r,i)=><div key={i} style={{...pos(i*474,140),opacity:reveal,transform:`translateX(${(i?1:-1)*(1-reveal)*100}px)`}}><BallStill right={r} w={438} h={260}/><Label color={EA} style={{marginTop:22,textAlign:'center'}}>STILL {i?'B':'A'}</Label></div>)}
  <CutStrip f={f} y={528}/>
  <div style={{...pos(0,702),width:912,textAlign:'center',fontSize:52,fontWeight:650,opacity:appear(f,ET.illusion,10),color:EA}}>Every cut is an illusion.</div>
 </>;
};

const Director:React.FC<{f:number}> = ({f}) => {
 const switchCount=ET.switches.filter(x=>f>=x).length,cam=[0,1,2,0,1][switchCount];
 const hold=f>=ET.hold&&f<ET.switches[2];
 return <>
  <FrameLabel name="CAMERA DIRECTOR" color={EA}/>
  {[0,1,2].map(i=><div key={i} style={{...pos(i*309,90),width:294,opacity:appear(f,ET.director+i*5,15)}}><div style={{border:`4px solid ${cam===i?EA:C.line}`}}><Shot kind={(['stage','room','studio'] as const)[i]} seed={58+i} uid={'ph-director-'+i} w={286} h={260} t={f/60}/></div><Label color={cam===i?EA:C.muted} style={{marginTop:22,marginLeft:36}}>CAM {String.fromCharCode(65+i)}</Label><svg width="294" height="120" style={{marginTop:18}}>{Array.from({length:19},(_,j)=>{const en=(i===cam?.62:.22)+.16*Math.sin(j*.5+f*.1+i);return <rect key={j} x={j*15} y={100-en*92} width="9" height={en*92} fill={cam===i?EA:C.muted}/>;})}</svg></div>)}
  <div style={{...pos(0,570),width:912,textAlign:'center',fontSize:40,fontWeight:600,color:hold?C.amber:C.text}}>{hold?'Hold the shot. Minimum length.':'Speech energy selects an angle.'}</div>
  <svg width="912" height="142" style={pos(0,640)}>{[0,1,2,0,1].map((k,i)=><g key={i} opacity={f>=(i?ET.switches[i-1]:ET.director)?1:.16}><rect x={i*181} y="18" width="177" height="76" rx="4" fill={rgba([C.amber,EA,C.success][k],.22)} stroke={[C.amber,EA,C.success][k]} strokeWidth="3"/><text x={i*181+88} y="69" textAnchor="middle" fill={C.text} fontFamily={MONO} fontSize="36">{String.fromCharCode(65+k)}</text></g>)}</svg>
 </>;
};

const Silence:React.FC<{f:number}> = ({f}) => {
 const collapsed=ET.collapse.map(at=>eo(prog(f,at,at+12))),gapWidths=collapsed.map(p=>67*(1-p));
 let x=0;
 return <>
  <FrameLabel name="SILENCE ROUGH CUT" color={EA}/>
  <Label style={pos(36,83)} color={f>=ET.detect?EA:C.muted}>{f>=ET.detect?'QUIET GAPS DETECTED':'LISTENING FOR QUIET GAPS'}</Label>
  <svg width="912" height="240" style={pos(0,162)}>
   {[0,1,2,3,4].map((i)=>{const left=x;x+=127+(gapWidths[i]||0);return <g key={i}><rect x={left} y="42" width="124" height="148" rx="6" fill={rgba(EA,.12)} stroke={EA} strokeWidth="2"/>{Array.from({length:19},(_,j)=><path key={j} d={`M${left+10+j*5.5} ${112-Math.abs(Math.sin(j*.77+i))*50}v${10+Math.abs(Math.sin(j*.77+i))*100}`} stroke={EA} strokeWidth="3"/>)}{i<4&&<rect x={left+127} y="42" width={gapWidths[i]} height="148" fill={rgba(C.muted,.055)} stroke={C.line} strokeDasharray="7 7" strokeWidth="2"/>}</g>;})}
  </svg>
  <div style={{...pos(36,445),width:840,...rise(f,ET.list)}}><Label color={EA}>EDITABLE CUT LIST</Label>{['Quiet gap · 00:00:04','Breath · 00:00:07','Quiet gap · 00:00:11'].map((s,i)=><div key={s} style={{...row,justifyContent:'space-between',marginTop:18,padding:'18px 18px',background:C.panel}}><span style={{fontSize:36}}>{s}</span><Chip accent={i===1&&f>=ET.keep?C.success:EA} style={{fontSize:36,padding:'10px 18px'}}>{i===1&&f>=ET.keep?'Keep':'Cut'}</Chip></div>)}</div>
 </>;
};

const Launcher:React.FC<{f:number}> = ({f}) => <>
 <FrameLabel name="COMMAND LAUNCHER" right="RECIPE" color={EA}/>
 {['Audio Repair','Loudness Delivery','Proxy Preparation','Styled Captions'].map((s,i)=>{
  const running=f>=ET.run,done=f>=ET.done,p=appear(f,ET.snaps[i],11);
  return <React.Fragment key={s}><div style={{...pos(0,95+i*142),...row,width:840,padding:'22px 36px',background:C.panel,borderLeft:`5px solid ${done?C.success:EA}`,opacity:p,transform:`translateX(${(1-p)*(i%2?60:-60)}px)`}}><Label size={36} color={EA}>0{i+1}</Label><span style={{fontSize:42,fontWeight:600,flex:1}}>{s}</span>{done?<Check/>:running?<span style={{width:16,height:16,borderRadius:8,background:EA}}/>:null}</div>{i<3&&<div style={{...pos(438,216+i*142),height:23,width:3,background:EA,opacity:p}}/>}</React.Fragment>;
 })}
 <div style={{...pos(0,711),width:912,textAlign:'center',opacity:appear(f,ET.lock,10),fontSize:46,fontWeight:650,color:f>=ET.done?C.success:EA}}>{f>=ET.done?'Four steps. One completed recipe.':f>=ET.run?'Running your chosen steps…':'You choose the recipe.'}</div>
</>;

const Styled:React.FC<{f:number}> = ({f}) => {
 const idx=Math.max(0,ET.styles.filter(t=>f>=t).length-1),s=['Clean','Pop','Focus'][idx];
 return <>
  <FrameLabel name="STYLED CAPTIONS" color={EA}/>
  <div style={{...pos(0,94),width:912,height:420,overflow:'hidden'}}><SourceFrame f={f} uid="ph-style" h={420}/><div style={{...pos(40,235),width:832,textAlign:'center',fontSize:idx===1?66:60,fontWeight:idx===1?850:700,lineHeight:1.2,transform:`scale(${1+pulse(f,ET.styles[idx],12)*.07})`}}><span style={{padding:'8px 20px',background:idx===1?EA:rgba(C.canvas,.83),color:idx===1?C.canvas:C.text}}>Every angle.</span><br/><span style={{display:'inline-block',marginTop:12,padding:'8px 20px',background:rgba(C.canvas,.83),color:idx===2?EA:C.text}}>Every word.</span></div></div>
  <div style={{...pos(0,572),...row,justifyContent:'center'}}>{['Clean','Pop','Focus'].map((name,i)=><Chip key={name} accent={EA} active={i===idx} style={{fontSize:40,padding:'20px 32px'}}>{name}</Chip>)}</div>
  <div style={{...pos(0,710),width:912,textAlign:'center',fontSize:46,fontWeight:650,color:EA}}>{s} burn-in style.</div>
 </>;
};

export const EditRoom:React.FC = () => {
 const f=useWorldFrame(),mode=f<ET.director?0:f<ET.silence?1:f<ET.launcher?2:f<ET.captions?3:f<ET.exit?4:5;
 const footer=['Two images. Apparent motion.','A first cut for you to review.','Keep what matters. Edit the list.','Your steps, in your order.','Give every word a style.','Your cut. Your choices.'][mode];
 return <Scene id="editroom" title={'Get to a\nfirst cut.'} subtitle={['Every cut is an illusion.','Energy guides the first cut.','Quiet gaps become editable cuts.','Chain the tools you choose.','Clean, Pop or Focus.','Bring the focus back to you.'][mode]} footer={footer} note="Review the first cut. You control the final edit.">
  {mode===0?<Beta f={f}/>:mode===1?<Director f={f}/>:mode===2?<Silence f={f}/>:mode===3?<Launcher f={f}/>:mode===4?<Styled f={f}/>:<><CutStrip f={f} y={315} collapsed={eio(prog(f,ET.exit,ET.dot))}/><div style={{...pos(448,369),width:16,height:16,borderRadius:8,background:C.focus,opacity:appear(f,ET.dot,6)}}/></>}
 </Scene>;
};

const PA=ACCENT.profile;
const Taste:React.FC<{f:number}> = ({f}) => {
 const resolve=eio(prog(f,PT.resolve,PT.resolve+18));
 const blobs=[{x:160,y:146,r:94,c:C.amber},{x:745,y:215,r:87,c:'#8fc1d4'},{x:207,y:582,r:114,c:'#c79bf2'},{x:698,y:629,r:101,c:EA}];
 return <>
  {f<PT.resolve+20&&<svg width="912" height="820" style={{position:'absolute',inset:0,opacity:appear(f,PT.blobs[0],48)*(1-resolve)}}><defs><filter id="ph-troxler"><feGaussianBlur stdDeviation="24"/></filter></defs>{blobs.map((b,i)=><circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity=".48" filter="url(#ph-troxler)"/>)}<rect x="196" y="186" width="520" height="455" rx="12" stroke={rgba(PA,.35)} fill="none" strokeWidth="3" opacity={appear(f,PT.frame[0],40)}/><circle cx="456" cy="410" r="11" fill={PA}/></svg>}
  {f<PT.resolve&&<div style={{...pos(0,48),width:912,textAlign:'center',opacity:appear(f,PT.focusText,18)}}><Label size={36} color={PA}>FOCUS HERE</Label><div style={{fontSize:44,lineHeight:1.3,marginTop:632,opacity:appear(f,PT.holdText,15)}}>Keep your eyes on the dot.<br/>The clutter fades.</div></div>}
  {f>=PT.resolve&&<div style={{position:'absolute',inset:0,opacity:resolve}}><FrameLabel name="CREATIVE PROFILE" right="YOUR CHOICES" color={PA}/>
   {['Notes · warm, restrained','References · Episode 2','Preferences · clean captions'].map((s,i)=><div key={s} style={{...pos(0,82+i*104),width:840,padding:'22px 36px',background:C.panel,fontSize:38,...rise(f,PT.rows[i])}}>{s}</div>)}
   <div style={{...pos(36,434),...row,gap:22}}><Chip accent={C.success} active={f>=PT.approve} style={{fontSize:40,padding:'20px 26px'}}>{f>=PT.approve?'✓ ':''}Approve</Chip><Chip accent={EA} active={f>=PT.reject} style={{fontSize:40,padding:'20px 26px'}}>{f>=PT.reject?'× ':''}Reject</Chip></div>
   <div style={{...pos(0,576),width:840,padding:'25px 36px',background:rgba(PA,.075),...rise(f,PT.suggest)}}><Label color={PA}>SUGGESTION · CAPTION STYLE</Label><div style={{fontSize:42,fontWeight:600,marginTop:22}}>{f>=PT.apply?'You chose to apply Clean.':'Use Clean for this sequence?'}</div><div style={{...row,marginTop:26,color:PA}}>{f>=PT.apply?<Check color={PA}/>:<Arrow color={PA}/>}<span style={{fontSize:36}}>{f>=PT.apply?'Applied by your choice':'Choose whether to apply'}</span></div></div>
  </div>}
 </>;
};

const Intelligence:React.FC<{f:number}> = ({f}) => {
 const plan=f>=PT.plan,applied=f>=PT.applyPlan;
 return <>
  <FrameLabel name="INTELLIGENCE" right="RULES · LOCAL" color={PA}/>
  {['Sources ready','Sync reviewed','Caption spacing tidied'].map((s,i)=><div key={s} style={{...pos(0,84+i*79),...row,width:840,padding:'15px 36px',background:C.panel,...rise(f,PT.checks[i])}}><Check color={PA} size={40}/><span style={{fontSize:36,fontWeight:600}}>{s}</span></div>)}
  <div style={{...pos(36,353),...row,width:840,justifyContent:'space-between',opacity:appear(f,PT.marker,10)}}><Label color={PA}>REVIEW MARKER</Label><svg width="400" height="49"><path d="M0 29h400" stroke={C.line} strokeWidth="3"/><path d="M210 3v44M197 3h26l-13 16z" stroke={PA} fill={PA} strokeWidth="3"/></svg></div>
  <div style={{...pos(0,434),...row,width:840,padding:'20px 36px',background:rgba(PA,.08),opacity:appear(f,PT.endpoint,10)}}><span style={{fontSize:36,fontWeight:600,flex:1}}>Your own API endpoint</span><span style={{fontFamily:MONO,fontSize:36,color:PA}}>OPTIONAL</span></div>
  {plan&&<div style={{...pos(36,542),width:840,...rise(f,PT.plan)}}><Label color={PA}>PROPOSED PLAN · REVIEW FIRST</Label>{['Clean selected caption spacing','Add a selected review marker'].map((s,i)=><div key={s} style={{...row,marginTop:24}}><div style={{width:34,height:34,border:`2px solid ${PA}`,background:f>=PT.planChecks[i]?rgba(PA,.2):undefined}}>{f>=PT.planChecks[i]&&<Check color={PA} size={33}/>}</div><span style={{fontSize:36}}>{s}</span></div>)}<Chip accent={applied?C.success:PA} style={{marginTop:26,fontSize:36}}>{applied?'✓ You applied 2 changes':'Apply 2 selected changes'}</Chip></div>}
 </>;
};

const Queue:React.FC<{f:number}> = ({f}) => <>
 <FrameLabel name="YOUR QUEUE" right="ON THIS PC" color={PA}/>
 {['Loudness Delivery','Proxy Preparation','Caption Export'].map((name,i)=>{
  const p=i===0?clamp((f-PT.toQueue)/(PT.jobDone-PT.toQueue)):.28+(f-PT.toQueue)*.0017*(i===1?1:.5),done=i===0&&f>=PT.jobDone;
  return <div key={name} style={{...pos(0,108+i*207),width:840,padding:'29px 36px',background:C.panel,transform:`rotateY(${f>=PT.flip?eio(prog(f,PT.flip,720))*90:0}deg)`}}><div style={{...row,justifyContent:'space-between'}}><span style={{fontSize:42,fontWeight:600}}>{name}</span>{done?<Check color={C.success}/>:<Label color={PA}>{Math.floor(p*100)}%</Label>}</div><div style={{marginTop:35,height:10,background:C.line,borderRadius:5}}><div style={{width:`${p*100}%`,height:10,background:done?C.success:PA,borderRadius:5}}/></div><Label style={{marginTop:22}} color={done?C.success:C.muted}>{done?'COMPLETE':'PROCESSING LOCALLY'}</Label></div>;
 })}
 </>;

export const Profile:React.FC = () => {
 const f=useWorldFrame(),mode=f<PT.toIntel?0:f<PT.toQueue?1:2;
 return <Scene id="profile" title={'Your taste.\nYour control.'} subtitle={mode===0?'Focus on what matters.':mode===1?'A helper with human approval.':'Your chosen work, in progress.'} footer={mode===0?'Suggestions you choose to apply.':mode===1?'Review every change first.':'Your jobs stay on your PC.'} note={mode===0?'Local calibration. Not model training.':mode===1?'Rules run locally. Your own API is optional.':'Local processing. No autonomous cutting.'}>
  {mode===0?<Taste f={f}/>:mode===1?<Intelligence f={f}/>:<Queue f={f}/>}
 </Scene>;
};

const AA=ACCENT.anywhere;
const PrivacyIcon:React.FC<{i:number}> = ({i}) => <svg width="46" height="46" viewBox="0 0 48 48"><g stroke={AA} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{i===0?<><path d="M13 34h21a9 9 0 00-1-18 11 11 0 00-21-2 10 10 0 001 20"/><path d="M7 7l34 34"/></>:i===1?<><path d="M10 38V28m9 10V18m9 20V14m9 24V8"/><path d="M7 7l34 34"/></>:i===2?<><rect x="7" y="8" width="34" height="24" rx="3"/><path d="M17 40h14m-7-8v8"/></>:<><path d="M10 6h18l8 8v15M10 6v35h12m6-35v8h8"/><rect x="28" y="31" width="13" height="11" rx="2"/><path d="M31 31v-3a4 4 0 018 0v3"/></>}</g></svg>;

export const Anywhere:React.FC = () => {
 const f=useWorldFrame(),reflow=eio(prog(f,AT.reflow[0],AT.reflow[1])),exit=eio(prog(f,AT.exit[0],AT.exit[1]));
 // Direction belongs to the controls. The separate timeline is always LTR.
 const rtl=f>=AT.lock,play=100+Math.max(0,f)*.93;
 return <Scene id="anywhere" title={'Your media.\nYours.'} subtitle="English or Arabic. Local-first." footer={f>=AT.stays?'On your PC. In your control.':'The interface mirrors. Time moves on.'} note="A desktop app with a phone-sized layout.">
  <div style={{opacity:1-exit,transform:`translateY(${-exit*58}px)`}}>
   <div style={{...row,justifyContent:'space-between',width:840,marginLeft:36}}><Label color={AA}>ENGLISH ↔ العربية</Label><div style={{...row,gap:16}}><Label color={C.muted}>EN</Label><Chip accent={AA} active={f>=AT.toggle} style={{fontFamily:AR,fontSize:36,padding:'10px 18px'}}>العربية</Chip></div></div>
   <div style={{...pos(0,105),width:912,direction:rtl?'rtl':'ltr',fontFamily:rtl?AR:undefined}}>
    <div style={{...row,justifyContent:'space-between',padding:'0 36px'}}><div style={{fontSize:40,fontWeight:650,color:C.text}}>{rtl?'المراجعة':'Review'}</div><Label color={AA}>{rtl?'مشروع محلي':'LOCAL PROJECT'}</Label></div>
    <div style={{...pos(rtl?672:36,81),width:204,height:mix(164,116,reflow),padding:'12px 18px',boxSizing:'border-box',background:rgba(AA,.07),borderLeft:rtl?undefined:`3px solid ${AA}`,borderRight:rtl?`3px solid ${AA}`:undefined,opacity:1-reflow}}><div style={{fontSize:36,lineHeight:1.2,color:AA}}>{rtl?'المصادر':'Sources'}</div><div style={{fontFamily:MONO,fontSize:36,lineHeight:1.2,marginTop:10}}>CAM A<br/>CAM B</div></div>
    {[0,1].map(i=>{
     const x=mix(rtl?i*246+18:246+i*246, i*470,reflow),y=mix(84,87,reflow),w=mix(228,442,reflow),h=mix(130,164,reflow);
     return <div key={i} style={{...pos(x,y),width:w,height:h,direction:'ltr'}}><Shot kind={i?'room':'stage'} uid={'ph-any-'+i} seed={91+i} w={w} h={h} t={f/60}/><div style={{...pos(36,h-50),background:rgba(C.canvas,.85),padding:'3px 10px',fontFamily:MONO,fontSize:36,color:AA}}>CAM {i?'B':'A'}</div></div>;
    })}
    <div style={{...pos(36,280),...row,justifyContent:'space-between',width:840,opacity:appear(f,AT.calloutUI,14),color:AA,fontSize:36}}><span style={{fontFamily:AR}}>الواجهة من اليمين إلى اليسار</span><Arrow color={AA} left/></div>
   </div>
   <div style={{...pos(0,455),width:912,direction:'ltr'}}>
    <div style={{...row,justifyContent:'space-between',width:840,marginLeft:36,opacity:appear(f,AT.calloutTL,10)}}><Label color={AA}>TIMELINE →</Label><Label color={AA}>00:02:{String(22+Math.floor(Math.max(0,f)/60)).padStart(2,'0')}:00</Label></div>
    <svg width="912" height="138" style={{marginTop:18}}>{[0,1,2].map(i=><g key={i}><rect x="0" y={i*43} width="912" height="33" rx="3" fill={rgba([AA,C.success,'#8fc1d4'][i],.14)}/>{Array.from({length:89},(_,j)=><path key={j} d={`M${j*10+5} ${i*43+12-Math.abs(Math.sin(j*.79+i))*7}v${8+Math.abs(Math.sin(j*.79+i))*13}`} stroke={[AA,C.success,'#8fc1d4'][i]} strokeWidth="2"/>)}</g>)}<path d={`M${play} 0v138`} stroke={AA} strokeWidth={3+4*pulse(f,AT.calloutTL)}/></svg>
   </div>
   <div style={{...pos(36,677),display:'grid',gridTemplateColumns:'1fr 1fr',columnGap:24,rowGap:20,width:840}}>{['No cloud','No telemetry','On your PC','Originals untouched'].map((s,i)=><div key={s} style={{...row,gap:16,...rise(f,AT.chips[i])}}><PrivacyIcon i={i}/><span style={{fontSize:36,fontWeight:600,color:f>=AT.stays?AA:C.text}}>{s}</span></div>)}</div>
  </div>
 </Scene>;
};
