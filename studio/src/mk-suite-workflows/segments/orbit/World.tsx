import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BODY,FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {smooth,clamp,lerp} from '../../util';

export const World:React.FC=()=>{
 const f=useSegFrame(),move=smooth(12,60,f),compared=f>=60,link=smooth(60,100,f);
 return <AbsoluteFill style={{background:'#0A1628'}}>
  <svg width="1920" height="1080" style={{fontFamily:BODY}}>
   <text x="92" y="132" fontFamily={FONT} fontSize="52" fontWeight="700" fill="#F6EBD7">Job Engine / Orbit</text><text x="716" y="129" fontSize="34" fill="#BDBFAF">Find your next move.</text><rect x="1667" y="87" width="154" height="57" rx="28" fill="#3D352A"/><text x="1700" y="126" fontSize="29" fill="#EDBB76">DEMO</text>
   <rect x="88" y="194" width="380" height="792" rx="19" fill="#13253C" stroke="#3C5062"/><text x="117" y="246" fontSize="31" fontWeight="600" fill="#F1C58A">Sources + region</text>
   <text x="117" y="313" fontSize="28" fill="#96A8B8">REGION</text><rect x="114" y="333" width="151" height="59" rx="10" fill="#C99454"/><text x="140" y="374" fontSize="29" fill="#172238">Kuwait</text><rect x="278" y="333" width="155" height="59" rx="10" fill="#213B52"/><text x="315" y="374" fontSize="29" fill="#BDCAD4">Egypt</text>
   <text x="118" y="459" fontSize="28" fill="#96A8B8">RESEARCH SOURCES</text>
   {['Company careers','Saved job links','Approved profile'].map((t,i)=><g key={t}><circle cx="130" cy={510+i*65} r="9" fill="#F3B767"/><text x="154" y={521+i*65} fontSize="28" fill="#D4DEE6">{t}</text></g>)}
   <path d="M115 726H436" stroke="#4A5A68"/><text x="117" y="780" fontSize="28" fill="#849DAD">Sample role</text><text x="117" y="824" fontSize="29" fill="#C6D5DE">Demo organization</text><text x="117" y="920" fontSize="28" fill="#E8BD83">Research workspace</text>
   <path d="M488 232H1237V835H488" fill="#101F32" stroke="#987C51" strokeWidth="2"/>
   <rect x="512" y="207" width="684" height="69" rx="8" fill="#28384B"/><text x="535" y="252" fontSize="31" fontWeight="600" fill="#F1E6D0">Operations analyst</text>
   <text x="517" y="332" fontSize="29" fill="#98B0BF">Role criteria</text><text x="954" y="332" fontSize="29" fill="#98B0BF">Your evidence</text>
   {[['Spreadsheet reporting','Sample report'],['Process coordination','Process map'],['SQL analysis','Evidence missing']].map((row,i)=><g key={row[0]}>
    <rect x="514" y={357+i*125} width="689" height="105" rx="9" fill={compared&&i<2?'#253C40':'#182B40'} stroke={compared&&i<2?'#D8B377':'#3C5162'} strokeWidth="2"/>
    <text x="535" y={397+i*125} fontSize="29" fill="#D4E0E7">{row[0]}</text>
    <text x="535" y={440+i*125} fontSize="28" fill={i===2?'#E7B985':compared?'#E6C68D':'#738F9F'}>{i===2?'Keep this gap visible':compared?'Source linked':'Compare to approved facts'}</text>
    <text x="955" y={411+i*125} fontSize="28" fill={i===2?'#E7AD86':'#E8D4AE'}>{row[1]}</text>
   </g>)}
   <rect x="514" y="757" width="689" height="62" rx="10" fill="#E2AF69"/><text x="684" y="798" fontSize="34" fontWeight="600" fill="#162337">{compared?'Evidence compared':'Compare role evidence'}</text>
   <rect x="1270" y="194" width="559" height="792" rx="18" fill="#172A40" stroke="#526072"/><text x="1298" y="248" fontSize="33" fontWeight="600" fill="#E8C593">Review skill gaps</text>
   <rect x="1299" y="284" width="501" height="158" rx="12" fill="#282F3A" stroke="#AA8252"/><text x="1325" y="329" fontSize="32" fill="#F0C794">SQL analysis</text><text x="1325" y="376" fontSize="29" fill="#AFBCC5">No approved evidence yet.</text><text x="1325" y="418" fontSize="28" fill="#D4B388">Prepare a relevant work sample.</text>
   <text x="1299" y="507" fontSize="29" fill="#91A6B6">EVIDENCE TRACE</text>
   <g opacity={link}><path d="M1328 550V712H1425" stroke="#EDBA72" strokeWidth="3" fill="none"/><circle cx="1328" cy="550" r="8" fill="#EDBA72"/><circle cx="1328" cy="638" r="8" fill="#EDBA72"/><text x="1353" y="561" fontSize="29" fill="#CAD7E0">Report · profile file</text><text x="1353" y="649" fontSize="29" fill="#CAD7E0">Map · portfolio file</text><text x="1353" y="737" fontSize="29" fill="#EDC58B">Gaps stay inspectable</text></g>
   <rect x="508" y="867" width="704" height="117" rx="12" fill="#192E42"/><text x="535" y="911" fontSize="31" fill="#C8D5DC">{compared?'Supported facts, with sources.':'Choose sources + region.'}</text><text x="535" y="954" fontSize="28" fill="#90A9B9">Review the evidence before any application.</text>
   {f>=60&&f<82?<circle cx="884" cy="790" r={18+(f-60)*2} fill="none" stroke="#F9D69D" strokeWidth="3" opacity={1-(f-60)/22}/>:null}
   <path d="M0 0V47L13 35L24 60L36 54L24 31L42 29Z" transform={`translate(${lerp(217,884,move)} ${lerp(371,790,move)-Math.sin(move*Math.PI)*90})`} fill="#FBF0D7" stroke="#6E562F" strokeWidth="3"/>
  </svg>
 </AbsoluteFill>;
};
