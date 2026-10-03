import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, MONO, ACCENT, SAFE, SW, appear, eo, eio, mix, prog, rgba, Label} from './kit';
import {PAD, WORLDS, LOGO_LOCK} from '../mpw/timing';
import {T0, LOCKS, HIT, WRITE, TAG, LANES, loopHits} from '../mpw/intro/timing';
import {ACTIVE_TILE, MONTAGE, MBEAT, SLIDE, SNAPS, COLLAPSE, FADE} from '../mpw/finale/timing';
const HITS=loopHits();
export const PhoneWordmark:React.FC<{size?:number}> = ({size=124}) => <div style={{fontFamily:FONT,fontWeight:500,lineHeight:1.08,letterSpacing:'.1em',fontSize:size,textAlign:'center'}}>MONTAGE<br/><span style={{color:C.amber,fontWeight:700,letterSpacing:'.26em',paddingLeft:'.26em'}}>PRO</span></div>;
export const Intro:React.FC = () => {
 const f=useCurrentFrame()-PAD,p=appear(f,T0,30),collapse=eio(prog(f,HIT,HIT+30)),word=appear(f,WRITE,24);
 return <AbsoluteFill style={{background:C.canvas,fontFamily:FONT,color:C.text}}>
  <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% 55%,${rgba(C.amber,.11)},transparent 70%)`}}/>
  <div style={{position:'absolute',left:SAFE,top:280,width:SW,fontSize:106,fontWeight:750,letterSpacing:'-.04em',lineHeight:1.06,opacity:p*(1-word)}}>Every angle.<br/>One timeline.</div>
  <div style={{position:'absolute',left:SAFE,top:600,width:SW,opacity:p*(1-collapse*.9)}}>
   {LANES.map((lane,i)=>{
    const locked=f>=LOCKS[i],off=locked?0:Math.sin(f*.018+i)*68+(i-1.5)*35;
    return <div key={lane} style={{position:'absolute',left:0,top:i*178,width:SW,height:150,transform:`translateX(${off*(1-collapse)}px)`}}>
     <Label color={locked?C.amber:C.muted}>{lane} {locked?'· LOCKED':''}</Label>
     <svg width={SW} height={108} style={{position:'absolute',top:45}}><line x1="0" y1="56" x2={SW} y2="56" stroke={C.line}/>
      {HITS.filter(h=>h.lane===i).map((h,j)=>{const x=SW/2+(h.s*60-f)*7;const height=h.kind==='ghost'||h.kind==='shake'?28:76;return x>-30&&x<SW+30?<g key={j} opacity={Math.min(1,.45+height/100)}><line x1={x} y1={56-height/2} x2={x} y2={56+height/2} stroke={locked?C.amber:C.muted} strokeWidth={7}/><path d={`M${x-30} 56 Q${x-8} ${56-height*.6} ${x} 56 Q${x+12} ${56+height*.5} ${x+40} 56`} stroke={locked?C.amber:C.muted} strokeWidth="2" fill="none"/></g>:null;})}
     </svg>
    </div>;
   })}
  </div>
  <div style={{position:'absolute',left:538,top:610,width:4,height:mix(630,870,collapse),background:C.amber,opacity:p*(1-word),boxShadow:`0 0 ${20+p*30}px ${rgba(C.amber,.5)}`}}/>
  <div style={{position:'absolute',left:SAFE,top:650,width:SW,opacity:word,transform:`translateY(${(1-word)*36}px)`}}><PhoneWordmark/><div style={{marginTop:76,textAlign:'center',fontSize:52,lineHeight:1.45}}>{['Every angle.','Every word.','In sync.'].map((t,i)=><div key={t} style={{opacity:appear(f,TAG[i],15),color:i===2?C.amber:C.text}}>{t}</div>)}</div></div>
  <Label style={{position:'absolute',left:SAFE,top:1590,width:SW,textAlign:'center',opacity:p*(1-word)}}>FOUR RECORDINGS. ONE SHARED CLOCK.</Label>
 </AbsoluteFill>;
};
const TILES=[{id:'intro',name:'PHASE LOCK',accent:C.amber},...WORLDS.map(w=>({id:w.id,name:w.name,accent:ACCENT[w.id]}))];
export const HEROES:Record<string,number>={intro:420,ingest:840,sync:1620,review:2460,captions:3110,handoff:3810,sound:4412,picture:5390,library:6540,editroom:7410,profile:8350,anywhere:8790};
export const Finale:React.FC = () => {
 const g=useCurrentFrame()+MONTAGE-PAD,active=g<SLIDE?ACTIVE_TILE[Math.min(10,Math.max(0,Math.floor((g-MONTAGE)/MBEAT)))]:-1;
 const morph=eio(prog(g,SLIDE,SLIDE+24)),close=eio(prog(g,COLLAPSE[0],COLLAPSE[1])),logo=appear(g,LOGO_LOCK,24);
 return <AbsoluteFill style={{background:C.canvas,fontFamily:FONT,color:C.text}}>
  <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% 50%,${rgba(C.amber,.1)},transparent 70%)`}}/>
  {g<COLLAPSE[1]&&TILES.map((t,i)=>{
   const gx=144+(i%3)*268,gy=150+Math.floor(i/3)*448,bx=140+((i%3)-1)*115*(1-eo(prog(g,SNAPS[Math.floor(i/4)]-14,SNAPS[Math.floor(i/4)])));
   const x=mix(gx,bx,morph),y=mix(gy,680+i*45,morph),w=mix(252,800,morph)*(1-close),h=mix(436,28,morph);
   return <div key={t.id} style={{position:'absolute',left:mix(x,540,close),top:y,width:w,height:h,overflow:'hidden',opacity:1-close,background:t.accent,border:active===i?`5px solid ${C.amber}`:`2px solid ${C.line}`,boxSizing:'border-box',transform:active===i?'scale(1.035)':undefined,zIndex:active===i?2:1}}>
    {morph<.95&&<Img src={staticFile(`phone/heroes/${t.id}.png`)} style={{width:'100%',height:'100%',objectFit:'cover',opacity:1-morph}}/>}
    {active!==i&&<AbsoluteFill style={{background:C.canvas,opacity:.38*(1-morph)}}/>}
   </div>;
  })}
  <div style={{position:'absolute',left:84,top:260,width:912,textAlign:'center',fontSize:82,lineHeight:1.1,fontWeight:750,letterSpacing:'-.035em',opacity:appear(g,MONTAGE+12,24)*(1-prog(g,SLIDE-20,SLIDE)) ,textShadow:'0 4px 18px #101211'}}>Every world.<br/>One edit.</div>
  <div style={{position:'absolute',left:538,top:640,width:4,height:660,background:C.amber,opacity:close*(1-logo),boxShadow:`0 0 40px ${rgba(C.amber,.6)}`}}/>
  <div style={{position:'absolute',left:SAFE,top:570,width:SW,opacity:logo,transform:`scale(${mix(.96,1,logo)})`}}><PhoneWordmark size={120}/></div>
  <div style={{position:'absolute',left:SAFE,top:1110,width:SW,textAlign:'center',fontSize:83,fontWeight:700,lineHeight:1.1,letterSpacing:'-.035em',opacity:appear(g,9540,24)}}>Make the next<br/>cut yours.</div>
  <div style={{position:'absolute',left:SAFE,top:1430,width:SW,textAlign:'center',fontSize:43,color:C.muted,opacity:appear(g,9600,30)}}>Sync. Shape. Deliver.</div>
  <Label style={{position:'absolute',left:SAFE,top:1570,width:SW,textAlign:'center',opacity:appear(g,9630,30)}}>LOCAL FIRST · YOUR MEDIA STAYS YOURS</Label>
  <AbsoluteFill style={{background:C.canvas,opacity:eio(prog(g,FADE,9839))}}/>
 </AbsoluteFill>;
};
