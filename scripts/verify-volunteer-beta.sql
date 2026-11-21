-- Rollback-only contract test. psql -X -v ON_ERROR_STOP=1 -f scripts/verify-volunteer-beta.sql
BEGIN;
-- Entire fixture, auth inserts, entitlements and queued mail are rolled back.
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
 ('11111111-1111-4111-8111-111111111111','beta-one@example.test',now(),false),
 ('22222222-2222-4222-8222-222222222222','beta-two@example.test',now(),false),
 ('33333333-3333-4333-8333-333333333333','beta-unverified@example.test',null,false),
 ('44444444-4444-4444-8444-444444444444','beta-limit@example.test',now(),false);
insert into public.dydd_beta_access_codes(id,code_hash,batch,recipient_email,recipient_name) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',repeat('a',64),'qa-rollback','beta-one@example.test','QA One'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',repeat('b',64),'qa-rollback','beta-two@example.test','QA Two'),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc',repeat('c',64),'qa-rollback',null,null),
 ('dddddddd-dddd-4ddd-8ddd-dddddddddddd',repeat('d',64),'qa-rollback',null,null);
update public.dydd_beta_access_codes set revoked_at=now() where id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
-- More than ten new codes are accepted; this does not consume original ten.
insert into public.dydd_beta_access_codes(code_hash,batch) select lpad(to_hex(n),64,'0'),'qa-unlimited' from generate_series(101,120) n;
create function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAIL: %',label;end if;end$$;
select pg_temp.assert_true((select count(*)=20 from public.dydd_beta_access_codes where batch='qa-unlimited'),'twenty additional codes');
select pg_temp.assert_true(not has_table_privilege('anon','public.dydd_beta_checklist','SELECT'),'anon checklist denied');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.dydd_beta_access_codes','SELECT'),'authenticated codes denied');
select pg_temp.assert_true(not has_function_privilege('anon','public.redeem_dydd_beta_access(uuid,text)','EXECUTE'),'anon redemption denied');
select pg_temp.assert_true(not has_function_privilege('authenticated','dydd_private.beta_recipient_matches(uuid,text)','EXECUTE'),'private email verifier denied');
set local role service_role;
select pg_temp.assert_true(public.redeem_dydd_beta_access('33333333-3333-4333-8333-333333333333',repeat('a',64))='unverified','unverified denied');
select pg_temp.assert_true(public.redeem_dydd_beta_access('22222222-2222-4222-8222-222222222222',repeat('a',64))='invalid','different verified email denied');
select pg_temp.assert_true(public.redeem_dydd_beta_access('22222222-2222-4222-8222-222222222222',repeat('b',64))='invalid','revoked code denied');
select pg_temp.assert_true(public.redeem_dydd_beta_access('11111111-1111-4111-8111-111111111111',repeat('a',64))='active','targeted lifetime redemption');
select pg_temp.assert_true(public.redeem_dydd_beta_access('11111111-1111-4111-8111-111111111111',repeat('a',64))='active','same-user idempotent replay');
select pg_temp.assert_true(public.redeem_dydd_beta_access('22222222-2222-4222-8222-222222222222',repeat('a',64))='invalid','different-user replay denied');
select pg_temp.assert_true(public.redeem_dydd_beta_access('11111111-1111-4111-8111-111111111111',repeat('c',64))='already_active','existing access does not burn another code');
select pg_temp.assert_true((select redeemed_at is null from public.dydd_beta_access_codes where code_hash=repeat('c',64)),'spare code unconsumed');
select pg_temp.assert_true(public.redeem_dydd_beta_access('22222222-2222-4222-8222-222222222222',repeat('c',64))='active','legacy unbound code still redeems');
select pg_temp.assert_true((select count(*)=1 from public.dydd_personal_access where user_id='11111111-1111-4111-8111-111111111111' and scope='personal_all_access'),'one durable personal entitlement');
-- No expiry column or time predicate: moving grant age far back does not remove access.
update public.dydd_personal_access set granted_at=now()-interval '100 years' where user_id='11111111-1111-4111-8111-111111111111';
select pg_temp.assert_true((select scope='personal_all_access' from public.dydd_personal_access where user_id='11111111-1111-4111-8111-111111111111'),'century-old lifetime grant remains active');
do $$begin for i in 1..12 loop perform public.redeem_dydd_beta_access('44444444-4444-4444-8444-444444444444','invalid');end loop;end$$;
select pg_temp.assert_true(public.redeem_dydd_beta_access('44444444-4444-4444-8444-444444444444',repeat('d',64))='limited','durable twelve-attempt limit');
update public.dydd_beta_redemption_limits set window_started_at=now()-interval '16 minutes' where user_id='44444444-4444-4444-8444-444444444444';
select pg_temp.assert_true(public.redeem_dydd_beta_access('44444444-4444-4444-8444-444444444444',repeat('d',64))='active','rate window expiry recovers');
reset role;
select 'PASS: recipient binding, verified email, twenty codes, replay, one-time, revoke, legacy, no-expiry entitlement, rate window, service-only ACL';
insert into public.dydd_beta_access_codes(id,code_hash,batch,recipient_email,recipient_name,invitation_job_id)
 values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',repeat('e',64),'qa-rollback','beta-one@example.test','QA One','ffffffff-ffff-4fff-8fff-ffffffffffff');
insert into public.dydd_beta_checklist(id,filename,content_base64,sha256,byte_size,updated_by) values
 (true,'qa-only.pdf','JVBERi0=',repeat('1',64),5,'11111111-1111-4111-8111-111111111111');
insert into public.dydd_lifecycle_jobs(id,event_key,template_id,category,email,subject,body,scheduled_at,expires_at,context)
values('99999999-9999-4999-8999-999999999999','qa:beta-fence','volunteer-beta-welcome','service','beta-one@example.test','QA only','No send',now(),now()+interval '1 day',jsonb_build_object('kind','application','deliveryContext',jsonb_build_object('type','volunteer_beta_welcome','betaCodeId','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','invitationRequestId','ffffffff-ffff-4fff-8fff-ffffffffffff','checklistSha256',repeat('1',64)),'senderInput',jsonb_build_object('attachments',jsonb_build_array(jsonb_build_object('filename','qa-only.pdf','content','JVBERi0=')))));
set local role service_role;
update public.dydd_lifecycle_jobs set status='submitting' where id='99999999-9999-4999-8999-999999999999';
select pg_temp.assert_true((select status='submitting' from public.dydd_lifecycle_jobs where id='99999999-9999-4999-8999-999999999999'),'valid checklist submission fence');
update public.dydd_lifecycle_jobs set status='queued' where id='99999999-9999-4999-8999-999999999999';
update public.dydd_beta_access_codes set revoked_at=now() where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
do $$declare rejected boolean=false;begin begin update public.dydd_lifecycle_jobs set status='submitting' where id='99999999-9999-4999-8999-999999999999';exception when others then rejected=true;end;if not rejected then raise exception 'FAIL revoked invitation sent';end if;end$$;
update public.dydd_beta_access_codes set revoked_at=null where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
update public.dydd_beta_checklist set sha256=repeat('2',64);
do $$declare rejected boolean=false;begin begin update public.dydd_lifecycle_jobs set status='submitting' where id='99999999-9999-4999-8999-999999999999';exception when others then rejected=true;end;if not rejected then raise exception 'FAIL replaced checklist sent';end if;end$$;
update public.dydd_beta_checklist set sha256=repeat('1',64);
update public.dydd_lifecycle_jobs set context=jsonb_set(context,'{senderInput,attachments}','[]') where id='99999999-9999-4999-8999-999999999999';
do $$declare rejected boolean=false;begin begin update public.dydd_lifecycle_jobs set status='submitting' where id='99999999-9999-4999-8999-999999999999';exception when others then rejected=true;end;if not rejected then raise exception 'FAIL missing checklist sent';end if;end$$;
reset role;
select 'PASS durable mail submission fence: exact attachment allowed, revoked/replaced/missing attachment denied; no provider invoked';

ROLLBACK;
