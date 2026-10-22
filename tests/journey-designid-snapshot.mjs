// Isolated, engine-scored QA reports only; no owner-preview report fabrication.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const base=process.env.JOURNEY_TEST_BASE||'http://localhost:3124';
assert(base.startsWith('http://localhost:')||base==='https://dydd-online-school-sandbox.vercel.app');
const tag=base.startsWith('https:')?'published':'local';
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const engine=load('lib/designid/engine.ts'),intake=load('lib/designid/intake.ts'),reporting=load('lib/designid/report.ts');
const lesson='identity-the-designid-lens-what-is-in-the-report-19',slug='discover-your-divine-design';
const ids=[],snapshots=[],errors=[];
const check=r=>{assert(!r.error,r.error?.message);return r.data;};
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
async function account(order,payloadOnly=false){
 const email='journey-snapshot-'+crypto.randomUUID()+'@example.invalid';
 const {user}=check(await admin.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('base64url'),email_confirm:true}));ids.push(user.id);
 const answers=Object.fromEntries(intake.designIdQuestionBank.map(q=>[q.code,[3,2,0,0][order.indexOf(q.reflection)]]));
 const result=engine.scoreDesignId(answers),payload=reporting.buildDesignIdReportPayload({participantName:'Isolated QA',participantEmail:email,result});
 const snapshot=check(await admin.from('assessment_snapshots').insert({user_id:user.id,assessment_type:'designid',source:'journey_snapshot_isolated_qa',scores:{...(payloadOnly?{}:{summary:payload}),reportPayload:payload},source_submitted_at:new Date().toISOString()}).select('id').single());snapshots.push(snapshot.id);
 const link=check(await admin.auth.admin.generateLink({type:'magiclink',email}));
 const login=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:link.properties.hashed_token,next:'/journey'}),redirect:'manual'});assert.equal(login.status,307);
 const cookies=login.headers.getSetCookie().map(x=>{const p=x.split(';')[0],i=p.indexOf('=');return{name:p.slice(0,i),value:p.slice(i+1),url:base}});
 return {id:user.id,snapshot:snapshot.id,result,payload,cookies,cookie:cookies.map(c=>c.name+'='+c.value).join('; ')};
}
async function open(page,width){await page.setViewport({width,height:1000});await page.deleteCookie({name:'dydd_sandbox_review',url:base});await page.goto(base+'/journey?lesson='+lesson,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('.journey-designid-snapshot');await page.waitForSelector('.journey-designid-lens-care textarea:not([disabled])');await page.evaluate(()=>document.fonts.ready);}
try{
 const a=await account(['Architect','Artisan','Shepherd','Steward']),b=await account(['Steward','Shepherd','Artisan','Architect'],true);
 for(const user of [a,b]){
  const context=await browser.createBrowserContext(),page=await context.newPage();await page.setCookie(...user.cookies);page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());if(u.origin===base&&(u.pathname==='/base-camp'||u.pathname==='/sandbox-review'||u.searchParams.has('review')))return r.abort();return r.continue();});
  for(const width of user===a?[1920,1280,768,390,320]:[1280,390]){
   await open(page,width);await page.waitForFunction(()=>document.querySelector('.journey-designid-donut img')?.naturalWidth>0,{timeout:30000});
   assert.deepEqual(await page.$$eval('.journey-designid-labels dt',es=>es.map(e=>e.textContent)),['Primary Reflection','Secondary Reflection','Integrative Reflection','Shadow Reflection']);
   assert.deepEqual(await page.$$eval('.journey-designid-labels dd',es=>es.map(e=>e.textContent)),[user.payload.Primary,user.payload.Secondary,user.payload.Integrative_Reflection,user.payload.Reflection_Shadow]);
   assert.deepEqual(await page.$$eval('.journey-designid-capacities dd',es=>es.map(e=>e.textContent)),['Architect','Artisan','Shepherd','Steward'].map(n=>user.payload['Band_'+n]));
   const chart=await page.$eval('.journey-designid-donut img',e=>JSON.parse(new URL(e.src).searchParams.get('c')));assert.deepEqual(chart.data.datasets[0].data,['Architect','Artisan','Shepherd','Steward'].map(n=>user.result.scores[n]));assert.equal(chart.options.cutout,'58%');
   const shadow=await page.$$eval('.journey-designid-snapshot .designid-shadow-table tbody tr',es=>es.map(e=>[...e.children].map(c=>c.textContent)));
   assert.deepEqual(shadow,['A','B','C','D'].map(letter=>[letter,...['Risk','Root','Red'].map(f=>user.payload['Shadow_'+f+'_'+letter])]));
   assert.deepEqual(await page.$$eval('.journey-designid-snapshot .designid-shadow-table thead th',es=>es.map(e=>e.textContent)),['','Risks','Root Cause','Redemption']);
   assert.equal(await page.$('.journey-designid-snapshot .designid-live-capacity'),null);assert.equal(await page.$$eval('.journey-designid-donut',es=>es.length),1);assert(!(await page.$eval('.journey-designid-snapshot',e=>e.textContent)).includes('Contribution'));
   assert.equal(await page.$$eval('.journey-designid-lens-care textarea:not(.discussion-note)',es=>es.length),4);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width);
   if(width<=600){const scroll=await page.$eval('.journey-shadow-scroll',e=>{e.scrollLeft=120;return {scroll:e.scrollLeft,overflow:e.scrollWidth>e.clientWidth,font:getComputedStyle(e.querySelector('td')).fontSize}});assert(scroll.scroll>0&&scroll.overflow&&parseFloat(scroll.font)>=14,'Readable, keyboard/swipe scroll chart');await page.$eval('.journey-shadow-scroll',e=>e.scrollLeft=0);} 
   assert(await page.$eval('.journey-designid-return',e=>e===e.parentElement.firstElementChild),'welcome teaching at top');
   if(user===a){await page.$eval('.journey-designid-return',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await(await page.$('.journey-designid-return')).screenshot({path:`tmp/unpack-${tag}-${width}.png`});}
   if(user===a&&width===1280){const audio=await page.$('.journey-active-lesson audio');if(audio)assert(await audio.evaluate(async e=>{await e.play();await new Promise(r=>setTimeout(r,200));const ok=e.currentTime>0&&!e.paused;e.pause();return ok;}));}
   console.log('PASS '+tag+' '+user.result.primary+'/'+width+' actual saved labels/wheel scores/capacities/exact shadow matrix/top intro/CARE/no overflow');
  }
  if(user===a){
   const qid=lesson+'-designid-connect',answer='Snapshot integration saved '+crypto.randomUUID();
   await page.$eval('[data-question="'+qid+'"] textarea',(e,t)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));e.blur()},answer);
   await page.$$eval('.journey-active-pagination button',es=>es.find(e=>e.textContent.startsWith('Next:')).click());await page.waitForFunction(()=>!document.querySelector('.journey-designid-return'));
   const h=await fetch(base+'/api/course-reflections?courseSlug='+slug,{headers:{Cookie:user.cookie}}).then(r=>r.json());assert(h.entries.some(e=>e.question_id===qid&&e.response===answer));
   await open(page,390);await page.waitForFunction((id,t)=>document.querySelector('[data-question="'+id+'"] textarea')?.value===t,{},qid,answer);console.log('PASS existing CARE actual DB save/immediate Next/reopen preserved');
  }
  if(user===b){check(await admin.from('assessment_snapshots').update({scores:{summary:{Primary:'Steward',Potential_Shadow:'NOT the primary reflection shadow'}}}).eq('id',user.snapshot));await open(page,390);const values=await page.$$eval('.journey-designid-labels dd',es=>es.map(e=>e.textContent));assert.deepEqual(values,['Steward',...Array(3).fill('Not available in your saved report.')]);assert.equal(await page.$('.journey-designid-donut'),null);assert((await page.$eval('.journey-designid-snapshot',e=>e.textContent)).includes('The scored wheel is not available'));console.log('PASS incomplete historical report: no invented scores/capacities/shadow; missing fields explicit');}
  check(await admin.from('assessment_snapshots').delete().eq('id',user.snapshot));await open(page,390);assert.equal(await page.$('.journey-designid-donut'),null);assert((await page.$eval('.journey-designid-snapshot',e=>e.textContent)).includes('No saved DesignID report'));await context.close();
 }
 // Established public owner recovery → sidebar Trailheads → Journey, no invented report or new account.
 const ctx=await browser.createBrowserContext(),p=await ctx.newPage();await p.setViewport({width:1280,height:1000});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/sandbox-review',{waitUntil:'domcontentloaded',timeout:60000});await p.waitForSelector('aside a[href^="/trailheads"]');
 const trail=await p.$('aside a[href^="/trailheads"]');await Promise.all([p.waitForNavigation({waitUntil:'domcontentloaded'}),trail.click()]);
 await p.waitForSelector('a[href^="/journey"]');const journey=await p.$('a[href^="/journey"]');await Promise.all([p.waitForNavigation({waitUntil:'domcontentloaded'}),journey.click()]);
 assert.equal(new URL(p.url()).pathname,'/journey');await p.goto(base+'/journey?lesson='+lesson,{waitUntil:'domcontentloaded'});await p.waitForSelector('.journey-designid-return');assert.equal(await p.$('.journey-designid-donut'),null);assert((await p.$eval('.journey-designid-snapshot',e=>e.textContent)).includes('No saved DesignID report'));
 for(const width of [1280,390,320]){await p.setViewport({width,height:1000});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}await ctx.close();
 assert.deepEqual(errors,[]);console.log('PASS honest absent-report states; established owner recovery/sidebar Trailheads → Journey/lesson access; no fake owner report; zero runtime errors');
}finally{
 await browser.close();if(snapshots.length)check(await admin.from('assessment_snapshots').delete().in('id',snapshots));for(const id of ids){check(await admin.storage.from('assessment-report-pdfs').remove([`private-discussion-reminders/user-${id}.json`,`private-discussion-reminders/user-${id}.lock`]));check(await admin.auth.admin.deleteUser(id));assert.equal(check(await admin.from('assessment_snapshots').select('id').eq('user_id',id)).length,0);assert.equal(check(await admin.from('reflection_rounds').select('id').eq('user_id',id)).length,0);}console.log('CLEANUP all isolated QA users/reports/workbooks removed; no owner/customer/source/scoring/storage changes');
}
