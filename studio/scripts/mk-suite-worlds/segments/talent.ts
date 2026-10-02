import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-worlds/timing.ts';
import {EVENTS} from '../../../src/mk-suite-worlds/segments/talent/timing.ts';

export default function render(ctx:SynthCtx){
  const {bed,fx,s,finish}=stage(ctx);
  D.pad(bed,s(0),[60,64,67,74],ctx.length/FPS,.17,{lp0:900,lp1:3000,att:.08,rel:.18,send:.6});
  for(let f=0;f<ctx.length;f+=BEAT) {
    D.sub(bed,s(f),48,.3,.13);
    if(f%(BEAT*2)===0)D.kick(bed,s(f),.24);
    D.bell(bed,s(f+12),[76,79,83,86][Math.floor(f/BEAT)%4],.135,1,Math.sin(f*.1)*.6,2.05,.7,.55);
    D.hat(bed,s(f+18),.018,false,-.3);
  }
  for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.94);
  finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
