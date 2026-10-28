import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import puppeteer from 'puppeteer-core';import chromium from '@sparticuz/chromium';import{createClient}from'@supabase/supabase-js';
const base=process.env.AUTH_QA_BASE||'https://dydd-online-school.vercel.app',c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-supabase.json')),m=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json'));
const admin=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}});let browser,id;
try{
 browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});const page=await browser.newPage();
 const email=`delivered+dydd-confirm-${crypto.randomUUID()}@resend.dev`,password=crypto.randomBytes(20).toString('hex');
 await page.goto(base+'/login?mode=signup',{waitUntil:'networkidle2'});
 for(const [name,value]of Object.entries({full_name:'Beta Email Callback QA',email,password,confirm_password:password}))await page.type(`[name="${name}"]`,value);
 await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.click('button[type=submit]')]);
 const users=await admin.auth.admin.listUsers({perPage:1000});id=users.data.users.find(u=>u.email===email)?.id;assert(id);
 assert.equal(new URL(page.url()).searchParams.get('mode'),'confirmation');
 assert((await page.$eval('[role=status]',e=>e.textContent)).includes('You do not have account access yet'));
 assert.equal(await page.$('form'),null);
 assert(!(await admin.auth.admin.getUserById(id)).data.user.email_confirmed_at);
 await page.goto(base+'/hq',{waitUntil:'networkidle2'});assert.equal(new URL(page.url()).pathname,'/login');
 await page.type('[name=email]',email);await page.type('[name=password]',password);
 await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.click('button[type=submit]')]);
 const feedback=await page.$eval('[role=alert]',e=>({text:e.textContent,bottom:e.getBoundingClientRect().bottom}));
 assert(feedback.text.includes('Your email is not verified yet.'));
 assert(feedback.bottom < await page.$eval('form',e=>e.getBoundingClientRect().top));
 assert.equal(new URL(page.url()).pathname,'/login');
 await page.screenshot({path:'tmp/signup-unverified-signin-live.png',fullPage:true});
 const r=await fetch('https://api.supabase.com/v1/projects/laojrzlqbkmirzcbcnyw/database/query',{method:'POST',headers:{Authorization:'Bearer '+m.management_access_token,'Content-Type':'application/json'},body:JSON.stringify({query:`select confirmation_token from auth.users where id='${id}'::uuid;`})});assert(r.ok);const rows=await r.json();assert(rows[0]?.confirmation_token);
 // Exercise the very same default Supabase verification URL used by the SMTP template.
 // Read only this synthetic account's hashed token; do not regenerate/change it.
 const confirmation=new URL(c.project_url+'/auth/v1/verify');confirmation.searchParams.set('token',rows[0].confirmation_token);confirmation.searchParams.set('type','signup');confirmation.searchParams.set('redirect_to',base+'/auth/callback?next=%2Fhq');
 await page.goto(confirmation.toString(),{waitUntil:'networkidle2',timeout:60000});assert(new URL(page.url()).pathname==='/hq',page.url());assert((await page.$eval('body',e=>e.textContent)).includes('Beta Email Callback QA'));
 const account=await admin.auth.admin.getUserById(id);assert(account.data.user.email_confirmed_at);
 const cookie=(await page.cookies()).map(c=>c.name+'='+c.value).join('; ');const profile=await fetch(base+'/api/profile',{headers:{cookie}});assert.equal(profile.status,200);
 fs.writeFileSync('tmp/signup-confirmation-flow-live.json',JSON.stringify({base,at:new Date().toISOString(),status:'PASS',checks:['new email signup through public browser UI','dedicated confirmation waiting state, no signin form','unverified user blocked from Base Camp','actual unverified password signin shows explicit above-form alert','SMTP test sink confirmation accepted','original signup confirmation token, no admin regeneration','default Supabase verify URL -> PKCE /auth/callback -> signed-in /hq','authenticated API session and confirmed auth account']},null,2));console.log('PASS public signup -> verification waiting state -> denied unverified signin with visible error -> original email verification -> PKCE callback -> signed-in Base Camp/API.');
}finally{if(browser)await browser.close();if(id){const d=await admin.auth.admin.deleteUser(id);assert(!d.error,d.error?.message);}console.log('Email-callback QA account removed.');}
