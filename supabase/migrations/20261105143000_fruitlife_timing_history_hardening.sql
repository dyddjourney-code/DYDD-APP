-- Sandbox-only Fruitful history provenance and ownership hardening.
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
 and (s.created_by_user_id=p_user_id or (s.created_by_user_id is null and s.participant_id in(select id from participants)))
 union all
 select coalesce(a.source_submitted_at,a.created_at),a.id from public.assessment_snapshots a
 where a.assessment_type='fruit_360' and a.source is distinct from 'fruitlife_360_native_app' and upper(coalesce(a.scores#>>'{summary,Report_Mode}',''))='SELF_ONLY'
 and (a.user_id=p_user_id or (a.user_id is null and a.participant_id in(select id from participants)))
 ) select * from completions order by completed_at desc limit 1;
$$;

create or replace function public.dydd_fruitlife_guard_round() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_owner uuid; v_email text; v_count integer; v_started timestamptz;
begin
 if tg_op='INSERT' then new.observer_round_started_at=null;end if;
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

create or replace function public.dydd_fruitlife_create_round(p_user_id uuid,p_session jsonb,p_invites jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.fruitlife_360_sessions; v_id uuid=(p_session->>'id')::uuid; v_existing public.fruitlife_360_sessions; v_invite jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended('dydd-fruitlife-create:'||v_id::text,0));
 select * into v_existing from public.fruitlife_360_sessions where id=v_id;
 if found then
  if v_existing.created_by_user_id is distinct from p_user_id then raise exception 'Round belongs to another account';end if;
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
