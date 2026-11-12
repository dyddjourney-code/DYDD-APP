-- Run with psql ON_ERROR_STOP. All fixture writes roll back; no lifecycle jobs/provider sends.
begin;
do $$
declare sid uuid:=gen_random_uuid(); oid uuid:=gen_random_uuid(); rid uuid:=gen_random_uuid(); gid uuid:=gen_random_uuid();
 later_sid uuid:=gen_random_uuid(); mode text; req uuid:=gen_random_uuid(); second_req uuid:=gen_random_uuid(); row jsonb; replay jsonb; restored jsonb;
 email text:='guest-recovery-'||gen_random_uuid()::text||'@example.invalid'; missing_email text:='missing-'||gen_random_uuid()::text||'@example.invalid';
 i integer; emailhash text:=repeat('a',64); requester text:=repeat('b',64);
begin
 if has_table_privilege('anon','public.dydd_guest_recovery_requests','select') or
 has_function_privilege('anon','public.dydd_guest_reserve_recovery(uuid,text,text,text,text,text)','execute') or
 has_function_privilege('authenticated','public.dydd_guest_redeem_recovery(uuid,text,text)','execute') then raise exception 'Public recovery access leaked';end if;
 if not (select relrowsecurity from pg_class pc where pc.oid='public.dydd_guest_recovery_requests'::regclass) then raise exception 'RLS missing';end if;
 insert into public.dydd_guest_sessions(id,capability_hash,participant_name,participant_email) values(sid,repeat('1',64),'Recovery Fixture',email);
 insert into public.dydd_guest_access_grants(id,token_hash,name,kind,products,expires_at,max_uses,created_by)
 values(gid,repeat('2',64),'Recovery Fixture','group',array['designid'],now()+interval '1 day',2,gen_random_uuid());
 insert into public.dydd_guest_access_redemptions(grant_id,session_id) values(gid,sid);
 insert into public.dydd_guest_orders(id,session_id,product,status,payment_provider,expected_amount,paid_at,access_grant_id,access_name)
 values(oid,sid,'designid','paid','group_free',0,now(),gid,'Recovery Fixture');
 insert into public.dydd_guest_results(id,order_id,session_id,product,scores) values(rid,oid,sid,'designid','{"unchanged":true}');
 -- A newer unfinished guest checkout must never replace the original completed ID.
 select payment_mode into mode from public.dydd_public_assessment_runtime where singleton;
 insert into public.dydd_guest_sessions(id,capability_hash,participant_name,participant_email) values(later_sid,repeat('a',64),'Later Incomplete Fixture',email);
 insert into public.dydd_guest_orders(session_id,product,payment_provider) values(later_sid,'designid','stripe_'||mode);
 row:=public.dydd_guest_reserve_recovery(req,email,emailhash,requester,'designpd',repeat('3',64));
 if row->>'session_id' is distinct from sid::text then raise exception 'Exact saved session not recovered';end if;
 replay:=public.dydd_guest_reserve_recovery(gen_random_uuid(),email,emailhash,requester,'designpd',repeat('4',64));
 if replay->>'id' is distinct from req::text then raise exception 'Repeat request duplicated intent';end if;
 if public.dydd_guest_redeem_recovery(req,repeat('4',64),repeat('5',64)) is not null then raise exception 'Wrong token accepted';end if;
 restored:=public.dydd_guest_redeem_recovery(req,repeat('3',64),repeat('5',64));
 if restored->>'session_id' is distinct from sid::text or restored->>'product'<>'designpd' then raise exception 'Redemption changed saved target';end if;
 if (select capability_hash from public.dydd_guest_sessions where id=sid)<>repeat('5',64) then raise exception 'Capability not restored';end if;
 if (select scores from public.dydd_guest_results where id=rid)<>'{"unchanged":true}'::jsonb then raise exception 'Saved result changed';end if;
 if public.dydd_guest_redeem_recovery(req,repeat('3',64),repeat('6',64)) is not null then raise exception 'Token replay accepted';end if;
 if public.dydd_guest_reserve_recovery(gen_random_uuid(),email,emailhash,requester,'designpd',repeat('7',64)) is not null then raise exception 'Cooldown after redemption bypassed';end if;
 update public.dydd_guest_recovery_requests set created_at=now()-interval '16 minutes' where id=req;
 row:=public.dydd_guest_reserve_recovery(second_req,email,emailhash,requester,'designpd',repeat('8',64));
 update public.dydd_guest_recovery_requests set expires_at=now()-interval '1 second' where id=second_req;
 if public.dydd_guest_redeem_recovery(second_req,repeat('8',64),repeat('9',64)) is not null then raise exception 'Expired token accepted';end if;
 -- A fresh intent rechecks revocation at redemption, not merely request time.
 update public.dydd_guest_recovery_requests set expires_at=now()+interval '1 minute' where id=second_req;
 update public.dydd_guest_access_grants set revoked_at=now() where id=gid;
 if public.dydd_guest_redeem_recovery(second_req,repeat('8',64),repeat('9',64)) is not null then raise exception 'Revoked purchase accepted';end if;
 row:=public.dydd_guest_reserve_recovery(gen_random_uuid(),missing_email,repeat('c',64),requester,'designpd',repeat('d',64));
 if row->>'session_id' is not null then raise exception 'Unknown email discovered session';end if;
 if public.dydd_guest_redeem_recovery((row->>'id')::uuid,repeat('d',64),repeat('e',64)) is not null then raise exception 'Unknown email granted access';end if;
 -- Ten distinct unknown-email requests consume the same IP quota as matched ones.
 for i in 1..7 loop
  perform public.dydd_guest_reserve_recovery(gen_random_uuid(),missing_email,md5('email'||i)||md5('email'||i),requester,'designpd',md5('token'||i)||md5('token'||i));
 end loop;
 if public.dydd_guest_reserve_recovery(gen_random_uuid(),missing_email,repeat('f',64),requester,'designpd',repeat('0',64)) is not null then raise exception 'Requester quota bypassed';end if;
 -- The same three-per-day email budget applies independently of IP rotation.
 for i in 1..3 loop
  perform public.dydd_guest_reserve_recovery(gen_random_uuid(),missing_email,repeat('e',64),md5('day-ip'||i)||md5('day-ip'||i),'designpd',md5('day-token'||i)||md5('day-token'||i));
  update public.dydd_guest_recovery_requests set created_at=now()-interval '16 minutes' where email_hash=repeat('e',64);
 end loop;
 if public.dydd_guest_reserve_recovery(gen_random_uuid(),missing_email,repeat('e',64),repeat('9',64),'designpd',repeat('6',64)) is not null then raise exception 'Daily email quota bypassed';end if;
 raise notice 'PASS exact source retained, uniform unknown-email reservation, idempotency, cooldown, IP quota, one-time proof, expiry, revocation, capability restoration, RLS and service-only privileges';
end $$;
rollback;
