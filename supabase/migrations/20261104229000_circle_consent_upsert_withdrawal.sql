-- INSERT ... ON CONFLICT runs BEFORE INSERT first: recognize existing grants so selective withdrawal remains available.
begin;
create or replace function public.dydd_circle_readonly_consent_guard() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare c public.journey_circle_plans;old_people boolean:=false;old_insights boolean:=false;
begin
 select * into c from public.journey_circle_plans where id=new.circle_id;
 if tg_op='UPDATE' then old_people:=old.people;old_insights:=old.insights;
 else select people,insights into old_people,old_insights from public.dydd_circle_consents where circle_id=new.circle_id and user_id=new.user_id;old_people:=coalesce(old_people,false);old_insights:=coalesce(old_insights,false);end if;
 if c.user_id is not null and public.dydd_circle_lifecycle(c.user_id,c.id,c.plan->>'format')='readonly' and ((new.people and not old_people) or(new.insights and not old_insights)) then raise exception 'Read-only Circles allow privacy withdrawal only; renew before enabling new sharing';end if;
 return new;
end $$;
commit;
