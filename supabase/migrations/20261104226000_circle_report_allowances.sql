-- Explicit owner-approved PDF allowances; no resetting of durable usage counters.
begin;
alter table public.dydd_circle_operation_limits add column report_daily integer not null default 20 check(report_daily between 1 and 10000),add column report_monthly integer not null default 100 check(report_monthly between 1 and 100000),add column report_burst integer not null default 3 check(report_burst between 1 and 1000);
create or replace function public.dydd_circle_report_budget(who uuid) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare d integer;m integer;b integer;lim public.dydd_circle_operation_limits;
begin
 perform pg_advisory_xact_lock(hashtextextended(who::text,42));
 select * into lim from public.dydd_circle_operation_limits where user_id=who;
 select coalesce(sum(units) filter(where created_at>now()-interval '24 hours'),0),coalesce(sum(units),0),coalesce(sum(units) filter(where created_at>now()-interval '1 minute'),0) into d,m,b from public.dydd_circle_operation_events where user_id=who and kind='report' and created_at>now()-interval '30 days';
 if d>=coalesce(lim.report_daily,20) or m>=coalesce(lim.report_monthly,100) or b>=coalesce(lim.report_burst,3) then raise exception 'Plan PDF budget reached. Try later or request an owner allowance.';end if;
 insert into public.dydd_circle_operation_events(user_id,kind,units) values(who,'report',1);
end $$;
create function public.dydd_circle_set_report_limits(p_user uuid,p_daily integer,p_monthly integer,p_burst integer) returns void
language sql security invoker set search_path=public,pg_temp as $$
 insert into public.dydd_circle_operation_limits(user_id,report_daily,report_monthly,report_burst) values(p_user,p_daily,p_monthly,p_burst) on conflict(user_id) do update set report_daily=excluded.report_daily,report_monthly=excluded.report_monthly,report_burst=excluded.report_burst;
$$;
revoke all on function public.dydd_circle_set_report_limits(uuid,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.dydd_circle_set_report_limits(uuid,integer,integer,integer) to service_role;
commit;
