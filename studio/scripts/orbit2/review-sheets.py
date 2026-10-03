"""Create labelled diagnostic contact sheets without changing source frames."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

folder = Path(sys.argv[1]).resolve()
source = folder / "stills"
output = folder / "sheets"
output.mkdir(exist_ok=True)
font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 22)
sections = [
    ("chaos", 0, 720), ("turn", 720, 1320), ("profile", 1320, 1800),
    ("globe", 1800, 2280), ("findings", 2280, 2760), ("focus", 2760, 3240),
    ("fit", 3240, 3720), ("nextproof", 3720, 4200), ("market", 4200, 4680),
    ("employers", 4680, 5160), ("engine", 5160, 5640), ("anywhere", 5640, 6120),
    ("finale", 6120, 7200),
]
for name, start, end in sections:
    frames = sorted(p for p in source.glob("f*.jpg") if start - 24 <= int(p.stem[1:]) < min(7200, end + 24))
    if not frames:
        continue
    rows = (len(frames) + 3) // 4
    sheet = Image.new("RGB", (2560, rows * 390), "#040b36")
    draw = ImageDraw.Draw(sheet)
    for index, file in enumerate(frames):
        x, y = (index % 4) * 640, (index // 4) * 390
        with Image.open(file) as frame:
            sheet.paste(frame.resize((640, 360), Image.Resampling.LANCZOS), (x, y + 30))
        frame_number = int(file.stem[1:])
        draw.text((x + 8, y + 3), f"{name}  global {frame_number} / local {frame_number-start}", font=font, fill="#ffffff")
    sheet.save(output / f"{name}.jpg", quality=95)
    print(f"{name}: {len(frames)} frames")
