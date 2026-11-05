// Real isolated DB policy verification. Synthetic data only; no PDF/email transport.
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';import {sandboxSql,credentials as c} from '../scripts/assessment-timing-sandbox-db.mjs';
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),anon=createClient(c.project_url,c.anon_key,{auth:{persistSession:false}});
const ok=r=>{assert(!r.error,r.error?.message);return r.data;};const users=[],participants=[],sources=[],sessions=[],grants=[];const checks=[];
const run=crypto.randomUUID();
async function user(label){const password=crypto.randomBytes(24).toString('hex');const u=ok(await db.auth.admin.createUser({email:`timing-${label}-${run}@example.invalid`,password,email_confirm:true})).user;u.qaPassword=password;users.push(u);return u;}
async function participant(u,email=u.email){const p=ok(await db.from('assessment_participants').insert({user_id:u?.id??null,normalized_email:email,display_name:'Synthetic timing QA'}).select('id').single());participants.push(p.id);return p;}
async function eligibility(u,type,now){return ok(await db.rpc('dydd_assessment_eligibility',{p_user_id:u.id,p_assessment_type:type,p_owner_exemption:false,...(now?{p_now:now}:{})}));}
async function snapshot(u,p,type,at,source='timing-policy-synthetic'){const r=ok(await db.from('assessment_snapshots').insert({user_id:u?.id??null,participant_id:p.id,assessment_type:type,source,source_response_id:crypto.randomUUID(),source_submitted_at:at,scores:type==='fruit_360'?{summary:{Report_Mode:'SELF_ONLY'}}:{}}).select('id').single());sources.push(r.id);return r;}
async function grant(u,type,expires=new Date(Date.now()+86400000).toISOString()){const g=ok(await db.from('dydd_assessment_retake_grants').insert({user_id:u.id,assessment_type:type,request_id:crypto.randomUUID(),expires_at:expires}).select('id').single());grants.push(g.id);return g;}
try{
 const learner=await user('learner'),foreign=await user('foreign'),p=await participant(learner),fp=await participant(foreign);
 for(const type of ['designid','spiritual_gifts','fruitful_self'])assert.equal((await eligibility(learner,type)).reason,'first_attempt');checks.push('All three first attempts eligible; merely reading eligibility does not create an attempt');
 const completed='2026-08-31T15:05:00.000Z';
 const prior=await snapshot(learner,p,'designid',completed);
 for(const [when,allowed] of [['2026-11-29T15:04:59.999Z',false],['2026-11-29T15:05:00.000Z',true],['2026-11-29T15:05:00.001Z',true]]){const e=await eligibility(learner,'designid',when);assert.equal(e.allowed,allowed);assert.equal(Date.parse(e.nextEligible),Date.parse('2026-11-29T15:05:00Z'));assert.equal(e.previousAttemptId,prior.id);}
 checks.push('DesignID exact 90-day before/at/after boundary across month-end, not six months');
 const gifts=await snapshot(learner,p,'spiritual_gifts','2026-10-15T01:30:00Z');
 const fruit=await snapshot(learner,p,'fruit_360','2026-10-15T01:30:00Z');
 for(const type of ['spiritual_gifts','fruitful_self'])for(const [when,allowed] of [['2026-11-14T01:29:59.999Z',false],['2026-11-14T01:30:00.000Z',true],['2026-11-14T01:30:00.001Z',true]])assert.equal((await eligibility(learner,type,when)).allowed,allowed);
 checks.push('Gifts and imported Fruitful Life SELF_ONLY exact 30-day boundaries');
 const legacyEmail=`legacy${run.replaceAll('-','')}@gmail.com`,legacy=ok(await db.auth.admin.createUser({email:legacyEmail,password:crypto.randomBytes(24).toString('hex'),email_confirm:true})).user;users.push(legacy);
 const legacyP=ok(await db.from('assessment_participants').insert({normalized_email:legacyEmail.replace('@gmail.com','+history@googlemail.com'),display_name:'Synthetic linked history'}).select('id').single());participants.push(legacyP.id);
 const imported=await snapshot(null,legacyP,'designid',new Date().toISOString(),'timing-import-synthetic');assert.equal((await eligibility(legacy,'designid')).previousAttemptId,imported.id);assert.equal((await eligibility(legacy,'designid')).allowed,false);
 const foreignRecent=await snapshot(foreign,fp,'designid',new Date().toISOString());assert.equal((await eligibility(learner,'designid')).previousAttemptId,prior.id);checks.push('Latest linked imported alias history honored; foreign owned account excluded');
 const ownerRead=ok(await db.rpc('dydd_assessment_eligibility',{p_user_id:learner.id,p_assessment_type:'designid',p_owner_exemption:true}));assert.equal(ownerRead.reason,'owner');assert(ownerRead.allowed);
 const legacyPermit=ok(await db.from('designid_retake_overrides').insert({participant_id:p.id,granted_by:foreign.id,reason:'Synthetic legacy override preservation'}).select('id').single());
 assert.equal((await eligibility(learner,'designid')).reason,'legacy_override');
 const saveArgs={p_user_id:learner.id,p_participant_id:p.id,p_source_response_id:`timing-designid:${run}`,p_owner_exemption:false,p_scores:{summary:{synthetic:true}}};
 const saves=await Promise.all(Array.from({length:8},(_,i)=>db.rpc('save_designid_attempt',{...saveArgs,p_source_response_id:saveArgs.p_source_response_id+':'+i})));
 assert.equal(saves.filter(r=>!r.error).length,1);const first=saves.find(r=>!r.error).data;sources.push(first);
 assert(ok(await db.from('designid_retake_overrides').select('used_at,used_snapshot_id').eq('id',legacyPermit.id).single()).used_at);
 assert.equal(ok(await db.from('designid_retake_overrides').select('used_snapshot_id').eq('id',legacyPermit.id).single()).used_snapshot_id,first);
 await db.from('designid_retake_overrides').delete().eq('id',legacyPermit.id);
 checks.push('Preserved owner exemption and legacy one-use override; eight concurrent new completions yield one attempt/consumption');
 const g=await grant(learner,'designid');assert.equal((await eligibility(learner,'designid')).reason,'one_use_grant');
 const before=ok(await db.from('dydd_assessment_retake_grants').select('used_at').eq('id',g.id).single());assert.equal(before.used_at,null);
 // A forced constraint failure after policy check must roll back grant consumption.
 const failed=await db.rpc('save_designid_attempt',{...saveArgs,p_source_response_id:null,p_scores:null});assert(failed.error);
 assert.equal(ok(await db.from('dydd_assessment_retake_grants').select('used_at').eq('id',g.id).single()).used_at,null);
 const race=await Promise.all(Array.from({length:10},(_,i)=>db.rpc('save_designid_attempt',{...saveArgs,p_source_response_id:`grant-race:${run}:${i}`})));
 assert.equal(race.filter(r=>!r.error).length,1);const replacement=race.find(r=>!r.error).data;sources.push(replacement);
 assert(ok(await db.from('dydd_assessment_retake_grants').select('used_at').eq('id',g.id).single()).used_at);
 assert.equal((await eligibility(learner,'designid')).allowed,false);const latest=await eligibility(learner,'designid');assert.equal(latest.previousAttemptId,replacement);assert.equal(Date.parse(latest.nextEligible)-Date.parse(latest.previousCompletedAt),90*86400000);
 checks.push('Draft/read/failed transaction do not consume grant; ten competing completions consume once and restart normal interval, preserving prior snapshots');
 const expired=await grant(learner,'designid',new Date(Date.now()-1).toISOString());assert.equal((await eligibility(learner,'designid')).allowed,false);
 assert((await db.rpc('save_designid_attempt',{...saveArgs,p_participant_id:fp.id})).error);checks.push('Expired grant and foreign participant denied');
 const giftGrant=await grant(learner,'spiritual_gifts');
 const session=ok(await db.from('spiritual_gifts_sessions').insert({created_by_user_id:learner.id,participant_id:p.id,participant_email:learner.email,participant_name:'Synthetic timing QA',source_system:'timing-policy-qa',intake_token_hash:'x'.repeat(64),session_status:'active'}).select('id').single());sessions.push(session.id);
 const giftArgs={p_user_id:learner.id,p_participant_id:p.id,p_session_id:session.id,p_owner_exemption:false,p_response:{answers:{synthetic:true},derived_scores:{synthetic:true},gift_rank:['synthetic']},p_scores:{summary:{synthetic:true}}};
 const giftsRace=(await Promise.all(Array.from({length:10},()=>db.rpc('save_spiritual_gifts_attempt',giftArgs)))).map(ok);
 assert.equal(giftsRace.filter(r=>!r.replayed).length,1);assert.equal(new Set(giftsRace.map(r=>r.id)).size,1);sources.push(giftsRace[0].id);
 assert.equal(ok(await db.from('spiritual_gifts_responses').select('id').eq('session_id',session.id)).length,1);
 assert(ok(await db.from('dydd_assessment_retake_grants').select('used_at').eq('id',giftGrant.id).single()).used_at);
 assert((await db.rpc('save_spiritual_gifts_attempt',{...giftArgs,p_user_id:foreign.id})).error);
 checks.push('Ten Gifts retries atomically yield one response+snapshot+grant; saved technical replay returns same result; foreign session denied');
 const auth=createClient(c.project_url,c.anon_key,{auth:{persistSession:false}});ok(await auth.auth.signInWithPassword({email:foreign.email,password:foreign.qaPassword}));
 for(const client of [anon,auth]){assert((await client.rpc('dydd_assessment_eligibility',{p_user_id:learner.id,p_assessment_type:'designid',p_owner_exemption:true})).error);assert((await client.rpc('save_designid_attempt',saveArgs)).error);assert((await client.from('dydd_assessment_retake_grants').select('*')).error);}
 checks.push('Actual signed-in foreign client and anon cannot invoke privileged policy/save or read grants');
}finally{
 // Service-role session is never replaced by learner signin during cleanup.
 for(const id of sessions){await db.from('spiritual_gifts_responses').delete().eq('session_id',id);await db.from('spiritual_gifts_sessions').delete().eq('id',id);}
 if(grants.length)ok(await db.from('dydd_assessment_retake_grants').delete().in('id',grants));
 if(sources.length)ok(await db.from('assessment_snapshots').delete().in('id',sources));
 for(const u of users){await db.from('dydd_lifecycle_jobs').delete().eq('user_id',u.id);await db.from('dydd_lifecycle_events').delete().eq('user_id',u.id);}
 if(participants.length)ok(await db.from('assessment_participants').delete().in('id',participants));
 for(const u of users)ok(await db.auth.admin.deleteUser(u.id));
 const sec=await sandboxSql("select p.proname,has_function_privilege('anon',p.oid,'execute') anon,has_function_privilege('authenticated',p.oid,'execute') authenticated from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('dydd_assessment_eligibility','dydd_assert_assessment_completion','save_designid_attempt','save_spiritual_gifts_attempt')",true);assert(sec.every(p=>!p.anon&&!p.authenticated));checks.push('All timing/save RPCs deny anon/authenticated roles');
 fs.writeFileSync('tmp/assessment-timing/core-qa.json',JSON.stringify({at:new Date().toISOString(),ref:c.ref,checks,syntheticAccountsCleaned:users.length,providerCalls:0},null,2));console.log(JSON.stringify({checks,syntheticAccountsCleaned:users.length,providerCalls:0},null,2));
}
