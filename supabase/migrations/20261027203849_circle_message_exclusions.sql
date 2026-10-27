-- Deliberate per-message omission; service-role-only RPCs retain creator checks.
-- Lock order for Circle mutations/submission is plan -> campaign -> draft -> membership -> job.
alter table public.dydd_circle_message_drafts add column excluded_at timestamptz;
comment on column public.dydd_circle_message_drafts.excluded_at is 'Creator intentionally omitted this message; restore requires fresh approval.';


create or replace function public.dydd_queue_circle_member_messages(campaign_key uuid,membership_key uuid default null) returns integer language plpgsql set search_path=public,pg_temp as $$
declare c public.dydd_circle_campaigns; p public.journey_circle_plans; d public.dydd_circle_message_drafts; m public.dydd_circle_memberships; copy text; next_prep text; business_key text; n integer:=0; affected integer; revised boolean;
begin
 select * into c from public.dydd_circle_campaigns where id=campaign_key;
 if not found or c.status not in ('finalized','paused') then return 0; end if;
 select * into p from public.journey_circle_plans where id=c.circle_id for share;
 select * into c from public.dydd_circle_campaigns where id=campaign_key for share;
 if p.id is null or c.id is null or c.status not in ('finalized','paused') or p.status<>'active' or p.revision<>c.circle_revision then return 0; end if;
 select exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and message_key='schedule-change') into revised;
 select body into next_prep from public.dydd_circle_message_drafts where campaign_id=c.id and approved_at is not null and excluded_at is null and message_key like 'preparation-%' and expires_at>now() order by meeting_index limit 1;
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

create or replace function public.dydd_queue_circle_leader_messages(campaign_key uuid,creator_user uuid,creator_email text) returns integer language plpgsql set search_path=public,pg_temp as $$
declare c public.dydd_circle_campaigns; p public.journey_circle_plans; d public.dydd_circle_message_drafts; recipient text; n integer:=0; affected integer;
begin
 select * into c from public.dydd_circle_campaigns where id=campaign_key;
 select * into p from public.journey_circle_plans where id=c.circle_id for share;
 select * into c from public.dydd_circle_campaigns where id=campaign_key for share;
 if p.id is null or c.id is null or p.status<>'active' or p.revision<>c.circle_revision or c.status not in ('finalized','paused') then return 0; end if;
 -- Verified address is supplied by trusted app auth.admin.getUserById, not profile metadata.
 if creator_user is null or p.user_id is distinct from creator_user or creator_email is null or length(trim(creator_email))=0 then return 0; end if;
 recipient:=lower(trim(creator_email));
 for d in select * from public.dydd_circle_message_drafts where campaign_id=c.id and kind='leader' and approved_at is not null and excluded_at is null and expires_at>now() and (scheduled_at>=coalesce(c.finalized_at,now()) or message_key='leader-launch') loop
  insert into public.dydd_lifecycle_jobs(event_key,template_id,category,user_id,email,circle_id,campaign_id,draft_id,subject,body,scheduled_at,expires_at,context)
  values('circle-leader:'||c.id||':'||d.id,d.template_id,d.category,p.user_id,recipient,p.id,c.id,d.id,d.subject,d.body,greatest(d.scheduled_at,now()),d.expires_at,jsonb_build_object('kind','leader','draftRevision',d.revision))
  on conflict(event_key) do update set subject=excluded.subject,body=excluded.body,scheduled_at=excluded.scheduled_at,expires_at=excluded.expires_at,context=excluded.context,status='queued',error_message=null,claim_token=null,claimed_at=null,attempts=0,first_attempt_at=null
  where dydd_lifecycle_jobs.status in ('cancelled','skipped') and dydd_lifecycle_jobs.provider_id is null and dydd_lifecycle_jobs.send_authorized_at is null;
  get diagnostics affected=row_count; n:=n+affected;
 end loop;
 return n;
end $$;
revoke all on function public.dydd_queue_circle_leader_messages(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.dydd_queue_circle_leader_messages(uuid,uuid,text) to service_role;

create or replace function public.dydd_finalize_circle_campaign(campaign_key uuid,actor_user uuid,actor_scope text) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare c public.dydd_circle_campaigns; p public.journey_circle_plans; n integer;
begin
 select * into c from public.dydd_circle_campaigns where id=campaign_key;
 if not found then raise exception 'Campaign not found'; end if;
 select * into p from public.journey_circle_plans where id=c.circle_id for update;
 select * into c from public.dydd_circle_campaigns where id=campaign_key for update;
 if not coalesce((actor_user is not null and p.user_id=actor_user) or (actor_user is null and actor_scope is not null and p.preview_scope=actor_scope),false) then raise exception 'Creator authorization required'; end if;
 if p.status<>'active' or p.revision<>c.circle_revision or p.plan<>c.plan_snapshot or c.status='superseded' then raise exception 'Schedule changed; regenerate and approve the current messages'; end if;
 if not exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id) or exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and approved_at is null and excluded_at is null) then raise exception 'Approve or exclude every written message first'; end if;
 if not exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and template_id='E02' and expires_at>now()) then raise exception 'Choose at least one future meeting before finalizing'; end if;
 update public.dydd_circle_campaigns set status='finalized',finalized_at=coalesce(finalized_at,now()) where id=c.id;
 n:=public.dydd_queue_circle_member_messages(c.id,null);
 return jsonb_build_object('finalized',true,'queued',n,'preview',p.user_id is null);
end $$;

create or replace function public.dydd_update_circle_message(message_id uuid,actor_user uuid,actor_scope text,expected_revision integer,new_subject text,new_body text,approve boolean) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare d public.dydd_circle_message_drafts; c public.dydd_circle_campaigns; p public.journey_circle_plans;
begin
 select * into d from public.dydd_circle_message_drafts where id=message_id;
 if not found then raise exception 'Message not found'; end if;
 select * into c from public.dydd_circle_campaigns where id=d.campaign_id;
 select * into p from public.journey_circle_plans where id=c.circle_id for update;
 select * into c from public.dydd_circle_campaigns where id=d.campaign_id for update;
 select * into d from public.dydd_circle_message_drafts where id=message_id for update;
 if not coalesce((actor_user is not null and p.user_id=actor_user) or (actor_user is null and actor_scope is not null and p.preview_scope=actor_scope),false) then raise exception 'Creator authorization required'; end if;
 if c.status<>'draft' or c.circle_revision<>p.revision or c.plan_snapshot<>p.plan then raise exception 'Reopen the latest draft schedule before editing'; end if;
 if d.excluded_at is not null then raise exception 'Restore this excluded message before editing or approving'; end if;
 if expected_revision is null or d.revision<>expected_revision then raise exception 'Message changed in another tab; reload before approving'; end if;
 if length(trim(new_subject)) not between 1 and 200 or length(trim(new_body)) not between 1 and 30000 then raise exception 'Enter a subject and complete message'; end if;
 update public.dydd_circle_message_drafts set subject=trim(new_subject),body=trim(new_body),revision=revision+1,
 approved_at=case when approve then now() else null end,approved_by=case when approve then actor_user else null end,approved_scope=case when approve then actor_scope else null end where id=d.id returning * into d;
 return to_jsonb(d);
end $$;

create or replace function public.dydd_issue_circle_invitation(campaign_key uuid,actor_user uuid,recipient text,person_name text,new_token_hash text,expires timestamptz,invitation_url text) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare c public.dydd_circle_campaigns; p public.journey_circle_plans; m public.dydd_circle_memberships; created uuid; d public.dydd_circle_message_drafts; reminder public.dydd_circle_message_drafts;
begin
 select * into c from public.dydd_circle_campaigns where id=campaign_key;
 select * into p from public.journey_circle_plans where id=c.circle_id for share;
 select * into c from public.dydd_circle_campaigns where id=campaign_key for share;
 if actor_user is null or p.user_id is distinct from actor_user or p.status<>'active' or p.revision<>c.circle_revision or c.status<>'finalized' then raise exception 'Creator and finalized current schedule required'; end if;
 if not exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and message_key='invitation' and approved_at is not null and excluded_at is null) then raise exception 'Approved invitation required'; end if;
 if not exists(select 1 from jsonb_array_elements(p.plan->'participants') v where lower(v->>'email')=recipient) then raise exception 'Recipient not in current roster'; end if;
 insert into public.dydd_circle_memberships(circle_id,email,display_name,token_hash,expires_at) values(p.id,recipient,person_name,new_token_hash,expires) on conflict(circle_id,email) do nothing returning id into created;
 select * into m from public.dydd_circle_memberships where circle_id=p.id and email=recipient for update;
 if created is null then
  if m.status not in ('invited','expired') or m.invited_at>now()-interval '24 hours' then return null; end if;
  update public.dydd_circle_memberships set status='invited',token_hash=new_token_hash,expires_at=expires,invited_at=now(),display_name=person_name where id=m.id returning * into m;
 end if;
 select * into d from public.dydd_circle_message_drafts where campaign_id=c.id and message_key='invitation';
 insert into public.dydd_lifecycle_jobs(event_key,template_id,category,email,circle_id,campaign_id,draft_id,membership_id,subject,body,scheduled_at,expires_at,context)
 values('circle-invite:'||m.id||':'||new_token_hash,'D01','service',recipient,p.id,c.id,d.id,m.id,d.subject,replace(d.body,'{{invitation_url}}',invitation_url),now(),expires,jsonb_build_object('kind','invitation','tokenHash',new_token_hash,'draftRevision',d.revision)) on conflict(event_key) do nothing;
 select * into reminder from public.dydd_circle_message_drafts where campaign_id=c.id and message_key='invitation-reminder' and approved_at is not null and excluded_at is null;
 if found and now()+interval '4 days'<reminder.expires_at then
  insert into public.dydd_lifecycle_jobs(event_key,template_id,category,email,circle_id,campaign_id,draft_id,membership_id,subject,body,scheduled_at,expires_at,context)
  values('circle-invite-reminder:'||m.id,'D02','service',recipient,p.id,c.id,reminder.id,m.id,reminder.subject,replace(reminder.body,'{{invitation_url}}',invitation_url),now()+interval '4 days',reminder.expires_at,jsonb_build_object('kind','invitation','tokenHash',new_token_hash,'draftRevision',reminder.revision)) on conflict(event_key) do nothing;
 end if;
 return to_jsonb(m);
end $$;

create or replace function public.dydd_authorize_lifecycle_send(job_key uuid,lease_token uuid) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare j public.dydd_lifecycle_jobs; c public.dydd_circle_campaigns; p public.journey_circle_plans; d public.dydd_circle_message_drafts; m public.dydd_circle_memberships; pref public.dydd_email_preferences; settings public.dydd_lifecycle_settings; count_week integer; last_optional timestamptz;
begin
 -- One brief settings-row reservation serializes cadence authorization, not network I/O.
 select * into settings from public.dydd_lifecycle_settings where id for update;
 select * into j from public.dydd_lifecycle_jobs where id=job_key;
 if j.circle_id is not null then
  select * into p from public.journey_circle_plans where id=j.circle_id for share;
  select * into c from public.dydd_circle_campaigns where id=j.campaign_id for share;
  select * into d from public.dydd_circle_message_drafts where id=j.draft_id for share;
  if j.membership_id is not null then select * into m from public.dydd_circle_memberships where id=j.membership_id for share; end if;
 end if;
 select * into j from public.dydd_lifecycle_jobs where id=job_key for update;
 if not found or j.status<>'processing' or j.claim_token is distinct from lease_token then return jsonb_build_object('authorized',false,'lostClaim',true); end if;
 if j.expires_at<=now() then return jsonb_build_object('authorized',false,'stop','Message expired before provider submission.'); end if;
 if settings.paused or (j.category<>'service' and settings.optional_paused) then return jsonb_build_object('authorized',false,'defer',true,'reason','Communication is paused.'); end if;
 select * into pref from public.dydd_email_preferences where email=j.email for share;
 if j.category<>'service' and (pref.optional_disabled or j.category='learning' and not coalesce(pref.learning,false) or j.category='growth' and not coalesce(pref.growth,false)) then return jsonb_build_object('authorized',false,'stop','Email preference changed before submission.'); end if;
 if exists(select 1 from public.dydd_email_suppressions where email=j.email) then return jsonb_build_object('authorized',false,'stop','Delivery is suppressed.'); end if;
 if j.circle_id is not null then
  if j.category='circle' and exists(select 1 from public.dydd_circle_email_preferences where circle_id=j.circle_id and email=j.email and not reminders) then return jsonb_build_object('authorized',false,'stop','Circle email preference is disabled.'); end if;
  select * into p from public.journey_circle_plans where id=j.circle_id for share;
  select * into c from public.dydd_circle_campaigns where id=j.campaign_id for share;
  select * into d from public.dydd_circle_message_drafts where id=j.draft_id for share;
  if p.id is null or c.id is null or c.circle_id is distinct from p.id or p.plan is distinct from c.plan_snapshot or p.status<>'active' or p.revision<>c.circle_revision or c.status='superseded' or (j.context ? 'announcementId' and not exists(select 1 from public.dydd_circle_announcements where id=(j.context->>'announcementId')::uuid and campaign_id=c.id and status='published' and approved_at is not null)) or (not (j.context ? 'announcementId') and (d.id is null or d.campaign_id is distinct from c.id or d.approved_at is null or d.excluded_at is not null or (j.context ? 'draftRevision' and (j.context->>'draftRevision')::integer<>d.revision))) then return jsonb_build_object('authorized',false,'stop','Schedule or approval changed before submission.'); end if;
  if exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and approved_at is null and excluded_at is null) then return jsonb_build_object('authorized',false,'stop','Current full schedule is not reviewed.'); end if;
  if c.status='paused' then return jsonb_build_object('authorized',false,'defer',true,'reason','Circle communication is paused.'); end if;
  if c.status<>'finalized' then return jsonb_build_object('authorized',false,'stop','Current full schedule is not finalized.'); end if;
  if j.context->>'kind'='leader' then
   if p.user_id is distinct from j.user_id then return jsonb_build_object('authorized',false,'stop','Creator changed.'); end if;
  else
   select * into m from public.dydd_circle_memberships where id=j.membership_id for share;
   if not found or m.email<>j.email or not exists(select 1 from jsonb_array_elements(p.plan->'participants') v where lower(v->>'email')=j.email) then return jsonb_build_object('authorized',false,'stop','Membership or roster changed.'); end if;
   if j.context->>'kind'='invitation' then
    if m.status<>'invited' or m.expires_at<=now() or m.token_hash is distinct from j.context->>'tokenHash' then return jsonb_build_object('authorized',false,'stop','Invitation changed.'); end if;
   elsif m.status<>'accepted' or m.user_id is distinct from j.user_id or j.category='circle' and not m.reminders then return jsonb_build_object('authorized',false,'stop','Membership or reminder choice changed.'); end if;
  end if;
 end if;
 if j.category in ('learning','growth') then
  select count(*),max(coalesce(accepted_at,send_authorized_at)) into count_week,last_optional from public.dydd_lifecycle_jobs where email=j.email and id<>j.id and category in ('learning','growth') and status in ('submitting','accepted','sandbox_ready','retry','review') and coalesce(accepted_at,send_authorized_at)>now()-interval '7 days';
  if count_week>=3 or last_optional>now()-interval '1 day' then return jsonb_build_object('authorized',false,'defer',true,'reason','Shared recipient cadence is reserved by another message.'); end if;
 end if;
 update public.dydd_lifecycle_jobs set status='submitting',send_authorized_at=now() where id=j.id;
 return jsonb_build_object('authorized',true);
end $$;

create or replace function public.dydd_set_circle_message_excluded(message_id uuid,actor_user uuid,actor_scope text,expected_revision integer,exclude boolean) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare d public.dydd_circle_message_drafts; c public.dydd_circle_campaigns; p public.journey_circle_plans;
begin
 select * into d from public.dydd_circle_message_drafts where id=message_id;
 select * into c from public.dydd_circle_campaigns where id=d.campaign_id;
 select * into p from public.journey_circle_plans where id=c.circle_id for update;
 select * into c from public.dydd_circle_campaigns where id=d.campaign_id for update;
 select * into d from public.dydd_circle_message_drafts where id=message_id for update;
 if d.id is null then raise exception 'Message not found'; end if;
 if not coalesce((actor_user is not null and p.user_id=actor_user) or (actor_user is null and actor_scope is not null and p.preview_scope=actor_scope),false) then raise exception 'Creator authorization required'; end if;
 if p.status<>'active' or c.status not in ('draft','finalized','paused') or p.revision<>c.circle_revision or p.plan is distinct from c.plan_snapshot then raise exception 'Schedule changed; reload the current messages'; end if;
 if expected_revision is null or d.revision<>expected_revision then raise exception 'Message changed in another tab; reload before changing inclusion'; end if;
 if exclude is null then raise exception 'Choose exclude or restore'; end if;
 if exclude=(d.excluded_at is not null) then return to_jsonb(d); end if;
 update public.dydd_circle_message_drafts set excluded_at=case when exclude then now() else null end,revision=revision+1,approved_at=null,approved_by=null,approved_scope=null where id=d.id returning * into d;
 -- A restored message is unapproved: all pending messages wait for explicit re-finalization.
 if not exclude then update public.dydd_circle_campaigns set status='draft' where id=c.id; end if;
 update public.dydd_lifecycle_jobs set status=case when send_authorized_at is not null and status<>'sandbox_ready' then 'review' else 'cancelled' end,
 error_message=case when send_authorized_at is not null and status<>'sandbox_ready' then 'Creator changed message inclusion after an ambiguous attempt; reconcile history, never replay.' else 'Creator changed message inclusion before provider submission.' end,
 claim_token=null,claimed_at=null
 where campaign_id=c.id and (not exclude or draft_id=d.id or d.message_key like 'preparation-%' and draft_id in (select id from public.dydd_circle_message_drafts where campaign_id=c.id and message_key='welcome')) and status in ('queued','retry','processing','sandbox_ready');
 if exclude and d.message_key like 'preparation-%' and c.status in ('finalized','paused') then perform public.dydd_queue_circle_member_messages(c.id,null); end if;
 return to_jsonb(d);
end $$;
revoke all on function public.dydd_set_circle_message_excluded(uuid,uuid,text,integer,boolean) from public,anon,authenticated;
grant execute on function public.dydd_set_circle_message_excluded(uuid,uuid,text,integer,boolean) to service_role;

-- Retain creator intent across material plan revisions by stable message_key, never approvals.
create function public.dydd_inherit_circle_message_exclusion() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare previous_exclusion timestamptz;
begin
 select d.excluded_at into previous_exclusion from public.dydd_circle_message_drafts d
 join public.dydd_circle_campaigns old_c on old_c.id=d.campaign_id
 join public.dydd_circle_campaigns new_c on new_c.id=new.campaign_id
 where old_c.circle_id=new_c.circle_id and old_c.circle_revision<new_c.circle_revision and d.message_key=new.message_key
 order by old_c.circle_revision desc limit 1;
 if previous_exclusion is not null then new.excluded_at:=previous_exclusion;new.approved_at:=null;new.approved_by:=null;new.approved_scope:=null;end if;
 return new;
end $$;
create trigger dydd_inherit_circle_message_exclusion before insert on public.dydd_circle_message_drafts for each row execute function public.dydd_inherit_circle_message_exclusion();
revoke all on function public.dydd_inherit_circle_message_exclusion() from public,anon,authenticated;


create or replace function public.dydd_circle_revision_changed() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.plan is distinct from old.plan or new.status is distinct from old.status or new.revision is distinct from old.revision then
  update public.dydd_circle_campaigns set status='superseded' where circle_id=new.id and status<>'superseded';
  update public.dydd_lifecycle_jobs set status=case when send_authorized_at is not null and status<>'sandbox_ready' then 'review' else 'cancelled' end,claim_token=null,claimed_at=null,error_message='Circle schedule or roster changed; re-review required; reconcile any attempted submission.'
   where circle_id=new.id and status in ('queued','retry','sandbox_ready','processing');
 end if;
 return new;
end $$;

-- Every explicit re-finalization has a durable leader/member reconciliation intent.
-- Initial business key is retained; later reviews use separate events, stable job keys deduplicate.
create or replace function public.dydd_capture_campaign() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.status='finalized' and old.status<>'finalized' then
  insert into public.dydd_lifecycle_events(event_key,kind,source_id,payload)
  values(case when old.finalized_at is null then 'circle-finalized:'||new.id else 'circle-refinalized:'||new.id||':'||gen_random_uuid() end,'circle_finalized',new.id::text,jsonb_build_object('circleId',new.circle_id)) on conflict(event_key) do nothing;
 end if; return new;
end $$;

-- A stale pause/resume request cannot re-finalize a schedule reopened by restore.
create function public.dydd_set_circle_campaign_paused(campaign_key uuid,actor_user uuid,actor_scope text,pause boolean) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare c public.dydd_circle_campaigns; p public.journey_circle_plans; n integer:=0;
begin
 select * into c from public.dydd_circle_campaigns where id=campaign_key;
 select * into p from public.journey_circle_plans where id=c.circle_id for update;
 select * into c from public.dydd_circle_campaigns where id=campaign_key for update;
 if not coalesce((actor_user is not null and p.user_id=actor_user) or (actor_user is null and actor_scope is not null and p.preview_scope=actor_scope),false) then raise exception 'Creator authorization required';end if;
 if pause is null or p.status<>'active' or c.status not in ('finalized','paused') or p.revision<>c.circle_revision or p.plan is distinct from c.plan_snapshot then raise exception 'Finalize the current reviewed schedule before pausing or resuming';end if;
 if not pause and exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and approved_at is null and excluded_at is null) then raise exception 'Approve or exclude every written message before resuming';end if;
 update public.dydd_circle_campaigns set status=case when pause then 'paused' else 'finalized' end where id=c.id;
 if not pause then n:=public.dydd_queue_circle_member_messages(c.id,null);end if;
 return jsonb_build_object('paused',pause,'queued',n);
end $$;
revoke all on function public.dydd_set_circle_campaign_paused(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.dydd_set_circle_campaign_paused(uuid,uuid,text,boolean) to service_role;
