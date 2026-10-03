// Local film player with byte-range support for seeking. Run: node out/serve-player.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = import.meta.dirname;
const port = Number(process.env.MONTAGE_PLAYER_PORT ?? 3098);
const mime = {'.html':'text/html; charset=utf-8','.mp4':'video/mp4','.jpg':'image/jpeg','.png':'image/png','.zip':'application/zip','.json':'application/json','.md':'text/plain; charset=utf-8'};
const server = http.createServer((req,res)=>{
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
  let name;
  try {name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'montage-pro-worlds.html';} catch {res.writeHead(400);res.end();return;}
  if (name!==path.basename(name) || !mime[path.extname(name)]) {res.writeHead(404);res.end();return;}
  const file=path.join(root,name);
  let stat; try {stat=fs.statSync(file);if(!stat.isFile())throw new Error();}catch{res.writeHead(404);res.end();return;}
  const size=stat.size;
  let start=0,end=size-1,status=200;
  if (req.headers.range) {
    const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!m || (!m[1]&&!m[2])) {res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
    if (!m[1]) start=Math.max(0,size-Number(m[2]));
    else {start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]));}
    if (!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size) {res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
    status=206;
  }
  const headers={'Content-Type':mime[path.extname(name)],'Content-Length':Math.max(0,end-start+1),'Accept-Ranges':'bytes','Cache-Control':'no-store'};
  if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  res.writeHead(status,headers);
  if(req.method==='HEAD'||size===0){res.end();return;}
  const stream=fs.createReadStream(file,{start,end});
  res.on('close',()=>stream.destroy());
  stream.on('error',()=>res.destroy());
  stream.pipe(res);
});
server.listen(port,'127.0.0.1',()=>console.log(`Montage Pro player: http://127.0.0.1:${port}/montage-pro-worlds.html`));
