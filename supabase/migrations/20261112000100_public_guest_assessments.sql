-- Guest-only additive slice. Depends only on the existing read-only provider-mode fence.
-- Never reads/writes account identity, assessment_snapshots, participants, or app rights.
begin;
create table public.dydd_guest_sessions (
 id uuid primary key default gen_random_uuid(),
 capability_hash text not null unique check(capability_hash ~ '^[0-9a-f]{64}$'),
 participant_name text not null, participant_email text not null,
 expires_at timestamptz not null default now()+interval '1 year',
 created_at timestamptz not null default now()
);
create table public.dydd_guest_orders (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.dydd_guest_sessions(id),
 product text not null check(product in ('designid','designpd')),
 source_result_id uuid,
 status text not null default 'pending' check(status in ('pending','paid','failed','cancelled','refunded')),
 payment_provider text not null check(payment_provider in ('stripe_test','stripe_live')),
 payment_reference text,
 expected_product_id text, expected_price_id text,
 expected_amount bigint not null default 1999 check(expected_amount=1999),
 currency text not null default 'usd' check(currency='usd'),
 payment_intent_id text, paid_at timestamptz, created_at timestamptz not null default now(),
 unique(payment_provider,payment_reference), unique(payment_provider,payment_intent_id),
 check((product='designid' and source_result_id is null) or (product='designpd' and source_result_id is not null)),
 check(status<>'paid' or (paid_at is not null and payment_reference is not null and payment_intent_id is not null
   and expected_product_id is not null and expected_price_id is not null))
);
create table public.dydd_guest_results (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.dydd_guest_orders(id),
 session_id uuid not null references public.dydd_guest_sessions(id),
 product text not null check(product in ('designid','designpd')),
 source_result_id uuid references public.dydd_guest_results(id),
 scores jsonb not null check(jsonb_typeof(scores)='object'),
 created_at timestamptz not null default now(),
 report_state text not null default 'not_started' check(report_state in ('not_started','creating','uncertain','ready')),
 pdf jsonb not null default '{}'::jsonb, email jsonb not null default '{}'::jsonb,
 report_lease uuid,
 check((product='designid' and source_result_id is null) or (product='designpd' and source_result_id is not null))
);
alter table public.dydd_guest_orders add constraint dydd_guest_orders_source_fk
 foreign key(source_result_id) references public.dydd_guest_results(id);
create index dydd_guest_orders_session_idx on public.dydd_guest_orders(session_id);
create index dydd_guest_orders_source_idx on public.dydd_guest_orders(source_result_id) where source_result_id is not null;
create index dydd_guest_results_session_idx on public.dydd_guest_results(session_id);
create table public.dydd_guest_reversals (
 payment_provider text not null check(payment_provider in ('stripe_test','stripe_live')),
 payment_intent_id text not null check(payment_intent_id ~ '^pi_.+'),
 primary key(payment_provider,payment_intent_id)
);
alter table public.dydd_guest_sessions enable row level security;
alter table public.dydd_guest_orders enable row level security;
alter table public.dydd_guest_results enable row level security;
alter table public.dydd_guest_reversals enable row level security;
revoke all on public.dydd_guest_sessions,public.dydd_guest_orders,public.dydd_guest_results,public.dydd_guest_reversals from public,anon,authenticated;
grant all on public.dydd_guest_sessions,public.dydd_guest_orders,public.dydd_guest_results,public.dydd_guest_reversals to service_role;

-- Database uniqueness closes simultaneous checkout creation, including service retries.
create unique index dydd_guest_one_active_id on public.dydd_guest_orders(session_id)
 where product='designid' and status in ('pending','paid');
create unique index dydd_guest_one_active_pd on public.dydd_guest_orders(session_id,source_result_id)
 where product='designpd' and status in ('pending','paid');
create function public.dydd_guest_reserve_order(p_session_id uuid,p_product text,p_source uuid,p_provider text,p_product_id text,p_price text)
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
   and public.dydd_public_assessment_provider_allowed(o.payment_provider)) then raise exception 'Valid completed DesignID required';end if;
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
revoke all on function public.dydd_guest_reserve_order(uuid,text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.dydd_guest_reserve_order(uuid,text,uuid,text,text,text) to service_role;

-- All guest RPCs serialize by session before locking intent/order. This also serializes
-- source revocation against dependent PD payment/save, without changing any app locks.
create function public.dydd_guest_apply_payment(p_order_id uuid,p_provider text,p_reference text,p_intent text,p_amount bigint,p_currency text,p_price text)
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
  and so.product='designid' and so.status='paid' and public.dydd_public_assessment_provider_allowed(so.payment_provider)
  and not exists(select 1 from public.dydd_guest_reversals x where x.payment_provider=so.payment_provider and x.payment_intent_id=so.payment_intent_id)
 ) then return false;end if;
 update public.dydd_guest_orders set status='paid',payment_intent_id=p_intent,paid_at=coalesce(paid_at,now()) where id=o.id;
 return true;
end $$;

create function public.dydd_guest_save_result(p_session_id uuid,p_order_id uuid,p_scores jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare o public.dydd_guest_orders%rowtype; rid uuid; point_scores jsonb; k text; n numeric; total numeric:=0;
begin
 if p_session_id is null then raise exception 'Guest session required';end if;
 perform pg_advisory_xact_lock(hashtextextended('guest-session:'||p_session_id::text,0));
 select * into o from public.dydd_guest_orders where id=p_order_id for update;
 if not found or o.session_id<>p_session_id or o.status<>'paid'
 or not public.dydd_public_assessment_provider_allowed(o.payment_provider)
 or not exists(select 1 from public.dydd_guest_sessions where id=p_session_id and expires_at>now())
 or exists(select 1 from public.dydd_guest_reversals where payment_provider=o.payment_provider and payment_intent_id=o.payment_intent_id)
 then raise exception 'A valid paid guest order is required';end if;
 if o.product='designpd' and not exists(
  select 1 from public.dydd_guest_results r join public.dydd_guest_orders so on so.id=r.order_id
  where r.id=o.source_result_id and r.product='designid' and r.session_id=p_session_id
  and so.session_id=p_session_id and so.product='designid' and so.status='paid'
  and public.dydd_public_assessment_provider_allowed(so.payment_provider)
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

create function public.dydd_guest_reverse_payment(p_provider text,p_intent text,p_reference text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare o public.dydd_guest_orders%rowtype; sid uuid;
begin
 -- Reversals must still work after a mode switch, but never touch an account order.
 if p_provider is null or p_provider not in ('stripe_test','stripe_live')
 or coalesce(p_intent,'') !~ '^pi_.+' or coalesce(p_reference,'') !~ '^cs_.+' then return false;end if;
 select session_id into sid from public.dydd_guest_orders where payment_provider=p_provider and payment_reference=p_reference;
 if sid is null then return false;end if;
 perform pg_advisory_xact_lock(hashtextextended('guest-session:'||sid::text,0));
 perform pg_advisory_xact_lock(hashtextextended('guest-payment:'||p_provider||':'||p_intent,0));
 select * into o from public.dydd_guest_orders where payment_provider=p_provider and payment_reference=p_reference for update;
 if not found or (o.payment_intent_id is not null and o.payment_intent_id<>p_intent)
 or exists(select 1 from public.dydd_guest_orders where payment_provider=p_provider and payment_intent_id=p_intent and id<>o.id)
 then return false;end if;
 insert into public.dydd_guest_reversals(payment_provider,payment_intent_id) values(p_provider,p_intent) on conflict do nothing;
 update public.dydd_guest_orders set status='refunded',payment_intent_id=p_intent where id=o.id;
 if o.product='designid' then
  update public.dydd_guest_orders set status='refunded' where product='designpd' and source_result_id in
   (select id from public.dydd_guest_results where order_id=o.id and product='designid');
 end if;
 return true;
end $$;
revoke all on function public.dydd_guest_apply_payment(uuid,text,text,text,bigint,text,text),
 public.dydd_guest_save_result(uuid,uuid,jsonb),public.dydd_guest_reverse_payment(text,text,text) from public,anon,authenticated;
grant execute on function public.dydd_guest_apply_payment(uuid,text,text,text,bigint,text,text),
 public.dydd_guest_save_result(uuid,uuid,jsonb),public.dydd_guest_reverse_payment(text,text,text) to service_role;
commit;
