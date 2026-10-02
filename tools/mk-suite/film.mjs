import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const studio=path.join(root,'studio'),out=path.join(root,'outputs/mk-suite-workflows');
fs.mkdirSync(out,{recursive:true});
const run=(cmd,args,cwd=studio)=>{const r=spawnSync(cmd,args,{cwd,stdio:'inherit',windowsHide:true});if(r.error)throw r.error;if(r.status)process.exit(r.status??1);};
const node=(args,cwd=studio)=>run(process.execPath,args,cwd);
const action=process.argv[2]??'help';
if(action==='music')node(['scripts/mk-suite-workflows/music.ts']);
else if(action==='check'){node(['node_modules/typescript/bin/tsc','--noEmit']);node(['scripts/mk-suite-workflows/check.ts']);}
else if(action==='studio')node(['node_modules/@remotion/cli/remotion-cli.js','studio','src/mk-suite-workflows/entry.ts']);
else if(action==='render')node(['node_modules/@remotion/cli/remotion-cli.js','render','src/mk-suite-workflows/entry.ts','MkSuiteWorkflows',path.join(root,'outputs/mk-suite-workflows.mp4'),'--concurrency=6','--overwrite']);
else if(action==='share'){
 run('ffmpeg',['-hide_banner','-y','-i',path.join(root,'outputs/mk-suite-workflows.mp4'),'-i','public/mk-suite-workflows/music.wav','-map','0:v:0','-map','1:a:0','-c:v','libx264','-crf','24','-preset','slow','-pix_fmt','yuv420p','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-af','volume=-0.5dB','-c:a','aac','-b:a','192k','-t','90','-movflags','+faststart',path.join(out,'MK-Suite-Workflows-Share.mp4')]);
}else if(action==='review')node(['tools/mk-suite/review.mjs',process.argv[3]??'worlds',...(process.argv[4]?[process.argv[4]]:[])],root);
else if(action==='verify')node(['tools/mk-suite/verify.mjs'],root);
else console.log('Commands: studio, music, check, review [worlds|transitions|framework] [scene-id], render, share, verify');
