import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const base=process.env.JOURNEY_TEST_BASE || 'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app' || base.startsWith('http://localhost:'));
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const slug='discover-your-divine-design';
const questionId=process.env.JOURNEY_TEST_QUESTION_ID || 'child-of-god-response';
assert(/^[a-z0-9-]+$/.test(questionId),'Use a stable reflection question ID');
let userId,browser,page;
try {
 const email=`journey-sync-${crypto.randomUUID()}@example.invalid`;
 const created=await admin.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('base64url'),email_confirm:true});
 assert(!created.error,created.error?.message);userId=created.data.user.id;
 const link=await admin.auth.admin.generateLink({type:'magiclink',email});assert(!link.error,link.error?.message);
 const login=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:link.data.properties.hashed_token,next:'/journey'}),redirect:'manual'});
 assert.equal(login.status,307);
 const cookies=login.headers.getSetCookie().map(x=>{const pair=x.split(';')[0],i=pair.indexOf('=');return {name:pair.slice(0,i),value:pair.slice(i+1),url:base};});assert(cookies.length);
 const cookie=cookies.map(x=>x.name+'='+x.value).join('; ');
 // No setup API/button: opening Journey must create the first workbook itself.
 const load=(await import('../scripts/fruitlife-test-load.cjs')).default;
 const q=load('lib/reflections/catalog.ts').getReflectionExperience(slug).questions.find(x=>x.id===questionId);
 assert(q,`Reflection question ${questionId} is in the catalog`);
 const eligible=load('lib/reflections/discussion-catalog.ts').careDiscussionIds;
 assert(eligible.has(q.id),'Tested CARE prompt is discussion eligible');
 if(q.id==='whose-tomorrow') {
  assert.equal(q.prompt,'How might your life be different tomorrow if you focused on whose rather than who?');
  const section=load('lib/journey/dydd-journey.ts').dyddJourney.stages.flatMap(s=>s.sections).find(s=>s.slug==='who-and-whose');
  assert.equal(section.prompts.filter(p=>p.id===q.id).length,1,'One stable Explore prompt');
  assert.equal(section.prompts.find(p=>p.id===q.id).careStep,'explore');
 }
 console.log('Testing reflection '+q.id+' at '+q.lessonSlug);
 const errors=[];
 const answer='CARE sync verification '+crypto.randomUUID();
 for(const width of [1280,390,320]) {
  browser=await puppeteer.launch({args:chromium.args.filter(arg=>arg!=="--single-process"),executablePath:await chromium.executablePath(),headless:true});
  page=await browser.newPage();await page.setCookie(...cookies);page.on("pageerror",e=>errors.push(e.message));page.on("dialog",d=>{console.log("Unexpected navigation dialog: "+d.type());void d.accept();});
  console.log("Starting "+width+"px");
  await page.setViewport({width,height:1000});
  const go = async path => { await page.close();page=await browser.newPage();page.on("pageerror",e=>errors.push(e.message));await page.setViewport({width,height:1000});await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());if(u.origin===base&&(u.pathname==='/base-camp'||u.pathname==='/sandbox-review'||u.searchParams.has('review')))return r.abort().catch(()=>{});return r.continue().catch(()=>{});});await page.deleteCookie({name:'dydd_sandbox_review',url:base});await page.goto(base+path,{waitUntil:"domcontentloaded"});page.removeAllListeners('request');await page.setRequestInterception(false); };
  await go('/journey?lesson='+q.lessonSlug);
  await page.waitForSelector(`.journey-active-workbook [data-question="${q.id}"] textarea:not([disabled])`);
  assert.equal(await page.$('.journey-reflection-settings'),null);
  assert.equal(await page.$('.reflection-round-bar'),null);
  assert(!(await page.$eval('body',e=>e.textContent)).includes('Begin my reflections'));
  const current = await fetch(base+'/api/course-reflections?courseSlug='+slug,{headers:{Cookie:cookie}}).then(r=>r.json());
  assert.equal(current.rounds.length,1,'One automatically created workbook, not one per visit');
  assert.equal(current.rounds[0].questions.filter(x=>x.id===q.id).length,1,'Round snapshots the stable prompt once');
  assert.equal(current.rounds[0].questions.find(x=>x.id===q.id).prompt,q.prompt);
  assert(await page.$(`.journey-active-workbook [data-question="${q.id}"] .discussion-mark`),'Journey discussion control');
  if(q.id==='whose-tomorrow')assert(await page.$(`[data-care-stage="explore"] [data-question="${q.id}"] textarea`),'Explore has an editable answer');
  q.lessonSlug=current.rounds[0].questions.find(x=>x.id===q.id).lessonSlug;
  const setup=await Promise.all([1,2].map(()=>fetch(base+'/api/course-reflections',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({courseSlug:slug,action:'ensure-round'})}).then(r=>r.json())));
  assert(setup.every(x=>x.round.id===current.rounds[0].id));
  const selector=`.journey-active-workbook [data-question="${q.id}"]`;
  const text=answer+' '+width;
  const saved=page.waitForResponse(r=>r.url().includes('/api/course-reflections') && r.request().method()==='POST' && r.request().postData()?.includes('"action":"save"'));
  await page.$eval(selector+' textarea',(e,t)=>{const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},text);
  assert.equal((await saved).status(),200);
  await page.waitForFunction(s=>document.querySelector(s+" [role=status]")?.textContent==="Saved",{},selector);
  console.log("Inline saved "+width);
  await go('/field-kit/reflections/'+slug);
  console.log("Field Kit loaded "+width);
  await page.waitForFunction(t=>document.body.textContent.includes(t),{},text);
  const article=`[data-question="${q.id}"]`;
  await page.$eval(article,e=>{for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await page.$eval(article+' button',e=>e.click());
  console.log("Field Kit edit opened "+width);
  const edited=text+' edited in Field Kit';
  await page.$eval(article+' textarea',(e,t)=>{const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},edited);
  const fieldSaved=page.waitForResponse(r=>r.url().includes('/api/course-reflections') && r.request().method()==='POST' && r.request().postData()?.includes('"action":"save"'));
  await page.$eval(article+' button',e=>e.click());assert.equal((await fieldSaved).status(),200);
  await page.waitForFunction(s=>document.querySelector(s+" [role=status]")?.textContent==="Saved to your account",{},article);
  assert(await page.$(article+' .discussion-mark'),'Field Kit discussion control');
  const history=await fetch(base+'/api/course-reflections?courseSlug='+slug,{headers:{Cookie:cookie}}).then(r=>r.json());
  const revisions=history.entries.filter(e=>e.question_id===q.id).sort((a,b)=>b.revision-a.revision);
  assert.equal(revisions[0].response,edited);
  assert(revisions.some(e=>e.response===text),'Original inline answer remains in dated revision history');
  const historyText=await page.$eval(article+' .reflection-history',e=>{e.open=true;return e.textContent;});
  assert(historyText.includes(text),'Field Kit renders original answer in earlier edits');
  for(const scope of ['round','course','all']) {
   const query=new URLSearchParams({scope,courseSlug:slug,round:current.rounds[0].id});
   const exported=await fetch(base+'/api/course-reflections/export?'+query,{headers:{Cookie:cookie}});
   assert.equal(exported.status,200);
   const exportText=await exported.text();
   assert(exportText.includes('Question: '+q.prompt+'\nAnswer:\n'+edited),'Latest answer exports under exact prompt ('+scope+')');
   assert(!exportText.includes('\n'+text+'\n'),'Exports exclude superseded revision ('+scope+')');
  }
  if(width===1280) {
   const reminderResponse=await fetch(base+'/api/course-reflections/discussion',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({courseSlug:slug,roundId:current.rounds[0].id,questionId:q.id,marked:true,note:'Synthetic Explore discussion eligibility',expectedRevision:0})});
   assert.equal(reminderResponse.status,200);
   const reminder=await reminderResponse.json();assert.equal(reminder.reminder.question_id,q.id);assert.equal(reminder.reminder.marked,true);
   const reminders=await fetch(base+'/api/course-reflections/discussion?courseSlug='+slug,{headers:{Cookie:cookie}}).then(r=>r.json());
   assert(reminders.reminders.some(r=>r.question_id===q.id && r.marked),'Reminder survives API reload');
   assert.equal(reminder.reminder.note,'Synthetic Explore discussion eligibility');
   const unmark=await fetch(base+'/api/course-reflections/discussion',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({courseSlug:slug,roundId:current.rounds[0].id,questionId:q.id,marked:false,note:'Synthetic private note retained',expectedRevision:reminder.reminder.revision})});assert.equal(unmark.status,200);const unmarked=await unmark.json();assert.equal(unmarked.reminder.marked,false);assert.equal(unmarked.reminder.note,'Synthetic private note retained');
   console.log('PASS private Take to Class mark/note/reload/unmark; no class post');
  }
  console.log('PASS '+width+'px: exact prompt snapshots, append-only history/UI, round/course/all exports, discussion eligibility');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Field Kit overflow '+width);
  await go('/journey?lesson='+q.lessonSlug);
  await page.waitForFunction(({s,t})=>document.querySelector(s+' textarea')?.value===t,{}, {s:selector,t:edited});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Journey overflow '+width);
  if(width===1280) {
    const immediate=edited+' immediate next';
    await page.$eval(selector+' textarea',(e,t)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},immediate);
    await page.$$eval('.journey-active-pagination button',buttons=>buttons.find(b=>b.textContent.startsWith('Next:')).click());
    await page.waitForFunction(s=>!document.querySelector(s),{},selector);
    const after=await fetch(base+'/api/course-reflections?courseSlug='+slug,{headers:{Cookie:cookie}}).then(r=>r.json());
    assert.equal(after.entries.filter(e=>e.question_id===q.id).sort((a,b)=>b.revision-a.revision)[0].response,immediate);
    console.log('PASS immediate Next flushes pending answer before leaving lesson');
    await go('/journey?lesson='+q.lessonSlug);
    await page.waitForSelector(selector+' textarea:not([disabled])');
    await page.setRequestInterception(true);
    const failSave=req=>req.url().includes('/api/course-reflections') && req.postData()?.includes('"action":"save"') ? req.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'Could not save. Your draft is still here; please try again.'})}) : req.continue();
    page.on('request',failSave);
    const failed=immediate+' network failure draft';
    await page.$eval(selector+' textarea',(e,t)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},failed);
    await page.waitForFunction(s=>document.querySelector(s+' [role=status]')?.textContent.includes('Could not save'),{},selector);
    await page.$$eval('.journey-active-pagination button',buttons=>buttons.find(b=>b.textContent.startsWith('Next:')).click());
    await page.waitForFunction(s=>document.querySelector(s+' button')?.textContent.includes('Try saving again'),{},selector);
    assert.equal(await page.$eval(selector+' textarea',e=>e.value),failed);
    page.off('request',failSave);await page.setRequestInterception(false);
    await page.$eval(selector+' button',e=>e.click());
    await page.waitForFunction(s=>document.querySelector(s+' [role=status]')?.textContent==='Saved',{},selector);
    console.log('PASS network failure retains draft and blocks lesson change; explicit retry saves');
    let heldRequest;
    const held=new Promise(resolve=>{heldRequest=resolve;});
    await page.setRequestInterception(true);
    const hold=req=>{if(req.postData()?.includes('"action":"save"'))heldRequest(req);else void req.continue();};
    page.on('request',hold);
    const inFlight=failed+' first in-flight edit';
    await page.$eval(selector+' textarea',(e,t)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},inFlight);
    const request=await held;
    const finalValue=failed+' newer edit while saving';
    await page.$eval(selector+' textarea',(e,t)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},finalValue);
    page.off('request',hold);page.on('request',req=>void req.continue());await request.continue();
    await page.waitForFunction(s=>document.querySelector(s+' [role=status]')?.textContent==='Saved',{},selector);
    await page.setRequestInterception(false);page.removeAllListeners('request');
    const latest=await fetch(base+'/api/course-reflections?courseSlug='+slug,{headers:{Cookie:cookie}}).then(r=>r.json());
    const entry=latest.entries.filter(e=>e.question_id===q.id).sort((a,b)=>b.revision-a.revision)[0];
    assert.equal(entry.response,finalValue);
    const remote='Saved in another tab '+crypto.randomUUID();
    const conflictSave=await fetch(base+'/api/course-reflections',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({action:'save',courseSlug:slug,roundId:entry.round_id,questionId:q.id,response:remote,expectedRevision:entry.revision})});
    assert.equal(conflictSave.status,200);
    const localDraft='Keep my conflicting draft '+crypto.randomUUID();
    await page.$eval(selector+' textarea',(e,t)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},localDraft);
    await page.waitForFunction(s=>document.querySelector(s+' [role=status]')?.textContent.includes('another tab'),{},selector);
    assert.equal(await page.$eval(selector+' textarea',e=>e.value),localDraft);
    const protectedAnswer=await fetch(base+'/api/course-reflections?courseSlug='+slug,{headers:{Cookie:cookie}}).then(r=>r.json());
    assert.equal(protectedAnswer.entries.filter(e=>e.question_id===q.id).sort((a,b)=>b.revision-a.revision)[0].response,remote);
    console.log('PASS edits made during saving persist; stale tab cannot overwrite newer answer and keeps draft');

  }
  await page.screenshot({path:`tmp/journey-sync-${q.id}-${base.startsWith('https')?'live':'local'}-${width}.png`,fullPage:false});
  await browser.close();browser=null;page=null;
  console.log('PASS '+width+'px: inline CARE save → Field Kit exact answer → Field Kit edit → Journey reload; no top setup; automatic round/save; no overflow');
 }
 assert.deepEqual(errors,[]);console.log('PASS no browser runtime errors');
} catch(error) {
 console.log("QA failure: "+error.message);
 throw error;
} finally {
 if(browser)await browser.close().catch(()=>{});
 if(userId){
  try {
   const removed=await admin.storage.from('assessment-report-pdfs').remove([`private-discussion-reminders/user-${userId}.json`,`private-discussion-reminders/user-${userId}.lock`]);
   assert(!removed.error,removed.error?.message);
  } finally {
   const r=await admin.auth.admin.deleteUser(userId);assert(!r.error,r.error?.message);
  }
  console.log('Synthetic QA account and reminder objects removed; Jordan and existing learner answers untouched');
 }
}
