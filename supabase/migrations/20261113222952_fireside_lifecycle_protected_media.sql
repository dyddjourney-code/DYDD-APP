begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('fireside-sandbox-private','fireside-sandbox-private',false,524288000,array['video/mp4','audio/mpeg','audio/mp4','audio/wav','application/pdf']) on conflict(id) do update set public=false;
update fireside_settings set value=jsonb_set(jsonb_set(value,'{title}','"Fireside by John Willoughby"'),'{introduction}','"Pull up a chair for Scripture, encouragement, and the next faithful step. Gather with John for teaching and conversation rooted in grace."') where value->>'title'='Fireside' and value->>'introduction'='Gather, learn, and grow together.';

create function public.fireside_registration_intent() returns trigger language plpgsql security invoker set search_path=public as $$
declare e fireside_events; k text;begin
 if TG_OP='UPDATE' and new.status=old.status and new.created_at=old.created_at then return new;end if;
 select * into e from fireside_events where id=new.event_id;
 k=case when new.status='cancelled' then case when e.status='cancelled' then 'event_cancelled' else 'cancellation' end when new.status='waitlisted' then 'waitlist' when TG_OP='UPDATE' and old.status='waitlisted' then 'promotion' else 'confirmation' end;
 insert into fireside_outbox(event_id,user_id,event_revision,kind,dedupe_key,due_at,payload) values(e.id,new.user_id,e.revision,k,e.id||':'||e.revision||':'||new.user_id||':'||k||':'||new.created_at,now(),jsonb_build_object('title',e.title,'startsAt',e.starts_at,'timezone',e.timezone,'previewOnly',true)) on conflict do nothing;
 return new;end $$;
revoke all on function public.fireside_registration_intent() from public,anon,authenticated;
create trigger fireside_registration_intent after insert or update on public.fireside_registrations for each row execute function public.fireside_registration_intent();
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

    end if;
   end if;
  end if;
  update fireside_outbox set status='cancelled' where event_id=p_event and user_id=p_user and kind not in('cancellation','event_cancelled') and status in('pending','previewed');
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
 if p_event->>'id' is not null and e.status='published' then
 insert into fireside_outbox(event_id,user_id,event_revision,kind,dedupe_key,due_at,payload)
 select e.id,r.user_id,e.revision,'event_changed',e.id||':'||e.revision||':'||r.user_id||':event_changed',now(),jsonb_build_object('title',e.title,'startsAt',e.starts_at,'timezone',e.timezone,'previewOnly',true) from fireside_registrations r where r.event_id=e.id and r.status in('confirmed','waitlisted') on conflict do nothing;
 end if;
 return to_jsonb(e);end $$;

create or replace function public.fireside_preview_reminders() returns integer language plpgsql security invoker set search_path=public as $$
declare n integer;begin
 perform pg_advisory_xact_lock(hashtextextended('fireside-reminders',0));
 update fireside_outbox o set status='cancelled' where kind in('reminder_24h','reminder_1h','promotion','confirmation','waitlist','followup') and status in('pending','previewed') and (not exists(select 1 from fireside_events e where e.id=o.event_id and e.status='published' and e.revision=o.event_revision ) or not exists(select 1 from fireside_registrations r where r.event_id=o.event_id and r.user_id=o.user_id and (r.status='confirmed' or (o.kind='waitlist' and r.status='waitlisted'))));
 insert into fireside_outbox(event_id,user_id,event_revision,kind,dedupe_key,due_at,payload)
 select e.id,r.user_id,e.revision,m.kind,e.id||':'||e.revision||':'||r.user_id||':'||m.kind||':'||r.created_at,e.starts_at-m.offset_time,jsonb_build_object('title',e.title,'startsAt',e.starts_at,'previewOnly',true)
 from fireside_events e join fireside_registrations r on r.event_id=e.id and r.status='confirmed' cross join(values('reminder_24h',interval '24 hours'),('reminder_1h',interval '1 hour')) m(kind,offset_time)
 where e.status='published' and e.starts_at>now() and e.starts_at-m.offset_time<=now() on conflict(dedupe_key) do nothing;
 insert into fireside_outbox(event_id,user_id,event_revision,kind,dedupe_key,due_at,payload)
 select e.id,r.user_id,e.revision,'followup',e.id||':'||e.revision||':'||r.user_id||':followup:'||r.created_at,e.ends_at,jsonb_build_object('title',e.title,'startsAt',e.starts_at,'timezone',e.timezone,'previewOnly',true) from fireside_events e join fireside_registrations r on r.event_id=e.id and r.status='confirmed' where e.status='published' and e.ends_at<=now() on conflict do nothing;
 update fireside_outbox set status='previewed' where status='pending' and due_at<=now();get diagnostics n=row_count;return n;
end $$;


commit;
