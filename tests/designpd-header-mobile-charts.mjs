import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const base=process.env.COURSE_TEST_BASE||'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const tag=base.startsWith('https:')?'published':'local';
const course=load('lib/courses/designpd-alignment.ts').designPdCourse;
const lessons=load('lib/courses/designid-authored-lessons.ts').designIdAuthoredLessons;
const expectedImageHash='aff898961ca1bbb8faac0f7235efacc5f861026f39b76dcd0d0f0c89bae781b1';
const image=await fetch(base+'/brand/designpd-course-cartoon-hero.jpg');assert(image.ok);assert.equal(crypto.createHash('sha256').update(Buffer.from(await image.arrayBuffer())).digest('hex'),expectedImageHash);
const surfaces=[
 ['integrative','/courses/designid-foundations?lesson=integrative-reflections','.designid-authored-table',1],
 ['learning','/courses/designid-foundations?lesson=learning-and-contribution','.designid-authored-table',2],
 ['shadow','/courses/designid-foundations?lesson=shadow-reflections','.designid-authored-table',1],
 ['ecosystem','/courses/designid-foundations?lesson=exploring-the-dydd-ecosystem','.designid-authored-table',1],
 ['love','/journey?lesson=identity-the-design-reflections-and-love-21','.journey-authored-table',1],
 ['lens','/journey?lesson=identity-the-designid-lens-what-is-in-the-report-19','.designid-shadow-table',1],
];
const b=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const errors=[],evidence=[];
try{
 const p=await b.newPage();p.on('pageerror',e=>errors.push(e.message));p.setDefaultNavigationTimeout(60000);
 // Use the actual established owner entry and sidebar, not a newly eligible test user.
 await p.goto(base+'/sandbox-review',{waitUntil:'domcontentloaded'});await p.waitForSelector('.trail-main-route');
 const sidebar=await p.$('aside a[href^="/trailheads"],.app-sidebar a[href^="/trailheads"]');assert(sidebar,'Sidebar Trailheads owner entry');
 await sidebar.evaluate(e=>e.click());await p.waitForFunction(()=>location.pathname==='/trailheads');
 await p.waitForSelector('a[href*="/courses/designpd-alignment"]');await p.$eval('a[href*="/courses/designpd-alignment"]',e=>e.click());
 await p.waitForSelector('.designpd-course-hero');console.log('PASS sandbox-review → actual sidebar Trailheads → DesignPD owner access');
 for(const width of [1920,1280,768,390,320]){
  await p.setViewport({width,height:1000});await p.goto(base+'/courses/designpd-alignment',{waitUntil:'domcontentloaded'});await p.waitForSelector('.designpd-course-hero');await p.waitForSelector('.assessment-active-lesson h2');
  const geo=await p.evaluate(()=>{const h=document.querySelector('.designpd-course-hero'),t=document.querySelector('.designpd-top-racetrack');return{background:getComputedStyle(h).backgroundImage,heroBottom:h.getBoundingClientRect().bottom,trackTop:t.getBoundingClientRect().top,overflow:document.documentElement.scrollWidth>innerWidth+1,columns:getComputedStyle(t.querySelector('ol')).gridTemplateColumns.split(' ').length}});
  assert(!geo.overflow);assert.equal(geo.columns,8);assert(geo.background.includes('designpd-course-cartoon-hero.jpg'));assert(Math.abs(geo.heroBottom-geo.trackTop)<2);assert.equal(await p.$eval('h1',e=>e.textContent),course.title);
  assert.equal(await p.$$('.mini-course-logo-intro').then(e=>e.length),0);
  await p.screenshot({path:`tmp/designpd-header-mobile-${tag}-header-${width}.png`});evidence.push({surface:'header',width,...geo});
 }
 for(let i=0;i<course.modules.length;i++){
  const selector=`.designpd-top-racetrack li:nth-child(${i+1}) a`;const link=await p.$eval(selector,e=>e.href);assert.equal(new URL(link).searchParams.get('lesson'),course.modules[i].lessons[0].slug);
  await p.$eval(selector,e=>e.click());await p.waitForFunction(title=>document.querySelector('.assessment-active-lesson h2')?.textContent===title,{},course.modules[i].lessons[0].title);
 }
 console.log('PASS eight actual DesignPD module links open correct lessons');
 const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
 await p.goto(base+'/courses/designpd-alignment?'+new URLSearchParams({review:'new',key:cfg.review_token,lane:'fruitlife'}),{waitUntil:'domcontentloaded'});await p.waitForSelector('.designpd-top-racetrack');
 const contextLinks=await p.$$eval('.designpd-top-racetrack a',es=>es.map(e=>({review:new URL(e.href).searchParams.get('review'),key:new URL(e.href).searchParams.get('key'),lane:new URL(e.href).searchParams.get('lane')})));
 for(const l of contextLinks){assert.equal(l.review,'new');assert.equal(l.key,cfg.review_token);assert.equal(l.lane,'fruitlife');}
 console.log('PASS existing verified preview and lane context retained by every module link');
 const desktop=[];
 for(const [name,path,selector,count] of surfaces)for(const width of [1920,1280,768,390,320]){
  await p.setViewport({width,height:1000});await p.goto(base+path,{waitUntil:'domcontentloaded'});await p.waitForSelector(selector);await p.waitForFunction(({selector,count})=>document.querySelectorAll(selector).length===count,{}, {selector,count});
  await p.evaluate(()=>document.fonts.ready);
  const actual=await p.$$eval(selector,es=>es.map(e=>{
   const headers=[...e.querySelectorAll('thead th')].map(x=>x.textContent.trim());
   const rows=[...e.querySelectorAll('tbody tr')].map(r=>[...r.children].map(c=>c.textContent));
   const cells=[...e.querySelectorAll('tbody tr')].map(r=>[...r.children].map(c=>{const g=c.getBoundingClientRect();return {x:g.x,y:g.y,w:g.width,h:g.height,label:c.dataset.label,font:parseFloat(getComputedStyle(c).fontSize)}}));
   return{text:e.textContent,headers,rows,cells,display:getComputedStyle(e).display,w:e.getBoundingClientRect().width,scroll:e.scrollWidth,rects:[e,...e.querySelectorAll('tr,th,td')].map(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return{w:r.width,h:r.height,x:r.x,display:s.display,font:s.fontSize,padding:s.padding}})};
  }));
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page overflow '+name+'/'+width);
  for(const table of actual){
   if(width<768){assert.equal(table.display,'block');assert(table.scroll<=table.w+1,'No hidden comparison columns');
    for(let r=0;r<table.cells.length;r++)for(let c=0;c<table.cells[r].length;c++){const cell=table.cells[r][c];assert(cell.w>=190,'Full readable width '+name);assert(cell.font>=15);if(c){assert(cell.y>=table.cells[r][c-1].y+table.cells[r][c-1].h-1,'Type grouped in reading order');assert.equal(cell.label,table.headers[c]);}else if(cell.label)assert.equal(cell.label,table.headers[c]);}
   }else assert.equal(table.display,'table','Desktop remains table');
  }
  if(name==='love'){const source=JSON.parse(fs.readFileSync('content/journey/design-reflections-love-source-2026-10-22.json'));assert.deepEqual(actual[0].headers,source.chart.headers);assert.deepEqual(actual[0].rows,source.chart.rows);}
  if(width>=768){const original=await p.$$eval(selector,es=>es.map(e=>{e.classList.remove('mobile-comparison-table');const rects=[e,...e.querySelectorAll('tr,th,td')].map(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return{w:r.width,h:r.height,x:r.x,display:s.display,font:s.fontSize,padding:s.padding}});e.classList.add('mobile-comparison-table');return rects}));assert.deepEqual(actual.map(t=>t.rects),original,'Desktop geometry/styles equal original table presentation');}
  // Authored words and cells match preserved source, without regenerated copy.
  if(['integrative','learning','ecosystem'].includes(name)){
   const slug={integrative:'integrative-reflections',learning:'learning-and-contribution',ecosystem:'exploring-the-dydd-ecosystem'}[name];
   const source=await p.evaluate(html=>{const d=document.createElement('div');d.innerHTML=html;return [...d.querySelectorAll('table')].map(e=>[...e.querySelectorAll('tbody tr')].map(r=>[...r.children].map(c=>c.textContent)))},lessons[slug].bodyHtml);
   assert.deepEqual(actual.map(t=>t.rows),source);
  }
  if(width>=768)desktop.push({name,width,tables:actual.map(t=>({text:t.text,rects:t.rects}))});
  const first=await p.$(selector);await first.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
  await first.screenshot({path:`tmp/designpd-header-mobile-${tag}-${name}-${width}.png`});
  if(name==='learning')await(await p.$$(selector))[1].screenshot({path:`tmp/designpd-header-mobile-${tag}-contribution-${width}.png`});
  evidence.push({surface:name,width,tables:actual});console.log('PASS',tag,name,width,'authored cells/grouping/labels/readable/no overflow');
 }
 fs.writeFileSync(`tmp/designpd-header-mobile-${tag}-desktop.json`,JSON.stringify(desktop,null,2));
 // Score summary and scored wheel remain charts/tables, not text-card conversions.
 await p.goto(base+'/courses/designid-foundations?lesson=your-design-profile',{waitUntil:'domcontentloaded'});await p.waitForSelector('.designid-live-snapshot table');assert.equal(await p.$eval('.designid-live-snapshot table',e=>getComputedStyle(e).display),'table');assert.equal(await p.$('.designid-live-snapshot .mobile-comparison-table'),null);
 for(const slug of ['integrative-reflections','learning-and-contribution','shadow-reflections','exploring-the-dydd-ecosystem']){await p.goto(base+'/learn/designid-foundations/'+slug,{waitUntil:'domcontentloaded'});await p.waitForSelector('.mobile-comparison-table');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 for(const path of ['/courses/spiritual-gifts-service','/courses/fruitlife-360-formation','/courses/designid-foundations','/journey']){await p.goto(base+path,{waitUntil:'domcontentloaded'});assert.equal(await p.$('.designpd-course-hero'),null);assert.equal(await p.$('.designpd-top-racetrack'),null);}
 const anon=await b.createBrowserContext(),a=await anon.newPage();await a.goto(base+'/courses/designpd-alignment',{waitUntil:'domcontentloaded'});assert.equal(new URL(a.url()).pathname,'/login');await anon.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(`tmp/designpd-header-mobile-${tag}-verification.json`,JSON.stringify({status:'PASS',tag,base,imageHash:expectedImageHash,errors,evidence},null,2));console.log('PASS standalone, unchanged score summary and neighboring headers, anonymous gate, zero runtime errors');
}finally{await b.close()}
