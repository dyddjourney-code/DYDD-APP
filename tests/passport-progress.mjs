// Sandbox-only end-to-end evidence: authenticated requests, real DB writes, real browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const base=process.env.PASSPORT_TEST_BASE || 'http://127.0.0.1:3137';
assert(base==='http://127.0.0.1:3137'||base==='https://dydd-online-school-sandbox.vercel.app');
const tag=base.startsWith('https:')?'published':'local';
const db=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const {passportCurriculum,journeySlug,nicheRequiredPromptIds}=load('lib/passport/curriculum.ts');
const {savedAssessmentComplete,completedFruitSession}=load('lib/passport/evidence.ts');
const check=r=>{assert(!r.error,r.error?.message);return r.data;};
const ids=[],snapshotIds=[],participants=[];let browser;
const evidence=[];const record=s=>{evidence.push(s);console.log('PASS '+s);};
async function account(){const email=`passport-qa-${crypto.randomUUID()}@example.invalid`,password=crypto.randomBytes(20).toString('hex');const {user}=check(await db.auth.admin.createUser({email,password,email_confirm:true}));ids.push(user.id);let cookies=[];const client=createServerClient(cfg.project_url,cfg.anon_key,{cookies:{getAll:()=>cookies,setAll:c=>{cookies=c}}});check(await client.auth.signInWithPassword({email,password}));return {...user,client,cookies,cookie:cookies.map(c=>c.name+'='+c.value).join('; ')};}
async function request(user,body,course=journeySlug,extra={}){const r=await fetch(base+'/api/course-progress?courseSlug='+course,{method:body?'POST':'GET',headers:{...(user?{cookie:user.cookie}:{}),...(body?{'Content-Type':'application/json'}:{}),...extra},...(body?{body:JSON.stringify({courseSlug:course,...body})}:{})});return {status:r.status,body:await r.json()};}
async function snapshot(user,type,scores,source='passport_isolated_qa'){const s=check(await db.from('assessment_snapshots').insert({user_id:user.id,assessment_type:type,source,scores,source_submitted_at:new Date().toISOString()}).select('id').single());snapshotIds.push(s.id);return s.id;}
const engine=load('lib/designid/engine.ts'),intake=load('lib/designid/intake.ts'),reporting=load('lib/designid/report.ts');
async function readyPassport(page) {
 await page.waitForSelector('.passport-badge-button');
 // Server markup arrives before React attaches handlers. Wait for the actual
 // interactive component, then use a real pointer click, not HTMLElement.click.
 await page.waitForFunction(()=>{const b=document.querySelector('.passport-badge-button');if(!b)return false;const key=Object.keys(b).find(k=>k.startsWith('__reactProps$'));return key && typeof b[key]?.onClick==='function';});
}
async function clickBadge(page,title) {
 if(await page.$('.passport-detail-sheet[open]')) {
  await page.click('.passport-sheet-header button');
  await page.waitForFunction(()=>!document.querySelector('.passport-detail-sheet').open);
 }
 for(const b of await page.$$('.passport-badge-button'))if(await b.$eval('strong',e=>e.textContent)===title){await b.click();break;}
 await page.waitForFunction(t=>document.querySelector(matchMedia('(max-width: 980px)').matches ? '.passport-detail-sheet[open] h3' : '.passport-badge-popover h3')?.textContent===t,{},title);
}
function designPayload(name='Artisan') {const order=[name,...['Architect','Artisan','Shepherd','Steward'].filter(n=>n!==name)];const result=engine.scoreDesignId(Object.fromEntries(intake.designIdQuestionBank.map(q=>[q.code,[3,2,0,0][order.indexOf(q.reflection)]])));return {...reporting.buildDesignIdReportPayload({participantName:'Passport QA',participantEmail:'passport-qa@example.invalid',result}),...engine.designIdScorePayload(result)};}
try {
 const a=await account(),b=await account();
 assert.equal((await request(null)).status,401);
 assert.equal((await request(a,{action:'complete-lesson',lessonSlug:passportCurriculum[0].lessons[0].slug},journeySlug,{origin:'https://unrelated.invalid'})).status,403);
 let state=await request(a);assert.equal(state.status,200,JSON.stringify(state));assert.deepEqual(state.body.awards,[]);
 const journey=passportCurriculum[0];
 assert.equal((await request(a,{action:'complete-lesson',lessonSlug:journey.lessons.at(-1).slug})).status,409);
 assert.equal((await request(a,{action:'complete-lesson',lessonSlug:'forged'})).status,400);
 assert.equal((await request(a,{action:'declare-niche'})).status,409);
 assert((await a.client.from('passport_awards').insert({user_id:a.id,badge_key:'Identity'})).error);
 assert((await a.client.from('passport_lesson_completions').insert({user_id:a.id,course_slug:journeySlug,lesson_slug:journey.lessons.at(-1).slug})).error);
 assert.equal(check(await b.client.from('passport_lesson_completions').select().eq('user_id',a.id)).length,0);
 record('auth, cross-site, forged lesson, server skip gate, negative Niche and direct-write/RLS isolation');
 const idCourse=passportCurriculum.find(c=>c.slug==='designid-foundations');
 assert.equal((await request(a,{action:'complete-lesson',lessonSlug:idCourse.lessons[0].slug},idCourse.slug)).status,403);
 await snapshot(a,'designid',{status:'draft',summary:{Primary:'Architect'}});
 await snapshot(a,'designpd',{designIdSnapshotId:'missing',reportPayload:{Plan:'Dreamer'},pdfMonkey:{status:'queued'}},'designpd_app');
 await snapshot(a,'spiritual_gifts',{});
 await snapshot(a,'fruit_360',{summary:{Report_Mode:'FULL_360'},scores:{Observer_Count:0,Response_Count:1}});
 assert.deepEqual((await request(a)).body.awards,[]);
 for(const course of passportCurriculum.filter(c=>['designid-foundations','spiritual-gifts-service','fruitlife-360-formation','designpd-alignment'].includes(c.slug)))assert.equal((await request(a,{action:'complete-lesson',lessonSlug:course.lessons[0].slug},course.slug)).status,403,'Draft/incomplete report cannot authorize '+course.slug);
 record('draft DesignID, pending derived DesignPD, empty Gifts, self-only/incomplete FruitLife do not award');
 browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser runtime error:',e.message)});await page.setViewport({width:390,height:1000});await page.setCookie(...a.cookies.map(c=>({name:c.name,value:c.value,url:base})));
 await page.goto(base+'/journey?lesson='+journey.lessons.at(-1).slug,{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.course-completion-controls button:not([disabled])');
 assert.equal(await page.$eval('.journey-active-lesson > header h2',e=>e.textContent),journey.lessons[0].title);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile Journey checklist fits viewport');
 assert(!await page.$eval('.journey-active-pagination',e=>e.textContent.includes('Course complete')));
 await page.$eval('.course-completion-controls button',e=>e.click());
 await page.waitForFunction(title=>document.querySelector('.journey-active-lesson > header h2')?.textContent===title,{},journey.lessons[1].title);
 assert.equal((await request(a)).body.completed.length,1);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.course-completion-controls button:not([disabled])');
 assert.equal(await page.$eval('.journey-active-lesson > header h2',e=>e.textContent),journey.lessons[1].title);
 assert.equal((await request(b)).body.completed.length,0);
 await page.$eval('.journey-active-pagination > button',e=>e.click());await page.waitForFunction(title=>document.querySelector('.journey-active-lesson > header h2')?.textContent===title,{},journey.lessons[0].title);
 assert.equal(await page.$eval('.course-completion-controls input',e=>e.checked),true);
 record('signed-in browser deep-link cannot skip, Complete & Next persists after reload, Back works with checked completed lesson');
 // Real assessment engine output is saved, not owner/example data.
 const payload=designPayload('Artisan'),designId=await snapshot(a,'designid',{reportPayload:payload,summary:payload,scores:payload});
 state=await request(a);for(const key of ['designid','Artisan'])assert(state.body.awards.includes(key));assert(!state.body.awards.includes(idCourse.slug));assert(!state.body.awards.includes('Architect'));
 record('engine-scored saved DesignID awards DesignID + canonical primary Artisan, not a course or alternate design');
 // Browser tests both other navigator implementations before bulk full-pass QA.
 for(const course of [idCourse,passportCurriculum.find(c=>c.slug==='spiritual-gifts-service')]) {
  if(course.slug==='spiritual-gifts-service')await snapshot(a,'spiritual_gifts',{topGifts:[{label:'Teaching',score:15}]});
  await page.goto(base+'/courses/'+course.slug+'?lesson='+course.lessons.at(-1).slug,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.course-completion-controls button:not([disabled])');
  assert.equal(await page.$eval('.journey-active-lesson > header h2',e=>e.textContent),course.lessons[0].title);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile course checklist fits '+course.slug);
  await page.$eval('.course-completion-controls button',e=>e.click());
  await page.waitForFunction(title=>document.querySelector('.journey-active-lesson > header h2')?.textContent===title,{},course.lessons[1].title);
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.course-completion-controls button:not([disabled])');
  assert.equal((await request(a,null,course.slug)).body.completed.length,1);
 }
 await page.goto(base+'/learn/designid-foundations/'+idCourse.lessons.at(-1).slug,{waitUntil:'domcontentloaded'});await page.waitForSelector('.course-completion-controls button:not([disabled])');
 assert(page.url().includes('/courses/designid-foundations?lesson='));assert.equal(await page.$eval('.journey-active-lesson > header h2',e=>e.textContent),idCourse.lessons[1].title);
 record('DesignID and shared assessment-course navigators enforce skip gate, preserve standalone links, persist Complete & Next');
 // Keep derived DesignPD negative until completed saved report has its actual DesignID source.
 const pdPayload=load('lib/designpd/report.ts').buildDesignPdReportPayload({designIdSnapshot:{id:designId,assessment_type:'designid',scores:{reportPayload:payload,summary:payload,scores:payload},source:'passport_isolated_qa',created_at:new Date().toISOString(),source_submitted_at:new Date().toISOString()},participantName:'Passport QA',participantEmail:a.email,result:load('lib/designpd/engine.ts').scoreDesignPd({id:designId,assessment_type:'designid',scores:{reportPayload:payload,summary:payload,scores:payload},source:'passport_isolated_qa',created_at:new Date().toISOString(),source_submitted_at:new Date().toISOString()})});
 await snapshot(a,'designpd',{designIdSnapshotId:designId,reportPayload:pdPayload,pdfMonkey:{status:'ready'},channel:'native_app'},'designpd_app');
 assert((await request(a)).body.awards.includes('designpd'));
 record('DesignPD award requires saved completed derived report and retained actual DesignID source');
 const participant=check(await db.from('assessment_participants').insert({user_id:a.id,normalized_email:a.email,display_name:'Passport QA'}).select('id').single());participants.push(participant.id);
 const session=check(await db.from('fruitlife_360_sessions').insert({participant_id:participant.id,participant_email:a.email,self_completed_at:new Date().toISOString(),observer_goal:2,observer_completed_count:1,report_status:'ready',report_url:'https://example.invalid/qa-report',session_status:'report_ready',source_system:'passport_isolated_qa'}).select('id').single());
 assert(!(await request(a)).body.awards.includes('fruit_360'));
 check(await db.from('fruitlife_360_sessions').update({observer_completed_count:2}).eq('id',session.id));
 assert((await request(a)).body.awards.includes('fruit_360'));
 record('FruitLife ready report with missing required observer stays unearned; all required responses + completed report awards');
 // Finish canonical checklists through the real sequential API; opening final
 // lesson alone was already proved negative above.
 for(const course of passportCurriculum.filter(c=>c.slug!== 'design-pathways-discernment')) {
  const current=(await request(a,null,course.slug)).body.completed;
  for(const lesson of course.lessons)if(!current.includes(lesson.slug)){
   const before=await request(a,null,course.slug);
   if(lesson===course.lessons.at(-1) && course.slug!==journeySlug)assert(!before.body.awards.includes(course.slug));
   if(course.slug===idCourse.slug && lesson===course.lessons.at(-1)) {
    await page.goto(base+'/courses/'+course.slug+'?lesson='+lesson.slug,{waitUntil:'domcontentloaded'});await page.waitForSelector('.course-completion-controls button:not([disabled])');
    assert(!(await request(a,null,course.slug)).body.awards.includes(course.slug));
    assert.equal(await page.$eval('.course-completion-controls input',e=>e.checked),false);
    await page.$eval('.course-completion-controls button',e=>e.click());
    await page.waitForFunction(()=>document.querySelector('.course-completion-controls')?.textContent.includes('All lessons complete'));
   } else {
    const r=await request(a,{action:'complete-lesson',lessonSlug:lesson.slug},course.slug);assert.equal(r.status,200,JSON.stringify(r));
   }
  }
  console.log('CHECKLIST completed '+course.slug);
  const finished=(await request(a,null,course.slug)).body;assert.equal(finished.complete,true);assert.equal(finished.completed.length,course.lessons.length);
  if(course.slug!==journeySlug)assert(finished.awards.includes(course.slug));
 }
 state=await request(a);for(const name of ['DYD Journey Started','What is DYDD?','Identity','Expertise','Story','Desire','Gifts','Niche'])assert(state.body.awards.includes(name));assert(!state.body.awards.includes('Niche Declared'));
 record('all 71 Journey lessons + 67 assessment-course lessons completed sequentially; every chapter/course badge requires full checklist, Niche chapter does not award declaration');
 // Save all Niche pieces through actual reflection API, explicit completion last.
 const reflection=async(body)=>{const r=await fetch(base+'/api/course-reflections',{method:'POST',headers:{cookie:a.cookie,'Content-Type':'application/json'},body:JSON.stringify({courseSlug:journeySlug,...body})});const b=await r.json();assert(r.ok,JSON.stringify(b));return b;};
 const round=(await reflection({action:'ensure-round'})).round;
 for(const id of nicheRequiredPromptIds.slice(0,-1))await reflection({action:'save',roundId:round.id,questionId:id,response:'Saved working Pathfinder piece for '+id,expectedRevision:0});
 assert.equal((await request(a,{action:'declare-niche'})).status,409);
 await reflection({action:'save',roundId:round.id,questionId:'niche-working-declaration',response:'My saved working declaration.',expectedRevision:0});
 assert(!(await request(a)).body.awards.includes('Niche Declared'));
 await page.goto(base+'/journey?lesson=niche-pathfinder-preparing-your-niche-declaration-68',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.niche-declaration-completion button:not([disabled])');
 await page.$eval('.niche-declaration-completion button',e=>e.click());
 await page.waitForFunction(()=>document.querySelector('.niche-declaration-completion button')?.textContent.includes('earned'));
 assert((await request(a)).body.awards.includes('Niche Declared'));
 await reflection({action:'save',roundId:round.id,questionId:'niche-working-declaration',response:'My edited working declaration.',expectedRevision:1});
 assert((await request(a)).body.awards.includes('Niche Declared'));
 record('Niche requires every saved latest Pathfinder piece + declaration + explicit completion; editing later retains earned badge');
 // Final lesson revisit and desktop/mobile Passport interactions.
 await page.goto(base+'/courses/designid-foundations?lesson='+idCourse.lessons.at(-1).slug,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('.course-completion-controls')?.textContent.includes('All lessons complete'));
 for(const width of [1280,390,320]) {
  await page.setViewport({width,height:1000});await page.goto(base+'/hq#passport',{waitUntil:'domcontentloaded'});await page.waitForSelector('.passport-book');await readyPassport(page);
  assert.equal(await page.$eval('.passport-book-cover h2',e=>e.textContent),'DYDD Passport Book');
  assert(!await page.$eval('.passport-book-cover',e=>/trail record/.test(e.textContent)));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow '+width);
  for(const title of ['Niche Declared','Niche','DesignPD','DesignID Course','FruitLife360 Course']){
   await clickBadge(page,title);
   const earn=await page.$eval('.passport-badge-popover dd',e=>e.textContent);
   if(title.endsWith('Course'))assert(/every lesson.*checklist/.test(earn));
   if(title==='DesignPD')assert(earn.includes('$15') && earn.includes('no separate DesignPD assessment'));
  }
  if(width===1280){const button=await page.$('.passport-badge-button');await button.hover();assert.equal(await page.$eval('.passport-badge-popover h3',e=>e.textContent),'DYD Journey Started');}
  await (await page.$(".passport-book")).screenshot({path:`tmp/passport-${tag}-${width}.png`});
 }
 record('published-style Passport desktop hover and mobile click, exact heading, earned checklist rules, derived $15 copy, 1280/390/320px no overflow');
 assert.deepEqual(errors,[]);record('zero browser runtime errors');
 const emptyContext=await browser.createBrowserContext(),fresh=await emptyContext.newPage();await fresh.setCookie(...b.cookies.map(c=>({name:c.name,value:c.value,url:base})));
 for(const width of [1280,390]) {
  await fresh.setViewport({width,height:1000});await fresh.goto(base+'/hq#passport',{waitUntil:'domcontentloaded'});await readyPassport(fresh);
  for(const title of ['DesignPD','DesignID Course','Niche Declared']) {
   await clickBadge(fresh,title);
   assert((await fresh.$eval('.passport-badge-popover dd',e=>e.textContent)).length>80);
   assert.equal(await fresh.$eval('.passport-count-stamp > span',e=>e.textContent),'0');
  }
 }
 await emptyContext.close();record('unearned and locked desktop-mobile descriptions remain actionable; no cross-account awards leak');
 fs.writeFileSync(`tmp/passport-${tag}-qa.json`,JSON.stringify({base,verifiedAt:new Date().toISOString(),checks:evidence},null,2));
} finally {
 if(browser)await browser.close();
 if(snapshotIds.length)check(await db.from('assessment_snapshots').delete().in('id',snapshotIds));
 if(participants.length)check(await db.from('assessment_participants').delete().in('id',participants));
 for(const id of ids)check(await db.auth.admin.deleteUser(id));
 console.log('Synthetic QA accounts, reports, checklists, awards and sessions cleaned up.');
}
