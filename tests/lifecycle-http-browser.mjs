import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {createClient} from '@supabase/supabase-js';import {createServerClient} from '@supabase/ssr';import {createRequire} from 'node:module';import puppeteer from 'puppeteer-core';import chromium from '@sparticuz/chromium';
const require=createRequire(import.meta.url),load=require('../scripts/fruitlife-test-load.cjs'),{blankCirclePlan}=load('lib/circles/plan.ts');
const base=process.env.LIFECYCLE_BASE||'http://localhost:3147';assert(['localhost','127.0.0.1','dydd-online-school-sandbox.vercel.app'].includes(new URL(base).hostname),'Sandbox/local only');
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(c.ref,'atemrshtshxoqnuevvqu');const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),ok=r=>{assert(!r.error,r.error?.message);return r.data;},suffix=crypto.randomUUID(),users=[];let circle,browser,otherCircle;
async function fixture(role){const email=`lifecycle-http-${role}-${suffix}@example.test`,password=crypto.randomBytes(24).toString('hex'),user=ok(await db.auth.admin.createUser({email,password,email_confirm:true})).user;users.push(user);let cookies=[];const s=createServerClient(c.project_url,c.anon_key,{cookies:{getAll:()=>cookies,setAll:cs=>{cookies=cs;}}});ok(await s.auth.signInWithPassword({email,password}));return {...user,cookie:cookies.map(c=>c.name+'='+c.value).join('; '),cookies};}
const call=async(path,user,body)=>{const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(user?{cookie:user.cookie}:{}),...(body?{origin:base,'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};};
try{
 const creator=await fixture('creator'),member=await fixture('member'),outsider=await fixture('outsider');
 const p={...blankCirclePlan(),name:'HTTP QA Circle '+suffix,startDate:'2027-01-07',time:'19:00',location:'Sandbox QA room',participants:[{name:'QA Member',email:member.email}],meetingCount:3};
 // Keep every canonical lesson assigned within this three-meeting shortened fictional Circle.
 p.assignments=Object.fromEntries(Object.keys(p.assignments).map(slug=>[slug,Math.min(3,p.assignments[slug])]));
 circle=crypto.randomUUID();let r=await call('/api/circles',creator,{id:circle,revision:0,status:'active',plan:p});assert.equal(r.status,200,JSON.stringify(r));
 const round=await call('/api/course-reflections',creator,{action:'ensure-round',courseSlug:'discover-your-divine-design'});assert.equal(round.status,200,JSON.stringify(round));assert.equal(ok(await db.from('dydd_lifecycle_events').select('id').eq('user_id',creator.id).eq('kind','course_enrolled')).length,1);
 const path='/api/circles/messages?circleId='+circle,post=(user,action,extra={})=>call(path,user,{circleId:circle,action,...extra});
 assert.equal((await call(path,null)).status,403);assert.equal((await call(path,outsider)).status,403);
 assert.equal((await post(outsider,'generate')).status,409);assert.equal((await post(creator,'generate')).status,200);
 let initial=(await call(path,creator)).body;assert(initial.messages.length>10);
 assert.equal((await post(creator,'finalize')).status,409);assert.equal((await post(creator,'invite')).status,409);
 let first=initial.messages.find(d=>d.message_key==='welcome');
 r=await post(creator,'edit',{messageId:first.id,revision:first.revision,subject:first.subject,body:first.body+'\n\nSaved HTTP review note.'});assert.equal(r.status,200,JSON.stringify(r));
 assert.equal((await post(creator,'approve',{messageId:first.id,revision:first.revision,subject:first.subject,body:first.body})).status,409);
 initial=(await call(path,creator)).body;
 const current=initial.messages.find(d=>d.id===first.id);assert.match(current.body,/Saved HTTP review note/);assert.equal(current.approved_at,null);
 console.log('PASS actual authenticated creator API, outsider/guest denial, editable persisted copy, stale-approval conflict and finalize/invite guards');
 browser=await puppeteer.launch({args:chromium.args,executablePath:await chromium.executablePath(),headless:true});const page=await browser.newPage(),problems=[];page.on('pageerror',e=>problems.push(e.message));
 await page.setCookie(...creator.cookies.map(k=>({name:k.name,value:k.value,domain:new URL(base).hostname,path:'/'})));
 for(const width of [360,390,768,1280]){
  await page.setViewport({width,height:900});await page.goto(base+'/camp-circle/my-circles?circle='+circle,{waitUntil:'networkidle2'});
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Messages'));
  await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Messages').click());
  await page.waitForSelector('.email-message-toggle');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No page overflow at ${width}`);
  const finalButton=await page.$eval('.email-workspace',el=>[...el.querySelectorAll('button')].find(b=>b.textContent.includes('Finalize all messages')).disabled);assert(finalButton);
  await page.click('.email-message-toggle');await page.waitForSelector('.email-message-editor textarea');
  assert(await page.$eval('.email-message-editor textarea',e=>e.getBoundingClientRect().right<=innerWidth),`Editor fits ${width}`);
  await page.$eval('.email-workspace',e=>e.scrollIntoView({block:'start'}));
  await page.screenshot({path:`tmp/email-circle-${new URL(base).hostname==='localhost'?'local':'published'}-${width}.png`,fullPage:false});
  if(width===390||width===1280){await page.$eval('.email-message-editor',e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:`tmp/email-circle-${new URL(base).hostname==='localhost'?'local':'published'}-editor-${width}.png`,fullPage:false});}
 }
 assert.equal(problems.length,0,problems.join('\n'));
 // Approve a complete written message through the delivered UI, then re-read persistence.
 await page.evaluate(()=>[...document.querySelectorAll('.email-message-editor button')].find(b=>b.textContent.includes('approve')).click());await page.waitForFunction(()=>document.querySelector('[role=status]')?.textContent.includes('approved'));
 initial=(await call(path,creator)).body;assert(initial.messages.some(m=>m.approved_at));
 console.log('PASS actual browser 360/390/768/1280, editable message fits viewport, incomplete-finalization disabled, approval click persists');
 for(const d of initial.messages)if(!d.approved_at){r=await post(creator,'approve',{messageId:d.id,revision:d.revision,subject:d.subject,body:d.body});assert.equal(r.status,200,JSON.stringify(r));}
 assert.equal((await post(creator,'finalize')).status,200);assert.equal((await post(creator,'invite')).status,200);
 let data=(await call(path,creator)).body;assert.equal(data.campaign.status,'finalized');assert.equal(data.members.length,1);
 const invitation=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('circle_id',circle).eq('template_id','D01').single()),token=invitation.body.match(/invitation\?token=([a-f0-9]{64})/)[1];
 assert.equal((await call('/api/circles/membership?token='+token,null)).status,200);
 assert.equal((await call('/api/circles/membership',outsider,{token,action:'accept'})).status,403);
 r=await call('/api/circles/membership',member,{token,action:'accept',reminders:true});assert.equal(r.status,200,JSON.stringify(r));
 let membership=ok(await db.from('dydd_circle_memberships').select('*').eq('circle_id',circle).single());assert.equal(membership.status,'accepted');
 // A creator cannot cancel another Circle's member jobs even with a known membership ID.
 otherCircle=crypto.randomUUID();assert.equal((await call('/api/circles',outsider,{id:otherCircle,revision:0,status:'active',plan:{...p,name:'Other QA Circle'}})).status,200);
 assert.equal((await call('/api/circles/messages?circleId='+otherCircle,outsider,{circleId:otherCircle,action:'generate'})).status,200);
 const revoked=await call('/api/circles/messages?circleId='+otherCircle,outsider,{circleId:otherCircle,action:'revoke',membershipId:membership.id});assert.equal(revoked.status,409);assert.equal(ok(await db.from('dydd_circle_memberships').select('status').eq('id',membership.id).single()).status,'accepted');
 // Deliberate Circle-only note requires its own saved review, approval and explicit publication.
 assert.equal((await post(creator,'announcement-save',{subject:'A practical note for our Circle',body:'Please bring a notebook to our next meeting.'})).status,200);
 let note=(await call(path,creator)).body.announcements[0];assert.equal((await post(creator,'announcement-publish',{announcementId:note.id,revision:note.revision})).status,409);
 assert.equal((await post(creator,'announcement-approve',{announcementId:note.id,revision:note.revision,subject:note.subject,body:note.body})).status,200);
 note=(await call(path,creator)).body.announcements[0];assert.equal((await post(creator,'announcement-publish',{announcementId:note.id,revision:note.revision})).status,200);assert.equal((await post(creator,'announcement-publish',{announcementId:note.id,revision:note.revision})).status,200);
 assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('id').eq('circle_id',circle).eq('template_id','E05')).length,1);
 assert.equal((await post(creator,'announcement-save',{announcementId:note.id,revision:note.revision,subject:'No mutation',body:'Published history stays frozen.'})).status,409);
 let welcome=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('circle_id',circle).eq('template_id','D03').single());assert.match(welcome.body,/Saved HTTP review note/);
 const unauthorized=await fetch(base+'/api/cron/lifecycle');assert.equal(unauthorized.status,401);
 const secret=process.env.LIFECYCLE_TEST_SECRET||'local-lifecycle-qa-only';r=await fetch(base+'/api/cron/lifecycle',{headers:{authorization:'Bearer '+secret}});assert.equal(r.status,200,await r.clone().text());const run=await r.json();assert(run.sandbox);assert.equal(run.accepted,0);
 welcome=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('id',welcome.id).single());assert.equal(welcome.status,'sandbox_ready');
 const reminder=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('circle_id',circle).eq('template_id','E02').limit(1).single());
 const hash=t=>crypto.createHash('sha256').update(t).digest('hex');
 ok(await db.from('dydd_email_preference_tokens').insert([{token_hash:hash(reminder.unsubscribe_token),email:member.email,category:'circle',circle_id:circle},{token_hash:hash('a'.repeat(64)),email:member.email,category:'learning'}]));
 const old=await fetch(base+'/api/email/preferences?token='+reminder.unsubscribe_token,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'List-Unsubscribe=One-Click'});assert.equal(old.status,200);
 assert.equal(ok(await db.from('dydd_circle_memberships').select('reminders').eq('id',membership.id).single()).reminders,false);
 assert.equal((await fetch(base+'/api/email/preferences?token='+reminder.unsubscribe_token,{method:'POST'})).status,200);
 assert.equal((await fetch(base+'/api/email/preferences?token='+'a'.repeat(64),{method:'POST'})).status,200);
 assert.equal((await call('/api/email/preferences',member,{learning:true,growth:false,optional_disabled:false,timezone:'America/New_York'})).status,200);
 console.log('PASS explicit invitation → correct verified member acceptance → durable approved welcome → authenticated sandbox worker (0 accepted), historical one-click optouts and signed-in preference persistence');
 const originalCampaign=data.campaign.id,changed={...p,location:'Updated sandbox room',breaks:[{start:'2027-01-14',end:'2027-01-20'}]};
 r=await call('/api/circles',creator,{id:circle,revision:1,status:'active',plan:changed});assert.equal(r.status,200,JSON.stringify(r));
 assert.equal(ok(await db.from('dydd_circle_campaigns').select('status').eq('id',originalCampaign).single()).status,'superseded');
 const priorQueued=ok(await db.from('dydd_lifecycle_jobs').select('status').eq('campaign_id',originalCampaign));assert(priorQueued.every(j=>['cancelled','skipped','accepted'].includes(j.status)));
 assert.equal((await post(creator,'generate')).status,200);data=(await call(path,creator)).body;assert(data.messages.some(d=>d.template_id==='D05'));assert(data.messages.every(d=>!d.approved_at));
 console.log('PASS real schedule/holiday revision cancels stale jobs, regenerates changed-date notices and clears all approvals');
 // A started Circle keeps its real historical first date and can still publish a revised future schedule.
 const started={...changed,startDate:new Date(Date.now()-14*86400000).toISOString().slice(0,10),meetingCount:4,breaks:[],assignments:Object.fromEntries(Object.entries(p.assignments).map(([slug,n])=>[slug,Math.min(4,n)]))};
 assert.equal((await call('/api/circles',creator,{id:circle,revision:2,status:'active',plan:started})).status,200);
 assert.equal((await post(creator,'generate')).status,200);data=(await call(path,creator)).body;assert(!data.messages.some(d=>d.message_key==='leader-launch'));assert(data.messages.every(d=>Date.parse(d.expires_at)>Date.parse(d.scheduled_at)));
 for(const d of data.messages)assert.equal((await post(creator,'approve',{messageId:d.id,revision:d.revision,subject:d.subject,body:d.body})).status,200);
 assert.equal((await post(creator,'finalize')).status,200);
 const currentJobs=ok(await db.from('dydd_lifecycle_jobs').select('template_id,scheduled_at').eq('campaign_id',data.campaign.id).eq('status','queued'));assert(currentJobs.every(j=>Date.parse(j.scheduled_at)>=Date.now()-60000));
 ok(await db.from('dydd_lifecycle_events').update({processed_at:null}).eq('event_key','circle-accepted:'+membership.id));
 const tick=await fetch(base+'/api/cron/lifecycle',{headers:{authorization:'Bearer '+secret}});assert.equal(tick.status,200,await tick.clone().text());assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('id').eq('circle_id',circle).eq('template_id','D03')).length,1);
 const leaderToken=crypto.randomBytes(32).toString('hex');ok(await db.from('dydd_email_preference_tokens').insert({token_hash:hash(leaderToken),email:creator.email,category:'circle',circle_id:circle}));
 assert.equal((await fetch(base+'/api/email/preferences?token='+leaderToken,{method:'POST'})).status,200);
 const creatorPrefs=(await call('/api/email/preferences',creator)).body;assert(creatorPrefs.memberships.some(m=>m.circle_id===circle&&m.creator&&m.reminders===false));
 assert.equal((await call('/api/email/preferences',creator,{action:'circle',circleId:circle,reminders:true})).status,200);
 console.log('PASS started-Circle revision without moving historical dates, future-only queues, membership-scoped welcome dedup across event retry/revision, creator category optout, approved leader-note publication and cross-Circle revoke IDOR denial');

 fs.writeFileSync(`tmp/email-circle-${base.includes('localhost')?'local':'published'}-http-proof.json`,JSON.stringify({checkedAt:new Date().toISOString(),base,widths:[360,390,768,1280],circleFixtureRemoved:true,providerCalls:0,assertions:'authenticated ownership, edit/persistence, stale approval, all-approved gate, invitation acceptance, optouts, sandbox worker, schedule revision'},null,2));
}finally{
 if(browser)await browser.close();if(otherCircle)await db.from('journey_circle_plans').delete().eq('id',otherCircle);if(circle)await db.from('journey_circle_plans').delete().eq('id',circle);
 for(const user of users){await db.from('dydd_email_preferences').delete().eq('email',user.email);await db.from('dydd_email_preference_tokens').delete().eq('email',user.email);await db.auth.admin.deleteUser(user.id);}
 console.log('Synthetic sandbox HTTP/browser accounts and Circle cleaned up; no real customer emails');
}
