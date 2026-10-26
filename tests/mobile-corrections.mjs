import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.COURSE_TEST_BASE||'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const tag=base.startsWith('https:')?'published':'local';
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const evidence=[],errors=[];
try {
 const page=await browser.newPage();page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);page.on('request',r=>{if(r.headers()['next-router-prefetch']==='1'||r.headers()['purpose']==='prefetch')return r.abort();if(!['GET','HEAD','OPTIONS'].includes(r.method())&&new URL(r.url()).pathname.startsWith('/api/'))return r.respond({status:409,contentType:'application/json',body:'{}'});return r.continue()});
 const visit=async(path)=>{await page.goto(base+path,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);};
 const overflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page overflow');
 await visit('/sandbox-review');await page.waitForSelector('.trail-main-route');
  for(const [width,height] of [[320,900],[390,900],[430,900],[844,390],[1280,950],[1920,1000]].filter(([w])=>!process.env.MOBILE_CORRECTIONS_WIDTHS||process.env.MOBILE_CORRECTIONS_WIDTHS.split(',').includes(String(w)))) {
  await page.setViewport({width,height,isMobile:width<=980,hasTouch:width<=980});
  await visit('/base-camp');await page.waitForSelector('.basecamp-hero');await overflow();
  const hero=await page.$eval('.basecamp-hero',e=>{const r=x=>{const b=x.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}};const image=e.querySelector('.basecamp-scene img'),bar=e.querySelector('.basecamp-purpose-pill'),welcome=e.querySelector('h2');return{hero:r(e),image:r(image),natural:[image.naturalWidth,image.naturalHeight],bar:r(bar),barPosition:getComputedStyle(bar).position,barText:bar.textContent,welcome:r(welcome),welcomeText:welcome.textContent,overlay:getComputedStyle(e,'::before').display}});
  assert(hero.welcomeText.includes('Welcome, '),'Personalized welcome retained');
  if(width<=980){assert(Math.abs(hero.image.w/hero.image.h-hero.natural[0]/hero.natural[1])<.01,'Complete artwork');assert.equal(hero.barPosition,'static');assert(hero.bar.y>=hero.image.bottom-1,'Purpose bar after image');assert(hero.welcome.y>=hero.bar.bottom-1,'Welcome after bar');assert(hero.bar.h<40&&hero.welcome.h<70,'Compact one-line bar and welcome');assert(hero.image.w>=width-28,'Maximum practical phone artwork width');assert.equal(hero.overlay,'none');}
  await page.$eval('.basecamp-hero',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`tmp/mobile-corrections-${tag}-basecamp-${width}.png`});evidence.push({kind:'hero',width,...hero});
  if(width<=980&&process.env.MOBILE_CORRECTIONS_NAV!=='0'){
   // Test every actual destination, including selecting the current page again.
   const destinations=await page.$$eval('.mobile-app-nav nav a',es=>es.map(e=>({path:new URL(e.href).pathname,label:e.textContent})));
   for(const item of destinations){
    await page.click('.mobile-app-nav summary');await page.waitForSelector('.mobile-app-nav[open]');if(item.path==='/base-camp'&&[390,844].includes(width))await page.screenshot({path:`tmp/mobile-corrections-${tag}-menu-${width}.png`});
    const links=await page.$$('.mobile-app-nav nav a');let chosen;for(const l of links)if(await l.evaluate((e,path)=>new URL(e.href).pathname===path,item.path)){chosen=l;break;}
    await page.evaluate(()=>{sessionStorage.removeItem('mobileMenuSelection');document.addEventListener('click',event=>{const link=event.target.closest('.mobile-app-nav a');if(link)sessionStorage.setItem('mobileMenuSelection',JSON.stringify({closed:!link.closest('details').open,path:new URL(link.href).pathname}));},{once:true});});
    await chosen.tap();await page.waitForFunction(path=>location.pathname===path,{},item.path==='/base-camp'?'/hq':item.path).catch(async e=>{console.log('NAV actual',new URL(page.url()).pathname);throw e;});await page.waitForSelector('.mobile-app-nav');assert.deepEqual(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('mobileMenuSelection'))),{closed:true,path:item.path},'Closed in the destination click event');await overflow();
    evidence.push({kind:'nav',width,path:item.path});
   }
   // Same pathname selection is deliberately independent of routing state.
   await page.click('.mobile-app-nav summary');await page.click('.mobile-app-nav nav a[href^="/command-center/expedition"]');await page.waitForFunction(()=>!document.querySelector('.mobile-app-nav').open);await page.waitForSelector('.mobile-app-nav');
  }
  await visit('/ranger-station');await page.waitForSelector('.relief-map-marker');await overflow();
  assert(await page.$eval('.relief-map-stage-scroll',e=>e.scrollWidth<=e.clientWidth+1),'Map has no internal horizontal scrolling');
  assert.equal(await page.$('.relief-marker-number,.relief-map-places'),null,'No number controls or duplicate place list');
  const labels=await page.$$eval('.relief-map-canvas .relief-map-marker',es=>es.map(e=>e.textContent));assert.equal(labels.length,12);assert(labels.includes('Ranger Station')&&labels.includes('DesignID Trail'),'Original word labels');
  for(let i=0;i<labels.length;i++){
   const pin=await page.$(`.relief-map-canvas .relief-map-marker:nth-of-type(${i+1})`);await pin.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
   if(width<=980)await pin.tap();else await pin.click();await page.waitForFunction(name=>document.querySelector('.relief-map-panel h3')?.textContent===name,{},labels[i]);
  }
  const geometry=await page.$$eval('.relief-map-canvas .relief-map-marker',es=>es.map(e=>{const b=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return{label:e.textContent,x:b.x,y:b.y,w:b.width,h:b.height,font:getComputedStyle(e).fontSize,inside:b.x>=p.x-1&&b.right<=p.right+1&&b.y>=p.y-1&&b.bottom<=p.bottom+1}}));assert(geometry.every(x=>x.inside),'All named labels inside map '+width+' '+JSON.stringify(geometry));
  await page.$eval('.relief-map-workbench',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`tmp/mobile-corrections-${tag}-map-${width}.png`});
  await page.$eval('.relief-map-toolbar',e=>e.scrollIntoView({block:'center',behavior:'instant'}));await page.click('.relief-map-toolbar button');await page.waitForSelector('dialog[open]');assert(await page.$eval('dialog',e=>e.matches(':modal')));assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Close map');
  await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'DesignID Trail');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Close map');
  await page.click('dialog .marker-fireside');assert((await page.$eval('.relief-map-selection',e=>e.textContent)).startsWith('Fireside'));
  const expanded=await page.$eval('dialog .relief-map-stage',e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}});assert(expanded.x>=0&&expanded.right<=width+1,'Expanded width fits');if(width===844)assert(expanded.bottom<=height,'Landscape full map visible');
  await page.screenshot({path:`tmp/mobile-corrections-${tag}-expanded-${width}.png`});
  if(width===390){await page.setViewport({width:844,height:390,isMobile:true,hasTouch:true});await page.waitForFunction(()=>document.querySelector('dialog .relief-map-stage').getBoundingClientRect().bottom<=innerHeight);await page.screenshot({path:`tmp/mobile-corrections-${tag}-rotated.png`});assert.equal(await page.$eval('dialog .relief-map-selection',e=>e.textContent.startsWith('Fireside')),true,'Rotation retains selected label');await page.setViewport({width,height,isMobile:true,hasTouch:true});}
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Expand map');assert.equal(await page.$eval('.relief-map-panel h3',e=>e.textContent),'Fireside');
  await page.$eval('.relief-map-toolbar',e=>e.scrollIntoView({block:'center',behavior:'instant'}));await page.click('.relief-map-toolbar button');await page.waitForSelector('dialog[open]');await page.click('dialog .relief-map-dialog-toolbar button');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));await overflow();
  evidence.push({kind:'map',width,labels,geometry,expanded});console.log('PASS hero/menu/all named map controls/expanded/rotation/focus',width);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(`tmp/mobile-corrections-${tag}.json`,JSON.stringify({status:'PASS',base,errors,evidence},null,2));
}finally{await browser.close()}
