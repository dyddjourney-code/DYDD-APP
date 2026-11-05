-- Sandbox-only immutable respondent/completion provenance; grant audit.
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
 if tg_op='UPDATE' and old.self_completed_at is not null then raise exception 'A completed self-only reflection cannot become a new observer round';end if;
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

create or replace function public.dydd_fruitlife_guard_response() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.fruitlife_360_sessions; i public.fruitlife_360_observer_invites; v_owner uuid; v_email text; v_last timestamptz; v_grant uuid;
begin
 if tg_op='UPDATE' then
  if new.session_id<>old.session_id or new.response_type<>old.response_type or new.observer_invite_id is distinct from old.observer_invite_id or new.submitted_at<>old.submitted_at or public.dydd_fruitlife_canonical_email(new.reviewer_email) is distinct from public.dydd_fruitlife_canonical_email(old.reviewer_email) then raise exception 'A correction must retain its original round, respondent and completion time';end if;
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
    new.metadata=coalesce(new.metadata,'{}'::jsonb)||jsonb_build_object('retakeGrantId',v_grant,'retakePolicy','fruitful_self_30_days');
   end if;
  end if;
 end if;
 new.submitted_at=clock_timestamp();return new;
end;$$;
