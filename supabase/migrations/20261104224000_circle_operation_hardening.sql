-- Follow-up after applied221000: enforce actor Personal on new activity and keep growing roster target coherent.
begin;
create or replace function public.dydd_circle_operate(actor uuid, payload jsonb, owner_actor boolean default false) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare a text:=payload->>'action';c journey_circle_plans;m dydd_circle_memberships;req dydd_circle_cohort_requests;preview dydd_circle_roster_previews;r jsonb;tok text;inv uuid;target uuid;out_rows jsonb:='[]';cap integer;occupied integer;life text;member_ok boolean;owner_ok boolean;email_value text;target_email text;uid uuid;row_count integer;begin
 if actor is null or not public.dydd_circle_verified_actor(actor) then raise exception 'Verified account required';end if;
 if a='set_limits' then
 if not owner_actor then raise exception 'Owner approval required';end if;
 insert into dydd_circle_operation_limits(user_id,daily,monthly,burst,invite_daily,invite_burst) values((payload->>'userId')::uuid,(payload->>'daily')::integer,(payload->>'monthly')::integer,(payload->>'burst')::integer,(payload->>'inviteDaily')::integer,(payload->>'inviteBurst')::integer)
 on conflict(user_id) do update set daily=excluded.daily,monthly=excluded.monthly,burst=excluded.burst,invite_daily=excluded.invite_daily,invite_burst=excluded.invite_burst;return '{"saved":true}';end if;
 if a in('accept_invite','decline_invite') then
 select * into m from dydd_circle_memberships where token_hash=encode(extensions.digest(payload->>'token','sha256'),'hex');
 if m.id is null then raise exception 'Invitation not available';end if;
 else
 if a='approve_cohort' then select * into req from dydd_circle_cohort_requests where id=(payload->>'requestId')::uuid;payload:=payload||jsonb_build_object('circleId',req.circle_id);end if;
 end if;
 select * into c from journey_circle_plans where id=coalesce(m.circle_id,(payload->>'circleId')::uuid) for update;
 if c.id is null then raise exception 'Circle not found';end if;
 owner_ok:=c.user_id=actor;
 select exists(select 1 from dydd_circle_memberships where circle_id=c.id and user_id=actor and status='accepted') into member_ok;
 life:=dydd_circle_lifecycle(c.user_id,c.id,c.plan->>'format');
 if a in('accept_invite','decline_invite') then
 select * into m from dydd_circle_memberships where id=m.id for update;
 if not public.dydd_circle_verified_actor(actor,m.email) then raise exception 'This invitation is bound to a different verified email';end if;
 if a='accept_invite' and m.status='accepted' and m.user_id=actor then return '{"accepted":true}';end if;
 if m.status<>'invited' or m.expires_at<=now() then raise exception 'Invitation expired or already responded';end if;
 if a='accept_invite' and not dydd_circle_personal(actor) then raise exception 'Activate your own Personal membership in Base Camp before joining';end if;
 update dydd_circle_memberships set status=case when a='accept_invite' then 'accepted' else 'declined' end,user_id=actor,accepted_at=case when a='accept_invite' then now() else null end where id=m.id;
 return jsonb_build_object('accepted',a='accept_invite','declined',a='decline_invite');end if;
 if a='approve_cohort' then
 if not owner_actor then raise exception 'Owner approval required';end if;
 if req.status<>'pending' then raise exception 'Request already reviewed';end if;
 if (payload->>'seatCap')::integer<req.enrollment then raise exception 'Approved cap must cover requested enrollment';end if;
 update dydd_circle_cohort_requests set status='approved',seat_cap=(payload->>'seatCap')::integer,approved_by=actor where id=req.id;
 return jsonb_build_object('approved',true,'circleId',c.id,'seatCap',(payload->>'seatCap')::integer);end if;
 if not(owner_ok or member_ok) then raise exception 'Circle membership required';end if;
 -- Privacy withdrawal remains possible even after the paid operating period.
 if a='consent' then
 insert into dydd_circle_consents(circle_id,user_id,people,insights) values(c.id,actor,coalesce((payload->>'people')::boolean,false),coalesce((payload->>'insights')::boolean,false)) on conflict(circle_id,user_id) do update set people=excluded.people,insights=excluded.insights,updated_at=now();return '{"saved":true}';end if;
 if a='withdraw_callout' then delete from dydd_circle_callouts where circle_id=c.id and user_id=actor and session=payload->>'session' and lesson=payload->>'lesson' and prompt=payload->>'prompt';return '{"withdrawn":true}';end if;
 if a='leave' then update dydd_circle_memberships set status='left' where circle_id=c.id and user_id=actor and status='accepted';delete from dydd_circle_callouts where circle_id=c.id and user_id=actor;delete from dydd_circle_consents where circle_id=c.id and user_id=actor;return '{"left":true}';end if;
 if not public.dydd_circle_personal(actor) then raise exception 'Your own active Personal membership is required for new shared activity';end if;
 if life='readonly' then raise exception 'Circle is read-only; renew Leadership';end if;
 if a='callout' then
 if c.status<>'active' then raise exception 'Circle is not active';end if;
 if c.plan->>'format'='Cohort' and (coalesce(payload->>'text','')<>'' or coalesce((payload->>'shareText')::boolean,false)) then raise exception 'Cohorts collect counts only; no written submissions';end if;
 if coalesce(payload->>'session','')='' or coalesce(payload->>'lesson','')='' or coalesce(payload->>'prompt','')='' or length(payload->>'session')>200 or length(payload->>'lesson')>200 or length(payload->>'prompt')>200 then raise exception 'Choose session, lesson and prompt';end if;
 if not coalesce((payload->>'shareText')::boolean,false) and coalesce(payload->>'text','')<>'' then raise exception 'Explicit sharing consent required to submit writing';end if;
 insert into dydd_circle_callouts(circle_id,user_id,session,lesson,prompt,marked,share_text,body,audience) values(c.id,actor,payload->>'session',payload->>'lesson',payload->>'prompt',coalesce((payload->>'marked')::boolean,true),coalesce((payload->>'shareText')::boolean,false),coalesce(payload->>'text',''),coalesce(payload->>'audience','leader'))
 on conflict(circle_id,user_id,session,lesson,prompt) do update set marked=excluded.marked,share_text=excluded.share_text,body=excluded.body,audience=excluded.audience,updated_at=now();return '{"saved":true}';end if;
 if not owner_ok then raise exception 'Circle creator permission required';end if;
 if a='transfer' then
 if c.plan->>'format'='Couple' then raise exception 'Couples replacement requires owner support';end if;
 target:=(payload->>'toUserId')::uuid;
 if target=actor or not exists(select 1 from dydd_circle_memberships where circle_id=c.id and user_id=target and status='accepted') or not dydd_circle_personal(target) or dydd_circle_lifecycle(target,c.id,'Class')<>'full' then raise exception 'Transfer requires an accepted member with Personal and active Leadership';end if;
 -- Preserve former creator as a participant; remove the new creator membership so seat count stays stable.
 email_value:=payload->>'_actorEmail'; if email_value is null or not public.dydd_circle_verified_actor(actor,email_value) then raise exception 'Verified transfer actor email required';end if;
 select email into target_email from dydd_circle_memberships where circle_id=c.id and user_id=target and status='accepted';
 delete from dydd_circle_memberships where circle_id=c.id and user_id=target;
 update journey_circle_plans set user_id=target,revision=revision+1,updated_at=now(),plan=jsonb_set(plan,'{participants}',coalesce((select jsonb_agg(v) from jsonb_array_elements(plan->'participants') v where lower(v->>'email')<>target_email),'[]')||jsonb_build_array(jsonb_build_object('name','Former leader','email',email_value))) where id=c.id;
 insert into dydd_circle_memberships(circle_id,email,display_name,user_id,status,token_hash,expires_at,accepted_at) values(c.id,email_value,'Former leader',actor,'accepted',encode(extensions.gen_random_bytes(32),'hex'),now()+interval '14 days',now()) on conflict(circle_id,email) do update set user_id=actor,status='accepted',accepted_at=now();
 return '{"transferred":true}';end if;
 if a='revoke_invite' then update dydd_circle_memberships set status='revoked' where id=(payload->>'membershipId')::uuid and circle_id=c.id and status='invited';return '{"saved":true}';end if;
 if a='set_role' then update dydd_circle_memberships set role=payload->>'role' where id=(payload->>'membershipId')::uuid and circle_id=c.id and status='accepted';return '{"saved":true}';end if;
 if life<>'full' then raise exception 'Transition: current work and transfer only; no new Circles or invitations';end if;
 if not dydd_circle_personal(actor) then raise exception 'Personal membership required';end if;
 if a='request_cohort' then
 if c.plan->>'format'='Couple' then raise exception 'Couples cannot be enlarged';end if;
 if length(trim(payload->>'organization')) not between 2 and 200 or length(trim(payload->>'purpose')) not between 5 and 2000 or length(trim(payload->>'details')) not between 5 and 4000 or (payload->>'enrollment')::integer not between 50 and 100000 or (payload->>'launchDate')::date<current_date then raise exception 'Provide organization, purpose, enrollment, future launch and operating details';end if;
 insert into dydd_circle_cohort_requests(circle_id,user_id,organization,purpose,enrollment,launch_date,details) values(c.id,actor,payload->>'organization',payload->>'purpose',(payload->>'enrollment')::integer,(payload->>'launchDate')::date,payload->>'details') on conflict(circle_id) where status='pending' do nothing;
 select * into req from dydd_circle_cohort_requests where circle_id=c.id and status='pending';
 insert into dydd_circle_held_outbox(circle_id,event_key,recipient,kind,payload) values(c.id,'cohort-request:'||req.id,coalesce(nullif(payload->>'ownerEmail',''),'owner-review'),'cohort_approval',to_jsonb(req)) on conflict(event_key) do nothing;
 return jsonb_build_object('request',to_jsonb(req),'delivery','sandbox_held');end if;
 if a='preview_roster' then
 cap:=dydd_circle_capacity(c.id,c.plan);
 select 1+count(*) into occupied from dydd_circle_memberships where circle_id=c.id and (status='accepted' or(status='invited' and expires_at>now()));
 select count(*) into row_count from jsonb_array_elements(payload->'rows') v where not exists(select 1 from dydd_circle_memberships where circle_id=c.id and email=lower(v->>'email') and (status='accepted' or(status='invited' and expires_at>now())));
 if occupied+row_count>cap then payload:=jsonb_set(payload,'{errors}',coalesce(payload->'errors','[]')||jsonb_build_array(jsonb_build_object('row',0,'error','Roster exceeds available approved seats (pending invitations reserve seats).')));end if;
 if exists(select 1 from jsonb_array_elements(payload->'rows') v where public.dydd_circle_verified_actor(actor,lower(v->>'email'))) then payload:=jsonb_set(payload,'{errors}',coalesce(payload->'errors','[]')||jsonb_build_array(jsonb_build_object('row',0,'error','Creator already occupies a seat; remove their email.')));end if;
 insert into dydd_circle_roster_previews(circle_id,user_id,rows,errors) values(c.id,actor,payload->'rows',coalesce(payload->'errors','[]')) returning * into preview;
 return jsonb_build_object('previewId',preview.id,'rows',preview.rows,'errors',preview.errors,'canInvite',jsonb_array_length(preview.errors)=0);end if;
 if a in('invite','invite_roster') then
 if c.status<>'active' then raise exception 'Activate the Circle before inviting';end if;
 if a='invite_roster' then
 select * into preview from dydd_circle_roster_previews where id=(payload->>'previewId')::uuid and circle_id=c.id and user_id=actor for update;
 if preview.id is null or preview.consumed_at is not null or preview.created_at<now()-interval '24 hours' or jsonb_array_length(preview.errors)>0 then raise exception 'Create a fresh valid roster preview';end if;
 out_rows:=preview.rows;
 else out_rows:=jsonb_build_array(jsonb_build_object('name',payload->>'name','email',payload->>'email'));end if;
 if jsonb_array_length(out_rows) not between 1 and 1000 then raise exception 'Invite 1–1000 rows per preview';end if;
 for r in select * from jsonb_array_elements(out_rows) loop
 email_value:=lower(trim(r->>'email'));
 if email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(email_value)>254 or length(trim(r->>'name')) not between 1 and 160 then raise exception 'Invalid roster name or email';end if;
 if public.dydd_circle_verified_actor(actor,email_value) then raise exception 'Leader already occupies a seat; remove their email from roster';end if;
 select * into m from dydd_circle_memberships where circle_id=c.id and email=email_value;
 if m.id is not null and (m.status='accepted' or(m.status='invited' and m.expires_at>now())) then continue;end if;
 tok:=encode(extensions.gen_random_bytes(32),'hex');
 insert into dydd_circle_memberships(circle_id,email,display_name,status,token_hash,expires_at) values(c.id,email_value,trim(r->>'name'),'invited',encode(extensions.digest(tok,'sha256'),'hex'),now()+interval '14 days') on conflict(circle_id,email) do update set display_name=excluded.display_name,status='invited',token_hash=excluded.token_hash,expires_at=excluded.expires_at,user_id=null,accepted_at=null,invited_at=now() returning id into inv;
 insert into dydd_circle_held_outbox(circle_id,event_key,recipient,kind,payload) values(c.id,'invite:'||inv||':'||encode(extensions.digest(tok,'sha256'),'hex'),email_value,'invitation',jsonb_build_object('membershipId',inv,'token',tok,'name',c.plan->>'name'));
 end loop;
 -- Keep accepted roster aligned with existing legacy data/report joins. No private data is copied.
 update journey_circle_plans set plan=jsonb_set(jsonb_set(plan,'{expectedPeople}',to_jsonb(greatest((plan->>'expectedPeople')::integer,1+(select count(*)::integer from dydd_circle_memberships where circle_id=c.id and (status='accepted' or(status='invited' and expires_at>now()))))::text)),'{participants}',coalesce((select jsonb_agg(jsonb_build_object('name',display_name,'email',email)) from dydd_circle_memberships where circle_id=c.id and (status='accepted' or(status='invited' and expires_at>now()))),'[]')),revision=revision+1,updated_at=now() where id=c.id;
 if a='invite_roster' then update dydd_circle_roster_previews set consumed_at=now() where id=preview.id;end if;
 return jsonb_build_object('saved',true,'delivery','sandbox_held');end if;
 raise exception 'Unknown Circle operation';
end $$;
commit;
