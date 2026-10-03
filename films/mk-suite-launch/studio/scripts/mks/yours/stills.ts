// Usage: node scripts/mks/yours/stills.ts <act> <localFrame|act:localFrame> ...  -> ../out/stills/mks-<act>-fNNNN.png
// Renders MksAct (composition frame = local + 12). Bundles once, reuses one browser.
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const [act0, ...specs] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, '../../..');
const serveUrl = await bundle({entryPoint: path.join(import.meta.dirname, 'entry.tsx'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
for (const spec of specs) {
  const [act, fr] = spec.includes(':') ? [spec.split(':')[0], Number(spec.split(':')[1])] : [act0, Number(spec)];
  const inputProps = {id: act};
  const composition = await selectComposition({serveUrl, id: 'MksAct', inputProps, puppeteerInstance: browser});
  const output = path.resolve(root, '../out/stills', `mks-${act}-f${fr < 0 ? 'm' : ''}${String(Math.abs(fr)).padStart(4, '0')}.png`);
  const t = Date.now();
  await renderStill({serveUrl, composition, frame: fr + 12, output, inputProps, puppeteerInstance: browser, overwrite: true});
  console.log(output, `${Date.now() - t} ms`);
}
await browser.close({silent: true});
