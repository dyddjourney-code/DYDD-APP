// Read-only layout regression: owner teaching preview; never creates users or saves answers.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const base=process.env.DESIGNID_LAYOUT_BASE||'http://localhost:3124';
assert(base.startsWith('http://localhost:')||base==='https://dydd-online-school-sandbox.vercel.app');
const tag=base.startsWith('https:')?'published':'local';
const lessons=load('lib/courses/designid-foundations.ts').designIdLessons;
const authored=load('lib/courses/designid-authored-lessons.ts').designIdAuthoredLessons;
const prompts=load('lib/courses/designid-reflection-prompts.ts').getDesignIdReflectionPrompts;
const compact=['your-design-profile','reflection-capacity'];
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const errors=[],evidence=[];fs.mkdirSync('tmp',{recursive:true});
try{
 const page=await browser.newPage();page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 // Explicitly deny non-read transport throughout QA; no real learner/preview workbook writes.
 await page.setRequestInterception(true);page.on('request',r=>['GET','HEAD','OPTIONS'].includes(r.method())?r.continue():r.abort());
 await page.goto(base+'/sandbox-review',{waitUntil:'domcontentloaded'});await page.waitForSelector('.designid-welcome-body');
 for(const lesson of lessons.filter((lesson,index)=>!process.env.DESIGNID_LAYOUT_FROM||index>=lessons.findIndex(l=>l.slug===process.env.DESIGNID_LAYOUT_FROM)))for(const width of [1920,1280,768,390,320]){
  await page.setViewport({width,height:1000});await page.goto(base+'/courses/designid-foundations?lesson='+lesson.slug,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(title=>document.querySelector('.designid-active-lesson h2')?.textContent===title,{},lesson.title);await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  await page.waitForFunction(expected=>document.querySelectorAll('.designid-lesson-reflections textarea').length===expected,{},prompts(lesson.slug).length);
  assert.deepEqual(await page.$$eval('.journey-active-focus > span',es=>es.map(e=>e.textContent)),lesson.focus);
  const focus=await page.$$eval('.journey-active-focus > span',es=>es.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),range=document.createRange();range.selectNodeContents(e);return {width:r.width,height:r.height,textWidth:range.getBoundingClientRect().width,lines:range.getClientRects().length,lineHeight:parseFloat(s.lineHeight),minHeight:s.minHeight,overflow:e.scrollWidth>e.clientWidth+1}}));
  for(const f of focus){assert.equal(f.minHeight,'0px');assert(!f.overflow,lesson.slug+'/'+width+' '+JSON.stringify(f));assert(f.height<=f.lines*f.lineHeight+17,'compact natural height '+lesson.slug);if(f.lines===1)assert(Math.abs(f.width-f.textWidth-26)<2,'intrinsic width '+lesson.slug+'/'+width);}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow '+lesson.slug+'/'+width);
  assert(await page.$('.journey-course-index'));assert(await page.$('.journey-active-pagination'));
  let intro;
  if(compact.includes(lesson.slug)){
   await page.waitForFunction(()=>[...document.querySelectorAll('.designid-authored-body img')].every(i=>i.complete&&i.naturalWidth>0));
   intro=await page.$eval('.designid-compact-intro,.designid-capacity-intro',e=>{const image=e.querySelector('img'),i=image.getBoundingClientRect(),p=e.querySelector('p').getBoundingClientRect(),s=e.querySelector('.designid-live-snapshot,.designid-live-capacity').getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e.querySelector('p'));const first=range.getClientRects()[0];return {imageWidth:i.width,imageHeight:i.height,gap:s.top-p.bottom,textLeft:first.left,imageLeft:i.left,textRight:first.right,imageTop:i.top,paragraphTop:p.top,float:getComputedStyle(image.parentElement).float}});
   if(lesson.slug==='your-design-profile'){assert(intro.imageWidth<=(width<768?64:96)+1);assert(intro.imageHeight<=(width<768?64:96)+1);assert.equal(intro.float,'right');assert(intro.textRight<intro.imageLeft);assert(Math.abs(intro.imageTop-intro.paragraphTop)<2);assert(intro.gap>=0&&intro.gap<=72,'no cleared-artwork gap '+JSON.stringify(intro));}
   else {assert.equal(intro.float,'left');assert(intro.imageWidth>64);assert(intro.imageWidth<=286);assert(intro.textLeft>intro.imageLeft+intro.imageWidth);assert.equal(await page.$$eval('.designid-capacity-band strong',es=>es.filter(e=>e.textContent==='Risk:').length),4);assert.equal(new Set(await page.$$eval('.designid-capacity-band',es=>es.map(e=>getComputedStyle(e).backgroundColor))).size,4);assert.equal(await page.$eval('.designid-live-capacity',e=>e.querySelectorAll('dt').length),4);assert(await page.$eval('.designid-live-capacity',e=>e.getBoundingClientRect().height<280),'compact saved status');assert(await page.$$eval('.designid-capacity-band strong',es=>es.every(e=>parseInt(getComputedStyle(e).fontWeight)>=700)),'bold Risk labels');}
   if(lesson.slug==='your-design-profile'){assert.deepEqual(await page.$$eval('.designid-live-snapshot tbody th',es=>es.map(e=>e.textContent)),['Architect','Artisan','Shepherd','Steward']);assert(await page.$eval('.designid-live-snapshot table',e=>Math.abs(e.querySelector('tbody').getBoundingClientRect().width-e.getBoundingClientRect().width)<2));}
   else assert.equal(await page.$$('.designid-capacity-band').then(es=>es.length),4);
  }
  if(lesson.slug==='welcome-to-designid'||authored[lesson.slug]){await page.$eval('.designid-active-lesson',e=>e.scrollIntoView({block:'start'}));await page.waitForFunction(()=>[...document.querySelectorAll('.designid-authored-body img,.designid-welcome-body img')].every(i=>i.complete&&i.naturalWidth>0));await (await page.$('.designid-active-lesson')).screenshot({path:`tmp/designid-layout-${tag}-${lesson.slug}-${width}.png`});}
  evidence.push({slug:lesson.slug,width,focus,intro});console.log('PASS '+tag+' '+lesson.slug+' '+width+(intro?' '+JSON.stringify(intro):''));
 }
 for(const slug of compact){await page.goto(base+'/learn/designid-foundations/'+slug,{waitUntil:'domcontentloaded'});await page.waitForSelector('.designid-compact-intro,.designid-capacity-intro');assert.equal(await page.$eval('.designid-authored-artwork',e=>getComputedStyle(e).float),slug==='reflection-capacity'?'left':'right');}
 assert.deepEqual(errors,[]);fs.writeFileSync(`tmp/designid-layout-${tag}-measurements.json`,JSON.stringify(evidence,null,2)+'\n');console.log(`PASS ${evidence.length} course/width cases; 10 spreadsheet-authored lessons + 3 later lessons; standalone compact bodies; no writes/runtime errors`);
}finally{await browser.close();}
