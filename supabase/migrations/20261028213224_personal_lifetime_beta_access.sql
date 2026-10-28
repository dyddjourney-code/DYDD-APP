-- Additive personal lifetime access; no existing learner/payment records changed.
begin;
create table public.dydd_beta_access_codes (
 id uuid primary key default gen_random_uuid(),
 code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
 batch text not null,
 created_at timestamptz not null default now(),
 redeemed_by uuid references auth.users(id) on delete set null,
 redeemed_at timestamptz,
 check (redeemed_by is null or redeemed_at is not null)
);
create table public.dydd_personal_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 scope text not null default 'personal_all_access' check (scope = 'personal_all_access'),
 source_code_id uuid not null references public.dydd_beta_access_codes(id) on delete restrict,
 granted_at timestamptz not null default now()
);
create table public.dydd_beta_redemption_limits (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_started_at timestamptz not null default now(), attempts integer not null default 0
);
alter table public.dydd_beta_access_codes enable row level security;
alter table public.dydd_personal_access enable row level security;
alter table public.dydd_beta_redemption_limits enable row level security;
revoke all on public.dydd_beta_access_codes, public.dydd_personal_access, public.dydd_beta_redemption_limits from public, anon, authenticated;
grant all on public.dydd_beta_access_codes, public.dydd_personal_access, public.dydd_beta_redemption_limits to service_role;
-- Narrow private verifier: service_role cannot SELECT auth.users directly.
create schema if not exists dydd_private;
revoke all on schema dydd_private from public, anon, authenticated;
grant usage on schema dydd_private to service_role;
create function dydd_private.beta_account_verified(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select (auth.uid() is null or auth.uid()=p_user_id) and exists(
  select 1 from auth.users where id=p_user_id and email_confirmed_at is not null and deleted_at is null
 );
$$;
revoke all on function dydd_private.beta_account_verified(uuid) from public, anon, authenticated;
grant execute on function dydd_private.beta_account_verified(uuid) to service_role;
-- Server-only invoker: server authenticates account; DB independently checks confirmation.
create function public.redeem_dydd_beta_access(p_user_id uuid, p_code_hash text)
returns text language plpgsql security invoker set search_path = '' as $$
declare c public.dydd_beta_access_codes%rowtype; l public.dydd_beta_redemption_limits%rowtype;
begin
 if not dydd_private.beta_account_verified(p_user_id) then return 'unverified'; end if;
 insert into public.dydd_beta_redemption_limits(user_id) values(p_user_id) on conflict do nothing;
 select * into l from public.dydd_beta_redemption_limits where user_id=p_user_id for update;
 if l.window_started_at < now()-interval '15 minutes' then
  update public.dydd_beta_redemption_limits set window_started_at=now(),attempts=1 where user_id=p_user_id;
 elsif l.attempts >= 12 then return 'limited';
 else update public.dydd_beta_redemption_limits set attempts=attempts+1 where user_id=p_user_id;
 end if;
 select * into c from public.dydd_beta_access_codes where code_hash=p_code_hash for update;
 if not found then return 'invalid'; end if;
 if c.redeemed_by = p_user_id then return 'active'; end if;
 if c.redeemed_at is not null then return 'invalid'; end if;
 -- Do not burn another code for an account that already has lifetime access.
 if exists(select 1 from public.dydd_personal_access where user_id=p_user_id) then return 'already_active'; end if;
 insert into public.dydd_personal_access(user_id,source_code_id) values(p_user_id,c.id);
 update public.dydd_beta_access_codes set redeemed_by=p_user_id,redeemed_at=now() where id=c.id;
 return 'active';
end $$;
revoke all on function public.redeem_dydd_beta_access(uuid,text) from public,anon,authenticated;
grant execute on function public.redeem_dydd_beta_access(uuid,text) to service_role;
comment on table public.dydd_personal_access is 'Non-expiring account-bound personal tools, reports and courses. Not Circle seats or other peoples access; prerequisites/ownership/privacy/scoring remain required.';
commit;
