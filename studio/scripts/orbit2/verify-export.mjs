// Verify the encoded delivery, and make contact sheets from the actual MP4.
// node scripts/orbit2/verify-export.mjs <final.mp4> [--contacts]
import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {closeSync, createReadStream, openSync, readSync, statSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const file = path.resolve(process.argv[2]);
function run(program, args) {
  const result = spawnSync(program, args, {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
  assert.equal(result.status, 0, `${program} failed: ${result.error?.message ?? result.stderr}`);
  return result;
}
const metadata = JSON.parse(run('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).stdout);
const video = metadata.streams.find((s) => s.codec_type === 'video');
const audio = metadata.streams.find((s) => s.codec_type === 'audio');
assert.ok(video && audio, 'Both video and audio must be present.');
assert.equal(video.codec_name, 'h264');
assert.equal(audio.codec_name, 'aac');
assert.equal(video.width, 1920);
assert.equal(video.height, 1080);
assert.equal(video.nb_frames, '7200');
assert.equal(video.avg_frame_rate, '60/1');
assert.equal(video.pix_fmt, 'yuv420p');
assert.equal(video.color_space, 'bt709');
assert.equal(video.color_transfer, 'bt709');
assert.equal(video.color_primaries, 'bt709');
assert.equal(audio.channels, 2);
assert.ok(Math.abs(Number(metadata.format.duration) - 120) <= 1 / 60);
assert.ok(Math.abs(Number(video.start_time ?? 0)) <= 1 / 60);
assert.ok(Math.abs(Number(audio.start_time ?? 0)) <= 1 / 60);
// Decode all streams; headers alone do not establish an intact export.
const decoded = run('ffmpeg', ['-hide_banner', '-v', 'error', '-xerror', '-i', file, '-f', 'null', '-']);
assert.equal(decoded.stderr.trim(), '', 'Decoder reported an error.');
const descriptor = openSync(file, 'r');
const atomOrder = [];
try {
  const header = Buffer.alloc(16);
  const size = statSync(file).size;
  for (let offset = 0; offset + 8 <= size;) {
    readSync(descriptor, header, 0, 16, offset);
    let atomSize = header.readUInt32BE(0);
    const atom = header.toString('ascii', 4, 8);
    if (atomSize === 1) atomSize = Number(header.readBigUInt64BE(8));
    if (atomSize === 0) atomSize = size - offset;
    assert.ok(atomSize >= 8 && offset + atomSize <= size, 'Invalid MP4 atom.');
    atomOrder.push(atom);
    offset += atomSize;
  }
} finally { closeSync(descriptor); }
assert.ok(atomOrder.indexOf('moov') >= 0 && atomOrder.indexOf('moov') < atomOrder.indexOf('mdat'), 'Expected fast-start MP4.');
const hash = createHash('sha256');
for await (const chunk of createReadStream(file)) hash.update(chunk);
const contacts = process.argv.includes('--contacts');
const selectedFrames = [40, 126, 600, 1000, 1410, 1620, 1890, 2140, 2520, 2680, 3100, 3580, 4060, 4600, 5020, 5500, 5940, 6040, 6330, 6800];
if (contacts) {
  const selection = selectedFrames.map((n) => `eq(n\\,${n})`).join('+');
  run('ffmpeg', ['-hide_banner', '-v', 'error', '-n', '-i', file, '-vf', `select='${selection}',scale=480:270,tile=4x5`, '-frames:v', '1', '-q:v', '2', path.join(path.dirname(file), 'master-contact.jpg')]);
  run('ffmpeg', ['-hide_banner', '-v', 'error', '-n', '-i', file, '-vf', 'select=eq(n\\,6330)', '-frames:v', '1', '-q:v', '2', path.join(path.dirname(file), 'poster.jpg')]);
}
const report = {file, bytes: statSync(file).size, sha256: hash.digest('hex'), metadata, atomOrder, decodedAllStreams: true, technicalPass: true, contactFrames: contacts ? selectedFrames : [], visualInspection: contacts ? 'Contact sheet generated; inspection must be recorded separately.' : 'Not performed by this script.', listened: false};
writeFileSync(file + '.media-qc.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({file, bytes: report.bytes, sha256: report.sha256, frames: 7200, fps: 60, seconds: 120, technicalPass: true, decodedAllStreams: true}, null, 2));
