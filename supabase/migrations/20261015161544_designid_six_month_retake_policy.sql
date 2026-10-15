-- No historical assessment rows are changed. Retakes remain separate attempts.
create table public.designid_retake_overrides (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.assessment_participants(id),
  granted_by uuid not null references auth.users(id),
  reason text not null check (length(trim(reason)) >= 5),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  used_at timestamptz,
  used_snapshot_id uuid references public.assessment_snapshots(id)
);
alter table public.designid_retake_overrides enable row level security;
revoke all on public.designid_retake_overrides from anon, authenticated;
grant select, insert, update on public.designid_retake_overrides to service_role;

-- Invoker security: only the trusted server/service role can execute this operation.
-- Locking serializes simultaneous submissions before checking history/consuming a permit.
create function public.save_designid_attempt(p_user_id uuid, p_participant_id uuid, p_source_response_id text, p_owner_exemption boolean, p_scores jsonb)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  latest_attempt public.assessment_snapshots%rowtype;
  permit_id uuid;
  snapshot_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('designid:' || p_user_id::text, 0));
  perform id from public.assessment_participants where id = p_participant_id and user_id = p_user_id for update;
  if not found then raise exception 'DesignID participant does not match your account.'; end if;
  select * into latest_attempt from public.assessment_snapshots
    where assessment_type = 'designid' and (user_id = p_user_id or participant_id = p_participant_id)
    order by coalesce(source_submitted_at, created_at) desc limit 1;
  select id into permit_id from public.designid_retake_overrides
    where participant_id = p_participant_id and used_at is null and expires_at > now()
    order by created_at limit 1 for update;
  if not p_owner_exemption and permit_id is null and latest_attempt.id is not null
    and ((coalesce(latest_attempt.source_submitted_at, latest_attempt.created_at) at time zone 'UTC') + interval '6 months') at time zone 'UTC' > now()
    then raise exception 'Your next DesignID assessment is not available yet. Open Field Kit to see the eligible date.'; end if;
  snapshot_id := gen_random_uuid();
  insert into public.assessment_snapshots(id,user_id,participant_id,assessment_type,source,source_response_id,source_submitted_at,sync_batch_id,scores)
    values(snapshot_id,p_user_id,p_participant_id,'designid','designid_app',p_source_response_id,now(),'native-app',p_scores || jsonb_build_object('retakePolicy',jsonb_build_object('version','six-calendar-months-v1','ownerExemption',p_owner_exemption,'previousAttemptId',latest_attempt.id,'overrideId',case when not p_owner_exemption then permit_id end)));
  if not p_owner_exemption and permit_id is not null then
    update public.designid_retake_overrides set used_at=now(),used_snapshot_id=snapshot_id where id=permit_id;
  end if;
  return snapshot_id;
end;
$$;
revoke all on function public.save_designid_attempt(uuid,uuid,text,boolean,jsonb) from public, anon, authenticated;
grant execute on function public.save_designid_attempt(uuid,uuid,text,boolean,jsonb) to service_role;
