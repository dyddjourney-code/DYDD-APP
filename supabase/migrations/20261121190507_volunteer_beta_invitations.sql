-- Owner-issued volunteer invitations reuse the existing lifetime entitlement ledger.
-- Original ten unbound codes, assessment grants and sync paths are preserved.
begin;
alter table public.dydd_beta_access_codes
 add column recipient_email text,
 add column recipient_name text,
 add column created_by uuid references auth.users(id) on delete set null,
 add column revoked_at timestamptz,
 add column invitation_job_id uuid,
 add constraint beta_recipient_email_valid check (recipient_email is null or (recipient_email=lower(btrim(recipient_email)) and length(recipient_email)<=254 and recipient_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')),
 add constraint beta_recipient_name_valid check (recipient_name is null or (length(recipient_name) between 1 and 120 and recipient_name !~ E'[\r\n]'));
create unique index dydd_beta_pending_recipient on public.dydd_beta_access_codes(recipient_email)
 where recipient_email is not null and revoked_at is null and redeemed_at is null;
create table public.dydd_beta_checklist (
 id boolean primary key default true check(id),
 filename text not null check(length(filename) between 1 and 160),
 content_base64 text not null check(length(content_base64) between 1 and 2796204),
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 byte_size integer not null check(byte_size between 1 and 2097152),
 updated_by uuid not null references auth.users(id),
 updated_at timestamptz not null default now()
);
alter table public.dydd_beta_checklist enable row level security;
revoke all on public.dydd_beta_checklist from public,anon,authenticated;
grant all on public.dydd_beta_checklist to service_role;
-- Auth email is read only by this narrow, service-only private verifier.
create function dydd_private.beta_recipient_matches(p_user_id uuid,p_email text)
returns boolean language sql stable security definer set search_path='' as $$
 select (auth.uid() is null or auth.uid()=p_user_id) and exists (
  select 1 from auth.users where id=p_user_id and email_confirmed_at is not null
   and deleted_at is null and is_anonymous is not true and lower(btrim(email))=p_email
 );
$$;
revoke all on function dydd_private.beta_recipient_matches(uuid,text) from public,anon,authenticated;
grant execute on function dydd_private.beta_recipient_matches(uuid,text) to service_role;
create or replace function public.redeem_dydd_beta_access(p_user_id uuid, p_code_hash text)
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
 if not found or c.revoked_at is not null then return 'invalid'; end if;
 if c.recipient_email is not null and not dydd_private.beta_recipient_matches(p_user_id,c.recipient_email) then return 'invalid'; end if;
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

-- All existing application workers pass through this persisted submission fence.
-- Fail closed for this new mail type even on the unchanged published worker.
create function dydd_private.beta_welcome_send_fence() returns trigger
language plpgsql security invoker set search_path='' as $$
declare c public.dydd_beta_access_codes; a jsonb;
begin
 if new.context->'deliveryContext'->>'type'='volunteer_beta_welcome' and new.status='submitting' then
  select * into c from public.dydd_beta_access_codes
   where id=(new.context->'deliveryContext'->>'betaCodeId')::uuid for share;
  a=new.context->'senderInput'->'attachments';
  if c.id is null or c.revoked_at is not null or c.redeemed_at is not null
   or c.recipient_email is distinct from new.email
   or c.invitation_job_id is distinct from (new.context->'deliveryContext'->>'invitationRequestId')::uuid
   or jsonb_typeof(a) is distinct from 'array' or jsonb_array_length(a)<>1
   or not exists(select 1 from public.dydd_beta_checklist where filename=a->0->>'filename'
      and sha256=new.context->'deliveryContext'->>'checklistSha256'
      and content_base64=a->0->>'content') then
   raise exception 'Volunteer welcome is no longer eligible; review recipient, code and checklist';
  end if;
 end if;
 return new;
end $$;
revoke all on function dydd_private.beta_welcome_send_fence() from public,anon,authenticated;
grant execute on function dydd_private.beta_welcome_send_fence() to service_role;
create trigger dydd_beta_welcome_send_fence before update of status on public.dydd_lifecycle_jobs
 for each row execute function dydd_private.beta_welcome_send_fence();
comment on table public.dydd_beta_checklist is 'Owner supplied volunteer beta checklist, private attachment only. No invented content; no default row.';
commit;
