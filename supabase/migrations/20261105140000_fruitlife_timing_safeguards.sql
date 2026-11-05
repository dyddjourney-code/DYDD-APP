-- SANDBOX ONLY: deployment runner must verify atemrshtshxoqnuevvqu and prj_5EC6sfJe9DpGYW59L94iwppeMYUg.
-- No instrument/scoring changes. Atomic completion, observer-round and report reservations.
alter table public.fruitlife_360_sessions add column if not exists observer_round_started_at timestamptz;
update public.fruitlife_360_sessions s set observer_round_started_at=s.created_at
where observer_round_started_at is null and (observer_goal>0 or exists(select 1 from public.fruitlife_360_observer_invites i where i.session_id=s.id));

create or replace function public.dydd_fruitlife_canonical_email(p_email text) returns text
language sql immutable set search_path=public,pg_temp as $$
 select case when split_part(lower(trim(p_email)),'@',2) in ('gmail.com','googlemail.com')
 then replace(split_part(split_part(lower(trim(p_email)),'@',1),'+',1),'.','')||'@gmail.com'
 else lower(trim(p_email)) end;
$$;

create or replace function public.dydd_fruitlife_last_self_completion(p_user_id uuid,p_email text)
returns table(completed_at timestamptz,source_snapshot_id uuid)
language sql stable security definer set search_path=public,pg_temp as $$
 with participants as (
 select p.id from public.assessment_participants p where p.user_id=p_user_id
 or (p.user_id is null and public.dydd_fruitlife_canonical_email(p.normalized_email)=public.dydd_fruitlife_canonical_email(p_email))
 ), completions as (
 select r.submitted_at as completed_at,s.report_snapshot_id as source_snapshot_id
 from public.fruitlife_360_responses r join public.fruitlife_360_sessions s on s.id=r.session_id
 where r.response_type='self' and s.observer_round_started_at is null and s.observer_goal=0
 and (s.created_by_user_id=p_user_id or s.participant_id in(select id from participants))
 union all
 select coalesce(a.source_submitted_at,a.created_at),a.id from public.assessment_snapshots a
 where a.assessment_type='fruit_360' and upper(coalesce(a.scores#>>'{summary,Report_Mode}',''))='SELF_ONLY'
 and (a.user_id=p_user_id or a.participant_id in(select id from participants))
 ) select * from completions order by completed_at desc limit 1;
$$;
revoke all on function public.dydd_fruitlife_last_self_completion(uuid,text) from public,anon,authenticated;
grant execute on function public.dydd_fruitlife_last_self_completion(uuid,text) to service_role;

create or replace function public.dydd_fruitlife_guard_round() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid; v_email text; v_count integer; v_started timestamptz;
begin
 if tg_op='UPDATE' then
  if new.participant_id is distinct from old.participant_id or new.created_by_user_id is distinct from old.created_by_user_id then
   raise exception 'Fruitful Life round ownership cannot change'; end if;
  new.observer_round_started_at=old.observer_round_started_at;
 end if;
 if new.observer_goal<=0 or new.observer_round_started_at is not null then return new; end if;
 select coalesce(new.created_by_user_id,p.user_id),p.normalized_email into v_owner,v_email from public.assessment_participants p where p.id=new.participant_id;
 if v_owner is null then raise exception 'Observer round requires a linked account'; end if;
 if exists(select 1 from public.assessment_participants p where p.id=new.participant_id and p.user_id is not null and p.user_id<>v_owner) then raise exception 'Fruitful Life participant belongs to another account';end if;
 perform pg_advisory_xact_lock(hashtextextended('dydd-fruitlife-round:'||v_owner::text,0));
 select email into v_email from auth.users where id=v_owner;
 if public.dydd_fruitlife_canonical_email(v_email) not in ('dyddjourney@gmail.com','john@discoverdivine.design','willoughbyhs@gmail.com') then
  select count(*) into v_count from public.fruitlife_360_sessions s where s.observer_round_started_at>clock_timestamp()-interval '90 days'
   and (s.created_by_user_id=v_owner or s.participant_id in(select p.id from public.assessment_participants p where p.user_id=v_owner or (p.user_id is null and public.dydd_fruitlife_canonical_email(p.normalized_email)=public.dydd_fruitlife_canonical_email(v_email))))
   and s.id<>new.id;
  if v_count>=3 then raise exception 'Up to three observer rounds are available in a rolling 90 days.' using errcode='P0001';end if;
 end if;
 new.observer_round_started_at=clock_timestamp();return new;
end;$$;
create trigger dydd_fruitlife_guard_round before insert or update on public.fruitlife_360_sessions for each row execute function public.dydd_fruitlife_guard_round();

create unique index if not exists fruitlife_one_self_per_round on public.fruitlife_360_responses(session_id) where response_type='self';
create unique index if not exists fruitlife_one_response_per_invite on public.fruitlife_360_responses(observer_invite_id) where response_type='observer';
create unique index if not exists fruitlife_one_observer_email_per_round on public.fruitlife_360_observer_invites(session_id,public.dydd_fruitlife_canonical_email(observer_email)) where observer_email is not null;

create or replace function public.dydd_fruitlife_guard_response() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.fruitlife_360_sessions; i public.fruitlife_360_observer_invites; v_owner uuid; v_email text; v_last timestamptz; v_grant uuid;
begin
 if tg_op='UPDATE' then
  if new.session_id<>old.session_id or new.response_type<>old.response_type or new.observer_invite_id is distinct from old.observer_invite_id or new.submitted_at<>old.submitted_at then raise exception 'A correction must retain its original round, respondent and completion time';end if;
  return new;
 end if;
 select * into s from public.fruitlife_360_sessions where id=new.session_id;
 if not found then raise exception 'Fruitful Life session not found';end if;
 select coalesce(s.created_by_user_id,p.user_id) into v_owner from public.assessment_participants p where p.id=s.participant_id;
 if new.response_type='self' and s.observer_round_started_at is null and s.observer_goal=0 and v_owner is not null then
  perform pg_advisory_xact_lock(hashtextextended('assessment-timing:'||v_owner::text||':fruitful_self',0));
 end if;
 perform 1 from public.fruitlife_360_sessions where id=s.id for update;
 if new.response_type='observer' then
  select * into i from public.fruitlife_360_observer_invites where id=new.observer_invite_id and session_id=s.id for update;
  if not found or i.invite_status not in ('invited','draft','opened') then raise exception 'This observer invitation is no longer active';end if;
  if i.observer_email is not null and public.dydd_fruitlife_canonical_email(new.reviewer_email) is distinct from public.dydd_fruitlife_canonical_email(i.observer_email) then raise exception 'Observer response must belong to the invited respondent';end if;
 elsif new.observer_invite_id is not null then raise exception 'Self reflection cannot use an observer invitation';
 elsif s.observer_round_started_at is null and s.observer_goal=0 then
  if v_owner is null then raise exception 'Self reflection requires a linked account';end if;
  select email into v_email from auth.users where id=v_owner;
  if public.dydd_fruitlife_canonical_email(v_email) not in ('dyddjourney@gmail.com','john@discoverdivine.design','willoughbyhs@gmail.com') then
   select completed_at into v_last from public.dydd_fruitlife_last_self_completion(v_owner,v_email);
   if v_last+interval '30 days'>clock_timestamp() then
    if to_regclass('public.dydd_assessment_retake_grants') is not null then
     execute 'select id from public.dydd_assessment_retake_grants where user_id=$1 and assessment_type=''fruitful_self'' and used_at is null and expires_at>clock_timestamp() order by created_at for update skip locked limit 1' into v_grant using v_owner;
    end if;
    if v_grant is null then raise exception 'Your next self reflection is available on %',v_last+interval '30 days';end if;
    execute 'update public.dydd_assessment_retake_grants set used_at=clock_timestamp() where id=$1' using v_grant;
   end if;
  end if;
 end if;
 new.submitted_at=clock_timestamp();return new;
end;$$;
create trigger dydd_fruitlife_guard_response before insert or update on public.fruitlife_360_responses for each row execute function public.dydd_fruitlife_guard_response();

create or replace function public.dydd_fruitlife_record_completion() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.response_type='self' then update public.fruitlife_360_sessions set self_completed_at=new.submitted_at where id=new.session_id;
 else update public.fruitlife_360_observer_invites set invite_status='completed',completed_at=new.submitted_at where id=new.observer_invite_id;end if;
 return new;
end;$$;
create trigger dydd_fruitlife_record_completion after insert on public.fruitlife_360_responses for each row execute function public.dydd_fruitlife_record_completion();

-- The successful INSERT is the reservation. Rollback releases it; retries of the
-- same job use UPDATE and never reserve another generation.
create or replace function public.dydd_fruitlife_guard_report_job() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.fruitlife_360_sessions;
begin
 perform pg_advisory_xact_lock(hashtextextended('dydd-fruitlife-report:'||new.session_id::text,0));
 select * into s from public.fruitlife_360_sessions where id=new.session_id for update;
 if not found then raise exception 'Fruitful Life round not found';end if;
 if not exists(select 1 from public.fruitlife_360_responses where session_id=s.id and response_type='self')
 or exists(select 1 from public.fruitlife_360_observer_invites where session_id=s.id and invite_status in ('invited','draft','opened')) then raise exception 'Report generation waits for the completed round';end if;
 if exists(select 1 from public.fruitlife_360_report_jobs j where j.id=new.id and j.session_id=new.session_id) then return new;end if;
 if exists(select 1 from public.fruitlife_360_report_jobs j where j.session_id=new.session_id and j.created_at>clock_timestamp()-interval '24 hours') then raise exception 'A report generation is already reserved for this round within 24 hours';end if;
 new.created_at=clock_timestamp();new.queued_at=new.created_at;return new;
end;$$;
create trigger dydd_fruitlife_guard_report_job before insert on public.fruitlife_360_report_jobs for each row execute function public.dydd_fruitlife_guard_report_job();

revoke all on function public.dydd_fruitlife_guard_round(),public.dydd_fruitlife_guard_response(),public.dydd_fruitlife_record_completion(),public.dydd_fruitlife_guard_report_job() from public,anon,authenticated;

create or replace function public.dydd_fruitlife_create_round(p_user_id uuid,p_session jsonb,p_invites jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.fruitlife_360_sessions; v_id uuid=(p_session->>'id')::uuid; v_existing public.fruitlife_360_sessions; v_invite jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended('dydd-fruitlife-create:'||v_id::text,0));
 select * into v_existing from public.fruitlife_360_sessions where id=v_id;
 if found then
  if v_existing.created_by_user_id<>p_user_id then raise exception 'Round belongs to another account';end if;
  return v_existing.id;
 end if;
 if not exists(select 1 from public.assessment_participants where id=(p_session->>'participant_id')::uuid and user_id=p_user_id) then raise exception 'Participant must belong to signed-in account';end if;
 select * into s from jsonb_populate_record(null::public.fruitlife_360_sessions,p_session);
 if s.created_by_user_id is distinct from p_user_id or s.observer_goal<>jsonb_array_length(p_invites) then raise exception 'Invalid round ownership or observer goal';end if;
 insert into public.fruitlife_360_sessions(id,participant_id,created_by_user_id,participant_name,participant_email,intake_token_hash,source_participant_id,source_system,signup_source,observer_goal,session_status,report_status,metadata)
 values(v_id,s.participant_id,p_user_id,s.participant_name,s.participant_email,s.intake_token_hash,s.source_participant_id,'vercel_intake',s.signup_source,s.observer_goal,'waiting_for_self','waiting_for_responses',s.metadata);
 for v_invite in select value from jsonb_array_elements(p_invites) loop
  insert into public.fruitlife_360_observer_invites(session_id,observer_name,observer_email,relationship_label,invite_status,invite_token_hash,invited_at,metadata)
  values(v_id,v_invite->>'observer_name',v_invite->>'observer_email',v_invite->>'relationship_label','invited',v_invite->>'invite_token_hash',clock_timestamp(),v_invite->'metadata');
 end loop;
 return v_id;
end;$$;
revoke all on function public.dydd_fruitlife_create_round(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.dydd_fruitlife_create_round(uuid,jsonb,jsonb) to service_role;

create or replace function public.dydd_fruitlife_refresh_completion(p_session_id uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_self timestamptz; v_observers integer; v_goal integer; v_ready boolean;
begin
 perform 1 from public.fruitlife_360_sessions where id=p_session_id for update;
 select max(submitted_at) into v_self from public.fruitlife_360_responses where session_id=p_session_id and response_type='self';
 select count(*) into v_observers from public.fruitlife_360_responses where session_id=p_session_id and response_type='observer';
 select count(*) into v_goal from public.fruitlife_360_observer_invites where session_id=p_session_id and invite_status in ('invited','draft','opened','completed');
 v_ready=v_self is not null and v_observers>=v_goal;
 update public.fruitlife_360_sessions set observer_goal=v_goal,observer_completed_count=v_observers,response_count=(case when v_self is null then 0 else 1 end)+v_observers,self_completed_at=v_self,
 report_status=case when report_status in ('ready','sent') then report_status when v_ready then 'queued' else 'waiting_for_responses' end,
 session_status=case when session_status in ('report_ready','report_sent','archived') then session_status when v_ready then 'ready_for_report' when v_self is not null then 'waiting_for_observers' else 'waiting_for_self' end
 where id=p_session_id;
 return v_ready;
end;$$;
revoke all on function public.dydd_fruitlife_refresh_completion(uuid) from public,anon,authenticated;
grant execute on function public.dydd_fruitlife_refresh_completion(uuid) to service_role;

-- Claim external creation before the network call. Unknown outcomes never cause
-- another paid creation on retry; reconcile the provider document into artifacts.
create or replace function public.dydd_fruitlife_claim_provider_creation(p_job_id uuid,p_worker_id text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.fruitlife_360_report_jobs set metadata=metadata||jsonb_build_object('providerCreationReservedAt',clock_timestamp())
 where id=p_job_id and job_status='processing' and locked_by=p_worker_id and not(metadata ? 'providerCreationReservedAt');
 return found;
end;$$;
revoke all on function public.dydd_fruitlife_claim_provider_creation(uuid,text) from public,anon,authenticated;
grant execute on function public.dydd_fruitlife_claim_provider_creation(uuid,text) to service_role;
