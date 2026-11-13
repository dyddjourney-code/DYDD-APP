begin;
alter table public.fireside_registrations alter column created_at set default clock_timestamp();
alter table public.fireside_events add column format text not null default 'broadcast' check(format in('broadcast','masterclass','drop_in','series','in_person','hybrid')),add column topic text not null default '',add column location text not null default '',add column ticket_mode text not null default 'free' check(ticket_mode in('free','paid_disabled')),add column sessions jsonb not null default '[]'::jsonb check(jsonb_typeof(sessions)='array');
alter table public.fireside_media add column media_type text not null default 'video' check(media_type in('podcast','teaching','sermon','video','audio','resource')),add column topic text not null default '',add column archived boolean not null default false,add column access text not null default 'member' check(access in('public','member'));
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
  if e.status<>'published' or e.starts_at<=now() then raise exception 'Registration is closed';end if;
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
   if e.status='published' and e.starts_at>now() then
    select count(*) into n from fireside_registrations where event_id=p_event and status='confirmed';
    if n<e.capacity then
     update fireside_registrations set status='confirmed',updated_at=now() where id=(select id from fireside_registrations where event_id=p_event and status='waitlisted' order by created_at,id limit 1) returning user_id into promoted;
     if promoted is not null then insert into fireside_outbox(event_id,user_id,event_revision,kind,dedupe_key,due_at,payload) values(e.id,promoted,e.revision,'promotion',e.id||':'||e.revision||':'||promoted||':promotion:'||r.id||':'||r.created_at,now(),jsonb_build_object('title',e.title,'previewOnly',true)) on conflict do nothing;end if;
    end if;
   end if;
  end if;
  update fireside_outbox set status='cancelled' where event_id=p_event and user_id=p_user and status in('pending','previewed');
 end if;
 result=to_jsonb(r);insert into fireside_requests values(p_user,p_key,p_event,p_action,result,now());return result;
end $$;

create or replace function public.fireside_save_event(p_event jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
declare e fireside_events; n integer;begin
 if p_event->>'id' is null then
 insert into fireside_events(title,description,starts_at,ends_at,timezone,capacity,waitlist_enabled,status,live_url) values(p_event->>'title',p_event->>'description',(p_event->>'starts_at')::timestamptz,(p_event->>'ends_at')::timestamptz,p_event->>'timezone',(p_event->>'capacity')::int,(p_event->>'waitlist_enabled')::boolean,p_event->>'status',p_event->>'live_url') returning * into e;
 else
 select * into e from fireside_events where id=(p_event->>'id')::uuid for update;
 if not found then raise exception 'Event not found';end if;
 if e.revision<>(p_event->>'revision')::int or p_event->>'revision' is null then raise exception 'Revision conflict';end if;
 select count(*) into n from fireside_registrations where event_id=e.id and status='confirmed';
 if (p_event->>'capacity')::int<n then raise exception 'Capacity below confirmed registrations';end if;
 update fireside_events set title=p_event->>'title',description=p_event->>'description',starts_at=(p_event->>'starts_at')::timestamptz,ends_at=(p_event->>'ends_at')::timestamptz,timezone=p_event->>'timezone',capacity=(p_event->>'capacity')::int,waitlist_enabled=(p_event->>'waitlist_enabled')::boolean,status=p_event->>'status',live_url=p_event->>'live_url',revision=revision+1,updated_at=now() where id=e.id returning * into e;
 update fireside_outbox set status='cancelled' where event_id=e.id and status in('pending','previewed');
 if e.status='cancelled' then update fireside_registrations set status='cancelled',updated_at=now() where event_id=e.id and status<>'cancelled';
 elsif e.status='published' and e.starts_at>now() then
 with waiting as(select id from fireside_registrations where event_id=e.id and status='waitlisted' order by created_at,id limit greatest(0,e.capacity-n)) update fireside_registrations set status='confirmed',updated_at=now() where id in(select id from waiting);
 end if;
 end if;
 update fireside_events set format=coalesce(p_event->>'format','broadcast'),topic=coalesce(p_event->>'topic',''),location=coalesce(p_event->>'location',''),ticket_mode=coalesce(p_event->>'ticket_mode','free'),sessions=coalesce(p_event->'sessions','[]'::jsonb) where id=e.id returning * into e;
 return to_jsonb(e);end $$;

commit;
