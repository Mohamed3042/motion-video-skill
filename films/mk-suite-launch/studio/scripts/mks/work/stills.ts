// Usage: node scripts/mks/work/stills.ts <act> <localFrame> [localFrame...] [--sheet name]
//        node scripts/mks/work/stills.ts --bundle-only   (then: npx remotion render <printed dir> MksAct out.mp4 --props=...)
//   -> ../out/stills/mks-<act>-lNNNN.png (+ optional 3-column contact sheet ../out/stills/<name>.png)
// Bundles once and reuses one browser. Composition frame = local + PAD (12).
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const args = process.argv.slice(2);
const si = args.indexOf('--sheet');
const sheet = si >= 0 ? args.splice(si, 2)[1] : null;
const [act, ...frames] = args;
const root = path.resolve(import.meta.dirname, '../../..');
// One fixed bundle dir (overwritten each run) instead of a new ~300 MB temp bundle per call.
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public'), outDir: path.join(os.tmpdir(), 'mks-work-bundle')});
if (act === '--bundle-only') {
  console.log(serveUrl);
  process.exit(0);
}
const browser = await openBrowser('chrome', {chromiumOptions: {gl: 'angle'}});
const inputProps = {id: act};
const composition = await selectComposition({serveUrl, id: 'MksAct', inputProps, puppeteerInstance: browser});
const outs: string[] = [];
for (const fr of frames.map(Number)) {
  const output = path.resolve(root, '../out/stills', `mks-${act}-l${String(fr).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame: fr + 12, output, inputProps, puppeteerInstance: browser, overwrite: true});
  outs.push(output);
  console.log(output);
}
await browser.close({silent: true});
if (sheet) {
  const cols = 3;
  const rows = Math.ceil(outs.length / cols);
  const inputs = outs.flatMap((o) => ['-i', o]);
  const scaled = outs.map((_, i) => `[${i}]scale=640:360,drawbox=0:0:640:360:gray@0.6:1[s${i}]`).join(';');
  const layout = outs.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
  const out = path.resolve(root, '../out/stills', `${sheet}.png`);
  const filter = outs.length === 1 ? `${scaled};[s0]null` : `${scaled};${outs.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${outs.length}:layout=${layout}:fill=black`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', filter, '-frames:v', '1', out]);
  console.log('sheet', out, `${cols}x${rows}`);
}
