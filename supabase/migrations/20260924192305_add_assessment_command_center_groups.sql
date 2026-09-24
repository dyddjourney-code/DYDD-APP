create table if not exists public.assessment_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_type text not null default 'class_cohort' check (
    group_type in (
      'class_cohort',
      'camp_circle',
      'couple',
      'marriage_workshop',
      'church_team',
      'leadership_team',
      'other'
    )
  ),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  description text,
  status text not null default 'active' check (
    status in ('draft', 'active', 'completed', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.assessment_groups(id) on delete cascade,
  participant_id uuid not null references public.assessment_participants(id) on delete cascade,
  added_by_user_id uuid references auth.users(id) on delete set null,
  membership_status text not null default 'active' check (
    membership_status in ('active', 'archived', 'removed')
  ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, participant_id)
);

create index if not exists assessment_groups_owner_status_idx
on public.assessment_groups (owner_user_id, status, created_at desc);

create index if not exists assessment_group_members_group_idx
on public.assessment_group_members (group_id, membership_status, created_at desc);

create index if not exists assessment_group_members_participant_idx
on public.assessment_group_members (participant_id, membership_status);

drop trigger if exists set_assessment_groups_updated_at on public.assessment_groups;
create trigger set_assessment_groups_updated_at
before update on public.assessment_groups
for each row execute function public.set_updated_at();

drop trigger if exists set_assessment_group_members_updated_at on public.assessment_group_members;
create trigger set_assessment_group_members_updated_at
before update on public.assessment_group_members
for each row execute function public.set_updated_at();

alter table public.assessment_groups enable row level security;
alter table public.assessment_group_members enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assessment_groups'
      and policyname = 'owners create assessment groups'
  ) then
    create policy "owners create assessment groups"
    on public.assessment_groups for insert
    to authenticated
    with check (owner_user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assessment_groups'
      and policyname = 'owners read assessment groups'
  ) then
    create policy "owners read assessment groups"
    on public.assessment_groups for select
    to authenticated
    using (owner_user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assessment_groups'
      and policyname = 'owners update assessment groups'
  ) then
    create policy "owners update assessment groups"
    on public.assessment_groups for update
    to authenticated
    using (owner_user_id = (select auth.uid()))
    with check (owner_user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assessment_group_members'
      and policyname = 'owners read assessment group members'
  ) then
    create policy "owners read assessment group members"
    on public.assessment_group_members for select
    to authenticated
    using (
      exists (
        select 1
        from public.assessment_groups g
        where g.id = assessment_group_members.group_id
          and g.owner_user_id = (select auth.uid())
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assessment_group_members'
      and policyname = 'owners add assessment group members'
  ) then
    create policy "owners add assessment group members"
    on public.assessment_group_members for insert
    to authenticated
    with check (
      added_by_user_id = (select auth.uid())
      and exists (
        select 1
        from public.assessment_groups g
        where g.id = assessment_group_members.group_id
          and g.owner_user_id = (select auth.uid())
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'assessment_group_members'
      and policyname = 'owners update assessment group members'
  ) then
    create policy "owners update assessment group members"
    on public.assessment_group_members for update
    to authenticated
    using (
      exists (
        select 1
        from public.assessment_groups g
        where g.id = assessment_group_members.group_id
          and g.owner_user_id = (select auth.uid())
      )
    )
    with check (
      exists (
        select 1
        from public.assessment_groups g
        where g.id = assessment_group_members.group_id
          and g.owner_user_id = (select auth.uid())
      )
    );
  end if;
end;
$$;

grant select, insert, update on public.assessment_groups to authenticated;
grant select, insert, update on public.assessment_group_members to authenticated;
