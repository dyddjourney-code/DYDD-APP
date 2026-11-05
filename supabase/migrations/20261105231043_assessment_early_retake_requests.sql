-- Auth is outside the Data API roles' table privileges. Narrow service-only lookup.
create schema if not exists dydd_private;
create or replace function dydd_private.retake_verified_email(p_user uuid) returns text
language sql stable security definer set search_path='' as $$
 select lower(email) from auth.users where id=p_user and email_confirmed_at is not null
$$;
revoke all on function dydd_private.retake_verified_email(uuid) from public,anon,authenticated;
grant usage on schema dydd_private to service_role;
grant execute on function dydd_private.retake_verified_email(uuid) to service_role;
-- Additive isolated-sandbox workflow. Core policy consumes these one-use grants.
create table if not exists public.dydd_assessment_retake_grants (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 assessment_type text not null check(assessment_type in ('designid','spiritual_gifts','fruitful_self')),
 request_id uuid unique not null, source_snapshot_id uuid, expires_at timestamptz not null,
 used_at timestamptz, created_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
alter table public.dydd_assessment_retake_grants enable row level security;
revoke all on public.dydd_assessment_retake_grants from public,anon,authenticated;
grant all on public.dydd_assessment_retake_grants to service_role;
create table public.dydd_assessment_retake_requests (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 assessment_type text not null check(assessment_type in ('designid','spiritual_gifts','fruitful_self')),
 source_snapshot_id uuid, happened text not null check(length(happened) between 10 and 2000),
 understood text not null check(length(understood) between 10 and 2000),
 next_eligible_label text not null, status text not null default 'pending' check(status in ('pending','approved','declined')),
 token_hash text not null check(length(token_hash)=64), token_expires_at timestamptz not null,
 created_at timestamptz not null default now(), decided_at timestamptz, decided_by uuid references auth.users(id), decision_reason text
);
create unique index dydd_retake_one_pending on public.dydd_assessment_retake_requests(user_id,assessment_type) where status='pending';
create index dydd_retake_request_throttle on public.dydd_assessment_retake_requests(user_id,created_at desc);
create table public.dydd_assessment_retake_outbox (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.dydd_assessment_retake_requests(id) on delete cascade,
 kind text not null check(kind in ('owner','decision')), payload jsonb not null,
 status text not null default 'pending' check(status in ('pending','accepted','failed','blocked')),
 provider_id text, error_message text, attempts integer not null default 0, last_attempt_at timestamptz,
 created_at timestamptz not null default now(), unique(request_id,kind)
);
alter table public.dydd_assessment_retake_requests enable row level security;
alter table public.dydd_assessment_retake_outbox enable row level security;
revoke all on public.dydd_assessment_retake_requests,public.dydd_assessment_retake_outbox from public,anon,authenticated;
grant all on public.dydd_assessment_retake_requests,public.dydd_assessment_retake_outbox to service_role;

create or replace function public.dydd_request_assessment_retake(p_id uuid,p_user uuid,p_type text,p_source uuid,p_happened text,p_understood text,p_next text,p_hash text,p_mail jsonb)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare existing uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('retake-request:'||p_user::text,0));
 if dydd_private.retake_verified_email(p_user) is null then raise exception 'Verified account required'; end if;
 select id into existing from public.dydd_assessment_retake_requests where user_id=p_user and assessment_type=p_type and status='pending';
 if existing is not null then return existing; end if;
 if exists(select 1 from public.dydd_assessment_retake_requests where user_id=p_user and created_at>now()-interval '24 hours') then raise exception 'Please wait 24 hours before another request'; end if;
 insert into public.dydd_assessment_retake_requests(id,user_id,assessment_type,source_snapshot_id,happened,understood,next_eligible_label,token_hash,token_expires_at)
 values(p_id,p_user,p_type,p_source,p_happened,p_understood,p_next,p_hash,now()+interval '7 days');
 insert into public.dydd_assessment_retake_outbox(request_id,kind,payload) values(p_id,'owner',p_mail);
 return p_id;
end $$;

create or replace function public.dydd_decide_assessment_retake(p_id uuid,p_actor uuid,p_hash text,p_decision text,p_reason text,p_mail jsonb)
returns uuid language plpgsql security invoker set search_path=public,pg_temp as $$
declare req public.dydd_assessment_retake_requests;
begin
 -- Independently verify the designated sandbox owner from Auth, not user metadata or preview cookies.
 if dydd_private.retake_verified_email(p_actor) is distinct from 'dyddjourney@gmail.com' then raise exception 'Verified sandbox owner required'; end if;
 select * into req from public.dydd_assessment_retake_requests where id=p_id for update;
 if not found or req.token_hash<>p_hash or req.token_expires_at<=now() then raise exception 'Invalid or expired decision link'; end if;
 if req.status<>'pending' then raise exception 'Request already decided'; end if;
 if p_decision not in ('approved','declined') or length(p_reason) not between 1 and 1000 then raise exception 'Invalid decision'; end if;
 if p_decision='approved' then
 insert into public.dydd_assessment_retake_grants(user_id,assessment_type,request_id,source_snapshot_id,expires_at,created_by)
 values(req.user_id,req.assessment_type,req.id,req.source_snapshot_id,now()+interval '30 days',p_actor);
 end if;
 update public.dydd_assessment_retake_requests set status=p_decision,decision_reason=p_reason,decided_at=now(),decided_by=p_actor where id=p_id;
 insert into public.dydd_assessment_retake_outbox(request_id,kind,payload) values(p_id,'decision',p_mail);
 return p_id;
end $$;
revoke all on function public.dydd_request_assessment_retake(uuid,uuid,text,uuid,text,text,text,text,jsonb),public.dydd_decide_assessment_retake(uuid,uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.dydd_request_assessment_retake(uuid,uuid,text,uuid,text,text,text,text,jsonb),public.dydd_decide_assessment_retake(uuid,uuid,text,text,text,jsonb) to service_role;
