import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/quotes/timing.ts';

export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 D.rhodesChord(bed,s(0),[57,60,64,71],2.8,.25,.23);
 for(let i=0;i<8;i++){const f=i*BEAT;D.pluck(bed,s(f+12),[76,79,81,83,79,76,72,76][i],.19,i%2?.35:-.35,.3,.4,.993); if(i%2===0)D.sub(bed,s(f),[45,48,45,43][i/2],.42,.20);}
 for(const e of EVENTS){D.hit(fx,s(e.f),.7);D.bell(fx,s(e.f),e.f===60?88:84,.25,.9,0,2,.6,.14);}
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
