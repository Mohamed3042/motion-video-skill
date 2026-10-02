import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,BODY,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';
const T:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;fill?:string;bold?:boolean;mono?:boolean;anchor?:'start'|'middle'|'end'}>=({x,y,children,size=30,fill='#DEE9D5',bold=false,mono=false,anchor='start'})=><text x={x} y={y} fontFamily={mono?MONO:BODY} fontSize={size} fontWeight={bold?600:400} fill={fill} textAnchor={anchor}>{children}</text>;
const code=['export function run(attempt) {','  try {','    return request();','  } catch (error) {','    if (attempt < 3) {','      return run(attempt + 1);','    }','    throw error;','  }','}'];
export const World:React.FC=()=>{
 const f=useSegFrame(), asked=f>=EVENTS[0].f, reveal=ease.cubicOut(clamp((f-60)/28)), inspect=ease.cubicOut(clamp((f-120)/20)), travel=ease.cubicInOut(clamp((f-25)/35));
 const cx=f<102?535+travel*663:1198+ease.cubicInOut(clamp((f-102)/18))*324, cy=f<102?325-travel*50:275+ease.cubicInOut(clamp((f-102)/18))*479;
 return <AbsoluteFill style={{background:'#0C1710'}}><svg width="1920" height="1080">
 <text x="88" y="132" fontFamily={MONO} fontSize="58" fontWeight="600" fill="#B4F45E">ask-repos</text><T x={478} y={131} size={31} fill="#A5BDA1">Ask. Then inspect the evidence.</T><rect x="1686" y="88" width="140" height="53" rx="8" fill="#B4F45E"/><T x={1756} y={126} size={30} fill="#102013" bold anchor="middle">DEMO</T>
 <rect x="88" y="186" width="1739" height="798" rx="14" fill="#14241A" stroke="#38543D" strokeWidth="2"/>
 <rect x="88" y="186" width="324" height="798" rx="14" fill="#1B3020"/><path d="M412 187 V984 M1301 186 V984" stroke="#38543D" strokeWidth="2"/>
 <T x={116} y={244} size={33} bold>sample-repo</T><T x={116} y={291} size={28} fill="#99B78F">{f<24?'Indexing fixture...':'3 files indexed'}</T>
 <path d="M131 343 V561 M132 391 H157 M132 458 H157 M132 526 H157" stroke="#557A4A" strokeWidth="2"/>
 <T x={151} y={351} size={29} mono>src/</T>
 <rect x="151" y="367" width="241" height="52" rx="5" fill="#3E6033"/><T x={173} y={403} size={29} mono fill="#DDFE9B">retry.ts</T>
 <T x={173} y={469} size={28} mono>request.ts</T><T x={173} y={536} size={28} mono>index.ts</T>
 <T x={115} y={841} size={28} fill="#9BB491">CORPUS REVISION</T><T x={115} y={886} size={29} mono>abc1234</T><T x={115} y={934} size={28} fill="#8BA582">Synthetic fixture</T>
 <rect x="435" y="212" width="841" height="110" rx="9" fill="#243D29" stroke="#557A4A"/>
 <T x={459} y={279} size={33}>Where is retry handled?</T><rect x="1111" y="231" width="144" height="70" rx="8" fill="#B4F45E"/><T x={1183} y={278} size={34} bold fill="#13230F" anchor="middle">Ask</T>
 <T x={443} y={380} size={29} mono>src/retry.ts</T><T x={1269} y={380} size={28} fill="#7F9F77" anchor="end">Fixture source</T>
 <path d="M435 410 H1277" stroke="#38543D"/>
 <rect x="430" y="627" width="850" height="113" rx="4" fill="#B4F45E" opacity={reveal*(.10+inspect*.13)}/>
 {code.map((line,i)=><g key={i}><T x={451} y={459+i*52} size={28} mono fill="#6D8B65" anchor="end">{String(i+1).padStart(2,'0')}</T><T x={478} y={459+i*52} size={29} mono fill={asked&&(i===4||i===5)?'#D2FF8E':'#C5DAC0'}>{line}</T></g>)}
 <T x={1331} y={248} size={34} bold fill="#B4F45E">Source result</T>
 {!asked&&<g><T x={1331} y={330} size={29} fill="#89A781">Ask a question about</T><T x={1331} y={371} size={29} fill="#89A781">your indexed code.</T><path d="M1331 430 H1776 M1331 477 H1682 M1331 524 H1738" stroke="#28422B" strokeWidth="10" strokeLinecap="round"/></g>}
 <g opacity={reveal} transform={`translate(${(1-reveal)*35} 0)`}>
 <T x={1331} y={322} size={29} fill="#91AE87">EXTRACTIVE MATCH</T>
 <T x={1331} y={385} size={33} bold>Retry condition:</T><T x={1331} y={438} size={29} mono fill="#D2FF8E">attempt &lt; 3</T>
 <T x={1331} y={510} size={31}>The next attempt calls</T><T x={1331} y={556} size={29} mono>run(attempt + 1)</T>
 <path d="M1331 614 H1794" stroke="#41623B"/>
 <T x={1331} y={669} size={28} fill="#91AE87">FILE + LINE + COMMIT</T>
 <rect x="1327" y="707" width="468" height="89" rx="8" fill={inspect?'#B4F45E':'#2D482D'} stroke="#739654"/>
 <T x={1350} y={762} size={31} mono fill={inspect?'#152413':'#D2FF8E'}>retry.ts:5-6</T>
 <T x={1331} y={855} size={28} mono fill="#9BB491">fixture abc1234</T>
 <T x={1331} y={927} size={29} fill="#91AE87">{inspect?'Cited lines highlighted':'Open citation to inspect'}</T>
 </g>
 <g transform={`translate(${cx} ${cy})`}><circle r={17+clamp((f-(f<100?60:120))/16)*24} stroke="#B4F45E" strokeWidth="4" fill="none" opacity={f>=60&&f<77||f>=120&&f<137?1-clamp((f-(f<100?60:120))/16):0}/><path d="M0 0 V36 L10 27 L19 45 L28 40 L19 23 H34 Z" fill="#DFFFAC" stroke="#122414" strokeWidth="3"/></g>
 </svg></AbsoluteFill>;
};
