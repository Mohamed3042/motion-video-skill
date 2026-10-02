import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease,lerp} from '../../util';
const wave=(x:number,y:number,w:number,h:number,variant=0)=><g>{Array.from({length:132},(_,i)=>{const env=.17+.83*Math.abs(Math.sin(i*.071)*Math.sin(i*.163+.8));const a=(.4+.6*Math.abs(Math.sin(i*(variant?.63:.87)+variant)))*env*h;return <rect key={i} x={x+i*w/132} y={y-a/2} width={Math.max(3,w/132-3)} height={a} rx="2" fill={variant?'#B7FFD0':'#46C6A2'}/>})}</g>;
export const World:React.FC=()=>{const f=useSegFrame(),action=ease.cubicInOut(clamp((f-34)/26)),converted=ease.cubicOut(clamp((f-62)/47)),preview=clamp((f-125)/120),rip=clamp((f-60)/22);const cx=lerp(660,1569,action),cy=lerp(402,549,action);
return <AbsoluteFill style={{background:'#061910',fontFamily:FONT,color:'#ECFFF4'}}><svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
 <defs><linearGradient id="voPanel" x2="1" y2="1"><stop stopColor="#163D2C"/><stop offset="1" stopColor="#0B251D"/></linearGradient><clipPath id="voResult"><rect x="471" y="647" width={880*converted} height="187"/></clipPath></defs>
 <text x="84" y="138" fill="#E7FFF0" fontSize="58" fontWeight="700">MK Voice</text><text x="436" y="135" fill="#91C7AF" fontSize="34">Shape a recording.</text><rect x="1702" y="92" width="132" height="52" rx="26" fill="#244C38"/><text x="1768" y="128" textAnchor="middle" fontSize="28" fill="#C4EFDB">DEMO</text>
 <rect x="82" y="190" width="1754" height="755" rx="26" fill="url(#voPanel)" stroke="#3E6553" strokeWidth="2"/>
 <path d="M426 190V945 M1394 190V945" stroke="#3C5B4B" strokeWidth="2"/>
 <text x="112" y="247" fontSize="30" fill="#91B7A3">LOCAL LIBRARY</text><rect x="105" y="284" width="298" height="117" rx="13" fill="#31634A" stroke="#83D5AF"/>
 <path d="M131 323H149M131 337H159M131 351H143" stroke="#BFFBDD" strokeWidth="4"/><text x="174" y="331" fontSize="30" fill="#F0FFF5">demo-take.wav</text><text x="174" y="371" fontSize="28" fill="#AED5BF">Imported sample</text>
 <rect x="112" y="450" width="280" height="57" rx="9" fill="none" stroke="#557560"/><text x="252" y="489" textAnchor="middle" fontSize="29" fill="#C6E3D2">+ Import a sample</text>
 <text x="112" y="829" fontSize="29" fill="#8CAD97">Your recordings.</text><text x="112" y="870" fontSize="29" fill="#8CAD97">Your model.</text>
 <text x="469" y="246" fontSize="32" fill="#D2F0DF">RECORDING EDITOR</text><text x="1329" y="246" textAnchor="end" fontSize="28" fill="#82AF98">BEFORE / AFTER</text>
 <rect x="469" y="286" width="882" height="251" rx="15" fill="#081F17" stroke="#355E47"/><text x="494" y="328" fontSize="28" fill="#89B99D">Original</text>
 {wave(492,429,826,135)}<rect x={655+action*29} y="344" width="406" height="172" rx="6" fill="#56DB9C17" stroke="#72E5AF" strokeWidth="2"/><path d="M684 344V516 M1090 344V516" stroke="#B6FFD4" strokeWidth="3"/>
 <text x="469" y="594" fontSize="30" fill="#B4DCC1">Selected region</text><path d="M739 585H1130" stroke="#456954" strokeWidth="4"/><circle cx="1007" cy="585" r="10" fill="#72E5AF"/>
 <rect x="469" y="628" width="882" height="253" rx="15" fill="#081F17" stroke={converted>0?'#6DE6A6':'#355E47'} strokeWidth="2"/><text x="494" y="675" fontSize="29" fill="#B8ECCC">{converted>.8?'Converted preview':'Conversion preview'}</text>
 <g clipPath="url(#voResult)">{wave(492,777,826,141,2)}</g>{converted<.1&&<text x="910" y="788" textAnchor="middle" fontSize="32" fill="#567C64">Choose a model to preview</text>}
 {converted>.7&&<g><path d={`M${496+preview*814} 706V854`} stroke="#E8FFE8" strokeWidth="3"/><path d={`M${484+preview*814} 704H${508+preview*814}L${496+preview*814} 720Z`} fill="#E8FFE8"/></g>}
 <text x="1433" y="247" fontSize="30" fill="#91B7A3">VOICE MODEL</text><rect x="1421" y="284" width="377" height="99" rx="13" fill="#173E2B" stroke="#629274"/><text x="1444" y="325" fontSize="34" fill="#EBFFF4">Demo model</text><text x="1444" y="364" fontSize="28" fill="#93B7A2">Local model selected</text><path d="M1750 318L1760 328L1770 318" fill="none" stroke="#A9DBC0" strokeWidth="3"/>
 <text x="1438" y="441" fontSize="29" fill="#9BC2AA">Choose a voice model</text>
 <rect x="1423" y="499" width="374" height="93" rx="16" fill={f>=60?'#AAFAC6':'#58DBA1'}/><text x="1610" y="554" textAnchor="middle" fontSize="34" fontWeight="700" fill="#113B25">Preview conversion</text>
 <g opacity={converted}><rect x="1423" y="650" width="374" height="190" rx="16" fill="#275C3C"/><text x="1450" y="700" fontSize="32" fill="#DCFFDD">Ready to compare</text><text x="1450" y="750" fontSize="28" fill="#ACE4BD">Original</text><rect x="1597" y="717" width="171" height="48" rx="24" fill="#A1E9BC"/><text x="1682" y="751" textAnchor="middle" fontSize="28" fill="#194328">Converted</text><text x="1450" y="806" fontSize="28" fill="#B1D7BC">Preview the conversion</text></g>
 <circle cx={cx} cy={cy} r={8+rip*39} fill="none" stroke="#D8FFE8" strokeWidth="3" opacity={f>=60&&f<82?1-rip:0}/><g transform={`translate(${cx} ${cy})`}><path d="M0 0V39L11 29L23 49L34 42L22 23H39Z" fill="#FFFFFF" stroke="#183B2B" strokeWidth="3"/></g>
 </svg></AbsoluteFill>};
