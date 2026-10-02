import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp, ease, smooth} from '../../util';
import {EVENTS} from './timing';

export const World: React.FC = () => {
  const f = useSegFrame();
  const enter = ease.expoOut(clamp((f + 10) / 32));
  const merge = smooth(30, EVENTS[0].f + 20, f);
  const hit = f >= EVENTS[0].f ? Math.exp(-(f - EVENTS[0].f) / 16) : 0;
  return <AbsoluteFill style={{background: '#061C35', overflow: 'hidden'}}>
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute'}}>
      <defs>
        <linearGradient id="dl-file" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#AFFBFF"/><stop offset=".55" stopColor="#43DDF1"/><stop offset="1" stopColor="#156994"/></linearGradient>
        <radialGradient id="dl-aura"><stop stopColor="#007FA7" stopOpacity=".55"/><stop offset="1" stopColor="#061C35" stopOpacity="0"/></radialGradient>
        <linearGradient id="dl-rail"><stop stopColor="#43DDF1" stopOpacity="0"/><stop offset=".4" stopColor="#43DDF1"/><stop offset="1" stopColor="#DAFFFF"/></linearGradient>
      </defs>
      <ellipse cx="1350" cy="560" rx="660" ry="590" fill="url(#dl-aura)"/>
      {Array.from({length:12},(_,i)=><path key={i} d={`M ${650+i*35} -50 C ${620+i*34} 360 ${1450-i*15} 160 ${1390-i*19} 730`} fill="none" stroke="#2C6480" strokeWidth="1" opacity=".4"/>)}
      <g opacity={enter} transform={`translate(${(1-enter)*200} 0)`}>
        {[0,1,2].map(i=><g key={i}>
          <path d={`M ${770+i*190} 165 C ${725+i*190} 385 ${1030+i*90} 300 ${1190+i*95} 600 L ${1190+i*95} 840`} fill="none" stroke="#0D4C6B" strokeWidth="44"/>
          <path d={`M ${770+i*190} 165 C ${725+i*190} 385 ${1030+i*90} 300 ${1190+i*95} 600 L ${1190+i*95} 840`} fill="none" stroke="url(#dl-rail)" strokeWidth="3"/>
          {Array.from({length:5},(_,j)=>{const u=((f*1.1+j*105+i*35)%550+550)%550;return <rect key={j} x={770+i*190+u*.62} y={125+u} width="44" height="16" rx="6" fill="#8BEDF4" opacity={.25+.6*(1-merge*.55)} transform={`rotate(28 ${770+i*190+u*.62} ${125+u})`}/>;})}
        </g>)}
        {[0,1,2].map(i=><g key={i} transform={`translate(${980+i*145} ${230+i*68}) skewY(-12)`}>
          <rect width="155" height="400" rx="72" fill="#123B55" fillOpacity=".28" stroke="#66DCF0" strokeWidth="2"/>
          <rect x="20" y="20" width="115" height="360" rx="54" fill="none" stroke="#77F1FF" opacity=".15"/>
        </g>)}
        <g transform={`translate(1375 ${555+(1-merge)*85}) scale(${.82+.18*merge+hit*.03})`}>
          <path d="M -125 -155 L 55 -155 L 130 -80 L 130 175 L -125 175 Z" fill="url(#dl-file)"/>
          <path d="M 55 -155 L 55 -80 L 130 -80" fill="#C9FBF8"/>
          <path d="M 0 -50 V 80 M -40 40 L 0 82 L 40 40" stroke="#06344F" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M -75 126 H 80" stroke="#D5FFFF" strokeWidth="7" strokeLinecap="round"/>
        </g>
        <ellipse cx="1380" cy="857" rx={205+hit*85} ry="42" fill="none" stroke="#43DDF1" strokeWidth="2" opacity={.5}/>
        <path d="M 840 912 H 1610" stroke="#1B7394"/>
      </g>
    </svg>
    <div style={{position:'absolute',left:96,top:127,width:1040,color:'#E9FCFF',fontFamily:FONT,fontSize:87,fontWeight:700,letterSpacing:-4,opacity:enter,transform:`translateY(${(1-enter)*30}px)`}}>MK Downloader</div>
    <div style={{position:'absolute',left:104,top:650,color:'#CEEFF6',fontFamily:BODY,fontSize:35,lineHeight:1.8,opacity:ease.expoOut(clamp((f+3)/28))}}>
      {['Queue + pause + resume','Schedules + speed controls','Browser companion'].map((t,i)=><div key={t} style={{display:'flex',alignItems:'center',gap:22}}><span style={{width:25,height:3,background:'#43DDF1',opacity:1-i*.18}}/>{t}</div>)}
    </div>
  </AbsoluteFill>;
};
