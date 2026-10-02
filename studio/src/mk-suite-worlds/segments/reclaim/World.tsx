import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease,smooth} from '../../util';
import {EVENTS} from './timing';

const blocks=[[-510,-30,180,170,0],[-305,-30,110,170,1],[-170,-30,185,170,2],[40,-30,135,170,3],[200,-30,260,170,4],[-510,165,180,130,5],[-305,165,225,130,6],[-55,165,230,130,7],[200,165,110,130,8],[335,165,125,130,9],[-510,320,305,125,10],[-180,320,355,125,11],[200,320,260,125,12]];
export const World:React.FC=()=>{
  const f=useSegFrame(),p=ease.expoOut(clamp((f+10)/30)),order=smooth(18,EVENTS[0].f+34,f);
  return <AbsoluteFill style={{background:'#F0F3E5',overflow:'hidden'}}>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute'}}>
      <defs><linearGradient id="rc-top" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#CEE1A8"/><stop offset="1" stopColor="#9AB46C"/></linearGradient></defs>
      <circle cx="1540" cy="185" r="330" fill="#E2E9D4"/>
      <circle cx="1540" cy="185" r="195" fill="none" stroke="#BFCDAA" strokeWidth="1"/>
      <path d="M 80 840 L 1840 840" stroke="#BAC7A6" strokeWidth="2"/>
      <g transform={`translate(1000 ${375+(1-p)*90}) skewY(-7) scale(1 .79)`}>
        <rect x="-590" y="-80" width="1260" height="620" rx="30" fill="#DCE4CA"/>
        <rect x="-557" y="-52" width="1194" height="556" rx="17" fill="none" stroke="#B8C99E" strokeDasharray="8 12"/>
        {blocks.map(([x,y,w,h,i])=>{const selected=i===2||i===6||i===11;const tx=selected?order*(430-x):order*((i%3)-1)*18;const ty=selected?order*(-205+i*24-y):0;const rise=selected?36*order:8+Math.sin(i)*8;return <g key={i} transform={`translate(${x+tx} ${y+ty-rise})`} opacity={p}>
          <rect x="9" y="24" width={w} height={h} rx="8" fill="#426342" opacity=".13"/>
          <path d={`M 0 ${h-6} L ${w} ${h-6} L ${w} ${h+22} L 0 ${h+22} Z`} fill="#709152"/>
          <rect width={w} height={h} rx="8" fill={selected?'#6D914B':'url(#rc-top)'} stroke="#F6FAE9" strokeWidth="2"/>
          <path d={`M 18 26 H ${Math.max(35,w-22)} M 18 40 H ${Math.max(35,w*.65)}`} stroke={selected?'#CCDEB5':'#698747'} opacity=".45" strokeWidth="3"/>
          {i%4===0?<circle cx={w-25} cy={h-28} r="9" fill="#F5F9E9" opacity=".7"/>:null}
        </g>})}
      </g>
      <g transform={`translate(260 ${523-12*Math.sin(f/45)})`} opacity={p}><circle r="105" fill="#F9FBEF" stroke="#A8BA8A" strokeWidth="2"/><path d="M -42 0 L -10 32 L 49 -36" fill="none" stroke="#74944A" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/></g>
    </svg>
    <div style={{position:'absolute',left:98,top:108,color:'#2C482E',fontFamily:FONT,fontSize:127,fontWeight:700,letterSpacing:-7,opacity:p}}>Reclaim</div>
    <div style={{position:'absolute',left:105,right:105,top:903,display:'flex',justifyContent:'space-between',gap:28,color:'#355639',fontFamily:BODY,fontSize:34,fontWeight:500,opacity:ease.expoOut(clamp((f+2)/28))}}>
      <span>Disk-space analysis</span><span>Large files + duplicates</span><span>Reviewed cleaning plans</span>
    </div>
  </AbsoluteFill>;
};
