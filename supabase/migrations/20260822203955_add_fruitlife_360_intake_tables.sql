alter table public.fruitlife_360_sessions
  add column if not exists intake_token_hash text unique,
  add column if not exists signup_source text,
  add column if not exists self_completed_at timestamptz;

create table if not exists public.fruitlife_360_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fruitlife_360_sessions(id) on delete cascade,
  observer_invite_id uuid references public.fruitlife_360_observer_invites(id) on delete set null,
  response_type text not null,
  reviewer_name text,
  reviewer_email text,
  relationship_label text,
  source_system text not null default 'vercel_intake',
  source_response_id text,
  answers jsonb not null default '{}'::jsonb,
  fruit_rank text[] not null default array[]::text[],
  derived_scores jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (response_type in ('self', 'observer')),
  check (source_response_id is null or length(source_response_id) > 0)
);

create table if not exists public.fruitlife_360_report_jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fruitlife_360_sessions(id) on delete cascade,
  job_type text not null default 'fruitlife_360_report',
  job_status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  locked_at timestamptz,
  locked_by text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (job_type in ('fruitlife_360_report', 'fruitlife_360_payload')),
  check (job_status in ('queued', 'processing', 'ready', 'sent', 'retry', 'error', 'cancelled'))
);

create table if not exists public.fruitlife_360_report_artifacts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fruitlife_360_sessions(id) on delete cascade,
  report_job_id uuid references public.fruitlife_360_report_jobs(id) on delete set null,
  artifact_type text not null,
  artifact_status text not null default 'draft',
  provider text not null default 'vercel',
  provider_document_id text,
  storage_path text,
  external_url text,
  filename text,
  content_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (artifact_type in ('payload', 'pdf', 'web_report', 'email')),
  check (artifact_status in ('draft', 'ready', 'sent', 'error', 'archived'))
);

create unique index if not exists fruitlife_360_responses_source_response_key
on public.fruitlife_360_responses (source_system, source_response_id)
where source_response_id is not null;

create index if not exists fruitlife_360_responses_session_id_idx
on public.fruitlife_360_responses (session_id);

create index if not exists fruitlife_360_responses_submitted_at_idx
on public.fruitlife_360_responses (submitted_at desc);

create index if not exists fruitlife_360_report_jobs_session_id_idx
on public.fruitlife_360_report_jobs (session_id);

create index if not exists fruitlife_360_report_jobs_status_idx
on public.fruitlife_360_report_jobs (job_status, queued_at);

create index if not exists fruitlife_360_report_artifacts_session_id_idx
on public.fruitlife_360_report_artifacts (session_id);

drop trigger if exists set_fruitlife_360_responses_updated_at
on public.fruitlife_360_responses;

create trigger set_fruitlife_360_responses_updated_at
before update on public.fruitlife_360_responses
for each row
execute function public.set_updated_at();

drop trigger if exists set_fruitlife_360_report_jobs_updated_at
on public.fruitlife_360_report_jobs;

create trigger set_fruitlife_360_report_jobs_updated_at
before update on public.fruitlife_360_report_jobs
for each row
execute function public.set_updated_at();

drop trigger if exists set_fruitlife_360_report_artifacts_updated_at
on public.fruitlife_360_report_artifacts;

create trigger set_fruitlife_360_report_artifacts_updated_at
before update on public.fruitlife_360_report_artifacts
for each row
execute function public.set_updated_at();

alter table public.fruitlife_360_responses enable row level security;
alter table public.fruitlife_360_report_jobs enable row level security;
alter table public.fruitlife_360_report_artifacts enable row level security;

create policy "students read own fruitlife responses"
on public.fruitlife_360_responses for select
to authenticated
using (
  exists (
    select 1
    from public.fruitlife_360_sessions
    where fruitlife_360_sessions.id = fruitlife_360_responses.session_id
      and (
        fruitlife_360_sessions.created_by_user_id = (select auth.uid())
        or exists (
          select 1
          from public.assessment_participants
          where assessment_participants.id = fruitlife_360_sessions.participant_id
            and assessment_participants.user_id = (select auth.uid())
        )
      )
  )
);

create policy "students read own fruitlife report jobs"
on public.fruitlife_360_report_jobs for select
to authenticated
using (
  exists (
    select 1
    from public.fruitlife_360_sessions
    where fruitlife_360_sessions.id = fruitlife_360_report_jobs.session_id
      and (
        fruitlife_360_sessions.created_by_user_id = (select auth.uid())
        or exists (
          select 1
          from public.assessment_participants
          where assessment_participants.id = fruitlife_360_sessions.participant_id
            and assessment_participants.user_id = (select auth.uid())
        )
      )
  )
);

create policy "students read own fruitlife artifacts"
on public.fruitlife_360_report_artifacts for select
to authenticated
using (
  exists (
    select 1
    from public.fruitlife_360_sessions
    where fruitlife_360_sessions.id = fruitlife_360_report_artifacts.session_id
      and (
        fruitlife_360_sessions.created_by_user_id = (select auth.uid())
        or exists (
          select 1
          from public.assessment_participants
          where assessment_participants.id = fruitlife_360_sessions.participant_id
            and assessment_participants.user_id = (select auth.uid())
        )
      )
  )
);
