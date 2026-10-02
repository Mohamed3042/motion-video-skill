import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp, ease} from '../../util';
import {EVENTS} from './timing';

const gold = '#D7B064';
export const World: React.FC = () => {
 const f=useSegFrame(), enter=ease.cubicOut(clamp((f+12)/30)), text=ease.cubicOut(clamp((f+2)/14));
 const seal=ease.backOut(clamp((f-EVENTS[0].f)/24)), archive=ease.cubicInOut(clamp((f-EVENTS[1].f)/38)), lines=clamp((f+10)/60);
 return <AbsoluteFill style={{background:'#0D2139',color:'#FFF3D8',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{position:'absolute'}}>
 <defs><radialGradient id="quotes-glow"><stop stopColor="#47617C" stopOpacity=".55"/><stop offset="1" stopColor="#0D2139" stopOpacity="0"/></radialGradient><linearGradient id="quotes-paper" x2="1" y2="1"><stop stopColor="#FFF5DE"/><stop offset="1" stopColor="#DFCFAB"/></linearGradient></defs>
 <ellipse cx="1430" cy="520" rx="700" ry="650" fill="url(#quotes-glow)"/>
 {Array.from({length:17},(_,i)=><path key={i} d={`M ${800+i*66} 90 L ${650+i*66} 995`} stroke={gold} strokeOpacity=".06"/>)}
 <ellipse cx="1320" cy="909" rx="445" ry="75" fill="none" stroke={gold} strokeOpacity=".3"/>
 <ellipse cx="1320" cy="909" rx="335" ry="48" fill="none" stroke={gold} strokeOpacity=".15"/>
 <g transform={`translate(${1080+(1-enter)*180} ${166+archive*16}) rotate(${-11+archive*5} 270 340)`}>
 {[4,3,2,1].map(i=><rect key={i} x={i*17} y={i*23} width="515" height="660" rx="5" fill={i%2?'#38516C':'#1E3856'} stroke={gold} strokeOpacity=".6"/>)}
 <rect width="515" height="660" rx="5" fill="url(#quotes-paper)"/><path d="M443 0 L515 72 L443 72 Z" fill="#C7B48A"/>
 <path d="M50 65 H266" stroke="#0D2139" strokeWidth="13"/><path d="M50 94 H197" stroke={gold} strokeWidth="5"/><path d="M50 146 H465" stroke="#998353" strokeWidth="2"/>
 {[0,1].map(col=><g key={col} transform={`translate(${50+col*229} 187)`}>{Array.from({length:9},(_,i)=><rect key={i} x={col?(i%3)*18:0} y={i*36} width={(184-(i%3)*18)*clamp(lines*2-i*.08)} height={i===0?10:5} fill={i===0?'#223B56':'#9E916F'} opacity={i===0?1:.6}/>)}</g>)}
 <path d="M50 551 H465 M50 574 H205 M336 574 H465" stroke="#8C7447" strokeWidth="3"/>
 <g transform={`translate(414 537) scale(${Math.max(0,seal)})`}><circle r="62" fill={gold}/><circle r="50" fill="none" stroke="#0D2139" strokeWidth="2"/><path d="M-22 0 L-5 18 L28 -19" fill="none" stroke="#0D2139" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/></g>
 </g><path d="M96 542 H765" stroke={gold} strokeWidth="2"/><path d="M96 951 H765" stroke={gold} strokeOpacity=".35"/><circle cx="775" cy="542" r="5" fill={gold}/>
 </svg>
 <div style={{position:'absolute',left:96,top:177,width:880,fontFamily:FONT,fontSize:101,fontWeight:500,lineHeight:1.02,letterSpacing:-5,opacity:text,transform:`translateY(${(1-text)*20}px)`}}>Quotation<br/>Builder</div>
 <div style={{position:'absolute',left:98,top:620,fontFamily:BODY,fontSize:37,lineHeight:1.95,opacity:clamp((f+4)/25)}}><div>Bilingual quotations</div><div>A4 PDF export</div><div>Company document history</div></div>
 </AbsoluteFill>;
};
