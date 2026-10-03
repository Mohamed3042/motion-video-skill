// MK Suite — launch film: the original score + sound design → public/mks/music.wav (44.1 kHz 16-bit stereo, exactly 120.0 s).
// 120 BPM in C major, 1 bar = 2 s = 120 frames (bar n starts at frame 120·n). Chords Cmaj7 → Am7 → Fmaj7 → G6, a five-note
// pluck hook (G C D E C), Rhodes + pad, clean drums, sub bass. Arc: cold open (bars 0–4) → DROP at f600 → Create (bright,
// playful) → Work (tight, percussive) → Grow (wide arps) → Make it yours (a build) → Finale (full hook) → final held chord.
// A riser, a 60 ms suck-out and an impact on every act start; every act EVENT gets a designed sound on its exact sample.
// Deterministic; re-run after the acts change:  node scripts/mks/music.ts   (MKS_EVENTS=<file.ts> for synthetic test events)
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {ACTS, BAR, BEAT, DURATION, FPS, mulberry32} from '../../src/mks/timing.ts';
import * as D from './dsp.ts';

const t0 = performance.now(); // timing report only
const SR = D.SR;
const N = Math.round((DURATION / FPS) * SR); // 5,292,000
const at = (f: number) => (f / FPS) * SR; // global frame → sample (fractional)
const bs = (bar: number, beat = 0) => at(bar * BAR + beat * BEAT); // bar + beat (fractional) → sample
const SUCK = 0.06 * SR; // the suck-out before every impact
const OUT = path.resolve(import.meta.dirname, '../../public/mks/music.wav');

const EV = await D.loadEvents();
const END = D.finalChordFrame(EV); // final held chord (end-card lock)
const SCORE_IMPACTS = D.scoreImpacts(EV); // 600 1440 2880 3840 4800 6000 (+ END when no act impact marks it)
const IMPACTS = [...new Set([...SCORE_IMPACTS, ...EV.filter((e) => e.kind === 'impact').map((e) => e.g)])].sort((a, b) => a - b);
const nextImpact = (g: number) => IMPACTS.find((f) => f > g + 6 && f - g <= 600);
const SWELL_TARGETS = new Set(EV.filter((e) => e.kind === 'swell').map((e) => nextImpact(e.g)));
const near = (kind: string, g: number, tol: number) => EV.some((e) => e.kind === kind && Math.abs(e.g - g) <= tol);

// ---------------- harmony ----------------
type Ch = 'C' | 'Am' | 'F' | 'G';
const H: Record<Ch, {root: number; rh: number[]; pad: number[]; arp: number[]}> = {
  C: {root: 36, rh: [48, 55, 59, 64], pad: [60, 64, 67, 71], arp: [60, 64, 67, 71]}, // Cmaj7
  Am: {root: 33, rh: [45, 55, 60, 64], pad: [57, 60, 64, 67], arp: [57, 60, 64, 67]}, // Am7
  F: {root: 29, rh: [41, 52, 57, 60, 64], pad: [53, 57, 60, 64], arp: [53, 57, 60, 64]}, // Fmaj7
  G: {root: 31, rh: [43, 50, 59, 64], pad: [55, 59, 62, 64], arp: [55, 59, 62, 67]}, // G6
};
const LOOP: Ch[] = ['C', 'Am', 'F', 'G'];
const PHRASE_STARTS = [5, 12, 24, 32, 40, 50]; // every act from the drop on starts its phrase on Cmaj7
const chordAt = (g: number): Ch => {
  if (g >= END) return 'C';
  const bar = Math.floor(g / BAR);
  const beat = (g - bar * BAR) / BEAT;
  if (bar < 5) return bar < 2 ? 'Am' : bar < 4 ? 'F' : 'G'; // cold open: Am → F → G, resolving on the drop
  if (bar === 11) return beat < 2 ? 'F' : 'G'; // turnaround into Create
  if (bar === 48) return 'F'; // the build: IV → V
  if (bar === 49) return 'G';
  return LOOP[(bar - PHRASE_STARTS.filter((b) => b <= bar).at(-1)!) % 4];
};
const segs = (bar: number) => {
  const a = chordAt(bar * BAR);
  const b = chordAt(bar * BAR + 2 * BEAT);
  return a === b ? [{beat: 0, len: 4, ch: a}] : [{beat: 0, len: 2, ch: a}, {beat: 2, len: 2, ch: b}];
};

// ---------------- buses ----------------
const M = D.makeOut(N); // music bed: drums, bass, hook, risers (+ the shared music reverb send)
const P: D.Out = {L: new Float64Array(N), R: new Float64Array(N), sendL: M.sendL, sendR: M.sendR}; // pumped by the kick
const S = D.makeOut(N); // sound design: every event + the score's impacts and transition whooshes (never gated)
const F = D.makeOut(N); // the final held chord (own long reverb)
const kicks: {s: number; depth: number}[] = [];
const kick = (s: number, vol: number, depth = 0.35) => {
  D.kick(M, s, vol);
  kicks.push({s, depth});
};

// ---------------- motifs + parts ----------------
const HOOK = [79, 84, 86, 88, 84]; // G5 C6 D6 E6 C6 — the five-note hook
const ANSWER = [88, 86, 84, 86, 79]; // its mirror: E6 D6 C6 D6 G5
const HOOK_AT = [0, 3, 6, 8, 10]; // sixteenth positions in the bar (dotted-eighth push, then straight)
function hook(bar: number, vol: number, o: {answer?: boolean; oct?: number; echo?: number; dur?: number; bright?: number; glk?: number} = {}) {
  const notes = o.answer ? ANSWER : HOOK;
  const bright = o.bright ?? 0.75;
  const echo = o.echo ?? 1;
  HOOK_AT.forEach((p, k) => {
    const s = bs(bar, p / 4);
    const m = notes[k];
    D.hookPluck(M, s, m, o.dur ?? 0.16, vol, k % 2 ? 0.15 : -0.15, 0.22, bright);
    if (o.oct) D.hookPluck(M, s, m - 12, o.dur ?? 0.16, vol * o.oct, 0, 0.18, bright * 0.7);
    if (o.glk) D.glock(M, s, m + 12, vol * o.glk, k % 2 ? 0.4 : -0.4, 0.4);
    if (echo) {
      // dotted-eighth delay, ping-ponged and darker
      D.hookPluck(M, s + 0.375 * SR, m, 0.1, vol * 0.28 * echo, 0.65, 0.35, bright * 0.45);
      D.hookPluck(M, s + 0.75 * SR, m, 0.1, vol * 0.12 * echo, -0.65, 0.4, bright * 0.3);
    }
  });
}
function chords(bar: number, o: {rh?: number; rhDur?: number; pad?: number; lp?: [number, number]; att?: number; sub?: number; bass?: number}) {
  for (const sg of segs(bar)) {
    const c = H[sg.ch];
    const s = bs(bar, sg.beat);
    const d = sg.len * 0.5;
    if (o.rh) D.rhodesChord(P, s, c.rh, Math.min(d, o.rhDur ?? d) - 0.02, o.rh, 0.3);
    if (o.pad) D.pad(P, s, c.pad, d, o.pad, {lp0: o.lp?.[0] ?? 900, lp1: o.lp?.[1] ?? 2200, att: o.att ?? 0.06, rel: 0.35, send: 0.45});
    if (o.sub) D.sub(P, s, c.root, d - 0.05, o.sub);
    if (o.bass) for (let b = sg.beat; b < sg.beat + sg.len; b++) D.bassPulse(M, bs(bar, b + 0.5), c.root + 12, 0.18, o.bass);
  }
}
const ch = (bar: number, beat: number) => H[chordAt(bar * BAR + beat * BEAT)];
const rhStabs = (bar: number, beats: number[], vol: number, dur = 0.12) => beats.forEach((b) => D.rhodesChord(P, bs(bar, b), ch(bar, b).rh.slice(-3).map((m) => m + 12), dur, vol, 0.25));
const HAT_V = [0.55, 0.28, 1, 0.3];
const hats16 = (bar: number, vol: number, from = 0, to = 16) => {
  for (let j = from; j < to; j++) D.hat(M, bs(bar, j / 4), vol * HAT_V[j % 4], false, 0.25);
};
const hats8 = (bar: number, vol: number) => {
  for (let j = 0; j < 8; j++) D.hat(M, bs(bar, j / 2), vol * (j % 2 ? 1 : 0.5), false, 0.25);
};
const openHats = (bar: number, vol: number, beats = 4) => {
  for (let b = 0; b < beats; b++) D.hat(M, bs(bar, b + 0.5), vol, true, -0.2);
};
const four = (bar: number, vol: number, depth: number, beats = 4) => {
  for (let b = 0; b < beats; b++) kick(bs(bar, b), vol, depth);
};
const claps = (bar: number, vol: number) => [1, 3].forEach((b) => D.clap(M, bs(bar, b), vol, 0));
const roll = (bar: number, b0: number, b1: number, v0: number, v1: number, step = 0.25) => {
  for (let b = b0; b < b1 - 1e-9; b += step) D.snare(M, bs(bar, b), v0 + ((v1 - v0) * (b - b0)) / (b1 - b0), 0, 0.2);
};
const ZIG = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 2, 3];
function arp16(bar: number, vol: number, bright = 0.5) {
  for (let j = 0; j < 16; j++) {
    const c = ch(bar, j / 4);
    const tones = [...c.arp, ...c.arp.map((m) => m + 12)];
    D.hookPluck(P, bs(bar, j / 4), tones[ZIG[j]], 0.09, vol * (j % 4 === 0 ? 1 : 0.75), j % 2 ? 0.55 : -0.55, 0.5, bright);
  }
}
// A one-bar (or longer) riser into a chapter impact, hard-cut at the suck-out — unless an act swell already targets it.
function chapterRiser(f: number, bars: number, vol = 0.2) {
  if (SWELL_TARGETS.has(f)) return;
  const so = at(f) - SUCK;
  D.riser(M, at(f - bars * BAR), so, vol, 400, 10000);
  D.riser(M, at(f - 60), so, vol * 0.5, 3000, 14000); // reverse-cymbal air on the last beat
}

// ---------------- 0 · Cold open (bars 0–4): low pulse, heartbeat, tension; riser + suck-out into the drop ----------------
function coldOpen() {
  const so = at(600) - SUCK;
  for (let j = 0; j < 39; j++) {
    const u = j / 38;
    D.lowPulse(M, bs(0, j / 2), H[chordAt(j * 15)].root + 12, 0.2, 0.035 + 0.1 * u, 160 + 800 * u * u);
  }
  for (let bar = 0; bar < 5; bar++)
    for (const b of bar < 4 ? [0, 2] : [0, 1, 2, 3]) {
      const v = 0.36 + 0.08 * bar;
      D.heart(M, bs(bar, b), v);
      D.heart(M, bs(bar, b + 0.3), v * 0.55);
    }
  D.pad(M, bs(0), [57, 60, 64, 71], 4, 0.18, {lp0: 220, lp1: 900, att: 2.6, rel: 0.5, send: 0.55}); // Am(add9)
  D.pad(M, bs(2), [53, 57, 60, 64, 71], 4, 0.2, {lp0: 900, lp1: 1500, att: 0.4, rel: 0.5, send: 0.55}); // Fmaj7#11
  D.pad(M, bs(4), [55, 60, 62, 67], (so - bs(4)) / SR, 0.28, {lp0: 1500, lp1: 5000, att: 0.15, rel: 0.01, send: 0.55}); // Gsus4
  D.strand(M, bs(0, 2), 83, (so - bs(0, 2)) / SR, 0.035, 0.3); // a high B that never resolves
  D.shepard(M, bs(3), so, 0.22, {center: 520, rate0: 0.25, rate1: 1.5, env: (u) => 0.08 + 0.92 * u ** 1.7});
  D.riser(M, bs(4), so, 0.22, 300, 11000);
}

// ---------------- 1 · Reveal (bars 5–11): THE DROP — full beat, hook enters ----------------
function reveal() {
  for (let bar = 5; bar <= 11; bar++) {
    const last = bar === 11;
    chords(bar, {rh: 0.34, pad: 0.2, lp: [1400, 3200], sub: 0.24, bass: 0.26});
    four(bar, 0.72, 0.42, last ? 3 : 4);
    claps(bar, 0.42);
    hats16(bar, 0.12, 0, last ? 8 : 16);
    openHats(bar, 0.07, last ? 2 : 4);
    rhStabs(bar, [1.5, 3.5], 0.13);
    hook(bar, 0.2, {answer: (bar - 5) % 2 === 1, oct: 0.45});
    if (last) roll(bar, 2, 4, 0.1, 0.34);
  }
  chapterRiser(1440, 1);
}

// ---------------- 2 · Create (bars 12–23): bright and playful — hook ↔ glockenspiel, bouncy bass, snaps, shaker ----------------
function create() {
  for (let bar = 12; bar <= 23; bar++) {
    const last = bar === 23;
    const lift = bar >= 20;
    const odd = (bar - 12) % 2 === 1;
    chords(bar, {pad: 0.12, lp: [1800, 3000], sub: 0.16});
    rhStabs(bar, [0, 1.5, 3], 0.2, 0.22);
    for (const p of last ? [0, 6] : [0, 6, 8]) kick(bs(bar, p / 4), 0.68, 0.3);
    for (const b of last ? [1] : [1, 3]) {
      D.snap(M, bs(bar, b), 0.3, 0.1);
      if (lift) D.clap(M, bs(bar, b), 0.26, 0);
    }
    for (let j = 0; j < (last ? 8 : 16); j++) D.shaker(M, bs(bar, j / 4), 0.09 * HAT_V[j % 4], 0.3);
    if (lift && !last) openHats(bar, 0.06);
    [0, 3, 6, 8, 11, 14].forEach((p, k) => {
      const c = ch(bar, p / 4);
      D.bounceBass(M, bs(bar, p / 4), c.root + [12, 24, 19, 12, 24, 19][k], 0.13, 0.3);
    });
    if (odd) [2, 6, 10, 14].forEach((p, k) => D.glock(M, bs(bar, p / 4), ch(bar, p / 4).pad[[1, 2, 3, 2][k]] + 24, 0.055, k % 2 ? 0.45 : -0.45, 0.4));
    else hook(bar, 0.2, {bright: 0.85});
    if (last) roll(bar, 2, 4, 0.08, 0.3);
  }
  chapterRiser(2880, 1);
}

// ---------------- 3 · Work (bars 24–31): tighter and percussive — dry, syncopated kick, rims, 16th sequencer ----------------
function work() {
  for (let bar = 24; bar <= 31; bar++) {
    const last = bar === 31;
    chords(bar, {pad: 0.1, lp: [700, 1300], sub: 0.2});
    for (const p of last ? [0, 7] : [0, 7, 10]) kick(bs(bar, p / 4), 0.7, 0.3);
    for (const p of last ? [4] : [4, 12]) D.snare(M, bs(bar, p / 4), 0.34, 0, 0.06);
    for (const p of [3, 9, 14]) D.rim(M, bs(bar, p / 4), 0.13, p === 9 ? 0.4 : -0.4);
    hats16(bar, 0.12, 0, last ? 8 : 16);
    for (let j = 0; j < 16; j++) {
      const a = ch(bar, j / 4).arp;
      D.hookPluck(P, bs(bar, j / 4), [a[0] + 12, a[2], a[0] + 24, a[2] + 12][j % 4], 0.05, j % 2 ? 0.075 : 0.1, j % 2 ? 0.35 : -0.35, 0.08, 0.3);
    }
    for (let j = 0; j < 8; j++) D.bassPulse(M, bs(bar, j / 2), ch(bar, j / 2).root + 12, 0.09, j % 2 ? 0.24 : 0.14);
    rhStabs(bar, [0, 1.5], 0.21, 0.1);
    if ([26, 27, 30, 31].includes(bar)) hook(bar, 0.17, {answer: bar % 2 === 1, dur: 0.07, bright: 0.45, echo: 0.5});
    if (last) roll(bar, 2, 4, 0.1, 0.32);
  }
  chapterRiser(3840, 1);
}

// ---------------- 4 · Grow (bars 32–39): expansive — 16th arps across two octaves, wide pad, open drums ----------------
function grow() {
  for (let bar = 32; bar <= 39; bar++) {
    const last = bar === 39;
    chords(bar, {rh: 0.28, pad: 0.24, lp: [1800, 4800], att: 0.3, sub: 0.22, bass: 0.18});
    four(bar, 0.62, 0.4, last ? 3 : 4);
    claps(bar, 0.36);
    openHats(bar, 0.11, last ? 2 : 4);
    hats8(bar, 0.07);
    arp16(bar, 0.075);
    if (bar >= 36) for (let j = 0; j < 8; j++) D.glock(M, bs(bar, j / 2), ch(bar, j / 2).arp[[0, 2, 3, 2, 1, 2, 3, 2][j]] + 24, 0.03, j % 2 ? 0.6 : -0.6, 0.55);
    if ([34, 35, 38, 39].includes(bar)) hook(bar, 0.2, {answer: bar % 2 === 1, oct: 0.5, echo: 1.3});
    if (last) roll(bar, 2, 4, 0.08, 0.3);
  }
  chapterRiser(4800, 1);
}

// ---------------- 5 · Make it yours (bars 40–49): a build — layers every two bars, then IV → V with an accelerating roll ----------------
function yours() {
  for (let bar = 40; bar <= 47; bar++) {
    const k = bar - 40;
    chords(bar, {rh: 0.32, pad: k < 4 ? 0.12 : 0.18, lp: [1000 + k * 200, 2200 + k * 400], sub: k >= 4 ? 0.2 : 0, bass: k >= 2 ? 0.2 : 0});
    if (k < 4) [0, 2].forEach((b) => kick(bs(bar, b), 0.5, 0.2));
    else four(bar, 0.66, 0.4);
    if (k >= 2 && k < 4) hats8(bar, 0.08);
    if (k >= 4) hats16(bar, 0.1);
    if (k >= 4) claps(bar, 0.36);
    if (k >= 6) arp16(bar, 0.06);
    hook(bar, 0.15 + 0.01 * k, {answer: k < 6 && k % 2 === 1, oct: k >= 4 ? 0.4 : 0, echo: 1.2});
  }
  // bar 48 (Fmaj7) and 49 (G6): pad opening, roll 8ths → 16ths → 32nds, the hook's first four notes climbing
  const so = at(6000) - SUCK;
  for (const bar of [48, 49]) {
    const c = H[chordAt(bar * BAR)];
    D.rhodesChord(P, bs(bar), c.rh, 1.95, 0.3, 0.3);
    D.pad(P, bs(bar), c.pad.map((m) => m + 12), bar === 49 ? (so - bs(bar)) / SR : 2, 0.2, {lp0: bar === 48 ? 1500 : 4000, lp1: bar === 48 ? 4000 : 10000, att: 0.05, rel: bar === 49 ? 0.01 : 0.3, send: 0.45});
    D.sub(P, bs(bar), c.root, bar === 49 ? (so - bs(bar)) / SR - 0.15 : 1.95, 0.22);
    four(bar, 0.68, 0.4);
    hats16(bar, bar === 48 ? 0.1 : 0.13);
    claps(bar, 0.34);
  }
  hook(48, 0.2, {oct: 0.45});
  roll(48, 0, 4, 0.08, 0.16, 0.5);
  roll(49, 0, 2, 0.16, 0.26, 0.25);
  roll(49, 2, 4, 0.26, 0.46, 0.125);
  for (let j = 0; j < 16; j++) D.hookPluck(M, bs(49, j / 4), HOOK[j % 4] + (j >= 8 ? 12 : 0), 0.08, 0.08 + 0.1 * (j / 15), j % 2 ? 0.3 : -0.3, 0.3, 0.6 + 0.3 * (j / 15));
  if (!SWELL_TARGETS.has(6000)) {
    D.shepard(M, bs(48), so, 0.2, {center: 600, rate0: 0.35, rate1: 1.8, env: (u) => 0.1 + 0.9 * u ** 1.5});
    D.riser(M, bs(48, 2), so, 0.24, 300, 12000);
  }
}

// ---------------- 6 · Finale (bars 50 → END): the full hook, then the final held chord ----------------
function finale() {
  for (let bar = 50; bs(bar) < at(END) - 1; bar++) {
    const last = bs(bar + 1) >= at(END) - 1; // the bar that runs into the final chord
    chords(bar, {rh: 0.34, pad: 0.22, lp: [1800, 4200], sub: 0.25, bass: 0.26});
    four(bar, 0.74, 0.45, last ? 3 : 4);
    claps(bar, 0.42);
    [1, 3].forEach((b) => D.snare(M, bs(bar, b), 0.16, 0, 0.2));
    hats16(bar, 0.12, 0, last ? 8 : 16);
    openHats(bar, 0.08, last ? 2 : 4);
    arp16(bar, 0.045, 0.6);
    hook(bar, 0.22, {oct: 0.5, glk: 0.22});
    if (bar === 54) D.crash(M, bs(bar), 0.14, 2.4);
    if (last) roll(bar, 2, 4, 0.1, 0.34);
  }
  chapterRiser(END, 1);
  // the final held chord: Cmaj9 on Rhodes, pad, sub and bells, ringing out to 120 s
  const s = at(END);
  const hold = (N - s) / SR - 2.6;
  D.rhodesChord(F, s, [48, 55, 59, 62, 64], 3.2, 0.36, 0.5);
  D.pad(F, s, [48, 55, 59, 62, 64, 67, 71], hold, 0.4, {lp0: 3800, lp1: 900, att: 0.03, rel: 2.2, send: 0.6});
  D.sub(F, s, 36, Math.min(4, hold), 0.2);
  [84, 88, 91, 95, 98].forEach((m, j) => D.bell(F, s + j * 0.03 * SR, m, 0.05, 3.5, j % 2 ? 0.55 : -0.55, 2, 1.1, 0.8));
  // sign-off: the hook once more, at half speed, on glass
  HOOK.forEach((m, k) => D.glass(F, s + (2 + HOOK_AT[k] * 0.25) * SR, m, 0.07, k % 2 ? 0.35 : -0.35, 0.7));
}

// ---------------- sound design: every act event on its exact sample ----------------
const TICK = [79, 81, 84, 86, 88, 91, 93, 96, 98, 100]; // the hook's pentatonic scale, G5 upward
function impactSfx(s: number, v: number, c: (typeof H)[Ch]) {
  D.boom(S, s, 0.85 * v, 3);
  D.thump(S, s, 0.45 * v);
  D.crack(S, s, 0.4 * v);
  D.sub(S, s, c.root, 1.1, 0.2 * v);
  D.crash(S, s, 0.15 * v, 2.6);
  c.pad.map((m) => m + 24).forEach((m, j) => D.bell(S, s + j * 0.025 * SR, m, 0.045 * v, 2.8, j % 2 ? 0.6 : -0.6, 2, 1.1, 0.8));
}
function hitSfx(s: number, v: number, c: (typeof H)[Ch]) {
  D.hit(S, s, 0.55 * v);
  D.crack(S, s, 0.45 * v);
  D.stab(S, s, c.pad.map((m) => m + 12), 0.16, 0.24 * v, 0.3);
}
function events() {
  const rnd = mulberry32(2026);
  let run = 0;
  let lastTick = -1e9;
  for (const e of EV) {
    const s = at(e.g);
    const v = e.gain ?? 1;
    const c = H[chordAt(e.g)];
    switch (e.kind) {
      case 'click':
        D.uiClick(S, s, 0.42 * v, (rnd() - 0.5) * 0.3);
        break;
      case 'key':
        D.keyThock(S, s, 0.75 * v, (rnd() - 0.5) * 0.2);
        break;
      case 'type':
        D.typeTick(S, s, 0.2 * v, (rnd() * 2 - 1) * 1.5, (rnd() - 0.5) * 0.4);
        break;
      case 'tick':
        run = e.g - lastTick <= 2 * BEAT ? Math.min(run + 1, TICK.length - 1) : 0;
        lastTick = e.g;
        D.glass(S, s, TICK[run], 0.13 * v, run % 2 ? 0.25 : -0.25);
        break;
      case 'whoosh':
        D.whoosh(S, s, 0.2 * v);
        break;
      case 'hit':
        hitSfx(s, v, c);
        break;
      case 'impact':
        impactSfx(s, v, c);
        break;
      case 'swell': {
        const nxt = nextImpact(e.g);
        const s1 = nxt !== undefined ? at(nxt) - SUCK : s + 2 * SR;
        if (s1 - s < 0.2 * SR) break;
        D.shepard(M, s, s1, 0.16 * v, {center: 560, rate0: 0.35, rate1: 1.4, env: (u) => 0.05 + 0.95 * u ** 1.6});
        D.riser(M, s, s1, 0.2 * v, 350, 11000);
        break;
      }
    }
  }
  // the score's own impacts (act starts + final chord) and the transition whooshes, unless an act already places them
  for (const f of SCORE_IMPACTS) if (!near('impact', f, 2)) impactSfx(at(f), f === 600 || f >= 6000 ? 1.15 : 1, H[chordAt(f)]);
  for (const f of [1440, 4800]) if (!near('whoosh', f, 3)) D.whoosh(S, at(f), 0.2);
  if (!near('whoosh', 2880, 3)) D.whoosh(S, at(2880), 0.24, 0.25, 0.18);
}

coldOpen();
reveal();
create();
work();
grow();
yours();
finale();
events();
console.log(`synthesized in ${((performance.now() - t0) / 1000).toFixed(1)} s · ${EV.length} events · final chord @ f${END}`);

// ---------------- bed control: kick pump, suck-outs, ducking ----------------
const pump = new Float32Array(N).fill(1);
for (const k of kicks) {
  const c = Math.round(k.s);
  for (let j = -130; j < 0.32 * SR; j++) {
    const i = c + j;
    if (i < 0 || i >= N) continue;
    const v = 1 - k.depth * (j < 0 ? (j + 130) / 130 : Math.exp(-j / (0.1 * SR)));
    if (v < pump[i]) pump[i] = v;
  }
}
const gate = new Float32Array(N).fill(1);
const cutBefore = (f: number) => {
  const c = Math.round(at(f));
  const a = c - Math.round(SUCK);
  const r = Math.round(0.004 * SR);
  for (let i = Math.max(0, a - r); i < Math.min(N, c + 22); i++) {
    const v = i < a ? (a - i) / r : i < c ? 0 : (i - c) / 22;
    if (v < gate[i]) gate[i] = v;
  }
};
for (const f of IMPACTS) cutBefore(f);
for (const e of EV) if (e.kind === 'hit') cutBefore(e.g);
gate.fill(0, Math.round(at(END) - SUCK)); // the bed ends in the suck-out before the final chord
// -6 dB under dense UI sound (≥3 within ±0.5 s), -5 dB under a lone click/key, -3 dB under a lone type/tick
const UI = EV.filter((e) => e.kind === 'click' || e.kind === 'key' || e.kind === 'type' || e.kind === 'tick');
const duckRaw = new Float32Array(N).fill(1);
for (const e of UI) {
  const dense = UI.filter((x) => Math.abs(x.g - e.g) <= 30).length >= 3;
  const depth = dense ? 0.5 : e.kind === 'click' || e.kind === 'key' ? 0.56 : 0.7;
  const c = Math.round(at(e.g));
  for (let i = Math.max(0, c - Math.round(0.05 * SR)); i < Math.min(N, c + Math.round(0.16 * SR)); i++) if (depth < duckRaw[i]) duckRaw[i] = depth;
}
const duck = new Float32Array(N);
{
  const h = Math.round(0.01 * SR);
  let acc = 0;
  for (let i = -h; i < N + h; i++) {
    if (i + h < N) acc += duckRaw[i + h];
    if (i - h - 1 >= 0) acc -= duckRaw[i - h - 1];
    if (i >= 0 && i < N) duck[i] = acc / (Math.min(N - 1, i + h) - Math.max(0, i - h) + 1);
  }
}

// ---------------- mix ----------------
const WET = 2.0;
const [mwL, mwR] = D.freeverb(M.sendL, M.sendR, 0.86, 0.3);
const [swL, swR] = D.freeverb(S.sendL, S.sendR, 0.82, 0.35);
const fa = Math.max(0, Math.round(at(END)) - 10);
const [fwL, fwR] = D.freeverb(F.sendL.subarray(fa), F.sendR.subarray(fa), 0.93, 0.25);
const mixL = new Float64Array(N);
const mixR = new Float64Array(N);
for (let i = 0; i < N; i++) {
  const g = gate[i] * duck[i];
  const bl = (M.L[i] + P.L[i] * pump[i] + WET * mwL[i]) * g;
  const br = (M.R[i] + P.R[i] * pump[i] + WET * mwR[i]) * g;
  const fl = F.L[i] + (i >= fa ? 2.2 * fwL[i - fa] : 0);
  const fr = F.R[i] + (i >= fa ? 2.2 * fwR[i - fa] : 0);
  mixL[i] = bl + S.L[i] + 1.6 * swL[i] + fl;
  mixR[i] = br + S.R[i] + 1.6 * swR[i] + fr;
}

// ---------------- master: -14 LUFS integrated, true peak < -1 dBTP ----------------
const lufs = (L: ArrayLike<number>, R: ArrayLike<number>, a = 0, b = N) => D.lufsRange(D.kPrefix(L), D.kPrefix(R), a, b);
const hp = [new D.BQ().set(1, 24, 0.7), new D.BQ().set(1, 24, 0.7)];
const fadeN = Math.round(1.5 * SR);
for (let i = 0; i < N; i++) {
  const k = N - 1 - i;
  const fade = k < fadeN ? 0.5 - 0.5 * Math.cos((Math.PI * k) / fadeN) : 1; // digital silence at exactly 120.0 s
  mixL[i] = hp[0].run(mixL[i]) * fade;
  mixR[i] = hp[1].run(mixR[i]) * fade;
}
const env = D.peakEnv(mixL);
const envR = D.peakEnv(mixR);
for (let i = 0; i < N; i++) env[i] = Math.max(env[i], envR[i]);
let gain = 10 ** ((-14 - lufs(mixL, mixR)) / 20);
let out = D.limit(mixL, mixR, env, gain, -1.5);
let loud = lufs(out[0], out[1]);
for (let it = 0; it < 8 && Math.abs(loud + 14) > 0.03; it++) {
  gain *= 10 ** ((-14 - loud) / 20);
  out = D.limit(mixL, mixR, env, gain, -1.5);
  loud = lufs(out[0], out[1]);
}
D.writeWav(OUT, out[0], out[1]);

// ---------------- report + verification ----------------
const pl = D.kPrefix(out[0]);
const pr = D.kPrefix(out[1]);
// limiter gain reduction per act (dB): how hard the transients are being squashed
const ceil = 10 ** (-1.5 / 20);
const gr = (a: number, b: number) => {
  const v: number[] = [];
  for (let i = a; i < b; i += 64) v.push(Math.max(0, 20 * Math.log10((env[i] * gain) / ceil)));
  v.sort((p, q) => p - q);
  return `GR p99 ${v[Math.floor(v.length * 0.99)].toFixed(1)} max ${v.at(-1)!.toFixed(1)} dB`;
};
console.log(`master gain ${(20 * Math.log10(gain)).toFixed(1)} dB · per act on the master:`);
for (const a of ACTS) {
  const [i0, i1] = [Math.round(at(a.start)), Math.round(at(a.end))];
  console.log(`  ${a.name.padEnd(14)} ${D.lufsRange(pl, pr, i0, i1).toFixed(1)} LUFS  ${gr(i0, i1)}`);
}
const ff = spawnSync('ffmpeg', ['-nostats', '-hide_banner', '-i', OUT, '-af', 'ebur128=peak=true', '-f', 'null', '-'], {encoding: 'utf8'});
const summary = ff.stderr.slice(ff.stderr.lastIndexOf('Summary:'));
const I_ = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
const LRA = Number(/LRA:\s+(-?[\d.]+) LU/.exec(summary)?.[1]);
const TP = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=sample_rate,channels,bits_per_sample:format=duration', '-of', 'default=nw=1', OUT], {encoding: 'utf8'}).stdout;
console.log(`ffmpeg ebur128: integrated ${I_} LUFS, LRA ${LRA} LU, true peak ${TP} dBTP | ${probe.replace(/\s+/g, ' ').trim()}`);
console.log(`→ ${OUT}  (${((performance.now() - t0) / 1000).toFixed(1)} s)`);
assert.ok(Math.abs(I_ + 14) <= 0.5, `integrated loudness ${I_} LUFS is not about -14`);
assert.ok(TP < -1, `true peak ${TP} dBTP is not below -1 dBTP`);
assert.ok(/duration=120\.0+\b/.test(probe), 'duration is not exactly 120.0 s');
