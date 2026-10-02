import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BODY,FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {cursorOut} from '../../shell/cursor';
import {smooth,clamp,lerp} from '../../util';

export const World:React.FC=()=>{
 const f=useSegFrame(),move=smooth(8,60,f),resumed=f>=60,result=smooth(60,96,f),ripple=clamp((f-60)/22);
 const px=lerp(1100,1680,move),py=lerp(255,465,move)-Math.sin(move*Math.PI)*70;
 const rows=[{name:'demo-assets.zip',kind:'Project archive',pct:42+Math.round(result*26),status:resumed?'Downloading':'Paused'},{name:'sample-footage.mp4',kind:'Video file',pct:24+Math.round(clamp(f/120)*18),status:'Downloading'},{name:'reference-pack.pdf',kind:'Document',pct:0,status:result>.8?'Scheduled · 22:00':'Queued'}];
 return <AbsoluteFill style={{background:'#061C35'}}>
  <svg width="1920" height="1080" style={{fontFamily:BODY}}>
   <defs><linearGradient id="dl2-panel" x1="0" x2="1"><stop stopColor="#103E59"/><stop offset="1" stopColor="#092840"/></linearGradient></defs>
   <text x="94" y="132" fontFamily={FONT} fontSize="53" fontWeight="700" fill="#EEFCFF">MK Downloader</text>
   <text x="630" y="130" fontSize="33" fill="#AAD7E3">Keep downloads moving.</text>
   <rect x="1665" y="87" width="157" height="57" rx="28" fill="#164C64"/><text x="1700" y="126" fontSize="29" fill="#9CEBFA">DEMO</text>
   <rect x="82" y="185" width="1756" height="818" rx="22" fill="#0A2941" stroke="#27637A" strokeWidth="2"/>
   <path d="M 354 185 V 1003" stroke="#2A556B" strokeWidth="2"/>
   <text x="113" y="252" fontSize="28" fill="#83ADBE">WORKSPACE</text>
   {['Queue','Batches','History','Devices'].map((t,i)=><g key={t}><rect x="99" y={285+i*84} width="237" height="62" rx="10" fill={i===0?'#17566E':'transparent'}/><text x="120" y={328+i*84} fontSize="31" fill={i===0?'#CCF6FB':'#799BAD'}>{t}</text>{i===0?<text x="290" y="328" fontSize="28" fill="#43DDF1">3</text>:null}</g>)}
   <path d="M 116 737 H 311" stroke="#3C697C"/><text x="116" y="788" fontSize="28" fill="#91BACC">Paired browser</text><circle cx="126" cy="835" r="7" fill="#43DDF1"/><text x="145" y="847" fontSize="28" fill="#B7D9E4">PC queue</text>
   <rect x="389" y="215" width="1100" height="80" rx="12" fill="#061F34" stroke="#3F7086"/>
   <text x="416" y="264" fontFamily={MONO} fontSize="28" fill="#BCD9E4">https://example.com/demo-assets.zip</text>
   <rect x="1510" y="215" width="294" height="80" rx="12" fill="#43DDF1"/><text x="1537" y="266" fontSize="34" fontWeight="600" fill="#06314B">Add to queue</text>
   <text x="413" y="350" fontSize="29" fill="#87B1C2">FILE</text><text x="1139" y="350" fontSize="29" fill="#87B1C2">PROGRESS</text><text x="1622" y="350" fontSize="29" fill="#87B1C2">ACTION</text>
   {rows.map((r,i)=><g key={r.name}>
    <rect x="389" y={378+i*126} width="1415" height="112" rx="12" fill={i===0?'url(#dl2-panel)':'#0C3048'} stroke={i===0?'#46C2D7':'#234A60'} strokeWidth={i===0?2:1}/>
    <path d={`M 412 ${405+i*126} h 24 l 12 12 v 44 h -36 Z`} fill="#5EAEC3" opacity=".7"/>
    <text x="469" y={424+i*126} fontSize="34" fontWeight="600" fill="#E3F6FB">{r.name}</text><text x="469" y={465+i*126} fontSize="28" fill="#8FB8CA">{r.kind}</text>
    <rect x="1138" y={445+i*126} width="307" height="10" rx="5" fill="#061E31"/><rect x="1138" y={445+i*126} width={307*r.pct/100} height="10" rx="5" fill={i===0&&!resumed?'#7896A3':'#43DDF1'}/>
    <text x="1140" y={424+i*126} fontSize="28" fill={i===0&&!resumed?'#CDBB8A':'#C1EBF2'}>{r.status}</text>
    <text x="1483" y={451+i*126} fontSize="28" fill="#BEDAE5">{r.pct}%</text>
    <rect x="1600" y={407+i*126} width="176" height="58" rx="10" fill={i===0?'#43DDF1':'#21495F'}/>
    <text x="1624" y={446+i*126} fontSize="28" fontWeight="600" fill={i===0?'#072B40':'#C0DCE7'}>{i===0?(resumed?'Pause':'Resume'):i===1?'Pause':'Schedule'}</text>
   </g>)}
   <rect x="389" y="789" width="687" height="147" rx="13" fill="#061F34" stroke="#2E5C72"/><text x="414" y="831" fontSize="29" fill="#92BDCE">SPEED LIMIT</text><text x="414" y="885" fontSize="35" fontWeight="600" fill="#E0F7FA">{result>.6?'2 MB/s':'Unlimited'}</text><rect x="714" y="869" width="315" height="6" rx="3" fill="#3D697A"/><circle cx={1000-result*173} cy="872" r="13" fill="#43DDF1"/>
   <rect x="1100" y="789" width="704" height="147" rx="13" fill="#061F34" stroke="#2E5C72"/><text x="1125" y="831" fontSize="29" fill="#92BDCE">START SCHEDULE</text><text x="1125" y="885" fontSize="35" fill="#E0F7FA">{result>.6?'Tonight · 22:00':'Choose a time'}</text><rect x="1707" y="862" width="67" height="35" rx="18" fill={result>.6?'#43DDF1':'#365568'}/><circle cx={1725+result*30} cy="879" r="13" fill="#EDF9FA"/>
   <text x="408" y="977" fontSize="28" fill="#84B7C9">{resumed?'Queue resumed. Schedule uses your awake PC.':'Review files, then resume the paused download.'}</text>
   {f>=60&&f<82?<circle cx="1680" cy="465" r={15+ripple*50} fill="none" stroke="#B9F9FF" strokeWidth="3" opacity={1-ripple}/>:null}
   <path style={cursorOut(f,74)} d="M 0 0 L 0 48 L 13 36 L 24 61 L 36 55 L 24 32 L 43 30 Z" transform={`translate(${px} ${py})`} fill="#F1FCFF" stroke="#12405B" strokeWidth="3"/>
  </svg>
 </AbsoluteFill>;
};
