begin;
alter table public.fireside_registrations add column source jsonb not null default '{}'::jsonb check(jsonb_typeof(source)='object');
alter table public.fireside_inquiries add column source jsonb not null default '{}'::jsonb check(jsonb_typeof(source)='object');
create or replace function public.fireside_registration(p_user uuid,p_event uuid,p_action text,p_key text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare e fireside_events; r fireside_registrations; old fireside_requests; n integer; promoted uuid; result jsonb;
begin
 if p_action not in('register','cancel') or length(p_key) not between 8 and 120 then raise exception 'Invalid request';end if;
 -- User-level lock also serializes an idempotency key reused across different events.
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select * into old from fireside_requests where user_id=p_user and key=p_key;
 if found then if old.event_id<>p_event or old.action<>p_action then raise exception 'Idempotency key conflict';end if;return old.response;end if;
 select * into e from fireside_events where id=p_event for update;
 if not found then raise exception 'Event not found';end if;
 select * into r from fireside_registrations where event_id=p_event and user_id=p_user;
 if p_action='register' then
  if e.ticket_mode='paid_disabled' and p_action='register' then raise exception 'Paid registration is not enabled in this sandbox';end if;
  if e.status<>'published' or (case when e.format='drop_in' then e.ends_at else e.starts_at end)<=now() then raise exception 'Registration is closed';end if;
  if r.id is null or r.status='cancelled' then
   select count(*) into n from fireside_registrations where event_id=p_event and status='confirmed';
   if n>=e.capacity and not e.waitlist_enabled then raise exception 'Event is full';end if;
   insert into fireside_registrations(event_id,user_id,status) values(p_event,p_user,case when n<e.capacity then 'confirmed' else 'waitlisted' end)
   on conflict(event_id,user_id) do update set status=excluded.status,created_at=clock_timestamp(),updated_at=clock_timestamp() returning * into r;
  end if;
 else
  if r.id is null then raise exception 'Registration not found';end if;
  if r.status<>'cancelled' then
   update fireside_registrations set status='cancelled',updated_at=now() where id=r.id returning * into r;
   if e.status='published' and (case when e.format='drop_in' then e.ends_at else e.starts_at end)>now() then
    select count(*) into n from fireside_registrations where event_id=p_event and status='confirmed';
    if n<e.capacity then
     update fireside_registrations set status='confirmed',updated_at=now() where id=(select id from fireside_registrations where event_id=p_event and status='waitlisted' order by created_at,id limit 1) returning user_id into promoted;

    end if;
   end if;
  end if;
  update fireside_outbox set status='cancelled' where event_id=p_event and user_id=p_user and kind not in('cancellation','event_cancelled') and status in('pending','previewed');
 end if;
 result=to_jsonb(r);insert into fireside_requests values(p_user,p_key,p_event,p_action,result,now());return result;
end $$;


commit;
