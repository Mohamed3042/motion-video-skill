import React from 'react';
import {ACCENT, C, FONT, MONO, Scene, Label, Chip, clamp, prog, eo, eio, mix, rgba, pulse, useWorldFrame} from '../kit';
import {T} from '../../mpw/worlds/picture/timing';
import {mulberry32} from '../../mpw/timing';

type Pal={skyTop:string;skyMid:string;horizon:string;sun:string;glow:string;far:string;mid:string;near:string;water:string;waterLo:string;hi:string};
// The original test-scene grades, applied to newly authored portrait geometry.
const REF:Pal={skyTop:'#170f2e',skyMid:'#5a3480',horizon:'#f2a35c',sun:'#fff1d2',glow:'#ffb468',far:'#4b2f6a',mid:'#2b1c44',near:'#120c1e',water:'#3a2550',waterLo:'#120c1e',hi:'#ffd08a'};
const SRC:Pal={skyTop:'#1c2b2c',skyMid:'#3d5f5b',horizon:'#9fbca5',sun:'#eef5e6',glow:'#b9d6c0',far:'#3a5450',mid:'#26393a',near:'#142021',water:'#2d4544',waterLo:'#142021',hi:'#d5e8da'};
const FILM:Pal={skyTop:'#120a26',skyMid:'#62308c',horizon:'#ff9a48',sun:'#fff4dc',glow:'#ffa95a',far:'#47265f',mid:'#22143a',near:'#0b0714',water:'#3c2152',waterLo:'#0b0714',hi:'#ffd28a'};
const mixHex=(a:string,b:string,t:number)=>{const aa=parseInt(a.slice(1),16),bb=parseInt(b.slice(1),16);return `#${[16,8,0].map(s=>Math.round(mix((aa>>s)&255,(bb>>s)&255,t)).toString(16).padStart(2,'0')).join('')}`;};
const mixPal=(a:Pal,b:Pal,t:number)=>Object.fromEntries((Object.keys(a) as (keyof Pal)[]).map(k=>[k,mixHex(a[k],b[k],t)])) as Pal;
// Keep the desktop's seeded 3–6 frame exposure schedule on the exact same cue.
const FLICK=(()=>{const r=mulberry32(8100),out:number[]=[];let v=0,hold=0;for(let i=0;i<80;i++){if(hold<=0){v=r();hold=3+Math.floor(r()*4);}out.push(v);hold--;}return out;})();
const flickerAt=(f:number)=>f<T.flicker||f>=T.restore?0:(1-eio(prog(f,T.even-14,T.even)))*FLICK[Math.min(FLICK.length-1,Math.floor(f-T.flicker))];

const V=ACCENT.picture, RGB=['#ff3b3b','#3bff6a','#3b7bff'];
const SAME='#787878', LIT='#c8c8c8', SHADE='#484848';
const P=(u:number,v:number):[number,number]=>[456+(u-v)*65,116+(u+v)*37];
const points=(p:[number,number][])=>p.map(([x,y])=>`${x},${y}`).join(' ');
const A=P(.5,1.5),B=P(3.5,3.5),CC=P(4.91,2.09),RX=83,RY=47;
const path=(p:[number,number][])=>p.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
const text={fontFamily:FONT,fontSize:44,fontWeight:600,color:C.text,lineHeight:1.2} as const;

const Action:React.FC<{f:number;at:number;label:string;done:string}> = ({f,at,label,done})=><div style={{display:'inline-flex',alignItems:'center',minHeight:84,padding:'18px 26px',fontSize:36,fontWeight:600,color:f>=at?V:C.text,background:f>=at?rgba(V,.13):C.panel,border:`2px solid ${f>=at?V:C.line}`,borderRadius:8,transform:`scale(${1-.04*pulse(f,at)})`}}>{f>=at?done:label}</div>;
const Meter:React.FC<{name:string;value:number;color:string}> = ({name,value,color})=><div style={{display:'flex',alignItems:'center',gap:22,marginTop:17,width:840}}><Label color={color} size={36} style={{width:230,flexShrink:0,whiteSpace:'nowrap'}}>{name}</Label><div style={{height:10,flex:1,minWidth:0,background:C.line,borderRadius:5}}><div style={{width:`${value*100}%`,height:10,background:color,borderRadius:5}}/></div><div style={{width:18,height:18,flexShrink:0,borderRadius:9,background:color}}/></div>;

// The board is rebuilt at phone coordinates. Both marked square centers are
// exactly #787878; only their illuminated/shadowed neighbours differ.
const Checker:React.FC<{f:number}> = ({f})=>{
 const bridge=eo(prog(f,T.bridge,T.proof))*(1-eo(prog(f,T.bridgeOff,T.bridgeOff+18))),proof=f>=T.proof&&f<T.bridgeOff;
 const shadow=points([[CC[0],CC[1]-RY],[CC[0],CC[1]+RY],[35,CC[1]+RY+.236*(CC[0]-35)],[35,CC[1]-RY-.15*(CC[0]-35)]]);
 const squares=(lit:boolean)=>Array.from({length:36},(_,k)=>{const i=Math.floor(k/6),j=k%6,light=(i+j)%2===0;return <polygon key={k} points={points([P(i,j),P(i+1,j),P(i+1,j+1),P(i,j+1)])} fill={lit?(light?LIT:SAME):(light?SAME:SHADE)}/>;});
 const luma=(u:number)=>{
  const x=mix(A[0],B[0],u),y=mix(A[1],B[1],u),dx=(x-456)/65,dy=(y-116)/37;
  const light=(Math.floor((dx+dy)/2)+Math.floor((dy-dx)/2))%2===0;
  const top=CC[1]-RY-.15*(CC[0]-x),bottom=CC[1]+RY+.236*(CC[0]-x);
  const shade=clamp(.5+Math.min(y-top,bottom-y)/22.5);
  const value=mix(light?200:120,light?120:72,shade);
  return bridge>0&&u<=bridge?120:value;
 };
 return <><svg width={912} height={570}>
  <defs>
   <filter id="ph-shadow-pen"><feGaussianBlur stdDeviation={9}/></filter>
   <mask id="ph-shadow"><rect width={912} height={570} fill="black"/><polygon points={shadow} fill="white" filter="url(#ph-shadow-pen)"/></mask>
   <linearGradient id="ph-cylinder"><stop offset="0" stopColor="#352043"/><stop offset=".5" stopColor="#8c61bb"/><stop offset=".83" stopColor="#e4cbff"/><stop offset="1" stopColor="#78539f"/></linearGradient>
  </defs>
  {squares(true)}<g mask="url(#ph-shadow)">{squares(false)}</g>
  <path d={`M${P(0,6)[0]} ${P(0,6)[1]} L${P(6,6)[0]} ${P(6,6)[1]} L${P(6,0)[0]} ${P(6,0)[1]} L${P(6,0)[0]} ${P(6,0)[1]+25} L${P(6,6)[0]} ${P(6,6)[1]+25} L${P(0,6)[0]} ${P(0,6)[1]+25} Z`} fill="#3c3b3e"/>
  <ellipse cx={CC[0]} cy={CC[1]+6} rx={RX*1.15} ry={RY*1.1} fill="#000" opacity={.25}/>
  <path d={`M${CC[0]-RX} ${CC[1]-182} L${CC[0]-RX} ${CC[1]} A${RX} ${RY} 0 0 0 ${CC[0]+RX} ${CC[1]} L${CC[0]+RX} ${CC[1]-182} Z`} fill="url(#ph-cylinder)"/>
  <ellipse cx={CC[0]} cy={CC[1]-182} rx={RX} ry={RY} fill="#cfb0ee"/>
  {bridge>0&&<line x1={A[0]} y1={A[1]} x2={mix(A[0],B[0],bridge)} y2={mix(A[1],B[1],bridge)} stroke={SAME} strokeWidth={42} strokeLinecap="round"/>}
  {[[A,'A',T.pickA],[B,'B',T.pickB]].map(([pos,l,at])=>{const p=pos as [number,number];return <g key={l as string}><circle cx={p[0]} cy={p[1]} r={32+15*pulse(f,at as number)} fill="none" stroke={f>=Number(at)?V:'transparent'} strokeWidth={4}/><text x={p[0]} y={p[1]+17} textAnchor="middle" fontFamily={FONT} fontWeight={750} fontSize={50} fill="#f4f4f4">{l as string}</text></g>;})}
 </svg>
 <div style={{position:'absolute',left:36,top:558,width:840}}>
  <div style={{display:'flex',gap:32,justifyContent:'space-between'}}>{[['A',T.pickA],['B',T.pickB]].map(([name,at])=><div key={name} style={{...text,fontSize:42,color:f>=Number(at)?C.text:C.muted}}>{name} {f>=Number(at)?'120 · 120 · 120':'—'}</div>)}</div>
  <svg width={840} height={125} style={{marginTop:16}}><line x1={16} y1={63} x2={824} y2={63} stroke={C.line} strokeWidth={2}/><path d={path(Array.from({length:81},(_,i)=>{const u=i/80;return [16+u*808,63+(120-luma(u))*.4] as [number,number];}))} fill="none" stroke={proof?V:C.muted} strokeWidth={4} strokeDasharray={`${808*eo(prog(f,T.bridge,T.proof))} 1000`}/><circle cx={80} cy={63} r={proof?10:0} fill={V}/><circle cx={740} cy={63} r={proof?10:0} fill={V}/></svg>
  <div style={{...text,color:proof?V:C.muted}}>{proof?'A = B. Same gray. Different context.':'Sample both. Check the scope.'}</div>
 </div></>;
};

// Native wide illustration inside the portrait composition, not a filmed UI.
const Landscape:React.FC<{p:Pal;f:number;uid:string;noise?:number;grain?:number;halation?:number;mosaic?:number;title?:boolean}> = ({p,f,uid,noise=0,grain=0,halation=0,mosaic=0,title=false})=>{
 const terrain=(base:number,amplitude:number,frequency:number)=>path(Array.from({length:47},(_,i)=>[i*20,base+amplitude*Math.sin(i*frequency)+amplitude*.3*Math.sin(i*1.7)] as [number,number]))+' L920 360 L0 360 Z';
 return <svg width={912} height={510} viewBox="0 0 912 510" style={{display:'block'}}>
  <defs>
   <linearGradient id={`ph-sky-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.skyTop}/><stop offset=".6" stopColor={p.skyMid}/><stop offset="1" stopColor={p.horizon}/></linearGradient>
   <linearGradient id={`ph-water-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={p.water}/><stop offset="1" stopColor={p.waterLo}/></linearGradient>
   <radialGradient id={`ph-halo-${uid}`}><stop offset=".4" stopColor="#ff7341" stopOpacity={0}/><stop offset=".52" stopColor="#ff7341" stopOpacity={halation*.65}/><stop offset="1" stopColor="#ff7341" stopOpacity={0}/></radialGradient>
   <filter id={`ph-grain-${uid}`}><feTurbulence type="fractalNoise" baseFrequency={.55} numOctaves={2} seed={Math.floor(f/2)%10000}/><feColorMatrix type="saturate" values="0"/></filter>
  </defs>
  <rect width={912} height={360} fill={`url(#ph-sky-${uid})`}/>
  <circle cx={665} cy={232} r={151} fill={`url(#ph-halo-${uid})`}/><circle cx={665} cy={232} r={55} fill={p.sun}/>
  <path d={terrain(302,29,.42)} fill={p.far}/><path d={terrain(340,16,.2)} fill={p.mid}/>
  <rect y={360} width={912} height={150} fill={`url(#ph-water-${uid})`}/>
  {Array.from({length:9},(_,i)=><rect key={i} x={665-(54-i*4)} y={374+i*14} width={(54-i*4)*2} height={4} rx={2} fill={p.hi} opacity={.72-i*.06}/>)}
  <path d="M0 510 L0 270 Q180 240 360 360 L460 510Z" fill={p.near}/><path d="M146 267 L155 90 L163 267Z" fill={p.near}/><circle cx={158} cy={88} r={7} fill={p.hi}/>
  {(noise>0||grain>0)&&<rect width={912} height={510} filter={`url(#ph-grain-${uid})`} opacity={noise*.75+grain*.16} style={{mixBlendMode:noise>0?'normal':'overlay'}}/>}
  {mosaic>0&&Array.from({length:144},(_,i)=>{const col=i%16,row=Math.floor(i/16),x=col*57,y=row*57,palette=row<4?p.skyMid:row<6?p.horizon:p.water;return <rect key={i} x={x} y={y} width={58} height={58} fill={palette} opacity={mosaic*(.75+.25*Math.sin(i*17)**2)}/>;})}
  {title&&<g transform={`translate(${36} ${365+28*(1-eo(prog(f,T.render,T.render+18)))})`} opacity={eo(prog(f,T.render,T.render+18))}><rect width={510} height={108} rx={7} fill={rgba(C.canvas,.86)}/><rect width={7} height={108} fill={V}/><text x={26} y={69} fontFamily={FONT} fontSize={56} fontWeight={700} fill={C.text}>Episode 2</text></g>}
 </svg>;
};

const ColorMatch:React.FC<{f:number}> = ({f})=>{
 const k=eio(prog(f,T.match,T.match+36));
 return <><div style={{position:'absolute',top:75,left:0,width:912,height:510,overflow:'hidden'}}>
  <Landscape p={REF} f={f} uid="reference"/>
  <div style={{position:'absolute',left:456,top:0,width:456,height:510,overflow:'hidden'}}><div style={{marginLeft:-456}}><Landscape p={mixPal(SRC,REF,k)} f={f} uid="source"/></div></div>
  <div style={{position:'absolute',top:0,bottom:0,left:454,width:4,background:C.text,opacity:1-k}}/>
  <div style={{position:'absolute',top:28,left:36}}><Chip accent={V} style={{fontSize:36}}>Reference</Chip></div><div style={{position:'absolute',top:28,right:36,opacity:1-k}}><Chip accent={V} style={{fontSize:36}}>Source</Chip></div>
 </div><div style={{position:'absolute',left:36,top:590,width:840}}>
  <Label size={36} color={V}>MANUAL PRIMARY CORRECTION</Label>
  <div style={{display:'flex',gap:20,marginTop:16}}>{RGB.map((col,i)=><div key={col} style={{flex:1}}><div style={{height:9,background:C.line}}><div style={{height:9,width:`${mix([.7,.85,.38][i],[.55,.58,.64][i],k)*100}%`,background:col}}/></div><Label size={36} color={col} style={{marginTop:8}}>{['RED','GREEN','BLUE'][i]}</Label></div>)}</div>
  <div style={{marginTop:18}}><Action f={f} at={T.match} label="Match reference" done="Reference matched"/></div>
 </div></>;
};

const Tracking:React.FC<{f:number}> = ({f})=>{
 const open=eio(prog(f,T.track,T.track+16)),planar=eo(prog(f,T.planar,T.planar+16)),span=mix(148,840,open),move=(f-488)*.65;
 const slots=[[180,155],[715,180],[215,423],[705,443]];
 return <><div style={{position:'absolute',left:456-span/2,top:84,width:span,height:480,overflow:'hidden',borderRadius:10,opacity:1-planar}}>
  <div style={{position:'absolute',left:-(456-span/2),top:0,width:912,height:480,background:`repeating-linear-gradient(45deg,#e8413c 0px,#e8413c 42px,#f1ede6 42px,#f1ede6 84px,#3a5fd9 84px,#3a5fd9 126px,#f1ede6 126px,#f1ede6 168px)`,backgroundPosition:`${-f*1.84}px ${-f*1.84}px`}}>
   <svg width={912} height={480}>{slots.map(([x,y],i)=><g key={i} transform={`translate(${x-move} ${y-move})`}><circle r={14} fill={C.canvas}/><path d="M-20 0H20 M0 -20V20" stroke={C.text} strokeWidth={5}/>{f>=T.locks[i]&&<><rect x={-39} y={-39} width={78} height={78} rx={5} fill="none" stroke={C.amber} strokeWidth={5}/><path d="M0 0 L-68 -68 M-68 -68 L-43 -65 M-68 -68 L-65 -43" fill="none" stroke={C.amber} strokeWidth={6}/></>}</g>)}</svg>
  </div>
 </div>
 {planar>0&&<div style={{position:'absolute',left:36,top:84,width:840,height:480,opacity:planar,background:'#19272a',overflow:'hidden',borderRadius:10}}>
  <div style={{position:'absolute',left:110,top:65,width:620,height:346,transform:`perspective(1100px) rotateY(${12*Math.sin((f-T.planar)*.025)}deg) rotateZ(${4*Math.sin((f-T.planar)*.03)}deg) translateX(${20*Math.sin(f*.025)}px)`,background:'linear-gradient(120deg,#2d4544,#4b2f6a)',border:`2px solid ${C.line}`}}>
   <div style={{position:'absolute',left:75,top:63,width:180,height:160,background:'#c79bf233',borderRadius:8}}/>
   {[[0,0],[620,0],[620,346],[0,346]].map(([x,y],i)=><div key={i} style={{position:'absolute',left:x-12,top:y-12,width:24,height:24,border:`5px solid ${C.amber}`,background:C.canvas,opacity:f>=T.pins?1:.2}}/>)}
   {f>=T.pinLT&&<div style={{position:'absolute',left:30,top:248,padding:'14px 24px',fontSize:48,fontWeight:700,background:C.canvas,borderInlineStart:`6px solid ${V}`,color:C.text,opacity:eo(prog(f,T.pinLT,T.pinLT+10))}}>Episode 2</div>}
  </div>
 </div>}
 <div style={{position:'absolute',left:36,top:605,width:840}}><Label size={36} color={V}>{f>=T.planar?'PLANAR SURFACE':'APERTURE → TRUE MOTION'}</Label><div style={{...text,marginTop:20}}>{f>=T.pinLT?'Lower third follows the surface.':f>=T.pins?'Four corners locked.':f>=T.track?'Diagonal motion, tracked.':'Through the slot: straight up?'}</div><div style={{marginTop:25}}><Action f={f} at={T.track} label="Track clip" done={f>=T.pinLT?'Pinned to the surface':'Tracker points locked'}/></div></div>
 </>;
};

const Stabilization:React.FC<{f:number}> = ({f})=>{
 const k=eio(prog(f,T.stabilize,T.lock)),dx=35*Math.sin(f*.14)*(1-k),dy=24*Math.sin(f*.19+.7)*(1-k),r=2*Math.sin(f*.13)*(1-k),measure=eo(prog(f,T.measure,T.stabilize));
 return <><svg width={912} height={510} style={{position:'absolute',top:75}}>
  <g transform={`translate(${456+dx} ${255+dy}) rotate(${r})`}><rect x={-390} y={-214} width={780} height={428} rx={12} fill="#191f22" stroke={f>=T.lock?V:C.line} strokeWidth={5}/>{Array.from({length:7},(_,i)=><line key={i} x1={-380} x2={380} y1={-180+i*60} y2={-180+i*60} stroke={rgba(V,.16)} strokeWidth={2}/>)}<path d="M-350 100 L-200 -70 L-90 50 L50 -115 L220 90 L350 -10" fill="none" stroke={rgba(V,.55)} strokeWidth={5}/></g>
  <circle cx={456} cy={255} r={25} fill={C.amber}/><circle cx={456} cy={255} r={41+20*pulse(f,T.lock)} fill="none" stroke={C.amber} strokeWidth={2}/>
  {measure>0&&<path d={path(Array.from({length:81},(_,i)=>[72+i*9.6,448+23*Math.sin(i*.45)*(1-k)] as [number,number]))} stroke={V} strokeWidth={4} fill="none" strokeDasharray={`${800*measure} 900`}/>}
 </svg><div style={{position:'absolute',left:36,top:590,width:840}}><Label size={36} color={V}>{f>=T.stabilize?'PASS 2 · STABILIZED COPY':'PASS 1 · MEASURE CAMERA PATH'}</Label><div style={{...text,marginTop:20}}>{f>=T.lock?'Camera steady. Source preserved.':'The dot stays still. The frame moves.'}</div><div style={{marginTop:25}}><Action f={f} at={T.stabilize} label="Stabilize shot" done="Stabilized copy"/></div></div></>;
};

const finishing=[{at:T.finish,name:'FILM FINISH',line:'Shape contrast, color and grain.'},{at:T.flicker,name:'FLICKER REDUCTION',line:'Smooth changing brightness.'},{at:T.restore,name:'IMAGE RESTORATION',line:'Reduce noise. Keep the detail.'},{at:T.scale,name:'SCALE & MOTION',line:'Scale with native processing.'},{at:T.title,name:'TITLE & LOWER THIRD',line:'Add a clean title or lower third.'}];
const Finish:React.FC<{f:number}> = ({f})=>{
 const b=finishing.reduce((v,x,i)=>f>=x.at?i:v,0),film=eio(prog(f,T.finish+12,T.finish+40)),clean=eio(prog(f,T.restore+16,T.restore+44)),crisp=eo(prog(f,T.crisp,T.crisp+10));
 const flick=flickerAt(f),exit=eio(prog(f,T.exit,T.slide)),grade=mixPal(REF,FILM,film);
 return <><div style={{position:'absolute',left:0,top:75,width:912,height:510,overflow:'hidden',borderRadius:8,transform:`translateY(${-130*exit}px) scale(${1-.22*exit})`}}>
  <Landscape p={grade} f={f} uid="finish" noise={b===2?1-clean:0} grain={b===0?film:0} halation={b===0?film:0} mosaic={b===3?1-crisp:0} title={b===4}/>
  {flick>0&&<div style={{position:'absolute',inset:0,background:flick>.5?'#fff':'#000',opacity:Math.abs(flick-.5)*.72}}/>}
  {exit>0&&<div style={{position:'absolute',insetInline:0,top:0,bottom:0,borderTop:'26px solid #070908',borderBottom:'26px solid #070908',backgroundImage:'repeating-linear-gradient(90deg,transparent 0px,transparent 34px,#101211 34px,#101211 46px)',backgroundSize:'100% 20px',backgroundRepeat:'repeat-x',opacity:exit}}/>}
 </div><div style={{position:'absolute',left:36,top:625,width:840,opacity:1-exit}}>
  {b===0&&<><Meter name="Grain" value={mix(.12,.52,film)} color={V}/><Meter name="Halation" value={mix(.1,.6,film)} color={C.amber}/></>}
  {b===1&&<><Label size={36} color={V}>LUMA OVER TIME</Label><svg width={840} height={80} style={{marginTop:12}}><path d={path(Array.from({length:Math.max(2,Math.min(60,f-T.flicker+1))},(_,i)=>[i/59*840,20+48*flickerAt(T.flicker+i)] as [number,number]))} fill="none" stroke={f>=T.even?V:C.amber} strokeWidth={4}/></svg><div style={{...text}}>{f>=T.even?'Exposure evened out.':'Changing exposure → stable.'}</div></>}
  {b===2&&<><div style={{display:'flex',gap:18}}><Chip accent={V} style={{fontSize:36}}>Spatial</Chip><Chip accent={V} style={{fontSize:36}}>Temporal</Chip></div><Meter name="Reduction" value={mix(.15,.65,clean)} color={V}/></>}
  {b===3&&<><Label size={36} color={V}>MONTAGE NATIVE · SOURCE FRAME RATE</Label><div style={{...text,marginTop:22}}>{f>=T.crisp?'Detail resolves. Motion continues.':'From coarse pixels to clean detail.'}</div></>}
  {b===4&&<><Label size={36} color={V}>TITLE TEXT · EPISODE 2</Label><div style={{marginTop:20}}><Action f={f} at={T.render} label="Render title" done="Lower third rendered"/></div></>}
 </div></>;
};

export const Picture:React.FC = ()=>{
 const f=useWorldFrame(),finish=finishing.reduce((v,x)=>f>=x.at?x:v,finishing[0]);
 const name=f<T.w0?'PICTURE LAB':f<T.w1?'COLOR BALANCE':f<T.w2?'REFERENCE COLOR MATCH':f<T.w3?'MOTION TRACKING':f<T.w4?'SHOT STABILIZATION':finish.name;
 const footer=f<T.w1?"Your eyes adapt. Scopes don't.":f<T.w2?'Balance a shot against a reference.':f<T.w3?'Follow a surface. Pin the result.':f<T.w4?'Steady the camera. Keep the source.':finish.line;
 return <Scene id="picture" title={'Picture Lab.'} subtitle={'Then the picture.'} footer={footer} note={'Authored processing illustration · original media kept.'}>
  <Label color={V} size={36} style={{position:'absolute',left:36,top:0}}>{name}</Label>
  {f<T.w0&&<><div style={{position:'absolute',left:36,top:285,width:840,height:120}}>{RGB.map((col,i)=><div key={col} style={{position:'absolute',left:0,right:0,top:i*36,height:18,background:col,transform:`translateX(${Math.sin(f*.06+i)*30*(1-eo(prog(f,12,72)))}px)`,boxShadow:`0 0 28px ${rgba(col,.35)}`}}/>)}</div><div style={{position:'absolute',left:36,top:505,width:840,...text,whiteSpace:'pre-line'}}>{'Sound becomes light.\nLight becomes a picture.'}</div></>}
  {f>=T.w0&&f<T.w1&&<Checker f={f}/>}
  {f>=T.w1&&f<T.w2&&<ColorMatch f={f}/>}
  {f>=T.w2&&f<T.w3&&<Tracking f={f}/>}
  {f>=T.w3&&f<T.w4&&<Stabilization f={f}/>}
  {f>=T.w4&&<Finish f={f}/>}
 </Scene>;
};
