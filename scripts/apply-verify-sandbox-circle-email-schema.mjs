// Scope: explicit sandbox migration, rollback-only Circle verification, no provider/worker.
// Inspect: node scripts/apply-verify-sandbox-circle-email-schema.mjs
// Apply + verify: node scripts/apply-verify-sandbox-circle-email-schema.mjs --apply
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {grantCircleFixture,cleanupCircleFixtures} from '../tests/lifecycle-circle-fixtures.mjs';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const s=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');
assert.equal(new URL(c.project_url).hostname,'atemrshtshxoqnuevvqu.supabase.co');
assert.equal(c.vercel.projectId,'prj_5EC6sfJe9DpGYW59L94iwppeMYUg');
const file='supabase/migrations/20261104202651_circle_held_invitation_lifecycle_bridge.sql';
const migration=fs.readFileSync(file,'utf8'),version='20261104202651',name='circle_held_invitation_lifecycle_bridge';
const old=migration.match(/old_update text := \$old\$([\s\S]*?)\$old\$/)[1];
const replacement=migration.match(/new_update text := \$new\$([\s\S]*?)\$new\$/)[1];
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const expectedBefore='a7125c65f328bc87eb80934022c9be32a9faf7886089810d15b45be989e48d7c';
async function sql(query,readOnly=false){
 const r=await fetch(`https://api.supabase.com/v1/projects/${c.ref}/database/query`,{method:'POST',headers:{Authorization:'Bearer '+s.management_access_token,'Content-Type':'application/json'},body:JSON.stringify({query,read_only:readOnly})});
 const data=await r.json();assert(r.ok,'Sandbox SQL '+r.status+': '+JSON.stringify(data).slice(0,1200));return data;
}
const before=(await sql("select pg_get_functiondef('public.dydd_circle_operate(uuid,jsonb,boolean)'::regprocedure) definition",true))[0].definition;
const history=await sql(`select version,name,statements from supabase_migrations.schema_migrations where version='${version}'`,true);
const proof={at:new Date().toISOString(),ref:c.ref,projectId:c.vercel.projectId,file,migrationSHA256:hash(migration),beforeSHA256:hash(before),noBackfill:true,providerCalls:0,productionMutations:0};
if(!process.argv.includes('--apply')){
 assert.equal(history.length,0);assert.equal(hash(before),expectedBefore);assert.equal(before.split(old).length,2);
 console.log(JSON.stringify({...proof,state:'inspected only',exactMatch:true,oldUpdate:old,newUpdate:replacement},null,2));process.exit(0);
}
if(!history.length){
 assert.equal(hash(before),expectedBefore,'Live function drift; re-inspect, do not overwrite');
 assert.equal(before.split(old).length,2);
 const body=migration.replace(/^begin;$/m,'').replace(/^commit;$/m,'');
 await sql(`begin; ${body}\ninsert into supabase_migrations.schema_migrations(version,name,statements) values('${version}','${name}',array[$migration_record$${migration}$migration_record$]); commit;`);
 proof.applied=true;
}else{assert.equal(history[0].name,name);assert.equal(history[0].statements[0],migration);proof.applied=false;}
const after=(await sql("select pg_get_functiondef('public.dydd_circle_operate(uuid,jsonb,boolean)'::regprocedure) definition",true))[0].definition;
proof.afterSHA256=hash(after);
if(!history.length)assert.equal(after,before.replace(old,replacement),'Only exact roster UPDATE may differ');
else assert.equal(hash(after.replace(replacement,old)),expectedBefore);
proof.everyOtherFunctionBytePreserved=true;
const secure=(await sql(`select p.prosecdef security_definer,p.proconfig configuration,has_function_privilege('anon',p.oid,'execute') anon_execute,has_function_privilege('authenticated',p.oid,'execute') authenticated_execute,pg_get_triggerdef(t.oid) trigger_definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_trigger t on t.tgfoid=p.oid where n.nspname='dydd_private' and p.proname='capture_circle_held_invitation'`,true))[0];
assert(secure.security_definer);assert.equal(secure.anon_execute,false);assert.equal(secure.authenticated_execute,false);assert(secure.configuration.includes('search_path=""'));assert(secure.trigger_definition.includes('AFTER INSERT'));assert(secure.trigger_definition.includes("invitation"));proof.security=secure;
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}}),users=[],circle=crypto.randomUUID();
const check=r=>{assert(!r.error,r.error?.message);return r.data;};
try{
 const leader=check(await db.auth.admin.createUser({email:'circle-schema-'+crypto.randomUUID()+'@example.invalid',email_confirm:true})).user;users.push(leader);
 await grantCircleFixture(db,leader);
 const email='circle-schema-member-'+crypto.randomUUID()+'@example.invalid';
 const literal=v=>"'"+String(v).replaceAll("'","''")+"'";
 await sql(`begin; set local role service_role;
 do $verify$
 declare circle_key uuid:='${circle}'; leader uuid:='${leader.id}'; member_email text:=${literal(email)}; campaign uuid; revision_before integer; timestamp_before timestamptz; initial_plan jsonb; held uuid; ev uuid; preview jsonb; result jsonb;
 begin
 initial_plan:=jsonb_build_object('name','Rollback-only Circle schema fixture','format','Small group','expectedPeople','3','participants',jsonb_build_array(jsonb_build_object('name','Member One','email',member_email)));
 insert into public.journey_circle_plans(id,user_id,status,plan) values(circle_key,leader,'active',initial_plan);
 select revision,updated_at into revision_before,timestamp_before from public.journey_circle_plans where id=circle_key;
 insert into public.dydd_circle_campaigns(circle_id,circle_revision,plan_snapshot) values(circle_key,revision_before,initial_plan) returning id into campaign;
 insert into public.dydd_circle_message_drafts(campaign_id,message_key,template_id,kind,category,subject,body,scheduled_at,expires_at,approved_at,approved_by)
 values(campaign,'meeting-reminder','E02','member','circle','Synthetic review','Rollback-only approved copy',now()+interval '7 days',now()+interval '8 days',now(),leader);
 result:=public.dydd_finalize_circle_campaign(campaign,leader,null);
 if not (result->>'finalized')::boolean then raise exception 'Fixture campaign not finalized';end if;
 -- First invite materializes an already-approved roster without changing the plan.
 perform public.dydd_circle_operate(leader,jsonb_build_object('action','invite','circleId',circle_key,'name','Member One','email',member_email));
 if not exists(select 1 from public.journey_circle_plans where id=circle_key and revision=revision_before and plan=initial_plan and updated_at=timestamp_before) then raise exception 'Identical roster changed revision/plan/timestamp';end if;
 if not exists(select 1 from public.dydd_circle_campaigns where id=campaign and status='finalized') then raise exception 'Identical roster superseded approved campaign';end if;
 select id into held from public.dydd_circle_held_outbox where circle_id=circle_key and kind='invitation';
 if held is null then raise exception 'Missing held invitation';end if;
 select id into ev from public.dydd_lifecycle_events where event_key='circle-held-invitation:'||held and kind='circle_invited' and source_id=held::text and payload=jsonb_build_object('circleId',circle_key) and email=member_email;
 if ev is null then raise exception 'Missing stable token-free lifecycle event';end if;
 -- Retry single invite, then CSV-preview invite: no new token, hold, event or revision.
 perform public.dydd_circle_operate(leader,jsonb_build_object('action','invite','circleId',circle_key,'name','Member One','email',member_email));
 preview:=public.dydd_circle_operate(leader,jsonb_build_object('action','preview_roster','circleId',circle_key,'rows',jsonb_build_array(jsonb_build_object('name','Member One','email',member_email)),'errors','[]'::jsonb));
 perform public.dydd_circle_operate(leader,jsonb_build_object('action','invite_roster','circleId',circle_key,'previewId',preview->>'previewId'));
 if not exists(select 1 from public.dydd_circle_roster_previews where id=(preview->>'previewId')::uuid and consumed_at is not null) then raise exception 'Preview not atomically consumed';end if;
 if (select count(*) from public.dydd_circle_held_outbox where circle_id=circle_key and kind='invitation')<>1 then raise exception 'Duplicate held invitation';end if;
 if (select count(*) from public.dydd_lifecycle_events where source_id=held::text)<>1 then raise exception 'Duplicate lifecycle event';end if;
 if not exists(select 1 from public.journey_circle_plans where id=circle_key and revision=revision_before and updated_at=timestamp_before) then raise exception 'Retry bumped revision';end if;
 if not exists(select 1 from public.dydd_circle_campaigns where id=campaign and status='finalized') then raise exception 'Retry invalidated finalized messages';end if;
 -- Non-invitation holds are intentionally NOT lifecycle invitation sources.
 insert into public.dydd_circle_held_outbox(circle_id,event_key,recipient,kind,payload) values(circle_key,'schema-noninvite:'||circle_key,'owner-review','cohort_approval','{}') returning id into held;
 if exists(select 1 from public.dydd_lifecycle_events where source_id=held::text) then raise exception 'Non-invitation captured';end if;
 -- A genuine roster change preserves revision bump and supersession.
 perform public.dydd_circle_operate(leader,jsonb_build_object('action','invite','circleId',circle_key,'name','Member Two','email','second-'||member_email));
 if not exists(select 1 from public.journey_circle_plans where id=circle_key and revision=revision_before+1 and jsonb_array_length(plan->'participants')=2) then raise exception 'Changed roster did not increment revision';end if;
 if not exists(select 1 from public.dydd_circle_campaigns where id=campaign and status='superseded') then raise exception 'Changed roster did not supersede old campaign';end if;
 if (select count(*) from public.dydd_lifecycle_events where payload->>'circleId'=circle_key::text and kind='circle_invited')<>2 then raise exception 'Changed roster event count';end if;
 end $verify$;
 rollback;`);
 const rows=await sql(`select (select count(*) from public.journey_circle_plans where id='${circle}') plans,(select count(*) from public.dydd_circle_held_outbox where circle_id='${circle}') holds,(select count(*) from public.dydd_lifecycle_events where payload->>'circleId'='${circle}') events,(select count(*) from public.dydd_circle_memberships where circle_id='${circle}') memberships,(select count(*) from public.dydd_circle_campaigns where circle_id='${circle}') campaigns,(select count(*) from public.dydd_circle_roster_previews where circle_id='${circle}') previews,(select count(*) from public.dydd_lifecycle_jobs where circle_id='${circle}') jobs`,true);
 for(const n of Object.values(rows[0]))assert.equal(n,0);
 proof.circleVerification={sameRosterFirstInvite:'pass',repeatInvite:'pass',repeatInviteRoster:'pass',approvedCampaignPreserved:'pass',unchangedTimestamp:'pass',changedRosterIncrementsRevision:'pass',changedRosterSupersedes:'pass',stableHeldEventOnce:'pass',invitationOnly:'pass',rollbackReadback:rows[0]};
}finally{await cleanupCircleFixtures(db,{users,circles:[]});proof.authAndEntitlementFixturesCleaned=true;}
const regression=spawnSync(process.execPath,['tests/circle-operations-sandbox.mjs'],{encoding:'utf8',timeout:120000});
proof.existingCircleOperationsRegression={exitCode:regression.status,stdout:regression.stdout.trim(),stderr:regression.stderr.trim()};
proof.history=await sql(`select version,name from supabase_migrations.schema_migrations where version='${version}'`,true);
proof.verified=regression.status===0;
fs.writeFileSync('docs/evidence/circle-email-schema-2026-11-04.json',JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify(proof,null,2));
assert.equal(regression.status,0,'Existing Circle operations regression failed; see evidence');
