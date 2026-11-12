begin;
-- Separate from report resends/abandonment. No account identity or report mutation.
create table public.dydd_guest_recovery_requests (
 id uuid primary key,
 email_hash text not null check(email_hash ~ '^[0-9a-f]{64}$'),
 requester_hash text not null check(requester_hash ~ '^[0-9a-f]{64}$'),
 product text not null check(product in ('designid','designpd')),
 session_id uuid references public.dydd_guest_sessions(id),
 token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '30 minutes',
 used_at timestamptz
);
create index dydd_guest_recovery_email_idx on public.dydd_guest_recovery_requests(email_hash,created_at desc);
create index dydd_guest_recovery_requester_idx on public.dydd_guest_recovery_requests(requester_hash,created_at desc);
create index dydd_guest_recovery_session_idx on public.dydd_guest_recovery_requests(session_id);
alter table public.dydd_guest_recovery_requests enable row level security;
revoke all on public.dydd_guest_recovery_requests from public,anon,authenticated;
grant all on public.dydd_guest_recovery_requests to service_role;

create function public.dydd_guest_reserve_recovery(p_id uuid,p_email text,p_email_hash text,p_requester_hash text,p_product text,p_token_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare prior public.dydd_guest_recovery_requests%rowtype; sid uuid;
begin
 if p_id is null or p_email is null or length(p_email)>254 or p_product is null or p_product not in ('designid','designpd')
 or coalesce(p_email_hash,'') !~ '^[0-9a-f]{64}$' or coalesce(p_requester_hash,'') !~ '^[0-9a-f]{64}$'
 or coalesce(p_token_hash,'') !~ '^[0-9a-f]{64}$' then return null;end if;
 -- All requests (including unknown email) share identical durable rate-limit rules.
 perform pg_advisory_xact_lock(hashtextextended('guest-recovery-requester:'||p_requester_hash,0));
 perform pg_advisory_xact_lock(hashtextextended('guest-recovery-email:'||p_email_hash,0));
 select * into prior from public.dydd_guest_recovery_requests where email_hash=p_email_hash order by created_at desc limit 1;
 if found and prior.created_at>now()-interval '15 minutes' then
  if prior.product=p_product and prior.used_at is null and prior.expires_at>now() then return to_jsonb(prior);end if;
  return null;
 end if;
 if (select count(*) from public.dydd_guest_recovery_requests where email_hash=p_email_hash and created_at>now()-interval '24 hours')>=3
 or (select count(*) from public.dydd_guest_recovery_requests where requester_hash=p_requester_hash and created_at>now()-interval '1 hour')>=10 then return null;end if;
 -- Prefer the latest exact saved DesignID. A pending/paid incomplete ID purchase is
 -- also recoverable, but never outranks a completed ID. Do not query account data.
 select s.id into sid from public.dydd_guest_sessions s join public.dydd_guest_orders o on o.session_id=s.id
 left join public.dydd_guest_results r on r.order_id=o.id and r.session_id=s.id and r.product='designid'
 where lower(btrim(s.participant_email))=lower(btrim(p_email)) and s.expires_at>now()
 and o.product='designid' and (public.dydd_guest_order_entitled(o.id) or
  (o.status='pending' and o.payment_provider in ('stripe_test','stripe_live') and public.dydd_public_assessment_provider_allowed(o.payment_provider)))
 order by (r.id is not null) desc,r.created_at desc nulls last,o.created_at desc,s.id limit 1;
 insert into public.dydd_guest_recovery_requests(id,email_hash,requester_hash,product,session_id,token_hash)
 values(p_id,p_email_hash,p_requester_hash,p_product,sid,p_token_hash) returning * into prior;
 return to_jsonb(prior);
end $$;

create function public.dydd_guest_redeem_recovery(p_id uuid,p_token_hash text,p_capability_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare intent public.dydd_guest_recovery_requests%rowtype; sid uuid;
begin
 if coalesce(p_token_hash,'') !~ '^[0-9a-f]{64}$' or coalesce(p_capability_hash,'') !~ '^[0-9a-f]{64}$' then return null;end if;
 select session_id into sid from public.dydd_guest_recovery_requests where id=p_id and token_hash=p_token_hash;
 if sid is null then return null;end if;
 -- Match the lock order used by guest saves/payment/reversals.
 perform pg_advisory_xact_lock(hashtextextended('guest-session:'||sid::text,0));
 select * into intent from public.dydd_guest_recovery_requests where id=p_id and token_hash=p_token_hash for update;
 if not found or intent.used_at is not null or intent.expires_at<=now() then return null;end if;
 if not exists(select 1 from public.dydd_guest_sessions s join public.dydd_guest_orders o on o.session_id=s.id
 where s.id=sid and s.expires_at>now() and o.product='designid' and (public.dydd_guest_order_entitled(o.id) or
  (o.status='pending' and o.payment_provider in ('stripe_test','stripe_live') and public.dydd_public_assessment_provider_allowed(o.payment_provider)))) then return null;end if;
 -- Email possession authorizes a new browser capability. Never change results or orders.
 update public.dydd_guest_sessions set capability_hash=p_capability_hash where id=sid;
 update public.dydd_guest_recovery_requests set used_at=now() where session_id=sid and used_at is null;
 return jsonb_build_object('session_id',sid,'product',intent.product);
end $$;
revoke all on function public.dydd_guest_reserve_recovery(uuid,text,text,text,text,text),public.dydd_guest_redeem_recovery(uuid,text,text) from public,anon,authenticated;
grant execute on function public.dydd_guest_reserve_recovery(uuid,text,text,text,text,text),public.dydd_guest_redeem_recovery(uuid,text,text) to service_role;
commit;
