-- Paid website attempts only. App saves and no-charge group timing remain unchanged.
begin;
create or replace function public.dydd_guest_reserve_order(p_session_id uuid,p_product text,p_source uuid,p_provider text,p_product_id text,p_price text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.dydd_guest_sessions%rowtype; oid uuid;
begin
 select * into s from public.dydd_guest_sessions where id=p_session_id and expires_at>now();
 if not found or p_product not in ('designid','designpd') or not public.dydd_public_assessment_provider_allowed(p_provider)
 or p_provider not in ('stripe_test','stripe_live') or coalesce(p_product_id,'') !~ '^prod_.+' or coalesce(p_price,'') !~ '^price_.+'
 then raise exception 'Invalid guest checkout reservation';end if;
 -- Paid standalone attempts have no completed-attempt cooldown.
 -- Normalized email locks still prevent duplicate unfinished purchases.
 -- No account ownership or disclosure is inferred from guest identity.
 -- No Gmail alias folding and no access to historical app identities/reports.
 perform pg_advisory_xact_lock(hashtextextended('guest-timing:'||lower(btrim(s.participant_email)),0));
 perform pg_advisory_xact_lock(hashtextextended('guest-session:'||p_session_id::text,0));
 if p_product='designid' then
  if p_source is not null then raise exception 'DesignID cannot have a source';end if;

 else
  if not exists(select 1 from public.dydd_guest_results r join public.dydd_guest_orders o on o.id=r.order_id
   where r.id=p_source and r.product='designid' and r.session_id=p_session_id and o.status='paid'
   and public.dydd_guest_order_entitled(o.id)) then raise exception 'Valid completed DesignID required';end if;
 end if;
 -- A pending first ID checkout for this exact guest email cannot be charged again
 -- through a second freshly opened guest capability while provider state is uncertain.
 if p_product='designid' and exists(select 1 from public.dydd_guest_orders o join public.dydd_guest_sessions gs on gs.id=o.session_id
  where o.product='designid' and o.status in ('pending','paid') and lower(btrim(gs.participant_email))=lower(btrim(s.participant_email))
  and (o.status='pending' or not exists(select 1 from public.dydd_guest_results r where r.order_id=o.id)))
 then raise exception 'An existing purchase needs recovery. Use your private link or contact support; do not repurchase';end if;
 insert into public.dydd_guest_orders(session_id,product,source_result_id,payment_provider,expected_product_id,expected_price_id)
 values(p_session_id,p_product,p_source,p_provider,p_product_id,p_price) returning id into oid;
 return oid;
end $$;


revoke all on function public.dydd_guest_reserve_order(uuid,text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.dydd_guest_reserve_order(uuid,text,uuid,text,text,text) to service_role;
commit;
