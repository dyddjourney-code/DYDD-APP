// Opt-in integration QA: creates ONLY disposable users/codes, never real beta codes.
// BETA_TEST_BASE=http://localhost:3123 BETA_TEST_CREDENTIALS=/secure/project.json \
// BETA_TEST_OUTPUT=tmp/permanent-beta node tests/permanent-beta-access.mjs
// Credentials: project_url, anon_key, service_role_key, ref, db_password.
// Existing private Management API transport unconfirms only a disposable signed-in user.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';

const base=new URL(process.env.BETA_TEST_BASE||'http://localhost:3123').origin;
const cfg=JSON.parse(fs.readFileSync(process.env.BETA_TEST_CREDENTIALS||'/home/openclaw/.openclaw/secrets/dydd-online-school-supabase.json','utf8'));
const output=path.resolve(process.env.BETA_TEST_OUTPUT||'tmp/permanent-beta-access');
fs.mkdirSync(output,{recursive:true});
const batch='permanent_beta_isolated_qa';
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false,autoRefreshToken:false}});
const anonymous=createClient(cfg.project_url,cfg.anon_key,{auth:{persistSession:false,autoRefreshToken:false}});
const users=[],codes=[],snapshots=[],clients=[];
const evidence={target:base,checks:[],screenshots:[],cleanup:{},success:false};
let browser,page,stage='setup',failed=false;
const ok=result=>{assert(!result.error,'Supabase operation failed at '+stage);return result.data;};
function pass(label){evidence.checks.push(label);console.log('PASS '+label);}
async function account(){
 const email=`permanent-beta-qa-${crypto.randomUUID()}@example.invalid`,password=crypto.randomBytes(24).toString('base64url');
 const u=ok(await admin.auth.admin.createUser({email,password,email_confirm:true})).user;
 users.push({id:u.id,email});
 const actor={id:u.id,email,password,cookies:[]};
 await signIn(actor);return actor;
}
async function signIn(actor){
 const jar=new Map();
 const client=createServerClient(cfg.project_url,cfg.anon_key,{auth:{autoRefreshToken:false},cookies:{
  getAll:()=>[...jar.values()],setAll:values=>{for(const c of values)jar.set(c.name,c);},
 }});
 clients.push(client);ok(await client.auth.signInWithPassword({email:actor.email,password:actor.password}));
 actor.client=client;actor.cookies=[...jar.values()];actor.cookie=actor.cookies.map(c=>`${c.name}=${c.value}`).join('; ');
}
async function fixtureCode(){
 const hex=crypto.randomBytes(16).toString('hex').toUpperCase();
 const raw='DYDD-'+hex.match(/.{8}/g).join('-');
 const hash=crypto.createHash('sha256').update('DYDD'+hex).digest('hex');
 const row=ok(await admin.from('dydd_beta_access_codes').insert({code_hash:hash,batch}).select('id').single());
 const code={id:row.id,raw,hash};codes.push(code);return code;
}
async function request(actor,body,options={}){
 const headers={...(actor?{cookie:actor.cookie}:{}),...(body!==undefined?{'content-type':'application/json',origin:base}:{}),...options.headers};
 const response=await fetch(base+(options.path||'/api/beta-access'),{method:body===undefined?'GET':'POST',headers,
  ...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'manual'});
 const data=response.headers.get('content-type')?.includes('application/json')?await response.json():null;
 return {status:response.status,data,response};
}
async function active(actor,value){
 const r=await request(actor);assert.equal(r.status,200);assert.equal(r.data.active,value);
 assert.match(r.response.headers.get('cache-control')||'',/no-store/);
}
async function stored(actor){return ok(await admin.from('dydd_personal_access').select('user_id,scope,source_code_id,granted_at').eq('user_id',actor.id));}
async function codeRow(code){return ok(await admin.from('dydd_beta_access_codes').select('redeemed_by,redeemed_at').eq('id',code.id).eq('batch',batch).single());}
function denied(result,label){assert(result.error,label);assert.equal(result.error.code,'42501',label+' must be a permission denial, not a missing resource');}
async function useBrowser(actor){
 await page.deleteCookie(...(await page.cookies()).map(c=>({name:c.name,url:base})));
 await page.setCookie(...actor.cookies.map(c=>({name:c.name,value:c.value,url:base})));
}
async function unconfirmDisposable(actor){
 assert(users.some(u=>u.id===actor.id&&u.email.endsWith('@example.invalid')));
 assert.match(actor.id,/^[a-f0-9-]{36}$/);
 const credentials=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json','utf8'));
 const response=await fetch(`https://api.supabase.com/v1/projects/${cfg.ref}/database/query`,{method:'POST',headers:{Authorization:'Bearer '+credentials.management_access_token,'Content-Type':'application/json'},body:JSON.stringify({query:`update auth.users set email_confirmed_at=null where id='${actor.id}'::uuid and email='${actor.email}';`})});
 assert(response.ok,'Management SQL fixture transport must succeed');
}

try {
 stage='authentication and origin';
 assert.equal((await request()).status,401);
 assert.equal((await request(null,{code:'invalid'})).status,401);
 const owner=await account(),other=await account(),raceA=await account(),raceB=await account();
 const limited=await account(),ui=await account(),unverified=await account();
 const main=await fixtureCode();
 await active(owner,false);await active(other,false);
 assert.equal((await request(owner,{code:main.raw},{headers:{origin:'https://unrelated.invalid'}})).status,403);
 assert.equal((await request(owner,{code:main.raw},{headers:{origin:''}})).status,403);
 assert.equal((await request(owner,{code:main.raw},{headers:{'sec-fetch-site':'cross-site'}})).status,403);
 assert.equal((await codeRow(main)).redeemed_by,null);
 pass('unsigned requests denied; exact same-origin required; cross-site rejected without consuming code');

 stage='unverified account';
 // Keep its real, valid session, but independently remove email verification in
 // the DB. No verification mail, forged cookie, or fabricated JWT is involved.
 await unconfirmDisposable(unverified);
 const fetched=ok(await admin.auth.admin.getUserById(unverified.id)).user;
 assert(!fetched.email_confirmed_at,'Fixture must really be unverified');
 assert.equal((await request(unverified,{code:main.raw})).status,403);
 assert.equal(ok(await admin.rpc('redeem_dydd_beta_access',{p_user_id:unverified.id,p_code_hash:main.hash})),'unverified');
 assert.equal((await codeRow(main)).redeemed_by,null);
 assert.equal((await stored(unverified)).length,0);
 pass('real authenticated-but-unverified user denied by API and server-only DB function');

 stage='validation and identity binding';
 for(const code of ['',null,42,'DYDD-1234','DYDD-'+'a'.repeat(31),'DYDD-'+'g'.repeat(32),'x'.repeat(129)]){
  assert.equal((await request(owner,{code})).status,400);
 }
 const variant=' \t'+main.raw.toLowerCase().replaceAll('-',' \n- ')+' ';
 const grant=await request(owner,{code:variant,user_id:other.id,redeemed_by:other.id,scope:'admin',active:true});
 assert.equal(grant.status,200);assert.equal(grant.data.active,true);
 await active(owner,true);await signIn(owner);await active(owner,true);await active(other,false);
 const personal=await stored(owner);assert.equal(personal.length,1);
 assert.equal(personal[0].scope,'personal_all_access');assert.equal(personal[0].source_code_id,main.id);
 assert(Number.isFinite(Date.parse(personal[0].granted_at)));
 const redeemed=await codeRow(main);assert.equal(redeemed.redeemed_by,owner.id);assert(redeemed.redeemed_at);
 assert.equal((await stored(other)).length,0);
 assert.equal((await request(other,{code:main.raw})).status,400);
 assert.equal((await request(owner,{code:main.raw})).status,200);
 const spare=await fixtureCode();assert.equal((await request(owner,{code:spare.raw})).status,200);
 assert.equal((await codeRow(spare)).redeemed_by,null);
 pass('128-bit QA code normalization, malformed rejection, account binding, cross-user reuse denial and safe owner retry/no extra code consumption');

 stage='races';
 const race=await fixtureCode();
 const contested=await Promise.all([request(raceA,{code:race.raw}),request(raceB,{code:race.raw})]);
 assert.deepEqual(contested.map(r=>r.status).sort(),[200,400]);
 const winner=contested[0].status===200?raceA:raceB,loser=winner===raceA?raceB:raceA;
 assert.equal((await codeRow(race)).redeemed_by,winner.id);
 assert.equal((await stored(winner)).length,1);assert.equal((await stored(loser)).length,0);
 const retries=await Promise.all([request(winner,{code:race.raw}),request(winner,{code:race.raw})]);
 assert(retries.every(r=>r.status===200&&r.data.active===true));assert.equal((await stored(winner)).length,1);
 const firstExtra=await fixtureCode(),secondExtra=await fixtureCode();
 const doubleClaim=await Promise.all([request(loser,{code:firstExtra.raw}),request(loser,{code:secondExtra.raw})]);
 assert(doubleClaim.every(r=>r.status===200));
 const claimedExtras=await Promise.all([codeRow(firstExtra),codeRow(secondExtra)]);assert.equal(claimedExtras.filter(r=>r.redeemed_by===loser.id).length,1);
 assert.equal((await stored(loser)).length,1);
 pass('two-owner race has one winner; same-owner retries idempotent; parallel different codes consume only one invitation');

 stage='account deletion tombstone';
 const disposable=await account(),deletedCode=await fixtureCode();
 assert.equal((await request(disposable,{code:deletedCode.raw})).status,200);
 await disposable.client.auth.signOut({scope:'global'});
 ok(await admin.auth.admin.deleteUser(disposable.id));users.splice(users.findIndex(u=>u.id===disposable.id),1);
 assert.equal((await stored(disposable)).length,0);
 const tombstone=await codeRow(deletedCode);assert.equal(tombstone.redeemed_by,null);assert(tombstone.redeemed_at);
 assert.equal((await request(other,{code:deletedCode.raw})).status,400);
 pass('deliberate account deletion removes entitlement but retains consumed-code tombstone; invitation never recycles');

 stage='direct database denial';
 for(const client of [anonymous,other.client]){
  denied(await client.rpc('redeem_dydd_beta_access',{p_user_id:other.id,p_code_hash:spare.hash}),'Direct redemption RPC');
  for(const table of ['dydd_beta_access_codes','dydd_personal_access','dydd_beta_redemption_limits']){
   denied(await client.from(table).select('*').limit(1),'Private table SELECT '+table);
  }
  denied(await client.from('dydd_personal_access').insert({user_id:other.id,scope:'personal_all_access',source_code_id:spare.id}),'Forged personal grant');
  denied(await client.from('dydd_beta_access_codes').update({redeemed_by:other.id,redeemed_at:new Date().toISOString()}).eq('id',spare.id),'Forged code claim');
  denied(await client.from('dydd_beta_redemption_limits').upsert({user_id:other.id,attempts:0}),'Rate-limit tampering');
 }
 assert.equal((await stored(other)).length,0);assert.equal((await codeRow(spare)).redeemed_by,null);
 pass('anon/authenticated RPC execution, all private-table reads, direct access/code writes and limit tampering denied by grants');

 stage='durable rate limit';
 for(let i=0;i<12;i++)assert.equal((await request(limited,{code:i%2?'invalid':'DYDD-'+'0'.repeat(32)})).status,400);
 const validAfterLimit=await fixtureCode();
 for(let i=0;i<2;i++)assert.equal((await request(limited,{code:validAfterLimit.raw})).status,429);
 await signIn(limited); // Fresh session and separate requests cannot reset DB state.
 const blocked=await Promise.all([request(limited,{code:validAfterLimit.raw}),request(limited,{code:'invalid'})]);
 assert(blocked.every(r=>r.status===429));
 const limitRow=ok(await admin.from('dydd_beta_redemption_limits').select('attempts,window_started_at').eq('user_id',limited.id).single());
 assert.equal(limitRow.attempts,12);assert(Date.parse(limitRow.window_started_at)>Date.now()-15*60*1000);
 assert.equal((await codeRow(validAfterLimit)).redeemed_by,null);
 ok(await admin.from('dydd_beta_redemption_limits').update({window_started_at:new Date(Date.now()-16*60*1000).toISOString()}).eq('user_id',limited.id));
 assert.equal((await request(limited,{code:'invalid'})).status,400);
 assert.equal(ok(await admin.from('dydd_beta_redemption_limits').select('attempts').eq('user_id',limited.id).single()).attempts,1);
 pass('12 attempts/15 minutes enforced across requests, concurrency and fresh sessions; elapsed window resets safely');

 stage='real browser redemption';
 browser=await puppeteer.launch({args:chromium.args.filter(x=>!['--single-process','--disable-web-security'].includes(x)),executablePath:await chromium.executablePath(),headless:true});
 page=await browser.newPage();const runtimeErrors=[];page.on('pageerror',()=>runtimeErrors.push('runtime error'));
 await useBrowser(ui);await page.setViewport({width:1280,height:1000});
 assert.equal((await page.goto(base+'/hq',{waitUntil:'networkidle2',timeout:60000})).status(),200);
 await page.waitForSelector('#beta-access #beta-code');
 const uiCode=await fixtureCode();
 await page.type('#beta-code',uiCode.raw.toLowerCase());
 const posted=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/beta-access'&&r.request().method()==='POST');
 await page.click('#beta-access button[type="submit"]');
 const response=await posted;const redeemedBody=await response.json();if(response.status()!==200)console.error("Browser redemption diagnostic",JSON.stringify({status:response.status(),body:redeemedBody,origin:response.request().headers().origin,site:response.request().headers()["sec-fetch-site"]}));assert.equal(response.status(),200);assert.equal(redeemedBody.active,true);
 await page.waitForFunction(()=>document.querySelector('#beta-access')?.textContent.includes('does not expire'));
 await active(ui,true);assert.equal((await codeRow(uiCode)).redeemed_by,ui.id);
 for(const width of [1280,390,320]){
  await page.setViewport({width,height:1000});await page.reload({waitUntil:'networkidle2',timeout:60000});
  await page.waitForSelector('#beta-access');
  const panel=await page.$eval('#beta-access',e=>e.textContent);
  assert.match(panel,/lifetime personal all-access/i);assert.match(panel,/does not expire/i);assert.match(panel,/No payment or card/i);
  assert.equal(await page.$('#beta-code'),null);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`HQ overflow at ${width}`);
  await page.$eval('#beta-access',e=>e.scrollIntoView({block:'center'}));
  const name=`hq-redeemed-${width}.png`;await page.screenshot({path:path.join(output,name)});evidence.screenshots.push(name);
 }
 assert.deepEqual(runtimeErrors,[]);
 pass('real signed-in HQ form redeem/save/reload; persistent lifetime message; 1280/390/320 no overflow and screenshots');

 stage='payment bypass and prerequisite boundary';
 const checkout=await request(ui,undefined,{path:'/api/stripe/fruitlife-checkout?return_to=%2Ffield-kit%3Flane%3Dfruitlife'});
 assert([302,303,307,308].includes(checkout.status));
 const location=new URL(checkout.response.headers.get('location'),base);
 assert.equal(location.origin,base);assert.equal(location.pathname,'/field-kit');assert.equal(location.search,'?lane=fruitlife');
 assert(!/stripe|checkout|payment/i.test(location.href));
 const course=load('lib/passport/curriculum.ts').passportCurriculum.find(c=>c.slug==='designid-foundations');assert(course?.lessons.length);
 const progress=await request(ui,{action:'complete-lesson',courseSlug:course.slug,lessonSlug:course.lessons[0].slug},{path:'/api/course-progress'});
 assert.equal(progress.status,403,'Lifetime commerce access must not invent assessment prerequisites');
 const completed=ok(await admin.from('passport_lesson_completions').select('lesson_slug').eq('user_id',ui.id).eq('course_slug',course.slug));assert.equal(completed.length,0);
 await page.goto(base+'/designpd',{waitUntil:'networkidle2',timeout:60000});
 assert.match(await page.$eval('main',e=>e.textContent),/Complete DesignID first/i);
 assert.equal(await page.$('button[type="submit"]'),null);
 pass('actual FruitLife checkout redirects locally without a payment URL; DesignPD prerequisite and real course-progress 403 remain enforced');

 // Provide an engine-scored disposable DesignID prerequisite only. Do NOT
 // submit DesignPD, generate a PDF/report, or invoke payment/email providers.
 stage='paid DesignPD UI with genuine scored QA prerequisite';
 const intake=load('lib/designid/intake.ts'),engine=load('lib/designid/engine.ts'),report=load('lib/designid/report.ts');
 const answers=Object.fromEntries(intake.designIdQuestionBank.map(q=>[q.code,{Architect:3,Artisan:2,Shepherd:0,Steward:0}[q.reflection]]));
 const result=engine.scoreDesignId(answers);
 const payload=report.buildDesignIdReportPayload({participantName:'Isolated beta QA',participantEmail:ui.email,result});
 const snapshot=ok(await admin.from('assessment_snapshots').insert({user_id:ui.id,assessment_type:'designid',source:batch,
  scores:{summary:payload,reportPayload:payload},source_submitted_at:new Date().toISOString()}).select('id').single());snapshots.push(snapshot.id);
 for(const width of [1280,390,320]){
  await page.setViewport({width,height:1000});
  await page.goto(base+'/designpd',{waitUntil:'networkidle2',timeout:60000});
  await page.waitForSelector('.designpd-shell form');
  const text=await page.$eval('.designpd-shell',e=>e.textContent);
  assert.match(text,/DesignPD is included in your lifetime personal all-access/);
  assert.match(text,/Lifetime personal access: no payment will be taken/);
  assert(!text.includes('Unlock your DesignPD report · $15'));
  assert(!text.includes('Owner access:'));
  const submit=await page.$('button[type="submit"]');assert(submit);assert.equal(await submit.evaluate(e=>e.disabled),false);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`DesignPD overflow at ${width}`);
  const name=`designpd-included-${width}.png`;await page.screenshot({path:path.join(output,name)});evidence.screenshots.push(name);
 }
 assert.deepEqual(runtimeErrors,[]);
 pass('actual paid DesignPD UI recognizes lifetime entitlement (including sandbox), without owner preview or submitting/generating a report');
 evidence.success=true;
} catch (error) {
 failed=true;evidence.failedStage=stage;
 const safe=String(error.message).replace(/DYDD[-\sA-Fa-f0-9]{32,}/g,"[code]");
 console.error(error.name+": "+safe);
 console.error('FAIL permanent-beta QA at '+stage+' (sensitive response/error details intentionally not logged)');
} finally {
 const failures=[];
 async function cleanup(label,fn){try{await fn();evidence.cleanup[label]=true;}catch{failures.push(label);evidence.cleanup[label]=false;}}
 // Preserve dependency ordering and continue cleanup even after an assertion fails.
 if(browser)await cleanup('browserClosed',()=>browser.close());
 if(users.length){
  const ids=users.map(u=>u.id);
  await cleanup('personalAccessRemoved',async()=>{
   ok(await admin.from('dydd_personal_access').delete().in('user_id',ids));
   assert.equal(ok(await admin.from('dydd_personal_access').select('user_id').in('user_id',ids)).length,0);
  });
  if(codes.length)await cleanup('qaCodesRemoved',async()=>{
   const own=codes.map(c=>c.id);
   ok(await admin.from('dydd_beta_access_codes').delete().in('id',own).eq('batch',batch));
   assert.equal(ok(await admin.from('dydd_beta_access_codes').select('id').in('id',own)).length,0);
  });
  await cleanup('limitsRemoved',async()=>{
   ok(await admin.from('dydd_beta_redemption_limits').delete().in('user_id',ids));
   assert.equal(ok(await admin.from('dydd_beta_redemption_limits').select('user_id').in('user_id',ids)).length,0);
  });
  if(snapshots.length)await cleanup('qaSnapshotsRemoved',async()=>{
   ok(await admin.from('assessment_snapshots').delete().in('id',snapshots).in('user_id',ids).eq('source',batch));
   assert.equal(ok(await admin.from('assessment_snapshots').select('id').in('id',snapshots)).length,0);
  });
  for(const client of clients)await cleanup('sessionRevoked'+clients.indexOf(client),async()=>{
   const r=await client.auth.signOut({scope:'global'});
   // A preceding global sign-out may have revoked a previous session already.
   assert(!r.error||r.error.status===401||r.error.status===403||r.error.status===404);
  });
  for(const actor of users)await cleanup('authUserRemoved'+users.indexOf(actor),async()=>{
   assert(actor.email.startsWith('permanent-beta-qa-')&&actor.email.endsWith('@example.invalid'));
   ok(await admin.auth.admin.deleteUser(actor.id));
   const result=await admin.auth.admin.getUserById(actor.id);assert(!result.data.user);
  });
  await cleanup('zeroRemainingFixtures',async()=>{
   for(const table of ['dydd_personal_access','dydd_beta_redemption_limits'])assert.equal(ok(await admin.from(table).select('user_id').in('user_id',ids)).length,0);
   if(codes.length)assert.equal(ok(await admin.from('dydd_beta_access_codes').select('id').in('id',codes.map(c=>c.id))).length,0);
   if(snapshots.length)assert.equal(ok(await admin.from('assessment_snapshots').select('id').in('id',snapshots)).length,0);
  });
 }
 if(failures.length){failed=true;evidence.success=false;evidence.cleanupFailures=failures;console.error('FAIL cleanup: '+failures.join(', '));}
 // Evidence contains no raw codes, identifiers, passwords, cookies or tokens.
 evidence.finishedAt=new Date().toISOString();
 fs.writeFileSync(path.join(output,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log('Sanitized QA evidence: '+path.join(output,'evidence.json'));
 if(failed)process.exitCode=1;
}
