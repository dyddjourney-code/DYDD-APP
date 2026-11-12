-- Additive ownership only: no contact matching, rescoring, copied snapshots or entitlement grants.
begin;
create table public.dydd_guest_account_links (
 session_id uuid primary key references public.dydd_guest_sessions(id),
 user_id uuid not null references auth.users(id) on delete restrict,
 linked_at timestamptz not null default now(),
 proof_method text not null default 'verified_auth_and_guest_cookie' check(proof_method='verified_auth_and_guest_cookie')
);
create index dydd_guest_account_links_user_idx on public.dydd_guest_account_links(user_id);
create table public.dydd_guest_account_link_audit (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null unique references public.dydd_guest_sessions(id),
 user_id uuid not null references auth.users(id) on delete restrict,
 event text not null check(event='linked'),
 occurred_at timestamptz not null default now(),
 guest_contact_email text not null,
 verified_account_email text not null,
 proof_method text not null check(proof_method='verified_auth_and_guest_cookie')
);
create index dydd_guest_account_link_audit_user_idx on public.dydd_guest_account_link_audit(user_id);
alter table public.dydd_guest_account_links enable row level security;
alter table public.dydd_guest_account_link_audit enable row level security;
revoke all on public.dydd_guest_account_links,public.dydd_guest_account_link_audit from public,anon,authenticated,service_role;
grant select on public.dydd_guest_account_links,public.dydd_guest_account_link_audit to service_role;
create function public.dydd_guest_link_immutable() returns trigger
language plpgsql security invoker set search_path='' as $$
begin raise exception 'Guest account ownership and its audit are immutable'; end $$;
revoke all on function public.dydd_guest_link_immutable() from public,anon,authenticated;
create trigger dydd_guest_account_links_immutable before update or delete on public.dydd_guest_account_links
 for each row execute function public.dydd_guest_link_immutable();
create trigger dydd_guest_account_link_audit_immutable before update or delete on public.dydd_guest_account_link_audit
 for each row execute function public.dydd_guest_link_immutable();
-- The sole mutation API is service-only. SECURITY DEFINER is narrowly required to
-- check auth.users without granting the service general reads of Auth data, and to
-- insert into otherwise read-only link/audit tables. Never callable by browser roles.
-- p_user must come from server auth.getUser(); p_hash from the HttpOnly guest cookie.
create function public.dydd_guest_link_verified_account(p_session uuid,p_user uuid,p_hash text)
returns uuid language plpgsql security definer set search_path='' as $$
declare s public.dydd_guest_sessions%rowtype; account_email text; linked_user uuid;
begin
 if coalesce(current_setting('role',true),'') <> 'service_role' then raise exception 'Trusted server required'; end if;
 if p_user is null or p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then raise exception 'Verified account and valid guest capability required'; end if;
 select email into account_email from auth.users
 where id=p_user and email_confirmed_at is not null and coalesce(is_anonymous,false)=false
 and (banned_until is null or banned_until<=now()) for share;
 if not found or coalesce(account_email,'')='' then raise exception 'Verified account required'; end if;
 select * into s from public.dydd_guest_sessions where id=p_session for update;
 if not found or s.capability_hash<>p_hash or s.expires_at<=now() then raise exception 'Valid guest capability required'; end if;
 select user_id into linked_user from public.dydd_guest_account_links where session_id=p_session;
 if found then
  if linked_user<>p_user then raise exception 'This guest session is already linked to another account'; end if;
  return p_session;
 end if;
 insert into public.dydd_guest_account_links(session_id,user_id) values(p_session,p_user);
 insert into public.dydd_guest_account_link_audit(session_id,user_id,event,guest_contact_email,verified_account_email,proof_method)
 values(p_session,p_user,'linked',s.participant_email,account_email,'verified_auth_and_guest_cookie');
 return p_session;
end $$;
revoke all on function public.dydd_guest_link_verified_account(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.dydd_guest_link_verified_account(uuid,uuid,text) to service_role;
commit;
