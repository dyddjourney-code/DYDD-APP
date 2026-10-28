// Sandbox-only isolated auth fixture; current/archived histories and reminder storage cleaned.
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
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const tag=base.startsWith('https:')?'published':'local';
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const slug='discover-your-divine-design',lesson='identity-the-designid-lens-what-is-in-the-report-19';
const catalog=load('lib/reflections/catalog.ts'),questions=catalog.getReflectionExperience(slug).questions;
assert.equal(catalog.withDesignIdLens(slug,questions),questions);
const approved=questions.filter(q=>q.lessonSlug===lesson);assert.equal(approved.length,4);
const units=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline.flatMap(m=>m.units);
const unit=units.find(u=>u.slug===lesson),draft=fs.readFileSync('content/journey/designid-lens-care-approved-2026-10-22.txt','utf8');
const legacy=questions.filter(q=>!q.id.startsWith(lesson)||q.id.endsWith('-connect')||q.id.endsWith('-reflect')).map(q=>q.lessonSlug===lesson?{...q,prompt:q.id.endsWith('-connect')?'What does this DesignID reflection help you notice?':'Where does this feel aligned, stretched, or in need of grace?'}:q);
let uid,browser;const errors=[],measurements=[];
const check=r=>{assert(!r.error,r.error?.message);return r.data;};
try{
 const email='lens-care-'+crypto.randomUUID()+'@example.invalid';uid=check(await admin.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('base64url'),email_confirm:true})).user.id;
 const archived=crypto.randomUUID(),current=crypto.randomUUID();
 check(await admin.from('reflection_rounds').insert([{id:archived,user_id:uid,course_slug:slug,questions:legacy,started_at:'2026-10-19T12:00:00Z'},{id:current,user_id:uid,course_slug:slug,questions:legacy,started_at:'2026-10-20T12:00:00Z'}]));
 const l=check(await admin.auth.admin.generateLink({type:'magiclink',email}));
 const login=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:l.properties.hashed_token,next:'/journey'}),redirect:'manual'});assert.equal(login.status,307);
 const cookies=login.headers.getSetCookie().map(x=>{const p=x.split(';')[0],i=p.indexOf('=');return {name:p.slice(0,i),value:p.slice(i+1),url:base};});const cookie=cookies.map(x=>x.name+'='+x.value).join('; ');
 const headers={Cookie:cookie,'Content-Type':'application/json'};
 const post=async body=>fetch(base+'/api/course-reflections',{method:'POST',headers,body:JSON.stringify({courseSlug:slug,...body})});
 const old=[];for(const q of legacy.filter(q=>q.lessonSlug===lesson)){const r=await post({action:'save',roundId:current,questionId:q.id,response:'Original preserved '+q.id,expectedRevision:0});assert.equal(r.status,200);old.push((await r.json()).entry);}
 const history=async()=>fetch(base+'/api/course-reflections?courseSlug='+slug,{headers}).then(r=>r.json());
 const h=await history();assert.equal(h.rounds[0].questions.filter(q=>q.lessonSlug===lesson).length,4);assert.deepEqual(h.rounds[1].questions,legacy);for(const e of old)assert.equal(h.entries.find(x=>x.id===e.id).response,e.response);
 browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});const page=await browser.newPage();await page.setCookie(...cookies);page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());if(u.origin===base&&(u.pathname==='/base-camp'||u.pathname==='/sandbox-review'||u.searchParams.has('review')))return r.abort();return r.continue();});
 const open=async path=>{await page.deleteCookie({name:'dydd_sandbox_review',url:base});await page.goto(base+path,{waitUntil:'domcontentloaded'});};
 for(const width of [1920,1280,768,390,320]){
  await page.setViewport({width,height:1000});await open('/journey?lesson='+lesson);await page.waitForSelector('.journey-designid-lens-care textarea:not([disabled])');await page.waitForFunction(()=>[...document.querySelectorAll('.journey-designid-lens-care img')].every(i=>i.complete&&i.naturalWidth));
  const root='.journey-designid-lens-care',text=await page.$eval(root,e=>e.textContent);
  assert.equal(await page.$(root+' .journey-care-divider'),null);assert.deepEqual(await page.$$eval(root+' [data-care-stage] > h4',es=>es.map(e=>e.textContent)),['Connect','Act','Reflect','Explore']);assert.equal(await page.$$eval(root+' textarea:not(.discussion-note)',es=>es.length),4);assert.equal(await page.$$eval(root+' .discussion-mark',es=>es.length),4);
  for(const q of approved){assert(text.includes(q.prompt));assert(draft.includes(q.prompt));}
  for(const line of draft.split('\n').slice(5,20).filter(x=>x.trim()))assert(text.includes(line),'approved line '+line);
  assert(text.includes('Moving to Next also saves your answers and reminders before you leave.'));assert(text.includes('It does not post or send anything to your class or Circle.'));
  for(const b of unit.lessonBody??[])for(const t of b.type==='list'?b.items:[b.text])assert((await page.$eval('.journey-active-lesson',e=>e.textContent)).includes(t),'Teaching unchanged');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width);
  const geometry=await page.$$eval(root+' [data-care-stage]',es=>es.map(e=>{const r=e.getBoundingClientRect();return {stage:e.dataset.careStage,x:r.x,y:r.y,w:r.width};}));
  if(width>600){assert.equal(geometry[0].y,geometry[1].y);assert.equal(geometry[2].y,geometry[3].y);}else assert(geometry.every((g,i)=>!i||g.y>geometry[i-1].y));
  if(width<=980)assert.equal(await page.$eval('.journey-course-index',e=>getComputedStyle(e).position),'static');
  const marker=await page.$eval(root+' .journey-care-marker',e=>({w:e.getBoundingClientRect().width,x:e.getBoundingClientRect().x,titleX:e.parentElement.querySelector('h3').getBoundingClientRect().x}));assert(marker.w<=94&&marker.x>marker.titleX,'compact right marker');
  await page.$eval(root,e=>e.scrollIntoView({block:'start',behavior:'instant'}));await(await page.$(root)).screenshot({path:`tmp/designid-care-${tag}-${width}.png`});measurements.push({width,geometry,marker});
 }
 const q=approved.find(q=>q.id.endsWith('-act')),selector='[data-question="'+q.id+'"]';
 const value='New Act answer '+crypto.randomUUID();await page.$eval(selector+' textarea',(e,t)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
 await page.$eval(selector+' .discussion-mark',e=>e.click());await page.$$eval('.journey-active-pagination button',es=>es.find(e=>e.textContent.startsWith('Next:')).click());await page.waitForFunction(()=>!document.querySelector('.journey-designid-lens-care'));
 assert((await history()).entries.some(e=>e.question_id===q.id&&e.response===value));
 await open('/field-kit/reflections/'+slug+'?view=discussion');await page.waitForFunction(s=>document.querySelector(s+' .reflection-read-answer')?.textContent.includes('New Act answer'),{},selector);assert(await page.$(selector+' .discussion-mark[aria-pressed="true"]'));
 await open('/journey?lesson='+lesson);await page.waitForFunction((s,v)=>document.querySelector(s+' textarea')?.value===v,{},selector,value);assert(await page.$(selector+' .discussion-mark[aria-pressed="true"]'));
 await page.$eval(selector+' .discussion-mark',e=>e.click());await page.waitForFunction(s=>document.querySelector(s+' .discussion-control [role=status]')?.textContent==='Saved',{},selector);assert.equal(await page.$eval(selector+' textarea',e=>e.value),value);
 const exp=await fetch(base+'/api/course-reflections/export?courseSlug='+slug+'&scope=course',{headers});assert.equal(exp.status,200);const exported=await exp.text();assert(exported.includes(value));for(const e of old)assert(exported.includes(e.response));
 const stored=check(await admin.from('reflection_rounds').select('id,questions').eq('user_id',uid));assert.deepEqual(stored.find(r=>r.id===archived).questions,legacy);
 assert.deepEqual(errors,[]);fs.writeFileSync(`tmp/designid-care-${tag}-measurements.json`,JSON.stringify(measurements,null,2));console.log('PASS '+tag+' fivewidths/exactapprovedcopy/loadedcompactrighticon/nooverflow; legacy active upgrade + archived snapshots and old entries unchanged; actual Act save + mark + immediate Next + FieldKit + reopen + unmark preserves answer + text export; no runtime errors');
}finally{if(browser)await browser.close();if(uid){check(await admin.storage.from('assessment-report-pdfs').remove([`private-discussion-reminders/user-${uid}.json`,`private-discussion-reminders/user-${uid}.lock`]));check(await admin.auth.admin.deleteUser(uid));assert.equal(check(await admin.from('reflection_rounds').select('id').eq('user_id',uid)).length,0);console.log('CLEANUP isolated auth/rounds/entries/reminder fixtures removed; no customer or preview writes');}}
