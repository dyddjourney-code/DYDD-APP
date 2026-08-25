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
  updated_at timestamptz not null default now()
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

alter table public.journey_workbook_responses
  add column if not exists source_area text not null default 'journey_prompt',
  add column if not exists subject_slug text,
  add column if not exists subject_label text,
  add column if not exists stage_title text,
  add column if not exists stage_order integer,
  add column if not exists class_week text,
  add column if not exists section_slug text,
  add column if not exists section_title text,
  add column if not exists source_ref text,
  add column if not exists care_step text,
  add column if not exists prompt_label text,
  add column if not exists entry_version integer not null default 1,
  add column if not exists is_current boolean not null default true,
  add column if not exists supersedes_response_id uuid references public.journey_workbook_responses(id) on delete set null;

alter table public.journey_workbook_responses
  drop constraint if exists journey_workbook_responses_user_id_journey_slug_stage_slug_prompt_id_key;

alter table public.journey_workbook_responses
  drop constraint if exists journey_workbook_responses_response_type_check,
  add constraint journey_workbook_responses_response_type_check
    check (response_type in ('short_text', 'long_text', 'list', 'declaration', 'structured'));

alter table public.journey_workbook_responses
  drop constraint if exists journey_workbook_responses_source_area_check,
  add constraint journey_workbook_responses_source_area_check
    check (source_area in ('journey_prompt', 'care_prompt', 'pathfinder', 'journal', 'assessment_reflection'));

alter table public.journey_workbook_responses
  drop constraint if exists journey_workbook_responses_care_step_check,
  add constraint journey_workbook_responses_care_step_check
    check (care_step is null or care_step in ('connect', 'act', 'reflect', 'explore'));

update public.journey_workbook_responses
set
  source_area = case
    when prompt_id like '%pathfinder%' or prompt_id in (
      'identity-declaration',
      'expertise-declaration',
      'story-declaration',
      'desire-declaration',
      'gifts-declaration',
      'niche-declaration',
      'pathfinder-final-route'
    ) then 'pathfinder'
    else source_area
  end,
  care_step = coalesce(care_step, nullif(dydi_context->>'care_step', '')),
  stage_title = coalesce(stage_title, nullif(dydi_context->>'stage_title', '')),
  prompt_label = coalesce(prompt_label, prompt_id),
  subject_slug = coalesce(subject_slug, stage_slug),
  subject_label = coalesce(subject_label, initcap(replace(stage_slug, '-', ' ')))
where true;

create unique index if not exists journey_workbook_responses_current_prompt_uidx
on public.journey_workbook_responses (user_id, journey_slug, source_area, stage_slug, prompt_id)
where is_current;

create index if not exists journey_workbook_responses_user_stage_idx
on public.journey_workbook_responses (user_id, journey_slug, stage_order, stage_slug);

create index if not exists journey_workbook_responses_user_subject_idx
on public.journey_workbook_responses (user_id, journey_slug, source_area, subject_slug);

create index if not exists journey_workbook_responses_current_context_idx
on public.journey_workbook_responses (user_id, journey_slug, stage_order, source_area, care_step)
where is_current;

create index if not exists journey_workbook_responses_dydi_context_gin_idx
on public.journey_workbook_responses using gin (dydi_context);

create index if not exists journey_enrollments_user_id_idx
on public.journey_enrollments (user_id);

create index if not exists journey_companion_notes_user_stage_idx
on public.journey_companion_notes (user_id, journey_slug, stage_slug);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_journey_enrollments_updated_at on public.journey_enrollments;
create trigger set_journey_enrollments_updated_at
before update on public.journey_enrollments
for each row execute function public.set_updated_at();

drop trigger if exists set_journey_workbook_responses_updated_at on public.journey_workbook_responses;
create trigger set_journey_workbook_responses_updated_at
before update on public.journey_workbook_responses
for each row execute function public.set_updated_at();

create or replace view public.journey_learning_records
with (security_invoker = true)
as
select
  ('workbook:' || r.id::text) as record_id,
  r.user_id,
  r.journey_slug,
  r.source_area as record_kind,
  r.stage_slug,
  r.stage_title,
  r.stage_order,
  r.class_week,
  r.section_slug,
  r.section_title,
  r.subject_slug,
  r.subject_label,
  r.source_ref,
  r.care_step,
  r.prompt_id,
  r.prompt_label as title,
  r.response_type as content_type,
  r.response_text as content_text,
  r.response_json as content_json,
  r.dydi_context,
  r.entry_version,
  r.is_current,
  r.created_at,
  r.updated_at
from public.journey_workbook_responses r
union all
select
  ('assessment:' || a.id::text) as record_id,
  a.user_id,
  'discover-your-divine-design' as journey_slug,
  'assessment_snapshot' as record_kind,
  null::text as stage_slug,
  null::text as stage_title,
  null::integer as stage_order,
  null::text as class_week,
  null::text as section_slug,
  null::text as section_title,
  a.assessment_type as subject_slug,
  initcap(replace(a.assessment_type, '_', ' ')) as subject_label,
  a.source as source_ref,
  null::text as care_step,
  a.assessment_type as prompt_id,
  initcap(replace(a.assessment_type, '_', ' ')) as title,
  'structured' as content_type,
  null::text as content_text,
  a.scores as content_json,
  jsonb_build_object(
    'assessment_type', a.assessment_type,
    'source', a.source,
    'source_submitted_at', a.source_submitted_at
  ) as dydi_context,
  1 as entry_version,
  true as is_current,
  a.created_at,
  a.created_at as updated_at
from public.assessment_snapshots a;

alter table public.journey_enrollments enable row level security;
alter table public.journey_workbook_responses enable row level security;
alter table public.journey_companion_notes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_enrollments'
      and policyname = 'students read own journey enrollments'
  ) then
    create policy "students read own journey enrollments"
    on public.journey_enrollments for select
    to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_enrollments'
      and policyname = 'students create own journey enrollments'
  ) then
    create policy "students create own journey enrollments"
    on public.journey_enrollments for insert
    to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_enrollments'
      and policyname = 'students update own journey enrollments'
  ) then
    create policy "students update own journey enrollments"
    on public.journey_enrollments for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_workbook_responses'
      and policyname = 'students read own workbook responses'
  ) then
    create policy "students read own workbook responses"
    on public.journey_workbook_responses for select
    to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_workbook_responses'
      and policyname = 'students create own workbook responses'
  ) then
    create policy "students create own workbook responses"
    on public.journey_workbook_responses for insert
    to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_workbook_responses'
      and policyname = 'students update own workbook responses'
  ) then
    create policy "students update own workbook responses"
    on public.journey_workbook_responses for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_companion_notes'
      and policyname = 'students read own companion notes'
  ) then
    create policy "students read own companion notes"
    on public.journey_companion_notes for select
    to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end $$;

grant select, insert, update on public.journey_enrollments to authenticated;
grant select, insert, update on public.journey_workbook_responses to authenticated;
grant select on public.journey_companion_notes to authenticated;
grant select on public.journey_learning_records to authenticated;
