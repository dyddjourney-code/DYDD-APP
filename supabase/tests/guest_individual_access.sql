-- Rollback-only synthetic schema/ACL contract. Run in the isolated runner below.
begin;
set local role service_role;
do $$
declare gid uuid; rejected boolean; email text; cap integer;
begin
 insert into public.dydd_guest_access_grants(token_hash,name,kind,recipient_email,products,expires_at,max_uses,created_by)
 values(repeat('e',64),'Individual schema fixture','individual','fixture@example.test',array['designid'],now()+interval '1 day',1,gen_random_uuid()) returning id into gid;
 if not exists(select 1 from public.dydd_guest_access_grants where id=gid and invitation_status='not_sent'
  and invitation_sent_at is null and invitation_job_id is null and recipient_name is null and uses=0)
 then raise exception 'Invitation defaults incorrect';end if;
 update public.dydd_guest_access_grants set invitation_status='sent',invitation_sent_at=now(),invitation_job_id=gen_random_uuid(),recipient_name='Fixture' where id=gid;
 foreach email in array array[null,'',' Fixture@example.test ','FIXTURE@example.test','not-an-email','white space@example.test'] loop
  rejected:=false;
  begin update public.dydd_guest_access_grants set recipient_email=email where id=gid;
  exception when check_violation then rejected:=true;end;
  if not rejected then raise exception 'Invalid normalized recipient accepted: %',email;end if;
 end loop;
 foreach cap in array array[0,2] loop
  rejected:=false;
  begin update public.dydd_guest_access_grants set max_uses=cap where id=gid;
  exception when check_violation then rejected:=true;end;
  if not rejected then raise exception 'Invalid individual capacity accepted';end if;
 end loop;
end $$;
reset role;
do $$
declare role_name text; sig text;
begin
 foreach role_name in array array['anon','authenticated'] loop
  foreach sig in array array['dydd_guest_redeem_access(uuid,text,uuid)','dydd_guest_individual_result_deadline()','dydd_guest_order_entitled(uuid)'] loop
   if has_function_privilege(role_name,'public.'||sig,'EXECUTE') then raise exception 'Unexpected public function access';end if;
  end loop;
  if has_table_privilege(role_name,'public.dydd_guest_access_grants','SELECT') then raise exception 'Unexpected table access';end if;
 end loop;
 if (select count(*) from pg_class where oid in ('public.dydd_guest_access_grants'::regclass,'public.dydd_guest_access_redemptions'::regclass) and relrowsecurity)<>2
 then raise exception 'RLS disabled';end if;
end $$;
rollback;
