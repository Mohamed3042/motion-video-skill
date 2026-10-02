import React from 'react';
import {loadFont} from '@remotion/google-fonts/NotoSansArabic';
const ARABIC=loadFont('normal',{weights:['400','600'],subsets:['arabic']}).fontFamily;
import {AbsoluteFill} from 'remotion';
import {FONT,BODY,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {clamp,ease} from '../../util';
import {EVENTS} from './timing';

const T:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;fill?:string;bold?:boolean;anchor?:'start'|'end'|'middle';arabic?:boolean}>=({x,y,children,size=30,fill='#172D43',bold=false,anchor='start',arabic=false})=><text x={x} y={y} fontFamily={arabic?ARABIC:BODY} fontSize={size} fontWeight={bold?650:400} fill={fill} textAnchor={anchor}>{children}</text>;
export const World:React.FC=()=>{
 const f=useSegFrame(), bilingual=f>=96, add=ease.cubicOut(clamp((f-EVENTS[0].f)/20)), exportP=ease.cubicOut(clamp((f-EVENTS[1].f)/24));
 const move=ease.cubicInOut(clamp((f-24)/36)), second=ease.cubicInOut(clamp((f-70)/26)), third=ease.cubicInOut(clamp((f-102)/18)), cx=760-move*358+second*625+third*49,cy=686-move*162-second*279+third*652;
 const ripple=clamp((f-(f<88?60:f<112?96:120))/15), pulse=f>=60&&f<=75||f>=96&&f<=111||f>=120&&f<=135;
 return <AbsoluteFill style={{background:'#0D2139',overflow:'hidden'}}>
 <svg width="1920" height="1080" style={{fontFamily:BODY}}>
 <text x="88" y="132" fill="#FFF0D1" fontFamily={FONT} fontSize="54" fontWeight="600">Quotation Builder</text>
 <T x={670} y={131} size={32} fill="#D7B064">Make every quote clear.</T>
 <rect x="1686" y="88" width="140" height="53" rx="8" fill="#D7B064"/><T x={1756} y={126} size={30} bold anchor="middle">DEMO</T>
 <rect x="88" y="186" width="1740" height="798" rx="18" fill="#F1ECDC"/>
 <path d="M472 187 V984 M1158 187 V984" stroke="#D5CEBA" strokeWidth="2"/>
 <T x={117} y={238} bold size={34}>Catalogue</T><T x={117} y={278} size={28} fill="#6A6D67">Sample items · KWD</T>
 {[['Studio setup','1 × 80.00'],['Print pack','2 × 20.00']].map(([name,price],i)=><g key={name} transform={`translate(116 ${321+i*145})`}>
 <rect width="327" height="121" rx="10" fill={i===1?'#E4D5AE':'#FFFFFF'} stroke="#CCBF9B"/>
 <T x={20} y={44} bold size={32}>{name}</T><T x={20} y={86} size={28}>{price}</T>
 <rect x="266" y="38" width="40" height="40" rx="6" fill="#17324A"/><path d="M278 58 H294 M286 50 V66" stroke="#FFF4D5" strokeWidth="3"/>
 </g>)}
 <T x={117} y={809} size={28} fill="#6A6D67">Company history</T><path d="M119 841 H438" stroke="#B8AF95"/><T x={117} y={887} size={29}>DEMO-Q001 · Draft</T><T x={117} y={937} size={28} fill="#6A6D67">Local document versions</T>
 <T x={503} y={239} size={35} bold>Quote editor</T>
 <rect x="777" y="212" width="350" height="62" rx="8" fill="#DDD7C6"/>
 <rect x={bilingual?934:783} y="218" width={bilingual?187:146} height="50" rx="6" fill="#17324A"/>
 <T x={855} y={253} size={28} fill={bilingual?'#4F5A60':'#FFF1CE'} anchor="middle">English</T>
 <T x={1027} y={253} size={28} fill={bilingual?'#FFF1CE':'#4F5A60'} anchor="middle">AR + EN</T>
 <T x={503} y={323} size={28} fill="#777968">DEMO CLIENT · Quote Q001</T>
 <path d="M503 350 H1124 M503 416 H1124" stroke="#B8AF95"/>
 <T x={505} y={392} size={28} bold>Item</T><T x={873} y={392} size={28} bold>Qty</T><T x={1118} y={392} size={28} bold anchor="end">Amount</T>
 <T x={505} y={473} size={32}>Studio setup</T><T x={890} y={473} size={32}>1</T><T x={1118} y={473} size={32} anchor="end">80.00</T>
 <g opacity={add} transform={`translate(${(1-add)*-80} 0)`}><rect x="498" y="509" width="634" height="80" rx="7" fill="#DCD1AF"/><T x={505} y={560} size={32}>Print pack</T><T x={890} y={560} size={32}>2</T><T x={1118} y={560} size={32} anchor="end">40.00</T></g>
 <path d="M503 625 H1124" stroke="#B8AF95"/><T x={506} y={682} size={35} bold>Total KWD</T><T x={1118} y={682} size={44} bold anchor="end">{(80+(f>=60?2*20:0)).toFixed(2)}</T>
 <T x={506} y={750} size={28} fill="#777968">{bilingual?'Arabic + English layout selected':'Choose a quotation language'}</T>
 <rect x="810" y="852" width="320" height="77" rx="10" fill={exportP?'#375E4D':'#17324A'}/><T x={970} y={902} size={34} bold fill="#FFF1CE" anchor="middle">{exportP?'PDF ready':'Export A4 PDF'}</T>
 <g transform={`translate(${1182+exportP*8} ${211-exportP*5})`}>
 <rect width="622" height="737" rx="5" fill="#FFFDF5" stroke="#BDB297"/><rect x="0" y="0" width="622" height="8" fill="#D7B064"/>
 <T x={34} y={62} size={37} bold>QUOTATION</T>{bilingual&&<T x={587} y={64} size={36} anchor="end" arabic>عرض سعر</T>}
 <T x={35} y={112} size={28} fill="#74796E">DEMO · Q001 · A4</T><path d="M34 140 H588" stroke="#A39981"/>
 <T x={35} y={190} size={29}>Studio setup</T><T x={587} y={190} size={29} anchor="end">80.00</T>
 <g opacity={add}><T x={35} y={246} size={29}>Print pack</T><T x={587} y={246} size={29} anchor="end">40.00</T></g>
 {bilingual&&<g><T x={586} y={298} size={28} anchor="end" arabic>إعداد الاستوديو · حزمة طباعة</T><path d="M34 326 H588" stroke="#D7B064"/></g>}
 <T x={35} y={397} size={32} bold>Total</T>{bilingual&&<T x={587} y={397} size={32} bold anchor="end" arabic>الإجمالي</T>}<T x={587} y={455} size={45} bold anchor="end">{(80+(f>=60?2*20:0)).toFixed(2)} KWD</T>
 <path d="M34 525 H588" stroke="#CDC2A6"/><T x={35} y={578} size={28} fill="#74796E">Sample quotation · no company artwork</T>
 <g opacity={exportP}><rect x="27" y="621" width="568" height="80" rx="7" fill="#E3EDDC"/><T x={48} y={672} size={31} bold fill="#375E4D">quotation-demo.pdf</T><path d="M534 651 L546 663 L568 638" stroke="#375E4D" strokeWidth="4" fill="none"/></g>
 </g>
 <g transform={`translate(${cx} ${cy})`}><circle r={15+ripple*23} fill="none" stroke="#D39D39" strokeWidth="4" opacity={pulse?1-ripple:0}/><path d="M0 0 V36 L10 27 L19 45 L28 40 L19 23 H34 Z" fill="#FFFFFF" stroke="#172D43" strokeWidth="3"/></g>
 </svg></AbsoluteFill>;
};
