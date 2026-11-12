-- Isolated fixtures only. Apply AFTER guest + account linking migrations. Rolls back.
\set ON_ERROR_STOP on
begin;
create function pg_temp.must_reject(q text) returns void language plpgsql as $$
begin
 begin execute q; exception when others then return; end;
 raise exception 'Expected rejection: %',q;
end $$;
insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
 ('11111111-1111-4111-8111-111111111111','verified@example.test',now(),false),
 ('22222222-2222-4222-8222-222222222222','other@example.test',now(),false),
 ('33333333-3333-4333-8333-333333333333','unverified@example.test',null,false),
 ('44444444-4444-4444-8444-444444444444','anonymous@example.test',now(),true);
set local role service_role;
do $$
declare s uuid; expired uuid; first_link uuid; before_audit integer;
begin
 insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email)
 values(repeat('a',64),'Original Guest','DIFFERENT-CONTACT@example.test') returning id into s;
 insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email,expires_at)
 values(repeat('e',64),'Expired','verified@example.test',now()-interval '1 second') returning id into expired;
 perform pg_temp.must_reject(format('select public.dydd_guest_link_verified_account(%L,%L,%L)',s,'11111111-1111-4111-8111-111111111111',repeat('b',64)));
 perform pg_temp.must_reject(format('select public.dydd_guest_link_verified_account(%L,%L,%L)',s,'33333333-3333-4333-8333-333333333333',repeat('a',64)));
 perform pg_temp.must_reject(format('select public.dydd_guest_link_verified_account(%L,%L,%L)',s,'44444444-4444-4444-8444-444444444444',repeat('a',64)));
 perform pg_temp.must_reject(format('select public.dydd_guest_link_verified_account(%L,%L,%L)',s,'55555555-5555-4555-8555-555555555555',repeat('a',64)));
 perform pg_temp.must_reject(format('select public.dydd_guest_link_verified_account(%L,%L,%L)',expired,'11111111-1111-4111-8111-111111111111',repeat('e',64)));
 assert (select count(*)=0 from public.dydd_guest_account_links),'denied claims must not create links';
 assert (select count(*)=0 from public.dydd_guest_account_link_audit),'denied claims must not create success audit';
 first_link:=public.dydd_guest_link_verified_account(s,'11111111-1111-4111-8111-111111111111',repeat('a',64));
 assert first_link=s,'verified Auth + capability, even with different contact email';
 assert public.dydd_guest_link_verified_account(s,'11111111-1111-4111-8111-111111111111',repeat('a',64))=s,'idempotent retry';
 assert (select count(*)=1 from public.dydd_guest_account_links),'one immutable binding';
 assert (select count(*)=1 from public.dydd_guest_account_link_audit),'one durable audit for idempotent link';
 assert (select guest_contact_email='DIFFERENT-CONTACT@example.test' and verified_account_email='verified@example.test' from public.dydd_guest_account_link_audit),'contact and verified identity both retained';
 perform pg_temp.must_reject(format('select public.dydd_guest_link_verified_account(%L,%L,%L)',s,'22222222-2222-4222-8222-222222222222',repeat('a',64)));
 perform pg_temp.must_reject(format('update public.dydd_guest_account_links set user_id=%L where session_id=%L','22222222-2222-4222-8222-222222222222',s));
 perform pg_temp.must_reject('delete from public.dydd_guest_account_links');
 perform pg_temp.must_reject('delete from public.dydd_guest_account_link_audit');
 perform pg_temp.must_reject(format('insert into public.dydd_guest_account_links(session_id,user_id) values(%L,%L)',expired,'11111111-1111-4111-8111-111111111111'));
 update public.dydd_guest_sessions set expires_at=now()-interval '1 second' where id=s;
 assert (select user_id='11111111-1111-4111-8111-111111111111' from public.dydd_guest_account_links where session_id=s),'cookie expiry does not erase authenticated ownership';
end $$;
reset role;
-- Triggers also stop privileged accidental edits, not merely ordinary ACLs.
select pg_temp.must_reject('update public.dydd_guest_account_links set user_id=''22222222-2222-4222-8222-222222222222''');
select pg_temp.must_reject('delete from public.dydd_guest_account_link_audit');
set local role anon;
select pg_temp.must_reject('select * from public.dydd_guest_account_links');
select pg_temp.must_reject('select public.dydd_guest_link_verified_account(null,null,null)');
reset role;
set local role authenticated;
select pg_temp.must_reject('select * from public.dydd_guest_account_links');
select pg_temp.must_reject('select public.dydd_guest_link_verified_account(null,null,null)');
reset role;
rollback;
