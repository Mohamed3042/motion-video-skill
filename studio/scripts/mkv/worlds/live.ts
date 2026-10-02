// World 3 · LIVE — four-on-the-floor house at 120 BPM (A minor), pumping sidechained bass, a filtered static
// first bar (the drift illusion), the drop on Live start, a filter rise into the Overdrive impact.
// Also exports the small synth toolkit the TTS world reuses (scripts/mkv/worlds/tts.ts).
import type {SynthCtx} from '../types.ts';
import {EVENTS, T} from '../../../src/mkv/worlds/live/timing.ts';

export const TAU = Math.PI * 2;
export const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);
const panG = (p: number) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];

export class BQ {
  b0 = 1; b1 = 0; b2 = 0; a1 = 0; a2 = 0; z1 = 0; z2 = 0;
  // 0 = lowpass, 1 = highpass, 2 = bandpass (0 dB peak)
  set(type: 0 | 1 | 2, f: number, q: number, SR = 44100) {
    const w = (TAU * Math.min(Math.max(f, 10), SR * 0.45)) / SR;
    const cs = Math.cos(w);
    const al = Math.sin(w) / (2 * q);
    const a0 = 1 + al;
    let b0: number, b1: number, b2: number;
    if (type === 0) [b0, b1, b2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2];
    else if (type === 1) [b0, b1, b2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
    else [b0, b1, b2] = [al, 0, -al];
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = (-2 * cs) / a0; this.a2 = (1 - al) / a0;
    return this;
  }
  run(x: number) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
}

// A world-local render buffer (covers the world plus margins), mixed into the track at the end.
export type Bus = {L: Float64Array; R: Float64Array};
export class Synth {
  SR: number;
  off: number; // global sample index of local sample 0
  N: number;
  dry: Bus;
  pump: Bus; // ducked by the kick (sidechain)
  send: Bus;
  kicks: number[] = []; // local sample indices
  gaps: number[] = []; // local sample indices of impacts/hits: the bed is cut in the 60 ms before each one
  private seed: number;
  ctx: SynthCtx;
  constructor(ctx: SynthCtx, seed: number, pre = -40, post = 90) {
    this.ctx = ctx;
    this.SR = ctx.SR;
    this.off = Math.max(0, Math.floor(ctx.at(pre)));
    this.N = Math.min(ctx.L.length, Math.ceil(ctx.at(ctx.length + post))) - this.off;
    const bus = () => ({L: new Float64Array(this.N), R: new Float64Array(this.N)});
    this.dry = bus();
    this.pump = bus();
    this.send = bus();
    this.seed = seed;
  }
  rnd() {
    // mulberry32
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  noise() {
    return this.rnd() * 2 - 1;
  }
  // local sample index of a world-local frame (exact; impacts start on this sample)
  s(f: number) {
    return Math.round(this.ctx.at(f)) - this.off;
  }
  sec(x: number) {
    return Math.round(x * this.SR);
  }
  // place a mono voice: fn(t) = sample at local time t (s)
  put(b: Bus, i0: number, len: number, pan: number, send: number, fn: (t: number) => number) {
    const [gl, gr] = panG(pan);
    for (let k = 0; k < len; k++) {
      const i = i0 + k;
      if (i >= this.N) break;
      const v = fn(k / this.SR);
      if (i < 0) continue;
      b.L[i] += v * gl;
      b.R[i] += v * gr;
      if (send) {
        this.send.L[i] += v * gl * send;
        this.send.R[i] += v * gr * send;
      }
    }
  }

  // ---------------- instruments (all onsets sample-exact on a frame) ----------------
  kick(f: number, vol: number, lp = 0) {
    let ph = 0;
    const i0 = this.s(f);
    this.kicks.push(i0);
    const flt = lp ? new BQ().set(0, lp, 0.7) : null;
    this.put(this.dry, i0, this.sec(0.42), 0, 0, (t) => {
      ph += (TAU * (48 + 130 * Math.exp(-t / 0.028))) / this.SR;
      const v = Math.sin(ph) * Math.exp(-t / 0.19) * Math.min(1, t * 2500) + (t < 0.003 ? 0.4 * this.noise() * (1 - t / 0.003) : 0);
      return vol * (flt ? flt.run(v) : v);
    });
  }
  clap(f: number, vol: number, pan = 0, send = 0.2) {
    const bp = new BQ().set(2, 1300, 0.9);
    this.put(this.dry, this.s(f), this.sec(0.32), pan, send, (t) => {
      let e = 0;
      for (const o of [0, 0.01, 0.021]) if (t >= o) e = Math.max(e, Math.exp(-(t - o) / 0.006));
      if (t > 0.021) e = Math.max(e, 0.45 * Math.exp(-(t - 0.021) / 0.075));
      return vol * 2.6 * bp.run(this.noise()) * e;
    });
  }
  hat(f: number, vol: number, open = false, pan = 0.25) {
    const hp = new BQ().set(1, 7800, 0.7);
    this.put(this.dry, this.s(f), this.sec(open ? 0.28 : 0.06), pan, 0.03, (t) => vol * hp.run(this.noise()) * Math.exp(-t / (open ? 0.075 : 0.014)));
  }
  shaker(f: number, vol: number, pan = -0.3) {
    const bp = new BQ().set(2, 6000, 1.2);
    this.put(this.dry, this.s(f), this.sec(0.07), pan, 0.05, (t) => vol * bp.run(this.noise()) * Math.min(1, t / 0.006) * Math.exp(-t / 0.02));
  }
  // saw bass through a resonant lowpass with a pluck envelope (goes to the pump bus)
  bass(f: number, m: number, dur: number, vol: number, cut = 500) {
    const fq = mtof(m);
    const lp = new BQ();
    let ph = 0;
    let ph2 = 0;
    this.put(this.pump, this.s(f), this.sec(dur + 0.04), 0, 0, (t) => {
      ph = (ph + fq / this.SR) % 1;
      ph2 = (ph2 + (fq * 1.005) / this.SR) % 1;
      if ((Math.round(t * this.SR) & 15) === 0) lp.set(0, cut * (1 + 3 * Math.exp(-t / 0.05)), 2.2);
      const e = Math.min(1, t / 0.003) * Math.exp(-t / 0.22) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.04) : 1);
      return vol * e * (lp.run(ph + ph2 - 1) * 0.9 + Math.sin(TAU * fq * t) * 0.6);
    });
  }
  // detuned-saw chord stab (house organ-ish), lowpass with envelope
  stab(f: number, notes: number[], vol: number, cut = 2200, dur = 0.16, send = 0.35) {
    notes.forEach((m, j) => {
      [-9, 0, 9].forEach((ct) => {
        const fq = mtof(m) * 2 ** (ct / 1200);
        let ph = this.rnd();
        const lp = new BQ().set(0, cut, 1.1);
        this.put(this.pump, this.s(f), this.sec(dur + 0.25), (j / (notes.length - 1)) * 1.2 - 0.6, send, (t) => {
          ph = (ph + fq / this.SR) % 1;
          const e = Math.min(1, t / 0.004) * (t < dur ? Math.exp(-t / (dur * 1.6)) : Math.exp(-dur / (dur * 1.6)) * Math.exp(-(t - dur) / 0.05));
          return (vol / notes.length / 3) * e * lp.run(2 * ph - 1) * 2;
        });
      });
    });
  }
  // sustained pad (detuned saws, lowpass sweep lp0 -> lp1); `vowel` turns it into a formant "choir" synth
  pad(notes: number[], f0: number, f1: number, o: {vol: number; lp0?: number; lp1?: number; att?: number; rel?: number; send?: number; vowel?: (f: number) => [number[], number[]]; bus?: Bus}) {
    const att = o.att ?? 0.3;
    const rel = o.rel ?? 0.5;
    const t1 = (f1 - f0) / 60;
    notes.forEach((m, j) => {
      [-8, 0, 8].forEach((ct, v) => {
        const fq = mtof(m) * 2 ** (ct / 1200);
        const dt = fq / this.SR;
        let ph = this.rnd();
        const lp = new BQ();
        const fm = [new BQ(), new BQ(), new BQ()];
        let gains = [1, 0.5, 0.25];
        const pan = Math.max(-0.9, Math.min(0.9, (j % 2 ? 0.35 : -0.35) + (v - 1) * 0.3));
        this.put(o.bus ?? this.pump, this.s(f0), this.sec(t1 + rel), pan, o.send ?? 0.3, (t) => {
          ph += dt;
          if (ph >= 1) ph -= 1;
          let sw = 2 * ph - 1;
          if (ph < dt) { const x = ph / dt; sw -= x + x - x * x - 1; } else if (ph > 1 - dt) { const x = (ph - 1) / dt; sw -= x * x + x + x + 1; }
          let y: number;
          if ((Math.round(t * this.SR) & 31) === 0) {
            if (o.vowel) {
              const [F, Gs] = o.vowel(f0 + t * 60);
              gains = Gs;
              fm.forEach((bq, q) => bq.set(2, F[q], 6));
            } else {
              const u = Math.min(1, t / Math.max(0.01, t1));
              lp.set(0, (o.lp0 ?? 900) * ((o.lp1 ?? 900) / (o.lp0 ?? 900)) ** u, 0.8);
            }
          }
          if (o.vowel) y = (fm[0].run(sw) * gains[0] + fm[1].run(sw) * gains[1] + fm[2].run(sw) * gains[2]) * 2.4;
          else y = lp.run(sw);
          const e = t < att ? Math.sin(((t / att) * Math.PI) / 2) : t > t1 ? Math.max(0, 1 - (t - t1) / rel) : 1;
          return (y * e * o.vol) / notes.length;
        });
      });
    });
  }
  sub(f0: number, m: number, f1: number, vol: number) {
    const fq = mtof(m);
    const d = (f1 - f0) / 60;
    this.put(this.pump, this.s(f0), this.sec(d + 0.1), 0, 0, (t) => vol * Math.sin(TAU * fq * t) * Math.min(1, t / 0.02) * (t > d ? Math.max(0, 1 - (t - d) / 0.1) : 1));
  }
  // FM bell / glass
  bell(f: number, m: number, vol: number, dur = 1.2, pan = 0, ratio = 3.5, idx = 2, send = 0.35, off = 0) {
    const fq = mtof(m);
    this.put(this.dry, this.s(f) + this.sec(off), this.sec(dur), pan, send, (t) =>
      vol * Math.min(1, t * 600) * Math.exp(-t / (dur * 0.28)) * Math.sin(TAU * fq * t + idx * Math.exp(-t / 0.2) * Math.sin(TAU * fq * ratio * t)),
    );
  }
  // Karplus-Strong pluck (glassy when bright + bell overtone)
  pluck(f: number, m: number, vol: number, pan = 0, send = 0.3, bright = 0.6, decay = 0.996, len = 1.2) {
    const L = Math.max(2, Math.round(this.SR / mtof(m)));
    const buf = new Float64Array(L);
    let lpv = 0;
    for (let j = 0; j < L; j++) {
      lpv += bright * (this.noise() - lpv);
      buf[j] = lpv;
    }
    let idx = 0;
    let prev = 0;
    this.put(this.dry, this.s(f), this.sec(len), pan, send, (t) => {
      const cur = buf[idx];
      buf[idx] = (cur + prev) * 0.5 * decay;
      prev = cur;
      idx = (idx + 1) % L;
      return vol * cur * Math.min(1, t * 4000) * Math.min(1, (len - t) * 20);
    });
  }
  // cinematic impact: pitch-dropping sub + crack + rumble, onset exactly on the frame
  boom(f: number, vol: number, len = 2.2) {
    let ph = 0;
    const lp = new BQ().set(0, 2400, 0.7);
    const lp2 = new BQ().set(0, 140, 0.7);
    this.put(this.dry, this.s(f), this.sec(len), 0, 0.25, (t) => {
      ph += (TAU * (34 + 100 * Math.exp(-t / 0.07))) / this.SR;
      const n = this.noise();
      return vol * Math.min(1, t * 2500) * (Math.sin(ph) * Math.exp(-t / 0.55) + lp.run(n) * Math.exp(-t / 0.045) * 0.9 + lp2.run(n) * Math.exp(-t / 0.5) * 2);
    });
  }
  // short punchy hit
  hit(f: number, vol: number, tone = 1800) {
    let ph = 0;
    const bp = new BQ().set(2, tone, 0.8);
    this.put(this.dry, this.s(f), this.sec(0.6), 0, 0.25, (t) => {
      ph += (TAU * (44 + 150 * Math.exp(-t / 0.022))) / this.SR;
      return vol * Math.min(1, t * 3000) * (Math.sin(ph) * Math.exp(-t / 0.22) + 1.7 * bp.run(this.noise()) * Math.exp(-t / 0.04));
    });
  }
  // UI toggle / switch click: plastic tick + low thock
  click(f: number, vol: number, freq = 2600, pan = 0) {
    this.put(this.dry, this.s(f), this.sec(0.07), pan, 0.08, (t) =>
      vol * (Math.sin(TAU * freq * t) * Math.exp(-t / 0.005) + this.noise() * Math.exp(-t / 0.0012) * 0.5 + 0.7 * Math.sin(TAU * 190 * t) * Math.exp(-t / 0.012)),
    );
  }
  // noise whoosh whose energy peaks exactly on frame f
  whoosh(f: number, vol: number, len = 0.5, pan0 = -0.7, pan1 = 0.7) {
    const center = this.s(f);
    const pre = this.sec(len * 0.8);
    const post = this.sec(len * 0.45);
    const bp = new BQ();
    const bp2 = new BQ();
    for (let k = -pre; k < post; k++) {
      const i = center + k;
      if (i < 0 || i >= this.N) continue;
      let amp: number;
      let fc: number;
      if (k < 0) {
        const u = 1 + k / pre;
        amp = u ** 3;
        fc = 280 * (5000 / 280) ** u;
      } else {
        const tt = k / this.SR;
        amp = Math.exp(-tt / 0.06);
        fc = 900 + 4100 * Math.exp(-tt / 0.12);
      }
      if ((k & 15) === 0) {
        bp.set(2, fc, 1.3);
        bp2.set(2, fc * 0.45, 1);
      }
      const n = this.noise();
      const v = vol * amp * (bp.run(n) * 1.7 + bp2.run(n) * 0.8);
      const [gl, gr] = panG(pan0 + ((pan1 - pan0) * (k + pre)) / (pre + post));
      this.dry.L[i] += v * gl;
      this.dry.R[i] += v * gr;
      this.send.L[i] += v * gl * 0.25;
      this.send.R[i] += v * gr * 0.25;
    }
  }
  // filtered-noise + saw riser from f0 up to (not past) f1
  riser(f0: number, f1: number, vol: number, hz0 = 300, mult = 18) {
    const i0 = this.s(f0);
    const len = this.s(f1) - i0;
    const bp = new BQ();
    let ph = 0;
    this.put(this.dry, i0, len, 0, 0.08, (t) => {
      const u = t / (len / this.SR);
      if ((Math.round(t * this.SR) & 31) === 0) bp.set(2, hz0 * mult ** u, 1.4);
      ph += (TAU * 160 * 6 ** u) / this.SR;
      return vol * u * u * Math.min(1, (len / this.SR - t) * 300) * (bp.run(this.noise()) * 1.6 + Math.sin(ph) * 0.18 * u);
    });
  }

  // ---------------- mixdown: sidechain the pump bus, gain, peak limit, write into the track ----------------
  // clear the bed just before an impact/hit so its transient reads (global onset check: +6 dB vs the 50 ms before)
  gap(f: number) {
    this.gaps.push(this.s(f));
  }
  mix(gain: number, duck = 0.6, ceilDb = -6) {
    const pre = new Float64Array(this.N).fill(1);
    const W0 = this.sec(0.06);
    const R0 = this.sec(0.012);
    for (const i0 of this.gaps)
      for (let n = Math.max(0, i0 - W0); n < Math.min(this.N, i0); n++) {
        const k = n - (i0 - W0);
        const v = k < R0 ? 1 - 0.92 * (0.5 - 0.5 * Math.cos((Math.PI * k) / R0)) : 0.08;
        pre[n] = Math.min(pre[n], v);
      }
    const ks = [...this.kicks].sort((a, b) => a - b);
    const L = new Float64Array(this.N);
    const R = new Float64Array(this.N);
    let ki = -1;
    for (let n = 0; n < this.N; n++) {
      while (ki + 1 < ks.length && ks[ki + 1] <= n) ki++;
      let d = 1;
      if (ki >= 0) {
        const t = (n - ks[ki]) / this.SR;
        d = 1 - duck * Math.exp(-t / 0.13) * Math.min(1, t / 0.004 + 0.25);
      }
      L[n] = (this.dry.L[n] + this.pump.L[n] * d) * gain * pre[n];
      R[n] = (this.dry.R[n] + this.pump.R[n] * d) * gain * pre[n];
    }
    // zero-latency look-ahead limiter (gain reduction starts before the peak)
    const ceil = 10 ** (ceilDb / 20);
    const W = 88;
    const req = new Float64Array(this.N);
    for (let n = 0; n < this.N; n++) {
      const p = Math.max(Math.abs(L[n]), Math.abs(R[n]));
      req[n] = p > ceil ? ceil / p : 1;
    }
    const g = new Float64Array(this.N);
    const rel = 1 - Math.exp(-1 / (0.1 * this.SR));
    let last = 1;
    for (let n = 0; n < this.N; n++) {
      let m = 1;
      for (let k = Math.max(0, n - W); k <= Math.min(this.N - 1, n + W); k++) if (req[k] < m) m = req[k];
      last = Math.min(m, last + (1 - last) * rel);
      g[n] = last;
    }
    let acc = 0;
    const H = W / 2;
    for (let n = -H; n < this.N + H; n++) {
      if (n + H < this.N) acc += g[n + H];
      if (n - H - 1 >= 0) acc -= g[n - H - 1];
      if (n >= 0 && n < this.N) {
        const cnt = Math.min(this.N - 1, n + H) - Math.max(0, n - H) + 1;
        const gg = acc / cnt;
        const i = n + this.off;
        this.ctx.L[i] += L[n] * gg;
        this.ctx.R[i] += R[n] * gg;
        this.ctx.sendL[i] += this.send.L[n] * gain * gg * pre[n];
        this.ctx.sendR[i] += this.send.R[n] * gain * gg * pre[n];
      }
    }
  }
}

// chords (A minor family)
const AM9 = [45, 52, 55, 59, 60];
const AM7 = [57, 60, 64, 67];
const FMAJ7 = [53, 57, 60, 64];
const G6 = [55, 59, 62, 64];
const BAR = 120;

export default function render(ctx: SynthCtx) {
  const s = new Synth(ctx, 303);

  // ---- entrance: Clone Lab's staircase spins into the ring, decelerates, locks on frame 0 ----
  {
    const i0 = s.s(-14);
    const len = s.s(T.lock) - i0;
    const bp = new BQ();
    s.put(s.dry, i0, len, 0, 0.2, (t) => {
      const u = t / (len / s.SR); // 0..1
      const rate = 46 * (1 - u) + 4; // segment passing rate slows down
      if ((Math.round(t * s.SR) & 31) === 0) bp.set(2, 900 + 1400 * (1 - u), 2.5);
      const am = 0.5 + 0.5 * Math.sin(TAU * rate * t * (1 - u * 0.5));
      return 0.22 * am * (1 - u * 0.4) * bp.run(s.noise()) * 2;
    });
  }
  // ring lock (hit) on the downbeat of bar 1
  s.hit(T.lock, 0.55, 2600);
  s.bell(T.lock, 81, 0.07, 1.4, 0, 2, 1.2, 0.5);

  // ---- bar 1: the static drift bar; music is filtered, holding its breath ----
  s.pad(AM9, 0, BAR, {vol: 0.26, lp0: 380, lp1: 1400, att: 0.25, rel: 0.25, send: 0.35});
  s.sub(0, 33, BAR, 0.13);
  for (let b = 0; b < 4; b++) {
    s.kick(b * 30, 0.36, 260); // muffled kick through a lowpass
    s.hat(b * 30 + 15, 0.05, false, 0.3);
  }
  // title letters: four soft ticks as LIVE springs in
  [4, 8, 12, 16].forEach((f, i) => s.pluck(f, [69, 72, 76, 81][i], 0.07, -0.4 + i * 0.27, 0.3, 0.8));
  s.riser(60, T.drop, 0.18, 400, 14);

  // ---- bars 2-4: the house groove (drop on Live start) ----
  s.boom(T.drop, 0.75, 1.6);
  s.hit(T.drop, 0.4, 1600);
  const groove = (f0: number, f1: number, bright: number) => {
    for (let f = f0; f < f1; f += 30) {
      const beat = ((f - f0) / 30) % 4;
      s.kick(f, 0.62);
      if (beat === 1 || beat === 3) s.clap(f, 0.34, 0.05);
      s.hat(f + 15, 0.14 + 0.05 * bright, true, 0.3);
      for (let k = 0; k < 4; k++) if (k !== 2) s.hat(f + k * 7.5, k === 0 ? 0.06 : 0.09, false, -0.2);
    }
  };
  groove(T.drop, 300, 0);
  groove(300, 450, 1);
  // bass: off-beat 8ths, root per bar (Am, Am, F, G)
  const roots = [33, 33, 29, 31];
  for (let f = T.drop; f < 450; f += 30) {
    const bar = Math.floor(f / BAR);
    const cut = f >= T.overdrive ? 900 : 520 + (f >= 240 ? (f - 240) * 4 : 0);
    s.bass(f + 15, roots[bar], 0.2, 0.34, cut);
  }
  // chord stabs on syncopated 16ths, filter opens on the push into Overdrive
  const chords = [AM7, AM7, FMAJ7, G6];
  for (let bar = 1; bar < 4; bar++) {
    for (const p of [3, 6, 11]) {
      const f = bar * BAR + p * 7.5;
      if (f >= 450) continue;
      const cut = f < 240 ? 1600 : f < T.overdrive ? 1600 + (f - 240) * 40 : 3600;
      s.stab(f, chords[bar], 0.3, cut);
    }
  }
  s.pad(AM7.map((m) => m - 12), 120, 240, {vol: 0.2, lp0: 900, lp1: 2400, att: 0.05, rel: 0.2, send: 0.4});
  s.pad(FMAJ7.map((m) => m - 12), 240, 360, {vol: 0.18, lp0: 700, lp1: 2600, att: 0.1, rel: 0.2, send: 0.4});
  s.pad(G6.map((m) => m - 12), 360, 456, {vol: 0.2, lp0: 1200, lp1: 3200, att: 0.08, rel: 0.6, send: 0.45});

  // signal path nodes light: rising blips (MIC, VOICE, OUTPUT)
  T.nodes.forEach((f, i) => {
    s.click(f, 0.16, 3200 + i * 400, -0.5 + i * 0.5);
    s.bell(f, [76, 79, 84][i], 0.11, 0.7, -0.5 + i * 0.5, 2, 0.8, 0.3);
  });
  // toggles snap on
  s.click(T.echo, 0.3, 2400, 0.3);
  s.click(T.monitor, 0.3, 2700, 0.35);
  // filter rise into Overdrive, then the impact + surge
  s.riser(240, T.overdrive, 0.28, 300, 22);
  s.click(T.overdrive, 0.32, 2200, 0.4);
  s.boom(T.overdrive, 0.85, 2);
  s.hit(T.overdrive, 0.45, 2200);
  {
    // surge: detuned saw chord swelling down from the impact
    const notes = [45, 52, 57, 64];
    notes.forEach((m) =>
      [-14, 14].forEach((ct) => {
        let ph = s.rnd();
        const lp = new BQ();
        const fq = mtof(m) * 2 ** (ct / 1200);
        s.put(s.dry, s.s(T.overdrive), s.sec(1.1), ct > 0 ? 0.5 : -0.5, 0.35, (t) => {
          ph = (ph + (fq * (1 + 0.04 * Math.exp(-t / 0.08))) / s.SR) % 1;
          if ((Math.round(t * s.SR) & 31) === 0) lp.set(0, 600 + 5000 * Math.exp(-t / 0.25), 1.2);
          return 0.07 * lp.run(2 * ph - 1) * Math.min(1, t * 800) * Math.exp(-t / 0.4);
        });
      }),
    );
  }
  // honest status chip: a two-note blip
  s.bell(T.gpu, 88, 0.12, 0.5, 0.3, 2, 0.8, 0.3);
  s.bell(T.gpu + 4.5, 93, 0.1, 0.9, 0.4, 2, 0.8, 0.35);

  // Live words: panel lands, then one tick per word (A minor pentatonic up)
  s.hit(T.words, 0.3, 2400);
  s.stab(T.words, G6, 0.34, 3000, 0.25);
  T.wordAt.forEach((f, i) => {
    s.click(f, 0.14, 3000 + i * 250, -0.3 + i * 0.15);
    s.pluck(f, [72, 74, 76, 79, 81][i], 0.12, -0.3 + i * 0.15, 0.35, 0.75);
  });
  // the text grows: an upward glide
  {
    const i0 = s.s(T.grow[0]);
    const len = s.s(T.grow[1]) - i0;
    let ph = 0;
    s.put(s.dry, i0, len + s.sec(0.15), 0.1, 0.4, (t) => {
      const u = Math.min(1, t / (len / s.SR));
      ph += (TAU * mtof(64 + 12 * u * u)) / s.SR;
      return 0.05 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (Math.sin(ph) + 0.3 * Math.sin(2 * ph));
    });
  }
  // a letter detaches: glass ting, then a reverse swell into the boundary (TTS takes over)
  s.bell(T.detach, 96, 0.13, 1.6, 0.2, 2.76, 2.2, 0.6);
  s.bell(T.detach, 103, 0.06, 1.2, -0.2, 3.13, 1.6, 0.6);
  s.riser(456, 480, 0.12, 1500, 5);

  EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').forEach((e) => s.gap(e.f));
  s.mix(1.0, 0.6, -6.6);
}
