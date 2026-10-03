import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const root = path.resolve(import.meta.dirname, '../../..');
const file = path.join(root, 'out/MK-Suite-Launch.mp4');
const evidence = path.join(root, 'evidence');
const run = (exe, args, log) => {
  const r = spawnSync(exe, args, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  if (log) fs.writeFileSync(path.join(evidence, log), `${r.stdout ?? ''}\n${r.stderr ?? ''}`);
  assert.equal(r.status, 0, `${exe} failed: ${r.error?.message ?? r.stderr?.slice(-1500)}`);
  return r;
};

const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], 'final-probe.json').stdout);
const video = probe.streams.find(s => s.codec_type === 'video');
const audio = probe.streams.find(s => s.codec_type === 'audio');
assert.equal(video.codec_name, 'h264');
assert.equal(video.width, 1920);
assert.equal(video.height, 1080);
assert.equal(video.r_frame_rate, '60/1');
assert.equal(Number(video.nb_frames), 7200);
assert.ok(Math.abs(Number(probe.format.duration) - 120) < 0.025);
assert.equal(audio.codec_name, 'aac');
assert.equal(audio.channels, 2);
assert.ok(Math.abs(Number(audio.start_time ?? 0)) <= 1 / 60);

const decode = run('ffmpeg', ['-hide_banner', '-v', 'error', '-nostats', '-xerror', '-progress', 'pipe:1', '-i', file, '-f', 'null', '-'], 'final-decode.log');
const decodedFrames = Number([...decode.stdout.matchAll(/frame=\s*(\d+)/g)].at(-1)?.[1]);
assert.equal(decodedFrames, 7200);

const loud = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], 'final-audio.log');
const summary = loud.stderr.slice(loud.stderr.lastIndexOf('Summary:'));
const integratedLUFS = Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]);
const truePeakDBTP = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1]);
assert.ok(Math.abs(integratedLUFS + 14) <= 0.5);
assert.ok(truePeakDBTP < -1);

const onsets = run(process.execPath, [path.join(root, 'studio/scripts/mks/check.ts'), file], 'final-onsets.log');
const checkedOnsets = Number(/all (\d+) impacts/.exec(onsets.stdout)?.[1]);
assert.equal(checkedOnsets, 67);

const result = {
  status: 'passed', file, width: 1920, height: 1080, fps: 60,
  durationSeconds: Number(probe.format.duration), decodedFrames,
  videoCodec: 'h264', audioCodec: 'aac', audioChannels: audio.channels,
  audioSampleRate: Number(audio.sample_rate), integratedLUFS, truePeakDBTP,
  checkedOnsets, onsetToleranceFrames: 1,
  scope: 'Full technical decode, loudness and declared impact/hit/key/click onsets; sampled visual review is documented separately.',
};
fs.writeFileSync(path.join(evidence, 'delivery-validation.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
