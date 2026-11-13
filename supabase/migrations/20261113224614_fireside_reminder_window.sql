begin;
-- Do not replay a missed day-before reminder near the event or immediately upon a late RSVP.
create or replace function public.fireside_preview_reminders() returns integer language plpgsql security invoker set search_path=public as $$
declare n integer;begin
 perform pg_advisory_xact_lock(hashtextextended('fireside-reminders',0));
 update fireside_outbox o set status='cancelled' where kind in('reminder_24h','reminder_1h','promotion','confirmation','waitlist','followup') and status in('pending','previewed') and (not exists(select 1 from fireside_events e where e.id=o.event_id and e.status='published' and e.revision=o.event_revision ) or not exists(select 1 from fireside_registrations r where r.event_id=o.event_id and r.user_id=o.user_id and (r.status='confirmed' or (o.kind='waitlist' and r.status='waitlisted'))));
 insert into fireside_outbox(event_id,user_id,event_revision,kind,dedupe_key,due_at,payload)
 select e.id,r.user_id,e.revision,m.kind,e.id||':'||e.revision||':'||r.user_id||':'||m.kind||':'||r.created_at,e.starts_at-m.offset_time,jsonb_build_object('title',e.title,'startsAt',e.starts_at,'previewOnly',true)
 from fireside_events e join fireside_registrations r on r.event_id=e.id and r.status='confirmed' cross join(values('reminder_24h',interval '24 hours'),('reminder_1h',interval '1 hour')) m(kind,offset_time)
 where e.status='published' and e.starts_at>now() and e.starts_at-m.offset_time<=now() and (m.kind<>'reminder_24h' or e.starts_at>now()+interval '23 hours') on conflict(dedupe_key) do nothing;
 insert into fireside_outbox(event_id,user_id,event_revision,kind,dedupe_key,due_at,payload)
 select e.id,r.user_id,e.revision,'followup',e.id||':'||e.revision||':'||r.user_id||':followup:'||r.created_at,e.ends_at,jsonb_build_object('title',e.title,'startsAt',e.starts_at,'timezone',e.timezone,'previewOnly',true) from fireside_events e join fireside_registrations r on r.event_id=e.id and r.status='confirmed' where e.status='published' and e.ends_at<=now() on conflict do nothing;
 update fireside_outbox set status='previewed' where status='pending' and due_at<=now();get diagnostics n=row_count;return n;
end $$;
commit;
