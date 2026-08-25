create table if not exists public.journey_groups (
  id uuid primary key default gen_random_uuid(),
  journey_slug text not null default 'discover-your-divine-design',
  name text not null,
  group_type text not null check (
    group_type in ('pair', 'couple', 'small_group', 'class_cohort')
  ),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  capacity_min integer not null default 2 check (capacity_min >= 1),
  capacity_max integer not null default 2 check (capacity_max >= capacity_min),
  privacy_mode text not null default 'individual_private_shared_summaries' check (
    privacy_mode in (
      'individual_private_shared_summaries',
      'couple_side_by_side_opt_in',
      'facilitator_summary_only'
    )
  ),
  status text not null default 'draft' check (
    status in ('draft', 'inviting', 'active', 'completed', 'archived')
  ),
  current_stage_slug text,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journey_group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.journey_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'participant' check (
    role in ('host', 'co_host', 'participant', 'facilitator')
  ),
  member_status text not null default 'active' check (
    member_status in ('invited', 'active', 'paused', 'left', 'removed')
  ),
  personal_visibility text not null default 'private' check (
    personal_visibility in ('private', 'shared_summary_only', 'couple_opt_in')
  ),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.journey_group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.journey_groups(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_email text not null,
  invitee_name text,
  role text not null default 'participant' check (
    role in ('co_host', 'participant', 'facilitator')
  ),
  invitation_status text not null default 'pending' check (
    invitation_status in ('pending', 'accepted', 'declined', 'expired', 'revoked')
  ),
  invitation_token uuid not null default gen_random_uuid(),
  expires_at timestamptz,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, invitee_email)
);

create table if not exists public.journey_group_stage_threads (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.journey_groups(id) on delete cascade,
  journey_slug text not null default 'discover-your-divine-design',
  stage_slug text not null,
  stage_order integer not null,
  stage_title text not null,
  thread_status text not null default 'planned' check (
    thread_status in ('planned', 'open', 'reviewing', 'complete', 'skipped')
  ),
  shared_prompt text not null,
  facilitator_notes text,
  opened_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, journey_slug, stage_slug)
);

create table if not exists public.journey_group_shared_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.journey_groups(id) on delete cascade,
  thread_id uuid references public.journey_group_stage_threads(id) on delete set null,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null default 'shared_summary' check (
    entry_type in ('shared_summary', 'group_learning', 'question', 'next_step', 'prayer', 'facilitator_note')
  ),
  content_text text not null,
  content_json jsonb not null default '{}'::jsonb,
  source_stage_slug text,
  source_subject_slug text,
  is_group_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journey_groups_host_idx
on public.journey_groups (host_user_id, status, journey_slug);

create index if not exists journey_group_memberships_user_idx
on public.journey_group_memberships (user_id, member_status);

create index if not exists journey_group_memberships_group_idx
on public.journey_group_memberships (group_id, role, member_status);

create index if not exists journey_group_invitations_invitee_idx
on public.journey_group_invitations (lower(invitee_email), invitation_status);

create index if not exists journey_group_stage_threads_group_stage_idx
on public.journey_group_stage_threads (group_id, stage_order, stage_slug);

create index if not exists journey_group_shared_entries_group_thread_idx
on public.journey_group_shared_entries (group_id, thread_id, created_at);

create index if not exists journey_group_shared_entries_author_idx
on public.journey_group_shared_entries (author_user_id, created_at);

drop trigger if exists set_journey_groups_updated_at on public.journey_groups;
create trigger set_journey_groups_updated_at
before update on public.journey_groups
for each row execute function public.set_updated_at();

drop trigger if exists set_journey_group_memberships_updated_at on public.journey_group_memberships;
create trigger set_journey_group_memberships_updated_at
before update on public.journey_group_memberships
for each row execute function public.set_updated_at();

drop trigger if exists set_journey_group_invitations_updated_at on public.journey_group_invitations;
create trigger set_journey_group_invitations_updated_at
before update on public.journey_group_invitations
for each row execute function public.set_updated_at();

drop trigger if exists set_journey_group_stage_threads_updated_at on public.journey_group_stage_threads;
create trigger set_journey_group_stage_threads_updated_at
before update on public.journey_group_stage_threads
for each row execute function public.set_updated_at();

drop trigger if exists set_journey_group_shared_entries_updated_at on public.journey_group_shared_entries;
create trigger set_journey_group_shared_entries_updated_at
before update on public.journey_group_shared_entries
for each row execute function public.set_updated_at();

create or replace view public.journey_group_control_records
with (security_invoker = true)
as
select
  g.id as group_id,
  g.journey_slug,
  g.name,
  g.group_type,
  g.host_user_id,
  g.capacity_min,
  g.capacity_max,
  g.privacy_mode,
  g.status,
  g.current_stage_slug,
  count(distinct m.id) filter (where m.member_status in ('active', 'invited')) as member_count,
  count(distinct i.id) filter (where i.invitation_status = 'pending') as pending_invitation_count,
  count(distinct t.id) filter (where t.thread_status = 'complete') as completed_stage_count,
  max(coalesce(e.updated_at, t.updated_at, g.updated_at)) as last_activity_at
from public.journey_groups g
left join public.journey_group_memberships m on m.group_id = g.id
left join public.journey_group_invitations i on i.group_id = g.id
left join public.journey_group_stage_threads t on t.group_id = g.id
left join public.journey_group_shared_entries e on e.group_id = g.id
group by g.id;

alter table public.journey_groups enable row level security;
alter table public.journey_group_memberships enable row level security;
alter table public.journey_group_invitations enable row level security;
alter table public.journey_group_stage_threads enable row level security;
alter table public.journey_group_shared_entries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_groups'
      and policyname = 'hosts create own journey groups'
  ) then
    create policy "hosts create own journey groups"
    on public.journey_groups for insert
    to authenticated
    with check ((select auth.uid()) = host_user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_groups'
      and policyname = 'members read journey groups'
  ) then
    create policy "members read journey groups"
    on public.journey_groups for select
    to authenticated
    using (
      host_user_id = (select auth.uid())
      or exists (
        select 1
        from public.journey_group_memberships m
        where m.group_id = journey_groups.id
          and m.user_id = (select auth.uid())
          and m.member_status in ('active', 'invited', 'paused')
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_groups'
      and policyname = 'hosts update own journey groups'
  ) then
    create policy "hosts update own journey groups"
    on public.journey_groups for update
    to authenticated
    using (host_user_id = (select auth.uid()))
    with check (host_user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_memberships'
      and policyname = 'members read own group memberships'
  ) then
    create policy "members read own group memberships"
    on public.journey_group_memberships for select
    to authenticated
    using (user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_memberships'
      and policyname = 'members update own visibility'
  ) then
    create policy "members update own visibility"
    on public.journey_group_memberships for update
    to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_invitations'
      and policyname = 'hosts create group invitations'
  ) then
    create policy "hosts create group invitations"
    on public.journey_group_invitations for insert
    to authenticated
    with check (created_by_user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_invitations'
      and policyname = 'hosts and invitees read group invitations'
  ) then
    create policy "hosts and invitees read group invitations"
    on public.journey_group_invitations for select
    to authenticated
    using (
      created_by_user_id = (select auth.uid())
      or lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_invitations'
      and policyname = 'hosts and invitees update group invitations'
  ) then
    create policy "hosts and invitees update group invitations"
    on public.journey_group_invitations for update
    to authenticated
    using (
      created_by_user_id = (select auth.uid())
      or lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    )
    with check (
      created_by_user_id = (select auth.uid())
      or lower(invitee_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_stage_threads'
      and policyname = 'members read group stage threads'
  ) then
    create policy "members read group stage threads"
    on public.journey_group_stage_threads for select
    to authenticated
    using (
      exists (
        select 1
        from public.journey_group_memberships m
        where m.group_id = journey_group_stage_threads.group_id
          and m.user_id = (select auth.uid())
          and m.member_status in ('active', 'invited', 'paused')
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_stage_threads'
      and policyname = 'members create group stage threads'
  ) then
    create policy "members create group stage threads"
    on public.journey_group_stage_threads for insert
    to authenticated
    with check (
      exists (
        select 1
        from public.journey_group_memberships m
        where m.group_id = journey_group_stage_threads.group_id
          and m.user_id = (select auth.uid())
          and m.role in ('host', 'co_host', 'facilitator')
          and m.member_status = 'active'
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_stage_threads'
      and policyname = 'hosts update group stage threads'
  ) then
    create policy "hosts update group stage threads"
    on public.journey_group_stage_threads for update
    to authenticated
    using (
      exists (
        select 1
        from public.journey_group_memberships m
        where m.group_id = journey_group_stage_threads.group_id
          and m.user_id = (select auth.uid())
          and m.role in ('host', 'co_host', 'facilitator')
          and m.member_status = 'active'
      )
    )
    with check (
      exists (
        select 1
        from public.journey_group_memberships m
        where m.group_id = journey_group_stage_threads.group_id
          and m.user_id = (select auth.uid())
          and m.role in ('host', 'co_host', 'facilitator')
          and m.member_status = 'active'
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_shared_entries'
      and policyname = 'members read group shared entries'
  ) then
    create policy "members read group shared entries"
    on public.journey_group_shared_entries for select
    to authenticated
    using (
      exists (
        select 1
        from public.journey_group_memberships m
        where m.group_id = journey_group_shared_entries.group_id
          and m.user_id = (select auth.uid())
          and m.member_status in ('active', 'paused')
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_shared_entries'
      and policyname = 'members create own shared entries'
  ) then
    create policy "members create own shared entries"
    on public.journey_group_shared_entries for insert
    to authenticated
    with check (
      author_user_id = (select auth.uid())
      and exists (
        select 1
        from public.journey_group_memberships m
        where m.group_id = journey_group_shared_entries.group_id
          and m.user_id = (select auth.uid())
          and m.member_status = 'active'
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'journey_group_shared_entries'
      and policyname = 'authors update own shared entries'
  ) then
    create policy "authors update own shared entries"
    on public.journey_group_shared_entries for update
    to authenticated
    using (author_user_id = (select auth.uid()))
    with check (author_user_id = (select auth.uid()));
  end if;
end;
$$;

grant select, insert, update on public.journey_groups to authenticated;
grant select, insert, update on public.journey_group_memberships to authenticated;
grant select, insert, update on public.journey_group_invitations to authenticated;
grant select, insert, update on public.journey_group_stage_threads to authenticated;
grant select, insert, update on public.journey_group_shared_entries to authenticated;
grant select on public.journey_group_control_records to authenticated;
