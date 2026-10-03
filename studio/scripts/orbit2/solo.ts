// Genuine section extraction from the completed, verified Orbit master.
// node scripts/orbit2/solo.ts <sectionId|finale> [--context=0.5]
// --context=0 gives exactly the section; context may include neighbouring music.
import path from 'node:path';
import {existsSync, mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {DURATION,FPS,FINALE,SECTIONS} from '../../src/orbit2/timing.ts';
const id=process.argv[2];
const section=id==='finale'?{id:'finale',...FINALE}:SECTIONS.find(s=>s.id===id);
assert.ok(section,'Choose a section: '+[...SECTIONS.map(s=>s.id),'finale'].join(', '));
const contextArg=process.argv.slice(3).find(a=>a.startsWith('--context='));
assert.ok(process.argv.slice(3).every(a=>a===contextArg),'Unknown option: use --context=0 or --context=0.5');
const context=contextArg?Number(contextArg.split('=')[1]):.5;
assert.ok(Number.isFinite(context)&&context>=0&&context<=2,'Context must be between0 and2 seconds');
const studio=path.resolve(import.meta.dirname,'../..'),master=path.join(studio,'public/orbit2/music.wav');
const reportDir=path.resolve(studio,'../out/audio/orbit2');
assert.ok(existsSync(master)&&existsSync(path.join(reportDir,'master-report.json')),'Score is missing. Run node scripts/orbit2/music.ts first.');
// Check current picture timing, format, loudness and real decoded impact locations.
const validation=spawnSync(process.execPath,[path.join(import.meta.dirname,'check.ts'),master,'--self-test'],{encoding:'utf8',maxBuffer:16*1024*1024});
assert.equal(validation.status,0,'Master validation failed. Regenerate using node scripts/orbit2/music.ts.\n'+validation.stdout+'\n'+validation.stderr);
const sourceReport=JSON.parse(readFileSync(path.join(reportDir,'sync-music.wav.json'),'utf8'));
const start=Math.max(0,section.start/FPS-context),end=Math.min(DURATION/FPS,section.end/FPS+context);
const out=path.join(studio,'public/orbit2/solo-'+id+'.wav');
mkdirSync(path.dirname(out),{recursive:true});
const render=spawnSync('ffmpeg',['-v','error','-y','-i',master,'-af','atrim=start='+start+':end='+end+',asetpts=PTS-STARTPTS','-ar','44100','-ac','2','-c:a','pcm_s16le',out],{encoding:'utf8'});
assert.equal(render.status,0,'Audio extraction failed: '+render.stderr);
const probe=spawnSync('ffprobe',['-v','error','-show_entries','stream=sample_rate,channels,bits_per_sample:format=duration','-of','json',out],{encoding:'utf8'});
assert.equal(probe.status,0,probe.stderr);
const meta=JSON.parse(probe.stdout),seconds=Number(meta.format.duration);
assert.ok(Math.abs(seconds-(end-start))<1/44100+.000001,'Extracted duration mismatch');
const pcm=spawnSync('ffmpeg',['-v','error','-i',out,'-ac','2','-f','f32le','-'],{maxBuffer:64*1024*1024});
assert.equal(pcm.status,0,pcm.stderr.toString());
const samples=new Float32Array(pcm.stdout.buffer,pcm.stdout.byteOffset,pcm.stdout.byteLength/4);
let energy=0,peak=0;
for(const v of samples){assert.ok(Number.isFinite(v),'Non-finite solo sample');energy+=v*v;peak=Math.max(peak,Math.abs(v));}
assert.ok(peak>.001&&energy>1e-6,'Extracted solo is silent');
const report={id,file:out,seconds,sectionStartSeconds:section.start/FPS,sectionEndSeconds:section.end/FPS,
  extractedStartSeconds:start,extractedEndSeconds:end,contextSeconds:context,sectionOffsetSeconds:section.start/FPS-start,
  sourceSha256:sourceReport.sha256,timingSha256:sourceReport.timingSha256,sampleRate:44100,channels:2,bits:16,
  samplePeakDbfs:20*Math.log10(peak),interleavedRmsDbfs:10*Math.log10(energy/samples.length),pass:true,listened:false,
  scope:'Extracted from the verified completed master; contextual overlap may contain neighbouring sections.'};
writeFileSync(path.join(reportDir,'solo-'+id+'.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
