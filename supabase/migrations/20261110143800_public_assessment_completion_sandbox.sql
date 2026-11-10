begin;
-- Preserve the established instrument/timing transaction, add the one-off entitlement fence.
create function public.save_public_designid_attempt(p_user_id uuid,p_participant_id uuid,p_source_response_id text,p_owner_exemption boolean,p_scores jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare entitlement public.dydd_public_assessment_entitlements%rowtype; result_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('public-designid:'||p_user_id::text,0));
 select e.* into entitlement from public.dydd_public_assessment_entitlements e
 join public.dydd_public_assessment_orders o on o.id=e.order_id
 where e.user_id=p_user_id and e.product='designid' and e.revoked_at is null and e.consumed_at is null
 and o.status='waived' and o.fulfillment_status='fulfilled' and o.user_id=p_user_id and o.product='designid'
 order by e.created_at,e.id limit 1 for update of e;
 if not found then raise exception 'An unused DesignID purchase or waiver is required';end if;
 result_id:=public.save_designid_attempt(p_user_id,p_participant_id,p_source_response_id,false,p_scores);
 update public.dydd_public_assessment_entitlements set consumed_at=now(),completion_snapshot_id=result_id where id=entitlement.id;
 return result_id;
end $$;
revoke all on function public.save_public_designid_attempt(uuid,uuid,text,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.save_public_designid_attempt(uuid,uuid,text,boolean,jsonb) to service_role;
commit;
