import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.SANDBOX2_BASE||'http://localhost:3148';
assert(base.startsWith('http://localhost:')||base==='https://dydd-online-school-sandbox-2.vercel.app');
const root='/home/openclaw/.openclaw/workspace/outputs/dydd-sandbox2-2026-11-24';
const out=root+(base.startsWith('https:')?'/hosted':'/local');fs.mkdirSync(out,{recursive:true});
const args=chromium.args.filter(a=>a!=='--single-process');
// Use the configured egress proxy for hosted Chromium when this workspace requires one.
if(base.startsWith('https:')&&process.env.HTTPS_PROXY){const proxy=new URL(process.env.HTTPS_PROXY);args.push(`--proxy-server=${proxy.origin}`,'--ignore-certificate-errors');}
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),args,headless:true});
const results=[],errors=[],audioEvidence=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 if(base.startsWith('https:')&&process.env.HTTPS_PROXY){const proxy=new URL(process.env.HTTPS_PROXY);if(proxy.username)await page.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});}
 for(const width of [1440,768,390,320]){
 await page.setViewport({width,height:width>700?1000:844});
 for(const route of ['/base-camp','/trailheads','/field-kit','/journey','/ranger-station','/fireside','/gear','/waypoints','/camp-circle','/command-center','/courses/designid-foundations','/field-kit/reflections/discover-your-divine-design','/login']){
  await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('.forest-dock',{visible:true});
  if(route==='/trailheads')await page.waitForSelector('.trailhead-renewal .trail-placard',{timeout:30000,visible:true});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>[...document.images].filter(e=>{const r=e.getBoundingClientRect();return r.height>0&&r.bottom>0&&r.top<innerHeight}).every(e=>e.complete),{timeout:8000}).catch(()=>{});
  const evidence=await page.evaluate(()=>({path:location.pathname,title:[...document.querySelectorAll('h1')].find(e=>e.getBoundingClientRect().height>0)?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,eyebrows:[...document.querySelectorAll('.eyebrow,.section-label')].filter(e=>getComputedStyle(e).display!=='none').length,audio:document.querySelectorAll('audio').length,brokenVisibleImages:[...document.images].filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().top<innerHeight&&e.complete&&!e.naturalWidth).map(e=>e.getAttribute('src'))}));
  if(route==='/trailheads')assert.equal(evidence.title,'Trailheads','Fully rendered visible Trailheads required');
  assert(!evidence.overflow,`${route} ${width}: overflow`);assert.equal(evidence.eyebrows,0);assert.deepEqual(evidence.brokenVisibleImages,[],`${route}: broken visible art`);
  await page.screenshot({path:`${out}/${width}-${route.slice(1).replaceAll('/','-')}.png`});console.log('PASS route',width,route);
  results.push({width,route,...evidence});
 }
 await page.click('.forest-menu');await page.waitForSelector('dialog[open]');
 assert(await page.$('.forest-map a[href*="command-center"]'));
 assert.equal(await page.$eval('.forest-map',e=>document.getElementById(e.getAttribute('aria-labelledby'))?.textContent),'Camp map');
 await page.screenshot({path:`${out}/${width}-camp-map.png`});await page.keyboard.press('Escape');assert(!await page.$('dialog[open]'));
 await page.click('.forest-menu');await page.click('.forest-map a[href*="field-kit"]');await page.waitForFunction(()=>location.pathname==='/field-kit');assert(!await page.$('dialog[open]'));
 for(const[slug,title]of [['welcome-and-orientation-welcome-to-discover-your-divine-design-2','Welcome to Discover Your Divine Design'],['welcome-and-orientation-course-outline-and-objectives-3','Course Outline & Objectives']]){
  await page.goto(base+'/journey?lesson='+slug,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('.journey-section-accordion ol button:not([disabled])',{timeout:30000,visible:true});
  await page.waitForFunction(title=>document.querySelector('.journey-active-lesson h2')?.textContent===title,{timeout:30000},title);
  await page.evaluate(()=>document.fonts.ready);
  const images=await page.$$eval('.journey-active-lesson img',es=>es.filter(e=>e.getBoundingClientRect().height>0&&!e.closest('.companion-audio-portraits')).map(e=>e.src));assert.deepEqual(images,[],'No lesson illustration images');
  assert((await page.$eval('.lesson-source',e=>e.textContent)).length>300,'Real authored lesson text remains');
  if(slug.endsWith('-2')){
   await page.waitForFunction(()=>document.querySelector('audio')?.readyState>=2,{timeout:30000});
   const audio=await page.$eval('audio',async e=>{await e.play();return {src:e.getAttribute('src'),duration:e.duration,readyState:e.readyState}});
   await page.waitForFunction(()=>document.querySelector('audio')?.currentTime>.2,{timeout:15000,polling:100}).catch(async error=>{console.log('AUDIO_STATE',JSON.stringify(await page.$eval('audio',e=>({time:e.currentTime,paused:e.paused,ended:e.ended,ready:e.readyState,network:e.networkState,error:e.error?.message,visibility:document.visibilityState,src:e.getAttribute('src')}))));throw error});
   audio.playbackTime=await page.$eval('audio',e=>{e.pause();return e.currentTime});assert(audio.duration>5);assert(audio.playbackTime>.2);
   assert(await page.$('.companion-audio-portraits img'),'Companion portraits retained');
   await page.click('.companion-transcript summary');assert(await page.$('.companion-transcript[open]'));audioEvidence.push({width,...audio});
  }
  await page.$eval('.journey-active-lesson',e=>e.scrollIntoView({block:'start',behavior:'instant'}));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`${out}/${width}-unit-${slug.endsWith('-2')?'1':'2'}.png`});
 }
 }
 const clean=await browser.createBrowserContext();const anon=await clean.newPage();
 if(base.startsWith('https:')&&process.env.HTTPS_PROXY){const p=new URL(process.env.HTTPS_PROXY);if(p.username)await anon.authenticate({username:decodeURIComponent(p.username),password:decodeURIComponent(p.password)});}
 for(const path of ['/courses/designid-foundations','/learn/designid-foundations/welcome-to-designid']){await anon.goto(base+path,{waitUntil:'domcontentloaded'});assert.equal(new URL(anon.url()).pathname,'/login');await anon.goto(base+path+'?review=new&key=invalid',{waitUntil:'domcontentloaded'});assert.equal(new URL(anon.url()).pathname,'/login');}
 await clean.close();
 fs.writeFileSync(out+'/qa.json',JSON.stringify({base,results,audioEvidence,errors,authBoundary:'Anonymous/invalid protected DesignID course and lesson redirect to login',campMap:'Open/Escape and actual route links checked at all widths'},null,2));assert.deepEqual(errors,[]);console.log('PASS '+results.length+' responsive routes; first two authored units at 4 widths; native companion audio playback/transcript/portraits; no lesson illustrations; camp map; anonymous/invalid protected access; no JS errors.');
}finally{await browser.close()}
