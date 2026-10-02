// World 6 · Voice Arcade — sound. Chiptune in C major, 120 BPM, C | Am | F | G, on four channels made from scratch:
// two pulse waves (lead 25 %, arps/blips 12.5 %), a triangle bass and a stepped-noise drum channel.
// Title crash on the slam, menu blips on the stage map, cursor ticks, a coin on SELECT, a power-up on APPROVE,
// a rewind on RESET, then the CRT powers off and a glassy ping as the line splits into the grating.
import type {SynthCtx} from '../types.ts';
import {A, EVENTS} from '../../../src/mkv/worlds/arcade/timing.ts';
import {BQ, TAU, bus, duck, finish, mtof, noise, pulse, put, type Bus} from './training.ts';

const SR_LP = 7000; // tame the square edges a little

// A pulse-wave note: hard chip envelope, optional pitch slide (semitones over the note) and late vibrato.
function chip(b: Bus, f: number, m: number, dur: number, vol: number, o: {duty?: number; pan?: number; slide?: number; vib?: number; send?: number; decay?: number} = {}) {
  const {SR} = b.ctx;
  const lp = new BQ(SR).set(0, SR_LP, 0.7);
  let p = 0;
  put(b, f, dur + 0.02, o.pan ?? 0, o.send ?? 0.12, (t) => {
    const semi = (o.slide ?? 0) * Math.min(1, t / dur) + (o.vib ?? 0) * (t > 0.12 ? Math.sin(TAU * 6 * t) : 0);
    const fr = mtof(m + semi);
    p = (p + fr / SR) % 1;
    const env = (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.02)) * (o.decay ? Math.exp(-t / o.decay) : 1) * Math.min(1, t / 0.002);
    return vol * env * lp.run(pulse(p, fr / SR, o.duty ?? 0.25));
  });
}

// Triangle bass (4-bit stepped like the real channel).
function tri(b: Bus, f: number, m: number, dur: number, vol: number) {
  const {SR} = b.ctx;
  const fr = mtof(m);
  let p = 0;
  put(b, f, dur + 0.01, 0, 0, (t) => {
    p = (p + fr / SR) % 1;
    const v = Math.round((1 - 4 * Math.abs(p - 0.5)) * 7.5) / 7.5;
    return vol * v * (t < dur ? 1 : Math.max(0, 1 - (t - dur) / 0.01)) * Math.min(1, t / 0.002);
  });
}

// Stepped noise (sample & hold) — the chip noise channel. `rate` = new random value every N samples.
function chipNoise(b: Bus, f: number, dur: number, vol: number, rate: number, decay: number, pan = 0, send = 0.05) {
  let v = 0;
  let k = 0;
  put(b, f, dur, pan, send, (t) => {
    if (k++ % rate === 0) v = noise(b);
    return vol * v * Math.exp(-t / decay);
  });
}

function chipKick(b: Bus, f: number, vol: number) {
  const {SR} = b.ctx;
  let p = 0;
  put(b, f, 0.16, 0, 0, (t) => {
    const fr = 55 + 260 * Math.exp(-t / 0.018);
    p = (p + fr / SR) % 1;
    return vol * (1 - 4 * Math.abs(p - 0.5)) * Math.exp(-t / 0.07);
  });
  chipNoise(b, f, 0.02, vol * 0.4, 6, 0.006);
}
const snare = (b: Bus, f: number, vol: number) => chipNoise(b, f, 0.16, vol, 2, 0.05, 0.1, 0.12);
const hatN = (b: Bus, f: number, vol: number) => chipNoise(b, f, 0.04, vol, 1, 0.012, -0.25, 0.03);

const CH = [
  [60, 64, 67], // C
  [57, 60, 64], // Am
  [53, 57, 60], // F
  [55, 59, 62], // G
];
const ROOT = [36, 33, 29, 31];

export default function render(ctx: SynthCtx) {
  const b = bus(ctx, 6060);
  const s16 = 7.5;

  // ---- bed ----
  // triangle bass: root/octave eighths from the title slam until the CRT powers off
  for (let f = A.title; f < A.collapse - 6; f += 15) {
    const bar = Math.floor(f / 120);
    tri(b, f, ROOT[bar] + ((f / 15) % 2 ? 12 : 0), 0.11, 0.42);
  }
  // drums: kick on 1 & 3, snare on 2 & 4, offbeat hats
  for (let f = 60; f < 456; f += 30) {
    const beat = Math.round(f / 30) % 4;
    if (beat === 0 || beat === 2) chipKick(b, f, 0.75);
    else snare(b, f, 0.3);
  }
  for (let f = 135; f < 456; f += 15) if (f % 30 !== 0) hatN(b, f, 0.12);
  // pulse-2 chord arpeggio (the classic chip "chord"), quiet, 16ths, bars 2–4
  for (let f = 120; f < 456; f += s16) {
    const ch = CH[Math.floor(f / 120)];
    const i = Math.round(f / s16);
    chip(b, f, ch[i % 3] + 12, 0.055, 0.075, {duty: 0.125, pan: i % 2 ? 0.35 : -0.35, send: 0.08});
  }
  // lead (pulse 25 %): an answer phrase after the stage blips, a G-major run in bar 4 around RESET
  const lead: [number, number, number][] = [
    // [frame, midi, length in 16ths]
    [195, 76, 1],
    [202.5, 79, 1],
    [210, 81, 2],
    [225, 84, 2],
    [360, 79, 2],
    [375, 83, 2],
    [420, 86, 2],
    [435, 84, 1],
    [442.5, 83, 1],
    [450, 79, 2],
  ];
  for (const [f, m, n] of lead) chip(b, f, m, n * 0.125 - 0.02, 0.2, {vib: 0.15, pan: 0.1, send: 0.18});

  // ---- events: duck the bed, then land each one ----
  for (const e of EVENTS) if (e.kind === 'impact' || e.kind === 'hit') duck(b, e.f, 0.1);
  for (const f of [...A.hops, ...A.shuffle, A.home]) duck(b, f, 0.35, 0.04);

  // title slam: noise crash + triangle drop + a fast C-major jingle
  chipNoise(b, A.title, 1.3, 0.55, 3, 0.35, 0, 0.3);
  chipKick(b, A.title, 0.9);
  [72, 76, 79, 84, 88].forEach((m, i) => chip(b, A.title + i * 3.75, m, i === 4 ? 0.45 : 0.06, 0.2, {duty: 0.25, vib: i === 4 ? 0.2 : 0, send: 0.25}));

  // stage map: rising menu blips (two quick notes each)
  A.stages.forEach((f, i) => {
    const m = [81, 84, 88][i];
    chip(b, f, m, 0.05, 0.24, {duty: 0.125, send: 0.15});
    chip(b, f + 3.75, m + 7, 0.07, 0.2, {duty: 0.125, send: 0.15});
  });
  // cursor ticks on the take grid
  A.hops.forEach((f) => chip(b, f, 96, 0.025, 0.22, {duty: 0.5, send: 0.05}));
  // SELECT: coin (B5 → E6)
  chip(b, A.select, 83, 0.07, 0.28, {duty: 0.5, send: 0.2});
  chip(b, A.select + 4.2, 88, 0.5, 0.28, {duty: 0.5, decay: 0.22, send: 0.25});
  chipNoise(b, A.select, 0.015, 0.25, 1, 0.004);
  // APPROVE: power-up arpeggio + crash
  [72, 76, 79, 84, 88, 91, 96, 100].forEach((m, i) => chip(b, A.approve + i * 1.8, m, 0.035, 0.24, {duty: 0.25, send: 0.2}));
  chip(b, A.approve + 14.4, 96, 0.45, 0.2, {duty: 0.25, vib: 0.3, decay: 0.3, send: 0.3});
  chipNoise(b, A.approve, 0.9, 0.5, 2, 0.22, 0, 0.3);
  chipKick(b, A.approve, 0.9);
  // RESET: rewind sweep down + shuffle ticks + home tick
  chip(b, A.reset, 84, 0.09, 0.28, {duty: 0.125, slide: -24, decay: 0.05, send: 0.1});
  chipNoise(b, A.reset, 0.05, 0.4, 1, 0.012);
  A.shuffle.forEach((f, i) => {
    chip(b, f, 91 - i * 5, 0.04, 0.26, {duty: 0.25});
    chipNoise(b, f, 0.012, 0.2, 1, 0.003);
  });
  chip(b, A.home, 91, 0.03, 0.22, {duty: 0.5});
  // CRT power-off: falling zap + static burst; then a glassy ping as the line splits
  chip(b, A.collapse, 90, 0.15, 0.22, {duty: 0.5, slide: -48, send: 0.05});
  chipNoise(b, A.collapse, 0.11, 0.35, 1, 0.035, 0, 0.05);
  {
    const fr = mtof(100);
    put(b, A.line, 0.9, 0, 0.45, (t) => 0.2 * Math.sin(TAU * fr * t) * Math.exp(-t / 0.25) * Math.min(1, t * 3000));
    put(b, A.line, 0.9, 0, 0.45, (t) => 0.08 * Math.sin(TAU * fr * 1.5 * t) * Math.exp(-t / 0.18) * Math.min(1, t * 3000));
  }

  finish(b, 0.8, -7);
}
