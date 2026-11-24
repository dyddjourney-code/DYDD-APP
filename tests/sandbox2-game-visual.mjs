import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.SANDBOX2_BASE||'http://localhost:3148';
assert(base==='http://localhost:3148'||base==='https://dydd-online-school-sandbox-2.vercel.app');
const root='/home/openclaw/.openclaw/workspace/outputs/dydd-sandbox2-2026-11-24';
const out=root+(base.startsWith('https')?'/correction-hosted':'/correction-local');fs.mkdirSync(out,{recursive:true});
const args=chromium.args.filter(a=>a!=='--single-process');
let proxy;if(base.startsWith('https')&&process.env.HTTPS_PROXY){proxy=new URL(process.env.HTTPS_PROXY);args.push(`--proxy-server=${proxy.origin}`,'--ignore-certificate-errors');}
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),args,headless:true});
const errors=[],results=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 if(proxy?.username)await page.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});
 async function screenshot(name){await page.waitForFunction(()=>[...document.querySelectorAll(".game-panel")].every(e=>e.getAnimations().every(a=>a.playState==="finished")));await page.evaluate(async()=>{await document.fonts.ready;const scene=new Image();scene.src="/brand/sandbox2-jungle.webp";await scene.decode();});await page.screenshot({path:out+'/'+name+'.png'});}
 async function overflow(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No document overflow');assert(await page.evaluate(()=>!document.querySelector('dialog[open] .game-panel')||document.querySelector('dialog[open] .game-panel').scrollWidth<=document.querySelector('dialog[open] .game-panel').clientWidth+1),'No guide panel overflow');}
 for(const width of [1440,768,390,320]){
  await page.setViewport({width,height:width>700?1000:844});
  await page.goto(base+'/base-camp',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('.game-intro',{visible:true});await screenshot(width+'-base-camp');await overflow();
  assert.equal(await page.$$eval('.game-dock button',es=>es.length),6);assert(await page.$$eval('.game-dock button span',es=>es.every(e=>e.getBoundingClientRect().height>0)),'All six dock labels visible');
  assert(await page.$eval('.game-bottom',e=>e.getBoundingClientRect().bottom<=innerHeight+1),'Dock visible without scroll');
  for(const key of ['map','ranger','trails','passport','kit','fireside']){
   const index=['map','ranger','trails','passport','kit','fireside'].indexOf(key);
   await page.click(`.game-dock button:nth-child(${index+1})`);
   await page.waitForSelector(`dialog[open] .game-panel[data-place="${key}"]`,{visible:true});
   await page.waitForFunction(()=>document.querySelector('.game-panel')?.getAnimations().every(a=>a.playState==='finished'));
   if(key==='passport') {await page.waitForSelector('.game-account-content .passport-book',{visible:true});await page.click('.passport-book-toggle');await page.waitForSelector('.passport-book-content:not([hidden])',{visible:true});}
   if(key==='passport') {
    await page.click('.passport-badge-button');await page.waitForSelector('.passport-detail-sheet[open]',{visible:true});
    await page.keyboard.press('Escape');await page.waitForSelector('.passport-detail-sheet:not([open])');
    assert(await page.$('.game-overlay[open]'),'Closing badge details must keep guide open');
   }
   await screenshot(width+'-'+key);await overflow();
   results.push({width,panel:key,title:await page.$eval('#game-panel-title',e=>e.textContent)});
   await page.keyboard.press('Escape');assert(!await page.$('dialog[open]'));
  }
  await page.click('.game-profile');await page.waitForSelector('.game-panel[data-place="profile"]',{visible:true});
  await page.waitForSelector('.game-account-content #your-profile',{visible:true});
  assert(await page.$('.game-account-content form button[type=submit]'),'Real signout remains');
  const edit=await page.$('.game-account-content #your-profile button');if(edit){await edit.click();await page.waitForSelector('.game-account-content #your-profile input',{visible:true});const cancel=await page.$('::-p-text(Cancel)');if(cancel)await cancel.click();}
  await page.$eval('.game-panel',e=>e.scrollTop=0);await screenshot(width+'-profile');await overflow();await page.keyboard.press('Escape');
  // Actual route, not a static example action.
  await page.click('.game-dock button:nth-child(3)');await page.click('.game-trails a[href*="/journey"]');
  await page.waitForFunction(()=>location.pathname==='/journey');
  await page.waitForSelector('.journey-section-accordion ol button:not([disabled])',{visible:true,timeout:30000});
  assert(!await page.$('dialog[open]'));assert((await page.$eval('.lesson-source',e=>e.textContent)).length>300);
  assert.deepEqual(await page.$$eval('.journey-active-lesson img',es=>es.filter(e=>e.getBoundingClientRect().height>0&&!e.closest('.companion-audio-portraits')).map(e=>e.src)),[]);
  await page.waitForFunction(()=>document.querySelector('audio')?.readyState>=2,{timeout:30000});
  await page.$eval('audio',e=>e.play());await page.waitForFunction(()=>document.querySelector('audio')?.currentTime>.2,{timeout:15000});
  const audio=await page.$eval('audio',e=>{e.pause();return {duration:e.duration,time:e.currentTime}});assert(audio.time>.2);
  await screenshot(width+'-journey');await page.$eval('.journey-active-lesson',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await screenshot(width+'-journey-lesson');await overflow();results.push({width,route:'/journey',audio});
  for(const route of ['/trailheads','/field-kit','/ranger-station','/fireside','/login']){
   await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('.game-reading',{visible:true});
   if(route==='/trailheads')await page.waitForSelector('.trail-placard',{visible:true,timeout:30000});
   await screenshot(width+'-'+route.slice(1));await overflow();results.push({width,route});
  }
 }
 const clean=await browser.createBrowserContext();const anon=await clean.newPage();if(proxy?.username)await anon.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});
 for(const path of ['/courses/designid-foundations','/learn/designid-foundations/welcome-to-designid']){await anon.goto(base+path+'?review=new&key=invalid',{waitUntil:'domcontentloaded'});await anon.waitForFunction(()=>location.pathname==='/login',{timeout:20000});assert.equal(new URL(anon.url()).pathname,'/login');}
 await clean.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/qa.json',JSON.stringify({base,results,errors},null,2));console.log('PASS',results.length,'real panel/route states, all six panels, genuine account/passport, real journey navigation/authored text/audio/no lesson art; 4 widths; no JS errors/overflow.');
}finally{await browser.close();}
