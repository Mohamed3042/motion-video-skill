import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/tones/timing.ts';
export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 for(let f=0;f<ctx.length;f+=12){const i=Math.floor(f/12);D.bell(bed,s(f+(i%2?2:0)),[69,72,76,79,81,76,72,67][i%8],.2,.42,(i%5-2)*.22,2,.7,.16);if(i%4===0){D.kick(bed,s(f),.24);D.bassPulse(bed,s(f),45,.19,.25);}if(i%2)D.hat(bed,s(f),.038,false);}
 for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.9);
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
