-- ISOLATED SANDBOX ONLY: developmental product policy, not validity research.
-- Apply through scripts/assessment-timing-sandbox-db.mjs after exact project/ref validation.
-- No historical rows, instruments, scores, paid entitlements or report locators are rewritten.
begin;
create schema if not exists dydd_private;

create or replace function dydd_private.timing_email_key(p_email text) returns text
language sql immutable strict set search_path='' as $$
 select case when split_part(lower(trim(p_email)),'@',2) in ('gmail.com','googlemail.com')
 then replace(split_part(split_part(lower(trim(p_email)),'@',1),'+',1),'.','')||'@gmail.com'
 else lower(trim(p_email)) end
$$;
revoke all on function dydd_private.timing_email_key(text) from public,anon,authenticated;
grant execute on function dydd_private.timing_email_key(text) to service_role;
grant usage on schema dydd_private to service_role;

create or replace function public.dydd_assessment_eligibility(p_user_id uuid,p_assessment_type text,p_owner_exemption boolean default false,p_now timestamptz default now())
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 account_email text; participant_ids uuid[]; previous_id uuid; completed timestamptz;
 next_date timestamptz; grant_id uuid; override_id uuid; allowed boolean; days integer;
begin
 if p_assessment_type not in ('designid','spiritual_gifts','fruitful_self') then raise exception 'Unknown timed assessment.';end if;
 select email into account_email from auth.users where id=p_user_id;
 if account_email is null then raise exception 'Assessment account could not be verified.';end if;
 select coalesce(array_agg(p.id),'{}'::uuid[]) into participant_ids from public.assessment_participants p
 where p.user_id=p_user_id or (p.user_id is null and dydd_private.timing_email_key(p.normalized_email)=dydd_private.timing_email_key(account_email));
 if p_assessment_type='fruitful_self' then
   select h.source_snapshot_id,h.completed_at into previous_id,completed
     from public.dydd_fruitlife_last_self_completion(p_user_id,account_email) h;

 else
   select a.id,coalesce(a.source_submitted_at,a.created_at) into previous_id,completed from public.assessment_snapshots a
    where a.assessment_type=p_assessment_type and (a.user_id=p_user_id or (a.user_id is null and a.participant_id=any(participant_ids)))
    order by coalesce(a.source_submitted_at,a.created_at) desc,a.id desc limit 1;
 end if;
 days:=case when p_assessment_type='designid' then 90 else 30 end;
 next_date:=completed+make_interval(days=>days);
 select g.id into grant_id from public.dydd_assessment_retake_grants g
   where g.user_id=p_user_id and g.assessment_type=p_assessment_type and g.used_at is null and g.expires_at>p_now
   order by g.created_at,g.id limit 1;
 if p_assessment_type='designid' then
  select o.id into override_id from public.designid_retake_overrides o
   where o.participant_id=any(participant_ids) and o.used_at is null and o.expires_at>p_now
   order by o.created_at,o.id limit 1;
 end if;
 allowed:=p_owner_exemption or grant_id is not null or override_id is not null or next_date is null or next_date<=p_now;
 return jsonb_build_object('allowed',allowed,'owner',p_owner_exemption,'nextEligible',next_date,'previousAttemptId',previous_id,'previousCompletedAt',completed,
  'grantId',case when not p_owner_exemption then grant_id end,'legacyOverrideId',case when not p_owner_exemption and grant_id is null then override_id end,
  'reason',case when p_owner_exemption then 'owner' when grant_id is not null then 'one_use_grant' when override_id is not null then 'legacy_override' when completed is null then 'first_attempt' when allowed then 'interval_elapsed' else 'reflection_interval' end);
end $$;
revoke all on function public.dydd_assessment_eligibility(uuid,text,boolean,timestamptz) from public,anon,authenticated;
grant execute on function public.dydd_assessment_eligibility(uuid,text,boolean,timestamptz) to service_role;

create or replace function public.dydd_assert_assessment_completion(p_user_id uuid,p_assessment_type text,p_owner_exemption boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare eligibility jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended('assessment-timing:'||p_user_id::text||':'||p_assessment_type,0));
 eligibility:=public.dydd_assessment_eligibility(p_user_id,p_assessment_type,p_owner_exemption);
 if not (eligibility->>'allowed')::boolean then
  raise exception 'Available again on %. Your saved results remain in Field Kit.',to_char((eligibility->>'nextEligible')::timestamptz at time zone 'America/New_York','FMMonth DD, YYYY') using errcode='P0001';
 end if;
 return eligibility;
end $$;
revoke all on function public.dydd_assert_assessment_completion(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.dydd_assert_assessment_completion(uuid,text,boolean) to service_role;

create or replace function public.save_designid_attempt(p_user_id uuid,p_participant_id uuid,p_source_response_id text,p_owner_exemption boolean,p_scores jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare policy jsonb; snapshot_id uuid; grant_id uuid; override_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('assessment-timing:'||p_user_id::text||':designid',0));
 perform id from public.assessment_participants where id=p_participant_id and user_id=p_user_id for update;
 if not found then raise exception 'DesignID participant does not match your account.';end if;
 select id into snapshot_id from public.assessment_snapshots where user_id=p_user_id and assessment_type='designid' and source='designid_app' and source_response_id=p_source_response_id;
 if snapshot_id is not null then return snapshot_id;end if;
 policy:=public.dydd_assert_assessment_completion(p_user_id,'designid',p_owner_exemption);
 grant_id:=(policy->>'grantId')::uuid;override_id:=(policy->>'legacyOverrideId')::uuid;
 snapshot_id:=gen_random_uuid();
 insert into public.assessment_snapshots(id,user_id,participant_id,assessment_type,source,source_response_id,source_submitted_at,sync_batch_id,scores)
 values(snapshot_id,p_user_id,p_participant_id,'designid','designid_app',p_source_response_id,now(),'native-app',p_scores||jsonb_build_object('retakePolicy',policy||jsonb_build_object('version','guided-intervals-v1','days',90,'ownerExemption',p_owner_exemption)));
 if grant_id is not null then update public.dydd_assessment_retake_grants set used_at=now() where id=grant_id and used_at is null;end if;
 if override_id is not null then update public.designid_retake_overrides set used_at=now(),used_snapshot_id=snapshot_id where id=override_id and used_at is null;end if;
 return snapshot_id;
end $$;
revoke all on function public.save_designid_attempt(uuid,uuid,text,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.save_designid_attempt(uuid,uuid,text,boolean,jsonb) to service_role;

-- Response, scored snapshot and completion marker commit or roll back together.
-- Stable session key makes successful technical retries return the saved result.
create or replace function public.save_spiritual_gifts_attempt(p_user_id uuid,p_participant_id uuid,p_session_id uuid,p_owner_exemption boolean,p_response jsonb,p_scores jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare policy jsonb; saved_id uuid; grant_id uuid; source_id text; session_row public.spiritual_gifts_sessions%rowtype;
begin
 if p_user_id is null then raise exception 'Sign in before completing this assessment.';end if;
 perform pg_advisory_xact_lock(hashtextextended('assessment-timing:'||p_user_id::text||':spiritual_gifts',0));
 select * into session_row from public.spiritual_gifts_sessions where id=p_session_id for update;
 if not found or session_row.created_by_user_id is distinct from p_user_id or session_row.participant_id is distinct from p_participant_id then raise exception 'Assessment session does not belong to your account.';end if;
 perform id from public.assessment_participants where id=p_participant_id and user_id=p_user_id;
 if not found then raise exception 'Assessment participant does not belong to your account.';end if;
 if session_row.result_snapshot_id is not null then
  return jsonb_build_object('id',session_row.result_snapshot_id,'replayed',true);
 end if;
 policy:=public.dydd_assert_assessment_completion(p_user_id,'spiritual_gifts',p_owner_exemption);
 grant_id:=(policy->>'grantId')::uuid;
 source_id:='vercel:spiritual_gifts:self:'||p_session_id::text;
 insert into public.spiritual_gifts_responses(session_id,response_type,participant_email,participant_name,source_response_id,submitted_at,answers,derived_scores,gift_rank)
 values(p_session_id,'self',session_row.participant_email,session_row.participant_name,source_id,now(),p_response->'answers',p_response->'derived_scores',array(select jsonb_array_elements_text(p_response->'gift_rank')));
 insert into public.assessment_snapshots(user_id,participant_id,assessment_type,source,source_response_id,source_submitted_at,scores)
 values(p_user_id,p_participant_id,'spiritual_gifts','spiritual_gifts_app',source_id,now(),p_scores||jsonb_build_object('retakePolicy',policy||jsonb_build_object('version','guided-intervals-v1','days',30))) returning id into saved_id;
 update public.spiritual_gifts_sessions set result_snapshot_id=saved_id,session_status='completed',submitted_at=now() where id=p_session_id;
 if grant_id is not null then update public.dydd_assessment_retake_grants set used_at=now() where id=grant_id and used_at is null;end if;
 return jsonb_build_object('id',saved_id,'replayed',false);
end $$;
revoke all on function public.save_spiritual_gifts_attempt(uuid,uuid,uuid,boolean,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_spiritual_gifts_attempt(uuid,uuid,uuid,boolean,jsonb,jsonb) to service_role;
commit;
