-- Sandbox only. Service-side commercial capability, never ownership or privacy authorization.
begin;
alter table public.dydd_test_billing_entitlements add column paid_through timestamptz;
update public.dydd_test_billing_entitlements set paid_through=expires_at where paid;
create table public.dydd_test_couple_bindings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 circle_id uuid not null unique, owner_email text, partner_email text, created_at timestamptz not null default now()
);
alter table public.dydd_test_couple_bindings enable row level security;
revoke all on public.dydd_test_couple_bindings from public,anon,authenticated;
grant all on public.dydd_test_couple_bindings to service_role;
-- Preserve already-purchased scopes; historical duplicates require manual review, not a broad unlock.
insert into public.dydd_test_couple_bindings(user_id,circle_id,owner_email,partner_email)
select distinct on (o.user_id) o.user_id,o.scope_id::uuid,lower(u.email),lower(p.plan->'participants'->0->>'email')
from public.dydd_test_billing_orders o join auth.users u on u.id=o.user_id left join public.journey_circle_plans p on p.id::text=o.scope_id
where o.capability='couples_circle' and o.status='paid' order by o.user_id,o.created_at;
create function public.dydd_test_claim_couple(p_user uuid,p_circle uuid,p_owner_email text) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
declare p public.journey_circle_plans;b public.dydd_test_couple_bindings; partner text; owner_mail text;
begin
 perform pg_advisory_xact_lock(420042);
 owner_mail=nullif(lower(trim(p_owner_email)),'');
 if owner_mail is null then raise exception 'Verified owner email required';end if;
 select * into p from public.journey_circle_plans where id=p_circle for update;
 if p.user_id is distinct from p_user or p.status='archived' or p.plan->>'format'<>'Couple'
 or jsonb_array_length(coalesce(p.plan->'participants','[]'))>1 then raise exception 'Owned two-person Circle required';end if;
 partner=nullif(lower(trim(p.plan->'participants'->0->>'email')),'');
 if partner=owner_mail then raise exception 'Partner must be a different person';end if;
 if exists(select 1 from public.dydd_test_couple_bindings where circle_id<>p_circle and (owner_email in (owner_mail,partner) or partner_email in (owner_mail,partner))) then raise exception 'One shared Couple Circle per couple';end if;
 select * into b from public.dydd_test_couple_bindings where user_id=p_user;
 if found and b.circle_id<>p_circle then raise exception 'One persistent Couple Circle per purchase account';end if;
 insert into public.dydd_test_couple_bindings(user_id,circle_id,owner_email,partner_email) values(p_user,p_circle,owner_mail,partner) on conflict(user_id) do update set owner_email=excluded.owner_email;
end $$;
create function public.dydd_test_couple_binding_guard() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare b public.dydd_test_couple_bindings; partner text;
begin
 select * into b from public.dydd_test_couple_bindings where circle_id=old.id;
 if not found then return new;end if;
 partner=nullif(lower(trim(new.plan->'participants'->0->>'email')),'');
 if new.id<>old.id or new.user_id is distinct from old.user_id or new.plan->>'format'<>'Couple'
 or jsonb_array_length(coalesce(new.plan->'participants','[]'))>1
 or (b.partner_email is not null and partner is distinct from b.partner_email) then raise exception 'Purchased Couple identity and two-person scope are permanent; support correction required';end if;
 if b.partner_email is null and partner is not null then
 perform pg_advisory_xact_lock(420042);
 if partner=b.owner_email or exists(select 1 from public.dydd_test_couple_bindings where circle_id<>b.circle_id and (owner_email=partner or partner_email=partner)) then raise exception 'Partner already belongs to another Couple Circle';end if;
 update public.dydd_test_couple_bindings set partner_email=partner where user_id=b.user_id;end if;
 return new;
end $$;
create trigger dydd_test_couple_binding_guard before update on public.journey_circle_plans for each row execute function public.dydd_test_couple_binding_guard();
-- Paid history survives cancellation and failed renewals; verified refunds invalidate it explicitly.
drop function public.dydd_test_save_entitlement(uuid,text,boolean,boolean,timestamptz,timestamptz);
create function public.dydd_test_save_entitlement(p_order uuid,p_source text,p_active boolean,p_paid boolean,p_expires timestamptz,p_checked timestamptz,p_invalidated boolean default false)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare o public.dydd_test_billing_orders;
begin
 select * into strict o from public.dydd_test_billing_orders where id=p_order for update;
 insert into public.dydd_test_billing_entitlements(source_id,order_id,user_id,capability,scope_id,active,paid,expires_at,checked_at,paid_through)
 values(p_source,o.id,o.user_id,o.capability,o.scope_id,p_active and o.status<>'revoked',p_paid,p_expires,p_checked,case when p_paid and not p_invalidated then p_expires end)
 on conflict(source_id) do update set active=excluded.active,paid=excluded.paid,expires_at=excluded.expires_at,checked_at=excluded.checked_at,updated_at=now(),
 paid_through=case when p_invalidated or o.status='revoked' then null when excluded.paid then excluded.paid_through else public.dydd_test_billing_entitlements.paid_through end
 where public.dydd_test_billing_entitlements.order_id=excluded.order_id and public.dydd_test_billing_entitlements.checked_at<=excluded.checked_at;
end $$;
-- A participant owns one explicit leader credit; an explicit NULL opts out.
create table public.dydd_test_leader_credits (
 participant_id uuid primary key references auth.users(id) on delete cascade,
 leader_id uuid references auth.users(id) on delete set null, updated_at timestamptz not null default now(),
 check(leader_id is null or leader_id<>participant_id)
);
alter table public.dydd_test_leader_credits enable row level security;
revoke all on public.dydd_test_leader_credits from public,anon,authenticated;
grant all on public.dydd_test_leader_credits to service_role;
create function public.dydd_test_choose_credited_leader(p_participant uuid,p_leader uuid) returns void
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if p_leader is not null and (p_leader=p_participant or not exists(
 select 1 from public.dydd_circle_memberships m join public.journey_circle_plans p on p.id=m.circle_id
 where m.user_id=p_participant and m.status='accepted' and m.accepted_at is not null
 and p.user_id=p_leader and p.status='active' and p.plan->>'format'<>'Couple'
 and exists(select 1 from jsonb_array_elements(p.plan->'participants') x where lower(x->>'email')=m.email)))
 then raise exception 'Choose a leader of one of your accepted active Circles';end if;
 insert into public.dydd_test_leader_credits(participant_id,leader_id) values(p_participant,p_leader)
 on conflict(participant_id) do update set leader_id=excluded.leader_id,updated_at=now();
end $$;
revoke all on function public.dydd_test_choose_credited_leader(uuid,uuid) from public,anon,authenticated;
grant execute on function public.dydd_test_choose_credited_leader(uuid,uuid) to service_role;
create or replace function public.dydd_test_qualifying_participants(leader uuid) returns integer
language sql stable security invoker set search_path=public,pg_temp as $$
 with attributed as (
 select m.user_id,p.user_id leader_id,row_number() over(partition by m.user_id order by m.accepted_at,m.id) n
 from public.dydd_circle_memberships m join public.journey_circle_plans p on p.id=m.circle_id
 left join public.dydd_test_leader_credits choice on choice.participant_id=m.user_id
 where (choice.participant_id is null or choice.leader_id=p.user_id) and m.status='accepted' and m.accepted_at is not null and m.user_id is not null and p.status='active'
 and p.user_id is not null and m.user_id<>p.user_id and p.plan->>'format'<>'Couple'
 and exists(select 1 from jsonb_array_elements(p.plan->'participants') x where lower(x->>'email')=m.email)
 ) select count(*)::integer from attributed a where a.n=1 and a.leader_id=leader and exists(
 select 1 from public.dydd_test_billing_entitlements e join public.dydd_test_billing_orders o on o.id=e.order_id
 where e.user_id=a.user_id and e.capability='personal' and e.active and e.paid and e.expires_at>now() and o.status<>'revoked');
$$;
create function public.dydd_circle_billing_state(p_owner uuid,p_circle uuid,p_format text) returns jsonb
language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare personal boolean; couple boolean=p_format='Couple'; unlocked boolean=false; until_at timestamptz; ends_at timestamptz; phase text; current_paid boolean=false;
begin
 if p_circle is not null and not exists(select 1 from public.journey_circle_plans where id=p_circle and user_id=p_owner and plan->>'format'=p_format) then raise exception 'Circle owner and format required';end if;
 personal=exists(select 1 from public.dydd_personal_access where user_id=p_owner and scope='personal_all_access') or exists(
 select 1 from public.dydd_test_billing_entitlements e join public.dydd_test_billing_orders o on o.id=e.order_id where e.user_id=p_owner and e.capability='personal' and e.active and e.paid and e.expires_at>now() and o.status<>'revoked');
 if couple then
 select exists(select 1 from public.dydd_test_billing_entitlements e join public.dydd_test_billing_orders o on o.id=e.order_id
 join public.dydd_test_couple_bindings b on b.circle_id=p_circle and b.user_id=e.user_id
 where e.scope_id=p_circle::text and e.capability='couples_circle' and e.active and e.paid and o.status<>'revoked') into unlocked;
 personal=personal and not exists(select 1 from public.dydd_circle_memberships m where m.circle_id=p_circle and m.status='accepted' and m.user_id is not null and m.user_id<>p_owner and not (exists(select 1 from public.dydd_personal_access a where a.user_id=m.user_id and a.scope='personal_all_access') or exists(select 1 from public.dydd_test_billing_entitlements e join public.dydd_test_billing_orders o on o.id=e.order_id where e.user_id=m.user_id and e.capability='personal' and e.active and e.paid and e.expires_at>now() and o.status<>'revoked')));
 phase=case when unlocked and personal then 'active' when unlocked then 'read_only' else 'unpaid' end;
 else
 select max(e.paid_through),bool_or(e.paid_through>now()) into until_at,current_paid
 from public.dydd_test_billing_entitlements e join public.dydd_test_billing_orders o on o.id=e.order_id
 where e.user_id=p_owner and e.capability='circle_leadership' and o.status<>'revoked';
 ends_at=until_at+interval '30 days';
 phase=case when current_paid and personal then 'active' when until_at<=now() and ends_at>now() and personal then 'transition' when until_at is not null then 'read_only' else 'unpaid' end;
 end if;
 return jsonb_build_object('phase',phase,'canCreate',phase='active' and not couple,'canEnroll',phase='active','canOperate',phase in ('active','transition'),'canRead',true,'paidThrough',until_at,'transitionEndsAt',ends_at,'personalActive',personal,'couples',couple);
end $$;
create function public.dydd_circle_require_billing(p_owner uuid,p_circle uuid,p_format text,p_action text) returns void
language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare s jsonb;k text;
begin
 s=public.dydd_circle_billing_state(p_owner,p_circle,p_format);
 k=case p_action when 'read' then 'canRead' when 'create' then 'canCreate' when 'enroll' then 'canEnroll' when 'operate' then 'canOperate' else null end;
 if k is null or not coalesce((s->>k)::boolean,false) then raise exception 'Circle billing does not allow % (%). Renew to restore tools.',p_action,s->>'phase';end if;
end $$;
revoke all on function public.dydd_test_claim_couple(uuid,uuid,text),public.dydd_test_couple_binding_guard(),public.dydd_test_save_entitlement(uuid,text,boolean,boolean,timestamptz,timestamptz,boolean),public.dydd_circle_billing_state(uuid,uuid,text),public.dydd_circle_require_billing(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.dydd_test_claim_couple(uuid,uuid,text),public.dydd_test_couple_binding_guard(),public.dydd_test_save_entitlement(uuid,text,boolean,boolean,timestamptz,timestamptz,boolean),public.dydd_circle_billing_state(uuid,uuid,text),public.dydd_circle_require_billing(uuid,uuid,text,text) to service_role;
commit;
