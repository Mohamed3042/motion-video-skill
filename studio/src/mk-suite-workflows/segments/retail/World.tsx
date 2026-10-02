import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BODY,FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {cursorOut} from '../../shell/cursor';
import {smooth,clamp,lerp} from '../../util';

export const World:React.FC=()=>{
 const f=useSegFrame(),assign=f>=60,flow=smooth(60,96,f),move=smooth(12,60,f),remaining=18-Math.round(flow*12);
 const items=[['Kraft boxes',18,assign?12:0,remaining],['Paper sleeves',54,0,54],['Label rolls',32,0,32]];
 return <AbsoluteFill style={{background:'#E9F7EF'}}>
  <svg width="1920" height="1080" style={{fontFamily:BODY}}>
   <text x="94" y="132" fontFamily={FONT} fontSize="54" fontWeight="700" fill="#185B49">Retail Ops Hub</text><text x="623" y="129" fontSize="34" fill="#6A9986">See the next store action.</text>
   <rect x="1510" y="91" width="147" height="53" rx="26" fill="#D1ECDD"/><text x="1530" y="128" fontSize="28" fill="#488569">Preview</text><rect x="1671" y="91" width="152" height="53" rx="26" fill="#B4DAC8"/><text x="1705" y="128" fontSize="28" fill="#326B53">DEMO</text>
   <rect x="89" y="193" width="1156" height="789" rx="18" fill="#FFFFFF" stroke="#B6D8C6" strokeWidth="2"/>
   <text x="116" y="246" fontSize="34" fontWeight="600" fill="#2C7157">Orders + stock</text><rect x="876" y="212" width="339" height="57" rx="10" fill="#E4F2EB"/><text x="908" y="251" fontSize="29" fill="#5D937B">Main store · sample</text>
   <path d="M114 299H1216" stroke="#BFDCCB" strokeWidth="2"/><text x="118" y="347" fontSize="28" fill="#86AC98">ITEM</text><text x="653" y="347" fontSize="28" fill="#86AC98">ON HAND</text><text x="846" y="347" fontSize="28" fill="#86AC98">ASSIGNED</text><text x="1050" y="347" fontSize="28" fill="#86AC98">LEFT</text>
   {items.map((r,i)=><g key={String(r[0])}><rect x="112" y={374+i*128} width="1111" height="113" rx="10" fill={i===0&&assign?'#FFF2D9':i%2?'#F0F8F3':'#E9F5EE'} stroke={i===0&&assign?'#D6B36F':'#D9EADF'}/><text x="136" y={423+i*128} fontSize="34" fontWeight="600" fill="#39795D">{r[0]}</text><text x="680" y={437+i*128} fontFamily={MONO} fontSize="36" fill="#4C846A">{r[1]}</text><text x="887" y={437+i*128} fontFamily={MONO} fontSize="36" fill="#4C846A">{r[2]}</text><text x="1080" y={437+i*128} fontFamily={MONO} fontSize="39" fontWeight="600" fill={i===0&&assign?'#AF7835':'#337657'}>{r[3]}</text><rect x="137" y={449+i*128} width="340" height="8" rx="4" fill="#C3DEC9"/><rect x="137" y={449+i*128} width={i===0?340*(remaining/18):i===1?282:211} height="8" rx="4" fill={i===0&&assign?'#D8B268':'#69AE8A'}/></g>)}
   <rect x="114" y="793" width="1108" height="151" rx="12" fill={assign?'#FAE8C9':'#E9F5EE'} stroke={assign?'#DAB779':'#C8E1D2'}/>
   <text x="140" y="841" fontSize="34" fontWeight="600" fill={assign?'#9C6A32':'#427D60'}>{assign?'Low stock: Kraft boxes':'Stock threshold: 10 boxes'}</text><text x="140" y="888" fontSize="30" fill={assign?'#AD8655':'#80A58D'}>{assign?'6 remaining after assigning the sample order.':'Assign an order to review replenishment.'}</text><text x="140" y="927" fontSize="28" fill="#A3875F">{assign?'Prepare a draft. Review before ordering.':'No inventory has been changed outside this demo.'}</text>
   <rect x="1280" y="193" width="554" height="790" rx="18" fill="#2A7359"/>
   <text x="1309" y="250" fontSize="30" fill="#ACD9C2">ORDER DEMO-018</text><text x="1309" y="307" fontSize="36" fontWeight="600" fill="#EFFBF4">Packing tomorrow</text><path d="M1308 336H1804" stroke="#67A98D"/>
   <text x="1309" y="393" fontSize="33" fill="#DDF3E7">Kraft boxes</text><text x="1749" y="393" fontFamily={MONO} fontSize="35" fill="#DDF3E7">12</text><text x="1309" y="443" fontSize="28" fill="#A8D3BD">Sample order allocation</text>
   <rect x="1309" y="477" width="496" height="75" rx="10" fill="#BFE5CF"/><text x="1430" y="527" fontSize="34" fontWeight="600" fill="#286446">{assign?'Stock assigned':'Assign stock'}</text>
   <g opacity={flow} transform={`translate(0 ${(1-flow)*70})`}><rect x="1309" y="605" width="496" height="327" rx="10" fill="#EAF6EF"/><text x="1336" y="652" fontSize="29" fill="#6B997E">REPLENISHMENT DRAFT</text><text x="1336" y="711" fontSize="33" fontWeight="600" fill="#3F7657">Kraft boxes</text><text x="1336" y="762" fontSize="32" fill="#3F7657">Quantity: 20</text><path d="M1336 789H1776" stroke="#B6D7C2"/><text x="1336" y="835" fontSize="29" fill="#749B7E">Status: needs review</text><text x="1336" y="882" fontSize="28" fill="#749B7E">No purchase order sent.</text></g>
   {f>=60&&f<82?<circle cx="1570" cy="522" r={18+(f-60)*2} fill="none" stroke="#C8F2D8" strokeWidth="3" opacity={1-(f-60)/22}/>:null}
   <path style={cursorOut(f,74)} d="M0 0V47L13 35L24 60L36 54L24 31L42 29Z" transform={`translate(${lerp(780,1570,move)} ${lerp(430,522,move)-Math.sin(move*Math.PI)*65})`} fill="#FBFFF8" stroke="#458767" strokeWidth="3"/>
  </svg>
 </AbsoluteFill>;
};
