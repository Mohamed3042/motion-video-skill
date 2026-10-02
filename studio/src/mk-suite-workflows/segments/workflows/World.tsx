import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
const T:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;fill?:string;bold?:boolean;anchor?:'start'|'middle'|'end'}>=({x,y,children,size=30,fill='#2F2855',bold=false,anchor='start'})=><text x={x} y={y} fontFamily={BODY} fontSize={size} fontWeight={bold?650:400} fill={fill} textAnchor={anchor}>{children}</text>;
export const World:React.FC=()=>{
 const f=useSegFrame(), approved=f>=EVENTS[0].f, flow=ease.cubicOut(clamp((f-60)/34)), cursor=ease.cubicInOut(clamp((f-24)/36)), ripple=clamp((f-60)/18);
 return <AbsoluteFill style={{background:'#EDEAF7'}}><svg width="1920" height="1080" style={{fontFamily:BODY}}>
 <text x="88" y="132" fontFamily={FONT} fontSize="54" fill="#2D2552" fontWeight="600">Managed Workflows</text><T x={729} y={131} size={31} fill="#75619F">Move work through approval.</T>
 <rect x="1686" y="88" width="140" height="53" rx="8" fill="#382B68"/><T x={1756} y={126} size={30} bold fill="#FFFFFF" anchor="middle">DEMO</T>
 <rect x="87" y="185" width="1739" height="799" rx="18" fill="#FFFFFF"/>
 <rect x="87" y="185" width="1739" height="84" rx="18" fill="#382B68"/><rect x="87" y="245" width="1739" height="24" fill="#382B68"/>
 <T x={122} y={240} size={33} bold fill="#FFFFFF">Approval template</T><T x={590} y={240} size={29} fill="#CCBFE8">Request / role review / audit</T><T x={1740} y={240} size={29} fill="#CCBFE8" anchor="end">DRAFT TEMPLATE</T>
 <rect x="1279" y="269" width="547" height="715" fill="#F5F1FC"/><path d="M1279 269 V984" stroke="#DBD3E7" strokeWidth="2"/>
 {[['Requester',331],['Reviewer',503],['Audit',675]].map(([label,y])=><g key={label}><path d={`M116 ${Number(y)+111} H1255`} stroke="#D8D0E4"/><T x={121} y={Number(y)+36} size={29} fill="#806D9C">{label}</T></g>)}
 <rect x="323" y="314" width="371" height="100" rx="12" fill="#EEE8FA" stroke="#AD9BD2" strokeWidth="2"/>
 <T x={347} y={355} size={31} bold>Request D-021</T><T x={347} y={392} size={28} fill="#806D9C">Submitted by Requester</T>
 <path d="M694 364 H778 Q819 364 819 405 V487" stroke="#B6A4D7" strokeWidth="5" fill="none"/>
 <path d="M694 364 H778 Q819 364 819 405 V487" stroke="#8061BD" strokeWidth="5" fill="none" strokeDasharray={`${240*flow} 400`}/>
 <rect x="607" y="483" width="426" height="112" rx="12" fill={approved?'#E7F0DD':'#F5EADF'} stroke={approved?'#738C55':'#C7AA83'} strokeWidth="2"/>
 <T x={637} y={529} size={34} bold>{approved?'Approved by Reviewer':'Awaiting role approval'}</T><T x={637} y={568} size={28} fill="#806D9C">Role check: Reviewer</T>
 <path d="M820 595 V682 H1077" fill="none" stroke="#C5B8DD" strokeWidth="5"/><path d="M820 595 V682 H1077" fill="none" stroke="#738C55" strokeWidth="5" strokeDasharray={`${344*flow} 500`}/>
 <circle cx={820+flow*251} cy="682" r="12" fill="#738C55" opacity={flow}/>
 <rect x="954" y="711" width="269" height="83" rx="10" fill="#EEE8FA" stroke="#AD9BD2"/><T x={978} y={745} size={29} bold>{approved?'Audit recorded':'Audit pending'}</T><T x={978} y={778} size={28} fill="#806D9C">Request D-021</T>
 <rect x="115" y="819" width="1115" height="127" rx="10" fill="#F0EDF5"/>
 <T x={139} y={858} size={28} bold>Decision history</T>
 <T x={139} y={907} size={29} fill={approved?'#49673D':'#8F87A0'}>{approved?'D-021  ·  APPROVE  ·  actor: Reviewer  ·  role checked':'D-021  ·  Submitted  ·  actor: Requester'}</T>
 <T x={1311} y={327} size={35} bold>Review request</T><T x={1311} y={373} size={29} fill="#806D9C">Demo equipment request</T>
 <path d="M1311 401 H1791" stroke="#D5C9E3"/><T x={1311} y={447} size={29}>Your role</T><T x={1790} y={447} size={31} bold anchor="end">Reviewer</T>
 <rect x="1311" y="482" width="480" height="87" rx="11" fill={approved?'#49673D':'#7053A8'}/><T x={1551} y={539} size={35} bold fill="#FFFFFF" anchor="middle">{approved?'Approval recorded':'Approve request'}</T>
 <T x={1311} y={628} size={30} bold>Outbox + retry policy</T><T x={1311} y={677} size={29}>Delivery: not connected</T><T x={1311} y={724} size={29}>Retries: manual review</T>
 <rect x="1311" y="790" width="480" height="145" rx="10" fill="#E5DEEF"/><T x={1335} y={836} size={29} bold>Human decision retained</T><T x={1335} y={881} size={28}>Approval and delivery</T><T x={1335} y={917} size={28}>have separate audit records.</T>
 <g transform={`translate(${853+cursor*717} ${584-cursor*67})`}><circle r={16+ripple*28} fill="none" stroke="#B294F3" strokeWidth="4" opacity={f>=60&&f<80?1-ripple:0}/><path d="M0 0 V37 L10 27 L20 45 L28 40 L19 23 H34 Z" fill="#FFFFFF" stroke="#35264F" strokeWidth="3"/></g>
 </svg></AbsoluteFill>;
};
