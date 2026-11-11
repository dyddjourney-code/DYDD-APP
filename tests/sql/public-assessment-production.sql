-- Run only through the isolated Docker harness; fixtures never touch hosted projects.
set role service_role;
select test_support.ok((select count(*)=0 from public.dydd_assessment_grandfathered_access),'no automatic grandfathering');
select test_support.ok((select payment_mode='test' from public.dydd_public_assessment_runtime),'default mode test');
reset role;
insert into auth.users(id,email,email_confirmed_at) values
 ('00000000-0000-0000-0000-000000000001','Exact.Name+tag@gmail.com',now()),
 ('00000000-0000-0000-0000-000000000002','other@example.com',now()),
 ('00000000-0000-0000-0000-000000000003','unverified@example.com',null),
 ('00000000-0000-0000-0000-000000000004','fresh@example.com',now());
insert into public.assessment_participants(id,user_id,normalized_email) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Exact.Name+tag@gmail.com'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','other@example.com'),
 ('10000000-0000-0000-0000-000000000003',null,'  EXACT.NAME+TAG@gmail.com  '),
 ('10000000-0000-0000-0000-000000000004',null,'exactname@gmail.com'),
 ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000004','fresh@example.com');
-- Explicit foreign snapshot user_id always overrides an otherwise matching participant.
insert into public.assessment_snapshots(id,user_id,participant_id,assessment_type,scores,source) values
 ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','designid','{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100}','fixture'),
 ('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000003','designid','{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100}','fixture'),
 ('20000000-0000-0000-0000-000000000003',null,'10000000-0000-0000-0000-000000000003','designid','{"scores":{"scores":{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100}}}','fixture'),
 ('20000000-0000-0000-0000-000000000004',null,'10000000-0000-0000-0000-000000000004','designid','{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100}','fixture'),
 ('20000000-0000-0000-0000-000000000005',null,'10000000-0000-0000-0000-000000000002','designid','{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100}','fixture'),
 ('20000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001',null,'designid','{"Architect_Pts":1,"Artisan_Pts":2,"Shepherd_Pts":3,"Steward_Pts":4,"Total_Pts":10}','fixture');
update auth.users set deleted_at=now() where id='00000000-0000-0000-0000-000000000001';
set role service_role;
select test_support.ok(not public.dydd_public_assessment_source_owned('00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001'),'soft-deleted verified identity denied');
reset role;
update auth.users set deleted_at=null where id='00000000-0000-0000-0000-000000000001';
set role service_role;
do $$
declare u uuid:='00000000-0000-0000-0000-000000000001'; other_u uuid:='00000000-0000-0000-0000-000000000002'; fresh uuid:='00000000-0000-0000-0000-000000000004'; src uuid:='20000000-0000-0000-0000-000000000001'; e jsonb; again jsonb; oid uuid; sid uuid; r jsonb; r2 jsonb; n integer;
begin
 perform test_support.ok(public.dydd_public_assessment_source_owned(u,src),'explicit owned source');
 perform test_support.ok(not public.dydd_public_assessment_source_owned(u,'20000000-0000-0000-0000-000000000002'),'foreign snapshot authoritative');
 perform test_support.ok(public.dydd_public_assessment_source_owned(u,'20000000-0000-0000-0000-000000000003'),'exact verified legacy email and nested scores');
 perform test_support.ok(not public.dydd_public_assessment_source_owned(u,'20000000-0000-0000-0000-000000000004'),'Gmail aliases are not ownership');
 perform test_support.ok(not public.dydd_public_assessment_source_owned(u,'20000000-0000-0000-0000-000000000005'),'foreign participant authoritative');
 perform test_support.ok(not public.dydd_public_assessment_source_owned(u,'20000000-0000-0000-0000-000000000006'),'ranked/invalid points rejected');
 perform test_support.ok(not public.dydd_public_assessment_source_owned('00000000-0000-0000-0000-000000000003',src),'unverified source denied');
 update public.assessment_snapshots set participant_id='10000000-0000-0000-0000-000000000002' where id=src;
 perform test_support.ok(public.dydd_public_assessment_source_owned(u,src),'explicit snapshot owner overrides foreign participant');
 update public.assessment_snapshots set participant_id='10000000-0000-0000-0000-000000000001' where id=src;
 update public.assessment_snapshots set user_id=null where id=src;
 perform test_support.ok(public.dydd_public_assessment_source_owned(u,src),'explicit participant owner');
 update public.assessment_snapshots set user_id=u where id=src;

 insert into public.dydd_public_assessment_codes(code_hash,product,batch_label) values(repeat('a',64),'designid','fixture'),(repeat('b',64),'designpd','fixture'),(repeat('c',64),'designid','fixture');
 insert into public.dydd_public_assessment_codes(code_hash,product,batch_label,expires_at) values(repeat('d',64),'designid','fixture',now()-interval '1 second');
 perform test_support.rejects(format('select public.dydd_redeem_public_assessment_code(%L,%L,''designid'')',repeat('d',64),u),'expired');
 perform test_support.rejects(format('select public.dydd_redeem_public_assessment_code(%L,%L,''designid'')',repeat('b',64),u),'Invalid assessment code');
 perform test_support.rejects(format('select public.dydd_redeem_public_assessment_code(%L,%L,''designpd'',%L)',repeat('b',64),other_u,src),'valid completed DesignID');
 perform test_support.ok((select redeemed_at is null from public.dydd_public_assessment_codes where code_hash=repeat('b',64)),'failed prerequisite leaves code untouched');
 perform test_support.rejects(format('select public.dydd_redeem_public_assessment_code(%L,%L,''designid'')',repeat('a',64),'00000000-0000-0000-0000-000000000003'),'Verified account');
 e:=public.dydd_redeem_public_assessment_code(repeat('a',64),u,'designid');
 again:=public.dydd_redeem_public_assessment_code(repeat('a',64),u,'designid');
 perform test_support.ok(e->>'id'=again->>'id','same-user code retry is idempotent');
 perform test_support.rejects(format('select public.dydd_redeem_public_assessment_code(%L,%L,''designid'')',repeat('a',64),other_u),'already used');
 perform test_support.rejects(format('select public.save_public_designid_attempt(%L,%L,''blocked-retake'',true,''{}'')',u,'10000000-0000-0000-0000-000000000001'),'not available yet');
 perform test_support.ok((select consumed_at is null from public.dydd_public_assessment_entitlements where id=(e->>'id')::uuid),'retake failure never consumes access; owner arg ignored');
 -- Exercise six CALENDAR months on both sides, not a 90/180-day substitute.
 update public.assessment_snapshots set source_submitted_at=now()-interval '6 months'+interval '1 day' where id=src;
 perform test_support.rejects(format('select public.save_public_designid_attempt(%L,%L,''boundary-early'',false,''{}'')',u,'10000000-0000-0000-0000-000000000001'),'not available yet');
 update public.assessment_snapshots set source_submitted_at=now()-interval '6 months'-interval '1 day' where id=src;
 -- Other same-user ownership fixtures must also predate the eligible boundary.
 update public.assessment_snapshots set created_at=now()-interval '7 months',source_submitted_at=now()-interval '7 months' where user_id=u and id<>src;
 sid:=public.save_public_designid_attempt(u,'10000000-0000-0000-0000-000000000001','boundary-eligible',false,'{}');
 perform test_support.ok((select consumed_at is not null from public.dydd_public_assessment_entitlements where id=(e->>'id')::uuid),'six-month eligible save consumes once');
 -- A new purchase still cannot waive timing; a separately approved baseline permit can.
 insert into public.dydd_public_assessment_codes(code_hash,product,batch_label) values(repeat('e',64),'designid','fixture');
 again:=public.dydd_redeem_public_assessment_code(repeat('e',64),u,'designid');
 insert into public.designid_retake_overrides(participant_id,granted_by,reason) values('10000000-0000-0000-0000-000000000001',u,'Approved fixture early retake');
 sid:=public.save_public_designid_attempt(u,'10000000-0000-0000-0000-000000000001','approved-override',false,'{}');
 perform test_support.ok((select used_at is not null and used_snapshot_id=sid from public.designid_retake_overrides where participant_id='10000000-0000-0000-0000-000000000001'),'approved original override retained/consumed');

 e:=public.dydd_redeem_public_assessment_code(repeat('c',64),fresh,'designid');
 sid:=public.save_public_designid_attempt(fresh,'10000000-0000-0000-0000-000000000005','first-public',true,'{}');
 perform test_support.ok((select scores->'retakePolicy'->>'version'='six-calendar-months-v1' and scores->'retakePolicy'->>'ownerExemption'='false' from public.assessment_snapshots where id=sid),'baseline timing and no purchased override');
 perform test_support.ok(public.save_public_designid_attempt(fresh,'10000000-0000-0000-0000-000000000005','first-public',true,'{}')=sid,'DesignID save retry same snapshot');
 perform test_support.ok((select consumed_at is not null and completion_snapshot_id=sid from public.dydd_public_assessment_entitlements where id=(e->>'id')::uuid),'DesignID atomic consumption');
 e:=public.dydd_redeem_public_assessment_code(repeat('b',64),u,'designpd',src);
 r:=public.reserve_designpd_generation(u,src,'fixture-v1','10000000-0000-0000-0000-000000000001',jsonb_build_object('designIdSnapshotId',src,'contentVersion','fixture-v1'));
 r2:=public.reserve_designpd_generation(u,src,'fixture-v1','10000000-0000-0000-0000-000000000001',jsonb_build_object('designIdSnapshotId',src,'contentVersion','fixture-v1'));
 perform test_support.ok(r->>'status'='reserved' and r2->>'status'='running' and r->>'snapshotId'=r2->>'snapshotId','one reservation per source/version');
 perform test_support.ok(not public.finish_public_designpd_generation(u,src,'fixture-v1',null,'{"status":"ready"}','https://example.com/report'),'null token rejected');
 perform test_support.ok(public.finish_public_designpd_generation(u,src,'fixture-v1',(r->>'token')::uuid,'{"status":"failure","error":"Sandbox report preview is available"}',null),'uncertain finish recorded');
 perform test_support.ok((select consumed_at is null from public.dydd_public_assessment_entitlements where id=(e->>'id')::uuid),'sandbox preview NEVER consumes production access');
 r2:=public.reserve_designpd_generation(u,src,'fixture-v1','10000000-0000-0000-0000-000000000001',jsonb_build_object('designIdSnapshotId',src,'contentVersion','fixture-v1'));
 perform test_support.ok(r2->>'status'='uncertain','ambiguous failure never creates second provider job');
 -- Simulate successful recovery via the known reservation/token after operator reconciliation.
 update public.designpd_generation_reservations set state='running' where user_id=u and source_snapshot_id=src and content_version='fixture-v1';
 perform test_support.ok(public.finish_public_designpd_generation(u,src,'fixture-v1',(r->>'token')::uuid,'{"status":"ready","documentId":"doc_fixture"}','https://example.com/report'),'ready finish');
 perform test_support.ok(public.finish_public_designpd_generation(u,src,'fixture-v1',(r->>'token')::uuid,'{"status":"ready"}','https://example.com/report'),'ready replay idempotent');
 perform test_support.ok((select consumed_at is not null from public.dydd_public_assessment_entitlements where id=(e->>'id')::uuid),'ready consumes once');
 -- New TEST checkout evidence, duplicate fulfillment, mismatches and reversal tombstones.
 insert into public.dydd_public_assessment_orders(user_id,product,payment_provider,payment_reference,expected_price_id,expected_product_id,expected_amount,currency)
 values(u,'designid','stripe_test','cs_fixture','price_fixture','prod_fixture',1234,'usd') returning id into oid;
 perform test_support.rejects(format('select public.dydd_apply_verified_public_assessment_payment(%L,''cs_fixture'',1233,''usd'',''price_fixture'',''pi_fixture'',''stripe_test'')',oid),'does not match');
 e:=public.dydd_apply_verified_public_assessment_payment(oid,'cs_fixture',1234,'usd','price_fixture','pi_fixture','stripe_test');
 again:=public.dydd_apply_verified_public_assessment_payment(oid,'cs_fixture',1234,'usd','price_fixture','pi_fixture','stripe_test');
 perform test_support.ok(e->>'id'=again->>'id','same-order payment replay');
 perform public.dydd_revoke_public_assessment_payment('pi_fixture','stripe_test');
 perform public.dydd_revoke_public_assessment_payment('pi_fixture','stripe_test');
 perform test_support.ok((select revoked_at is not null from public.dydd_public_assessment_entitlements where id=(e->>'id')::uuid),'reversal revokes unconsumed');
 perform test_support.rejects(format('select public.dydd_apply_verified_public_assessment_payment(%L,''cs_fixture'',1234,''usd'',''price_fixture'',''pi_fixture'',''stripe_test'')',oid),'refunded or disputed');
 perform public.dydd_revoke_public_assessment_payment('pi_before','stripe_test');
 insert into public.dydd_public_assessment_orders(user_id,product,payment_provider,payment_reference,expected_price_id,expected_product_id,expected_amount,currency)
 values(u,'designid','stripe_test','cs_before','price_fixture','prod_fixture',1234,'usd') returning id into oid;
 perform test_support.rejects(format('select public.dydd_apply_verified_public_assessment_payment(%L,''cs_before'',1234,''usd'',''price_fixture'',''pi_before'',''stripe_test'')',oid),'refunded or disputed');
 insert into public.dydd_public_assessment_orders(user_id,product,payment_provider,payment_reference,expected_price_id,expected_product_id,expected_amount,currency)
 values(u,'designid','stripe_live','cs_live','price_fixture','prod_fixture',1234,'usd') returning id into oid;
 perform test_support.rejects(format('select public.dydd_apply_verified_public_assessment_payment(%L,''cs_live'',1234,''usd'',''price_fixture'',''pi_fixture'',''stripe_live'')',oid),'provider disabled');
 update public.dydd_public_assessment_runtime set payment_mode='live';
 e:=public.dydd_apply_verified_public_assessment_payment(oid,'cs_live',1234,'usd','price_fixture','pi_fixture','stripe_live');
 perform test_support.ok(e->>'grant_kind'='stripe_live','live uses independent provider/intent namespace');
 update public.dydd_public_assessment_runtime set payment_mode='test';
 perform test_support.ok(not exists(select 1 from public.dydd_public_assessment_entitlements x where x.id=(public.dydd_has_public_assessment_entitlement(u,'designid')->>'id')::uuid and x.grant_kind='stripe_live'),'wrong-mode entitlement inaccessible');
 -- Reversals remain accepted for an inactive mode (sales/runtime kill switch must not block refunds).
 perform public.dydd_revoke_public_assessment_payment('pi_fixture','stripe_live');
 perform test_support.ok((select revoked_at is not null from public.dydd_public_assessment_entitlements where id=(e->>'id')::uuid),'inactive-mode reversal works');
end $$;
reset role;
-- Catalog security checks cover every new table and function, not just a representative RPC.
do $$
declare t text; f record; role_name text;
begin
 foreach t in array array['dydd_assessment_grandfathered_access','dydd_public_assessment_runtime','dydd_public_assessment_orders','dydd_public_assessment_codes','dydd_public_assessment_entitlements','dydd_public_assessment_payment_reversals','designpd_generation_reservations'] loop
  perform test_support.ok((select relrowsecurity from pg_class where oid=('public.'||t)::regclass),'RLS enabled '||t);
  foreach role_name in array array['anon','authenticated'] loop
   perform test_support.ok(not has_table_privilege(role_name,'public.'||t,'SELECT,INSERT,UPDATE,DELETE'),'no public table privilege '||t);
  end loop;
 end loop;
 for f in select p.oid,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','dydd_private') and (p.proname like 'dydd%public_assessment%' or p.proname in ('retake_verified_email','lock_public_assessment_entitlement','reserve_designpd_generation','finish_designpd_generation','save_public_designid_attempt','finish_public_designpd_generation','reconcile_designpd_generation_artifact')) loop
  foreach role_name in array array['anon','authenticated'] loop
   perform test_support.ok(not has_function_privilege(role_name,f.oid,'EXECUTE'),'no public RPC execute '||f.proname);
  end loop;
  perform test_support.ok(has_function_privilege('service_role',f.oid,'EXECUTE'),'service execute '||f.proname);
 end loop;
end $$;
set role anon;
select test_support.rejects('select * from public.dydd_public_assessment_orders','permission denied');
select test_support.rejects('select public.dydd_revoke_public_assessment_payment(''pi_denied'',''stripe_test'')','permission denied');
set role authenticated;
select test_support.rejects('select * from public.dydd_assessment_grandfathered_access','permission denied');
select test_support.rejects('select public.dydd_has_public_assessment_entitlement(''00000000-0000-0000-0000-000000000001'',''designid'')','permission denied');
reset role;
