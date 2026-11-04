-- Both accepted personally subscribed spouses may edit shared logistics, never private work or pairing.
begin;
create function public.dydd_circle_save_shared_plan(p_actor uuid,p_circle uuid,p_revision integer,p_patch jsonb) returns jsonb
language plpgsql security invoker set search_path=public,pg_temp as $$
declare c public.journey_circle_plans;safe_patch jsonb;result jsonb;
begin
 select * into c from public.journey_circle_plans where id=p_circle for update;
 if c.id is null or c.plan->>'format'<>'Couple' or c.status<>'active' then raise exception 'Choose an active Couples Circle';end if;
 if c.user_id<>p_actor and not exists(select 1 from public.dydd_circle_memberships where circle_id=c.id and user_id=p_actor and status='accepted') then raise exception 'Accepted spouse permission required';end if;
 if not public.dydd_circle_personal(p_actor) then raise exception 'Your own Personal membership is required';end if;
 perform public.dydd_circle_require_billing(c.user_id,c.id,'Couple','operate');
 if c.revision<>p_revision then raise exception 'This shared plan changed. Reload before saving';end if;
 if jsonb_typeof(p_patch)<>'object' or exists(select 1 from jsonb_object_keys(p_patch) k where k not in('startDate','time','timezone','meetingMode','location','breaks','movedDates')) then raise exception 'Only shared dates, holidays and gathering details may change';end if;
 safe_patch:=p_patch;
 if coalesce(safe_patch->>'startDate',c.plan->>'startDate') !~ '^\d{4}-\d{2}-\d{2}$' or length(coalesce(safe_patch->>'location',''))>500 then raise exception 'Check gathering dates and location';end if;
 update public.journey_circle_plans set plan=plan||safe_patch,revision=revision+1,updated_at=now() where id=c.id returning jsonb_build_object('id',id,'plan',plan,'revision',revision,'status',status) into result;
 return result;
end $$;
revoke all on function public.dydd_circle_save_shared_plan(uuid,uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.dydd_circle_save_shared_plan(uuid,uuid,integer,jsonb) to service_role;
commit;
