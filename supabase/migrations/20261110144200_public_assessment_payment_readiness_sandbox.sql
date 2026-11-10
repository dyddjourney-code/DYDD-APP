begin;
alter table public.dydd_public_assessment_orders add column expected_price_id text, add column expected_amount bigint check(expected_amount>0), add column currency text check(currency='usd'), add column payment_intent_id text unique, add column report_snapshot_id uuid references public.assessment_snapshots(id) on delete set null;
alter table public.dydd_public_assessment_orders drop constraint dydd_public_assessment_orders_check1;
alter table public.dydd_public_assessment_orders add constraint public_assessment_fulfillment_evidence check(fulfillment_status<>'fulfilled' or (fulfilled_at is not null and ((status='waived' and payment_provider is null and payment_reference is null) or (status='paid' and payment_provider='stripe_test' and payment_reference is not null and expected_price_id is not null and expected_amount>0 and currency='usd'))));
alter table public.dydd_public_assessment_entitlements drop constraint dydd_public_assessment_entitlements_grant_kind_check;
alter table public.dydd_public_assessment_entitlements add constraint public_assessment_grant_kind check(grant_kind in ('waiver','stripe_test'));
create function public.dydd_apply_verified_public_assessment_payment(p_order_id uuid,p_provider_reference text,p_amount bigint,p_currency text,p_price_id text,p_payment_intent text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.dydd_public_assessment_orders%rowtype; e public.dydd_public_assessment_entitlements%rowtype;
begin
 select * into o from public.dydd_public_assessment_orders where id=p_order_id for update;
 if not found or o.payment_provider is distinct from 'stripe_test' or o.payment_reference is distinct from p_provider_reference or o.expected_amount is distinct from p_amount or o.currency is distinct from p_currency or o.expected_price_id is distinct from p_price_id or o.status not in ('pending','paid') then raise exception 'Payment evidence does not match this order';end if;
 if dydd_private.retake_verified_email(o.user_id) is null then raise exception 'Verified identity required';end if;
 if o.product='designpd' and not public.dydd_public_assessment_source_owned(o.user_id,o.source_snapshot_id) then raise exception 'DesignPD requires a valid completed owned DesignID';end if;
 select * into e from public.dydd_public_assessment_entitlements where order_id=o.id;
 if found then
  if e.revoked_at is not null then raise exception 'Order access was revoked';end if;
  return to_jsonb(e);
 end if;
 update public.dydd_public_assessment_orders set status='paid',fulfillment_status='fulfilled',fulfilled_at=now(),payment_intent_id=p_payment_intent where id=o.id;
 insert into public.dydd_public_assessment_entitlements(order_id,user_id,product,source_snapshot_id,grant_kind) values(o.id,o.user_id,o.product,o.source_snapshot_id,'stripe_test') returning * into e;
 return to_jsonb(e);
end $$;
create function public.dydd_revoke_public_assessment_payment(p_payment_intent text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare oid uuid;
begin
 select id into oid from public.dydd_public_assessment_orders where payment_intent_id=p_payment_intent for update;
 if oid is null then return false;end if;
 update public.dydd_public_assessment_orders set status='refunded',fulfillment_status='revoked' where id=oid;
 update public.dydd_public_assessment_entitlements set revoked_at=coalesce(revoked_at,now()) where order_id=oid;
 return true;
end $$;
create or replace function public.dydd_has_public_assessment_entitlement(p_user_id uuid,p_product text,p_source_snapshot_id uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_product is null or p_product not in ('designid','designpd') or dydd_private.retake_verified_email(p_user_id) is null then return null;end if;
 if (p_product='designid' and p_source_snapshot_id is not null) or (p_product='designpd' and not public.dydd_public_assessment_source_owned(p_user_id,p_source_snapshot_id)) then return null;end if;
 select to_jsonb(e) into result from public.dydd_public_assessment_entitlements e join public.dydd_public_assessment_orders o on o.id=e.order_id
 where e.user_id=p_user_id and e.product=p_product and e.source_snapshot_id is not distinct from p_source_snapshot_id
 and e.revoked_at is null and e.consumed_at is null and o.user_id=e.user_id and o.product=e.product
 and o.source_snapshot_id is not distinct from e.source_snapshot_id and o.status in ('waived','paid') and o.fulfillment_status='fulfilled'
 order by e.created_at,e.id limit 1;
 return result;
end $$;
-- Same atomic completion boundary for either verified payment or waiver.
create or replace function public.save_public_designid_attempt(p_user_id uuid,p_participant_id uuid,p_source_response_id text,p_owner_exemption boolean,p_scores jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare entitlement public.dydd_public_assessment_entitlements%rowtype; result_id uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('public-designid:'||p_user_id::text,0));
 select e.* into entitlement from public.dydd_public_assessment_entitlements e join public.dydd_public_assessment_orders o on o.id=e.order_id
 where e.user_id=p_user_id and e.product='designid' and e.revoked_at is null and e.consumed_at is null
 and o.status in ('waived','paid') and o.fulfillment_status='fulfilled' and o.user_id=p_user_id and o.product='designid'
 order by e.created_at,e.id limit 1 for update of e;
 if not found then raise exception 'An unused DesignID purchase or waiver is required';end if;
 result_id:=public.save_designid_attempt(p_user_id,p_participant_id,p_source_response_id,false,p_scores);
 update public.dydd_public_assessment_entitlements set consumed_at=now(),completion_snapshot_id=result_id where id=entitlement.id;
 update public.dydd_public_assessment_orders set report_snapshot_id=result_id where id=entitlement.order_id;
 return result_id;
end $$;
revoke all on function public.dydd_apply_verified_public_assessment_payment(uuid,text,bigint,text,text,text),public.dydd_revoke_public_assessment_payment(text) from public,anon,authenticated;
grant execute on function public.dydd_apply_verified_public_assessment_payment(uuid,text,bigint,text,text,text),public.dydd_revoke_public_assessment_payment(text) to service_role;
commit;
