// Fast verification stills of MkVoiceWorlds: one bundle, one browser.
// Usage: node scripts/mkv/stills.ts <frame> [frame...]   → ../out/stills/mkv-fNNNN.png
//        node scripts/mkv/stills.ts boundaries            → b-6, b, b+6 for all ten portals
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {BOUNDARIES} from '../../src/mkv/shell/timing.ts';

const args = process.argv.slice(2);
const frames = args.flatMap((a) => (a === 'boundaries' ? BOUNDARIES.flatMap((b) => [b - 6, b, b + 6]) : [Number(a)]));
if (!frames.length || frames.some((f) => !Number.isInteger(f) || f < 0 || f >= 5400)) {
  console.error('usage: node scripts/mkv/stills.ts <frame 0..5399 | boundaries> ...');
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, '../..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id: 'MkVoiceWorlds', puppeteerInstance: browser});
for (const frame of frames) {
  const output = path.resolve(root, '../out/stills', `mkv-f${String(frame).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame, output, puppeteerInstance: browser, overwrite: true, chromiumOptions: {gl: 'angle'}});
  console.log(output);
}
await browser.close({silent: true});
