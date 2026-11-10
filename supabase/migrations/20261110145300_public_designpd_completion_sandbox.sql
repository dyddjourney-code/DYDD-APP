begin;
create function public.finish_public_designpd_generation(p_user uuid,p_source uuid,p_version text,p_token uuid,p_pdf jsonb,p_report_url text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare e public.dydd_public_assessment_entitlements%rowtype; sid uuid; finished boolean;
begin
 select x.* into e from public.dydd_public_assessment_entitlements x join public.dydd_public_assessment_orders o on o.id=x.order_id
 where x.user_id=p_user and x.product='designpd' and x.source_snapshot_id=p_source and x.revoked_at is null and x.consumed_at is null
 and o.user_id=p_user and o.product='designpd' and o.source_snapshot_id=p_source and o.status in ('waived','paid') and o.fulfillment_status='fulfilled'
 order by x.created_at,x.id limit 1 for update of x;
 if not found or not public.dydd_public_assessment_source_owned(p_user,p_source) then raise exception 'A valid DesignPD unlock and source are required';end if;
 finished:=public.finish_designpd_generation(p_user,p_source,p_version,p_token,p_pdf,p_report_url);
 if finished and ((p_pdf->>'status') in ('ready','success') or ((p_pdf->>'status')='failure' and (p_pdf->>'error') like 'Sandbox report preview is available%')) then
  select snapshot_id into sid from public.designpd_generation_reservations where user_id=p_user and source_snapshot_id=p_source and content_version=p_version;
  update public.dydd_public_assessment_entitlements set consumed_at=now(),completion_snapshot_id=sid where id=e.id;
  update public.dydd_public_assessment_orders set report_snapshot_id=sid where id=e.order_id;
 end if;
 return finished;
end $$;
revoke all on function public.finish_public_designpd_generation(uuid,uuid,text,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.finish_public_designpd_generation(uuid,uuid,text,uuid,jsonb,text) to service_role;
commit;
