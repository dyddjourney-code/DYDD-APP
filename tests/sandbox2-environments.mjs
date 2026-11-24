import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.SANDBOX2_BASE||'http://localhost:3148';
assert(['http://localhost:3148','https://dydd-online-school-sandbox-2.vercel.app'].includes(base));
const out='/home/openclaw/.openclaw/workspace/outputs/dydd-sandbox2-2026-11-24/environment-'+(base.startsWith('https')?'hosted':'local');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/qa.json',JSON.stringify({base,state:'running',startedAt:new Date().toISOString()}));process.on('uncaughtExceptionMonitor',e=>fs.writeFileSync(out+'/qa.json',JSON.stringify({base,state:'failed',failureType:e.name})));
const args=chromium.args.filter(x=>x!=='--single-process');let proxy;
if(base.startsWith('https')&&process.env.HTTPS_PROXY){proxy=new URL(process.env.HTTPS_PROXY);args.push(`--proxy-server=${proxy.origin}`,'--ignore-certificate-errors');}
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),args,headless:true});
const results=[],errors=[];
try{
 const token=fs.readFileSync('.env.local','utf8').split('\n').find(x=>x.startsWith('DYDD_REVIEW_TOKEN='))?.split('=').slice(1).join('=').replace(/^['\"]|['\"]$/g,'');assert(token,'Configured sandbox preview credential');await browser.setCookie({name:'dydd_sandbox_review',value:token,domain:new URL(base).hostname,path:'/',secure:base.startsWith('https'),httpOnly:true,sameSite:'Lax'});
 const page=await browser.newPage();if(proxy?.username)await page.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});
 page.on('pageerror',e=>errors.push(e.message));
 async function shot(name){await page.waitForFunction(()=>[...document.querySelectorAll('dialog[open],.destination-room')].every(e=>e.getAnimations().every(a=>a.playState==='finished')));await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.destination-art')].map(i=>i.decode()));const art=document.querySelector('.environment-scene-art');if(art){const url=getComputedStyle(art).backgroundImage.match(/url\([\"']?(.*?)[\"']?\)/)?.[1];if(url){const i=new Image();i.src=url;await i.decode();}}});await page.screenshot({path:`${out}/${name}.png`});}
 async function overflow(label){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' document overflow');assert(await page.evaluate(()=>[...document.querySelectorAll('.destination-room,.destination-account,.destination-detail')].every(e=>e.scrollWidth<=e.clientWidth+1)),label+' room overflow');}
 for(const width of [1440,768,390,320]){
  await page.setViewport({width,height:width>700?1000:844});
  await page.goto(base+'/base-camp',{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('.game-intro');
  await page.evaluate(async()=>{const i=new Image();i.src='/brand/sandbox2-jungle.webp';await i.decode();});await shot(width+'-base-camp');
  assert(await page.$eval('.game-bottom',e=>e.getBoundingClientRect().bottom<=innerHeight+1),'Camp dock remains visible');
  for(const [index,key] of ['map','ranger','trails','passport','kit','fireside'].entries()){
   await page.click(`.game-dock button:nth-child(${index+1})`);await page.waitForSelector(`dialog[open] [data-place="${key}"] .destination-interior`);
   await page.waitForFunction(()=>document.querySelector('.destination-room').getAnimations().every(a=>a.playState==='finished'));
   await shot(width+'-'+key);await overflow(key);assert(await page.$eval('.destination-art',e=>e.naturalWidth>=1400),'High resolution environment artwork');
   if(key==='map'||key==='ranger'){
    await page.click('.scene-object');await page.waitForSelector('.destination-detail .relief-map-marker');
    const count=await page.$$eval('.destination-detail .relief-map-marker',es=>es.length);assert(count>=10,'Real ecosystem map markers');assert(await page.$eval('.destination-detail .relief-map-panel a',e=>new URL(e.href).searchParams.has('key')),'Map CTA retains owner preview context');
    await page.click('.destination-detail .marker-trailheads');assert.equal(await page.$eval('.destination-detail .relief-map-panel h3',e=>e.textContent),'Trailheads');
    await shot(width+'-'+key+'-map');await overflow('map-table');await page.click('.destination-detail .relief-map-toolbar button');await page.waitForSelector('.relief-map-dialog[open]');await page.keyboard.press('Escape');assert(await page.$('.destination-detail[open]'),'Expanded map Escape keeps work surface');assert(await page.$('.game-overlay[open]'),'Expanded map Escape keeps room');await page.keyboard.press('Escape');assert(await page.$('.game-overlay[open]'),'Work surface Escape keeps room');
    if(key==='ranger'){
     await page.click('.scene-object:nth-child(2)');await page.waitForSelector('.destination-detail .ranger-desk-section');await shot(width+'-ranger-desk');await page.click('.destination-detail > header button');
    }
   }
   if(key==='passport'){
    await page.waitForSelector('.passport-book-toggle');await page.click('.passport-book-toggle');await page.waitForSelector('.passport-book-content:not([hidden])');
    await page.click('.passport-badge-button');await page.waitForSelector('.passport-detail-sheet[open]');await page.keyboard.press('Escape');assert(await page.$('.game-overlay[open]'),'Nested badge close keeps room open');
    assert(!await page.$('.passport-badge-button img[src*=\"dydd-trail-badges-preview\"]'),'Individual milestone emblems, not full contact sheet');assert.equal(await page.$eval('.destination-account .passport-book-cover',e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','No dark cover beneath paper-folio text');await shot(width+'-passport-open');await overflow('passport');
   }
   if(key==='trails')assert.equal(await page.$$eval('.scene-object[href]',es=>es.length),5);
   if(key==='kit')assert(await page.$('.scene-object[href*="reflections"]'),'Real workbook destination');
   await page.keyboard.press('Escape');assert(!await page.$('dialog[open]'));assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-expanded')),'false','Focus restored to the originating dock button');results.push({width,room:key});
  }
  await page.click('.game-profile');await page.waitForSelector('.game-account-content #your-profile');
  assert(await page.$('.game-account-content form button[type=submit]'),'Genuine signout control');
  const edit=await page.$('.game-account-content #your-profile button');if(edit){await edit.click();await page.waitForSelector('.game-account-content #your-profile input');const cancel=await page.$('::-p-text(Cancel)');if(cancel)await cancel.click();}
  await shot(width+'-profile');await overflow('profile');await page.keyboard.press('Escape');
  // Navigate from a real trail object, not an example handler.
  await page.click('.game-dock button:nth-child(3)');await page.click('.scene-object[href*="/journey"]');await page.waitForFunction(()=>location.pathname==='/journey');
  await page.waitForSelector('.journey-section-accordion ol button:not([disabled])',{timeout:30000});
  assert((await page.$eval('.lesson-source',e=>e.textContent)).length>300);
  assert.deepEqual(await page.$$eval('.journey-active-lesson img',es=>es.filter(e=>e.getBoundingClientRect().height>0&&!e.closest('.companion-audio-portraits')).map(e=>e.src)),[],'No inline lesson artwork');
  await page.waitForFunction(()=>document.querySelector('audio')?.readyState>=2,{timeout:30000});await page.$eval('audio',e=>e.play());await page.waitForFunction(()=>document.querySelector('audio').currentTime>.3,{timeout:15000});const audio=await page.$eval('audio',e=>{e.pause();return {duration:e.duration,time:e.currentTime}});
  await shot(width+'-journey');await page.$eval('.journey-active-lesson',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await shot(width+'-journey-lesson');await overflow('journey');await page.evaluate(()=>{const es=[...document.querySelectorAll('.journey-active-lesson button,.journey-active-lesson a[href],.journey-active-lesson textarea')].filter(e=>e.getBoundingClientRect().height>0);es.at(-1)?.scrollIntoView({block:'center',behavior:'instant'});});assert(await page.evaluate(()=>{const es=[...document.querySelectorAll('.journey-active-lesson button,.journey-active-lesson a[href],.journey-active-lesson textarea')].filter(e=>e.getBoundingClientRect().height>0);const r=es.at(-1)?.getBoundingClientRect(),dock=document.querySelector('.game-dock').getBoundingClientRect();return !r||r.bottom<=dock.top;}),'Final course control clears fixed dock');await shot(width+'-journey-final-control');results.push({width,route:'/journey',audio});
  for(const route of ['/ranger-station','/trailheads','/field-kit','/fireside','/waypoints','/gear','/camp-circle','/command-center','/live','/field-kit/reflections/discover-your-divine-design']){
   await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('.game-reading');if(route==='/trailheads')await page.waitForSelector('.trail-placard',{timeout:30000});
   await shot(width+'-route-'+route.slice(1).replaceAll('/','-'));await overflow(route);results.push({width,route});
  }
 }

 // Short landscape viewports must not clip or overlap actionable scene labels.
 for(const [width,height] of [[844,500],[1024,600]]){
  await page.setViewport({width,height});await page.goto(base+'/base-camp',{waitUntil:'domcontentloaded'});await page.waitForSelector('.game-intro');
  for(const key of ['ranger','trails','kit','fireside']){
   const index=['map','ranger','trails','passport','kit','fireside'].indexOf(key);await page.click(`.game-dock button:nth-child(${index+1})`);await page.waitForSelector('.destination-interior');await shot(width+'x'+height+'-'+key);await overflow('landscape '+key);
   assert(await page.$$eval('.scene-object>span:last-child',es=>es.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1})),key+' actionable labels within viewport');
   assert(await page.$$eval('.scene-object>span:last-child',es=>{const rs=es.map(e=>e.getBoundingClientRect());return rs.every((a,i)=>rs.every((b,j)=>i===j||a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top))}),key+' actionable labels do not overlap');
   await page.keyboard.press('Escape');results.push({width,height,room:key,landscape:true});
  }
 }

 // Presentation never grants course access in a fresh browser context.
 const anonContext=await browser.createBrowserContext(),anon=await anonContext.newPage();if(proxy?.username)await anon.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});
 for(const route of ['/courses/designid-foundations','/learn/designid-foundations/welcome-to-designid']){
  await anon.goto(base+route+'?review=new&key=invalid-environment-check',{waitUntil:'domcontentloaded',timeout:60000});await anon.waitForFunction(()=>location.pathname==='/login',{timeout:20000});results.push({route,unauthorizedDenied:true});
 }
 await anonContext.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/qa.json',JSON.stringify({base,state:'passed',results,errors},null,2));console.log('PASS',results.length,'room/route checks, real map, account/passport, actual Journey audio/text/companions preserved, no inline lesson art; four widths; no overflow or JS errors.');
}finally{await browser.close();}
