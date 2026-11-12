-- Future-only, service-only guest checkout reminder. No backfill or provider request.
begin;
create table public.dydd_guest_checkout_reminders (
 order_id uuid primary key references public.dydd_guest_orders(id),
 session_id uuid not null references public.dydd_guest_sessions(id),
 created_at timestamptz not null default now(), due_at timestamptz not null default now()+interval '1 hour',
 expires_at timestamptz not null default now()+interval '24 hours',
 status text not null default 'queued' check(status in ('queued','processing','submitting','retry','accepted','skipped','review')),
 sender_input jsonb, capability_hash text, resumed_at timestamptz,
 attempts integer not null default 0, next_attempt_at timestamptz not null default now(),
 claimed_at timestamptz, claim_token uuid, first_attempt_at timestamptz,
 provider_id text, accepted_at timestamptz, error_message text
);
alter table public.dydd_guest_checkout_reminders enable row level security;
revoke all on public.dydd_guest_checkout_reminders from public,anon,authenticated;
grant all on public.dydd_guest_checkout_reminders to service_role;
create index dydd_guest_checkout_reminders_due on public.dydd_guest_checkout_reminders(due_at,next_attempt_at) where status in ('queued','retry','processing','submitting');
create function public.dydd_guest_capture_checkout_reminder() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if new.status='pending' and new.access_grant_id is null then
   insert into public.dydd_guest_checkout_reminders(order_id,session_id) values(new.id,new.session_id) on conflict do nothing;
  end if;
 elsif new.status<>'pending' then
  update public.dydd_guest_checkout_reminders set status='skipped',error_message='Checkout is no longer pending.'
  where order_id=new.id and status in ('queued','processing','submitting','retry');
 end if;
 return new;
end $$;
revoke all on function public.dydd_guest_capture_checkout_reminder() from public,anon,authenticated;
grant execute on function public.dydd_guest_capture_checkout_reminder() to service_role;
create trigger dydd_guest_checkout_reminder_capture after insert or update of status on public.dydd_guest_orders
for each row execute function public.dydd_guest_capture_checkout_reminder();

create function public.dydd_guest_register_checkout_reminder(p_order uuid,p_hash text,p_sender jsonb) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 -- The caller proves possession; raw bearer remains solely in the service-only immutable payload.
 update public.dydd_guest_checkout_reminders j set sender_input=p_sender,capability_hash=p_hash
 from public.dydd_guest_orders o,public.dydd_guest_sessions s
 where j.order_id=p_order and o.id=j.order_id and s.id=j.session_id and o.session_id=s.id
 and o.status='pending' and o.payment_reference is not null and s.capability_hash=p_hash and s.expires_at>now()
 and j.sender_input is null and j.status='queued' and j.resumed_at is null and j.expires_at>now();
 return found;
end $$;
create function public.dydd_guest_mark_checkout_resumed(p_session uuid) returns void
language sql security invoker set search_path='' as $$
 update public.dydd_guest_checkout_reminders set resumed_at=coalesce(resumed_at,now()),
 status=case when status in ('queued','processing','submitting','retry') then 'skipped' else status end,
 error_message=case when status in ('queued','processing','submitting','retry') then 'Guest resumed checkout.' else error_message end
 where session_id=p_session;
$$;
create function public.dydd_guest_claim_checkout_reminders(p_limit integer default 10)
returns setof public.dydd_guest_checkout_reminders language plpgsql security invoker set search_path='' as $$
begin
 update public.dydd_guest_checkout_reminders set status='review',error_message='Reminder cutoff or retry limit reached; no automatic replay.'
 where status in ('queued','retry','processing','submitting') and (expires_at<=now() or attempts>=8 or first_attempt_at<now()-interval '23 hours');
 return query with candidates as (
 select j.order_id from public.dydd_guest_checkout_reminders j
 where j.sender_input is not null and j.resumed_at is null and j.due_at<=now() and j.next_attempt_at<=now()
 and (j.status in ('queued','retry') or (j.status in ('processing','submitting') and j.claimed_at<now()-interval '10 minutes'))
 order by j.due_at limit least(greatest(p_limit,1),25) for update skip locked
 ) update public.dydd_guest_checkout_reminders j set status='processing',claim_token=gen_random_uuid(),claimed_at=now(),
 attempts=j.attempts+1,first_attempt_at=coalesce(j.first_attempt_at,now()) from candidates c where j.order_id=c.order_id returning j.*;
end $$;
create function public.dydd_guest_authorize_checkout_reminder(p_order uuid,p_claim uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 -- Order lock follows payment writer ordering; final eligibility and claim transition are atomic.
 perform 1 from public.dydd_guest_orders where id=p_order for update;
 update public.dydd_guest_checkout_reminders j set status='submitting'
 from public.dydd_guest_orders o,public.dydd_guest_sessions s
 where j.order_id=p_order and j.claim_token=p_claim and j.status='processing' and j.resumed_at is null
 and j.expires_at>now() and j.due_at<=now() and o.id=j.order_id and o.session_id=s.id and s.id=j.session_id
 and s.capability_hash=j.capability_hash and s.expires_at>now() and o.status='pending' and o.access_grant_id is null
 and o.payment_reference is not null and public.dydd_public_assessment_provider_allowed(o.payment_provider)
 and not exists(select 1 from public.dydd_guest_results r where r.order_id=o.id)
 and (o.product='designid' or exists(select 1 from public.dydd_guest_results src join public.dydd_guest_orders so on so.id=src.order_id
  where src.id=o.source_result_id and src.session_id=o.session_id and src.product='designid' and so.status='paid'
  and not exists(select 1 from public.dydd_guest_reversals rev where rev.payment_provider=so.payment_provider and rev.payment_intent_id=so.payment_intent_id)))
 and not exists(select 1 from public.dydd_email_suppressions x where x.email=lower(btrim(s.participant_email)));
 return found;
end $$;
revoke all on function public.dydd_guest_register_checkout_reminder(uuid,text,jsonb),public.dydd_guest_mark_checkout_resumed(uuid),public.dydd_guest_claim_checkout_reminders(integer),public.dydd_guest_authorize_checkout_reminder(uuid,uuid) from public,anon,authenticated;
grant execute on function public.dydd_guest_register_checkout_reminder(uuid,text,jsonb),public.dydd_guest_mark_checkout_resumed(uuid),public.dydd_guest_claim_checkout_reminders(integer),public.dydd_guest_authorize_checkout_reminder(uuid,uuid) to service_role;
commit;
