-- Read-only Circles permit privacy withdrawal, not new sharing grants.
begin;
create function public.dydd_circle_readonly_consent_guard() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare c public.journey_circle_plans;old_people boolean:=false;old_insights boolean:=false;
begin
 select * into c from public.journey_circle_plans where id=new.circle_id;
 if tg_op='UPDATE' then old_people:=old.people;old_insights:=old.insights;end if;
 if c.user_id is not null and public.dydd_circle_lifecycle(c.user_id,c.id,c.plan->>'format')='readonly' and ((new.people and not old_people) or(new.insights and not old_insights)) then raise exception 'Read-only Circles allow privacy withdrawal only; renew before enabling new sharing';end if;
 return new;
end $$;
create trigger dydd_circle_readonly_consent_guard before insert or update on public.dydd_circle_consents for each row execute function public.dydd_circle_readonly_consent_guard();
revoke all on function public.dydd_circle_readonly_consent_guard() from public,anon,authenticated;
grant execute on function public.dydd_circle_readonly_consent_guard() to service_role;
commit;
