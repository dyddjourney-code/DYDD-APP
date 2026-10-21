import assert from 'node:assert/strict';import fs from 'node:fs';import puppeteer from 'puppeteer-core';import chromium from '@sparticuz/chromium';import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const base=process.env.JOURNEY_TEST_BASE||'http://localhost:3124';assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const source=JSON.parse(fs.readFileSync('content/journey/who-whose-source-2026-10-21.json'));const cells=source.sheets[0].data[1].rowData[0].values;
const unit=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline.flatMap(m=>m.units).find(u=>u.row===15);
const query=new URLSearchParams({lesson:unit.slug,review:'new',key:cfg.review_token});
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const width of [1920,1280,768,390,320]){
 await page.setViewport({width,height:1000});await page.goto(base+'/journey?'+query,{waitUntil:'networkidle2'});await page.waitForSelector('.journey-care-response-grid');
 const text=await page.$eval('.journey-active-lesson',e=>e.textContent);assert(text.includes('Module 3 / Section 3.1 / Lesson 3'));
 for(const block of unit.lessonBody)for(const str of block.type==='list'?block.items:[block.text,...(block.type==='scripture'?[block.reference]:[])])assert(text.includes(str));
 assert.deepEqual(await page.$$eval('.journey-active-focus span',es=>es.map(e=>e.textContent)),['Who','Whose']);
 assert.equal(await page.$('.companion-audio-speakers span'),null);assert.equal(await page.$('.journey-active-meta span:nth-child(1)').then(e=>e.evaluate(e=>e.textContent)),'Book p12 - p17');
 const audio=await page.$eval('audio',async e=>{await e.play();const data={src:e.currentSrc,playing:!e.paused,error:e.error?.code};e.pause();return data});assert(audio.src.endsWith(unit.companionMoment.audioSrc));assert(audio.playing);assert(!audio.error);
 const image=await page.$eval('.journey-lesson-images img',e=>({src:e.currentSrc,loaded:e.complete&&e.naturalWidth>0,left:e.getBoundingClientRect().left}));assert.equal(image.src,cells[6].hyperlink);assert(image.loaded);
 if(width>=1280){
 const geometry=await page.$eval('.lesson-source',e=>{const image=e.querySelector('.journey-lesson-images').getBoundingClientRect(),box=e.getBoundingClientRect();const lines=[...e.querySelectorAll(':scope > p')].filter(p=>p.getBoundingClientRect().top>image.bottom).map(p=>{const range=document.createRange();range.selectNodeContents(p);return [...range.getClientRects()].map(r=>({left:r.left,right:r.right}))}).flat();return{left:box.left,right:box.right,imageLeft:image.left,imageBottom:image.bottom,lines}});
 assert(geometry.imageLeft>geometry.left,'Top-right floating image');
 assert(geometry.lines.some(l=>l.right>geometry.imageLeft&&l.left<geometry.imageLeft),'Actual text fills former image column below image');
 console.log('Wrap geometry '+width+' '+JSON.stringify(geometry));
 }
 assert.equal(await page.$eval('.journey-active-meta',e=>e.textContent.includes('Teaching lesson')),false);
 assert.equal(await page.$eval('.journey-course-index button.active',e=>e.textContent.includes('Teaching lesson')),false);
 if(width<=980)assert.equal(await page.$eval('.journey-course-index',e=>getComputedStyle(e).position),'static','Tablet index cannot overlap the lesson');
 const scriptures=await page.$$eval('.lesson-source blockquote',es=>es.map(e=>({text:e.textContent,left:parseFloat(getComputedStyle(e).marginLeft),border:getComputedStyle(e).borderLeftColor,width:getComputedStyle(e).borderLeftWidth})));
 assert.equal(scriptures.length,1);assert(scriptures[0].text.includes('1 John 3:1 (NIV)'));assert.equal(scriptures[0].border,'rgb(36, 63, 39)');assert.equal(scriptures[0].width,'4px');assert(scriptures[0].left>=20);
 assert.equal((await page.$$('.journey-care-response-grid textarea:not(.discussion-note)')).length,4);assert(await page.$('[data-care-stage="explore"] textarea'));
 assert.equal(await page.$('.journey-who-whose-care .journey-care-divider'),null);
 const positions=await page.$$eval('[data-care-stage]',es=>es.map(e=>{const r=e.getBoundingClientRect(),h=e.querySelector('h4');return{stage:e.dataset.careStage,x:r.x,y:r.y,w:r.width,font:parseFloat(getComputedStyle(e.querySelector('p')).fontSize),color:getComputedStyle(h).backgroundColor,white:getComputedStyle(h).color}}));
 assert.deepEqual(positions.map(p=>p.stage),['connect','act','reflect','explore']);assert.equal(positions[0].y,positions[1].y);assert.equal(positions[2].y,positions[3].y);assert(positions[0].x<positions[1].x&&positions[2].x<positions[3].x);assert(positions[2].y>positions[0].y);assert.equal(new Set(positions.map(p=>p.color)).size,4);assert(positions.every(p=>p.white==='rgb(255, 255, 255)'&&p.font>=14));
 for(const line of cells[7].formattedValue.replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean))assert(text.includes(line),'Exact CARE/prayer line: '+line.slice(0,50));
 assert(text.includes('It does not post or automatically share with your Circle.'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow '+width);
 for(const stage of ['connect','act','reflect','explore'])assert(await page.$(`[data-care-stage="${stage}"] .discussion-mark`));
 await page.$eval('.lesson-source',e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await page.screenshot({path:`tmp/who-whose-refined-${base.startsWith('https')?'published':'local'}-teaching-${width}.png`,fullPage:true});
 await page.$eval('.journey-who-whose-care',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`tmp/who-whose-${base.startsWith('https')?'published':'local'}-${width}.png`,fullPage:false});
 console.log('PASS '+width+'px current source/content/focus, fixed CARE2x2, readable inputs, original playableaudio/no duration, loaded image, prayer, private marks, no overflow');
}assert.deepEqual(errors,[]);console.log('PASS no browser runtime errors');}finally{await browser.close()}
