begin;
-- Durable tombstones prevent refund-before-completion or disputed-payment replays.
create table public.dydd_public_assessment_payment_reversals(payment_intent_id text primary key, reversed_at timestamptz not null default now());
alter table public.dydd_public_assessment_payment_reversals enable row level security;
revoke all on public.dydd_public_assessment_payment_reversals from public,anon,authenticated;
grant all on public.dydd_public_assessment_payment_reversals to service_role;
create or replace function public.dydd_apply_verified_public_assessment_payment(p_order_id uuid,p_provider_reference text,p_amount bigint,p_currency text,p_price_id text,p_payment_intent text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.dydd_public_assessment_orders%rowtype; e public.dydd_public_assessment_entitlements%rowtype;
begin
 if coalesce(p_payment_intent,'') not like 'pi_%' then raise exception 'Payment intent required';end if;
 perform pg_advisory_xact_lock(hashtextextended('public-payment:'||p_payment_intent,0));
 if exists(select 1 from public.dydd_public_assessment_payment_reversals where payment_intent_id=p_payment_intent) then raise exception 'Payment was refunded or disputed';end if;
 select * into o from public.dydd_public_assessment_orders where id=p_order_id for update;
 if not found or o.payment_provider is distinct from 'stripe_test' or o.payment_reference is distinct from p_provider_reference or o.expected_amount is distinct from p_amount or o.currency is distinct from p_currency or o.expected_price_id is distinct from p_price_id or o.status not in ('pending','paid') then raise exception 'Payment evidence does not match this order';end if;
 if o.payment_intent_id is not null and o.payment_intent_id<>p_payment_intent then raise exception 'Payment intent mismatch';end if;
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
create or replace function public.dydd_revoke_public_assessment_payment(p_payment_intent text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare oid uuid;
begin
 if coalesce(p_payment_intent,'') not like 'pi_%' then raise exception 'Payment intent required';end if;
 perform pg_advisory_xact_lock(hashtextextended('public-payment:'||p_payment_intent,0));
 insert into public.dydd_public_assessment_payment_reversals(payment_intent_id) values(p_payment_intent) on conflict do nothing;
 select id into oid from public.dydd_public_assessment_orders where payment_intent_id=p_payment_intent for update;
 if oid is not null then
  update public.dydd_public_assessment_orders set status='refunded',fulfillment_status='revoked' where id=oid;
  update public.dydd_public_assessment_entitlements set revoked_at=coalesce(revoked_at,now()) where order_id=oid;
 end if;
 return true;
end $$;
commit;
