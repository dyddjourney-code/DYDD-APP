import {launchReviewBrowser,authenticateReviewPage} from "../scripts/journey-review-browser.mjs";
import assert from 'node:assert/strict';import fs from 'node:fs';import puppeteer from 'puppeteer-core';import chromium from '@sparticuz/chromium';import load from '../scripts/fruitlife-test-load.cjs';
const base=process.env.JOURNEY_TEST_BASE||'http://localhost:3124',url=new URL(base);assert((['localhost','127.0.0.1'].includes(url.hostname)&&url.protocol==='http:')||base==='https://dydd-online-school-sandbox.vercel.app','Local or canonical sandbox only');
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json')),lessons=load('lib/journey/review-lessons.ts').journeyReviewLessons,legacy=JSON.parse(fs.readFileSync('content/journey/four-sections-legacy-keys-2026-11-19.json')),norm=s=>s.replace(/\s+/g,' ').trim(),errors=[],results=[],screens=new Set();assert.equal(Object.keys(lessons).length,40);fs.mkdirSync('tmp',{recursive:true});
const outline=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline;
let isolatedPositionRequests=0;
const browser=await launchReviewBrowser();
try{const page=await browser.newPage();await authenticateReviewPage(page);page.on('pageerror',e=>errors.push(e.message));
await page.setRequestInterception(true);page.on('request',r=>{
 if(new URL(r.url()).pathname==='/api/course-reflections'&&r.postData()?.includes('"action":"position"')){isolatedPositionRequests++;return void r.respond({status:200,contentType:'application/json',body:'{}'});}void r.continue();
});
async function selectLesson(slug){
 const m=outline.find(m=>m.units.some(u=>u.slug===slug)),u=m.units.find(u=>u.slug===slug);
 await page.evaluate(title=>{const s=[...document.querySelectorAll('.journey-module-accordion > section')].find(s=>s.querySelector('.journey-module-toggle strong')?.textContent===title);const b=s.querySelector('.journey-module-toggle');if(b.getAttribute('aria-expanded')!=='true')b.click()},m.title);
 await page.waitForFunction(({module,section})=>{const m=[...document.querySelectorAll('.journey-module-accordion > section')].find(s=>s.querySelector('.journey-module-toggle strong')?.textContent===module);return [...m.querySelectorAll('.journey-section-toggle strong')].some(e=>e.textContent===section)}, {},{module:m.title,section:u.section});
 await page.evaluate(({module,section})=>{const m=[...document.querySelectorAll('.journey-module-accordion > section')].find(s=>s.querySelector('.journey-module-toggle strong')?.textContent===module);const b=[...m.querySelectorAll('.journey-section-toggle')].find(b=>b.querySelector('strong')?.textContent===section);if(b.getAttribute('aria-expanded')!=='true')b.click()}, {module:m.title,section:u.section});
 await page.waitForFunction(title=>[...document.querySelectorAll('.journey-section-accordion ol button')].some(b=>b.querySelector('strong')?.textContent===title&&!b.disabled),{},u.title);
 await page.evaluate(title=>[...document.querySelectorAll('.journey-section-accordion ol button')].find(b=>b.querySelector('strong')?.textContent===title).click(),u.title);
 await page.waitForFunction(title=>document.querySelector('.journey-active-lesson h2')?.textContent===title,{},u.title);
}
// Establish the review cookie once. Never log this URL or the private token.
await page.goto(base+'/journey?'+new URLSearchParams({lesson:Object.keys(lessons)[0],review:'new',key:cfg.review_token}),{waitUntil:'domcontentloaded'});await page.waitForSelector('.journey-review-lesson .lesson-source');
for(const width of [1920,1280,768,390,320]){await page.setViewport({width,height:1000});for(const [slug,l]of Object.entries(lessons)){
 await selectLesson(slug);await page.waitForSelector('.journey-review-lesson .lesson-source');
 if(l.prompts.length)await page.waitForSelector('.journey-active-lesson [data-question] textarea:not([disabled]), .journey-active-lesson [data-question] input:not([disabled]), .journey-active-lesson [data-question] select:not([disabled])');
 const source=norm(await page.$eval('.journey-review-lesson .lesson-source',e=>e.textContent)),text=norm(await page.$eval('.journey-active-lesson',e=>e.textContent));
 for(const b of l.lessonBody){for(const t of b.items||[b.text].filter(Boolean))assert(source.includes(norm(t)),`Source fidelity ${slug}/${width}`);if(b.reference)assert(source.includes(norm(b.reference)),`Scripture reference ${slug}`);const tag=b.type==='scripture'?'blockquote':b.type==='heading'?'h2,h3,h4':b.type==='list'?'ul,ol':null;if(tag)assert(await page.$('.lesson-source '+tag),`Semantic ${b.type} ${slug}`);}
 for(const t of [l.prayer,l.nextStep,...(l.kind==='care'?[l.careIntro,...l.care.flatMap(c=>[c.explanation,c.prompt])]:[])].filter(Boolean))assert(text.includes(norm(t)),`Review wording ${slug}/${width}`);
 assert(!/Build note:|Teach .+ with enough clarity|TODO|PLACEHOLDER|lorem ipsum/i.test(text),'No placeholders '+slug);
 const ids=await page.$$eval('.journey-active-lesson [data-question]',es=>es.map(e=>e.dataset.question));const builder=l.kind==='pathfinder'&&slug.startsWith('niche-')?['niche-working-declaration']:[];assert.deepEqual([...ids].sort(),[...l.prompts.map(p=>p.id),...builder].sort(),`Rendered exact saved field IDs ${slug}`);
 if(l.kind==='pathfinder'){assert.equal(await page.$$eval('.journey-pathfinder-waypoint',es=>es.length),legacy[slug].prompts.length);assert.deepEqual(ids.filter(id=>id!=='niche-working-declaration').sort(),legacy[slug].prompts.map(p=>p.id).sort());}
 if(l.kind==='completion')assert.equal(await page.$$eval('.journey-active-lesson [data-question] textarea,.journey-active-lesson [data-question] input,.journey-active-lesson [data-question] select',es=>es.length),0,'Completion no fields');
 let grid=[];if(l.kind==='care'){grid=await page.$$eval('.journey-review-care [data-care-stage]',es=>es.map(e=>({stage:e.dataset.careStage,x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y})));assert.deepEqual(grid.map(g=>g.stage),['connect','act','reflect','explore']);if(width>=1280){assert(Math.abs(grid[0].y-grid[1].y)<2);assert(Math.abs(grid[2].y-grid[3].y)<2);assert(grid[1].x>grid[0].x);}if(width<=390)assert(grid.every((g,i)=>!i||g.y>grid[i-1].y),'Stacked phone CARE');}
 const imgs=await page.$$('.journey-active-lesson img');for(const img of imgs)await img.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await page.waitForFunction(()=>[...document.querySelectorAll('.journey-active-lesson img')].every(i=>i.complete&&i.naturalWidth>0));
 for(const b of l.lessonBody.filter(b=>b.type==='image')){assert(b.src.startsWith('/'),'Local authored image '+slug);assert(await page.$$eval('.lesson-source img',(es,src)=>es.some(i=>i.getAttribute('src')===src),b.src),'Exact authored image '+slug);}
 const imageReport=await page.$$eval('.journey-active-lesson .lesson-source img',es=>es.map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})));assert(imageReport.every(i=>i.loaded),'Loaded teaching images');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No overflow '+slug+'/'+width);assert.equal(errors.length,0,'No JavaScript errors');results.push({slug,width,kind:l.kind,ids,grid,images:imageReport});
 const section=legacy[slug].module,key=section+'/'+width;if([1920,390].includes(width)&&!screens.has(key)){await page.screenshot({path:`tmp/four-sections-${section}-${width}.png`,fullPage:true});screens.add(key);}console.log(`PASS ${slug} ${width}`);
}}
assert.equal(results.length,200);assert.equal(screens.size,8);assert.deepEqual(errors,[]);fs.writeFileSync('tmp/four-sections-browser-results.json',JSON.stringify({base,cases:results.length,errors,results,realSidebarSelection:true,isolatedPositionRequests,positionOnlyIntercepted:true},null,2));console.log('PASS all 200 lesson/viewport cases; eight representative section screenshots; zero JS errors');}finally{await browser.close();}
