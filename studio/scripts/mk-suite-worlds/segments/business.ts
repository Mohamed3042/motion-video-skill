import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-worlds/timing.ts';
import {EVENTS} from '../../../src/mk-suite-worlds/segments/business/timing.ts';

export default function render(ctx:SynthCtx){
  const {bed,fx,s,finish}=stage(ctx);
  D.pad(bed,s(0),[45,52,57,60],ctx.length/FPS,.11,{lp0:450,lp1:1200,att:.08,rel:.15,send:.23});
  for(let f=0;f<ctx.length;f+=BEAT){
    D.kick(bed,s(f),.52);
    D.bassPulse(bed,s(f+12),[45,45,43,48][Math.floor(f/BEAT)%4],.21,.29);
    D.hat(bed,s(f+12),.045,false,.27);
    D.bell(bed,s(f+6),[57,64,60,67][Math.floor(f/BEAT)%4],.12,.22,-.3,1.5,2.8,.18);
    if(Math.floor(f/BEAT)%2)D.clap(bed,s(f),.09);
  }
  for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.94);
  finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
