import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const base=process.env.JOHN_TEST_BASE||'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const errors=[],posts=[];let userId;
const canonical=JSON.parse(fs.readFileSync('content/designid-shadow-canonical.json'));
const catalog=load('lib/courses/course-catalog.ts');
const routes=['designid-foundations','spiritual-gifts-service','fruitlife-360-formation','designpd-alignment'];
const lesson='identity-the-designid-lens-what-is-in-the-report-19';
const bucket=admin.storage.from('assessment-report-pdfs');
async function storage(path){const r=await bucket.download(path,{cacheNonce:crypto.randomUUID()});if(r.error){assert(['400','404'].includes(String(r.error.statusCode)));return null;}return await r.data.text();}
const preserved={};for(const path of ['sandbox-profiles/jordan.json','preview-reflections/new/discover-your-divine-design.json','private-discussion-reminders/preview-new.json'])preserved[path]=await storage(path);
async function monitor(p){await p.setRequestInterception(true);p.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname==='/api/course-reflections'){try{if(JSON.parse(r.postData()||'{}').action==='position')return r.respond({status:200,contentType:'application/json',body:'{}'});}catch{}}return r.continue();});p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()==='POST')posts.push(new URL(r.url()).pathname)});}
const go=(p,path)=>p.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});
async function activate(p,selector,path){
 await p.waitForSelector(selector,{visible:true});
 await p.$eval(selector,e=>e.click());
 await p.waitForFunction(expected=>location.pathname===expected,{timeout:60000},path);
}
try{
 for(const entry of ['owner','new']){
  const ctx=await browser.createBrowserContext(),p=await ctx.newPage();await monitor(p);await p.setViewport({width:1280,height:1000});await go(p,'/');await p.waitForSelector('form button');await p.waitForSelector('a[href="/owner"]');
  await activate(p,entry==='owner'?'a[href="/owner"]':'form button',entry==='owner'?'/command-center':'/hq');
  assert.equal(new URL(p.url()).pathname,entry==='owner'?'/command-center':'/hq');
  await activate(p,'a[href="/base-camp"]','/hq');
  assert.equal(new URL(p.url()).pathname,'/hq');await p.waitForSelector('#your-profile');await p.waitForSelector('main');assert((await p.$eval('main',e=>e.textContent)).includes('John'));assert(!(await p.$eval('main',e=>e.textContent)).includes('Jordan Preview'));
  await p.waitForSelector('#your-profile');await p.waitForFunction(()=>document.querySelector('#your-profile')?.textContent.includes('John'));
  await go(p,'/ranger-station');await activate(p,'a[href="/trailheads"]','/trailheads');assert.equal(new URL(p.url()).pathname,'/trailheads');
  for(const slug of routes){
   await p.waitForSelector(`a[href^="/courses/${slug}"]`,{visible:true});const action=await p.$(`a[href^="/courses/${slug}"]`);assert(action,'visible connected course action '+slug);
   await activate(p,`a[href^="/courses/${slug}"]`,'/courses/'+slug);assert.equal(new URL(p.url()).pathname,'/courses/'+slug);await p.waitForSelector('main');assert(!(await p.$eval('main',e=>e.textContent)).includes('Jordan Preview'));
   await p.waitForSelector(slug==='designid-foundations'?'.designid-welcome-body':'.course-shell');
   const first=slug==='designid-foundations'?'welcome-to-designid':catalog.getLearningCourse(slug).modules[0].lessons[0].slug;
   await go(p,`/learn/${slug}/${first}`);await p.waitForSelector('main');assert.equal(new URL(p.url()).pathname,`/learn/${slug}/${first}`);
   await go(p,'/trailheads');
   console.log('PASS '+entry+' actual Trailheads action/course/standalone/plain-link continuity '+slug);
  }
  await p.waitForSelector('.trail-main-route a[href^="/journey"]');const journey=await p.$('.trail-main-route a[href^="/journey"]');assert(journey);await activate(p,'.trail-main-route a[href^="/journey"]','/journey');assert.equal(new URL(p.url()).pathname,'/journey');
  await go(p,'/journey?lesson='+lesson);await p.waitForSelector('.journey-designid-snapshot');
  await p.waitForFunction(()=>document.querySelector('.journey-designid-donut img')?.naturalWidth>0,{timeout:45000});
  const labels=await p.$$eval('.journey-designid-labels dd',es=>es.map(e=>e.textContent));assert.equal(labels.length,3);assert(labels.every(v=>v&&!v.includes('Not available')));
  const capacities=await p.$$eval('.journey-designid-capacities dd',es=>es.map(e=>e.textContent));assert.equal(capacities.length,4);assert(capacities.every(v=>v&&!v.includes('Not available')));
  const shadow=await p.$$eval('.designid-shadow-table tbody td',es=>es.map(e=>e.textContent));assert.equal(shadow.length,12);assert(shadow.every(v=>v&&!v.includes('Not available')));
  const authentic=JSON.parse(await storage('sandbox-owner/john-assessment-report.json'));const report=authentic.report??(authentic.all?authentic:{all:[authentic],latest:[authentic]});const raw=report.all.find(s=>s.assessment_type==='designid');assert(raw,'authentic source snapshot');
  const payload=raw.scores.reportPayload??raw.scores.summary??raw.scores;
  const expected=['Primary','Secondary','Integrative_Reflection'].map(k=>payload[k]??raw.scores.summary?.[k]);assert.deepEqual(labels,expected,'same actual saved labels');
  const names=['Architect','Artisan','Shepherd','Steward'];
  assert.deepEqual(capacities,names.map(n=>payload['Band_'+n]),'exact saved capacities');
  const chart=await p.$eval('.journey-designid-donut img',e=>JSON.parse(new URL(e.src).searchParams.get('c')));
  assert.deepEqual(chart.data.datasets[0].data,names.map(n=>Number(payload[n+'_Pts']??payload[n+'_Points'])),'exact saved wheel points');
  assert.deepEqual(shadow,['A','B','C','D'].flatMap(letter=>['Risk','Root','Red'].map(k=>canonical.reflections[expected[0]]['Shadow_'+k+'_'+letter])),'exact saved 12 shadow cells');
  const artifact=await fetch(base+'/api/artifacts/'+raw.id+'/download'+new URL(p.url()).search,{redirect:'follow'});assert.equal(artifact.status,200);assert(artifact.headers.get('content-type')?.includes('application/pdf'));assert.equal(Buffer.from(await artifact.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
  console.log('PASS genuine original private PDF owner download; no regeneration');
  for(const width of [1920,1280,768,390,320]){await p.setViewport({width,height:1000});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.$eval('.journey-designid-snapshot',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await p.screenshot({path:`tmp/john-owner-${base.startsWith('https')?'live':'local'}-${entry}-${width}.png`});}
  console.log('PASS '+entry+' Base Camp John; Journey actual populated saved wheel/3labels/4capacities/12shadow cells; desktop/phone nooverflow '+JSON.stringify(labels));
  await ctx.close();
 }
 const old=await browser.createBrowserContext(),p=await old.newPage();await monitor(p);await go(p,'/journey');assert(!(await old.cookies()).some(c=>c.name==='dydd_sandbox_review'));
 await activate(p,'a[href="/sandbox-review"]','/trailheads');assert.equal(new URL(p.url()).pathname,'/trailheads');for(const slug of routes)assert(await p.waitForSelector(`a[href^="/courses/${slug}"]`));await old.close();console.log('PASS existing tokenless gold-banner recovery → connected ALL course actions');
 const anon=await browser.createBrowserContext(),a=await anon.newPage();for(const slug of routes){await go(a,'/courses/'+slug);await a.waitForFunction(()=>location.pathname==='/login');assert.equal(new URL(a.url()).pathname,'/login');await go(a,'/courses/'+slug+'?review=new&key=wrong');await a.waitForFunction(()=>location.pathname==='/login');assert.equal(new URL(a.url()).pathname,'/login');}await anon.close();
 const email='owner-boundary-'+crypto.randomUUID()+'@example.invalid';const created=await admin.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('base64url'),email_confirm:true});assert(!created.error);userId=created.data.user.id;
 const link=await admin.auth.admin.generateLink({type:'magiclink',email});assert(!link.error);const signed=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:link.data.properties.hashed_token,next:'/trailheads'}),redirect:'manual'});assert.equal(signed.status,307);
 const learner=await browser.createBrowserContext(),l=await learner.newPage();await l.setCookie(...signed.headers.getSetCookie().map(c=>{const pair=c.split(';')[0],i=pair.indexOf('=');return{name:pair.slice(0,i),value:pair.slice(i+1),url:base}}));
 for(const slug of routes){await go(l,'/courses/'+slug);await l.waitForFunction(()=>location.pathname==='/trailheads');assert.equal(new URL(l.url()).pathname,'/trailheads');assert(!(await l.$$('a')).length||!(await l.$$eval('a',es=>es.some(e=>e.textContent.includes('Course (Owner)')))));}await learner.close();console.log('PASS anonymous, invalid credential, signed-in ordinary learner ALL course prerequisite boundaries');
 const outsider=createClient(cfg.project_url,cfg.anon_key,{auth:{persistSession:false}});const privateRead=await outsider.storage.from('assessment-report-pdfs').download('sandbox-owner/john-assessment-report.json');assert(privateRead.error,'owner actual report stays private from anon');
 assert.deepEqual(errors,[]);assert(posts.every(path=>['/','/api/course-reflections'].includes(path)),JSON.stringify(posts));
 for(const [path,before]of Object.entries(preserved))assert.equal(await storage(path),before,'existing owner state preserved '+path);
 console.log('PASS no assessment submission/email/report generation; existing profile/CARE/reminders unchanged; no runtime errors; POSTs '+JSON.stringify(posts));
}finally{await browser.close();if(userId){const r=await admin.auth.admin.deleteUser(userId);assert(!r.error);console.log('CLEANUP ordinary learner QA account removed; no fake assessments created');}}
