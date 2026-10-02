// Onset check: every impact/hit (framework events + every world's EVENTS, converted to global frames) must have a
// sound onset within ±1 video frame of its frame. Works on the WAV and on a rendered MP4 (decoded with ffmpeg).
// Usage: node scripts/mkv/check.ts [file]   (default public/mkv/music.wav)
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {FPS, WORLDS} from '../../src/mkv/timing.ts';
import {FW_EVENTS} from '../../src/mkv/shell/timing.ts';

const SR = 44100;
const file = process.argv[2] ?? fileURLToPath(new URL('../../public/mkv/music.wav', import.meta.url));
const pcm = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {maxBuffer: 1 << 30});
assert.equal(pcm.status, 0, `ffmpeg failed to decode ${file}`);
const x = new Float32Array(pcm.stdout.buffer, pcm.stdout.byteOffset, pcm.stdout.byteLength / 4);

// Events: framework + worlds (impact/hit only), deduplicated by frame.
const events = new Map<number, string>();
for (const e of FW_EVENTS) events.set(e.f, e.what);
for (const w of WORLDS) {
  const {EVENTS} = (await import(`../../src/mkv/worlds/${w.id}/timing.ts`)) as {EVENTS: {f: number; kind: string}[]};
  for (const e of EVENTS) if (e.kind === 'impact' || e.kind === 'hit') events.set(w.start + e.f, events.get(w.start + e.f) ?? `${w.id} ${e.kind} @${e.f}`);
}

// Pre-emphasis so transients stand out over low beds, then a prefix sum of energy.
const cum = new Float64Array(x.length + 1);
for (let n = 0; n < x.length; n++) {
  const y = x[n] - 0.97 * (n ? x[n - 1] : 0);
  cum[n + 1] = cum[n] + y * y;
}
const mean = (a: number, b: number) => (cum[Math.min(x.length, Math.max(0, b))] - cum[Math.min(x.length, Math.max(0, a))]) / Math.max(1, b - a);
const ms = (v: number) => Math.round((v / 1000) * SR);
const FRAME = SR / FPS;

let failed = 0;
const sorted = [...events.entries()].sort((a, b) => a[0] - b[0]);
for (const [frame, what] of sorted) {
  const c = (frame / FPS) * SR;
  let best = {s: 0, ratio: 0};
  for (let s = Math.round(c - 3 * FRAME); s <= c + 3 * FRAME; s += 16) {
    const ratio = mean(s, s + ms(10)) / (mean(s - ms(50), s - ms(5)) + 1e-12);
    if (ratio > best.ratio) best = {s, ratio};
  }
  const off = (best.s - c) / FRAME;
  const db = 10 * Math.log10(best.ratio);
  const ok = Math.abs(off) <= 1 && db >= 6;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} frame ${String(frame).padStart(4)}  onset ${off >= 0 ? '+' : ''}${off.toFixed(2)} f  jump ${db.toFixed(1).padStart(5)} dB  ${what}`);
}
assert.equal(failed, 0, `${failed} of ${sorted.length} onset(s) missing or off by more than one frame`);
console.log(`all ${sorted.length} impacts/hits within ±1 frame (${file})`);
