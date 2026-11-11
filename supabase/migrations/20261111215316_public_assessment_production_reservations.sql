-- Production-only additive reservation ledger; requires production_schema first.
begin;
create table public.designpd_generation_reservations (
 user_id uuid not null references auth.users(id) on delete cascade,
 source_snapshot_id uuid not null references public.assessment_snapshots(id) on delete cascade,
 content_version text not null,
 snapshot_id uuid not null references public.assessment_snapshots(id) on delete cascade,
 state text not null check(state in ('running','ready','failed','uncertain')),
 attempts integer not null default 1 check(attempts between 1 and 3),
 token uuid not null default gen_random_uuid(),
 updated_at timestamptz not null default now(),
 primary key(user_id,source_snapshot_id,content_version)
);
alter table public.designpd_generation_reservations enable row level security;
revoke all on public.designpd_generation_reservations from public,anon,authenticated;
grant all on public.designpd_generation_reservations to service_role;

create function public.reserve_designpd_generation(p_user uuid,p_source uuid,p_version text,p_participant uuid,p_scores jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.designpd_generation_reservations%rowtype; existing uuid; sid uuid; pdf_status text;
begin
 if p_version is null or length(p_version) not between 1 and 200 or p_scores->>'designIdSnapshotId' is distinct from p_source::text or p_scores->>'contentVersion' is distinct from p_version then raise exception 'Invalid DesignPD source contract'; end if;
 -- Service-only caller still has to prove the selected source belongs to this account.
 if not public.dydd_public_assessment_source_owned(p_user,p_source) then raise exception 'DesignID source is unavailable'; end if;
 if not exists(select 1 from public.assessment_participants where id=p_participant and user_id=p_user) then raise exception 'Participant unavailable'; end if;
 -- Serializes the absent-row case, not only updates to existing reservations.
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||':'||p_source::text||':'||p_version,0));
 select s.id into existing from public.assessment_snapshots s
 where s.user_id=p_user and s.assessment_type='designpd' and s.scores->>'designIdSnapshotId'=p_source::text and s.scores->>'contentVersion'=p_version
 and s.scores->'pdfMonkey'->>'status' in ('ready','success') order by s.created_at desc limit 1;
 if existing is not null then return jsonb_build_object('status','ready','snapshotId',existing); end if;
 select * into r from public.designpd_generation_reservations where user_id=p_user and source_snapshot_id=p_source and content_version=p_version for update;
 if found then
  if r.state <> 'failed' then return jsonb_build_object('status',r.state,'snapshotId',r.snapshot_id); end if;
  if r.attempts>=3 then return jsonb_build_object('status','exhausted','snapshotId',r.snapshot_id); end if;
  if r.updated_at > now()-interval '1 minute' then return jsonb_build_object('status','retry_later','snapshotId',r.snapshot_id); end if;
  update public.designpd_generation_reservations set state='running',attempts=attempts+1,token=gen_random_uuid(),updated_at=now() where user_id=p_user and source_snapshot_id=p_source and content_version=p_version returning * into r;
 else
  -- Adopt a pre-migration failed/pending record rather than making another job.
  select s.id,s.scores->'pdfMonkey'->>'status' into sid,pdf_status from public.assessment_snapshots s where s.user_id=p_user and s.assessment_type='designpd' and s.scores->>'designIdSnapshotId'=p_source::text and s.scores->>'contentVersion'=p_version order by s.created_at desc limit 1;
  if sid is null then
   sid:=gen_random_uuid();
   insert into public.assessment_snapshots(id,user_id,participant_id,assessment_type,scores,source,source_response_id,source_submitted_at,sync_batch_id)
   values(sid,p_user,p_participant,'designpd',p_scores,'designpd_app','designpd_app:'||sid,now(),'native-app');
   insert into public.designpd_generation_reservations(user_id,source_snapshot_id,content_version,snapshot_id,state) values(p_user,p_source,p_version,sid,'running') returning * into r;
  else
   -- Old ambiguous failures require artifact recovery, not another paid creation.
   insert into public.designpd_generation_reservations(user_id,source_snapshot_id,content_version,snapshot_id,state) values(p_user,p_source,p_version,sid,'uncertain') returning * into r;
   return jsonb_build_object('status','uncertain','snapshotId',sid);
  end if;
 end if;
 return jsonb_build_object('status','reserved','snapshotId',r.snapshot_id,'token',r.token);
end $$;

create function public.finish_designpd_generation(p_user uuid,p_source uuid,p_version text,p_token uuid,p_pdf jsonb,p_report_url text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare r public.designpd_generation_reservations%rowtype; new_state text;
begin
 select * into r from public.designpd_generation_reservations where user_id=p_user and source_snapshot_id=p_source and content_version=p_version for update;
 if not found or r.token is distinct from p_token or r.state<>'running' then return false; end if;
 new_state:=case when p_pdf->>'status' in ('ready','success') then 'ready' when p_pdf->>'status' in ('failure','failed','error') and p_pdf->>'documentId' is not null then 'failed' else 'uncertain' end;
 update public.assessment_snapshots set scores=scores||jsonb_build_object('pdfMonkey',p_pdf,'reportAccessUrl',p_report_url) where id=r.snapshot_id and user_id=p_user;
 if not found then raise exception 'Saved DesignPD missing'; end if;
 update public.designpd_generation_reservations set state=new_state,updated_at=now() where user_id=p_user and source_snapshot_id=p_source and content_version=p_version;
 return true;
end $$;
revoke all on function public.reserve_designpd_generation(uuid,uuid,text,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.finish_designpd_generation(uuid,uuid,text,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.reserve_designpd_generation(uuid,uuid,text,uuid,jsonb) to service_role;
grant execute on function public.finish_designpd_generation(uuid,uuid,text,uuid,jsonb,text) to service_role;
commit;
