/** Real signed-in synthetic persistence QA. Never submits assessments, approves messages,
 * finalizes communication, or calls delivery routes. Suppression precedes auth creation.
 * COURSE_BASE is mandatory: use the new local build, or a deployment AFTER release.
 * COURSE_ENV=sandbox COURSE_BASE=http://localhost:PORT node tests/journey-circle-published.mjs
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';

const env=process.env.COURSE_ENV || 'sandbox';
assert(['sandbox','production'].includes(env));
assert(process.env.COURSE_BASE,'Set COURSE_BASE explicitly; do not test older production source.');
const base=process.env.COURSE_BASE.replace(/\/$/,'');
const expectedHost=env==='sandbox'?'dydd-online-school-sandbox.vercel.app':'dydd-online-school.vercel.app';
assert(['localhost','127.0.0.1',expectedHost].includes(new URL(base).hostname));
assert(!new URL(base).search && new URL(base).pathname==='/');
const ref=env==='sandbox'?'atemrshtshxoqnuevvqu':'laojrzlqbkmirzcbcnyw';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/'+(env==='sandbox'?'dydd-online-school-sandbox':'dydd-online-school-supabase')+'.json'));
assert.equal(new URL(cfg.project_url).hostname,ref+'.supabase.co');
const db=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const ok=r=>{assert(!r.error,r.error?.message);return r.data;};
const slug='discover-your-divine-design', path='/api/course-reflections';
const out=process.env.JOURNEY_CIRCLE_QA_OUT || 'tmp/journey-circle-'+env+'-'+Date.now();
fs.mkdirSync(out,{recursive:true});
const users=[],snapshots=[],circleIds=[],checks=[],runtimeErrors=[],blockedDelivery=[],cleanupErrors=[];
const record=message=>{checks.push(message);console.log('PASS '+message);};
const sourceIds=r=>JSON.parse(r.source.replace(/^journey-assessments-v1:/,'')).map(s=>s.id).sort();
const expectSources=(r,ids)=>assert.deepEqual(sourceIds(r),[...ids].sort(),'Round keeps exactly its named assessment sources');
let browser,completed=false,zeroProviderIntents=true;
async function api(user,url,body){
 const response=await fetch(base+url,{method:body?'POST':'GET',headers:{...(user?{cookie:user.cookie}:{}),...(body?{'Content-Type':'application/json',origin:base}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const text=await response.text();let data;try{data=JSON.parse(text);}catch{throw Error(`Non-JSON ${response.status} at ${url}: ${text.slice(0,180)}`);}
 return {status:response.status,body:data};
}
async function user(){
 const email='journey-circle-'+crypto.randomUUID()+'@example.invalid', password=crypto.randomBytes(28).toString('hex');
 const fixture={email,id:null,cookies:[],cookie:'',accessToken:''};users.push(fixture);
 ok(await db.from('dydd_email_suppressions').insert({email,reason:'isolated_journey_circle_qa'}));
 fixture.id=ok(await db.auth.admin.createUser({email,password,email_confirm:true})).user.id;
 const client=createServerClient(cfg.project_url,cfg.anon_key,{cookies:{getAll:()=>fixture.cookies,setAll:cs=>{fixture.cookies=cs;}}});
 fixture.accessToken=ok(await client.auth.signInWithPassword({email,password})).session.access_token;fixture.cookie=fixture.cookies.map(c=>c.name+'='+c.value).join('; ');return fixture;
}
async function snapshot(user,type,date,primary="Architect"){
 const scores=type==='designid'?{scores:{Architect_Pts:40,Artisan_Pts:30,Shepherd_Pts:20,Steward_Pts:10},summary:{Primary:primary,Secondary:primary==='Architect'?'Artisan':'Architect'}}:{topGifts:[{label:'Teaching',score:10},{label:'Mercy',score:9}]};
 const id=ok(await db.from('assessment_snapshots').insert({user_id:user.id,assessment_type:type,source:'isolated_journey_circle_qa',source_response_id:'qa-'+crypto.randomUUID(),source_submitted_at:date,scores}).select('id').single()).id;
 snapshots.push(id);return id;
}
async function context(user){const r=await api(user,path+'?courseSlug='+slug);assert.equal(r.status,200);assert.equal(r.body.signedIn,true);return r.body;}
async function save(user,round,q,response){const r=await api(user,path,{action:'save',courseSlug:slug,roundId:round.id,questionId:q.id,response,expectedRevision:0});assert.equal(r.status,200,JSON.stringify(r.body));return r;}
async function goto(page,url){await page.goto(base+url,{waitUntil:'domcontentloaded',timeout:60000});}
async function clickText(page,scope,text){
 const found=await page.$$eval(scope+' button',(els,t)=>{const b=els.find(b=>b.textContent.trim()===t);if(!b)return false;b.click();return true;},text);
 assert(found,`Button ${text} in ${scope}`);
}
async function fill(page,selector,value){await page.$eval(selector,(e,t)=>{const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},value);}
async function roundWrite(page,action){
 const response=page.waitForResponse(r=>new URL(r.url()).pathname===path && r.request().method()==='POST' && JSON.parse(r.request().postData()||'{}').action===action,{timeout:30000});
 return response;
}
try {
 const learner=await user(),other=await user();
 const oldDesign=await snapshot(learner,'designid','2026-01-01T12:00:00Z');
 const oldGifts=await snapshot(learner,'spiritual_gifts','2026-01-02T12:00:00Z');
 const foreign=await snapshot(other,'designid','2026-01-03T12:00:00Z');
 const eligible=await context(learner);
 assert.deepEqual(eligible.journeyReports.map(r=>r.assessmentType).sort(),['designid','spiritual_gifts']);
 assert(!JSON.stringify(eligible).includes(foreign));
 const ensured=await Promise.all([1,2].map(()=>api(learner,path,{action:'ensure-round',courseSlug:slug})));
 assert(ensured.every(r=>[200,201].includes(r.status)),JSON.stringify(ensured));
 const original=ensured[0].body.round;assert.equal(ensured[1].body.round.id,original.id);expectSources(original,[oldDesign,oldGifts]);
 const q=original.questions.find(q=>q.id==='child-of-god-response');assert(q,'Stable current Journey reflection exists');
 const answer='Private real persisted Journey reflection '+crypto.randomUUID();
 await save(learner,original,q,answer);
 const foreignRound=(await api(other,path,{action:'ensure-round',courseSlug:slug})).body.round;
 const foreignAnswer='FOREIGN PRIVATE RESPONSE '+crypto.randomUUID();await save(other,foreignRound,q,foreignAnswer);
 let state=await context(learner);assert.equal(state.rounds.length,1);assert(state.entries.some(e=>e.response===answer));
 assert(!JSON.stringify(state).includes(foreignAnswer));assert(!state.rounds.some(r=>r.id===foreignRound.id));
 const foreignWrite=await api(learner,path,{action:'save',courseSlug:slug,roundId:foreignRound.id,questionId:q.id,response:'Forbidden overwrite',expectedRevision:1});
 assert.equal(foreignWrite.status,404);assert(!JSON.stringify(foreignWrite.body).includes(foreignAnswer));
 record('Both completed synthetic assessment types eligible; concurrent ensure-round is idempotent; real answer persistence; foreign workbook read/write privacy');
 browser=await puppeteer.launch({args:chromium.args.filter(a=>a!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
 const page=await browser.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>runtimeErrors.push(e.message));page.on('dialog',dialog=>void dialog.accept());
 await page.setCookie(...learner.cookies.map(c=>({name:c.name,value:c.value,domain:new URL(base).hostname,path:'/'})));
 await page.setRequestInterception(true);
 page.on('request',request=>{
  const u=new URL(request.url());
  // Defense in depth: never permit browser provider delivery/communication activation.
  if(u.origin===base && request.method()==='POST' && /\/api\/(?:email|lifecycle)|\/api\/circles\/messages/.test(u.pathname)){
   blockedDelivery.push(u.pathname);return request.abort();
  }
  return request.continue();
 });
 for(const width of [1280,390,320]){
  await page.setViewport({width,height:1000});await goto(page,'/field-kit/reflections/'+slug);
  await page.waitForSelector('.reflection-round-controls select');
  assert.equal(await page.$eval('h1',e=>e.textContent),'Your Journey Reflections');
  assert((await page.$eval('.reflection-notebook-hero',e=>e.textContent)).includes('private saved Journey writing'),'Direct saved-writing explanation visible');
  const article='#reflection-'+q.id;await page.waitForSelector(article);
  await page.$eval(article,e=>{for(let parent=e;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;});
  await page.waitForSelector(article,{visible:true});
  await page.waitForFunction(({s,t})=>document.querySelector(s)?.innerText.includes(t),{}, {s:article,t:answer});
  const sources=await page.$eval('.journey-assessment-sources',e=>e.textContent);assert(sources.includes('DesignID:'));assert(sources.includes('Spiritual Gifts:'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Field Kit no overflow '+width);
  await page.screenshot({path:out+'/field-kit-review-'+width+'.png'});
 }
 // Seed only synthetic prior lesson completions to respect the unchanged sequential checklist.
 const journeyLessons=load('lib/passport/curriculum.ts').passportCurriculum.find(c=>c.slug===slug).lessons;
 const targetIndex=journeyLessons.findIndex(l=>l.slug===q.lessonSlug);assert(targetIndex>0);
 ok(await db.from('passport_lesson_completions').insert(journeyLessons.slice(0,targetIndex).map(l=>({user_id:learner.id,course_slug:slug,lesson_slug:l.slug}))));
 record('Direct desktop/mobile review shows saved writing without connection choices');
 // Actual Journey input saves into the same current round, then survives a new page load.
 await goto(page,'/journey?lesson='+q.lessonSlug);
 const selector='.journey-active-lesson [data-question="'+q.id+'"] textarea:not(.discussion-note)';await page.waitForSelector(selector+':not([disabled])');
 assert.equal(await page.$eval(selector,e=>e.value),answer);
 const browserAnswer=answer+' — edited in the real signed-in Journey';
 await fill(page,selector,browserAnswer);
 await page.waitForSelector('.course-completion-controls > button:not([disabled])');
 const writing=roundWrite(page,'save');await page.$eval('.course-completion-controls > button',e=>e.click());assert.equal((await writing).status(),200);
 await page.waitForFunction(s=>!document.querySelector(s),{},selector);
 await goto(page,'/field-kit/reflections/'+slug);await page.waitForFunction(t=>document.body.textContent.includes(t),{},browserAnswer);
 record('Desktop/mobile direct Field Kit Review and current saved answer; actual Journey typing saves the same workbook');
 // Fresh writing and selecting newer assessments are separate real UI actions.
 await page.$eval('.reflection-workbook-settings',e=>e.open=true);
 const freshWrite=roundWrite(page,'new-round');await clickText(page,'.reflection-round-controls','Start a new reflection round');
 assert.equal((await freshWrite).status(),201);await page.waitForFunction(id=>document.querySelector('.reflection-round-controls select')?.value!==id,{},original.id);
 state=await context(learner);const fresh=state.rounds[0];assert.notEqual(fresh.id,original.id);expectSources(fresh,[oldDesign,oldGifts]);
 assert(state.entries.some(e=>e.round_id===original.id && e.response===browserAnswer));assert(!state.entries.some(e=>e.round_id===fresh.id));
 const freshAnswer='Fresh round private writing '+crypto.randomUUID();await save(learner,fresh,q,freshAnswer);
 const giftsFirst=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline.find(m=>m.slug==='gifts').units[0].slug;
 const giftsIndex=journeyLessons.findIndex(l=>l.slug===giftsFirst);
 ok(await db.from('passport_lesson_completions').insert(journeyLessons.slice(targetIndex+1,giftsIndex).map(l=>({user_id:learner.id,course_slug:slug,lesson_slug:l.slug}))));
 const later=await snapshot(learner,'designid',new Date(Date.now()+60000).toISOString(),'Artisan');
 state=await context(learner);assert.equal(state.rounds[0].id,fresh.id);expectSources(state.rounds[0],[oldDesign,oldGifts]);
 const reensure=await api(learner,path,{action:'ensure-round',courseSlug:slug});assert.equal(reensure.body.round.id,fresh.id);expectSources(reensure.body.round,[oldDesign,oldGifts]);
 await goto(page,'/journey?lesson=identity-the-designid-lens-what-is-in-the-report-19');await page.waitForSelector('.journey-designid-labels');assert.equal(await page.$eval('.journey-designid-labels dd',e=>e.textContent),'Architect','New assessment must not silently replace round teaching values');
 await goto(page,'/field-kit/reflections/'+slug);await page.waitForSelector('.journey-assessment-sources details');
 assert.equal((await context(learner)).rounds.length,2,'Loading newer results must not silently create a round');
 await page.$eval('.journey-assessment-sources details',e=>e.open=true);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Open assessment choices fit mobile viewport');
 assert.deepEqual(await page.$$eval('.journey-assessment-sources details label',els=>els.map(e=>e.childNodes[0].textContent.trim())),['DesignID result','Spiritual Gifts result']);
 await page.select('.journey-assessment-sources details label:first-of-type select',later);
 await page.select('.journey-assessment-sources details label:nth-of-type(2) select',oldGifts);
 assert.equal((await context(learner)).rounds[0].id,fresh.id,'Changing dropdowns alone never changes saved workbook');
 const selectedWrite=roundWrite(page,'new-round');await clickText(page,'.journey-assessment-sources','Use selected assessment results in a new round');assert.equal((await selectedWrite).status(),201);
 await page.waitForFunction(id=>document.querySelector('.reflection-round-controls select')?.value!==id,{},fresh.id);
 state=await context(learner);const selected=state.rounds[0];expectSources(selected,[later,oldGifts]);assert.equal(state.rounds.length,3);
 expectSources(state.rounds.find(r=>r.id===original.id),[oldDesign,oldGifts]);expectSources(state.rounds.find(r=>r.id===fresh.id),[oldDesign,oldGifts]);
 assert(state.entries.some(e=>e.round_id===fresh.id && e.response===freshAnswer));assert(state.entries.some(e=>e.round_id===original.id && e.response===browserAnswer));
 await goto(page,'/journey?lesson=identity-the-designid-lens-what-is-in-the-report-19');await page.waitForSelector('.journey-designid-labels');assert.equal(await page.$eval('.journey-designid-labels dd',e=>e.textContent),'Artisan','Explicit selection changes current round teaching values');
 const giftsLesson=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline.find(m=>m.slug==='gifts').units[0].slug;await goto(page,'/journey?lesson='+giftsLesson);await page.waitForSelector('.journey-gifts-snapshot');assert((await page.$eval('.journey-gifts-snapshot',e=>e.textContent)).includes('Teaching'));
 const before=state.rounds.map(r=>({id:r.id,source:r.source}));
 for(const ids of [[foreign,oldGifts],[oldDesign,later]]){
  const rejected=await api(learner,path,{action:'new-round',courseSlug:slug,journeyAssessmentIds:ids});assert.equal(rejected.status,400);assert(!JSON.stringify(rejected.body).includes(foreignAnswer));
 }
 const rejected=await api(learner,path,{action:'new-round',courseSlug:slug,assessmentSnapshotId:foreign});assert.equal(rejected.status,400);
 assert.deepEqual((await context(learner)).rounds.map(r=>({id:r.id,source:r.source})),before,'Invalid selections cannot mutate rounds');
 await goto(page,'/field-kit/reflections/'+slug+'?round='+original.id);await page.waitForFunction(id=>document.querySelector('.reflection-round-controls select')?.value===id,{},original.id);
 await page.waitForFunction(t=>document.body.textContent.includes(t),{},browserAnswer);
 record('Fresh round retains both sources and archived writing; newer result does not mutate automatically; named assessment selection creates distinct empty round; foreign and duplicate-type result IDs rejected without mutation');
 // Genuine work ahead is saved before a Circle exists and must remain untouched by calendar edits.
 const ahead=selected.questions.findLast(q=>q.lessonSlug && q.id!=='niche-working-declaration');assert(ahead);
 const aheadAnswer='Already completed future-module work '+crypto.randomUUID();await save(learner,selected,ahead,aheadAnswer);
 ok(await db.from('passport_lesson_completions').insert({user_id:learner.id,course_slug:slug,lesson_slug:ahead.lessonSlug}));
 const progressBefore=ok(await db.from('passport_lesson_completions').select('course_slug,lesson_slug,completed_at').eq('user_id',learner.id));
 await goto(page,'/camp-circle/my-circles');await page.waitForSelector('#plan-name');
 await fill(page,'#plan-name','Isolated Journey Circle QA');await clickText(page,'.circle-planner-fields','Continue');await page.waitForSelector('#plan-date');
 await fill(page,'#plan-date','2027-01-07');await page.select('#plan-rhythm','Every other week');
 const timeLabels=await page.$$eval('fieldset label',els=>els.filter(e=>['Hour','Minute','AM/PM'].includes(e.childNodes[0]?.textContent.trim())).map(e=>({text:e.childNodes[0].textContent.trim(),id:e.htmlFor})));assert.equal(timeLabels.length,3);
 for(const [label,value] of [['Hour','5'],['Minute','30'],['AM/PM','PM']]){const control=timeLabels.find(l=>l.text===label);await page.select('[id="'+control.id+'"]',value);assert(await page.$eval('[id="'+control.id+'"]',e=>e.getBoundingClientRect().height>=48));}
 assert((await page.$eval('fieldset',e=>e.textContent)).includes('5:30 PM'));
 assert.equal(await page.$eval('#meeting-count',e=>e.value),'8','Default eight meetings');
 assert.equal(await page.$('.circle-form-error'),null,'No manual assignment or refresh prerequisite');
 await clickText(page,'.circle-planner-fields','Continue');await page.waitForSelector('#participant-name');
 // Host only; no invited people, addresses, or message generation.
 await clickText(page,'.circle-planner-fields','Continue');
 const creation=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/circles' && r.request().method()==='POST');
 await clickText(page,'.circle-planner-fields','Create Circle');const created=await creation;assert.equal(created.status(),200);const circle=(await created.json()).circle;circleIds.push(circle.id);
 assert.equal(circle.status,'active');assert.equal(circle.plan.meetingCount,8);assert.equal(circle.plan.rhythm,'Every other week');assert.equal(circle.plan.participants.length,0);assert.equal(circle.plan.time,'17:30');
 const curriculum=load('lib/circles/plan.ts').circleCurriculum;
 assert.deepEqual(Object.keys(circle.plan.assignments).sort(),curriculum.map(l=>l.slug).sort(),'Every current lesson assigned automatically');
 const meetings=curriculum.map(l=>circle.plan.assignments[l.slug]);assert(meetings.every(n=>Number.isInteger(n)&&n>=1&&n<=8));assert.deepEqual([...new Set(meetings)],[1,2,3,4,5,6,7,8]);assert(meetings.every((n,i)=>!i||n>=meetings[i-1]),'Initial curriculum order');
 const dates=load('lib/circles/plan.ts').scheduledDates(circle.plan);assert.equal(dates.length,8);assert(dates.slice(1).every((d,i)=>Date.parse(d)-Date.parse(dates[i])===14*86400000));
 // Existing custom choice is intentionally unlike the automatic allocation.
 const custom={...circle.plan,assignments:{...circle.plan.assignments,[curriculum[0].slug]:2}};
 const customized=await api(learner,'/api/circles',{id:circle.id,revision:circle.revision,status:'active',plan:custom});assert.equal(customized.status,200);
 await goto(page,'/camp-circle/my-circles?circle='+circle.id);await page.waitForSelector('.circle-action-row[aria-label="Circle workspace sections"]');
 await clickText(page,'.circle-action-row[aria-label="Circle workspace sections"]','Schedule');await page.waitForSelector('#meeting-count');
 await page.$eval('.circle-breaks',e=>e.open=true);await fill(page,'#break-start','2027-02-04');await fill(page,'#break-end','2027-02-04');await clickText(page,'.circle-breaks','Add break');
 const calendarSave=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/circles' && r.request().method()==='POST');await clickText(page,'#start-circle','Save changes');assert.equal((await calendarSave).status(),200);
 let persisted=(await api(learner,'/api/circles')).body.circles.find(c=>c.id===circle.id);assert.deepEqual(persisted.plan.assignments,custom.assignments);assert.equal(persisted.plan.meetingCount,8);assert.deepEqual(persisted.plan.breaks,[{start:'2027-02-04',end:'2027-02-04'}]);
 // Change start date + rhythm through the actual existing-Circle editor.
 await clickText(page,'#start-circle','Edit Circle details');await page.waitForSelector('#plan-name');await clickText(page,'.circle-planner-fields','Continue');await page.waitForSelector('#plan-date');
 await fill(page,'#plan-date','2027-01-14');await page.select('#plan-rhythm','Weekly');
 const changed=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/circles' && r.request().method()==='POST');await clickText(page,'.circle-planner-fields','Save changes');assert.equal((await changed).status(),200);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.circle-action-row[aria-label="Circle workspace sections"]');
 persisted=(await api(learner,'/api/circles')).body.circles.find(c=>c.id===circle.id);assert.equal(persisted.plan.startDate,'2027-01-14');assert.equal(persisted.plan.rhythm,'Weekly');assert.equal(persisted.plan.meetingCount,8);assert.deepEqual(persisted.plan.assignments,custom.assignments);
 assert.deepEqual(ok(await db.from('passport_lesson_completions').select('course_slug,lesson_slug,completed_at').eq('user_id',learner.id)),progressBefore);
 state=await context(learner);assert(state.entries.some(e=>e.round_id===selected.id&&e.response===aheadAnswer));assert.equal(state.rounds[0].id,selected.id);expectSources(state.rounds[0],[later,oldGifts]);
 const otherCircles=await api(other,'/api/circles');assert(!otherCircles.body.circles.some(c=>c.id===circle.id));assert.equal((await api(other,'/api/circles/data?circleId='+circle.id)).status,404);
 await clickText(page,'.circle-action-row[aria-label="Circle workspace sections"]','Schedule');await page.waitForSelector('#meeting-count');await page.screenshot({path:out+'/circle-preserved-schedule.png'});
 record('Real Circle wizard persists eight biweekly meetings with every lesson automatically assigned; saved custom assignment, holiday, date/rhythm changes survive reload; prior work-ahead answers/progress/sources untouched; foreign Circle private');
 // Preserve an unavailable original source while replacing the OTHER assessment.
 ok(await db.from('assessment_snapshots').delete().eq('id',later));
 const newerGifts=await snapshot(learner,'spiritual_gifts',new Date(Date.now()+120000).toISOString());
 await goto(page,'/field-kit/reflections/'+slug);await page.waitForSelector('.journey-assessment-sources details');await page.$eval('.journey-assessment-sources details',e=>e.open=true);
 assert((await page.$eval('.journey-assessment-sources details',e=>e.textContent)).includes('original saved reference; report unavailable'));
 await page.select('.journey-assessment-sources details label:nth-of-type(2) select',newerGifts);
 const unavailableWrite=roundWrite(page,'new-round');await clickText(page,'.journey-assessment-sources','Use selected assessment results in a new round');assert.equal((await unavailableWrite).status(),201);state=await context(learner);expectSources(state.rounds[0],[later,newerGifts]);
 record('Current round teaching binds explicit DesignID result and saved Spiritual Gifts; missing original result reference retained while changing other instrument');
 assert.deepEqual(runtimeErrors,[]);assert.deepEqual(blockedDelivery,[],'No browser delivery attempts');completed=true;
 console.log('PASS '+env+' signed-in Journey + Circle persistence ('+checks.length+' groups)');
} catch(error) {
 if(browser){const pages=await browser.pages();const page=pages.at(-1);if(page){await page.screenshot({path:out+'/failure.png',fullPage:true}).catch(()=>{});fs.writeFileSync(out+'/failure-state.json',JSON.stringify({url:page.url(),text:await page.evaluate(()=>document.body.innerText).catch(()=>''),error:String(error)},null,2));}}
 throw error;
} finally {
 await browser?.close().catch(e=>cleanupErrors.push(e.message));
 // Keep suppression until auth, lifecycle cleanup and zero provider-intent assertions finish.
 const attempt=async fn=>{try{await fn();}catch(e){cleanupErrors.push(e.message);}};
 for(const u of users){
  if(u.id)await attempt(async()=>{
   // Explicit delete also covers a Circle created just before a browser assertion failed.
   ok(await db.from('journey_circle_plans').delete().eq('user_id',u.id));
   ok(await db.storage.from('assessment-report-pdfs').remove([`private-discussion-reminders/user-${u.id}.json`,`private-discussion-reminders/user-${u.id}.lock`]));
   if(u.accessToken)ok(await db.auth.admin.signOut(u.accessToken,'global'));
  });
  if(u.id)await attempt(async()=>{ok(await db.auth.admin.deleteUser(u.id));
   for(const table of ['journey_circle_plans','reflection_rounds','reflection_entries','passport_lesson_completions','assessment_snapshots']){const r=await db.from(table).select('user_id',{head:true,count:'exact'}).eq('user_id',u.id);ok(r);assert.equal(r.count,0,table+' complete cleanup');}
  });
  let zeroIntents=false;
  await attempt(async()=>{for(const table of ['dydd_lifecycle_jobs','dydd_lifecycle_events'])ok(await db.from(table).delete().eq('email',u.email));
   const intents=await db.from('dydd_email_messages').select('id',{head:true,count:'exact'}).eq('recipient',u.email);ok(intents);assert.equal(intents.count,0,'Zero provider message intents');zeroIntents=true;
  });
  if(!zeroIntents)zeroProviderIntents=false;
  if(zeroIntents)await attempt(async()=>{ok(await db.from('dydd_email_suppressions').delete().eq('email',u.email).eq('reason','isolated_journey_circle_qa'));});
 }
 fs.writeFileSync(out+'/proof.json',JSON.stringify({env,base,database:ref,completed,checks,runtimeErrors,blockedDelivery,cleanupErrors,cleaned:cleanupErrors.length===0,syntheticOnly:true,suppressionBeforeAuth:true,noAssessmentSubmission:true,noMessageApprovalOrFinalize:true,zeroProviderIntents},null,2));
 assert.deepEqual(cleanupErrors,[],'Synthetic cleanup must succeed: '+cleanupErrors.join('; '));
 console.log('CLEANUP verified; zero provider intents. Evidence: '+out+'/proof.json');
}
