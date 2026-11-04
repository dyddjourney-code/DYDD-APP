-- Sandbox-only Nov 4 integration. Exact live-function replacement, no backfill or provider send.
begin;
do $patch$
declare definition text; old_update text := $old$ update journey_circle_plans set plan=jsonb_set(jsonb_set(plan,'{expectedPeople}',to_jsonb(greatest((plan->>'expectedPeople')::integer,1+(select count(*)::integer from dydd_circle_memberships where circle_id=c.id and (status='accepted' or(status='invited' and expires_at>now()))))::text)),'{participants}',coalesce((select jsonb_agg(jsonb_build_object('name',display_name,'email',email)) from dydd_circle_memberships where circle_id=c.id and (status='accepted' or(status='invited' and expires_at>now()))),'[]')),revision=revision+1,updated_at=now() where id=c.id;$old$; new_update text := $new$ with proposed as (select jsonb_set(jsonb_set(plan,'{expectedPeople}',to_jsonb(greatest((plan->>'expectedPeople')::integer,1+(select count(*)::integer from dydd_circle_memberships where circle_id=c.id and (status='accepted' or(status='invited' and expires_at>now()))))::text)),'{participants}',coalesce((select jsonb_agg(jsonb_build_object('name',display_name,'email',email)) from dydd_circle_memberships where circle_id=c.id and (status='accepted' or(status='invited' and expires_at>now()))),'[]')) as next_plan from journey_circle_plans where id=c.id)
 update journey_circle_plans p set plan=proposed.next_plan,revision=p.revision+1,updated_at=now() from proposed where p.id=c.id and p.plan is distinct from proposed.next_plan;$new$;
begin
 select pg_get_functiondef('public.dydd_circle_operate(uuid,jsonb,boolean)'::regprocedure) into definition;
 if md5(definition) <> '7ffc60a06f71aefc309f865f7ade508e' then raise exception 'Circle function drift: inspect live sandbox definition before applying'; end if;
 if (length(definition)-length(replace(definition,old_update,'')))/length(old_update) <> 1 then raise exception 'Exact invite roster UPDATE match required'; end if;
 execute replace(definition,old_update,new_update);
end $patch$;

-- Private trigger-only bridge; no token or other held payload is copied.
create function dydd_private.capture_circle_held_invitation() returns trigger
language plpgsql security definer set search_path='' as $bridge$
begin
 insert into public.dydd_lifecycle_events(event_key,kind,email,source_id,payload)
 values('circle-held-invitation:'||new.id,'circle_invited',lower(new.recipient),new.id::text,jsonb_build_object('circleId',new.circle_id))
 on conflict(event_key) do nothing;
 return new;
end $bridge$;
revoke all on function dydd_private.capture_circle_held_invitation() from public,anon,authenticated;
create trigger dydd_capture_circle_held_invitation
after insert on public.dydd_circle_held_outbox
for each row when (new.kind='invitation')
execute function dydd_private.capture_circle_held_invitation();
commit;
