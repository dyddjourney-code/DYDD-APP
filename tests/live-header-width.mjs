import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.COURSE_TEST_BASE||'http://localhost:3124';
assert(['https://dydd-online-school-sandbox.vercel.app','http://localhost:3124'].includes(base));
const tag=process.env.REVIEW_TAG||'local';
const dir=process.env.WIDTH_EVIDENCE_DIR||'tmp/live-header-width';fs.mkdirSync(dir,{recursive:true});
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const results=[],errors=[];
try{
const page=await browser.newPage();page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
await page.setRequestInterception(true);page.on('request',r=>{if(r.headers()['next-router-prefetch']==='1'||r.headers().purpose==='prefetch')return r.abort();if(!['GET','HEAD','OPTIONS'].includes(r.method())&&new URL(r.url()).pathname.startsWith('/api/'))return r.respond({status:409,contentType:'application/json',body:'{}'});return r.continue()});
await page.goto(base+'/sandbox-review',{waitUntil:'domcontentloaded'});await page.waitForSelector('.trail-main-route');
for(const [width,height] of [[1920,1080],[1280,900],[768,1024],[390,844],[320,740],[844,390],[932,430]]){
 await page.setViewport({width,height,isMobile:width<=980,hasTouch:width<=980});const routes={};
 for(const [path,selector] of [['/fireside','.fireside-page-hero'],['/camp-circle','.camp-circle-hero'],['/live','.live-fireside-header']]){
 await page.goto(base+path,{waitUntil:'domcontentloaded'});await page.waitForSelector(selector);await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>innerWidth<=980||document.querySelector('main')?.getBoundingClientRect().x>270);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 if(path!=='/fireside')await page.waitForFunction(s=>document.querySelector(s+' img')?.naturalWidth>0,{},selector);
 routes[path]=await page.$eval(selector,e=>{const r=x=>{const b=x.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}};const img=e.querySelector('img'),copy=e.querySelector('.live-header-copy,.circle-header-copy')||e.firstElementChild;return{header:r(e),main:r(document.querySelector('main')),copy:r(copy),prose:[...copy.children].map(p=>({text:p.textContent,width:r(p).width,maxWidth:getComputedStyle(p).maxWidth})),...(img?{image:r(img),natural:[img.naturalWidth,img.naturalHeight],objectFit:getComputedStyle(img).objectFit}:{}),after:getComputedStyle(e,'::after').display,overflow:document.documentElement.scrollWidth>innerWidth}});
 assert(!routes[path].overflow,path+' overflow');
 if([1280,390,844].includes(width))await page.screenshot({path:`${dir}/${tag}-${path.slice(1)}-${width}x${height}.png`});
 }
 const live=routes['/live'],ref=routes['/camp-circle'];console.log('MEASURE',width,JSON.stringify(routes));
 if(tag!=='before'){
 for(const route of ['/camp-circle','/fireside']){assert(Math.abs(live.header.width-routes[route].header.width)<1.1,'Header width '+width);assert(Math.abs(live.header.x-routes[route].header.x)<1.1,'Header x '+width);}
 assert(Math.abs(live.copy.width-ref.copy.width)<1.1,'Copy box width '+width);
 assert(Math.abs(live.image.width/live.image.height-live.natural[0]/live.natural[1])<.001,'Uncropped aspect');assert(Math.abs(live.copy.y-live.image.bottom)<1.1,'Copy directly below');assert.equal(live.after,'none');assert(live.prose.every(p=>p.maxWidth==='none'),'No prose width cap');assert(live.prose[1].text==='Gatherings, teaching, and conversations.');
 }
 results.push({width,height,routes});console.log('PASS',tag,width,height,JSON.stringify(Object.fromEntries(Object.entries(routes).map(([k,v])=>[k,{header:v.header.width,copy:v.copy.width,x:v.header.x}]))));
}
await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});await page.goto(base+'/live',{waitUntil:'domcontentloaded'});await page.tap('.mobile-nav-trigger');await page.waitForSelector('.mobile-nav-drawer[open]');assert.equal(await page.$$eval('.mobile-nav-drawer nav a',a=>a.length),13);await page.screenshot({path:`${dir}/${tag}-preserved-menu.png`});await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.mobile-nav-drawer').open);
assert.deepEqual(errors,[]);fs.writeFileSync(`${dir}/${tag}-qa.json`,JSON.stringify({status:'PASS',base,results,errors},null,2));
}finally{await browser.close()}
