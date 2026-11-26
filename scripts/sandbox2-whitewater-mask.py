"""Keep actual original foam RGB; alpha selects bright cool source pixels only.
No invented strokes/textures, and no motion on calm pools, terrain or bridges.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import re, json, hashlib
source=Path('public/brand/adventure/realistic-ranger-north-water-trail-20261125.webp')
im=Image.open(source).convert('RGB'); w,h=im.size
geography=Path('components/arrival-map-geography.ts').read_text()
path=re.search(r'export const riverAdventure = "([^"]+)',geography)[1]
corridor=Image.new('L',im.size); draw=ImageDraw.Draw(corridor)
for segment in path.split('M')[1:]:
 pts=[(float(x)*w/100,float(y)*h/100) for x,y in re.findall(r'([\d.]+) ([\d.]+)',segment)]
 draw.line(pts,fill=255,width=18)
alpha=Image.new('L',im.size); a=alpha.load(); rgb=im.load(); mask=corridor.load()
for y in range(h):
 for x in range(w):
  r,g,b=rgb[x,y]
  if mask[x,y] and r>170 and g>180 and b>170 and b>=r*.98 and max(r,g,b)-min(r,g,b)<45:
   a[x,y]=min(200,(min(r,g,b)-165)*4)
# Feather alpha, never the original RGB.
alpha=alpha.filter(ImageFilter.GaussianBlur(.35)); result=Image.new('RGBA',im.size)
for y in range(h):
 for x in range(w):
  opacity=alpha.getpixel((x,y))
  if opacity: result.putpixel((x,y),(*rgb[x,y],opacity))
output=Path('public/brand/nature/river-whitewater.png');result.save(output,optimize=True)
print(json.dumps({'source':str(source),'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'dimensions':im.size,'foamPixels':sum(v>0 for v in alpha.getdata()),'output':str(output)}))
