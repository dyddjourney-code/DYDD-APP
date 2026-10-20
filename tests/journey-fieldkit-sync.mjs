import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const base=process.env.JOURNEY_TEST_BASE || 'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app' || base.startsWith('http://localhost:'));
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const slug='discover-your-divine-design';
let userId,browser,page;
try {
 const email=`journey-sync-${crypto.randomUUID()}@example.invalid`;
 const created=await admin.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('base64url'),email_confirm:true});
 assert(!created.error,created.error?.message);userId=created.data.user.id;
 const link=await admin.auth.admin.generateLink({type:'magiclink',email});assert(!link.error,link.error?.message);
 const login=await fetch(base+'/auth/confirm',{method:'POST',body:new URLSearchParams({token_hash:link.data.properties.hashed_token,next:'/journey'}),redirect:'manual'});
 assert.equal(login.status,307);
 const cookies=login.headers.getSetCookie().map(x=>{const pair=x.split(';')[0],i=pair.indexOf('=');return {name:pair.slice(0,i),value:pair.slice(i+1),url:base};});assert(cookies.length);
 const cookie=cookies.map(x=>x.name+'='+x.value).join('; ');
 const start=await fetch(base+'/api/course-reflections',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({courseSlug:slug,action:'new-round'})});
 assert.equal(start.status,201);const {round}=await start.json();const q=round.questions.find(q=>q.id==="child-of-god-response");assert(q);console.log("Testing inline Identity CARE reflection");
 const errors=[];
 const answer='CARE sync verification '+crypto.randomUUID();
 for(const width of [1280,390,320]) {
  browser=await puppeteer.launch({args:chromium.args.filter(arg=>arg!=="--single-process"),executablePath:await chromium.executablePath(),headless:true});
  page=await browser.newPage();await page.setCookie(...cookies);page.on("pageerror",e=>errors.push(e.message));page.on("dialog",d=>{console.log("Unexpected navigation dialog: "+d.type());void d.accept();});
  console.log("Starting "+width+"px");
  await page.setViewport({width,height:1000});
  const go = async path => { await page.close();page=await browser.newPage();page.on("pageerror",e=>errors.push(e.message));await page.setViewport({width,height:1000});await page.goto(base+path,{waitUntil:"networkidle2"}); };
  await go('/journey?lesson='+q.lessonSlug);
  await page.waitForSelector(`.journey-active-workbook [data-question="${q.id}"] textarea:not([disabled])`);
  assert.equal(await page.$eval('.journey-reflection-settings',e=>e.open),false);
  assert(!(await page.$eval('.journey-reflection-settings',e=>e.textContent)).includes('Your private workbook'));
  await page.$eval(".journey-reflection-settings > summary",e=>e.click());
  assert.equal(await page.$eval(".journey-reflection-settings",e=>e.open),true);
  assert(await page.$(".journey-reflection-settings select"));
  await page.$eval(".journey-reflection-settings > summary",e=>e.click());
  const selector=`.journey-active-workbook [data-question="${q.id}"]`;
  const text=answer+' '+width;
  await page.$eval(selector+' textarea',(e,t)=>{const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},text);
  const saved=page.waitForResponse(r=>r.url().includes('/api/course-reflections') && r.request().method()==='POST' && r.request().postData()?.includes('"action":"save"'));
  await page.$eval(selector+' button',e=>e.click());assert.equal((await saved).status(),200);
  await page.waitForFunction(s=>document.querySelector(s+" [role=status]")?.textContent==="Saved to your account",{},selector);
  console.log("Inline saved "+width);
  await go('/field-kit/reflections/'+slug);
  console.log("Field Kit loaded "+width);
  await page.waitForFunction(t=>document.body.textContent.includes(t),{},text);
  const article=`[data-question="${q.id}"]`;
  await page.$eval(article,e=>{for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await page.$eval(article+' button',e=>e.click());
  console.log("Field Kit edit opened "+width);
  const edited=text+' edited in Field Kit';
  await page.$eval(article+' textarea',(e,t)=>{const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(e,t);e.dispatchEvent(new Event('input',{bubbles:true}));},edited);
  const fieldSaved=page.waitForResponse(r=>r.url().includes('/api/course-reflections') && r.request().method()==='POST' && r.request().postData()?.includes('"action":"save"'));
  await page.$eval(article+' button',e=>e.click());assert.equal((await fieldSaved).status(),200);
  await page.waitForFunction(s=>document.querySelector(s+" [role=status]")?.textContent==="Saved to your account",{},article);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Field Kit overflow '+width);
  await go('/journey?lesson='+q.lessonSlug);
  await page.waitForFunction(({s,t})=>document.querySelector(s+' textarea')?.value===t,{}, {s:selector,t:edited});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Journey overflow '+width);
  await page.screenshot({path:`tmp/journey-sync-${base.startsWith('https')?'live':'local'}-${width}.png`,fullPage:false});
  await browser.close();browser=null;page=null;
  console.log('PASS '+width+'px: inline CARE save → Field Kit exact answer → Field Kit edit → Journey reload; compact history; no overflow');
 }
 assert.deepEqual(errors,[]);console.log('PASS no browser runtime errors');
} catch(error) {
 console.log("QA failure: "+error.message);
 throw error;
} finally {
 if(browser)await browser.close().catch(()=>{});
 if(userId){const r=await admin.auth.admin.deleteUser(userId);assert(!r.error,r.error?.message);console.log('Synthetic QA account removed; Jordan and existing learner answers untouched');}
}
