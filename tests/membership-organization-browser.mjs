// Final rendered acceptance: a genuinely fresh account and read-only owner preview.
// No checkout POST/payment/email; saved-result scope is proved by the existing contextual suite.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.CONTEXT_PURCHASE_BASE||'http://localhost:3142';
assert(['localhost','dydd-online-school-sandbox.vercel.app'].includes(new URL(base).hostname));
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}});
const ok=r=>{assert(!r.error,r.error?.message);return r.data;};
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').split('\n').filter(x=>/^[A-Z_]+=/.test(x)).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1).replace(/^"|"$/g,'')]}));
assert(env.DYDD_REVIEW_TOKEN);
const out='../../outputs/dydd-stripe-setup/membership-organization';fs.mkdirSync(out,{recursive:true});
const label=new URL(base).hostname==='localhost'?'local':'hosted',evidence=[],errors=[];
let user,browser,client,blockedPosts=0;
try{
 const password=crypto.randomBytes(24).toString('hex');
 user=ok(await db.auth.admin.createUser({email:'dydd-membership-qa-'+crypto.randomUUID()+'@example.com',password,email_confirm:true})).user;
 let cookies=[];client=createServerClient(c.project_url,c.anon_key,{cookies:{getAll:()=>cookies,setAll:v=>cookies=v}});
 ok(await client.auth.signInWithPassword({email:user.email,password}));
 const proxy=new URL(base).hostname!=='localhost'&&process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null;
 browser=await puppeteer.launch({args:[...chromium.args.filter(x=>x!=='--disable-web-security'),...(proxy?[`--proxy-server=${proxy.protocol}//${proxy.hostname}:${proxy.port}`]:[])],acceptInsecureCerts:!!proxy,executablePath:await chromium.executablePath(),headless:true});
 for(const mode of ['fresh','owner']){
  const context=browser.defaultBrowserContext();
  await browser.deleteCookie(...await browser.cookies());
  if(mode==='fresh')await context.setCookie(...cookies.map(x=>({name:x.name,value:x.value,url:base})));
  const page=await context.newPage();if(proxy)await page.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});
  page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);page.on('request',r=>{if(new URL(r.url()).pathname==='/api/stripe/test-checkout'&&r.method()==='POST'){blockedPosts++;r.abort();}else r.continue();});
  const path=(p)=>{const u=new URL(p,base);if(mode==='owner'){u.searchParams.set('review','new');u.searchParams.set('key',env.DYDD_REVIEW_TOKEN);}return u.href;};
  const navigate=async(p,selector)=>{const r=await page.goto(path(p),{waitUntil:'domcontentloaded',timeout:60000});assert.equal(r.status(),200,p);await page.waitForSelector(selector,{visible:true});if(selector==='.contextual-purchases')await page.waitForFunction(()=>!document.querySelector('.contextual-purchases')?.textContent.includes('Checking your current access'));};
  for(const width of [1280,390,320]){
   console.log(mode,width,'Base Camp, Passport, Circles and both DesignPD placements');
   await page.setViewport({width,height:1000});
   await navigate('/hq#purchases','.contextual-purchases');
   // Next streams temporary hidden duplicate segments; wait for the settled page, not staging markup.
   await page.waitForFunction(()=>document.querySelectorAll('#purchases .purchase-offer').length===1);
   const order=await page.evaluate(()=>{const nodes=['.basecamp-orientation-band','#purchases','#passport','[aria-label="Base Camp account overview"]','#on-the-horizon'].map(s=>document.querySelector(s));return nodes.every(Boolean)&&nodes.every((n,i)=>i===0||Boolean(nodes[i-1].compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING))&&nodes.at(-1).parentElement.lastElementChild===nodes.at(-1);});assert(order,'Ranger > Purchases > Passport > Account > Blazing at bottom');
   const copy=await page.$eval('#purchases',e=>e.innerText);
   for(const text of ['$10','/ month','Discover Your Divine Design (DYDD) Journey','DesignID assessment and class','FruitLife360 assessment and class','Spiritual Gifts assessment and class','Waypoints','Free seats for eligible live virtual events','Not all events are included.'])assert(copy.includes(text),text);
   assert(!copy.includes('Explore DesignPD'));assert(!copy.includes('Explore Circle options'));assert(!copy.includes('$15'));
   assert.equal(await page.$$eval('#purchases .purchase-offer',es=>es.length),1);
   await page.$eval('#purchases',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await (await page.$('#purchases')).screenshot({path:`${out}/${label}-${mode}-personal-${width}.png`});
   const toggle=await page.$('.passport-book-toggle');assert.equal(await toggle.evaluate(e=>e.getAttribute('aria-expanded')),'false');
   assert(await page.$eval('.passport-book-content',e=>e.hidden));
   const notice='This is a record of your journey—not a way to access courses or assessments.';assert.equal(await page.$eval('.passport-record-notice strong',e=>e.innerText),notice);
   await page.$eval('#passport',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await (await page.$('#passport')).screenshot({path:`${out}/${label}-${mode}-passport-collapsed-${width}.png`});
   await toggle.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('.passport-book-toggle').getAttribute('aria-expanded')==='true');
   assert(await page.$eval('.passport-record-notice',e=>!!e.getBoundingClientRect().height));assert(!await page.$eval('.passport-book-content',e=>e.hidden));
   const badge=await page.$('.passport-badge-button');
   if(width===1280){await badge.hover();const title=await badge.$eval('strong',e=>e.innerText);assert.equal(await page.$eval('.passport-badge-popover h3',e=>e.innerText),title);}
   else{await badge.click();await page.waitForSelector('dialog[open]');assert(await page.$('dialog[open] .passport-sheet-body'));await page.screenshot({path:`${out}/${label}-${mode}-passport-badge-${width}.png`});await page.click('dialog[open] button[aria-label="Close badge details"]');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));}
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'expanded Passport overflow');
   await page.$eval('#passport',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`${out}/${label}-${mode}-passport-expanded-${width}.png`});
   await toggle.focus();await page.keyboard.press('Space');await page.waitForFunction(()=>document.querySelector('.passport-book-toggle').getAttribute('aria-expanded')==='false');
   await navigate('/camp-circle','.contextual-purchases');
   const offers=await page.$$eval('.contextual-purchases .purchase-offer h3',es=>es.map(e=>e.innerText));assert.deepEqual(offers,['Circle Leadership','Couples Circle']);
   const circleCopy=await page.$eval('.contextual-purchases',e=>e.innerText);for(const t of ['$20','$5','$10/month at 10 qualifying paid participants','$0/month at 20 qualifying paid participants','A Personal membership is required to continue.'])assert(circleCopy.includes(t),t);assert(!offers.includes('Personal membership'));assert(!circleCopy.includes('Start personal membership'));
   const prerequisite=await page.$('.purchase-prerequisite a');const href=await prerequisite.evaluate(e=>e.href);assert.equal(new URL(href).pathname,'/hq');assert.equal(new URL(href).hash,'#purchases');
   await page.$eval('.contextual-purchases',e=>e.scrollIntoView({block:'start',behavior:'instant'}));await (await page.$('.contextual-purchases')).screenshot({path:`${out}/${label}-${mode}-circles-${width}.png`});
   await prerequisite.click();await page.waitForFunction(()=>location.pathname==='/hq'&&location.hash==='#purchases');await page.waitForSelector('#purchases .purchase-offer');
   for(const [name,url,anchor]of [['trailheads','/trailheads#designpd','#designpd'],['fieldkit','/field-kit#collection-designpd','#collection-designpd']]){
    await navigate(url,`${anchor} .designpd-trail-offer`);const offer=await page.$(`${anchor} .designpd-trail-offer`);const t=await offer.evaluate(e=>e.innerText);for(const x of ['$15','saved DesignID result','one time','DesignPD report and supporting class','DesignID itself is included with Personal membership.'])assert(t.includes(x),x);
    const action=new URL(await offer.$eval('a',e=>e.href));
    if(mode==='fresh'){assert.equal(action.pathname,'/designid');assert.equal(await offer.$eval('a',e=>e.innerText),'Complete DesignID first');}
    else{assert.equal(action.pathname,'/designpd');assert(action.searchParams.get('snapshot'));assert.equal(action.searchParams.get('origin'),name==='trailheads'?'trailheads':'field-kit');assert.equal(action.searchParams.get('review'),'new');}
    // A real scroll stops the existing incoming-anchor settler before focusing the offer.
    await page.mouse.wheel({deltaY:1});
    await offer.evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForFunction(s=>{const r=document.querySelector(s)?.getBoundingClientRect();return r&&r.width>0&&r.height>0;},{timeout:15000},`${anchor} .designpd-trail-offer`);await offer.screenshot({path:`${out}/${label}-${mode}-${name}-designpd-${width}.png`});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow');
   }
   evidence.push({mode,width,sectionOrder:true,fullBenefits:true,limitedLiveEventPromise:true,passportDefaultCollapsed:true,keyboardEnterSpace:true,badgeHoverOrDialog:true,circlesOnly:true,prerequisiteLinkNavigates:true,contextualDesignPdBoth:true,noOverflow:true});
  }
  await page.close();
 }
 assert.equal(blockedPosts,0);assert.deepEqual(errors,[]);
 fs.writeFileSync(`${out}/${label}-rendered-acceptance.json`,JSON.stringify({base,evidence,errors,checkoutPosts:blockedPosts},null,2));
 const count=ok(await db.from('assessment_snapshots').select('id').eq('user_id',user.id));assert.equal(count.length,0);
 const grants=ok(await db.from('dydd_test_billing_entitlements').select('source_id').eq('user_id',user.id));assert.equal(grants.length,0);
 fs.writeFileSync(`${out}/${label}-acceptance.json`,JSON.stringify({base,evidence,errors,checkoutPosts:blockedPosts,paymentsSubmitted:0,emailsSent:0,freshAccountSnapshots:0,freshAccountEntitlements:0},null,2));console.log(JSON.stringify({base,groups:evidence.length,allPassed:true,checkoutPosts:blockedPosts,errors}));
}finally{
 if(browser)await browser.close();if(client)await client.auth.signOut();if(user)ok(await db.auth.admin.deleteUser(user.id));console.log('QA auth session signed out and fresh synthetic user removed.');
}
