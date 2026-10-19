-- Organizer workspaces are separate from participant membership/access.
-- A Circle plan never grants course access or makes a listed person a member.
begin;
create table public.journey_circle_plans (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  preview_scope text check (preview_scope in ('owner','new','heather')),
  status text not null check (status in ('draft','active','archived')),
  plan jsonb not null check (jsonb_typeof(plan) = 'object' and octet_length(plan::text) <= 250000),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint circle_owner_exactly_one check ((user_id is not null and preview_scope is null) or (user_id is null and preview_scope is not null))
);
create index circle_plans_user_idx on public.journey_circle_plans(user_id, updated_at desc);
create index circle_plans_preview_idx on public.journey_circle_plans(preview_scope, updated_at desc) where preview_scope is not null;
alter table public.journey_circle_plans enable row level security;
-- All writes go through the validated server API; normal users can only read their own records.
create policy "organizers read own circle plans" on public.journey_circle_plans for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.journey_circle_plans from anon, authenticated;
grant select on public.journey_circle_plans to authenticated;
grant select, insert, update, delete on public.journey_circle_plans to service_role;
commit;
