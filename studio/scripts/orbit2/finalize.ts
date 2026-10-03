// Finalize Orbit without re-encoding the rendered picture.
// node scripts/orbit2/finalize.ts <raw-remotion.mp4> <final.mp4>
// The separate check.ts command remains the delivery acceptance gate.
import assert from 'node:assert/strict';
import path from 'node:path';
import {existsSync, mkdirSync, mkdtempSync, realpathSync, rmdirSync, unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {DURATION, FPS} from '../../src/orbit2/timing.ts';

const args=process.argv.slice(2);
assert.equal(args.length,2,'Usage: node scripts/orbit2/finalize.ts <raw-remotion.mp4> <final.mp4>');
const raw=path.resolve(args[0]),out=path.resolve(args[1]);
const identity=(file:string)=>path.normalize(existsSync(file)?realpathSync(file):file).toLowerCase();
assert.notEqual(identity(raw),identity(out),'Input and output must be different paths; preserve the raw render.');
assert.ok(existsSync(raw),'Raw render not found: '+raw);
assert.equal(path.extname(out).toLowerCase(),'.mp4','Output must have an .mp4 extension.');
assert.ok(!existsSync(out),'Output already exists; choose a new filename to preserve the previous export.');
const master=path.resolve(import.meta.dirname,'../../public/orbit2/music.wav');
assert.ok(existsSync(master),'Source score is missing. Run node scripts/orbit2/music.ts first.');
mkdirSync(path.dirname(out),{recursive:true});
const tempDir=mkdtempSync(path.join(tmpdir(),'orbit2-finalize-'));
const aac=path.join(tempDir,'score.m4a');
function ffmpeg(args:string[]){
  const result=spawnSync('ffmpeg',['-hide_banner','-v','error','-n',...args],{encoding:'utf8',maxBuffer:16*1024*1024});
  assert.equal(result.status,0,'ffmpeg failed: '+(result.error?.message??result.stderr));
}
try{
  // This encode path was measured independently; Remotion's AAC encode can
  // overshoot the source score's peak. Never encode this AAC a second time.
  ffmpeg(['-i',master,'-ar','48000','-ac','2','-c:a','aac','-b:a','320k',aac]);
  ffmpeg(['-i',raw,'-i',aac,'-map','0:v:0','-map','1:a:0','-map_metadata','0',
    '-c:v','copy','-c:a','copy','-t',String(DURATION/FPS),'-movflags','+faststart',out]);
  console.log('Finalized: '+out);
  console.log('Next, run the acceptance gate: node scripts/orbit2/check.ts "'+out+'" --self-test');
}finally{
  if(existsSync(aac))unlinkSync(aac);
  rmdirSync(tempDir);
}
