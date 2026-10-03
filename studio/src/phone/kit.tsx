import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENT, C, FONT, MONO} from '../mpw/brand';
import {useWorldFrame} from '../mpw/frame';
import type {WorldId} from '../mpw/timing';
export {ACCENT, C, FONT, MONO, useWorldFrame};
export const W = 1080, H = 1920, SAFE = 120, SW = 840, SH = 820;
export const clamp = (n:number, a=0, b=1) => Math.min(b,Math.max(a,n));
export const prog = (f:number,a:number,b:number) => clamp((f-a)/(b-a));
export const eo = (t:number) => 1-(1-clamp(t))**3;
export const eio = (t:number) => {t=clamp(t);return t<.5?4*t*t*t:1-(-2*t+2)**3/2;};
export const mix = (a:number,b:number,t:number) => a+(b-a)*t;
export const rgba = (hex:string,a:number) => {const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`;};
export const pulse = (f:number,at:number,len=16) => f<at?0:Math.max(0,1-(f-at)/len)**2;
export const appear = (f:number,at=0,len=24) => eo(prog(f,at,at+len));
export const Label:React.FC<{children:React.ReactNode; color?:string;size?:number;style?:React.CSSProperties}> = ({children,color=C.muted,size=32,style}) => <div style={{fontFamily:MONO,fontSize:size,fontWeight:500,letterSpacing:'.07em',lineHeight:1.3,color,...style}}>{children}</div>;
export const Panel:React.FC<{children?:React.ReactNode;style?:React.CSSProperties}> = ({children,style}) => <div style={{position:'absolute',border:`2px solid ${C.line}`,borderRadius:12,background:C.panel,...style}}>{children}</div>;
export const Chip:React.FC<{children:React.ReactNode;accent?:string;active?:boolean;style?:React.CSSProperties}> = ({children,accent=C.amber,active=true,style}) => <div style={{display:'inline-flex',alignItems:'center',padding:'16px 24px',borderRadius:8,border:`2px solid ${active?rgba(accent,.5):C.line}`,fontSize:34,fontWeight:600,color:active?accent:C.muted,background:active?rgba(accent,.08):C.panel,...style}}>{children}</div>;
export const Scene:React.FC<{id:WorldId;title:React.ReactNode;subtitle?:React.ReactNode;footer?:React.ReactNode;note?:React.ReactNode;children:React.ReactNode}> = ({id,title,subtitle,footer,note,children}) => {
 const f=useWorldFrame(),a=ACCENT[id],p=appear(f,-8,36);
 return <AbsoluteFill style={{background:C.canvas,fontFamily:FONT,color:C.text,overflow:'hidden'}}>
  <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% 51%, ${rgba(a,.105)}, transparent 69%)`}}/>
  <div style={{position:'absolute',left:SAFE,top:240,width:SW,opacity:p,transform:`translateY(${(1-p)*30}px)`}}>
   <div data-phone-text style={{fontSize:98,fontWeight:750,lineHeight:1.04,letterSpacing:'-.045em',whiteSpace:'pre-line'}}>{title}</div>
   {subtitle&&<div data-phone-text style={{marginTop:30,fontSize:42,lineHeight:1.3,color:C.muted}}>{subtitle}</div>}
  </div>
  <div data-phone-stage style={{position:'absolute',left:84,top:620,width:912,height:SH}}>{children}</div>
  {footer&&<div data-phone-text style={{position:'absolute',left:SAFE,top:1510,width:SW,fontSize:49,fontWeight:600,lineHeight:1.23,color:a}}>{footer}</div>}
  {note&&<div data-phone-text style={{position:'absolute',left:SAFE,top:1660,width:SW,fontSize:31,lineHeight:1.3,color:C.muted}}>{note}</div>}
 </AbsoluteFill>;
};
export const Wave:React.FC<{f:number;width?:number;height?:number;color?:string;offset?:number;strength?:number;seed?:number}> = ({f,width=800,height=110,color=C.amber,offset=0,strength=1,seed=0}) => <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}><path d={Array.from({length:Math.ceil(width/5)},(_,i)=>{const x=i*5,t=x+offset+f*.6;const env=.2+.8*Math.sin(t*.011+seed)**6;const y=height/2+Math.sin(t*.085+seed)*height*.41*env*strength;return `${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`;}).join(' ')} fill="none" stroke={color} strokeWidth="3"/></svg>;
