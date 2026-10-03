import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C,FONT,MONO} from '../../brand';
import {useSectionFrame} from '../../frame';
import {Title,Btn,Pill,panelStyle,prog,ease,rgba,PortalPoint} from '../profile/kit';
import {GEO} from './geo';
const COUNTRIES=[{id:'EG' as const,name:'Egypt',city:'Cairo',lon:30.8,lat:26.8},{id:'KW' as const,name:'Kuwait',city:'Kuwait City',lon:47.5,lat:29.3},{id:'SA' as const,name:'Saudi Arabia',city:'Riyadh',lon:45.1,lat:23.9}];
const OUTLINES=COUNTRIES.map(c=>{
  const all=GEO[c.id].flat();const xs=all.filter((_,i)=>i%2===0),ys=all.filter((_,i)=>i%2===1);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const k=Math.min(145/(maxX-minX),118/(maxY-minY));
  return GEO[c.id].map(poly=>poly.reduce((s,n,i)=>i%2?s:s+(i?'L':'M')+(80+(n-(minX+maxX)/2)*k).toFixed(1)+' '+(66-(poly[i+1]-(minY+maxY)/2)*k).toFixed(1),'')+'Z').join('');
});
export const World: React.FC = () => {
  const f=useSectionFrame();const p=ease.inOut(prog(f,100,135));const exit=ease.inOut(prog(f,444,478));
  const cx=960-450*p,cy=560,r=300;
  const selected=f<240?0:f<360?1:2;
  return <AbsoluteFill style={{fontFamily:FONT,color:C.ink,background:C.deep}}>
    <AbsoluteFill style={{background:'radial-gradient(ellipse at 30% 50%,#183a7877,transparent 65%)'}}/>
    <svg width={1920} height={1080} style={{position:'absolute',opacity:1-exit}}>
      <defs><radialGradient id="planet"><stop stopColor="#224d99"/><stop offset="1" stopColor="#040b36"/></radialGradient></defs>
      <circle cx={cx} cy={cy} r={r} fill="url(#planet)" stroke={C.sky} strokeWidth={2}/>
      {Array.from({length:15},(_,i)=>{const a=(i/15)*Math.PI+f*.009;return <ellipse key={i} cx={cx} cy={cy} rx={Math.max(1,Math.abs(Math.cos(a))*r)} ry={r} fill="none" stroke={C.sky} strokeWidth={1.3} opacity={.26+.2*Math.abs(Math.sin(a))}/>})}
      {[-.8,-.6,-.4,-.2,0,.2,.4,.6,.8].map(u=><ellipse key={u} cx={cx} cy={cy+u*r} rx={r*Math.sqrt(1-u*u)} ry={35*(1-u*u)} fill="none" stroke={C.sky} opacity={.35}/>)}
      {Array.from({length:5},(_,i)=><ellipse key={i} cx={cx} cy={cy} rx={350+i*17} ry={115+i*5} fill="none" stroke={C.sky} opacity={.10} transform={`rotate(-25 ${cx} ${cy})`}/>)}
      <circle cx={cx+122} cy={cy-64} r={9} fill={C.coral}/>
      <circle cx={cx+122} cy={cy-64} r={18+((f%60)/60)*35} fill="none" stroke={C.coral} opacity={1-(f%60)/60}/>
    </svg>
    <Title f={f} idx={2} name="WORLD ATLAS" promise="Give your search coordinates." accent={C.sky}/>
    <div style={{position:'absolute',left:120,top:860,width:780,textAlign:'center',fontSize:27,color:C.muted,opacity:p*(1-exit)}}>Country → city → source</div>
    <div style={{...panelStyle(C.sky),left:930,top:185,width:875,height:690,padding:36,boxSizing:'border-box',opacity:p*(1-exit),transform:`translateX(${(1-p)*100}px)`}}>
      <div style={{fontFamily:MONO,fontSize:19,color:C.sky,letterSpacing:'.1em'}}>RESEARCH SCOPE · SAMPLE VIEW</div>
      <div style={{fontSize:44,fontWeight:700,marginTop:18}}>Where will you look next?</div>
      <div style={{display:'flex',gap:16,marginTop:32}}>
        {COUNTRIES.map((c,i)=><div key={c.id} style={{width:252,background:i===selected?rgba(C.sky,.13):C.deep,border:`1px solid ${i===selected?C.sky:C.line}`,borderRadius:12,padding:'18px 0',textAlign:'center'}}>
          <svg width={160} height={136} viewBox="0 0 160 136"><path d={OUTLINES[i]} fill={rgba(C.sky,.17)} stroke={C.sky} strokeWidth={1}/></svg>
          <div style={{fontSize:26,fontWeight:600,marginTop:13}}>{c.name}</div>
        </div>)}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:31}}><div><div style={{fontSize:35,fontWeight:700}}>{COUNTRIES[selected].city}</div><div style={{fontSize:25,color:C.muted,marginTop:9}}>Explore the research you have saved</div></div><Pill label={COUNTRIES[selected].id} color={C.sky} fs={25}/></div>
      <div style={{display:'flex',gap:14,marginTop:28}}><Btn label="Open country workspace" primary fs={25} h={58}/><Btn label="Sources" fs={25} h={58}/></div>
      <div style={{fontSize:22,color:C.muted,marginTop:27}}>Location filters describe a market, not your eligibility.</div>
    </div>
    <PortalPoint color={C.good} opacity={exit} size={1+exit*1.8}/>
  </AbsoluteFill>;
};