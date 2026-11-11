-- Additive production slice from baseline 023b480. No historical rows, timing, or course rights rewritten.
-- New tables deliberately fail if already present: inventory remote catalogs before applying.
begin;
create schema if not exists dydd_private;
-- Read only current confirmed Auth identity; never profile/user_metadata or Gmail alias folding.
create function dydd_private.retake_verified_email(p_user uuid) returns text
language sql stable security definer set search_path='' as $$
 select nullif(lower(btrim(email)),'') from auth.users where id=p_user and email_confirmed_at is not null and deleted_at is null
$$;
revoke all on function dydd_private.retake_verified_email(uuid) from public,anon,authenticated;
grant usage on schema dydd_private to service_role;
grant execute on function dydd_private.retake_verified_email(uuid) to service_role;

-- Explicitly curated legacy included access, NOT populated from all auth.users.
create table public.dydd_assessment_grandfathered_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_at timestamptz not null default now(),
 reason text not null check(length(btrim(reason))>0)
);
alter table public.dydd_assessment_grandfathered_access enable row level security;
revoke all on public.dydd_assessment_grandfathered_access from public,anon,authenticated;
grant all on public.dydd_assessment_grandfathered_access to service_role;

-- Independent database mode fence. A missing row denies payment-backed access.
create table public.dydd_public_assessment_runtime (
 singleton boolean primary key default true check(singleton),
 payment_mode text not null default 'test' check(payment_mode in ('test','live'))
);
insert into public.dydd_public_assessment_runtime(singleton) values(true);
alter table public.dydd_public_assessment_runtime enable row level security;
revoke all on public.dydd_public_assessment_runtime from public,anon,authenticated;
grant all on public.dydd_public_assessment_runtime to service_role;
create function public.dydd_public_assessment_provider_allowed(p_provider text)
returns boolean language sql stable security invoker set search_path='' as $$
 select p_provider is null or exists(select 1 from public.dydd_public_assessment_runtime where singleton and p_provider='stripe_'||payment_mode)
$$;
revoke all on function public.dydd_public_assessment_provider_allowed(text) from public,anon,authenticated;
grant execute on function public.dydd_public_assessment_provider_allowed(text) to service_role;

create table public.dydd_public_assessment_orders (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 product text not null check(product in ('designid','designpd')),
 source_snapshot_id uuid references public.assessment_snapshots(id) on delete restrict,
 status text not null default 'pending' check(status in ('pending','paid','failed','cancelled','refunded','waived')),
 fulfillment_status text not null default 'blocked' check(fulfillment_status in ('blocked','fulfilled','revoked')),
 payment_provider text check(payment_provider in ('stripe_test','stripe_live')), payment_reference text,
 expected_price_id text, expected_product_id text,
 expected_amount bigint check(expected_amount>0), currency text check(currency='usd'),
 payment_intent_id text, report_snapshot_id uuid references public.assessment_snapshots(id) on delete set null,
 unique(payment_provider,payment_reference), unique(payment_provider,payment_intent_id),
 created_at timestamptz not null default now(), fulfilled_at timestamptz,
 check((product='designid' and source_snapshot_id is null) or (product='designpd' and source_snapshot_id is not null)),
 constraint public_assessment_fulfillment_evidence check(fulfillment_status<>'fulfilled' or
 (fulfilled_at is not null and (
  (status='waived' and payment_provider is null and payment_reference is null and payment_intent_id is null) or
  (status='paid' and payment_provider is not null and payment_reference is not null and payment_intent_id is not null
   and expected_price_id is not null and expected_product_id is not null and expected_amount is not null and expected_amount>0 and currency is not null and currency='usd')
 )))
);
create table public.dydd_public_assessment_codes (
 id uuid primary key default gen_random_uuid(),
 code_hash text not null unique check(code_hash ~ '^[0-9a-f]{64}$'),
 product text not null check(product in ('designid','designpd')),
 batch_label text not null,
 created_at timestamptz not null default now(), expires_at timestamptz, revoked_at timestamptz,
 redeemed_at timestamptz, redeemed_by uuid references auth.users(id) on delete restrict,
 order_id uuid unique references public.dydd_public_assessment_orders(id) on delete restrict,
 check((redeemed_at is null and redeemed_by is null and order_id is null) or (redeemed_at is not null and redeemed_by is not null and order_id is not null))
);
create table public.dydd_public_assessment_entitlements (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.dydd_public_assessment_orders(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 product text not null check(product in ('designid','designpd')),
 source_snapshot_id uuid references public.assessment_snapshots(id) on delete restrict,
 grant_kind text not null default 'waiver' check(grant_kind in ('waiver','stripe_test','stripe_live')),
 created_at timestamptz not null default now(), consumed_at timestamptz, revoked_at timestamptz,
 completion_snapshot_id uuid references public.assessment_snapshots(id) on delete restrict,
 check((product='designid' and source_snapshot_id is null) or (product='designpd' and source_snapshot_id is not null)),
 check((consumed_at is null)=(completion_snapshot_id is null))
);
create index dydd_public_entitlements_lookup on public.dydd_public_assessment_entitlements(user_id,product,source_snapshot_id) where revoked_at is null;
alter table public.dydd_public_assessment_orders enable row level security;
alter table public.dydd_public_assessment_codes enable row level security;
alter table public.dydd_public_assessment_entitlements enable row level security;
revoke all on public.dydd_public_assessment_orders,public.dydd_public_assessment_codes,public.dydd_public_assessment_entitlements from public,anon,authenticated;
grant all on public.dydd_public_assessment_orders,public.dydd_public_assessment_codes,public.dydd_public_assessment_entitlements to service_role;

create table public.dydd_public_assessment_payment_reversals (
 payment_provider text not null check(payment_provider in ('stripe_test','stripe_live')),
 payment_intent_id text not null check(payment_intent_id ~ '^pi_.+'),
 reversed_at timestamptz not null default now(),
 primary key(payment_provider,payment_intent_id)
);
alter table public.dydd_public_assessment_payment_reversals enable row level security;
revoke all on public.dydd_public_assessment_payment_reversals from public,anon,authenticated;
grant all on public.dydd_public_assessment_payment_reversals to service_role;

create function public.dydd_public_assessment_source_owned(p_user_id uuid,p_source_snapshot_id uuid)
returns boolean language plpgsql stable security invoker set search_path='' as $$
declare account_email text; payload jsonb; points numeric[]; v text;
begin
 account_email:=dydd_private.retake_verified_email(p_user_id);
 if account_email is null or p_source_snapshot_id is null then return false; end if;
 select s.scores into payload from public.assessment_snapshots s
 left join public.assessment_participants p on p.id=s.participant_id
 where s.id=p_source_snapshot_id and s.assessment_type='designid'
 and (s.user_id=p_user_id or (s.user_id is null and (p.user_id=p_user_id or
 (p.user_id is null and lower(btrim(p.normalized_email))=account_email))));
 if not found then return false;end if;
 -- Mirror scoreDesignPd's corrected 100-point source requirement (including nested scores).
 if jsonb_typeof(payload->'scores')='object' then payload:=payload->'scores';end if;
 if jsonb_typeof(payload->'scores')='object' then payload:=payload->'scores';end if;
 points:='{}'::numeric[];
 foreach v in array array['Architect_Pts','Artisan_Pts','Shepherd_Pts','Steward_Pts'] loop
  if coalesce(payload->>v,'') !~ '^[0-9]+([.]0+)?$' then return false;end if;
  points:=array_append(points,(payload->>v)::numeric);
 end loop;
 if coalesce(payload->>'Total_Pts','') !~ '^100([.]0+)?$' then return false;end if;
 return points[1] between 0 and 60 and points[2] between 0 and 60 and points[3] between 0 and 60 and points[4] between 0 and 60
 and points[1]+points[2]+points[3]+points[4]=100;
end $$;

revoke all on function public.dydd_public_assessment_source_owned(uuid,uuid) from public,anon,authenticated;
grant execute on function public.dydd_public_assessment_source_owned(uuid,uuid) to service_role;
commit;
