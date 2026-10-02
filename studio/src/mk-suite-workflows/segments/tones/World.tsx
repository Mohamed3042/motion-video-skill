import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease,lerp} from '../../util';
const notes=[{x:390,y:6,w:132,n:'A'},{x:546,y:4,w:113,n:'C'},{x:680,y:3,w:152,n:'D'},{x:856,y:1,w:130,n:'F'},{x:1012,y:3,w:132,n:'D'},{x:1170,y:4,w:167,n:'C'}];
export const World:React.FC=()=>{const f=useSegFrame(),snap=ease.cubicInOut(clamp((f-60)/34)),out=ease.cubicOut(clamp((f-128)/27)),cursor=ease.cubicInOut(clamp((f-30)/30)),rip=clamp((f-60)/20);const px=lerp(560,1284,cursor),py=lerp(600,241,cursor),play=clamp((f-99)/135);
return <AbsoluteFill style={{background:'#FFF2D7',fontFamily:FONT}}><svg width="1920" height="1080">
 <defs><linearGradient id="tonesPaper" x2="0" y2="1"><stop stopColor="#FFFDF5"/><stop offset="1" stopColor="#F8E8C9"/></linearGradient></defs>
 <text x="84" y="137" fontSize="56" fill="#533313" fontWeight="700">MK Tones</text><text x="447" y="134" fontSize="34" fill="#986A3C">Find the melody.</text><rect x="1702" y="91" width="132" height="52" rx="26" fill="#F3D5A4"/><text x="1768" y="128" textAnchor="middle" fontSize="28" fill="#744713">DEMO</text>
 <rect x="82" y="189" width="1756" height="716" rx="25" fill="url(#tonesPaper)" stroke="#D2B790" strokeWidth="2"/>
 <text x="115" y="247" fill="#684524" fontSize="32">demo-phrase.wav</text><rect x="472" y="211" width="227" height="55" rx="11" fill="#EED9B3"/><text x="585" y="249" fontSize="29" fill="#765025" textAnchor="middle">Load a phrase</text>
 <text x="768" y="248" fontSize="28" fill="#956E45">Piano roll</text><rect x="1151" y="207" width="276" height="66" rx="13" fill={f>=60?'#C46528':'#F4A653'}/><text x="1289" y="249" textAnchor="middle" fill={f>=60?'#FFF9EC':'#56320E'} fontSize="34" fontWeight="700">Correct notes</text>
 <rect x="1475" y="208" width="325" height="65" rx="12" fill="#5E3B20"/><text x="1638" y="250" textAnchor="middle" fill="#FFF5DF" fontSize="30">Export WAV + MIDI</text>
 <rect x="112" y="305" width="1658" height="533" rx="13" fill="#F9EEDA" stroke="#D8BF94"/>
 {Array.from({length:8},(_,i)=><g key={i}><rect x="112" y={305+i*66} width="190" height="66" fill={i%3===1?'#5D4631':'#FFFCF2'} stroke="#C8AF8B"/><text x="257" y={347+i*66} textAnchor="middle" fill={i%3===1?'#FCE9C6':'#6F5431'} fontFamily={MONO} fontSize="28">{['G','F','E','D','C','B','A','G'][i]}</text><path d={`M304 ${305+i*66}H1770`} stroke="#D9C5A2"/></g>)}
 {Array.from({length:13},(_,i)=><g key={i}><path d={`M${340+i*117} 305V834`} stroke={i%4===0?'#BB9367':'#E1CFAE'} strokeWidth={i%4===0?2:1}/>{i%4===0&&<text x={351+i*117} y="335" fontSize="24" fill="#9A7C51" fontFamily={MONO}>{i/4+1}</text>}</g>)}
 {notes.map((n,i)=>{const yy=350+n.y*59;const off=[-17,21,13,-21,19,-13][i];return <g key={i} transform={`translate(${n.x+(1-snap)*[9,-14,18,-18,12,-12][i]} ${yy+(1-snap)*off})`}><rect width={n.w} height="42" rx="9" fill={snap>.6?'#E88330':'#D9AB68'} stroke="#A95D20" strokeWidth="2"/><text x="17" y="29" fontSize="25" fontWeight="700" fill="#FFF9E9">{n.n}</text><path d={`M${n.w-17} 10V31`} stroke="#FFF0D2" strokeWidth="3"/></g>})}
 <path d={`M${351+play*1264} 351V826`} stroke="#A94418" strokeWidth="3" opacity={snap}/><path d={`M${339+play*1264} 342H${363+play*1264}L${351+play*1264} 357Z`} fill="#A94418" opacity={snap}/>
 <text x="117" y="880" fontSize="30" fill="#86623C">{snap>.75?'Notes aligned to pitch lanes':'Raw melody ready for correction'}</text>
 <g transform={`translate(1405 ${504+(1-out)*75})`} opacity={out}><rect width="368" height="302" rx="19" fill="#FFFCF0" stroke="#B68B50" strokeWidth="2"/><text x="25" y="51" fontSize="33" fontWeight="700" fill="#6D421D">Export sketch</text>{['melody.wav','melody.mid'].map((t,i)=><g key={t} transform={`translate(24 ${88+i*82})`}><rect width="319" height="66" rx="10" fill={i?'#F9D299':'#F2E2C7'}/><path d="M15 15H42V49H15Z M34 15V23H42" fill="none" stroke="#A65C27" strokeWidth="2"/><text x="60" y="43" fontFamily={MONO} fontSize="28" fill="#623C18">{t}</text></g>)}</g>
 <text x="85" y="976" fontSize="33" fill="#8F6030">Load a phrase.</text><text x="636" y="976" fontSize="33" fill="#8F6030">Correct the notes.</text><text x="1280" y="976" fontSize="33" fill="#8F6030">Export the idea.</text>
 <circle cx={px} cy={py} r={8+rip*36} fill="none" stroke="#8D4318" strokeWidth="3" opacity={f>=60&&f<80?1-rip:0}/><g transform={`translate(${px} ${py})`}><path d="M0 0V39L11 29L23 49L34 42L22 23H39Z" fill="#553418" stroke="#FFEDCF" strokeWidth="3"/></g>
 </svg></AbsoluteFill>};
