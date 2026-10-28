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
    // The companion is intentionally sticky. Compare natural column origins at
    // page top, not a mixture of a scrolled main column and pinned companion.
    if(width>800){await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
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
   // Session 2 must use its own complete content, not Session 1 copy or a quick-reference fallback.
   await page.$eval('.fg-session-picker button:nth-child(2)',e=>e.click());
   assert.match(await page.$eval('.fg-session-content h3',e=>e.textContent),/Identity and DesignID/);
   assert.equal((await page.$$('.fg-mode-picker button')).length,2);
   assert.equal((await page.$$('.fg-rollout-note')).length,0);
   assert.equal((await page.$$('.fg-reading-panel')).length,0,'Session switch clears prior reading');
   assert.equal((await page.$$('.fg-readings button')).length,allowed.body.content.sessionTwo.readings.length);
   assert.match(await page.$eval('.fg-main-guidance',e=>e.innerText),/whole-number points, never percentages/);
   for(let j=0;j<allowed.body.content.sessionTwo.readings.length;j++){
    await page.$eval(`.fg-readings button:nth-child(${j+1})`,e=>e.click());
    const article=allowed.body.content.sessionTwo.readings[j];
    const text=await page.$eval('.fg-reading-panel',e=>e.innerText);
    assert(text.includes(article.paragraphs.at(-1)),'Complete reading, including its final paragraph');
    assert(!/\b(?:chapter \d+|appendix [a-m])\b/i.test(text),'No book-location labels in Session 2');
    await checkColumns('.fg-session-content .fg-reading-layout');
    await overflow();
   }
   await page.screenshot({path:`tmp/session-two-prepare-${preview?'preview':'account'}-${width}.png`,fullPage:true});
   await page.$eval('.fg-close-reading',e=>e.click());
   assert(await page.$eval('.fg-readings button:last-child',e=>e===document.activeElement),'Session 2 close restores focus');
   await click('.fg-mode-picker button','Leading now');
   await checkColumns('.fg-live-layout');
   assert.match(await page.$eval('.fg-anchor',e=>e.innerText),/Belonging in Christ/);
   assert.equal((await page.$$('.fg-live-flow li')).length,allowed.body.content.sessionTwo.flow.length);
   assert.equal((await page.$$('.fg-discuss details')).length,allowed.body.content.sessionTwo.questions.length);
   assert.equal(allowed.body.content.sessionTwo.flow.reduce((sum,x)=>sum+x.minutes,0),90);
   await click('.fg-live-help>details>summary','Help in the moment');
   assert.match(await page.$eval('.fg-live-help>details[open]',e=>e.innerText),/does not have a report/);
   await click('.fg-live-help>details>summary','Close well and prepare for Expertise');
   assert.match(await page.$eval('.fg-live-help',e=>e.innerText),/assigned Expertise lessons/);
   await page.$eval('.fg-discuss summary',e=>e.click());
   await overflow();
   await page.screenshot({path:`tmp/session-two-live-${preview?'preview':'account'}-${width}.png`,fullPage:true});
   const guideKeys=['expertise','story','desire','spiritual-gifts','niche-preparation','declarations-commissioning'];
   for(let n=0;n<guideKeys.length;n++){
    const guide=allowed.body.content.sessions[guideKeys[n]];
    await page.$eval(`.fg-session-picker button:nth-child(${n+3})`,e=>e.click());
    assert.equal((await page.$$('.fg-mode-picker button')).length,2,'Every session has full Prepare/Leading now');
    assert.equal((await page.$$('.fg-rollout-note')).length,0,'No quick-reference fallback');
    assert.equal((await page.$$('.fg-reading-panel')).length,0,'New session clears prior reading');
    assert.equal((await page.$$('.fg-readings button')).length,guide.readings.length);
    const prepareText=await page.$eval('.fg-main-guidance',e=>e.innerText);
    assert(prepareText.includes(guide.prepare.at(-1).paragraphs.at(-1)),'Complete session-specific preparation');
    for(let j=0;j<guide.readings.length;j++){
     await page.$eval(`.fg-readings button:nth-child(${j+1})`,e=>e.click());
     const text=await page.$eval('.fg-reading-panel',e=>e.innerText);
     assert(text.includes(guide.readings[j].paragraphs[0]),'Correct full reading start');
     assert(text.includes(guide.readings[j].paragraphs.at(-1)),'Full reading final paragraph');
     assert(!/\b(?:chapter \d+|appendix [a-m])\b/i.test(text),'Descriptive titles and references');
     await checkColumns('.fg-session-content .fg-reading-layout');await overflow();
    }
    if([0,1,3,5].includes(n))await page.screenshot({path:`tmp/full-session-${n+3}-prepare-${preview?'preview':'account'}-${width}.png`,fullPage:true});
    await page.$eval('.fg-close-reading',e=>e.click());
    assert(await page.$eval('.fg-readings button:last-child',e=>e===document.activeElement),'Close restores focus');
    await click('.fg-mode-picker button','Leading now');await checkColumns('.fg-live-layout');
    assert.match(await page.$eval('.fg-anchor',e=>e.innerText),new RegExp(guide.anchor.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.equal((await page.$$('.fg-live-flow li')).length,guide.flow.length);
    assert.equal((await page.$$('.fg-discuss details')).length,guide.questions.length);
    for(let j=0;j<guide.questions.length;j++){
     await page.$eval(`.fg-discuss details:nth-of-type(${j+1}) summary`,e=>e.click());
     const text=await page.$eval(`.fg-discuss details:nth-of-type(${j+1})`,e=>e.innerText);
     assert(text.includes(guide.questions[j].followup)&&text.includes(guide.questions[j].help),'Full question support');
    }
    await click('.fg-live-help>details>summary','Help in the moment');
    let text=await page.$eval('.fg-live-help',e=>e.innerText);
    assert(text.includes(guide.help.at(-1).paragraphs.at(-1)),'Complete situation support');
    await click('.fg-live-help>details>summary',guide.followThroughTitle);
    text=await page.$eval('.fg-live-help',e=>e.innerText);
    assert(text.includes(guide.followThrough.at(-1).paragraphs.at(-1)),'Complete follow-through');
    await overflow();
    if([1,3,4,5].includes(n))await page.screenshot({path:`tmp/full-session-${n+3}-live-${preview?'preview':'account'}-${width}.png`,fullPage:true});
    console.log(`PASS full Session ${n+3} ${preview?'preview':'account'} ${width}px: all ${guide.readings.length} readings, preparation, questions, help, follow-through, layout, focus and session isolation`);
   }
   await page.$eval('.fg-session-picker button:first-child',e=>e.click());
   assert.match(await page.$eval('.fg-main-guidance',e=>e.innerText),/Ephesians 2:8–10/,'Session 1 stays unchanged');
   console.log(`PASS Session 2 ${preview?'preview':'account'} ${width}px: all readings, session isolation, Prepare/Leading now, flow/questions/help/Expertise, responsive layout and focus`);
   await click('.fg-areas button','Leader Toolkit');assert.equal((await page.$$('.fg-tools>details')).length,allowed.body.content.resources.length);
   await page.$eval('.fg-tools>details summary',e=>e.click());
   await page.$eval('.fg-tools>details[open] .fg-readings button',e=>e.click());
   assert.match(await page.$eval('.fg-tools>details[open] .fg-reading-panel',e=>e.innerText),/Facilitation — full guidance/);
   await checkColumns('.fg-tools>details[open] .fg-reading-layout');
   assert(!/\b(?:chapter \d+|appendix [a-m])\b/i.test(await page.$eval('.fg-tools',e=>e.innerText)));
   await page.screenshot({path:`tmp/field-guide-toolkit-${preview?'preview':'account'}-${width}.png`,fullPage:true});await overflow();
   for(let n=6;n<allowed.body.content.resources.length;n++){
    const resource=allowed.body.content.resources[n];
    await page.$eval(`.fg-tools>details:nth-of-type(${n+1})>summary`,e=>e.click());
    for(let j=0;j<resource.readings.length;j++){
     await page.$eval(`.fg-tools>details:nth-of-type(${n+1}) .fg-readings button:nth-child(${j+1})`,e=>e.click());
     const text=await page.$eval(`.fg-tools>details:nth-of-type(${n+1}) .fg-reading-panel`,e=>e.innerText);
     assert(text.includes(resource.readings[j].paragraphs.at(-1)),'Full contextual toolkit reading');
     await overflow();
    }
   }
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
