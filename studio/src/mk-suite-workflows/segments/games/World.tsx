import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
const T:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;fill?:string;bold?:boolean;anchor?:'start'|'middle'|'end'}>=({x,y,children,size=30,fill='#F2EAFE',bold=false,anchor='start'})=><text x={x} y={y} fontFamily={BODY} fontSize={size} fontWeight={bold?650:400} fill={fill} textAnchor={anchor}>{children}</text>;
const titles=['Warstrike','Safari3D','Artillery3D','UberStrike'], palette=['#5F626D','#638B4F','#A77B42','#506EAE'];
export const World:React.FC=()=>{
 const f=useSegFrame(), chosen=f>=EVENTS[0].f, update=f>=EVENTS[1].f, show=ease.cubicOut(clamp((f-60)/27)), details=ease.cubicOut(clamp((f-120)/28));
 const first=ease.cubicInOut(clamp((f-24)/36)),second=ease.cubicInOut(clamp((f-95)/25)),cx=362+first*326+second*903,cy=675-first*279+second*159;
 return <AbsoluteFill style={{background:'#130D29'}}><svg width="1920" height="1080">
 <text x="88" y="132" fontFamily={FONT} fontSize="56" fontWeight="650" fill="#F5DEFF">MK Games</text><T x={484} y={131} size={31} fill="#C39ADC">Your library. Ready to explore.</T><rect x="1686" y="88" width="140" height="53" rx="8" fill="#C874E7"/><T x={1756} y={126} size={30} bold fill="#1D1830" anchor="middle">DEMO</T>
 <rect x="88" y="187" width="1740" height="798" rx="17" fill="#221B38" stroke="#483754" strokeWidth="2"/>
 <rect x="89" y="188" width="1738" height="88" rx="17" fill="#2D2446"/><rect x="89" y="252" width="1738" height="24" fill="#2D2446"/>
 <T x={120} y={245} size={35} bold fill="#ECAFED">Library</T><T x={320} y={245} size={31}>Showcases</T><T x={573} y={245} size={31}>Updates</T><T x={1788} y={245} size={28} fill="#A999BC" anchor="end">Illustrated launcher · no gameplay</T>
 <T x={119} y={322} size={31} bold>Your collection</T><path d="M887 301 V954" stroke="#4A3B5B" strokeWidth="2"/>
 {titles.map((title,i)=>{const x=117+(i%2)*381,y=351+Math.floor(i/2)*237,selected=chosen&&i===1;return <g key={title} transform={`translate(${x} ${y})`}>
 <rect width="354" height="212" rx="11" fill={selected?'#465635':'#2A2340'} stroke={selected?'#C8F791':'#4B3B5A'} strokeWidth={selected?4:2}/>
 <clipPath id={`game-tile-${i}`}><rect x="2" y="2" width="350" height="119" rx="10"/></clipPath>
 <g clipPath={`url(#game-tile-${i})`}><rect width="354" height="123" fill={palette[i]}/><circle cx={271-i*25} cy="37" r="28" fill="#F5D793" opacity=".65"/><path d={`M0 120 L54 ${56+i*11} L97 85 L168 26 L238 112 L286 77 L354 109 V140 H0 Z`} fill="#15293A" opacity=".75"/><path d="M0 137 L132 93 L239 127 L354 81 V151 H0 Z" fill="#12253A" opacity=".8"/></g>
 <T x={19} y={161} size={34} bold>{title}</T><T x={19} y={195} size={28} fill={selected?'#C8F791':'#B1A3C7'}>{i===0?'Source preserved':selected?'Showcase selected':'Browse showcase'}</T>
 </g>;})}
 <rect x="117" y="867" width="736" height="79" rx="9" fill="#302744"/><T x={145} y={916} size={29} fill="#C7B8DB">Windows launcher · phone browse companion</T>
 <T x={924} y={329} size={39} bold>{chosen?'Safari3D':'Open a game showcase'}</T><T x={1789} y={327} size={28} fill="#B5A4C7" anchor="end">COLLECTION PREVIEW</T>
 <rect x="925" y="359" width="869" height="141" rx="11" fill="#1A2230"/>
 <g opacity={show}><clipPath id="games-showcase"><rect x="925" y="359" width="869" height="141" rx="11"/></clipPath><g clipPath="url(#games-showcase)"><rect x="925" y="359" width="869" height="141" fill="#4F6C43"/><circle cx="1638" cy="390" r="57" fill="#E1C477"/><path d="M925 475 L1070 401 L1163 457 L1286 386 L1434 465 L1566 441 L1794 476 V501 H925 Z" fill="#243E36"/><path d="M925 504 L1107 467 L1275 481 L1511 447 L1794 499" fill="#162E30" stroke="#142A30" strokeWidth="22"/></g><T x={952} y={470} size={29} fill="#F3E9C7">Showcase artwork · DEMO</T></g>
 {!chosen&&<T x={961} y={444} size={31} fill="#A89CBB">Select a library tile to inspect its showcase.</T>}
 <rect x="925" y="526" width="430" height="69" rx="9" fill={chosen?'#604579':'#382E4D'}/><T x={1140} y={571} size={34} bold anchor="middle">Browse showcase</T>
 <rect x="1378" y="526" width="416" height="69" rx="9" fill={update?'#637D4D':'#BD6EDA'}/><T x={1586} y={571} size={34} bold anchor="middle" fill={update?'#F1FFE1':'#201B2E'}>{update?'Manifest reviewed':'Review signed update'}</T>
 <rect x="925" y="626" width="869" height="321" rx="11" fill="#191F2B" stroke="#48536A"/>
 <T x={952} y={674} size={32} bold>Signed update manifest</T><T x={1768} y={673} size={28} fill="#A0B78C" anchor="end">DEMO FIXTURE</T>
 <g opacity={.35+.65*details}>
 <path d="M953 701 H1766 M953 771 H1766 M953 842 H1766" stroke="#3E4656"/>
 <T x={953} y={746} size={29}>Ed25519 signature</T><T x={1765} y={746} size={31} fill={update?'#B7E792':'#8E96A8'} anchor="end">{update?'Valid · fixture':'Ready for review'}</T>
 <T x={953} y={817} size={29}>SHA-256 file list</T><T x={1765} y={817} size={29} fill="#B1C2A0" anchor="end">Content hashes listed</T>
 <T x={953} y={887} size={29}>Rollback snapshot</T><T x={1765} y={887} size={31} fill="#B7E792" anchor="end">{update?'demo-001 retained':'Previous version'}</T>
 <T x={953} y={928} size={28} fill="#92A0B2">Review integrity and recovery before changing versions.</T>
 </g>
 <g transform={`translate(${cx} ${cy})`}><circle r={16+clamp((f-(f<100?60:120))/17)*26} stroke="#EB9DFA" strokeWidth="4" fill="none" opacity={f>=60&&f<78||f>=120&&f<138?1-clamp((f-(f<100?60:120))/17):0}/><path d="M0 0 V36 L10 27 L19 45 L28 40 L19 23 H34 Z" fill="#FAE5FF" stroke="#1D1635" strokeWidth="3"/></g>
 </svg></AbsoluteFill>;
};
