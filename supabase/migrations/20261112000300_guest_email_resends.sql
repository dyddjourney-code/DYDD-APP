begin;
-- User-initiated report resends are a NEW bounded intent, never mutation/replay of the original email.
create table public.dydd_guest_email_resends (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.dydd_guest_sessions(id),
 result_id uuid not null references public.dydd_guest_results(id),
 created_at timestamptz not null default now(),
 accepted_at timestamptz, provider_id text
);
create index dydd_guest_email_resends_result_idx on public.dydd_guest_email_resends(result_id,created_at desc);
alter table public.dydd_guest_email_resends enable row level security;
revoke all on public.dydd_guest_email_resends from public,anon,authenticated;
grant all on public.dydd_guest_email_resends to service_role;
create function public.dydd_guest_reserve_email_resend(p_session_id uuid,p_result_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare prior public.dydd_guest_email_resends%rowtype; intent uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('guest-email-resend:'||p_result_id::text,0));
 if not exists(select 1 from public.dydd_guest_results r join public.dydd_guest_sessions s on s.id=r.session_id join public.dydd_guest_orders o on o.id=r.order_id
  where r.id=p_result_id and r.session_id=p_session_id and s.expires_at>now() and o.status='paid' and r.report_state='ready' and r.pdf->'storage'->>'path'='guest/'||r.id::text||'/report.pdf') then raise exception 'Report access is unavailable';end if;
 select * into prior from public.dydd_guest_email_resends where result_id=p_result_id order by created_at desc limit 1;
 -- The worker can accept a queued intent after the requesting HTTP call returned.
 -- Reconcile its durable accepted job before deciding whether this click is a NEW resend.
 if found and prior.accepted_at is null then
  update public.dydd_guest_email_resends r set accepted_at=j.accepted_at,provider_id=j.provider_id
   from public.dydd_lifecycle_jobs j where r.id=prior.id and j.event_key='application:guest-report-resend-'||r.id::text and j.status='accepted';
  select * into prior from public.dydd_guest_email_resends where id=prior.id;
  -- Ambiguous/queued submission must reuse its SAME intent, not consume another send.
  if prior.accepted_at is null then return prior.id;end if;
 end if;
 if prior.created_at>now()-interval '2 minutes' then raise exception 'Please wait two minutes before requesting another copy';end if;
 if (select count(*) from public.dydd_guest_email_resends where result_id=p_result_id and created_at>now()-interval '24 hours')>=3 then raise exception 'Daily email limit reached. Your PDF remains downloadable';end if;
 insert into public.dydd_guest_email_resends(session_id,result_id) values(p_session_id,p_result_id) returning id into intent;
 return intent;
end $$;
revoke all on function public.dydd_guest_reserve_email_resend(uuid,uuid) from public,anon,authenticated;
grant execute on function public.dydd_guest_reserve_email_resend(uuid,uuid) to service_role;
commit;
