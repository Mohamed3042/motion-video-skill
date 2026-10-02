import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-worlds/timing.ts';
import {EVENTS} from '../../../src/mk-suite-worlds/segments/macroforge/timing.ts';

export default function render(ctx:SynthCtx){
  const {bed,fx,s,finish}=stage(ctx);
  for (let f=0;f<ctx.length;f+=BEAT) {
    D.kick(bed,s(f),.37);
    D.pluck(bed,s(f+6),[57,60,64,60][Math.floor(f/BEAT)%4],.18,-.35,.12,.7,.992);
    D.hat(bed,s(f+12),.065,false,.3);
    D.put(bed,s(f+18),.04,-.2,.05,(t,rnd)=>.11*(rnd()*2-1)*Math.exp(-t*120));
    if(Math.floor(f/BEAT)%2===1) D.clap(bed,s(f),.08);
  }
  D.pad(bed,s(0),[45,52,60],ctx.length/FPS,.095,{lp0:450,lp1:850,att:.08,rel:.12,send:.18});
  for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.94);
  finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
