// World 3 · REVIEW — tight broken-beat in D minor. As recorded, three of the four "camera" layers (hats, rims,
// Rhodes stabs) run late or early by a fraction of their tile's offset, so the groove flams; each layer snaps into
// time on the frame its tile locks (ticks), and the full groove lands on the lock impact. Playhead ticks on every
// beat while it moves, pitched blips on the 1 ms nudges, clicks on Undo/Redo, a whoosh as the workspace collapses
// into the playhead, a soft caret ping. Also exports the small synth toolkit the Captions and Handoff worlds reuse.
import type {SynthCtx} from '../types.ts';
import {BQ, TAU, mtof, panG} from '../../mkv/dsp.ts';
import {EVENTS, LOCKS, OFFSETS, T} from '../../../src/mpw/worlds/review/timing.ts';

type Bus = {L: Float64Array; R: Float64Array};

export class Synth {
  SR: number;
  off: number; // global sample index of local sample 0
  N: number;
  dry: Bus;
  pump: Bus; // ducked by the kick (sidechain)
  send: Bus;
  kicks: number[] = [];
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
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  noise() {
    return this.rnd() * 2 - 1;
  }
  // local sample index of a world-local frame (exact; onsets start on this sample)
  s(f: number) {
    return Math.round(this.ctx.at(f)) - this.off;
  }
  sec(x: number) {
    return Math.round(x * this.SR);
  }
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

  // ---------------- drums ----------------
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
  snare(f: number, vol: number, pan = 0, send = 0.15, tone = 1) {
    let ph = 0;
    const bp = new BQ().set(2, 3200 * tone, 0.7);
    const hp = new BQ().set(1, 1200, 0.7);
    this.put(this.dry, this.s(f), this.sec(0.3), pan, send, (t) => {
      ph += (TAU * (185 * tone + 60 * Math.exp(-t / 0.01))) / this.SR;
      const n = this.noise();
      return vol * Math.min(1, t * 4000) * (0.8 * Math.sin(ph) * Math.exp(-t / 0.05) + 1.6 * bp.run(hp.run(n)) * Math.exp(-t / 0.07));
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
  rim(f: number, vol: number, pan = 0) {
    const bp = new BQ().set(2, 1750, 6);
    this.put(this.dry, this.s(f), this.sec(0.08), pan, 0.1, (t) => vol * (bp.run(t < 0.0015 ? this.noise() * 6 : 0) * 1.4 + Math.sin(TAU * 820 * t) * Math.exp(-t / 0.012) * 0.6));
  }
  shaker(f: number, vol: number, pan = -0.3) {
    const bp = new BQ().set(2, 6000, 1.2);
    this.put(this.dry, this.s(f), this.sec(0.07), pan, 0.05, (t) => vol * bp.run(this.noise()) * Math.min(1, t / 0.006) * Math.exp(-t / 0.02));
  }

  // ---------------- tonal ----------------
  bass(f: number, m: number, dur: number, vol: number, cut = 500) {
    const fq = mtof(m);
    const lp = new BQ();
    let ph = 0;
    let ph2 = 0;
    this.put(this.pump, this.s(f), this.sec(dur + 0.04), 0, 0, (t) => {
      ph = (ph + fq / this.SR) % 1;
      ph2 = (ph2 + (fq * 1.005) / this.SR) % 1;
      if ((Math.round(t * this.SR) & 15) === 0) lp.set(0, cut * (1 + 3 * Math.exp(-t / 0.05)), 2.2);
      const e = Math.min(1, t / 0.003) * Math.exp(-t / 0.3) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.04) : 1);
      return vol * e * (lp.run(ph + ph2 - 1) * 0.9 + Math.sin(TAU * fq * t) * 0.6);
    });
  }
  sub(f0: number, m: number, f1: number, vol: number) {
    const fq = mtof(m);
    const d = (f1 - f0) / 60;
    this.put(this.pump, this.s(f0), this.sec(d + 0.1), 0, 0, (t) => vol * Math.sin(TAU * fq * t) * Math.min(1, t / 0.02) * (t > d ? Math.max(0, 1 - (t - d) / 0.1) : 1));
  }
  // detuned-saw chord stab, lowpass
  stab(f: number, notes: number[], vol: number, cut = 2200, dur = 0.16, send = 0.35) {
    notes.forEach((m, j) => {
      [-9, 0, 9].forEach((ct) => {
        const fq = mtof(m) * 2 ** (ct / 1200);
        let ph = this.rnd();
        const lp = new BQ().set(0, cut, 1.1);
        this.put(this.pump, this.s(f), this.sec(dur + 0.25), (j / Math.max(1, notes.length - 1)) * 1.2 - 0.6, send, (t) => {
          ph = (ph + fq / this.SR) % 1;
          const e = Math.min(1, t / 0.004) * (t < dur ? Math.exp(-t / (dur * 1.6)) : Math.exp(-1 / 1.6) * Math.exp(-(t - dur) / 0.05));
          return (vol / notes.length / 3) * e * lp.run(2 * ph - 1) * 2;
        });
      });
    });
  }
  // brass-ish section stab: detuned saws, a fast filter "blat" that settles, a small pitch scoop, late vibrato
  brass(f: number, notes: number[], dur: number, vol: number, bright = 1, send = 0.4) {
    notes.forEach((m, j) => {
      [-7, 0, 6].forEach((ct, v) => {
        const fq = mtof(m) * 2 ** (ct / 1200);
        let ph = this.rnd();
        const lp = new BQ();
        const pan = Math.max(-0.8, Math.min(0.8, (j / Math.max(1, notes.length - 1)) * 1.1 - 0.55 + (v - 1) * 0.15));
        this.put(this.pump, this.s(f), this.sec(dur + 0.3), pan, send, (t) => {
          const scoop = 1 - 0.018 * Math.exp(-t / 0.03);
          const vib = 1 + (t > 0.25 ? 0.004 * Math.sin(TAU * 5.5 * t) * Math.min(1, (t - 0.25) / 0.3) : 0);
          ph = (ph + (fq * scoop * vib) / this.SR) % 1;
          if ((Math.round(t * this.SR) & 15) === 0) lp.set(0, mtof(m) * (2.2 + bright * (6 * Math.exp(-t / 0.07) + 1.6)), 0.9);
          const e = Math.min(1, t / 0.012) * (t < dur ? 1 - 0.3 * Math.min(1, t / 0.25) : 0.7 * Math.max(0, 1 - (t - dur) / 0.3));
          return (vol / notes.length / 3) * e * lp.run(2 * ph - 1) * 2.2;
        });
      });
    });
  }
  pad(notes: number[], f0: number, f1: number, o: {vol: number; lp0?: number; lp1?: number; att?: number; rel?: number; send?: number; bus?: Bus}) {
    const att = o.att ?? 0.3;
    const rel = o.rel ?? 0.5;
    const t1 = (f1 - f0) / 60;
    notes.forEach((m, j) => {
      [-8, 0, 8].forEach((ct, v) => {
        const fq = mtof(m) * 2 ** (ct / 1200);
        const dt = fq / this.SR;
        let ph = this.rnd();
        const lp = new BQ();
        const pan = Math.max(-0.9, Math.min(0.9, (j % 2 ? 0.35 : -0.35) + (v - 1) * 0.3));
        this.put(o.bus ?? this.pump, this.s(f0), this.sec(t1 + rel), pan, o.send ?? 0.3, (t) => {
          ph += dt;
          if (ph >= 1) ph -= 1;
          let sw = 2 * ph - 1;
          if (ph < dt) {
            const x = ph / dt;
            sw -= x + x - x * x - 1;
          } else if (ph > 1 - dt) {
            const x = (ph - 1) / dt;
            sw -= x * x + x + x + 1;
          }
          if ((Math.round(t * this.SR) & 31) === 0) {
            const u = Math.min(1, t / Math.max(0.01, t1));
            lp.set(0, (o.lp0 ?? 900) * ((o.lp1 ?? 900) / (o.lp0 ?? 900)) ** u, 0.8);
          }
          const e = t < att ? Math.sin(((t / att) * Math.PI) / 2) : t > t1 ? Math.max(0, 1 - (t - t1) / rel) : 1;
          return (lp.run(sw) * e * o.vol) / notes.length;
        });
      });
    });
  }
  // FM electric piano
  rhodes(f: number, notes: number[], dur: number, vol: number, send = 0.3, bus?: Bus) {
    notes.forEach((m, j) => {
      const fq = mtof(m);
      const pan = (j / Math.max(1, notes.length - 1)) * 0.8 - 0.4;
      this.put(bus ?? this.dry, this.s(f) + j * 40, this.sec(dur + 0.6), pan, send, (t) => {
        const idx = 0.3 + 1.4 * Math.exp(-t / 0.2);
        const env = Math.min(1, t / 0.003) * Math.exp(-t / 1.8) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.6) : 1);
        const tine = 0.16 * Math.sin(TAU * fq * 7.02 * t) * Math.exp(-t / 0.035);
        return ((vol / Math.sqrt(notes.length)) * env * (Math.sin(TAU * fq * t + idx * Math.sin(TAU * fq * t)) + tine) * (1 + 0.1 * Math.sin(TAU * 4.6 * t + j)));
      });
    });
  }
  bell(f: number, m: number, vol: number, dur = 1.2, pan = 0, ratio = 3.5, idx = 2, send = 0.35) {
    const fq = mtof(m);
    this.put(this.dry, this.s(f), this.sec(dur), pan, send, (t) => vol * Math.min(1, t * 600) * Math.exp(-t / (dur * 0.28)) * Math.sin(TAU * fq * t + idx * Math.exp(-t / 0.2) * Math.sin(TAU * fq * ratio * t)));
  }
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
  // short sine blip with a pitch glide (UI confirmation)
  blip(f: number, m0: number, m1: number, vol: number, pan = 0, dur = 0.12) {
    let ph = 0;
    this.put(this.dry, this.s(f), this.sec(dur + 0.05), pan, 0.25, (t) => {
      ph += (TAU * mtof(m0 + (m1 - m0) * Math.min(1, t / 0.04))) / this.SR;
      return vol * Math.min(1, t * 2000) * Math.exp(-t / (dur * 0.45)) * (Math.sin(ph) + 0.25 * Math.sin(2 * ph));
    });
  }

  // ---------------- impacts & UI ----------------
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
  hit(f: number, vol: number, tone = 1800) {
    let ph = 0;
    const bp = new BQ().set(2, tone, 0.8);
    this.put(this.dry, this.s(f), this.sec(0.6), 0, 0.25, (t) => {
      ph += (TAU * (44 + 150 * Math.exp(-t / 0.022))) / this.SR;
      return vol * Math.min(1, t * 3000) * (Math.sin(ph) * Math.exp(-t / 0.22) + 1.7 * bp.run(this.noise()) * Math.exp(-t / 0.04));
    });
  }
  click(f: number, vol: number, freq = 2600, pan = 0) {
    this.put(this.dry, this.s(f), this.sec(0.07), pan, 0.08, (t) =>
      vol * (Math.sin(TAU * freq * t) * Math.exp(-t / 0.005) + this.noise() * Math.exp(-t / 0.0012) * 0.5 + 0.7 * Math.sin(TAU * 190 * t) * Math.exp(-t / 0.012)),
    );
  }
  // typewriter / keyboard key: plastic tick + bright noise + low thock
  key(f: number, vol: number, pan = 0, space = false) {
    const tone = 1700 + 900 * this.rnd();
    const bp = new BQ().set(2, 3600 + 1400 * this.rnd(), 1.4);
    this.put(this.dry, this.s(f), this.sec(0.07), pan, 0.1, (t) =>
      vol *
      ((space ? 0.5 : 1) * Math.sin(TAU * tone * t) * Math.exp(-t / 0.004) +
        1.4 * bp.run(this.noise()) * Math.exp(-t / 0.0025) +
        (space ? 1.1 : 0.6) * Math.sin(TAU * (space ? 120 : 160) * t) * Math.exp(-t / 0.012)),
    );
  }
  whoosh(f: number, vol: number, len = 0.5, pan0 = -0.7, pan1 = 0.7) {
    const center = this.s(f);
    const pre = this.sec(len * 0.8);
    const post = this.sec(len * 0.45);
    const bp = new BQ();
    const bp2 = new BQ();
    for (let k = -pre; k < post; k++) {
      const i = center + k;
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
      if (i < 0 || i >= this.N) continue;
      const v = vol * amp * (bp.run(n) * 1.7 + bp2.run(n) * 0.8);
      const [gl, gr] = panG(pan0 + ((pan1 - pan0) * (k + pre)) / (pre + post));
      this.dry.L[i] += v * gl;
      this.dry.R[i] += v * gr;
      this.send.L[i] += v * gl * 0.25;
      this.send.R[i] += v * gr * 0.25;
    }
  }
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

  // ---------------- mixdown ----------------
  gap(f: number) {
    this.gaps.push(this.s(f));
  }
  // sidechain the pump bus, cut the bed before every gap (−22 dB), gain, look-ahead peak limit, add into the track
  mix(gain: number, duck = 0.6, ceilDb = -6) {
    const N = this.N;
    const pre = new Float64Array(N).fill(1);
    const W0 = this.sec(0.06);
    const R0 = this.sec(0.012);
    for (const i0 of this.gaps)
      for (let n = Math.max(0, i0 - W0); n < Math.min(N, i0); n++) {
        const k = n - (i0 - W0);
        const v = k < R0 ? 1 - 0.92 * (0.5 - 0.5 * Math.cos((Math.PI * k) / R0)) : 0.08;
        pre[n] = Math.min(pre[n], v);
      }
    const ks = [...this.kicks].sort((a, b) => a - b);
    const L = new Float64Array(N);
    const R = new Float64Array(N);
    let ki = -1;
    for (let n = 0; n < N; n++) {
      while (ki + 1 < ks.length && ks[ki + 1] <= n) ki++;
      let d = 1;
      if (ki >= 0) {
        const t = (n - ks[ki]) / this.SR;
        d = 1 - duck * Math.exp(-t / 0.13) * Math.min(1, t / 0.004 + 0.25);
      }
      L[n] = (this.dry.L[n] + this.pump.L[n] * d) * gain * pre[n];
      R[n] = (this.dry.R[n] + this.pump.R[n] * d) * gain * pre[n];
    }
    // zero-latency look-ahead limiter: sliding-window minimum of the required gain, smooth release, box smoothing
    const ceil = 10 ** (ceilDb / 20);
    const W = 88;
    const req = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      const p = Math.max(Math.abs(L[n]), Math.abs(R[n]));
      req[n] = p > ceil ? ceil / p : 1;
    }
    const mn = new Float64Array(N);
    const dq = new Int32Array(N + 2 * W + 2);
    let h = 0;
    let tl = 0;
    for (let j = 0; j < N + W; j++) {
      if (j < N) {
        while (tl > h && req[dq[tl - 1]] >= req[j]) tl--;
        dq[tl++] = j;
      }
      const i = j - W;
      if (i < 0) continue;
      while (dq[h] < i - W) h++;
      mn[i] = req[dq[h]];
    }
    const rel = 1 - Math.exp(-1 / (0.1 * this.SR));
    let last = 1;
    for (let n = 0; n < N; n++) {
      last = Math.min(mn[n], last + (1 - last) * rel);
      mn[n] = last;
    }
    let acc = 0;
    const H = W / 2;
    for (let n = -H; n < N + H; n++) {
      if (n + H < N) acc += mn[n + H];
      if (n - H - 1 >= 0) acc -= mn[n - H - 1];
      if (n >= 0 && n < N) {
        const cnt = Math.min(N - 1, n + H) - Math.max(0, n - H) + 1;
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

// ---------------------------------------------------------------- the Review cue ----
// D minor family: Dm9 | Bbmaj7 | Gm9 | A7sus4 | Dm9
const CHORDS = [
  [50, 53, 57, 60, 64],
  [46, 50, 53, 57, 62],
  [43, 50, 53, 57, 58],
  [45, 50, 52, 55, 57],
  [50, 53, 57, 60, 64],
];
const ROOTS = [38, 34, 31, 33, 38];
const STEP = 7.5; // a 16th note in frames
const swing = (k: number) => (k % 2 ? 1.1 : 0);

export default function render(ctx: SynthCtx) {
  const s = new Synth(ctx, 3003);
  // camera layer lateness (frames) at frame f: a third of the tile's offset until the tile locks
  const late = (cam: number, f: number) => (f >= LOCKS[cam] ? 0 : OFFSETS[cam] / 3);
  const end = 552; // the groove stops as the workspace collapses into the playhead

  // ---- entrance: the tracks fold into tiles (a short zip into the downbeat hit) ----
  s.whoosh(-2, 0.12, 0.3, -0.4, 0.4);
  s.hit(0, 0.42, 2600);
  s.bell(0, 86, 0.05, 1.0, 0.3, 3.01, 1.2, 0.5);

  // ---- the groove (bars 1-5): kick + snare are CAM A (the reference) ----
  for (let bar = 0; bar < 5; bar++) {
    const b0 = bar * 120;
    const full = b0 >= T.lockD;
    for (let k = 0; k < 16; k++) {
      const f = b0 + k * STEP + swing(k);
      if (f >= end) break;
      // CAM A: kick (broken: 1, 2a, 3&) and snare (2, 4), ghost notes
      if ([0, 7, 10].includes(k) || (bar % 2 === 1 && k === 3)) s.kick(f, k === 0 ? 0.62 : 0.5, full || k === 0 ? 0 : 3200);
      if (k === 4 || k === 12) s.snare(f, 0.42, 0.05);
      if ((k === 9 || k === 15) && full) s.snare(f, 0.09, -0.1, 0.05, 1.1);
      // CAM B: closed hats on 8ths with 16th pickups (late until it locks)
      const fb = f + late(1, f);
      if (k % 2 === 0 || k === 7 || k === 15) s.hat(fb, k % 4 === 2 ? 0.16 : 0.09, k === 14 && full, 0.3);
      // CAM C: rim clave pattern (early until it locks)
      const fc = f + late(2, f);
      if ([3, 6, 11, 14].includes(k)) s.rim(fc, 0.22, -0.35);
      // CAM D: Rhodes stabs on syncopated 16ths (very late until it locks)
      const fd = f + late(3, f);
      if ([3, 6, 13].includes(k)) s.rhodes(fd, CHORDS[bar].slice(1), 0.12, 0.13, 0.3);
    }
    // bass: enters with the dock, root + 5th on the kick figure
    if (b0 >= T.dock && b0 < end) {
      const r = ROOTS[bar];
      s.bass(b0, r, 0.32, 0.36, 520);
      s.bass(b0 + 7 * STEP + 1.1, r, 0.14, 0.26, 600);
      s.bass(b0 + 10 * STEP, r + 7, 0.2, 0.26, 640);
      if (bar < 4) s.bass(b0 + 14 * STEP, r + 12, 0.1, 0.18, 700);
    }
    // a soft pad bed under it all
    if (b0 < end) s.pad(CHORDS[bar], b0, Math.min(b0 + 120, end), {vol: 0.16, lp0: 700, lp1: full ? 2400 : 1100, att: 0.2, rel: 0.4, send: 0.45});
  }
  s.sub(T.dock, 26, T.lockD, 0.08);
  s.sub(T.lockD, 26, end, 0.12);

  // ---- bar 2: the UI assembles (hit) ----
  s.whoosh(T.dock - 1, 0.14, 0.45, 0.6, -0.4);
  s.hit(T.dock, 0.4, 2200);
  s.stab(T.dock, CHORDS[1], 0.32, 2600, 0.2, 0.4);

  // ---- playhead ticks: one per beat while it moves ----
  for (let f = T.dock + 30; f < T.exit; f += 30) {
    if ([T.lockB, T.lockC, T.lockD, T.nudgeMinus, T.nudgePlus, T.undo, T.redo].includes(f)) continue;
    s.click(f, 0.07, 4200, -0.6 + ((f - T.dock) / (T.exit - T.dock)) * 1.2);
  }

  // ---- the locks: each tile's tick, then the impact when all four are one picture ----
  s.click(T.lockB, 0.3, 3400, 0.35);
  s.blip(T.lockB, 81, 86, 0.08, 0.35);
  s.click(T.lockC, 0.3, 3100, -0.35);
  s.blip(T.lockC, 81, 88, 0.08, -0.35);
  s.riser(T.lockC + 2, T.lockD, 0.12, 500, 12);
  s.boom(T.lockD, 0.7, 2);
  s.hit(T.lockD, 0.45, 2400);
  s.stab(T.lockD, [62, 65, 69, 72, 76], 0.36, 3000, 0.28, 0.5);
  [86, 89, 93, 98].forEach((m, i) => s.bell(T.lockD, m, 0.05, 2, -0.5 + i * 0.33, 3.01, 1.4, 0.6));

  // ---- 1 ms nudges (blips down / up), Undo / Redo (clicks) ----
  s.click(T.nudgeMinus, 0.2, 2600, 0.5);
  s.blip(T.nudgeMinus, 84, 79, 0.14, 0.5);
  s.click(T.nudgePlus, 0.2, 2600, 0.6);
  s.blip(T.nudgePlus, 79, 84, 0.14, 0.6);
  s.click(T.undo, 0.26, 2100, 0.45);
  s.blip(T.undo, 76, 72, 0.08, 0.45, 0.08);
  s.click(T.redo, 0.26, 2400, 0.55);
  s.blip(T.redo, 72, 76, 0.08, 0.55, 0.08);

  // ---- exit: the workspace collapses into the playhead, which becomes a caret ----
  s.riser(492, 540, 0.1, 700, 8);
  s.whoosh(540, 0.2, 0.6, 0.5, 0);
  s.pad([50, 57, 62, 64], end - 24, 610, {vol: 0.12, lp0: 1600, lp1: 500, att: 0.4, rel: 0.6, send: 0.6});
  s.click(T.caret, 0.16, 3600, 0);
  s.bell(T.caret, 93, 0.05, 0.9, 0, 2.0, 0.6, 0.5);

  EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit').forEach((e) => s.gap(e.f));
  s.gap(ctx.length); // clear the bed before the next world's downbeat
  s.mix(1.12, 0.5, -6);
}
