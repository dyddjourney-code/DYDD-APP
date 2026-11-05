-- Sandbox-only exclude explicit unfinished/failed imported snapshots from self completion history.
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
 and lower(coalesce(a.scores->>'status','')) not in ('draft','pending','queued','processing','error','failed')
 and coalesce(a.scores#>>'{scores,Response_Count}','1')<>'0'
 and (a.user_id=p_user_id or (a.user_id is null and a.participant_id in(select id from participants)))
 ) select * from completions order by completed_at desc limit 1;
$$;
