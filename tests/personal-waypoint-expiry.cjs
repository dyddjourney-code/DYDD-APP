const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
let updates=[],tables=[],unavailable=false,checked=[];
global.fetch=()=>{throw Error('Network forbidden')};
const db={from(table){tables.push(table);const filters=[];let payload,single=false;const q={select(){return q},eq(k,v){filters.push([k,v]);return q},gte(){return q},lte(){return q},single(){single=true;return q},update(p){payload=p;return q},then(resolve,reject){return Promise.resolve().then(()=>{
 if(payload){updates.push({table,payload,filters});return {error:null};}
 if(table==='dydd_lifecycle_settings')return {data:{paused:false,optional_paused:false,activated_at:'2020-01-01'},error:null};
 if(table==='dydd_waypoint_subscriptions')return {data:single?{id:'saved-subscription',user_id:'expired-user',email:'learner@example.invalid',status:'active'}:[],error:null};
 if(table==='dydd_waypoint_releases')return {data:single?{status:'released',release_at:new Date().toISOString(),dydd_waypoints:{status:'published'}}:[],error:null};
 throw Error('Unexpected content/transport access: '+table);
 }).then(resolve,reject)}};return q;},rpc:async name=>{assert.equal(name,'dydd_claim_waypoint_jobs');return {data:[{id:'delivery-job',subscription_id:'saved-subscription',release_id:'saved-release',attempts:1}],error:null}}};
const worker=load('lib/lifecycle/waypoints-worker.ts',{
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
 '@/lib/commerce/account-access':{personalMembershipExpired:async user=>{checked.push(user);if(unavailable)throw Error('Storage unavailable');return true;}},
 '@/lib/email/resend':{sendResendEmail:async()=>{throw Error('Provider must not be called')}},
});
(async()=>{
 let response=await worker.runWaypointsWorker(),body=await response.json();assert.equal(response.status,200);assert.equal(body.acceptedEmails,0);assert.equal(body.skippedEmails,1);assert.equal(updates[0].payload.status,'skipped');assert.match(updates[0].payload.error_message,/membership ended/);
 assert.deepEqual(checked,[{id:'expired-user',email:'learner@example.invalid'}]);
 assert(updates.every(u=>u.table==='dydd_waypoint_delivery_jobs'),'subscription and release history are not deleted or reset');assert(!tables.includes('dydd_waypoint_unsubscribe_tokens'),'no outgoing payload created');
 unavailable=true;updates=[];response=await worker.runWaypointsWorker();body=await response.json();assert.equal(body.erroredEmails,1);assert.equal(updates[0].payload.status,'error','membership storage error retries fail closed');
 console.log('PASS expired membership skips Waypoint delivery before payload/provider access, retains saved subscription/history, and membership lookup failure retries fail closed. No network/email.');
})().catch(e=>{console.error(e);process.exitCode=1});
