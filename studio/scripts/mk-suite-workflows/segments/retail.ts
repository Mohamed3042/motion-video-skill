import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/retail/timing.ts';

export default function render(ctx:SynthCtx){
  const {bed,fx,s,finish}=stage(ctx);
  D.pad(bed,s(0),[60,64,67],ctx.length/FPS,.08,{lp0:650,lp1:1600,att:.1,rel:.12,send:.22});
  for(let f=0;f<ctx.length;f+=BEAT){
    D.kick(bed,s(f),.36);
    D.bassPulse(bed,s(f+6),[48,55,52,57][Math.floor(f/BEAT)%4],.19,.25);
    D.pluck(bed,s(f+12),[72,76,79,76][Math.floor(f/BEAT)%4],.17,-.3,.22,.65,.991);
    D.hat(bed,s(f+18),.042,false,.34);
    if(Math.floor(f/BEAT)%2===1)D.clap(bed,s(f),.06);
  }
  for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.94);
  finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
