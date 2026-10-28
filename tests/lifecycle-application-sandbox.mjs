import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {createClient} from '@supabase/supabase-js';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),load=require('../scripts/fruitlife-test-load.cjs'),c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(c.ref,'atemrshtshxoqnuevvqu');
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),ok=r=>{assert(!r.error,r.error?.message);return r.data;},suffix=crypto.randomUUID(),email=`app-mail-${suffix}@example.test`;let calls=0,mode='timeout',participant,session;
const mocks={'server-only':{},'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/email/resend':{sendResendEmail:async input=>{calls++;assert(input.idempotencyKey.includes(suffix));return mode==='timeout'?{sent:false,skipped:false,message:'Provider request interrupted; retry only with the same idempotency key.'}:{sent:true,skipped:false,id:'qa-mock-'+suffix};}}};
const {sendApplicationEmail}=load('lib/lifecycle/application-mail.ts',mocks),{lifecycleEligibility}=load('lib/lifecycle/worker.ts',mocks);
try{
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';
 const input={templateId:'requested-fixture',to:email,subject:'Exact existing subject',text:'Exact existing body\nwith unchanged line breaks.',html:'<p>Exact original HTML</p>',attachments:[{content:Buffer.from('QA attachment').toString('base64'),filename:'qa.txt'}],idempotencyKey:'qa-stable-'+suffix};
 let result=await sendApplicationEmail(input);assert(result.skipped);assert.equal(calls,0);result=await sendApplicationEmail(input);assert(result.skipped);
 let rows=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('event_key','application:'+input.idempotencyKey));assert.equal(rows.length,1);assert.deepEqual(rows[0].context.senderInput.attachments,input.attachments);assert.equal(rows[0].body,input.text);
 assert.match((await sendApplicationEmail({...input,text:'Changed body'})).message,/different email payload/);assert.equal(calls,0);
 console.log('PASS exact existing subject/plain text/HTML/attachments persisted once, JSONB reorder safe, payload drift rejected, sandbox sends no transport');
 // Only the synthetic fixture is dispatched; transport is mocked even in this non-sandbox code-path exercise.
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='mock-transport-test';
 result=await sendApplicationEmail(input);assert.equal(result.sent,false);assert.equal(calls,1);
 rows=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('event_key','application:'+input.idempotencyKey));assert.equal(rows[0].status,'retry');assert(rows[0].first_attempt_at);
 mode='accepted';result=await sendApplicationEmail(input);assert(result.sent);assert.equal(calls,2);result=await sendApplicationEmail(input);assert(result.sent);assert.equal(calls,2);
 rows=ok(await db.from('dydd_lifecycle_jobs').select('*').eq('event_key','application:'+input.idempotencyKey));assert.equal(rows[0].status,'accepted');assert.equal(rows[0].provider_id,'qa-mock-'+suffix);
 console.log('PASS durable transient retry keeps original business key/payload and provider-accepted replay never calls transport again (mock provider only)');
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';
 participant=ok(await db.from('assessment_participants').insert({normalized_email:email,display_name:'QA participant'}).select().single()).id;
 session=ok(await db.from('fruitlife_360_sessions').insert({participant_id:participant,participant_email:email,participant_name:'QA participant',session_status:'waiting_for_observers',report_status:'waiting_for_responses',source_system:'native_app'}).select().single()).id;
 const observerEmail='observer-'+email,link='https://sandbox.example/observer?token=qa-'+suffix;
 const invite=ok(await db.from('fruitlife_360_observer_invites').insert({session_id:session,observer_email:observerEmail,observer_name:'QA observer',invite_status:'invited',invite_token_hash:suffix,metadata:{observerLink:link}}).select().single());
 const initial={templateId:'B02',deliveryContext:{type:'fruitlife_observer',sessionId:session,observerEmail,observerLink:link},to:observerEmail,subject:'FruitLife360 reflection for QA participant',text:'Exact observer invitation with '+link,html:'<p>Exact observer invitation</p>',idempotencyKey:'qa-observer-'+suffix};
 await sendApplicationEmail(initial);await sendApplicationEmail(initial);
 const observerJobs=ok(await db.from('dydd_lifecycle_jobs').select('*').like('event_key','application:qa-observer-'+suffix+'%'));assert.equal(observerJobs.length,2);const reminder=observerJobs.find(j=>j.template_id==='B03');assert(reminder);assert(Date.parse(reminder.scheduled_at)-Date.parse(reminder.created_at)>4.9*86400000);
 assert.deepEqual(await lifecycleEligibility(reminder),{});
 ok(await db.from('fruitlife_360_observer_invites').update({invite_status:'completed',completed_at:new Date().toISOString()}).eq('id',invite.id));assert.match((await lifecycleEligibility(reminder)).stop,/completed/);
 ok(await db.from('fruitlife_360_observer_invites').update({invite_status:'invited',completed_at:null,metadata:{observerLink:link+'-new'}}).eq('id',invite.id));assert.match((await lifecycleEligibility(reminder)).stop,/replaced/);
 ok(await db.from('fruitlife_360_observer_invites').update({metadata:{observerLink:link}}).eq('id',invite.id));ok(await db.from('fruitlife_360_sessions').update({report_status:'ready'}).eq('id',session));assert.match((await lifecycleEligibility(reminder)).stop,/complete/);
 console.log('PASS one automatic five-day observer reminder, duplicate invocation dedup, completion/cycle-close/replaced-token stop guards');
 // Earlier category optouts must not reset other choices or undo global suppression.
 ok(await db.from('dydd_email_preferences').insert({email,learning:true,growth:true,optional_disabled:true}));
 for(const [token,category] of [['qa-old-'+suffix,'learning'],['qa-new-'+suffix,'growth']])ok(await db.from('dydd_email_preference_tokens').insert({token_hash:token,email,category}));
 assert(ok(await db.rpc('dydd_unsubscribe_category',{token_key:'qa-old-'+suffix})));let pref=ok(await db.from('dydd_email_preferences').select().eq('email',email).single());assert.equal(pref.learning,false);assert.equal(pref.growth,true);assert.equal(pref.optional_disabled,true);
 assert(ok(await db.rpc('dydd_unsubscribe_category',{token_key:'qa-new-'+suffix})));assert(ok(await db.rpc('dydd_unsubscribe_category',{token_key:'qa-old-'+suffix})));pref=ok(await db.from('dydd_email_preferences').select().eq('email',email).single());assert.equal(pref.optional_disabled,true);assert.equal(pref.growth,false);
 console.log('PASS historical one-click category links preserve other choices and never undo global optional suppression');
}finally{
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';await db.from('dydd_lifecycle_jobs').delete().like('event_key','%'+suffix+'%');
 await db.from('dydd_email_preference_tokens').delete().eq('email',email);await db.from('dydd_email_preferences').delete().eq('email',email);
 if(session)await db.from('fruitlife_360_sessions').delete().eq('id',session);if(participant)await db.from('assessment_participants').delete().eq('id',participant);
 console.log('Synthetic sandbox application-mail fixtures removed; all provider calls mocked');
}
