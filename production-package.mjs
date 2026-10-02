import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'outputs/mk-suite-worlds/Editable-Source');
fs.mkdirSync(out,{recursive:true});
const files=['studio/package.json','studio/package-lock.json','studio/tsconfig.json','studio/remotion.config.ts','LICENSE','briefs/mk-suite-23.plan.json','briefs/mk-suite-worlds.md','skills/motion-video/SKILL.md'];
const dirs=['studio/src/mk-suite-worlds','studio/scripts/mk-suite-worlds','studio/public/mk-suite-worlds'];
for(const rel of [...files,...dirs]){const dest=path.join(out,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.cpSync(path.join(root,rel),dest,{recursive:true});}
const pack=JSON.parse(fs.readFileSync(path.join(out,'studio/package.json'),'utf8'));
pack.name='mk-suite-23-worlds';pack.scripts={studio:'remotion studio src/mk-suite-worlds/entry.ts',music:'node scripts/mk-suite-worlds/music.ts',check:'tsc --noEmit && node scripts/mk-suite-worlds/check.ts',render:'remotion render src/mk-suite-worlds/entry.ts MkSuiteWorlds ../MK-Suite-90s.mp4 --concurrency=6'};
fs.writeFileSync(path.join(out,'studio/package.json'),JSON.stringify(pack,null,2));
fs.writeFileSync(path.join(out,'README.md'),`# MK Suite - Every idea has a world

Editable source for the 90-second, 23-world film. 1920x1080, 60fps, 5400frames, 150BPM.

Built with motion-video-skill v0.2.0 (commit2da54524f107cd415dad4c7b52ee33e27df8999f), using Motion Orchestrator host roles and three parallel builders.

## Rebuild

Requires Node22.18+ and ffmpeg/ffprobe on PATH. The first Remotion run downloads its browser; Google Fonts require internet.

From the studio folder:

1. npm install
2. npm run music
3. npm run check
4. npm run render

Use npm run studio to edit/preview. The composition is MkSuiteWorlds. A debug composition MkSuiteWorldsSeg can show a single product through its id prop.

## Editing

Each product has its own src/mk-suite-worlds/segments/<id>/World.tsx and timing.ts. Sound lives at scripts/mk-suite-worlds/segments/<id>.ts. One global timing.ts controls both picture and sound; keep its frame ranges consistent if editing duration. The existing music.wav is included. Regenerate it after sound or timing changes.

Intro/outro and transition masks live in their respective folders and Reel.tsx. The authored brief and exact on-screen copy are under briefs.

## Scope

Conceptual illustrations of documented product workflows; not recordings of running applications. Subscription ending is a concept, with no price or claim of connected billing. Product availability varies; free cores remain free. No real customer records, names, faces or voices are used.

All music is synthesized in code without samples. Final production notes report measurement and viewing scope; no human listening review is claimed.

The upstream code is MIT-licensed; see LICENSE. MK branding and generated product film belong to their owner. Remotion has its own terms: https://www.remotion.dev/license
`);
console.log(out);
