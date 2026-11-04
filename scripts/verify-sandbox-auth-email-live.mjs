// Deliberate owner-only recovery proof. Never logs passwords, OTPs or one-time links.
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';import puppeteer from 'puppeteer-core';import chromium from '@sparticuz/chromium';
if(!process.argv.includes('--send-controlled'))throw Error('Explicit owner inbox proof flag required');
const root='/home/openclaw/.openclaw/secrets/',c=JSON.parse(fs.readFileSync(root+'dydd-online-school-sandbox.json')),s=JSON.parse(fs.readFileSync(root+'supabase-project.json')),staged=JSON.parse(fs.readFileSync(root+'dydd-sandbox-email.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert.deepEqual(staged.allowlist,['dyddjourney@gmail.com']);
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),anon=createClient(c.project_url,c.anon_key,{auth:{persistSession:false}}),email=staged.allowlist[0],base='https://dydd-online-school-sandbox.vercel.app';
const ok=r=>{assert(!r.error,r.error?.message);return r.data;};
async function state(){const r=await fetch(`https://api.supabase.com/v1/projects/${c.ref}/database/query`,{method:'POST',headers:{Authorization:'Bearer '+s.management_access_token,'Content-Type':'application/json'},body:JSON.stringify({query:"select id,confirmation_token,recovery_token,email_confirmed_at,encrypted_password from auth.users where email='dyddjourney@gmail.com'",read_only:true})});assert(r.ok,'Read-only sandbox auth state '+r.status);return (await r.json())[0];}
const before=await state();assert(before?.email_confirmed_at);
const proof={at:new Date().toISOString(),sandboxRef:c.ref,checks:[],realRecipientCount:1,productionMutations:0,inboxObserved:false,verificationSignupFreshAccountProven:false};let browser;
try{
 const initial=ok(await db.from('dydd_email_messages').select('id').like('idempotency_key','sandbox-auth-%'));
 const proxy=process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null;
 browser=await puppeteer.launch({args:[...chromium.args,...(proxy?['--proxy-server='+proxy.protocol+'//'+proxy.hostname+':'+proxy.port]:[])],acceptInsecureCerts:Boolean(proxy),executablePath:await chromium.executablePath(),headless:true});
 const page=await browser.newPage();if(proxy?.username)await page.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});
 await page.goto(base+'/login?mode=recovery&next=%2Fsandbox%2Femail-lab',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('form.auth-form [name=email]');await page.type('form.auth-form [name=email]',email);
 await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:60000}),page.click('form.auth-form button[type=submit]')]);
 assert(new URL(page.url()).searchParams.get('message')?.includes('password reset link is on the way'),'Hosted Forgot password must succeed');
 const requested=await state();assert(requested.recovery_token,'Real GoTrue recovery token required');
 const key='sandbox-auth-'+crypto.createHash('sha256').update(email+':recovery:'+requested.recovery_token).digest('hex');
 const intent=ok(await db.from('dydd_email_messages').select('id,provider_id,status,recipient').eq('idempotency_key',key).single());assert(intent.provider_id);assert.equal(intent.status,'accepted');assert.equal(intent.recipient,email);proof.providerId=intent.provider_id;
 assert.equal(requested.confirmation_token,before.confirmation_token,'Existing owner handoff must not be invalidated');
 assert.equal(requested.encrypted_password,before.encrypted_password);
 proof.checks.push('Actual hosted Forgot password → Supabase signed Send Email Hook → exact-owner provider acceptance and durable ledger','Existing owner handoff token and password preserved');
 // The token is read only inside this protected test. Nothing is copied into evidence or logs.
 const confirm=base+'/auth/confirm?'+new URLSearchParams({token_hash:requested.recovery_token,token_type:'recovery',next:'/reset-password?next=/sandbox/email-lab'});
 await page.goto(confirm,{waitUntil:'domcontentloaded',timeout:60000});assert.equal((await state()).recovery_token,requested.recovery_token,'GET preview cannot consume token');
 await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:60000}),page.click('form button')]);
 assert.equal(new URL(page.url()).pathname,'/reset-password');assert((await page.$('form [name=password]')),'Real reset password form required');
 const lab=await page.evaluate(async()=>{const r=await fetch('/api/sandbox/email-lab');return {status:r.status};});assert.equal(lab.status,200,'Recovery must establish genuine owner cookie-backed session');
 const consumed=await state();assert.equal(consumed.recovery_token,'');assert.equal(consumed.encrypted_password,before.encrypted_password);assert.equal(consumed.confirmation_token,before.confirmation_token);
 proof.checks.push('Real recovery token GET remained unused; explicit POST established owner session and reset form','No owner password changed; previous handoff token still unchanged');
 const countBefore=ok(await db.from('dydd_email_messages').select('id').like('idempotency_key','sandbox-auth-%')).length;
 const outsider='sandbox-auth-denied-'+crypto.randomUUID()+'@example.test';
 const denied=await anon.auth.signUp({email:outsider,password:crypto.randomBytes(24).toString('hex')+'aA1!',options:{emailRedirectTo:base+'/auth/callback'}});assert(denied.error,'Direct outsider signup must fail at hook, not bypass mail gate');
 const users=ok(await db.auth.admin.listUsers({page:1,perPage:1000})).users;assert(!users.some(u=>u.email===outsider),'Failed outsider signup must roll back auth creation');
 assert.equal(ok(await db.from('dydd_email_messages').select('id').like('idempotency_key','sandbox-auth-%')).length,countBefore,'Outsider signup cannot persist a send intent');
 proof.checks.push('Actual direct Supabase signup outside exact allowlist denied; zero mail intents and rolled-back account');
 assert.equal((await fetch(base+'/api/sandbox/auth-email',{method:'POST',body:'{}'})).status,401);
 proof.authIntentsBefore=initial.length;proof.authIntentsAfter=countBefore;proof.status='PASS: real owner recovery accepted/session verified; no fresh owner signup recreated';
}finally{if(browser)await browser.close();fs.writeFileSync('docs/evidence/email-auth-live-2026-11-04.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));}
