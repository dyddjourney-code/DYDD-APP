-- Exact verified Auth email carryover; no snapshot rewrites or access grants.
begin;
alter table public.dydd_guest_account_links drop constraint dydd_guest_account_links_proof_method_check;
alter table public.dydd_guest_account_links add constraint dydd_guest_account_links_proof_method_check
 check(proof_method in ('verified_auth_and_guest_cookie','verified_exact_email'));
alter table public.dydd_guest_account_link_audit drop constraint dydd_guest_account_link_audit_proof_method_check;
alter table public.dydd_guest_account_link_audit add constraint dydd_guest_account_link_audit_proof_method_check
 check(proof_method in ('verified_auth_and_guest_cookie','verified_exact_email'));
create index dydd_guest_sessions_exact_email_idx on public.dydd_guest_sessions(lower(btrim(participant_email)));
-- This privileged operation re-reads Auth, not a caller's typed/profile address.
-- Existing links are immutable and never reassigned, even after an email change.
create function public.dydd_guest_link_matching_verified_account(p_user uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare account_email text; candidate uuid; s public.dydd_guest_sessions%rowtype; added integer:=0;
begin
 if coalesce(current_setting('role',true),'') <> 'service_role' then raise exception 'Trusted server required'; end if;
 select email into account_email from auth.users where id=p_user and email_confirmed_at is not null
 and coalesce(is_anonymous,false)=false and (banned_until is null or banned_until<=now()) for share;
 if not found or coalesce(btrim(account_email),'')='' then raise exception 'Verified account required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('guest-account-bridge:'||p_user::text,0));
 for candidate in select gs.id from public.dydd_guest_sessions gs
 where lower(btrim(gs.participant_email))=lower(btrim(account_email))
 and exists(select 1 from public.dydd_guest_results r where r.session_id=gs.id
  and public.dydd_guest_order_entitled(r.order_id)
  and (r.source_result_id is null or exists(select 1 from public.dydd_guest_results src
   where src.id=r.source_result_id and src.session_id=gs.id and src.product='designid'
    and public.dydd_guest_order_entitled(src.order_id))))
 order by gs.id loop
  select * into s from public.dydd_guest_sessions where id=candidate for update;
  if lower(btrim(s.participant_email))<>lower(btrim(account_email)) then continue; end if;
  if exists(select 1 from public.dydd_guest_account_links where session_id=s.id) then continue; end if;
  insert into public.dydd_guest_account_links(session_id,user_id,proof_method)
   values(s.id,p_user,'verified_exact_email');
  insert into public.dydd_guest_account_link_audit(session_id,user_id,event,guest_contact_email,verified_account_email,proof_method)
   values(s.id,p_user,'linked',s.participant_email,account_email,'verified_exact_email');
  added:=added+1;
 end loop;
 if exists(select 1 from public.dydd_guest_results r join public.dydd_guest_account_links l on l.session_id=r.session_id
  join public.assessment_snapshots a on a.id=r.id where l.user_id=p_user
  and (a.user_id is distinct from p_user or a.source is distinct from 'public_guest' or a.assessment_type<>r.product
   or a.scores is distinct from r.scores or a.source_submitted_at is distinct from r.created_at))
 then raise exception 'Existing result identity conflict; support review required'; end if;
 insert into public.assessment_snapshots(id,user_id,assessment_type,created_at,source,source_response_id,source_submitted_at,sync_batch_id,scores)
 select r.id,p_user,r.product,r.created_at,'public_guest','public-guest:'||r.id::text,r.created_at,'public-guest-bridge',r.scores
 from public.dydd_guest_results r join public.dydd_guest_account_links l on l.session_id=r.session_id
 where l.user_id=p_user and public.dydd_guest_order_entitled(r.order_id)
 and (r.product='designid' or (r.report_state='ready' and r.pdf->'storage'->>'bucket'='assessment-report-pdfs' and r.pdf->'storage'->>'path'='guest/'||r.id::text||'/report.pdf'))
 and (r.source_result_id is null or exists(select 1 from public.dydd_guest_results src where src.id=r.source_result_id
  and src.session_id=r.session_id and src.product='designid' and public.dydd_guest_order_entitled(src.order_id)))
 on conflict do nothing;
 return added;
end $$;
revoke all on function public.dydd_guest_link_matching_verified_account(uuid) from public,anon,authenticated;
grant execute on function public.dydd_guest_link_matching_verified_account(uuid) to service_role;
create or replace function public.save_designid_attempt(p_user_id uuid, p_participant_id uuid, p_source_response_id text, p_owner_exemption boolean, p_scores jsonb)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  latest_attempt public.assessment_snapshots%rowtype;
  permit_id uuid;
  snapshot_id uuid;
  guest_attempt_id uuid;
  latest_completed_at timestamptz;
begin
  perform public.dydd_guest_link_matching_verified_account(p_user_id);
  perform pg_advisory_xact_lock(hashtextextended('designid:' || p_user_id::text, 0));
  perform id from public.assessment_participants where id = p_participant_id and user_id = p_user_id for update;
  if not found then raise exception 'DesignID participant does not match your account.'; end if;
  select * into latest_attempt from public.assessment_snapshots
    where assessment_type = 'designid' and source is distinct from 'public_guest' and (user_id = p_user_id or participant_id = p_participant_id)
    order by coalesce(source_submitted_at, created_at) desc limit 1;
  latest_completed_at:=coalesce(latest_attempt.source_submitted_at,latest_attempt.created_at);
  select r.id,r.created_at into guest_attempt_id,latest_completed_at
   from public.dydd_guest_results r join public.dydd_guest_account_links l on l.session_id=r.session_id
   where l.user_id=p_user_id and r.product='designid' and public.dydd_guest_order_entitled(r.order_id)
    and (latest_completed_at is null or r.created_at>latest_completed_at)
   order by r.created_at desc,r.id limit 1;
  if guest_attempt_id is null then latest_completed_at:=coalesce(latest_attempt.source_submitted_at,latest_attempt.created_at); end if;
  select id into permit_id from public.designid_retake_overrides
    where participant_id = p_participant_id and used_at is null and expires_at > now()
    order by created_at limit 1 for update;
  if not p_owner_exemption and permit_id is null and latest_completed_at is not null
    and ((latest_completed_at at time zone 'UTC') + interval '6 months') at time zone 'UTC' > now()
    then raise exception 'Your next DesignID assessment is not available yet. Open Field Kit to see the eligible date.'; end if;
  snapshot_id := gen_random_uuid();
  insert into public.assessment_snapshots(id,user_id,participant_id,assessment_type,source,source_response_id,source_submitted_at,sync_batch_id,scores)
    values(snapshot_id,p_user_id,p_participant_id,'designid','designid_app',p_source_response_id,now(),'native-app',p_scores || jsonb_build_object('retakePolicy',jsonb_build_object('version','six-calendar-months-v1','ownerExemption',p_owner_exemption,'previousAttemptId',coalesce(guest_attempt_id,latest_attempt.id),'overrideId',case when not p_owner_exemption then permit_id end)));
  if not p_owner_exemption and permit_id is not null then
    update public.designid_retake_overrides set used_at=now(),used_snapshot_id=snapshot_id where id=permit_id;
  end if;
  return snapshot_id;
end;
$$;
revoke all on function public.save_designid_attempt(uuid,uuid,text,boolean,jsonb) from public, anon, authenticated;
grant execute on function public.save_designid_attempt(uuid,uuid,text,boolean,jsonb) to service_role;


create function dydd_private.guest_bridge_result_allowed(p_result uuid,p_user uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.dydd_guest_results r join public.dydd_guest_account_links l on l.session_id=r.session_id
 where r.id=p_result and l.user_id=p_user and public.dydd_guest_order_entitled(r.order_id)
 and (r.source_result_id is null or exists(select 1 from public.dydd_guest_results src where src.id=r.source_result_id
 and src.session_id=r.session_id and src.product='designid' and public.dydd_guest_order_entitled(src.order_id))))
$$;
revoke all on function dydd_private.guest_bridge_result_allowed(uuid,uuid) from public,anon,authenticated;
grant execute on function dydd_private.guest_bridge_result_allowed(uuid,uuid) to service_role;
create function dydd_private.guest_bridge_snapshot_allowed(p_snapshot uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select not exists(select 1 from public.assessment_snapshots a where a.id=p_snapshot and (
 (a.source='public_guest' and not dydd_private.guest_bridge_result_allowed(a.id,auth.uid())) or
 (a.source='designpd_app' and exists(select 1 from public.assessment_snapshots src
  where src.id::text=a.scores->>'designIdSnapshotId' and src.source='public_guest'
   and not dydd_private.guest_bridge_result_allowed(src.id,auth.uid())))))
$$;
revoke all on function dydd_private.guest_bridge_snapshot_allowed(uuid) from public,anon;
grant execute on function dydd_private.guest_bridge_snapshot_allowed(uuid) to authenticated;
create policy "guest bridge requires current original rights" on public.assessment_snapshots as restrictive for select to authenticated
 using (dydd_private.guest_bridge_snapshot_allowed(id));
-- Shared-service consumers (accepted Circles, Waypoints) bypass RLS by design;
-- filter original guest rights before projecting saved results there too.
create function public.dydd_guest_school_snapshot_ids(p_ids uuid[])
returns table(snapshot_id uuid) language sql stable security invoker set search_path='' as $$
 select a.id from public.assessment_snapshots a where a.id=any(p_ids) and (
 (a.source='public_guest' and dydd_private.guest_bridge_result_allowed(a.id,a.user_id)
  and (a.assessment_type<>'designpd' or exists(select 1 from public.dydd_guest_results r where r.id=a.id
   and r.report_state='ready' and r.pdf->'storage'->>'bucket'='assessment-report-pdfs' and r.pdf->'storage'->>'path'='guest/'||r.id::text||'/report.pdf'))) or
 (a.source is distinct from 'public_guest' and (a.source is distinct from 'designpd_app' or not exists(
   select 1 from public.assessment_snapshots src where src.id::text=a.scores->>'designIdSnapshotId'
   and src.source='public_guest' and not dydd_private.guest_bridge_result_allowed(src.id,a.user_id))))
 )
$$;
revoke all on function public.dydd_guest_school_snapshot_ids(uuid[]) from public,anon,authenticated;
grant execute on function public.dydd_guest_school_snapshot_ids(uuid[]) to service_role;
-- Prevent later administrative/native recovery from changing these original-score projections.
create function public.dydd_guest_projection_immutable() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if old.source='public_guest' then raise exception 'Guest bridge projections are immutable'; end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
revoke all on function public.dydd_guest_projection_immutable() from public,anon,authenticated;
create trigger dydd_guest_projection_immutable before update or delete on public.assessment_snapshots
 for each row execute function public.dydd_guest_projection_immutable();
create or replace function public.dydd_public_assessment_source_owned(p_user_id uuid,p_source_snapshot_id uuid)
returns boolean language plpgsql stable security invoker set search_path='' as $$
declare account_email text; payload jsonb; points numeric[]; v text;
begin
 account_email:=dydd_private.retake_verified_email(p_user_id);
 if account_email is null or p_source_snapshot_id is null then return false; end if;
 select s.scores into payload from public.assessment_snapshots s
 left join public.assessment_participants p on p.id=s.participant_id
 where s.id=p_source_snapshot_id and s.assessment_type='designid'
 and (s.source is distinct from 'public_guest' or dydd_private.guest_bridge_result_allowed(s.id,p_user_id))
 and (s.user_id=p_user_id or (s.user_id is null and (p.user_id=p_user_id or
 (p.user_id is null and lower(btrim(p.normalized_email))=account_email))));
 if not found then return false;end if;
 -- Mirror scoreDesignPd's corrected 100-point source requirement (including nested scores).
 if jsonb_typeof(payload->'scores')='object' then payload:=payload->'scores';end if;
 if jsonb_typeof(payload->'scores')='object' then payload:=payload->'scores';end if;
 points:='{}'::numeric[];
 foreach v in array array['Architect_Pts','Artisan_Pts','Shepherd_Pts','Steward_Pts'] loop
  if coalesce(payload->>v,'') !~ '^[0-9]+([.]0+)?$' then return false;end if;
  points:=array_append(points,(payload->>v)::numeric);
 end loop;
 if coalesce(payload->>'Total_Pts','') !~ '^100([.]0+)?$' then return false;end if;
 return points[1] between 0 and 60 and points[2] between 0 and 60 and points[3] between 0 and 60 and points[4] between 0 and 60
 and points[1]+points[2]+points[3]+points[4]=100;
end $$;


-- Bounded additive carryover for already verified accounts. Import projections do not
-- match the native report-ready trigger, so this sends no historical notifications.
do $backfill$ declare account_id uuid; begin
 for account_id in select id from auth.users where email_confirmed_at is not null and coalesce(is_anonymous,false)=false
 and (banned_until is null or banned_until<=now()) order by id loop
  -- Preserve the service-only API fence even inside an owner-run migration.
  perform set_config('role','service_role',true);
  perform public.dydd_guest_link_matching_verified_account(account_id);
  perform set_config('role','postgres',true);
 end loop;
end $backfill$;
commit;
