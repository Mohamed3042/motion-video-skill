import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {bundle} from '@remotion/bundler';
import {openBrowser,renderStill,selectComposition} from '@remotion/renderer';
import {BOUNDARIES} from '../src/mpw/shell/timing.ts';
const heroes:Record<string,number>={intro:420,ingest:840,sync:1620,review:2460,captions:3110,handoff:3810,sound:4412,picture:5390,library:6540,editroom:7410,profile:8350,anywhere:8790};
const args=process.argv.slice(2),root=path.resolve(import.meta.dirname,'..');
const list=args.includes('heroes')?Object.entries(heroes).map(([id,f])=>({id,f})):args.flatMap(a=>a==='boundaries'?BOUNDARIES.flatMap(b=>[b-6,b,b+6]).map(f=>({id:`f${f}`,f})):[{id:`f${a}`,f:Number(a)}]);
if(!list.length||list.some(v=>!Number.isInteger(v.f)||v.f<0||v.f>=9840))throw Error('Supply frame numbers, heroes, or boundaries');
const serveUrl=await bundle({entryPoint:path.join(root,'src/phone-entry.tsx'),publicDir:path.join(root,'public')});
const browser=await openBrowser('chrome',{chromiumOptions:{gl:'angle'}});
try{
 const composition=await selectComposition({serveUrl,id:'MontageProPhone',puppeteerInstance:browser});
 for(const {id,f} of list){
  const output=args.includes('heroes')?path.join(root,'public/phone/heroes',`${id}.png`):path.join(root,'../out/stills',`${id}.png`);
  fs.mkdirSync(path.dirname(output),{recursive:true});
  await renderStill({serveUrl,composition,frame:f,output,puppeteerInstance:browser,overwrite:true,chromiumOptions:{gl:'angle'}});
  console.log(`${f} ${output}`);
 }
}finally{
 await browser.close({silent:true});
 const target=path.resolve(serveUrl),temp=path.resolve(os.tmpdir());
 if(!target.startsWith(temp+path.sep)||!path.basename(target).startsWith('remotion-'))throw Error('Unexpected bundle directory');
 fs.rmSync(target,{recursive:true,force:true});
}
