-- Reconcile an already-created, owned and durably archived DesignPD PDF.
-- No provider calls, scoring, job creation, rights grants or historical data backfill.
begin;
create function public.reconcile_designpd_generation_artifact(p_user uuid,p_snapshot uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare s public.assessment_snapshots%rowtype; e public.dydd_public_assessment_entitlements%rowtype; source_id uuid; version text;
begin
 if dydd_private.retake_verified_email(p_user) is null then raise exception 'Verified account required';end if;
 select * into s from public.assessment_snapshots where id=p_snapshot and user_id=p_user and assessment_type='designpd' and source='designpd_app';
 if not found then return false;end if;
 source_id:=(s.scores->>'designIdSnapshotId')::uuid; version:=s.scores->>'contentVersion';
 -- Match reversal/completion lock ordering: order, entitlement, reservation, snapshot.
 select * into e from dydd_private.lock_public_assessment_entitlement(p_user,'designpd',source_id);
 perform 1 from public.designpd_generation_reservations where user_id=p_user and source_snapshot_id=source_id and content_version=version and snapshot_id=p_snapshot for update;
 if not found then return false;end if;
 select * into s from public.assessment_snapshots where id=p_snapshot and user_id=p_user for update;
 if coalesce(s.scores->'pdfMonkey'->>'status','') not in ('ready','success')
 or coalesce(s.scores->'reportArtifact'->>'path',s.scores->'pdfMonkey'->'storage'->>'path','')<>'designpd/'||p_snapshot::text||'/report.pdf'
 or nullif(s.scores->'pdfMonkey'->>'documentId','') is null then return false;end if;
 update public.designpd_generation_reservations set state='ready',updated_at=now() where user_id=p_user and source_snapshot_id=source_id and content_version=version and snapshot_id=p_snapshot;
 if e.id is not null then
  update public.dydd_public_assessment_entitlements set consumed_at=now(),completion_snapshot_id=p_snapshot where id=e.id;
  update public.dydd_public_assessment_orders set report_snapshot_id=p_snapshot where id=e.order_id;
 end if;
 return true;
end $$;
revoke all on function public.reconcile_designpd_generation_artifact(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reconcile_designpd_generation_artifact(uuid,uuid) to service_role;
commit;
