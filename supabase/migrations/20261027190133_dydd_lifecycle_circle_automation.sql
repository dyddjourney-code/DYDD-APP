begin;
alter table public.dydd_waypoint_delivery_jobs drop constraint dydd_waypoint_delivery_jobs_status_check;
alter table public.dydd_waypoint_delivery_jobs add constraint dydd_waypoint_delivery_jobs_status_check check(status in ('queued','processing','sent','skipped','error','review','sandbox_ready'));
create table public.dydd_lifecycle_settings (
 id boolean primary key default true check(id), activated_at timestamptz not null default now(),
 paused boolean not null default false, optional_paused boolean not null default false
);
insert into public.dydd_lifecycle_settings(id) values(true);
create table public.dydd_email_preferences (
 email text primary key check(email=lower(email)), user_id uuid references auth.users(id) on delete set null,
 learning boolean not null default false, growth boolean not null default false, optional_disabled boolean not null default false,
 timezone text not null default 'America/New_York', updated_at timestamptz not null default now()
);
create table public.dydd_circle_memberships (
 id uuid primary key default gen_random_uuid(), circle_id uuid not null references public.journey_circle_plans(id) on delete cascade,
 email text not null check(email=lower(email)), display_name text not null, user_id uuid references auth.users(id) on delete set null,
 status text not null default 'invited' check(status in ('invited','accepted','declined','revoked','expired','left')),
 token_hash text unique not null, expires_at timestamptz not null, accepted_at timestamptz,
 reminders boolean not null default true, invited_at timestamptz not null default now(),
 unique(circle_id,email)
);
create table public.dydd_circle_campaigns (
 id uuid primary key default gen_random_uuid(), circle_id uuid not null references public.journey_circle_plans(id) on delete cascade,
 circle_revision integer not null, plan_snapshot jsonb not null,
 status text not null default 'draft' check(status in ('draft','finalized','superseded','paused')),
 created_at timestamptz not null default now(), finalized_at timestamptz,
 unique(circle_id,circle_revision)
);
create table public.dydd_circle_announcements(
 id uuid primary key default gen_random_uuid(),circle_id uuid not null references public.journey_circle_plans(id) on delete cascade,
 campaign_id uuid not null references public.dydd_circle_campaigns(id) on delete cascade,revision integer not null default 1,
 subject text not null check(length(subject) between 1 and 200),body text not null check(length(body) between 1 and 30000),
 scheduled_at timestamptz not null,expires_at timestamptz not null,status text not null default 'draft' check(status in ('draft','approved','published','cancelled')),
 approved_at timestamptz,created_at timestamptz not null default now(),published_at timestamptz,check(expires_at>scheduled_at)
);
alter table public.dydd_circle_announcements enable row level security;
revoke all on public.dydd_circle_announcements from anon,authenticated;
grant all on public.dydd_circle_announcements to service_role;
create function public.dydd_announcement_immutable() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if old.published_at is not null and (new.subject,new.body,new.scheduled_at,new.expires_at) is distinct from (old.subject,old.body,old.scheduled_at,old.expires_at) then raise exception 'Published message copy is immutable'; end if;
 return new;
end $$;
create trigger dydd_announcement_immutable before update on public.dydd_circle_announcements for each row execute function public.dydd_announcement_immutable();
create function public.dydd_publish_circle_announcement(announcement_key uuid,actor_user uuid,actor_scope text,expected_revision integer) returns integer language plpgsql set search_path=public,pg_temp as $$
declare a public.dydd_circle_announcements;c public.dydd_circle_campaigns;p public.journey_circle_plans;n integer;
begin
 select * into a from public.dydd_circle_announcements where id=announcement_key for update;
 select * into c from public.dydd_circle_campaigns where id=a.campaign_id for share;
 select * into p from public.journey_circle_plans where id=a.circle_id for share;
 if not((actor_user is not null and p.user_id=actor_user)or(actor_user is null and actor_scope is not null and p.preview_scope=actor_scope)) then raise exception 'Creator authorization required';end if;
 if a.status='published' then return 0;end if;
 if a.status<>'approved' or a.approved_at is null or a.revision<>expected_revision or c.status<>'finalized' or c.circle_revision<>p.revision or p.status<>'active' or a.expires_at<=now() then raise exception 'Review the current message and finalize the current schedule first';end if;
 update public.dydd_circle_announcements set status='published',published_at=now() where id=a.id;
 insert into public.dydd_lifecycle_jobs(event_key,template_id,category,user_id,email,circle_id,campaign_id,membership_id,subject,body,scheduled_at,expires_at,context)
 select 'circle-announcement:'||a.id||':'||m.id,'E05','circle',m.user_id,m.email,p.id,c.id,m.id,a.subject,a.body,greatest(now(),a.scheduled_at),a.expires_at,jsonb_build_object('kind','member','announcementId',a.id)
 from public.dydd_circle_memberships m where m.circle_id=p.id and m.status='accepted' and exists(select 1 from jsonb_array_elements(p.plan->'participants') v where lower(v->>'email')=m.email)
 on conflict(event_key) do nothing;
 get diagnostics n=row_count;return n;
end $$;
revoke all on function public.dydd_publish_circle_announcement(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.dydd_publish_circle_announcement(uuid,uuid,text,integer) to service_role;

create table public.dydd_circle_message_drafts (
 id uuid primary key default gen_random_uuid(), campaign_id uuid not null references public.dydd_circle_campaigns(id) on delete cascade,
 message_key text not null, template_id text not null, kind text not null check(kind in ('invitation','member','leader')),
 category text not null check(category in ('service','circle','learning','growth')),
 subject text not null check(length(subject) between 1 and 200), body text not null check(length(body) between 1 and 30000),
 scheduled_at timestamptz not null, expires_at timestamptz not null, meeting_index integer,
 revision integer not null default 1, approved_at timestamptz, approved_by uuid, approved_scope text,
 unique(campaign_id,message_key), check(expires_at>scheduled_at)
);
create table public.dydd_lifecycle_events (
 id uuid primary key default gen_random_uuid(), event_key text unique not null, kind text not null,
 user_id uuid references auth.users(id) on delete cascade, email text, source_id text,
 payload jsonb not null default '{}', occurred_at timestamptz not null default now(),
 processed_at timestamptz, error_message text, attempts integer not null default 0
);
create table public.dydd_lifecycle_jobs (
 id uuid primary key default gen_random_uuid(), event_key text unique not null, template_id text not null,
 category text not null check(category in ('service','circle','learning','growth')),
 user_id uuid references auth.users(id) on delete cascade, email text not null,
 circle_id uuid references public.journey_circle_plans(id) on delete cascade,
 campaign_id uuid references public.dydd_circle_campaigns(id) on delete cascade,
 draft_id uuid references public.dydd_circle_message_drafts(id), membership_id uuid references public.dydd_circle_memberships(id),
 subject text not null, body text not null, context jsonb not null default '{}',
 scheduled_at timestamptz not null, expires_at timestamptz not null,
 status text not null default 'queued' check(status in ('queued','processing','submitting','retry','sandbox_ready','accepted','skipped','cancelled','review','failed')),
 attempts integer not null default 0, claimed_at timestamptz, claim_token uuid, first_attempt_at timestamptz, send_authorized_at timestamptz,
 next_attempt_at timestamptz not null default now(), provider_id text, error_message text,
 created_at timestamptz not null default now(), accepted_at timestamptz, unsubscribe_token text not null default encode(extensions.gen_random_bytes(32),'hex'),
 check(expires_at>scheduled_at)
);
create index dydd_lifecycle_due on public.dydd_lifecycle_jobs(scheduled_at,next_attempt_at) where status in ('queued','retry','processing');
create index dydd_lifecycle_pending_events on public.dydd_lifecycle_events(occurred_at) where processed_at is null;
create table public.dydd_circle_email_preferences(
 circle_id uuid not null references public.journey_circle_plans(id) on delete cascade,email text not null,
 reminders boolean not null default true,updated_at timestamptz not null default now(),primary key(circle_id,email)
);
alter table public.dydd_circle_email_preferences enable row level security;
revoke all on public.dydd_circle_email_preferences from anon,authenticated;
grant all on public.dydd_circle_email_preferences to service_role;

create table public.dydd_email_preference_tokens (
 token_hash text primary key, email text not null, category text not null, circle_id uuid references public.journey_circle_plans(id) on delete cascade,
 created_at timestamptz not null default now()
);
-- Sent content is frozen even if a future application accidentally updates its row.
create function public.dydd_lifecycle_immutable() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if old.status='accepted' and (new.subject,new.body,new.email,new.event_key,new.provider_id,new.accepted_at) is distinct from (old.subject,old.body,old.email,old.event_key,old.provider_id,old.accepted_at) then
  raise exception 'Accepted message history is immutable';
 end if;
 return new;
end $$;
create trigger dydd_lifecycle_immutable before update on public.dydd_lifecycle_jobs for each row execute function public.dydd_lifecycle_immutable();
-- A saved plan edit invalidates old approvals atomically. It never changes sent history.
create function public.dydd_circle_revision_changed() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.plan is distinct from old.plan or new.status is distinct from old.status then
  update public.dydd_circle_campaigns set status='superseded' where circle_id=new.id and status<>'superseded';
  update public.dydd_lifecycle_jobs set status='cancelled',error_message='Circle schedule or roster changed; re-review required.'
   where circle_id=new.id and status in ('queued','retry','sandbox_ready','processing');
 end if;
 return new;
end $$;
create trigger dydd_circle_revision_changed after update on public.journey_circle_plans for each row execute function public.dydd_circle_revision_changed();
create function public.dydd_claim_lifecycle_jobs(batch_size integer default 10) returns setof public.dydd_lifecycle_jobs language plpgsql set search_path=public,pg_temp as $$
begin
 if (select paused from public.dydd_lifecycle_settings where id) then return; end if;
 update public.dydd_lifecycle_jobs set status='review',error_message='Expired after an attempted send; reconcile provider acceptance, never replay stale content.'
  where (status='retry' or status in ('processing','submitting') and claimed_at<now()-interval '10 minutes') and first_attempt_at is not null and expires_at<=now();
 update public.dydd_lifecycle_jobs set status='skipped',error_message='Message expired; stale backlog is never sent.'
  where (status in ('queued','retry') or status='processing' and claimed_at<now()-interval '10 minutes') and expires_at<=now();
 update public.dydd_lifecycle_jobs set status='review',error_message='Reconcile provider acceptance before retry beyond idempotency window.'
  where (status='retry' or status in ('processing','submitting') and claimed_at<now()-interval '10 minutes') and first_attempt_at<now()-interval '23 hours';
 update public.dydd_lifecycle_jobs set status=case when send_authorized_at is not null then 'review' else 'failed' end,error_message='Retry limit reached; reconcile any ambiguous provider submission.' where (status='retry' or status in ('processing','submitting') and claimed_at<now()-interval '10 minutes') and attempts>=8;
 return query with picked as (
  select id from public.dydd_lifecycle_jobs where scheduled_at<=now() and expires_at>now() and next_attempt_at<=now()
  and (status in ('queued','retry') or status in ('processing','submitting') and claimed_at<now()-interval '10 minutes') and attempts<8
  order by scheduled_at,id for update skip locked limit greatest(1,least(batch_size,50))
 ) update public.dydd_lifecycle_jobs j set status='processing',attempts=j.attempts+1,claimed_at=now(),claim_token=gen_random_uuid(),first_attempt_at=coalesce(j.first_attempt_at,now())
 from picked where j.id=picked.id returning j.*;
end $$;
-- Ownership, revision matching, approval and publication share one row-locked transaction.
create or replace function public.dydd_queue_circle_member_messages(campaign_key uuid,membership_key uuid default null) returns integer language plpgsql set search_path=public,pg_temp as $$
declare c public.dydd_circle_campaigns; p public.journey_circle_plans; d public.dydd_circle_message_drafts; m public.dydd_circle_memberships; copy text; next_prep text; business_key text; n integer:=0; affected integer; revised boolean;
begin
 select * into c from public.dydd_circle_campaigns where id=campaign_key for share;
 if not found or c.status not in ('finalized','paused') then return 0; end if;
 select * into p from public.journey_circle_plans where id=c.circle_id for share;
 if p.status<>'active' or p.revision<>c.circle_revision then return 0; end if;
 select exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and message_key='schedule-change') into revised;
 select body into next_prep from public.dydd_circle_message_drafts where campaign_id=c.id and approved_at is not null and message_key like 'preparation-%' and expires_at>now() order by meeting_index limit 1;
 for m in select * from public.dydd_circle_memberships where circle_id=c.circle_id and status='accepted' and (membership_key is null or id=membership_key) loop
  for d in select * from public.dydd_circle_message_drafts where campaign_id=c.id and kind='member' and approved_at is not null and expires_at>now() and (scheduled_at>=now() or message_key in ('welcome','schedule-change')) loop
   if revised and (membership_key is null and d.message_key='welcome' or membership_key is not null and d.message_key='schedule-change') then continue; end if;
   copy:=replace(d.body,'{{next_preparation}}',coalesce(next_prep,'Your leader will confirm preparation for your next meeting.'));
   business_key:=case when d.message_key='welcome' then 'circle-welcome:'||m.id else 'circle:'||c.id||':'||d.id||':'||m.id end;
   insert into public.dydd_lifecycle_jobs(event_key,template_id,category,user_id,email,circle_id,campaign_id,draft_id,membership_id,subject,body,scheduled_at,expires_at,context)
   values(business_key,d.template_id,d.category,m.user_id,m.email,c.circle_id,c.id,d.id,m.id,d.subject,copy,greatest(d.scheduled_at,now()),d.expires_at,jsonb_build_object('kind','member'))
   on conflict(event_key) do update set campaign_id=excluded.campaign_id,draft_id=excluded.draft_id,subject=excluded.subject,body=excluded.body,scheduled_at=excluded.scheduled_at,expires_at=excluded.expires_at,status='queued',error_message=null
   where dydd_lifecycle_jobs.status in ('cancelled','skipped') and dydd_lifecycle_jobs.provider_id is null and dydd_lifecycle_jobs.send_authorized_at is null;
   get diagnostics affected=row_count;n:=n+affected;
  end loop;
 end loop;
 return n;
end $$;
revoke all on function public.dydd_queue_circle_member_messages(uuid,uuid) from public,anon,authenticated;
grant execute on function public.dydd_queue_circle_member_messages(uuid,uuid) to service_role;

create function public.dydd_finalize_circle_campaign(campaign_key uuid,actor_user uuid,actor_scope text) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare c public.dydd_circle_campaigns; p public.journey_circle_plans; n integer;
begin
 select * into c from public.dydd_circle_campaigns where id=campaign_key for update;
 if not found then raise exception 'Campaign not found'; end if;
 select * into p from public.journey_circle_plans where id=c.circle_id for update;
 if not ((actor_user is not null and p.user_id=actor_user) or (actor_user is null and actor_scope is not null and p.preview_scope=actor_scope)) then raise exception 'Creator authorization required'; end if;
 if p.status<>'active' or p.revision<>c.circle_revision or p.plan<>c.plan_snapshot or c.status='superseded' then raise exception 'Schedule changed; regenerate and approve the current messages'; end if;
 if c.status='finalized' then return jsonb_build_object('finalized',true,'alreadyFinalized',true); end if;
 if not exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id) or exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and approved_at is null) then raise exception 'Review and approve every written message first'; end if;
 if not exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and template_id='E02' and expires_at>now()) then raise exception 'Choose at least one future meeting before finalizing'; end if;
 update public.dydd_circle_campaigns set status='finalized',finalized_at=now() where id=c.id;
 n:=public.dydd_queue_circle_member_messages(c.id,null);
 return jsonb_build_object('finalized',true,'queued',n,'preview',p.user_id is null);
end $$;
create function public.dydd_update_circle_message(message_id uuid,actor_user uuid,actor_scope text,expected_revision integer,new_subject text,new_body text,approve boolean) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare d public.dydd_circle_message_drafts; c public.dydd_circle_campaigns; p public.journey_circle_plans;
begin
 select * into d from public.dydd_circle_message_drafts where id=message_id;
 if not found then raise exception 'Message not found'; end if;
 select * into c from public.dydd_circle_campaigns where id=d.campaign_id for update;
 select * into p from public.journey_circle_plans where id=c.circle_id for update;
 select * into d from public.dydd_circle_message_drafts where id=message_id for update;
 if not ((actor_user is not null and p.user_id=actor_user) or (actor_user is null and actor_scope is not null and p.preview_scope=actor_scope)) then raise exception 'Creator authorization required'; end if;
 if c.status<>'draft' or c.circle_revision<>p.revision or c.plan_snapshot<>p.plan then raise exception 'Reopen the latest draft schedule before editing'; end if;
 if d.revision<>expected_revision then raise exception 'Message changed in another tab; reload before approving'; end if;
 if length(trim(new_subject)) not between 1 and 200 or length(trim(new_body)) not between 1 and 30000 then raise exception 'Enter a subject and complete message'; end if;
 update public.dydd_circle_message_drafts set subject=trim(new_subject),body=trim(new_body),revision=revision+1,
 approved_at=case when approve then now() else null end,approved_by=case when approve then actor_user else null end,approved_scope=case when approve then actor_scope else null end where id=d.id returning * into d;
 return to_jsonb(d);
end $$;
-- Only new, verified account events after this migration. No SELECT over existing users/backfill.
create schema if not exists dydd_private;
revoke all on schema dydd_private from public,anon,authenticated;
create function dydd_private.capture_verified_account() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.email_confirmed_at is not null and (tg_op='INSERT' or old.email_confirmed_at is null) then
 insert into public.dydd_lifecycle_events(event_key,kind,user_id,email,source_id) values('account-verified:'||new.id,'account_verified',new.id,lower(new.email),new.id::text) on conflict(event_key) do nothing;
 end if; return new;
end $$;
create trigger dydd_capture_verified_account after insert or update of email_confirmed_at on auth.users for each row execute function dydd_private.capture_verified_account();
create function public.dydd_capture_lesson_event() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 insert into public.dydd_lifecycle_events(event_key,kind,user_id,source_id,payload) values('lesson:'||new.user_id||':'||new.course_slug||':'||new.lesson_slug,'lesson_completed',new.user_id,new.course_slug,jsonb_build_object('courseSlug',new.course_slug,'lessonSlug',new.lesson_slug)) on conflict(event_key) do nothing;
 return new;
end $$;
create trigger dydd_capture_lesson_event after insert on public.passport_lesson_completions for each row execute function public.dydd_capture_lesson_event();
-- Capture post-launch readiness transitions only; never import existing snapshots.
create function public.dydd_capture_report_ready() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.source in ('designid_app','designpd_app','spiritual_gifts_app')
 and new.scores->'pdfMonkey'->>'status' in ('ready','success')
 and (tg_op='INSERT' or coalesce(old.scores->'pdfMonkey'->>'status','') not in ('ready','success')) then
 insert into public.dydd_lifecycle_events(event_key,kind,user_id,source_id,payload)
 values('report-ready:'||new.id,'report_ready',new.user_id,new.id::text,jsonb_build_object('assessmentType',new.assessment_type,'participantId',new.participant_id)) on conflict(event_key) do nothing;
 end if; return new;
end $$;
create trigger dydd_capture_report_ready after insert or update of scores on public.assessment_snapshots for each row execute function public.dydd_capture_report_ready();
create function public.dydd_capture_membership() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.status='accepted' and old.status<>'accepted' then
 insert into public.dydd_lifecycle_events(event_key,kind,user_id,email,source_id,payload) values('circle-accepted:'||new.id,'circle_accepted',new.user_id,new.email,new.id::text,jsonb_build_object('circleId',new.circle_id)) on conflict(event_key) do nothing;
 end if; return new;
end $$;
create trigger dydd_capture_membership after update of status on public.dydd_circle_memberships for each row execute function public.dydd_capture_membership();
create function public.dydd_capture_campaign() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.status='finalized' and old.finalized_at is null then
 insert into public.dydd_lifecycle_events(event_key,kind,source_id,payload) values('circle-finalized:'||new.id,'circle_finalized',new.id::text,jsonb_build_object('circleId',new.circle_id)) on conflict(event_key) do nothing;
 end if; return new;
end $$;
create trigger dydd_capture_campaign after update of status on public.dydd_circle_campaigns for each row execute function public.dydd_capture_campaign();
create function public.dydd_unsubscribe_category(token_key text) returns boolean language plpgsql set search_path=public,pg_temp as $$
declare t public.dydd_email_preference_tokens;
begin
 select * into t from public.dydd_email_preference_tokens where token_hash=token_key;
 if not found then return false; end if;
 if t.category='circle' and t.circle_id is not null then
  insert into public.dydd_circle_email_preferences(circle_id,email,reminders) values(t.circle_id,t.email,false) on conflict(circle_id,email) do update set reminders=false,updated_at=now();
  update public.dydd_circle_memberships set reminders=false where email=t.email and circle_id=t.circle_id;
 else
  insert into public.dydd_email_preferences(email) values(t.email) on conflict(email) do nothing;
  if t.category='growth' then update public.dydd_email_preferences set growth=false,updated_at=now() where email=t.email;
  elsif t.category='learning' then update public.dydd_email_preferences set learning=false,updated_at=now() where email=t.email;
  elsif t.category='all' then
   update public.dydd_email_preferences set optional_disabled=true,learning=false,growth=false,updated_at=now() where email=t.email;
   update public.dydd_waypoint_subscriptions set status='unsubscribed' where email=t.email;
  else return false;
  end if;
 end if;
 return true;
end $$;
revoke all on function public.dydd_unsubscribe_category(text) from public,anon,authenticated;
grant execute on function public.dydd_unsubscribe_category(text) to service_role;
-- All tables/RPCs private to the trusted app. No client metadata-based privileges.
do $$ declare t text; begin
 foreach t in array array['dydd_lifecycle_settings','dydd_email_preferences','dydd_circle_memberships','dydd_circle_campaigns','dydd_circle_message_drafts','dydd_lifecycle_events','dydd_lifecycle_jobs','dydd_email_preference_tokens'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
revoke all on function public.dydd_claim_lifecycle_jobs(integer),public.dydd_finalize_circle_campaign(uuid,uuid,text),public.dydd_update_circle_message(uuid,uuid,text,integer,text,text,boolean) from public,anon,authenticated;
grant execute on function public.dydd_claim_lifecycle_jobs(integer),public.dydd_finalize_circle_campaign(uuid,uuid,text),public.dydd_update_circle_message(uuid,uuid,text,integer,text,text,boolean) to service_role;
revoke all on function dydd_private.capture_verified_account() from public,anon,authenticated;
create or replace function public.dydd_issue_circle_invitation(campaign_key uuid,actor_user uuid,recipient text,person_name text,new_token_hash text,expires timestamptz,invitation_url text) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare c public.dydd_circle_campaigns; p public.journey_circle_plans; m public.dydd_circle_memberships; created uuid; d public.dydd_circle_message_drafts; reminder public.dydd_circle_message_drafts;
begin
 select * into c from public.dydd_circle_campaigns where id=campaign_key for share;
 select * into p from public.journey_circle_plans where id=c.circle_id for share;
 if actor_user is null or p.user_id is distinct from actor_user or p.status<>'active' or p.revision<>c.circle_revision or c.status<>'finalized' then raise exception 'Creator and finalized current schedule required'; end if;
 if not exists(select 1 from public.dydd_circle_message_drafts where campaign_id=c.id and message_key='invitation' and approved_at is not null) then raise exception 'Approved invitation required'; end if;
 if not exists(select 1 from jsonb_array_elements(p.plan->'participants') v where lower(v->>'email')=recipient) then raise exception 'Recipient not in current roster'; end if;
 insert into public.dydd_circle_memberships(circle_id,email,display_name,token_hash,expires_at) values(p.id,recipient,person_name,new_token_hash,expires) on conflict(circle_id,email) do nothing returning id into created;
 select * into m from public.dydd_circle_memberships where circle_id=p.id and email=recipient for update;
 if created is null then
  if m.status not in ('invited','expired') or m.invited_at>now()-interval '24 hours' then return null; end if;
  update public.dydd_circle_memberships set status='invited',token_hash=new_token_hash,expires_at=expires,invited_at=now(),display_name=person_name where id=m.id returning * into m;
 end if;
 select * into d from public.dydd_circle_message_drafts where campaign_id=c.id and message_key='invitation';
 insert into public.dydd_lifecycle_jobs(event_key,template_id,category,email,circle_id,campaign_id,draft_id,membership_id,subject,body,scheduled_at,expires_at,context)
 values('circle-invite:'||m.id||':'||new_token_hash,'D01','service',recipient,p.id,c.id,d.id,m.id,d.subject,replace(d.body,'{{invitation_url}}',invitation_url),now(),expires,jsonb_build_object('kind','invitation','tokenHash',new_token_hash)) on conflict(event_key) do nothing;
 select * into reminder from public.dydd_circle_message_drafts where campaign_id=c.id and message_key='invitation-reminder' and approved_at is not null;
 if found and now()+interval '4 days'<reminder.expires_at then
  insert into public.dydd_lifecycle_jobs(event_key,template_id,category,email,circle_id,campaign_id,draft_id,membership_id,subject,body,scheduled_at,expires_at,context)
  values('circle-invite-reminder:'||m.id,'D02','service',recipient,p.id,c.id,reminder.id,m.id,reminder.subject,replace(reminder.body,'{{invitation_url}}',invitation_url),now()+interval '4 days',reminder.expires_at,jsonb_build_object('kind','invitation','tokenHash',new_token_hash)) on conflict(event_key) do nothing;
 end if;
 return to_jsonb(m);
end $$;
revoke all on function public.dydd_issue_circle_invitation(uuid,uuid,text,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.dydd_issue_circle_invitation(uuid,uuid,text,text,text,timestamptz,text) to service_role;
create or replace function public.dydd_authorize_lifecycle_send(job_key uuid,lease_token uuid) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare j public.dydd_lifecycle_jobs; c public.dydd_circle_campaigns; p public.journey_circle_plans; d public.dydd_circle_message_drafts; m public.dydd_circle_memberships; pref public.dydd_email_preferences; settings public.dydd_lifecycle_settings; count_week integer; last_optional timestamptz;
begin
 -- One brief settings-row reservation serializes cadence authorization, not network I/O.
 select * into settings from public.dydd_lifecycle_settings where id for update;
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
  if p.status<>'active' or p.revision<>c.circle_revision or c.status='superseded' or (j.context ? 'announcementId' and not exists(select 1 from public.dydd_circle_announcements where id=(j.context->>'announcementId')::uuid and campaign_id=c.id and status='published' and approved_at is not null)) or (not (j.context ? 'announcementId') and d.approved_at is null) then return jsonb_build_object('authorized',false,'stop','Schedule or approval changed before submission.'); end if;
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
revoke all on function public.dydd_authorize_lifecycle_send(uuid,uuid) from public,anon,authenticated;
grant execute on function public.dydd_authorize_lifecycle_send(uuid,uuid) to service_role;

create table public.dydd_waypoint_confirmations (
 id uuid primary key default gen_random_uuid(), email text not null, user_id uuid references auth.users(id) on delete set null,
 token_hash text unique not null, network_hash text, created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '24 hours', used_at timestamptz
);
create index dydd_waypoint_confirmation_email on public.dydd_waypoint_confirmations(email,created_at);
alter table public.dydd_waypoint_confirmations enable row level security;
revoke all on public.dydd_waypoint_confirmations from anon,authenticated;
grant all on public.dydd_waypoint_confirmations to service_role;
create function public.dydd_request_waypoint_confirmation(recipient text,user_key uuid,hashed_token text,hashed_network text,sender_payload jsonb) returns jsonb language plpgsql set search_path=public,pg_temp as $$
declare row public.dydd_waypoint_confirmations;
begin
 perform pg_advisory_xact_lock(hashtextextended('waypoint-confirmation:'||recipient,0));
 if exists(select 1 from public.dydd_waypoint_confirmations where email=recipient and created_at>now()-interval '1 hour') or (select count(*) from public.dydd_waypoint_confirmations where email=recipient and created_at>now()-interval '1 day')>=3 then return null; end if;
 if hashed_network is not null then
  perform pg_advisory_xact_lock(hashtextextended('waypoint-confirmation-network:'||hashed_network,0));
  if (select count(*) from public.dydd_waypoint_confirmations where network_hash=hashed_network and created_at>now()-interval '1 hour')>=10 then return null; end if;
 end if;
 insert into public.dydd_waypoint_confirmations(email,user_id,token_hash,network_hash) values(recipient,user_key,hashed_token,hashed_network) returning * into row;
 insert into public.dydd_lifecycle_jobs(event_key,template_id,category,email,subject,body,scheduled_at,expires_at,context) values('application:'||(sender_payload->>'idempotencyKey'),'G02','service',recipient,sender_payload->>'subject',sender_payload->>'text',now(),least(row.expires_at,now()+interval '23 hours'),jsonb_build_object('kind','application','deliveryContext',jsonb_build_object('type','waypoint_confirmation','confirmationId',row.id),'senderInput',sender_payload,'deliveryKey',sender_payload->>'idempotencyKey'));
 return jsonb_build_object('id',row.id,'expires_at',row.expires_at);
end $$;
create function public.dydd_confirm_waypoint_subscription(hashed_token text) returns boolean language plpgsql set search_path=public,pg_temp as $$
declare c public.dydd_waypoint_confirmations;
begin
 select * into c from public.dydd_waypoint_confirmations where token_hash=hashed_token for update;
 if not found then return false; end if;
 if c.used_at is not null then return true; end if;
 if c.expires_at<=now() then return false; end if;
 insert into public.dydd_waypoint_subscriptions(email,user_id,status,confirmed_at,source,preferences) values(c.email,c.user_id,'active',now(),'confirmed_app_signup',jsonb_build_object('delivery_day','Friday','delivery_time','8:00 AM Eastern'))
 on conflict(email) do update set status=case when dydd_waypoint_subscriptions.status='bounced' then 'bounced' else 'active' end,confirmed_at=now(),user_id=coalesce(dydd_waypoint_subscriptions.user_id,excluded.user_id);
 update public.dydd_waypoint_confirmations set used_at=now() where id=c.id;
 return true;
end $$;
revoke all on function public.dydd_request_waypoint_confirmation(text,uuid,text,text,jsonb),public.dydd_confirm_waypoint_subscription(text) from public,anon,authenticated;
grant execute on function public.dydd_request_waypoint_confirmation(text,uuid,text,text,jsonb),public.dydd_confirm_waypoint_subscription(text) to service_role;

create function dydd_private.capture_course_enrollment() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is not null and auth.uid()<>new.user_id then return new; end if;
 if new.source='course' and new.legacy_key is null and new.started_at>=(select activated_at from public.dydd_lifecycle_settings where id)
 and not exists(select 1 from public.reflection_rounds where user_id=new.user_id and course_slug=new.course_slug and id<>new.id) then
 insert into public.dydd_lifecycle_events(event_key,kind,user_id,source_id,payload) values('course-enrolled:'||new.user_id||':'||new.course_slug,'course_enrolled',new.user_id,new.id::text,jsonb_build_object('courseSlug',new.course_slug)) on conflict(event_key) do nothing;
 end if;return new;
end $$;
create trigger dydd_capture_course_enrollment after insert on public.reflection_rounds for each row execute function dydd_private.capture_course_enrollment();
revoke all on function dydd_private.capture_course_enrollment() from public,anon,authenticated;
create function public.dydd_capture_fruitlife_lifecycle() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if new.self_completed_at is not null and old.self_completed_at is null then
 insert into public.dydd_lifecycle_events(event_key,kind,email,source_id) values('fruitlife-self-complete:'||new.id,'fruitlife_self_completed',lower(new.participant_email),new.id::text) on conflict(event_key) do nothing;
 end if;
 if new.report_status in ('ready','sent') and old.report_status not in ('ready','sent') and new.report_snapshot_id is not null then
 insert into public.dydd_lifecycle_events(event_key,kind,email,source_id,payload) values('fruitlife-report-ready:'||new.id,'report_ready',lower(new.participant_email),new.id::text,jsonb_build_object('assessmentType','fruit_360','fruitlifeSessionId',new.id)) on conflict(event_key) do nothing;
 end if;return new;
end $$;
create trigger dydd_capture_fruitlife_lifecycle after update of self_completed_at,report_status on public.fruitlife_360_sessions for each row execute function public.dydd_capture_fruitlife_lifecycle();

commit;
