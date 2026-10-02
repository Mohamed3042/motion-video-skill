import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-worlds/timing.ts';
import {EVENTS} from '../../../src/mk-suite-worlds/segments/downloader/timing.ts';

export default function render(ctx:SynthCtx){
  const {bed,fx,s,finish}=stage(ctx);
  for (let f=0;f<ctx.length;f+=BEAT) {
    D.kick(bed,s(f),.46);
    D.bassPulse(bed,s(f+6),[45,45,48,43][Math.floor(f/BEAT)%4],.24,.29);
    D.hat(bed,s(f+12),.04,false,-.25);
  }
  [0,18,36,72,90,108,138,162].filter(f=>f<ctx.length).forEach((f,i)=>D.bell(bed,s(f),[69,72,76,79,76,72,67,69][i],.15,.48,Math.sin(i)*.55,2.1,1.4,.25));
  D.pad(bed,s(0),[57,60,64,67],ctx.length/FPS,.095,{lp0:650,lp1:2400,att:.12,rel:.16,send:.32});
  for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.94);
  finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
