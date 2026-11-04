-- Match bulk roster names to the existing planner's120-character contract.
begin;
create function public.dydd_circle_roster_name_guard() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if (tg_op='INSERT' or new.display_name is distinct from old.display_name) and length(trim(new.display_name)) not between 1 and 120 then raise exception 'Use a participant name of1–120characters';end if;
 return new;
end $$;
create trigger dydd_circle_roster_name_guard before insert or update on public.dydd_circle_memberships for each row execute function public.dydd_circle_roster_name_guard();
revoke all on function public.dydd_circle_roster_name_guard() from public,anon,authenticated;
grant execute on function public.dydd_circle_roster_name_guard() to service_role;
commit;
