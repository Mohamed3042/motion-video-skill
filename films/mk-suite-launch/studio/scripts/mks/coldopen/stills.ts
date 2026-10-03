// Usage: node scripts/mks/coldopen/stills.ts <act> <localFrame...>  -> ../out/stills/mks-<act>-fNNNN.png
// Frames are LOCAL to the act (composition frame = local + 12). Bundles once, reuses one browser.
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const [act, ...frames] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, '../../..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const inputProps = {id: act};
const composition = await selectComposition({serveUrl, id: 'MksAct', inputProps, puppeteerInstance: browser});
for (const fr of frames.map(Number)) {
  const output = path.resolve(root, '../out/stills', `mks-${act}-f${String(fr).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame: fr + 12, output, inputProps, puppeteerInstance: browser, overwrite: true});
  console.log(output);
}
await browser.close({silent: true});
