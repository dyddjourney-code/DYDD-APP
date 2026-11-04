-- A format change cannot move written Small/Class submissions into a counts-only Cohort.
begin;
create function public.dydd_cohort_conversion_guard() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if new.plan->>'format'='Cohort' and exists(select 1 from public.dydd_circle_callouts c where c.circle_id=new.id and (c.body<>'' or c.share_text or not exists(select 1 from public.dydd_circle_prompt_catalog p where p.prompt=c.prompt and p.lesson=c.lesson))) then raise exception 'Preserve this Circle’s written callouts; create a separately approved counts-only Cohort';end if;
 return new;
end $$;
create trigger dydd_cohort_conversion_guard before update on public.journey_circle_plans for each row execute function public.dydd_cohort_conversion_guard();
revoke all on function public.dydd_cohort_conversion_guard() from public,anon,authenticated;
grant execute on function public.dydd_cohort_conversion_guard() to service_role;
commit;
