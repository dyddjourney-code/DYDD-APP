// Explicit isolated DB integration; synthetic accounts only; no PDF/email providers.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const m=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert.equal(new URL(c.project_url).hostname,'atemrshtshxoqnuevvqu.supabase.co');assert.equal(c.vercel.projectId,'prj_5EC6sfJe9DpGYW59L94iwppeMYUg');
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false,autoRefreshToken:false}});
async function sql(query){const response=await fetch(`https://api.supabase.com/v1/projects/${c.ref}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${m.management_access_token}`,'Content-Type':'application/json'},body:JSON.stringify({query})});if(!response.ok)throw Error(`Isolated SQL ${response.status}: ${(await response.text()).slice(0,800)}`);return response.json();}
const probe=await sql("select current_database() as db, (select count(*) from information_schema.tables where table_schema='public' and table_name='assessment_snapshots') as baseline");assert.equal(Number(probe[0].baseline),1);
const migration='supabase/migrations/20261105231031_designpd_generation_reservations.sql';
if(process.argv.includes('--apply')){
 const prior=await sql("select version from supabase_migrations.schema_migrations where version='20261105231031'");
 if(!prior.length){const source=fs.readFileSync(migration,'utf8');await sql(source.replace(/commit;\s*$/,()=>"insert into supabase_migrations.schema_migrations(version,name,statements) values ('20261105231031','designpd_generation_reservations',array[$migration$"+source+"$migration$]); commit;"));}
}
const events=[];let uid,foreign;let sourceIds=[];
function check(r){if(r.error)throw Error(r.error.message);return r.data;}
try{
 for(const which of ['owner','foreign']){const u=check(await db.auth.admin.createUser({email:`designpd-${which}-${crypto.randomUUID()}@example.invalid`,password:crypto.randomBytes(24).toString('hex'),email_confirm:true})).user;if(which==='owner')uid=u.id;else foreign=u.id;}
 const participant=check(await db.from('assessment_participants').insert({user_id:uid,normalized_email:`qa-${uid}@example.invalid`,display_name:'Synthetic DesignPD policy QA'}).select('id').single()).id;
 const sources=check(await db.from('assessment_snapshots').insert([1,2,3,4,5].map(()=>({user_id:uid,participant_id:participant,assessment_type:'designid',scores:{},source:'designpd-dedup-synthetic'}))).select('id')).map(s=>s.id);
 sourceIds=sources;
 check(await db.from('assessment_snapshots').update({user_id:null}).eq('id',sources[1]));
 const version='synthetic-dedup-v1';
 const reserve=(source=sources[0],owner=uid,ver=version)=>db.rpc('reserve_designpd_generation',{p_user:owner,p_source:source,p_version:ver,p_participant:participant,p_scores:{designIdSnapshotId:source,contentVersion:ver,summary:{synthetic:true}}});
 const finish=(r,pdf,source=sources[0])=>db.rpc('finish_designpd_generation',{p_user:uid,p_source:source,p_version:version,p_token:r.token,p_pdf:pdf,p_report_url:'https://example.invalid/saved-report'});
 const concurrent=(await Promise.all(Array.from({length:12},()=>reserve()))).map(check);
 assert.equal(concurrent.filter(r=>r.status==='reserved').length,1);assert.equal(new Set(concurrent.map(r=>r.snapshotId)).size,1);
 const r=concurrent.find(r=>r.status==='reserved');assert(concurrent.filter(r=>r!==concurrent.find(q=>q===r)).every(q=>q.status==='running'));events.push('12 simultaneous reservations: one snapshot, one job');
 assert.equal(check(await finish({...r,token:crypto.randomUUID()},{status:'success'})),false,'foreign token rejected');
 assert.equal(check(await finish(r,{status:'success',documentId:'synthetic-ready',storage:{path:'synthetic/never-created.pdf'}})),true);
 assert.equal(check(await finish(r,{status:'error'})),false,'completion replay rejected');
 assert.equal(check(await reserve()).status,'ready');assert.equal(check(await reserve()).snapshotId,r.snapshotId);events.push('ready reopens; stale token and completion replay denied');
 const newer=check(await reserve(sources[1]));assert.equal(newer.status,'reserved');assert.notEqual(newer.snapshotId,r.snapshotId);
 const changed=check(await reserve(sources[0],uid,'synthetic-dedup-v2'));assert.equal(changed.status,'reserved');assert.notEqual(changed.snapshotId,r.snapshotId);events.push('linked imported source and new content version separate; old ready report unchanged');
 assert((await reserve(sources[0],foreign)).error,'foreign source denied');assert((await reserve(crypto.randomUUID())).error,'missing source denied');
 const readyBefore=check(await db.from('assessment_snapshots').select('scores').eq('id',r.snapshotId).single());assert.equal(readyBefore.scores.pdfMonkey.documentId,'synthetic-ready');
 const retry=check(await reserve(sources[2]));assert.equal(check(await finish(retry,{status:'failure',documentId:'synthetic-terminal'},sources[2])),true);
 assert.equal(check(await reserve(sources[2])).status,'retry_later');
 for(let i=2;i<=3;i++){await sql(`update public.designpd_generation_reservations set updated_at=now()-interval '2 minutes' where user_id='${uid}' and source_snapshot_id='${sources[2]}'`);const rr=check(await reserve(sources[2]));assert.equal(rr.status,'reserved');assert.equal(rr.snapshotId,retry.snapshotId);assert.equal(check(await finish(rr,{status:'failure',documentId:`synthetic-terminal-${i}`},sources[2])),true);}
 assert.equal(check(await reserve(sources[2])).status,'exhausted');events.push('terminal failure retries same snapshot; one-minute backoff; hard 3-job cap');
 const uncertain=check(await reserve(sources[3]));assert.equal(check(await finish(uncertain,{status:'error',error:'transport outcome unknown'},sources[3])),true);assert.equal(check(await reserve(sources[3])).status,'uncertain');events.push('ambiguous transport never spawns replacement jobs');
 const legacy=check(await db.from('assessment_snapshots').insert({user_id:uid,participant_id:participant,assessment_type:'designpd',source:'designpd_app',scores:{designIdSnapshotId:sources[4],contentVersion:version,pdfMonkey:{status:'error'}}}).select('id').single());const adopted=check(await reserve(sources[4]));assert.equal(adopted.status,'uncertain');assert.equal(adopted.snapshotId,legacy.id);events.push('pre-migration error adopted without duplicate generation');
 const security=await sql("select relrowsecurity from pg_class where oid='public.designpd_generation_reservations'::regclass; select has_function_privilege('anon','public.reserve_designpd_generation(uuid,uuid,text,uuid,jsonb)','execute') as anon,has_function_privilege('authenticated','public.reserve_designpd_generation(uuid,uuid,text,uuid,jsonb)','execute') as authenticated");assert.equal(security[0].anon,false);assert.equal(security[0].authenticated,false);
 const anon=createClient(c.project_url,c.anon_key,{auth:{persistSession:false}});assert((await anon.rpc('reserve_designpd_generation',{p_user:uid,p_source:sources[0],p_version:version,p_participant:participant,p_scores:{}})).error);assert((await anon.from('designpd_generation_reservations').select('*')).error);events.push('anon/authenticated RPC execute revoked; anon ledger read denied');
 console.log(JSON.stringify({sandboxRef:c.ref,vercelProject:c.vercel.projectId,events},null,2));
}finally{
 if(uid){check(await db.from('assessment_snapshots').delete().eq('user_id',uid));if(sourceIds.length)check(await db.from('assessment_snapshots').delete().in('id',sourceIds));check(await db.from('assessment_participants').delete().eq('user_id',uid));check(await db.auth.admin.deleteUser(uid));}
 if(foreign)check(await db.auth.admin.deleteUser(foreign));
 console.log('Synthetic users, participants, snapshots, reservation rows cleaned. No PDF/email provider calls.');
}
