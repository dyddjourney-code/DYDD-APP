import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {createClient} from '@supabase/supabase-js';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),load=require('../scripts/fruitlife-test-load.cjs'),c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),anon=createClient(c.project_url,c.anon_key,{auth:{persistSession:false}}),ok=r=>{assert(!r.error,r.error?.message);return r.data;},suffix=crypto.randomUUID(),email=`lifecycle-${suffix}@example.test`;
let user,circle,campaign;const tracked=[];
const mocks={'server-only':{},'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/email/resend':{sendResendEmail:async()=>{throw Error('Provider transport must not run in sandbox');}}};
const {circleMessageDrafts}=load('lib/lifecycle/templates.ts',mocks),{blankCirclePlan}=load('lib/circles/plan.ts',mocks),{processLifecycleEvents,runLifecycleWorker,lifecycleEligibility}=load('lib/lifecycle/worker.ts',mocks),{enqueueCampaignMembers}=load('lib/lifecycle/store.ts',mocks);
try{
 user=ok(await db.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('hex'),email_confirm:true})).user;
 assert(ok(await db.from('dydd_lifecycle_events').select('*').eq('event_key','account-verified:'+user.id).single()));
 await processLifecycleEvents();await processLifecycleEvents();
 let welcomes=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('user_id',user.id).eq('template_id','A03'));assert.equal(welcomes.length,1);
 let run=await runLifecycleWorker({limit:50});assert(run.sandbox);assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('status').eq('id',welcomes[0].id).single()).status,'sandbox_ready');
 console.log('PASS real verified-account trigger → durable once-only welcome → sandbox-ready, with provider transport forbidden');
 const p={...blankCirclePlan(),name:'Lifecycle QA '+suffix,startDate:'2027-01-07',time:'19:00',location:'QA Room',participants:[{name:'Fixture member',email}],meetingCount:3};
 circle=crypto.randomUUID();ok(await db.from('journey_circle_plans').insert({id:circle,user_id:user.id,status:'active',plan:p}));
 campaign=ok(await db.from('dydd_circle_campaigns').insert({circle_id:circle,circle_revision:1,plan_snapshot:p}).select().single()).id;
 const drafts=ok(await db.from('dydd_circle_message_drafts').insert(circleMessageDrafts(p,'https://sandbox.example').map(d=>({...d,campaign_id:campaign}))).select());
 const finalize=actor=>db.rpc('dydd_finalize_circle_campaign',{campaign_key:campaign,actor_user:actor,actor_scope:null});
 assert((await finalize(crypto.randomUUID())).error);assert((await finalize(user.id)).error);
 for(const d of drafts){
  assert((await db.rpc('dydd_update_circle_message',{message_id:d.id,actor_user:crypto.randomUUID(),actor_scope:null,expected_revision:1,new_subject:d.subject,new_body:d.body,approve:true})).error);
  ok(await db.rpc('dydd_update_circle_message',{message_id:d.id,actor_user:user.id,actor_scope:null,expected_revision:1,new_subject:d.subject,new_body:d.body,approve:true}));
 }
 const d=drafts[0];assert((await db.rpc('dydd_update_circle_message',{message_id:d.id,actor_user:user.id,actor_scope:null,expected_revision:1,new_subject:d.subject,new_body:d.body,approve:true})).error);
 ok(await db.rpc('dydd_update_circle_message',{message_id:d.id,actor_user:user.id,actor_scope:null,expected_revision:2,new_subject:d.subject,new_body:d.body+'\nQA edited.',approve:false}));assert((await finalize(user.id)).error);
 ok(await db.rpc('dydd_update_circle_message',{message_id:d.id,actor_user:user.id,actor_scope:null,expected_revision:3,new_subject:d.subject,new_body:d.body+'\nQA edited.',approve:true}));
 const m=ok(await db.from('dydd_circle_memberships').insert({circle_id:circle,email,display_name:'QA',user_id:user.id,status:'accepted',accepted_at:new Date().toISOString(),token_hash:suffix,expires_at:'2027-02-01'}).select().single());
 const fin=await Promise.all([finalize(user.id),finalize(user.id)]);fin.forEach(ok);
 const jobs=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('campaign_id',campaign));assert.equal(new Set(jobs.map(j=>j.event_key)).size,jobs.length);
 assert(jobs.length>0);assert(!jobs.some(j=>['D01','D02'].includes(j.template_id)));
 assert((await db.rpc('dydd_update_circle_message',{message_id:d.id,actor_user:user.id,actor_scope:null,expected_revision:4,new_subject:'Cannot mutate',new_body:'Sent history stays frozen',approve:true})).error);
 console.log('PASS creator-only edits, individual approval, stale revisions, edit resets approval, all-approved finalization and concurrent publication dedup');
 const memberJob=jobs.find(j=>j.template_id==='E02');assert.deepEqual(await lifecycleEligibility(memberJob),{});
 ok(await db.from('dydd_circle_memberships').update({reminders:false}).eq('id',m.id));assert.match((await lifecycleEligibility(memberJob)).stop,/disabled/);
 ok(await db.from('dydd_circle_memberships').update({reminders:true}).eq('id',m.id));
 ok(await db.from('dydd_email_preferences').upsert({email,user_id:user.id,optional_disabled:true}));assert.match((await lifecycleEligibility(memberJob)).stop,/Global/);
 ok(await db.from('dydd_email_preferences').update({optional_disabled:false}).eq('email',email));
 ok(await db.from('dydd_circle_memberships').update({status:'left'}).eq('id',m.id));assert.match((await lifecycleEligibility(memberJob)).stop,/accepted/);
 ok(await db.from('dydd_circle_memberships').update({status:'accepted'}).eq('id',m.id));
 ok(await db.from('dydd_circle_campaigns').update({status:'paused'}).eq('id',campaign));assert((await lifecycleEligibility(memberJob)).deferUntil);
 ok(await db.from('dydd_circle_campaigns').update({status:'finalized'}).eq('id',campaign));
 ok(await db.from('dydd_lifecycle_jobs').update({status:'accepted',provider_id:'qa-'+suffix,accepted_at:new Date().toISOString()}).eq('id',jobs[0].id));assert((await db.from('dydd_lifecycle_jobs').update({body:'tampered'}).eq('id',jobs[0].id)).error);
 const updated={...p,location:'New QA Room'};ok(await db.from('journey_circle_plans').update({plan:updated,revision:2}).eq('id',circle));
 assert.equal(ok(await db.from('dydd_circle_campaigns').select('status').eq('id',campaign).single()).status,'superseded');
 assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('status').eq('id',jobs[0].id).single()).status,'accepted');
 assert.match((await lifecycleEligibility(memberJob)).stop,/revision|replaced/);
 assert((await finalize(user.id)).error);
 console.log('PASS send-time global/Circle preferences, accepted membership, paused schedule, immutable accepted copy, revision cancels queued jobs but preserves sent history');
 const queued=ok(await db.from('dydd_lifecycle_jobs').insert({event_key:'qa-claim:'+suffix,template_id:'A03',category:'service',user_id:user.id,email,subject:'QA claim',body:'Not a real email',scheduled_at:new Date(Date.now()-1000).toISOString(),expires_at:new Date(Date.now()+3600000).toISOString()}).select().single());tracked.push(queued.id);
 const claims=(await Promise.all(Array.from({length:8},()=>db.rpc('dydd_claim_lifecycle_jobs',{batch_size:50})))).flatMap(ok).filter(j=>j.id===queued.id);assert.equal(claims.length,1);
 ok(await db.from('dydd_lifecycle_jobs').update({claimed_at:new Date(Date.now()-11*60000).toISOString()}).eq('id',queued.id));assert(ok(await db.rpc('dydd_claim_lifecycle_jobs',{batch_size:50})).some(j=>j.id===queued.id));
 ok(await db.from('dydd_lifecycle_jobs').update({status:'retry',first_attempt_at:new Date(Date.now()-24*3600000).toISOString()}).eq('id',queued.id));await db.rpc('dydd_claim_lifecycle_jobs',{batch_size:50});assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('status').eq('id',queued.id).single()).status,'review');
 for(const table of ['dydd_lifecycle_events','dydd_lifecycle_jobs','dydd_circle_campaigns','dydd_circle_message_drafts','dydd_circle_memberships','dydd_email_preferences','dydd_email_preference_tokens']){const r=await anon.from(table).select();assert(r.error||!r.data.length,table+' must not leak');}
 assert((await anon.rpc('dydd_claim_lifecycle_jobs',{batch_size:1})).error);
 console.log('PASS eight workers claim once, stale leases recover, provider ambiguity expires to manual review, anonymous tables/RPC denied');
}finally{
 if(circle)await db.from('journey_circle_plans').delete().eq('id',circle);
 await db.from('dydd_email_preferences').delete().eq('email',email);await db.from('dydd_email_preference_tokens').delete().eq('email',email);
 if(user)await db.auth.admin.deleteUser(user.id);
 console.log('Sandbox-only lifecycle fixtures removed; no email provider calls');
}
