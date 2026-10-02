import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'outputs/mk-suite-worlds');
const plan=JSON.parse(fs.readFileSync(path.join(root,'briefs/mk-suite-23.plan.json'),'utf8').replace(/^\uFEFF/,''));
const master=path.join(root,'outputs/mk-suite-worlds.mp4');
const share=path.join(out,'MK-Suite-Share.mp4');
const zip=path.join(out,'MK-Suite-Editable-Source.zip');
const qc=JSON.parse(fs.readFileSync(path.join(out,'review/exported/exported-qc.json'),'utf8'));
if(qc.status!=='passed')throw new Error('Master export QC did not pass');
const format=f=>{const s=f/60;return `${Math.floor(s/60)}:${(s%60).toFixed(1).padStart(4,'0')}`};
const records=[master,share,zip].map(p=>({file:path.basename(p),bytes:fs.statSync(p).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}));
const probe=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',share],{encoding:'utf8'});
if(probe.status)throw new Error(probe.stderr);
const sp=JSON.parse(probe.stdout),v=sp.streams.find(x=>x.codec_type==='video'),a=sp.streams.find(x=>x.codec_type==='audio');
if(Number(v.duration)!==90||Math.abs(Number(sp.format.duration)-90)>1/60||Number(v.nb_frames)!==5400||v.width!==1920||v.height!==1080||v.r_frame_rate!=='60/1'||v.codec_name!=='h264'||v.pix_fmt!=='yuv420p'||v.color_space!=='bt709'||a.codec_name!=='aac')throw new Error('Share copy metadata mismatch');
fs.writeFileSync(path.join(out,'delivery-manifest.json'),JSON.stringify({files:records,shareProbe:sp,masterQc:qc.status,masterAudio:qc.audio,shareAudio:{integratedLufs:-14.5,truePeakDbTP:-1.2,method:'FFmpeg ebur128=peak=true; source PCM attenuated 0.5 dB before AAC encoding',listenedTo:false},shareFullDecode:{exitCode:0,log:'share-audio-decode.log'},visualReview:{exportedFrames:25,softwareWorlds:23,contactSheets:5,inspected:true,continuousViewing:false}},null,2));
fs.writeFileSync(path.join(out,'production-report.md'),`# MK Suite — Every idea has a world

Completed 90-second brand film: 23 software worlds, original synthesized music, and the requested price-free ending, **One suite. One monthly subscription.**

## Deliverables

- [Master](../mk-suite-worlds.mp4): 1920 × 1080, 60 fps, 5,400 frames, H.264 CRF 16, AAC 320 kb/s, limited-range yuv420p, BT.709.
- [Share copy](MK-Suite-Share.mp4): same duration, resolution and frame rate, H.264 CRF 24, AAC 192 kb/s, fast-start playback.
- [Chaptered player](index.html), [chapter map](chapters.json), and product-guide captions in [SRT](MK-Suite.srt) and [WebVTT](MK-Suite.vtt).
- [Editable source](MK-Suite-Editable-Source.zip): all 23 visual, timing and sound modules, framework, music, locked dependencies and rebuild instructions.
- [Master validation](validation.json), [delivery hashes](delivery-manifest.json), and [export review files](review/exported/).

${records.map(r=>`- ${r.file}: ${(r.bytes/1024/1024).toFixed(2)} MiB`).join('\n')}

## Scenes

| Time | Software | Feature highlights |
| --- | --- | --- |
| 0:00.0–0:03.2 | MK Suite | Every idea has a world |
${plan.segments.map(s=>`| ${format(s.startFrame)}–${format(s.endFrame)} | ${s.name} | ${s.copy.slice(1).join('; ')} |`).join('\n')}
| 1:28.0–1:30.0 | MK Suite | One suite. One monthly subscription. |

## Production and verification

Built using [motion-video-skill v0.2.0](https://github.com/Mohamed3042/motion-video-skill/releases/tag/v0.2.0), release commit 2da54524f107cd415dad4c7b52ee33e27df8999f. Motion Orchestrator run r20261002-182500-8d3f used host roles with three parallel builders. All 24 jobs passed ownership, type, determinism, rendered-still and sound gates. The automatic model-review gate was explicitly skipped for host review; the production team performed the visual review.

Reviewed two full-resolution stills per software world, the scene transitions, the opening and ending, and all 25 final director stills. Corrected clipped geometry, copy interference and accidental SVG fills. After rendering, visually inspected 25 exact exported frames covering all 23 software worlds plus opening and ending. Both delivered MP4s passed full video/audio decode. The master contains all 5,400 decoded frames and no detected black intervals at the documented thresholds. Final exported-video measurements and frame samples are saved under review/exported. These checks do not constitute continuous human viewing or listening.

The original stereo PCM soundtrack measures −14.0 LUFS integrated and −1.6 dBTP using FFmpeg. The delivered master AAC measures −14.0 LUFS and −1.1 dBTP; the share AAC measures −14.5 LUFS and −1.2 dBTP. The share soundtrack is encoded directly from the original PCM with 0.5 dB attenuation. All 53 boundary/impact/hit onsets pass within ±1 frame; the loudness difference across world segments is 0.30 LU. **The mix has not been listened to.** No borrowed samples, cloned voices or voiceover are used.

The video stream is exactly 90.000 seconds. The master MP4 container measures 90.005 seconds because of the 5 ms AAC tail, which is less than one video frame. This does not add any video frames.

Source-package audit: 122 files, 112 source/script files matching canonical sources, all 317 local imports resolving inside the package, and ZIP contents matching the package folder by SHA-256. No credentials, private datasets, repository history or node_modules are included.

## Scope and choices

Feature copy was checked against the current local MK Suite catalog and product README/feature documents. The illustrations represent documented workflows; they are not application recordings. Real customer data is not shown.

To fit all 23 software worlds into the requested 90 seconds, each showcase lasts 3.2 or 4.8 seconds and presents three feature highlights. The chaptered player makes individual scenes easy to revisit. A 150 BPM grid replaces the template's 120 BPM grid to accommodate the complete fleet; each world has its own palette, geometry, motion and synthesized sound layer, with 12-frame designed transitions.

The ending contains no price. It also states **Subscription concept; product availability varies. Free cores remain free.** Billing activation and universal paid entitlement are not claimed. Existing free cores remain free. This film has not been published externally.
`);
console.log(JSON.stringify({files:records.map(({file,bytes})=>({file,bytes})),shareValidation:'passed'}));
