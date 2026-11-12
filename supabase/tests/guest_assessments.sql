-- Run only against an isolated database after the guest migration. All fixtures roll back.
\set ON_ERROR_STOP on
begin;
create function pg_temp.must_reject(q text) returns void language plpgsql as $$
begin
 begin execute q; exception when others then return; end;
 raise exception 'Expected rejection: %',q;
end $$;
set local role service_role;
do $$
declare s uuid; other_s uuid; oid uuid; pd uuid; badpd uuid; rid uuid; prid uuid; pending_id uuid; unpaid_id uuid; unpaid_result uuid; replay uuid;
 points jsonb:='{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100}';
begin
 insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email)
 values(repeat('a',64),'Guest A','a@example.test') returning id into s;
 insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email)
 values(repeat('b',64),'Guest B','b@example.test') returning id into other_s;
 insert into public.dydd_guest_orders(session_id,product,payment_provider,payment_reference,expected_product_id,expected_price_id)
 values(s,'designid','stripe_test','cs_guest_id','prod_id','price_id') returning id into oid;
 assert not public.dydd_guest_apply_payment(oid,'stripe_live','cs_guest_id','pi_guest_id',1999,'usd','price_id'), 'mode fence';
 assert not public.dydd_guest_apply_payment(oid,'stripe_test','cs_guest_id','pi_guest_id',1,'usd','price_id'), 'amount guard';
 assert not public.dydd_guest_apply_payment(oid,'stripe_test','cs_wrong','pi_guest_id',1999,'usd','price_id'), 'reference guard';
 assert not public.dydd_guest_apply_payment(oid,'stripe_test','cs_guest_id','pi_guest_id',1999,'eur','price_id'), 'currency guard';
 assert not public.dydd_guest_apply_payment(oid,'stripe_test','cs_guest_id','pi_guest_id',1999,'usd','wrong'), 'price guard';
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',s,oid,points));
 assert public.dydd_guest_apply_payment(oid,'stripe_test','cs_guest_id','pi_guest_id',1999,'usd','price_id'), 'valid ID payment';
 assert public.dydd_guest_apply_payment(oid,'stripe_test','cs_guest_id','pi_guest_id',1999,'usd','price_id'), 'payment replay';
 assert not public.dydd_guest_apply_payment(oid,'stripe_test','cs_guest_id','pi_different',1999,'usd','price_id'), 'intent rebind blocked';
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',other_s,oid,points));
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',s,oid,points||'{"Total_Pts":99}'));
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',s,oid,points||'{"Architect_Pts":61}'));
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',s,oid,points||'{"Steward_Pts":9}'));
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',s,oid,points||'{"Steward_Pts":10.5}'));
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',s,oid,jsonb_build_object('scores',points||'{"Total_Pts":99}')));
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',s,oid,points||'{"Architect_Pts":"40"}'));
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',s,oid,'{}'));
 rid:=public.dydd_guest_save_result(s,oid,jsonb_build_object('scores',points,'channel','public_guest'));
 replay:=public.dydd_guest_save_result(s,oid,'{"never":"rescore"}');
 assert replay=rid and (select scores=jsonb_build_object('scores',points,'channel','public_guest') from public.dydd_guest_results where id=rid), 'immutable result replay';
 insert into public.dydd_guest_orders(session_id,product,source_result_id,payment_provider,payment_reference,expected_product_id,expected_price_id)
 values(other_s,'designpd',rid,'stripe_test','cs_cross','prod_pd','price_pd') returning id into badpd;
 assert not public.dydd_guest_apply_payment(badpd,'stripe_test','cs_cross','pi_cross',1999,'usd','price_pd'), 'cross-session source payment';
 -- Independent save-time source check, even if a trusted service inserted a paid row directly.
 update public.dydd_guest_orders set status='paid',payment_intent_id='pi_cross',paid_at=now() where id=badpd;
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',other_s,badpd,jsonb_build_object('designIdSnapshotId',rid)));
 insert into public.dydd_guest_orders(session_id,product,payment_provider,payment_reference,expected_product_id,expected_price_id)
 values(other_s,'designid','stripe_test','cs_unpaid_source','prod_id','price_id') returning id into unpaid_id;
 insert into public.dydd_guest_results(order_id,session_id,product,scores) values(unpaid_id,other_s,'designid',points) returning id into unpaid_result;
 insert into public.dydd_guest_orders(session_id,product,source_result_id,payment_provider,payment_reference,expected_product_id,expected_price_id)
 values(other_s,'designpd',unpaid_result,'stripe_test','cs_unpaid_pd','prod_pd','price_pd') returning id into pending_id;
 assert not public.dydd_guest_apply_payment(pending_id,'stripe_test','cs_unpaid_pd','pi_unpaid_pd',1999,'usd','price_pd'), 'source order must be paid';
 insert into public.dydd_guest_orders(session_id,product,source_result_id,payment_provider,payment_reference,expected_product_id,expected_price_id)
 values(s,'designpd',rid,'stripe_test','cs_guest_pd','prod_pd','price_pd') returning id into pd;
 assert public.dydd_guest_apply_payment(pd,'stripe_test','cs_guest_pd','pi_guest_pd',1999,'usd','price_pd'), 'valid PD payment';
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',s,pd,jsonb_build_object('designIdSnapshotId',gen_random_uuid())));
 prid:=public.dydd_guest_save_result(s,pd,jsonb_build_object('designIdSnapshotId',rid,'axisScores',jsonb_build_object('x',1)));
 assert (select source_result_id=rid and session_id=s from public.dydd_guest_results where id=prid), 'source preserved';
 insert into public.dydd_guest_orders(session_id,product,source_result_id,payment_provider,payment_reference,expected_product_id,expected_price_id)
 values(s,'designpd',prid,'stripe_test','cs_pd_as_source','prod_pd','price_pd') returning id into pending_id;
 assert not public.dydd_guest_apply_payment(pending_id,'stripe_test','cs_pd_as_source','pi_pd_as_source',1999,'usd','price_pd'), 'source must be DesignID not DesignPD';
 assert not public.dydd_guest_reverse_payment('stripe_test','pi_guest_id','cs_unknown'), 'unknown reference cannot tombstone';
 assert not public.dydd_guest_reverse_payment('stripe_test','pi_wrong','cs_guest_id'), 'wrong intent cannot revoke';
 assert public.dydd_guest_reverse_payment('stripe_test','pi_guest_id','cs_guest_id'), 'ID refund';
 assert public.dydd_guest_reverse_payment('stripe_test','pi_guest_id','cs_guest_id'), 'refund replay';
 assert (select status='refunded' from public.dydd_guest_orders where id=pd), 'derived PD revoked';
 assert not public.dydd_guest_apply_payment(oid,'stripe_test','cs_guest_id','pi_guest_id',1999,'usd','price_id'), 'ID not resurrected';
 assert not public.dydd_guest_apply_payment(pd,'stripe_test','cs_guest_pd','pi_guest_pd',1999,'usd','price_pd'), 'PD not resurrected';
 perform pg_temp.must_reject(format('select public.dydd_guest_save_result(%L,%L,%L)',s,pd,jsonb_build_object('designIdSnapshotId',rid)));
 insert into public.dydd_guest_orders(session_id,product,payment_provider,payment_reference,expected_product_id,expected_price_id)
 values(s,'designid','stripe_test','cs_early','prod_id','price_id') returning id into pending_id;
 assert public.dydd_guest_reverse_payment('stripe_test','pi_early','cs_early'), 'refund before fulfillment';
 assert not public.dydd_guest_apply_payment(pending_id,'stripe_test','cs_early','pi_early',1999,'usd','price_id'), 'early refund tombstone';
 assert (select count(*)=2 from public.dydd_guest_reversals), 'only exact guest reversals';
 -- Expiry blocks payment and result creation independently of capability validation in TS.
 update public.dydd_guest_orders set status='cancelled' where id=unpaid_id;
 update public.dydd_guest_sessions set expires_at=now()-interval '1 second' where id=other_s;
 insert into public.dydd_guest_orders(session_id,product,payment_provider,payment_reference,expected_product_id,expected_price_id)
 values(other_s,'designid','stripe_test','cs_expired','prod_id','price_id') returning id into pending_id;
 assert not public.dydd_guest_apply_payment(pending_id,'stripe_test','cs_expired','pi_expired',1999,'usd','price_id'), 'expired session';
 raise notice 'PASS: tuple/mode/payment replay, unpaid/cross-session/expiry, canonical ID, immutable save, PD binding, reversal cascade, early tombstone';
end $$;
reset role;
do $$
declare n text;
begin
 foreach n in array array['dydd_guest_sessions','dydd_guest_orders','dydd_guest_results','dydd_guest_reversals'] loop
  assert (select relrowsecurity from pg_class where oid=('public.'||n)::regclass), 'RLS enabled';
  assert not has_table_privilege('anon','public.'||n,'SELECT,INSERT,UPDATE,DELETE'), 'anon revoked';
  assert not has_table_privilege('authenticated','public.'||n,'SELECT,INSERT,UPDATE,DELETE'), 'authenticated revoked';
 end loop;
 foreach n in array array['public.dydd_guest_apply_payment(uuid,text,text,text,bigint,text,text)',
 'public.dydd_guest_reserve_order(uuid,text,uuid,text,text,text)',
 'public.dydd_guest_save_result(uuid,uuid,jsonb)','public.dydd_guest_reverse_payment(text,text,text)'] loop
  assert not has_function_privilege('anon',n,'EXECUTE'), 'anon RPC revoked';
  assert not has_function_privilege('authenticated',n,'EXECUTE'), 'authenticated RPC revoked';
  assert has_function_privilege('service_role',n,'EXECUTE'), 'service RPC allowed';
 end loop;
 raise notice 'PASS: all four RLS tables and all three service-only RPC ACLs';
end $$;
rollback;
