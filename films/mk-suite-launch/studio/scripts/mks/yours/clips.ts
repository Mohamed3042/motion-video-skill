// Usage: node scripts/mks/yours/clips.ts act:from..to [act:from..to ...]  (LOCAL frames, inclusive)
// -> ../out/mks-<act>-<from>-<to>.mp4 (one bundle, sequential renders). Prints render time per clip.
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const root = path.resolve(import.meta.dirname, '../../..');
const serveUrl = await bundle({entryPoint: path.join(import.meta.dirname, 'entry.tsx'), publicDir: path.join(root, 'public')});
for (const spec of process.argv.slice(2)) {
  const [act, range] = spec.split(':');
  const [a, b] = range.split('..').map(Number);
  const inputProps = {id: act};
  const composition = await selectComposition({serveUrl, id: 'MksAct', inputProps});
  const outputLocation = path.resolve(root, '../out', `mks-${act}-${a}-${b}.mp4`);
  const t = Date.now();
  await renderMedia({serveUrl, composition, codec: 'h264', outputLocation, inputProps, frameRange: [a + 12, b + 12], chromiumOptions: {gl: 'angle'}, muted: true});
  console.log(outputLocation, `${((Date.now() - t) / (b - a + 1)).toFixed(0)} ms/frame`);
}
