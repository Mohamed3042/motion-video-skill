import React from 'react';
import {Scene, C, ACCENT, FONT, MONO, Wave, useWorldFrame, appear, clamp, prog, eo, eio, mix, rgba, pulse} from './kit';
import {mulberry32} from '../mpw/timing';
import {T as INGEST, CLIPS} from '../mpw/worlds/ingest/timing';
import {T as SYNC, offsetPx} from '../mpw/worlds/sync/timing';
import {BARS, LANE, LANE_W, CH_H, WORD_X, WORD_W, STACK_H} from '../mpw/worlds/sync/word';
import {T as REVIEW, LOCKS, OFFSETS, beamsX} from '../mpw/worlds/review/timing';
import {T as CAPTION, LINE, FIXED, KEYS, MOVES, SEARCH, SEARCH_KEYS, STACK_LAND} from '../mpw/worlds/captions/timing';
import {T as HANDOFF} from '../mpw/worlds/handoff/timing';

// These illustrations are composed in the portrait stage's own coordinates.
// Desktop timings and encoded waveform amplitudes remain the musical contract.
const WIDTH = 912;
const TEXT_LEFT = 36;
const TEXT_WIDTH = 840;
const CAMS = ['C1', 'C2', 'C3', 'ZOOM'];
const absolute: React.CSSProperties = {position: 'absolute'};
const Text: React.FC<{children: React.ReactNode; x?: number; y?: number; w?: number; size?: number; color?: string; mono?: boolean; style?: React.CSSProperties}> = ({children, x=TEXT_LEFT, y=0, w=TEXT_WIDTH, size=44, color=C.text, mono=false, style}) => <div data-phone-text style={{...absolute,left:x,top:y,width:w,fontFamily:mono?MONO:FONT,fontSize:size,lineHeight:1.2,fontWeight:mono?500:600,color,...style}}>{children}</div>;
const Tag: React.FC<{children:React.ReactNode;x:number;y:number;w:number;color?:string;on?:boolean;flash?:number}> = ({children,x,y,w,color=C.amber,on=true,flash=0}) => <Text x={x} y={y} w={w} size={36} color={on?color:C.muted} mono style={{textAlign:'center',padding:'14px 0',boxSizing:'border-box',border:`2px solid ${on?rgba(color,.5+.4*flash):C.line}`,borderRadius:8,background:on?rgba(color,.08+.14*flash):C.panel}}>{children}</Text>;
const Check: React.FC<{x:number;y:number;size?:number;color?:string}> = ({x,y,size=46,color=C.success}) => <svg width={size} height={size} style={{...absolute,left:x,top:y}} viewBox="0 0 48 48"><path d="M7 25 L19 37 L41 11" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round"/></svg>;
const Note:React.FC<{children:React.ReactNode}> = ({children}) => <span style={{fontSize:36,lineHeight:1.2}}>{children}</span>;

const HEX_ROWS=18, HEX_COLS=29, HEX_DX=28, HEX_DY=30;
const HEX=(()=>{const r=mulberry32(11842);return Array.from({length:HEX_ROWS},()=>Array.from({length:HEX_COLS+80},()=>Math.floor(r()*16).toString(16).toUpperCase()));})();
const distSegment=(x:number,y:number,ax:number,ay:number,bx:number,by:number)=>{const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy));return Math.hypot(x-ax-t*dx,y-ay-t*dy);};
const inCheck=(x:number,y:number)=>Math.min(distSegment(x,y,180,275,330,430),distSegment(x,y,330,430,678,95))<48;

const CameraFolder:React.FC<{i:number;f:number}> = ({i,f}) => {
 const p=appear(f,INGEST.subs[i],16),x=66+(i%2)*396,y=180+Math.floor(i/2)*218;
 return <div style={{...absolute,left:x,top:y,width:328,height:168,opacity:p,transform:`translateY(${(1-p)*65}px) rotate(${(1-p)*(i%2?7:-7)}deg)`,transformOrigin:'50% 100%'}}>
  <svg width={328} height={168}><path d="M0 28 V10 Q0 0 12 0 H103 L125 25 H316 Q328 25 328 38 V154 Q328 168 314 168 H14 Q0 168 0 154 Z" fill={rgba(ACCENT.ingest,.13)} stroke={rgba(ACCENT.ingest,.65)} strokeWidth={2}/></svg>
  <Text x={22} y={54} w={280} size={44} color={ACCENT.ingest}>{CAMS[i]}</Text>
  <Text x={22} y={110} w={280} size={36} color={C.muted} mono>{CLIPS[i]} clips</Text>
 </div>;
};

// Eight stereo rows carry the same pixel-face bursts as the desktop hero.
// Their height and spacing are authored for this portrait stage, not cropped.
const EncodedTracks:React.FC<{f:number;opacity?:number;top?:number;compact?:boolean}> = ({f,opacity=1,top=100,compact=false}) => {
 const sx=840/(compact?WORD_W:LANE_W),row=compact?CH_H*sx:54,lane=compact?(LANE.h+LANE.gap)*sx:row*2+3;
 const height=compact?STACK_H*sx+10:510,artTop=compact?(820-STACK_H*sx)/2:top;
 const clipId=`phone-sync-wave-safe-${compact?'compact':'tall'}`;
 // The row display gain fills the narrow pixel-face joins as the final lock lands.
 // It scales every original amplitude equally; the word is never drawn separately.
 const gain=compact?1:1+.12*eio(prog(f,SYNC.sync-18,SYNC.sync));
 return <div style={{...absolute,inset:0,opacity}}>
  {CAMS.map((cam,i)=><Text key={cam} x={36+i*214} y={compact?artTop-76:4} w={198} size={36} mono color={f>=SYNC.lock[i]?C.amber:C.muted} style={{textAlign:'center'}}>{cam}</Text>)}
  <svg width={WIDTH} height={height} style={{...absolute,left:0,top:artTop}}>
   <defs><clipPath id={clipId}><rect x={36} y={0} width={840} height={compact?height:500}/></clipPath></defs>
   <g clipPath={`url(#${clipId})`}>
    {BARS.map((channels,i)=><g key={i} transform={`translate(${offsetPx(i,f)*sx} ${i*lane})`}>
     {channels.map((bars,ch)=><g key={ch}>
      <line x1={-180} x2={WIDTH+180} y1={ch*row+row/2} y2={ch*row+row/2} stroke={rgba(C.amber,.13)} strokeWidth={1}/>
      <path d={bars.map(b=>{const x=36+(b.x-(compact?WORD_X:0))*sx,y=ch*row+row/2,a=b.a*row/CH_H*gain;return `M${x.toFixed(2)} ${(y-a).toFixed(2)}v${(2*a).toFixed(2)}`;}).join(' ')} stroke={C.amber} strokeWidth={2.05} fill="none"/>
     </g>)}
     <line x1={36} x2={876} y1={row*2+(compact?LANE.gap*sx/2:1.5)} y2={row*2+(compact?LANE.gap*sx/2:1.5)} stroke={rgba(C.amber,.1)} strokeWidth={1}/>
    </g>)}
   </g>
  </svg>
 </div>;
};

export const Ingest:React.FC = () => {
 const f=useWorldFrame(),a=ACCENT.ingest,copy=appear(f,INGEST.fly,28),peek=eio(prog(f,INGEST.peek,INGEST.peek+40));
 const blocks=INGEST.blocks.map(at=>eo(prog(f,at,at+10))),resolved=blocks.reduce((s,n)=>s+n,0)/8*.8+.2*eo(prog(f,INGEST.match,INGEST.match+6));
 const matched=f>=INGEST.match,verified=f>=INGEST.untouched;
 const fileCount=INGEST.files.filter(at=>f>=at).length;
 const pour=f<INGEST.reread?(f-INGEST.fly)*.6:(INGEST.reread-INGEST.fly)*.6+(f-INGEST.reread)*.12;
 return <Scene id="ingest" title={<>Bring the<br/>shoot in.</>} subtitle={f<INGEST.fly?'One day folder. Every camera.':f<INGEST.reread?'Copy the shoot.':matched?'The copy passes the hash check.':'Re-read source and copy.'} footer={f<INGEST.match?'Copy. Re-read. Verify.':verified?'Originals never touched.':'SHA-256 hashes match.'} note={<Note>Verified copy · cards are never deleted.</Note>}>
  <div style={{...absolute,inset:0,opacity:1-copy,transform:`translateY(${-70*copy}px)`}}>
   <svg width={912} height={720}><path d="M36 120 V45 Q36 24 58 24 H290 L330 94 H850 Q876 94 876 120 V675 Q876 700 850 700 H60 Q36 700 36 674Z" fill={rgba(a,.025+.045*appear(f,INGEST.fold-10,18))} stroke={a} strokeWidth={3} strokeDasharray={2600} strokeDashoffset={2600*(1-eio(prog(f,0,INGEST.fold)))}/></svg>
   <Text x={70} y={108} w={770} size={36} mono color={a} style={{opacity:appear(f,INGEST.fold,12)}}>DAY FOLDER</Text>
   {CAMS.map((_,i)=><CameraFolder key={i} i={i} f={f}/>)}
  </div>
  <div style={{...absolute,inset:0,opacity:copy*(1-peek),transform:`translateY(${(1-copy)*70}px) scale(${1+.015*pulse(f,INGEST.match,20)})`,transformOrigin:'50% 45%'}}>
   <Text x={36} y={0} w={300} size={44} color={a}>Source</Text>
   <Text x={576} y={0} w={300} size={44} color={a} style={{textAlign:'right'}}>Copy</Text>
   <svg width={912} height={100}><path d="M260 23 H652 M632 5 L652 23 L632 41" fill="none" stroke={rgba(a,.6)} strokeWidth={3}/></svg>
   <Text y={65} size={36} mono color={C.muted} style={{textAlign:'center'}}>{f<INGEST.reread?`${fileCount} / 12 copied`:'RE-READING BOTH SIDES'}</Text>
   <svg width={912} height={595} style={{...absolute,left:0,top:127}}>
    {HEX.map((chars,r)=>Array.from({length:HEX_COLS},(_,col)=>{
     const x=col*HEX_DX+14,y=r*HEX_DY+27,hot=inCheck(x,y),revealed=clamp((resolved*18-r)/2+.2);
     const shift=Math.floor(pour+r*1.2),ch=chars[((col+shift)%chars.length+chars.length)%chars.length];
     const noise=.13+.36*((col*7+r*11+Math.floor(f/12))%9)/8;
     return <text key={`${r}-${col}`} x={50+x} y={y} fontFamily={MONO} fontSize={26} fontWeight={hot?700:400} fill={hot?a:C.muted} opacity={mix(noise,hot?.97:.075,revealed)}>{ch}</text>;
    }))}
    {INGEST.files.map((at,i)=>{const p=eio(prog(f,at-12,at)),v=pulse(f,at,9);return p>0&&f<at+10?<rect key={at} x={mix(86,808,p)} y={34+Math.sin(p*Math.PI)*80+(i%3)*15} width={20+v*8} height={20+v*8} rx={3} fill={a}/>:null;})}
   </svg>
   <Text y={675} size={36} mono color={matched?C.success:a} style={{textAlign:'center'}}>{matched?'SHA-256 MATCH':'SHA-256 · 8 HASH BLOCKS'}</Text>
   <svg width={912} height={70} style={{...absolute,top:729}}>{blocks.map((n,i)=><g key={i}><rect x={36+i*105} y={0} width={93} height={10} rx={5} fill={C.line}/><rect x={36+i*105} y={0} width={93*n} height={10} rx={5} fill={matched?C.success:a}/></g>)}</svg>
   <div style={{...absolute,left:36,top:752,display:'flex',gap:12}}>{CAMS.map((cam,i)=><div key={cam} data-phone-text style={{width:201,fontSize:36,color:f>=INGEST.verified[i]?C.success:C.muted,textAlign:'center'}}>{cam}{f>=INGEST.verified[i]?' ✓':''}</div>)}</div>
   {verified&&<Check x={827} y={675} size={42}/>}
  </div>
  <EncodedTracks f={mix(-60,0,eio(prog(f,INGEST.peek+22,600)))} opacity={peek}/>
  <Text y={652} size={36} color={a} mono style={{textAlign:'center',opacity:peek}}>FOUR RECORDINGS → SYNC</Text>
  <div style={{...absolute,left:36,top:720,width:840,opacity:peek}}><Wave f={f} width={840} height={78} color={a} seed={1}/></div>
 </Scene>;
};

const GroupTimeline:React.FC<{f:number}> = ({f}) => {
 const a=ACCENT.sync;
 return <>
  <Text y={4} size={36} mono color={a}>SYNC GROUPS · SHOOTING ORDER</Text>
  {[0,1,2].map(g=>{const p=appear(f,SYNC.groups[g],20);return <div key={g} style={{...absolute,left:150+g*234,top:90,width:216,height:595,opacity:p,transform:`translateY(${(1-p)*95}px)`}}>
   <Text x={0} y={0} w={216} size={44} color={a} style={{textAlign:'center'}}>G{g+1}</Text>
   {CAMS.map((_,i)=><div key={i} style={{...absolute,left:0,top:88+i*121,width:216,height:97,borderRadius:7,border:`2px solid ${g===2&&i===3&&f>=SYNC.review?C.amber:rgba(a,.38)}`,background:rgba([C.amber,C.success,ACCENT.review][g],.14),overflow:'hidden'}}><Wave f={f} width={216} height={96} color={[C.amber,C.success,ACCENT.review][g]} seed={i+g*2}/>{g===2&&i===3&&f>=SYNC.review&&<svg width={216} height={97}><path d="M176 20 L194 53 H158Z" fill={C.amber}/><path d="M176 31 V41 M176 46 V48" stroke={C.onAmber} strokeWidth={3}/></svg>}</div>)}
  </div>;})}
  {CAMS.map((cam,i)=><Text key={cam} x={36} y={191+i*121} w={105} size={36} mono color={C.muted}>{cam}</Text>)}
  <Text y={715} size={44} color={f>=SYNC.review?C.amber:C.text}>{f>=SYNC.review?'Weak match? Review the clip.':'Every session. Every camera.'}</Text>
  <Text y={776} size={36} mono color={C.muted}>MATCHED GROUPS, ORIGINAL SOURCES</Text>
 </>;
};

const GRID_W=912, GRID_H=472, TILE_W=448, TILE_H=228;
const TILE_POS=[{x:0,y:0},{x:464,y:0},{x:0,y:244},{x:464,y:244}];
const reviewOffset=(i:number,f:number)=>OFFSETS[i]*(1-eio(prog(f,LOCKS[i]-6,LOCKS[i])));
const CameraArt:React.FC<{t:number}> = ({t}) => <>
 <defs><linearGradient id="phone-review-stage" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#10242c"/><stop offset=".72" stopColor="#203e49"/><stop offset=".725" stopColor="#081317"/><stop offset="1" stopColor="#050a0d"/></linearGradient><linearGradient id="phone-review-beam"><stop stopColor="#8fc1d4" stopOpacity="0"/><stop offset=".60" stopColor="#8fc1d4" stopOpacity=".15"/><stop offset=".79" stopColor="#e7faff" stopOpacity=".9"/><stop offset=".83" stopColor="#e7faff"/><stop offset=".91" stopColor="#8fc1d4" stopOpacity=".25"/><stop offset="1" stopColor="#8fc1d4" stopOpacity="0"/></linearGradient></defs>
 <rect width={GRID_W} height={GRID_H} fill="url(#phone-review-stage)"/>
 {Array.from({length:12},(_,i)=><line key={i} x1={i*83} x2={i*83} y1={0} y2={GRID_H} stroke={rgba(ACCENT.review,.07)} strokeWidth={2}/>)}
 {beamsX(t).map((x,k)=><g key={k} transform={`translate(${x*GRID_W/1040} 0) rotate(14 0 236)`}><rect x={-244} y={-150} width={310} height={800} fill="url(#phone-review-beam)"/><ellipse cx={10} cy={410} rx={140} ry={24} fill={rgba('#cfeaf3',.16)}/></g>)}
 <path d="M42 32 L670 186" stroke="#050b0e" strokeWidth={7}/><rect x={652} y={177} width={54} height={18} rx={9} transform="rotate(14 680 187)" fill="#050b0e"/>
 <circle cx={273} cy={181} r={34} fill="#050b0e"/><path d="M200 472 L208 263 Q209 228 245 224 H299 Q335 228 336 263 L345 472Z" fill="#050b0e"/>
 <path d="M530 383 H889 V395 H530Z M552 395 H562 V472 H552Z M860 395 H870 V472 H860Z" fill="#050b0e"/>
 <circle cx={721} cy={281} r={28} fill="#050b0e"/><path d="M679 383 L683 332 Q687 313 708 310 H734 Q755 313 759 332 L765 383Z" fill="#050b0e"/>
</>;
const CameraGrid:React.FC<{f:number;top?:number}> = ({f,top=56}) => <div style={{...absolute,left:0,top,width:GRID_W,height:GRID_H}}>
 {TILE_POS.map(({x,y},i)=>{const locked=i===0||f>=LOCKS[i],flash=pulse(f,LOCKS[i],20),fold=eio(prog(f,i*2,24+i*2));return <div key={i} style={{...absolute,left:x,top:y,width:TILE_W,height:mix(46,TILE_H,fold),overflow:'hidden',borderRadius:9,border:`2px solid ${flash>.05?ACCENT.review:rgba(ACCENT.review,.25)}`,boxSizing:'border-box',background:C.panel,opacity:appear(f,-8+i*2,18)}}>
  <svg width={TILE_W} height={TILE_H} viewBox={`${x} ${y} ${TILE_W} ${TILE_H}`} style={{...absolute,inset:0}}><CameraArt t={f+reviewOffset(i,f)}/></svg>
  <Text x={i%2?16:36} y={18} w={140} size={36} mono color={ACCENT.review}>CAM {'ABCD'[i]}</Text>
  <Text x={i%2?16:36} y={177} w={i%2?375:355} size={36} color={locked?i===3?C.amber:ACCENT.review:C.muted}>{i===0?'Reference':locked?i===3?'Synced · Review':'Synced · Strong':`Offset ${reviewOffset(i,f)>=0?'+':'−'}${(Math.abs(reviewOffset(i,f))/60).toFixed(2)} s`}</Text>
 </div>;})}
 {f>=REVIEW.lockD&&<div style={{...absolute,left:448,top:0,width:16,height:GRID_H,background:rgba(ACCENT.review,.55*pulse(f,REVIEW.lockD,30))}}/>}
</div>;

export const Sync:React.FC = () => {
 const f=useWorldFrame(),a=ACCENT.sync,groups=appear(f,SYNC.zoomOut,28)*(1-eio(prog(f,SYNC.zoomIn,SYNC.zoomIn+30))),tiles=appear(f,SYNC.tiles,24);
 const wordOn=(1-appear(f,SYNC.zoomOut,25))+(appear(f,SYNC.zoomIn,28)*(1-tiles));
 const nudging=f>=SYNC.nudge&&f<SYNC.back;
 const phase=f<120?'Match the recorded sound.':f<240?'Coarse vote.':f<360?'Fine match.':f<SYNC.sync?'Measure clock drift.':f<SYNC.zoomOut?(nudging?'Nudge. Check. Return.':'Four recordings lock together.'):'Every recording session in order.';
 return <Scene id="sync" title={<>Matched by<br/>their sound.</>} subtitle={phase} footer={f<SYNC.zoomOut?'One session. One shared moment.':'Every session. Every camera. In order.'} note={<Note>Clock drift is reported, not corrected.</Note>}>
  <EncodedTracks f={f} opacity={clamp(wordOn)} compact/>
  <div style={{...absolute,left:36,top:614,width:840,opacity:clamp(wordOn)*(1-tiles)}}>
   {f<240?<>
    <Text x={0} y={0} w={840} size={36} mono color={a}>{f<120?'FOUR CAMERAS · RECORDED SOUND':'COARSE · 60 s CHUNK VOTES'}</Text>
    <svg width={840} height={156} style={{...absolute,top:57}}>{Array.from({length:10},(_,i)=>{const at=SYNC.votes[i],p=appear(f,at,9),h=[24,50,73,110,150,115,75,47,30,19][i];return <g key={i}><rect x={15+i*83} y={150-h*p} width={56} height={h*p} rx={4} fill={i===4&&f>=SYNC.win?a:rgba(a,.3)}/>{i===4&&f>=SYNC.win&&<path d="M332 0 L343 12 L354 0" stroke={a} strokeWidth={3} fill="none"/>}</g>;})}</svg>
   </>:f<390?<>
    <Text x={0} y={0} w={840} size={36} mono color={a}>FINE · SHORT WINDOW REFINEMENT</Text>
    {[0,1,2,3].map(i=><Tag key={i} x={i*214} y={64} w={198} color={a} on={f>=SYNC.windows[i]} flash={pulse(f,SYNC.windows[i],12)}>{f>=SYNC.peak&&i===2?'MATCH':`W${i+1}`}</Tag>)}
    <Text x={0} y={145} w={840} size={36} color={C.muted}>Refine the peak between samples.</Text>
   </>:f<SYNC.sync?<>
    <Text x={0} y={0} w={840} size={36} mono color={a}>CLOCK DRIFT · MEASURED / REPORTED</Text>
    <svg width={840} height={120} style={{...absolute,top:68}}><path d="M10 85 H830" stroke={C.line} strokeWidth={2}/><path d={`M20 89 L${mix(20,815,appear(f,SYNC.drift,44))} ${mix(89,30,appear(f,SYNC.drift,44))}`} stroke={a} strokeWidth={4}/>{[0,1,2,3,4].map(i=><circle key={i} cx={40+i*190} cy={88-i*14} r={6} fill={a} opacity={appear(f,SYNC.drift+i*8,10)}/>)}</svg>
   </>:<>
    <Text x={0} y={8} w={840} size={44} color={a} style={{textAlign:'center'}}>{nudging?'One offset breaks the word.':'Four tracks. One alignment.'}</Text>
    <Tag x={120} y={91} w={282} color={a} on={nudging} flash={pulse(f,SYNC.nudge,18)}>+1 ms</Tag>
    <Tag x={438} y={91} w={282} color={a} on={f>=SYNC.back} flash={pulse(f,SYNC.back,18)}>−1 ms</Tag>
   </>}
  </div>
  <div style={{...absolute,inset:0,opacity:groups,transform:`translateY(${(1-groups)*70}px)`}}><GroupTimeline f={f}/></div>
  <div style={{...absolute,inset:0,opacity:tiles}}><Text y={0} size={36} mono color={ACCENT.review}>THE SAME MOMENT · FOUR ANGLES</Text><CameraGrid f={f-SYNC.tiles} top={100}/><Text y={650} size={44} color={ACCENT.review}>See what each camera saw.</Text></div>
 </Scene>;
};

export const Review:React.FC = () => {
 const f=useWorldFrame(),a=ACCENT.review,out=eio(prog(f,REVIEW.exit,REVIEW.exit+34)),fly=eio(prog(f,500,REVIEW.caret));
 const value=f<REVIEW.nudgeMinus?'0':f<REVIEW.nudgePlus?'−1':f<REVIEW.undo?'0':f<REVIEW.redo?'−1':'0';
 const valFlash=[REVIEW.nudgeMinus,REVIEW.nudgePlus,REVIEW.undo,REVIEW.redo].reduce((v,at)=>Math.max(v,pulse(f,at,18)),0);
 const px=36+((Math.max(0,Math.min(f,REVIEW.exit)-REVIEW.dock)*1.3+180)%820);
 return <Scene id="review" title={<>Every angle.<br/>One moment.</>} subtitle={f<REVIEW.lockD?'Follow the light across the seams.':'Four sources. One shared playhead.'} footer={f<REVIEW.lockD?'Bring the picture into sync.':'Nudge by 1 ms. Undo. Redo.'} note={<Note>Approximate preview · use codec proxies.</Note>}>
  <div style={{...absolute,inset:0,opacity:1-out,transform:`scaleX(${1-.975*out})`,transformOrigin:`${px}px 590px`}}>
   <Text y={0} w={400} size={36} mono color={a}>{f<REVIEW.lockD?'AS RECORDED':'SYNCHRONIZED'}</Text>
   <Text x={436} y={0} w={440} size={36} mono color={C.amber} style={{textAlign:'right'}}>00:00:{(9+Math.max(0,f-REVIEW.dock)/60).toFixed(3).padStart(6,'0')}</Text>
   <CameraGrid f={f}/>
   <div style={{...absolute,left:36,top:556,width:840,height:108,opacity:appear(f,REVIEW.dock,20)}}>
    {CAMS.map((cam,i)=><div key={cam} style={{...absolute,left:reviewOffset(i,f)*.6,top:i*26,width:840,height:20,borderRadius:4,background:rgba(i===3?C.amber:a,.27),border:`1px solid ${rgba(i===3?C.amber:a,.55)}`}}/>)}
    <div style={{...absolute,left:px-36,top:-8,width:4,height:119,background:C.amber}}/>
   </div>
   <div style={{...absolute,inset:0,opacity:appear(f,REVIEW.dock,20)}}>
    <Tag x={36} y={687} w={248} color={C.amber} on={true} flash={pulse(f,REVIEW.nudgeMinus,18)}>−1 ms</Tag>
    <Tag x={628} y={687} w={248} color={C.amber} on={true} flash={pulse(f,REVIEW.nudgePlus,18)}>+1 ms</Tag>
    <Text x={300} y={695} w={312} size={49} mono color={valFlash>.05?C.amber:C.text} style={{textAlign:'center'}}>CAM D {value}</Text>
    <Text x={36} y={766} w={416} size={36} mono color={pulse(f,REVIEW.undo,18)>.05?C.amber:C.muted} style={{textAlign:'center'}}>UNDO</Text>
    <Text x={460} y={766} w={416} size={36} mono color={pulse(f,REVIEW.redo,18)>.05?C.amber:C.muted} style={{textAlign:'center'}}>REDO</Text>
   </div>
  </div>
  {out>0&&<div style={{...absolute,left:mix(px,120,fly),top:mix(556,220,fly),width:6,height:mix(115,88,fly),borderRadius:3,background:C.amber,boxShadow:`0 0 ${16+20*pulse(f,REVIEW.caret,18)}px ${rgba(C.amber,.5)}`}}/>}
 </Scene>;
};

const secondLine=LINE.indexOf(' ',LINE.indexOf('.')+1)+1;
const captionSlot=(slot:number)=>slot<secondLine?{x:120+slot*56,y:222}:{x:148+(slot-secondLine)*56,y:380};
const CaptionLetters:React.FC<{f:number}> = ({f}) => {
 const fly=eio(prog(f,CAPTION.fly,CAPTION.fly+40)),pop=pulse(f,CAPTION.fixed,26);
 const count=KEYS.filter(at=>f>=at).length,caret=captionSlot(Math.min(LINE.length,count));
 return <div style={{...absolute,inset:0}}>
  {[...LINE].map((ch,i)=>{if(f<KEYS[i]||i===secondLine-1)return null;const mv=MOVES.find(m=>m.from===i),u=mv?eio(prog(f,mv.land-8,mv.land)):0,from=captionSlot(i),to=captionSlot(mv?.to??i),slot=mix(i,mv?.to??i,u),compact=slot<secondLine?{x:264+slot*32,y:110}:{x:280+(slot-secondLine)*32,y:171},hop=mv?Math.sin(Math.PI*u)*54*(mv.to>mv.from?-1:1):0,land=mv?pulse(f,mv.land,14):0;return <Text key={i} x={mix(mix(from.x,to.x,u),compact.x,fly)} y={mix(mix(from.y,to.y,u)+hop,compact.y,fly)} w={mix(56,32,fly)} size={mix(86,48,fly)} mono color={land>.05?C.amber:ACCENT.captions} style={{textAlign:'center',lineHeight:1,opacity:appear(f,KEYS[i],4),transform:`scale(${1+.14*land+.025*pop})`}}>{ch}</Text>;})}
  {f<CAPTION.fix0-24&&<div style={{...absolute,left:caret.x+3,top:caret.y+4,width:6,height:84,background:C.amber,opacity:count===LINE.length?Math.floor(f/18)%2?1:.2:1}}/>}
  {f>=CAPTION.fixed&&[0,1].map(i=><div key={i} style={{...absolute,left:i?148:120,top:(i?380:222)+103,width:(i?616:672)*appear(f,CAPTION.fixed,12),height:4,background:C.amber,opacity:1-fly}}/>)}
 </div>;
};
const captionsSplit=(f:number)=>f>=CAPTION.split&&!(f>=CAPTION.undo&&f<CAPTION.redo);
const captionShift=(f:number)=>.5*eio(prog(f,CAPTION.shift,CAPTION.shift+12));
const seconds=(n:number)=>n.toFixed(1)+' s';
const Cue:React.FC<{x?:number;y:number;w?:number;a:number;b:number;children:React.ReactNode;selected?:boolean;flash?:number}> = ({x=36,y,w=840,a,b,children,selected=false,flash=0}) => <div style={{...absolute,left:x,top:y,width:w,height:119,borderLeft:`4px solid ${selected?C.amber:C.line}`,paddingLeft:22,boxSizing:'border-box',background:selected?rgba(C.amber,.055+.12*flash):'transparent'}}><Text x={22} y={4} w={w-36} size={36} mono color={selected?C.amber:C.muted}>{seconds(a)} → {seconds(b)}</Text><Text x={22} y={58} w={w-36} size={44}>{children}</Text></div>;

export const Captions:React.FC = () => {
 const f=useWorldFrame(),a=ACCENT.captions,ui=appear(f,CAPTION.fly+14,26),out=eio(prog(f,CAPTION.exit,CAPTION.exit+28)),split=captionsSplit(f),shift=captionShift(f),word=SEARCH.slice(0,SEARCH_KEYS.filter(at=>f>=at).length);
 const action=f<CAPTION.shift?'Search':f<CAPTION.split?'Shift +0.5 s':f<CAPTION.undo?'Split at playhead':f<CAPTION.redo?'Undo':f<CAPTION.marker1?'Redo':f<CAPTION.exported?'Markers':'Export SRT / VTT';
 const marker=f>=CAPTION.marker1;
 return <Scene id="captions" title={<>Make every<br/>word land.</>} subtitle={f<CAPTION.fly?'You can read it. Now edit it.':f<CAPTION.marker1?'Cue text and timing, under your control.':'Markers carry labels and notes.'} footer={f<CAPTION.fixed?'Scrambled. Readable. Editable.':f<CAPTION.exported?'Text. Timing. Markers.':'Ready to export SRT / VTT.'} note={<Note>Editorial splits · timing remains editable.</Note>}>
  <div style={{...absolute,inset:0,opacity:1-out}}>
   <CaptionLetters f={f}/>
   <Text y={56} size={36} mono color={C.muted} style={{opacity:(1-ui),textAlign:'center'}}>EDIT THE CUE TEXT</Text>
   <Text y={598} size={44} color={f>=CAPTION.fixed?C.success:C.muted} style={{opacity:(1-ui)*appear(f,100,20),textAlign:'center'}}>{f>=CAPTION.fixed?'Every angle. Every word.':'First and last letters stay put.'}</Text>
   <div style={{...absolute,inset:0,opacity:ui,transform:`translateY(${(1-ui)*50}px)`}}>
    <Tag x={36} y={0} w={194} color={a} on={f>=CAPTION.imported} flash={pulse(f,CAPTION.imported,18)}>SRT</Tag><Tag x={248} y={0} w={252} color={a} on={f>=CAPTION.imported} flash={pulse(f,CAPTION.imported,18)}>WebVTT</Tag>
    <Text x={534} y={15} w={342} size={36} mono color={f>=CAPTION.exported?C.success:a} style={{textAlign:'right'}}>{f>=CAPTION.exported?'EXPORTED ✓':'CAPTION CUES'}</Text>
    <Text y={226} w={360} size={36} mono color={word?C.amber:C.muted}>{word?`Find: ${word}`:'Search cue text'}</Text>
    <Text x={415} y={222} w={461} size={36} color={C.amber} style={{textAlign:'right'}}>{action}</Text>
    <Cue y={301} a={1+shift} b={3.4+shift}>Four cameras. One take.</Cue>
    {split?<><Cue y={441} x={36} w={416} a={3.5+shift} b={5.2} selected flash={pulse(f,f>=CAPTION.redo?CAPTION.redo:CAPTION.split,18)}>Every angle.</Cue><Cue y={441} x={460} w={416} a={5.2} b={6+shift} selected flash={pulse(f,f>=CAPTION.redo?CAPTION.redo:CAPTION.split,18)}>Every <span style={{background:f>=CAPTION.found?rgba(C.amber,.22):undefined}}>word.</span></Cue></>:<Cue y={441} a={3.5+shift} b={6+shift} selected flash={pulse(f,CAPTION.shift,18)}>Every angle. Every <span style={{background:f>=CAPTION.found?rgba(C.amber,.22):undefined}}>word.</span></Cue>}
    {!marker?<Cue y={581} a={6.2+shift} b={8.8+shift}>Keep the original sound.</Cue>:<>
     <div style={{...absolute,left:36,top:589,width:416,opacity:appear(f,CAPTION.marker1,15),transform:`translateY(${(1-appear(f,CAPTION.marker1,15))*30}px)`}}><Text x={0} y={0} w={416} size={44} color={C.amber}>Laugh — keep</Text><Text x={0} y={58} w={416} size={36} color={C.muted}>Hold the reaction.</Text></div>
     <div style={{...absolute,left:460,top:589,width:416,opacity:appear(f,CAPTION.marker2,15),transform:`translateY(${(1-appear(f,CAPTION.marker2,15))*30}px)`}}><Text x={0} y={0} w={416} size={44} color={C.amber}>Cut here?</Text><Text x={0} y={58} w={416} size={36} color={C.muted}>Check CAM B.</Text></div>
    </>}
    <svg width={912} height={100} style={{...absolute,top:725}}>
     <line x1={36} x2={876} y1={68} y2={68} stroke={C.line} strokeWidth={2}/>
     {[{a:1,b:3.4},{a:3.5,b:6},{a:6.2,b:8.8},{a:9,b:11.5}].map((q,i)=><rect key={i} x={36+(q.a+shift)*64} y={12} width={(q.b-q.a)*64} height={42} rx={4} fill={rgba(i===1?C.amber:a,i===1?.5:.23)} stroke={rgba(i===1?C.amber:a,.6)} strokeWidth={2}/>)}
     {split&&<line x1={36+5.2*64} x2={36+5.2*64} y1={7} y2={61} stroke={C.canvas} strokeWidth={7}/>}
     {[[CAPTION.marker1,7],[CAPTION.marker2,10.2]].map(([at,s],i)=>f>=at?<path key={i} d={`M${36+s*64-12} 66 h24 v18 l-12 10 -12-10Z`} fill={C.amber} transform={`translate(0 ${-25*(1-appear(f,at,10))})`}/>:null)}
     <line x1={36+(3.2+(Math.min(f,CAPTION.exit)-300)*2/150)*64} x2={36+(3.2+(Math.min(f,CAPTION.exit)-300)*2/150)*64} y1={0} y2={90} stroke={C.amber} strokeWidth={3}/>
    </svg>
   </div>
  </div>
  {f>=CAPTION.exit&&<div style={{...absolute,inset:0}}>{STACK_LAND.map((at,j)=>{const p=eio(prog(f,at-12,at)),g=j%3,r=Math.floor(j/3),x=mix(85+(j%4)*192,133+g*285,p),y=mix(742+(j%2)*32,76+r*145,p),merge=eio(prog(f,STACK_LAND[11]+4,STACK_LAND[11]+16));return <div key={at} style={{...absolute,left:x,top:y,width:mix(148,78,merge),height:mix(26,137,p)+8*merge,background:rgba(a,.18+.22*p+.28*pulse(f,at,10)),border:`2px solid ${rgba(a,.75)}`,borderRadius:mix(6,0,merge),opacity:appear(f,at-12,6)}}/>;})}</div>}
 </Scene>;
};

const PRONG_X=[172,456,740];
export const Handoff:React.FC = () => {
 const f=useWorldFrame(),a=ACCENT.handoff,box=appear(f,HANDOFF.box,28),sink=eio(prog(f,HANDOFF.sink,HANDOFF.seal)),seal=eio(prog(f,HANDOFF.seal-12,HANDOFF.seal)),lift=eio(prog(f,HANDOFF.seal+18,HANDOFF.seal+48)),lid=eio(prog(f,HANDOFF.lid,HANDOFF.lid+14)),pour=appear(f,HANDOFF.pour,18);
 const by=mix(521,311,lift),ph=mix(215,380,lift),fork=1-sink;
 return <Scene id="handoff" title={<>A clean<br/>handoff.</>} subtitle={f<HANDOFF.seal?'Three deliverables. One package.':'Your sequence, report and captions.'} footer={f<HANDOFF.untouched?'Ready for your editor.':'Your source media, untouched.'} note={<Note>Validate editor import · FCP7 XML delivery.</Note>}>
  <div style={{...absolute,inset:0,opacity:fork,transform:`translateY(${190*sink}px)`}}>
   <svg width={912} height={690}>
    <defs><linearGradient id="phone-handoff-ribbon" x1="0" x2="1"><stop stopColor={rgba(a,.18)}/><stop offset=".45" stopColor={rgba(a,.8)}/><stop offset=".7" stopColor={rgba(a,.25)}/><stop offset="1" stopColor={rgba(a,.5)}/></linearGradient></defs>
    <path d="M130 190 H214 V407 L418 565 V636 H334 V608 L130 456Z" fill="url(#phone-handoff-ribbon)" stroke={a} strokeWidth={2}/>
    <path d="M414 190 H498 V474 L578 543 V636 H494 V582 L414 528Z" fill="url(#phone-handoff-ribbon)" stroke={a} strokeWidth={2}/>
    <path d="M698 190 H782 V452 L578 610 V636 H494 V570 L698 405Z" fill="url(#phone-handoff-ribbon)" stroke={a} strokeWidth={2}/>
    <path d="M214 407 L418 565 V604 M498 474 L578 543 M698 405 L494 570" fill="none" stroke={rgba(C.canvas,.85)} strokeWidth={6}/>
    {PRONG_X.map((x,i)=><rect key={i} x={x-42} y={190} width={84} height={24} fill={rgba(a,.7)}/>)}
   </svg>
   {[{a:HANDOFF.xml,top:'FCP7 XML',bottom:'Sequence'},{a:HANDOFF.subs,top:'SRT · VTT',bottom:'Captions'},{a:HANDOFF.json,top:'JSON',bottom:'Sync report'}].map((q,i)=><div key={q.top} style={{...absolute,left:36+i*284,top:40,width:272,opacity:appear(f,q.a,12),transform:`translateY(${(1-appear(f,q.a,12))*35}px)`}}><Text x={0} y={0} w={272} size={36} mono color={a} style={{textAlign:'center'}}>{q.top}</Text><Text x={0} y={58} w={272} size={42} style={{textAlign:'center'}}>{q.bottom}</Text></div>)}
  </div>
  {HANDOFF.arrive.map((at,i)=>{const p=eio(prog(f,at-22,at));return p>0&&f<at+8?<svg key={at} width={912} height={820} style={{...absolute,inset:0}}><rect x={mix(PRONG_X[i],456,p)-25} y={mix(210,by+45,p)} width={50} height={65} rx={5} fill={a} transform={`rotate(${(1-p)*(i-1)*20} ${mix(PRONG_X[i],456,p)} ${mix(210,by+45,p)+32})`}/><path d={`M${mix(PRONG_X[i],456,p)-14} ${mix(210,by+45,p)+19} h28 m-28 13 h28`} stroke={C.onAmber} strokeWidth={3}/></svg>:null;})}
  <div style={{...absolute,inset:0,opacity:box,transform:`translateY(${(1-box)*95}px) scale(${1+.018*pulse(f,HANDOFF.seal,20)})`,transformOrigin:'456px 500px'}}>
   <svg width={912} height={820}>
    <path d={`M112 ${by+54} L183 ${by} H741 L800 ${by+54} V${by+ph} H112Z`} fill={rgba(a,.075)} stroke={a} strokeWidth={3}/>
    <path d={`M112 ${by+54} H800 M183 ${by} V${by+54} M741 ${by} V${by+54}`} fill="none" stroke={rgba(a,.6)} strokeWidth={2}/>
    <path d={`M112 ${by+54} L${mix(38,112,seal)} ${by+mix(-32,54,seal)-105*lid} H${mix(398,456,seal)} L456 ${by+54}Z`} fill={rgba(a,.11)} stroke={a} strokeWidth={2}/>
    <path d={`M800 ${by+54} L${mix(874,800,seal)} ${by+mix(-32,54,seal)-105*lid} H${mix(514,456,seal)} L456 ${by+54}Z`} fill={rgba(a,.11)} stroke={a} strokeWidth={2}/>
    <rect x={428} y={by+54} width={56} height={(ph-54)*seal} fill={rgba(a,.18)} opacity={1-lid}/>
    <path d={`M428 ${by+ph-38} h56`} stroke={a} strokeWidth={4} opacity={seal*(1-lid)}/>
   </svg>
   <div style={{...absolute,left:178,top:by+83,width:570,opacity:seal*(1-pour)}}>
    <Text x={0} y={0} w={570} size={36} mono color={a} style={{textAlign:'center'}}>ONE HANDOFF PACKAGE</Text>
    <Text x={0} y={65} w={570} size={44} style={{textAlign:'center'}}>Editable sequence<br/>JSON sync report<br/>SRT / VTT captions</Text>
   </div>
   <Text x={198} y={by+ph+32} w={520} size={36} mono color={f>=HANDOFF.untouched?C.success:C.muted} style={{opacity:appear(f,HANDOFF.seal,22),textAlign:'center'}}>{f>=HANDOFF.untouched?'SOURCE MEDIA PRESERVED':'STACKED CAMERA TRACKS'}</Text>
   {f>=HANDOFF.untouched&&<Check x={151} y={by+ph+26} size={40}/>}
  </div>
  <div style={{...absolute,left:36,top:134,width:840,height:590,opacity:pour,transform:`scaleY(${.35+.65*pour})`,transformOrigin:'50% 50%'}}>
   <Wave f={f} width={840} height={240} color={ACCENT.sound} seed={3}/>
   <Wave f={f+20} width={840} height={240} color={ACCENT.sound} seed={4}/>
   <Text x={0} y={503} w={840} size={44} color={ACCENT.sound} style={{textAlign:'center'}}>Start with the sound.</Text>
  </div>
 </Scene>;
};
