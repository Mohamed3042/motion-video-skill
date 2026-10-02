import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/workflows/timing.ts';

export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 D.pad(bed,s(0),[57,60,64,67],ctx.length/FPS,.16,{att:.08,rel:.18,lp0:650,lp1:1350,send:.22});
 for(let i=0;i<16;i++){const f=i*12;D.bell(bed,s(f),[69,72,76,79,76,72][i%6],.13,.21,(i%3-1)*.45,1.5,.4,.13);if(i%2===0)D.kick(bed,s(f),.32);if(i%3===1)D.hat(bed,s(f),.045,false,-.35);}
 for(const e of EVENTS){D.hit(fx,s(e.f),.78);D.bell(fx,s(e.f),84,.23,.7,.1,2,.7,.12);}
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
