create table if not exists public.journey_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_slug text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  current_stage_slug text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, journey_slug)
);

create table if not exists public.journey_workbook_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_slug text not null,
  stage_slug text not null,
  prompt_id text not null,
  response_type text not null check (response_type in ('short_text', 'long_text', 'list', 'declaration', 'structured')),
  response_text text,
  response_json jsonb not null default '{}'::jsonb,
  dydi_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, journey_slug, stage_slug, prompt_id)
);

create table if not exists public.journey_companion_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_slug text not null,
  stage_slug text,
  note_type text not null check (note_type in ('summary', 'pattern', 'question', 'next_step', 'prayer')),
  content text not null,
  source_response_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists journey_enrollments_user_id_idx
on public.journey_enrollments (user_id);

create index if not exists journey_workbook_responses_user_stage_idx
on public.journey_workbook_responses (user_id, journey_slug, stage_slug);

create index if not exists journey_companion_notes_user_stage_idx
on public.journey_companion_notes (user_id, journey_slug, stage_slug);

alter table public.journey_enrollments enable row level security;
alter table public.journey_workbook_responses enable row level security;
alter table public.journey_companion_notes enable row level security;

create policy "students read own journey enrollments"
on public.journey_enrollments for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "students create own journey enrollments"
on public.journey_enrollments for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "students update own journey enrollments"
on public.journey_enrollments for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "students read own workbook responses"
on public.journey_workbook_responses for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "students create own workbook responses"
on public.journey_workbook_responses for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "students update own workbook responses"
on public.journey_workbook_responses for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "students read own companion notes"
on public.journey_companion_notes for select
to authenticated
using ((select auth.uid()) = user_id);
