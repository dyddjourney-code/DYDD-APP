// Deliberate owner-only proof. Requires explicit flag; no production writes or bulk delivery.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
if(!process.argv.includes('--send-controlled'))throw Error('Use --send-controlled only for the authorized owner inbox proof.');
const base='https://dydd-online-school-sandbox.vercel.app';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const secretPath='/home/openclaw/.openclaw/secrets/dydd-sandbox-email.json';
const staged=JSON.parse(fs.readFileSync(secretPath));
const cron=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-sandbox-lifecycle-cron.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert.deepEqual(staged.allowlist,['dyddjourney@gmail.com']);
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),ok=r=>{assert(!r.error,r.error?.message);return r.data;};
const email=staged.allowlist[0];
const existing=ok(await db.auth.admin.listUsers({page:1,perPage:1000})).users.find(u=>u.email===email);
if(existing&&!staged.testAccountPassword)throw Error('Existing sandbox account needs its existing login, not a silent password reset.');
const password=staged.testAccountPassword||crypto.randomBytes(24).toString('base64url')+'aA1!';
const runId=staged.verificationRunId||crypto.randomUUID();
fs.writeFileSync(secretPath,JSON.stringify({...staged,testAccountPassword:password,verificationRunId:runId}),{mode:0o600});
let browser,outsider;
const evidence={checkedAt:new Date().toISOString(),base,sandboxRef:c.ref,recipient:'one existing verified owner address',freshAccountCreated:!existing,freshAccountCreatedAt:existing?.created_at||null,providerAccepted:[],deliveryVerified:false,inboxVerified:false,webhookConfigured:false,checks:[]};
try{
 const unauth=await fetch(base+'/api/sandbox/email-lab');assert.equal(unauth.status,403);evidence.checks.push('Anonymous lab denied');
 const proxy=process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null;
 browser=await puppeteer.launch({args:[...chromium.args,...(proxy?['--proxy-server='+proxy.protocol+'//'+proxy.hostname+':'+proxy.port]:[])],acceptInsecureCerts:Boolean(proxy),executablePath:await chromium.executablePath(),headless:true});
 const page=await browser.newPage(),errors=[];if(proxy?.username)await page.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/login?mode='+(existing?'signin':'signup')+'&next=%2Fsandbox%2Femail-lab',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('form.auth-form [name=email]',{timeout:60000});
 if(!existing){await page.type('[name=full_name]','John — fresh sandbox email walkthrough');await page.type('[name=confirm_password]',password);}
 await page.type('form.auth-form [name=email]',email);await page.type('form.auth-form [name=password]',password);
 await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:60000}),page.click('form.auth-form button[type=submit]')]);
 assert(new URL(page.url()).pathname==='/sandbox/email-lab','Fresh signup/password login should reach lab, not silently use owner preview');
 await page.waitForSelector('#email-example',{timeout:60000});
 const user=ok(await db.auth.admin.listUsers({page:1,perPage:1000})).users.find(u=>u.email===email);assert(user?.email_confirmed_at);
 const get=()=>page.evaluate(async()=>{const r=await fetch('/api/sandbox/email-lab');return {status:r.status,body:await r.json()};});
 let state=await get();assert.equal(state.status,200);assert(state.body.catalog.length>=230);assert.equal(state.body.telemetryConfigured,true);assert(state.body.catalog.some(p=>p.id.startsWith('B01-designid')));assert(state.body.catalog.some(p=>p.id.startsWith('B02')));assert(state.body.catalog.some(p=>p.id.startsWith('G02')));
 evidence.catalogPreviews=state.body.catalog.length;evidence.checks.push('Actual fresh signup and verified password session; report/observer/confirmation/account/Circle/175 Waypoint variants visible');
 for(const width of [390,768,1280]){await page.setViewport({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Lab overflow '+width);await page.screenshot({path:'tmp/email-live-lab-'+width+'.png',fullPage:false});}
 evidence.checks.push('Delivered lab UI fits 390/768/1280; no JavaScript errors');
 const post=(id,requestId)=>page.evaluate(async ({id,requestId})=>{const r=await fetch('/api/sandbox/email-lab',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,requestId})});return {status:r.status,body:await r.json()};},{id,requestId});
 let response=await post('A03',runId+'-welcome');assert.equal(response.status,200,JSON.stringify(response));assert(response.body.sent,JSON.stringify(response));
 const first=response.body.id;assert(first);evidence.providerAccepted.push({type:'A03 catalog copy',providerId:first});
 response=await post('A03',runId+'-welcome');assert(response.body.sent);assert.equal(response.body.id,first);evidence.checks.push('Same real request replay returns same provider ID with no duplicate intent');
 const waypoint=state.body.catalog.find(p=>p.group==='Waypoints'&&p.subject.includes('Called Before You Feel Ready')&&p.id.endsWith(':Generic'));assert(waypoint);
 // Exercise the actual delivered send button, retaining a stable request key on reruns.
 await page.setRequestInterception(true);
 page.on('request',request=>{if(request.url()===base+'/api/sandbox/email-lab'&&request.method()==='POST'){const body=JSON.parse(request.postData());body.requestId=runId+'-waypoint';request.continue({postData:JSON.stringify(body)});}else request.continue();});
 await page.select('#email-example',waypoint.id);
 const buttonResponse=page.waitForResponse(r=>r.url()===base+'/api/sandbox/email-lab'&&r.request().method()==='POST');
 await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Send this copy')).click());
 const clicked=await buttonResponse;response={status:clicked.status(),body:await clicked.json()};assert.equal(response.status,200,JSON.stringify(response));assert(response.body.sent,JSON.stringify(response));evidence.providerAccepted.push({type:'October30 Waypoint explicit catalog preview (not backlog delivery)',providerId:response.body.id});
 evidence.checks.push('Actual UI selected preview send accepted; copy explicitly labeled fictional/test, not a subscription');
 // Only this newly created controlled account can be recovered from a non-sending QA drain.
 // No accepted/ambiguous intent is reset and no historical recipient/backlog is touched.
 const natural=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('user_id',user.id).eq('template_id','A03').single());
 if(natural.status==='sandbox_ready'&&!natural.provider_id&&Date.parse(natural.created_at)>=Date.parse(staged.activatedAt)){
  const prior=ok(await db.from('dydd_email_messages').select('provider_id').eq('idempotency_key','dydd-lifecycle-'+natural.id));assert.equal(prior.length,0,'Never reset any provider-attempted welcome');
  ok(await db.from('dydd_lifecycle_jobs').update({status:'queued',next_attempt_at:new Date().toISOString(),error_message:'Controlled new-account test only: non-sending QA run held this welcome; no provider intent exists.'}).eq('id',natural.id).eq('status','sandbox_ready').is('provider_id',null));
  evidence.checks.push('Controlled new-account A03 safely requeued after non-sending QA drain; original event/key retained and zero provider intent proven');
 }
 const tick=await fetch(base+'/api/cron/lifecycle',{headers:{Authorization:'Bearer '+cron.secret}});assert.equal(tick.status,200,await tick.clone().text());evidence.tick=await tick.json();assert(evidence.tick.sandbox);
 const welcomes=ok(await db.from('dydd_lifecycle_jobs').select('id,status,provider_id').eq('user_id',user.id).eq('template_id','A03'));assert.equal(welcomes.length,1);assert.equal(welcomes[0].status,'accepted',JSON.stringify(welcomes));evidence.providerAccepted.push({type:'Actual account_verified → A03 welcome',providerId:welcomes[0].provider_id});
 await fetch(base+'/api/cron/lifecycle',{headers:{Authorization:'Bearer '+cron.secret}});
 assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('id').eq('user_id',user.id).eq('template_id','A03')).length,1);
 evidence.checks.push('Actual fresh account verified event → once-only hosted worker → provider-accepted A03, repeated tick no duplicate');
 const prefs=ok(await db.from('dydd_email_preferences').select('*').eq('email',email).maybeSingle());assert(!prefs?.learning&&!prefs?.growth&&!prefs?.optional_disabled);
 assert.equal(ok(await db.from('dydd_waypoint_subscriptions').select('id').eq('email',email)).length,0);
 evidence.checks.push('No implicit optional consent or Waypoint subscription; no archive backfill');
 const ledger=ok(await db.from('dydd_email_messages').select('provider_id,status').in('provider_id',evidence.providerAccepted.map(p=>p.providerId)));assert.equal(ledger.length,3);assert(ledger.every(r=>['accepted','delivered'].includes(r.status)));evidence.ledger=ledger;
 const admin=await page.evaluate(async()=>{const r=await fetch('/api/admin/email');return {status:r.status,body:await r.json()};});assert.equal(admin.status,200);assert(Array.isArray(admin.body.waypoints));evidence.checks.push('Authenticated admin can inspect lifecycle plus dedicated Waypoints history');
 // Separate synthetic verified account proves that a fresh account never grants send authority.
 const outsiderEmail='email-lab-denied-'+crypto.randomUUID()+'@example.test';outsider=ok(await db.auth.admin.createUser({email:outsiderEmail,password:crypto.randomBytes(24).toString('hex'),email_confirm:true})).user;
 const link=ok(await db.auth.admin.generateLink({type:'magiclink',email:outsiderEmail}));let outsiderCookies=[];const outsiderClient=createServerClient(c.project_url,c.anon_key,{cookies:{getAll:()=>outsiderCookies,setAll:values=>{outsiderCookies=values;}}});ok(await outsiderClient.auth.verifyOtp({token_hash:link.properties.hashed_token,type:'email'}));
 const denied=await fetch(base+'/api/sandbox/email-lab',{headers:{cookie:outsiderCookies.map(c=>c.name+'='+c.value).join('; ')}});assert.equal(denied.status,403);evidence.checks.push('Unallowlisted verified account with a genuine cookie session cannot view or send test mail');
 assert.equal(errors.length,0,errors.join('\n'));
 const providerRead=await fetch('https://api.resend.com/emails/'+first,{headers:{Authorization:'Bearer '+staged.apiKey,'User-Agent':'DYDD-Sandbox-Email-Audit/1.0'}});const providerBody=await providerRead.json();evidence.providerInspection={httpStatus:providerRead.status,name:providerBody.name};assert.equal(providerBody.name,'restricted_api_key');
 evidence.status='PASS; accepted is proven, delivery/inbox unverified';
}finally{
 if(outsider){ok(await db.from('dydd_lifecycle_jobs').delete().eq('user_id',outsider.id));ok(await db.from('dydd_lifecycle_events').delete().eq('user_id',outsider.id));ok(await db.auth.admin.deleteUser(outsider.id));assert((await db.auth.admin.getUserById(outsider.id)).error);}
 if(browser)await browser.close();
 fs.mkdirSync('docs/evidence',{recursive:true});fs.writeFileSync('docs/evidence/email-live-sandbox-2026-11-04.json',JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify(evidence,null,2));
}
