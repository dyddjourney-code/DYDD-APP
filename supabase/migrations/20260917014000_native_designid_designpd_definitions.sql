create table if not exists public.native_assessment_definitions (
  id uuid primary key default gen_random_uuid(),
  assessment_type text not null,
  version text not null,
  title text not null,
  definition jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_type, version)
);

create index if not exists native_assessment_definitions_active_idx
on public.native_assessment_definitions (assessment_type, status, version);

alter table public.native_assessment_definitions enable row level security;

drop policy if exists "active native assessment definitions are readable" on public.native_assessment_definitions;
create policy "active native assessment definitions are readable"
on public.native_assessment_definitions for select
to authenticated
using (status = 'active');
