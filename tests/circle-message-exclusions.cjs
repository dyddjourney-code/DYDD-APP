const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';
const future=new Date(Date.now()+86400000).toISOString();
const drafts=[{id:'excluded',approved_at:null,excluded_at:new Date().toISOString(),revision:2},{id:'first',approved_at:future,excluded_at:null,revision:1},{id:'second',approved_at:future,excluded_at:null,revision:1}];
const jobs=['first','second'].map(id=>({id,claim_token:'lease-'+id,context:{kind:'leader',draftRevision:1},status:'processing',user_id:null,circle_id:'circle',campaign_id:'campaign',draft_id:id,email:'qa@example.test',category:'service',subject:'QA',body:'QA',expires_at:future,attempts:1}));
let providerCalls=0,fences=[],updates=[];
const db={
 async rpc(name,args){if(name==='dydd_claim_lifecycle_jobs')return {data:jobs};if(name==='dydd_authorize_lifecycle_send'){fences.push(args.job_key);if(args.job_key==='first'){jobs[0].status='cancelled';drafts.find(d=>d.id==='first').excluded_at=future;return {data:{authorized:false,lostClaim:true}};}jobs[1].status='submitting';return {data:{authorized:true}};}throw Error('Unexpected RPC '+name);},
 from(table){let patch=null,filters=[];const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},is(){return q;},lt(){return q;},order(){return q;},limit(){return q;},in(k,v){filters.push([k,v]);return q;},update(v){patch=v;return q;},single(){return Promise.resolve(run(true));},maybeSingle(){return Promise.resolve(run(true));},then(a,b){return Promise.resolve(run(false)).then(a,b);}};
 function run(single){let data=table==='dydd_lifecycle_settings'?[{id:true,paused:false,optional_paused:false}]:table==='dydd_lifecycle_events'||table==='dydd_email_suppressions'?[]:table==='journey_circle_plans'?[{id:'circle',user_id:null,status:'active',revision:1,plan:{participants:[]}}]:table==='dydd_circle_campaigns'?[{id:'campaign',circle_revision:1,status:'finalized'}]:table==='dydd_circle_message_drafts'?drafts:table==='dydd_lifecycle_jobs'?jobs:[];
 data=data.filter(r=>filters.every(([k,v])=>Array.isArray(v)?v.includes(r[k]):r[k]===v));if(patch){updates.push(...data.map(r=>r.id));data.forEach(r=>Object.assign(r,patch));}return {error:null,data:single?data[0]||null:data};}return q;}
};
const mocks={'server-only':{},'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/email/resend':{sendResendEmail:async()=>{providerCalls++;throw Error('No provider calls permitted');}}};
const {lifecycleEligibility,runLifecycleWorker}=load('lib/lifecycle/worker.ts',mocks);
(async()=>{
 assert.match((await lifecycleEligibility({...jobs[0],draft_id:'excluded'})).stop,/excluded/);
 assert.match((await lifecycleEligibility({...jobs[0],context:{kind:'leader',draftRevision:0}})).stop,/revision/);
 const result=await runLifecycleWorker();assert.deepEqual(fences,['first','second']);assert.equal(providerCalls,0);assert.equal(result.sandboxReady,1);assert.equal(jobs[0].status,'cancelled');assert.equal(jobs[1].status,'sandbox_ready');assert(!updates.includes('first'));
 console.log('PASS worker excluded/stale preflight, exclusion between preflight and submission loses lease, cancelled claim is untouched and remaining batch completes, sandbox never calls provider');
})().catch(error=>{console.error(error);process.exitCode=1;});
