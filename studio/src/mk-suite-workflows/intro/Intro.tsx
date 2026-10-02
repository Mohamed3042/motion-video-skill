import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY,MONO} from '../brand';
import {useSegFrame} from '../frame';
import {Mark} from '../shell/Mark';
import {clamp,ease,lerp} from '../util';

// Source, intervention and result preview the film's workflow grammar.
export const Intro:React.FC=()=>{
 const f=useSegFrame(), a=ease.cubicInOut(clamp((f-26)/38)), b=ease.cubicOut(clamp((f-106)/30));
 const leave=clamp((f-82)/8), lead=clamp((f-90)/6), ink='#F8F5ED';
 return <AbsoluteFill style={{background:'#0E1118',fontFamily:FONT,color:ink,overflow:'hidden'}}>
  <svg width="1920" height="1080" style={{position:'absolute'}}>
   <defs><linearGradient id="intro-lit"><stop stopColor="#EE6045" stopOpacity=".22"/><stop offset="1" stopColor="#EE6045" stopOpacity="0"/></linearGradient></defs>
   <path d="M-50 885 L1940 540" stroke="url(#intro-lit)" strokeWidth="220"/>
   {[0,1,2,3,4].map(i=><path key={i} d={`M0 ${340+i*160} H1920`} stroke="#F8F5ED" strokeOpacity=".035"/>)}
  </svg>
  <div style={{position:'absolute',left:96,top:74,display:'flex',alignItems:'center',gap:20}}><Mark size={44}/><span style={{fontFamily:MONO,fontSize:24,letterSpacing:3}}>MK SUITE</span></div>
  <div style={{position:'absolute',right:98,top:87,fontFamily:MONO,fontSize:22,color:'#A7ADBB'}}>23 TOOLS / ONE CONNECTED VISION</div>
  <div style={{position:'absolute',left:92,top:164,fontSize:126,fontWeight:700,lineHeight:1,letterSpacing:-7,opacity:1-leave,transform:`translateY(${-32*leave}px)`}}>Make it <span style={{color:'#EE6045'}}>happen.</span></div>
  <div style={{position:'absolute',left:92,top:164,fontSize:116,fontWeight:700,lineHeight:1,letterSpacing:-6,opacity:lead,transform:`translateY(${26*(1-lead)}px)`}}>See what you can do<span style={{color:'#EE6045'}}>.</span></div>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0,fontFamily:BODY}}>
   <g transform={`translate(96 ${364+18*(1-a)})`}>
    <rect width="540" height="455" rx="18" fill="#10251E" stroke="#2C5A46" strokeWidth="2"/>
    <text x="30" y="51" fill="#C2FFD9" fontSize="28">SHAPE SOUND</text><text x="430" y="50" fill="#84B599" fontSize="18">DEMO</text>
    {[0,1].map(k=><g key={k} transform={`translate(28 ${120+k*116})`}><rect width="484" height="96" rx="8" fill={k?'#173F2D':'#1D332B'}/>{Array.from({length:47},(_,i)=>{const h=(14+Math.abs(Math.sin(i*.75+k*2))*(k?48:61))*(i%5===0?.5:1);return <rect key={i} x={10+i*10} y={48-h/2} width="4" height={h} rx="2" fill={k?'#8AEEB8':'#729586'} opacity={k?.2+.8*a:1}/>})}<path d={`M${40+a*350} 3 V93`} stroke="#E4FFEC" strokeWidth="2"/></g>)}
    <rect x="28" y="371" width="300" height="49" rx="24" fill="#C2FFD9"/><text x="178" y="403" textAnchor="middle" fontSize="24" fill="#10251E">{a>.8?'Conversion preview':'Choose a model'}</text>
   </g>
   <g transform={`translate(690 ${364+28*(1-a)})`}>
    <rect width="540" height="455" rx="18" fill="#2F1521" stroke="#7B394F" strokeWidth="2"/>
    <text x="30" y="51" fill="#FFE0DC" fontSize="28">ALIGN YOUR ANGLES</text><text x="430" y="50" fill="#D993A0" fontSize="18">DEMO</text>
    {[0,1,2].map(k=><g key={k} transform={`translate(${lerp(48+k*38,48,a)} ${108+k*83})`}><rect width="370" height="65" rx="7" fill={['#A23857','#C74C69','#F27B90'][k]}/>{Array.from({length:34},(_,j)=><rect key={j} x={8+j*10} y={24-Math.abs(Math.sin(j*.9))*14} width="3" height={15+Math.abs(Math.sin(j*.9))*28} fill="#FFE0DC" opacity=".7"/>)}</g>)}
    <path d="M106 93 V354" stroke="#FFF3E5" strokeWidth="3"/><circle cx="106" cy="90" r="6" fill="#FFF3E5"/>
    <text x="30" y="405" fill="#FFE0DC" fontSize="28">{a>.8?'One shared moment.':'Three camera recordings.'}</text>
   </g>
   <g transform={`translate(1284 ${364+38*(1-a)})`}>
    <rect width="540" height="455" rx="18" fill="#F2EBD9" stroke="#E1CCA3" strokeWidth="2"/>
    <text x="30" y="51" fill="#363225" fontSize="28">CREATE THE HANDOFF</text><text x="430" y="50" fill="#8D7852" fontSize="18">DEMO</text>
    <g transform={`translate(${44-12*b} 97) rotate(${-3*b} 100 128)`}><rect width="226" height="280" rx="6" fill="#FFFCF0" stroke="#CBBD9C"/><rect x="20" y="23" width="110" height="10" fill="#8F723F"/>{[0,1,2,3].map(i=><g key={i}><rect x="20" y={67+i*36} width={120+i%2*32} height="6" fill="#C2B99E"/><rect x="179" y={65+i*36} width="26" height="10" fill="#857D65"/></g>)}<rect x="20" y="236" width="185" height="2" fill="#8F723F"/><text x="20" y="263" fontSize="19" fill="#584F3D">Quotation / A4</text></g>
    <g opacity={b} transform={`translate(${284+34*(1-b)} 195)`}><rect width="216" height="124" rx="12" fill="#223C35"/><path d="M24 60 l15 15 26-34" fill="none" stroke="#BDE0C7" strokeWidth="5"/><text x="82" y="65" fontSize="27" fill="#F7EED9">PDF ready</text><text x="25" y="102" fontSize="19" fill="#A2C0AF">Ready for review</text></g>
   </g>
  </svg>
  <div style={{position:'absolute',left:96,right:96,top:889,display:'flex',justifyContent:'space-between',fontSize:30,color:'#C8CAD3'}}><span>From the first action to the final output.</span><span style={{fontFamily:MONO,fontSize:20,color:'#9298A6'}}>ILLUSTRATED PRODUCT WORKFLOWS</span></div>
 </AbsoluteFill>;
};
