-- Isolated sandbox only. One-off assessment access is not membership/course access.
begin;
create table public.dydd_public_assessment_orders (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 product text not null check(product in ('designid','designpd')),
 source_snapshot_id uuid references public.assessment_snapshots(id) on delete restrict,
 status text not null default 'pending' check(status in ('pending','paid','failed','cancelled','refunded','waived')),
 fulfillment_status text not null default 'blocked' check(fulfillment_status in ('blocked','fulfilled','revoked')),
 payment_provider text, payment_reference text unique,
 created_at timestamptz not null default now(), fulfilled_at timestamptz,
 check((product='designid' and source_snapshot_id is null) or (product='designpd' and source_snapshot_id is not null)),
 check(fulfillment_status<>'fulfilled' or (status='waived' and payment_provider is null and payment_reference is null and fulfilled_at is not null))
);
create table public.dydd_public_assessment_codes (
 id uuid primary key default gen_random_uuid(),
 code_hash text not null unique check(code_hash ~ '^[0-9a-f]{64}$'),
 product text not null check(product in ('designid','designpd')),
 batch_label text not null,
 created_at timestamptz not null default now(), expires_at timestamptz, revoked_at timestamptz,
 redeemed_at timestamptz, redeemed_by uuid references auth.users(id) on delete restrict,
 order_id uuid unique references public.dydd_public_assessment_orders(id) on delete restrict,
 check((redeemed_at is null and redeemed_by is null and order_id is null) or (redeemed_at is not null and redeemed_by is not null and order_id is not null))
);
create table public.dydd_public_assessment_entitlements (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.dydd_public_assessment_orders(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 product text not null check(product in ('designid','designpd')),
 source_snapshot_id uuid references public.assessment_snapshots(id) on delete restrict,
 grant_kind text not null default 'waiver' check(grant_kind='waiver'),
 created_at timestamptz not null default now(), consumed_at timestamptz, revoked_at timestamptz,
 completion_snapshot_id uuid references public.assessment_snapshots(id) on delete restrict,
 check((product='designid' and source_snapshot_id is null) or (product='designpd' and source_snapshot_id is not null)),
 check((consumed_at is null)=(completion_snapshot_id is null))
);
create index dydd_public_entitlements_lookup on public.dydd_public_assessment_entitlements(user_id,product,source_snapshot_id) where revoked_at is null;
alter table public.dydd_public_assessment_orders enable row level security;
alter table public.dydd_public_assessment_codes enable row level security;
alter table public.dydd_public_assessment_entitlements enable row level security;
revoke all on public.dydd_public_assessment_orders,public.dydd_public_assessment_codes,public.dydd_public_assessment_entitlements from public,anon,authenticated;
grant all on public.dydd_public_assessment_orders,public.dydd_public_assessment_codes,public.dydd_public_assessment_entitlements to service_role;

-- Trusted current verified Auth identity; never accepts email/user_metadata from a browser.
create function public.dydd_public_assessment_source_owned(p_user_id uuid,p_source_snapshot_id uuid)
returns boolean language plpgsql stable security invoker set search_path='' as $$
declare account_email text; payload jsonb; points numeric[]; v text;
begin
 account_email:=dydd_private.retake_verified_email(p_user_id);
 if account_email is null or p_source_snapshot_id is null then return false; end if;
 select s.scores into payload from public.assessment_snapshots s
 left join public.assessment_participants p on p.id=s.participant_id
 where s.id=p_source_snapshot_id and s.assessment_type='designid'
 and (s.user_id=p_user_id or (s.user_id is null and (p.user_id=p_user_id or
 (p.user_id is null and dydd_private.timing_email_key(p.normalized_email)=dydd_private.timing_email_key(account_email)))));
 if not found then return false;end if;
 -- Mirror scoreDesignPd's corrected 100-point source requirement (including nested scores).
 if jsonb_typeof(payload->'scores')='object' then payload:=payload->'scores';end if;
 if jsonb_typeof(payload->'scores')='object' then payload:=payload->'scores';end if;
 points:='{}'::numeric[];
 foreach v in array array['Architect_Pts','Artisan_Pts','Shepherd_Pts','Steward_Pts'] loop
  if coalesce(payload->>v,'') !~ '^[0-9]+([.]0+)?$' then return false;end if;
  points:=array_append(points,(payload->>v)::numeric);
 end loop;
 if coalesce(payload->>'Total_Pts','') !~ '^100([.]0+)?$' then return false;end if;
 return points[1] between 0 and 60 and points[2] between 0 and 60 and points[3] between 0 and 60 and points[4] between 0 and 60
 and points[1]+points[2]+points[3]+points[4]=100;
end $$;

create function public.dydd_has_public_assessment_entitlement(p_user_id uuid,p_product text,p_source_snapshot_id uuid default null)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
 if p_product is null or p_product not in ('designid','designpd') or dydd_private.retake_verified_email(p_user_id) is null then return null;end if;
 if (p_product='designid' and p_source_snapshot_id is not null) or (p_product='designpd' and not public.dydd_public_assessment_source_owned(p_user_id,p_source_snapshot_id)) then return null;end if;
 select to_jsonb(e) into result from public.dydd_public_assessment_entitlements e join public.dydd_public_assessment_orders o on o.id=e.order_id
 where e.user_id=p_user_id and e.product=p_product and e.source_snapshot_id is not distinct from p_source_snapshot_id
 and e.revoked_at is null and e.consumed_at is null and o.user_id=e.user_id and o.product=e.product
 and o.source_snapshot_id is not distinct from e.source_snapshot_id and o.status='waived' and o.fulfillment_status='fulfilled'
 order by e.created_at,e.id limit 1;
 return result;
end $$;

create function public.dydd_redeem_public_assessment_code(p_code_hash text,p_user_id uuid,p_product text,p_source_snapshot_id uuid default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.dydd_public_assessment_codes%rowtype; e public.dydd_public_assessment_entitlements%rowtype; oid uuid;
begin
 if p_product is null or p_product not in ('designid','designpd') or coalesce(p_code_hash,'') !~ '^[0-9a-f]{64}$' then raise exception 'Invalid assessment code';end if;
 if dydd_private.retake_verified_email(p_user_id) is null then raise exception 'Verified account required';end if;
 if p_product='designid' and p_source_snapshot_id is not null then raise exception 'DesignID does not accept a source';end if;
 -- Lock the exact source before consuming any code. Prerequisite failure leaves code untouched.
 if p_product='designpd' then
  perform 1 from public.assessment_snapshots where id=p_source_snapshot_id for share;
  if not public.dydd_public_assessment_source_owned(p_user_id,p_source_snapshot_id) then raise exception 'DesignPD requires your valid completed DesignID';end if;
 end if;
 select * into c from public.dydd_public_assessment_codes where code_hash=p_code_hash for update;
 if not found or c.product<>p_product or c.revoked_at is not null then raise exception 'Invalid assessment code';end if;
 if c.redeemed_at is not null then
  if c.redeemed_by<>p_user_id then raise exception 'Assessment code already used';end if;
  select * into e from public.dydd_public_assessment_entitlements where order_id=c.order_id and user_id=p_user_id and product=p_product and source_snapshot_id is not distinct from p_source_snapshot_id;
  if not found or e.revoked_at is not null then raise exception 'Assessment code already used';end if;
  return to_jsonb(e);
 end if;
 if c.expires_at is not null and c.expires_at<=now() then raise exception 'Assessment code expired';end if;
 insert into public.dydd_public_assessment_orders(user_id,product,source_snapshot_id,status,fulfillment_status,fulfilled_at)
 values(p_user_id,p_product,p_source_snapshot_id,'waived','fulfilled',now()) returning id into oid;
 insert into public.dydd_public_assessment_entitlements(order_id,user_id,product,source_snapshot_id)
 values(oid,p_user_id,p_product,p_source_snapshot_id) returning * into e;
 update public.dydd_public_assessment_codes set redeemed_at=now(),redeemed_by=p_user_id,order_id=oid where id=c.id;
 return to_jsonb(e);
end $$;

-- Future payment fulfillment is deliberately fail-closed. No provider wiring exists.
create function public.dydd_fulfill_public_assessment_payment(p_order_id uuid,p_provider_reference text)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin raise exception 'Public assessment payment fulfillment is disabled in sandbox';end $$;
revoke all on function public.dydd_public_assessment_source_owned(uuid,uuid),public.dydd_has_public_assessment_entitlement(uuid,text,uuid),public.dydd_redeem_public_assessment_code(text,uuid,text,uuid),public.dydd_fulfill_public_assessment_payment(uuid,text) from public,anon,authenticated;
grant execute on function public.dydd_public_assessment_source_owned(uuid,uuid),public.dydd_has_public_assessment_entitlement(uuid,text,uuid),public.dydd_redeem_public_assessment_code(text,uuid,text,uuid),public.dydd_fulfill_public_assessment_payment(uuid,text) to service_role;
commit;
