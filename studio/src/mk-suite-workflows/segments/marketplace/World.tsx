import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BODY,FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {cursorOut} from '../../shell/cursor';
import {smooth,clamp,lerp} from '../../util';

const Phone:React.FC<{x:number;y:number;shade:string}>=({x,y,shade})=><g transform={`translate(${x} ${y})`}><rect width="75" height="122" rx="13" fill={shade} stroke="#DEC781" strokeWidth="3"/><rect x="8" y="10" width="59" height="101" rx="8" fill="#40371C"/><path d="M 24 14H51" stroke={shade} strokeWidth="5" strokeLinecap="round"/></g>;
export const World:React.FC=()=>{
 const f=useSegFrame(),compare=smooth(60,96,f),saved=f>=100,move=smooth(10,60,f);
 return <AbsoluteFill style={{background:'#29230F'}}>
  <svg width="1920" height="1080" style={{fontFamily:BODY}}>
   <text x="94" y="132" fontFamily={FONT} fontSize="53" fontWeight="700" fill="#F9E9B8">MK Marketplace</text><text x="670" y="130" fontSize="34" fill="#BCA772">Compare before you choose.</text><rect x="1667" y="87" width="154" height="57" rx="28" fill="#574B26"/><text x="1700" y="126" fontSize="29" fill="#F3D783">DEMO</text>
   <rect x="88" y="194" width="1744" height="201" rx="17" fill="#3B331A" stroke="#8D783B"/>
   <text x="113" y="245" fontSize="29" fill="#AD985C">BROWSE LISTINGS</text><text x="115" y="295" fontSize="34" fill="#E7CE8D">Demo Model X</text><text x="115" y="343" fontSize="29" fill="#A98F55">128 GB · example devices</text>
   <Phone x={559-compare*10} y={230} shade="#DFCA85"/><text x="663" y="273" fontSize="33" fill="#F0D797">Offer A · New</text><text x="663" y="322" fontSize="36" fontWeight="600" fill="#FFE8A7">KWD 120</text><text x="663" y="365" fontSize="28" fill="#A98F55">Sample listing price</text>
   <Phone x={1051+compare*10} y={230} shade="#A19056"/><text x="1158" y="273" fontSize="33" fill="#F0D797">Offer B · Used</text><text x="1158" y="322" fontSize="36" fontWeight="600" fill="#FFE8A7">KWD 75</text><text x="1158" y="365" fontSize="28" fill="#A98F55">Sample asking price</text>
   <rect x="1520" y="252" width="277" height="76" rx="11" fill="#DBBE69"/><text x="1564" y="301" fontSize="34" fontWeight="600" fill="#3E3216">{saved?'Shortlist: 2':'Compare'}</text>
   <rect x="88" y="432" width="1744" height="454" rx="17" fill="#F2E8C7"/>
   <path d="M552 432V886 M1173 432V886" stroke="#CBB983" strokeWidth="2"/><rect x="88" y="432" width="1744" height="76" rx="16" fill="#DCC98C"/><path d="M88 500H1832" stroke="#C3AC6C" strokeWidth="2"/>
   <text x="118" y="481" fontSize="30" fontWeight="600" fill="#6D592D">COMPARISON</text><text x="582" y="481" fontSize="32" fontWeight="600" fill="#5A4822">Offer A</text><text x="1204" y="481" fontSize="32" fontWeight="600" fill="#5A4822">Offer B</text>
   {[['Exact model','Model X · 128 GB','Model X · 128 GB'],['Condition','New · sealed','Used · minor wear'],['Price evidence','KWD 120 · demo source A','KWD 75 · demo source B'],['Keep separate','New-offer evidence','Used-offer evidence']].map((r,i)=><g key={r[0]}>
    <rect x="90" y={512+i*91} width="1740" height="90" fill={i===0&&compare>.2?'#DCE1B1':i%2?'#E9DDB5':'#F3E9CB'}/>
    <text x="117" y={568+i*91} fontSize="30" fill="#8B7542">{r[0]}</text>
    <text x="580" y={568+i*91} fontSize="31" fill="#5B4A26">{f<60&&i>0?'Select Compare':r[1]}</text><text x="1201" y={568+i*91} fontSize="31" fill="#5B4A26">{f<60&&i>0?'Select Compare':r[2]}</text>
   </g>)}
   <rect x="90" y="918" width="1741" height="71" rx="11" fill="#4A3F20" stroke="#87703C"/><text x="118" y="963" fontSize="29" fill="#C3AB69">{saved?'Two sample offers saved. Review sources before deciding.':'Compare the same model. Keep new and used evidence separate.'}</text>
   <g opacity={compare}><path d="M1718 933h21v39l-10-7-11 7Z" fill={saved?'#F2D277':'none'} stroke="#F2D277" strokeWidth="2"/></g>
   {f>=60&&f<82?<circle cx="1655" cy="290" r={18+(f-60)*2} fill="none" stroke="#FFE3A1" strokeWidth="3" opacity={1-(f-60)/22}/>:null}
   <path style={cursorOut(f,112)} d="M0 0V47L13 35L24 60L36 54L24 31L42 29Z" transform={`translate(${f<82?lerp(905,1655,move):lerp(1655,1730,smooth(82,100,f))} ${f<82?lerp(345,290,move)-Math.sin(move*Math.PI)*55:lerp(290,938,smooth(82,100,f))})`} fill="#FFF5D8" stroke="#7E652F" strokeWidth="3"/>
  </svg>
 </AbsoluteFill>;
};
