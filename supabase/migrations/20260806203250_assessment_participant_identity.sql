create table if not exists public.assessment_participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  normalized_email text unique,
  dydd_participant_key text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    user_id is not null
    or normalized_email is not null
    or dydd_participant_key is not null
  )
);

alter table public.assessment_snapshots
  alter column user_id drop not null,
  add column if not exists participant_id uuid references public.assessment_participants(id) on delete cascade,
  add column if not exists source_response_id text,
  add column if not exists source_submitted_at timestamptz,
  add column if not exists sync_batch_id text;

update public.assessment_snapshots
set source_submitted_at = created_at
where source_submitted_at is null;

create unique index if not exists assessment_snapshots_source_response_key
on public.assessment_snapshots (assessment_type, source, source_response_id);

create index if not exists assessment_snapshots_participant_id_idx
on public.assessment_snapshots (participant_id);

create index if not exists assessment_snapshots_source_submitted_at_idx
on public.assessment_snapshots (source_submitted_at desc);

alter table public.assessment_participants enable row level security;

create policy "participants are visible to linked users"
on public.assessment_participants for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "students read own assessments"
on public.assessment_snapshots;

create policy "students read linked assessments"
on public.assessment_snapshots for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.assessment_participants
    where assessment_participants.id = assessment_snapshots.participant_id
      and assessment_participants.user_id = (select auth.uid())
  )
);
