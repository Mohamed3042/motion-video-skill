from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[2]
def sheets(files,name):
 for start in range(0,len(files),12):
  batch=files[start:start+12]
  canvas=Image.new('RGB',(1080,510*((len(batch)+3)//4)),'#101211');draw=ImageDraw.Draw(canvas)
  for i,file in enumerate(batch):
   im=Image.open(file).convert('RGB');im.thumbnail((270,480))
   x=(i%4)*270;y=(i//4)*510
   canvas.paste(im,(x,y+30));draw.text((x+10,y+9),file.stem.upper(),fill='#edb654')
  out=root/'out'/f'{name}-{start//12+1}.png';canvas.save(out);print(out)
order=['intro','ingest','sync','review','captions','handoff','sound','picture','library','editroom','profile','anywhere']
heroes=[root/'studio/public/phone/heroes'/f'{id}.png' for id in order]
sheets(heroes,'phone-heroes')
boundaries=[480,1080,2040,2640,3360,3960,5040,6120,6960,7800,8520,9000]
transition={f for b in boundaries for f in [b-6,b,b+6]}
files=sorted((root/'out/stills').glob('f*.png'),key=lambda f:int(f.stem[1:]))
sheets([f for f in files if int(f.stem[1:]) not in transition],'phone-scenes')
sheets([f for f in files if int(f.stem[1:]) in transition],'phone-edits')
