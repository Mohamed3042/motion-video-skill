import React from 'react';
import {loadFont} from '@remotion/google-fonts/NotoSansArabic';
const ARABIC=loadFont('normal',{weights:['400','600'],subsets:['arabic']}).fontFamily;
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
const T:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;fill?:string;bold?:boolean;anchor?:'start'|'middle'|'end';ar?:boolean}>=({x,y,children,size=30,fill='#2A422D',bold=false,anchor='start',ar=false})=><text x={x} y={y} fontFamily={ar?ARABIC:BODY} fontSize={size} fontWeight={bold?650:400} fill={fill} textAnchor={anchor}>{children}</text>;
export const World:React.FC=()=>{
 const f=useSegFrame(), saved=f>=EVENTS[0].f, record=ease.cubicOut(clamp((f-60)/30)), move=ease.cubicInOut(clamp((f-20)/40));
 return <AbsoluteFill style={{background:'#273D2D'}}><svg width="1920" height="1080">
 <text x="88" y="132" fill="#F3E8C7" fontFamily={FONT} fontSize="54" fontWeight="600">Flock Operations</text><T x={635} y={131} size={31} fill="#CBB87D">Know what changed on the farm.</T><rect x="1686" y="88" width="140" height="53" rx="8" fill="#C8AD66"/><T x={1756} y={126} size={30} bold anchor="middle">DEMO</T>
 <rect x="88" y="187" width="1740" height="798" rx="15" fill="#F1EDDD"/>
 <rect x="89" y="188" width="1738" height="89" rx="15" fill="#DDD5B3"/><rect x="89" y="253" width="1738" height="24" fill="#DDD5B3"/>
 <T x={120} y={246} size={35} bold>Farm ledger</T><T x={506} y={246} size={31}>Records</T><T x={691} y={246} size={31}>Worker updates</T><T x={1016} y={246} size={31}>Costs</T><T x={1788} y={246} size={34} ar anchor="end">سجل القطيع</T>
 <T x={123} y={333} size={33} bold>Animal DEMO-014</T><T x={123} y={380} size={29} fill="#7F856A">Sample flock record · growing phase</T>
 <path d="M144 459 H857" stroke="#A9AE83" strokeWidth="6"/>
 {[['Born',163],['Weaned',491],['Growing',831]].map(([label,x],i)=><g key={String(label)}><circle cx={Number(x)} cy="459" r={i===2?19:12} fill={i===2?'#657B45':'#C8AD66'}/><T x={Number(x)} y={514} size={30} bold={i===2} anchor="middle">{String(label)}</T></g>)}
 <path d="M123 559 H946" stroke="#C5BFA7"/><T x={124} y={613} size={32} bold>Operating costs</T><T x={922} y={613} size={28} fill="#7F856A" anchor="end">Sample KWD</T>
 {[['Feed','12.00'],['Care','8.00']].map(([a,b],i)=><g key={a}><T x={125} y={676+i*61} size={31}>{a}</T><T x={922} y={676+i*61} size={31} anchor="end">{b}</T><path d={`M124 ${694+i*61} H945`} stroke="#D8D0B9"/></g>)}
 <T x={124} y={817} size={34} bold>Total recorded</T><T x={922} y={817} size={40} bold anchor="end">20.00</T>
 <rect x="122" y="868" width="824" height="77" rx="9" fill="#E1D8B9"/><T x={149} y={918} size={31} bold>Daily log</T><T x={919} y={918} size={32} bold anchor="end">{saved?'4 reviewed entries':'3 reviewed entries'}</T>
 <path d="M985 305 V952" stroke="#C5BFA7" strokeWidth="2"/>
 <T x={1023} y={333} size={34} bold>Worker update</T><T x={1785} y={332} size={28} fill="#7F856A" anchor="end">Worker A · DEMO</T>
 <rect x="1024" y="375" width="761" height="204" rx="11" fill="#FFFFFF" stroke="#CAC4AB"/>
 <T x={1053} y={429} size={33}>Feed checked.</T><T x={1053} y={477} size={33}>Water refreshed.</T><T x={1053} y={545} size={28} fill="#7F856A">Linked to DEMO-014</T>
 <rect x="1024" y="609" width="761" height="83" rx="10" fill={saved?'#627843':'#304C35'}/><T x={1404} y={663} size={35} bold fill="#F8F1D8" anchor="middle">{saved?'Update approved + recorded':'Review and approve update'}</T>
 <T x={1024} y={758} size={32} bold>Attributed history</T>
 <g opacity={record} transform={`translate(0 ${(1-record)*24})`}>
 <rect x="1024" y="789" width="761" height="155" rx="10" fill="#E1E8CB" stroke="#AAB58A"/>
 <T x={1052} y={838} size={31} bold>Worker A submitted the update</T><T x={1052} y={884} size={30}>Owner reviewed · added to daily log</T><T x={1052} y={925} size={28} fill="#65764B">Previous entries remain in history</T>
 </g>
 {!saved&&<T x={1024} y={835} size={29} fill="#8F957B">Review the update before recording it.</T>}
 <g transform={`translate(${1587-move*143} ${491+move*146})`}><circle r={16+clamp((f-60)/18)*25} stroke="#C8AD66" strokeWidth="4" fill="none" opacity={saved&&f<79?1-clamp((f-60)/18):0}/><path d="M0 0 V36 L10 27 L19 45 L28 40 L19 23 H34 Z" fill="#FFFFFF" stroke="#243C29" strokeWidth="3"/></g>
 </svg></AbsoluteFill>;
};
