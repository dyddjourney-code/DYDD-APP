import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const base=process.env.REFLECTION_ENTRY_BASE||'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const tag=base.startsWith('https')?'published':'local';
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const slugs=['designid-foundations','spiritual-gifts-service','fruitlife-360-formation','designpd-alignment'];
const types=['designid','spiritual_gifts','fruit_360','designpd'];
const {reflectionExperiences}=load('lib/reflections/catalog.ts');
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const users=[],errors=[],proof=[];let page;
const check=r=>{assert(!r.error,r.error?.message);return r.data};
const go=path=>page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});
async function history(slug){return page.evaluate(async slug=>{const r=await fetch('/api/course-reflections?courseSlug='+slug);if(!r.ok)throw Error(await r.text());return r.json()},slug)}
async function fill(selector,value){await page.$eval(selector,(e,value)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function button(text,root='.reflection-answer'){const found=await page.$$(root+' button');for(const b of found)if((await b.evaluate(e=>e.textContent.trim()))===text){await b.evaluate(e=>e.click());return;}throw Error('Missing button '+text)}
async function saved(){await page.waitForFunction(()=>Array.from(document.querySelectorAll('.reflection-answer [role="status"]')).some(e=>e.textContent.includes('Saved')),{timeout:20000})}
try{
 const email='reflection-entry-'+crypto.randomUUID()+'@example.invalid';
 const user=check(await admin.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('base64url'),email_confirm:true})).user;users.push(user.id);
 for(const type of types)check(await admin.from('assessment_snapshots').insert({user_id:user.id,assessment_type:type,source:'reflection_entry_isolated_qa',scores:{Primary:'Artisan',Secondary:'Architect',summary:{Primary:'Artisan',Secondary:'Architect'}},source_submitted_at:'2026-01-01T12:00:00Z'}));
 const link=check(await admin.auth.admin.generateLink({type:'magiclink',email}));
 const signed=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:link.properties.hashed_token,next:'/trailheads'}),redirect:'manual'});assert.equal(signed.status,307);
 const ctx=await browser.createBrowserContext();page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.setCookie(...signed.headers.getSetCookie().map(c=>{const pair=c.split(';')[0],i=pair.indexOf('=');return{name:pair.slice(0,i),value:pair.slice(i+1),url:base}}));
 let failNext=false;await page.setRequestInterception(true);page.on('request',r=>{const url=new URL(r.url());if(url.origin===base&&(url.pathname==='/sandbox-review'||url.pathname==='/base-camp'||url.searchParams.has('review')))return r.abort();if(failNext&&r.method()==='POST'&&new URL(r.url()).pathname==='/api/course-reflections'&&JSON.parse(r.postData()||'{}').action==='save'){failNext=false;return r.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'QA connection interrupted. Your draft is safe; try again.'})})}return r.continue()});
 for(let i=0;i<slugs.length;i++){
  const slug=slugs[i],exp=reflectionExperiences.find(e=>e.slug===slug),q=exp.questions.at(-1),path='/courses/'+slug+'?lesson='+q.lessonSlug;
  await page.setViewport({width:1280,height:1000});await go('/courses/'+slug);await page.waitForSelector('main');await page.waitForFunction(()=>!document.querySelector('main')?.textContent.includes('Loading your reflection history'));
  assert.equal(await page.$('.reflection-round-bar'),null,'no opening setup lecture');
  if(slug!=='designid-foundations'){await go(`/learn/${slug}/${q.lessonSlug}`);await page.waitForSelector('.reflection-entry-setup button',{visible:true});assert.equal(await page.$('.reflection-round-bar'),null,'standalone lesson uses contextual setup');}
  await go(path);await page.waitForSelector('.reflection-entry-setup button',{visible:true});
  assert.equal(await page.$$eval('.reflection-entry-setup',es=>es.length),1,'one setup even for multiple prompts');
  const text=await page.$eval('.reflection-entry-setup',e=>e.textContent);assert(text.includes('Your private reflections'));assert(text.includes('Save what you notice as you work through this course.'));
  assert.equal(await page.$eval('.reflection-report-link',e=>e.open),false,'optional report tucked away');
  for(const width of [1920,1280,768,390,320]){
   await page.setViewport({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow '+slug+' '+width);
   await page.$eval('.reflection-entry-setup',e=>e.scrollIntoView({block:'center',behavior:'instant'}));
   await page.screenshot({path:`tmp/reflection-entry-${tag}-${slug}-${width}.png`});
  }
  await page.$eval('.reflection-report-link summary',e=>e.click());
  assert((await page.$eval('.reflection-report-link',e=>e.textContent)).includes('This labels this set of reflections; your lesson content stays the same.'));
  const before=await history(slug);assert.equal(before.rounds.length,0);assert.equal(before.reports.length,1);
  if(i%2===0)await page.select('.reflection-report-link select',before.reports[0].id);
  await button('Begin my reflections');await page.waitForSelector('.reflection-answer textarea:not([disabled])');
  assert.equal(await page.$('.reflection-entry-setup'),null);
  let data=await history(slug);assert.equal(data.rounds.length,1);assert.equal(data.rounds[0].assessment_snapshot_id,i%2===0?before.reports[0].id:null);
  const question=await page.$eval('.reflection-answer textarea',e=>e.closest('[data-question]').dataset.question);
  const first='Isolated QA: noticing a practical next step in '+slug;
  await fill('.reflection-answer textarea',first);await page.$eval('.reflection-answer textarea',e=>e.blur());await new Promise(resolve=>setTimeout(resolve,900));assert.equal((await history(slug)).entries.length,0,'explicit save only, no autosave');await button('Save reflection');await saved();
  data=await history(slug);assert(data.entries.some(e=>e.question_id===question&&e.response===first&&e.revision===1));
  for(const width of [1280,390,320]){await page.setViewport({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.$eval('.reflection-answer textarea',e=>e.scrollIntoView({block:'center',behavior:'instant'}));await page.screenshot({path:`tmp/reflection-entry-${tag}-${slug}-answer-${width}.png`});}
  const second=first+'; refined after reflection.';await fill('.reflection-answer textarea',second);failNext=true;await button('Save reflection');
  await page.waitForFunction(()=>document.querySelector('.reflection-answer [role="status"]')?.textContent.includes('QA connection interrupted'));
  assert.equal(await page.$eval('.reflection-answer textarea',e=>e.value),second);await button('Save reflection');await saved();
  await go(path);await page.waitForSelector('.reflection-answer textarea:not([disabled])');assert.equal(await page.$eval('.reflection-answer textarea',e=>e.value),second);
  assert((await page.$eval('.reflection-answer',e=>e.textContent)).includes('Earlier edits in this round (1)'));
  data=await history(slug);assert.equal(data.entries.filter(e=>e.question_id===question).length,2);
  const roundId=data.rounds[0].id;
    await go('/field-kit/reflections/'+slug);await page.waitForSelector('.reflection-workbook-settings');
  assert.equal(await page.$eval('.reflection-workbook-settings',e=>e.open),false);await page.$eval('.reflection-workbook-settings > summary',e=>e.click());
  await button('Start a fresh set of reflections','.reflection-workbook-settings');
  await page.waitForFunction(()=>document.querySelector('.reflection-round-controls select')?.options.length===2);
  data=await history(slug);assert.equal(data.rounds.length,2);assert(data.entries.some(e=>e.round_id===roundId&&e.response===second));
  await page.select('.reflection-round-controls select',roundId);await page.waitForFunction(()=>document.querySelector('.reflection-round-controls')?.textContent.includes('You’re reading a previous round'));
  assert.equal(await page.$('textarea:not([disabled])'),null,'historical round read-only');
  await go(path);await page.waitForSelector('.reflection-answer textarea:not([disabled])');assert.equal(await page.$eval('.reflection-answer textarea',e=>e.value),'');
  assert((await page.$eval('.reflection-answer',e=>e.textContent)).includes(second),'previous answer retained beside prompt');
  // A new completed report still rolls the current round forward without losing either earlier set.
  const retake=check(await admin.from('assessment_snapshots').insert({user_id:user.id,assessment_type:types[i],source:'reflection_entry_isolated_retake_qa',scores:{Primary:'Artisan',Secondary:'Architect'},source_submitted_at:new Date().toISOString()}).select('id').single());
  await go(path);await page.waitForSelector('.reflection-answer textarea:not([disabled])');data=await history(slug);
  assert.equal(data.rounds.length,3);assert.equal(data.rounds[0].assessment_snapshot_id,retake.id);assert(data.entries.some(e=>e.response===second));
  const expResponse=await page.evaluate(async slug=>{const r=await fetch('/api/course-reflections/export?'+new URLSearchParams({courseSlug:slug,scope:'course'}));return{status:r.status,text:await r.text()}},slug);assert.equal(expResponse.status,200);assert(expResponse.text.includes(second));
  proof.push({slug,deepLink:q.lessonSlug,realRevisions:2,roundsAfterRetake:3,reportLinkPreserved:true,export:true,viewports:[1920,1280,768,390,320]});console.log('PASS '+slug+' deep-link single inline entry; optional report; real explicit saves/retry/revisions/reload; Field Kit fresh/history/read-only; retake rollover; export; 5 responsive sizes');
 }
 const anon=await browser.createBrowserContext(),ap=await anon.newPage();for(const slug of slugs){await ap.goto(base+'/courses/'+slug,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(new URL(ap.url()).pathname,'/login');}await anon.close();
 // Established owner entry stays reviewable through ordinary navigation, without changing owner reflection objects.
 const owner=await browser.createBrowserContext(),op=await owner.newPage();await op.goto(base+'/sandbox-review',{waitUntil:'domcontentloaded',timeout:60000});assert.equal(new URL(op.url()).pathname,'/trailheads');
 for(const slug of slugs){await op.goto(base+'/courses/'+slug,{waitUntil:'domcontentloaded',timeout:60000});await op.waitForSelector('main');assert.equal(new URL(op.url()).pathname,'/courses/'+slug);assert(await op.$$eval('.reflection-round-bar',es=>es.every(e=>e.closest('.reflection-workbook-settings'))))}await owner.close();
 assert.deepEqual(errors,[]);fs.writeFileSync(`tmp/reflection-entry-${tag}-proof.json`,JSON.stringify({base,proof,runtimeErrors:errors},null,2));
}catch(error){
 if(page){await page.screenshot({path:`tmp/reflection-entry-${tag}-failure.png`}).catch(()=>{});console.error(await page.evaluate(()=>({path:location.pathname,text:document.querySelector('main')?.textContent?.slice(-6000)})).catch(()=>({})))}
 throw error;
}finally{
 await browser.close();for(const id of users)check(await admin.auth.admin.deleteUser(id));
 if(users.length){assert.deepEqual(check(await admin.from('reflection_rounds').select('id').in('user_id',users)),[]);assert.deepEqual(check(await admin.from('assessment_snapshots').select('id').in('user_id',users)),[])}
 fs.writeFileSync(`tmp/reflection-entry-${tag}-cleanup.json`,JSON.stringify({cleaned:true,accountCount:users.length}));console.log('CLEANUP isolated QA account, snapshots, rounds, answers removed; owner and ordinary existing data untouched');
}
