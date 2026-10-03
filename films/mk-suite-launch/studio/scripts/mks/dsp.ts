// DSP for the MK Suite launch score. Re-exports the proven MK Voice toolkit (drums, Rhodes, pads, booms, whooshes,
// risers, Shepard, reverb, loudness, true-peak limiter, WAV writer) and adds this film's voices: the hook pluck,
// glass, chord stabs, cymbal, small percussion and the UI foley. Also the event loader shared with check.ts.
// Deterministic: all noise comes from mulberry32 seeded by each voice's start sample.
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {BQ, SR, TAU, mtof, put, type Out} from '../mkv/dsp.ts';
import {ACTS, DURATION, type ActId, type EventKind, type MksEvent} from '../../src/mks/timing.ts';

export * from '../mkv/dsp.ts';

const noise = (r: () => number) => r() * 2 - 1;
const blep = (p: number, dt: number) => {
  if (p < dt) {
    const x = p / dt;
    return x + x - x * x - 1;
  }
  if (p > 1 - dt) {
    const x = (p - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
};
// Topology-preserving state variable filter (per-sample cutoff). mode 0 = LP, 1 = BP, 2 = HP.
export const svf = () => {
  let ic1 = 0;
  let ic2 = 0;
  return (x: number, fc: number, q: number, mode: 0 | 1 | 2) => {
    const g = Math.tan((Math.PI * Math.min(Math.max(fc, 10), SR * 0.45)) / SR);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    return mode === 0 ? v2 : mode === 1 ? v1 : x - k * v1 - v2;
  };
};
const saws = (f: number, det: number[], ph: number[]) => {
  let x = 0;
  for (let k = 0; k < det.length; k++) {
    const dt = (f * det[k]) / SR;
    ph[k] += dt;
    if (ph[k] >= 1) ph[k] -= 1;
    x += 2 * ph[k] - 1 - blep(ph[k], dt);
  }
  return x / det.length;
};

// ---------------- melodic ----------------
// The hook voice: three detuned saws + sine + pick noise through a lowpass that snaps shut (bright pop pluck).
export function hookPluck(o: Out, s: number, m: number, dur: number, vol: number, pan = 0, send = 0.25, bright = 0.75) {
  const f = mtof(m);
  const ph = [0.11, 0.47, 0.83];
  const det = [1, 1.0061, 0.9939];
  const flt = svf();
  const decay = 0.2 + 0.2 * bright;
  put(o, s, dur + 0.6, pan, send, (t, r) => {
    const x = saws(f, det, ph) * 0.9 + Math.sin(TAU * f * t) * 0.35 + noise(r) * Math.exp(-t / 0.003) * 0.25;
    const env = (1 - Math.exp(-t / 0.0015)) * Math.exp(-t / decay) * (t > dur ? Math.exp(-(t - dur) / 0.07) : 1);
    const fc = 700 + (2600 + 4200 * bright) * Math.exp(-t / 0.075) + 500 * bright;
    return vol * env * flt(x, fc, 0.85, 0);
  });
}
// Glockenspiel (inharmonic partials).
export function glock(o: Out, s: number, m: number, vol: number, pan = 0, send = 0.35) {
  const f = mtof(m);
  const ratios = [1, 2.756, 5.404, 8.933];
  const amps = [1, 0.3, 0.12, 0.05];
  const decs = [1.0, 0.33, 0.15, 0.07];
  put(o, s, 1.6, pan, send, (t) => {
    let x = 0;
    for (let k = 0; k < 4; k++) x += Math.sin(TAU * f * ratios[k] * t) * amps[k] * Math.exp(-t / decs[k]);
    return vol * x * (1 - Math.exp(-t / 0.0008));
  });
}
// Glass chime: FM body + octave + a high glint, long-ish ring.
export function glass(o: Out, s: number, m: number, vol: number, pan = 0, send = 0.45) {
  const f = mtof(m);
  put(o, s, 1.8, pan, send, (t, r) => {
    const body = Math.sin(TAU * f * t + 0.9 * Math.exp(-t / 0.05) * Math.sin(TAU * f * 3.01 * t)) * Math.exp(-t / 0.5);
    const oct = 0.3 * Math.sin(TAU * f * 2 * t) * Math.exp(-t / 0.25);
    const glint = 0.2 * Math.sin(TAU * f * 5.43 * t) * Math.exp(-t / 0.05);
    return vol * Math.min(1, t * 4000) * (body + oct + glint + 0.25 * noise(r) * Math.exp(-t / 0.0012));
  });
}
// Chord stab: detuned saw stack with a fast filter envelope (one voice per note, spread across the stereo field).
export function stab(o: Out, s: number, notes: number[], dur: number, vol: number, send = 0.3) {
  notes.forEach((m, j) => {
    const f = mtof(m);
    const ph = [0.2 + 0.1 * j, 0.55, 0.8];
    const det = [1, 1.0055, 0.9945];
    const flt = svf();
    const pan = notes.length > 1 ? -0.5 + j / (notes.length - 1) : 0;
    put(o, s, dur + 0.3, pan, send, (t) => {
      const fc = 600 + 5200 * Math.exp(-t / 0.07);
      const env = (1 - Math.exp(-t / 0.0012)) * (0.4 + 0.6 * Math.exp(-t / 0.1)) * (t > dur ? Math.exp(-(t - dur) / 0.07) : 1);
      return ((vol / Math.sqrt(notes.length)) * env * Math.tanh(1.4 * flt(saws(f, det, ph), fc, 0.9, 0)));
    });
  });
}
// Rubbery bass: pitch "boing" into the note, sine + triangle through a closing lowpass, soft-clipped.
export function bounceBass(o: Out, s: number, m: number, dur: number, vol: number) {
  const f = mtof(m);
  const flt = svf();
  let ph = 0;
  put(o, s, dur + 0.08, 0, 0, (t) => {
    ph += (f * 2 ** ((3 / 12) * Math.exp(-t / 0.022))) / SR;
    if (ph >= 1) ph -= 1;
    const x = Math.sin(TAU * ph) * 0.8 + (4 * Math.abs(ph - 0.5) - 1) * 0.45;
    const env = (1 - Math.exp(-t / 0.003)) * (0.55 + 0.45 * Math.exp(-t / 0.09)) * (t > dur ? Math.exp(-(t - dur) / 0.02) : 1);
    return vol * env * Math.tanh(1.6 * flt(x, 160 + 1300 * Math.exp(-t / 0.06), 1.1, 0));
  });
}
// Low saw pulse with a set cutoff (the cold-open heartbeat bed).
export function lowPulse(o: Out, s: number, m: number, dur: number, vol: number, cutoff: number) {
  const f = mtof(m);
  const lp = new BQ().set(0, cutoff, 0.9);
  let ph = 0;
  put(o, s, dur + 0.05, 0, 0.1, (t) => {
    ph = (ph + f / SR) % 1;
    const e = Math.min(1, t / 0.006) * Math.exp(-t / 0.16) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.05) : 1);
    return vol * e * (lp.run(2 * ph - 1) + 0.6 * Math.sin(TAU * f * t));
  });
}
// A sustained high tone with slow vibrato that swells in (tension).
export function strand(o: Out, s: number, m: number, dur: number, vol: number, pan = 0) {
  const f = mtof(m);
  let ph = 0;
  put(o, s, dur, pan, 0.6, (t) => {
    ph += (f * (1 + 0.004 * Math.sin(TAU * 5.2 * t) * Math.min(1, t / 2))) / SR;
    const e = Math.min(1, (t / dur) ** 1.6 * 1.2) * Math.min(1, (dur - t) * 30);
    return vol * e * Math.sin(TAU * ph + 0.6 * Math.sin(TAU * 2 * ph));
  });
}

// ---------------- percussion ----------------
export function crash(o: Out, s: number, vol: number, len = 2.4, pan = 0) {
  const hp = new BQ().set(1, 4200, 0.7);
  const bp = new BQ().set(2, 8200, 0.7);
  put(o, s, len, pan, 0.35, (t, r) => {
    const n = noise(r);
    const e = Math.min(1, t * 3000) * (0.55 * Math.exp(-t / (len * 0.3)) + 0.45 * Math.exp(-t / 0.07)) * Math.min(1, (len - t) * 8);
    return vol * e * (hp.run(n) + 0.7 * bp.run(n));
  });
}
export function snare(o: Out, s: number, vol: number, pan = 0, send = 0.15) {
  const flt = svf();
  put(o, s, 0.25, pan, send, (t, r) => vol * (flt(noise(r), 3800, 0.6, 1) * Math.exp(-t / 0.06) * 1.6 + Math.sin(TAU * 195 * t) * Math.exp(-t / 0.035) * 0.5));
}
export function snap(o: Out, s: number, vol: number, pan = 0, send = 0.3) {
  const flt = svf();
  put(o, s, 0.12, pan, send, (t, r) => vol * (flt(noise(r), 2900, 3, 1) * Math.exp(-t / 0.011) * 3 + Math.sin(TAU * 1850 * t) * Math.exp(-t / 0.006) * 0.4));
}
export function shaker(o: Out, s: number, vol: number, pan = 0.3) {
  const bp = new BQ().set(2, 6800, 1.1);
  put(o, s, 0.1, pan, 0.05, (t, r) => vol * bp.run(noise(r)) * Math.min(1, t / 0.012) * Math.exp(-t / 0.028));
}
export function rim(o: Out, s: number, vol: number, pan = 0) {
  const bp = new BQ().set(2, 2400, 2);
  put(o, s, 0.08, pan, 0.08, (t, r) => vol * (Math.sin(TAU * 1720 * t) * Math.exp(-t / 0.01) * 0.6 + Math.sin(TAU * 520 * t) * Math.exp(-t / 0.018) * 0.5 + bp.run(noise(r)) * Math.exp(-t / 0.004) * 2));
}
// Transient crack: a 1.5 ms broadband burst + a 6 ms bright tail. Gives hits/impacts a front edge that reads over beds.
export function crack(o: Out, s: number, vol: number) {
  const hp = new BQ().set(1, 2000, 0.7);
  put(o, s, 0.03, 0, 0.05, (t, r) => {
    const n = noise(r);
    return vol * ((t < 0.0015 ? n * (1 - t / 0.0015) : 0) + hp.run(n) * 1.4 * Math.exp(-t / 0.006));
  });
}
// Soft heartbeat kick: low, round, no click.
export function heart(o: Out, s: number, vol: number) {
  let ph = 0;
  put(o, s, 0.5, 0, 0.06, (t) => {
    ph += (TAU * (44 + 36 * Math.exp(-t / 0.04))) / SR;
    return vol * Math.min(1, t * 700) * Math.sin(ph) * Math.exp(-t / 0.2);
  });
}

// ---------------- UI foley ----------------
// Premium UI click: a tight bright tick with a little body, then a softer release tick 55 ms later.
export function uiClick(o: Out, s: number, vol: number, pan = 0) {
  const bp = new BQ().set(2, 4300, 1.3);
  const bp2 = new BQ().set(2, 1600, 3);
  put(o, s, 0.14, pan, 0.1, (t, r) => {
    const n = noise(r);
    const u = t - 0.055;
    const press = bp.run(n) * 2.6 * Math.exp(-t / 0.0018) + 0.55 * Math.sin(TAU * 1250 * t) * Math.exp(-t / 0.006) + 0.4 * Math.sin(TAU * 190 * t) * Math.exp(-t / 0.016);
    const release = u > 0 ? bp2.run(n) * 0.9 * Math.exp(-u / 0.003) : (bp2.run(n), 0);
    return vol * Math.min(1, t * 40000) * (press + release);
  });
}
// Deep mechanical keyboard thock: falling body + plastic knock + switch tick + sub weight + bottom-out rattle.
export function keyThock(o: Out, s: number, vol: number, pan = 0) {
  const bp = new BQ().set(2, 950, 1.2);
  const hp = new BQ().set(1, 3500, 0.8);
  const hp2 = new BQ().set(2, 2600, 2);
  let ph = 0;
  put(o, s, 0.4, pan, 0.14, (t, r) => {
    const n = noise(r);
    ph += (TAU * (125 + 170 * Math.exp(-t / 0.012))) / SR;
    const u = t - 0.03;
    return (
      vol *
      Math.min(1, t * 30000) *
      (Math.sin(ph) * Math.exp(-t / 0.05) +
        bp.run(n) * 2.4 * Math.exp(-t / 0.014) +
        hp.run(n) * 1.5 * Math.exp(-t / 0.0025) +
        0.45 * Math.sin(TAU * 55 * t) * Math.exp(-t / 0.1) +
        (u > 0 ? 0.6 * hp2.run(n) * Math.exp(-u / 0.005) : (hp2.run(n), 0)))
    );
  });
}
// Light key tick for typing; `semis` detunes the whole tick.
export function typeTick(o: Out, s: number, vol: number, semis: number, pan = 0) {
  const k = 2 ** (semis / 12);
  const bp = new BQ().set(2, 3100 * k, 1.6);
  put(o, s, 0.08, pan, 0.1, (t, r) => vol * Math.min(1, t * 20000) * (bp.run(noise(r)) * 2.2 * Math.exp(-t / 0.004) + 0.45 * Math.sin(TAU * 430 * k * t) * Math.exp(-t / 0.012)));
}

// ---------------- events (shared with check.ts) ----------------
export type GEvent = MksEvent & {g: number; act: ActId};
// Every act's EVENTS in global frames, sorted. MKS_EVENTS=<file.ts> (exporting EVENTS: {[actId]: MksEvent[]})
// replaces the listed acts' events: synthetic test events without touching the acts.
export async function loadEvents(): Promise<GEvent[]> {
  const file = process.env.MKS_EVENTS;
  const over: Partial<Record<ActId, MksEvent[]>> = file ? (await import(pathToFileURL(path.resolve(file)).href)).EVENTS : {};
  const out: GEvent[] = [];
  for (const a of ACTS) {
    const evs: MksEvent[] = over[a.id] ?? (await import(`../../src/mks/acts/${a.id}/timing.ts`)).EVENTS;
    for (const e of evs) {
      const g = a.start + e.f;
      if (g < 0 || g >= DURATION) console.warn(`WARN ${a.id} event @${e.f} (${e.kind}) is outside the film; skipped`);
      else out.push({...e, g, act: a.id});
    }
  }
  return out.sort((x, y) => x.g - y.g);
}
// The final held chord starts on the end-card lock: the last finale impact in its second half (default bar 56).
export const finalChordFrame = (ev: GEvent[]) => ev.filter((e) => e.kind === 'impact' && e.g >= 6600 && e.g <= DURATION - 300).at(-1)?.g ?? 6720;
// The score's own impacts: every act/chapter start, plus the final chord when no act impact marks it.
export const scoreImpacts = (ev: GEvent[]) => {
  const end = finalChordFrame(ev);
  return [...ACTS.slice(1).map((a) => a.start), ...(ev.some((e) => e.kind === 'impact' && e.g === end) ? [] : [end])];
};
export const CHECKED: EventKind[] = ['impact', 'hit', 'key', 'click'];
