import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert.equal(new URL(c.project_url).hostname,c.ref+'.supabase.co');
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),anon=createClient(c.project_url,c.anon_key,{auth:{persistSession:false}});
const suffix=crypto.randomUUID(),email=`foundation-${suffix}@example.com`;let sub,release,waypoint,message;const raceMessages=[];
const ok=(r)=>{assert(!r.error,r.error?.message);return r.data;};
try{
 waypoint=ok(await db.from('dydd_waypoints').insert({slug:'foundation-'+suffix,title:'Foundation QA',category:'faith',base_content:'QA content',status:'published'}).select('id').single()).id;
 release=ok(await db.from('dydd_waypoint_releases').insert({waypoint_id:waypoint,release_at:new Date(Date.now()-60000).toISOString(),status:'released'}).select('id').single()).id;
 sub=ok(await db.from('dydd_waypoint_subscriptions').insert({email,status:'active'}).select('id').single()).id;
 const job=ok(await db.from('dydd_waypoint_delivery_jobs').insert({release_id:release,subscription_id:sub,delivery_channel:'email'}).select().single());
 const batches=await Promise.all(Array.from({length:8},()=>db.rpc('dydd_claim_waypoint_jobs',{batch_size:100})));
 const claims=batches.flatMap(ok).filter(j=>j.id===job.id);assert.equal(claims.length,1);assert.equal(claims[0].attempts,1);
 console.log('PASS eight concurrent workers claim a job exactly once');
 ok(await db.from('dydd_waypoint_delivery_jobs').update({status:'error',next_attempt_at:new Date(Date.now()-1000).toISOString()}).eq('id',job.id));
 let retry=ok(await db.rpc('dydd_claim_waypoint_jobs',{batch_size:100})).find(j=>j.id===job.id);assert.equal(retry.attempts,2);
 ok(await db.from('dydd_waypoint_delivery_jobs').update({claimed_at:new Date(Date.now()-11*60000).toISOString()}).eq('id',job.id));
 retry=ok(await db.rpc('dydd_claim_waypoint_jobs',{batch_size:100})).find(j=>j.id===job.id);assert.equal(retry.attempts,3);
 ok(await db.from('dydd_waypoint_delivery_jobs').update({first_attempt_at:new Date(Date.now()-24*3600000).toISOString(),status:'error'}).eq('id',job.id));
 assert(!ok(await db.rpc('dydd_claim_waypoint_jobs',{batch_size:100})).some(j=>j.id===job.id));assert.equal(ok(await db.from('dydd_waypoint_delivery_jobs').select('status').eq('id',job.id).single()).status,'review');
 console.log('PASS retries, stale lease recovery and expired provider window fail-closed');
 message=ok(await db.from('dydd_email_messages').insert({idempotency_key:suffix,recipient:email,payload_hash:'test',provider_id:'provider-'+suffix}).select().single()).id;
 const event=(key,kind,time)=>db.rpc('dydd_record_email_event',{event_key:key+'-'+suffix,email_id:'provider-'+suffix,kind,happened_at:new Date(Date.now()+time).toISOString()});
 assert.equal(ok(await event('delivered','email.delivered',0)),true);assert.equal(ok(await event('delivered','email.delivered',0)),false);
 ok(await event('delayed','email.delivery_delayed',1000));assert.equal(ok(await db.from('dydd_email_messages').select('status').eq('id',message).single()).status,'delivered');
 ok(await event('bounce','email.bounced',-1000));ok(await event('late-delivered','email.delivered',2000));assert.equal(ok(await db.from('dydd_email_messages').select('status').eq('id',message).single()).status,'bounced');
 ok(await event('complaint','email.complained',3000));assert.equal(ok(await db.from('dydd_email_messages').select('status').eq('id',message).single()).status,'complained');assert(ok(await db.from('dydd_email_suppressions').select().eq('email',email).single()));
 assert.equal(ok(await db.from('dydd_waypoint_subscriptions').select('status').eq('id',sub).single()).status,'bounced');
 console.log('PASS durable delivery, duplicate events, out-of-order safety, bounces, complaints and suppression');
 const early='early-'+suffix;
 ok(await db.rpc('dydd_record_email_event',{event_key:early,email_id:'early-provider-'+suffix,kind:'email.delivered',happened_at:new Date().toISOString()}));
 ok(await db.from('dydd_email_messages').update({provider_id:'early-provider-'+suffix,status:'accepted',last_event_at:null}).eq('id',message));
 assert.equal(ok(await db.rpc('dydd_record_email_event',{event_key:early,email_id:'early-provider-'+suffix,kind:'email.delivered',happened_at:new Date().toISOString()})),true);
 assert.equal(ok(await db.from('dydd_email_messages').select('status').eq('id',message).single()).status,'delivered');
 console.log('PASS webhook arriving before provider API persistence is reconciled');
 for(let i=0;i<8;i++) {
  const provider=`race-provider-${i}-${suffix}`;
  const row=ok(await db.from('dydd_email_messages').insert({idempotency_key:`race-${i}-${suffix}`,recipient:email,payload_hash:'race'}).select().single());raceMessages.push(row.id);
  const eventArgs={event_key:`race-event-${i}-${suffix}`,email_id:provider,kind:'email.delivered',happened_at:new Date().toISOString()};
  const acceptance={message_key:row.id,email_id:provider};
  const operations=i%2?[db.rpc('dydd_accept_email_message',acceptance),db.rpc('dydd_record_email_event',eventArgs)]:[db.rpc('dydd_record_email_event',eventArgs),db.rpc('dydd_accept_email_message',acceptance)];
  (await Promise.all(operations)).forEach(ok);
  assert.equal(ok(await db.from('dydd_email_messages').select('status').eq('id',row.id).single()).status,'delivered');
  ok(await db.rpc('dydd_accept_email_message',acceptance));assert.equal(ok(await db.from('dydd_email_messages').select('status').eq('id',row.id).single()).status,'delivered');
 }
 console.log('PASS eight interleaved acceptance/webhook races and repeated acceptance never downgrade delivered');
 for(const table of ['dydd_email_events','dydd_email_messages','dydd_email_suppressions','dydd_waypoint_unsubscribe_tokens']) {const r=await anon.from(table).select();assert(r.error||r.data.length===0,table+' leaked');}
 const forbidden=await anon.rpc('dydd_claim_waypoint_jobs',{batch_size:1});assert(forbidden.error);
 console.log('PASS anonymous ledger access and privileged RPC denied');
} finally {
 await db.from('dydd_email_events').delete().like('event_id','%'+suffix);
 if(raceMessages.length)await db.from('dydd_email_messages').delete().in('id',raceMessages);
 if(message)await db.from('dydd_email_messages').delete().eq('id',message);
 await db.from('dydd_email_suppressions').delete().eq('email',email);
 if(sub)await db.from('dydd_waypoint_subscriptions').delete().eq('id',sub);
 if(waypoint)await db.from('dydd_waypoints').delete().eq('id',waypoint);
 console.log('Sandbox-only QA fixtures cleaned up');
}
