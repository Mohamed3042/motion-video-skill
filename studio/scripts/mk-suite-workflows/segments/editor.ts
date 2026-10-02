import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT,FPS} from '../../../src/mk-suite-workflows/timing.ts';
import {EVENTS} from '../../../src/mk-suite-workflows/segments/editor/timing.ts';
export default function render(ctx:SynthCtx){
 const {bed,fx,s,finish}=stage(ctx);
 for(let f=0;f<ctx.length;f+=BEAT){D.kick(bed,s(f),.34);D.bassPulse(bed,s(f+8),45+(f%96===72?7:0),.16,.2);D.pluck(bed,s(f+12),[69,76,72,79][Math.floor(f/BEAT)%4],.29,(f%48?-.5:.5),.12,.75,.985);D.hat(bed,s(f+18),.065,false);}
 D.pad(bed,s(0),[57,60,64],ctx.length/FPS,.07,{lp0:500,lp1:900,att:.05,send:.13});
 for(const e of EVENTS) if(e.kind==='impact'||e.kind==='hit') D.hit(fx,s(e.f),.9);
 finish(EVENTS.filter(e=>e.kind==='impact'||e.kind==='hit').map(e=>e.f));
}
