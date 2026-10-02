import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/factory/timing.ts';

export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 for(let i=0;i<12;i++){const f=i*BEAT;D.kick(bed,s(f),.46);D.bassPulse(bed,s(f+12),[33,33,36,40][i%4],.18,.26);D.hat(bed,s(f+12),.057,false,i%2?.4:-.4);if(i%2)D.clap(bed,s(f),.12);}
 for(let i=0;i<24;i++)D.bell(bed,s(i*12),[57,60,64,67,69,72][i%6],.115,.25,(i%4-1.5)*.22,2.7,1.8,.12);
 for(const e of EVENTS){D.hit(fx,s(e.f),.88);D.thump(fx,s(e.f),.3);D.bell(fx,s(e.f),e.f===60?81:88,.19,.6,0,4,3,.08);}
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
