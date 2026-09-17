create table if not exists public.fruitlife_360_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_slug text not null,
  status text not null default 'active' check (status in ('active', 'consumed', 'refunded', 'cancelled')),
  stripe_checkout_session_id text not null unique,
  stripe_customer_id text,
  payment_intent_id text,
  price_id text,
  amount_total integer,
  currency text not null default 'usd',
  customer_email text,
  fruitlife_session_id uuid references public.fruitlife_360_sessions(id) on delete set null,
  purchased_at timestamptz not null default now(),
  consumed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fruitlife_360_entitlements_user_status_idx
on public.fruitlife_360_entitlements (user_id, product_slug, status, purchased_at desc);

create index if not exists fruitlife_360_entitlements_customer_idx
on public.fruitlife_360_entitlements (stripe_customer_id);

drop trigger if exists set_fruitlife_360_entitlements_updated_at
on public.fruitlife_360_entitlements;

create trigger set_fruitlife_360_entitlements_updated_at
before update on public.fruitlife_360_entitlements
for each row
execute function public.set_updated_at();

alter table public.fruitlife_360_entitlements enable row level security;

create policy "students read own fruitlife entitlements"
on public.fruitlife_360_entitlements for select
to authenticated
using ((select auth.uid()) = user_id);
