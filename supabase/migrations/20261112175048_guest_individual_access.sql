-- Additive individual invitations; no account rights or paid-repeat policy changes.
-- App computes expires_at from the owner's Eastern DATE end-of-day and stores UTC.
-- Tokens continue to use the existing unique token_hash (deterministic app HMAC).
begin;
alter table public.dydd_guest_access_grants
 drop constraint dydd_guest_access_grants_kind_check,
 add constraint dydd_guest_access_grants_kind_check check(kind in ('group','coupon','individual')),
 add column recipient_email text,
 add column recipient_name text,
 add column invitation_status text not null default 'not_sent',
 add column invitation_sent_at timestamptz,
 add column invitation_job_id uuid,
 add constraint dydd_guest_individual_recipient_check check(kind<>'individual' or (
  recipient_email is not null and recipient_email=lower(btrim(recipient_email))
  and recipient_email ~ '^[^[:space:]@]+@[^[:space:]@]+$' and max_uses=1
 ));
comment on column public.dydd_guest_access_grants.invitation_job_id is
 'Owner invitation request UUID, scoped by grant ID in the lifecycle event key; intentionally not a lifecycle table FK.';
comment on column public.dydd_guest_access_grants.expires_at is
 'Absolute deadline. App resolves owner-entered Eastern DATE to end-of-day instant. Individual deadlines apply to redemption and new result INSERT, not saved report entitlement.';
create or replace function public.dydd_guest_redeem_access(p_session_id uuid,p_token_hash text,p_source uuid default null)
returns uuid[] language plpgsql security invoker set search_path='' as $$
declare g public.dydd_guest_access_grants%rowtype; s public.dydd_guest_sessions%rowtype;
 enrolled boolean; oid uuid; ids uuid[]:='{}'; prod text;
begin
 select * into s from public.dydd_guest_sessions where id=p_session_id and expires_at>now();
 if not found then raise exception 'Valid guest session required';end if;
 perform pg_advisory_xact_lock(hashtextextended('guest-timing:'||lower(btrim(s.participant_email)),0));
 perform pg_advisory_xact_lock(hashtextextended('guest-session:'||p_session_id::text,0));
 select * into g from public.dydd_guest_access_grants where token_hash=p_token_hash for update;
 if not found or g.revoked_at is not null then raise exception 'Access link is unavailable';end if;
 -- Individual invitation identity is exact normalized email, never alias folding.
 if g.kind='individual' then
  if g.recipient_email is distinct from lower(btrim(s.participant_email)) then
   raise exception 'Access link is for a different recipient';
  end if;
  -- Unlike groups, an enrolled individual cannot start another included assessment
  -- after the deadline. Saved reports remain entitled through the unchanged verifier.
  if g.expires_at<=clock_timestamp() then raise exception 'Individual access deadline has passed';end if;
 end if;
 select exists(select 1 from public.dydd_guest_access_redemptions where grant_id=g.id and session_id=s.id) into enrolled;
 if not enrolled and (g.expires_at<=now() or g.uses>=g.max_uses) then raise exception 'Access link is expired or fully used';end if;
 -- PD is ALWAYS derived from a saved DesignID in this capability, never a typed identity.
 if p_source is not null and not exists(select 1 from public.dydd_guest_results r where r.id=p_source and r.session_id=s.id
  and r.product='designid' and public.dydd_guest_order_entitled(r.order_id))
 then raise exception 'Valid completed DesignID required';end if;
 if not ('designid'=any(g.products)) and p_source is null then raise exception 'Open this link in your existing DesignID session first';end if;
 foreach prod in array g.products loop
  if prod='designpd' and p_source is null then continue;end if;
  if prod='designid' and p_source is not null then continue;end if;
  -- Replays retain the original order. Other grants/paid checkouts are never overwritten.
  select id into oid from public.dydd_guest_orders where session_id=s.id and product=prod
   and source_result_id is not distinct from (case when prod='designpd' then p_source else null end)
   and status in ('pending','paid');
  if oid is not null then
   if not public.dydd_guest_order_entitled(oid) then raise exception 'Existing purchase needs recovery; do not enroll again';end if;
   ids:=array_append(ids,oid); continue;
  end if;
  if prod='designid' then
   if exists(select 1 from public.dydd_guest_results r join public.dydd_guest_sessions gs on gs.id=r.session_id
    where r.product='designid' and lower(btrim(gs.participant_email))=lower(btrim(s.participant_email))
    and r.created_at+interval '6 months'>now()) then raise exception 'Assessment timing needs recovery. Use your existing private link or contact support';end if;
   if exists(select 1 from public.dydd_guest_orders o join public.dydd_guest_sessions gs on gs.id=o.session_id
    where o.product='designid' and o.status in ('pending','paid') and lower(btrim(gs.participant_email))=lower(btrim(s.participant_email))
    and (o.status='pending' or not exists(select 1 from public.dydd_guest_results r where r.order_id=o.id)))
   then raise exception 'Existing purchase needs recovery; do not enroll again';end if;
  end if;
  -- Provenance is immutable on the order even if the owner later renames a grant.
  insert into public.dydd_guest_orders(session_id,product,source_result_id,status,payment_provider,expected_amount,paid_at,access_grant_id,access_name,coupon_code)
  values(s.id,prod,case when prod='designpd' then p_source else null end,'paid','group_free',0,now(),g.id,g.name,g.coupon_code) returning id into oid;
  ids:=array_append(ids,oid);
 end loop;
 if cardinality(ids)=0 then raise exception 'No applicable assessment in this access link';end if;
 if not enrolled then
  insert into public.dydd_guest_access_redemptions(grant_id,session_id) values(g.id,s.id);
  update public.dydd_guest_access_grants set uses=uses+1 where id=g.id;
 end if;
 return ids;
end $$;

-- Fence the actual INSERT, not an earlier app/RPC eligibility check. Wall-clock
-- time closes long-running-transaction and lock-wait deadline bypasses. Updating
-- report/PDF/email metadata and replaying an already saved result are unaffected.
create function public.dydd_guest_individual_result_deadline()
returns trigger language plpgsql security invoker set search_path='' as $$
declare g public.dydd_guest_access_grants%rowtype; o public.dydd_guest_orders%rowtype;
begin
 select * into o from public.dydd_guest_orders where id=new.order_id;
 if o.access_grant_id is null then return new;end if;
 select * into g from public.dydd_guest_access_grants where id=o.access_grant_id for share;
 if g.kind='individual' then
  if g.revoked_at is not null or g.expires_at<=clock_timestamp() then
   raise exception 'Individual access deadline has passed or access is revoked';
  end if;
  if new.session_id is distinct from o.session_id or not exists(
   select 1 from public.dydd_guest_access_redemptions r
   join public.dydd_guest_sessions s on s.id=r.session_id
   where r.grant_id=g.id and r.session_id=new.session_id
   and lower(btrim(s.participant_email))=g.recipient_email
  ) then raise exception 'Individual access recipient enrollment required';end if;
 end if;
 return new;
end $$;
create trigger dydd_guest_individual_result_deadline
 before insert on public.dydd_guest_results
 for each row execute function public.dydd_guest_individual_result_deadline();
revoke all on function public.dydd_guest_individual_result_deadline(),public.dydd_guest_redeem_access(uuid,text,uuid)
 from public,anon,authenticated;
grant execute on function public.dydd_guest_individual_result_deadline(),public.dydd_guest_redeem_access(uuid,text,uuid)
 to service_role;
commit;
