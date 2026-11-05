-- Sandbox integration review: one shared completion contract and replaceable expired requests.
begin;
alter table public.dydd_assessment_retake_requests drop constraint dydd_assessment_retake_requests_status_check;
alter table public.dydd_assessment_retake_requests add constraint dydd_assessment_retake_requests_status_check check(status in ('pending','approved','declined','expired'));
alter table public.dydd_assessment_retake_requests add column expired_at timestamptz;

create or replace function public.dydd_request_assessment_retake(p_id uuid,p_user uuid,p_type text,p_source uuid,p_happened text,p_understood text,p_next text,p_hash text,p_mail jsonb)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare existing uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('retake-request:'||p_user::text,0));
 if dydd_private.retake_verified_email(p_user) is null then raise exception 'Verified account required';end if;
 -- Preserve old request/audit/outbox; never rotate a token under the same mail key.
 update public.dydd_assessment_retake_requests set status='expired',expired_at=now()
 where user_id=p_user and assessment_type=p_type and status='pending' and token_expires_at<=now();
 select id into existing from public.dydd_assessment_retake_requests where user_id=p_user and assessment_type=p_type and status='pending';
 if existing is not null then return existing;end if;
 if exists(select 1 from public.dydd_assessment_retake_requests where user_id=p_user and created_at>now()-interval '24 hours') then raise exception 'Please wait 24 hours before another request';end if;
 insert into public.dydd_assessment_retake_requests(id,user_id,assessment_type,source_snapshot_id,happened,understood,next_eligible_label,token_hash,token_expires_at)
 values(p_id,p_user,p_type,p_source,p_happened,p_understood,p_next,p_hash,now()+interval '7 days');
 insert into public.dydd_assessment_retake_outbox(request_id,kind,payload) values(p_id,'owner',p_mail);
 return p_id;
end $$;

create or replace function public.dydd_fruitlife_guard_response() returns trigger
language plpgsql security definer set search_path='' as $$
declare s public.fruitlife_360_sessions; i public.fruitlife_360_observer_invites; v_owner uuid; v_email text; v_grant uuid; v_policy jsonb; v_exempt boolean;
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
  v_email:=dydd_private.retake_verified_email(v_owner);
  v_exempt:=coalesce((new.metadata->>'timingOwnerExemption')::boolean,false) or public.dydd_fruitlife_canonical_email(v_email) in ('dyddjourney@gmail.com','john@discoverdivine.design','willoughbyhs@gmail.com');
  v_policy:=public.dydd_assert_assessment_completion(v_owner,'fruitful_self',coalesce(v_exempt,false));
  v_grant:=(v_policy->>'grantId')::uuid;
  if v_grant is not null then
   update public.dydd_assessment_retake_grants set used_at=clock_timestamp() where id=v_grant and used_at is null;
  end if;
  new.metadata=coalesce(new.metadata,'{}'::jsonb)||jsonb_build_object('retakeGrantId',v_grant,'retakePolicy','fruitful_self_30_days','assessmentTiming',v_policy||jsonb_build_object('version','guided-intervals-v1','days',30));
 end if;
 new.submitted_at=clock_timestamp();return new;
end $$;
revoke all on function public.dydd_fruitlife_guard_response() from public,anon,authenticated;
commit;
