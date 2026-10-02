// PLACEHOLDER sound for segment "__ID__" (the segment builder replaces this file): a kick on every beat under a soft
// pad, so the master mix is never silent. Uses the stage kit (ducking + level normalisation).
import type {SynthCtx} from '../types.ts';
import * as D from '../dsp.ts';
import {stage} from '../stage.ts';
import {BEAT, FPS} from '../../../src/__SLUG__/timing.ts';
import {EVENTS} from '../../../src/__SLUG__/segments/__ID__/timing.ts';

export default function render(ctx: SynthCtx) {
  const {bed, fx, s, finish} = stage(ctx);
  for (let f = 0; f < ctx.length; f += BEAT) D.kick(bed, s(f), 0.5);
  D.pad(bed, s(0), [57, 60, 64, 67], ctx.length / FPS, 0.14, {lp0: 500, lp1: 1800, att: 0.3, rel: 0.2, send: 0.4});
  for (const e of EVENTS) if (e.kind === 'impact' || e.kind === 'hit') D.hit(fx, s(e.f), 0.6);
  finish(EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').map((e) => e.f));
}
