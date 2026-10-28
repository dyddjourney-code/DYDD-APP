import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import load from '../scripts/fruitlife-test-load.cjs';
const base=process.env.BETA_QA_BASE||'http://localhost:3148';
assert(['http://localhost:3148','https://dydd-online-school.vercel.app'].includes(base),'Use only the reviewed stable beta/local QA target');
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-supabase.json'));
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const signinClient=createClient(cfg.project_url,cfg.anon_key,{auth:{persistSession:false}});
const ids=[],checks=[];let browser;
const ok=x=>{assert(!x.error,x.error?.message);return x.data};
const pass=s=>{checks.push(s);console.log('PASS '+s)};
const publicToken=process.env.DYDD_REVIEW_TOKEN;
async function get(path,cookie){return fetch(base+path,{headers:cookie?{cookie}:{},redirect:'manual'});}
async function api(path,actor,body,origin){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(actor?{cookie:actor.cookie}:{}),...(body?{'Content-Type':'application/json'}:{}),...(origin?{origin}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};}
async function account(){const email=`beta-isolation-${crypto.randomUUID()}@example.invalid`,password=crypto.randomBytes(20).toString('hex');const u=ok(await admin.auth.admin.createUser({email,password,email_confirm:true})).user;ids.push(u.id);let cookies=[];const client=createServerClient(cfg.project_url,cfg.anon_key,{cookies:{getAll:()=>cookies,setAll:c=>{cookies=c}}});ok(await client.auth.signInWithPassword({email,password}));return {...u,client,cookies,cookie:cookies.map(c=>c.name+'='+c.value).join('; ')};}
try {
 for(const path of ['/command-center','/command-center/design-map','/command-center/expedition','/api/command-center/maps-report','/api/command-center/couple-report','/api/admin/email','/owner','/sandbox-review']){
  for(const suffix of ['',`?review=owner&key=${encodeURIComponent(publicToken||'unknown')}`])assert.equal((await get(path+suffix)).status,404,path);
 }
 const first=await get('/first-launch');assert(!first.headers.get('location')?.includes('key='));
 assert(!(await (await get('/')).text()).includes('Owner Command Center'));
 pass('public/direct Command Center, associated APIs, owner and sandbox entry are unavailable; no preview token disclosure');
 const a=await account(),b=await account();
 assert.equal((await get('/command-center',a.cookie)).status,404);
 assert.equal((await api('/api/profile',null)).status,401);
 assert.equal((await api('/api/course-reflections?courseSlug=discover-your-divine-design',null)).body.signedIn,false);
 const reflected=await api('/api/course-reflections',a,{action:'ensure-round',courseSlug:'discover-your-divine-design'});assert.equal(reflected.status,200,JSON.stringify(reflected));
 const round=reflected.body.round,q=round.questions.find(q=>load('lib/reflections/discussion-catalog.ts').careDiscussionIds.has(q.id));assert(q);
 const answer='Private beta release QA '+crypto.randomUUID();
 const saved=await api('/api/course-reflections',a,{action:'save',courseSlug:'discover-your-divine-design',roundId:round.id,questionId:q.id,response:answer,expectedRevision:0});assert.equal(saved.status,200,JSON.stringify(saved));
 let own=await api('/api/course-reflections?courseSlug=discover-your-divine-design',a);assert(own.body.entries.some(e=>e.response===answer));
 const other=await api('/api/course-reflections?courseSlug=discover-your-divine-design',b);assert(!other.body.entries.some(e=>e.response===answer));
 assert.equal(ok(await b.client.from('reflection_entries').select('id').eq('user_id',a.id)).length,0);
 assert.equal((await api('/api/course-reflections',a,{action:'save',courseSlug:'discover-your-divine-design',roundId:round.id,questionId:q.id,response:'forbidden',expectedRevision:1},'https://unrelated.invalid')).status,403);
 const marked=await api('/api/course-reflections/discussion',a,{courseSlug:'discover-your-divine-design',roundId:round.id,questionId:q.id,marked:true,note:'A private reminder',expectedRevision:0});assert.equal(marked.status,200,JSON.stringify(marked));
 assert.equal((await api('/api/course-reflections/discussion?courseSlug=discover-your-divine-design',b)).body.reminders.length,0);
 pass('real distinct accounts, private workbook save/reload, RLS isolation, CSRF rejection and private CARE discussion reminders');
 const curriculum=load('lib/passport/curriculum.ts').passportCurriculum,journey=curriculum[0];
 assert.equal((await api('/api/course-progress',a,{courseSlug:journey.slug,action:'complete-lesson',lessonSlug:journey.lessons.at(-1).slug})).status,409);
 const c=curriculum.find(c=>c.slug==='designid-foundations');
 assert.equal((await api('/api/course-progress',a,{courseSlug:c.slug,action:'complete-lesson',lessonSlug:c.lessons[0].slug})).status,403);
 assert.equal((await api('/api/course-progress',a,{courseSlug:journey.slug,action:'complete-lesson',lessonSlug:journey.lessons[0].slug})).status,200);
 assert(!ok(await b.client.from('passport_lesson_completions').select().eq('user_id',a.id)).length);
 assert((await a.client.from('passport_awards').insert({user_id:a.id,badge_key:'Identity'})).error);
 assert(!(await (await get('/api/stripe/fruitlife-checkout',a.cookie)).headers.get('location')).includes('stripe.com'));
 pass('lesson-order and assessment prerequisites retained, checklist save private, award forgery denied, checkout cannot charge');
 browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 ok(await admin.from('school_profiles').upsert({id:b.id,email:b.email,full_name:'Identity Binding QA'}));
 ok(await b.client.from('school_profiles').update({email:a.email}).eq('id',b.id));
 await page.setCookie(...b.cookies.map(c=>({name:c.name,value:c.value,url:base})));
 await page.goto(base+'/hq',{waitUntil:'networkidle2',timeout:60000});
 const identity=await page.$eval('body',e=>e.textContent);assert(identity.includes(b.email));assert(!identity.includes(a.email));
 pass('forged editable profile email cannot replace authenticated account identity');
 for(const width of [1280,390,320]){
  await page.setViewport({width,height:950});await page.setCookie(...a.cookies.map(c=>({name:c.name,value:c.value,url:base})));
  await page.goto(base+'/hq',{waitUntil:'networkidle2',timeout:60000});
  assert(!await page.$('a[href^="/command-center"]'));assert(await page.$('#your-profile'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`tmp/beta-${base.startsWith('https')?'live':'local'}-${width}.png`});
 }
 assert.deepEqual(errors,[]);pass('desktop 1280 and mobile 390/320 Base Camp rendered without Command Center links, overflow or browser runtime errors');
 // Real public registration through browser; only a provider-owned simulated test inbox is used.
 await page.deleteCookie(...(await page.cookies()).map(c=>({name:c.name,url:base})));
 await page.goto(base+'/login?mode=signup',{waitUntil:'networkidle2'});
 const email=`delivered+dydd-beta-${crypto.randomUUID()}@resend.dev`,password=crypto.randomBytes(20).toString('hex');
 for(const [name,value] of Object.entries({full_name:'Beta Registration QA',email,password,confirm_password:password}))await page.type(`[name="${name}"]`,value);
 await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.click('button[type="submit"]')]);
 const content=await page.$eval('body',e=>e.textContent);assert(content.includes('Check your email to confirm your account'),content.slice(-1300));
 const listed=ok(await admin.auth.admin.listUsers({perPage:1000})).users;const fresh=listed.find(u=>u.email===email);assert(fresh);ids.push(fresh.id);assert(!fresh.email_confirmed_at);
 assert((await signinClient.auth.signInWithPassword({email,password})).error,'Unverified registration cannot claim old matching records');
 // Generate a fresh verification credential without sending another message; exercise public confirm route.
 const link=ok(await admin.auth.admin.generateLink({type:'signup',email,password}));
 const confirm=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:link.properties.hashed_token,next:'/hq'}),redirect:'manual'});assert.equal(confirm.status,307);assert(confirm.headers.getSetCookie().length);
 const signed=ok(await signinClient.auth.signInWithPassword({email,password}));assert.equal(signed.user.id,fresh.id);
 pass('fresh new-email registration through public UI, SMTP accepted confirmation, unverified login refused, public confirmation sets session, password sign-in works');
 fs.writeFileSync('tmp/beta-qa-'+(base.startsWith('https')?'live':'local')+'.json',JSON.stringify({base,checks,at:new Date().toISOString()},null,2));
} finally {
 if(browser)await browser.close();
 for(const id of ids){const removed=await admin.storage.from('assessment-report-pdfs').remove([`private-discussion-reminders/user-${id}.json`,`private-discussion-reminders/user-${id}.lock`]);assert(!removed.error,removed.error?.message);await admin.auth.admin.signOut(id).catch(()=>{});const deleted=await admin.auth.admin.deleteUser(id);assert(!deleted.error,deleted.error?.message);}
 console.log('All synthetic accounts/private reminder fixtures removed.');
}
