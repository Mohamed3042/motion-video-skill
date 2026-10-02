import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT,MONO} from '../../brand';
import {useSegFrame} from '../../frame';
import {cursorOut} from '../../shell/cursor';
import {clamp,ease,lerp} from '../../util';
export const World:React.FC=()=>{const f=useSegFrame(),reviewed=ease.cubicOut(clamp((f-60)/22)),workspace=ease.cubicOut(clamp((f-98)/25)),pointer=ease.cubicInOut(clamp((f-30)/30)),rip=clamp((f-60)/20),flow=ease.cubicInOut(clamp((f-81)/32));
return <AbsoluteFill style={{background:'#F2EDD9',fontFamily:FONT}}><svg width="1920" height="1080">
 <text x="84" y="136" fontSize="56" fill="#304E8A" fontWeight="700">MK Educate</text><text x="517" y="133" fontSize="34" fill="#6A7BA1">Teach from your sources.</text><rect x="1702" y="91" width="132" height="52" rx="26" fill="#DDDDBF"/><text x="1768" y="128" textAnchor="middle" fontSize="28" fill="#657242">DEMO</text>
 <rect x="82" y="189" width="1756" height="755" rx="24" fill="#FBF8EE" stroke="#BBBCA7" strokeWidth="2"/><path d="M469 189V944 M1123 189V944" stroke="#D5D4C0" strokeWidth="2"/>
 <text x="111" y="247" fontSize="29" fill="#748295">CURRICULUM CONTEXT</text><rect x="107" y="284" width="333" height="69" rx="12" fill="#E1E7EE"/><text x="128" y="329" fontSize="29" fill="#4D658C">Demo curriculum</text><path d="M411 309L418 316L425 309" fill="none" stroke="#617594" strokeWidth="2"/>
 <path d="M132 408V606M132 480H163M132 557H163" fill="none" stroke="#B0B8BD" strokeWidth="3"/><text x="157" y="420" fontSize="34" fill="#5A6B82">School workspace</text><text x="177" y="494" fontSize="34" fill="#5A6B82">Science</text><rect x="161" y="532" width="260" height="63" rx="10" fill="#5876AE"/><text x="185" y="574" fontSize="34" fill="#FFFFFF">Plants</text>
 <text x="111" y="695" fontSize="28" fill="#8791A2">INTERFACE</text><rect x="108" y="724" width="329" height="65" rx="12" fill="#E7E7D9"/><rect x="272" y="729" width="158" height="55" rx="10" fill="#FFFFFF"/><text x="186" y="766" textAnchor="middle" fontSize="29" fill="#8391A5">Arabic</text><text x="351" y="766" textAnchor="middle" fontSize="29" fill="#496491">English</text>
 <text x="506" y="245" fontSize="30" fill="#617397">REVIEWED SOURCE PAGE</text><rect x="503" y="280" width="584" height="528" rx="9" fill="#FFFDF5" stroke="#CFCBBC" strokeWidth="2"/>
 <text x="538" y="329" fontFamily={MONO} fontSize="27" fill="#919B9E">demo-source.pdf / page 1</text><text x="538" y="397" fontSize="39" fontWeight="700" fill="#395586">How plants grow</text>
 <rect x="526" y="433" width={536*reviewed} height="110" rx="7" fill="#F4DE99"/>
 <text x="538" y="470" fontSize="32" fill="#5C6C82">Plants need light and water</text><text x="538" y="516" fontSize="32" fill="#5C6C82">to grow.</text>
 <text x="538" y="594" fontSize="30" fill="#8A9398">Observe a plant each day.</text><text x="538" y="639" fontSize="30" fill="#8A9398">Discuss changes over time.</text><path d="M538 687H1006M538 709H970M538 731H1018" stroke="#DFDDCD" strokeWidth="5"/>
 <rect x="505" y="835" width="581" height="69" rx="13" fill={reviewed>.8?'#DDE8C8':'#5674B1'}/><text x="795" y="880" textAnchor="middle" fontSize="34" fontWeight="700" fill={reviewed>.8?'#58703D':'#FFFFFF'}>{reviewed>.8?'Source reviewed':'Mark reviewed'}</text>
 <text x="1157" y="245" fontSize="30" fill="#617397">TEACHING WORKSPACE</text><text x="1157" y="310" fontSize="32" fill="#385689">Plants / source preparation</text><path d="M1156 335H1798" stroke="#D6D8CB" strokeWidth="2"/>
 <g opacity={workspace} transform={`translate(${(1-workspace)*40} 0)`}>
  <rect x="1154" y="363" width="648" height="191" rx="13" fill="#E6EBD8"/><text x="1180" y="410" fontSize="29" fill="#6B8250">REVIEWED EXCERPT</text><text x="1180" y="460" fontSize="32" fill="#4D6378">Plants need light and water</text><text x="1180" y="506" fontSize="32" fill="#4D6378">to grow.</text>
  <text x="1158" y="614" fontSize="34" fill="#436294">Teaching template</text><rect x="1155" y="646" width="647" height="191" rx="12" fill="#F1EFE2" stroke="#DDDCCB"/><text x="1181" y="691" fontSize="28" fill="#80909E">DISCUSSION PROMPT</text><text x="1181" y="742" fontSize="33" fill="#4A6288">What does a plant need?</text><text x="1181" y="795" fontSize="28" fill="#839093">Add your teaching notes here.</text>
  <rect x="1155" y="862" width="647" height="43" rx="9" fill="#E3EAF0"/><text x="1478" y="892" textAnchor="middle" fontFamily={MONO} fontSize="26" fill="#6580A0">demo-source.pdf : page 1</text>
 </g>
 {workspace<.1&&<g><rect x="1155" y="366" width="648" height="413" rx="15" fill="#F4F2E6" stroke="#D5D8CE" strokeDasharray="7 9"/><text x="1479" y="555" textAnchor="middle" fontSize="33" fill="#9AABA8">Review a source to begin.</text><text x="1479" y="604" textAnchor="middle" fontSize="29" fill="#A4B0AB">Your evidence stays attached.</text></g>}
 {f>81&&f<113&&<g transform={`translate(${lerp(829,1351,flow)} ${lerp(473,430,flow)})`} opacity={Math.sin(flow*Math.PI)}><rect x="-187" y="-39" width="374" height="77" rx="13" fill="#F4DE99" stroke="#B9A265"/><text textAnchor="middle" y="11" fontSize="29" fill="#556E58">Reviewed excerpt</text></g>}
 <text x="85" y="990" fontSize="33" fill="#6E7D95">Choose the curriculum. Review the page. Build the workspace.</text>
 <g transform={`translate(${lerp(768,797,pointer)} ${lerp(489,875,pointer)})`}><circle r={9+rip*38} fill="none" stroke="#426493" strokeWidth="3" opacity={f>=60&&f<80?1-rip:0}/><path style={cursorOut(f,74)} d="M0 0V39L11 29L23 49L34 42L22 23H39Z" fill="#37568B" stroke="#FFFFFF" strokeWidth="3"/></g>
 </svg></AbsoluteFill>};
