import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-worlds/timing.ts';
import {EVENTS} from '../../../src/mk-suite-worlds/segments/askrepos/timing.ts';

export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 D.sub(bed,s(0),33,ctx.length/FPS,.16);
 for(let i=0;i<16;i++){const f=i*12;D.square(bed,s(f),[69,72,76,79,81,79,76,72][i%8],.07,.085,i%2?.125:.25,(i%3-1)*.5,.1);if(i%4===0)D.kick(bed,s(f),.30);if(i%3===0)D.hat(bed,s(f+6),.037,false,-.4);}
 for(const e of EVENTS){D.hit(fx,s(e.f),.76);D.square(fx,s(e.f),e.f===60?88:84,.10,.23,.25,.1,.1);}
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
