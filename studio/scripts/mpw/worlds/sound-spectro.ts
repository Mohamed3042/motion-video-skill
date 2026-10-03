// Sound Lab: the spectrogram on screen is COMPUTED from the audio scripts/mpw/worlds/sound.ts renders.
//   node scripts/mpw/worlds/sound-spectro.ts      (re-run whenever the sound changes)
// Renders the module twice into SynthCtx buffers exactly like solo.ts (original, and processed = without the hum and
// clicks that AUDIO REPAIR removes), takes a multi-resolution Hann STFT (8192 / 4096 / 1024 points, 2 columns per
// video frame) on a log-frequency axis (40 Hz → 11 kHz, constant-Q smoothing, +3 dB/oct display tilt) and writes
//   public/mpw/sound/spec-{orig,proc}.png        log-magnitude, sage-on-charcoal colormap, 1 column = ½ frame
//   public/mpw/sound/spec-{orig,proc}-glow.png   ¼-res pre-blurred bloom
//   src/mpw/worlds/sound/spectro.gen.ts          frame ↔ column mapping + the intro waveform (peak per column)
// Self-checks (assert): every letter of MONTAGE correlates with its glyph in the computed image, every impact/hit
// has a clean onset on its frame, and the damage stops at the repair frame.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {FPS, worldById} from '../../../src/mpw/timing.ts';
import {EVENTS, LETTER_F, LETTER_LEN, T, WORD} from '../../../src/mpw/worlds/sound/timing.ts';
import type {SynthCtx} from '../types.ts';
import {LH, ROWS, synth, wordCoverage} from './sound.ts';

const SR = 44100;
const lead = 0.5;
const length = worldById('sound').end - worldById('sound').start;
const N = Math.round((length / FPS + 2 * lead) * SR);
const at = (f: number) => (lead + f / FPS) * SR;
function render(clean: boolean) {
  const ctx: SynthCtx = {SR, L: new Float64Array(N), R: new Float64Array(N), sendL: new Float64Array(N), sendR: new Float64Array(N), length, at};
  synth(ctx, {clean});
  const g8 = 10 ** (-8 / 20); // solo.ts mix: send bus in dry at −8 dB
  const x = new Float64Array(N);
  for (let i = 0; i < N; i++) x[i] = 0.5 * (ctx.L[i] + ctx.R[i] + g8 * (ctx.sendL[i] + ctx.sendR[i]));
  return x;
}

// ---- layout of the image ----
const F0 = -12; // first column = local frame −12
const CPF = 2; // columns per video frame
const COLS = (length + 12 - F0) * CPF; // through local frame length + 12
const ROWS_N = 576;
const F_MIN = 40;
const F_MAX = 11000;
const fOfRow = (r: number) => F_MIN * (F_MAX / F_MIN) ** ((ROWS_N - 1 - r) / (ROWS_N - 1)); // row 0 = top
const RANGE = 64; // dB shown

// ---- FFT ----
function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const h = len >> 1;
    for (let k = 0; k < h; k++) {
      const wr = Math.cos(ang * k);
      const wi = Math.sin(ang * k);
      for (let i = k; i < n; i += len) {
        const xr = re[i + h] * wr - im[i + h] * wi;
        const xi = re[i + h] * wi + im[i + h] * wr;
        re[i + h] = re[i] - xr;
        im[i + h] = im[i] - xi;
        re[i] += xr;
        im[i] += xi;
      }
    }
  }
}
const SIZES = [8192, 4096, 2048, 1024];
// which STFT feeds each row (blended over ±¼ octave around 150, 300 and 700 Hz)
const sizeW = (f: number) => {
  const r = [150, 300, 700].map((c) => Math.min(1, Math.max(0, (Math.log2(f / c) + 0.25) / 0.5)));
  return [1 - r[0], r[0] * (1 - r[1]), r[0] * r[1] * (1 - r[2]), r[0] * r[1] * r[2]];
};
// constant-Q kernel over the bins of an N-point FFT for every row
type Kern = {k0: number; w: Float64Array}[];
const kernels = SIZES.map((n): Kern => {
  const bw = SR / n;
  const out: Kern = [];
  for (let r = 0; r < ROWS_N; r++) {
    const f = fOfRow(r);
    const sig = Math.max((f > 380 ? 1.25 : 0.45) / 12, 0.6 * Math.log2((f + bw) / f));
    const k0 = Math.max(1, Math.floor((f * 2 ** (-3 * sig)) / bw));
    const k1 = Math.min(n / 2 - 1, Math.ceil((f * 2 ** (3 * sig)) / bw));
    const w = new Float64Array(k1 - k0 + 1);
    let sum = 0;
    for (let k = k0; k <= k1; k++) sum += w[k - k0] = Math.exp(-0.5 * (Math.log2((k * bw) / f) / sig) ** 2);
    for (let k = 0; k < w.length; k++) w[k] /= sum;
    out.push({k0, w});
  }
  return out;
});
const ROW_SW = Array.from({length: ROWS_N}, (_, r) => sizeW(fOfRow(r)));
const TILT = Array.from({length: ROWS_N}, (_, r) => 4.5 * Math.log2(fOfRow(r) / 1000)); // display weighting, pivot 1 kHz

function spectrogram(x: Float64Array) {
  const db = new Float32Array(COLS * ROWS_N); // [r * COLS + c]
  const bufs = SIZES.map((n) => ({re: new Float64Array(n), im: new Float64Array(n), p: new Float64Array(n / 2), win: Float64Array.from({length: n}, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n))}));
  const row = new Float64Array(ROWS_N);
  for (let c = 0; c < COLS; c++) {
    const center = at(F0 + c / CPF);
    row.fill(0);
    SIZES.forEach((n, si) => {
      const {re, im, p, win} = bufs[si];
      const i0 = Math.round(center - n / 2);
      let ws = 0;
      for (let i = 0; i < n; i++) {
        const j = i0 + i;
        re[i] = (j >= 0 && j < N ? x[j] : 0) * win[i];
        im[i] = 0;
        ws += win[i];
      }
      fft(re, im);
      const sc = 2 / ws; // a sine of amplitude A peaks at A in every FFT size
      for (let k = 0; k < n / 2; k++) p[k] = (re[k] * re[k] + im[k] * im[k]) * sc * sc;
      for (let r = 0; r < ROWS_N; r++) {
        const sw = ROW_SW[r][si];
        if (!sw) continue;
        const {k0, w} = kernels[si][r];
        let acc = 0;
        for (let k = 0; k < w.length; k++) acc += w[k] * p[k0 + k];
        row[r] += sw * acc;
      }
    });
    for (let r = 0; r < ROWS_N; r++) db[r * COLS + c] = 10 * Math.log10(row[r] + 1e-14) + TILT[r];
  }
  return db;
}

// ---- colormap: charcoal → deep green → sage → cream ----
const STOPS: [number, number[]][] = [
  [0, [13, 15, 14]],
  [0.2, [18, 27, 23]],
  [0.4, [31, 58, 46]],
  [0.58, [60, 108, 84]],
  [0.74, [116, 168, 132]],
  [0.86, [165, 201, 173]],
  [0.95, [222, 236, 214]],
  [1, [250, 252, 240]],
];
const cmap = (v: number) => {
  for (let i = 1; i < STOPS.length; i++)
    if (v <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1];
      const [b, cb] = STOPS[i];
      const u = (v - a) / (b - a);
      return ca.map((x, k) => x + (cb[k] - x) * u);
    }
  return STOPS[STOPS.length - 1][1];
};
const outDir = fileURLToPath(new URL('../../../public/mpw/sound/', import.meta.url));
mkdirSync(outDir, {recursive: true});
function png(name: string, w: number, h: number, rgb: Uint8Array) {
  const p = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${w}x${h}`, '-i', '-', '-frames:v', '1', outDir + name], {input: rgb});
  assert.equal(p.status, 0, `ffmpeg failed writing ${name}: ${p.stderr}`);
}
const vOf = (d: number, ref: number) => Math.min(1, Math.max(0, (d - (ref - RANGE)) / RANGE)) ** 1.1;
function writeImages(tag: string, db: Float32Array, ref: number) {
  const rgb = new Uint8Array(COLS * ROWS_N * 3);
  for (let i = 0; i < COLS * ROWS_N; i++) rgb.set(cmap(vOf(db[i], ref)), i * 3);
  png(`spec-${tag}.png`, COLS, ROWS_N, rgb);
  // bloom: bright parts only, ¼ resolution, three box-blur passes
  const D4 = 4;
  const gw = COLS / D4;
  const gh = ROWS_N / D4;
  let g = new Float32Array(gw * gh);
  for (let r = 0; r < ROWS_N; r++) for (let c = 0; c < COLS; c++) g[((r / D4) | 0) * gw + ((c / D4) | 0)] += Math.max(0, vOf(db[r * COLS + c], ref) - 0.6) ** 1.5 / (D4 * D4);
  for (let pass = 0; pass < 3; pass++) {
    const t = new Float32Array(g.length);
    for (let r = 0; r < gh; r++) for (let c = 0; c < gw; c++) t[r * gw + c] = (g[r * gw + Math.max(0, c - 1)] + g[r * gw + c] + g[r * gw + Math.min(gw - 1, c + 1)]) / 3;
    for (let r = 0; r < gh; r++) for (let c = 0; c < gw; c++) g[r * gw + c] = (t[Math.max(0, r - 1) * gw + c] + t[r * gw + c] + t[Math.min(gh - 1, r + 1) * gw + c]) / 3;
    g = g.slice();
  }
  let gmax = 1e-9;
  for (const v of g) gmax = Math.max(gmax, v);
  const glow = new Uint8Array(gw * gh * 3);
  for (let i = 0; i < gw * gh; i++) {
    const u = Math.min(1, g[i] / (gmax * 0.55));
    glow.set([165, 201, 173].map((x) => Math.round(x * u)), i * 3);
  }
  png(`spec-${tag}-glow.png`, gw, gh, glow);
}

// ---- go ----
const orig = render(false);
const proc = render(true);
const dbO = spectrogram(orig);
const dbP = spectrogram(proc);
// reference level: the brightest 0.5 % of the text band while the word plays (the letters reach the top of the map)
const band: number[] = [];
for (let c = (LETTER_F[0] - F0) * CPF; c < (LETTER_F[6] + LETTER_LEN - F0) * CPF; c++)
  for (let r = 0; r < ROWS_N; r++) if (fOfRow(r) > 440 && fOfRow(r) < 8400) band.push(dbO[r * COLS + c]);
band.sort((a, b) => a - b);
const REF = band[Math.floor(band.length * 0.995)];
writeImages('orig', dbO, REF);
writeImages('proc', dbP, REF);

// intro waveform: peak of the original per column for local frames −12 … 160
const WAVE_COLS = (160 - F0) * CPF;
const wave: number[] = [];
for (let c = 0; c < WAVE_COLS; c++) {
  const a = Math.round(at(F0 + c / CPF - 0.25));
  const b = Math.round(at(F0 + c / CPF + 0.25));
  let m = 0;
  for (let i = a; i < b; i++) m = Math.max(m, Math.abs(orig[i]));
  wave.push(m);
}
const wmax = Math.max(...wave);
writeFileSync(
  fileURLToPath(new URL('../../../src/mpw/worlds/sound/spectro.gen.ts', import.meta.url)),
  `// GENERATED by scripts/mpw/worlds/sound-spectro.ts from the rendered audio — do not edit.\n` +
    `// Column c of public/mpw/sound/spec-*.png is the STFT centred on local frame F0 + c / CPF; row 0 = F_MAX, log axis.\n` +
    `export const SPEC = {F0: ${F0}, CPF: ${CPF}, COLS: ${COLS}, ROWS: ${ROWS_N}, F_MIN: ${F_MIN}, F_MAX: ${F_MAX}, GLOW: 4} as const;\n` +
    `// peak |x| per column (normalised) for local frames F0 … 160\n` +
    `export const WAVE: number[] = [${wave.map((v) => +(v / wmax).toFixed(3)).join(',')}];\n`,
);

// ---- self-checks ----
// 1) the word: computed image vs. the glyphs (Pearson r per letter over the text band)
const yOf = (f: number) => ((12 * Math.log2(f / 440)) / (ROWS[ROWS.length - 1] - ROWS[0])) * LH;
const rs: string[] = [];
for (const dbx of [dbO, dbP]) {
  const per: number[] = [];
  for (let li = 0; li < WORD.length; li++) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let c = (LETTER_F[li] - 6 - F0) * CPF; c < (LETTER_F[li] + LETTER_LEN + 6 - F0) * CPF; c++)
      for (let r = 0; r < ROWS_N; r++) {
        const f = fOfRow(r);
        if (f < 400 || f > 9200) continue;
        xs.push(vOf(dbx[r * COLS + c], REF));
        ys.push(wordCoverage(F0 + c / CPF, yOf(f)));
      }
    const mx = xs.reduce((a, b) => a + b) / xs.length;
    const my = ys.reduce((a, b) => a + b) / ys.length;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    xs.forEach((x, i) => {
      sxy += (x - mx) * (ys[i] - my);
      sxx += (x - mx) ** 2;
      syy += (ys[i] - my) ** 2;
    });
    per.push(sxy / Math.sqrt(sxx * syy));
  }
  rs.push(per.map((r, i) => `${WORD[i]} ${r.toFixed(2)}`).join('  '));
  if (dbx === dbP) per.forEach((r, i) => assert.ok(r > 0.7, `letter ${WORD[i]} does not read in the processed spectrogram (r = ${r.toFixed(2)})`));
}
console.log(`glyph correlation  original:  ${rs[0]}\n                   processed: ${rs[1]}`);

// 2) onsets: every impact/hit has an onset within ±1 frame and ≥ 6 dB jump (pre-emphasised energy, as the film check)
const cum = new Float64Array(N + 1);
for (let n = 0; n < N; n++) cum[n + 1] = cum[n] + (orig[n] - 0.97 * (n ? orig[n - 1] : 0)) ** 2;
const mean = (a: number, b: number) => (cum[Math.min(N, Math.max(0, b))] - cum[Math.min(N, Math.max(0, a))]) / Math.max(1, b - a);
const ms = (v: number) => Math.round((v / 1000) * SR);
for (const e of EVENTS.filter((e) => e.kind === 'impact' || e.kind === 'hit')) {
  const c = at(e.f);
  let best = {s: 0, ratio: 0};
  for (let s = Math.round(c - 3 * 735); s <= c + 3 * 735; s += 16) {
    const ratio = mean(s, s + ms(10)) / (mean(s - ms(50), s - ms(5)) + 1e-12);
    if (ratio > best.ratio) best = {s, ratio};
  }
  const off = (best.s - c) / 735;
  const db = 10 * Math.log10(best.ratio);
  console.log(`${Math.abs(off) <= 1 && db >= 6 ? 'ok  ' : 'FAIL'} f${String(e.f).padStart(4)} ${e.kind.padEnd(6)} onset ${off >= 0 ? '+' : ''}${off.toFixed(2)} f  jump ${db.toFixed(1)} dB`);
  assert.ok(Math.abs(off) <= 1 && db >= 6, `onset at f${e.f}`);
}
// 3) the repair is real: original − processed is the damage, and it is silent from the repair frame on
let before = 0;
let after = 0;
for (let i = 0; i < N; i++) {
  const d = (orig[i] - proc[i]) ** 2;
  if (i < at(T.repair)) before += d;
  else after += d;
}
console.log(`damage energy  before repair ${before.toExponential(2)}  after ${after.toExponential(2)}`);
assert.ok(before > 0 && after < 1e-9, 'hum/clicks must stop exactly at the repair frame');
console.log(`wrote ${COLS}×${ROWS_N} spectrograms (ref ${REF.toFixed(1)} dB) → public/mpw/sound/`);
