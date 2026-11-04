-- TEST-only tables; no migration or data changes on the stable production DB.
begin;
create table public.dydd_test_billing_orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 capability text not null check(capability in ('personal','circle_leadership','couples_circle','designpd')),
 scope_id text not null, price_id text not null, coupon_id text,
 status text not null default 'open' check(status in ('open','paid','expired','revoked')),
 checkout_session_id text unique, subscription_id text unique, payment_intent_id text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index dydd_test_billing_one_open on public.dydd_test_billing_orders(user_id,capability,scope_id) where status='open';
create table public.dydd_test_billing_entitlements (
 source_id text primary key, order_id uuid not null references public.dydd_test_billing_orders(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 capability text not null check(capability in ('personal','circle_leadership','couples_circle','designpd')),
 scope_id text not null, active boolean not null default false, paid boolean not null default false,
 expires_at timestamptz, updated_at timestamptz not null default now()
);
create index dydd_test_billing_access on public.dydd_test_billing_entitlements(user_id,capability,scope_id);
create table public.dydd_test_billing_events (id text primary key, type text not null, processed_at timestamptz not null default now());
alter table public.dydd_test_billing_orders enable row level security;
alter table public.dydd_test_billing_entitlements enable row level security;
alter table public.dydd_test_billing_events enable row level security;
revoke all on public.dydd_test_billing_orders,public.dydd_test_billing_entitlements,public.dydd_test_billing_events from public,anon,authenticated;
grant all on public.dydd_test_billing_orders,public.dydd_test_billing_entitlements,public.dydd_test_billing_events to service_role;
-- Attribution: earliest currently accepted active-Circle membership, one leader/person.
-- Roster invitations, owner grants, trials, ended paid access and leader themself never count.
create function public.dydd_test_qualifying_participants(leader uuid) returns integer
language sql stable security invoker set search_path=public,pg_temp as $$
 with attributed as (
 select m.user_id,p.user_id leader_id,row_number() over(partition by m.user_id order by m.accepted_at,m.id) n
 from public.dydd_circle_memberships m join public.journey_circle_plans p on p.id=m.circle_id
 where m.status='accepted' and m.user_id is not null and p.status='active' and p.user_id is not null
 and m.user_id<>p.user_id and exists(select 1 from jsonb_array_elements(p.plan->'participants') x where lower(x->>'email')=m.email)
 ) select count(*)::integer from attributed a where a.n=1 and a.leader_id=leader and exists(
 select 1 from public.dydd_test_billing_entitlements e where e.user_id=a.user_id and e.capability='personal'
 and e.active and e.paid and e.expires_at>now());
$$;
revoke all on function public.dydd_test_qualifying_participants(uuid) from public,anon,authenticated;
grant execute on function public.dydd_test_qualifying_participants(uuid) to service_role;
-- Serialize grants against revocations; stale concurrent provider reads cannot overwrite newer checks.
alter table public.dydd_test_billing_entitlements add column checked_at timestamptz not null default now();
create function public.dydd_test_save_entitlement(p_order uuid,p_source text,p_active boolean,p_paid boolean,p_expires timestamptz,p_checked timestamptz)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare o public.dydd_test_billing_orders;
begin
 select * into strict o from public.dydd_test_billing_orders where id=p_order for update;
 insert into public.dydd_test_billing_entitlements(source_id,order_id,user_id,capability,scope_id,active,paid,expires_at,checked_at)
 values(p_source,o.id,o.user_id,o.capability,o.scope_id,p_active and o.status<>'revoked',p_paid,p_expires,p_checked)
 on conflict(source_id) do update set active=excluded.active,paid=excluded.paid,expires_at=excluded.expires_at,checked_at=excluded.checked_at,updated_at=now()
 where public.dydd_test_billing_entitlements.order_id=excluded.order_id and public.dydd_test_billing_entitlements.checked_at<=excluded.checked_at;
end $$;
revoke all on function public.dydd_test_save_entitlement(uuid,text,boolean,boolean,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.dydd_test_save_entitlement(uuid,text,boolean,boolean,timestamptz,timestamptz) to service_role;
create table public.dydd_test_billing_renewals (
 invoice_id text primary key,order_id uuid not null references public.dydd_test_billing_orders(id),
 qualifying_count integer not null,expected_amount integer not null,status text not null check(status in ('pending','applied','review')),
 updated_at timestamptz not null default now()
);
alter table public.dydd_test_billing_renewals enable row level security;
revoke all on public.dydd_test_billing_renewals from public,anon,authenticated;
grant all on public.dydd_test_billing_renewals to service_role;
commit;
