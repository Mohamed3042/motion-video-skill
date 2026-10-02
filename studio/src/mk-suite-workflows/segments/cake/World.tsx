import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease,lerp,mixHex} from '../../util';
const Cake:React.FC<{x:number;y:number;s:number;colour:string;topper:number}>=({x,y,s,colour,topper})=><g transform={`translate(${x} ${y}) scale(${s})`}><ellipse cy="52" rx="235" ry="45" fill="#E6BCC8"/><ellipse cy="39" rx="232" ry="43" fill="#FFF7F0" stroke="#BE8297"/>{[0,1,2].map(i=>{const r=192-i*43,yy=-i*97;return <g key={i} transform={`translate(0 ${yy})`}><path d={`M${-r} -69V10A${r} 38 0 0 0 ${r} 10V-69Z`} fill={colour} stroke="#B76887"/><ellipse cy="-69" rx={r} ry="36" fill="#FFF3F5" stroke="#D19AAF"/>{Array.from({length:13},(_,j)=>{const a=j/12*Math.PI;return <circle key={j} cx={Math.cos(a)*r*.94} cy={-69+Math.sin(a)*32} r="7" fill="#FFF9F7"/>})}</g>})}<g opacity={topper}><path d="M0 -313L9 -287L35 -287L14 -270L22 -245L0 -262L-22 -245L-14 -270L-35 -287L-9 -287Z" fill="#C3984A"/><path d="M0 -253V-223" stroke="#A78244" strokeWidth="3"/></g></g>;
export const World:React.FC=()=>{const f=useSegFrame(),colour=ease.cubicInOut(clamp((f-60)/24)),proof=ease.cubicOut(clamp((f-85)/22)),pointer=ease.cubicInOut(clamp((f-30)/30)),rip=clamp((f-60)/20),c=mixHex('#D3C1D7','#E698B8',colour);
return <AbsoluteFill style={{background:'#FCE9ED',fontFamily:FONT}}><svg width="1920" height="1080">
 <text x="84" y="137" fontSize="56" fontWeight="700" fill="#7E3553">Cake Studio</text><text x="527" y="133" fontSize="33" fill="#A0657F">Design it. Approve it. Make it.</text><rect x="1702" y="91" width="132" height="52" rx="26" fill="#F3CCD9"/><text x="1768" y="128" textAnchor="middle" fontSize="28" fill="#8F4D68">DEMO</text>
 <rect x="82" y="189" width="1756" height="755" rx="26" fill="#FFF7F5" stroke="#D4AABB" strokeWidth="2"/><path d="M460 189V944 M1197 189V944" stroke="#E6C4D0" strokeWidth="2"/>
 <text x="112" y="246" fontSize="29" fill="#9E6B82">DESIGN TOOLS</text><text x="111" y="313" fontSize="32" fill="#744358">Tier colour</text><text x="112" y="356" fontSize="28" fill="#B08195">Select the finish</text>
 {['#D3C1D7','#E698B8','#E7CBA5'].map((v,i)=><g key={v}><rect x={113+i*108} y="391" width="84" height="84" rx="14" fill={v}/><rect x={107+i*108} y="385" width="96" height="96" rx="19" fill="none" stroke="#AB5A79" strokeWidth="3" opacity={i===(colour>.3?1:0)?1:0}/></g>)}
 <text x="112" y="544" fontSize="34" fill="#744358">Topper</text><rect x="112" y="580" width="310" height="67" rx="12" fill={colour>.5?'#F1D5B0':'#F3E3E4'} stroke="#D6B2BE"/><text x="268" y="624" textAnchor="middle" fontSize="30" fill="#885770">{colour>.5?'Star topper selected':'Add a star topper'}</text>
 <rect x="112" y="724" width="310" height="83" rx="14" fill="#B7527D"/><text x="267" y="776" textAnchor="middle" fontSize="34" fill="#FFF5F8" fontWeight="700">Prepare the print</text><text x="112" y="865" fontSize="28" fill="#9A6F81">Compose a cake</text>
 <text x="495" y="246" fontSize="34" fill="#8E576E">Design canvas</text><text x="1160" y="245" textAnchor="end" fontSize="27" fill="#BA8A9F">SAMPLE ORDER</text>
 <rect x="488" y="280" width="682" height="564" rx="15" fill="#F8E4E9"/><path d="M512 788H1142 M828 301V817" stroke="#EACBD6" strokeDasharray="6 9"/><Cake x={829} y={694} s={1.12} colour={c} topper={colour}/>
 <text x="831" y="896" textAnchor="middle" fontSize="29" fill="#956579">{colour>.7?'Rose finish + star topper':'Prepared design ready to style'}</text>
 <text x="1226" y="246" fontSize="30" fill="#8E576E">PRINT + APPROVAL</text>
 <rect x="1257" y="282" width="519" height="475" rx="8" fill="#FFFDF8" stroke="#DBBFCA" strokeWidth="2"/>
 <text x="1288" y="330" fontSize="30" fill="#A2647D">Customer proof</text><text x="1288" y="369" fontSize="26" fill="#BE95A7" fontFamily={MONO}>demo-cake / revision A</text>
 {proof<.05?<g fill="none" stroke="#E5D4DB" strokeWidth="3"><rect x="1333" y="416" width="367" height="224"/><path d="M1302 692H1731M1302 712H1605"/></g>:<g opacity={proof}><Cake x={1517} y={650} s={.72} colour={c} topper={1}/></g>}
 <rect x="1236" y="794" width="566" height="94" rx="15" fill={proof>.8?'#F2CCDA':'#F6E7EC'} stroke="#D7A6B9"/>
 <text x="1519" y="831" textAnchor="middle" fontSize="29" fill="#8E4D69">{proof>.8?'Approval draft ready':'Request customer approval'}</text><text x="1519" y="869" textAnchor="middle" fontSize="27" fill="#A86E88">{proof>.8?'Revision-bound design proof':'Review before production'}</text>
 <text x="85" y="989" fontSize="33" fill="#9B5C77">Style the cake. Prepare a proof. Request customer approval.</text>
 <g transform={`translate(${lerp(850,264,pointer)} ${lerp(571,433,pointer)})`}><circle r={9+rip*37} fill="none" stroke="#AB567A" strokeWidth="3" opacity={f>=60&&f<80?1-rip:0}/><path d="M0 0V39L11 29L23 49L34 42L22 23H39Z" fill="#8C4564" stroke="#FFF5F6" strokeWidth="3"/></g>
 </svg></AbsoluteFill>};
