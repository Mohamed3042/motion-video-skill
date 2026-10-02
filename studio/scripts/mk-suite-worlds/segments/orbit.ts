import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-worlds/timing.ts';
import {EVENTS} from '../../../src/mk-suite-worlds/segments/orbit/timing.ts';

export default function render(ctx:SynthCtx){
  const {bed,fx,s,finish}=stage(ctx);
  D.pad(bed,s(0),[57,60,64,67],ctx.length/FPS,.14,{lp0:700,lp1:2200,att:.1,rel:.24,send:.55});
  for(let f=0;f<ctx.length;f+=12) {
    D.bell(bed,s(f),[69,76,72,79,76,72,67,72][Math.floor(f/12)%8],.11,.65,Math.sin(f*.12)*.65,2.3,.8,.46);
    if(f%(BEAT*2)===0) {D.kick(bed,s(f),.37);D.sub(bed,s(f),45,.36,.19);}
    if(f%(BEAT*2)===BEAT) D.clap(bed,s(f),.045);
  }
  for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.94);
  finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
