import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const base=process.env.COURSE_TEST_BASE||'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const course=load('lib/courses/fruitlife-360-formation.ts').fruitLife360Course;
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const query=new URLSearchParams();
let userId,snapshotId;
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
try {
 const email='fruitlife-header-'+crypto.randomUUID()+'@example.invalid';
 const created=await admin.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('base64url'),email_confirm:true});assert(!created.error,created.error?.message);userId=created.data.user.id;
 const snap=await admin.from('assessment_snapshots').insert({user_id:userId,assessment_type:'fruit_360',source:'header_isolated_qa',scores:{fruitScores:[{label:'Love',score:4}]},source_submitted_at:new Date().toISOString()}).select('id').single();assert(!snap.error,snap.error?.message);snapshotId=snap.data.id;
 const link=await admin.auth.admin.generateLink({type:'magiclink',email});assert(!link.error,link.error?.message);
 const login=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:link.data.properties.hashed_token,next:'/courses/'+course.slug}),redirect:'manual'});assert.equal(login.status,307);
 const cookies=login.headers.getSetCookie().map(x=>{const p=x.split(';')[0],i=p.indexOf('=');return{name:p.slice(0,i),value:p.slice(i+1),url:base}});
 await browser.setCookie(...cookies);
 let allowReview=false;
 let page;const errors=[];
 const freshPage=async()=>{if(page)await page.close();page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.deleteCookie({name:'dydd_sandbox_review',url:base});await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());if(u.origin===base&&(u.pathname==='/sandbox-review'||u.pathname==='/base-camp'||(!allowReview&&u.searchParams.has('review'))))return r.abort();return r.continue();});};
 for(const width of [1920,1280,768,390,320]) {
  await freshPage();
  await page.setViewport({width,height:1000});
  await page.goto(base+'/courses/'+course.slug+'?'+query,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('.fruitlife-course-hero');
  await page.waitForSelector('.assessment-active-lesson h2');
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.$eval('h1',e=>e.textContent),course.title);
  assert.equal(await page.$('.mini-course-logo-intro'),null);
  const geometry=await page.evaluate(()=>{
   const hero=document.querySelector('.fruitlife-course-hero'),track=document.querySelector('.fruitlife-top-racetrack'),r=hero.getBoundingClientRect(),t=track.getBoundingClientRect(),ol=track.querySelector('ol');
   return {hero:{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom},track:{y:t.y,w:t.width},background:getComputedStyle(hero).backgroundImage,cols:getComputedStyle(ol).gridTemplateColumns.split(' ').length,trackScroll:ol.scrollWidth>ol.clientWidth,overflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  assert(!geometry.overflow,'No page overflow '+width);assert.equal(geometry.cols,course.modules.length);assert(geometry.background.includes('/brand/fruitlife360-vineyard-cartoon-hero.webp'));assert(Math.abs(geometry.track.y-geometry.hero.bottom)<=2,'Track directly below artwork');
  const heading=await page.$eval('.fruitlife-course-hero h1',e=>({w:e.clientWidth,scroll:e.scrollWidth}));assert(heading.scroll<=heading.w+1,'Unbroken heading fits '+width);
  await page.waitForFunction(n=>document.querySelectorAll('.fruitlife-top-racetrack > ol > li').length===n,{},course.modules.length);
  assert.equal(await page.$$eval('.fruitlife-top-racetrack > ol > li',es=>es.length),course.modules.length);
  const img=await page.evaluate(async()=>{const i=new Image();i.src='/brand/fruitlife360-vineyard-cartoon-hero.webp';await i.decode();return {w:i.naturalWidth,h:i.naturalHeight}});assert(img.w>=1200);
  for(let n=0;n<course.modules.length;n++){
   const link=await page.$(`.fruitlife-top-racetrack li:nth-child(${n+1}) a`);
   const href=await link.evaluate(e=>e.href);const parsed=new URL(href);assert.equal(parsed.searchParams.get('lesson'),course.modules[n].lessons[0].slug);assert.equal(parsed.searchParams.get('review'),null);
  }
  await page.screenshot({path:`tmp/fruitlife-header-${base.startsWith('https')?'published':'local'}-${width}.png`,fullPage:false});
  console.log('PASS layout '+width+' '+JSON.stringify(geometry));
 }
 // Follow every actual top-track link and confirm corresponding content opens.
 for(let n=0;n<course.modules.length;n++){
  await page.deleteCookie({name:'dydd_sandbox_review',url:base});
  await page.$eval(`.fruitlife-top-racetrack li:nth-child(${n+1}) a`,e=>e.scrollIntoView());
  await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:60000}),page.click(`.fruitlife-top-racetrack li:nth-child(${n+1}) a`)]);
  await page.waitForFunction(title=>document.querySelector('.assessment-active-lesson h2')?.textContent===title,{},course.modules[n].lessons[0].title);
  assert((await page.$eval('.assessment-active-lesson',e=>e.textContent)).includes(course.modules[n].lessons[0].body[0]));
 }
 const focus=await page.$('.fruitlife-top-racetrack a');await focus.focus();assert.equal(await page.$eval('.fruitlife-top-racetrack a',e=>getComputedStyle(e).outlineStyle),'solid');
 console.log('PASS all five top-track module links open correct authored lessons');
 // Alternate lane keeps its context on top navigation.
 await page.goto(base+'/courses/'+course.slug+'?lane=fruitlife&'+query,{waitUntil:'domcontentloaded',timeout:60000});
 assert(await page.$('.fruitlife-release-shell'));assert.equal(await page.$eval('.fruitlife-top-racetrack a',e=>new URL(e.href).searchParams.get('lane')),'fruitlife');
 allowReview=true;
 await page.goto(base+'/courses/'+course.slug+'?'+new URLSearchParams({review:'new',key:cfg.review_token}),{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('.fruitlife-course-hero');
 const ownerLinks=await page.$$eval('.fruitlife-top-racetrack a',es=>es.map(e=>({review:new URL(e.href).searchParams.get('review'),key:new URL(e.href).searchParams.get('key')})));
 assert.equal(ownerLinks.length,course.modules.length);for(const link of ownerLinks){assert.equal(link.review,'new');assert.equal(link.key,cfg.review_token);}
 console.log('PASS established owner-preview course access and preserved module-link credentials');
 for(const path of ['/courses/designid-foundations','/journey']){
  await page.goto(base+path+'?'+new URLSearchParams({review:'new',key:cfg.review_token}),{waitUntil:'domcontentloaded',timeout:60000});assert.equal(await page.$('.fruitlife-course-hero'),null);assert.equal(await page.$('.fruitlife-top-racetrack'),null);
  if(path.includes('fruitlife'))assert(await page.$('.mini-course-logo-intro'));
  else {assert(await page.$('.journey-hero'));assert(await page.$('.journey-top-racetrack'));}
 }
 const anon=await browser.createBrowserContext();const ap=await anon.newPage();await ap.goto(base+'/courses/'+course.slug,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(new URL(ap.url()).pathname,'/login');await anon.close();
 assert.deepEqual(errors,[]);console.log('PASS alternate lane, neighboring DesignID/Journey headers, anonymous access gate and zero browser runtime errors');
}finally{await browser.close();if(snapshotId){const r=await admin.from('assessment_snapshots').delete().eq('id',snapshotId);assert(!r.error);}if(userId){const r=await admin.auth.admin.deleteUser(userId);assert(!r.error);}console.log('Synthetic account and assessment fixture removed');}
