import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/voice/timing.ts';
export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 D.pad(bed,s(0),[45,52,57,60,64],ctx.length/FPS,.17,{lp0:400,lp1:1400,att:.15,rel:.22,send:.3});
 for(let f=0;f<ctx.length;f+=BEAT){D.kick(bed,s(f),f%48===0?.48:.23);D.bassPulse(bed,s(f+8),33+(f%96===72?7:0),.21,.24);if(f%48===24)D.bell(bed,s(f+5),[69,72,76,79][Math.floor(f/48)%4],.1,.6,-.4,2,1,.2);}
 for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.9);
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
