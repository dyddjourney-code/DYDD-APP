import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {createRequire} from 'node:module';import {createClient} from '@supabase/supabase-js';
import {grantCircleFixture,validLifecyclePlan,cleanupCircleFixtures} from './lifecycle-circle-fixtures.mjs';
const require=createRequire(import.meta.url),load=require('../scripts/fruitlife-test-load.cjs'),c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(c.ref,'atemrshtshxoqnuevvqu');process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';delete process.env.DYDD_SANDBOX_EMAIL_ENABLED;
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),ok=r=>{assert(!r.error,r.error?.message);return r.data;},users=[],circles=[];
const mocks={'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/email/resend':{sendResendEmail:()=>{throw Error('No real provider calls allowed');}}};
const {blankCirclePlan}=load('lib/circles/plan.ts',mocks),{circleMessageDrafts}=load('lib/lifecycle/templates.ts',mocks),{processLifecycleEvents,runLifecycleWorker}=load('lib/lifecycle/worker.ts',mocks),{queueApprovedHeldCircleInvitations}=load('lib/lifecycle/circle-held-mail.ts',mocks);
try{
 for(const role of ['creator','member']){const user=ok(await db.auth.admin.createUser({email:'held-mail-'+role+'-'+crypto.randomUUID()+'@example.test',password:crypto.randomBytes(24).toString('hex'),email_confirm:true})).user;users.push(user);await grantCircleFixture(db,user);}
 const [creator,member]=users,circle=crypto.randomUUID();circles.push(circle);
 const plan=validLifecyclePlan({...blankCirclePlan(),name:'Synthetic held mail review',startDate:'2027-01-07',time:'19:00',location:'Synthetic QA room',meetingCount:3,participants:[{name:'QA Member',email:member.email}]});
 ok(await db.from('journey_circle_plans').insert({id:circle,user_id:creator.id,status:'active',plan}));
 ok(await db.rpc('dydd_circle_operate',{actor:creator.id,owner_actor:false,payload:{action:'invite',circleId:circle,name:'QA Member',email:member.email}}));
 const held=ok(await db.from('dydd_circle_held_outbox').select('*').eq('circle_id',circle).eq('kind','invitation').single());
 assert.equal(ok(await db.from('journey_circle_plans').select('revision').eq('id',circle).single()).revision,1,'Same saved roster must not invalidate current schedule');
 assert.equal(ok(await db.from('dydd_lifecycle_events').select('id').eq('event_key','circle-held-invitation:'+held.id)).length,1);
 await processLifecycleEvents();assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('id').eq('circle_id',circle)).length,0,'Unapproved hold cannot create invitation send job');
 const campaign=ok(await db.from('dydd_circle_campaigns').insert({circle_id:circle,circle_revision:1,plan_snapshot:plan}).select().single());
 const drafts=ok(await db.from('dydd_circle_message_drafts').insert(circleMessageDrafts(plan,'https://dydd-online-school-sandbox.vercel.app').map(d=>({...d,campaign_id:campaign.id}))).select());
 for(const d of drafts)ok(await db.rpc('dydd_update_circle_message',{message_id:d.id,actor_user:creator.id,actor_scope:null,expected_revision:1,new_subject:d.subject,new_body:d.body,approve:true}));
 ok(await db.rpc('dydd_finalize_circle_campaign',{campaign_key:campaign.id,actor_user:creator.id,actor_scope:null}));
 await processLifecycleEvents();await queueApprovedHeldCircleInvitations(circle);await queueApprovedHeldCircleInvitations(circle);
 const jobs=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('circle_id',circle)),invites=jobs.filter(j=>j.template_id==='D01'),reminders=jobs.filter(j=>j.template_id==='D02');assert.equal(invites.length,1);assert.equal(reminders.length,1);
 assert(invites[0].body.includes(held.payload.token));assert.equal(invites[0].context.heldOutboxId,held.id);assert.equal(invites[0].context.sourceCreatedAt,held.created_at);assert.equal(invites[0].context.draftRevision,2);
 await runLifecycleWorker({limit:100});assert.equal(ok(await db.from('dydd_lifecycle_jobs').select('status').eq('id',invites[0].id).single()).status,'sandbox_ready');
 console.log('PASS paid operations invitation → atomic held intent/event; no approval=no email; current full approval/finalization → one D01+one D02 with original stable token; repeated reconciliation deduplicates; SQL submission fence then sandbox guard; no provider calls');
}finally{await cleanupCircleFixtures(db,{users,circles});}
