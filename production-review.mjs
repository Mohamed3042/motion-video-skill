import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
const {bundle}=await import('./studio/node_modules/@remotion/bundler/dist/index.js');
const {openBrowser,renderStill,selectComposition}=await import('./studio/node_modules/@remotion/renderer/dist/index.js');
const plan=JSON.parse(fs.readFileSync(path.join(root,'briefs/mk-suite-23.plan.json'),'utf8').replace(/^\uFEFF/,''));
const out=path.join(root,'outputs/mk-suite-worlds/review');fs.mkdirSync(out,{recursive:true});
const mode=process.argv[2]??'worlds';
const entries=mode==='transitions'?plan.segments.map((s,i)=>({frame:s.startFrame,label:s.name,file:`transition-${String(i).padStart(2,'0')}.png`})):
plan.segments.flatMap((s,i)=>[.22,.72].map((p,j)=>({frame:s.startFrame+Math.round((s.endFrame-s.startFrame)*p),label:`${s.name} ${j?'hero':'reveal'}`,file:`world-${String(i).padStart(2,'0')}-${j}.png`})));
const serveUrl=await bundle({entryPoint:path.join(root,'studio/src/mk-suite-worlds/entry.ts'),publicDir:path.join(root,'studio/public')});
const browser=await openBrowser('chrome',{chromiumOptions:{gl:'angle'}});
try{const composition=await selectComposition({serveUrl,id:'MkSuiteWorlds',puppeteerInstance:browser});
for(const e of entries){await renderStill({serveUrl,composition,frame:e.frame,output:path.join(out,e.file),puppeteerInstance:browser,overwrite:true,chromiumOptions:{gl:'angle'}});console.log(e.label+' '+e.frame);}
}finally{await browser.close({silent:true});}
fs.writeFileSync(path.join(out,mode+'-manifest.json'),JSON.stringify(entries,null,2));
for(let page=0;page<Math.ceil(entries.length/6);page++){
 const list=entries.slice(page*6,page*6+6);const args=['-v','error','-y'];for(const e of list)args.push('-i',path.join(out,e.file));
 const layout=list.map((_,i)=>`${i%2*960}_${Math.floor(i/2)*540}`).join('|');
 const filter=list.map((_,i)=>`[${i}:v]scale=960:540[s${i}]`).join(';')+';'+list.map((_,i)=>`[s${i}]`).join('')+`xstack=inputs=${list.length}:layout=${layout}:fill=0x10121a[out]`;
 args.push('-filter_complex',filter,'-map','[out]','-frames:v','1',path.join(out,`${mode}-sheet-${page+1}.jpg`));
 const r=spawnSync('ffmpeg',args,{encoding:'utf8'});if(r.status)throw new Error(r.stderr);
}
console.log('Review complete: '+entries.length+' full-resolution stills.');
