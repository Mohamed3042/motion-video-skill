// Run only after the final MP4 render completes: node production-video-qc.mjs
// Reads the export and approved review manifest; writes evidence under review/exported.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const media = path.join(root, 'outputs/mk-suite-worlds.mp4');
const review = path.join(root, 'outputs/mk-suite-worlds/review');
const out = path.join(review, 'exported');
const expected = {seconds: 90, frames: 5400, fps: 60, width: 1920, height: 1080, videoCodec: 'h264', audioCodec: 'aac'};
const results = {
  media, expected, status: 'running', metadata: null, audio: null,
  blackDetection: {pix_th: 0.03, pic_th: 0.98, minimumSeconds: 0.1, intervals: []},
  checks: [], warnings: [], failures: [], commands: [], frames: [], sheets: [],
};
fs.mkdirSync(out, {recursive: true});
const saveResults = () => fs.writeFileSync(path.join(out, 'exported-qc.json'), JSON.stringify(results, null, 2));
const fail = (message) => {results.failures.push(message); console.error('FAIL: ' + message);};
const check = (name, passed, observed, required) => {
  results.checks.push({name, passed, observed, required});
  if (!passed) fail(`${name}: observed ${JSON.stringify(observed)}, required ${JSON.stringify(required)}`);
};
const run = (name, command, args, cwd = root) => {
  console.log(name);
  const r = spawnSync(command, args, {cwd, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, windowsHide: true});
  const stdout = r.stdout ?? '', stderr = r.stderr ?? '';
  fs.writeFileSync(path.join(out, `${name}.stdout.log`), stdout);
  fs.writeFileSync(path.join(out, `${name}.stderr.log`), stderr);
  const record = {name, command, args, cwd, exitCode: r.status, signal: r.signal, error: r.error?.message ?? null};
  results.commands.push(record);
  fs.writeFileSync(path.join(out, 'commands.json'), JSON.stringify(results.commands, null, 2));
  if (r.error || r.status !== 0) fail(`${name} failed: ${r.error?.message ?? `exit ${r.status}, signal ${r.signal}`}; see ${name}.stderr.log`);
  return {...r, stdout, stderr, ok: !r.error && r.status === 0};
};
const rate = (value) => {
  const [a, b = 1] = String(value ?? '').split('/').map(Number);
  return b ? a / b : NaN;
};
const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const near = (a, b, epsilon = 1e-6) => Number.isFinite(a) && Math.abs(a - b) <= epsilon;
const timeLabel = (frame) => {
  const seconds = frame / expected.fps;
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${(seconds % 60).toFixed(3).padStart(6, '0')}`;
};
const filterPath = (file) => file.replaceAll('\\', '/').replaceAll(':', '\\:').replaceAll("'", "\\'");

try {
  if (!fs.existsSync(media)) throw new Error('Final MP4 does not exist. Run this script only after rendering completes.');
  results.fileBytes = fs.statSync(media).size;
  const probe = run('01-ffprobe', 'ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', media]);
  if (!probe.ok) throw new Error('Cannot validate metadata because ffprobe failed.');
  const metadata = JSON.parse(probe.stdout);
  fs.writeFileSync(path.join(out, 'ffprobe.json'), JSON.stringify(metadata, null, 2));
  const video = metadata.streams?.find(s => s.codec_type === 'video');
  const audio = metadata.streams?.find(s => s.codec_type === 'audio');
  if (!video || !audio) throw new Error('The final export must contain both a video stream and an audio stream.');
  results.metadata = {
    containerDuration: numeric(metadata.format?.duration), videoDuration: numeric(video.duration),
    containerMinusExpectedSeconds: Number(metadata.format?.duration) - 90,
    frameCount: numeric(video.nb_read_frames), declaredFrames: numeric(video.nb_frames),
    width: video.width, height: video.height, averageFps: rate(video.avg_frame_rate), nominalFps: rate(video.r_frame_rate),
    videoCodec: video.codec_name, audioCodec: audio.codec_name, pixelFormat: video.pix_fmt,
    colorSpace: video.color_space, colorPrimaries: video.color_primaries, colorTransfer: video.color_transfer,
    audioSampleRate: numeric(audio.sample_rate), audioChannels: audio.channels,
  };
  const m = results.metadata;
  check('container duration', near(m.containerDuration, 90, 1 / 60), m.containerDuration, '90 seconds within one video frame');
  check('video duration', near(m.videoDuration, 90), m.videoDuration, 'exactly 90 seconds');
  check('decoded video frame count', m.frameCount === 5400, m.frameCount, 5400);
  check('dimensions', m.width === 1920 && m.height === 1080, [m.width, m.height], [1920, 1080]);
  check('average frame rate', near(m.averageFps, 60), m.averageFps, 60);
  check('nominal frame rate', near(m.nominalFps, 60), m.nominalFps, 60);
  check('video codec', m.videoCodec === 'h264', m.videoCodec, 'h264');
  check('audio codec', m.audioCodec === 'aac', m.audioCodec, 'aac');
  check('pixel format', m.pixelFormat === 'yuv420p', m.pixelFormat, 'yuv420p');
  if (m.colorSpace !== 'bt709') results.warnings.push(`Color-space tag is ${m.colorSpace ?? 'missing'}; expected bt709.`);

  // -xerror + explode makes damaged/corrupt input fail the process, rather than silently concealing it.
  const decode = run('02-full-decode', 'ffmpeg', [
    '-hide_banner', '-nostdin', '-nostats', '-loglevel', 'repeat+level+info', '-xerror', '-err_detect', 'explode',
    '-i', media, '-map', '0:v:0', '-map', '0:a:0',
    '-vf', 'blackdetect=d=0.1:pix_th=0.03:pic_th=0.98', '-af', 'ebur128=peak=true', '-f', 'null', '-',
  ]);
  const decoderErrors = decode.stderr.split(/\r?\n/).filter(line => /\[(?:error|fatal|panic)\]/i.test(line));
  check('full video and audio decode', decode.ok && decoderErrors.length === 0, {exitCode: decode.status, errors: decoderErrors}, 'exit 0 and no decoder errors');
  results.blackDetection.intervals = [...decode.stderr.matchAll(/black_start:\s*([\d.]+)\s+black_end:\s*([\d.]+)\s+black_duration:\s*([\d.]+)/g)]
    .map(match => ({start: Number(match[1]), end: Number(match[2]), duration: Number(match[3])}));
  if (results.blackDetection.intervals.length) results.warnings.push(`${results.blackDetection.intervals.length} near-black interval(s) need visual review; see blackDetection.intervals.`);
  const summary = decode.stderr.slice(Math.max(0, decode.stderr.lastIndexOf('Summary:')));
  const integrated = summary.match(/Integrated loudness:\s*I:\s*(-?[\d.]+|-inf)\s+LUFS/);
  const truePeak = summary.match(/True peak:\s*Peak:\s*(-?[\d.]+|-inf)\s+dBFS/);
  const lra = summary.match(/LRA:\s*([\d.]+)\s+LU/);
  results.audio = {
    integratedLufs: integrated ? numeric(integrated[1]) : null,
    truePeakDbTP: truePeak ? numeric(truePeak[1]) : null,
    loudnessRangeLU: lra ? numeric(lra[1]) : null,
    method: 'ffmpeg ebur128=peak=true, measured from the exported AAC stream',
    listenedTo: false,
  };
  check('exported audio measurements available', results.audio.integratedLufs !== null && results.audio.truePeakDbTP !== null, results.audio, 'finite integrated loudness and true peak');
  if (results.audio.integratedLufs !== null && Math.abs(results.audio.integratedLufs + 14) > 1) results.warnings.push(`Export loudness ${results.audio.integratedLufs} LUFS is outside -14 +/- 1 LUFS.`);
  if (results.audio.truePeakDbTP !== null && results.audio.truePeakDbTP >= -1) results.warnings.push(`Export true peak ${results.audio.truePeakDbTP} dBTP does not meet the below -1 dBTP target.`);

  const sourceManifest = JSON.parse(fs.readFileSync(path.join(review, 'worlds-manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
  const heroes = sourceManifest.filter(e => /^world-\d{2}-1\.png$/.test(e.file)).sort((a, b) => a.frame - b.frame);
  const worldIds = heroes.map(e => Number(e.file.match(/^world-(\d{2})-1/)[1]));
  if (heroes.length !== 23 || worldIds.some((id, index) => id !== index)) throw new Error('Review manifest must contain exactly the j=1 hero for every world 00 through 22.');
  const entries = [
    {frame: 96, label: 'Opening', source: null},
    ...heroes.map(e => ({frame: e.frame, label: e.label.replace(/ hero$/, ''), source: e.file})),
    {frame: 5340, label: 'Monthly subscription closing', source: null},
  ].map((e, i) => ({...e, number: i + 1, time: timeLabel(e.frame), file: `frames/scene-${String(i + 1).padStart(2, '0')}.png`, sheet: `exported-sheet-${Math.floor(i / 6) + 1}.jpg`}));
  if (entries.some(e => !Number.isInteger(e.frame) || e.frame < 0 || e.frame >= 5400)) throw new Error('Invalid extraction frame in the approved manifest.');
  fs.mkdirSync(path.join(out, 'frames'), {recursive: true});
  fs.mkdirSync(path.join(out, 'labels'), {recursive: true});
  const select = entries.map(e => `eq(n\\,${e.frame})`).join('+');
  const extract = run('03-extract-25-frames', 'ffmpeg', [
    '-hide_banner', '-nostdin', '-v', 'error', '-y', '-xerror', '-i', media, '-map', '0:v:0',
    '-vf', `select=${select}`, '-fps_mode', 'vfr', '-frames:v', String(entries.length), '-start_number', '1',
    '-threads', '1', path.join(out, 'frames/scene-%02d.png'),
  ]);
  if (!extract.ok) throw new Error('Exact-frame extraction failed.');
  const missing = entries.filter(e => !fs.existsSync(path.join(out, e.file)) || fs.statSync(path.join(out, e.file)).size === 0);
  check('all exported review frames extracted', missing.length === 0, {expected: 25, present: 25 - missing.length}, {expected: 25, present: 25});
  if (missing.length) throw new Error('Missing extracted frames: ' + missing.map(e => e.file).join(', '));
  results.frames = entries;
  fs.writeFileSync(path.join(out, 'exported-frames-manifest.json'), JSON.stringify(entries, null, 2));

  const fontCandidates = [
    path.join(process.env.WINDIR ?? 'C:/Windows', 'Fonts/arial.ttf'),
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/System/Library/Fonts/Helvetica.ttc',
  ];
  const font = fontCandidates.find(file => fs.existsSync(file));
  if (!font) throw new Error('No local font found for numbered contact-sheet labels.');
  for (let page = 0; page < Math.ceil(entries.length / 6); page++) {
    const list = entries.slice(page * 6, page * 6 + 6);
    const args = ['-hide_banner', '-nostdin', '-v', 'error', '-y'];
    for (const e of list) args.push('-i', e.file);
    for (let i = list.length; i < 6; i++) args.push('-f', 'lavfi', '-i', 'color=c=0x10121a:s=960x584:r=1:d=1');
    const filter = [];
    for (let i = 0; i < 6; i++) {
      if (i < list.length) {
        const e = list[i], labelFile = `labels/scene-${String(e.number).padStart(2, '0')}.txt`;
        fs.writeFileSync(path.join(out, labelFile), `${String(e.number).padStart(2, '0')} | ${e.label} | ${e.time} | frame ${e.frame}`);
        filter.push(`[${i}:v]scale=960:540,pad=960:584:0:0:color=0x10121a,drawtext=fontfile='${filterPath(font)}':textfile='${labelFile}':fontcolor=white:fontsize=24:x=20:y=550,format=rgb24[s${i}]`);
      } else filter.push(`[${i}:v]format=rgb24[s${i}]`);
    }
    filter.push('[s0][s1][s2][s3][s4][s5]xstack=inputs=6:layout=0_0|960_0|0_584|960_584|0_1168|960_1168:fill=0x10121a[out]');
    const sheet = `exported-sheet-${page + 1}.jpg`;
    args.push('-filter_complex_threads', '1', '-filter_complex', filter.join(';'), '-map', '[out]', '-frames:v', '1', '-q:v', '2', '-threads', '1', sheet);
    const rendered = run(`04-contact-sheet-${page + 1}`, 'ffmpeg', args, out);
    if (!rendered.ok) throw new Error(`Contact sheet ${page + 1} failed.`);
    results.sheets.push({page: page + 1, file: sheet, entries: list.map(e => e.number)});
  }
  results.sha256 = await new Promise((resolve, reject) => {
    const hash = createHash('sha256'), stream = fs.createReadStream(media);
    stream.on('error', reject).on('data', chunk => hash.update(chunk)).on('end', () => resolve(hash.digest('hex')));
  });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  results.status = results.failures.length ? 'failed' : results.warnings.length ? 'passed_with_review_notes' : 'passed';
  saveResults();
  console.log(JSON.stringify({status: results.status, failures: results.failures, warnings: results.warnings, audio: results.audio, frames: results.frames.length, sheets: results.sheets.length, report: path.join(out, 'exported-qc.json')}, null, 2));
  if (results.failures.length) process.exitCode = 1;
}
