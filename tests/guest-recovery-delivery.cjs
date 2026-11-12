const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const load=require('../scripts/fruitlife-test-load.cjs');
process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-service-role-never-real';
process.env.DYDD_GUEST_EMAIL_ENABLED='true';process.env.DYDD_APP_URL='https://school.test';
process.env.DYDD_LIFECYCLE_AUTOMATION_ENABLED='false';delete process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT;
const id='22222222-2222-4222-8222-222222222222',sid='11111111-1111-4111-8111-111111111111';
let jobs=[],intent,session,orders,providerCalls=[],entitled=true,allowed=true,available=true,fail=false,revokeOnFence=false,fences=0,queries=[];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const emailHash=crypto.createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY).update('dydd-guest-recovery-v1:email:learner@example.invalid').digest('hex');
class Query{
 constructor(table){this.table=table;this.filters=[];this.mode='many';queries.push(this);}
 select(){return this;}eq(k,v){this.filters.push(r=>{const parts=k.split(/->>?/);let value=r;for(const p of parts)value=value?.[p];return value===v;});return this;}
 in(k,v){this.filters.push(r=>v.includes(r[k]));return this;}lt(k,v){this.filters.push(r=>r[k]<v);return this;}lte(k,v){this.filters.push(r=>r[k]<=v);return this;}
 order(){return this;}limit(n){this.n=n;return this;}single(){this.mode='one';return this;}maybeSingle(){this.mode='one';return this;}
 update(patch){this.patch=patch;return this;}
 then(resolve,reject){try{
  if(fail&&this.table==='dydd_guest_recovery_requests')return Promise.resolve({data:null,error:{message:'mock storage outage'}}).then(resolve,reject);
  const rows=({dydd_lifecycle_jobs:jobs,dydd_guest_recovery_requests:intent?[intent]:[],dydd_guest_sessions:session?[session]:[],dydd_guest_orders:orders})[this.table]||[];
  let selected=rows.filter(r=>this.filters.every(f=>f(r))).slice(0,this.n||Infinity);
  if(this.patch)selected.forEach(r=>Object.assign(r,this.patch));
  return Promise.resolve({data:this.mode==='one'?selected[0]||null:selected,error:null}).then(resolve,reject);
 }catch(e){return Promise.reject(e).then(resolve,reject);}}
}
const db={from:t=>new Query(t),rpc:async(name,args)=>{
 if(name==='dydd_guest_reserve_recovery')return {data:intent,error:null};
 if(name==='dydd_guest_order_entitled')return {data:entitled,error:null};
 if(name==='dydd_public_assessment_provider_allowed'){assert.equal(args.p_provider,'stripe_test');return {data:allowed,error:null};}
 if(name==='dydd_authorize_lifecycle_send'){fences++;if(revokeOnFence)intent.used_at=new Date().toISOString();return {data:{authorized:true},error:null};}
 throw Error(name);
}};
const store={must:r=>{if(r.error)throw Error('mock storage unavailable');return r.data;},enqueue:async input=>{
 if(!jobs.some(j=>j.event_key===input.event_key))jobs.push({...structuredClone(input),id:'job-'+jobs.length,status:'queued',attempts:0,next_attempt_at:new Date(0).toISOString(),first_attempt_at:null});
}};
const mocks={
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
 './config':{publicAssessmentLedgerEnabled:()=>available},
 '@/lib/lifecycle/store':store,'./store':store,
 '@/lib/email/resend':{sendResendEmail:async input=>{providerCalls.push(structuredClone(input));return {sent:true,skipped:false,id:'provider-fixture'};}},
};
const eligibility=load('lib/public-assessments/guest-recovery-delivery.ts',mocks);
mocks['./worker']={lifecycleEligibility:job=>eligibility.guestRecoveryDeliveryEligibility(job)};
const mail=load('lib/lifecycle/application-mail.ts',mocks);mocks['@/lib/lifecycle/application-mail']=mail;
const recovery=load('lib/public-assessments/guest-recovery.ts',mocks);
function reset(){jobs=[];providerCalls=[];fences=0;entitled=true;allowed=true;fail=false;available=true;revokeOnFence=false;
 intent={id,session_id:sid,product:'designpd',email_hash:emailHash,used_at:null,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+1800000).toISOString()};
 session={id:sid,participant_email:'learner@example.invalid',expires_at:new Date(Date.now()+86400000).toISOString()};orders=[{id:'order',session_id:sid,product:'designid',status:'paid',payment_provider:'stripe_test'}];
 const token=Buffer.from(crypto.createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY).update('dydd-guest-recovery-v1:token:'+id).digest('hex'),'hex').toString('base64url');intent.token_hash=hash(token);
}
async function request(){return recovery.requestGuestRecovery('learner@example.invalid','designpd','fixture');}
(async()=>{
 reset();await request();assert.equal(providerCalls.length,1,'Explicit recovery sends immediately despite campaigns being disabled');assert.equal(fences,1);assert.equal(jobs[0].status,'accepted');assert.equal(jobs[0].expires_at,intent.expires_at);
 await request();assert.equal(providerCalls.length,1,'Same durable event cannot resend accepted mail');
 const original=structuredClone(jobs[0]);
 reset();jobs=[{...structuredClone(original),status:'retry',attempts:1,next_attempt_at:new Date(0).toISOString()}];
 jobs.push({...structuredClone(original),id:'unrelated',template_id:'A03',context:{kind:'application',deliveryContext:{type:'account_service'}},status:'queued'});
 const result=await recovery.runGuestRecoveryWorker();assert.equal(result.accepted,1);assert.equal(providerCalls.length,1);assert.equal(jobs[1].status,'queued');assert.equal(providerCalls[0].idempotencyKey,original.context.senderInput.idempotencyKey);
 for(const invalidate of [()=>intent.used_at=new Date().toISOString(),()=>intent.expires_at=new Date(0).toISOString(),()=>session.expires_at=new Date(0).toISOString(),()=>entitled=false,()=>session.participant_email='different@example.invalid',()=>intent.token_hash='0'.repeat(64),()=>intent=null]){
  reset();jobs=[{...structuredClone(original),status:'retry',attempts:1}];invalidate();await recovery.runGuestRecoveryWorker();assert.equal(providerCalls.length,0);assert.equal(jobs[0].status,'skipped');
 }
 reset();revokeOnFence=true;await request();assert.equal(fences,1);assert.equal(providerCalls.length,0,'Redemption after initial eligibility but before provider submission stops sending');assert.equal(jobs[0].status,'skipped');
 reset();orders[0].status='pending';entitled=false;await request();assert.equal(providerCalls.length,1,'Original unfinished allowed checkout remains recoverable');
 reset();orders[0].status='pending';entitled=false;allowed=false;await request();assert.equal(providerCalls.length,0,'Provider mode mismatch stops pending checkout recovery');
 reset();fail=true;await request();assert.equal(providerCalls.length,0,'Storage failures fail closed');
 reset();process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';await request();assert.equal(providerCalls.length,0);delete process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT;
 reset();jobs=[{...structuredClone(original),status:'submitting',attempts:1,claimed_at:new Date(Date.now()-11*60000).toISOString(),claim_token:'stale'}];await recovery.runGuestRecoveryWorker();assert.equal(providerCalls.length,1,'Stale lease retries same durable key');
 reset();jobs=[{...structuredClone(original),status:'submitting',attempts:1,claimed_at:new Date().toISOString(),claim_token:'fresh'}];await recovery.runGuestRecoveryWorker();assert.equal(providerCalls.length,0,'Fresh leases are not stolen');
 reset();jobs=[{...structuredClone(original),status:'retry',attempts:8}];await recovery.runGuestRecoveryWorker();assert.equal(providerCalls.length,0);assert.equal(jobs[0].status,'review');
 const route=load('app/api/cron/guest-recovery/route.ts',{'@/lib/public-assessments/guest-recovery':{runGuestRecoveryWorker:async()=>({accepted:0})}});
 process.env.CRON_SECRET='fixture-cron-never-real';assert.equal((await route.GET(new Request('https://school.test/api/cron/guest-recovery'))).status,401);
 assert.equal((await route.GET(new Request('https://school.test/api/cron/guest-recovery',{headers:{authorization:'Bearer fixture-cron-never-real'}}))).status,200);
 const crons=JSON.parse(fs.readFileSync('vercel.json')).crons;assert(crons.some(c=>c.path==='/api/cron/guest-recovery'&&c.schedule==='*/5 * * * *'));assert(crons.some(c=>c.path==='/api/cron/guest-checkout-reminders'));
 const worker=fs.readFileSync('lib/lifecycle/worker.ts','utf8');assert(worker.includes("if(type==='guest_recovery')return guestRecoveryDeliveryEligibility(job,now)"));
 console.log('PASS recovery delivery: immediate + scoped retry, durable dedupe/lease fence, final redemption race, expiry/session/recipient/token/entitlement, pending checkout provider policy, storage fail-closed, sandbox, retry budget, cron auth/schedule. All mail/provider/DB calls mocked.');
})().catch(e=>{console.error(e);process.exitCode=1;});
