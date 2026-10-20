import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const base=process.env.JOURNEY_TEST_BASE || 'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const bucket=admin.storage.from('assessment-report-pdfs');
const slug='discover-your-divine-design';
const catalog=load('lib/reflections/catalog.ts').getReflectionExperience(slug).questions;
const q=catalog.find(q=>q.id==='child-of-god-response');
const eligible=load('lib/reflections/discussion-catalog.ts').careDiscussionIds;
const excluded=catalog.find(q=>!eligible.has(q.id));assert(excluded);
let userId,browser,previewBackup,previewAfter;
const previewPath='private-discussion-reminders/preview-new.json';
async function stored(path){const r=await bucket.download(path,{cacheNonce:crypto.randomUUID()});if(r.error){assert(['400','404'].includes(String(r.error.statusCode)),r.error.message);return null;}return r.data.text();}
const errors=[];
try {
 const created=await admin.auth.admin.createUser({email:`discussion-${crypto.randomUUID()}@example.invalid`,password:crypto.randomBytes(24).toString('base64url'),email_confirm:true});assert(!created.error,created.error?.message);userId=created.data.user.id;
 const link=await admin.auth.admin.generateLink({type:'magiclink',email:created.data.user.email});assert(!link.error);
 const login=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:link.data.properties.hashed_token,next:'/journey'}),redirect:'manual'});assert.equal(login.status,307);
 const cookies=login.headers.getSetCookie().map(x=>{const pair=x.split(';')[0],i=pair.indexOf('=');return {name:pair.slice(0,i),value:pair.slice(i+1),url:base};});assert(cookies.length);
 const cookie=cookies.map(c=>c.name+'='+c.value).join('; ');
 browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
 const api=async(body,headers={})=>{const r=await fetch(base+'/api/course-reflections/discussion',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json',...headers},body:JSON.stringify({courseSlug:slug,...body})});return {status:r.status,body:await r.json()};};
 assert.equal((await fetch(base+'/api/course-reflections/discussion?courseSlug='+slug)).status,401);
 for(const preview of [false,true]) {
  const query=preview ? '&review=new&key='+encodeURIComponent(cfg.review_token) : '';
  if(preview)previewBackup=await stored(previewPath);
  const context=await browser.createBrowserContext();if(!preview)await context.setCookie(...cookies);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const selector=preview?'[data-question="'+q.id+'"]': '[data-question="'+q.id+'"]';
  const go=async path=>page.goto(base+path+(path.includes('?')?query:query.replace(/^&/,'?')),{waitUntil:'networkidle2'});
  for(const width of [1280,390,320]) {
   await page.setViewport({width,height:1000});
   await go('/journey?lesson='+q.lessonSlug);
   await page.waitForSelector('.journey-active-workbook '+selector+' .discussion-mark');
   const root='.journey-active-workbook '+selector;
   if(await page.$eval(root+' .discussion-mark',e=>e.getAttribute('aria-pressed'))==='true') {
    await page.$eval(root+' .discussion-mark',e=>e.click());
    await page.waitForFunction(s=>document.querySelector(s+' .discussion-control [role=status]')?.textContent==='Saved',{},root);
   }
   await page.$eval(root+' .discussion-mark',e=>e.click());
   await page.waitForFunction(s=>document.querySelector(s+' .discussion-mark')?.getAttribute('aria-pressed')==='true',{},root);
   if(await page.$(root+' .discussion-add-note'))await page.$eval(root+' .discussion-add-note',e=>e.click());
   const note='Private discussion QA '+crypto.randomUUID();
   await page.$eval(root+' .discussion-note',(e,t)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},note);
   // Immediate lesson navigation must flush the note before leaving.
   await page.$$eval('.journey-active-pagination button',buttons=>buttons.find(b=>b.textContent.startsWith('Next:')).click());
   await page.waitForFunction(s=>!document.querySelector('.journey-active-workbook '+s),{},selector);
   const path=preview?previewPath:`private-discussion-reminders/user-${userId}.json`;
   const saved=JSON.parse(await stored(path));assert.equal(saved.find(r=>r.question_id===q.id)?.note,note);
   if(preview)previewAfter=await stored(previewPath);
   await go('/field-kit/reflections/'+slug+'?view=discussion');
   await page.waitForFunction(({s,n})=>document.querySelector(s+' .discussion-note')?.value===n,{}, {s:selector,n:note});
   assert(await page.$eval(selector,e=>e.checkVisibility()),'Marked unanswered question visible without expanding sections');
   const edited=note+' edited from Field Kit';
   await page.$eval(selector+' .discussion-note',(e,t)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},edited);
   await page.waitForFunction(s=>document.querySelector(s+' .discussion-control [role=status]')?.textContent==='Saved',{},selector);
   if(preview)previewAfter=await stored(previewPath);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Phone Field Kit overflow');
   await page.$eval(selector,e=>e.scrollIntoView({block:'center',behavior:'instant'}));
   await page.screenshot({path:`tmp/discussion-${preview?'preview':'account'}-${width}.png`,fullPage:false});
   await go('/journey?lesson='+q.lessonSlug);
   await page.waitForFunction(({s,n})=>document.querySelector('.journey-active-workbook '+s+' .discussion-note')?.value===n,{}, {s:selector,n:edited});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Phone Journey overflow');
   await page.$eval(root+' .discussion-mark',e=>e.click());
   await page.waitForFunction(s=>document.querySelector(s+' .discussion-control [role=status]')?.textContent==='Saved',{},root);
   if(preview)previewAfter=await stored(previewPath);
   if(!preview && width===1280) {
    await page.setRequestInterception(true);
    const fail=req=>req.url().includes('/api/course-reflections/discussion') && req.method()==='POST' ? req.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'Could not save your reminder. Your note is still here; try again.'})}) : req.continue();
    page.on('request',fail);
    await page.$eval(root+' .discussion-mark',e=>e.click());
    await page.waitForFunction(s=>document.querySelector(s+' .discussion-control [role=status]')?.textContent.includes('Could not save'),{},root);
    await page.$$eval('.journey-active-pagination button',buttons=>buttons.find(b=>b.textContent.startsWith('Next:')).click());
    assert(await page.$(root),'Failed reminder save must block navigation');
    assert.equal(await page.$eval(root+' .discussion-note',e=>e.value),edited,'Retain the full note on failure');
    page.off('request',fail);await page.setRequestInterception(false);
    await page.$$eval(root+' .discussion-control button',buttons=>buttons.find(b=>b.textContent.includes('Try saving reminder')).click());
    await page.waitForFunction(s=>document.querySelector(s+' .discussion-control [role=status]')?.textContent==='Saved',{},root);
    await page.$eval(root+' .discussion-mark',e=>e.click());
    await page.waitForFunction(s=>document.querySelector(s+' .discussion-control [role=status]')?.textContent==='Saved',{},root);
    console.log('PASS reminder save failure retains note, prevents leaving lesson, and explicit retry recovers');
   }
   await go('/field-kit/reflections/'+slug+'?view=discussion');
   await page.waitForFunction(()=>document.querySelector('.reflection-filter-empty'));
   assert(!(await page.$eval(selector,e=>e.checkVisibility())),'Unmarked question removed from reminders');
   console.log(`PASS ${preview?'Jordan preview':'account'} ${width}px: unanswered mark, note, immediate Next flush, Field Kit edit, Journey reopen, unmark, no overflow`);
  }
  if(!preview) {
   await page.setRequestInterception(true);
   const failLoad=req=>req.url().includes('/api/course-reflections/discussion') && req.method()==='GET' ? req.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'Could not load your private reminders. Try again.'})}) : req.continue();
   page.on('request',failLoad);
   await go('/journey?lesson='+q.lessonSlug);
   await page.waitForSelector('.journey-active-workbook '+selector+' textarea:not([disabled])');
   assert(await page.$('.discussion-control [role=alert]'),'Reminder load failure is shown independently');
   page.off('request',failLoad);await page.setRequestInterception(false);
   console.log('PASS reminder load failure does not block the inline reflection workbook');
  }
  await context.close();
 }
 const data=await fetch(base+'/api/course-reflections?courseSlug='+slug,{headers:{Cookie:cookie}}).then(r=>r.json());
 assert.equal(data.entries.length,0,'Bookmark/note must not create or alter reflection answers');
 const roundId=data.rounds[0].id;
 let list=await fetch(base+'/api/course-reflections/discussion?courseSlug='+slug,{headers:{Cookie:cookie}}).then(r=>r.json());
 const prior=list.reminders.find(r=>r.question_id===q.id);
 const body={roundId,questionId:q.id,marked:true,note:'CAS validation',expectedRevision:prior.revision};
 assert.equal((await api(body)).status,200);
 assert.equal((await api(body)).status,409,'Stale tab cannot overwrite newer note');
 assert.equal((await api({...body,questionId:excluded.id})).status,400,'CARE-only boundary');
 assert.equal((await api({...body,courseSlug:'designid-foundations'})).status,400,'Journey-only boundary');
 assert.equal((await api({...body,roundId:crypto.randomUUID()})).status,404,'Other workbook cannot be changed');
 assert.equal((await api({...body,note:'x'.repeat(1001)})).status,400,'Note length boundary');
 assert.equal((await api(body,{Origin:'https://untrusted.example'})).status,403,'Cross-origin blocked');
 const newRound=await fetch(base+'/api/course-reflections',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({action:'new-round',courseSlug:slug})});assert.equal(newRound.status,201);
 assert.equal((await api({...body,expectedRevision:prior.revision+1})).status,403,'Earlier walkthrough reminders are read-only');
 const secondPassword=crypto.randomBytes(24).toString('base64url');
 const second=await admin.auth.admin.createUser({email:`discussion-other-${crypto.randomUUID()}@example.invalid`,password:secondPassword,email_confirm:true});assert(!second.error);
 try {
  const client=createClient(cfg.project_url,cfg.anon_key,{auth:{persistSession:false}});
  const auth=await client.auth.signInWithPassword({email:second.data.user.email,password:secondPassword});assert(!auth.error);
  const otherLink=await admin.auth.admin.generateLink({type:'magiclink',email:second.data.user.email});
  const otherLogin=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:otherLink.data.properties.hashed_token,next:'/journey'}),redirect:'manual'});
  const otherCookie=otherLogin.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
  const other=await fetch(base+'/api/course-reflections/discussion?courseSlug='+slug,{headers:{Cookie:otherCookie}}).then(r=>r.json());assert.deepEqual(other.reminders,[]);
  assert.equal((await api({...body,expectedRevision:prior.revision+1},{Cookie:otherCookie})).status,404);
  const path=`private-discussion-reminders/user-${userId}.json`;
  const denied=await client.storage.from('assessment-report-pdfs').download(path);assert(denied.error,'Another signed-in user cannot download the private object');
  const anonClient=createClient(cfg.project_url,cfg.anon_key,{auth:{persistSession:false}});
  const anon=await anonClient.storage.from('assessment-report-pdfs').download(path);assert(anon.error,'Private object cannot be anonymously downloaded');
  const pub=await fetch(cfg.project_url+'/storage/v1/object/public/assessment-report-pdfs/'+path);assert(!pub.ok,'Bucket is not public');
 } finally {await admin.auth.admin.deleteUser(second.data.user.id);}
 assert.deepEqual(errors,[]);console.log('PASS private account isolation, anon denial, cross-origin, validation, CAS, unchanged answers and no browser errors');
} finally {
 if(browser)await browser.close();
 if(userId){await bucket.remove([`private-discussion-reminders/user-${userId}.json`,`private-discussion-reminders/user-${userId}.lock`]);await admin.auth.admin.deleteUser(userId);}
 if(previewBackup!==undefined){const current=await stored(previewPath);if(current===previewAfter||current===previewBackup){const r=previewBackup===null?await bucket.remove([previewPath]):await bucket.upload(previewPath,Buffer.from(previewBackup),{contentType:'application/json',upsert:true,cacheControl:'0'});assert(!r.error);assert.equal(await stored(previewPath),previewBackup);console.log('PASS Jordan discussion reminders restored exactly; QA user removed');}else throw Error('Concurrent preview change preserved; reconcile QA note without overwriting current work.');}
}
