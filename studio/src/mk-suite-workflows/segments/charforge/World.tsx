import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease,lerp,mixHex} from '../../util';
export const World:React.FC=()=>{const f=useSegFrame(),change=ease.cubicInOut(clamp((f-60)/28)),review=ease.cubicOut(clamp((f-91)/25)),pointer=ease.cubicInOut(clamp((f-29)/31)),rip=clamp((f-60)/20);const col=mixHex('#9B78C8','#E2A072',change),turn=Math.sin(clamp((f-96)/45)*Math.PI)*.1;
return <AbsoluteFill style={{background:'#150C24',fontFamily:FONT}}><svg width="1920" height="1080">
 <defs><pattern id="charGrid" width="58" height="58" patternUnits="userSpaceOnUse"><path d="M58 0H0V58" fill="none" stroke="#65478D" opacity=".23"/></pattern></defs>
 <text x="84" y="138" fontSize="54" fontWeight="700" fill="#F4E9FF">CharForge Studio</text><text x="614" y="137" fontSize="32" fill="#BB9FDD">Make a character your own.</text><rect x="1702" y="91" width="132" height="52" rx="26" fill="#442D5D"/><text x="1768" y="128" textAnchor="middle" fontSize="28" fill="#E6CDFF">DEMO</text>
 <rect x="82" y="189" width="1756" height="756" rx="24" fill="#241632" stroke="#62417B" strokeWidth="2"/><path d="M489 189V945 M1297 189V945" stroke="#5E4072" strokeWidth="2"/>
 <text x="112" y="247" fontSize="29" fill="#C4A8DD">SCENE HIERARCHY</text><text x="112" y="310" fontSize="34" fill="#F2DFFF" fontFamily={MONO}>demo-rig.glb</text><text x="111" y="355" fontSize="28" fill="#A887C2">Imported character</text>
 {['Character','Body mesh','Jacket','Trousers','Footwear'].map((t,i)=><g key={t} transform={`translate(${111+(i?25:0)} ${402+i*75})`}>{i===2&&<rect x="-13" y="-38" width="341" height="62" rx="8" fill="#573872"/>}<path d="M0 -22H16V-6H0Z" fill="none" stroke="#BE9CDC" strokeWidth="2"/><text x="36" y="0" fontSize="30" fill={i===2?'#FFF2FF':'#B29AC8'}>{t}</text></g>)}
 <rect x="111" y="830" width="349" height="66" rx="11" fill="#3B2850"/><text x="285" y="874" textAnchor="middle" fontSize="28" fill="#D8BCEB">Import a character</text>
 <rect x="490" y="265" width="806" height="590" fill="url(#charGrid)"/><text x="525" y="241" fontSize="29" fill="#D7BAEF">Character viewport</text><text x="1259" y="241" textAnchor="end" fontSize="28" fill="#9F7CBF">Material preview</text>
 <ellipse cx="903" cy="817" rx="285" ry="52" fill="#100B19" stroke="#705188"/>
 <g transform={`translate(900 475) scale(${.84+turn} .84)`} stroke="#CFB7EB" strokeWidth="2" strokeLinejoin="round">
  <path d="M-58 -212L0 -247L58 -212L67 -145L0 -114L-67 -145Z" fill="#BCA9D1"/><path d="M0 -247V-114L67 -145L58 -212Z" fill="#765E94"/>
  <path d="M-51 -117H51L129 -66L93 156L0 205L-93 156L-129 -66Z" fill="#7C698D"/>
  <path d="M-129 -66L-189 -5L-218 124L-189 151L-154 90L-105 22Z M129 -66L189 -5L218 124L189 151L154 90L105 22Z" fill="#A38EB6"/>
  <path d="M-94 163L-8 202L-25 415L-99 415Z M8 202L94 163L99 415L25 415Z" fill="#665277"/><path d="M-25 415L-101 415L-122 446H-17Z M25 415L101 415L122 446H17Z" fill="#BCAACB"/>
  <path d="M-142 -81L-65 -124L0 -94L65 -124L142 -81L160 80L102 99L85 -10L100 166L0 208L-100 166L-85 -10L-102 99L-160 80Z" fill={col} stroke="#FFE0C1"/><path d="M0 -94V208M-55 -108L-13 -37L0 -94L13 -37L55 -108 M-70 84H-20V142H-70Z M20 84H70V142H20Z" fill="none" stroke="#4B345B" opacity=".6"/>
 </g>
 <path d="M732 878H1055" stroke="#9874BA" strokeWidth="4"/><circle cx={868+review*70} cy="878" r="12" fill="#DEC4F5"/><text x="892" y="922" textAnchor="middle" fontSize="27" fill="#B496CD">Turntable review</text>
 <text x="1330" y="247" fontSize="30" fill="#DCC3F4">JACKET MATERIAL</text><text x="1331" y="318" fontSize="33" fill="#F5E8FF">Garment colour</text><text x="1331" y="361" fontSize="28" fill="#A68DBD">Switch garment colours</text>
 {['#9B78C8','#6CB7B4','#E2A072','#9FAEC5'].map((c,i)=><g key={c}><rect x={1331+i*113} y="401" width="85" height="85" rx="12" fill={c}/><rect x={1325+i*113} y="395" width="97" height="97" rx="17" fill="none" stroke="#FFEBDC" strokeWidth="3" opacity={i===(change>.4?2:0)?1:0}/></g>)}
 <rect x="1330" y="540" width="437" height="80" rx="13" fill="#4B335F"/><text x="1550" y="591" textAnchor="middle" fontSize="34" fill="#EAD4FF">Review the variation</text>
 <g opacity={review} transform={`translate(1330 ${681+(1-review)*20})`}><rect width="437" height="204" rx="16" fill="#3E294D" stroke="#AF86CA"/><text x="24" y="48" fontSize="34" fill="#F7E4FF">Material variant</text><rect x="25" y="76" width="50" height="50" rx="8" fill="#E2A072"/><text x="96" y="111" fontSize="29" fill="#E9CCB4">Warm clay jacket</text><text x="24" y="172" fontSize="28" fill="#B69BCB">Prepared character retained</text></g>
 <text x="86" y="990" fontSize="33" fill="#C6A4E3">Import the character. Change the garment. Inspect the result.</text>
 <g transform={`translate(${lerp(889,1600,pointer)} ${lerp(506,443,pointer)})`}><circle r={9+rip*38} fill="none" stroke="#FFF1E7" strokeWidth="3" opacity={f>=60&&f<80?1-rip:0}/><path d="M0 0V39L11 29L23 49L34 42L22 23H39Z" fill="#FFFFFF" stroke="#51316B" strokeWidth="3"/></g>
 </svg></AbsoluteFill>};
