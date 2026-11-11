-- Optional parent-owned artifact-reconciliation integration; no provider/network activity.
set role service_role;
do $$
declare u uuid:='00000000-0000-0000-0000-000000000001'; src uuid:='20000000-0000-0000-0000-000000000001'; oid uuid; e jsonb; r jsonb; sid uuid;
begin
 insert into public.dydd_public_assessment_orders(user_id,product,source_snapshot_id,payment_provider,payment_reference,expected_price_id,expected_product_id,expected_amount,currency)
 values(u,'designpd',src,'stripe_test','cs_archive_recovery','price_fixture','prod_fixture',1234,'usd') returning id into oid;
 e:=public.dydd_apply_verified_public_assessment_payment(oid,'cs_archive_recovery',1234,'usd','price_fixture','pi_archive_recovery','stripe_test');
 r:=public.reserve_designpd_generation(u,src,'archive-recovery','10000000-0000-0000-0000-000000000001',jsonb_build_object('designIdSnapshotId',src,'contentVersion','archive-recovery'));
 sid:=(r->>'snapshotId')::uuid;
 perform test_support.ok(not public.reconcile_designpd_generation_artifact(u,sid),'no ready archive means no reconciliation');
 perform test_support.ok(not public.reconcile_designpd_generation_artifact('00000000-0000-0000-0000-000000000002',sid),'foreign recovery denied');
 perform test_support.ok((select consumed_at is null from public.dydd_public_assessment_entitlements where id=(e->>'id')::uuid),'missing archive does not consume');
 update public.assessment_snapshots set scores=scores||jsonb_build_object('pdfMonkey',jsonb_build_object('status','ready','documentId','doc_archive'),'reportArtifact',jsonb_build_object('path','designpd/'||sid::text||'/report.pdf')) where id=sid;
 perform test_support.ok(public.reconcile_designpd_generation_artifact(u,sid),'ready archive recovery');
 perform test_support.ok(public.reconcile_designpd_generation_artifact(u,sid),'ready archive recovery retry');
 perform test_support.ok((select state='ready' from public.designpd_generation_reservations where user_id=u and source_snapshot_id=src and content_version='archive-recovery'),'recovery reservation ready');
 perform test_support.ok((select consumed_at is not null and completion_snapshot_id=sid from public.dydd_public_assessment_entitlements where id=(e->>'id')::uuid),'recovery atomically consumes correct entitlement');
end $$;
reset role;
