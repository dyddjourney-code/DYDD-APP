// Rebuild current contact sheet and printable review PDF from existing badge exports.
// Does not regenerate or alter the individual artwork.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const slugs=['identity','expertise','story','desire','gifts','niche','designid','spiritual-gifts','design-pathways','designpd','fruitlife-360','shepherd','artisan','architect','steward'];
export async function refreshTrailBadgePreviews(labels){
 const dir=path.join(process.cwd(),'public/brand/badges');
 labels??=slugs.map(slug=>[slug,fs.readFileSync(path.join(dir,slug+'-badge.svg'),'utf8').match(/<title id="title">(.*?) badge<\/title>/)[1]]);
 const cell=230,labelHeight=42,cols=5,width=cols*cell,height=Math.ceil(labels.length/cols)*(cell+labelHeight),composites=[],cards=[];
 for(const [index,[slug,label]] of labels.entries()){
  const left=index%cols*cell,top=Math.floor(index/cols)*(cell+labelHeight),badge=await sharp(path.join(dir,slug+'-badge.png')).resize(176,176).png().toBuffer();
  const escaped=label.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${labelHeight}"><text x="${cell/2}" y="28" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="800" fill="#171915">${escaped}</text></svg>`;
  composites.push({input:badge,left:left+27,top:top+18},{input:Buffer.from(svg),left,top:top+194});
  cards.push(`<figure><img alt="${escaped} badge" src="data:image/png;base64,${badge.toString('base64')}"><figcaption>${escaped}</figcaption></figure>`);
 }
 const preview=await sharp({create:{width,height,channels:4,background:'#fbfaf4'}}).composite(composites).png().toBuffer();fs.writeFileSync(path.join(dir,'dydd-trail-badges-preview.png'),preview);
 const browser=await puppeteer.launch({args:chromium.args,executablePath:await chromium.executablePath(),headless:true});
 try{const page=await browser.newPage();await page.setContent(`<!doctype html><html><head><title>DYDD trail badges — Fruitful Life 360</title><style>@page{size:${width}px ${height}px;margin:0}*{box-sizing:border-box}body{margin:0;background:#fbfaf4;color:#171915;font-family:Arial,Helvetica,sans-serif;display:grid;grid-template-columns:repeat(5,230px)}figure{height:272px;margin:0;text-align:center;padding-top:18px}img{width:176px;height:176px;display:block;margin:0 auto}figcaption{margin-top:6px;font-size:20px;font-weight:800}</style></head><body>${cards.join('')}</body></html>`,{waitUntil:'load'});await page.pdf({path:path.join(dir,'dydd-trail-badges-preview.pdf'),width:width+'px',height:height+'px',printBackground:true,margin:{top:0,bottom:0,left:0,right:0}});}finally{await browser.close();}
 return {badges:labels.length,width,height};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await refreshTrailBadgePreviews()));
