import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';

// Run from any directory: node tools/mk-suite/delivery.mjs
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
const plan=JSON.parse(read(path.join(root,'briefs/mk-suite-workflows.plan.json')));
const out=path.join(root,'outputs/mk-suite-workflows');
const fps=plan.fps, endFrame=plan.seconds*fps;
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const stamp=(frame,separator=',')=>{
 const ms=Math.round(frame/fps*1000);
 return [Math.floor(ms/3600000),Math.floor(ms/60000)%60,Math.floor(ms/1000)%60].map(n=>String(n).padStart(2,'0')).join(':')+separator+String(ms%1000).padStart(3,'0');
};
const shortTime=seconds=>Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');
const tagline='One suite. One monthly subscription.';
const qualifications=['Subscription concept; product availability varies.','Free cores remain free.'];
const chapters=[
 {id:'intro',name:'See what you can do',startFrame:0,endFrame:plan.intro.endFrame,description:'Make it happen.',features:[]},
 ...plan.segments.map(s=>({id:s.id,name:s.name,startFrame:s.startFrame,endFrame:s.endFrame,description:s.copy[1],features:s.copy.slice(2)})),
 {id:'outro',name:tagline,startFrame:plan.outro.startFrame,endFrame,description:'',features:qualifications},
];
if(plan.segments.length!==23||endFrame!==5400||fps!==60)throw new Error('Expected the final 23-product, 90-second, 60fps plan.');
for(let i=1;i<chapters.length;i++)if(chapters[i-1].endFrame!==chapters[i].startFrame)throw new Error('Non-contiguous chapters at '+chapters[i].id);
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'chapters.json'),JSON.stringify(chapters.map(({startFrame,endFrame,...chapter})=>({...chapter,start:startFrame/fps,end:endFrame/fps})),null,2)+'\n');
const cueText=c=>[c.name,c.description,c.features.join(' | ')].filter(Boolean).join('\n');
const captionBody=sep=>chapters.map((c,i)=>(i+1)+'\n'+stamp(c.startFrame,sep)+' --> '+stamp(c.endFrame-1,sep)+'\n'+cueText(c)+'\n').join('\n');
fs.writeFileSync(path.join(out,'MK-Suite.srt'),captionBody(','));
fs.writeFileSync(path.join(out,'MK-Suite.vtt'),'WEBVTT\n\n'+captionBody('.'));
const cards=plan.segments.map((s,i)=>'<button type="button" class="world" data-time="'+s.startFrame/fps+'" data-start="'+s.startFrame/fps+'" data-end="'+s.endFrame/fps+'" data-name="'+esc(s.name)+'" style="--accent:'+s.accent+'" aria-pressed="false">'+
 '<div class="thumb"><img src="review/world-'+String(i).padStart(2,'0')+'-1.png" alt="'+esc(s.name)+' illustrated workflow" loading="lazy"><span class="play-mark" aria-hidden="true"></span></div>'+
 '<span class="card-meta"><span>'+String(i+1).padStart(2,'0')+' / '+shortTime(s.startFrame/fps)+'</span><span>'+((s.endFrame-s.startFrame)/fps).toFixed(1)+'s</span></span>'+
 '<h3>'+esc(s.name)+'</h3><p class="outcome">'+esc(s.copy[1])+'</p><ol class="steps">'+s.copy.slice(2).map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol></button>').join('\n');

const html=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
<title>MK Suite | See what you can do</title>
<style>
:root{--bg:#10121a;--panel:#181b25;--fg:#f9f5ec;--sub:#b3b7c5;--line:#363b4b;--coral:#ee6045}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
main{max-width:1496px;margin:auto;padding:38px 44px 30px}a{color:inherit}button,input,select{font:inherit}button,a,input,select{-webkit-tap-highlight-color:transparent}
:focus-visible{outline:2px solid #ffd2a6;outline-offset:5px}header{display:flex;justify-content:space-between;align-items:center;padding-bottom:28px;border-bottom:1px solid var(--line)}
.brand{font-weight:850;letter-spacing:-1px;font-size:25px}.brand span{color:var(--coral)}.edition{font-size:12px;letter-spacing:1.8px;color:#b1b6c6}
.hero{display:flex;gap:45px;align-items:flex-end;justify-content:space-between;margin:49px 0 33px}.eyebrow{color:var(--coral);font-size:12px;letter-spacing:2px;font-weight:750;margin-bottom:14px}h1{font-size:clamp(40px,5.5vw,78px);line-height:1.02;letter-spacing:-3.8px;font-weight:750;margin:0}.hero-copy{max-width:420px;color:var(--sub);font-size:17px;line-height:1.7;margin:0 0 4px}.hero-copy strong{font-weight:650;color:#e5e6ec}
.player{scroll-margin-top:20px;border:1px solid #343947;border-radius:16px;background:#0a0b10;overflow:hidden;box-shadow:0 25px 70px #0005}
video{display:block;width:100%;aspect-ratio:16/9;background:#090a0e}
.player-controls{display:flex;align-items:center;justify-content:space-between;gap:22px;flex-wrap:wrap;padding:17px 22px;background:#1b1e28;border-top:1px solid #343847}
.selection{margin:0;font-size:14px;color:#aeb3c2;max-width:550px}.selection strong{color:#f0ece4;font-weight:650}
.control-group{display:flex;align-items:center;gap:22px;flex-wrap:wrap}.speed{display:flex;align-items:center;gap:10px;font-size:14px;color:#d2d5df}
select{padding:7px 27px 7px 11px;color:var(--fg);background:#272b39;border:1px solid #4d5263;border-radius:7px}
.loop{display:flex;align-items:center;gap:9px;font-size:14px;color:#d2d5df;cursor:pointer}.loop input{width:17px;height:17px;margin:0;accent-color:var(--coral)}
.actions{display:flex;gap:11px;flex-wrap:wrap;margin:21px 0 57px}.actions a{display:inline-flex;align-items:center;padding:11px 19px;border:1px solid #464b5b;border-radius:24px;text-decoration:none;font-size:14px;color:#d4d7e1;transition:background .15s,border-color .15s}
.actions a:hover{background:#252935;border-color:#858b9c}.actions a.primary{background:var(--coral);border-color:var(--coral);color:#181217;font-weight:750}.actions a.primary:hover{background:#fb795e}
.section-head{display:flex;justify-content:space-between;gap:30px;align-items:flex-end;margin:0 0 28px}h2{font-size:30px;line-height:1.2;letter-spacing:-.8px;margin:0 0 8px}.section-head p{margin:0;color:#969eaf;font-size:14px}.flow-key{display:flex;gap:11px;color:#afb6c7;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding-bottom:4px;white-space:nowrap}.flow-key i{width:22px;height:1px;background:#616b80;align-self:center}
.worlds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));column-gap:27px;row-gap:37px}
.world{appearance:none;display:block;min-width:0;background:transparent;border:0;border-top:2px solid var(--accent);border-radius:0;padding:10px 0 0;color:inherit;text-align:left;cursor:pointer;font:inherit}
.thumb{position:relative;overflow:hidden;border-radius:8px;background:#252937;aspect-ratio:16/9}.thumb img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .28s}.world:hover .thumb img{transform:scale(1.025)}
.play-mark{position:absolute;left:15px;bottom:14px;width:36px;height:36px;background:#0d101ce8;border:1px solid #a5aec25c;border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(4px);transition:opacity .2s,transform .2s}.play-mark:after{content:"";display:block;width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:9px solid #f0f3fb;margin-left:2px}
.world:hover .play-mark,.world[aria-pressed="true"] .play-mark{opacity:1;transform:none}.world[aria-pressed="true"] .thumb{box-shadow:0 0 0 2px var(--accent)}
.card-meta{display:flex;justify-content:space-between;margin-top:14px;font-size:11px;letter-spacing:1.3px;color:var(--accent)}h3{font-size:23px;line-height:1.25;letter-spacing:-.65px;font-weight:680;margin:8px 0 6px}.outcome{font-size:14px;color:#afb6c7;line-height:1.55;margin:0 0 15px;min-height:22px}
.steps{list-style:none;counter-reset:step;padding:0;margin:0;color:#c6cad4}.steps li{counter-increment:step;display:flex;align-items:center;gap:9px;font-size:13px;line-height:1.5;padding:3px 0}.steps li:before{content:counter(step);font-size:10px;color:var(--accent);background:#242936;min-width:17px;height:17px;text-align:center;line-height:17px;border-radius:50%}
footer{margin:65px 0 0;border-top:1px solid var(--line);padding-top:28px;display:flex;justify-content:space-between;gap:38px;color:#9098a9;font-size:12px;line-height:1.85}footer strong{display:block;color:#e5e2dc;font-size:17px;font-weight:650;margin-bottom:8px}footer p{margin:0}.credits{max-width:430px}
@media(max-width:1030px){main{padding:28px 26px}.hero{display:block;margin-top:37px}.hero-copy{max-width:690px;margin-top:24px}.worlds{grid-template-columns:repeat(2,minmax(0,1fr))}.player-controls{align-items:flex-start;gap:14px}.selection{width:100%;max-width:none}}
@media(max-width:620px){main{padding:22px 17px}header{align-items:flex-start;gap:20px}.edition{text-align:right;max-width:145px;font-size:10px}h1{letter-spacing:-2px}.hero{margin:31px 0 25px}.hero-copy{font-size:15px}.player-controls{padding:14px}.control-group{gap:15px}.loop,.speed{font-size:12px}.actions{gap:8px;margin-bottom:40px}.actions a{padding:9px 13px;font-size:12px}.section-head{display:block}.flow-key{margin-top:18px}.worlds{grid-template-columns:1fr;row-gap:29px}.outcome{min-height:0}footer{display:block}.credits{margin-top:23px}h2{font-size:27px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.thumb img,.play-mark,.actions a{transition:none}.world:hover .thumb img{transform:none}}
</style>
</head><body><main>
<header><div class="brand">MK SUITE<span>.</span></div><div class="edition">90 SECONDS / 23 PRODUCTS / 1080p60</div></header>
<section class="hero"><div><div class="eyebrow">ILLUSTRATED PRODUCT WORKFLOWS</div><h1>See what<br>you can do.</h1></div><p class="hero-copy"><strong>From an input to a useful result.</strong><br>Explore 23 software workflows, each with its own design and motion. Select a product, slow it down, and study the steps.</p></section>
<section class="player" id="player" aria-label="MK Suite workflow film">
<video id="film" controls playsinline preload="metadata" poster="review/framework-144.png"><source src="../mk-suite-workflows.mp4" type="video/mp4"><track kind="subtitles" src="MK-Suite.vtt" srclang="en" label="Workflow guide"></video>
<div class="player-controls"><p class="selection" id="selection" aria-live="polite">Select a product below to focus on its workflow.</p><div class="control-group"><label class="speed" for="speed">Playback speed <select id="speed"><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1" selected>1×</option></select></label><label class="loop"><input id="loop" type="checkbox">Loop selected workflow</label></div></div>
</section>
<nav class="actions" aria-label="Download the film and project"><a class="primary" href="../mk-suite-workflows.mp4" download>Download master</a><a href="MK-Suite-Workflows-Share.mp4" download>Share copy</a><a href="MK-Suite-Workflows-Source.zip" download>Editable project</a><a href="production-report.md">Production notes</a></nav>
<section aria-labelledby="workflow-title"><div class="section-head"><div><h2 id="workflow-title">Explore the workflows</h2><p>Choose a product to play its scene.</p></div><div class="flow-key" aria-label="Input, action, result"><span>Input</span><i aria-hidden="true"></i><span>Action</span><i aria-hidden="true"></i><span>Result</span></div></div><div class="worlds">__CARDS__</div></section>
<footer><div><strong>One suite. One monthly subscription.</strong><p>Subscription concept; product availability varies.<br>Free cores remain free.</p></div><p class="credits">Illustrated workflows using clearly marked sample data. Interfaces are stylized demonstrations.<br>Original motion graphics and synthesized score.</p></footer>
</main>
<script>
const film=document.getElementById('film');
const speed=document.getElementById('speed');
const loop=document.getElementById('loop');
const selection=document.getElementById('selection');
const buttons=[...document.querySelectorAll('.world[data-start]')];
let selected=null;
let pendingSeek=null;
const play=()=>{const started=film.play();if(started&&typeof started.catch==='function')started.catch(()=>{selection.textContent=selected?selected.name+' selected. Press play to begin.':'Press play to begin.';});};
speed.addEventListener('change',()=>{film.playbackRate=Number(speed.value);});
buttons.forEach(button=>button.addEventListener('click',()=>{
 selected={name:button.dataset.name,start:Number(button.dataset.start),end:Number(button.dataset.end)};
 buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 selection.textContent=selected.name+' · '+(loop.checked?'Looping this workflow':'Workflow selected');
 if(film.readyState===0){pendingSeek=selected.start;film.load();}
 else{film.currentTime=selected.start;play();}
 document.getElementById('player').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}));
film.addEventListener('loadedmetadata',()=>{film.playbackRate=Number(speed.value);if(pendingSeek!==null){film.currentTime=pendingSeek;pendingSeek=null;play();}});
film.addEventListener('timeupdate',()=>{if(loop.checked&&selected&&film.currentTime>=selected.end){film.currentTime=selected.start;if(film.paused)play();}});
film.addEventListener('ended',()=>{if(loop.checked&&selected){film.currentTime=selected.start;play();}});
loop.addEventListener('change',()=>{selection.textContent=selected?selected.name+' · '+(loop.checked?'Looping this workflow':'Workflow selected'):'Select a product below to focus on its workflow.';if(loop.checked&&selected&&(film.currentTime<selected.start||film.currentTime>=selected.end)){film.currentTime=selected.start;play();}});
</script>
</body></html>
`.replace('__CARDS__',cards);
fs.writeFileSync(path.join(out,'index.html'),html);
const refs=[...html.matchAll(/(?:src|href|poster)="([^"]+)"/g)].map(m=>m[1]).filter(ref=>!/^https?:/.test(ref));
const missing=[...new Set(refs)].filter(ref=>!fs.existsSync(path.resolve(out,ref)));
console.log(JSON.stringify({worlds:plan.segments.length,chapters:chapters.length,duration:plan.seconds,missingLocalAssets:missing},null,2));
const master=path.join(root,'outputs/mk-suite-workflows.mp4');
if(fs.existsSync(master)){
 const result=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',master],{encoding:'utf8'});
 if(result.status)throw new Error(result.stderr);
 const probe=JSON.parse(result.stdout),video=probe.streams.find(s=>s.codec_type==='video'),audio=probe.streams.find(s=>s.codec_type==='audio');
 const checks={duration:Number(video?.duration)===90,containerDuration:Math.abs(Number(probe.format.duration)-90)<=1/fps,frames:Number(video?.nb_frames)===5400,dimensions:video?.width===1920&&video?.height===1080,fps:video?.r_frame_rate==='60/1',codecs:video?.codec_name==='h264'&&audio?.codec_name==='aac',pixelFormat:video?.pix_fmt==='yuv420p',color:video?.color_space==='bt709'};
 if(Object.values(checks).some(v=>!v))throw new Error('Master validation failed: '+JSON.stringify(checks));
 const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(master))hash.update(chunk);
 console.log(JSON.stringify({checks,sha256:hash.digest('hex')},null,2));
}
console.log('Workflow gallery, chapter map, SRT and WebVTT written.');
