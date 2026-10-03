// Render ONE world's sound alone (for checking while building): node scripts/mpw/solo.ts <worldId>
// → public/mpw/solo-<id>.wav  (0.5 s lead-in, world, 0.5 s tail; send bus mixed in dry at -8 dB, no reverb)
// Measure: ffmpeg -i public/mpw/solo-<id>.wav -af ebur128=peak=true -f null -
import {mkdirSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {FPS, worldById, type WorldId} from '../../src/mpw/timing.ts';
import type {SynthCtx} from './types.ts';

const id = process.argv[2] as WorldId;
const w = worldById(id);
const SR = 44100;
const lead = 0.5;
const length = w.end - w.start;
const N = Math.round((length / FPS + 2 * lead) * SR);
const ctx: SynthCtx = {
  SR,
  L: new Float64Array(N),
  R: new Float64Array(N),
  sendL: new Float64Array(N),
  sendR: new Float64Array(N),
  length,
  at: (f) => (lead + f / FPS) * SR,
};
const mod = await import(`./worlds/${id}.ts`);
mod.default(ctx);

const g = 10 ** (-8 / 20);
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 4, 40);
let peak = 0;
for (let i = 0; i < N; i++) {
  const l = ctx.L[i] + g * ctx.sendL[i];
  const r = ctx.R[i] + g * ctx.sendR[i];
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, l)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, r)) * 32767), 46 + i * 4);
}
const outDir = fileURLToPath(new URL('../../public/mpw/', import.meta.url));
mkdirSync(outDir, {recursive: true});
writeFileSync(outDir + `solo-${id}.wav`, buf);
console.log(`solo-${id}.wav  peak ${(20 * Math.log10(peak || 1e-9)).toFixed(1)} dBFS${peak > 1 ? '  (CLIPPED)' : ''}`);
