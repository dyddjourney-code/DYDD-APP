// Isolated in-memory fixtures only: no credentials, network, or provider requests.
const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
let tables={},enqueued=[],providerCalls=[],claimed=[],fences=0;
class Q {
 constructor(table){this.table=table;this.filters=[];this.mode='read';}
 select(){return this;} eq(k,v){this.filters.push(r=>r[k]===v);return this;}
 in(k,v){this.filters.push(r=>v.includes(r[k]));return this;}
 is(k,v){this.filters.push(r=>r[k]==v);return this;}
 lt(k,v){this.filters.push(r=>r[k]<v);return this;}
 order(){return this;} limit(){return this;}
 update(patch){this.patch=patch;return this;}
 async run(single=false){const rows=(tables[this.table]||[]).filter(r=>this.filters.every(f=>f(r)));if(this.patch)rows.forEach(r=>Object.assign(r,this.patch));return {data:single?rows[0]||null:rows,error:null};}
 single(){return this.run(true);} maybeSingle(){return this.run(true);}
 then(resolve,reject){return this.run().then(resolve,reject);}
}
const db={from:t=>new Q(t),auth:{admin:{getUserById:async id=>({data:{user:{id,email:'self@example.invalid',email_confirmed_at:new Date().toISOString()}},error:null})}},rpc:async name=>{
 if(name==='dydd_claim_lifecycle_jobs')return {data:claimed,error:null};
 if(name==='dydd_authorize_lifecycle_send'){fences++;return {data:{authorized:true},error:null};}
 throw Error('Unexpected RPC '+name);
}};
const mocks={
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
 '@/lib/email/resend':{sendResendEmail:async input=>{providerCalls.push(input);return {sent:true,skipped:false,id:'mock-provider'};}},
 '@/lib/assessments/student-context':{getAssessmentSnapshotsForUser:async()=>{throw Error('Unexpected assessment lookup');}},
 '@/lib/passport/state':{completedFruitSessionsForEmail:async()=>{throw Error('Unexpected course lookup');}},
 '@/lib/lifecycle/store':{must:r=>{if(r.error)throw Error(r.error.message);return r.data;},appBase:()=> 'https://school.example.invalid',enqueueCampaignMembers:async()=>{throw Error('Unexpected Circle enqueue');},tokenHash:s=>s,enqueue:async row=>{
   enqueued.push(row);(tables.dydd_lifecycle_jobs??=[]).push({...row,id:'job-'+enqueued.length,status:'queued',attempts:0,first_attempt_at:null,context:JSON.parse(JSON.stringify(row.context))});
 }},
};
mocks['./store']=mocks['@/lib/lifecycle/store'];
const {lifecycleEligibility,processLifecycleEvents,runLifecycleWorker}=load('lib/lifecycle/worker.ts',mocks);
const {sendApplicationEmail}=load('lib/lifecycle/application-mail.ts',mocks);
const {suppressFruitLifeSelfEmail}=load('lib/lifecycle/fruitlife-email-policy.ts',mocks);
function job(template,type,extra={}) {return {id:'queued-'+template,template_id:template,email:type==='fruitlife_observer'?'observer@example.invalid':'self@example.invalid',category:'service',subject:'Fixture',body:'Fixture',expires_at:new Date(Date.now()+86400000).toISOString(),status:'processing',attempts:1,claim_token:'fixture-lease',context:{kind:'application',deliveryContext:{type,sessionId:'s',observerLink:'https://example.invalid/observer'},senderInput:{to:type==='fruitlife_observer'?'observer@example.invalid':'self@example.invalid',subject:'Fixture',text:'Fixture',html:'<p>Fixture</p>',idempotencyKey:'fixture-'+template}},...extra};}
(async()=>{
 const priorEnvironment=process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT,priorAutomation=process.env.DYDD_LIFECYCLE_AUTOMATION_ENABLED;
 try {
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='production';process.env.DYDD_LIFECYCLE_AUTOMATION_ENABLED='true';
 tables={dydd_lifecycle_settings:[{id:true,paused:false,activated_at:'2026-01-01T00:00:00Z'}],fruitlife_360_sessions:[{id:'s',participant_email:'self@example.invalid',session_status:'waiting_for_observers',report_status:'queued',self_completed_at:null,observer_goal:2,observer_completed_count:0}],fruitlife_360_observer_invites:[{session_id:'s',observer_email:'observer@example.invalid',invite_status:'invited',metadata:{observerLink:'https://example.invalid/observer'}}],fruitlife_360_report_artifacts:[{id:'pdf',session_id:'s',artifact_type:'pdf',artifact_status:'ready'}]};
 for(const mode of ['SELF_ONLY','WITH_OBSERVERS']) {
  tables.fruitlife_360_sessions[0].report_mode=mode;
  for(const [template,type] of [['B04-self','fruitlife_self'],['B04-self-reminder','fruitlife_self'],['B04-status','fruitlife_status'],['requested-service-email','fruitlife_self']]) {
   const input={...job(template,type).context.senderInput,templateId:template,deliveryContext:{type,sessionId:'s'}};
   assert.equal((await sendApplicationEmail(input)).skipped,true,`${mode} ${template}`);
   for(const status of ['queued','retry','processing','submitting','sandbox_ready'])assert.match((await lifecycleEligibility(job(template,type,{status}))).stop,/disabled/);
  }
 }
 assert.equal(enqueued.length,0,'Disabled sends never create initial or delayed jobs');assert.equal(providerCalls.length,0);
 assert(suppressFruitLifeSelfEmail('B04-self'));assert(suppressFruitLifeSelfEmail('B04-self-reminder'));assert(suppressFruitLifeSelfEmail('B04-status'));
 assert(!suppressFruitLifeSelfEmail('B02',{type:'fruitlife_observer'}));assert(!suppressFruitLifeSelfEmail('B01',{type:'fruitlife_report'}));
 // New self-completion events are acknowledged without scheduling participant chase mail.
 tables.dydd_lifecycle_events=[{id:'self-completed',kind:'fruitlife_self_completed',email:'self@example.invalid',source_id:'s',occurred_at:new Date().toISOString(),processed_at:null,attempts:0}];
 assert.equal((await processLifecycleEvents()).processed,1);assert(tables.dydd_lifecycle_events[0].processed_at);assert.equal(enqueued.length,0);
 // Observer invitation + automatic day-five reminder remain intact and keyed separately.
 const observer=job('B02','fruitlife_observer');
 assert.equal((await sendApplicationEmail({...observer.context.senderInput,templateId:'B02',deliveryContext:observer.context.deliveryContext})).sent,true);
 assert.deepEqual(enqueued.map(j=>j.template_id),['B02','B03']);assert.equal(Date.parse(enqueued[1].scheduled_at)-Date.parse(enqueued[0].scheduled_at),5*86400000);assert.equal(enqueued[1].context.deliveryContext.type,'fruitlife_observer');
 assert.equal(enqueued[1].context.senderInput.idempotencyKey,observer.context.senderInput.idempotencyKey+'-reminder-1');
 assert.deepEqual(await lifecycleEligibility(job('B03','fruitlife_observer')),{});
 // Real report/result delivery remains allowed (requires the saved PDF).
 const report=job('B01','fruitlife_report');assert.deepEqual(await lifecycleEligibility(report),{});
 assert.equal((await sendApplicationEmail({...report.context.senderInput,templateId:'B01',deliveryContext:report.context.deliveryContext})).sent,true);
 assert.equal(enqueued.filter(j=>j.template_id==='B01').length,1);
 // The actual worker skips old self jobs but sends observer reminders and reports.
 const oldSelf=job('B04-self-reminder','fruitlife_self'),oldStatus=job('B04-status','fruitlife_status'),observerReminder=job('B03','fruitlife_observer');
 claimed=[oldSelf,oldStatus,observerReminder,report];tables.dydd_lifecycle_jobs=claimed;
 const before=providerCalls.length,beforeFences=fences;const outcome=await runLifecycleWorker();
 assert.equal(outcome.skipped,2);assert.equal(outcome.accepted,2);assert.equal(providerCalls.length-before,2);assert.equal(fences-beforeFences,2,'Self jobs never reach the authorization/provider fence');
 assert.equal(oldSelf.status,'skipped');assert.equal(oldStatus.status,'skipped');assert.equal(report.status,'accepted');assert.equal(observerReminder.status,'accepted');
 // Report-ready follow-up still queues normally; not conflated with pending-self notices.
 tables.dydd_lifecycle_events=[{id:'report-ready',kind:'report_ready',user_id:'user',source_id:'snapshot',payload:{assessmentType:'fruitlife_360',fruitlifeSessionId:'s'},occurred_at:new Date().toISOString(),processed_at:null,attempts:0}];
 await processLifecycleEvents();assert.equal(enqueued.at(-1).template_id,'B05');
 console.log('PASS self-only/observer-process participant start, manual/automatic/status reminders suppressed before enqueue and on queued retries; observer invitation/day-five reminder and report/result delivery retained. In-memory DB and provider mocks only.');
 }finally{if(priorEnvironment===undefined)delete process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT;else process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT=priorEnvironment;if(priorAutomation===undefined)delete process.env.DYDD_LIFECYCLE_AUTOMATION_ENABLED;else process.env.DYDD_LIFECYCLE_AUTOMATION_ENABLED=priorAutomation;}
})().catch(e=>{console.error(e);process.exitCode=1;});
