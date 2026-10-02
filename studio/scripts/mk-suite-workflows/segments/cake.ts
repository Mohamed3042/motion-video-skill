import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/cake/timing.ts';
export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 for(let f=0;f<ctx.length;f+=8){const i=f/8;D.bell(bed,s(f),[72,76,79,84,79,76][i%6],.16,.58,(i%5-2)*.2,2,1,.18);if(i%6===0)D.kick(bed,s(f),.24);}
 for(let f=0;f<ctx.length;f+=48)D.rhodesChord(bed,s(f),[57,60,64,67],.5,.16,.2);
 for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.9);
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
