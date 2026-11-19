-- Additive owner-only references; original guest/native evidence is never copied or changed.
create table public.assessment_group_guest_members (
 id uuid primary key default gen_random_uuid(),
 group_id uuid not null references public.assessment_groups(id),
 session_id uuid not null references public.dydd_guest_sessions(id),
 added_by_user_id uuid not null references auth.users(id),
 membership_status text not null default 'active' check (membership_status in ('active','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(group_id,session_id)
);
alter table public.assessment_group_guest_members enable row level security;
revoke all on public.assessment_group_guest_members from public, anon, authenticated;
grant all on public.assessment_group_guest_members to service_role;
-- Atomic mixed assignment: validate the entire selection before any writes.
create function public.owner_assign_guest_couple_members(p_group uuid,p_actor uuid,p_members text[])
returns void language plpgsql security invoker set search_path = public as $$
declare member text; session uuid;
begin
 if not exists(select 1 from assessment_groups where id=p_group and status='active') then
  raise exception 'Guest members can only be assigned to an active group.';
 end if;
 foreach member in array p_members loop
  if member like 'guest:%' then
   session := substring(member from 7)::uuid;
   if not exists(select 1 from dydd_guest_results r join dydd_guest_orders o on o.id=r.order_id
     where r.session_id=session and r.product in ('designid','designpd') and r.scores <> '{}'::jsonb and o.status='paid') then
    raise exception 'Guest has no eligible saved assessment result.';
   end if;
  elsif not exists(select 1 from assessment_participants where id=member::uuid) then
   raise exception 'Participant does not exist.';
  end if;
 end loop;
 foreach member in array p_members loop
  if member like 'guest:%' then
   insert into assessment_group_guest_members(group_id,session_id,added_by_user_id)
    values(p_group,substring(member from 7)::uuid,p_actor)
    on conflict(group_id,session_id) do update set membership_status='active',added_by_user_id=p_actor,updated_at=now();
  else
   insert into assessment_group_members(group_id,participant_id,added_by_user_id,membership_status)
    values(p_group,member::uuid,p_actor,'active')
    on conflict(group_id,participant_id) do update set membership_status='active',added_by_user_id=p_actor,updated_at=now();
  end if;
 end loop;
end $$;
revoke all on function public.owner_assign_guest_couple_members(uuid,uuid,text[]) from public, anon, authenticated;
grant execute on function public.owner_assign_guest_couple_members(uuid,uuid,text[]) to service_role;
notify pgrst, 'reload schema';
