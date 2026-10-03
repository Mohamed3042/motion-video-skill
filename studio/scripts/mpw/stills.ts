// Fast verification stills of MontageProWorlds: one bundle of src/mpw-entry.tsx, one browser.
// Usage: node scripts/mpw/stills.ts <frame> [frame...]   → ../out/stills/mpw-fNNNN.png
//        node scripts/mpw/stills.ts boundaries            → b-6, b, b+6 for all twelve edits
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {DURATION} from '../../src/mpw/timing.ts';
import {BOUNDARIES} from '../../src/mpw/shell/timing.ts';

const args = process.argv.slice(2);
const frames = args.flatMap((a) => (a === 'boundaries' ? BOUNDARIES.flatMap((b) => [b - 6, b, b + 6]) : [Number(a)]));
if (!frames.length || frames.some((f) => !Number.isInteger(f) || f < 0 || f >= DURATION)) {
  console.error(`usage: node scripts/mpw/stills.ts <frame 0..${DURATION - 1} | boundaries> ...`);
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, '../..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/mpw-entry.tsx'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id: 'MontageProWorlds', puppeteerInstance: browser});
for (const frame of frames) {
  const output = path.resolve(root, '../out/stills', `mpw-f${String(frame).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame, output, puppeteerInstance: browser, overwrite: true, chromiumOptions: {gl: 'angle'}});
  console.log(output);
}
await browser.close({silent: true});
fs.rmSync(serveUrl, {recursive: true, force: true}); // the bundle copies public/ (~270 MB): don't leave it in %TEMP%
