import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
const T:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;fill?:string;bold?:boolean;anchor?:'start'|'middle'|'end'}>=({x,y,children,size=30,fill='#173047',bold=false,anchor='start'})=><text x={x} y={y} fontFamily={BODY} fontSize={size} fontWeight={bold?650:400} fill={fill} textAnchor={anchor}>{children}</text>;
export const World:React.FC=()=>{
 const f=useSegFrame(), made=f>=EVENTS[0].f, draft=ease.cubicOut(clamp((f-60)/30)), follow=ease.cubicOut(clamp((f-92)/27)), travel=ease.cubicInOut(clamp((f-20)/40)), ripple=clamp((f-60)/18);
 return <AbsoluteFill style={{background:'#F5E6D7'}}><svg width="1920" height="1080">
 <text x="88" y="132" fontFamily={FONT} fontSize="54" fontWeight="650" fill="#183248">Marketing Automation</text><T x={758} y={131} size={31} fill="#B75A43">Plan the next conversation.</T><rect x="1686" y="88" width="140" height="53" rx="8" fill="#E96C4F"/><T x={1756} y={126} size={30} fill="#FFFFFF" bold anchor="middle">DEMO</T>
 <rect x="88" y="188" width="532" height="797" rx="17" fill="#183248"/>
 <T x={123} y={247} size={36} bold fill="#FFF2DB">Consented contacts</T><rect x="125" y="279" width="191" height="56" rx="7" fill="#365069"/><T x={220} y={317} size={28} fill="#FFFFFF" anchor="middle">Import CSV</T>
 <T x={124} y={387} size={28} fill="#ACBDC7">Demo list · 3 contacts</T>
 {[['Contact A','Consent recorded',true],['Contact B','Consent recorded',true],['Contact C','Consent unconfirmed',false]].map(([name,state,ok],i)=><g key={String(name)} transform={`translate(123 ${429+i*130})`}>
 <rect width="462" height="110" rx="8" fill={ok?'#29465C':'#203B50'} stroke={ok?'#66847B':'#365267'}/>
 <rect x="20" y="23" width="31" height="31" rx="5" fill={ok?'#E2AB74':'none'} stroke="#B4C8C7" strokeWidth="2"/>
 {ok&&<path d="M26 37 L34 45 L46 29" fill="none" stroke="#183248" strokeWidth="3"/>}
 <T x={72} y={48} size={32} fill="#FFF2DB" bold>{String(name)}</T><T x={72} y={89} size={28} fill={ok?'#AFCCB1':'#B0B8BE'}>{String(state)}</T>
 </g>)}
 <rect x="123" y="859" width="461" height="82" rx="8" fill="#E3AB75"/><T x={354} y={912} size={32} bold anchor="middle">2 contacts selected</T>
 <path d="M620 628 H653" stroke="#E96C4F" strokeWidth="5"/><path d="M642 617 L657 628 L642 639" stroke="#E96C4F" strokeWidth="4" fill="none"/>
 <rect x="657" y="188" width="1169" height="474" rx="17" fill="#FFFAF1"/>
 <T x={696} y={251} size={36} bold>Campaign canvas</T><rect x="1403" y="213" width="380" height="74" rx="9" fill={made?'#357566':'#E96C4F'}/><T x={1593} y={261} size={34} bold fill="#FFFFFF" anchor="middle">{made?'Draft created':'Create draft'}</T>
 <path d="M696 315 H1784" stroke="#D9CAB8"/>
 <T x={696} y={363} size={29} fill="#8D7D70">To</T><T x={827} y={363} size={32}>2 consented contacts</T>
 <T x={696} y={428} size={29} fill="#8D7D70">Subject</T><T x={827} y={428} size={35} bold>{made?'A new design project':'New campaign'}</T>
 <g opacity={draft} transform={`translate(${(1-draft)*55} 0)`}><T x={696} y={506} size={32}>Hello,</T><T x={696} y={553} size={32}>Here is an overview of our design services.</T><T x={696} y={600} size={32}>Reply when you would like to discuss a project.</T></g>
 {!made&&<g><path d="M696 505 H1517 M696 549 H1744 M696 593 H1389" stroke="#DFD2C4" strokeWidth="11" strokeLinecap="round"/><T x={1477} y={610} size={28} fill="#B48E78">Draft body</T></g>}
 <g transform={`translate(0 ${(1-follow)*35})`} opacity={.3+.7*follow}>
 <rect x="657" y="694" width="1169" height="291" rx="17" fill="#EBC9B5"/><T x={695} y={748} size={34} bold>Follow-up plan</T>
 <path d="M754 842 H1411" stroke="#B58C78" strokeWidth="5"/>
 {[['Today','Campaign draft',744],['Day 3','Review reply',1110],['Day 7','Plan next step',1477]].map(([a,b,x],i)=><g key={String(a)}>
 <circle cx={Number(x)} cy="842" r={i===0?16:12} fill={follow?'#E96C4F':'#B58C78'}/><T x={Number(x)} y={806} size={30} bold>{String(a)}</T><T x={Number(x)} y={892} size={29}>{String(b)}</T></g>)}
 <T x={695} y={951} size={28} fill="#8B624E">Draft only · follow-ups planned · nothing sent</T>
 </g>
 <g transform={`translate(${505+travel*1140} ${879-travel*633})`}><circle r={17+ripple*27} stroke="#E96C4F" strokeWidth="4" fill="none" opacity={made&&f<80?1-ripple:0}/><path d="M0 0 V36 L10 27 L19 45 L28 40 L19 23 H34 Z" fill="#FFFFFF" stroke="#173047" strokeWidth="3"/></g>
 </svg></AbsoluteFill>;
};
