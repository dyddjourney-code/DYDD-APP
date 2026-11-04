import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';import {createServerClient} from '@supabase/ssr';import puppeteer from 'puppeteer-core';import chromium from '@sparticuz/chromium';
const base=process.env.BILLING_TEST_BASE||'http://localhost:3137',c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert(['localhost','dydd-online-school-sandbox.vercel.app'].includes(new URL(base).hostname));
const admin=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}});let user,browser,page;const evidence=[];
try {
 const password=crypto.randomBytes(24).toString('hex'),created=await admin.auth.admin.createUser({email:'dydd-billing-browser-'+crypto.randomUUID()+'@example.com',password,email_confirm:true});assert(!created.error,created.error?.message);user=created.data.user;
 let cookies=[];const client=createServerClient(c.project_url,c.anon_key,{cookies:{getAll:()=>cookies,setAll:values=>{cookies=values}}});const signed=await client.auth.signInWithPassword({email:user.email,password});assert(!signed.error,signed.error?.message);
 const cookie=cookies.map(x=>`${x.name}=${x.value}`).join('; '),headers={cookie};
 const anon=await fetch(base+'/memberships',{redirect:'manual'});assert.equal(anon.status,307);assert(anon.headers.get('location').includes('/login'));
 const before=await fetch(base+'/api/stripe/test-access?capability=personal',{headers});assert.equal(before.status,200);assert.equal((await before.json()).active,false);
 const proxy=new URL(base).hostname!=='localhost'&&process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null;
 browser=await puppeteer.launch({args:[...chromium.args.filter(arg=>arg!=="--disable-web-security"),...(proxy?[`--proxy-server=${proxy.protocol}//${proxy.hostname}:${proxy.port}`]:[])],acceptInsecureCerts:Boolean(proxy),executablePath:await chromium.executablePath(),headless:true});await browser.setCookie(...cookies.map(x=>({name:x.name,value:x.value,url:base})));
 page=await browser.newPage();if(proxy)await page.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('../../outputs/dydd-stripe-setup/ui',{recursive:true});
 for(const width of [1280,390,320]){
 await page.setViewport({width,height:1000});const r=await page.goto(base+'/memberships?checkout=returned&session_id=cs_test_forged',{waitUntil:'domcontentloaded',timeout:60000});assert.equal(r.status(),200);
 await page.waitForFunction(()=>document.querySelector('main h1')?.textContent?.includes('Memberships'),{timeout:30000});assert(await page.$('h1'));const text=await page.$eval('main',e=>e.textContent);assert(text.includes('No real charges'));assert(text.includes('Returning here never grants access'));assert(text.includes('$10/month'));assert(text.includes('$15 per saved DesignID result'));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' overflow');
 const filename=`../../outputs/dydd-stripe-setup/ui/${new URL(base).hostname==='localhost'?'local':'hosted'}-${width}.png`;await page.screenshot({path:filename,fullPage:true});evidence.push({width,status:r.status(),noOverflow:true});
 }
 const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/stripe/test-checkout');await page.$eval('main button',e=>e.click());const failed=await response;if(failed.status()!==503){const requestHeaders=failed.request().headers();console.log('Checkout failure diagnostic',JSON.stringify({status:failed.status(),body:(await failed.text()).slice(0,500),origin:requestHeaders.origin,secFetchSite:requestHeaders['sec-fetch-site'],pageOrigin:await page.evaluate(()=>location.origin)}));}assert.equal(failed.status(),503);await page.waitForSelector('[role="alert"]');assert((await page.$eval('[role="alert"]',e=>e.textContent)).includes('not configured'));
 const after=await fetch(base+'/api/stripe/test-access?capability=personal',{headers});assert.equal((await after.json()).active,false);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({base,authenticatedMembershipPage:evidence,forgedReturnGrantedAccess:false,unconfiguredCheckout:503,accessAfterFailure:false,browserErrors:errors,completedStripePurchase:false}));
 fs.writeFileSync(`../../outputs/dydd-stripe-setup/ui/${new URL(base).hostname==='localhost'?'local':'hosted'}-verification.json`,JSON.stringify({base,evidence,checkoutStatus:503,completedStripePurchase:false},null,2));
}catch(error){if(page){console.log("Browser failure state",await page.evaluate(()=>({path:location.pathname,ready:document.readyState,title:document.title,h1:document.querySelector("h1")?.textContent})).catch(()=>({unavailable:true})));}throw error;}finally{
 if(browser)await browser.close();if(user){let r=await admin.from('dydd_test_billing_entitlements').delete().eq('user_id',user.id);assert(!r.error,r.error?.message);r=await admin.from('dydd_test_billing_orders').delete().eq('user_id',user.id);assert(!r.error,r.error?.message);r=await admin.auth.admin.deleteUser(user.id);assert(!r.error,r.error?.message);}console.log('Removed synthetic billing-browser account and test orders.');
}
