import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BODY,FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {smooth,clamp,lerp} from '../../util';

export const World:React.FC=()=>{
 const f=useSegFrame(),source=smooth(60,92,f),change=smooth(120,172,f),volume=Math.round(12+change*12),manual=volume*25/60,draft=volume*15/60;
 const first=smooth(8,60,f),second=smooth(96,120,f),pointerX=f<96?lerp(460,645,first):lerp(645,1307,second)+change*287,pointerY=f<96?lerp(300,565,first)-Math.sin(first*Math.PI)*55:lerp(565,719,second);
 return <AbsoluteFill style={{background:'#251714'}}>
  <svg width="1920" height="1080" style={{fontFamily:BODY}}>
   <text x="92" y="132" fontFamily={FONT} fontSize="53" fontWeight="700" fill="#FFE8D5">MK Business OS</text><text x="655" y="129" fontSize="33" fill="#D3AB91">Turn research into a decision.</text><rect x="1668" y="87" width="153" height="56" rx="8" fill="#603D2C"/><text x="1700" y="126" fontSize="29" fill="#FFD3AE">DEMO</text>
   <rect x="88" y="191" width="783" height="804" rx="9" fill="#F6EBDD"/><path d="M115 223H839" stroke="#BDA287" strokeWidth="2"/>
   <text x="118" y="278" fontSize="28" fill="#9B7B5E">COMPANY DOSSIER</text><text x="118" y="335" fontFamily={FONT} fontSize="47" fontWeight="600" fill="#593E2D">Example Workshop</text><text x="118" y="384" fontSize="30" fill="#8F7055">Small production team · sample study</text>
   <path d="M118 419H836" stroke="#CEBBA4"/><text x="118" y="468" fontSize="32" fontWeight="600" fill="#72513B">Opportunity to review</text><text x="118" y="515" fontSize="31" fill="#563F30">Quotation preparation</text>
   <rect x="117" y="537" width="719" height="65" rx="8" fill={source>.1?'#D9B68F':'#E8D8C2'} stroke="#B79675"/><text x="143" y="580" fontSize="29" fill="#634733">Source: demo company brief</text><path d="M790 557h20v22h-20z M781 568h21v22h-21z" fill="none" stroke="#886B4F" strokeWidth="2"/>
   <rect x="117" y="617" width="719" height="65" rx="8" fill="#E8D8C2"/><text x="143" y="660" fontSize="29" fill="#634733">Source: demo workflow notes</text>
   <g opacity={source} transform={`translate(0 ${(1-source)*24})`}><path d="M147 699V733H792" fill="none" stroke="#B77749" strokeWidth="3"/><rect x="117" y="748" width="719" height="170" rx="9" fill="#E2CBB0" stroke="#B99A78"/><text x="142" y="793" fontSize="29" fontWeight="600" fill="#684C37">Source excerpt · fictional note</text><text x="142" y="842" fontSize="30" fill="#5C4331">“Each request needs an item list</text><text x="142" y="884" fontSize="30" fill="#5C4331">and a reviewed quotation.”</text></g>
   <text x="118" y="960" fontSize="28" fill="#967B60">Trace a claim back to its source.</text>
   <rect x="912" y="191" width="922" height="804" rx="18" fill="#3B271F" stroke="#A36A48" strokeWidth="2"/>
   <text x="945" y="249" fontSize="35" fontWeight="600" fill="#F8D6B8">Compare cost + time</text><text x="945" y="293" fontSize="28" fill="#C79976">SAMPLE ASSUMPTIONS · NOT MEASURED SAVINGS</text>
   <text x="946" y="357" fontSize="30" fill="#DDB899">25 vs 15 min per request · USD 12 / hour</text>
   <path d="M946 384H1803" stroke="#755038"/>
   <text x="946" y="431" fontSize="28" fill="#C69876">SCENARIO</text><text x="1412" y="431" fontSize="28" fill="#C69876">TIME / WEEK</text><text x="1660" y="431" fontSize="28" fill="#C69876">COST</text>
   <rect x="940" y="450" width="863" height="84" rx="8" fill="#4D3427"/><text x="962" y="503" fontSize="32" fill="#F1D4BD">Manual assumption</text><text x="1429" y="503" fontSize="36" fontWeight="600" fill="#F4DBC5">{manual.toFixed(1)} h</text><text x="1660" y="503" fontSize="36" fill="#F4DBC5">${Math.round(manual*12)}</text>
   <rect x="940" y="548" width="863" height="84" rx="8" fill="#6E4630" stroke="#D49B6D"/><text x="962" y="601" fontSize="32" fill="#FFE1C1">Draft assumption</text><text x="1429" y="601" fontSize="36" fontWeight="600" fill="#FFE1C1">{draft.toFixed(1)} h</text><text x="1660" y="601" fontSize="36" fill="#FFE1C1">${Math.round(draft*12)}</text>
   <text x="946" y="683" fontSize="31" fill="#DCB695">Weekly volume</text><text x="1600" y="683" fontSize="34" fill="#FFCCA0">{volume} requests</text>
   <path d="M973 719H1771" stroke="#795239" strokeWidth="9" strokeLinecap="round"/><path d={`M973 719H${1307+change*287}`} stroke="#EDAF77" strokeWidth="9" strokeLinecap="round"/><circle cx={1307+change*287} cy="719" r="18" fill="#FFE0B6"/>
   <text x="945" y="792" fontSize="29" fill="#CFA280">Change an input. Review the scenario.</text>
   <rect x="945" y="834" width="858" height="120" rx="10" fill="#291D18"/><text x="969" y="880" fontSize="32" fill="#F3C697">{change>.9?'Scenario updated for 24 requests.':'Research first. Model the assumptions.'}</text><text x="969" y="925" fontSize="28" fill="#AC8870">Validate needs, costs and time with the business.</text>
   {[60,120].map(hit=>f>=hit&&f<hit+22?<circle key={hit} cx={hit===60?645:1307} cy={hit===60?565:719} r={16+(f-hit)*2} fill="none" stroke="#FFD6A9" strokeWidth="3" opacity={1-(f-hit)/22}/>:null)}
   <path d="M0 0V47L13 35L24 60L36 54L24 31L42 29Z" transform={`translate(${pointerX} ${pointerY})`} fill="#FFF0DE" stroke="#6B4229" strokeWidth="3"/>
  </svg>
 </AbsoluteFill>;
};
