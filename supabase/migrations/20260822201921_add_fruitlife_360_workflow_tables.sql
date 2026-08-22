create table if not exists public.fruitlife_360_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.assessment_participants(id) on delete cascade,
  source_participant_id text unique,
  participant_name text,
  participant_email text,
  session_status text not null default 'active',
  report_status text not null default 'not_started',
  report_snapshot_id uuid references public.assessment_snapshots(id) on delete set null,
  report_document_id text,
  report_url text,
  report_mode text,
  observer_goal integer not null default 0 check (observer_goal >= 0),
  observer_completed_count integer not null default 0 check (observer_completed_count >= 0),
  response_count integer not null default 0 check (response_count >= 0),
  source_system text not null default 'fruitlife_360',
  source_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (session_status in (
    'draft',
    'active',
    'waiting_for_self',
    'waiting_for_observers',
    'ready_for_report',
    'report_queued',
    'report_ready',
    'report_sent',
    'archived',
    'error'
  )),
  check (report_status in (
    'not_started',
    'waiting_for_responses',
    'queued',
    'generating',
    'ready',
    'sent',
    'error'
  ))
);

create table if not exists public.fruitlife_360_observer_invites (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fruitlife_360_sessions(id) on delete cascade,
  observer_name text,
  observer_email text,
  relationship_label text,
  invite_status text not null default 'draft',
  invite_token_hash text unique,
  source_response_id text,
  invited_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (invite_status in (
    'draft',
    'invited',
    'completed',
    'bounced',
    'declined',
    'expired',
    'error'
  ))
);

create index if not exists fruitlife_360_sessions_participant_id_idx
on public.fruitlife_360_sessions (participant_id);

create index if not exists fruitlife_360_sessions_source_synced_at_idx
on public.fruitlife_360_sessions (source_synced_at desc);

create index if not exists fruitlife_360_sessions_status_idx
on public.fruitlife_360_sessions (session_status, report_status);

create index if not exists fruitlife_360_observer_invites_session_id_idx
on public.fruitlife_360_observer_invites (session_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_fruitlife_360_sessions_updated_at
on public.fruitlife_360_sessions;

create trigger set_fruitlife_360_sessions_updated_at
before update on public.fruitlife_360_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists set_fruitlife_360_observer_invites_updated_at
on public.fruitlife_360_observer_invites;

create trigger set_fruitlife_360_observer_invites_updated_at
before update on public.fruitlife_360_observer_invites
for each row
execute function public.set_updated_at();

alter table public.fruitlife_360_sessions enable row level security;
alter table public.fruitlife_360_observer_invites enable row level security;

create policy "students read own fruitlife sessions"
on public.fruitlife_360_sessions for select
to authenticated
using (
  created_by_user_id = (select auth.uid())
  or exists (
    select 1
    from public.assessment_participants
    where assessment_participants.id = fruitlife_360_sessions.participant_id
      and assessment_participants.user_id = (select auth.uid())
  )
);

create policy "students read own fruitlife observer invites"
on public.fruitlife_360_observer_invites for select
to authenticated
using (
  exists (
    select 1
    from public.fruitlife_360_sessions
    where fruitlife_360_sessions.id = fruitlife_360_observer_invites.session_id
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
