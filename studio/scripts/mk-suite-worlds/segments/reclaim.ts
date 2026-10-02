import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-worlds/timing.ts';
import {EVENTS} from '../../../src/mk-suite-worlds/segments/reclaim/timing.ts';

export default function render(ctx:SynthCtx){
  const {bed,fx,s,finish}=stage(ctx);
  D.pad(bed,s(0),[57,60,64,71],ctx.length/FPS,.18,{lp0:550,lp1:1450,att:.18,rel:.25,send:.5});
  for(let f=0;f<ctx.length;f+=BEAT*2) {
    D.kick(bed,s(f),.33);
    D.sub(bed,s(f),45,.6,.18);
    D.hat(bed,s(f+BEAT),.025,false,-.3);
  }
  [12,84,144].filter(f=>f<ctx.length).forEach((f,i)=>D.bell(bed,s(f),[76,79,83][i],.13,1,.3-i*.3,2,1,.5));
  for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.94);
  finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
