// Fast verification stills of JobOrbit: one bundle, one browser.
// Usage: node scripts/orbit2/stills.ts <frame> [frame...]   → ../out/stills/orbit2-fNNNN.png
//        node scripts/orbit2/stills.ts boundaries            → b-6, b, b+6 for all twelve portals
//        node scripts/orbit2/stills.ts portal 3              → every frame b-6 … b+6 of portal 3
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {BOUNDARIES} from '../../src/orbit2/shell/timing.ts';

const args = process.argv.slice(2);
const frames =
  args[0] === 'portal'
    ? Array.from({length: 13}, (_, i) => BOUNDARIES[Number(args[1])] - 6 + i)
    : args.flatMap((a) => (a === 'boundaries' ? BOUNDARIES.flatMap((b) => [b - 6, b, b + 6]) : [Number(a)]));
if (!frames.length || frames.some((f) => !Number.isInteger(f) || f < 0 || f >= 7200)) {
  console.error('usage: node scripts/orbit2/stills.ts <frame 0..7199 | boundaries> ... | portal <0..11>');
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, '../..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/orbit2/entry.tsx'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id: 'JobOrbit2', puppeteerInstance: browser});
for (const frame of frames) {
  const output = path.resolve(root, '../out/stills', `orbit2-f${String(frame).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame, output, puppeteerInstance: browser, overwrite: true, chromiumOptions: {gl: 'angle'}});
  console.log(output);
}
await browser.close({silent: true});
