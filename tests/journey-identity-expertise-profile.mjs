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
const canonical=JSON.parse(fs.readFileSync('content/designid-shadow-canonical.json'));
const lesson='expertise-connecting-identity-and-expertise-32',slug='discover-your-divine-design';
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
async function open(page,width=390){await page.setViewport({width,height:1000});await page.deleteCookie({name:'dydd_sandbox_review',url:base});await page.goto(base+'/journey?lesson='+lesson,{waitUntil:'domcontentloaded'});await page.waitForSelector('.journey-identity-expertise-reflect textarea:not([disabled])');}
try{
 const a=await account(['Artisan','Architect','Shepherd','Steward']),b=await account(['Steward','Shepherd','Artisan','Architect'],true);
 for(const user of [a,b]){
 const context=await browser.createBrowserContext(),page=await context.newPage();await page.setCookie(...user.cookies);page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());return u.origin===base&&(u.pathname==='/base-camp'||u.pathname==='/sandbox-review'||u.searchParams.has('review'))?r.abort():r.continue()});
 for(const width of [1280,390,320]){await open(page,width);assert.deepEqual(await page.$$eval('.journey-identity-expertise-reflect h5',es=>es.map(e=>e.textContent)),['Primary — '+user.payload.Primary,'Secondary — '+user.payload.Secondary]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));console.log('PASS actual isolated saved report '+user.payload.Primary+'/'+user.payload.Secondary+' '+width+' labels (payloadOnly='+String(user===b)+')');}
 const answers=['Primary distinct saved '+crypto.randomUUID(),'Secondary distinct saved '+crypto.randomUUID()],qids=[lesson+'-designid-connect',lesson+'-designid-reflect'];
 for(let i=0;i<2;i++){await page.$eval('[data-question="'+qids[i]+'"] textarea',(e,t)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));e.blur()},answers[i]);}
 await page.$$eval('.journey-active-pagination button',es=>es.find(e=>e.textContent.startsWith('Next:')).click());await page.waitForFunction(()=>!document.querySelector('.journey-identity-expertise-reflect'));
 const h=await fetch(base+'/api/course-reflections?courseSlug='+slug,{headers:{Cookie:user.cookie}}).then(r=>r.json());for(let i=0;i<2;i++)assert(h.entries.some(e=>e.question_id===qids[i]&&e.response===answers[i]));
 await open(page);for(let i=0;i<2;i++)await page.waitForFunction((id,t)=>document.querySelector('[data-question="'+id+'"] textarea')?.value===t,{},qids[i],answers[i]);
 // A different signed-in account must never receive this person's responses or reminders.
 const other=user===a?b:a;const otherWorkbook=await fetch(base+'/api/course-reflections?courseSlug='+slug,{headers:{Cookie:other.cookie}}).then(r=>r.json());assert(!JSON.stringify(otherWorkbook).includes(answers[0]));assert(!JSON.stringify(otherWorkbook).includes(answers[1]));
 console.log('PASS both independently persisted answers/immediate Next/reopen and cross-account response isolation');
 check(await admin.from('assessment_snapshots').update({scores:{summary:{Primary:user.payload.Primary}}}).eq('id',user.snapshot));await open(page);assert.deepEqual(await page.$$eval('.journey-identity-expertise-reflect h5',es=>es.map(e=>e.textContent)),['Primary — '+user.payload.Primary,'Secondary — Not available in your saved report']);
 check(await admin.from('assessment_snapshots').delete().eq('id',user.snapshot));await open(page);assert.deepEqual(await page.$$eval('.journey-identity-expertise-reflect h5',es=>es.map(e=>e.textContent)),['Primary — Not available in your saved report','Secondary — Not available in your saved report']);for(let i=0;i<2;i++)await page.waitForFunction((id,t)=>document.querySelector('[data-question="'+id+'"] textarea')?.value===t,{},qids[i],answers[i]);console.log('PASS partial/missing report explicit unavailable labels; saved answers preserved');await context.close();
 }
 assert.deepEqual(errors,[]);
}finally{
 await browser.close();if(snapshots.length)check(await admin.from('assessment_snapshots').delete().in('id',snapshots));for(const id of ids){check(await admin.storage.from('assessment-report-pdfs').remove([`private-discussion-reminders/user-${id}.json`,`private-discussion-reminders/user-${id}.lock`]));check(await admin.auth.admin.deleteUser(id));assert.equal(check(await admin.from('assessment_snapshots').select('id').eq('user_id',id)).length,0);assert.equal(check(await admin.from('reflection_rounds').select('id').eq('user_id',id)).length,0);}console.log('CLEANUP all isolated QA users/reports/workbooks removed; no owner/customer/source/scoring changes');
}
