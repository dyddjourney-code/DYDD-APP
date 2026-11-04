// Explicit sandbox target, transaction rollback: no persistent fixtures or email delivery.
import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json')),s=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json'));
if(c.ref!=='atemrshtshxoqnuevvqu')throw Error('Sandbox target mismatch');
async function sql(query){const r=await fetch('https://api.supabase.com/v1/projects/'+c.ref+'/database/query',{method:'POST',headers:{Authorization:'Bearer '+s.management_access_token,'Content-Type':'application/json'},body:JSON.stringify({query})});const text=await r.text();if(!r.ok)throw Error('Sandbox rollback verification '+r.status+': '+text.slice(0,2000));return JSON.parse(text);}
const existing=await sql("select exists(select 1 from pg_proc where proname='dydd_circle_operate') installed");
const migration=existing[0].installed?'':fs.readFileSync('supabase/migrations/20261104221000_circle_operations.sql','utf8').replace(/^begin;$/m,'').replace(/^commit;$/m,'');
const result=await sql('begin;\n'+migration+`\n
-- Minimal auth fixtures deliberately never persist and never enter live sender queues.
insert into auth.users(id,email,email_confirmed_at) values
('98000000-0000-4000-8000-000000000001','circle-ops-leader@example.invalid',now()),
('98000000-0000-4000-8000-000000000002','circle-ops-member@example.invalid',now()),
('98000000-0000-4000-8000-000000000003','circle-ops-other@example.invalid',now()),
('98000000-0000-4000-8000-000000000004','circle-ops-newleader@example.invalid',now());
insert into public.dydd_test_billing_orders(id,user_id,capability,scope_id,price_id,status) values
('98100000-0000-4000-8000-000000000001','98000000-0000-4000-8000-000000000001','personal','account','price_test_ops','paid'),
('98100000-0000-4000-8000-000000000002','98000000-0000-4000-8000-000000000001','circle_leadership','account','price_test_ops','paid'),
('98100000-0000-4000-8000-000000000003','98000000-0000-4000-8000-000000000002','personal','account','price_test_ops','paid'),
('98100000-0000-4000-8000-000000000004','98000000-0000-4000-8000-000000000004','personal','account','price_test_ops','paid'),
('98100000-0000-4000-8000-000000000005','98000000-0000-4000-8000-000000000004','circle_leadership','account','price_test_ops','paid');
insert into public.dydd_test_billing_entitlements(source_id,order_id,user_id,capability,scope_id,active,paid,expires_at,paid_through)
select id::text,id,user_id,capability,scope_id,true,true,now()+interval '30 days',now()+interval '30 days' from public.dydd_test_billing_orders where price_id='price_test_ops';
set local role service_role;
insert into public.journey_circle_plans(id,user_id,status,plan) values
('98200000-0000-4000-8000-000000000001','98000000-0000-4000-8000-000000000001','active','{"name":"SQL test","format":"Small group","expectedPeople":"3","participants":[]}'),
('98200000-0000-4000-8000-000000000002','98000000-0000-4000-8000-000000000001','draft','{"name":"Cohort draft","format":"Cohort","expectedPeople":"50","participants":[],"assignments":{"identity-who-vs-whose-16":1}}');
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"invite","circleId":"98200000-0000-4000-8000-000000000001","name":"Member","email":"circle-ops-member@example.invalid"}');
do $$ declare token text;failed boolean:=false;begin
 select payload->>'token' into token from public.dydd_circle_held_outbox where circle_id='98200000-0000-4000-8000-000000000001';
 begin perform public.dydd_circle_operate('98000000-0000-4000-8000-000000000003',jsonb_build_object('action','accept_invite','token',token));exception when raise_exception then failed:=true;end;
 if not failed then raise exception 'TEST: wrong email accepted';end if;
 perform public.dydd_circle_operate('98000000-0000-4000-8000-000000000002',jsonb_build_object('action','accept_invite','token',token));
 if not exists(select 1 from public.dydd_circle_memberships where user_id='98000000-0000-4000-8000-000000000002' and status='accepted') then raise exception 'TEST: missing persisted accepted role';end if;
end $$;
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000002','{"action":"callout","circleId":"98200000-0000-4000-8000-000000000001","session":"1","lesson":"a","prompt":"p","marked":true,"shareText":true,"text":"Explicit request","audience":"leader"}');
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000002','{"action":"callout","circleId":"98200000-0000-4000-8000-000000000001","session":"1","lesson":"a","prompt":"p","marked":true,"shareText":false,"text":"","audience":"leader"}');
do $$ begin if (select count(*) from public.dydd_circle_callouts where circle_id='98200000-0000-4000-8000-000000000001')<>1 then raise exception 'TEST: repeated topic duplicated participant';end if;end $$;
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"request_cohort","circleId":"98200000-0000-4000-8000-000000000002","organization":"Test University","purpose":"Semester formation","enrollment":50,"launchDate":"2027-02-01","details":"A supervised university cohort"}');
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"request_cohort","circleId":"98200000-0000-4000-8000-000000000002","organization":"Test University","purpose":"Semester formation","enrollment":50,"launchDate":"2027-02-01","details":"A supervised university cohort"}');
do $$ declare req uuid;begin
 if (select count(*) from public.dydd_circle_cohort_requests where circle_id='98200000-0000-4000-8000-000000000002')<>1 then raise exception 'TEST: cohort requests not deduplicated';end if;
 select id into req from public.dydd_circle_cohort_requests where circle_id='98200000-0000-4000-8000-000000000002';
 perform public.dydd_circle_operate('98000000-0000-4000-8000-000000000004',jsonb_build_object('action','approve_cohort','requestId',req,'seatCap',55),true);
 update public.journey_circle_plans set status='active' where id='98200000-0000-4000-8000-000000000002';
end $$;
-- Capacity includes pending seats, and each approval is scoped to this one cohort.
do $$ declare failed boolean:=false;i integer;begin
 for i in 1..54 loop
 insert into public.dydd_circle_memberships(circle_id,email,display_name,status,token_hash,expires_at) values('98200000-0000-4000-8000-000000000002','pending-'||i||'@example.invalid','Pending seat','invited',md5(i::text)||md5('seat'||i),now()+interval '14 days');
 end loop;
 begin insert into public.dydd_circle_memberships(circle_id,email,display_name,status,token_hash,expires_at) values('98200000-0000-4000-8000-000000000002','overflow@example.invalid','Overflow','invited',repeat('f',64),now()+interval '14 days');exception when raise_exception then failed:=true;end;
 if not failed then raise exception 'TEST: pending seat overflow allowed';end if;
 failed:=false;
 begin perform public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"callout","circleId":"98200000-0000-4000-8000-000000000002","session":"1","lesson":"identity-who-vs-whose-16","prompt":"child-of-god-response","marked":true,"shareText":true,"text":"Cohort text forbidden","audience":"leader"}');exception when raise_exception then failed:=true;end;
 if not failed then raise exception 'TEST: Cohort accepted free text';end if;
 perform public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"callout","circleId":"98200000-0000-4000-8000-000000000002","session":"1","lesson":"identity-who-vs-whose-16","prompt":"child-of-god-response","marked":true,"shareText":false,"text":"","audience":"leader"}');
end $$;
-- Server/database daily/monthly/burst ledgers persist independently of Circle records.
do $$ declare failed boolean:=false;budget text;begin
 foreach budget in array array['daily','monthly','burst'] loop
 insert into public.dydd_circle_operation_limits(user_id,daily,monthly,burst) values('98000000-0000-4000-8000-000000000001',30,60,5) on conflict(user_id) do update set daily=30,monthly=60,burst=5;
 execute format('update public.dydd_circle_operation_limits set %I=2 where user_id=%L',budget,'98000000-0000-4000-8000-000000000001');
 failed:=false;
 begin perform public.dydd_circle_budget('98000000-0000-4000-8000-000000000001','create',1);exception when raise_exception then failed:=true;end;
 if not failed then raise exception 'TEST: creation % budget not enforced',budget;end if;
 end loop;
 update public.dydd_circle_operation_limits set daily=30,monthly=60,burst=5,invite_burst=55 where user_id='98000000-0000-4000-8000-000000000001';
 failed:=false;
 begin perform public.dydd_circle_budget('98000000-0000-4000-8000-000000000001','invite',1);exception when raise_exception then failed:=true;end;
 if not failed then raise exception 'TEST: invitation budget not enforced';end if;
 update public.dydd_circle_operation_limits set invite_burst=100 where user_id='98000000-0000-4000-8000-000000000001';
end $$;
-- Roster preview rejects over-cap rows before invitation consumption.
do $$ declare preview jsonb;begin
 preview:=public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"preview_roster","circleId":"98200000-0000-4000-8000-000000000002","rows":[{"name":"Too many","email":"preview-overflow@example.invalid"}],"errors":[]}');
 if (preview->>'canInvite')::boolean then raise exception 'TEST: overcapacity preview marked valid';end if;
end $$;
-- Personal payment is a separate gate, not granted by capacity approval or invitation.
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"invite","circleId":"98200000-0000-4000-8000-000000000001","name":"Unpaid","email":"circle-ops-other@example.invalid"}');
do $$ declare tok text;failed boolean:=false;begin
 select payload->>'token' into tok from public.dydd_circle_held_outbox where recipient='circle-ops-other@example.invalid';
 begin perform public.dydd_circle_operate('98000000-0000-4000-8000-000000000003',jsonb_build_object('action','accept_invite','token',tok));exception when raise_exception then failed:=true;end;
 if not failed then raise exception 'TEST: unpaid invitation acceptance';end if;
end $$;
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"invite","circleId":"98200000-0000-4000-8000-000000000001","name":"New leader","email":"circle-ops-newleader@example.invalid"}');
do $$ declare tok text;begin
 select payload->>'token' into tok from public.dydd_circle_held_outbox where recipient='circle-ops-newleader@example.invalid';
 perform public.dydd_circle_operate('98000000-0000-4000-8000-000000000004',jsonb_build_object('action','accept_invite','token',tok));
end $$;
-- Cancellation state uses commerce's paid-through, not client flags.
update public.dydd_test_billing_entitlements set active=false,paid_through=now()-interval '1 day',expires_at=now()-interval '1 day' where user_id='98000000-0000-4000-8000-000000000001' and capability='circle_leadership';
do $$ declare failed boolean:=false;begin
 if public.dydd_circle_lifecycle('98000000-0000-4000-8000-000000000001','98200000-0000-4000-8000-000000000001','Small group')<>'transition' then raise exception 'TEST: transition not active';end if;
 begin perform public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"invite","circleId":"98200000-0000-4000-8000-000000000001","name":"Blocked","email":"blocked@example.invalid"}');exception when raise_exception then failed:=true;end;
 if not failed then raise exception 'TEST: transition enrollment allowed';end if;
end $$;
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"transfer","_actorEmail":"circle-ops-leader@example.invalid","circleId":"98200000-0000-4000-8000-000000000001","toUserId":"98000000-0000-4000-8000-000000000004"}');
do $$ begin
 if not exists(select 1 from public.journey_circle_plans where id='98200000-0000-4000-8000-000000000001' and user_id='98000000-0000-4000-8000-000000000004') or not exists(select 1 from public.dydd_circle_memberships where circle_id='98200000-0000-4000-8000-000000000001' and user_id='98000000-0000-4000-8000-000000000001' and status='accepted') then raise exception 'TEST: leader transfer lost ownership or old participant';end if;
end $$;
update public.dydd_test_billing_entitlements set paid_through=now()-interval '31 days' where user_id='98000000-0000-4000-8000-000000000001' and capability='circle_leadership';
do $$ declare failed boolean:=false;begin
 begin update public.journey_circle_plans set plan=plan||'{"name":"Should fail"}' where id='98200000-0000-4000-8000-000000000002';exception when raise_exception then failed:=true;end;
 if not failed then raise exception 'TEST: readonly plan mutable';end if;
end $$;
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000002','{"action":"withdraw_callout","circleId":"98200000-0000-4000-8000-000000000001","session":"1","lesson":"a","prompt":"p"}');
do $$ begin if exists(select 1 from public.dydd_circle_callouts where circle_id='98200000-0000-4000-8000-000000000001') then raise exception 'TEST: withdrawal not honored readonly';end if;
if has_function_privilege('anon','public.dydd_circle_operate(uuid,jsonb,boolean)','execute') or has_function_privilege('authenticated','public.dydd_circle_operate(uuid,jsonb,boolean)','execute') then raise exception 'TEST: RPC publicly accessible';end if;end $$;
-- Read-only sharing cannot be expanded; existing sharing can be selectively withdrawn via upsert.
update public.dydd_test_billing_entitlements set paid_through=now()+interval '1 day' where user_id='98000000-0000-4000-8000-000000000001' and capability='circle_leadership';
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"consent","circleId":"98200000-0000-4000-8000-000000000002","people":true,"insights":true}');
update public.dydd_test_billing_entitlements set paid_through=now()-interval '31 days' where user_id='98000000-0000-4000-8000-000000000001' and capability='circle_leadership';
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"consent","circleId":"98200000-0000-4000-8000-000000000002","people":false,"insights":true}');
do $$ declare failed boolean:=false;begin
 begin perform public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"consent","circleId":"98200000-0000-4000-8000-000000000002","people":true,"insights":true}');exception when raise_exception then failed:=true;end;
 if not failed then raise exception 'TEST: readonly sharing grant allowed';end if;
 if not exists(select 1 from public.dydd_circle_consents where circle_id='98200000-0000-4000-8000-000000000002' and not people and insights) then raise exception 'TEST: selective withdrawal lost existing consent';end if;
end $$;
select public.dydd_circle_operate('98000000-0000-4000-8000-000000000001','{"action":"consent","circleId":"98200000-0000-4000-8000-000000000002","people":false,"insights":false}');
rollback;
`);
console.log('PASS sandbox transaction rollback: migration SQL, verified personal/email acceptance, persisted role, callout dedup/withdrawal, cohort dedup/approval/cap/counts-only, pending seat capacity, creation/invite budgets, paid-only acceptance, subscribed leader transfer, cancellation transition/readonly, service-only RPC');
const cleanup=await sql("select count(*)::integer n from auth.users where id::text like '98000000-%'");if(cleanup[0].n!==0)throw Error('Fixture rollback failed');
console.log('PASS no persistent synthetic users or deliveries');
