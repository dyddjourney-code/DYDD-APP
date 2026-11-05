// Durable DB security/concurrency test; never sends mail or changes owner accounts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert.equal(c.project_url,'https://atemrshtshxoqnuevvqu.supabase.co');assert.equal(c.vercel.projectId,'prj_5EC6sfJe9DpGYW59L94iwppeMYUg');
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),anon=createClient(c.project_url,c.anon_key,{auth:{persistSession:false}});
const ok=r=>{assert(!r.error,r.error?.message);return r.data;};
const suffix=crypto.randomUUID(),password=crypto.randomBytes(24).toString('hex');let learner,foreign,requestIds=[];
const hash=crypto.createHash('sha256').update(suffix).digest('hex');
const args=(id,user,type='designid')=>({p_id:id,p_user:user,p_type:type,p_source:null,p_happened:'Synthetic submission mistake.',p_understood:'Synthetic reflection clarified instructions.',p_next:'December 5, 2026',p_hash:hash,p_mail:{to:'no-send@example.invalid',subject:'Synthetic held payload',text:'Original frozen payload',html:'<p>held</p>',idempotencyKey:'retake-test-'+id}});
try{
 learner=ok(await db.auth.admin.createUser({email:`retake-${suffix}@example.invalid`,password,email_confirm:true})).user.id;
 foreign=ok(await db.auth.admin.createUser({email:`foreign-${suffix}@example.invalid`,password,email_confirm:true})).user.id;
 const batch=await Promise.all(Array.from({length:6},()=>db.rpc('dydd_request_assessment_retake',args(crypto.randomUUID(),learner))));
 const ids=batch.map(ok);assert.equal(new Set(ids).size,1);requestIds.push(ids[0]);
 const outbox=ok(await db.from('dydd_assessment_retake_outbox').select('*').eq('request_id',ids[0]));assert.equal(outbox.length,1);assert.equal(outbox[0].payload.text,'Original frozen payload');
 assert((await db.rpc('dydd_request_assessment_retake',args(crypto.randomUUID(),learner,'spiritual_gifts'))).error);
 const authenticated=createClient(c.project_url,c.anon_key,{auth:{persistSession:false}});ok(await authenticated.auth.signInWithPassword({email:`foreign-${suffix}@example.invalid`,password}));
 for(const client of [anon,authenticated]){
 for(const table of ['dydd_assessment_retake_requests','dydd_assessment_retake_outbox']){const response=await client.from(table).select('*');assert(response.error||response.data.length===0);}
 assert((await client.rpc('dydd_request_assessment_retake',args(crypto.randomUUID(),learner))).error);
 assert((await client.rpc('dydd_decide_assessment_retake',{p_id:ids[0],p_actor:foreign,p_hash:hash,p_decision:'approved',p_reason:'Forged owner',p_mail:{}})).error);
 }
 assert((await db.rpc('dydd_decide_assessment_retake',{p_id:ids[0],p_actor:foreign,p_hash:hash,p_decision:'approved',p_reason:'Forged preview owner',p_mail:{}})).error);
 // Read the existing designated owner, without logging PII or modifying their account.
 const management=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json'));
 const response=await fetch('https://api.supabase.com/v1/projects/'+c.ref+'/database/query',{method:'POST',headers:{Authorization:'Bearer '+management.management_access_token,'Content-Type':'application/json'},body:JSON.stringify({query:"select id from auth.users where lower(email)='dyddjourney@gmail.com' and email_confirmed_at is not null limit 1"})});assert(response.ok);const owner=(await response.json())[0]?.id;assert(owner,'Designated verified sandbox owner missing');
 const decision={p_id:ids[0],p_actor:owner,p_hash:hash,p_decision:'approved',p_reason:'Synthetic QA approval',p_mail:{to:'no-send@example.invalid',text:'Synthetic decision held; never sent',idempotencyKey:'retake-decision-'+ids[0]}};
 assert((await db.rpc('dydd_decide_assessment_retake',{...decision,p_hash:'0'.repeat(64)})).error);
 const race=await Promise.all(Array.from({length:5},()=>db.rpc('dydd_decide_assessment_retake',decision)));assert.equal(race.filter(r=>!r.error).length,1);
 const grants=ok(await db.from('dydd_assessment_retake_grants').select('*').eq('request_id',ids[0]));assert.equal(grants.length,1);assert.equal(grants[0].user_id,learner);assert(!grants[0].used_at);assert(Math.abs(Date.parse(grants[0].expires_at)-Date.parse(grants[0].created_at)-30*86400000)<2000);
 assert((await db.rpc('dydd_decide_assessment_retake',decision)).error);
 const second=ok(await db.rpc('dydd_request_assessment_retake',args(crypto.randomUUID(),foreign)));requestIds.push(second);
 ok(await db.from('dydd_assessment_retake_requests').update({token_expires_at:new Date(Date.now()-1000).toISOString()}).eq('id',second));
 assert((await db.rpc('dydd_decide_assessment_retake',{...decision,p_id:second})).error);
 ok(await db.from('dydd_assessment_retake_requests').update({token_expires_at:new Date(Date.now()+60000).toISOString()}).eq('id',second));
 ok(await db.rpc('dydd_decide_assessment_retake',{...decision,p_id:second,p_decision:'declined',p_reason:'Synthetic kind decline'}));
 assert.equal(ok(await db.from('dydd_assessment_retake_grants').select('*').eq('request_id',second)).length,0);
 assert.equal(ok(await db.from('dydd_assessment_retake_outbox').select('*').eq('request_id',second).eq('kind','decision')).length,1);
 // Expired pending requests archive safely; concurrent replacement preserves old audit/outbox.
 ok(await db.from('dydd_assessment_retake_requests').update({status:'pending',created_at:new Date(Date.now()-8*86400000).toISOString(),token_expires_at:new Date(Date.now()-1000).toISOString()}).eq('id',second));
 const replacementRace=await Promise.all(Array.from({length:6},()=>db.rpc('dydd_request_assessment_retake',args(crypto.randomUUID(),foreign))));
 const replacementIds=replacementRace.map(ok);assert.equal(new Set(replacementIds).size,1);assert.notEqual(replacementIds[0],second);requestIds.push(replacementIds[0]);
 const archived=ok(await db.from('dydd_assessment_retake_requests').select('status,expired_at').eq('id',second).single());assert.equal(archived.status,'expired');assert(archived.expired_at);
 assert((await db.rpc('dydd_decide_assessment_retake',{...decision,p_id:second})).error);
 assert.equal(ok(await db.from('dydd_assessment_retake_outbox').select('id').eq('request_id',second).eq('kind','owner')).length,1);
 console.log('PASS expired pending request preserved/archived; six concurrent replacement requests produce one new pending request and original frozen outbox retained.');
 console.log('PASS six concurrent requests: one pending and frozen outbox; 24h throttle; anon/foreign ownership and RPC denial; forged owner denial; bad token; five concurrent approvals: one one-use 30-day grant/decision mail; replay denial; expiry denial; decline without grant. No provider sends.');
}finally{
 if(requestIds.length){ok(await db.from('dydd_assessment_retake_grants').delete().in('request_id',requestIds));ok(await db.from('dydd_assessment_retake_requests').delete().in('id',requestIds));}
 for(const id of [learner,foreign].filter(Boolean))ok(await db.auth.admin.deleteUser(id));
 console.log('Synthetic request/grant/outbox/users cleaned.');
}
