import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BODY,FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {smooth,clamp,lerp} from '../../util';

export const World:React.FC=()=>{
 const f=useSegFrame(),action=smooth(60,96,f),move=smooth(12,60,f),selected=f>=60;
 return <AbsoluteFill style={{background:'#EFF3E6'}}>
  <svg width="1920" height="1080" style={{fontFamily:BODY}}>
   <text x="94" y="132" fontFamily={FONT} fontSize="58" fontWeight="700" fill="#2E4F34">Reclaim</text><text x="391" y="128" fontSize="34" fill="#6B805E">See what takes the space.</text>
   <rect x="1667" y="87" width="154" height="57" rx="28" fill="#D3E1BF"/><text x="1700" y="126" fontSize="29" fill="#527143">DEMO</text>
   <rect x="84" y="188" width="1752" height="94" rx="14" fill="#FFFFFF" stroke="#C8D5B8"/>
   <text x="110" y="245" fontSize="31" fill="#486442">Folder:</text><text x="233" y="245" fontFamily={MONO} fontSize="30" fill="#2F4C35">Demo Workspace</text><text x="731" y="245" fontSize="29" fill="#708462">Scan complete</text>
   <rect x="1567" y="208" width="236" height="55" rx="10" fill="#688B4C"/><text x="1631" y="245" fontSize="29" fill="#F9FFF0">Rescan</text>
   <text x="101" y="340" fontSize="33" fontWeight="600" fill="#35563C">Storage map</text><text x="837" y="340" fontSize="33" fontWeight="600" fill="#35563C">Review duplicate files</text>
   <g transform={`translate(103 370) scale(${1-action*.012})`}>
    <rect width="676" height="383" rx="14" fill="#DAE5C8"/>
    <rect x="12" y="12" width="367" height="222" rx="8" fill="#759B54"/><text x="37" y="63" fontSize="33" fontWeight="600" fill="#F4FAEB">Media</text><text x="37" y="111" fontSize="32" fill="#E4F0D0">1.4 GB</text>
    <rect x="391" y="12" width="272" height="143" rx="8" fill="#A4BB7F"/><text x="412" y="59" fontSize="30" fill="#3E603A">Projects</text><text x="412" y="103" fontSize="30" fill="#3E603A">840 MB</text>
    <rect x="391" y="167" width="272" height="205" rx="8" fill="#BED09C"/><text x="412" y="215" fontSize="30" fill="#3E603A">Documents</text><text x="412" y="259" fontSize="30" fill="#3E603A">360 MB</text>
    <rect x="12" y="246" width="367" height="126" rx="8" fill={selected?'#567C3C':'#C6D8AF'} stroke={selected?'#355C2E':'#A6BF8A'} strokeWidth="3"/><text x="36" y="289" fontSize="30" fill={selected?'#F0FAE6':'#41633D'}>Duplicate candidates</text><text x="36" y="332" fontSize="30" fill={selected?'#F0FAE6':'#41633D'}>120 MB</text>
   </g>
   <text x="108" y="808" fontSize="28" fill="#768669">Sizes are sample data.</text>
   {['reference-copy.zip','artwork-copy.pdf','source-original.zip'].map((t,i)=><g key={t}>
    <rect x="826" y={369+i*117} width="995" height="103" rx="12" fill={i<2&&selected?'#E0ECCC':'#F9FCF3'} stroke={i<2&&selected?'#7F9F5B':'#CAD8BA'} strokeWidth="2"/>
    <rect x="848" y={395+i*117} width="35" height="35" rx="5" fill={selected&&i<2?'#648748':'#FFFFFF'} stroke="#8DA675" strokeWidth="2"/>
    {selected&&i<2?<path d={`M855 ${411+i*117} l8 9 13 -17`} fill="none" stroke="#FFF" strokeWidth="4"/>:null}
    <text x="904" y={409+i*117} fontFamily={MONO} fontSize="29" fill="#36523B">{t}</text><text x="904" y={448+i*117} fontSize="28" fill="#718566">{i<2?'Matching hash · review candidate':'Original retained'}</text><text x="1691" y={427+i*117} fontSize="29" fill="#3A613B">{i===1?'40 MB':'80 MB'}</text>
   </g>)}
   <rect x="827" y="745" width="994" height="70" rx="12" fill={selected?'#527B3F':'#6F9253'}/><text x="1087" y="791" fontSize="34" fontWeight="600" fill="#F8FFF1">{selected?'Cleaning plan prepared':'Build a cleaning plan'}</text>
   <g opacity={action} transform={`translate(0 ${(1-action)*55})`}><rect x="103" y="855" width="1718" height="125" rx="15" fill="#DFE9D1" stroke="#A9BD92" strokeWidth="2"/><text x="128" y="902" fontSize="35" fontWeight="600" fill="#355836">2 files selected for review</text><text x="129" y="948" fontSize="29" fill="#637859">120 MB in this sample plan. No files moved or deleted.</text><rect x="1536" y="885" width="253" height="63" rx="9" fill="#F7FBF1" stroke="#93AB7C"/><text x="1573" y="927" fontSize="30" fill="#486C3A">Review plan</text></g>
   {f>=60&&f<82?<circle cx="1276" cy="780" r={16+(f-60)*2} fill="none" stroke="#ADC892" strokeWidth="3" opacity={1-(f-60)/22}/>:null}
   <path d="M0 0V47L13 35L24 60L36 54L24 31L42 29Z" transform={`translate(${lerp(524,1276,move)} ${lerp(606,780,move)-Math.sin(move*Math.PI)*70})`} fill="#FBFFF4" stroke="#486F35" strokeWidth="3"/>
  </svg>
 </AbsoluteFill>;
};
