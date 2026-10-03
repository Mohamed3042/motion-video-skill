// Preserve the saved film and render to a separate, reviewable delivery folder.
// node scripts/orbit2/resume.mjs review|render [output-folder]
import assert from 'node:assert/strict';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {SECTIONS} from '../../src/orbit2/timing.ts';

const [mode, destination] = process.argv.slice(2);
assert.ok(['review', 'render'].includes(mode), 'Usage: node scripts/orbit2/resume.mjs review|render [output-folder]');
const studio = path.resolve(import.meta.dirname, '../..');
const output = path.resolve(destination ?? path.join(studio, '../out/codex-resume-20261003'));
mkdirSync(output, {recursive: true});
function inventory(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? inventory(file) : [{path: path.relative(studio, file), sha256: createHash('sha256').update(readFileSync(file)).digest('hex')}];
  });
}
const files = [...inventory(path.join(studio, 'src/orbit2')), ...inventory(path.join(studio, 'public/orbit2'))].sort((a, b) => a.path.localeCompare(b.path));
const fingerprint = createHash('sha256').update(JSON.stringify(files)).digest('hex');
const bundlePath = path.join(output, 'bundle');
const reviewPath = path.join(output, 'review.json');
if (mode === 'review') {
  assert.ok(!existsSync(reviewPath), 'Review already exists; use a fresh output folder to preserve evidence.');
  await bundle({entryPoint: path.join(studio, 'src/orbit2/entry.tsx'), publicDir: path.join(studio, 'public'), outDir: bundlePath, enableCaching: false});
} else {
  const review = JSON.parse(readFileSync(reviewPath, 'utf8'));
  assert.equal(review.fingerprint, fingerprint, 'Source or assets changed after review; render a fresh review before proceeding.');
}
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
try {
  const composition = await selectComposition({serveUrl: bundlePath, id: 'JobOrbit2', puppeteerInstance: browser});
  assert.equal(composition.durationInFrames, 7200);
  assert.equal(composition.fps, 60);
  assert.equal(composition.width, 1920);
  assert.equal(composition.height, 1080);
  if (mode === 'review') {
    const stills = path.join(output, 'stills');
    mkdirSync(stills, {recursive: true});
    // Ten views of each station, including approach, reveal, product beats and departure.
    const frames = [...new Set([
      0, 30, 120, 210, 300, 360, 420, 480, 570, 690,
      720, 780, 840, 930, 990, 1080, 1170, 1260, 1308, 1332,
      ...SECTIONS.filter((s) => s.start >= 1320).flatMap((s) => [-24, 0, 40, 90, 120, 170, 240, 300, 340, 400, 460, 500].map((f) => s.start + f)),
      6100, 6120, 6160, 6260, 6330, 6430, 6484, 6580, 6650, 6800, 7050, 7199,
    ])].filter((f) => f >= 0 && f < 7200).sort((a, b) => a - b);
    const started = Date.now();
    for (const [i, frame] of frames.entries()) {
      await renderStill({serveUrl: bundlePath, composition, frame, output: path.join(stills, `f${String(frame).padStart(4, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 95, overwrite: false, puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}, logLevel: 'error'});
      if ((i + 1) % 10 === 0 || i === frames.length - 1) console.log(`Review ${i + 1}/${frames.length}: frame ${frame}`);
    }
    writeFileSync(reviewPath, JSON.stringify({composition: composition.id, fingerprint, files, frames, secondsElapsed: (Date.now() - started) / 1000, visualReview: 'Pending inspection of stills'}, null, 2));
    console.log(`Review saved: ${reviewPath}`);
  } else {
    const raw = path.join(output, 'job-orbit-v2-raw.mp4');
    assert.ok(!existsSync(raw), 'Raw output already exists; preserve it and use a new output folder.');
    let lastProgress = -1;
    const started = Date.now();
    const result = await renderMedia({serveUrl: bundlePath, composition, codec: 'h264', outputLocation: raw, muted: true, crf: 16, pixelFormat: 'yuv420p', colorSpace: 'bt709', imageFormat: 'jpeg', jpegQuality: 95, concurrency: 4, overwrite: false, puppeteerInstance: browser, chromiumOptions: {gl: 'angle'}, logLevel: 'error', onProgress: (p) => {
      const percent = Math.floor(p.progress * 100);
      if (percent >= lastProgress + 2) { lastProgress = percent; console.log(`${percent}% — ${p.renderedFrames}/7200 frames rendered, ${p.encodedFrames} encoded`); }
      writeFileSync(path.join(output, 'render-progress.json'), JSON.stringify({...p, secondsElapsed: (Date.now() - started) / 1000}));
    }});
    writeFileSync(path.join(output, 'render-result.json'), JSON.stringify({fingerprint, raw, secondsElapsed: (Date.now() - started) / 1000, slowestFrames: result.slowestFrames}, null, 2));
    console.log(`Raw picture saved: ${raw}`);
  }
} finally {
  await browser.close({silent: true});
}
