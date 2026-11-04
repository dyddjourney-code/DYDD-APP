// UI-only synthetic transport fixtures. No invitation, checkout or mail is submitted.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.CIRCLES_UI_BASE||'http://127.0.0.1:3138';assert(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const config=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(config.ref,'atemrshtshxoqnuevvqu');
const db=createClient(config.project_url,config.service_role_key,{auth:{persistSession:false}}),check=r=>{assert(!r.error,r.error?.message);return r.data;};
const load=createRequire(import.meta.url)('../scripts/fruitlife-test-load.cjs'),plans=load('lib/circles/plan.ts');
const id=crypto.randomUUID(),plan={...plans.blankCirclePlan(),name:'Synthetic UI Circle',format:'Small group',expectedPeople:'3',startDate:'2026-12-01',time:'18:30',location:'Shared meeting room'};
let user,browser,role='participant',format='Small group',phase='active',posts=[];const errors=[];
try{
 const password=crypto.randomBytes(24).toString('hex');user=check(await db.auth.admin.createUser({email:'circle-ui-'+crypto.randomUUID()+'@example.com',password,email_confirm:true})).user;
 let cookies=[];const client=createServerClient(config.project_url,config.anon_key,{cookies:{getAll:()=>cookies,setAll:v=>cookies=v}});check(await client.auth.signInWithPassword({email:user.email,password}));
 browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:chromium.args.filter(x=>x!=='--disable-web-security')});await browser.setCookie(...cookies.map(c=>({name:c.name,value:c.value,url:base})));
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);
 page.on('request',r=>{const url=new URL(r.url()),body=r.postData()?JSON.parse(r.postData()):null;let value;
  if(url.pathname==='/api/circles/operations'){
   if(body){posts.push(body);value={saved:true};}else if(url.searchParams.has('circleId'))value={circle:{id,plan:{...plan,format},revision:1},role,lifecycle:{phase,canEnroll:phase==='active',canOperate:phase==='active'},members:[{id:'self',name:'You',status:'accepted',role:'participant'}],consents:[{people:false,insights:false}],callouts:{counts:[{session:'1',lesson:plan.curriculum[0].slug,prompt:'Synthetic discussion topic',count:1,total:3}],submissions:[],own:[]}};else value={circles:[{id,role,plan:{...plan,format}}],approvals:[],owner:false};
  }else if(url.pathname==='/api/course-progress')value={completed:[plan.curriculum[0].slug]};
  else if(url.pathname==='/api/circles/field-guide')value={participant:true,content:{sessionOne:{prepare:[{title:'Synthetic shared prep',paragraphs:['Prepare your assigned lesson.']}],followThrough:[]},sessionTwo:{},sessions:{}}};
  else if(url.pathname==='/api/circles/couples')value={members:[],pending:'Waiting for both accepted partners to consent.'};
  else if(url.pathname.startsWith('/api/stripe/')){value={verified:true,personal:true,leadership:true,count:0};}
  if(value!==undefined)r.respond({status:200,contentType:'application/json',body:JSON.stringify(value)});else if(/stripe\.com$|resend\.com$/.test(url.hostname))r.abort();else r.continue();
 });
 fs.mkdirSync('docs/evidence/circles-ui',{recursive:true});
 for(const width of [1280,390,320]){
  await page.setViewport({width,height:950});await page.goto(base+'/camp-circle/my-circles?circle='+id,{waitUntil:'networkidle0',timeout:60000});await page.waitForFunction(()=>document.body.innerText.includes('Current section'));
  const body=await page.$eval('body',e=>e.innerText);assert(body.includes('Next meeting'));assert(body.includes('1 Journey lessons completed'));assert(body.includes('Synthetic shared prep'));assert(!body.includes('Transfer leadership'));assert(!body.includes('Invite your people'));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' overflow');
  await page.screenshot({path:`docs/evidence/circles-ui/participant-${width}.png`,fullPage:true});
 }
 await page.$eval('form button',e=>e.click());await page.waitForFunction(()=>document.body.innerText.includes('sharing choices were updated'));assert.equal(posts.at(-1).action,'consent');assert.equal(posts.at(-1).insights,false);await page.waitForSelector('[name="prompt"]');
 await page.$$eval('form',forms=>{const form=forms.find(f=>f.querySelector('[name="prompt"]'));form.querySelector('[name="prompt"]').value='UI explicit topic';form.requestSubmit();});await page.waitForFunction(()=>document.body.innerText.includes('explicit callout was saved'));assert.equal(posts.at(-1).session,'1');assert.equal(posts.at(-1).audience,'leader');assert.equal(posts.at(-1).shareText,false);
 format='Cohort';await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>document.body.innerText.includes('Cohort topic counts'));assert.equal(await page.$('[name="text"]'),null);
 format='Couple';await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>document.body.innerText.includes('Waiting for both accepted partners'));assert(await page.$('summary'));
 format='Small group';role='leader';phase='transition';await page.reload({waitUntil:'networkidle0'});await page.waitForFunction(()=>document.body.innerText.includes('Transfer leadership'));assert(await page.$eval('button',()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Create held invitation')?.disabled));
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/evidence/circles-ui/result.json',JSON.stringify({syntheticTransport:true,realAuthenticatedSandboxUser:true,widths:[1280,390,320],participantPrivacy:true,consentPayload:true,calloutPayload:true,cohortNoText:true,couplesPending:true,transitionNoInvites:true,browserErrors:errors},null,2));console.log('Circle experience browser: PASS (synthetic API transport; no real sends/payments).');
}finally{if(browser)await browser.close();if(user){await db.auth.admin.signOut(user.id,'global').catch(()=>{});check(await db.auth.admin.deleteUser(user.id));}}
