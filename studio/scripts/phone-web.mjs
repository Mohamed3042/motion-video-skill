import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,statSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),destination=resolve(process.argv[2]||'');
if(!process.argv[2])throw Error('Supply the portfolio public/worlds/montage-pro directory.');
const master=resolve(root,'out/montage-pro-phone.mp4');
const color=['-pix_fmt','yuv420p','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709'];
const encode=(name,extra)=>execFileSync('ffmpeg',['-v','error','-n','-i',master,'-vf','scale=720:1280:flags=lanczos,fps=30','-c:v','libx264','-preset','medium','-threads','2',...color,...extra,'-movflags','+faststart',join(destination,name)],{stdio:'inherit'});
mkdirSync(destination,{recursive:true});
if(!process.argv.includes('--verify-only')){
 encode('scroll-phone.mp4',['-an','-crf','24','-g','15','-keyint_min','15','-sc_threshold','0','-bf','0']);
 encode('film-phone.mp4',['-c:a','copy','-crf','25','-g','60']);
 execFileSync('ffmpeg',['-v','error','-n','-i',resolve(root,'studio/public/phone/heroes/intro.png'),'-vf','scale=720:1280:flags=lanczos','-quality','82',join(destination,'intro-phone.webp')],{stdio:'inherit'});
}
const digest=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const movies=['scroll-phone.mp4','film-phone.mp4'];
const files=movies.map(name=>{
 const file=join(destination,name),probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 const video=probe.streams.find(s=>s.codec_type==='video');assert.equal(video.width,720);assert.equal(video.height,1280);assert.equal(video.r_frame_rate,'30/1');assert.equal(Number(video.nb_frames),4920);assert.equal(Number(video.duration),164);
 assert.equal(probe.streams.some(s=>s.codec_type==='audio'),name==='film-phone.mp4');
 if(name==='scroll-phone.mp4')assert.equal(Number(video.has_b_frames),0);
 return {file:name,bytes:statSync(file).size,sha256:digest(file),width:video.width,height:video.height,fps:30,frames:Number(video.nb_frames),duration:Number(video.duration),hasBFrames:Number(video.has_b_frames),audio:probe.streams.some(s=>s.codec_type==='audio')};
});
const baselinePath=resolve(root,'evidence/desktop-web-baseline.json');
const baseline=existsSync(baselinePath)?JSON.parse(readFileSync(baselinePath,'utf8').replace(/^\uFEFF/,'')):[];
for(const old of baseline)assert.equal(digest(join(destination,old.file)),old.sha256,`Existing desktop media changed: ${old.file}`);
const report={testedAt:new Date().toISOString(),passed:true,files,poster:{file:'intro-phone.webp',bytes:statSync(join(destination,'intro-phone.webp')).size,sha256:digest(join(destination,'intro-phone.webp'))},desktopAssetsUnchanged:baseline.length};
writeFileSync(resolve(root,'out/phone-web-media.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
