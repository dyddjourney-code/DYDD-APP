-- Requires production_schema and production_reservations; no sandbox migration dependencies.
begin;
create function public.dydd_apply_verified_public_assessment_payment(p_order_id uuid,p_provider_reference text,p_amount bigint,p_currency text,p_price_id text,p_payment_intent text,p_provider text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.dydd_public_assessment_orders%rowtype; e public.dydd_public_assessment_entitlements%rowtype;
begin
 if p_provider is null or p_provider not in ('stripe_test','stripe_live') or not public.dydd_public_assessment_provider_allowed(p_provider) then raise exception 'Payment provider disabled';end if;
 if coalesce(p_payment_intent,'') !~ '^pi_.+' then raise exception 'Payment intent required';end if;
 perform pg_advisory_xact_lock(hashtextextended('public-payment:'||p_provider||':'||p_payment_intent,0));
 if exists(select 1 from public.dydd_public_assessment_payment_reversals where payment_provider=p_provider and payment_intent_id=p_payment_intent) then raise exception 'Payment was refunded or disputed';end if;
 select * into o from public.dydd_public_assessment_orders where id=p_order_id for update;
 if not found or o.payment_provider is distinct from p_provider or o.payment_reference is distinct from p_provider_reference or o.expected_amount is distinct from p_amount or o.currency is distinct from p_currency or o.expected_price_id is distinct from p_price_id or o.status not in ('pending','paid') then raise exception 'Payment evidence does not match this order';end if;
 if coalesce(p_provider_reference,'') !~ '^cs_.+' or o.expected_product_id is null or o.expected_price_id is null or o.expected_amount is null or o.currency is null then raise exception 'Complete payment evidence required';end if;
 if o.payment_intent_id is not null and o.payment_intent_id<>p_payment_intent then raise exception 'Payment intent mismatch';end if;
 if dydd_private.retake_verified_email(o.user_id) is null then raise exception 'Verified identity required';end if;
 if o.product='designpd' and not public.dydd_public_assessment_source_owned(o.user_id,o.source_snapshot_id) then raise exception 'DesignPD requires a valid completed owned DesignID';end if;
 select * into e from public.dydd_public_assessment_entitlements where order_id=o.id;
 if found then
  if e.revoked_at is not null or e.user_id<>o.user_id or e.product<>o.product or e.source_snapshot_id is distinct from o.source_snapshot_id or e.grant_kind<>p_provider then raise exception 'Order access was revoked';end if;
  return to_jsonb(e);
 end if;
 update public.dydd_public_assessment_orders set status='paid',fulfillment_status='fulfilled',fulfilled_at=now(),payment_intent_id=p_payment_intent where id=o.id;
 insert into public.dydd_public_assessment_entitlements(order_id,user_id,product,source_snapshot_id,grant_kind) values(o.id,o.user_id,o.product,o.source_snapshot_id,p_provider) returning * into e;
 return to_jsonb(e);
end $$;
create function public.dydd_revoke_public_assessment_payment(p_payment_intent text,p_provider text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare oid uuid;
begin
 if p_provider is null or p_provider not in ('stripe_test','stripe_live') then raise exception 'Payment provider disabled';end if;
 if coalesce(p_payment_intent,'') !~ '^pi_.+' then raise exception 'Payment intent required';end if;
 perform pg_advisory_xact_lock(hashtextextended('public-payment:'||p_provider||':'||p_payment_intent,0));
 insert into public.dydd_public_assessment_payment_reversals(payment_intent_id,payment_provider) values(p_payment_intent,p_provider) on conflict do nothing;
 select id into oid from public.dydd_public_assessment_orders where payment_provider=p_provider and payment_intent_id=p_payment_intent for update;
 if oid is not null then
  update public.dydd_public_assessment_orders set status='refunded',fulfillment_status='revoked' where id=oid;
  update public.dydd_public_assessment_entitlements set revoked_at=coalesce(revoked_at,now()) where order_id=oid;
 end if;
 return true;
end $$;

create function public.dydd_has_public_assessment_entitlement(p_user_id uuid,p_product text,p_source_snapshot_id uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_product is null or p_product not in ('designid','designpd') or dydd_private.retake_verified_email(p_user_id) is null then return null;end if;
 if (p_product='designid' and p_source_snapshot_id is not null) or (p_product='designpd' and not public.dydd_public_assessment_source_owned(p_user_id,p_source_snapshot_id)) then return null;end if;
 select to_jsonb(e) into result from public.dydd_public_assessment_entitlements e join public.dydd_public_assessment_orders o on o.id=e.order_id
 where e.user_id=p_user_id and e.product=p_product and e.source_snapshot_id is not distinct from p_source_snapshot_id
 and e.revoked_at is null and e.consumed_at is null and o.user_id=e.user_id and o.product=e.product
 and o.source_snapshot_id is not distinct from e.source_snapshot_id and public.dydd_public_assessment_provider_allowed(o.payment_provider) and e.grant_kind=coalesce(o.payment_provider,'waiver') and o.status in ('waived','paid') and o.fulfillment_status='fulfilled'
 order by e.created_at,e.id limit 1;
 return result;
end $$;
create function public.dydd_redeem_public_assessment_code(p_code_hash text,p_user_id uuid,p_product text,p_source_snapshot_id uuid default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.dydd_public_assessment_codes%rowtype; e public.dydd_public_assessment_entitlements%rowtype; oid uuid;
begin
 if p_product is null or p_product not in ('designid','designpd') or coalesce(p_code_hash,'') !~ '^[0-9a-f]{64}$' then raise exception 'Invalid assessment code';end if;
 if dydd_private.retake_verified_email(p_user_id) is null then raise exception 'Verified account required';end if;
 if p_product='designid' and p_source_snapshot_id is not null then raise exception 'DesignID does not accept a source';end if;
 -- Lock the exact source before consuming any code. Prerequisite failure leaves code untouched.
 if p_product='designpd' then
  perform 1 from public.assessment_snapshots where id=p_source_snapshot_id for share;
  if not public.dydd_public_assessment_source_owned(p_user_id,p_source_snapshot_id) then raise exception 'DesignPD requires your valid completed DesignID';end if;
 end if;
 select * into c from public.dydd_public_assessment_codes where code_hash=p_code_hash for update;
 if not found or c.product<>p_product or c.revoked_at is not null then raise exception 'Invalid assessment code';end if;
 if c.redeemed_at is not null then
  if c.redeemed_by<>p_user_id then raise exception 'Assessment code already used';end if;
  select * into e from public.dydd_public_assessment_entitlements where order_id=c.order_id and user_id=p_user_id and product=p_product and source_snapshot_id is not distinct from p_source_snapshot_id;
  if not found or e.revoked_at is not null then raise exception 'Assessment code already used';end if;
  return to_jsonb(e);
 end if;
 if c.expires_at is not null and c.expires_at<=now() then raise exception 'Assessment code expired';end if;
 insert into public.dydd_public_assessment_orders(user_id,product,source_snapshot_id,status,fulfillment_status,fulfilled_at)
 values(p_user_id,p_product,p_source_snapshot_id,'waived','fulfilled',now()) returning id into oid;
 insert into public.dydd_public_assessment_entitlements(order_id,user_id,product,source_snapshot_id)
 values(oid,p_user_id,p_product,p_source_snapshot_id) returning * into e;
 update public.dydd_public_assessment_codes set redeemed_at=now(),redeemed_by=p_user_id,order_id=oid where id=c.id;
 return to_jsonb(e);
end $$;

-- All completion paths lock order BEFORE entitlement, matching payment reversal.
-- Recheck after both locks: an unlocked lookup alone races refunds and concurrent saves.
create function dydd_private.lock_public_assessment_entitlement(p_user uuid,p_product text,p_source uuid)
returns setof public.dydd_public_assessment_entitlements
language plpgsql security invoker set search_path='' as $$
declare candidate jsonb; o public.dydd_public_assessment_orders%rowtype; e public.dydd_public_assessment_entitlements%rowtype;
begin
 candidate:=public.dydd_has_public_assessment_entitlement(p_user,p_product,p_source);
 if candidate is null then return;end if;
 select * into o from public.dydd_public_assessment_orders where id=(candidate->>'order_id')::uuid for update;
 select * into e from public.dydd_public_assessment_entitlements where id=(candidate->>'id')::uuid for update;
 if e.id is null or e.user_id<>p_user or e.product<>p_product or e.source_snapshot_id is distinct from p_source
 or e.revoked_at is not null or e.consumed_at is not null or o.id is null or o.user_id<>e.user_id
 or o.product<>e.product or o.source_snapshot_id is distinct from e.source_snapshot_id
 or o.status not in ('paid','waived') or o.fulfillment_status<>'fulfilled'
 or not public.dydd_public_assessment_provider_allowed(o.payment_provider)
 or e.grant_kind<>coalesce(o.payment_provider,'waiver') then return;end if;
 return next e;
end $$;
revoke all on function dydd_private.lock_public_assessment_entitlement(uuid,text,uuid) from public,anon,authenticated;
grant execute on function dydd_private.lock_public_assessment_entitlement(uuid,text,uuid) to service_role;

-- Keep the baseline six-calendar-month save function byte-for-byte unchanged.
-- The compatibility owner argument is deliberately ignored: buying a report is not a timing override.
create function public.save_public_designid_attempt(p_user_id uuid,p_participant_id uuid,p_source_response_id text,p_owner_exemption boolean,p_scores jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare entitlement public.dydd_public_assessment_entitlements%rowtype; result_id uuid;
begin
 if dydd_private.retake_verified_email(p_user_id) is null then raise exception 'Verified account required';end if;
 if nullif(btrim(p_source_response_id),'') is null then raise exception 'Attempt reference required';end if;
 perform pg_advisory_xact_lock(hashtextextended('public-designid:'||p_user_id::text,0));
 -- Retry the same completed request without consuming a second purchase or calling save again.
 select s.id into result_id from public.assessment_snapshots s
 join public.dydd_public_assessment_entitlements e on e.completion_snapshot_id=s.id
 where s.user_id=p_user_id and s.participant_id=p_participant_id and s.assessment_type='designid'
 and s.source='designid_app' and s.source_response_id=p_source_response_id and e.user_id=p_user_id
 and e.product='designid' and e.consumed_at is not null;
 if result_id is not null then return result_id;end if;
 select * into entitlement from dydd_private.lock_public_assessment_entitlement(p_user_id,'designid',null);
 if entitlement.id is null then raise exception 'An unused DesignID purchase or waiver is required';end if;
 result_id:=public.save_designid_attempt(p_user_id,p_participant_id,p_source_response_id,false,p_scores);
 update public.dydd_public_assessment_entitlements set consumed_at=now(),completion_snapshot_id=result_id where id=entitlement.id;
 update public.dydd_public_assessment_orders set report_snapshot_id=result_id where id=entitlement.order_id;
 return result_id;
end $$;

create function public.finish_public_designpd_generation(p_user uuid,p_source uuid,p_version text,p_token uuid,p_pdf jsonb,p_report_url text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare e public.dydd_public_assessment_entitlements%rowtype; sid uuid; finished boolean;
begin
 if not public.dydd_public_assessment_source_owned(p_user,p_source) then raise exception 'A valid DesignPD source is required';end if;
 select * into e from dydd_private.lock_public_assessment_entitlement(p_user,'designpd',p_source);
 if e.id is null then
  -- Same-token replay of an already completed reservation performs no provider work or new grant.
  return exists(select 1 from public.designpd_generation_reservations r
    join public.dydd_public_assessment_entitlements x on x.completion_snapshot_id=r.snapshot_id
    where r.user_id=p_user and r.source_snapshot_id=p_source and r.content_version=p_version
    and r.token=p_token and r.state='ready' and x.user_id=p_user and x.product='designpd'
    and x.source_snapshot_id=p_source and x.consumed_at is not null);
 end if;
 finished:=public.finish_designpd_generation(p_user,p_source,p_version,p_token,p_pdf,p_report_url);
 -- Production never treats sandbox preview/failure as completion. Pending/uncertain keep access.
 if finished and (p_pdf->>'status') in ('ready','success') then
  select snapshot_id into sid from public.designpd_generation_reservations where user_id=p_user and source_snapshot_id=p_source and content_version=p_version;
  update public.dydd_public_assessment_entitlements set consumed_at=now(),completion_snapshot_id=sid where id=e.id;
  update public.dydd_public_assessment_orders set report_snapshot_id=sid where id=e.order_id;
 end if;
 return finished;
end $$;

revoke all on function public.dydd_redeem_public_assessment_code(text,uuid,text,uuid),
 public.dydd_has_public_assessment_entitlement(uuid,text,uuid),
 public.dydd_apply_verified_public_assessment_payment(uuid,text,bigint,text,text,text,text),
 public.dydd_revoke_public_assessment_payment(text,text),
 public.save_public_designid_attempt(uuid,uuid,text,boolean,jsonb),
 public.finish_public_designpd_generation(uuid,uuid,text,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.dydd_redeem_public_assessment_code(text,uuid,text,uuid),
 public.dydd_has_public_assessment_entitlement(uuid,text,uuid),
 public.dydd_apply_verified_public_assessment_payment(uuid,text,bigint,text,text,text,text),
 public.dydd_revoke_public_assessment_payment(text,text),
 public.save_public_designid_attempt(uuid,uuid,text,boolean,jsonb),
 public.finish_public_designpd_generation(uuid,uuid,text,uuid,jsonb,text) to service_role;
commit;
