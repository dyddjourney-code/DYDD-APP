// Non-delivering synthetic signed-in acceptance. Remote aliases require explicit readiness:
// SG_DEPLOYMENT_READY=1 SG_ENV=production node tests/spiritual-gifts-release.mjs
// SG_DEPLOYMENT_READY=1 SG_ENV=sandbox node tests/spiritual-gifts-release.mjs
// Local sandbox: SG_ENV=sandbox SG_BASE=http://127.0.0.1:3156 node tests/spiritual-gifts-release.mjs
// No assessment server action, report generation, provider request or mail is permitted.
import load from '../scripts/fruitlife-test-load.cjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const env = process.env.SG_ENV || 'sandbox';
assert(['sandbox','production'].includes(env));
const published = env === 'sandbox' ? 'https://dydd-online-school-sandbox.vercel.app' : 'https://dydd-online-school.vercel.app';
const base = new URL(process.env.SG_BASE || published).origin;
const local = ['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname);
assert(local || base === published, 'Unexpected published alias');
assert(local || process.env.SG_DEPLOYMENT_READY === '1', 'Parent must confirm deployment with SG_DEPLOYMENT_READY=1');
assert(!local || env === 'sandbox', 'Local acceptance must use sandbox fixtures');
const cfg = JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/' + (env === 'sandbox' ? 'dydd-online-school-sandbox' : 'dydd-online-school-supabase') + '.json'));
const ref = env === 'sandbox' ? 'atemrshtshxoqnuevvqu' : 'laojrzlqbkmirzcbcnyw';
assert.equal(new URL(cfg.project_url).hostname, ref+'.supabase.co');
const db=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const check=r=>{assert(!r.error,r.error?.message);return r.data;};
const slug='spiritual-gifts-service', anchor='/field-kit#collection-spiritual-gifts', section='#collection-spiritual-gifts';
const course=load('lib/passport/curriculum.ts').passportCurriculum.find(c=>c.slug===slug);
const {spiritualGiftQuestionBank:bank,spiritualGiftRatingField:field}=load('lib/spiritual-gifts/intake.ts');
assert(course?.lessons.length); assert(bank.length>6);
const final=course.lessons.at(-1), groups=Math.ceil(bank.length/6);
const out='tmp/spiritual-gifts-release'; fs.mkdirSync(out,{recursive:true});
const checks=[],screenshots=[],errors=[],cleanupErrors=[],accounts=[],unexpectedMutations=[];
const reason='isolated_spiritual_gifts_release_qa';
let browser,page,owner,participant,snapshot,storedPath,pdf,failure;
const api=async path=>{const r=await fetch(base+path,{headers:{cookie:owner.cookie}});assert.equal(r.status,200,path);return r.json();};
async function account(label){
 const a={email:`sg-release-${label}-${crypto.randomUUID()}@example.invalid`};accounts.push(a);
 check(await db.from('dydd_email_suppressions').insert({email:a.email,reason}));
 const password=crypto.randomBytes(30).toString('hex');
 a.uid=check(await db.auth.admin.createUser({email:a.email,password,email_confirm:true,user_metadata:{full_name:'Synthetic Spiritual Gifts QA'}})).user.id;
 let cookies=[];const c=createServerClient(cfg.project_url,cfg.anon_key,{cookies:{getAll:()=>cookies,setAll:v=>{cookies=v;}}});
 check(await c.auth.signInWithPassword({email:a.email,password}));a.cookies=cookies;a.cookie=cookies.map(c=>c.name+'='+c.value).join('; ');return a;
}
async function go(path){const r=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:90000});assert(r?.ok(),`${path}: ${r?.status()}`);assert.notEqual(new URL(page.url()).pathname,'/login');}
async function shot(name,fullPage=true){const path=`${out}/${env}-${local?'local':'published'}-${name}.png`;await page.screenshot({path,fullPage});screenshots.push(path);}
async function noOverflow(){
 const geometry=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('main,form,main fieldset,main section,main div')].map(e=>{const r=e.getBoundingClientRect();return{tag:e.tagName,className:e.className,x:r.x,width:r.width,right:r.right,clientWidth:e.clientWidth,scrollWidth:e.scrollWidth};}).filter(r=>r.right>innerWidth+1||r.scrollWidth>r.clientWidth+1).slice(0,20)}));
 if(geometry.scrollWidth>geometry.width+1)fs.writeFileSync(`${out}/${env}-${geometry.width}-overflow.json`,JSON.stringify({...geometry,path:new URL(page.url()).pathname},null,2));
 assert(geometry.scrollWidth<=geometry.width+1,'Overflow '+page.viewport().width+' '+page.url());
}
async function clickStable(selector){
 await page.$eval(selector,e=>e.scrollIntoView({behavior:'instant',block:'center'}));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.click(selector);
}
async function next(){await clickStable('.spiritual-gifts-step-controls .primary');}
async function setActive(n){await page.waitForFunction(n=>document.querySelector('.spiritual-gifts-step-panel.active')?.getAttribute('aria-labelledby')===`spiritual-gifts-set-${n}-title`,{},n);}
function validPdf(){const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 150] /Resources << >> /Contents 4 0 R >>','<< /Length 0 >>\nstream\n\nendstream'];let value='%PDF-1.4\n',offsets=[];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(value));value+=`${i+1} 0 obj\n${o}\nendobj\n`;});const x=Buffer.byteLength(value);return value+'xref\n0 5\n0000000000 65535 f \n'+offsets.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;}
try{
 // Anonymous login must resume last lesson and canonical origin, including retired lane entry.
 for(const suffix of ['', '&lane=fruitlife','&origin=trailheads']){
  const r=await fetch(`${base}/courses/${slug}?lesson=${final.slug}${suffix}`,{redirect:'manual'});
  assert([302,303,307].includes(r.status));const login=new URL(r.headers.get('location'),base);assert.equal(login.pathname,'/login');
  const dest=new URL(login.searchParams.get('next'),base);assert.equal(dest.pathname,'/courses/'+slug);assert.equal(dest.searchParams.get('lesson'),final.slug);assert.equal(dest.searchParams.get('origin'),'field-kit');assert.equal(dest.hash,'');
  assert.equal(dest.searchParams.get('lane'),suffix.includes('lane')?'fruitlife':null);
 }
 checks.push('Anonymous course resumes last lesson and field-kit default; old lane and old trailheads origin normalized');
 owner=await account('owner');
 participant=check(await db.from('assessment_participants').insert({user_id:owner.uid,normalized_email:owner.email,display_name:'Synthetic Spiritual Gifts QA'}).select('id').single()).id;
 // A genuine stored result row, never a live assessment submission or provider generation.
 snapshot=check(await db.from('assessment_snapshots').insert({user_id:owner.uid,participant_id:participant,assessment_type:'spiritual_gifts',source:'spiritual_gifts_release_isolated_qa',source_response_id:'qa-'+crypto.randomUUID(),source_submitted_at:new Date().toISOString(),scores:{topGifts:[{label:'Teaching',score:15,definition:'Synthetic saved teaching fixture.'},{label:'Mercy',score:14},{label:'Leadership',score:13},{label:'Service',score:12},{label:'Encouragement',score:11}],resultEmail:{sent:false,reason:'synthetic_qa_without_email'}}}).select('id').single()).id;
 const bucket='assessment-report-pdfs';assert.equal(check(await db.storage.getBucket(bucket)).public,false);
 pdf=validPdf();storedPath=`spiritual_gifts/${snapshot}/report.pdf`;
 check(await db.storage.from(bucket).upload(storedPath,Buffer.from(pdf),{contentType:'application/pdf',upsert:false}));
 const saved=check(await db.from('assessment_snapshots').select('scores').eq('id',snapshot).single());
 check(await db.from('assessment_snapshots').update({scores:{...saved.scores,reportArtifact:{bucket,path:storedPath,filename:'Synthetic Spiritual Gifts QA.pdf',archivedAt:new Date().toISOString(),bytes:Buffer.byteLength(pdf)}}}).eq('id',snapshot));
 check(await db.from('passport_lesson_completions').insert(course.lessons.slice(0,-1).map(l=>({user_id:owner.uid,course_slug:slug,lesson_slug:l.slug}))));
 const context=await api('/api/course-reflections?courseSlug='+slug);assert.equal(context.canStart,true);assert.equal(context.reports[0].id,snapshot);
 browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
 page=await browser.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 await page.setCookie(...owner.cookies.map(c=>({name:c.name,value:c.value,domain:new URL(base).hostname,path:'/'})));
 await page.setRequestInterception(true);
 page.on('request',r=>{const u=new URL(r.url());if(!['GET','HEAD','OPTIONS'].includes(r.method())){
   if(u.origin!==base || !['/api/course-reflections','/api/course-progress'].includes(u.pathname)){
    unexpectedMutations.push(`${r.method()} ${u.origin}${u.pathname}`);return r.abort();
   }
  }return r.continue();});
 for(const width of [1280,390,320]){
  console.log('Starting viewport '+width);
  await page.setViewport({width,height:1000});
  await go('/spiritual-gifts?channel=app');await page.waitForSelector('.spiritual-gifts-step-controls .primary:not([disabled])');
  // Initial SSR markup is enabled before hydration; wait for React to attach its actual handler.
  await page.waitForFunction(()=>{const b=document.querySelector('.spiritual-gifts-step-controls .primary');return Boolean(b&&Object.keys(b).some(k=>k.startsWith('__reactProps$')&&typeof b[k]?.onClick==='function'));});
  assert.equal(await page.$eval('[name=reviewer_email]',e=>e.value),owner.email);assert.equal(await page.$eval('[name=reviewer_name]',e=>e.value),'Synthetic Spiritual Gifts QA');assert.equal(await page.$eval('[name=identity_source]',e=>e.value),'account');
  // Capture the actual final Submit event in capture phase before React can invoke its server action.
  await page.evaluate(()=>{window.__sgCaptured=null;document.addEventListener('submit',e=>{if(!e.target.matches('.spiritual-gifts-form'))return;e.preventDefault();e.stopImmediatePropagation();window.__sgCaptured={entries:[...new FormData(e.target).entries()].map(([k,v])=>[k,String(v)]),submitter:e.submitter?.textContent};},true);});
  await next();await setActive(1);
  await next();await setActive(1);assert.equal(await page.$eval('.spiritual-gifts-step-panel.active input',e=>e.validity.valueMissing),true,'Unanswered set must not advance');
  const firstName=field(bank[0].code);
  const colors=[];
  for(const rating of [1,2,3,4,5]){
   const selector=`input[name="${firstName}"][value="${rating}"]`;
   await clickStable(selector+' + span');await page.waitForFunction(s=>document.querySelector(s)?.checked,{},selector);
   // Let any CSS transition settle; synchronize on the final computed token color.
   await page.waitForFunction(s=>{const span=document.querySelector(s)?.nextElementSibling;if(!span)return false;const p=document.createElement('i');p.style.backgroundColor='var(--green-dark)';document.body.appendChild(p);const expected=getComputedStyle(p).backgroundColor;const ok=getComputedStyle(span).backgroundColor===expected;p.remove();return ok;},{timeout:4000},selector);
   colors.push(await page.$eval(selector+' + span',e=>getComputedStyle(e).backgroundColor));
  }
  await noOverflow();await shot(`${width}-first-statement-selected`);console.log('PASS first statement 1–5 dark-green selections '+width);
  const expected={};
  for(let n=1;n<=groups;n++){
   await setActive(n);
   const questions=bank.slice((n-1)*6,n*6);
   for(const [i,q] of questions.entries()){
    const name=field(q.code),value=String(((n-1)*6+i)%5+1);expected[name]=value;
    const selector=`input[name="${name}"][value="${value}"]`;
    await clickStable(selector+' + span');await page.waitForFunction(s=>document.querySelector(s)?.checked,{},selector);
   }
   await noOverflow();console.log('Answered group '+n+'/'+groups+' at '+width);
   await next();
   if(n===1){
    await setActive(2);await clickStable('.spiritual-gifts-step-controls .secondary');await setActive(1);
    const retained=await page.$$eval('.spiritual-gifts-step-panel.active input:checked',es=>Object.fromEntries(es.map(e=>[e.name,e.value])));
    for(const q of questions)assert.equal(retained[field(q.code)],expected[field(q.code)]);
    await next();await setActive(2);
   }
  }
  await page.waitForSelector('.spiritual-gifts-reflection-card.active');
  // Preserve the final set too when returning from the reflection panel.
  await clickStable('.spiritual-gifts-step-controls .secondary');await setActive(groups);
  for(const q of bank.slice((groups-1)*6))assert.equal(await page.$eval(`input[name="${field(q.code)}"]:checked`,e=>e.value),expected[field(q.code)]);
  await next();await page.waitForSelector('.spiritual-gifts-reflection-card.active');
  const reflection=`Synthetic non-delivering QA ${width}`;await page.type('[name=next_step]',reflection);
  await page.waitForSelector('button[type=submit]:not([disabled])');await noOverflow();await shot(`${width}-reflection-before-intercept`);
  await page.click('button[type=submit]');await page.waitForFunction(()=>window.__sgCaptured);
  const capture=await page.evaluate(()=>window.__sgCaptured);assert.equal(capture.submitter,'Submit');const payload=Object.fromEntries(capture.entries);
  assert.equal(payload.reviewer_email,owner.email);assert.equal(payload.reviewer_name,'Synthetic Spiritual Gifts QA');assert.equal(payload.identity_source,'account');assert.equal(payload.signup_source,'app-spiritual-gifts-assessment');assert.equal(payload.next_step,reflection);
  assert.equal(capture.entries.filter(([k])=>Object.hasOwn(expected,k)).length,bank.length);
  for(const [name,value]of Object.entries(expected))assert.equal(payload[name],value,'Final rating '+name);
  console.log('PASS captured complete final payload '+width);
  checks.push({width,allFiveSelectedColors:colors,expectedToken:'--green-dark',allStatementRatingsCaptured:bank.length,groups,backPreserved:true,identityLocked:true,finalSubmitInterceptedBeforeReact:true,noOverflow:true});
  // Use actual saved Field Kit card links at each viewport.
  await go('/field-kit');await page.waitForSelector(section);
  const links=await page.$$eval(section+' a',es=>es.map(e=>({text:e.textContent.trim(),href:e.getAttribute('href')})));
  const view=links.find(l=>l.text==='View snapshot');const download=links.find(l=>/Download/.test(l.text));const entry=links.find(l=>l.href?.startsWith('/courses/'+slug));
  assert(view,'Actual View snapshot action missing');assert(download,'Actual Download PDF action missing');assert(entry,'Actual course action missing');
  assert.equal(view.href,`/api/artifacts/${snapshot}/download?view=snapshot`);assert(download.href.includes(snapshot));assert.equal(new URL(entry.href,base).searchParams.get('origin'),'field-kit');
  // Actual snapshot browser view proves the saved fixture, not a generic page.
  await go(view.href);assert((await page.$eval('main',e=>e.textContent)).includes('Synthetic saved teaching fixture.'));await noOverflow();await shot(`${width}-owned-snapshot`);
  for(const lane of ['', '&lane=fruitlife']){
   check(await db.from('passport_lesson_completions').delete().eq('user_id',owner.uid).eq('course_slug',slug).eq('lesson_slug',final.slug));
   await go(`/courses/${slug}?lesson=${final.slug}${lane}`);
   await page.waitForFunction(title=>document.querySelector('.assessment-active-lesson h2')?.textContent===title,{},final.title);
   assert.equal(await page.$eval('.course-nav a',e=>e.getAttribute('href')),anchor);
   await page.waitForFunction(()=>document.querySelector('.reflection-entry-setup button')||document.querySelector('.reflection-answer textarea:not([disabled])'));
   if(await page.$('.reflection-entry-setup button'))await page.$eval('.reflection-entry-setup button',e=>e.click());
   await page.waitForSelector('.reflection-answer textarea:not([disabled])');
   const response=`Synthetic Spiritual Gifts last lesson ${width}${lane}`;
   await page.$eval('.reflection-answer textarea',(e,text)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,text);e.dispatchEvent(new Event('input',{bubbles:true}));},response);
   await page.waitForSelector('.course-completion-controls > button:not([disabled])');await page.$eval('.course-completion-controls > button',e=>e.click());
   await page.waitForSelector('.course-completion-controls [role=status] a');assert.equal(await page.$eval('.course-completion-controls [role=status] a',e=>e.getAttribute('href')),anchor);
   const reflections=await api('/api/course-reflections?courseSlug='+slug);assert(reflections.entries.some(e=>e.question_id===final.slug&&e.response===response));assert.equal(reflections.rounds[0].assessment_snapshot_id,snapshot);
   const progress=await api('/api/course-progress?courseSlug='+slug);assert.equal(progress.complete,true);assert(progress.completed.includes(final.slug));
   await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(title=>document.querySelector('.assessment-active-lesson h2')?.textContent===title,{},final.title);await page.waitForSelector('.reflection-answer textarea:not([disabled])');assert.equal(await page.$eval('.reflection-answer textarea',e=>e.value),response);assert(await page.$eval('.course-completion-controls input',e=>e.checked));
   await noOverflow();await shot(`${width}-${lane?'legacy-lane':'normal'}-saved-final`);
   await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.$eval('.course-completion-controls [role=status] a',e=>e.click())]);
   assert.equal(new URL(page.url()).pathname+new URL(page.url()).search+new URL(page.url()).hash,anchor);
   await page.waitForSelector(section);await page.waitForFunction(selector=>{const r=document.querySelector(selector)?.getBoundingClientRect();return Boolean(r&&scrollY>100&&r.top<innerHeight*.7&&r.bottom>0);},{timeout:10000},section);
   await noOverflow();await shot(`${width}-${lane?'legacy-lane':'normal'}-anchored-card`,false);
   console.log('PASS final lesson persisted and anchored Continue '+width+' '+(lane?'fruitlife':'normal'));
   checks.push({width,lane:lane?'fruitlife':'normal',fieldKitCourseEntry:entry.href,viewSnapshot:view.href,download:download.href,finalReflectionPersisted:true,snapshotBinding:snapshot,courseCompleted:true,reloadPreserved:true,continueAndBack:anchor,exactCardScrolledIntoView:true});
  }
 }
 // Private artifact ownership, anonymous exact resume, direct stored bytes, and no regeneration.
 const path=`/api/artifacts/${snapshot}/download?download=1`;
 const anon=await fetch(base+path,{redirect:'manual'});assert([302,303,307].includes(anon.status));const login=new URL(anon.headers.get('location'),base);assert.equal(login.pathname,'/login');assert.equal(login.searchParams.get('next'),path);
 const stranger=await account('nonowner');assert.equal((await fetch(base+path,{headers:{cookie:stranger.cookie},redirect:'manual'})).status,404);
 assert.equal((await fetch(base+`/api/artifacts/${snapshot}/download?view=snapshot`,{headers:{cookie:stranger.cookie},redirect:'manual'})).status,404);
 const resolved=await fetch(base+path,{headers:{cookie:owner.cookie},redirect:'manual'});assert([302,303,307].includes(resolved.status));const signed=new URL(resolved.headers.get('location'));assert.equal(signed.origin,new URL(cfg.project_url).origin);assert(signed.pathname.includes('/storage/v1/object/sign/'+bucket+'/'));assert(signed.searchParams.has('token'));
 const bytes=await fetch(signed);assert.equal(bytes.status,200);assert.equal(Buffer.from(await bytes.arrayBuffer()).toString(),pdf);assert(!(await fetch(cfg.project_url+'/storage/v1/object/public/'+bucket+'/'+storedPath)).ok);
 checks.push('Private stored PDF: owner receives exact bytes; nonowner snapshot/download 404; anonymous login retains exact artifact; public storage inaccessible; zero provider generation');
 assert.deepEqual(errors,[]);assert.deepEqual(unexpectedMutations,[]);
}catch(e){failure=e;if(page)try{fs.writeFileSync(`${out}/${env}-failure-main.txt`,await page.$eval('main',e=>e.innerText));}catch{}}
finally{
 async function cleanup(label,fn){try{await fn();}catch(e){cleanupErrors.push(label+': '+e.message);}}
 if(failure&&page)await cleanup('failure screenshot',()=>shot('failure'));
 await cleanup('browser',async()=>{await browser?.close();});
 if(storedPath)await cleanup('private PDF',async()=>{check(await db.storage.from('assessment-report-pdfs').remove([storedPath]));});
 if(snapshot)await cleanup('snapshot',async()=>{check(await db.from('assessment_snapshots').delete().eq('id',snapshot));});
 if(participant)await cleanup('participant',async()=>{check(await db.from('assessment_participants').delete().eq('id',participant));});
 for(const a of accounts){
  // Check before deletion as well as after cascades, to expose accidental assessment writes.
  if(a.uid)await cleanup('zero assessment submissions '+a.email,async()=>{const r=await db.from('spiritual_gifts_sessions').select('id',{count:'exact',head:true}).eq('created_by_user_id',a.uid);check(r);assert.equal(r.count,0);});
  if(a.uid)await cleanup('auth and cascades',async()=>{check(await db.auth.admin.deleteUser(a.uid));for(const table of ['reflection_rounds','reflection_entries','passport_lesson_completions','passport_awards','assessment_snapshots']){const r=await db.from(table).select('user_id',{count:'exact',head:true}).eq('user_id',a.uid);check(r);assert.equal(r.count,0,table+' cleanup');}});
  await cleanup('zero provider intents '+a.email,async()=>{const r=await db.from('dydd_email_messages').select('id',{count:'exact',head:true}).eq('recipient',a.email);check(r);assert.equal(r.count,0);});
  await cleanup('lifecycle cleanup '+a.email,async()=>{for(const table of ['dydd_lifecycle_jobs','dydd_lifecycle_events']){check(await db.from(table).delete().eq('email',a.email));const r=await db.from(table).select('id',{count:'exact',head:true}).eq('email',a.email);check(r);assert.equal(r.count,0);}});
  await cleanup('suppression '+a.email,async()=>{check(await db.from('dydd_email_suppressions').delete().eq('email',a.email).eq('reason',reason));});
 }
 const proof={env,base,database:ref,at:new Date().toISOString(),passed:!failure&&!cleanupErrors.length,checks,screenshots,errors,unexpectedMutations,failure:failure?.stack,cleanupErrors,cleaned:cleanupErrors.length===0,syntheticOnly:true,fixtureEmailSuppressedBeforeCreate:true,zeroProviderIntents:!cleanupErrors.some(e=>e.startsWith('zero provider intents')),realAssessmentSubmission:false,pdfGenerated:false,emailSent:false};
 const proofPath=`${out}/${env}-${local?'local':'published'}.json`;fs.writeFileSync(proofPath,JSON.stringify(proof,null,2));console.log('Proof: '+proofPath);
}
if(failure)throw failure;assert.deepEqual(cleanupErrors,[]);console.log(`PASS Spiritual Gifts ${env}: ${checks.length} checks; complete cleanup; zero provider intents`);
