import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BODY,FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {cursorOut} from '../../shell/cursor';
import {smooth,clamp,lerp} from '../../util';

export const World:React.FC=()=>{
 const f=useSegFrame(),move=smooth(10,60,f),run=smooth(60,110,f),typed='Session notes'.slice(0,Math.floor(smooth(72,96,f)*13)),selected=Math.min(3,Math.floor(run*4));
 const steps=['Click the note editor','Wait 200 ms','Type "Session notes"','Press Ctrl + S'];
 return <AbsoluteFill style={{background:'#24150C'}}>
  <svg width="1920" height="1080" style={{fontFamily:BODY}}>
   <text x="94" y="132" fontFamily={FONT} fontSize="55" fontWeight="700" fill="#FFF0DC">MacroForge</text><text x="505" y="129" fontSize="33" fill="#D7AA86">Turn repetition into a macro.</text>
   <rect x="1664" y="87" width="158" height="55" rx="10" fill="#5E3724"/><text x="1698" y="126" fontSize="29" fill="#FFD1A3">DEMO</text>
   <rect x="84" y="180" width="1752" height="116" rx="18" fill="#4B2D1C" stroke="#906040"/>
   <circle cx="129" cy="237" r="14" fill="#F77559"/><text x="163" y="247" fontSize="32" fill="#FFE3C4">{f<24?'Recording actions':'Recording captured'}</text>
   <path d="M 573 206 V 270 M 1290 206 V 270" stroke="#986641"/><text x="612" y="245" fontSize="33" fill="#E8C3A1">Macro: Fill a note</text>
   <rect x="1343" y="205" width="205" height="64" rx="9" fill="#362115" stroke="#B48156"/><text x="1371" y="247" fontFamily={MONO} fontSize="30" fill="#FFD2A5">Ctrl + F8</text>
   <rect x="1580" y="205" width="220" height="64" rx="9" fill="#FF9C60"/><text x="1630" y="247" fontSize="34" fontWeight="700" fill="#3E2416">{f<60?'Run':'Replay'}</text>
   <text x="103" y="363" fontSize="32" fontWeight="600" fill="#E6B38A">Recorded steps</text><text x="479" y="363" fontSize="28" fill="#A98569">Drag to edit</text>
   <path d="M 146 411 V 810" stroke="#985934" strokeWidth="3" strokeDasharray="5 10"/>
   {steps.map((t,i)=>{const active=f>=60&&selected>=i;const wobble=i===1?-Math.sin(smooth(24,52,f)*Math.PI)*22:i===2?Math.sin(smooth(24,52,f)*Math.PI)*22:0;return <g key={t} transform={`translate(0 ${wobble})`}><rect x="102" y={396+i*115} width="650" height="93" rx="12" fill={active?'#714428':'#362418'} stroke={active?'#FFA86B':'#795337'} strokeWidth="2"/><circle cx="144" cy={441+i*115} r="21" fill={active?'#FFAB6F':'#815438'}/><text x="136" y={451+i*115} fontSize="28" fill="#28170D">{i+1}</text><text x="185" y={452+i*115} fontSize="31" fill={active?'#FFF1DE':'#D8B99D'}>{t}</text><path d={`M 714 ${428+i*115} h 12 M 714 ${439+i*115} h 12 M 714 ${450+i*115} h 12`} stroke="#C99A77" strokeWidth="3"/></g>})}
   <path d="M 784 591 H 832" stroke="#E5A366" strokeWidth="3"/><path d="M 822 579 L 835 591 L 822 603" stroke="#E5A366" strokeWidth="3" fill="none"/>
   <rect x="855" y="330" width="973" height="546" rx="16" fill="#F8EEDC"/>
   <path d="M 855 401 H 1828" stroke="#CEB9A0" strokeWidth="2"/><text x="883" y="376" fontSize="29" fontWeight="600" fill="#79583E">Selected window: Demo Notes</text>
   <rect x="1680" y="351" width="110" height="31" rx="15" fill="#D4C1A4"/><circle cx="1725" cy="366" r="7" fill="#F8EEDC"/>
   <text x="900" y="469" fontSize="28" fill="#AF9270">Untitled note</text><text x="900" y="552" fontFamily={FONT} fontSize="48" fill="#533A25">{typed}</text>
   <rect x={900+typed.length*23.5} y="511" width="3" height="51" fill="#D97939" opacity={f>=60?1:.4}/>
   {[615,678,741].map(y=><path key={y} d={`M 900 ${y} H 1781`} stroke="#DCCBB4"/>)}
   <text x="902" y="832" fontSize="29" fill="#7F644A">{run>.98?'Sequence replayed in the selected demo window.':'Your own steps, in a chosen window.'}</text>
   <rect x="102" y="911" width="1726" height="75" rx="12" fill="#3E291B" stroke="#785435"/><text x="129" y="959" fontSize="30" fill="#EAC6A6">Record actions</text><text x="650" y="959" fontSize="30" fill="#EAC6A6">Edit steps + hotkey</text><text x="1300" y="959" fontSize="30" fill="#FFAD74">Run the sequence</text>
   {f>=60&&f<83?<circle cx="1690" cy="242" r={18+(f-60)*2} fill="none" stroke="#FFE0B4" strokeWidth="3" opacity={1-(f-60)/23}/>:null}
   <path style={cursorOut(f,74)} d="M0 0V46L13 35L23 59L35 53L23 31L41 29Z" transform={`translate(${lerp(628,1690,move)} ${lerp(572,242,move)-Math.sin(move*Math.PI)*65})`} fill="#FFF4E1" stroke="#5B351F" strokeWidth="3"/>
  </svg>
 </AbsoluteFill>;
};
