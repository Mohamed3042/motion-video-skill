// Fast verification stills: one bundle, one browser.
// Usage: node scripts/mks/stills.ts <frame> [frame...]               → ../out/stills/mks-fNNNN.png        (MkSuiteLaunch)
//        node scripts/mks/stills.ts --act <id> <localFrame> [...]     → ../out/stills/mks-<id>-fNNNN.png   (MksAct, act-local frame)
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {ACTS, DURATION, PAD, type ActId} from '../../src/mks/timing.ts';

const args = process.argv.slice(2);
const act = args[0] === '--act' ? (args[1] as ActId) : undefined;
const a = act ? ACTS.find((x) => x.id === act) : undefined;
const frames = (act ? args.slice(2) : args).map(Number);
const lo = a ? -PAD : 0;
const hi = a ? a.end - a.start + PAD : DURATION;
if ((act && !a) || !frames.length || frames.some((f) => !Number.isInteger(f) || f < lo || f >= hi)) {
  console.error(`usage: node scripts/mks/stills.ts <frame 0..${DURATION - 1}> ...\n       node scripts/mks/stills.ts --act <${ACTS.map((x) => x.id).join('|')}> <local frame -${PAD}..len+${PAD - 1}> ...`);
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, '../..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const inputProps = act ? {id: act} : {};
const composition = await selectComposition({serveUrl, id: act ? 'MksAct' : 'MkSuiteLaunch', inputProps, puppeteerInstance: browser});
for (const f of frames) {
  const output = path.resolve(root, '../out/stills', `mks-${act ? `${act}-` : ''}f${String(f).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame: act ? f + PAD : f, inputProps, output, puppeteerInstance: browser, overwrite: true, chromiumOptions: {gl: 'angle'}});
  console.log(output);
}
await browser.close({silent: true});
