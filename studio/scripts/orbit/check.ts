// Verify declared Orbit picture/sound events against decoded WAV, M4A or final MP4.
// No generation-time event list is trusted: re-read the picture timing modules.
// Usage: node scripts/orbit/check.ts [media] [--self-test]
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {DURATION,FPS,SECTIONS,WORLDS} from '../../src/orbit/timing.ts';
import {FW_EVENTS} from '../../src/orbit/shell/timing.ts';
import * as F from '../../src/orbit/finale/timing.ts';

const SR=44100,FRAME=SR/FPS;
const file=path.resolve(process.argv.slice(2).find(a=>!a.startsWith('--'))??path.resolve(import.meta.dirname,'../../public/orbit/music.wav'));
const dir=path.resolve(import.meta.dirname,'../../../out/audio/orbit');
mkdirSync(dir,{recursive:true});
const output=path.join(dir,'sync-'+path.basename(file).replace(/[^a-zA-Z0-9._-]/g,'-')+'.json');
const metadata=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'});
assert.equal(metadata.status,0,'ffprobe failed: '+metadata.stderr);
const meta=JSON.parse(metadata.stdout),audio=meta.streams.find((s:{codec_type:string})=>s.codec_type==='audio'),video=meta.streams.find((s:{codec_type:string})=>s.codec_type==='video');
assert.ok(audio,'Missing audio stream');
// The source WAV is44.1kHz; Remotion's AAC output commonly resamples to48kHz.
// Decode both onto the same analysis clock instead of rejecting valid encoded audio.
if(audio.codec_name==='pcm_s16le')assert.equal(Number(audio.sample_rate),SR,'Expected44.1kHz source WAV');
else assert.ok([44100,48000].includes(Number(audio.sample_rate)),'Unexpected encoded audio sample rate');
assert.equal(audio.channels,2,'Expected stereo');
assert.ok(Math.abs(Number(meta.format.duration)-DURATION/FPS)<=1/FPS,'Wrong media duration');
assert.ok(Math.abs(Number(audio.start_time??0))<=1/FPS,'Audio starts more than1 frame away from timeline zero');
if(video){
  const [n,d]=video.avg_frame_rate.split('/').map(Number);
  assert.equal(n/d,FPS,'Wrong video fps');
  assert.equal(Number(video.nb_frames),DURATION,'Wrong video frame count');
  assert.ok(Math.abs(Number(video.start_time??0))<=1/FPS,'Video starts away from timeline zero');
}
const pcm=spawnSync('ffmpeg',['-v','error','-i',file,'-vn','-ac','1','-ar',String(SR),'-f','f32le','-'],{maxBuffer:1<<29});
assert.equal(pcm.status,0,'ffmpeg failed: '+pcm.stderr.toString());
const x=new Float32Array(pcm.stdout.buffer,pcm.stdout.byteOffset,pcm.stdout.byteLength/4);
assert.ok(Math.abs(x.length/SR-DURATION/FPS)<=1/FPS,'Decoded audio duration differs by more than1 frame');
let peak=0;for(const v of x){assert.ok(Number.isFinite(v),'Non-finite PCM');peak=Math.max(peak,Math.abs(v));}
assert.ok(peak>.001,'Audio is silent');
const events=new Map<number,string[]>();
for(const e of FW_EVENTS)events.set(e.f,[...(events.get(e.f)??[]),e.what]);
const declaredBySection=[];
const timingSections=[];
for(const s of SECTIONS){
  const {EVENTS}=await import('../../src/orbit/sections/'+s.id+'/timing.ts') as {EVENTS:{f:number;kind:string}[]};
  declaredBySection.push({id:s.id,count:EVENTS.length});
  timingSections.push({id:s.id,start:s.start,end:s.end,events:EVENTS.map(e=>[e.f,e.kind])});
  for(const e of EVENTS)if(e.kind==='impact'||e.kind==='hit'){
    const f=s.start+e.f;
    events.set(f,[...(events.get(f)??[]),s.id+' '+e.kind+' @'+e.f]);
  }
}
const timingSha256=createHash('sha256').update(JSON.stringify({duration:DURATION,fps:FPS,
  framework:FW_EVENTS.map(e=>[e.f,e.kind]),sections:timingSections,
  finale:{montage:F.MONTAGE,converge:F.CONVERGE,lock:F.LOGO_LOCK,lines:F.LINES,glint:F.GLINT2,fade:F.FADE}
})).digest('hex');
const masterReport=JSON.parse(readFileSync(path.join(dir,'master-report.json'),'utf8'));
assert.equal(masterReport.timingSha256,timingSha256,'Picture timing changed since synthesis: regenerate the soundtrack before accepting sync');
const mediaSha256=createHash('sha256').update(readFileSync(file)).digest('hex');
if(file===path.resolve(import.meta.dirname,'../../public/orbit/music.wav'))
  assert.equal(mediaSha256,masterReport.sha256,'Source WAV no longer matches its synthesis report');
const cum=new Float64Array(x.length+1);
for(let i=0;i<x.length;i++){const y=x[i]-.97*(i?x[i-1]:0);cum[i+1]=cum[i]+y*y;}
const clamp=(n:number)=>Math.min(x.length,Math.max(0,n));
function mean(a:number,b:number,shift=0){
  a=clamp(a-shift);b=clamp(b-shift);
  return (cum[b]-cum[a])/Math.max(1,b-a);
}
const ms=(v:number)=>Math.round(v/1000*SR);
function evaluate(shift=0){
  return [...events.entries()].sort((a,b)=>a[0]-b[0]).map(([frame,labels])=>{
    const c=frame*FRAME;
    let best={sample:0,ratio:0};
    for(let s=Math.max(0,Math.round(c-3*FRAME));s<=c+3*FRAME;s+=16){
      const ratio=mean(s,s+ms(10),shift)/(mean(s-ms(50),s-ms(5),shift)+1e-12);
      if(ratio>best.ratio)best={sample:s,ratio};
    }
    const offsetFrames=(best.sample-c)/FRAME,jumpDb=10*Math.log10(best.ratio);
    return {frame,offsetFrames,jumpDb,pass:Math.abs(offsetFrames)<=1&&jumpDb>=6,labels};
  });
}
const onsets=evaluate();
for(const e of onsets)console.log((e.pass?'ok  ':'FAIL')+' f'+String(e.frame).padStart(4)+' '+e.offsetFrames.toFixed(3)+'f '+e.jumpDb.toFixed(1)+'dB '+e.labels.join(' | '));
let selfTest:unknown=null;
if(process.argv.includes('--self-test')){
  const shifted=evaluate(Math.round(2*FRAME)),rejected=shifted.filter(e=>!e.pass).length;
  selfTest={injectedShiftFrames:2,rejected,total:shifted.length};
  assert.ok(rejected>=shifted.length*.8,'Negative control did not reject a two-frame shift');
}
function measure(start?:number,duration?:number){
  const args=['-nostats','-hide_banner'];
  if(start!==undefined)args.push('-ss',String(start),'-t',String(duration));
  args.push('-i',file);
  args.push('-vn','-af','ebur128=peak=true','-f','null','-');
  const r=spawnSync('ffmpeg',args,{encoding:'utf8',maxBuffer:16*1024*1024});
  assert.equal(r.status,0,'ffmpeg loudness measurement failed: '+r.stderr);
  const summary=r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  return {lufs:Number(/I:\s+(-?[\d.]+) LUFS/.exec(summary)?.[1]),truePeakDbtp:Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(summary)?.[1])};
}
const measured=measure();
const worlds=WORLDS.map(w=>({id:w.id,...measure(w.start/FPS,(w.end-w.start)/FPS)}));
assert.ok(worlds.every(w=>Number.isFinite(w.lufs)),'Silent or unmeasured world');
const loud=worlds.map(w=>w.lufs),worldSpreadLu=Math.max(...loud)-Math.min(...loud);
const failed=onsets.filter(e=>!e.pass);
const report={
  file,sha256:mediaSha256,timingSha256,
  seconds:Number(meta.format.duration),decodedSeconds:x.length/SR,
  video:video?{frames:Number(video.nb_frames),fps:FPS,codec:video.codec_name,pixelFormat:video.pix_fmt}:null,
  audio:{codec:audio.codec_name,sampleRate:Number(audio.sample_rate),channels:audio.channels,startTime:Number(audio.start_time??0)},
  measured,worldSpreadLu,worlds,declaredBySection,impactCount:onsets.length,
  maximumAbsoluteOffsetFrames:Math.max(...onsets.map(e=>Math.abs(e.offsetFrames))),
  minimumJumpDb:Math.min(...onsets.map(e=>e.jumpDb)),
  failedCount:failed.length,onsets,selfTest,listened:false,
  pass:failed.length===0&&Math.abs(measured.lufs+14)<=.5&&measured.truePeakDbtp < -1&&worldSpreadLu<=1.5,
  scope:'Decoded-audio checks for declared timing events; does not prove listening or visual-frame inspection.'
};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({file,impactCount:onsets.length,failedCount:failed.length,measured,worldSpreadLu,selfTest,report:output},null,2));
assert.equal(failed.length,0,'Missing/off-time impact: every authored hit must be within±1 frame with≥6dB jump');
assert.ok(Math.abs(measured.lufs+14)<=.5,'Integrated loudness is not about-14LUFS');
assert.ok(measured.truePeakDbtp < -1,'True peak is not below-1dBTP');
assert.ok(worldSpreadLu<=1.5,'World loudness spread exceeds1.5LU');
console.log('PASS: declared impacts, duration, loudness, peak and world balance. Not listened to.');
