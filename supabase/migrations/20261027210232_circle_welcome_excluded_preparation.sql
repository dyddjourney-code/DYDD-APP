-- The earliest actual upcoming preparation owns the welcome slot.
-- If intentionally omitted, use the honest generic confirmation, not a later meeting’s assignment.
create or replace function public.dydd_queue_circle_member_messages(campaign_key uuid,membership_key uuid default null) returns integer language plpgsql set search_path=public,pg_temp as $$
declare c public.dydd_circle_campaigns; p public.journey_circle_plans; d public.dydd_circle_message_drafts; m public.dydd_circle_memberships; copy text; next_prep text; business_key text; n integer:=0; affected integer; revised boolean;
begin
 select * into c from public.dydd_circle_campaigns where id=campaign_key;
 if not found or c.status not in ('finalized','paused') then return 0; end if;
 select * into p from public.journey_circle_plans where id=c.circle_id for share;
 select * into c from public.dydd_circle_campaigns where id=campaign_key for share;
 if p.id is null or c.id is null or c.status not in ('finalized','paused') or p.status<>'active' or p.revision<>c.circle_revision then return 0; end if;
 select exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and message_key='schedule-change') into revised;
 select case when approved_at is not null and excluded_at is null then body else null end into next_prep from public.dydd_circle_message_drafts where campaign_id=c.id and message_key like 'preparation-%' and expires_at>now() order by meeting_index limit 1;
 -- The welcome owns its Journey CTA; omit only the preparation fragment's exact generated trailing CTA.
 next_prep:=regexp_replace(next_prep,'[[:space:]]{2}Open the Journey: https?://[^[:space:]]+/journey[[:space:]]*$','');
 for m in select * from public.dydd_circle_memberships where circle_id=c.circle_id and status='accepted' and (membership_key is null or id=membership_key) loop
  for d in select * from public.dydd_circle_message_drafts where campaign_id=c.id and kind='member' and approved_at is not null and excluded_at is null and expires_at>now() and (scheduled_at>=now() or message_key in ('welcome','schedule-change')) loop
   if revised and (membership_key is null and d.message_key='welcome' or membership_key is not null and d.message_key='schedule-change') then continue; end if;
   copy:=replace(d.body,'{{next_preparation}}',coalesce(next_prep,'Your leader will confirm preparation for your next meeting.'));
   business_key:=case when d.message_key='welcome' then 'circle-welcome:'||m.id else 'circle:'||c.id||':'||d.id||':'||m.id end;
   insert into public.dydd_lifecycle_jobs(event_key,template_id,category,user_id,email,circle_id,campaign_id,draft_id,membership_id,subject,body,scheduled_at,expires_at,context)
   values(business_key,d.template_id,d.category,m.user_id,m.email,c.circle_id,c.id,d.id,m.id,d.subject,copy,greatest(d.scheduled_at,now()),d.expires_at,jsonb_build_object('kind','member','draftRevision',d.revision))
   on conflict(event_key) do update set campaign_id=excluded.campaign_id,draft_id=excluded.draft_id,subject=excluded.subject,body=excluded.body,scheduled_at=excluded.scheduled_at,expires_at=excluded.expires_at,status='queued',error_message=null,context=excluded.context,claim_token=null,claimed_at=null,attempts=0,first_attempt_at=null
   where dydd_lifecycle_jobs.status in ('cancelled','skipped') and dydd_lifecycle_jobs.provider_id is null and dydd_lifecycle_jobs.send_authorized_at is null;
   get diagnostics affected=row_count;n:=n+affected;
  end loop;
 end loop;
 return n;
end $$;

