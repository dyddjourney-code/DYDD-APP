-- DYDD only. Apply to verified sandbox first. No receiving/forwarding rules.
create table public.dydd_email_messages (
 id uuid primary key default gen_random_uuid(), idempotency_key text not null unique,
 recipient text not null, payload_hash text not null, provider_id text unique,
 status text not null default 'pending' check(status in ('pending','accepted','delivered','delayed','bounced','failed','complained','suppressed','review')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 last_event_at timestamptz, error_message text
);
create table public.dydd_email_events (
 event_id text primary key, provider_id text not null, event_type text not null,
 occurred_at timestamptz not null, received_at timestamptz not null default now(),
 message_id uuid references public.dydd_email_messages(id)
);
create table public.dydd_email_suppressions (
 email text primary key, reason text not null, created_at timestamptz not null default now()
);
create table public.dydd_waypoint_unsubscribe_tokens (
 token_hash text primary key, subscription_id uuid not null references public.dydd_waypoint_subscriptions(id) on delete cascade,
 job_id uuid unique references public.dydd_waypoint_delivery_jobs(id) on delete cascade,
 token text, created_at timestamptz not null default now()
);
insert into public.dydd_waypoint_unsubscribe_tokens(token_hash,subscription_id)
select unsubscribe_token_hash,id from public.dydd_waypoint_subscriptions where unsubscribe_token_hash is not null on conflict do nothing;
alter table public.dydd_waypoint_delivery_jobs drop constraint dydd_waypoint_delivery_jobs_status_check;
alter table public.dydd_waypoint_delivery_jobs add constraint dydd_waypoint_delivery_jobs_status_check check(status in ('queued','processing','sent','skipped','error','review'));
alter table public.dydd_waypoint_delivery_jobs add column claimed_at timestamptz, add column attempts integer not null default 0, add column next_attempt_at timestamptz not null default now(), add column first_attempt_at timestamptz;
create index dydd_email_events_provider_idx on public.dydd_email_events(provider_id);
alter table public.dydd_email_messages enable row level security;
alter table public.dydd_email_events enable row level security;
alter table public.dydd_email_suppressions enable row level security;
alter table public.dydd_waypoint_unsubscribe_tokens enable row level security;
revoke all on public.dydd_email_messages,public.dydd_email_events,public.dydd_email_suppressions,public.dydd_waypoint_unsubscribe_tokens from public,anon,authenticated;
grant all on public.dydd_email_messages,public.dydd_email_events,public.dydd_email_suppressions,public.dydd_waypoint_unsubscribe_tokens to service_role;
-- Service-role-only invoker RPCs; transactional locks prevent parallel cron sends.
create or replace function public.dydd_claim_waypoint_jobs(batch_size integer default 25)
returns setof public.dydd_waypoint_delivery_jobs language plpgsql security invoker set search_path = '' as $$
begin
 update public.dydd_waypoint_delivery_jobs set status='review',error_message='Retry limit or provider idempotency window exceeded; reconcile before retry.'
 where delivery_channel='email' and status in ('queued','processing','error') and (first_attempt_at < now()-interval '23 hours' or (attempts>=8 and status='error'));
 return query
 with candidates as (
 select j.id from public.dydd_waypoint_delivery_jobs j
 join public.dydd_waypoint_subscriptions s on s.id=j.subscription_id
 join public.dydd_waypoint_releases r on r.id=j.release_id
 join public.dydd_waypoints w on w.id=r.waypoint_id
 where j.delivery_channel='email' and s.status='active' and r.status in ('scheduled','released') and r.release_at<=now() and w.status='published'
 and not exists(select 1 from public.dydd_email_suppressions x where x.email=lower(s.email))
 and j.attempts<8 and j.next_attempt_at<=now()
 and (j.status in ('queued','error') or (j.status='processing' and j.claimed_at<now()-interval '10 minutes'))
 order by j.queued_at limit least(greatest(batch_size,1),100) for update of j skip locked
 ) update public.dydd_waypoint_delivery_jobs j set status='processing',claimed_at=now(),attempts=j.attempts+1,first_attempt_at=coalesce(j.first_attempt_at,now())
 from candidates c where j.id=c.id returning j.*;
end $$;
revoke all on function public.dydd_claim_waypoint_jobs(integer) from public,anon,authenticated;
grant execute on function public.dydd_claim_waypoint_jobs(integer) to service_role;
create or replace function public.dydd_record_email_event(event_key text, email_id text, kind text, happened_at timestamptz)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare m public.dydd_email_messages; next_status text;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(email_id,0));
 select * into m from public.dydd_email_messages where provider_id=email_id for update;
 insert into public.dydd_email_events(event_id,provider_id,event_type,occurred_at,message_id) values(event_key,email_id,kind,happened_at,m.id) on conflict(event_id) do update set message_id=excluded.message_id where public.dydd_email_events.message_id is null and excluded.message_id is not null;
 if not found then return false; end if;
 next_status := case kind when 'email.delivered' then 'delivered' when 'email.bounced' then 'bounced' when 'email.failed' then 'failed' when 'email.complained' then 'complained' when 'email.delivery_delayed' then 'delayed' when 'email.sent' then 'accepted' else null end;
 if m.id is not null and next_status is not null then
   if next_status in ('bounced','complained') then
    insert into public.dydd_email_suppressions(email,reason) values(lower(m.recipient),next_status) on conflict(email) do update set reason=excluded.reason;
    update public.dydd_waypoint_subscriptions set status='bounced' where lower(email)=lower(m.recipient) and status='active';
   end if;
   if m.status not in ('bounced','complained','failed') or next_status='complained' then
    if next_status in ('bounced','complained','failed') or ((m.last_event_at is null or happened_at>=m.last_event_at) and not(m.status='delivered' and next_status in ('accepted','delayed'))) then
     update public.dydd_email_messages set status=next_status,last_event_at=happened_at,updated_at=now() where id=m.id;
    end if;
   end if;
 end if;
 return true;
end $$;
revoke all on function public.dydd_record_email_event(text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.dydd_record_email_event(text,text,text,timestamptz) to service_role;

-- Serialize acceptance with webhooks, including the event-before-HTTP-response race.
create function public.dydd_accept_email_message(message_key uuid, email_id text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare e public.dydd_email_events;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(email_id,0));
 update public.dydd_email_messages set provider_id=email_id,status='accepted',updated_at=now(),error_message=null
 where id=message_key and provider_id is null;
 if not exists(select 1 from public.dydd_email_messages where id=message_key and provider_id=email_id) then return false; end if;
 for e in select * from public.dydd_email_events where provider_id=email_id and message_id is null order by occurred_at loop
  perform public.dydd_record_email_event(e.event_id,e.provider_id,e.event_type,e.occurred_at);
 end loop;
 return true;
end $$;
revoke all on function public.dydd_accept_email_message(uuid,text) from public,anon,authenticated;
grant execute on function public.dydd_accept_email_message(uuid,text) to service_role;
