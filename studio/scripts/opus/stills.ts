// Render many stills from one bundle + one browser: node scripts/opus/stills.ts 0 30 150 ...
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outDir = path.resolve(root, '../out/stills');
const frames = process.argv.slice(2).map(Number);
const chromiumOptions = {gl: 'angle' as const};

const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browser = await openBrowser('chrome', {chromiumOptions});
const composition = await selectComposition({serveUrl, id: 'OpusMotion', puppeteerInstance: browser, chromiumOptions});
for (const frame of frames) {
  const t = Date.now();
  const output = path.join(outDir, `opus-f${String(frame).padStart(4, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, puppeteerInstance: browser, chromiumOptions, overwrite: true});
  console.log(`frame ${frame} -> ${path.basename(output)} (${Date.now() - t} ms)`);
}
await browser.close({silent: true});
