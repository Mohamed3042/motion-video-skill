import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-worlds/timing.ts';
import {EVENTS} from '../../../src/mk-suite-worlds/segments/charforge/timing.ts';
export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 for(let f=0;f<ctx.length;f+=12){const i=f/12;D.bell(bed,s(f),[57,64,69,72,76,72,69,64][i%8],.19,.75,(i%7-3)*.21,3.51,2.5,.2);if(i%4===0)D.kick(bed,s(f),.3);}
 D.sub(bed,s(0),33,ctx.length/FPS,.18);
 for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.9);
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
