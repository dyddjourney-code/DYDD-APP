// Database verification is deliberately rollback-only: migration + synthetic fixtures + checks
// execute in ONE sandbox transaction. No schema deploy, provider call or persisted fixture.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');
const s=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json'));
const migration=fs.readFileSync(new URL('../supabase/migrations/20261027203849_circle_message_exclusions.sql',import.meta.url),'utf8');
assert(!/\b(commit|begin;)\b/i.test(migration),'Migration must be safe within rollback-only harness');
const followUpMigration=fs.readFileSync(new URL('../supabase/migrations/20261027210232_circle_welcome_excluded_preparation.sql',import.meta.url),'utf8');
const checks=`
do $test$
declare p uuid:=gen_random_uuid(); c uuid; c2 uuid; m uuid; d uuid; w uuid; prep uuid; other uuid; j uuid; lease uuid:=gen_random_uuid(); r jsonb; v integer; rejected boolean; creator uuid:=gen_random_uuid(); invitation uuid; reminder uuid; leader uuid; owner_circle uuid:=gen_random_uuid(); owner_campaign uuid; fixture_email text:='exclude-'||gen_random_uuid()||'@example.test'; plan jsonb;
begin
 update public.dydd_lifecycle_settings set paused=false,optional_paused=false where id;
 plan:=jsonb_build_object('participants',jsonb_build_array(jsonb_build_object('name','QA','email',fixture_email)));
 insert into public.journey_circle_plans(id,preview_scope,status,plan) values(p,'owner','active',plan);
 insert into public.dydd_circle_campaigns(circle_id,circle_revision,plan_snapshot) values(p,1,plan) returning id into c;
 insert into public.dydd_circle_memberships(circle_id,email,display_name,token_hash,expires_at,status) values(p,fixture_email,'QA',gen_random_uuid()::text,now()+interval '30 days','accepted') returning id into m;
 insert into public.dydd_circle_message_drafts(campaign_id,message_key,template_id,kind,category,subject,body,scheduled_at,expires_at)
 values(c,'reminder-1','E02','member','circle','Reminder','Reminder body',now()+interval '7 days',now()+interval '8 days') returning id into d;
 insert into public.dydd_circle_message_drafts(campaign_id,message_key,template_id,kind,category,subject,body,scheduled_at,expires_at,approved_at)
 values(c,'welcome','D03','member','service','Welcome','Welcome {{next_preparation}}'||chr(10)||chr(10)||'Open the Journey: https://sandbox.example/journey',now(),now()+interval '8 days',now()) returning id into w;
 insert into public.dydd_circle_message_drafts(campaign_id,message_key,template_id,kind,category,subject,body,scheduled_at,expires_at,approved_at,meeting_index)
 values(c,'preparation-1','D04','member','circle','First preparation','SECRET FIRST PREPARATION'||chr(10)||chr(10)||'Open the Journey: https://sandbox.example/journey',now()+interval '6 days',now()+interval '8 days',now(),1) returning id into prep;
 insert into public.dydd_circle_message_drafts(campaign_id,message_key,template_id,kind,category,subject,body,scheduled_at,expires_at,approved_at,meeting_index)
 values(c,'preparation-2','E01','member','circle','Next preparation','NEXT INCLUDED PREPARATION'||chr(10)||chr(10)||'Open the Journey: https://sandbox.example/journey',now()+interval '13 days',now()+interval '15 days',now(),2) returning id into other;
 rejected:=false;begin perform public.dydd_finalize_circle_campaign(c,null,'owner');exception when others then rejected:=true;end;
 if not rejected then raise exception 'Unreviewed included message finalized';end if;
 rejected:=false;begin perform public.dydd_set_circle_message_excluded(d,null,'new',1,true);exception when others then rejected:=true;end;
 if not rejected then raise exception 'Wrong preview scope excluded message';end if;
 rejected:=false;begin perform public.dydd_set_circle_message_excluded(d,gen_random_uuid(),null,1,true);exception when others then rejected:=true;end;
 if not rejected then raise exception 'Null ownership comparison bypassed exclusion authorization';end if;
 r:=public.dydd_set_circle_message_excluded(d,null,'owner',1,true);
 if r->>'excluded_at' is null or (r->>'revision')::integer<>2 or r->>'approved_at' is not null then raise exception 'Exclusion did not persist';end if;
 rejected:=false;begin perform public.dydd_set_circle_message_excluded(d,null,'owner',1,false);exception when others then rejected:=true;end;
 if not rejected then raise exception 'Stale restore succeeded';end if;
 perform public.dydd_finalize_circle_campaign(c,null,'owner');
 if exists(select 1 from public.dydd_lifecycle_jobs where campaign_id=c and draft_id=d) then raise exception 'Excluded reminder queued';end if;
 if not exists(select 1 from public.dydd_lifecycle_jobs where campaign_id=c and draft_id=w and body like '%SECRET FIRST PREPARATION%') then raise exception 'Initial managed slot missing';end if;
 if exists(select 1 from public.dydd_lifecycle_jobs where campaign_id=c and draft_id=w and (length(body)-length(replace(body,'Open the Journey:','')))/length('Open the Journey:')<>1) then raise exception 'Managed preparation duplicated Journey CTA';end if;
 -- Excluding approved preparation removes embedded copy from an already queued welcome.
 perform public.dydd_set_circle_message_excluded(prep,null,'owner',1,true);
 if not exists(select 1 from public.dydd_lifecycle_jobs where campaign_id=c and draft_id=w and status='queued' and body like '%Your leader will confirm preparation for your next meeting.%' and body not like '%SECRET FIRST PREPARATION%' and body not like '%NEXT INCLUDED PREPARATION%') then raise exception 'Excluded preparation leaked into pending welcome';end if;
 -- Restore clears approval and cancels the full pending plan until re-finalization.
 r:=public.dydd_set_circle_message_excluded(d,null,'owner',2,false);
 if r->>'excluded_at' is not null or r->>'approved_at' is not null or (select status from public.dydd_circle_campaigns where id=c)<>'draft' then raise exception 'Restore failed to reopen review';end if;
 rejected:=false;begin perform public.dydd_set_circle_campaign_paused(c,null,'owner',false);exception when others then rejected:=true;end;
 if not rejected then raise exception 'Stale resume bypassed restored message review';end if;
 if exists(select 1 from public.dydd_lifecycle_jobs where campaign_id=c and status in ('queued','processing','retry')) then raise exception 'Restore left pending current jobs';end if;
 rejected:=false;begin perform public.dydd_finalize_circle_campaign(c,null,'owner');exception when others then rejected:=true;end;
 if not rejected then raise exception 'Restored unapproved message finalized';end if;
 perform public.dydd_update_circle_message(d,null,'owner',3,'Reminder edited','Approved replacement body',true);
 perform public.dydd_finalize_circle_campaign(c,null,'owner');
 select id into j from public.dydd_lifecycle_jobs where campaign_id=c and draft_id=d;
 if j is null then raise exception 'Restored and approved message did not queue';end if;
 -- Fence rejects stale snapshots and cancellations even if claimed before exclusion.
 update public.dydd_lifecycle_jobs set status='processing',claim_token=lease,claimed_at=now(),context=context||'{"draftRevision":1}'::jsonb where id=j;
 r:=public.dydd_authorize_lifecycle_send(j,lease);
 if (r->>'authorized')::boolean then raise exception 'Stale draft revision authorized';end if;
 update public.dydd_lifecycle_jobs set context=context||'{"draftRevision":4}'::jsonb where id=j;
 r:=public.dydd_authorize_lifecycle_send(j,lease);
 if not (r->>'authorized')::boolean then raise exception 'Current included message rejected: %',r;end if;
 -- Post-boundary submitting history cannot be recalled or overwritten by exclusion.
 perform public.dydd_set_circle_message_excluded(d,null,'owner',4,true);
 if (select status from public.dydd_lifecycle_jobs where id=j)<>'submitting' then raise exception 'Exclusion mutated authorized submission';end if;
 update public.dydd_lifecycle_jobs set status='retry' where id=j;
 -- A retry claimed after exclusion is independently stopped even if cancellation was missed.
 update public.dydd_lifecycle_jobs set status='processing',claim_token=lease where id=j;
 r:=public.dydd_authorize_lifecycle_send(j,lease);
 if (r->>'authorized')::boolean then raise exception 'Excluded retry authorized';end if;
 -- Exclusion cancels leases; a stale worker cannot finalize or submit.
 select id into j from public.dydd_lifecycle_jobs where campaign_id=c and draft_id=other;
 update public.dydd_lifecycle_jobs set status='processing',claim_token=lease,claimed_at=now() where id=j;
 perform public.dydd_set_circle_message_excluded(other,null,'owner',1,true);
 r:=public.dydd_authorize_lifecycle_send(j,lease);
 if not coalesce((r->>'lostClaim')::boolean,false) then raise exception 'Cancelled claim was not fenced';end if;
 -- New material schedule retains intentional omissions but not old approvals.
 update public.journey_circle_plans set revision=2,plan=journey_circle_plans.plan||'{"location":"Revised"}'::jsonb where id=p;
 insert into public.dydd_circle_campaigns(circle_id,circle_revision,plan_snapshot) select p,2,cp.plan from public.journey_circle_plans cp where cp.id=p returning id into c2;
 insert into public.dydd_circle_message_drafts(campaign_id,message_key,template_id,kind,category,subject,body,scheduled_at,expires_at,approved_at)
 values(c2,'reminder-1','E02','member','circle','New reminder','New revision',now()+interval '7 days',now()+interval '8 days',now()) returning id into d;
 if not exists(select 1 from public.dydd_circle_message_drafts where id=d and excluded_at is not null and approved_at is null) then raise exception 'Revision lost intentional exclusion';end if;
 -- Invitations, reminders and leader messages use the same intentional omission rules.
 insert into auth.users(id,email,aud,role) values(creator,'creator-'||creator||'@example.test','authenticated','authenticated');
 execute 'set local role service_role';
 insert into public.journey_circle_plans(id,user_id,status,plan) values(owner_circle,creator,'active',plan);
 insert into public.dydd_circle_campaigns(circle_id,circle_revision,plan_snapshot) values(owner_circle,1,plan) returning id into owner_campaign;
 insert into public.dydd_circle_message_drafts(campaign_id,message_key,template_id,kind,category,subject,body,scheduled_at,expires_at,approved_at)
 values(owner_campaign,'invitation','D01','invitation','service','Invitation','Visit {{invitation_url}}',now(),now()+interval '20 days',now()) returning id into invitation;
 insert into public.dydd_circle_message_drafts(campaign_id,message_key,template_id,kind,category,subject,body,scheduled_at,expires_at,approved_at)
 values(owner_campaign,'invitation-reminder','D02','invitation','service','Reminder','Visit {{invitation_url}}',now()+interval '4 days',now()+interval '20 days',now()) returning id into reminder;
 insert into public.dydd_circle_message_drafts(campaign_id,message_key,template_id,kind,category,subject,body,scheduled_at,expires_at,approved_at)
 values(owner_campaign,'leader-launch','F01','leader','service','Leader','Leader body',now(),now()+interval '20 days',now()) returning id into leader;
 insert into public.dydd_circle_message_drafts(campaign_id,message_key,template_id,kind,category,subject,body,scheduled_at,expires_at,approved_at)
 values(owner_campaign,'reminder-1','E02','member','circle','Tomorrow','Tomorrow body',now()+interval '7 days',now()+interval '8 days',now());
 perform public.dydd_set_circle_message_excluded(invitation,creator,null,1,true);
 perform public.dydd_set_circle_message_excluded(leader,creator,null,1,true);
 perform public.dydd_finalize_circle_campaign(owner_campaign,creator,null);
 perform public.dydd_queue_circle_leader_messages(owner_campaign,creator,'creator-'||creator||'@example.test');
 rejected:=false;begin perform public.dydd_issue_circle_invitation(owner_campaign,creator,fixture_email,'QA',gen_random_uuid()::text,now()+interval '20 days','https://sandbox.example/invite');exception when others then rejected:=true;end;
 if not rejected then raise exception 'Excluded invitation was issued';end if;
 if exists(select 1 from public.dydd_lifecycle_jobs where campaign_id=owner_campaign and draft_id=leader) then raise exception 'Excluded leader message queued';end if;
 perform public.dydd_set_circle_message_excluded(invitation,creator,null,2,false);
 perform public.dydd_update_circle_message(invitation,creator,null,3,'Invitation restored','Visit {{invitation_url}}',true);
 perform public.dydd_set_circle_message_excluded(leader,creator,null,2,false);
 perform public.dydd_update_circle_message(leader,creator,null,3,'Leader restored','Restored leader body',true);
 perform public.dydd_set_circle_message_excluded(reminder,creator,null,1,true);
 perform public.dydd_finalize_circle_campaign(owner_campaign,creator,null);
 perform public.dydd_queue_circle_leader_messages(owner_campaign,creator,'creator-'||creator||'@example.test');
 if (select count(*) from public.dydd_lifecycle_events where kind='circle_finalized' and source_id=owner_campaign::text)<2 then raise exception 'Re-finalization lost durable reconciliation event';end if;
 perform public.dydd_issue_circle_invitation(owner_campaign,creator,fixture_email,'QA',gen_random_uuid()::text,now()+interval '20 days','https://sandbox.example/invite');
 if not exists(select 1 from public.dydd_lifecycle_jobs where campaign_id=owner_campaign and draft_id=invitation) then raise exception 'Restored invitation not queued';end if;
 if exists(select 1 from public.dydd_lifecycle_jobs where campaign_id=owner_campaign and draft_id=reminder) then raise exception 'Excluded pending invitation reminder queued';end if;
 select id into j from public.dydd_lifecycle_jobs where campaign_id=owner_campaign and draft_id=leader;
 if j is null then raise exception 'Restored leader not queued atomically';end if;
 update public.dydd_lifecycle_jobs set status='retry',send_authorized_at=now() where id=j;
 perform public.dydd_set_circle_message_excluded(leader,creator,null,4,true);
 if (select status from public.dydd_lifecycle_jobs where id=j)<>'review' then raise exception 'Ambiguous leader retry lost manual reconciliation';end if;
 perform public.dydd_queue_circle_leader_messages(owner_campaign,creator,'creator-'||creator||'@example.test');
 if (select status from public.dydd_lifecycle_jobs where id=j)<>'review' then raise exception 'Leader reconciliation replayed ambiguous history';end if;
 if has_function_privilege('anon','public.dydd_set_circle_message_excluded(uuid,uuid,text,integer,boolean)','execute') or has_function_privilege('authenticated','public.dydd_set_circle_message_excluded(uuid,uuid,text,integer,boolean)','execute') then raise exception 'Exclusion RPC public';end if;
end $test$;
`;
const inspected=await fetch('https://api.supabase.com/v1/projects/'+c.ref+'/database/query',{method:'POST',headers:{Authorization:'Bearer '+s.management_access_token,'Content-Type':'application/json'},body:JSON.stringify({query:"select exists(select 1 from information_schema.columns where table_schema='public' and table_name='dydd_circle_message_drafts' and column_name='excluded_at') as applied"})});assert(inspected.ok);const alreadyApplied=(await inspected.json())[0].applied;
const response=await fetch('https://api.supabase.com/v1/projects/'+c.ref+'/database/query',{method:'POST',headers:{Authorization:'Bearer '+s.management_access_token,'Content-Type':'application/json'},body:JSON.stringify({query:'begin;\n'+(alreadyApplied?'':migration)+'\n'+followUpMigration+'\n'+checks+'\nrollback;'})});
const body=await response.text();assert(response.ok,body);
console.log('PASS rollback-only sandbox DB: creator authorization, persisted exclusion, stale revisions, approve-or-exclude finalization, restored re-review, pending managed-slot replacement, scheduled/retry exclusion fences, submitted-history preservation, material revision inheritance, excluded invitation/reminder/leader queues, restored leader finalization, ambiguous-retry manual review, private RPC grants. No persisted migration/fixtures or provider calls.');
