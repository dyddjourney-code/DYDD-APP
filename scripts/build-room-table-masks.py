"""Physical relief-table alpha matte in the unchanged source room coordinates."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
root=Path(__file__).resolve().parents[1]
size=Image.open(root/'public/brand/environments/ranger.webp').size
points=[(20.6,70.1),(26,65.4),(28.1,62),(28.7,60),(30.3,59),(31,56),(33,54.4),(35,53.5),(36,51.9),(37.5,50.7),(39,50.9),(40,49.3),(42.2,48.6),(44.4,49.2),(46,50.4),(48,50.6),(49.8,51.5),(51.2,51.2),(53.3,52.3),(55,53.3),(56.8,54.4),(58,57.6),(59.5,59.2),(61,61.7),(63,64),(66.7,69.8),(66.5,72.3),(65,72.9),(64.5,96.5),(62.8,99),(22.5,99),(22.1,73.2),(20.6,72.9)]
mask=Image.new('L',size);ImageDraw.Draw(mask).polygon([(x*size[0]/100,y*size[1]/100) for x,y in points],fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(.65));out=Image.new('RGBA',size,(255,255,255,0));out.putalpha(mask)
out.save(root/'public/brand/adventure/ranger-table-mask.png',optimize=True)
print('Built source-coordinate relief-table alpha matte:',size)
size=Image.open(root/'public/brand/environments/archive.webp').size
points=[(22,62),(27,56),(61,55),(63,54),(67,55),(70,58),(83,70),(83,76),(80,76),(80,100),(28,100),(28,77),(23,74)]
mask=Image.new('L',size);ImageDraw.Draw(mask).polygon([(x*size[0]/100,y*size[1]/100) for x,y in points],fill=255)
mask=mask.filter(ImageFilter.GaussianBlur(.65));out=Image.new('RGBA',size,(255,255,255,0));out.putalpha(mask)
out.save(root/'public/brand/adventure/archive-table-mask.png',optimize=True)
print('Built source-coordinate classroom-table alpha matte:',size)
