import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const root = path.resolve(import.meta.dirname, '../../..');
const input = path.join(root, 'out/MK-Suite-Launch-render.mp4');
const score = path.join(root, 'studio/public/mks/music.wav');
const output = path.join(root, 'out/MK-Suite-Launch.mp4');
const temporary = path.join(root, `out/.master-${process.pid}.mp4`);

assert.ok(fs.existsSync(input), 'Run npm run render first.');
assert.ok(fs.existsSync(score), 'Run npm run music first.');
assert.ok(!fs.existsSync(output), 'Final output already exists. Move it aside before mastering another export.');

const result = spawnSync('ffmpeg', [
  '-hide_banner', '-nostats', '-n',
  '-i', input, '-i', score,
  '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'copy',
  '-af', 'aresample=192000,alimiter=limit=0.75:level=false:attack=2:release=50:latency=true,aresample=48000',
  '-c:a', 'aac', '-b:a', '320k', '-ar', '48000',
  '-t', '120', '-movflags', '+faststart', temporary,
], {stdio: 'inherit'});

assert.equal(result.status, 0, `ffmpeg failed: ${result.error?.message ?? result.status}. Any partial export remains at ${temporary}.`);
fs.copyFileSync(temporary, output, fs.constants.COPYFILE_EXCL);
fs.unlinkSync(temporary);
console.log(`Master saved: ${output}`);
console.log('Run npm run verify to check the new delivery.');
