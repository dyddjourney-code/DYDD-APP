"""Repair the original raster legend without changing any trails, artwork or geometry.
Run after replacing/importing map artwork, before publication. Idempotent at the
same native size; the correct current image is also a valid input.
"""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont
p=Path(sys.argv[1] if len(sys.argv)>1 else 'public/brand/dydd-park-map-concept.png')
im=Image.open(p).convert('RGB')
if im.size!=(1672,941):raise ValueError('Inspect changed map dimensions before applying the scoped legend correction')
# The type-only stripe lies entirely inside the parchment, after the red key.
# Fill from the immediately adjacent parchment rows, never over trail markers.
x0,x1,y0,y1=169,344,775,796
for x in range(x0,x1):
 top=im.getpixel((x,y0-1));bottom=im.getpixel((x,y1))
 for y in range(y0,y1):
  t=(y-y0+1)/(y1-y0+1)
  im.putpixel((x,y),tuple(round(a*(1-t)+b*t) for a,b in zip(top,bottom)))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
ImageDraw.Draw(im).text((172,775),'Fruitful Life 360',font=font,fill=(56,43,18))
im.save(p)
print('Corrected raster legend: Fruitful Life 360; native map geometry retained')
