import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/marketplace/timing.ts';

export default function render(ctx:SynthCtx){
  const {bed,fx,s,finish}=stage(ctx);
  for(let f=0;f<ctx.length;f+=BEAT){
    D.kick(bed,s(f),.43);
    D.bassPulse(bed,s(f+6),[45,52,55,57][Math.floor(f/BEAT)%4],.22,.28);
    D.rhodesChord(bed,s(f+12),[60,64,67,71],.23,.15,.17);
    D.hat(bed,s(f+12),.055,false,.25);
    if(Math.floor(f/BEAT)%2===1)D.clap(bed,s(f),.11);
  }
  D.pad(bed,s(0),[57,60,64],ctx.length/FPS,.065,{lp0:700,lp1:900,att:.1,rel:.1,send:.2});
  for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.94);
  finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
