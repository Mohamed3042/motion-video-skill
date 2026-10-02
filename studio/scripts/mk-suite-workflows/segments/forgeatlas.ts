import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/forgeatlas/timing.ts';
export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 for(let f=0;f<ctx.length;f+=BEAT){D.pluck(bed,s(f),[57,64,69,72][Math.floor(f/BEAT)%4],.45,(f%48?-.4:.4),.2,.38,.997);D.bell(bed,s(f+12),[81,76,84,79][Math.floor(f/BEAT)%4],.09,.85,-.25,4,1.2,.3);D.kick(bed,s(f),.33);D.hat(bed,s(f+12),.04);}
 D.pad(bed,s(0),[45,52,60],ctx.length/FPS,.1,{lp0:500,lp1:1500,att:.15,send:.25});
 for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.9);
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
