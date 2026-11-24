"""Rebuild Dydi's source-faithful 800 × 1200 cutout rig (Pillow only).
The illustration has occluded hands: gestures are deliberately arm-led, not
fabricated finger animation. Coordinates use the normalized illustration.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / 'public/brand/characters/dydi-full-body.png').convert('RGBA').resize((800,1200),Image.Resampling.LANCZOS)
out = ROOT / 'public/brand/adventure'
out.mkdir(parents=True, exist_ok=True)
parts = {
 'head': [(260,30),(515,30),(515,222),(448,235),(432,272),(360,280),(348,232),(268,225)],
 'torso': [(303,218),(349,210),(363,250),(426,248),(446,210),(517,230),(513,364),(501,444),(505,480),(531,528),(548,579),(505,600),(426,576),(394,551),(343,559),(285,576),(231,548),(254,450),(275,329)],
 'book-arm': [(300,232),(316,258),(280,352),(391,374),(355,538),(304,538),(265,525),(229,490),(218,444),(233,386),(256,319)],
 'upper-arm': [(512,231),(539,248),(555,291),(566,350),(577,408),(566,459),(528,463),(503,420),(502,361),(495,299)],
 'forearm': [(511,405),(570,407),(576,448),(552,489),(528,500),(479,558),(458,529),(478,487),(496,451)],
 'left-thigh': [(256,539),(341,530),(379,561),(383,707),(373,799),(279,808),(254,735),(245,626)],
 'left-shin': [(263,759),(376,759),(382,867),(379,979),(373,1014),(289,1015),(281,960),(283,876)],
 'left-boot': [(293,987),(374,987),(379,1057),(374,1093),(329,1108),(240,1107),(238,1075),(266,1044),(288,1025)],
 'right-thigh': [(354,548),(447,547),(510,573),(524,654),(525,737),(535,801),(414,810),(386,738),(366,654)],
 'right-shin': [(404,761),(532,759),(543,867),(559,970),(548,1039),(462,1040),(448,974),(425,903)],
 'right-boot': [(465,1009),(546,1009),(551,1066),(559,1124),(547,1154),(477,1155),(468,1128),(477,1081)],
 'mouth': [(376,167),(414,160),(417,178),(376,185)],
}
for name, polygon in parts.items():
    mask = Image.new('L',source.size)
    ImageDraw.Draw(mask).polygon(polygon,fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(.55))
    layer = source.copy()
    layer.putalpha(ImageChops.multiply(source.getchannel('A'),mask))
    layer.save(out / f'dydi-{name}.webp', quality=94, method=6)
print(f'Built {len(parts)} source-image cutout layers.')
