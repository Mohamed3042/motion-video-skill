import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BODY,FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {cursorOut} from '../../shell/cursor';
import {smooth,clamp,lerp} from '../../util';

export const World:React.FC=()=>{
 const f=useSegFrame(),inspect=smooth(60,95,f),move=smooth(10,60,f),queued=f>=96;
 return <AbsoluteFill style={{background:'#EEEAF8'}}>
  <svg width="1920" height="1080" style={{fontFamily:BODY}}>
   <text x="92" y="132" fontFamily={FONT} fontSize="55" fontWeight="700" fill="#4C376C">Talent Atlas</text><text x="505" y="130" fontSize="34" fill="#86729F">Keep hiring evidence in view.</text><rect x="1667" y="87" width="153" height="56" rx="28" fill="#D9CCEB"/><text x="1700" y="126" fontSize="29" fill="#6E4A9C">DEMO</text>
   <rect x="87" y="189" width="570" height="651" rx="13" fill="#FCFAFF" stroke="#C9B8DE" strokeWidth="2"/>
   <text x="115" y="244" fontSize="28" fill="#9C82B5">ROLE CRITERIA</text><text x="115" y="296" fontSize="36" fontWeight="600" fill="#4B386B">Maintenance technician</text><text x="115" y="343" fontSize="29" fill="#8C769D">Task-based review</text>
   {['Fault diagnosis','Relevant work sample','Safety procedure'].map((t,i)=><g key={t}><rect x="112" y={383+i*129} width="520" height="100" rx="10" fill={i===0&&inspect>0?'#E9DBF6':'#F1ECF7'} stroke={i===0&&inspect>0?'#9E7BC8':'#DDD2E8'}/><text x="135" y={425+i*129} fontSize="31" fill="#62467E">{t}</text><text x="135" y={465+i*129} fontSize="28" fill="#9B85AD">{i===2?'Clarification needed':'Review submitted evidence'}</text></g>)}
   <rect x="699" y="189" width="591" height="651" rx="13" fill="#F9F5FE" stroke="#BFA7D9" strokeWidth="2"/>
   <circle cx="749" cy="242" r="19" fill="#B497D4"/><text x="784" y="253" fontSize="34" fontWeight="600" fill="#5F4383">Candidate A</text><text x="726" y="302" fontSize="28" fill="#9A81B0">Fictional profile · consent recorded</text>
   <path d="M726 333H1263" stroke="#D7C7E6"/><text x="726" y="381" fontSize="29" fill="#9A81B0">SUBMITTED EVIDENCE</text>
   <rect x="724" y="404" width="542" height="87" rx="9" fill={inspect>0?'#E1CFF4':'#EEE4F8'} stroke="#B697D5"/><text x="747" y="441" fontSize="29" fill="#614180">Training task · page 2</text><text x="747" y="477" fontSize="28" fill="#9C7EAF">Open source evidence</text>
   <rect x="724" y="510" width="542" height="87" rx="9" fill="#EEE4F8"/><text x="747" y="547" fontSize="29" fill="#614180">Work sample · fixture</text><text x="747" y="583" fontSize="28" fill="#9C7EAF">Human assessment required</text>
   <rect x="724" y="623" width="542" height="174" rx="9" fill="#FBF9FF" stroke="#CEBBDD"/>
   <g opacity={inspect}><text x="747" y="662" fontSize="28" fill="#987AAD">SOURCE EXCERPT · DEMO</text><rect x="739" y="678" width="510" height="46" fill="#EBDDFA"/><text x="747" y="712" fontSize="29" fill="#624181">“Recorded diagnostic checks”</text><text x="747" y="758" fontSize="28" fill="#967BAD">Submitted claim · not verified</text></g>
   <path d="M632 436C674 436 670 448 724 448" fill="none" stroke="#9671BE" strokeWidth="4" opacity={inspect}/><circle cx="677" cy="440" r="8" fill="#9875BE" opacity={inspect}/>
   <rect x="1331" y="189" width="501" height="793" rx="14" fill="#62457D"/>
   <text x="1361" y="249" fontSize="33" fontWeight="600" fill="#F2E8FF">Human review</text><text x="1361" y="295" fontSize="29" fill="#C7B4DE">Decision stays with a person.</text>
   <rect x="1357" y="334" width="449" height="176" rx="12" fill="#775A91" stroke="#AB8DC5"/><text x="1380" y="381" fontSize="29" fill="#CBB6DE">REVIEW QUEUE</text><text x="1380" y="430" fontSize="34" fill="#F5EBFF">{queued?'Candidate A added':'No item selected'}</text><text x="1380" y="476" fontSize="29" fill="#D2BFDF">{queued?'Pending recruiter review':'Inspect evidence to continue'}</text>
   <rect x="1357" y="542" width="449" height="185" rx="12" fill="#533A6C"/><text x="1380" y="590" fontSize="30" fill="#E0CEE9">Open question</text><text x="1380" y="640" fontSize="29" fill="#C4A9D6">Safety evidence is missing.</text><text x="1380" y="685" fontSize="29" fill="#C4A9D6">Request clarification.</text>
   <rect x="1357" y="788" width="449" height="95" rx="11" fill="#E2CFEE"/><text x="1400" y="829" fontSize="29" fontWeight="600" fill="#694386">{queued?'Sent to human review':'Send to human review'}</text><text x="1427" y="866" fontSize="28" fill="#87629F">{queued?'No hiring decision made':'After evidence review'}</text>
   <rect x="89" y="877" width="1200" height="103" rx="12" fill="#E1D5ED"/><text x="119" y="922" fontSize="31" fill="#674F81">Compare candidate + role</text><text x="119" y="960" fontSize="28" fill="#8D73A2">Keep the source, the uncertainty and the reviewer together.</text>
   {f>=60&&f<82?<circle cx="1070" cy="452" r={16+(f-60)*2} fill="none" stroke="#AA82D3" strokeWidth="3" opacity={1-(f-60)/22}/>:null}
   <path style={cursorOut(f,110)} d="M0 0V47L13 35L24 60L36 54L24 31L42 29Z" transform={`translate(${f<82?lerp(463,1070,move):lerp(1070,1580,smooth(82,96,f))} ${f<82?lerp(450,452,move)-Math.sin(move*Math.PI)*60:lerp(452,827,smooth(82,96,f))})`} fill="#FFFFFF" stroke="#845BA7" strokeWidth="3"/>
  </svg>
 </AbsoluteFill>;
};
