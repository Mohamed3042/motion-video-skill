import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-worlds/timing.ts';
import {EVENTS} from '../../../src/mk-suite-worlds/segments/games/timing.ts';

export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 D.pad(bed,s(0),[48,55,60,64,71],ctx.length/FPS,.22,{att:.05,rel:.3,lp0:1600,lp1:2800,send:.2});
 for(let i=0;i<12;i++){const f=i*BEAT;D.kick(bed,s(f),.43);D.bassPulse(bed,s(f),[36,36,43,45][i%4],.26,.24);if(i%2)D.clap(bed,s(f),.11);D.hat(bed,s(f+12),.044,false,.3);}
 for(let i=0;i<24;i++)D.square(bed,s(i*12),[72,76,79,83,84,83,79,76][i%8],.115,.077,.25,(i%3-1)*.3,.2);
 for(const e of EVENTS){D.hit(fx,s(e.f),.82);D.bell(fx,s(e.f),e.f===60?88:91,.2,1,.2,2,.8,.2);}
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
