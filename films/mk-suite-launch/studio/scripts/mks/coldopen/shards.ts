// node scripts/mks/coldopen/shards.ts -> public/mks/coldopen/<name>.jpg (sharp, 2x) + <name>-b1.png / -b2.png (pre-blurred, padded)
// Crops are 1x source px of the concept screens (stored at 2x in public/mks/screens). Rects shared with the act.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {SHARDS, BLUR} from '../../../src/mks/acts/coldopen/shards.ts';

const root = path.resolve(import.meta.dirname, '../../..');
const out = path.join(root, 'public/mks/coldopen');
fs.mkdirSync(out, {recursive: true});
for (const s of SHARDS) {
  const src = path.join(root, 'public/mks/screens', `${s.screen}.jpg`);
  const {x, y, w, h} = s.rect;
  const crop = `crop=${w * 2}:${h * 2}:${x * 2}:${y * 2}`;
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', crop, '-q:v', '2', path.join(out, `${s.name}.jpg`)]);
  for (const [i, b] of BLUR.entries()) {
    const sigma = b.sigma * b.width; // px of the blurred image
    const pad = Math.ceil(b.pad * b.width);
    const vf = `${crop},scale=${b.width}:-2:flags=area,format=rgba,pad=iw+${2 * pad}:ih+${2 * pad}:${pad}:${pad}:color=black@0,gblur=sigma=${sigma.toFixed(2)}:steps=3`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', vf, path.join(out, `${s.name}-b${i + 1}.png`)]);
  }
  console.log(s.name);
}
