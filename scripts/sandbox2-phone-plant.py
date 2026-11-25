"""Source-faithful leaf silhouettes within the unchanged phone Base Camp crop."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
root=Path(__file__).resolve().parent.parent
source=Image.open(root/'public/brand/sandbox2-jungle.webp').convert('RGBA')
box=(994,451,1088,532)
mask=Image.new('L',(94,81));draw=ImageDraw.Draw(mask)
# Red flower and two arcing leaves: no rail, porch, soil or generic foliage.
for polygon in [[(33,38),(30,30),(30,14),(34,4),(38,14),(38,31),(36,41)],[(53,54),(50,40),(54,26),(58,24),(60,43),(58,56)],[(28,47),(15,37),(5,36),(0,40),(10,39),(24,48),(34,61),(32,52)],[(42,60),(55,50),(72,45),(89,47),(91,51),(75,49),(59,56),(46,66)],[(41,66),(30,59),(16,59),(5,70),(2,79),(14,66),(27,65),(40,73)]]:draw.polygon(polygon,fill=210)
mask=mask.filter(ImageFilter.GaussianBlur(.7));patch=source.crop(box);patch.putalpha(mask);patch.save(root/'public/brand/nature/camp-leaf-center.png')
