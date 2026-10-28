import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {createClient} from '@supabase/supabase-js';
const base=process.env.EMAIL_TEST_BASE??'http://localhost:3138';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname),'Never execute delivery webhook against a live endpoint');
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(c.ref,'atemrshtshxoqnuevvqu');const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}});
const suffix=crypto.randomUUID(),email=`email-http-${suffix}@example.com`,hash=t=>crypto.createHash('sha256').update(t).digest('hex');let sub,message;
const ok=r=>{assert(!r.error,r.error?.message);return r.data};
try{
 const legacy=crypto.randomBytes(32).toString('hex'),old=crypto.randomBytes(32).toString('hex'),newer=crypto.randomBytes(32).toString('hex');
 sub=ok(await db.from('dydd_waypoint_subscriptions').insert({email,unsubscribe_token_hash:hash(legacy)}).select('id').single()).id;
 ok(await db.from('dydd_waypoint_unsubscribe_tokens').insert([{token_hash:hash(old),subscription_id:sub},{token_hash:hash(newer),subscription_id:sub}]));
 for(const token of [old,newer,legacy,old]){
  ok(await db.from('dydd_waypoint_subscriptions').update({status:'active'}).eq('id',sub));
  const response=await fetch(`${base}/api/waypoints/unsubscribe?token=${token}`,{method:token===newer?'POST':'GET',body:token===newer?'List-Unsubscribe=One-Click':undefined});
  assert.equal(response.status,200,await response.text());assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(ok(await db.from('dydd_waypoint_subscriptions').select('status').eq('id',sub).single()).status,'unsubscribed');
 }
 const invalid=await fetch(base+'/api/waypoints/unsubscribe?token=invalid');assert.equal(invalid.status,400);
 console.log('PASS multiple historical tokens remain usable, legacy fallback, repeated opt-out, one-click POST, invalid tokens and no-store');
 const provider='qa-provider-'+suffix;message=ok(await db.from('dydd_email_messages').insert({recipient:email,idempotency_key:suffix,payload_hash:'qa',provider_id:provider}).select('id').single()).id;
 const raw=JSON.stringify({type:'email.delivered',created_at:new Date().toISOString(),data:{email_id:provider}});
 const event='qa-http-'+suffix,timestamp=String(Math.floor(Date.now()/1000)),secret=Buffer.from('dydd-qa-signing-secret');
 const signature=crypto.createHmac('sha256',secret).update(`${event}.${timestamp}.${raw}`).digest('base64');
 const headers={'svix-id':event,'svix-timestamp':timestamp,'svix-signature':'v1,'+signature,'content-type':'application/json'};
 assert.equal((await fetch(base+'/api/webhooks/dydd-email',{method:'POST',body:raw})).status,401);
 assert.equal((await fetch(base+'/api/webhooks/dydd-email',{method:'POST',headers,body:raw+' '})).status,401);
 let r=await fetch(base+'/api/webhooks/dydd-email',{method:'POST',headers,body:raw});assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).duplicate,false);
 r=await fetch(base+'/api/webhooks/dydd-email',{method:'POST',headers,body:raw});assert.equal((await r.json()).duplicate,true);
 assert.equal(ok(await db.from('dydd_email_messages').select('status').eq('id',message).single()).status,'delivered');
 const cron=await fetch(base+'/api/cron/waypoints-release',{headers:{authorization:'Bearer foundation-qa-only'}});assert.equal((await cron.json()).skipped,true);
 console.log('PASS local HTTP webhook signature enforcement, raw-byte tamper rejection, valid event persistence, duplicate acknowledgement and sandbox cron no-send guard');
}finally{
 await db.from('dydd_email_events').delete().eq('event_id','qa-http-'+suffix);if(message)await db.from('dydd_email_messages').delete().eq('id',message);if(sub)await db.from('dydd_waypoint_subscriptions').delete().eq('id',sub);
 console.log('Sandbox-only HTTP fixtures cleaned up');
}
