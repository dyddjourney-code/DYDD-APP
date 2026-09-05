create table if not exists public.spiritual_gifts_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.assessment_participants(id) on delete cascade,
  participant_name text,
  participant_email text,
  session_status text not null default 'draft',
  report_status text not null default 'not_started',
  result_snapshot_id uuid references public.assessment_snapshots(id) on delete set null,
  intake_token_hash text unique,
  signup_source text,
  source_system text not null default 'spiritual_gifts_app',
  submitted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (session_status in (
    'draft',
    'active',
    'waiting_for_self',
    'completed',
    'archived',
    'error'
  )),
  check (report_status in (
    'not_started',
    'ready',
    'sent',
    'error'
  ))
);

create table if not exists public.spiritual_gifts_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.spiritual_gifts_sessions(id) on delete cascade,
  response_type text not null default 'self',
  participant_name text,
  participant_email text,
  source_system text not null default 'vercel_intake',
  source_response_id text,
  answers jsonb not null default '{}'::jsonb,
  gift_rank text[] not null default array[]::text[],
  derived_scores jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (response_type in ('self')),
  check (source_response_id is null or length(source_response_id) > 0)
);

create unique index if not exists spiritual_gifts_responses_source_response_key
on public.spiritual_gifts_responses (source_system, source_response_id)
where source_response_id is not null;

create index if not exists spiritual_gifts_sessions_participant_id_idx
on public.spiritual_gifts_sessions (participant_id);

create index if not exists spiritual_gifts_sessions_status_idx
on public.spiritual_gifts_sessions (session_status, report_status);

create index if not exists spiritual_gifts_responses_session_id_idx
on public.spiritual_gifts_responses (session_id);

create index if not exists spiritual_gifts_responses_submitted_at_idx
on public.spiritual_gifts_responses (submitted_at desc);

drop trigger if exists set_spiritual_gifts_sessions_updated_at
on public.spiritual_gifts_sessions;

create trigger set_spiritual_gifts_sessions_updated_at
before update on public.spiritual_gifts_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists set_spiritual_gifts_responses_updated_at
on public.spiritual_gifts_responses;

create trigger set_spiritual_gifts_responses_updated_at
before update on public.spiritual_gifts_responses
for each row
execute function public.set_updated_at();

alter table public.spiritual_gifts_sessions enable row level security;
alter table public.spiritual_gifts_responses enable row level security;

create policy "students read own spiritual gifts sessions"
on public.spiritual_gifts_sessions for select
to authenticated
using (
  created_by_user_id = (select auth.uid())
  or exists (
    select 1
    from public.assessment_participants
    where assessment_participants.id = spiritual_gifts_sessions.participant_id
      and assessment_participants.user_id = (select auth.uid())
  )
);

create policy "students read own spiritual gifts responses"
on public.spiritual_gifts_responses for select
to authenticated
using (
  exists (
    select 1
    from public.spiritual_gifts_sessions
    where spiritual_gifts_sessions.id = spiritual_gifts_responses.session_id
      and (
        spiritual_gifts_sessions.created_by_user_id = (select auth.uid())
        or exists (
          select 1
          from public.assessment_participants
          where assessment_participants.id = spiritual_gifts_sessions.participant_id
            and assessment_participants.user_id = (select auth.uid())
        )
      )
  )
);
