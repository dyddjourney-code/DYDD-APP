-- Synthetic, no-provider, rollback-only verification. Does not send email/create PDF.
-- Run only AFTER the group migration. All fixtures are removed by ROLLBACK.
begin;
set local role service_role;
do $$
declare sid uuid; gid uuid; oid uuid; rid uuid; pd uuid; ids uuid[];
 h text:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''); blocked boolean:=false;
begin
 insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email)
 values(replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),'Synthetic rollback verification',gen_random_uuid()::text||'@guest-group.example.invalid') returning id into sid;
 insert into public.dydd_guest_access_grants(token_hash,name,kind,coupon_code,products,expires_at,max_uses,created_by)
 values(h,'Synthetic rollback fixture only','coupon','ROLLBACK-ONLY',array['designid','designpd'],now()+interval '1 hour',1,gen_random_uuid()) returning id into gid;
 ids:=public.dydd_guest_redeem_access(sid,h,null);oid:=ids[1];
 if not public.dydd_guest_order_entitled(oid) then raise exception 'Free entitlement missing';end if;
 if not exists(select 1 from public.dydd_guest_orders where id=oid and expected_amount=0 and payment_provider='group_free' and access_grant_id=gid and coupon_code='ROLLBACK-ONLY' and payment_intent_id is null) then raise exception 'Missing provenance';end if;
 perform public.dydd_guest_redeem_access(sid,h,null);
 if (select uses from public.dydd_guest_access_grants where id=gid)<>1 then raise exception 'Replay consumed twice';end if;
 rid:=public.dydd_guest_save_result(sid,oid,'{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100}');
 if public.dydd_guest_save_result(sid,oid,'{}')<>rid then raise exception 'Original result changed';end if;
 ids:=public.dydd_guest_redeem_access(sid,h,rid);pd:=ids[1];
 perform public.dydd_guest_save_result(sid,pd,jsonb_build_object('designIdSnapshotId',rid));
 update public.dydd_guest_access_grants set revoked_at=now() where id=gid;
 if public.dydd_guest_order_entitled(oid) or public.dydd_guest_order_entitled(pd) then raise exception 'Revocation failed';end if;
 begin perform public.dydd_guest_redeem_access(sid,h,null);exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'Revoked link accepted';end if;
 raise notice 'PASS free coupon provenance, idempotent enrollment, immutable scores, exact-source DesignPD, revocation (rollback-only)';
end $$;
rollback;
