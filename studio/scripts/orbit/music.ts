// Deterministic 120 s Orbit score. Adapted from scripts/mkv/music.ts.
// Completed arrangements are authored centrally below. Section modules remain optional
// compatibility hooks: a non-silent supplied stem is used, otherwise this authored score
// provides the section. Silence is never accepted as a completed section.
// Usage: node scripts/orbit/music.ts
import path from 'node:path';
import {mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {DURATION, FPS, SECTIONS, WORLDS, DROP, type Section, type SectionEvent} from '../../src/orbit/timing.ts';
import {BOUNDARIES, FW_EVENTS} from '../../src/orbit/shell/timing.ts';
import * as F from '../../src/orbit/finale/timing.ts';
import type {SynthCtx} from './types.ts';
import * as D from './dsp.ts';

const SR = D.SR, N = Math.round(DURATION / FPS * SR), at = (f: number) => f / FPS * SR;
const OUT = path.resolve(import.meta.dirname, '../../public/orbit/music.wav');
const REPORT = path.resolve(import.meta.dirname, '../../../out/audio/orbit');
mkdirSync(path.dirname(OUT), {recursive: true});
mkdirSync(REPORT, {recursive: true});
const eventMap = new Map<number, {kind: 'impact' | 'hit'; labels: string[]}>();
function addEvent(f: number, kind: 'impact' | 'hit', label: string) {
  assert.ok(f >= 0 && f < DURATION && Number.isInteger(f), 'Invalid sound-event frame: ' + f);
  const prior = eventMap.get(f);
  eventMap.set(f, {kind: prior?.kind === 'impact' ? 'impact' : kind, labels: [...(prior?.labels ?? []), label]});
}
for (const e of FW_EVENTS) addEvent(e.f, e.kind, e.what);
const sectionEvents = new Map<string, SectionEvent[]>();
for (const s of SECTIONS) {
  const t = await import('../../src/orbit/sections/' + s.id + '/timing.ts');
  sectionEvents.set(s.id, t.EVENTS);
  for (const e of t.EVENTS as SectionEvent[]) if (e.kind === 'hit' || e.kind === 'impact') addEvent(s.start + e.f, e.kind, s.id + ' ' + e.kind + ' @' + e.f);
}
const events = [...eventMap.entries()].sort((a, b) => a[0] - b[0]);
const timingSha256=createHash('sha256').update(JSON.stringify({duration:DURATION,fps:FPS,
  framework:FW_EVENTS.map(e=>[e.f,e.kind]),
  sections:SECTIONS.map(s=>({id:s.id,start:s.start,end:s.end,events:(sectionEvents.get(s.id)??[]).map(e=>[e.f,e.kind])})),
  finale:{montage:F.MONTAGE,converge:F.CONVERGE,lock:F.LOGO_LOCK,lines:F.LINES,glint:F.GLINT2,fade:F.FADE}
})).digest('hex');
const chords = [[52,55,59,62,66], [48,55,59,62,64], [43,55,59,62,66], [50,57,60,64,66]];
const roots = [40,36,43,38];
const motif = [76,79,83,86,83,79,78,74];

// Completed central orchestrations: twelve distinct sections on the shared120BPM grid.
function centralArrangement(o: D.Out, s: Section) {
  const pos = (f: number) => at(s.start + f), len = s.end - s.start;
  if (s.id === 'chaos') {
    const bp = new D.BQ().set(2, 1300, 1);
    D.put(o, pos(0), len/FPS, 0, 0.3, (t,r) => {
      const u = t / (len/FPS);
      return bp.run(r()*2-1) * 0.055 * u*u * Math.min(1, (len/FPS-t)*15);
    });
    for (let f=60; f<570; f+=f<300?30:15) {
      D.hat(o,pos(f),0.13,false,f%60?-.5:.5);
      D.bell(o,pos(f+6),[83,84,90,78][Math.floor(f/15)%4],.032,.34,(f%120)/75-.7,3.17,2.1,.2);
    }
    D.riser(o,pos(440),pos(len-4),.14,200,6200);
    D.sub(o,pos(570),28,2.2,.17);
    return;
  }
  if (s.id === 'turn') {
    D.shepard(o,pos(0),pos(112),.1,{center:400,rate0:.4,rate1:.9,env:u=>.8-.5*u});
    D.pad(o,pos(120),[43,55,59,62,66],6.7,.42,{lp0:700,lp1:3100,att:.06,rel:.4,send:.4});
    for(let f=120; f<530; f+=30) {
      D.kick(o,pos(f),.34); D.hat(o,pos(f+15),.035);
      D.bell(o,pos(f),motif[Math.floor((f-120)/30)%8],.085,.8,Math.sin(f)*.35,2,.5,.3);
    }
    D.riser(o,pos(510),pos(len-4),.22,300,9000);
    return;
  }
  for (let bar=0; bar<4; bar++) {
    const f=bar*120, c=chords[bar], root=roots[bar];
    switch(s.id) {
      case 'profile':
        D.rhodesChord(o,pos(f),c,1.65,.31,.35);
        for(let k=0;k<16;k++) D.hat(o,pos(f+k*7.5),k%4===0?.085:.03,false,(k%2?1:-1)*.25);
        for(let k=0;k<4;k++) D.bassPulse(o,pos(f+k*30),root,.18,.22);
        break;
      case 'globe':
        D.pad(o,pos(f),c,1.8,.54,{lp0:750,lp1:2400,att:.18,rel:.55,send:.6});
        D.sub(o,pos(f),root,1.7,.2);
        for(let k=0;k<8;k++) D.bell(o,pos(f+k*15),c[k%5]+24,.072,1.1,Math.sin(k)*.6,2,.6,.65);
        break;
      case 'findings':
        D.rhodesChord(o,pos(f),c,1.7,.23);
        for(let k=0;k<8;k++) D.bell(o,pos(f+k*15),motif[k],.16,.4,(k%2?1:-1)*.4,1,.35,.2);
        for(let k=0;k<4;k++){D.kick(o,pos(f+k*30),.31);D.hat(o,pos(f+k*30+15),.075);}
        break;
      case 'focus':
        D.rhodesChord(o,pos(f),c.slice(0,4),1.8,.43,.48);
        D.sub(o,pos(f),root,1.6,.22);
        D.kick(o,pos(f),.28); D.kick(o,pos(f+18),.15);
        D.rhodes(o,pos(f+60),motif[bar*2],.65,.22,-.2,.5);
        break;
      case 'fit':
        D.rhodesChord(o,pos(f+15),c, .3,.31,.24);
        for(let k=0;k<8;k++){D.bassPulse(o,pos(f+k*15),root+(k%3===1?12:0),.17,.38);D.hat(o,pos(f+k*15),.065);}
        D.kick(o,pos(f),.48);D.kick(o,pos(f+60),.4);D.clap(o,pos(f+30),.25);D.clap(o,pos(f+90),.25);
        break;
      case 'nextproof':
        D.pad(o,pos(f),c,1.85,.34,{lp0:900,lp1:1800+bar*600,att:.08,rel:.25});
        for(let k=0;k<8;k++)D.pluck(o,pos(f+k*15),[64,67,71,74,76,79,83,86][k],.44,Math.sin(k)*.35,.35,.6);
        for(let k=0;k<4;k++)D.kick(o,pos(f+k*30),.27+bar*.04);
        break;
      case 'market':
        D.rhodesChord(o,pos(f+15),c,.22,.36,.3);
        for(let k=0;k<4;k++){D.kick(o,pos(f+k*30),.52);D.hat(o,pos(f+k*30+15),.11,true);D.bassPulse(o,pos(f+k*30+15),root,.25,.33);}
        D.clap(o,pos(f+30),.22);D.clap(o,pos(f+90),.22);
        break;
      case 'employers':
        D.rhodesChord(o,pos(f),c.map(n=>n+12),1.6,.39,.44);
        D.bassPulse(o,pos(f),root,.45,.3);D.bassPulse(o,pos(f+75),root+7,.32,.25);
        for(let k=0;k<8;k++)D.hat(o,pos(f+k*15+(k%2?2:0)),.065,false,(k%2?1:-1)*.3);
        D.kick(o,pos(f),.34);D.clap(o,pos(f+30),.1);D.clap(o,pos(f+90),.12);
        break;
      case 'engine':
        for(let k=0;k<16;k++) D.square(o,pos(f+k*7.5),c[k%5]+12,.07,.055,.25,(k%2?1:-1)*.35,.15);
        for(let k=0;k<4;k++){D.kick(o,pos(f+k*30),.51);D.bassPulse(o,pos(f+k*30+15),root,.2,.33);D.hat(o,pos(f+k*30+15),.11,true);}
        break;
      case 'anywhere':
        D.rhodesChord(o,pos(f),c,1.7,.34,.5);
        D.kick(o,pos(f),.34);D.clap(o,pos(f+30),.11);D.clap(o,pos(f+90),.12);
        for(let k=0;k<8;k++)D.hat(o,pos(f+k*15+(k%2?2:0)),.035);
        for(let k=0;k<4;k++)D.pluck(o,pos(f+k*30+15),[64,65,68,71,72,75,76,68][(bar*2+k)%8],.44,(k%2?1:-1)*.32,.45,.48);
        break;
    }
  }
}
function ornaments(o:D.Out,s:Section) {
  (sectionEvents.get(s.id) ?? []).forEach((e,k) => {
    const p=at(s.start+e.f);
    if(e.kind==='tick') D.hat(o,p,s.id==='profile'?.07:.055,false,(k%2?1:-1)*.25);
    if(e.kind==='blip')D.bell(o,p,motif[k%8],.095,.45,(k%2?1:-1)*.4,2,.45,.2);
    if(e.kind==='whoosh')D.whoosh(o,p,.08,.16,.12);
  });
}
function finale(o:D.Out) {
  for(let k=0;k<F.MONTAGE_BEATS.length;k++){
    const f=F.MONTAGE_BEATS[k], bar=Math.min(3,Math.floor(k/4));
    D.kick(o,at(f),.52);
    if(k%2)D.clap(o,at(f),.25);
    D.hat(o,at(f+15),.1,true);
    D.bassPulse(o,at(f+15),roots[bar],.2,.32);
    D.bell(o,at(f),motif[k%8]+(k>7?12:0),.14,.85,-.55+k*.11,2,.6,.5);
    if(k%4===0)D.rhodesChord(o,at(f),chords[bar],1.8,.42,.45);
  }
  D.riser(o,at(F.CONVERGE-30),at(F.LOGO_LOCK-4),.24,250,10000);
  const hold=(F.FADE-F.LOGO_LOCK)/FPS;
  D.pad(o,at(F.LOGO_LOCK),[43,55,59,62,66],hold,.5,{lp0:2800,lp1:750,att:.04,rel:2,send:.6});
  D.sub(o,at(F.LOGO_LOCK),31,hold,.15);
  D.rhodesChord(o,at(F.LOGO_LOCK),[55,59,62,66,69],3.8,.34,.5);
  F.LINES.forEach((f,k)=>D.bell(o,at(f),[79,83,86,90][k],.08,2.4,-.3+k*.2,2,.5,.7));
  D.bell(o,at(F.GLINT2),90,.065,2.2,.3,2,.7,.6);
}
type Stem={name:string;a:number;b:number;w0:number;L:Float32Array;R:Float32Array;gain:number;central:boolean;eventCount:number};
const scratch=D.makeOut(N), stems:Stem[]=[];
async function stem(name:string,f0:number,f1:number,render:(o:D.Out)=>Promise<boolean>|boolean,eventCount=0) {
  for(const x of [scratch.L,scratch.R,scratch.sendL,scratch.sendR])x.fill(0);
  const central=await render(scratch);
  const a=Math.round(at(f0)),b=Math.round(at(f1)),w0=Math.max(0,a-Math.round(.5*SR)),w1=Math.min(N,b+Math.round(3*SR));
  for(const x of [scratch.L,scratch.R,scratch.sendL,scratch.sendR])for(let i=0;i<N;i++)assert.ok(Number.isFinite(x[i]),name+' non-finite audio');
  const wet=D.freeverb(scratch.sendL.subarray(w0,w1),scratch.sendR.subarray(w0,w1),.8,.36);
  const L=new Float32Array(w1-w0),R=new Float32Array(w1-w0);
  let energy=0;
  for(let k=0;k<L.length;k++){L[k]=scratch.L[w0+k]+1.65*wet[0][k];R[k]=scratch.R[w0+k]+1.65*wet[1][k];energy+=L[k]**2+R[k]**2;}
  assert.ok(energy>1e-6,name+' is silent');
  stems.push({name,a,b,w0,L,R,gain:1,central,eventCount});
}
for(const s of SECTIONS)await stem(s.id,s.start,s.end,async o=>{
  const mod=await import('./sections/'+s.id+'.ts');
  const ctx:SynthCtx={SR,...o,length:s.end-s.start,at:f=>at(s.start+f)};
  await mod.default(ctx);
  let energy=0;for(let n=0;n<N;n++)energy+=o.L[n]**2+o.R[n]**2+o.sendL[n]**2+o.sendR[n]**2;
  const central=energy<1e-9;
  if(central)centralArrangement(o,s);
  ornaments(o,s);
  console.log(s.id+': '+(central?'authored central score':'section module'));
  return central;
},sectionEvents.get(s.id)?.length ?? 0);
await stem('finale',F.MONTAGE,DURATION,o=>{finale(o);return true;});

// Impact layer is separate from musical beds; short pre-hit ducking gives each
// authored animation event a clear musical accent without shifting PCM samples.
const fx=D.makeOut(N),duck=new Float32Array(N).fill(1);
for(const b of BOUNDARIES)D.whoosh(fx,at(b),.11,.32,.18);
for(const [f,e] of events) {
  const p=Math.round(at(f));
  D.thump(fx,p,e.kind==='impact'?.42:.3);
  if(f===DROP || f===F.LOGO_LOCK)D.boom(fx,p,.52,2.5);
  for(let i=Math.max(0,p-Math.round(.085*SR));i<Math.min(N,p+Math.round(.08*SR));i++){
    const t=(i-p)/SR;
    const g=t<-.06?1-(t+.085)/.025*.965:t<.015?.035:.035+(t-.015)/.065*.965;
    duck[i]=Math.min(duck[i],Math.max(.035,Math.min(1,g)));
  }
}
const fxwet=D.freeverb(fx.sendL,fx.sendR,.75,.4);
function mix() {
  const L=new Float64Array(N),R=new Float64Array(N);
  for(const s of stems)for(let k=0;k<s.L.length;k++){L[s.w0+k]+=s.L[k]*s.gain;R[s.w0+k]+=s.R[k]*s.gain;}
  for(let i=0;i<N;i++){L[i]=L[i]*duck[i]+fx.L[i]+fxwet[0][i];R[i]=R[i]*duck[i]+fx.R[i]+fxwet[1][i];}
  return [L,R] as const;
}
function levels(L:ArrayLike<number>,R:ArrayLike<number>){
  const p=D.kPrefix(L),q=D.kPrefix(R);
  return {all:D.lufsRange(p,q,0,N),sections:stems.map(s=>D.lufsRange(p,q,s.a,s.b))};
}
function adjust(s:Stem,measured:number,target:number) {
  assert.ok(Number.isFinite(measured),s.name+' has no measurable loudness');
  s.gain=Math.min(10**(15/20),Math.max(10**(-15/20),s.gain*10**((target-measured)/20)));
}
for(let iteration=0;iteration<5;iteration++){
  const [L,R]=mix(),ls=levels(L,R);
  stems.forEach((s,i)=>adjust(s,ls.sections[i],s.name==='chaos'?-18:s.name==='turn'?-16:-16));
}
function master(){
  const [L,R]=mix(),hp=[new D.BQ().set(1,24,.7),new D.BQ().set(1,24,.7)];
  for(let i=0;i<N;i++){
    const tail=Math.min(1,(N-1-i)/(N-at(F.FADE)));
    L[i]=hp[0].run(L[i])*tail;R[i]=hp[1].run(R[i])*tail;
  }
  const env=D.peakEnv(L),er=D.peakEnv(R);for(let i=0;i<N;i++)env[i]=Math.max(env[i],er[i]);
  let gain=10**((-14-levels(L,R).all)/20),out=D.limit(L,R,env,gain,-1.9),loud=levels(...out).all;
  for(let n=0;n<8&&Math.abs(loud+14)>.035;n++){gain*=10**((-14-loud)/20);out=D.limit(L,R,env,gain,-1.9);loud=levels(...out).all;}
  return {L:out[0],R:out[1],loud,gain};
}
let m=master(),ls=levels(m.L,m.R);
const worldValues=()=>stems.map((s,i)=>({s,l:ls.sections[i]})).filter(x=>WORLDS.some(w=>w.id===x.s.name));
const spread=()=>{const a=worldValues().map(x=>x.l);return Math.max(...a)-Math.min(...a);};
if(spread()>.65){
  const values=worldValues().map(x=>x.l).sort((a,b)=>a-b),target=values[Math.floor(values.length/2)];
  for(const x of worldValues())adjust(x.s,x.l,target);
  m=master();ls=levels(m.L,m.R);
}
D.writeWav(OUT,m.L,m.R);
const ff=spawnSync('ffmpeg',['-nostats','-hide_banner','-i',OUT,'-af','ebur128=peak=true','-f','null','-'],{encoding:'utf8',maxBuffer:16*1024*1024});
assert.equal(ff.status,0,ff.stderr);
writeFileSync(path.join(REPORT,'master-ebur128.txt'),ff.stderr);
const summary=ff.stderr.slice(ff.stderr.lastIndexOf('Summary:'));
const integrated=Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
const truePeak=Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
const probe=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',OUT],{encoding:'utf8'});
assert.equal(probe.status,0,probe.stderr);
const meta=JSON.parse(probe.stdout),audio=meta.streams.find((s:{codec_type:string})=>s.codec_type==='audio');
const report={
  file:OUT,sha256:createHash('sha256').update(readFileSync(OUT)).digest('hex'),timingSha256,
  seconds:Number(meta.format.duration),sampleRate:Number(audio.sample_rate),channels:audio.channels,bits:audio.bits_per_sample,
  integratedLufs:integrated,truePeakDbtp:truePeak,worldSpreadLu:spread(),targetWorldSpreadLu:1.5,
  declaredImpactCount:events.length,centralArrangements:stems.filter(s=>s.central).map(s=>s.name),
  architecture:'Completed centrally authored score with optional section-module compatibility hooks; shared visual timing drives all declared accents.',
  sections:stems.map((s,i)=>({id:s.name,lufs:ls.sections[i],gainDb:20*Math.log10(s.gain),centralArrangement:s.central,arrangementSource:s.central?'authored-central-score':'section-module',declaredEvents:s.eventCount})),
  events:events.map(([frame,e])=>({frame,...e})),
  listened:false,scope:'Numeric audio verification only; sync is checked separately; final MP4 is not claimed here.'
};
writeFileSync(path.join(REPORT,'master-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({file:OUT,sha256:report.sha256,timingSha256,seconds:report.seconds,
  integratedLufs:integrated,truePeakDbtp:truePeak,worldSpreadLu:spread(),declaredImpactCount:events.length,
  sections:report.sections,report:path.join(REPORT,'master-report.json')},null,2));
assert.ok(Math.abs(integrated+14)<=.5,'Loudness is not about -14 LUFS');
assert.ok(truePeak < -1,'True peak is not below -1 dBTP');
assert.ok(spread()<=1.5,'World balance exceeds1.5 LU total spread');
assert.equal(Number(meta.format.duration),DURATION/FPS);
assert.equal(Number(audio.sample_rate),44100);assert.equal(audio.channels,2);assert.equal(audio.bits_per_sample,16);
console.log('PASS: '+OUT+'; numeric verification only, not listened to.');
