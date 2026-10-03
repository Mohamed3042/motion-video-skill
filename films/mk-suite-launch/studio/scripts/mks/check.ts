// Onset check for the MK Suite launch film: every impact / hit / key / click (all acts' EVENTS in global frames, plus
// the score's own act-start impacts) must have a sound onset within ±1 video frame of its frame, with an energy jump
// of at least 6 dB over the 50 ms before it. Works on the WAV and on a rendered MP4 (decoded with ffmpeg).
// Usage: node scripts/mks/check.ts [file.wav|file.mp4]      (default public/mks/music.wav)
//        MKS_EVENTS=<file.ts> node scripts/mks/check.ts     (synthetic events, same as music.ts)
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {FPS} from '../../src/mks/timing.ts';
import {CHECKED, loadEvents, scoreImpacts} from './dsp.ts';

const SR = 44100;
const file = process.argv[2] ?? fileURLToPath(new URL('../../public/mks/music.wav', import.meta.url));
const pcm = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {maxBuffer: 1 << 30});
assert.equal(pcm.status, 0, `ffmpeg failed to decode ${file}`);
const x = new Float32Array(pcm.stdout.buffer, pcm.stdout.byteOffset, pcm.stdout.byteLength / 4);

const ev = await loadEvents();
const events = new Map<number, string>();
for (const f of scoreImpacts(ev)) events.set(f, 'score impact (act start / final chord)');
for (const e of ev) if (CHECKED.includes(e.kind)) events.set(e.g, [events.get(e.g), `${e.act} ${e.kind} @${e.f}`].filter(Boolean).join(' + '));

// Pre-emphasis so transients stand out over low beds, then a prefix sum of energy.
const cum = new Float64Array(x.length + 1);
for (let n = 0; n < x.length; n++) {
  const y = x[n] - 0.97 * (n ? x[n - 1] : 0);
  cum[n + 1] = cum[n] + y * y;
}
const clampI = (i: number) => Math.min(x.length, Math.max(0, i));
const mean = (a: number, b: number) => (cum[clampI(b)] - cum[clampI(a)]) / Math.max(1, b - a);
const ms = (v: number) => Math.round((v / 1000) * SR);
const FRAME = SR / FPS;

let failed = 0;
const sorted = [...events.entries()].sort((a, b) => a[0] - b[0]);
for (const [frame, what] of sorted) {
  const c = (frame / FPS) * SR;
  // strongest onset whose start lies within ±1 frame: energy of the next 10 ms vs the 50 ms before it
  let best = {s: 0, ratio: 0};
  for (let s = Math.round(c - FRAME); s <= c + FRAME; s += 8) {
    const ratio = mean(s, s + ms(10)) / (mean(s - ms(50), s) + 1e-12);
    if (ratio > best.ratio) best = {s, ratio};
  }
  const off = (best.s - c) / FRAME;
  const db = 10 * Math.log10(best.ratio);
  const ok = db >= 6;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} frame ${String(frame).padStart(4)}  onset ${off >= 0 ? '+' : ''}${off.toFixed(2)} f  jump ${db.toFixed(1).padStart(5)} dB  ${what}`);
}
assert.equal(failed, 0, `${failed} of ${sorted.length} onset(s) missing, weak (< 6 dB) or off by more than one frame`);
console.log(`all ${sorted.length} impacts/hits/keys/clicks have an onset within ±1 frame, ≥ 6 dB (${file})`);
