-- Bounded, owner-created guest grants. No account rights or scoring changes.
begin;
create table public.dydd_guest_access_grants (
 id uuid primary key default gen_random_uuid(),
 token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 name text not null check(length(btrim(name)) between 2 and 120),
 kind text not null check(kind in ('group','coupon')),
 coupon_code text check(coupon_code is null or length(btrim(coupon_code)) between 1 and 120),
 products text[] not null check(cardinality(products) between 1 and 2 and products <@ array['designid','designpd']::text[]),
 expires_at timestamptz not null,
 max_uses integer not null check(max_uses>0),
 uses integer not null default 0 check(uses>=0 and uses<=max_uses),
 revoked_at timestamptz, created_by uuid not null, created_at timestamptz not null default now(),
 check(expires_at>created_at), check(kind<>'coupon' or coupon_code is not null)
);
create table public.dydd_guest_access_redemptions (
 grant_id uuid not null references public.dydd_guest_access_grants(id),
 session_id uuid not null references public.dydd_guest_sessions(id),
 created_at timestamptz not null default now(), primary key(grant_id,session_id)
);
alter table public.dydd_guest_access_grants enable row level security;
alter table public.dydd_guest_access_redemptions enable row level security;
revoke all on public.dydd_guest_access_grants,public.dydd_guest_access_redemptions from public,anon,authenticated;
grant all on public.dydd_guest_access_grants,public.dydd_guest_access_redemptions to service_role;
alter table public.dydd_guest_orders add column access_grant_id uuid references public.dydd_guest_access_grants(id),
 add column access_name text, add column coupon_code text;
alter table public.dydd_guest_orders drop constraint dydd_guest_orders_payment_provider_check;
alter table public.dydd_guest_orders drop constraint dydd_guest_orders_expected_amount_check;
do $$ declare c record; begin
 for c in select conname from pg_constraint where conrelid='public.dydd_guest_orders'::regclass and contype='c'
  and pg_get_constraintdef(oid) like '%paid_at%' loop
  execute format('alter table public.dydd_guest_orders drop constraint %I',c.conname);
 end loop;
end $$;
alter table public.dydd_guest_orders add constraint dydd_guest_order_provider_evidence check(
 (payment_provider in ('stripe_test','stripe_live') and expected_amount=1999 and access_grant_id is null
  and (status<>'paid' or (paid_at is not null and payment_reference is not null and payment_intent_id is not null
    and expected_product_id is not null and expected_price_id is not null)))
 or (payment_provider='group_free' and expected_amount=0 and access_grant_id is not null and access_name is not null
  and paid_at is not null and payment_reference is null and payment_intent_id is null
  and expected_product_id is null and expected_price_id is null)
);
-- Service-only entitlement verifier. Never infer free rights from a client amount/code/flag.
create function public.dydd_guest_order_entitled(p_order_id uuid)
returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.dydd_guest_orders o where o.id=p_order_id and o.status='paid' and (
  (o.payment_provider in ('stripe_test','stripe_live') and public.dydd_public_assessment_provider_allowed(o.payment_provider)
   and not exists(select 1 from public.dydd_guest_reversals x where x.payment_provider=o.payment_provider and x.payment_intent_id=o.payment_intent_id))
  or (o.payment_provider='group_free' and o.expected_amount=0 and exists(
   select 1 from public.dydd_guest_access_grants g join public.dydd_guest_access_redemptions r on r.grant_id=g.id
   where g.id=o.access_grant_id and r.session_id=o.session_id and g.revoked_at is null and o.product=any(g.products)
  ))
 ))
$$;
-- Link expiry/capacity limits NEW enrollments; enrolled guests keep their original
-- reports until session expiry. Explicit owner revocation disables that grant's rights.
create function public.dydd_guest_redeem_access(p_session_id uuid,p_token_hash text,p_source uuid default null)
returns uuid[] language plpgsql security invoker set search_path='' as $$
declare g public.dydd_guest_access_grants%rowtype; s public.dydd_guest_sessions%rowtype;
 enrolled boolean; oid uuid; ids uuid[]:='{}'; prod text;
begin
 select * into s from public.dydd_guest_sessions where id=p_session_id and expires_at>now();
 if not found then raise exception 'Valid guest session required';end if;
 perform pg_advisory_xact_lock(hashtextextended('guest-timing:'||lower(btrim(s.participant_email)),0));
 perform pg_advisory_xact_lock(hashtextextended('guest-session:'||p_session_id::text,0));
 select * into g from public.dydd_guest_access_grants where token_hash=p_token_hash for update;
 if not found or g.revoked_at is not null then raise exception 'Access link is unavailable';end if;
 select exists(select 1 from public.dydd_guest_access_redemptions where grant_id=g.id and session_id=s.id) into enrolled;
 if not enrolled and (g.expires_at<=now() or g.uses>=g.max_uses) then raise exception 'Access link is expired or fully used';end if;
 -- PD is ALWAYS derived from a saved DesignID in this capability, never a typed identity.
 if p_source is not null and not exists(select 1 from public.dydd_guest_results r where r.id=p_source and r.session_id=s.id
  and r.product='designid' and public.dydd_guest_order_entitled(r.order_id))
 then raise exception 'Valid completed DesignID required';end if;
 if not ('designid'=any(g.products)) and p_source is null then raise exception 'Open this link in your existing DesignID session first';end if;
 foreach prod in array g.products loop
  if prod='designpd' and p_source is null then continue;end if;
  if prod='designid' and p_source is not null then continue;end if;
  -- Replays retain the original order. Other grants/paid checkouts are never overwritten.
  select id into oid from public.dydd_guest_orders where session_id=s.id and product=prod
   and source_result_id is not distinct from (case when prod='designpd' then p_source else null end)
   and status in ('pending','paid');
  if oid is not null then
   if not public.dydd_guest_order_entitled(oid) then raise exception 'Existing purchase needs recovery; do not enroll again';end if;
   ids:=array_append(ids,oid); continue;
  end if;
  if prod='designid' then
   if exists(select 1 from public.dydd_guest_results r join public.dydd_guest_sessions gs on gs.id=r.session_id
    where r.product='designid' and lower(btrim(gs.participant_email))=lower(btrim(s.participant_email))
    and r.created_at+interval '6 months'>now()) then raise exception 'Assessment timing needs recovery. Use your existing private link or contact support';end if;
   if exists(select 1 from public.dydd_guest_orders o join public.dydd_guest_sessions gs on gs.id=o.session_id
    where o.product='designid' and o.status in ('pending','paid') and lower(btrim(gs.participant_email))=lower(btrim(s.participant_email))
    and (o.status='pending' or not exists(select 1 from public.dydd_guest_results r where r.order_id=o.id)))
   then raise exception 'Existing purchase needs recovery; do not enroll again';end if;
  end if;
  -- Provenance is immutable on the order even if the owner later renames a grant.
  insert into public.dydd_guest_orders(session_id,product,source_result_id,status,payment_provider,expected_amount,paid_at,access_grant_id,access_name,coupon_code)
  values(s.id,prod,case when prod='designpd' then p_source else null end,'paid','group_free',0,now(),g.id,g.name,g.coupon_code) returning id into oid;
  ids:=array_append(ids,oid);
 end loop;
 if cardinality(ids)=0 then raise exception 'No applicable assessment in this access link';end if;
 if not enrolled then
  insert into public.dydd_guest_access_redemptions(grant_id,session_id) values(g.id,s.id);
  update public.dydd_guest_access_grants set uses=uses+1 where id=g.id;
 end if;
 return ids;
end $$;
revoke all on function public.dydd_guest_order_entitled(uuid),public.dydd_guest_redeem_access(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.dydd_guest_order_entitled(uuid),public.dydd_guest_redeem_access(uuid,text,uuid) to service_role;

create or replace function public.dydd_guest_reserve_order(p_session_id uuid,p_product text,p_source uuid,p_provider text,p_product_id text,p_price text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.dydd_guest_sessions%rowtype; oid uuid;
begin
 select * into s from public.dydd_guest_sessions where id=p_session_id and expires_at>now();
 if not found or p_product not in ('designid','designpd') or not public.dydd_public_assessment_provider_allowed(p_provider)
 or p_provider not in ('stripe_test','stripe_live') or coalesce(p_product_id,'') !~ '^prod_.+' or coalesce(p_price,'') !~ '^price_.+'
 then raise exception 'Invalid guest checkout reservation';end if;
 -- Timing identity is guest-only normalized email, never account ownership or disclosure.
 -- No Gmail alias folding and no access to historical app identities/reports.
 perform pg_advisory_xact_lock(hashtextextended('guest-timing:'||lower(btrim(s.participant_email)),0));
 perform pg_advisory_xact_lock(hashtextextended('guest-session:'||p_session_id::text,0));
 if p_product='designid' then
  if p_source is not null then raise exception 'DesignID cannot have a source';end if;
  if exists(select 1 from public.dydd_guest_results r join public.dydd_guest_sessions gs on gs.id=r.session_id
   where r.product='designid' and lower(btrim(gs.participant_email))=lower(btrim(s.participant_email))
   and r.created_at+interval '6 months'>now()) then
   raise exception 'Assessment timing needs recovery. Please use your existing private link or contact support before another purchase';
  end if;
 else
  if not exists(select 1 from public.dydd_guest_results r join public.dydd_guest_orders o on o.id=r.order_id
   where r.id=p_source and r.product='designid' and r.session_id=p_session_id and o.status='paid'
   and public.dydd_guest_order_entitled(o.id)) then raise exception 'Valid completed DesignID required';end if;
 end if;
 -- A pending first ID checkout for this exact guest email cannot be charged again
 -- through a second freshly opened guest capability while provider state is uncertain.
 if p_product='designid' and exists(select 1 from public.dydd_guest_orders o join public.dydd_guest_sessions gs on gs.id=o.session_id
  where o.product='designid' and o.status in ('pending','paid') and lower(btrim(gs.participant_email))=lower(btrim(s.participant_email))
  and (o.status='pending' or not exists(select 1 from public.dydd_guest_results r where r.order_id=o.id)))
 then raise exception 'An existing purchase needs recovery. Use your private link or contact support; do not repurchase';end if;
 insert into public.dydd_guest_orders(session_id,product,source_result_id,payment_provider,expected_product_id,expected_price_id)
 values(p_session_id,p_product,p_source,p_provider,p_product_id,p_price) returning id into oid;
 return oid;
end $$;

create or replace function public.dydd_guest_apply_payment(p_order_id uuid,p_provider text,p_reference text,p_intent text,p_amount bigint,p_currency text,p_price text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare o public.dydd_guest_orders%rowtype; sid uuid;
begin
 if p_provider is null or p_provider not in ('stripe_test','stripe_live') or
    not public.dydd_public_assessment_provider_allowed(p_provider) or
    coalesce(p_intent,'') !~ '^pi_.+' or coalesce(p_reference,'') !~ '^cs_.+' then return false;end if;
 select session_id into sid from public.dydd_guest_orders where id=p_order_id;
 if sid is null then return false;end if;
 perform pg_advisory_xact_lock(hashtextextended('guest-session:'||sid::text,0));
 perform pg_advisory_xact_lock(hashtextextended('guest-payment:'||p_provider||':'||p_intent,0));
 select * into o from public.dydd_guest_orders where id=p_order_id for update;
 if o.payment_provider is distinct from p_provider or o.payment_reference is distinct from p_reference
 or o.expected_amount is distinct from p_amount or o.currency is distinct from p_currency
 or o.expected_price_id is distinct from p_price or nullif(btrim(o.expected_product_id),'') is null
 or nullif(btrim(o.expected_price_id),'') is null or o.status not in ('pending','paid')
 or (o.payment_intent_id is not null and o.payment_intent_id<>p_intent)
 or not exists(select 1 from public.dydd_guest_sessions where id=sid and expires_at>now())
 or exists(select 1 from public.dydd_guest_reversals where payment_provider=p_provider and payment_intent_id=p_intent)
 or exists(select 1 from public.dydd_guest_orders where payment_provider=p_provider and payment_intent_id=p_intent and id<>o.id)
 then return false;end if;
 if o.product='designpd' and not exists(
  select 1 from public.dydd_guest_results r join public.dydd_guest_orders so on so.id=r.order_id
  where r.id=o.source_result_id and r.product='designid' and r.session_id=sid and so.session_id=sid
  and so.product='designid' and so.status='paid' and public.dydd_guest_order_entitled(so.id)
  and not exists(select 1 from public.dydd_guest_reversals x where x.payment_provider=so.payment_provider and x.payment_intent_id=so.payment_intent_id)
 ) then return false;end if;
 update public.dydd_guest_orders set status='paid',payment_intent_id=p_intent,paid_at=coalesce(paid_at,now()) where id=o.id;
 return true;
end $$;

create or replace function public.dydd_guest_save_result(p_session_id uuid,p_order_id uuid,p_scores jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare o public.dydd_guest_orders%rowtype; rid uuid; point_scores jsonb; k text; n numeric; total numeric:=0;
begin
 if p_session_id is null then raise exception 'Guest session required';end if;
 perform pg_advisory_xact_lock(hashtextextended('guest-session:'||p_session_id::text,0));
 select * into o from public.dydd_guest_orders where id=p_order_id for update;
 if not found or o.session_id<>p_session_id or o.status<>'paid'
 or not public.dydd_guest_order_entitled(o.id)
 or not exists(select 1 from public.dydd_guest_sessions where id=p_session_id and expires_at>now())
 or exists(select 1 from public.dydd_guest_reversals where payment_provider=o.payment_provider and payment_intent_id=o.payment_intent_id)
 then raise exception 'A valid paid guest order is required';end if;
 if o.product='designpd' and not exists(
  select 1 from public.dydd_guest_results r join public.dydd_guest_orders so on so.id=r.order_id
  where r.id=o.source_result_id and r.product='designid' and r.session_id=p_session_id
  and so.session_id=p_session_id and so.product='designid' and so.status='paid'
  and public.dydd_guest_order_entitled(so.id)
  and not exists(select 1 from public.dydd_guest_reversals x where x.payment_provider=so.payment_provider and x.payment_intent_id=so.payment_intent_id)
 ) then raise exception 'DesignPD requires this session completed paid DesignID';end if;
 -- Exact order replay never re-scores or changes the immutable saved payload.
 select id into rid from public.dydd_guest_results where order_id=o.id and session_id=p_session_id;
 if rid is not null then return rid;end if;
 if p_scores is null or jsonb_typeof(p_scores)<>'object' then raise exception 'Scores must be an object';end if;
 if o.product='designid' then
  -- The persisted app payload carries canonical points in its scores object.
  -- Direct canonical point objects are also accepted, never string-valued points.
  point_scores:=case when jsonb_typeof(p_scores->'scores')='object' then p_scores->'scores' else p_scores end;
  foreach k in array array['Architect_Pts','Artisan_Pts','Shepherd_Pts','Steward_Pts'] loop
   if jsonb_typeof(point_scores->k) is distinct from 'number' or coalesce(point_scores->>k,'') !~ '^[0-9]+([.]0+)?$'
   then raise exception 'Canonical numeric DesignID points required';end if;
   n:=(point_scores->>k)::numeric;
   if n<0 or n>60 then raise exception 'DesignID points out of range';end if;
   total:=total+n;
  end loop;
  if total<>100 or jsonb_typeof(point_scores->'Total_Pts') is distinct from 'number'
   or (point_scores->>'Total_Pts')::numeric<>100 then raise exception 'DesignID total must equal 100';end if;
 elsif p_scores->>'designIdSnapshotId' is distinct from o.source_result_id::text then
  raise exception 'DesignPD source must match the paid order';
 end if;
 insert into public.dydd_guest_results(order_id,session_id,product,source_result_id,scores)
 values(o.id,p_session_id,o.product,o.source_result_id,p_scores) returning id into rid;
 return rid;
end $$;
-- Restore included DesignPD from a private individual session, without carrying
-- a broadly reusable group capability into report emails or a new browser.
create function public.dydd_guest_unlock_included_pd(p_session_id uuid,p_source uuid)
returns uuid[] language plpgsql security invoker set search_path='' as $$
declare grant_hash text;
begin
 select g.token_hash into grant_hash from public.dydd_guest_results r
 join public.dydd_guest_orders o on o.id=r.order_id
 join public.dydd_guest_access_grants g on g.id=o.access_grant_id
 join public.dydd_guest_access_redemptions red on red.grant_id=g.id and red.session_id=p_session_id
 where r.id=p_source and r.session_id=p_session_id and r.product='designid'
 and g.revoked_at is null and 'designpd'=any(g.products) and public.dydd_guest_order_entitled(o.id);
 if grant_hash is null then raise exception 'Included DesignPD is unavailable';end if;
 return public.dydd_guest_redeem_access(p_session_id,grant_hash,p_source);
end $$;
revoke all on function public.dydd_guest_unlock_included_pd(uuid,uuid) from public,anon,authenticated;
grant execute on function public.dydd_guest_unlock_included_pd(uuid,uuid) to service_role;
commit;
