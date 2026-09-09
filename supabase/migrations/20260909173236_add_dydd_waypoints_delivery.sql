create table if not exists public.dydd_waypoints (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  tags text[] not null default array[]::text[],
  scripture_reference text,
  scripture_text text,
  base_content text not null,
  base_reflection_prompt text,
  public_cta text,
  status text not null default 'draft' check (status in ('draft', 'planned', 'published', 'archived')),
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dydd_waypoint_releases (
  id uuid primary key default gen_random_uuid(),
  waypoint_id uuid not null references public.dydd_waypoints(id) on delete cascade,
  release_at timestamptz not null,
  release_timezone text not null default 'America/New_York',
  status text not null default 'scheduled' check (status in ('scheduled', 'released', 'paused', 'cancelled')),
  public_channels text[] not null default array['website']::text[],
  subscriber_channels text[] not null default array['email', 'app']::text[],
  released_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (waypoint_id, release_at)
);

create table if not exists public.dydd_waypoint_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'active' check (status in ('active', 'unsubscribed', 'bounced', 'paused')),
  source text not null default 'waypoints',
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_token_hash text unique,
  preferences jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (position('@' in email) > 1)
);

create unique index if not exists dydd_waypoint_subscriptions_email_uidx
on public.dydd_waypoint_subscriptions (lower(email));

create index if not exists dydd_waypoint_subscriptions_user_id_idx
on public.dydd_waypoint_subscriptions (user_id);

create table if not exists public.dydd_waypoint_personalization (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.dydd_waypoint_subscriptions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  designid_assessment_id uuid,
  spiritual_gifts_assessment_id uuid,
  designid_primary text check (designid_primary is null or designid_primary in ('Architect', 'Artisan', 'Shepherd', 'Steward')),
  designid_secondary text check (designid_secondary is null or designid_secondary in ('Architect', 'Artisan', 'Shepherd', 'Steward')),
  spiritual_gifts_top text[] not null default array[]::text[],
  designid_payload jsonb not null default '{}'::jsonb,
  spiritual_gifts_payload jsonb not null default '{}'::jsonb,
  personalization_status text not null default 'base_only' check (personalization_status in ('base_only', 'designid_ready', 'spiritual_gifts_ready', 'fully_personalized')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id)
);

create table if not exists public.dydd_waypoint_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.dydd_waypoint_releases(id) on delete cascade,
  subscription_id uuid not null references public.dydd_waypoint_subscriptions(id) on delete cascade,
  delivery_channel text not null check (delivery_channel in ('email', 'app')),
  status text not null default 'queued' check (status in ('queued', 'sent', 'skipped', 'error')),
  personalization_payload jsonb not null default '{}'::jsonb,
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (release_id, subscription_id, delivery_channel)
);

create table if not exists public.dydd_waypoint_social_plans (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.dydd_waypoint_releases(id) on delete cascade,
  channel text not null check (channel in ('website', 'facebook', 'instagram', 'google_business')),
  content_level text not null default 'base' check (content_level = 'base'),
  status text not null default 'planned' check (status in ('planned', 'approved', 'published', 'skipped', 'error')),
  planned_copy text,
  external_post_id text,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (release_id, channel)
);

create index if not exists dydd_waypoints_status_idx
on public.dydd_waypoints (status, category);

create index if not exists dydd_waypoint_releases_due_idx
on public.dydd_waypoint_releases (status, release_at);

create index if not exists dydd_waypoint_delivery_jobs_status_idx
on public.dydd_waypoint_delivery_jobs (status, queued_at);

drop trigger if exists set_dydd_waypoints_updated_at
on public.dydd_waypoints;
create trigger set_dydd_waypoints_updated_at
before update on public.dydd_waypoints
for each row execute function public.set_updated_at();

drop trigger if exists set_dydd_waypoint_releases_updated_at
on public.dydd_waypoint_releases;
create trigger set_dydd_waypoint_releases_updated_at
before update on public.dydd_waypoint_releases
for each row execute function public.set_updated_at();

drop trigger if exists set_dydd_waypoint_subscriptions_updated_at
on public.dydd_waypoint_subscriptions;
create trigger set_dydd_waypoint_subscriptions_updated_at
before update on public.dydd_waypoint_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_dydd_waypoint_personalization_updated_at
on public.dydd_waypoint_personalization;
create trigger set_dydd_waypoint_personalization_updated_at
before update on public.dydd_waypoint_personalization
for each row execute function public.set_updated_at();

drop trigger if exists set_dydd_waypoint_delivery_jobs_updated_at
on public.dydd_waypoint_delivery_jobs;
create trigger set_dydd_waypoint_delivery_jobs_updated_at
before update on public.dydd_waypoint_delivery_jobs
for each row execute function public.set_updated_at();

drop trigger if exists set_dydd_waypoint_social_plans_updated_at
on public.dydd_waypoint_social_plans;
create trigger set_dydd_waypoint_social_plans_updated_at
before update on public.dydd_waypoint_social_plans
for each row execute function public.set_updated_at();

create or replace view public.dydd_public_waypoint_releases
with (security_invoker = true)
as
select
  r.id as release_id,
  r.release_at,
  r.status as release_status,
  w.id as waypoint_id,
  w.slug,
  w.title,
  w.category,
  w.tags,
  w.scripture_reference,
  w.scripture_text,
  w.base_content,
  w.base_reflection_prompt,
  w.public_cta
from public.dydd_waypoint_releases r
join public.dydd_waypoints w on w.id = r.waypoint_id
where w.status = 'published'
  and r.status = 'released'
  and r.release_at <= now();

alter table public.dydd_waypoints enable row level security;
alter table public.dydd_waypoint_releases enable row level security;
alter table public.dydd_waypoint_subscriptions enable row level security;
alter table public.dydd_waypoint_personalization enable row level security;
alter table public.dydd_waypoint_delivery_jobs enable row level security;
alter table public.dydd_waypoint_social_plans enable row level security;

drop policy if exists "published waypoints are publicly readable"
on public.dydd_waypoints;
create policy "published waypoints are publicly readable"
on public.dydd_waypoints for select
to anon, authenticated
using (status = 'published');

drop policy if exists "released waypoint releases are publicly readable"
on public.dydd_waypoint_releases;
create policy "released waypoint releases are publicly readable"
on public.dydd_waypoint_releases for select
to anon, authenticated
using (
  status = 'released'
  and release_at <= now()
  and exists (
    select 1
    from public.dydd_waypoints
    where dydd_waypoints.id = dydd_waypoint_releases.waypoint_id
      and dydd_waypoints.status = 'published'
  )
);

drop policy if exists "students read own waypoint subscriptions"
on public.dydd_waypoint_subscriptions;
create policy "students read own waypoint subscriptions"
on public.dydd_waypoint_subscriptions for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "students read own waypoint personalization"
on public.dydd_waypoint_personalization;
create policy "students read own waypoint personalization"
on public.dydd_waypoint_personalization for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "students read own waypoint delivery jobs"
on public.dydd_waypoint_delivery_jobs;
create policy "students read own waypoint delivery jobs"
on public.dydd_waypoint_delivery_jobs for select
to authenticated
using (
  exists (
    select 1
    from public.dydd_waypoint_subscriptions
    where dydd_waypoint_subscriptions.id = dydd_waypoint_delivery_jobs.subscription_id
      and dydd_waypoint_subscriptions.user_id = (select auth.uid())
  )
);
