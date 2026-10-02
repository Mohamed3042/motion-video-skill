// Usage: node scripts/mk/stills.ts <CompId> <frame> [frame...]  -> ../out/stills/mk-<id>-fNNNN.png
// Bundles once and reuses one browser (much faster than one CLI call per still).
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const [id, ...frames] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, '../..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/mk/entry.ts'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser});
const short = id.replace(/^Mk/, '').toLowerCase();
for (const fr of frames.map(Number)) {
  const output = path.resolve(root, '../out/stills', `mk-${short}-f${String(fr).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame: fr, output, puppeteerInstance: browser, overwrite: true});
  console.log(output);
}
await browser.close({silent: true});
