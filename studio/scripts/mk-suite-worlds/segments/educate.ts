import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-worlds/timing.ts';
import {EVENTS} from '../../../src/mk-suite-worlds/segments/educate/timing.ts';
export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 for(let f=0;f<ctx.length;f+=48){D.rhodesChord(bed,s(f),f%96===0?[57,60,64,67]:[55,60,64,69],.65,.32,.25);D.sub(bed,s(f),f%96===0?45:43,.6,.19);D.kick(bed,s(f),.19);}
 for(let f=12;f<ctx.length;f+=24){D.pluck(bed,s(f),[72,76,79,76][Math.floor(f/24)%4],.14,-.2,.1,.2,.99);D.hat(bed,s(f+8),.022,false);}
 for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.9);
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
