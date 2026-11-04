-- Sandboxed planner PDF generation shares a durable account-level budget.
begin;
create function public.dydd_circle_report_budget(who uuid) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare daily_count integer;monthly_count integer;burst_count integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(who::text,42));
 select coalesce(sum(units) filter(where created_at>now()-interval '24 hours'),0),coalesce(sum(units),0),coalesce(sum(units) filter(where created_at>now()-interval '1 minute'),0)
 into daily_count,monthly_count,burst_count from public.dydd_circle_operation_events where user_id=who and kind='report' and created_at>now()-interval '30 days';
 if daily_count>=20 or monthly_count>=100 or burst_count>=3 then raise exception 'Plan PDF budget reached. Try later or ask the owner for help.';end if;
 insert into public.dydd_circle_operation_events(user_id,kind,units) values(who,'report',1);
end $$;
revoke all on function public.dydd_circle_report_budget(uuid) from public,anon,authenticated;
grant execute on function public.dydd_circle_report_budget(uuid) to service_role;
commit;
