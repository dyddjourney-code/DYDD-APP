import assert from 'node:assert/strict';import fs from 'node:fs';import puppeteer from 'puppeteer-core';import chromium from '@sparticuz/chromium';import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const base=process.env.JOURNEY_TEST_BASE||'http://localhost:3124';assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const units=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline.flatMap(m=>m.units).filter(u=>[16,17].includes(u.row));
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const unit of units)for(const width of [1920,1280,768,390,320]){
 await page.setViewport({width,height:1000});await page.goto(base+'/journey?'+new URLSearchParams({lesson:unit.slug,review:'new',key:cfg.review_token}),{waitUntil:'networkidle2'});await page.waitForSelector('.journey-who-whose-lesson');await page.waitForSelector('.journey-course-index button.active');
 const text=await page.$eval('.journey-active-lesson',e=>e.textContent);assert(text.includes(`Module 3 / Section 3.1 / Lesson ${unit.row-12}`));
 for(const b of unit.lessonBody)for(const t of b.type==='list'?b.items:b.type==='scripture'?[b.text,b.reference]:[b.text])assert(text.includes(t),'Exact authored content');
 assert.deepEqual(await page.$$eval('.journey-active-focus span',es=>es.map(e=>e.textContent)),unit.focus);
 assert.equal(await page.$('.journey-active-workbook, .journey-active-lesson textarea, .journey-active-lesson audio, .journey-who-whose-prayer'),null,'Empty source CARE/prayer/audio not invented');
 assert.equal(await page.$eval('.journey-active-meta',e=>e.textContent.includes('Teaching lesson')),false);assert.equal(await page.$eval('.journey-course-index button.active',e=>e.textContent.includes('Teaching lesson')),false);
 const image=await page.$eval('.journey-lesson-images img',e=>({src:e.currentSrc,loaded:e.complete&&e.naturalWidth>0}));assert.equal(image.src,unit.media.image);assert(image.loaded);
 if(width>=1280){const geometry=await page.$eval('.lesson-source',e=>{const image=e.querySelector('.journey-lesson-images').getBoundingClientRect(),box=e.getBoundingClientRect();const nodes=[...e.querySelectorAll(':scope > p, :scope > ul')].filter(p=>p.getBoundingClientRect().top>image.bottom);const lines=nodes.flatMap(p=>{const range=document.createRange();range.selectNodeContents(p);return [...range.getClientRects()].map(r=>({left:r.left,right:r.right}))});return{left:box.left,right:box.right,imageLeft:image.left,imageBottom:image.bottom,lines}});assert(geometry.imageLeft>geometry.left);assert(geometry.lines.some(l=>l.right>geometry.imageLeft&&l.left<geometry.imageLeft),'Actual text fills image column below image');console.log(unit.slug+' wrap '+width+' '+JSON.stringify(geometry));}
 if(width<=980)assert.equal(await page.$eval('.journey-course-index',e=>getComputedStyle(e).position),'static');
 const scriptures=await page.$$eval('.lesson-source blockquote',es=>es.map(e=>({text:e.textContent,left:parseFloat(getComputedStyle(e).marginLeft),border:getComputedStyle(e).borderLeftColor,width:getComputedStyle(e).borderLeftWidth})));
 assert.equal(scriptures.length,unit.row===16?1:0);if(unit.row===16){assert(scriptures[0].text.includes('Ephesians 2:10'));assert(!scriptures[0].text.includes('NIV'));assert.equal(scriptures[0].border,'rgb(36, 63, 39)');assert.equal(scriptures[0].width,'4px');assert(scriptures[0].left>=20);}
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow '+width);
 await page.$eval('.lesson-source',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`tmp/good-niche-${base.startsWith('https')?'published':'local'}-${unit.row}-${width}.png`,fullPage:true});console.log('PASS '+unit.slug+' '+width+' source/focus/image/Scripture/emptyCARE/noaudio/nooverflow');
}
assert.deepEqual(errors,[]);console.log('PASS no browser runtime errors');}finally{await browser.close()}
