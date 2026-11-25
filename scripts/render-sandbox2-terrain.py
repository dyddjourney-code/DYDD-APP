#!/usr/bin/env python3
"""Newly authored, deterministic 4096px physical-relief park illustration.
Run: python scripts/render-sandbox2-terrain.py /absolute/output/folder.
Install scripts/requirements-sandbox2-terrain.txt in an external venv first.
No source photograph or upscale used.
"""
from pathlib import Path
import json, math, sys
import numpy as np
from scipy.ndimage import zoom, gaussian_filter, distance_transform_edt, map_coordinates
from scipy.interpolate import CubicSpline
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'outputs'/'sandbox2-terrain'
OUT.mkdir(parents=True,exist_ok=True)
W,H=4096,2730
rng=np.random.default_rng(98412)
y,x=np.mgrid[0:H,0:W].astype(np.float32); x/=W; y/=H

def noise(n):
    a=rng.random((n,max(3,round(n*1.5))),dtype=np.float32)
    return zoom(a,(H/a.shape[0],W/a.shape[1]),order=1)[:H,:W]
n1=noise(8); n2=noise(23); n3=noise(70); n4=noise(230); n5=noise(750)
# Broad alpine buttresses descend from northwest into an open central watershed.
h=np.zeros((H,W),np.float32)
for cx,cy,sx,sy,amp in [(.08,.05,.22,.25,1.1),(.32,.04,.19,.13,1.0),(.18,.33,.13,.24,.8),(.06,.59,.15,.25,.63),(.46,.12,.13,.12,.6),(.42,.43,.12,.17,.3),(.59,.78,.14,.2,.24),(.94,.29,.12,.2,.4),(.96,.79,.12,.2,.3)]:
    h+=amp*np.exp(-((x-cx)/sx)**2-((y-cy)/sy)**2)
# Craggy eroded flutes and multi-scale physical rock relief.
h+=.19*(n1-.5)+.09*(n2-.5)+.035*(n3-.5)+.012*(n4-.5)
mount=np.clip((h-.45)*1.7,0,1)
h+=mount*(.20*(1-np.abs(2*n2-1))+.075*(1-np.abs(2*n3-1))+.035*(1-np.abs(2*n4-1))+.013*(n5-.5))
# Deeper riparian trough on the east; no rapids.
h-=.15*np.exp(-((x-.80)/.085)**2)
gy,gx=np.gradient(gaussian_filter(h,14)); normal=np.sqrt(1+(gx*950)**2+(gy*950)**2)
shade=np.clip((.75-gx*700-gy*800)/normal,.08,1.3)
fgy,fgx=np.gradient(gaussian_filter(h,1.5))
fine=np.clip((.75-fgx*200-fgy*240)/np.sqrt(1+(fgx*260)**2+(fgy*260)**2),.08,1.3)
shade=np.clip(shade*.66+fine*.34,.08,1.3)
shade=gaussian_filter(shade,.7)
rock=np.clip((h-.62)*2.6+(.5-n3)*.52,0,1)
# Meadow, heath, stone and earth use natural muted mineral palettes.
grass=np.stack([88+23*n2+16*n3,112+27*n2+16*n3,58+11*n2+14*n3],axis=2)
stone=np.stack([128+24*n3,127+22*n3,111+25*n3],axis=2)
col=grass*(1-rock[...,None])+stone*rock[...,None]
col*=np.clip(.67+shade*.61,.45,1.30)[...,None]
col+=(n5[...,None]-.5)*10
im=Image.fromarray(np.uint8(np.clip(col,0,255))).convert('RGB')
# Flowing river, supplied normalized centerline, edge-to-edge extension.
river=[(.80,-.04),(.80,.08),(.76,.20),(.83,.30),(.76,.43),(.83,.54),(.77,.65),(.84,.79),(.79,.94),(.80,1.04)]
def curve(points,per=50):
    p=np.array(points)*[W,H]; d=np.r_[0,np.cumsum(np.sqrt(np.sum(np.diff(p,axis=0)**2,axis=1)))]; t=np.linspace(0,d[-1],len(points)*per)
    return list(map(tuple,np.stack([CubicSpline(d,p[:,0])(t),CubicSpline(d,p[:,1])(t)],axis=1)))
rpts=curve(river)
watermask=Image.new('L',(W,H)); wd=ImageDraw.Draw(watermask); wd.line(rpts,fill=255,width=132,joint='curve')
d=ImageDraw.Draw(im)
for width,color in [(169,(79,87,62)),(157,(132,126,93)),(148,(157,147,105)),(138,(74,119,108)),(124,(49,105,103)),(94,(44,99,100)),(60,(46,103,105))]: d.line(rpts,fill=color,width=width,joint='curve')
# Transparent faint water streaks, smooth cruise channel.
waterlayer=Image.new('RGBA',(W,H)); dw=ImageDraw.Draw(waterlayer)
for j in range(230):
    k=rng.integers(10,len(rpts)-25); seg=np.array(rpts[k:k+int(rng.integers(5,18))]); off=rng.uniform(-42,42); seg[:,0]+=off
    dw.line(list(map(tuple,seg)),fill=(154,198,177,int(rng.integers(15,43))),width=int(rng.integers(1,3)))
im=Image.alpha_composite(im.convert('RGBA'),waterlayer).convert('RGB')
# Walking routes. Fine switchbacks follow benches rather than straight ascents.
trail=[(.25,.73),(.274,.69),(.285,.64),(.32,.60),(.303,.565),(.258,.55),(.225,.52),(.22,.46),(.25,.435),(.278,.419),(.263,.394),(.224,.385),(.236,.36),(.292,.346),(.32,.30),(.292,.282),(.248,.274),(.235,.252),(.27,.228),(.252,.207),(.20,.18),(.245,.157),(.30,.159),(.34,.133),(.39,.143),(.45,.12),(.49,.145),(.50,.19),(.55,.215),(.56,.26),(.546,.31),(.585,.34),(.566,.38),(.60,.412),(.587,.455),(.625,.49),(.614,.535),(.65,.568),(.66,.61),(.70,.65)]
spiritual=[(.32,.30),(.38,.26),(.44,.30),(.47,.40),(.44,.50),(.38,.55),(.32,.60)]
fruitful=[(.51,.77),(.46,.83),(.43,.88),(.37,.89),(.32,.86),(.27,.81),(.25,.73)]+trail[1:4]+[(.36,.64),(.40,.68),(.45,.72),(.51,.77)]
designpd=[(.70,.65),(.69,.69),(.67,.74),(.65,.81),(.60,.84),(.55,.82),(.51,.77)]
entry=[(.21,.94),(.23,.9),(.26,.89),(.32,.86)]
branches=[[(.32,.60),(.36,.64),(.40,.68),(.45,.72),(.51,.77)],[(.51,.77),(.57,.76),(.61,.72),(.65,.68),(.70,.65)],[(.70,.65),(.735,.655),(.754,.65),(.762,.65)],spiritual,fruitful,designpd,entry]

trailmask=Image.new('L',(W,H)); dt=ImageDraw.Draw(trailmask)
trailcurves=[curve(q) for q in [trail]+branches]
d=ImageDraw.Draw(im)
for pts in trailcurves:
    dt.line(pts,fill=255,width=28,joint='curve')
    d.line([(a+2,b+3) for a,b in pts],fill=(74,77,48),width=13,joint='curve')
    d.line(pts,fill=(159,144,100),width=10,joint='curve')
    d.line(pts,fill=(192,175,124),width=6,joint='curve')
# Forest exclusion / landmark meadows.
exclude=np.array(trailmask)>0
exclude|=np.array(watermask)>0
for cx,cy,rx,ry in [(.70,.65,.024,.030),(.51,.77,.022,.030),(.25,.73,.014,.019),(.32,.86,.023,.027),(.60,.84,.020,.027),(.67,.74,.016,.024),(.45,.12,.016,.022)]: exclude|=((x-cx)/rx)**2+((y-cy)/ry)**2<1
# Detailed sunlit tree crowns with layered fine boughs, individually rasterized.
def tree_sprite(rad,seed,kind):
    r=np.random.default_rng(seed); s=rad*5; a=Image.new('RGBA',(s,s)); z=ImageDraw.Draw(a); c=s//2
    z.ellipse((c-rad+4,c-rad+7,c+rad+9,c+rad+14),fill=(16,30,20,65))
    base=(int(r.integers(34,49)),int(r.integers(64,83)),int(r.integers(32,47)))
    # irregular conifer crown comprises small shaded needle fans, not flat circles
    for j in range(48):
        theta=r.uniform(0,math.tau); rr=rad*np.sqrt(r.random())*.92
        xx=c+math.cos(theta)*rr; yy=c+math.sin(theta)*rr
        br=r.uniform(.13,.31)*rad; light=(-math.cos(theta)-math.sin(theta))*.5+1
        color=tuple(int(np.clip(v+light*12+r.uniform(-7,7),0,255)) for v in base)+(255,)
        z.ellipse((xx-br,yy-br,xx+br,yy+br),fill=color)
    for j in range(17):
        xx=c+r.uniform(-.6,.4)*rad; yy=c+r.uniform(-.65,.4)*rad; b=max(1,rad*.11)
        z.ellipse((xx-b,yy-b,xx+b,yy+b),fill=(base[0]+28,base[1]+31,base[2]+14,210))
    return a
sprites={(r,k):tree_sprite(r,1200+r*20+k,k) for r in range(5,16) for k in range(12)}
# Jittered dense crowns with natural openings and altitude-driven treeline.
meadow=np.exp(-((x-(.40+.07*np.sin(y*9)))/.075)**2)*np.clip((y-.22)*4,0,1)
coords=[]
for yy in range(8,H,12):
    for xx in range(8,W,12):
        px=int(np.clip(xx+rng.integers(-6,7),0,W-1)); py=int(np.clip(yy+rng.integers(-6,7),0,H-1))
        if exclude[py,px]: continue
        elev=h[py,px]; density=.92 if elev<.64 else max(.03,.87-(elev-.64)*2.2)
        density*=.40+.80*n2[py,px]
        density*=1-.91*meadow[py,px]
        density*=np.clip((n3[py,px]-.12)*1.8,.2,1)
        if rng.random()>density: continue
        rad=int(rng.integers(7,15)) if elev<.72 else int(rng.integers(5,10))
        coords.append((px,py,rad,int(rng.integers(12))))
tinted={}
for px,py,r,k in sorted(coords,key=lambda a:a[1]):
    bucket=int(np.clip(shade[py,px]*5,0,6)); key=(r,k,bucket)
    if key not in tinted: tinted[key]=ImageEnhance.Brightness(sprites[r,k]).enhance(.68+bucket*.085)
    a=tinted[key]; im.paste(a,(px-a.width//2,py-a.height//2),a)
# Fine low vegetation and pale rock outcrops left above tree line.
d=ImageDraw.Draw(im)
for j in range(4000):
    px=int(rng.integers(W)); py=int(rng.integers(H))
    if h[py,px]>.85 and not exclude[py,px]:
        length=int(rng.integers(2,10)); d.line((px,py,px+length,py-length//2),fill=(174,171,146),width=1)
# Ranger station: single cabin, unmistakable ridged shingle roof, porch, chimney.
cx,cy=int(.70*W),int(.65*H)
d.rounded_rectangle((cx-75,cy-57,cx+80,cy+68),radius=20,fill=(148,144,93))
d.rectangle((cx-50+10,cy-31+12,cx+53+10,cy+37+12),fill=(59,68,43))
d.rectangle((cx-49,cy-30,cx+49,cy+30),fill=(99,67,39))
d.rectangle((cx-58,cy+27,cx+58,cy+44),fill=(158,119,69))
for v in range(-55,56,9): d.line((cx+v,cy+28,cx+v,cy+44),fill=(107,79,45),width=2)
d.polygon([(cx-58,cy-38),(cx+58,cy-38),(cx+58,cy),(cx-58,cy)],fill=(116,72,45))
d.polygon([(cx-58,cy),(cx+58,cy),(cx+58,cy+28),(cx-58,cy+28)],fill=(76,49,34))
for yy in range(-34,27,6):
    d.line((cx-56,cy+yy,cx+56,cy+yy),fill=(136,89,56) if yy<0 else (91,62,42),width=1)
    for xx in range(-53,55,11): d.line((cx+xx+(yy%2)*3,cy+yy,cx+xx+(yy%2)*3,cy+yy+5),fill=(65,47,35),width=1)
d.line((cx-60,cy,cx+60,cy),fill=(174,117,67),width=4)
d.rectangle((cx+28,cy-28,cx+40,cy-13),fill=(171,162,139)); d.rectangle((cx+30,cy-26,cx+38,cy-18),fill=(54,51,44))
# Steps, log piles, one picnic table in clearing.
d.rectangle((cx-15,cy+45,cx+15,cy+53),fill=(171,149,99))
for xx in range(cx+61,cx+74,4):d.line((xx,cy-17,xx,cy+8),fill=(91,63,37),width=3)
d.rectangle((cx-67,cy+4,cx-56,cy+25),fill=(111,79,43))
# Fire circle: individual rough stones, ash center, several log seats.
cx,cy=int(.51*W),int(.77*H)
d.ellipse((cx-39,cy-34,cx+39,cy+34),fill=(160,145,99))
d.ellipse((cx-17,cy-15,cx+17,cy+15),fill=(64,59,48))
for j in range(12):
    t=j*math.tau/12; xx=cx+19*math.cos(t); yy=cy+17*math.sin(t)
    d.ellipse((xx-5,yy-4,xx+5,yy+4),fill=(164+j%3*9,158+j%3*7,136+j%3*6))
d.line((cx-8,cy-4,cx+8,cy+6),fill=(66,39,22),width=5); d.line((cx-6,cy+6,cx+5,cy-6),fill=(83,45,23),width=4)
for ang in [0,2.1,4.2]:
    xx=cx+33*math.cos(ang); yy=cy+31*math.sin(ang); dx=11*math.sin(ang); dy=-11*math.cos(ang)
    d.line((xx-dx+2,yy-dy+3,xx+dx+2,yy+dy+3),fill=(77,72,45),width=8)
    d.line((xx-dx,yy-dy,xx+dx,yy+dy),fill=(124,84,43),width=7)
# Rustic path-entry gate, overhead crossbeam and posts.
cx,cy=int(.25*W),int(.73*H)
d.line((cx-23,cy-12,cx+21,cy+11),fill=(65,58,32),width=8)
d.line((cx-25,cy-17,cx+20,cy+6),fill=(167,119,61),width=5)
for xx,yy in [(cx-25,cy-17),(cx+20,cy+6)]: d.ellipse((xx-5,yy-5,xx+5,yy+5),fill=(105,68,32))
# Wooden jetty reaches channel west side at specified point.
cx,cy=int(.762*W),int(.65*H)
d.rectangle((cx-49,cy-11,cx+8,cy+11),fill=(74,66,41))
d.rectangle((cx-51,cy-15,cx+7,cy+6),fill=(167,131,77))
for xx in range(cx-49,cx+7,7):d.line((xx,cy-14,xx,cy+5),fill=(103,80,46),width=2)
# Arrival glades: original destinations, not additional buildings.
# Base Camp: canvas tents, footpath, small wooden welcome threshold.
cx,cy=int(.32*W),int(.86*H)
d.ellipse((cx-67,cy-47,cx+69,cy+47),fill=(128,140,85))
for ox,oy in [(-31,-7),(25,13)]:
    d.polygon([(cx+ox-25,cy+oy+16),(cx+ox+24,cy+oy+16),(cx+ox+4,cy+oy-19)],fill=(112,85,51))
    d.polygon([(cx+ox-25,cy+oy+16),(cx+ox-4,cy+oy-19),(cx+ox+4,cy+oy-19)],fill=(192,175,124))
    d.line((cx+ox-5,cy+oy-18,cx+ox+3,cy+oy+15),fill=(225,207,153),width=2)
# Camp Circles is a gathering circle of log benches, not another cabin.
cx,cy=int(.60*W),int(.84*H)
d.ellipse((cx-54,cy-46,cx+54,cy+46),fill=(156,150,100))
for j in range(7):
    t=j*math.tau/7;xx=cx+35*math.cos(t);yy=cy+29*math.sin(t);dx=11*math.sin(t);dy=-9*math.cos(t)
    d.line((xx-dx+3,yy-dy+3,xx+dx+3,yy+dy+3),fill=(73,76,46),width=8)
    d.line((xx-dx,yy-dy,xx+dx,yy+dy),fill=(130,88,48),width=7)
d.ellipse((cx-12,cy-10,cx+12,cy+10),fill=(104,106,69))
# Field Kit: outdoor reading/work table set into a small path-side glade.
cx,cy=int(.67*W),int(.74*H)
d.ellipse((cx-39,cy-35,cx+39,cy+35),fill=(142,144,91))
d.rectangle((cx-20,cy-14,cx+24,cy+19),fill=(76,71,45));d.rectangle((cx-24,cy-18,cx+20,cy+13),fill=(170,132,77))
for xx in range(cx-22,cx+21,7):d.line((xx,cy-17,xx,cy+12),fill=(115,88,48),width=1)
d.line((cx-32,cy-25,cx+29,cy-25),fill=(112,81,44),width=7);d.line((cx-32,cy+21,cx+29,cy+21),fill=(112,81,44),width=7)
d.rectangle((cx-14,cy-10,cx+3,cy+3),fill=(221,209,166));d.line((cx-5,cy-10,cx-5,cy+3),fill=(123,112,77),width=1)
# Waypoints: a small timber lookout on the alpine ridge bench.
cx,cy=int(.45*W),int(.12*H)
d.rectangle((cx-28,cy-20,cx+32,cy+24),fill=(92,85,60));d.rectangle((cx-31,cy-23,cx+27,cy+20),fill=(172,143,96))
for xx in range(cx-28,cx+27,6):d.line((xx,cy-21,xx,cy+18),fill=(115,94,62),width=1)
d.line((cx-32,cy-23,cx+29,cy-23),fill=(208,180,125),width=3)
# Quiet embers at the fire circle; brighter warmth is an interactive SVG layer.
cx,cy=int(.51*W),int(.77*H)
d.ellipse((cx-7,cy-6,cx+7,cy+6),fill=(173,84,35));d.ellipse((cx-3,cy-4,cx+3,cy+3),fill=(233,167,63))
# Subtle atmospheric integration, no labels or UI.
im.save(OUT/'terrain-overhead-4k.webp',quality=95,method=6)
im.resize((1536,1024),Image.Resampling.LANCZOS).save(OUT/'terrain-overhead-preview.jpg',quality=92)
route={'canvas':{'width':W,'height':H},'authorship':'New deterministic procedural physical-relief illustration; no AI generation or upscale','coordinates':'normalized [0,1], top-left origin','landmarks':{'rangerStation':[.70,.65],'fireCircle':[.51,.77],'entryGate':[.25,.73],'jetty':[.762,.65],'baseCamp':[.32,.86],'campCircles':[.60,.84],'fieldKit':[.67,.74],'waypoints':[.45,.12],'startHere':[.21,.94]},'routes':{'DYDD':trail,'riverDesignID':river[1:-1],'connectingPaths':branches,'SpiritualGifts':spiritual,'FruitfulLife360':fruitful,'DesignPD':designpd,'entry':entry},'riverWidthPixels':132,'notes':'Routes painted in artwork. Overlays should follow supplied spline control points; use centripetal/CubicSpline arc-length smoothing. River navigation remains open.'}
route['sampledPaths']={'DYDD':[[round(a/W,6),round(b/H,6)] for a,b in trailcurves[0]],'riverDesignID':[[round(a/W,6),round(b/H,6)] for a,b in rpts],**{name:[[round(a/W,6),round(b/H,6)] for a,b in curve(points)] for name,points in [('SpiritualGifts',spiritual),('FruitfulLife360',fruitful),('DesignPD',designpd)]}}
(OUT/'terrain-routes.json').write_text(json.dumps(route,indent=2))
print('Rendered',len(coords),'individual crowns',W,H,flush=True)
