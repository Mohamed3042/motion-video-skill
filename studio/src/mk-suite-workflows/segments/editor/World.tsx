import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {cursorOut} from '../../shell/cursor';
import {clamp,ease,lerp} from '../../util';
export const World:React.FC=()=>{const f=useSegFrame(),placed=ease.cubicInOut(clamp((f-25)/35)),checked=ease.cubicOut(clamp((f-60)/32)),handoff=ease.cubicOut(clamp((f-97)/24)),pointer=ease.cubicInOut(clamp((f-33)/27)),rip=clamp((f-60)/20);
return <AbsoluteFill style={{background:'#EAF0FF',fontFamily:FONT}}><svg width="1920" height="1080">
 <defs><pattern id="edDraft" width="31" height="31" patternUnits="userSpaceOnUse"><path d="M31 0H0V31" fill="none" stroke="#D5DEEF"/></pattern><clipPath id="edInk"><rect x="585" y="350" width={710*placed} height="435"/></clipPath></defs>
 <text x="84" y="136" fontSize="56" fill="#254392" fontWeight="700">MK Editor</text><text x="458" y="134" fontSize="34" fill="#5C72A9">From artwork to print.</text><rect x="1702" y="91" width="132" height="52" rx="26" fill="#D0DDFB"/><text x="1768" y="128" textAnchor="middle" fontSize="28" fill="#34509A">DEMO</text>
 <rect x="82" y="188" width="1756" height="759" rx="21" fill="#F9FBFF" stroke="#A7BADD" strokeWidth="2"/>
 <path d="M384 188V947 M1338 188V947" stroke="#BECBE3" strokeWidth="2"/><rect x="385" y="259" width="952" height="687" fill="url(#edDraft)"/>
 <text x="107" y="245" fontSize="29" fill="#5370A5">ARTWORK</text><rect x="108" y="288" width="248" height="313" rx="12" fill="#406AF4"/><circle cx="232" cy="407" r="72" fill="#FFAF70"/><path d="M165 527Q231 458 296 527" fill="none" stroke="#FFD4A2" strokeWidth="15"/><text x="232" y="574" textAnchor="middle" fontSize="30" fill="#FFFFFF">DEMO BOX</text><text x="107" y="649" fontFamily={MONO} fontSize="29" fill="#526C9C">artwork.svg</text><rect x="108" y="693" width="248" height="65" rx="10" fill="#DCE6FC"/><text x="232" y="735" textAnchor="middle" fontSize="29" fill="#315399">Place artwork</text>
 <text x="418" y="239" fontSize="30" fill="#34549A">Box dieline</text><text x="1278" y="239" textAnchor="end" fontSize="27" fill="#7890B8">CUT / FOLD / ART</text>
 <g fill="#FFFFFF" stroke="#567CD1" strokeWidth="3"><path d="M515 413H1265V701H515Z"/><path d="M690 413V313H1009V413 M690 701V796H1009V701"/><path d="M515 447H474V671H515 M1265 447H1303V671H1265"/></g>
 <g clipPath="url(#edInk)"><rect x="517" y="415" width="747" height="284" fill="#416DF8"/><rect x="692" y="315" width="315" height="479" fill="#6D90FF"/><circle cx="850" cy="528" r="69" fill="#FFBA7B"/><path d="M783 639Q850 576 917 639" fill="none" stroke="#FFDCB5" strokeWidth="12"/><text x="850" y="682" textAnchor="middle" fontSize="33" fontWeight="700" fill="#FCFFFF">DEMO BOX</text></g>
 <path d="M690 414V701 M1009 414V701 M515 432H1265 M710 313V796 M989 313V796" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="9 8"/>
 <g stroke="#D67835" strokeWidth="2" fill="none">{[[488,385],[1291,385],[487,730],[1291,730]].map(([x,y],i)=><path key={i} d={`M${x-12} ${y}H${x+12}M${x} ${y-12}V${y+12}`}/>)}</g>
 <text x="608" y="861" fontSize="29" fill="#607CB0">Artwork stays inside the print layout.</text>
 <text x="1371" y="244" fontSize="30" fill="#4D6898">PRINT REVIEW</text><rect x="1370" y="285" width="430" height="71" rx="12" fill="#3E68EE"/><text x="1585" y="330" textAnchor="middle" fontSize="34" fill="#FFF" fontWeight="700">Check fonts + layout</text>
 {['Artwork placed','Font review','Layout review'].map((t,i)=><g key={t} transform={`translate(1375 ${417+i*83})`}><circle cx="17" cy="-9" r="17" fill={checked>.15*i?'#4C77EA':'#D8E0EF'}/>{checked>.15*i&&<path d="M8 -10L15 -3L28 -19" fill="none" stroke="#FFF" strokeWidth="3"/>}<text x="53" y="2" fontSize="34" fill="#3F609A">{t}</text></g>)}
 <g transform={`translate(1371 ${688+(1-handoff)*35})`} opacity={handoff}><rect width="431" height="189" rx="15" fill="#E4ECFF" stroke="#86A1DD" strokeWidth="2"/><text x="25" y="48" fontSize="32" fontWeight="700" fill="#2F5096">Approval handoff</text><text x="25" y="95" fontSize="29" fill="#5D75A7">Printer review requested</text><text x="25" y="146" fontSize="28" fill="#6B83AF">Proof + artwork + checks</text></g>
 <text x="85" y="991" fontSize="33" fill="#5371AE">Place box artwork. Review the details. Prepare approval.</text>
 <g transform={`translate(${lerp(865,1580,pointer)} ${lerp(544,324,pointer)})`}><circle r={10+rip*39} fill="none" stroke="#4269D9" strokeWidth="3" opacity={f>=60&&f<80?1-rip:0}/><path style={cursorOut(f,74)} d="M0 0V39L11 29L23 49L34 42L22 23H39Z" fill="#204289" stroke="#FFFFFF" strokeWidth="3"/></g>
 </svg></AbsoluteFill>};
