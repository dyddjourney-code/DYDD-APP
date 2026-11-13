begin;
create table public.fireside_events (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 200), description text not null default '',
 starts_at timestamptz not null, ends_at timestamptz not null, timezone text not null default 'America/New_York',
 capacity integer not null check(capacity between 1 and 10000),waitlist_enabled boolean not null default true,
 status text not null default 'draft' check(status in ('draft','published','cancelled')),live_url text,
 revision integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(ends_at>starts_at));
create table public.fireside_registrations (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.fireside_events(id),user_id uuid not null references auth.users(id),
 status text not null check(status in ('confirmed','waitlisted','cancelled')),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(event_id,user_id));
create index fireside_waitlist on public.fireside_registrations(event_id,status,created_at,id);
create table public.fireside_requests(user_id uuid not null references auth.users(id),key text not null,event_id uuid not null,action text not null,response jsonb not null,created_at timestamptz not null default now(),primary key(user_id,key));
create table public.fireside_inquiries(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),subject text not null check(length(subject) between 1 and 200),message text not null check(length(message) between 1 and 5000),status text not null default 'open' check(status in('open','reviewed','closed')),created_at timestamptz not null default now());
create table public.fireside_media(id uuid primary key default gen_random_uuid(),event_id uuid references public.fireside_events(id),title text not null,description text not null default '',kind text not null check(kind in('replay','resource')),url text not null,published boolean not null default false,created_at timestamptz not null default now());
create table public.fireside_settings(id boolean primary key default true check(id),value jsonb not null default '{"title":"Fireside","introduction":"Gather, learn, and grow together.","inquiries_enabled":true}'::jsonb);
insert into public.fireside_settings(id) values(true);
create table public.fireside_outbox(id uuid primary key default gen_random_uuid(),event_id uuid not null references public.fireside_events(id),user_id uuid not null references auth.users(id),event_revision integer not null,kind text not null, dedupe_key text not null unique,status text not null default 'pending' check(status in('pending','previewed','cancelled')),due_at timestamptz not null,payload jsonb not null default '{}',created_at timestamptz not null default now());
create index fireside_outbox_due on public.fireside_outbox(status,due_at);
-- Server-owned boundary: no direct browser role can read private URLs, rosters or write tickets.
do $$ declare t text; begin foreach t in array array['events','registrations','requests','inquiries','media','settings','outbox'] loop execute format('alter table public.fireside_%I enable row level security',t);execute format('revoke all on public.fireside_%I from anon, authenticated',t);execute format('grant all on public.fireside_%I to service_role',t);end loop;end $$;
create function public.fireside_registration(p_user uuid,p_event uuid,p_action text,p_key text) returns jsonb language plpgsql security invoker set search_path=public as $$
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
revoke all on function public.fireside_registration(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.fireside_registration(uuid,uuid,text,text) to service_role;
create function public.fireside_save_event(p_event jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$
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
 end if;return to_jsonb(e);end $$;
revoke all on function public.fireside_save_event(jsonb) from public,anon,authenticated;grant execute on function public.fireside_save_event(jsonb) to service_role;
create function public.fireside_preview_reminders() returns integer language plpgsql security invoker set search_path=public as $$
declare n integer;begin
 perform pg_advisory_xact_lock(hashtextextended('fireside-reminders',0));
 update fireside_outbox o set status='cancelled' where status in('pending','previewed') and (not exists(select 1 from fireside_events e where e.id=o.event_id and e.status='published' and e.revision=o.event_revision and e.ends_at>now()) or not exists(select 1 from fireside_registrations r where r.event_id=o.event_id and r.user_id=o.user_id and r.status='confirmed'));
 insert into fireside_outbox(event_id,user_id,event_revision,kind,dedupe_key,due_at,payload)
 select e.id,r.user_id,e.revision,m.kind,e.id||':'||e.revision||':'||r.user_id||':'||m.kind,e.starts_at-m.offset_time,jsonb_build_object('title',e.title,'startsAt',e.starts_at,'previewOnly',true)
 from fireside_events e join fireside_registrations r on r.event_id=e.id and r.status='confirmed' cross join(values('reminder_24h',interval '24 hours'),('reminder_1h',interval '1 hour')) m(kind,offset_time)
 where e.status='published' and e.starts_at>now() and e.starts_at-m.offset_time<=now() on conflict(dedupe_key) do nothing;
 update fireside_outbox set status='previewed' where status='pending' and due_at<=now();get diagnostics n=row_count;return n;
end $$;
revoke all on function public.fireside_preview_reminders() from public,anon,authenticated;grant execute on function public.fireside_preview_reminders() to service_role;
create function public.fireside_event_counts() returns table(event_id uuid,confirmed_count bigint,waitlist_count bigint) language sql security invoker set search_path=public as $$ select e.id,count(r.id) filter(where r.status='confirmed'),count(r.id) filter(where r.status='waitlisted') from fireside_events e left join fireside_registrations r on r.event_id=e.id where e.status in('published','cancelled') group by e.id $$;
revoke all on function public.fireside_event_counts() from public,anon,authenticated;grant execute on function public.fireside_event_counts() to service_role;
commit;
