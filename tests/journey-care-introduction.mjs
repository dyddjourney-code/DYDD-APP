import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const base=process.env.JOURNEY_TEST_BASE||'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const review=new URLSearchParams({review:'new',key:cfg.review_token}).toString();
const outline=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline;
const units=outline.flatMap(m=>m.units);
const unit=units.find(u=>u.slug==='what-is-dydd-how-to-c-a-r-e-10');
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
try {
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1920,1280,768,390,320]){
  await page.setViewport({width,height:1000});
  await page.goto(`${base}/journey?lesson=${unit.slug}&${review}`,{waitUntil:'networkidle2'});
  await page.waitForSelector('.journey-care-introduction');
  assert.equal(new URL(page.url()).searchParams.get('lesson'),unit.slug);
  const content=await page.$eval('.journey-active-lesson',e=>e.textContent);
  for(const b of unit.lessonBody) if(b.type==='list'){
   const entries=await page.$$eval('.journey-care-introduction .journey-care-process section',es=>es.map(e=>e.querySelector('h4').textContent+': '+e.querySelector('li').textContent));
   assert.deepEqual(entries,b.items,'Exact original definitions and ordering');
  }else if(b.text)assert(content.includes(b.text),'All original prose retained');
  assert.deepEqual(await page.$$eval('.journey-active-focus span',es=>es.map(e=>e.textContent)),unit.focus);
  assert.equal(await page.$('.journey-lesson-images'),null,'No right-side image');
  assert.equal((await page.$$('.journey-care-information')).length,1,'One beige information box');
  assert.equal((await page.$$('.journey-care-record')).length,1,'One read-only personal record callout');
  const record=await page.$eval('.journey-care-record',e=>e.textContent);
  for(const phrase of ['private workbook','not posted to a group','over time','write your niche','Field Kit','earlier walkthroughs','text file']) assert(record.includes(phrase),'Truthful record copy: '+phrase);
  assert.equal(await page.$('.companion-audio-speakers span'),null,'Duration badge omitted only here');
  assert.equal(await page.$('.journey-active-lesson textarea, .journey-active-lesson input, .journey-active-workbook'),null,'No questions or inputs');
  assert(!/Bring to discussion|Submit reflection/.test(content));
  const audio=await page.$eval('.journey-active-lesson audio',e=>({src:e.currentSrc||e.src,state:e.readyState,error:e.error?.code,top:e.getBoundingClientRect().top}));
  assert(audio.src.endsWith(unit.companionMoment.audioSrc));assert(!audio.error);assert(audio.state>=1,'Audio metadata available');
  assert(await page.$eval('.journey-active-lesson audio',async e=>{await e.play();const playing=!e.paused;e.pause();return playing;}),'CARE Rhythm audio plays');
  const sequence=await page.$eval('.journey-care-introduction',e=>({intro:e.firstElementChild.getBoundingClientRect().top,visual:e.querySelector('.journey-care-demonstration').getBoundingClientRect().top,info:e.querySelector('.journey-care-information').getBoundingClientRect().top}));
  assert(audio.top<sequence.intro && sequence.intro<sequence.visual && sequence.visual<sequence.info);
  const widths=await page.$eval('.journey-care-introduction',e=>{
   const panel=e.querySelector('.journey-care-demonstration').getBoundingClientRect();
   const intro=e.querySelector(':scope > p').getBoundingClientRect();
   const info=e.querySelector('.journey-care-information');
   const box=info.getBoundingClientRect(),text=info.querySelector('p').getBoundingClientRect(),style=getComputedStyle(info);
   return {panel:panel.width,intro:intro.width,box:box.width,text:text.width,inner:box.width-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth),left:panel.left,introLeft:intro.left,boxLeft:box.left};
  });
  assert(Math.abs(widths.intro-widths.panel)<1,'Introduction spans full CARE panel width');
  assert(Math.abs(widths.box-widths.panel)<1,'Information box spans full CARE panel width');
  assert(Math.abs(widths.text-widths.inner)<1,'Information prose fills the box inside its padding');
  assert(Math.abs(widths.left-widths.introLeft)<1 && Math.abs(widths.left-widths.boxLeft)<1,'Text areas align with CARE panel');
  console.log('PASS full-width text areas '+JSON.stringify(widths));
  const colors=await page.$$eval('.journey-care-divider span',es=>es.map(e=>getComputedStyle(e).backgroundColor));
  assert.equal(new Set(colors).size,4,'Four green shades');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
  await page.screenshot({path:`tmp/how-care-${base.startsWith('https')?'published':'local'}-${width}.png`,fullPage:true});
  console.log(`PASS ${width}px exact How to CARE route, original wording/focus/audio, order, four-shade panel, one information box, no activity/overflow`);
 }
 for(const other of units.filter(u=>u.workbookSection && u.type==='normal').slice(0,3)){
  await page.goto(`${base}/journey?lesson=${other.slug}&${review}`,{waitUntil:'networkidle2'});
  await page.waitForSelector('.journey-active-workbook textarea');
  assert((await page.$eval('.journey-active-workbook',e=>e.textContent)).includes('Bring to discussion'));
  assert.equal(await page.$('.journey-care-introduction'),null);
  assert.equal(await page.$('.journey-care-record'),null);
  if(other.companionMoment) assert(await page.$('.companion-audio-speakers span'),'Other lessons with audio retain duration badges');
  console.log('PASS actual CARE lesson retains editable reflection and discussion controls: '+other.slug);
 }
 assert.deepEqual(errors,[]);console.log('PASS no browser runtime errors');
}finally{await browser.close()}
