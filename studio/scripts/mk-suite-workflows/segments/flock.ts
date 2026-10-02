import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/flock/timing.ts';

export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 D.pad(bed,s(0),[45,52,57,60],ctx.length/FPS,.18,{att:.1,rel:.2,lp0:420,lp1:840,send:.18});
 for(let i=0;i<8;i++){D.pluck(bed,s(i*BEAT),[69,72,76,72,67,69,72,76][i],.46,(i%3-1)*.35,.18,.32,.996);D.put(bed,s(i*BEAT+12),.09,.3,.04,(t,r)=>.035*(r()-.5)*Math.exp(-t/.018));if(i%2===0)D.kick(bed,s(i*BEAT),.26);}
 for(const e of EVENTS){D.hit(fx,s(e.f),.72);D.bell(fx,s(e.f),81,.2,.8,0,1,.3,.13);}
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
