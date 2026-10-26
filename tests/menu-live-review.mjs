import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.COURSE_TEST_BASE||'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base==='http://localhost:3124');
const tag=process.env.REVIEW_TAG||'local';
const dir=process.env.MENU_LIVE_EVIDENCE_DIR||'tmp/menu-live-review';fs.mkdirSync(dir,{recursive:true});
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const results=[],errors=[];
try{
const page=await browser.newPage();page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
await page.setRequestInterception(true);page.on('request',r=>{if(r.headers()['next-router-prefetch']==='1'||r.headers().purpose==='prefetch')return r.abort();if(!['GET','HEAD','OPTIONS'].includes(r.method())&&new URL(r.url()).pathname.startsWith('/api/'))return r.respond({status:409,contentType:'application/json',body:'{}'});return r.continue()});
await page.goto(base+'/sandbox-review',{waitUntil:'domcontentloaded'});await page.waitForSelector('.trail-main-route');
const entryUrl=new URL(page.url());entryUrl.pathname='/command-center';entryUrl.searchParams.set('review','owner');const entry=entryUrl.href;
await page.goto(entry,{waitUntil:'domcontentloaded'});await page.waitForSelector('.command-center-shell');assert(await page.$('.command-center-shell'),'Owner Command Center accessible');
const openMenu=async()=>{await page.tap('.mobile-nav-trigger');await page.waitForSelector('dialog[open]');await page.$eval('dialog',e=>Promise.all(e.getAnimations().map(a=>a.finished)));};
const linkFor=async(path)=>{for(const a of await page.$$('.mobile-nav-drawer a'))if(await a.evaluate((e,p)=>new URL(e.href).pathname===p,path))return a;throw Error('Missing menu path '+path)};
const expected=['/base-camp','/ranger-station','/trailheads','/field-kit','/gear','/fireside','/waypoints','/live','/camp-circle','/camp-circle/my-circles','/command-center','/command-center/design-map','/command-center/expedition'];
for(const [width,height] of [[1920,1080],[1280,900],[768,1024],[390,844],[320,740],[844,390],[932,430]]){
await page.setViewport({width,height,isMobile:width<=980,hasTouch:width<=980});
await page.goto(base+'/live',{waitUntil:'domcontentloaded'});await page.waitForSelector('.live-header-copy');await page.waitForFunction(()=>document.querySelector('.live-fireside-header img')?.naturalWidth>0);await page.evaluate(()=>document.fonts.ready);
const geometry=await page.$eval('.live-fireside-header',e=>{const img=e.querySelector('img'),copy=e.querySelector('.live-header-copy');const r=x=>{const b=x.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}};return{image:r(img),copy:r(copy),natural:[img.naturalWidth,img.naturalHeight],after:getComputedStyle(e,'::after').display,text:copy.textContent,overflow:document.documentElement.scrollWidth>innerWidth}});
assert(geometry.natural[0]>0);assert(!geometry.overflow);assert.equal(geometry.after,'none');assert(Math.abs(geometry.image.width/geometry.image.height-geometry.natural[0]/geometry.natural[1])<.01);assert(Math.abs(geometry.copy.y-geometry.image.bottom)<1.1);assert(geometry.text.includes('Gatherings, teaching, and conversations.'));
await page.screenshot({path:`${dir}/${tag}-live-${width}x${height}.png`});
if([390,844,1280].includes(width))await (await page.$('.live-fireside-header')).screenshot({path:`${dir}/${tag}-live-header-${width}x${height}.png`});
if(width<=980){
await openMenu();await page.waitForSelector('.mobile-nav-drawer[open]');
await page.waitForFunction(()=>document.activeElement?.classList.contains('mobile-nav-close'));
const links=await page.$$eval('.mobile-nav-drawer nav a',as=>as.map(a=>({path:new URL(a.href).pathname,height:a.getBoundingClientRect().height,current:a.getAttribute('aria-current')})));
assert.deepEqual(links.map(a=>a.path),expected);assert(links.every(a=>a.height>=44));assert.equal(links.find(a=>a.path==='/live').current,'page');
assert(await page.$eval('dialog',e=>e.getBoundingClientRect().width<=Math.min(320,innerWidth*.9)+1));
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.screenshot({path:`${dir}/${tag}-menu-${width}x${height}.png`});
// Native modal focus containment, backward and forward.
await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');assert(await page.$eval('dialog',e=>e.contains(document.activeElement)));await page.keyboard.press('Tab');assert(await page.$eval('dialog',e=>e.contains(document.activeElement)));
await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog').open);await page.waitForFunction(()=>document.activeElement?.classList.contains('mobile-nav-trigger'));
await openMenu();await page.mouse.click(4,Math.min(180,height-10));await page.waitForFunction(()=>!document.querySelector('dialog').open);
await openMenu();await page.click('.mobile-nav-close');await page.waitForFunction(()=>!document.querySelector('dialog').open);
// Same-route selection must close and release interaction immediately.
await openMenu();await (await linkFor('/live')).click();await page.waitForFunction(()=>!document.querySelector('dialog').open);assert.notEqual(await page.$eval('body',e=>getComputedStyle(e).overflowY),'hidden');
// Every destination uses a real click and ends in its existing route, including children.
for(const path of expected){console.log('CHECK destination',width,path);
await openMenu();await page.waitForSelector('dialog[open]');
const handle=await linkFor(path);await handle.scrollIntoView();await handle.tap();await page.waitForFunction(()=>!document.querySelector('dialog').open);await page.waitForFunction(p=>location.pathname===p,{},path==='/base-camp'?'/hq':path);await page.waitForSelector('main');await page.evaluate(()=>document.fonts.ready);
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Destination overflow '+path+'/'+width);
}
}else{assert.equal(await page.$eval('.mobile-app-nav',e=>getComputedStyle(e).display),'none');assert(await page.$('.app-sidebar'));}
results.push({width,height,geometry,menu:width<=980?'all 13 destinations, touch, Escape, close, backdrop, focus, same-page PASS':'existing desktop sidebar PASS'});console.log('PASS',width,height);
}
// Rotate with the menu open, and ensure the last nested destination remains reachable.
await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await openMenu();await page.setViewport({width:844,height:390,isMobile:true,hasTouch:true});assert(await page.$('dialog[open]'));
await page.$eval('.mobile-nav-drawer nav',e=>e.scrollTop=e.scrollHeight);await page.screenshot({path:`${dir}/${tag}-rotated-menu-scrolled.png`});await (await linkFor('/command-center/expedition')).click();await page.waitForFunction(()=>!document.querySelector('dialog').open);
// Actual owner entry's review-aware menu contract (do not log private URL/query).
await page.goto(entry,{waitUntil:'domcontentloaded'});await openMenu();
const contract=await page.$$eval('.mobile-nav-drawer a',as=>as.every(a=>{const u=new URL(a.href);return !!u.searchParams.get('key')&&u.searchParams.get('review')==='owner'}));assert(contract,'Owner review params preserved');
await page.click('.mobile-nav-drawer a[href*="/trailheads?"]');await page.waitForFunction(()=>location.pathname==='/trailheads');assert(await page.$('main'));
assert.deepEqual(errors,[]);fs.writeFileSync(`${dir}/${tag}-qa.json`,JSON.stringify({status:'PASS',base,results,rotation:'PASS',ownerEntry:'PASS',reviewAwareLinks:'PASS',errors},null,2));
}finally{await browser.close();}
