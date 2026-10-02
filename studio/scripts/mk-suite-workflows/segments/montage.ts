import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/montage/timing.ts';
export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 D.pad(bed,s(0),[45,57,60,64],ctx.length/FPS,.08,{lp0:500,lp1:1400,att:.09,rel:.15,send:.2});
 for(let f=0;f<ctx.length;f+=12){const i=f/12;D.hat(bed,s(f),i%2?.06:.12,false,(i%3-1)*.4);if([0,3,4,6].includes(i%8))D.kick(bed,s(f),.57);if(i%4===2)D.clap(bed,s(f),.21);if(i%2===0)D.bassPulse(bed,s(f+3),[33,33,40,36][i/2%4],.16,.31);}
 for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.9);
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
