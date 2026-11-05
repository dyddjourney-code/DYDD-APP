-- Preserve native pre-PDF completion identity in exception audit; no invented snapshot IDs.
begin;
alter table public.dydd_assessment_retake_requests add column source_completion_id uuid;
alter table public.dydd_assessment_retake_requests add column source_completed_at timestamptz;
CREATE OR REPLACE FUNCTION public.dydd_assessment_eligibility(p_user_id uuid, p_assessment_type text, p_owner_exemption boolean DEFAULT false, p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
 account_email text; participant_ids uuid[]; previous_id uuid; completion_id uuid; completed timestamptz;
 next_date timestamptz; grant_id uuid; override_id uuid; allowed boolean; days integer;
begin
 if p_assessment_type not in ('designid','spiritual_gifts','fruitful_self') then raise exception 'Unknown timed assessment.';end if;
 account_email:=dydd_private.retake_verified_email(p_user_id);
 if account_email is null then raise exception 'Assessment account could not be verified.';end if;
 select coalesce(array_agg(p.id),'{}'::uuid[]) into participant_ids from public.assessment_participants p
 where p.user_id=p_user_id or (p.user_id is null and dydd_private.timing_email_key(p.normalized_email)=dydd_private.timing_email_key(account_email));
 if p_assessment_type='fruitful_self' then
   select h.source_snapshot_id,h.completed_at into previous_id,completed
     from public.dydd_fruitlife_last_self_completion(p_user_id,account_email) h;
   if previous_id is null and completed is not null then
    select r.id into completion_id from public.fruitlife_360_responses r join public.fruitlife_360_sessions s on s.id=r.session_id
    where r.response_type='self' and r.submitted_at=completed and s.observer_round_started_at is null and s.observer_goal=0
      and (s.created_by_user_id=p_user_id or (s.created_by_user_id is null and s.participant_id=any(participant_ids))) limit 1;
   end if;

 else
   select a.id,coalesce(a.source_submitted_at,a.created_at) into previous_id,completed from public.assessment_snapshots a
    where a.assessment_type=p_assessment_type and (a.user_id=p_user_id or (a.user_id is null and a.participant_id=any(participant_ids)))
    order by coalesce(a.source_submitted_at,a.created_at) desc,a.id desc limit 1;
 end if;
 days:=case when p_assessment_type='designid' then 90 else 30 end;
 next_date:=completed+(days * interval '24 hours');
 select g.id into grant_id from public.dydd_assessment_retake_grants g
   where g.user_id=p_user_id and g.assessment_type=p_assessment_type and g.used_at is null and g.expires_at>p_now
   order by g.created_at,g.id limit 1;
 if p_assessment_type='designid' then
  select o.id into override_id from public.designid_retake_overrides o
   where o.participant_id=any(participant_ids) and o.used_at is null and o.expires_at>p_now
   order by o.created_at,o.id limit 1;
 end if;
 allowed:=p_owner_exemption or grant_id is not null or override_id is not null or next_date is null or next_date<=p_now;
 return jsonb_build_object('allowed',allowed,'owner',p_owner_exemption,'nextEligible',next_date,'previousAttemptId',previous_id,'previousCompletedAt',completed,'previousCompletionId',coalesce(previous_id,completion_id),
  'grantId',case when not p_owner_exemption then grant_id end,'legacyOverrideId',case when not p_owner_exemption and grant_id is null then override_id end,
  'reason',case when p_owner_exemption then 'owner' when grant_id is not null then 'one_use_grant' when override_id is not null then 'legacy_override' when completed is null then 'first_attempt' when allowed then 'interval_elapsed' else 'reflection_interval' end);
end $function$
;
CREATE OR REPLACE FUNCTION public.dydd_request_assessment_retake(p_id uuid, p_user uuid, p_type text, p_source uuid, p_happened text, p_understood text, p_next text, p_hash text, p_mail jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
 insert into public.dydd_assessment_retake_requests(id,user_id,assessment_type,source_snapshot_id,source_completion_id,source_completed_at,happened,understood,next_eligible_label,token_hash,token_expires_at)
 values(p_id,p_user,p_type,p_source,nullif(p_mail->>'sourceCompletionId','')::uuid,nullif(p_mail->>'sourceCompletedAt','')::timestamptz,p_happened,p_understood,p_next,p_hash,now()+interval '7 days');
 insert into public.dydd_assessment_retake_outbox(request_id,kind,payload) values(p_id,'owner',p_mail);
 return p_id;
end $function$
;
commit;
