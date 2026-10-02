import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'outputs/mk-suite-workflows');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,''));
const plan=read('briefs/mk-suite-workflows.plan.json');
const qc=read('outputs/mk-suite-workflows/review/exported/exported-qc.json');
if(qc.status!=='passed')throw new Error('Master QC did not pass.');
const master=path.join(root,'outputs/mk-suite-workflows.mp4'),share=path.join(out,'MK-Suite-Workflows-Share.mp4');
const probe=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',share],{encoding:'utf8',windowsHide:true});
if(probe.status)throw new Error(probe.stderr);
const sp=JSON.parse(probe.stdout),v=sp.streams.find(s=>s.codec_type==='video');
if(Number(v.duration)!==90||Number(v.nb_frames)!==5400||v.width!==1920||v.height!==1080||v.r_frame_rate!=='60/1'||v.pix_fmt!=='yuv420p'||v.color_space!=='bt709')throw new Error('Share metadata mismatch');
const log=fs.readFileSync(path.join(out,'share-decode.log'),'utf8');
const audioLog=log.slice(log.lastIndexOf('Summary:'));
const lufs=Number(/I:\s+(-?[\d.]+) LUFS/.exec(audioLog)?.[1]);
const tp=Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(audioLog)?.[1]);
if(!Number.isFinite(lufs)||Math.abs(lufs+14)>.7||!Number.isFinite(tp)||tp>=-1)throw new Error(`Share loudness/peak mismatch: ${lufs}/${tp}`);
const records=[master,share].map(p=>({file:path.basename(p),bytes:fs.statSync(p).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}));
const validation={version:2,title:plan.title,video:{seconds:90,frames:5400,width:1920,height:1080,fps:60,codec:'h264',pixelFormat:'yuv420p',colorSpace:'bt709'},files:records,master:{fullDecode:'passed',decodedFrames:qc.metadata.frameCount,blackIntervals:qc.blackDetection.intervals,integratedLufs:qc.audio.integratedLufs,truePeakDbTP:qc.audio.truePeakDbTP},share:{fullDecode:'passed',integratedLufs:lufs,truePeakDbTP:tp},visualReview:{workflowPairs:23,transitionFrames:23,finalExportedFrames:25,continuousHumanViewing:false},sound:{onsetsWithinOneFrame:53,listeningReview:false},source:{skill:'motion-video-skill v0.2.0',upstreamCommit:'2da54524f107cd415dad4c7b52ee33e27df8999f'}};
fs.writeFileSync(path.join(out,'delivery-manifest.json'),JSON.stringify(validation,null,2));
fs.writeFileSync(path.join(root,'docs/mk-suite/VALIDATION.json'),JSON.stringify(validation,null,2));
const stamp=f=>{const s=f/60;return `${Math.floor(s/60)}:${(s%60).toFixed(1).padStart(4,'0')}`};
const md=`# MK Suite — See what you can do

90 seconds, 23 illustrated product workflows, 1920×1080 at 60 fps. V2 replaces the earlier abstract scenes with visible inputs, deliberate controls, changing data and held results. Each product has a distinct interface composition and colour world. V1 is preserved separately.

## Watch and edit

- [Master](../mk-suite-workflows.mp4) and [share copy](MK-Suite-Workflows-Share.mp4).
- [Chaptered player](index.html): click a product, choose slower playback, or loop one workflow.
- [Complete editable source](MK-Suite-Workflows-Source.zip). Repository guide: docs/mk-suite/EDITING.md.
- [Validation and file hashes](delivery-manifest.json).

## Workflow scenes

| Time | Product | Visible workflow |
| --- | --- | --- |
| 0:00.0–0:03.2 | MK Suite | Sound, timeline and document preview |
${plan.segments.map(s=>`| ${stamp(s.startFrame)}–${stamp(s.endFrame)} | ${s.name} | ${s.copy.slice(2).join(' → ')} |`).join('\n')}
| 1:28.0–1:30.0 | MK Suite | One suite. One monthly subscription, with a roll call of all 23 products |

## Verification

Both MP4s passed a full video and audio decode. The master contains all 5,400 frames and has no detected black intervals. Visual review covered two stills per product, 23 transition frames, the intro and outro, and 25 frames extracted from the finished export. Fixes addressed quotation states and totals, crowded Factory and Marketing labels, Voice button spacing, an overlapping Cake proof caption, and the opening headline transition. Revision 2.1 moves the pointer off each control after its last click or drag, so result labels and capability limits (for example “No hiring decision made”) are no longer covered, and turns the end card into a roll call of all 23 products. These are sampled visual checks, not continuous human viewing.

The master's AAC audio measures ${qc.audio.integratedLufs} LUFS integrated and ${qc.audio.truePeakDbTP} dBTP; the share copy measures ${lufs} LUFS and ${tp} dBTP. All 53 sound onsets at scene boundaries, impacts and hits pass within ±1 frame of their scheduled timing. The original synthesized soundtrack runs at 150 BPM. **The mix has not been listened to.**

The video duration is exactly 90.000 seconds. The AAC audio may extend the container duration by less than one video frame; no video frames are added. The edited code passes TypeScript and determinism checks, along with the motion skill's rendering and sound gates.

## Content limits

These are illustrated product workflows with clearly marked demo data, not screen recordings of live applications. Source-based capability limits remain visible where relevant: campaigns are drafts, cleaning uses a review plan, human approval remains explicit, repository answers show source evidence, and game library previews do not invent gameplay. Sample quantities/prices explain UI behaviour and are not subscription prices or performance claims.

The exact price-free ending is **One suite. One monthly subscription.** It also states **Subscription concept; product availability varies. Free cores remain free.**

Built with [motion-video-skill v0.2.0](https://github.com/Mohamed3042/motion-video-skill/releases/tag/v0.2.0), using the host director and three parallel builders. All picture and sound code is included for subsequent AI-assisted revisions.
`;
fs.writeFileSync(path.join(out,'production-report.md'),md);
const publicMd=md.replace('[Master](../mk-suite-workflows.mp4)','[Master](https://github.com/Mohamed3042/motion-video-skill/releases/download/mk-suite-film-v2/mk-suite-workflows.mp4)').replace('[share copy](MK-Suite-Workflows-Share.mp4)','[share copy](https://github.com/Mohamed3042/motion-video-skill/releases/download/mk-suite-film-v2/MK-Suite-Workflows-Share.mp4)').replace('[Chaptered player](index.html)','Chaptered player (included in the delivery folder)').replace('[Complete editable source](MK-Suite-Workflows-Source.zip)','[Complete editable source](https://github.com/Mohamed3042/motion-video-skill/releases/download/mk-suite-film-v2/MK-Suite-Workflows-Source.zip)').replace('[Validation and file hashes](delivery-manifest.json)','[Validation and file hashes](VALIDATION.json)');
fs.writeFileSync(path.join(root,'docs/mk-suite/PRODUCTION.md'),publicMd);
console.log(JSON.stringify({files:records,masterAudio:validation.master,shareAudio:validation.share}));
