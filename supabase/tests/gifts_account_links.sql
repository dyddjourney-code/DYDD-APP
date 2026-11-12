-- Hosted-compatible, transactionally rolled-back fixtures. Apply migration first.
-- Run only on an approved test database. No mail, PDF, payments or provider calls.
\set ON_ERROR_STOP on
begin;
create function pg_temp.gifts_must_reject(q text) returns void language plpgsql as $$
begin
 begin execute q; exception when others then return; end;
 raise exception 'Expected rejection: %',q;
end $$;
do $$
declare
 u uuid:=gen_random_uuid(); other_u uuid:=gen_random_uuid(); unverified uuid:=gen_random_uuid(); anonymous_u uuid:=gen_random_uuid();
 p uuid:=gen_random_uuid(); snap uuid:=gen_random_uuid(); native_snap uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); pending uuid:=gen_random_uuid(); native_s uuid:=gen_random_uuid();
 response_id uuid:=gen_random_uuid(); base_links bigint; base_audit bigint;
begin
 select count(*) into base_links from public.dydd_gifts_account_links;
 select count(*) into base_audit from public.dydd_gifts_account_link_audit;
 insert into auth.users(id,email,email_confirmed_at,is_anonymous) values
 (u,u||'@example.test',now(),false),(other_u,other_u||'@example.test',now(),false),
 (unverified,unverified||'@example.test',null,false),(anonymous_u,anonymous_u||'@example.test',now(),true);
 -- Deliberately attach participant to OTHER account: public snapshot must not inherit it.
 insert into public.assessment_participants(id,user_id,normalized_email,display_name) values(p,other_u,'typed-'||p||'@example.test','Original contact');
 insert into public.assessment_snapshots(id,user_id,participant_id,assessment_type,source,scores)
 values(snap,null,p,'spiritual_gifts','spiritual_gifts_app','{"channel":"native_app"}'),
 (native_snap,null,p,'design_id','native_app','{}');
 insert into public.spiritual_gifts_sessions(id,participant_id,participant_email,intake_token_hash,result_snapshot_id,metadata,session_status,submitted_at)
 values(s,p,'typed-'||p||'@example.test',repeat('a',64),snap,'{"channel":"public_assessment"}','completed',now()),
 (pending,p,'typed-'||p||'@example.test',repeat('e',64),null,'{"channel":"public_assessment"}','active',null),
 (native_s,p,'typed-'||p||'@example.test',repeat('d',64),null,'{"channel":"native_app"}','completed',now());
 insert into public.spiritual_gifts_responses(id,session_id,response_type,participant_email,answers) values(response_id,s,'self','typed-'||p||'@example.test','{}');
 perform set_config('role','service_role',true);
 perform pg_temp.gifts_must_reject(format('select public.dydd_gifts_link_verified_account(%L,%L,%L)',s,u,repeat('b',64)));
 perform pg_temp.gifts_must_reject(format('select public.dydd_gifts_link_verified_account(%L,%L,null)',s,u));
 perform pg_temp.gifts_must_reject(format('select public.dydd_gifts_link_verified_account(%L,%L,%L)',s,unverified,repeat('a',64)));
 perform pg_temp.gifts_must_reject(format('select public.dydd_gifts_link_verified_account(%L,%L,%L)',s,anonymous_u,repeat('a',64)));
 perform pg_temp.gifts_must_reject(format('select public.dydd_gifts_link_verified_account(%L,%L,%L)',s,gen_random_uuid(),repeat('a',64)));
 perform pg_temp.gifts_must_reject(format('select public.dydd_gifts_link_verified_account(%L,%L,%L)',pending,u,repeat('e',64)));
 perform pg_temp.gifts_must_reject(format('select public.dydd_gifts_link_verified_account(%L,%L,%L)',native_s,u,repeat('d',64)));
 perform pg_temp.gifts_must_reject(format('insert into public.dydd_gifts_account_links(session_id,snapshot_id,user_id) values(%L,%L,%L)',s,snap,u));
 perform set_config('role','none',true);
 update auth.users set banned_until=now()+interval '1 hour' where id=u;
 perform set_config('role','service_role',true);
 perform pg_temp.gifts_must_reject(format('select public.dydd_gifts_link_verified_account(%L,%L,%L)',s,u,repeat('a',64)));
 perform set_config('role','none',true);
 update auth.users set banned_until=null where id=u;
 update public.assessment_snapshots set user_id=other_u where id=snap;
 perform set_config('role','service_role',true);
 perform pg_temp.gifts_must_reject(format('select public.dydd_gifts_link_verified_account(%L,%L,%L)',s,u,repeat('a',64)));
 perform set_config('role','none',true);
 update public.assessment_snapshots set user_id=null where id=snap;
 perform set_config('role','service_role',true);
 assert (select count(*)=base_links from public.dydd_gifts_account_links),'denied claims cannot link';
 assert (select count(*)=base_audit from public.dydd_gifts_account_link_audit),'denied claims cannot audit success';
 perform set_config('role','none',true);
 perform set_config('request.jwt.claim.sub',other_u::text,true);
 perform set_config('role','authenticated',true);
 assert not exists(select 1 from public.assessment_snapshots where id=snap),'legacy participant ownership cannot expose public Gifts';
 assert exists(select 1 from public.assessment_snapshots where id=native_snap),'native legacy participant access remains';
 assert not exists(select 1 from public.spiritual_gifts_sessions where id=s),'public session cannot inherit participant ownership';
 assert not exists(select 1 from public.spiritual_gifts_responses where id=response_id),'public responses cannot inherit participant ownership';
 perform pg_temp.gifts_must_reject('select public.dydd_gifts_link_verified_account(null,null,null)');
 perform pg_temp.gifts_must_reject('select * from public.dydd_gifts_account_links');
 perform set_config('role','service_role',true);
 assert public.dydd_gifts_link_verified_account(s,u,repeat('a',64))=s,'verified Auth plus exact token works despite different contact';
 assert public.dydd_gifts_link_verified_account(s,u,repeat('a',64))=s,'same-account claim is idempotent';
 assert (select count(*)=base_links+1 from public.dydd_gifts_account_links),'one binding';
 assert (select count(*)=base_audit+1 from public.dydd_gifts_account_link_audit),'one atomic audit';
 assert (select contact_email='typed-'||p||'@example.test' and verified_account_email=u||'@example.test' from public.dydd_gifts_account_link_audit where session_id=s),'contact and verified identity retained';
 perform pg_temp.gifts_must_reject(format('select public.dydd_gifts_link_verified_account(%L,%L,%L)',s,other_u,repeat('a',64)));
 perform pg_temp.gifts_must_reject(format('update public.dydd_gifts_account_links set user_id=%L where session_id=%L',other_u,s));
 perform pg_temp.gifts_must_reject(format('delete from public.dydd_gifts_account_link_audit where session_id=%L',s));
 perform set_config('role','none',true);
 assert (select user_id is null from public.assessment_snapshots where id=snap),'snapshot never rewritten';
 assert (select created_by_user_id is null and participant_email='typed-'||p||'@example.test' from public.spiritual_gifts_sessions where id=s),'session provenance never rewritten';
 assert (select user_id=other_u from public.assessment_participants where id=p),'contact participant never reassigned';
 perform pg_temp.gifts_must_reject(format('delete from public.dydd_gifts_account_links where session_id=%L',s));
 perform pg_temp.gifts_must_reject(format('update public.dydd_gifts_account_link_audit set contact_email=''changed'' where session_id=%L',s));
 perform set_config('role','anon',true);
 perform pg_temp.gifts_must_reject('select public.dydd_gifts_link_verified_account(null,null,null)');
 perform pg_temp.gifts_must_reject('select * from public.dydd_gifts_account_links');
 perform set_config('role','none',true);
end $$;
rollback;
