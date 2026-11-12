insert into auth.users(id,email,email_confirmed_at,is_anonymous,banned_until) values
 ('00000000-0000-0000-0000-000000000001','Exact.Name+tag@gmail.com',now(),false,null),
 ('00000000-0000-0000-0000-000000000002','exactname@gmail.com',now(),false,null),
 ('00000000-0000-0000-0000-000000000003','unverified@example.invalid',null,false,null),
 ('00000000-0000-0000-0000-000000000004','banned@example.invalid',now(),false,now()+interval '1 day'),
 ('00000000-0000-0000-0000-000000000005','other@example.invalid',now(),false,null);
insert into public.assessment_participants(id,user_id,normalized_email) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','exact.name+tag@gmail.com');
insert into public.dydd_guest_sessions(id,participant_name,participant_email,capability_hash,expires_at) values
 ('20000000-0000-0000-0000-000000000001','Fixture',' EXACT.NAME+TAG@gmail.com ',repeat('a',64),now()-interval '1 day'),
 ('20000000-0000-0000-0000-000000000002','Foreign link','exact.name+tag@gmail.com',repeat('b',64),now()+interval '1 year'),
 ('20000000-0000-0000-0000-000000000003','Unpaid','exact.name+tag@gmail.com',repeat('c',64),now()+interval '1 year');
insert into public.dydd_guest_orders(id,session_id,product,status,payment_provider,payment_reference,payment_intent_id,paid_at,expected_product_id,expected_price_id) values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','designid','paid','stripe_test','cs_bridge1','pi_bridge1',now(),'prod_fixture','price_fixture'),
 ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','designid','paid','stripe_test','cs_bridge2','pi_bridge2',now(),'prod_fixture','price_fixture');
insert into public.dydd_guest_results(id,order_id,session_id,product,scores,created_at) values
 ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','designid','{"scores":{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100},"reportPayload":{"Primary":"Architect"}}','2026-08-31T12:00:00Z'),
 ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','designid','{"scores":{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100},"reportPayload":{"Primary":"Architect"}}',now());
insert into public.dydd_guest_account_links(session_id,user_id) values('20000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000005');
set role service_role;
select test_support.rejects($$select public.dydd_guest_link_matching_verified_account('00000000-0000-0000-0000-000000000003')$$,'Verified account required');
select test_support.rejects($$select public.dydd_guest_link_matching_verified_account('00000000-0000-0000-0000-000000000004')$$,'Verified account required');
select test_support.ok(public.dydd_guest_link_matching_verified_account('00000000-0000-0000-0000-000000000002')=0,'no Gmail alias expansion');
select test_support.ok(public.dydd_guest_link_matching_verified_account('00000000-0000-0000-0000-000000000001')=1,'exact verified email, expired guest capability still carries completed result');
select test_support.ok(public.dydd_guest_link_matching_verified_account('00000000-0000-0000-0000-000000000001')=0,'idempotent');
select test_support.ok((select user_id='00000000-0000-0000-0000-000000000005' from public.dydd_guest_account_links where session_id='20000000-0000-0000-0000-000000000002'),'foreign immutable owner wins');
select test_support.ok((select count(*)=1 from public.assessment_snapshots where source='public_guest'),'only valid linked projection');
select test_support.ok((select a.scores=r.scores and a.source_submitted_at=r.created_at and a.created_at=r.created_at from public.assessment_snapshots a join public.dydd_guest_results r on r.id=a.id where a.id='40000000-0000-0000-0000-000000000001'),'exact scores and original completion, no rescoring');
select test_support.ok(public.dydd_public_assessment_source_owned('00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001'),'native derived report accepts owned valid guest source');
select test_support.ok((public.reserve_designpd_generation('00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','bridge-fixture','10000000-0000-0000-0000-000000000001','{"designIdSnapshotId":"40000000-0000-0000-0000-000000000001","contentVersion":"bridge-fixture"}')->>'status')='reserved','actual native PD reservation uses preserved source UUID/FK');
select test_support.rejects($$update public.assessment_snapshots set scores='{}' where id='40000000-0000-0000-0000-000000000001'$$,'projections are immutable');
select test_support.rejects($$select public.save_designid_attempt('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','fixture',false,'{}')$$,'not available yet');
select test_support.ok(((select created_at from public.dydd_guest_results where id='40000000-0000-0000-0000-000000000001') at time zone 'UTC')+interval '6 months'='2027-02-28 12:00:00'::timestamp,'calendar months clamp month end, not 180 days');
select test_support.ok((select count(*)=1 from public.dydd_guest_school_snapshot_ids(array['40000000-0000-0000-0000-000000000001'::uuid])),'service consumers get eligible projected source');
reset role;
-- Exercise actual authenticated SELECT, not only helper calls. Local Auth stub
-- reads a synthetic claim just as managed auth.uid() reads request.jwt claims.
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant select on public.assessment_snapshots,public.assessment_participants to authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set role authenticated;
select test_support.ok((select count(*)=1 from public.assessment_snapshots where id='40000000-0000-0000-0000-000000000001'),'actual RLS same linked owner reads original projection');
reset role;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000005';
set role authenticated;
select test_support.ok((select count(*)=0 from public.assessment_snapshots where id='40000000-0000-0000-0000-000000000001'),'actual RLS foreign owner denied');
reset role;
insert into public.reflection_rounds(user_id,course_slug,assessment_snapshot_id,assessment_label,questions,source) values('00000000-0000-0000-0000-000000000001','designid-foundations','40000000-0000-0000-0000-000000000001','original report','[]','app');
set role service_role;
insert into public.dydd_guest_reversals(payment_provider,payment_intent_id) values('stripe_test','pi_bridge1');
select test_support.ok(not public.dydd_public_assessment_source_owned('00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001'),'refund fences native source despite retained projection');
select test_support.rejects($$select public.reserve_designpd_generation('00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','bridge-refunded','10000000-0000-0000-0000-000000000001','{"designIdSnapshotId":"40000000-0000-0000-0000-000000000001","contentVersion":"bridge-refunded"}')$$,'source is unavailable');
select test_support.ok(not dydd_private.guest_bridge_result_allowed('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001'),'refund fences original report rights');
select test_support.ok((select count(*)=0 from public.dydd_guest_school_snapshot_ids(array['40000000-0000-0000-0000-000000000001'::uuid])),'service consumer refund filtered');
reset role;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
set role authenticated;
select test_support.ok((select count(*)=0 from public.assessment_snapshots where id='40000000-0000-0000-0000-000000000001'),'actual RLS original owner loses refunded projection');
reset role;
select test_support.ok(not has_function_privilege('authenticated','public.dydd_guest_link_matching_verified_account(uuid)','execute'),'browser cannot link arbitrary UUID');
select test_support.ok(not has_function_privilege('anon','public.dydd_guest_link_matching_verified_account(uuid)','execute'),'anonymous cannot link');
-- Import time must never restart timing: a seven-month-old original opens the
-- included native save immediately. Roll its synthetic save back before testing
-- a newer paid guest cycle for this same account.
reset role;
insert into auth.users(id,email,email_confirmed_at) values('00000000-0000-0000-0000-000000000006','old@example.invalid',now());
insert into public.assessment_participants(id,user_id,normalized_email) values('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000006','old@example.invalid');
insert into public.dydd_guest_sessions(id,participant_name,participant_email,capability_hash) values
 ('20000000-0000-0000-0000-000000000006','Old completed','old@example.invalid',repeat('6',64)),
 ('20000000-0000-0000-0000-000000000007','New paid','old@example.invalid',repeat('7',64)),
 ('20000000-0000-0000-0000-000000000008','Further paid','old@example.invalid',repeat('8',64));
insert into public.dydd_guest_orders(id,session_id,product,status,payment_provider,payment_reference,payment_intent_id,paid_at,expected_product_id,expected_price_id) values
 ('30000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000006','designid','paid','stripe_test','cs_bridge6','pi_bridge6',now(),'prod_fixture','price_fixture');
insert into public.dydd_guest_results(id,order_id,session_id,product,scores,created_at) values
 ('40000000-0000-0000-0000-000000000006','30000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000006','designid','{"scores":{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100},"reportPayload":{"Primary":"Architect"}}',now()-interval '7 months');
set role service_role;
select test_support.ok(public.dydd_guest_link_matching_verified_account('00000000-0000-0000-0000-000000000006')=1,'older guest imports once');
savepoint native_allowed;
select test_support.ok(public.save_designid_attempt('00000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000006','old-import-allowed',false,'{}') is not null,'old original completion allows included native save despite importing today');
rollback to savepoint native_allowed;
do $cycles$ declare oid uuid; rid uuid; begin
 oid:=public.dydd_guest_reserve_order('20000000-0000-0000-0000-000000000007','designid',null,'stripe_test','prod_fixture','price_fixture');
 update public.dydd_guest_orders set payment_reference='cs_bridge7' where id=oid;
 perform test_support.ok(public.dydd_guest_apply_payment(oid,'stripe_test','cs_bridge7','pi_bridge7',1999,'usd','price_fixture'),'new standalone verified payment tuple');
 rid:=public.dydd_guest_save_result('20000000-0000-0000-0000-000000000007',oid,'{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100,"reportPayload":{"Primary":"Shepherd"}}');
 perform test_support.ok(public.dydd_guest_link_matching_verified_account('00000000-0000-0000-0000-000000000006')=1,'newer paid cycle auto-carries separately');
 perform test_support.ok((select count(*)=2 from public.assessment_snapshots where user_id='00000000-0000-0000-0000-000000000006' and source='public_guest'),'old and new completed public history both retained');
 perform test_support.ok((select source_submitted_at=created_at and source_submitted_at<now()-interval '6 months' from public.assessment_snapshots where id='40000000-0000-0000-0000-000000000006'),'original completion unchanged on later import');
 perform test_support.rejects($$select public.save_designid_attempt('00000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000006','newer-paid-cooldown',false,'{}')$$,'not available yet');
 perform test_support.ok(public.dydd_guest_reserve_order('20000000-0000-0000-0000-000000000008','designid',null,'stripe_test','prod_fixture','price_fixture') is not null,'further separately paid public repeat ignores included cooldown');
end $cycles$;
reset role;
