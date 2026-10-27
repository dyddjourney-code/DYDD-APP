import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {createClient} from '@supabase/supabase-js';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),load=require('../scripts/fruitlife-test-load.cjs'),c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(c.ref,'atemrshtshxoqnuevvqu');process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),ok=r=>{assert(!r.error,r.error?.message);return r.data;},suffix=crypto.randomUUID(),email=`race-${suffix}@example.test`;let user,circle;const standalone=[];
const mocks={'server-only':{},'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/email/resend':{sendResendEmail:async()=>{throw Error('No provider calls');}}};
const {blankCirclePlan}=load('lib/circles/plan.ts',mocks),{circleMessageDrafts,localInstant}=load('lib/lifecycle/templates.ts',mocks),{enqueueCampaignMembers}=load('lib/lifecycle/store.ts',mocks),{lifecycleEligibility,processLifecycleEvents}=load('lib/lifecycle/worker.ts',mocks);
const future=hours=>new Date(Date.now()+hours*3600000).toISOString();
try{
 user=ok(await db.auth.admin.createUser({email,password:crypto.randomBytes(24).toString('hex'),email_confirm:true})).user;
 const p={...blankCirclePlan(),name:'Race QA',startDate:'2027-01-07',time:'19:00',location:'QA Room',participants:[{name:'QA Member',email}],meetingCount:2};circle=crypto.randomUUID();ok(await db.from('journey_circle_plans').insert({id:circle,user_id:user.id,status:'active',plan:p}));
 const campaign=ok(await db.from('dydd_circle_campaigns').insert({circle_id:circle,circle_revision:1,plan_snapshot:p}).select().single());
 const drafts=ok(await db.from('dydd_circle_message_drafts').insert(circleMessageDrafts(p,'https://sandbox.example').map(d=>({...d,campaign_id:campaign.id,approved_at:new Date().toISOString(),approved_by:user.id}))).select());ok(await db.rpc('dydd_finalize_circle_campaign',{campaign_key:campaign.id,actor_user:user.id,actor_scope:null}));
 const issue=token=>db.rpc('dydd_issue_circle_invitation',{campaign_key:campaign.id,actor_user:user.id,recipient:email,person_name:'QA Member',new_token_hash:token,expires:'2027-01-14T23:59:00Z',invitation_url:'https://sandbox.example/invite?token='+token});
 const issued=(await Promise.all([issue('token-a-'+suffix),issue('token-b-'+suffix)])).map(ok);assert.equal(issued.filter(Boolean).length,1);
 let m=ok(await db.from('dydd_circle_memberships').select('*').eq('circle_id',circle).single());assert.equal(m.token_hash,issued.find(Boolean).token_hash);
 ok(await db.from('dydd_circle_memberships').update({status:'accepted',user_id:user.id,accepted_at:new Date().toISOString()}).eq('id',m.id));assert.equal(ok(await issue('cannot-reinvite-'+suffix)),null);assert.equal(ok(await db.from('dydd_circle_memberships').select('status').eq('id',m.id).single()).status,'accepted');
 console.log('PASS concurrent invitation issuance produces one stable token; accepted membership cannot be reset to invited');
 ok(await db.from('dydd_circle_campaigns').update({status:'paused'}).eq('id',campaign.id));await processLifecycleEvents(100);await enqueueCampaignMembers(campaign.id,m.id);
 let memberJobs=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('campaign_id',campaign.id).eq('membership_id',m.id));assert(memberJobs.length>3);assert(memberJobs.some(j=>j.template_id==='D03'));
 ok(await db.from('dydd_circle_campaigns').update({status:'finalized'}).eq('id',campaign.id));await enqueueCampaignMembers(campaign.id);assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('id').eq('campaign_id',campaign.id).eq('membership_id',m.id)).length,memberJobs.length);
 console.log('PASS acceptance processed while paused retains complete durable future schedule; resume reconciliation is idempotent');
 const memberJob=memberJobs.find(j=>j.template_id==='E02'),claim=crypto.randomUUID();ok(await db.from('dydd_lifecycle_jobs').update({status:'processing',claim_token:claim,claimed_at:new Date().toISOString()}).eq('id',memberJob.id));
 assert.deepEqual(await lifecycleEligibility(memberJob),{});
 ok(await db.from('dydd_circle_memberships').update({reminders:false}).eq('id',m.id));let fence=ok(await db.rpc('dydd_authorize_lifecycle_send',{job_key:memberJob.id,lease_token:claim}));assert.equal(fence.authorized,false);assert.match(fence.stop,/reminder choice/);
 ok(await db.from('dydd_circle_memberships').update({reminders:true}).eq('id',m.id));
 ok(await db.from('journey_circle_plans').update({plan:{...p,location:'Revised room'},revision:2}).eq('id',circle));fence=ok(await db.rpc('dydd_authorize_lifecycle_send',{job_key:memberJob.id,lease_token:claim}));assert.equal(fence.authorized,false);assert(fence.lostClaim);
 console.log('PASS optout after preflight is caught by atomic send fence; schedule cancellation before fence loses lease and cannot submit');
 // Shared cadence is reserved atomically even by competing independent workers.
 ok(await db.from('dydd_email_preferences').insert({email,user_id:user.id,learning:true,growth:true}));
 const jobs=ok(await db.from('dydd_lifecycle_jobs').insert([1,2].map(i=>({event_key:`qa-cadence:${suffix}:${i}`,template_id:'C06',category:'learning',user_id:user.id,email,subject:'QA cadence '+i,body:'QA only',scheduled_at:future(-1),expires_at:future(12),status:'processing',claim_token:crypto.randomUUID(),claimed_at:new Date().toISOString()}))).select());standalone.push(...jobs.map(j=>j.id));
 const reservations=(await Promise.all(jobs.map(j=>db.rpc('dydd_authorize_lifecycle_send',{job_key:j.id,lease_token:j.claim_token})))).map(ok);assert.equal(reservations.filter(r=>r.authorized).length,1);assert(reservations.some(r=>r.defer));
 const authorized=ok(await db.from('dydd_lifecycle_jobs').select('*').in('id',jobs.map(j=>j.id)).eq('status','submitting').single());assert(authorized.send_authorized_at);
 console.log('PASS concurrent optional sends reserve a single recipient cadence slot; already-submitting state is explicit');
 const waiting=jobs.find(j=>j.id!==authorized.id);
 ok(await db.from('dydd_lifecycle_jobs').update({attempts:8}).eq('id',authorized.id));await db.rpc('dydd_claim_lifecycle_jobs',{batch_size:50});assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('status').eq('id',authorized.id).single()).status,'submitting','active eighth submission must not be failed by competing claim');
 ok(await db.from('dydd_lifecycle_jobs').update({status:'retry'}).eq('id',authorized.id));await db.rpc('dydd_claim_lifecycle_jobs',{batch_size:50});assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('status').eq('id',authorized.id).single()).status,'review');
 const reserved=ok(await db.rpc('dydd_authorize_lifecycle_send',{job_key:waiting.id,lease_token:waiting.claim_token}));assert(reserved.defer,'ambiguous retry/review retains recipient-wide cadence reservation');
 console.log('PASS active eighth submission survives competing worker; ambiguous retry cap goes to review and retains recipient cadence reservation');

 const reminder=drafts.find(d=>d.template_id==='E02');assert.equal(Date.parse(reminder.expires_at),Date.parse(localInstant('2027-01-07','00:00','America/New_York')));assert.match((await lifecycleEligibility({...memberJob,expires_at:reminder.expires_at},Date.parse(localInstant('2027-01-07','09:00','America/New_York')))).stop,/expired/);
 console.log('PASS tomorrow reminders cannot survive into meeting-day morning after pause/outage');
}finally{
 if(circle)await db.from('journey_circle_plans').delete().eq('id',circle);if(user)await db.auth.admin.deleteUser(user.id);await db.from('dydd_email_preferences').delete().eq('email',email);await db.from('dydd_email_preference_tokens').delete().eq('email',email);console.log('Race-test sandbox fixtures removed; no provider calls');
}
