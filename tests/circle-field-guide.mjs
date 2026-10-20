import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const base=process.env.CIRCLE_TEST_BASE||'http://localhost:3124';
assert(base.startsWith('http://localhost:')||base==='https://dydd-online-school-sandbox.vercel.app');
const db=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const m=load('lib/circles/plan.ts'), users=[], ids=[], errors=[];
let browser;
async function account(){
 const email=`guide-${crypto.randomUUID()}@example.invalid`;
 const u=await db.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('base64url'),email_confirm:true});assert(!u.error,u.error?.message);users.push(u.data.user.id);
 const link=await db.auth.admin.generateLink({type:'magiclink',email});assert(!link.error);
 const r=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:link.data.properties.hashed_token,next:'/camp-circle/my-circles'}),redirect:'manual'});assert.equal(r.status,307);
 const cookies=r.headers.getSetCookie().map(x=>{const p=x.split(';')[0],i=p.indexOf('=');return {name:p.slice(0,i),value:p.slice(i+1),url:base};});assert(cookies.length);
 return {userId:u.data.user.id,cookies,cookie:cookies.map(x=>x.name+'='+x.value).join('; ')};
}
async function req(path,cookie,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,headers:r.headers,body:await r.json()};}
try {
 const owner=await account(),other=await account();
 const id=crypto.randomUUID();ids.push(id);
 const plan={...m.blankCirclePlan(),name:'Field Guide QA Circle',startDate:'2026-11-03'};
 assert.equal((await req('/api/circles',owner.cookie,{id,plan,status:'draft',revision:0})).status,200);
 const endpoint='/api/circles/field-guide?circle='+id;
 assert.equal((await req(endpoint)).status,401);
 assert.equal((await req(endpoint,owner.cookie)).status,404,'Draft does not grant guide');
 assert.equal((await req('/api/circles/field-guide?circle=bad',owner.cookie)).status,400);
 assert.equal((await req('/api/circles',owner.cookie,{id,plan,status:'active',revision:1})).status,200);
 assert.equal((await req(endpoint,other.cookie)).status,404,'Different account cannot read guide');
 assert.equal((await req(endpoint+'&review=new&key=wrong')).status,401);
 const allowed=await req(endpoint,owner.cookie);assert.equal(allowed.status,200);assert.equal(allowed.headers.get('cache-control'),'private, no-store');assert.equal(allowed.body.content.steps.length,6);assert.equal(allowed.body.content.flow.reduce((s,x)=>s+x.minutes,0),90);
 assert(allowed.body.content.steps.every(s=>s.readings.length&&s.essentials.length));
 console.log('PASS real account authorization: anonymous, malformed id, draft, other owner, invalid preview, active owner, private cache');
 browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
 const previewId=crypto.randomUUID();ids.push(previewId);
 const inserted=await db.from('journey_circle_plans').insert({id:previewId,preview_scope:'new',status:'active',plan});assert(!inserted.error,inserted.error?.message);
 const previewQuery=new URLSearchParams({review:'new',key:cfg.review_token});
 assert.equal((await req('/api/circles/field-guide?circle='+previewId+'&'+previewQuery)).status,200);
 assert.equal((await req('/api/circles/field-guide?circle='+id+'&'+previewQuery)).status,404,'Preview cannot read account guide');
 for(const preview of [false,true]){
  const context=await browser.createBrowserContext();if(!preview)await context.setCookie(...owner.cookies);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const path='/camp-circle/my-circles?circle='+(preview?previewId:id)+'&fieldGuide=1'+(preview?'&'+previewQuery:'');
  const click=async(selector,text)=>page.$$eval(selector,(els,t)=>{const e=els.find(x=>x.textContent.trim().includes(t));if(!e)throw Error('Button missing '+t);e.click();},text);
  const overflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
  for(const width of [1280,390,320]){
   await page.setViewport({width,height:1000});await page.goto(base+path,{waitUntil:'networkidle2'});await page.waitForSelector('.fg-path');
   assert.equal((await page.$$('.fg-path li')).length,6);await overflow();
   await click('.fg-path button','Begin with grace');
   assert.equal((await page.$$('.fg-review-check, .circle-field-guide-workspace input[type=checkbox]')).length,0,'No review checkboxes');
   await click('.fg-step-controls button','Next:');
   assert.equal(await page.$eval('.fg-path button[aria-current]',e=>e.textContent.includes('See the whole journey')),true);
   assert.equal((await page.$$('.fg-journey-map li')).length,8);
   await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('.fg-path');
   assert(await page.$eval('.fg-path button[aria-current]',e=>e.textContent.includes('See the whole journey')),'Step persists');
   await click('.fg-path button','Begin with grace');
   assert.equal((await page.$$('.fg-reading-panel')).length,0);
   await page.$eval('.fg-readings button',e=>e.click());
   assert((await page.$eval('.fg-reading-panel',e=>e.innerText)).length>400);
   const checkColumns=async(selector)=>{
    const rects=await page.$eval(selector,e=>Array.from(e.children).map(x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,width:r.width};}));
    assert.equal(rects.length,2);
    if(width>800){assert(rects[1].x>=rects[0].right,'Reading is beside practical guidance');assert(Math.abs(rects[0].y-rects[1].y)<3,'Columns top aligned');assert(rects.every(r=>r.width>300),'Readable column widths');}
    else{assert(rects[1].y>rects[0].y,'Phone uses one column');}
   };
   await checkColumns('.fg-step-content .fg-reading-layout');
   await page.$eval('.fg-reading-panel',e=>{e.scrollTop=200;});
   await page.$eval('.fg-close-reading',e=>e.click());
   assert.equal((await page.$$('.fg-reading-panel')).length,0);
   assert(await page.$eval('.fg-readings button',e=>e===document.activeElement),'Close returns focus');
   // Check all launch reading titles and full content for stale book-location labels.
   for(let i=0;i<allowed.body.content.steps.length;i++){
    await page.$eval(`.fg-path li:nth-child(${i+1}) button`,e=>e.click());
    const count=await page.$$eval('.fg-readings button',els=>els.length);
    for(let j=0;j<count;j++){
     await page.$eval(`.fg-readings button:nth-child(${j+1})`,e=>e.click());
     assert(!/\b(?:chapter \d+|appendix [a-m])\b/i.test(await page.$eval('.fg-step-content',e=>e.innerText)),'Useful launch titles, no chapter/appendix references');
    }
   }
   await click('.fg-path button','Begin with grace');await page.$eval('.fg-readings button',e=>e.click());
   await page.screenshot({path:`tmp/field-guide-${preview?'preview':'account'}-${width}.png`,fullPage:true});await overflow();
   await click('.fg-areas button','Session Guides');assert.equal((await page.$$('.fg-session-picker button')).length,8);
   await page.$eval('.fg-session-picker button:nth-child(7)',e=>e.click());assert.match(await page.$eval('.fg-session-content h3',e=>e.textContent),/Niche Preparation/);
   await page.$eval('.fg-session-picker button:nth-child(8)',e=>e.click());assert.match(await page.$eval('.fg-session-content h3',e=>e.textContent),/Commissioning/);
   await page.$eval('.fg-session-picker button:first-child',e=>e.click());assert.equal((await page.$$('.fg-mode-picker button')).length,2);
   await page.$eval('.fg-readings button',e=>e.click());await checkColumns('.fg-session-content .fg-reading-layout');assert(!/\b(?:chapter \d+|appendix [a-m])\b/i.test(await page.$eval('.fg-session-content',e=>e.innerText)));
   await click('.fg-mode-picker button','Leading now');await checkColumns('.fg-live-layout');assert.equal((await page.$$('.fg-live-flow li')).length,allowed.body.content.flow.length);
   await page.$eval('.fg-discuss summary',e=>e.click());assert(await page.$('.fg-discuss details[open]'));await overflow();
   await page.screenshot({path:`tmp/field-guide-live-${preview?'preview':'account'}-${width}.png`,fullPage:true});
   await click('.fg-areas button','Leader Toolkit');assert.equal((await page.$$('.fg-tools>details')).length,allowed.body.content.resources.length);
   await page.$eval('.fg-tools>details summary',e=>e.click());
   await page.$eval('.fg-tools>details[open] .fg-readings button',e=>e.click());
   assert.match(await page.$eval('.fg-tools>details[open] .fg-reading-panel',e=>e.innerText),/Facilitation — full guidance/);
   await checkColumns('.fg-tools>details[open] .fg-reading-layout');
   assert(!/\b(?:chapter \d+|appendix [a-m])\b/i.test(await page.$eval('.fg-tools',e=>e.innerText)));
   await page.screenshot({path:`tmp/field-guide-toolkit-${preview?'preview':'account'}-${width}.png`,fullPage:true});await overflow();
   console.log(`PASS ${preview?'Jordan preview':'real account'} ${width}px: pathway, remembered place, no checkboxes, descriptive full readings, responsive columns, 8 distinct sessions, Prepare/Leading now, tools, no overflow`);
  }
  // Read failure must show an actionable retry, not an empty guide.
  await page.setRequestInterception(true);let fail=true;
  page.on('request',r=>r.url().includes('/api/circles/field-guide')&&fail?(fail=false,r.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary guide outage'})})):r.continue());
  await page.goto(base+path,{waitUntil:'networkidle2'});await page.waitForSelector('.fg-status[role=alert]');await click('.fg-status button','Try again');await page.waitForSelector('.fg-path');
  console.log('PASS guide API outage and retry recovery');
  await page.goto(base+'/camp-circle'+(preview?'?'+previewQuery:''),{waitUntil:'networkidle2'});assert(await page.$('#circle-before-start'));
  const teaser=await page.$eval('.circle-before-start',e=>e.innerText);assert(teaser.includes('Before you start a Circle'));assert(!teaser.includes(allowed.body.content.steps[0].readings[0].paragraphs.at(-1)),'Full manuscript not in teaser');await overflow();
  await context.close();
 }
 assert.equal((await req('/api/circles',owner.cookie,{id,plan,status:'archived',revision:2})).status,200);
 assert.equal((await req(endpoint,owner.cookie)).status,404,'Archived plan does not grant guide');
 assert.deepEqual(errors,[]);console.log('PASS archived access revoked, teaser boundary, browser runtime errors absent');
} finally {
 if(browser)await browser.close();
 if(ids.length){const r=await db.from('journey_circle_plans').delete().in('id',ids);assert(!r.error,r.error?.message);}
 for(const id of users){await db.auth.admin.signOut(id,'global').catch(()=>{});const r=await db.auth.admin.deleteUser(id);assert(!r.error,r.error?.message);}
 console.log('QA temporary Circle rows and accounts removed');
}
