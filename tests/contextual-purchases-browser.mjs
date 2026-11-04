// Authenticated rendering and identity/scope checks. No provider payments are submitted.
import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';import {createServerClient} from '@supabase/ssr';import puppeteer from 'puppeteer-core';import chromium from '@sparticuz/chromium';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),load=require('../scripts/fruitlife-test-load.cjs');
const base=process.env.CONTEXT_PURCHASE_BASE||'http://localhost:3138',c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert(['localhost','dydd-online-school-sandbox.vercel.app'].includes(new URL(base).hostname));
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),ok=r=>{assert(!r.error,r.error?.message);return r.data;};let user,browser,client;const snapshots=[],circleIds=[],errors=[],evidence=[];
const output='../../outputs/dydd-stripe-setup/contextual';fs.mkdirSync(output,{recursive:true});
try{
 const password=crypto.randomBytes(24).toString('hex');user=ok(await db.auth.admin.createUser({email:'dydd-context-qa-'+crypto.randomUUID()+'@example.com',password,email_confirm:true})).user;
 let cookies=[];client=createServerClient(c.project_url,c.anon_key,{cookies:{getAll:()=>cookies,setAll:v=>cookies=v}});ok(await client.auth.signInWithPassword({email:user.email,password}));const headers={cookie:cookies.map(x=>`${x.name}=${x.value}`).join('; ')};
 const intake=load('lib/designid/intake.ts'),engine=load('lib/designid/engine.ts'),report=load('lib/designid/report.ts');const answers=Object.fromEntries(intake.designIdQuestionBank.map(q=>[q.code,{Architect:3,Artisan:2,Shepherd:0,Steward:0}[q.reflection]]));const result=engine.scoreDesignId(answers);const payload=report.buildDesignIdReportPayload({participantName:'Context purchase QA',participantEmail:user.email,result});
 for(let i=0;i<2;i++){const s=ok(await db.from('assessment_snapshots').insert({user_id:user.id,assessment_type:'designid',source:'contextual_purchase_qa',scores:{summary:payload,reportPayload:payload},source_submitted_at:new Date(Date.now()-i*1000).toISOString()}).select('id').single());snapshots.push(s.id);}
 const plans=load('lib/circles/plan.ts');const plan={...plans.blankCirclePlan(),name:'Contextual Couples QA',format:'Couple',expectedPeople:2};const circleId=crypto.randomUUID();circleIds.push(circleId);ok(await db.from('journey_circle_plans').insert({id:circleId,user_id:user.id,status:'draft',plan}));
 assert.equal((await fetch(base+'/api/stripe/test-purchase-options')).status,401);
 assert.equal((await fetch(base+'/api/stripe/test-purchase-options?circleId='+crypto.randomUUID(),{headers})).status,403);
 const before=await fetch(base+'/api/stripe/test-purchase-options',{headers});assert.equal(before.status,200);assert.equal((await before.json()).personal,false);
 const proxy=new URL(base).hostname!=='localhost'&&process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null;
 browser=await puppeteer.launch({args:[...chromium.args.filter(x=>x!=='--disable-web-security'),...(proxy?[`--proxy-server=${proxy.protocol}//${proxy.hostname}:${proxy.port}`]:[])],acceptInsecureCerts:!!proxy,executablePath:await chromium.executablePath(),headless:true});await browser.setCookie(...cookies.map(x=>({name:x.name,value:x.value,url:base})));
 const page=await browser.newPage();if(proxy)await page.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});page.on('pageerror',e=>errors.push(e.message));
 let intercepted;await page.setRequestInterception(true);page.on('request',request=>{if(new URL(request.url()).pathname==='/api/stripe/test-checkout'){intercepted=JSON.parse(request.postData());request.respond({status:503,contentType:'application/json',body:JSON.stringify({error:'QA transport interception: no provider purchase submitted.'})});}else request.continue();});
 for(const width of [1280,390,320]){
  await page.setViewport({width,height:1000});
  for(const [name,path,selector,expected]of [['basecamp','/hq?checkout=returned','.contextual-purchases','$10/month'],['circles','/camp-circle/my-circles?circle='+circleId,'.contextual-purchases','$5 once'],['designpd','/designpd?snapshot='+snapshots[1],'.designpd-shell','$15']]){
   const response=await page.goto(base+path,{waitUntil:'networkidle2',timeout:60000});assert.equal(response.status(),200,name);await page.waitForSelector(selector);if(name!=='designpd')await page.waitForFunction(()=>!document.querySelector('.contextual-purchases')?.textContent.includes('Checking your current access'));
   assert((await page.$eval(selector,e=>e.textContent)).includes(expected),name+' prices');assert(!await page.$('.hq-sidebar a[href="/memberships"]'));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} ${width} overflow`);
   if(name==='basecamp'||name==='designpd'){
    intercepted=null;await page.$eval(name==='basecamp'?'.contextual-purchases button':'.designpd-shell button[type="button"]',e=>e.click());await page.waitForFunction(()=>[...document.querySelectorAll('[role="alert"]')].some(e=>e.textContent.includes('QA transport interception')));assert.equal(intercepted.capability,name==='basecamp'?'personal':'designpd');if(name==='designpd')assert.equal(intercepted.scopeId,snapshots[1]);
   }
   await page.screenshot({path:`${output}/${new URL(base).hostname}-${name}-${width}.png`,fullPage:true});evidence.push({name,width,http:response.status(),noOverflow:true});
  }
 }
 // Seed only a synthetic QA access fixture, never claim it is a paid purchase.
 const order=ok(await db.from('dydd_test_billing_orders').insert({user_id:user.id,capability:'personal',scope_id:'account',price_id:'qa_fixture',status:'paid'}).select('id').single());ok(await db.from('dydd_test_billing_entitlements').insert({source_id:'qa_context_'+crypto.randomUUID(),order_id:order.id,user_id:user.id,capability:'personal',scope_id:'account',active:true,paid:false,expires_at:new Date(Date.now()+3600000).toISOString()}));
 await page.goto(base+'/camp-circle/my-circles?circle='+circleId,{waitUntil:'networkidle2',timeout:60000});await page.waitForFunction(()=>[...document.querySelectorAll('.contextual-purchases button')].some(e=>e.textContent.includes('Unlock this Couples')));intercepted=null;await page.$eval('.contextual-purchases button',e=>e.click());await page.waitForFunction(()=>[...document.querySelectorAll('[role="alert"]')].some(e=>e.textContent.includes('QA transport interception')));assert.equal(intercepted.capability,'couples_circle');assert.equal(intercepted.scopeId,circleId);
 // Forged return cannot mint DesignPD access.
 const forged=await fetch(base+'/api/stripe/test-access?capability=designpd&scopeId='+snapshots[1],{headers});assert.equal((await forged.json()).active,false);
 const old=await fetch(base+'/memberships',{headers,redirect:'manual'});assert.equal(old.status,307);assert(old.headers.get('location').includes('/hq'));
 // Preview remains read-only and prices remain visible without an auth identity.
 const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(x=>/^[A-Z_]+=/.test(x)).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1).replace(/^"|"$/g,'')]}));
 const reviewToken=env.DYDD_REVIEW_TOKEN;
 if(reviewToken){await browser.deleteCookie(...await browser.cookies());const preview=await browser.newPage();if(proxy)await preview.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});await preview.goto(base+'/hq?review=new&key='+encodeURIComponent(reviewToken),{waitUntil:'networkidle2',timeout:60000});await preview.waitForSelector('.contextual-purchases');assert((await preview.$eval('.contextual-purchases',e=>e.textContent)).includes('$10/month'));assert.equal(await preview.$('.contextual-purchases button'),null);assert(await preview.$('.contextual-purchases a[href^="/login"]'));await preview.close();}
 assert.deepEqual(errors,[]);const receipt={base,evidence,personalButton:true,designpdButtonExactHistoricalScope:true,couplesButtonExactScope:true,previewReadOnly:Boolean(reviewToken),anonymousOptions401:true,foreignCircle403:true,forgedReturnGranted:false,legacyRoute307:true,browserErrors:errors,providerPurchaseSubmitted:false,syntheticAccessFixture:true};fs.writeFileSync(`${output}/${new URL(base).hostname}-verification.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}finally{
 if(browser)await browser.close();if(client)await client.auth.signOut();if(user){ok(await db.from('dydd_test_billing_entitlements').delete().eq('user_id',user.id));ok(await db.from('dydd_test_billing_orders').delete().eq('user_id',user.id));if(snapshots.length)ok(await db.from('assessment_snapshots').delete().in('id',snapshots));if(circleIds.length)ok(await db.from('journey_circle_plans').delete().in('id',circleIds));ok(await db.auth.admin.deleteUser(user.id));}console.log('Synthetic contextual QA account, access fixtures, snapshots and Circles removed; session signed out.');
}
