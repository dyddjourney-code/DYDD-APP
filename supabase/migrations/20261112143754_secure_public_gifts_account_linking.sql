-- No historical ownership/contact rewrites. Public Gifts claims are explicit and additive.
begin;
create table public.dydd_gifts_account_links (
 session_id uuid primary key references public.spiritual_gifts_sessions(id) on delete restrict,
 snapshot_id uuid not null unique references public.assessment_snapshots(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 linked_at timestamptz not null default now(),
 proof_method text not null default 'verified_auth_and_gifts_token'
  check(proof_method='verified_auth_and_gifts_token')
);
create index dydd_gifts_account_links_user_idx on public.dydd_gifts_account_links(user_id);
create table public.dydd_gifts_account_link_audit (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null unique references public.dydd_gifts_account_links(session_id) on delete restrict,
 snapshot_id uuid not null references public.assessment_snapshots(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 contact_email text,
 verified_account_email text not null,
 event text not null default 'linked' check(event='linked'),
 proof_method text not null default 'verified_auth_and_gifts_token' check(proof_method='verified_auth_and_gifts_token'),
 occurred_at timestamptz not null default now()
);
alter table public.dydd_gifts_account_links enable row level security;
alter table public.dydd_gifts_account_link_audit enable row level security;
revoke all on public.dydd_gifts_account_links,public.dydd_gifts_account_link_audit from public,anon,authenticated,service_role;
grant select on public.dydd_gifts_account_links,public.dydd_gifts_account_link_audit to service_role;
create function public.dydd_gifts_link_immutable() returns trigger language plpgsql security invoker set search_path='' as $$
begin raise exception 'Spiritual Gifts account link and audit are immutable'; end $$;
revoke all on function public.dydd_gifts_link_immutable() from public,anon,authenticated;
create trigger dydd_gifts_account_links_immutable before update or delete on public.dydd_gifts_account_links
 for each row execute function public.dydd_gifts_link_immutable();
create trigger dydd_gifts_account_link_audit_immutable before update or delete on public.dydd_gifts_account_link_audit
 for each row execute function public.dydd_gifts_link_immutable();
-- Service-only atomic mutation. Server derives p_user from Auth getUser(), never form input.
create function public.dydd_gifts_link_verified_account(p_session uuid,p_user uuid,p_hash text)
returns uuid language plpgsql security definer set search_path='' as $$
declare s public.spiritual_gifts_sessions%rowtype; account_email text; linked_user uuid; snap_owner uuid; snap_type text;
begin
 if coalesce(current_setting('role',true),'') <> 'service_role' then raise exception 'Trusted server required'; end if;
 if p_user is null or p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then raise exception 'Verified account and Gifts capability required'; end if;
 select email into account_email from auth.users where id=p_user and email_confirmed_at is not null
  and coalesce(is_anonymous,false)=false and (banned_until is null or banned_until<=now()) for share;
 if not found or coalesce(account_email,'')='' then raise exception 'Verified account required'; end if;
 select * into s from public.spiritual_gifts_sessions where id=p_session for update;
 if not found or s.intake_token_hash is distinct from p_hash or s.metadata->>'channel' is distinct from 'public_assessment'
  or s.submitted_at is null or s.result_snapshot_id is null or s.session_status<>'completed'
 then raise exception 'Completed public Gifts capability required'; end if;
 select user_id,assessment_type into snap_owner,snap_type from public.assessment_snapshots where id=s.result_snapshot_id for share;
 if not found or snap_type<>'spiritual_gifts' then raise exception 'Gifts result required'; end if;
 -- Respect historical explicit owners; do not transfer or infer ownership from contact email.
 if (s.created_by_user_id is not null and s.created_by_user_id<>p_user) or (snap_owner is not null and snap_owner<>p_user)
 then raise exception 'This result already belongs to another account'; end if;
 select user_id into linked_user from public.dydd_gifts_account_links where session_id=p_session;
 if found then
  if linked_user<>p_user then raise exception 'This result is already linked to another account'; end if;
  return p_session;
 end if;
 insert into public.dydd_gifts_account_links(session_id,snapshot_id,user_id) values(s.id,s.result_snapshot_id,p_user);
 insert into public.dydd_gifts_account_link_audit(session_id,snapshot_id,user_id,contact_email,verified_account_email)
 values(s.id,s.result_snapshot_id,p_user,s.participant_email,account_email);
 return p_session;
end $$;
revoke all on function public.dydd_gifts_link_verified_account(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.dydd_gifts_link_verified_account(uuid,uuid,text) to service_role;

-- Prevent existing participant-based RLS from turning a typed public contact address
-- into Auth ownership. Private definer helpers avoid RLS recursion; identity is auth.uid(),
-- never a caller-supplied user ID. Existing permissive native policies remain in force.
create schema if not exists dydd_private;
revoke all on schema dydd_private from public,anon,authenticated;
grant usage on schema dydd_private to authenticated;
create function dydd_private.gifts_snapshot_allowed(p_snapshot uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select not exists (
  select 1 from public.assessment_snapshots a
  where a.id=p_snapshot and a.assessment_type='spiritual_gifts'
   and (a.scores->>'channel'='public_assessment' or exists (
    select 1 from public.spiritual_gifts_sessions s where s.result_snapshot_id=a.id and s.metadata->>'channel'='public_assessment'))
   and a.user_id is distinct from auth.uid()
   and (a.user_id is not null or not exists(select 1 from public.dydd_gifts_account_links l where l.snapshot_id=a.id and l.user_id=auth.uid()))
 )
$$;
create function dydd_private.gifts_session_allowed(p_session uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select not exists (
  select 1 from public.spiritual_gifts_sessions s where s.id=p_session and s.metadata->>'channel'='public_assessment'
   and s.created_by_user_id is distinct from auth.uid()
   and (s.created_by_user_id is not null or not exists(select 1 from public.dydd_gifts_account_links l where l.session_id=s.id and l.user_id=auth.uid()))
 )
$$;
revoke all on function dydd_private.gifts_snapshot_allowed(uuid),dydd_private.gifts_session_allowed(uuid) from public,anon;
grant execute on function dydd_private.gifts_snapshot_allowed(uuid),dydd_private.gifts_session_allowed(uuid) to authenticated;
create policy "public Gifts require explicit snapshot ownership" on public.assessment_snapshots as restrictive for select to authenticated
 using (dydd_private.gifts_snapshot_allowed(id));
create policy "public Gifts require explicit session ownership" on public.spiritual_gifts_sessions as restrictive for select to authenticated
 using (dydd_private.gifts_session_allowed(id));
create policy "public Gifts responses require explicit session ownership" on public.spiritual_gifts_responses as restrictive for select to authenticated
 using (dydd_private.gifts_session_allowed(session_id));
commit;
