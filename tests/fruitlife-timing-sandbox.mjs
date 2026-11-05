// Explicit sandbox integration. Synthetic users only; no provider/report worker/mail execution.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {createClient} from '@supabase/supabase-js';
import {sandboxSql as sql,credentials as c} from '../scripts/assessment-timing-sandbox-db.mjs';
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert.equal(c.vercel.projectId,'prj_5EC6sfJe9DpGYW59L94iwppeMYUg');
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false,autoRefreshToken:false}});
const users=[],participants=[],events=[];const nonce=crypto.randomUUID();
const ok=r=>{if(r.error)throw Error(r.error.message);return r.data};
let owner,foreign,participant;
const round=(count=0,id=crypto.randomUUID(),uid=owner,pid=participant)=>{
 const observers=Array.from({length:count},(_,n)=>({observer_name:`Observer ${n}`,observer_email:`observer-${n}-${id}@example.invalid`,relationship_label:'Synthetic',invite_token_hash:crypto.randomUUID(),metadata:{synthetic:true}}));
 return db.rpc('dydd_fruitlife_create_round',{p_user_id:uid,p_session:{id,participant_id:pid,created_by_user_id:uid,participant_name:'Fruitful timing QA',participant_email:`fruitlife-${nonce}@example.invalid`,intake_token_hash:crypto.randomUUID(),source_participant_id:`QA-${id}`,observer_goal:count,metadata:{synthetic:true}},p_invites:observers});
};
const response=(sid,extra={})=>db.from('fruitlife_360_responses').insert({session_id:sid,response_type:'self',reviewer_name:'Synthetic',reviewer_email:`fruitlife-${nonce}@example.invalid`,source_response_id:crypto.randomUUID(),...extra}).select('id,submitted_at').single();
try{
 for(let n=0;n<4;n++){const u=ok(await db.auth.admin.createUser({email:`fruitlife-${nonce}-${n}@example.invalid`,password:crypto.randomBytes(24).toString('hex'),email_confirm:true})).user;users.push(u.id);participants.push(ok(await db.from('assessment_participants').insert({user_id:u.id,normalized_email:u.email,display_name:'Fruitful timing QA'}).select('id').single()).id);}
 [owner,foreign]=users;participant=participants[0];
 const concurrent=await Promise.all(Array.from({length:10},()=>round(1)));const rounds=concurrent.filter(r=>!r.error).map(r=>r.data);
 assert.equal(rounds.length,3);assert.equal(concurrent.filter(r=>r.error).length,7);events.push('10 concurrent observer creations: exactly 3 active distinct rounds; no owner-wide active gate');
 const id=rounds[0];assert.equal(ok(await round(1,id)),id);assert((await round(1,id,foreign,participants[1])).error);assert((await round(1,crypto.randomUUID(),foreign,participant)).error);events.push('creation retry same id returns original; foreign resume and foreign participant rejected');
 // Rolling-window boundary: release exactly one old round and reserve a new group.
 await sql(`begin;set local session_replication_role=replica;update public.fruitlife_360_sessions set observer_round_started_at=now()-interval '90 days 1 second' where id='${rounds[2]}';commit;`);
 assert(!((await round(1)).error));assert((await round(1)).error);events.push('round outside rolling 90 days releases exactly one slot');
 // Different observers do not share a daily submission gate, and self in different observer groups is allowed.
 ok(await response(rounds[0]));ok(await response(rounds[1]));
 const invite=ok(await db.from('fruitlife_360_observer_invites').select('id,observer_email').eq('session_id',rounds[0]).single());
 assert((await response(rounds[1],{response_type:'observer',observer_invite_id:invite.id,reviewer_email:invite.observer_email})).error);
 assert((await response(rounds[0],{response_type:'observer',observer_invite_id:invite.id,reviewer_email:'foreign@example.invalid'})).error);
 const observerResponses=await Promise.all(Array.from({length:8},()=>response(rounds[0],{response_type:'observer',observer_invite_id:invite.id,reviewer_email:invite.observer_email})));
 assert.equal(observerResponses.filter(r=>!r.error).length,1);events.push('concurrent respondent submissions: exactly one; cross-round invite and forged respondent rejected');
 // Ready only at final/meaningful threshold.
 const insertJob=sid=>db.from('fruitlife_360_report_jobs').insert({session_id:sid,job_type:'fruitlife_360_payload',payload:{synthetic:true}}).select('id').single();
 assert((await insertJob(rounds[1])).error);
 const secondInvite=ok(await db.from('fruitlife_360_observer_invites').select('id').eq('session_id',rounds[1]).single());
 ok(await db.from('fruitlife_360_observer_invites').update({observer_email:invite.observer_email}).eq('id',secondInvite.id));
 ok(await response(rounds[1],{response_type:'observer',observer_invite_id:secondInvite.id,reviewer_email:invite.observer_email}));
 ok(await insertJob(rounds[1]));events.push('same respondent can complete separate concurrent groups on same day; separate ready groups can each reserve a report');
 ok(await db.rpc('dydd_fruitlife_refresh_completion',{p_session_id:rounds[0]}));
 const jobs=await Promise.all(Array.from({length:8},()=>insertJob(rounds[0])));const job=jobs.find(r=>!r.error)?.data;assert(job);assert.equal(jobs.filter(r=>!r.error).length,1);
 ok(await db.from('fruitlife_360_report_jobs').update({job_status:'processing',locked_by:'qa-worker'}).eq('id',job.id));
 assert.equal(ok(await db.rpc('dydd_fruitlife_claim_provider_creation',{p_job_id:job.id,p_worker_id:'foreign-worker'})),false);
 const claims=await Promise.all(Array.from({length:8},()=>db.rpc('dydd_fruitlife_claim_provider_creation',{p_job_id:job.id,p_worker_id:'qa-worker'})));assert.equal(claims.map(ok).filter(Boolean).length,1);
 ok(await db.from('fruitlife_360_report_jobs').update({job_status:'ready'}).eq('id',job.id));
 assert.equal(ok(await db.from('fruitlife_360_report_jobs').select('id').eq('id',job.id).single()).id,job.id);assert((await insertJob(rounds[0])).error);
 await sql(`update public.fruitlife_360_report_jobs set created_at=now()-interval '24 hours 1 second' where id='${job.id}'`);ok(await insertJob(rounds[0]));events.push('incomplete report rejected; 8 concurrent report reservations -> one/24h; 8 provider claims -> one; wrong worker denied; saved ready read unchanged; after24h allowed');
 // Drafts do not count; successful self-only response commits cooldown before any PDF.
 owner=users[1];participant=participants[1];const drafts=ok(await Promise.resolve(round(0)));const another=ok(await round(0));
 const saves=await Promise.all([response(drafts),response(another)]);assert.equal(saves.filter(r=>!r.error).length,1);const saved=saves.find(r=>!r.error).data;
 const history=ok(await db.rpc('dydd_fruitlife_last_self_completion',{p_user_id:owner,p_email:`fruitlife-${nonce}-1@example.invalid`}));assert.equal(history[0].completed_at,saved.submitted_at);
 const third=ok(await round(0));assert((await response(third)).error);events.push('multiple drafts no attempt; concurrent self-only completion exactly one; 30-day timer starts at successful response not async report');
 // The same eligibility service sees the committed completion before report generation.
 const eligibility=ok(await db.rpc('dydd_assessment_eligibility',{p_user_id:owner,p_assessment_type:'fruitful_self'}));assert.equal(eligibility.allowed,false);assert.equal(eligibility.previousCompletedAt,saved.submitted_at);assert.equal(eligibility.previousCompletionId,saved.id);
 for(const [offset,allowed] of [[30*86400000-1,false],[30*86400000,true],[30*86400000+1,true]]){
  const boundary=await sql(`select public.dydd_assessment_eligibility('${owner}','fruitful_self',false,'${saved.submitted_at}'::timestamptz+interval '${offset} milliseconds') as eligibility`);assert.equal(boundary[0].eligibility.allowed,allowed);
 }
 // Successful one-use grant consumption is atomic with response commit. Failed insert rolls back consumption.
 const grant=ok(await db.from('dydd_assessment_retake_grants').insert({user_id:owner,assessment_type:'fruitful_self',request_id:crypto.randomUUID(),expires_at:new Date(Date.now()+86400000).toISOString()}).select('id').single());
 const grantedDrafts=await Promise.all(Array.from({length:5},()=>round(0)));const grantResponses=await Promise.all(grantedDrafts.map(r=>response(ok(r))));assert.equal(grantResponses.filter(r=>!r.error).length,1);
 assert(ok(await db.from('dydd_assessment_retake_grants').select('used_at').eq('id',grant.id).single()).used_at);
 const grantedResponse=grantResponses.find(r=>!r.error).data;assert.equal(ok(await db.from('fruitlife_360_responses').select('metadata').eq('id',grantedResponse.id).single()).metadata.retakeGrantId,grant.id);
 ok(await db.from('fruitlife_360_responses').update({answers:{correction:'synthetic'}}).eq('id',grantedResponse.id));
 assert((await db.from('fruitlife_360_responses').update({reviewer_email:'another@example.invalid'}).eq('id',grantedResponse.id)).error);

 const unused=ok(await db.from('dydd_assessment_retake_grants').insert({user_id:owner,assessment_type:'fruitful_self',request_id:crypto.randomUUID(),expires_at:new Date(Date.now()+86400000).toISOString()}).select('id').single());
 const invalid=ok(await round(0));assert((await response(invalid,{source_response_id:''})).error);assert.equal(ok(await db.from('dydd_assessment_retake_grants').select('used_at').eq('id',unused.id).single()).used_at,null);
 ok(await db.from('dydd_assessment_retake_grants').update({expires_at:new Date(Date.now()-1000).toISOString()}).eq('id',unused.id));assert((await response(invalid)).error);
 events.push('shared eligibility agrees before/at/after exact30d boundary; 5 simultaneous grant completions -> exactly one; failed insert rolls back permit; expired permit denied');
 // Linked imported history includes exact approved SELF_ONLY report mode.
 owner=users[2];participant=participants[2];const imported=ok(await db.from('assessment_participants').insert({normalized_email:`FRUITLIFE-${nonce.toUpperCase()}-2@EXAMPLE.INVALID`,display_name:'Imported synthetic'}).select('id').single());participants.push(imported.id);
 ok(await db.from('assessment_snapshots').insert({participant_id:imported.id,assessment_type:'fruit_360',source:'fruitlife-timing-synthetic-draft',scores:{status:'draft',summary:{Report_Mode:'SELF_ONLY'}},source_submitted_at:new Date().toISOString()}));
 assert.equal(ok(await db.rpc('dydd_fruitlife_last_self_completion',{p_user_id:owner,p_email:`fruitlife-${nonce}-2@example.invalid`})).length,0);
 ok(await db.from('assessment_snapshots').insert({participant_id:imported.id,assessment_type:'fruit_360',source:'fruitlife-timing-synthetic-import',scores:{summary:{Report_Mode:'SELF_ONLY'}},source_submitted_at:new Date(Date.now()-29*86400000).toISOString()}));
 const blockedDraft=ok(await round(0));assert((await response(blockedDraft)).error);events.push('linked unowned imported SELF_ONLY history blocks early completion');
 // Configured owner exemptions are trusted server metadata, never a form field.
 owner=users[3];participant=participants[3];
 const ownerFirst=ok(await round(0));const ownerSecond=ok(await round(0));
 ok(await response(ownerFirst,{metadata:{timingOwnerExemption:true}}));ok(await response(ownerSecond,{metadata:{timingOwnerExemption:true}}));
 assert((await db.from('fruitlife_360_sessions').update({observer_goal:1}).eq('id',ownerFirst)).error);
 events.push('trusted configured-owner self exemption retained; completed self-only round cannot be relabeled to evade history');
 // A valid grant selected by shared policy is consumed even after ordinary eligibility elapsed.
 owner=users[2];participant=participants[2];
 ok(await db.from('assessment_snapshots').update({source_submitted_at:new Date(Date.now()-31*86400000).toISOString()}).eq('participant_id',imported.id));
 const elapsedPermit=ok(await db.from('dydd_assessment_retake_grants').insert({user_id:owner,assessment_type:'fruitful_self',request_id:crypto.randomUUID(),expires_at:new Date(Date.now()+86400000).toISOString()}).select('id').single());
 const elapsedDraft=ok(await round(0));const elapsedResponse=ok(await response(elapsedDraft));
 assert(ok(await db.from('dydd_assessment_retake_grants').select('used_at').eq('id',elapsedPermit.id).single()).used_at);
 assert.equal(ok(await db.from('fruitlife_360_responses').select('metadata').eq('id',elapsedResponse.id).single()).metadata.retakeGrantId,elapsedPermit.id);
 const afterElapsed=ok(await round(0));assert((await response(afterElapsed)).error);events.push('valid selected grant consumed/audited after regular interval elapsed; cannot authorize immediate second completion');
 // DB function access boundaries (service-role only).
 const grants=await sql("select has_function_privilege('anon','public.dydd_fruitlife_create_round(uuid,jsonb,jsonb)','execute') anon,has_function_privilege('authenticated','public.dydd_fruitlife_create_round(uuid,jsonb,jsonb)','execute') authenticated,has_function_privilege('anon','public.dydd_fruitlife_claim_provider_creation(uuid,text)','execute') provider");assert.equal(grants[0].anon,false);assert.equal(grants[0].authenticated,false);assert.equal(grants[0].provider,false);events.push('anon/authenticated cannot invoke privileged creation/provider RPC');
 console.log(JSON.stringify({sandboxRef:c.ref,events},null,2));fs.mkdirSync('tmp/fruitlife-timing',{recursive:true});fs.writeFileSync('tmp/fruitlife-timing/integration-proof.json',JSON.stringify({at:new Date().toISOString(),sandboxRef:c.ref,events},null,2));
}finally{
 // No workers/providers invoked. Remove lifecycle event side effects for synthetic rounds before cascading sessions.
 const sessions=ok(await db.from('fruitlife_360_sessions').select('id').in('participant_id',participants));const ids=sessions.map(s=>s.id);
 const snapshots=participants.length?ok(await db.from('assessment_snapshots').select('id').in('participant_id',participants)):[];
 const sourceIds=[...ids,...snapshots.map(s=>s.id)];
 if(users.length)await sql(`delete from public.dydd_lifecycle_events where user_id in (${users.map(id=>`'${id}'`).join(',')}) or email like '%${nonce}%'${sourceIds.length?` or source_id in (${sourceIds.map(id=>`'${id}'`).join(',')})`:''}`);
 if(ids.length)ok(await db.from('fruitlife_360_sessions').delete().in('id',ids));
 if(users.length)ok(await db.from('dydd_assessment_retake_grants').delete().in('user_id',users));
 if(participants.length){ok(await db.from('assessment_snapshots').delete().in('participant_id',participants));ok(await db.from('assessment_participants').delete().in('id',participants));}
 for(const id of users)ok(await db.auth.admin.deleteUser(id));console.log('Synthetic users, participants, sessions, responses, jobs, snapshots and lifecycle events cleaned; no provider calls.');
}
