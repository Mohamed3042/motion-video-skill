// Usage: node scripts/mks/create/stills.ts <localFrame> [localFrame...]
//   -> ../out/stills/mks-create-L<local>.png   (composition MksAct, props {id:'create'}, frame = local + 12)
// Bundles once and reuses one browser.
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const frames = process.argv.slice(2).map(Number);
const root = path.resolve(import.meta.dirname, '../../..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const inputProps = {id: 'create'};
const composition = await selectComposition({serveUrl, id: 'MksAct', inputProps, puppeteerInstance: browser});
for (const f of frames) {
  const output = path.resolve(root, '../out/stills', `mks-create-L${String(f).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame: f + 12, output, inputProps, puppeteerInstance: browser, overwrite: true});
  console.log(output);
}
await browser.close({silent: true});
