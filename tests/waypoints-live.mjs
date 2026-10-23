/** Real sandbox database + browser QA. Never sends email, intercepts API responses,
 *  uses owner identities, or touches production. Disposable synthetic rows only. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json','utf8'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu','only authorized sandbox project');
assert.equal(new URL(cfg.project_url).hostname,'atemrshtshxoqnuevvqu.supabase.co');
const base=(process.env.WAYPOINT_TEST_BASE||'http://localhost:3138').replace(/\/$/,'');
const url=new URL(base);
assert((['localhost','127.0.0.1'].includes(url.hostname)&&url.protocol==='http:')||base==='https://dydd-online-school-sandbox.vercel.app','only localhost or authorized sandbox deployment');
const admin=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false,autoRefreshToken:false}});
const model=load('lib/waypoints/waypoint-data.ts');
const types=['Architect','Artisan','Shepherd','Steward'];
const users=[],participantIds=[],snapshotIds=[],sessions=[],pageErrors=[],browserWrites=[],cleanupErrors=[];
let browser,assertions=0;
const ok=result=>{assert(!result.error,result.error?.message);return result.data;};
const normal=s=>s.replace(/\s+/g,' ').trim();
const releaseList=()=>model.getReleasedWaypoints(new Date());
async function createUser(label){
  const email=`waypoints-qa-${label}-${crypto.randomUUID()}@example.invalid`;
  const password=crypto.randomBytes(28).toString('base64url');
  const {user}=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:'Synthetic Waypoints QA'}}));
  users.push(user);return {...user,password};
}
async function snapshot(user,scores,date,participantId){
  const row=ok(await admin.from('assessment_snapshots').insert({user_id:user?.id??null,participant_id:participantId??null,assessment_type:'designid',source:'waypoints_isolated_qa_20261023',source_submitted_at:date,scores}).select('id').single());
  snapshotIds.push(row.id);return row;
}
async function participant(email,userId=null){
  const row=ok(await admin.from('assessment_participants').insert({normalized_email:email,user_id:userId,display_name:'Synthetic Waypoints QA'}).select('id').single());
  participantIds.push(row.id);return row;
}
async function cookiesFor(user){
  const jar=new Map();
  const client=createServerClient(cfg.project_url,cfg.anon_key,{auth:{autoRefreshToken:false,persistSession:false},cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});
  ok(await client.auth.signInWithPassword({email:user.email,password:user.password}));
  sessions.push(client);
  assert(jar.size,'password sign-in provides real SSR cookies');
  return [...jar].map(([name,value])=>({name,value,url:base,httpOnly:false,secure:url.protocol==='https:'}));
}
async function protectedState(){
  const state={};
  state.participants=participantIds.length?ok(await admin.from('assessment_participants').select('*').in('id',participantIds).order('id')):[];
  state.snapshots=snapshotIds.length?ok(await admin.from('assessment_snapshots').select('*').in('id',snapshotIds).order('id')):[];
  for(const table of ['journey_companion_notes','journey_workbook_responses','reflection_rounds','reflection_entries','lesson_reflections','course_lesson_reflections','dydd_waypoint_subscriptions'])
    state[table]=ok(await admin.from(table).select('*').in('user_id',users.map(u=>u.id)).order('id'));
  return state;
}
async function pageFor(cookies=[],width=1280){
  const context=await browser.createBrowserContext(),page=await context.newPage();
  await page.setViewport({width,height:1000});
  if(cookies.length) await page.setCookie(...cookies);
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request',request=>{
    // Viewing a Waypoint must be read-only; abort and report any application write.
    if(new URL(request.url()).origin===url.origin&&!['GET','HEAD','OPTIONS'].includes(request.method())) {
      browserWrites.push({method:request.method(),path:new URL(request.url()).pathname});return request.abort();
    }
    return request.continue();
  });
  return {context,page};
}
async function open(page,path='/waypoints'){
  const response=await page.goto(base+path,{waitUntil:'networkidle0',timeout:90000});
  assert.equal(response.status(),200,`${path} responds200`);
  await page.waitForSelector('.waypoint-display-card .waypoint-scripture-passage blockquote',{timeout:30000});
  const html=await response.text();
  assert(!html.includes('"reflections":')&&!html.includes('\\"reflections\\":'),'no four-variant map in HTML/RSC payload');
  return html;
}
async function verifySelected(page,w,primary){
  await page.waitForFunction(id=>document.querySelector('.waypoint-display-card')?.dataset.waypointId===id,{},w.id);
  const actual=await page.$eval('.waypoint-display-card',card=>({
    id:card.dataset.waypointId,
    date:card.querySelector('.waypoint-card-topline span:last-child').textContent,
    title:card.querySelector('h2').textContent,
    body:[...card.querySelectorAll('.waypoint-body > p')].map(p=>p.textContent),
    reference:card.querySelector('.waypoint-scripture').textContent,
    passage:card.querySelector('.waypoint-scripture-passage blockquote').textContent,
    translation:card.querySelector('.waypoint-scripture-passage h3').textContent,
    attribution:card.querySelector('.waypoint-scripture-attribution').textContent,
    reflection:card.querySelector('.waypoint-reflection-box span').textContent,
    order:!!(card.querySelector('.waypoint-body').compareDocumentPosition(card.querySelector('.waypoint-scripture-passage'))&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(card.querySelector('.waypoint-scripture-passage').compareDocumentPosition(card.querySelector('.waypoint-reflection-box'))&Node.DOCUMENT_POSITION_FOLLOWING),
    passageCount:card.querySelectorAll('.waypoint-scripture-passage').length,
  }));
  assert.equal(actual.id,w.id);assert.equal(actual.date,w.date);assert.equal(actual.title,w.title);assert.deepEqual(actual.body,w.body,'original full devotional body');
  assert.equal(actual.reference,w.scripture);assert.equal(normal(actual.passage),normal(w.scriptureText),'complete passage, no truncation');
  assert(actual.translation.includes(w.scripture)&&actual.translation.includes('NIV'),'reference and NIV directly label passage');
  assert.equal(normal(actual.attribution),normal(w.scriptureAttribution));
  assert.equal(actual.reflection,types.includes(primary)?w.reflections[primary]:w.reflection,`only saved ${primary||'generic'} reflection`);
  assert(actual.order,'passage placed after devotional body and before For your design');assert.equal(actual.passageCount,1);
  for(const t of types.filter(t=>t!==primary)) assert(!actual.reflection.includes(w.reflections[t]),'no other design reflection in rendered card');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal page overflow');
  assertions++;
}
async function verifyPayload(html,primary){
  for(const w of releaseList()) {
    for(const t of types.filter(t=>t!==primary)) {
      assert(!html.includes(w.reflections[t]),`${w.id}: ${t} variant not delivered to browser`);
      assert(!html.includes(JSON.stringify(w.reflections[t]).slice(1,-1)),`${w.id}: escaped ${t} variant not delivered`);
    }
  }
}
async function choose(page,w){
  const found=await page.$$eval('.waypoint-result-card',(cards,id)=>{const card=cards.find(c=>c.dataset.waypointId===id);if(!card)return false;card.click();return true;},w.id);
  assert(found,`${w.id} selectable in archive`);
}
try {
  // Fail before creating any synthetic data if the server is not ready.
  const ready=await fetch(base+'/waypoints');assert.equal(ready.status,200,'Waypoints server must be ready before seeding users');
  browser=await puppeteer.launch({args:chromium.args.filter(a=>a!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
  const profiles=[];
  const guard=await createUser('foreign-owner');
  for(const [index,primary] of [...types,'','Unknown'].entries()) {
    const user=await createUser(primary.toLowerCase()||'missing');
    const conflict=types[(index+1)%types.length];
    const cells={Primary:primary,Secondary:conflict,...Object.fromEntries(types.map(t=>[t+'_Pts',t===primary?1:98]))};
    const section=['summary','reportPayload','profileLanguage','root','summary','reportPayload'][index];
    const scores=section==='root'?cells:{[section]:cells};
    let linked=null;
    // Legacy email-only participant is readable, but must remain unclaimed after viewing.
    if(index===0) linked=await participant(user.email);
    if(index===1){
      const foreign=await participant(user.email,guard.id);
      await snapshot(null,{summary:{Primary:'Shepherd'}},'2099-01-01T00:00:00Z',foreign.id);
    }
    await snapshot(linked?null:user,scores,'2026-10-20T12:00:00Z',linked?.id);
    // Insert older source report LAST: source recency, not created_at or score rank, wins.
    await snapshot(user,{summary:{Primary:conflict,...Object.fromEntries(types.map(t=>[t+'_Pts',t===conflict?999:0]))}},'2020-01-01T00:00:00Z');
    profiles.push({user,primary,cookies:await cookiesFor(user)});
  }
  const before=await protectedState();
  for(const {user,primary,cookies} of profiles){
    const {context,page}=await pageFor(cookies,primary==='Steward'?320:1280);
    let html=await open(page);await verifyPayload(html,primary);
    const released=releaseList();
    await verifySelected(page,released[0],primary);
    for(const w of [...new Map([released[1],released.at(-1)].filter(Boolean).map(w=>[w.id,w])).values()]){await choose(page,w);await verifySelected(page,w,primary);}
    // A valid owner-review query must not override the real learner's saved Primary.
    html=await open(page,'/waypoints?review=new&key='+encodeURIComponent(cfg.review_token));await verifyPayload(html,primary);await verifySelected(page,releaseList()[0],primary);
    if(primary==='Architect') {await page.setViewport({width:390,height:1000});await verifySelected(page,releaseList()[0],primary);}
    console.log(`PASS real signed-in ${primary||'missing Primary → generic'}: saved Primary beats conflicting scores; latest source report; current/archive full NIV; preview isolation`);
    await context.close();
  }
  {
    const {context,page}=await pageFor([],390);
    let html=await open(page);await verifyPayload(html,'');
    // Every currently released archive item, not just the current week.
    for(const w of releaseList()){await choose(page,w);await verifySelected(page,w,'');}
    assert.equal(await page.$$eval('.waypoint-result-card',cards=>cards.length),releaseList().length,'future Waypoints not browser accessible');
    for(const review of ['new','heather']){
      html=await open(page,`/waypoints?review=${review}&key=${encodeURIComponent(cfg.review_token)}`);await verifyPayload(html,'');await verifySelected(page,releaseList()[0],'');
    }
    console.log('PASS anonymous: every released archive item full NIV/generic; valid owner+Heather preview queries never supply another person’s Primary');
    await context.close();
  }
  assert.deepEqual(pageErrors,[],'no browser runtime errors');assert.deepEqual(browserWrites,[],'viewing never attempts a write');
  assert.deepEqual(await protectedState(),before,'no participant linking, saved snapshot, note, workbook, reflection or subscription mutation');
  console.log(`PASS ${assertions} rendered-card checks, 4 Primary+missing+unrecognized, latest report/foreign ownership/no side effects; target=${base}`);
} finally {
  if(browser)await browser.close();
  for(const client of sessions){try{ok(await client.auth.signOut({scope:'global'}));}catch(e){cleanupErrors.push('session revocation: '+e.message);}}
  // Every deletion is bounded to IDs created by this exact run.
  if(snapshotIds.length)try{ok(await admin.from('assessment_snapshots').delete().in('id',snapshotIds));}catch(e){cleanupErrors.push('snapshots: '+e.message);}
  if(participantIds.length)try{ok(await admin.from('assessment_participants').delete().in('id',participantIds));}catch(e){cleanupErrors.push('participants: '+e.message);}
  for(const user of users)try{ok(await admin.auth.admin.deleteUser(user.id));}catch(e){cleanupErrors.push('synthetic user: '+e.message);}
  if(snapshotIds.length)try{assert.equal(ok(await admin.from('assessment_snapshots').select('id').in('id',snapshotIds)).length,0);}catch(e){cleanupErrors.push('snapshot cleanup verification: '+e.message);}
  if(participantIds.length)try{assert.equal(ok(await admin.from('assessment_participants').select('id').in('id',participantIds)).length,0);}catch(e){cleanupErrors.push('participant cleanup verification: '+e.message);}
  for(const user of users)try{const result=await admin.auth.admin.getUserById(user.id);assert(result.error&&!result.data.user,'synthetic auth account removed');}catch(e){cleanupErrors.push('auth cleanup verification: '+e.message);}
  assert.deepEqual(cleanupErrors,[],'all synthetic data and sessions must be cleaned even after test failure');
  console.log(`CLEANUP verified ${users.length} disposable accounts, ${snapshotIds.length} snapshots, ${participantIds.length} participants; no external emails`);
}
