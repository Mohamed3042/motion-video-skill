import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/marketing/timing.ts';

export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 for(let i=0;i<8;i++){const f=i*BEAT;D.kick(bed,s(f),.40);D.bassPulse(bed,s(f),[45,45,48,43][i%4],.22,.30);if(i%2)D.clap(bed,s(f),.1);D.hat(bed,s(f+12),.045,false,.3);}
 for(const [f,m] of [[0,60],[36,64],[72,67],[108,60],[144,64],[168,67]]){const hz=D.mtof(m);D.put(bed,s(f),.28,-.2,.13,t=>.20*Math.min(1,t*200)*Math.exp(-t/ .13)*Math.sin(D.TAU*hz*t+2.8*Math.exp(-t/.12)*Math.sin(D.TAU*hz*t)));}
 for(const e of EVENTS){D.hit(fx,s(e.f),.8);D.thump(fx,s(e.f),.3);}
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
