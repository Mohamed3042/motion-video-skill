import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
const T:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;fill?:string;bold?:boolean;anchor?:'start'|'middle'|'end'}>=({x,y,children,size=30,fill='#E8EBEF',bold=false,anchor='start'})=><text x={x} y={y} fontFamily={BODY} fontSize={size} fontWeight={bold?650:400} fill={fill} textAnchor={anchor}>{children}</text>;
export const World:React.FC=()=>{
 const f=useSegFrame(), analyzed=f>=EVENTS[0].f, approved=f>=EVENTS[1].f, analysis=ease.cubicOut(clamp((f-60)/30)), plan=ease.cubicOut(clamp((f-120)/35));
 const first=ease.cubicInOut(clamp((f-20)/40)), second=ease.cubicInOut(clamp((f-94)/26)),cx=481+first*155+second*925,cy=411+first*128+second*149;
 return <AbsoluteFill style={{background:'#171C26'}}><svg width="1920" height="1080">
 <text x="88" y="132" fontFamily={FONT} fontSize="56" fill="#FFE9D5" fontWeight="650">MK Factory</text><T x={503} y={131} size={31} fill="#E2AA7E">Take an idea into production.</T><rect x="1686" y="88" width="140" height="53" rx="8" fill="#FF9250"/><T x={1756} y={126} size={30} bold fill="#1D2633" anchor="middle">DEMO</T>
 <rect x="88" y="187" width="1740" height="798" rx="15" fill="#252D3C" stroke="#404C60" strokeWidth="2"/>
 <rect x="88" y="187" width="1740" height="78" rx="15" fill="#313C4F"/><rect x="88" y="247" width="1740" height="18" fill="#313C4F"/>
 {['1  Business intake','2  AI brief','3  Owner review','4  Task plan'].map((s,i)=><g key={s}><T x={121+i*439} y={238} size={30} bold fill={i===0||i===1&&analyzed||i>=2&&approved?'#FFB78A':'#8593A5'}>{s}</T>{i<3&&<path d={`M${498+i*439} 219 L${511+i*439} 231 L${498+i*439} 243`} fill="none" stroke="#758399" strokeWidth="3"/>}</g>)}
 <T x={122} y={321} size={33} bold>Describe the business</T><T x={779} y={321} size={28} fill="#9FAEC1" anchor="end">Study DEMO-01</T>
 <rect x="120" y="347" width="661" height="148" rx="8" fill="#1B2230" stroke="#506077"/>
 <T x={143} y={389} size={30}>Business: Print studio</T><T x={143} y={433} size={28}>Process: Quote requests arrive by email</T><T x={143} y={477} size={28}>Goal: One reviewed quotation workspace</T>
 <rect x="120" y="519" width="310" height="63" rx="8" fill="#344052"/><T x={144} y={561} size={28}>Owner + evidence</T>
 <rect x="452" y="519" width="329" height="63" rx="8" fill={analyzed?'#805037':'#FF9250'}/><T x={616} y={561} size={34} bold fill={analyzed?'#FFEAD8':'#1B2734'} anchor="middle">{analyzed?'Brief generated':'Analyze intake'}</T>
 <path d="M813 290 V605" stroke="#49556A" strokeWidth="2"/><T x={848} y={321} size={34} bold>Review the AI brief</T><T x={1789} y={319} size={28} fill="#9FAEC1" anchor="end">DEMO ANALYSIS</T>
 <g opacity={analysis} transform={`translate(${(1-analysis)*35} 0)`}>
 {[['Suggested flow','Quote intake → owner review'],['Questions to resolve','Catalogue fields + approval role'],['Before UI work','Attach visual references for each screen']].map(([a,b],i)=><g key={a}><circle cx="860" cy={371+i*80} r="6" fill="#FF9250"/><T x={881} y={380+i*80} size={28} fill="#FFB989" bold>{a}</T><T x={1210} y={380+i*80} size={28}>{b.replace('→','/')}</T></g>)}
 </g>
 {!analyzed&&<g><path d="M850 376 H1770 M850 456 H1661 M850 536 H1726" stroke="#3A475B" strokeWidth="13" strokeLinecap="round"/><T x={849} y={589} size={28} fill="#9FAEC1">Analyze the intake to prepare a reviewable brief.</T></g>}
 <rect x="120" y="622" width="1674" height="114" rx="10" fill={approved?'#314F40':'#493A2E'} stroke={approved?'#6E9B7E':'#A57248'} strokeWidth="2"/>
 <T x={145} y={668} size={34} bold fill="#FFE8D0">Owner review gate</T><T x={145} y={711} size={28} fill="#BFC6C6">{approved?'Study revision approved by Owner · task planning unlocked':'A human must approve this study revision before task planning.'}</T>
 <rect x="1410" y="645" width="357" height="68" rx="8" fill={approved?'#6F9A73':'#FF9250'} opacity={analyzed?1:.38}/><T x={1588} y={689} size={34} bold fill="#172C29" anchor="middle">{approved?'Owner approved':'Approve study'}</T>
 <T x={122} y={786} size={31} bold>Production plan</T><T x={1790} y={785} size={28} fill="#9FAEC1" anchor="end">{approved?'Ready to assign tasks':'Awaiting owner approval'}</T>
 <g opacity={.2+.8*plan} transform={`translate(0 ${(1-plan)*18})`}>
 <rect x="120" y="814" width="497" height="130" rx="9" fill="#1B2331"/><T x={143} y={858} size={31} bold>Design references</T><T x={143} y={908} size={29} fill="#FFB989">Planned · screen + state list</T>
 <rect x="641" y="814" width="599" height="130" rx="9" fill="#1B2331"/><T x={665} y={858} size={31} bold>Implementation + validation</T><T x={665} y={908} size={29} fill="#FFB989">Tasks assigned after review</T>
 <rect x="1264" y="814" width="530" height="130" rx="9" fill="#1B2331"/><T x={1288} y={858} size={31} bold>Release record</T><T x={1288} y={908} size={29} fill="#FFB989">Draft · requires validation</T>
 </g>
 <g transform={`translate(${cx} ${cy})`}><circle r={16+clamp((f-(f<100?60:120))/17)*25} stroke="#FF9250" strokeWidth="4" fill="none" opacity={f>=60&&f<78||f>=120&&f<138?1-clamp((f-(f<100?60:120))/17):0}/><path d="M0 0 V36 L10 27 L19 45 L28 40 L19 23 H34 Z" fill="#FFFFFF" stroke="#152536" strokeWidth="3"/></g>
 </svg></AbsoluteFill>;
};
