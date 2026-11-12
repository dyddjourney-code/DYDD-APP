begin;
create function pg_temp.must_reject(q text) returns void language plpgsql as $$
begin begin execute q; exception when others then return; end;raise exception 'Expected rejection: %',q;end $$;
set local role service_role;
do $$
declare s uuid; other_s uuid; oid uuid; rid uuid; intent uuid; next_intent uuid;
begin
 insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email) values(repeat('7',64),'Email QA','email-qa@example.invalid') returning id into s;
 insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email) values(repeat('8',64),'Other','other-qa@example.invalid') returning id into other_s;
 insert into public.dydd_guest_orders(session_id,product,payment_provider,payment_reference,payment_intent_id,expected_product_id,expected_price_id,status,paid_at)
 values(s,'designid','stripe_live','cs_email_qa','pi_email_qa','prod_email_qa','price_email_qa','paid',now()) returning id into oid;
 insert into public.dydd_guest_results(order_id,session_id,product,scores,report_state) values(oid,s,'designid','{}','not_started') returning id into rid;
 perform pg_temp.must_reject(format('select public.dydd_guest_reserve_email_resend(%L,%L)',s,rid));
 update public.dydd_guest_results set report_state='ready',pdf=jsonb_build_object('storage',jsonb_build_object('bucket','assessment-report-pdfs','path','guest/'||rid::text||'/report.pdf')) where id=rid;
 perform pg_temp.must_reject(format('select public.dydd_guest_reserve_email_resend(%L,%L)',other_s,rid));
 intent:=public.dydd_guest_reserve_email_resend(s,rid);
 assert public.dydd_guest_reserve_email_resend(s,rid)=intent,'uncertain intent reused';
 update public.dydd_guest_email_resends set accepted_at=now(),provider_id='mail_qa' where id=intent;
 perform pg_temp.must_reject(format('select public.dydd_guest_reserve_email_resend(%L,%L)',s,rid));
 update public.dydd_guest_email_resends set created_at=now()-interval '3 minutes' where id=intent;
 next_intent:=public.dydd_guest_reserve_email_resend(s,rid);assert next_intent<>intent,'real separate resend';
 update public.dydd_guest_email_resends set accepted_at=now(),created_at=now()-interval '3 minutes' where id=next_intent;
 next_intent:=public.dydd_guest_reserve_email_resend(s,rid);
 update public.dydd_guest_email_resends set accepted_at=now(),created_at=now()-interval '3 minutes' where id=next_intent;
 perform pg_temp.must_reject(format('select public.dydd_guest_reserve_email_resend(%L,%L)',s,rid));
 update public.dydd_guest_orders set status='refunded' where id=oid;
 perform pg_temp.must_reject(format('select public.dydd_guest_reserve_email_resend(%L,%L)',s,rid));
 raise notice 'PASS real bounded resend: paid exact ownership/archive, uncertainty reuse, cooldown,3/day,refund denial';
end $$;
reset role;
do $$begin
 assert not has_table_privilege('anon','public.dydd_guest_email_resends','SELECT,INSERT,UPDATE,DELETE');
 assert not has_table_privilege('authenticated','public.dydd_guest_email_resends','SELECT,INSERT,UPDATE,DELETE');
 assert not has_function_privilege('anon','public.dydd_guest_reserve_email_resend(uuid,uuid)','EXECUTE');
 assert not has_function_privilege('authenticated','public.dydd_guest_reserve_email_resend(uuid,uuid)','EXECUTE');
end $$;
rollback;
