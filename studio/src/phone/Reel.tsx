import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, MONO, ACCENT, SAFE, SW, eo, prog, rgba} from './kit';
import {Intro, Finale} from './Framework';
import {Ingest, Sync, Review, Captions, Handoff} from './Cut';
import {Sound, Picture} from './Studio';
import {Library, EditRoom, Profile, Anywhere} from './Yours';
import {DURATION, FPS, PAD, WORLDS, type WorldId} from '../mpw/timing';
import {BOUNDARIES, EDITS, FW_EVENTS, SECTIONS, type SectionId} from '../mpw/shell/timing';
import {WORLD_IMPL} from '../mpw/worlds';
export const PHONE_WORLD:Record<WorldId,React.FC>={ingest:Ingest,sync:Sync,review:Review,captions:Captions,handoff:Handoff,sound:Sound,picture:Picture,library:Library,editroom:EditRoom,profile:Profile,anywhere:Anywhere};
const COMPS:Record<SectionId,React.FC>={intro:Intro,finale:Finale,...PHONE_WORLD};
const SHAKES=[...FW_EVENTS.filter(e=>e.shake).map(e=>({f:e.f,a:e.shake!})),...WORLDS.flatMap(w=>WORLD_IMPL[w.id].EVENTS.filter(e=>e.shake).map(e=>({f:w.start+e.f,a:e.shake!})))];
const Shot:React.FC<{i:number}>=({i})=>{
 const s=SECTIONS[i],g=useCurrentFrame()+s.start-PAD,Comp=COMPS[s.id];
 const p=prog(g,s.start-6,s.start+6),q=prog(g,s.end-6,s.end+6),kind=EDITS[i-1]?.kind;
 const incoming=i>0&&p<1,outgoing=i<12&&q>0;
 const clip=incoming?kind==='gate'?`inset(${(1-eo(p))*100}% 0 0 0)`:kind==='iris'?`circle(${eo(p)*150}% at 50% 50%)`:`inset(0 ${(1-eo(p))*100}% 0 0)` : undefined;
 const t=incoming&&kind==='whip'?`translateX(${(1-eo(p))*160}px)`:incoming&&kind==='flop'?`scaleX(${.9+.1*eo(p)})`:outgoing&&EDITS[i]?.kind==='zoom'?`scale(${1+.12*eo(q)})`:undefined;
 return <AbsoluteFill style={{overflow:'hidden',clipPath:clip,transform:t,zIndex:i}}><Comp/></AbsoluteFill>;
};
export const PhoneReel:React.FC=()=>{
 const g=useCurrentFrame(),s=SECTIONS.find(v=>g>=v.start&&g<v.end)??SECTIONS[0],accent=s.id==='intro'||s.id==='finale'?C.amber:ACCENT[s.id];
 let x=0,y=0;for(const hit of SHAKES){const d=g-hit.f;if(d>=0&&d<20){const env=(1-d/20)**2;x+=hit.a*.4*env*Math.sin(d*.93+hit.f);y+=hit.a*.35*env*Math.cos(d*.82);}}
 const sec=Math.floor(g/FPS),tc=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}:${String(g%60).padStart(2,'0')}`;
 return <AbsoluteFill style={{background:C.canvas,overflow:'hidden'}}>
  <AbsoluteFill style={{transform:`translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`}}>
   {SECTIONS.map((section,i)=><Sequence key={section.id} name={`${i} ${section.name} — Portrait`} from={section.start-PAD} durationInFrames={section.end-section.start+PAD*2} premountFor={FPS}><Shot i={i}/></Sequence>)}
  </AbsoluteFill>
  <Img src={staticFile('mpw/grain.png')} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.023,mixBlendMode:'soft-light',pointerEvents:'none'}}/>
  <div style={{position:'absolute',left:SAFE,top:153,width:SW,display:'flex',justifyContent:'space-between',fontFamily:MONO,fontSize:26,fontWeight:500,letterSpacing:'.05em',color:C.muted}}><span style={{color:accent}}>MONTAGE <b style={{color:C.amber}}>PRO</b></span><span>{s.index===0?'ELEVEN WORLDS':s.index===12?'YOUR NEXT CUT':`${String(s.index).padStart(2,'0')} / 11`}</span></div>
  <div style={{position:'absolute',left:SAFE,top:1755,width:SW,height:4,background:C.line}}><div style={{position:'absolute',left:0,top:0,width:`${g/DURATION*100}%`,height:4,background:accent}}/>{BOUNDARIES.map(b=><div key={b} style={{position:'absolute',left:`${b/DURATION*100}%`,top:-5,width:2,height:14,background:C.muted}}/>)}</div>
  <div style={{position:'absolute',left:SAFE,top:1780,width:SW,display:'flex',justifyContent:'space-between',fontFamily:MONO,fontSize:27,letterSpacing:'.05em',color:C.muted}}><span>{s.name}</span><span>{tc}</span></div>
  <Audio src={staticFile('mpw/music.wav')} volume={10 ** (-0.4 / 20)}/>
 </AbsoluteFill>;
};
export const PhoneWorldSolo:React.FC<{id:WorldId}>=({id})=>{const World=PHONE_WORLD[id];return <World/>;};
