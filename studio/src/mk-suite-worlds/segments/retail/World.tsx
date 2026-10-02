import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease,smooth} from '../../util';
import {EVENTS} from './timing';

const Box:React.FC<{x:number;y:number;s:number;fill?:string}>=({x,y,s,fill='#36B59A'})=><g transform={`translate(${x} ${y})`}><path d={`M 0 ${-s} L ${s} ${-s*.5} L 0 0 L ${-s} ${-s*.5} Z`} fill="#B1E6CF" stroke="#428F7A"/><path d={`M ${-s} ${-s*.5} L 0 0 V ${s} L ${-s} ${s*.5} Z`} fill={fill} stroke="#428F7A"/><path d={`M 0 0 L ${s} ${-s*.5} V ${s*.5} L 0 ${s} Z`} fill="#18856F" stroke="#428F7A"/></g>;
export const World:React.FC=()=>{
 const f=useSegFrame(),p=ease.expoOut(clamp((f+10)/30)),stock=smooth(0,EVENTS[0].f,f);
 return <AbsoluteFill style={{background:'#E7F7EF',overflow:'hidden'}}>
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute'}}>
   <circle cx="1465" cy="279" r="320" fill="#D2EDE0"/>
   <g transform={`translate(1508 290) rotate(${f*.32})`}><circle r="127" fill="none" stroke="#82BFA7" strokeWidth="1.5"/><circle r="84" fill="none" stroke="#A2D7C0" strokeWidth="44"/>{Array.from({length:12},(_,i)=><path key={i} d="M 0 -129 V -99" stroke="#368D73" strokeWidth="4" transform={`rotate(${i*30})`}/>)}<path d="M 0 -57 V 0 L 43 25" fill="none" stroke="#398B73" strokeWidth="7" strokeLinecap="round"/><circle r="8" fill="#398B73"/></g>
   <path d="M 590 687 L 1090 410 L 1775 774 L 1275 1016 Z" fill="#CEEBDC" stroke="#72B59B" strokeWidth="2"/>
   <path d="M 708 696 L 1050 508 L 1650 795 L 1298 965 Z" fill="none" stroke="#9DD5BA" strokeWidth="50"/>
   <path d="M 708 696 L 1050 508 L 1650 795 L 1298 965 Z" fill="none" stroke="#58AB8C" strokeWidth="2" strokeDasharray="8 14" strokeDashoffset={-f*3}/>
   <g opacity={p}>
    <path d="M 735 486 L 1080 312 L 1370 454 V 535 L 1024 711 L 735 567 Z" fill="#72B69B" stroke="#398E75" strokeWidth="2"/>
    <path d="M 735 486 L 1024 630 L 1370 454" fill="none" stroke="#287B65" strokeWidth="9"/>
    <path d="M 755 487 L 1097 314 L 1327 430 L 986 603 Z" fill="#F3FFF7" stroke="#7ABDA1" strokeWidth="2"/>
    <path d="M 772 678 L 1117 504 L 1407 646 V 727 L 1061 903 L 772 759 Z" fill="#72B69B" stroke="#398E75" strokeWidth="2"/>
    <path d="M 772 678 L 1061 822 L 1407 646" fill="none" stroke="#287B65" strokeWidth="9"/>
    <path d="M 792 679 L 1134 506 L 1364 622 L 1023 795 Z" fill="#F3FFF7" stroke="#7ABDA1" strokeWidth="2"/>
    {Array.from({length:7},(_,i)=>{const k=clamp(stock*8-i);return <g key={i} opacity={k} transform={`translate(0 ${(1-k)*-95})`}><Box x={900+i%4*104} y={460-i%4*52+Math.floor(i/4)*222} s={45} fill={i%2?'#73C3A4':'#36B59A'}/></g>})}
    {[0,1,2].map(i=>{const t=((f*1.4+i*145)%460+460)%460;return <Box key={i} x={1218+t*.9} y={810+t*.1} s={34} fill="#56BE9E"/>})}
   </g>
   <path d="M 100 662 H 546" stroke="#8FC3A8" strokeWidth="2"/>
  </svg>
  <div style={{position:'absolute',left:96,top:126,fontFamily:FONT,fontSize:103,fontWeight:700,letterSpacing:-5,color:'#145C4B',opacity:p}}>Retail Ops Hub</div>
  <div style={{position:'absolute',left:104,top:271,fontFamily:BODY,fontSize:27,fontWeight:500,color:'#276B56',border:'1px solid #76AF98',borderRadius:30,padding:'9px 20px',opacity:p}}>Preview</div>
  <div style={{position:'absolute',left:105,top:713,fontFamily:BODY,fontSize:35,lineHeight:1.9,color:'#276B56',opacity:ease.expoOut(clamp((f+2)/28))}}>
   <div>Orders + inventory</div><div>Bookings + replenishment</div><div>Reports + forecasts</div>
  </div>
 </AbsoluteFill>;
};
